"""Reject incomplete or crossed channel settings before publication mutates state."""

import os
import re
from urllib.parse import urlsplit


def origin(value):
    parsed = urlsplit(value)
    if (parsed.scheme != "https" or not parsed.hostname or parsed.username
            or parsed.password or parsed.port or parsed.path or parsed.query
            or parsed.fragment):
        raise ValueError("Documentation origins must be HTTPS URLs without a path or trailing slash")
    return parsed.hostname.lower()


def validate(env):
    channel = env.get("DOCS_CHANNEL")
    if channel not in {"staging", "production"}:
        raise ValueError("DOCS_CHANNEL must be staging or production")
    if env.get("GITHUB_REF") != "refs/heads/main":
        raise ValueError("Publication must run from main")
    if not re.fullmatch(r"team_[A-Za-z0-9]+", env.get("VERCEL_ORG_ID", "")):
        raise ValueError("Configure VERCEL_ORG_ID")
    project = env.get(f"VERCEL_{channel.upper()}_PROJECT_ID", "")
    url = env.get(f"DOCS_{channel.upper()}_URL", "")
    if not re.fullmatch(r"prj_[A-Za-z0-9]+", project):
        raise ValueError(f"Configure VERCEL_{channel.upper()}_PROJECT_ID")
    host = origin(url)
    if project != env.get("VERCEL_PROJECT_ID") or url != env.get("DOCS_SITE_URL"):
        raise ValueError("Resolved publication settings do not match the selected channel")
    if channel == "production":
        if env.get("DOCS_PRODUCTION_ENABLED") != "true":
            raise ValueError("Production is disabled; explicit approval is required before enabling it")
        staging_project = env.get("VERCEL_STAGING_PROJECT_ID", "")
        staging_host = origin(env.get("DOCS_STAGING_URL", ""))
        if not re.fullmatch(r"prj_[A-Za-z0-9]+", staging_project):
            raise ValueError("Configure VERCEL_STAGING_PROJECT_ID for channel isolation")
        if project == staging_project or host == staging_host:
            raise ValueError("Production and staging must use separate projects and hostnames")


if __name__ == "__main__":
    validate(os.environ)
    print(f"Verified {os.environ['DOCS_CHANNEL']} publication settings; no remote changes made")
