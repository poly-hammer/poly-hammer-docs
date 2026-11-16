# Staging setup and credential checklist

Updated November 16, 2026 (America/Chicago). The Vercel CLI is authenticated and the protected staging project is configured. The docs migration PR remains open, no docs deployment is live, and production DNS is unchanged.

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

The docs repository still has its existing `GA_ID` and `GH_PAT` secret names. Their values were not read or changed, and the new pipeline does not use them. No new secrets have been configured.

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
| Project environment variables | No GitHub App credentials; the workflow embeds the staging channel and origin in the build |

The project uses Vercel's production target as a persistent **staging** environment. The future production website uses a different project. Do not connect `docs.polyhammer.com` to this staging project.

The project ID and assigned origin above are already saved in GitHub. The isolated `docs-site` worktree is linked to this staging project in its ignored `.vercel/project.json`. Vercel link also generated a local OIDC environment file; that unused file was removed without reading or exposing its value. The CLI login is separate from the deployment token needed by GitHub Actions.

## Credentials needed for the first staging build

Configure values directly in GitHub and Vercel, never in the repository or chat. The GitHub settings are [repository secrets and variables](https://github.com/poly-hammer/poly-hammer-docs/settings/secrets/actions) and [environments](https://github.com/poly-hammer/poly-hammer-docs/settings/environments).

| Credential | Scope / permission | Where to save it |
| --- | --- | --- |
| Docs Reader GitHub App ID and generated PEM private key | Install on `character-dna-addon`, `character-control-rig-addon`, `character-assembly-addon`, and `ph-motion-addon`; repository Contents **read** | Docs repository variable `DOCS_READER_APP_ID`; repository secret `DOCS_READER_APP_KEY` |
| Docs Archive GitHub App ID and generated PEM private key | Install only on `poly-hammer-docs-snapshots`; repository Contents **write** | Docs repository variable `DOCS_ARCHIVE_APP_ID`; repository secret `DOCS_ARCHIVE_APP_KEY` |
| Vercel deployment token | Poly Hammer team scope, with permission to deploy/promote the staging project | Docs repository's `docs-staging` environment secret `VERCEL_TOKEN` |
| Vercel Protection Bypass for Automation secret | Generate for the staging project in its Deployment Protection settings | Same GitHub environment secret `VERCEL_AUTOMATION_BYPASS_SECRET` |

These GitHub Apps do not need webhooks or event subscriptions: Actions generates short-lived installation tokens from the keys. Metadata read access is automatic. Select only the listed repositories during installation. The built-in docs `GITHUB_TOKEN` writes `docs-state`; no new personal access token is needed for that branch.

The reader app's repository permission cannot be limited to `docs/`, but the collector fetches only registered docs trees. Reader/archive/state credentials never enter npm, MDX compilation, or Vercel. Builds upload only documentation-derived output.

## Credentials for automatic add-on notifications

Create a third **Docs Dispatch** GitHub App, installed only on `poly-hammer-docs` with repository Contents **write** so it can send `repository_dispatch` events. It needs no webhook subscriptions.

In each of the four source repositories, configure variable `DOCS_DISPATCH_APP_ID` and secret `DOCS_DISPATCH_APP_KEY`. Use repository or organization secrets restricted to those four repositories. Set each source's `DOCS_PIPELINE_ENABLED=true` only after the docs receiver and staging bootstrap work. Motion and Generate share one source repository and one notifier setup.

The dispatch app is not required for the initial manual staging bootstrap or scheduled reconciliation. It is required for immediate main/release notifications.

## Activate staging

1. Review/merge the PRs in dependency order. Keep both docs enable variables false during this step.
2. Configure the four staging credentials and GitHub App IDs above. The Vercel project, project ID, and origin are already configured. Review the pinned deployment CLI advisories described in [DEPLOYMENT_RUNBOOK.md](DEPLOYMENT_RUNBOOK.md) before activation.
3. Set docs repository `DOCS_PIPELINE_ENABLED=true`; leave `DOCS_PRODUCTION_ENABLED=false`. Scheduled and release-triggered production jobs remain off while staging can build.
4. On docs **main**, run **Publish documentation** with `command=bootstrap`, `channel=staging`, and `site_commit` equal to the full reviewed main SHA. This initializes `docs-state` and collects current source docs. It does not deploy production.
5. Confirm the protected deployment's page/media rendering, product version selectors, search, Markdown, and `/api/mcp`. Verify protection with a logged-out browser. The workflow smoke tests use the automation bypass secret.
6. Enable the four source notifiers and exercise a main push. Confirm that staging receives `next` content and production remains disabled.

Historical stable-version backfill and the production project's credentials/domain are subsequent steps in the runbook. Enable `DOCS_PRODUCTION_ENABLED` only once that separate project and release-history policy are ready. No production credentials or DNS changes are needed to start staging.
