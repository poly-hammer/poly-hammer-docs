"""Fetch, archive and materialize immutable documentation snapshots using GitHub APIs.

Only the registered docs subtrees are downloaded. This module never executes source
content, clones an add-on, or installs its dependencies. Tokens are environment inputs.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile

SHA = re.compile(r"^[0-9a-f]{40}$")
VERSION = re.compile(r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$")
ALLOWED = {".md", ".mdx", ".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".webm", ".mp4", ".svg", ".ico", ".pdf"}
MAX_FILE = 100 * 1024 * 1024
MAX_BUNDLE = 512 * 1024 * 1024


def safe_path(name: str) -> str:
    """Accept a portable, relative, non-hidden path without Windows ambiguities."""
    path = PurePosixPath(name)
    if not name or "\\" in name or ":" in name or path.is_absolute() or any(
        part in {"", ".", ".."} or part.startswith(".") or part.endswith((".", " "))
        or part.split(".")[0].upper() in {"CON", "PRN", "AUX", "NUL", *(f"COM{i}" for i in range(1, 10)), *(f"LPT{i}" for i in range(1, 10))}
        for part in name.split("/")
    ):
        raise ValueError(f"Unsafe documentation path: {name}")
    return name


def approved_file(name: str) -> bool:
    """Select documents, media and non-executable navigation metadata."""
    return PurePosixPath(name).suffix.lower() in ALLOWED or PurePosixPath(name).name in {"meta.json", "docs-manifest.json"}


def content_digest(files: dict[str, bytes]) -> str:
    """Hash names and contents with unambiguous length framing."""
    digest = hashlib.sha256()
    for name, content in sorted(files.items()):
        encoded = name.encode("utf-8")
        digest.update(len(encoded).to_bytes(8, "big") + encoded)
        digest.update(len(content).to_bytes(8, "big") + content)
    return digest.hexdigest()


def bundle(files: dict[str, bytes]) -> bytes:
    """Create a deterministic, self-contained archive with no timestamps from the host."""
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name, content in sorted(files.items()):
            info = zipfile.ZipInfo(safe_path(name), date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, content)
    return stream.getvalue()


def unpack(data: bytes, expected: str) -> dict[str, bytes]:
    """Verify bounded archive content before writing any file."""
    files: dict[str, bytes] = {}
    names: set[str] = set()
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        if sum(info.file_size for info in archive.infolist()) > MAX_BUNDLE:
            raise ValueError("Documentation archive is too large")
        for info in archive.infolist():
            name = safe_path(info.filename)
            if info.is_dir() or info.file_size > MAX_FILE or ((info.external_attr >> 16) & 0o170000) == 0o120000:
                raise ValueError("Unsupported archive entry")
            if name.casefold() in names or not approved_file(name):
                raise ValueError(f"Duplicate or unapproved archive entry: {name}")
            names.add(name.casefold())
            files[name] = archive.read(info)
    if content_digest(files) != expected:
        raise ValueError("Archive digest does not match the release catalog")
    return files


class SafeRedirect(urllib.request.HTTPRedirectHandler):
    """GitHub asset downloads redirect; never forward credentials off origin."""

    def redirect_request(self, request, fp, code, msg, headers, newurl):
        if urllib.parse.urlparse(newurl).scheme != "https":
            raise ValueError("Refusing an insecure API redirect")
        redirected = super().redirect_request(request, fp, code, msg, headers, newurl)
        if redirected and urllib.parse.urlparse(request.full_url).netloc != urllib.parse.urlparse(newurl).netloc:
            redirected.remove_header("Authorization")
        return redirected


class APIError(RuntimeError):
    def __init__(self, status, message):
        self.status = status
        super().__init__(message)


class GitHub:
    """Bounded GitHub API client; authentication is never embedded in source URLs."""

    def __init__(self, token: str, base: str = "https://api.github.com"):
        self.token = token
        self.base = base
        self.opener = urllib.request.build_opener(SafeRedirect())

    def request(self, endpoint: str, method: str = "GET", data=None, raw: bool = False):
        url = self.base + endpoint if endpoint.startswith("/") else endpoint
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme != "https" or parsed.hostname not in {"api.github.com", "uploads.github.com"}:
            raise ValueError("Unsupported GitHub API origin")
        payload = data if isinstance(data, bytes) else json.dumps(data).encode() if data is not None else None
        headers = {"Accept": "application/octet-stream" if raw else "application/vnd.github+json", "User-Agent": "polyhammer-docs-sync", "X-GitHub-Api-Version": "2022-11-28"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        if payload is not None:
            headers["Content-Type"] = "application/zip" if isinstance(data, bytes) else "application/json"
        for attempt in range(5):
            try:
                request = urllib.request.Request(url, data=payload, headers=headers, method=method)
                with self.opener.open(request, timeout=90) as response:
                    value = response.read(MAX_BUNDLE + 1)
                    if len(value) > MAX_BUNDLE:
                        raise ValueError("API response exceeded the documentation size limit")
                    return value if raw else json.loads(value) if value else None
            except urllib.error.HTTPError as error:
                retryable = error.code in {429, 500, 502, 503, 504} or (error.code == 403 and error.headers.get("X-RateLimit-Remaining") == "0")
                if attempt == 4 or not retryable:
                    raise APIError(error.code, f"GitHub API {method} {parsed.path}: HTTP {error.code}") from None
                time.sleep(min(30, int(error.headers.get("Retry-After", 2 ** attempt))))

    def pages(self, endpoint: str):
        """Read all records rather than assuming the first API page is complete."""
        for page in range(1, 1001):
            separator = "&" if "?" in endpoint else "?"
            values = self.request(f"{endpoint}{separator}per_page=100&page={page}")
            yield from values
            if len(values) < 100:
                return
        raise ValueError("API pagination exceeded the supported limit")


def resolve_commit(api: GitHub, repository: str, ref: str) -> str:
    """Resolve annotated tags or branches through GitHub's commit API."""
    value = api.request(f"/repos/{repository}/commits/{urllib.parse.quote(ref, safe='')}")["sha"]
    if not SHA.fullmatch(value):
        raise ValueError("GitHub did not return a full commit SHA")
    return value


