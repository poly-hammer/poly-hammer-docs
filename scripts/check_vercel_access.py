"""Read-only production credential check. Never creates or promotes a deployment."""

import os
import re

from promote_vercel import Vercel


def check(api, team, project_id, bypass_secret):
    if not re.fullmatch(r"team_[A-Za-z0-9]+", team) or not re.fullmatch(r"prj_[A-Za-z0-9]+", project_id):
        raise ValueError("Explicit Vercel team and production project IDs are required")
    if not bypass_secret.strip():
        raise ValueError("Configure VERCEL_AUTOMATION_BYPASS_SECRET in docs-production")
    project = api.request(f"/v9/projects/{project_id}")
    if project.get("id") != project_id or project.get("accountId") != team:
        raise ValueError("Production project/team mismatch")
    if project.get("framework") != "nextjs" or project.get("nodeVersion") != "24.x":
        raise ValueError("Expected Next.js and Node.js 24.x")
    if project.get("link"):
        raise ValueError("Disconnect automatic Git deployments from the production docs project")
    if not project.get("ssoProtection"):
        raise ValueError("Protect candidate deployment URLs before production publication")
    print("Vercel token can read the expected production project; runtime and Git settings verified.")
    print("Bypass secret is present. Its HTTP authorization will be tested only after an approved deployment.")
    print("No deployment, promotion, domain change, or catalog write was performed.")


if __name__ == "__main__":
    team_id = os.environ.get("VERCEL_ORG_ID", "")
    check(Vercel(os.environ.get("VERCEL_TOKEN", ""), team_id), team_id,
          os.environ.get("VERCEL_PRODUCTION_PROJECT_ID", ""),
          os.environ.get("VERCEL_AUTOMATION_BYPASS_SECRET", ""))
