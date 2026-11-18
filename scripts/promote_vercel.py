"""Promote a tested build using project-scoped API calls, without a user lookup."""

import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request


def hostname(url):
    parsed = urllib.parse.urlsplit(url)
    if (parsed.scheme != "https" or not parsed.hostname or parsed.username
            or parsed.password or parsed.port or parsed.query or parsed.fragment
            or parsed.path not in ("", "/")):
        raise ValueError("Expected an HTTPS deployment or site origin")
    return parsed.hostname


class Vercel:
    def __init__(self, token, team):
        if not token:
            raise ValueError("VERCEL_TOKEN is required")
        self.token = token
        self.team = team

    def request(self, path, method="GET"):
        url = "https://api.vercel.com" + path + "?" + urllib.parse.urlencode({"teamId": self.team})
        request = urllib.request.Request(url, data=b"{}" if method == "POST" else None,
                                        method=method, headers={
                                            "Authorization": f"Bearer {self.token}",
                                            "Content-Type": "application/json",
                                        })
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                body = response.read()
                return json.loads(body) if body else {}
        except urllib.error.HTTPError as error:
            # Do not print response bodies or request headers containing credentials.
            raise RuntimeError(f"Vercel {method} {path}: HTTP {error.code}") from None


def promote(api, project_id, team_id, deployment_url, site_url, *, timeout=180,
            sleep=time.sleep, clock=time.monotonic):
    if not re.fullmatch(r"prj_[A-Za-z0-9]+", project_id) or not re.fullmatch(r"team_[A-Za-z0-9]+", team_id):
        raise ValueError("Explicit Vercel project and team IDs are required")
    deployment_host, site_host = hostname(deployment_url), hostname(site_url)
    if not deployment_host.endswith(".vercel.app"):
        raise ValueError("Expected an immutable Vercel deployment URL")
    project_path = f"/v9/projects/{project_id}"
    project = api.request(project_path)
    if project.get("id") != project_id or project.get("accountId") != team_id:
        raise ValueError("Vercel project/team mismatch")
    if project.get("rollingRelease"):
        raise ValueError("Rolling releases must be disabled for this publication workflow")
    deployment = api.request(f"/v13/deployments/{deployment_host}")
    if (deployment.get("projectId") != project_id or deployment.get("ownerId") != team_id
            or deployment.get("url") != deployment_host or deployment.get("readyState") != "READY"
            or deployment.get("target") != "production"):
        raise ValueError("Refusing to promote a mismatched, unready, or preview deployment")
    deployment_id = deployment["id"]
    if not re.fullmatch(r"dpl_[A-Za-z0-9]+", deployment_id):
        raise ValueError("Invalid deployment ID")

    # Same endpoint as `vercel promote`, without its account-profile discovery.
    # Both docs channels have separate projects built with the production target.
    api.request(f"/v10/projects/{project_id}/promote/{deployment_id}", "POST")
    deadline = clock() + timeout
    while clock() < deadline:
        current = api.request(project_path)
        request = current.get("lastAliasRequest") or {}
        if request.get("toDeploymentId") == deployment_id and request.get("jobStatus") == "failed":
            raise RuntimeError("Vercel reported a failed hostname promotion")
        target = (current.get("targets") or {}).get("production") or {}
        if target.get("id") == deployment_id:
            alias = api.request(f"/v4/aliases/{site_host}")
            if (alias.get("deploymentId") == deployment_id and alias.get("projectId") == project_id
                    and alias.get("alias") == site_host):
                print(f"Verified {site_host} serves {deployment_id} in {project_id}")
                return
        sleep(3)
    raise TimeoutError("Vercel did not finish assigning the tested deployment to the site hostname")


if __name__ == "__main__":
    team = os.environ["VERCEL_ORG_ID"]
    promote(Vercel(os.environ["VERCEL_TOKEN"], team), os.environ["VERCEL_PROJECT_ID"], team,
            os.environ["DEPLOYMENT_URL"], os.environ["DOCS_SITE_URL"])