def fetch_docs(api: GitHub, source: dict, commit: str) -> dict[str, bytes]:
    """Traverse only registered directory trees; fetch only approved file blobs."""
    if not SHA.fullmatch(commit):
        raise ValueError("A full immutable commit SHA is required")
    repository = source["repository"]
    commit_data = api.request(f"/repos/{repository}/git/commits/{commit}")
    tree_sha = commit_data["tree"]["sha"]
    for part in safe_path(source["directory"]).split("/"):
        tree = api.request(f"/repos/{repository}/git/trees/{tree_sha}")
        if tree.get("truncated"):
            raise ValueError("Non-recursive source tree was truncated")
        entry = next((item for item in tree["tree"] if item["path"] == part and item["type"] == "tree"), None)
        if entry is None:
            raise ValueError(f"Missing documentation directory: {source['id']}")
        tree_sha = entry["sha"]
    files: dict[str, bytes] = {}
    seen: set[str] = set()
    pending = [(tree_sha, "")]
    total = 0
    while pending:
        current_sha, prefix = pending.pop()
        tree = api.request(f"/repos/{repository}/git/trees/{current_sha}")
        if tree.get("truncated"):
            raise ValueError("Documentation tree response was truncated")
        for item in tree["tree"]:
            name = prefix + item["path"]
            if item["path"].startswith(".") or (item["type"] == "tree" and item["path"].casefold() == "plans"):
                continue
            safe_path(name)
            if item["mode"] in {"120000", "160000"}:
                raise ValueError(f"Links and submodules are not documentation: {name}")
            if item["type"] == "tree":
                pending.append((item["sha"], name + "/"))
                continue
            if not approved_file(name):
                raise ValueError(f"Unapproved file in documentation directory: {name}")
            if name.casefold() in seen or item.get("size", 0) > MAX_FILE:
                raise ValueError(f"Duplicate or oversized documentation file: {name}")
            seen.add(name.casefold())
            blob = api.request(f"/repos/{repository}/git/blobs/{item['sha']}")
            if blob.get("encoding") != "base64":
                raise ValueError("Unsupported GitHub blob encoding")
            data = base64.b64decode("".join(blob["content"].split()), validate=True)
            if len(data) > MAX_FILE:
                raise ValueError("Documentation blob exceeds size limit")
            actual_sha = hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()
            if actual_sha != item["sha"] or data.startswith(b"version https://git-lfs.github.com/spec/v1"):
                raise ValueError(f"Invalid blob or unresolved LFS asset: {name}")
            total += len(data)
            if total > MAX_BUNDLE:
                raise ValueError("Documentation snapshot exceeds size limit")
            files[name] = data
    if not any(name.endswith((".md", ".mdx")) for name in files):
        raise ValueError("Documentation snapshot has no pages")
    return files


