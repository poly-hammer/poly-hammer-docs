"""Resolve and pin non-secret deployment visibility configuration."""
import json
from pathlib import Path
import re

ROUTE = re.compile(r"[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:/[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)*")


def hidden_paths(channel, override=None):
    defaults = json.loads((Path(__file__).resolve().parents[1] / "docs-visibility.json").read_text())
    paths = json.loads(override) if override and override.strip() else defaults[channel]
    if not isinstance(paths, list) or any(not isinstance(path, str) or not ROUTE.fullmatch(path) for path in paths):
        raise ValueError("DOCS_HIDDEN_PATHS must be a JSON array of relative route prefixes, without URLs, wildcards or traversal")
    return sorted(set(paths))


def visible(path, hidden):
    return not any(path == prefix or path.startswith(prefix + "/") for prefix in hidden)


def set_visibility(catalog, hidden):
    if catalog.get("hiddenPaths") != hidden:
        catalog["hiddenPaths"] = hidden
        catalog["generation"] += 1
    return catalog
