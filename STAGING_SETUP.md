# Staging setup and credential checklist

Updated November 18, 2026 (America/Chicago). GitHub authentication uses one shared PAT instead of three Apps. Both Vercel secrets are confirmed in `docs-staging`. The Vercel CLI is authenticated and the protected staging project is configured. The docs migration PR remains open, no docs deployment is live, and production DNS is unchanged.

## Pull requests

| Repository | PR |
| --- | --- |
| poly-hammer-utils | [#3: Immutable release source identity](https://github.com/poly-hammer/poly-hammer-utils/pull/3) |
| poly-hammer-workflows | [#5: Documentation notifications and release identity](https://github.com/poly-hammer/poly-hammer-workflows/pull/5) |
| poly-hammer-docs | [#76: Fumadocs, versions, MCP, and publication pipeline](https://github.com/poly-hammer/poly-hammer-docs/pull/76) |
| character-dna-addon | [#384: Fumadocs documentation and agent guidance](https://github.com/poly-hammer/character-dna-addon/pull/384) |
| character-control-rig-addon | [#56: Fumadocs documentation and agent guidance](https://github.com/poly-hammer/character-control-rig-addon/pull/56) |
| character-assembly-addon | [#7: Fumadocs documentation and agent guidance](https://github.com/poly-hammer/character-assembly-addon/pull/7) |
| ph-motion-addon | [#10: Motion/Generate documentation and agent guidance](https://github.com/poly-hammer/ph-motion-addon/pull/10) |

Review and merge utilities, shared workflows, the docs site, then the four add-on branches. Preserve the pinned utility/workflow commits with a merge commit, or update all callers after a squash merge. The Control Rig branch incorporates the new 0.5.0 main release and retains its updated import documentation.

The docs CI matrix passed on Linux for both staging and production, including builds and HTTP/MCP smoke tests, after fixing optional dependency lock entries. DNA spelling checks now recognize Fumadocs and its legacy image filename. Check each PR's latest status before merging; the wider Blender/native CI suites run independently.

## Resources already configured

- Private [poly-hammer-docs-snapshots](https://github.com/poly-hammer/poly-hammer-docs-snapshots), initialized with a README. It does not contain source snapshots yet.
- GitHub environment `docs-staging` in the docs repository, restricted to the `main` branch.
- Docs repository variables `DOCS_ARCHIVE_REPO_NAME=poly-hammer-docs-snapshots` and `VERCEL_ORG_ID=team_2AUg4TXhG3hWfKBugsYxrB2T`.
- Vercel [polyhammer-docs-staging](https://vercel.com/poly-hammers-projects/polyhammer-docs-staging), project ID `prj_Id78qUcRHvH0zxvJY1aGfHnDdPbl`, with Next.js, Node.js 24, standard build resources, and Vercel Authentication for all deployments. No Git repository is connected, so Vercel does not automatically deploy source pushes.
- Docs repository variables `VERCEL_STAGING_PROJECT_ID=prj_Id78qUcRHvH0zxvJY1aGfHnDdPbl` and `DOCS_STAGING_URL=https://polyhammer-docs-staging.vercel.app`. The hostname is assigned and verified, but no documentation deployment serves it yet.
- `DOCS_PIPELINE_ENABLED=false` and `DOCS_PRODUCTION_ENABLED=false`. These remain off until setup and review are complete.

The docs repository still has its existing `GA_ID` and `GH_PAT` secret names. Their values were not read or changed, and the new pipeline does not use them. On November 18, secret-name checks confirmed `VERCEL_TOKEN` and `VERCEL_AUTOMATION_BYPASS_SECRET` in the `docs-staging` environment; values were not read or tested. `DOCS_GITHUB_TOKEN` remains to be configured.

## Vercel access and project

Followed [Vercel's agent setup guide](https://vercel.com/get-started.md). Installed the latest global CLI, version `65.16.0`, and completed the user-approved device login. `vercel whoami` verifies account `poly-hammer` with Owner access to `poly-hammers-projects`. The Vercel plugin is already enabled globally; no duplicate skills/plugin installation was added.

The user-wide Codex MCP entry is enabled with OAuth at `https://mcp.vercel.com` in `C:\Users\james\.codex\config.toml`. Documentation search and authenticated team listing both pass. MCP still rejects project creation with HTTP 403 and cannot see the newly created staging project, despite the CLI's Owner access. Treat this as an unresolved MCP access limitation; use the authenticated CLI for staging operations. No unrelated MCP configuration or approval policy was changed.

The project was created through the authenticated CLI and verified with these settings:

| Setting | Value |
| --- | --- |
| Name | `polyhammer-docs-staging` |
| Framework | Next.js |
| Node.js | 24.x |
| Root directory | Repository root |
| Install / build commands | `npm ci` / `npm run build` |
| Source code visibility | Private |
| Automatic Git deployments | Disabled; the catalog-driven GitHub workflow deploys prebuilt output |
| Deployment protection | Vercel Authentication for **all deployments**, including this project's production target |
| Project environment variables | No GitHub PAT; the workflow embeds the staging channel and origin in the build |

The project uses Vercel's production target as a persistent **staging** environment. The future production website uses a different project. Do not connect `docs.polyhammer.com` to this staging project.

The project ID and assigned origin above are already saved in GitHub. The isolated `docs-site` worktree is linked to this staging project in its ignored `.vercel/project.json`. Vercel link also generated a local OIDC environment file; that unused file was removed without reading or exposing its value. The CLI login is separate from the deployment token needed by GitHub Actions.

## One GitHub token for collection, archives, and notifications

The setup requires **one token**, stored under **`DOCS_GITHUB_TOKEN`**. Both fine-grained and classic personal access tokens work with the same workflows. No GitHub App IDs, keys, or installations are needed.

### Recommended: fine-grained token

Open [New fine-grained personal access token](https://github.com/settings/personal-access-tokens/new). Set a descriptive name such as `Polyhammer Docs CI`, choose an expiration, select resource owner **poly-hammer**, and choose **Only select repositories**:

| Repository | What the pipeline does |
| --- | --- |
| `character-dna-addon` | Read its docs folder and release metadata |
| `character-control-rig-addon` | Read its docs folder and release metadata |
| `character-assembly-addon` | Read its docs folder and release metadata |
| `ph-motion-addon` | Read Motion/Generate docs and release metadata |
| `poly-hammer-docs-snapshots` | Read/write immutable documentation release assets |
| `poly-hammer-docs` | Send main/release notifications |

Under repository permissions, set **Contents: Read and write**. Metadata read access is automatic; other permissions can remain unset. Contents write is required by archive writes and repository dispatch. With one token GitHub applies that permission to all six selected repositories, so the token also has source-repository write capability even though the collector only reads docs. Complete organization approval if the token shows as pending. The issuing account must have access to all six repositories.

### Alternative: classic token

Open [New classic personal access token](https://github.com/settings/tokens/new), set a name and expiration, and select **`repo`**. Authorize the token for the organization through **Configure SSO** if required. Organization policy must allow classic tokens. Classic tokens cannot be restricted to six selected repositories, so their access is broader than the recommended fine-grained option. No `workflow` or `admin:org` scope is needed for this docs pipeline; keep the archive repository free of workflow files. Existing add-on package-release credentials are separate.

### Store the token once

Open [Poly Hammer organization Actions secrets](https://github.com/organizations/poly-hammer/settings/secrets/actions), create **`DOCS_GITHUB_TOKEN`**, and set selected-repository visibility to these **five consumers**: `poly-hammer-docs` and the four add-on repositories above. Paste the token directly into GitHub. Do not put this secret only inside `docs-staging`, because the collection job and source notifiers do not use that environment.

If your GitHub plan does not allow organization secrets for those private repositories, create the same repository Actions secret in each of the five consumers instead. The snapshots repository belongs in the token's access list but does not need the secret stored in it. One organization secret is easier to rotate; repository copies must all be updated before revoking the old token. Renew before expiry, and retain the issuing account's repository access.

The docs collector maps this secret to its reader and archive clients. The four add-on notifiers use it to send typed events to the docs repository. The built-in docs `GITHUB_TOKEN` still writes `docs-state`; npm/MDX build jobs and Vercel do not receive the PAT. Set each source's `DOCS_PIPELINE_ENABLED=true` only after staging bootstrap works. Motion and Generate share one source repository.

See [GitHub's PAT instructions](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) and [repository-dispatch permissions](https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event).

## Vercel credentials

These two environment secrets are already present in [docs-staging](https://github.com/poly-hammer/poly-hammer-docs/settings/environments). Their names were verified; successful deployment will verify their values.

| Environment secret | Purpose |
| --- | --- |
| `VERCEL_TOKEN` | Fetch staging project settings and upload/promote deployments |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Test protected candidate deployments before promotion |

## Activate staging

1. Review/merge the PRs in dependency order. Keep both docs enable variables false during this step.
2. Configure `DOCS_GITHUB_TOKEN` as described above. The Vercel project, project ID, origin, and two staging environment secret names are already configured. Review the pinned deployment CLI advisories described in [DEPLOYMENT_RUNBOOK.md](DEPLOYMENT_RUNBOOK.md) before activation.
3. Set docs repository `DOCS_PIPELINE_ENABLED=true`; leave `DOCS_PRODUCTION_ENABLED=false`. Scheduled and release-triggered production jobs remain off while staging can build.
4. On docs **main**, run **Publish documentation** with `command=bootstrap`, `channel=staging`, and `site_commit` equal to the full reviewed main SHA. This initializes `docs-state` and collects current source docs. It does not deploy production.
5. Confirm the protected deployment's page/media rendering, product version selectors, search, Markdown, and `/api/mcp`. Verify protection with a logged-out browser. The workflow smoke tests use the automation bypass secret.
6. Enable the four source notifiers and exercise a main push. Confirm that staging receives `next` content and production remains disabled.

Historical stable-version backfill and the production project's credentials/domain are subsequent steps in the runbook. Enable `DOCS_PRODUCTION_ENABLED` only once that separate project and release-history policy are ready. No production credentials or DNS changes are needed to start staging.