def write_snapshot(files: dict[str, bytes], destination: Path) -> None:
    """Write only new, validated snapshot files beneath the designated build root."""
    if destination.is_symlink():
        raise ValueError("Snapshot destination is a symlink")
    destination.mkdir(parents=True, exist_ok=True)
    base = destination.resolve()
    for name, content in files.items():
        output = destination / safe_path(name)
        if not output.resolve().is_relative_to(base):
            raise ValueError("Snapshot output escaped its destination")
        output.parent.mkdir(parents=True, exist_ok=True)
        if output.exists() and output.read_bytes() != content:
            raise ValueError(f"Existing snapshot differs: {name}")
        output.write_bytes(content)


def archive_snapshot(api: GitHub, archive_repo: str, source: dict, version: str, files: dict[str, bytes]) -> tuple[str, str]:
    """Store bundles under content-addressed assets in a dedicated archive release."""
    digest = content_digest(files)
    tag = f"docs-{source['id']}-{version}"
    releases = [release for release in api.pages(f"/repos/{archive_repo}/releases") if release["tag_name"] == tag]
    release = releases[0] if releases else api.request(f"/repos/{archive_repo}/releases", "POST", {"tag_name": tag, "name": tag, "body": "Immutable documentation snapshots. Asset filenames are SHA-256 content identities.", "make_latest": "false"})
    name = digest + ".zip"
    assets = list(api.pages(f"/repos/{archive_repo}/releases/{release['id']}/assets"))
    existing = next((asset for asset in assets if asset["name"] == name), None)
    if existing:
        unpack(api.request(existing["url"], raw=True), digest)
        asset = existing
    else:
        upload = release["upload_url"].split("{")[0] + "?name=" + name
        asset = api.request(upload, "POST", bundle(files))
    return f"{archive_repo}:{asset['id']}", digest


def read_archive(api: GitHub, archive_repo: str, reference: str, digest: str) -> dict[str, bytes]:
    """Load only assets from the configured archive repository."""
    repository, asset = reference.rsplit(":", 1)
    if repository != archive_repo or not asset.isdigit():
        raise ValueError("Archive location is not approved")
    return unpack(api.request(f"/repos/{repository}/releases/assets/{asset}", raw=True), digest)


def stable_version(source: dict, release: dict) -> str | None:
    """Exclude prereleases and enforce per-product tag ownership."""
    if release.get("draft") or release.get("prerelease"):
        return None
    tag = release["tag_name"]
    prefix = source.get("tagPrefix", "")
    if not tag.startswith(prefix):
        return None
    version = tag[len(prefix):].removeprefix("v")
    return version if VERSION.fullmatch(version) else None


def add_release(catalog: dict, product: str, version: str, record: dict) -> bool:
    """Append one immutable version without changing other products or site code."""
    if not VERSION.fullmatch(version) or not record.get("releaseId"):
        raise ValueError("Stable release provenance is required")
    entry = catalog["products"].setdefault(product, {"latest": None, "versions": {}})
    previous = entry["versions"].get(version)
    if previous:
        if any(previous.get(key) != record.get(key) for key in ("commit", "digest", "releaseId", "tag", "releaseCommit", "bootstrap")):
            raise ValueError("Published version identity changed")
        return False
    entry["versions"][version] = record
    if entry["latest"] is None or tuple(map(int, version.split("."))) > tuple(map(int, entry["latest"].split("."))):
        entry["latest"] = version
    catalog["generation"] += 1
    return True


def materialize(api: GitHub, archive_repo: str, catalog: dict, output: Path) -> None:
    """Materialize all selected versions from verified archives for the unprivileged build."""
    if catalog["channel"] == "production" and any(product.get("next") for product in catalog["products"].values()):
        raise ValueError("Production catalog contains unreleased content")
    for product, entry in catalog["products"].items():
        safe_path(product)
        records = {**entry["versions"], **({"next": entry["next"]} if entry.get("next") else {})}
        for version, record in records.items():
            if version != "next" and not VERSION.fullmatch(version):
                raise ValueError("Invalid catalog version")
            files = read_archive(api, archive_repo, record["archive"], record["digest"])
            write_snapshot(files, output / "snapshots" / product / version)
    output.mkdir(parents=True, exist_ok=True)
    (output / "catalog.json").write_text(json.dumps(catalog, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=Path(".docs-build"))
    parser.add_argument("--archive-repo", default=os.environ.get("DOCS_ARCHIVE_REPO"))
    args = parser.parse_args()
    if not args.archive_repo:
        parser.error("DOCS_ARCHIVE_REPO or --archive-repo is required")
    materialize(GitHub(os.environ.get("DOCS_READER_TOKEN", "")), args.archive_repo, json.loads(args.catalog.read_text(encoding="utf-8")), args.output)


if __name__ == "__main__":
    main()
