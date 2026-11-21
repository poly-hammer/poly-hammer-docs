"""Reconcile source repositories into durable catalogs; never execute add-on code.

The docs-state branch is a journal of desired catalogs and successful deployments.
Updates are fast-forward compare-and-swap writes. A failed build leaves the desired
catalog intact and is retried by the next dispatch or scheduled reconciliation.
"""
from __future__ import annotations

import argparse
import base64
import copy
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import urllib.parse

from docs_pipeline import APIError, GitHub, SHA, add_release, archive_snapshot, fetch_docs, materialize, resolve_commit, stable_version
from visibility import hidden_paths, set_visibility, visible


def encoded(value):
    return json.dumps(value, sort_keys=True, indent=2).encode() + b"\n"


def identity(catalog):
    return hashlib.sha256(encoded(catalog)).hexdigest()


class State:
    def __init__(self, api, repository, branch="docs-state"):
        self.api, self.repository, self.branch = api, repository, branch
        self.prefix = f"/repos/{repository}"
        try:
            self.head = api.request(f"{self.prefix}/git/ref/heads/{branch}")["object"]["sha"]
        except APIError as error:
            if error.status != 404:
                raise
            self.head = None

    def read(self, name):
        if self.head is None:
            return None
        try:
            value = self.api.request(f"{self.prefix}/contents/{name}?ref={self.head}")
        except APIError as error:
            if error.status != 404:
                raise
            return None
        return json.loads(base64.b64decode(value["content"]))

    def write(self, files, message):
        tree = [{"path": name, "mode": "100644", "type": "blob", "content": encoded(value).decode()} for name, value in files.items()]
        payload = {"tree": tree}
        if self.head:
            payload["base_tree"] = self.api.request(f"{self.prefix}/git/commits/{self.head}")["tree"]["sha"]
        tree_sha = self.api.request(f"{self.prefix}/git/trees", "POST", payload)["sha"]
        commit = self.api.request(f"{self.prefix}/git/commits", "POST", {"message": message, "tree": tree_sha, "parents": [self.head] if self.head else []})["sha"]
        if self.head:
            self.api.request(f"{self.prefix}/git/refs/heads/{self.branch}", "PATCH", {"sha": commit, "force": False})
        else:
            self.api.request(f"{self.prefix}/git/refs", "POST", {"ref": f"refs/heads/{self.branch}", "sha": commit})
        self.head = commit


def verify_site_commit(api, repository, commit):
    if not SHA.fullmatch(commit):
        raise ValueError("Site promotion requires a full commit SHA")
    main = resolve_commit(api, repository, "main")
    comparison = api.request(f"/repos/{repository}/compare/{commit}...{main}")
    if comparison["status"] not in {"identical", "ahead"}:
        raise ValueError("The site commit must already be on protected main")
    return commit


def verify_event(api, sources, event):
    """A dispatch is a hint; look up its repository and release independently."""
    payload = event.get("client_payload", {})
    if not payload:
        return
    repository = payload.get("repository")
    matching = [source for source in sources if source["repository"] == repository]
    if not matching or payload.get("schemaVersion") != 1:
        raise ValueError("Unregistered documentation source event")
    if payload.get("kind") == "release":
        release_id = payload.get("releaseId")
        if not isinstance(release_id, int) or release_id <= 0:
            raise ValueError("A release event needs a numeric release ID")
        release = api.request(f"/repos/{repository}/releases/{release_id}")
        if not any(stable_version(source, release) for source in matching):
            raise ValueError("Event does not identify a published stable product release")
    elif payload.get("kind") == "main":
        if payload.get("ref") != "refs/heads/main" or not SHA.fullmatch(payload.get("sha", "")):
            raise ValueError("Invalid source main event")
        # A delayed event may refer to an older commit. Reconcile the current main.
    else:
        raise ValueError("Unknown documentation event kind")


def snapshot(reader, archiver, archive_repo, source, commit, version, published_at, release=None):
    files = fetch_docs(reader, source, commit)
    archive, digest = archive_snapshot(archiver, archive_repo, source, version, files)
    result = {"commit": commit, "digest": digest, "archive": archive, "publishedAt": published_at, "revision": 1}
    if release:
        result.update(releaseId=release["id"], tag=release["tag_name"])
    return result


def reconcile_production(catalog, sources, exclusions, reader, archiver, archive_repo):
    release_cache = {}
    for source in sources:
        repository = source["repository"]
        if repository not in release_cache:
            release_cache[repository] = list(reader.pages(f"/repos/{repository}/releases"))
        for release in release_cache[repository]:
            version = stable_version(source, release)
            if not version:
                continue
            key = f"{source['id']}:{release['tag_name']}"
            previous = catalog["products"].get(source["id"], {}).get("versions", {}).get(version)
            if key in exclusions and not previous:
                continue
            commit = resolve_commit(reader, repository, release["tag_name"])
            if previous:
                if (previous["commit"], previous["releaseId"], previous["tag"]) != (commit, release["id"], release["tag_name"]):
                    raise ValueError(f"Published release identity changed: {key}")
                continue
            record = snapshot(reader, archiver, archive_repo, source, commit, version, release["published_at"], release)
            add_release(catalog, source["id"], version, record)
    return catalog


