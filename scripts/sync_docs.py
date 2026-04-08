#!/usr/bin/env python3
"""Sync external repo docs into the main docs site.

Reads the repo list from pyproject.toml [tool.poly-hammer-docs],
clones each repo, copies its docs/ directory, and patches the
mkdocs.yml nav section using BEGIN/END markers.

Usage:
    uv run python scripts/sync_docs.py [--token GH_PAT] [--force]
"""

import argparse
import os
import shutil
import stat
import subprocess
import sys
import tomllib
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
REPOS_DIR = ROOT / "repos"
DOCS_DIR = ROOT / "docs"
MKDOCS_YML = ROOT / "mkdocs.yml"

# Remap repo names to different folder names in the built docs.
# Key = repo name (as listed in pyproject.toml), Value = output folder name.
FOLDER_REMAP: dict[str, str] = {
    "meta-human-dna-addon": "character-dna",
}

BEGIN_MARKER = "  # BEGIN EXTERNAL DOCS"
END_MARKER = "  # END EXTERNAL DOCS"


def read_config() -> dict:
    """Read [tool.poly-hammer-docs] from pyproject.toml."""
    pyproject = ROOT / "pyproject.toml"
    with open(pyproject, "rb") as f:
        data = tomllib.load(f)
    return data.get("tool", {}).get("poly-hammer-docs", {})


def _rm_readonly(func, path, _exc_info):
    """Handle read-only files (e.g. .git pack files on Windows)."""
    os.chmod(path, stat.S_IWRITE)
    func(path)


def clone_repo(
    org: str, repo: str, token: str | None = None, force: bool = False
) -> Path:
    """Shallow-clone a repo into repos/{repo}/.

    Skips cloning if the local folder already exists, unless *force* is True.
    """
    dest = REPOS_DIR / repo
    if dest.exists() and not force:
        print(f"  Using cached clone at {dest}")
        return dest
    if dest.exists():
        shutil.rmtree(dest, onexc=_rm_readonly)

    if token:
        url = f"https://x-access-token:{token}@github.com/{org}/{repo}.git"
    else:
        url = f"https://github.com/{org}/{repo}.git"

    subprocess.run(
        ["git", "clone", "--depth", "1", "--single-branch", url, str(dest)],
        check=True,
        capture_output=True,
        text=True,
    )
    return dest


def read_repo_mkdocs(repo_dir: Path) -> dict:
    """Read a repo's mkdocs.yml and return site_name + nav."""
    mkdocs_file = repo_dir / "mkdocs.yml"
    if not mkdocs_file.exists():
        return {
            "site_name": repo_dir.name.replace("-", " ").title(),
            "nav": [],
        }

    with open(mkdocs_file) as f:
        data = yaml.safe_load(f)

    return {
        "site_name": data.get("site_name", repo_dir.name.replace("-", " ").title()),
        "nav": data.get("nav", []),
    }


def prefix_nav_paths(nav: list, prefix: str) -> list:
    """Recursively prefix all file path values in a nav tree."""
    result = []
    for item in nav:
        if isinstance(item, str):
            result.append(f"{prefix}/{item}")
        elif isinstance(item, dict):
            new_item = {}
            for key, value in item.items():
                if isinstance(value, str):
                    new_item[key] = f"{prefix}/{value}"
                elif isinstance(value, list):
                    new_item[key] = prefix_nav_paths(value, prefix)
                else:
                    new_item[key] = value
            result.append(new_item)
        else:
            result.append(item)
    return result


def copy_docs(repo_dir: Path, slug: str) -> None:
    """Copy a repo's docs/ directory into docs/{slug}/."""
    src = repo_dir / "docs"
    dest = DOCS_DIR / slug

    if dest.exists():
        shutil.rmtree(dest)

    if src.exists():
        shutil.copytree(src, dest)
    else:
        print(f"  Warning: {src} does not exist, skipping copy", file=sys.stderr)


def generate_nav_yaml(sections: list[dict]) -> str:
    """Generate indented YAML lines for the external nav sections."""
    lines = []
    for section in sections:
        section_yaml = yaml.dump(
            [section], default_flow_style=False, sort_keys=False, allow_unicode=True
        )
        for line in section_yaml.strip().splitlines():
            lines.append(f"  {line}")
    return "\n".join(lines)


def patch_mkdocs_nav(sections: list[dict]) -> None:
    """Patch mkdocs.yml nav between BEGIN/END EXTERNAL DOCS markers."""
    content = MKDOCS_YML.read_text(encoding="utf-8")

    begin_idx = content.find(BEGIN_MARKER)
    end_idx = content.find(END_MARKER)

    if begin_idx == -1 or end_idx == -1:
        print(
            "Error: Could not find EXTERNAL DOCS markers in mkdocs.yml",
            file=sys.stderr,
        )
        sys.exit(1)

    nav_text = generate_nav_yaml(sections)

    new_content = (
        content[:begin_idx]
        + BEGIN_MARKER
        + "\n"
        + nav_text
        + "\n"
        + content[end_idx:]
    )

    MKDOCS_YML.write_text(new_content, encoding="utf-8")


def update_docs_gitignore(slugs: list[str]) -> None:
    """Write a .gitignore inside docs/ to ignore generated directories."""
    gitignore = DOCS_DIR / ".gitignore"
    lines = [
        "# Auto-generated by scripts/sync_docs.py",
        "# Do not edit manually",
        "",
    ]
    for slug in sorted(slugs):
        lines.append(f"{slug}/")
    lines.append("")
    gitignore.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync external repo docs")
    parser.add_argument(
        "--token", help="GitHub personal access token for private repos"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-clone repos even if the local folder already exists",
    )
    args = parser.parse_args()

    config = read_config()
    org = config.get("github_org", "poly-hammer")
    repos = config.get("repos", [])

    if not repos:
        print("No repos configured in [tool.poly-hammer-docs]")
        return

    REPOS_DIR.mkdir(exist_ok=True)

    nav_sections = []
    slugs = []

    for repo in repos:
        slug = FOLDER_REMAP.get(repo, repo)
        print(f"Syncing {org}/{repo} → docs/{slug}/")

        repo_dir = clone_repo(org, repo, token=args.token, force=args.force)

        repo_config = read_repo_mkdocs(repo_dir)
        site_name = repo_config["site_name"]
        nav = repo_config["nav"]

        copy_docs(repo_dir, slug)

        if nav:
            prefixed_nav = prefix_nav_paths(nav, slug)
        else:
            prefixed_nav = [{"Overview": f"{slug}/index.md"}]

        nav_sections.append({site_name: prefixed_nav})
        slugs.append(slug)

        print(f"  site_name: {site_name}")
        print(f"  nav entries: {len(nav)}")

    patch_mkdocs_nav(nav_sections)
    print(f"\nPatched {MKDOCS_YML} with {len(nav_sections)} external section(s)")

    update_docs_gitignore(slugs)
    print(f"Updated {DOCS_DIR / '.gitignore'}")


if __name__ == "__main__":
    main()