def reconcile_staging(previous, production, sources, reader, archiver, archive_repo, site_commit, hidden=None):
    result = copy.deepcopy(production)
    result.update(channel="staging", siteCommit=site_commit, generation=previous["generation"])
    if hidden is not None:
        result["hiddenPaths"] = hidden
    for source in sources:
        commit = resolve_commit(reader, source["repository"], source["branch"])
        old = previous["products"].get(source["id"], {}).get("next")
        record = old if old and old["commit"] == commit else snapshot(reader, archiver, archive_repo, source, commit, "next", datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"))
        result["products"].setdefault(source["id"], {"latest": None, "versions": {}})["next"] = record
    if result != previous:
        result["generation"] += 1
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["sync", "bootstrap", "finish"])
    parser.add_argument("--channel", choices=["staging", "production"], required=True)
    parser.add_argument("--site-commit", default="")
    parser.add_argument("--output", type=Path, default=Path(".docs-build"))
    args = parser.parse_args()
    repository, archive_repo = os.environ["GITHUB_REPOSITORY"], os.environ["DOCS_ARCHIVE_REPO"]
    state = State(GitHub(os.environ["DOCS_STATE_TOKEN"]), repository)
    if args.command == "finish":
        catalog = json.loads((args.output / "catalog.json").read_text())
        current = state.read(f"{args.channel}.json")
        if current != catalog:
            raise ValueError("Catalog changed since build; refusing to record a stale deployment")
        url = os.environ["DOCS_DEPLOYMENT_URL"]
        if not url.startswith("https://") or not urllib.parse.urlparse(url).hostname.endswith(".vercel.app"):
            raise ValueError("Expected the immutable Vercel deployment URL")
        state.write({f"{args.channel}-deployment.json": {"catalogDigest": identity(catalog), "generation": catalog["generation"], "siteCommit": catalog["siteCommit"], "url": url, "publishedAt": datetime.now(timezone.utc).isoformat()}}, f"Record {args.channel} deployment {catalog['generation']}")
        return
    reader, archiver = GitHub(os.environ["DOCS_READER_TOKEN"]), GitHub(os.environ["DOCS_ARCHIVE_TOKEN"])
    sources = json.loads(Path("docs-sources.json").read_text())["sources"]
    hidden = hidden_paths(args.channel, os.environ.get("DOCS_HIDDEN_PATHS") or os.environ.get(f"DOCS_{args.channel.upper()}_HIDDEN_PATHS"))
    visible_sources = [source for source in sources if visible(source["mount"], hidden)]
    exclusions = json.loads(Path("docs-release-exclusions.json").read_text())
    if any(not reason.strip() for reason in exclusions.values()):
        raise ValueError("Historical exclusions require a reviewed explanation")
    event_file = os.environ.get("GITHUB_EVENT_PATH")
    if event_file and os.environ.get("GITHUB_EVENT_NAME") == "repository_dispatch":
        event = json.loads(Path(event_file).read_text())
        verify_event(reader, sources, event)
        expected = "production" if event["client_payload"]["kind"] == "release" else "staging"
        if args.channel == "production" and expected != "production":
            raise ValueError("Event/channel mismatch")
    production = state.read("production.json")
    if production is None:
        if args.command != "bootstrap" or not args.site_commit:
            raise ValueError("Run bootstrap with a reviewed site commit to initialize docs-state")
        production = {"schemaVersion": 1, "channel": "production", "siteCommit": verify_site_commit(state.api, repository, args.site_commit), "generation": 0, "products": {}}
        staging = {**copy.deepcopy(production), "channel": "staging"}
        state.write({"production.json": production, "staging.json": staging}, "Initialize documentation catalogs")
    previous = state.read(f"{args.channel}.json")
    if args.channel == "production":
        catalog = reconcile_production(copy.deepcopy(production), visible_sources, exclusions, reader, archiver, archive_repo)
        set_visibility(catalog, hidden)
        if args.site_commit:
            commit = verify_site_commit(state.api, repository, args.site_commit)
            if commit != catalog["siteCommit"]:
                catalog["siteCommit"] = commit
                catalog["generation"] += 1
    else:
        catalog = reconcile_staging(previous, production, sources, reader, archiver, archive_repo, resolve_commit(state.api, repository, "main"), hidden)
    if catalog != previous:
        state.write({f"{args.channel}.json": catalog}, f"Reconcile {args.channel} documentation {catalog['generation']}")
    deployment = state.read(f"{args.channel}-deployment.json")
    changed = deployment is None or deployment["catalogDigest"] != identity(catalog)
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "catalog.json").write_bytes(encoded(catalog))
    if changed:
        # Keep the complete immutable journal; send only visible products to the build.
        selected = {source["id"] for source in visible_sources}
        materialize(archiver, archive_repo, {**catalog, "products": {key: value for key, value in catalog["products"].items() if key in selected}}, args.output)
    if os.environ.get("GITHUB_OUTPUT"):
        with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as output:
            output.write(f"changed={str(changed).lower()}\nsite_commit={catalog['siteCommit']}\ngeneration={catalog['generation']}\n")
    print(f"{args.channel}: generation {catalog['generation']}; deployment required: {changed}")


if __name__ == "__main__":
    main()
