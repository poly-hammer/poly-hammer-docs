# Staging setup and credential checklist

Updated November 21, 2026 (America/Chicago). All four addon Fumadocs migrations are merged into main and all four main-event notification workflows succeeded with their existing `GH_PAT`. The protected [staging site](https://polyhammer-docs-staging.vercel.app) uses current main documentation. Production remains disabled, and production DNS is unchanged.

Docs PR #91 adds publication visibility controls. `DOCS_PRODUCTION_HIDDEN_PATHS` is configured as `["cli","blender-addons/ph-motion"]`; staging's default is `[]`. Hidden documentation is absent from routes, navigation, search, Markdown, MCP, and copied addon media. See README for changing the setting and rebuilding.

## Pull requests

| Repository | PR |
| --- | --- |
| poly-hammer-utils | [#3: Immutable release source identity](https://github.com/poly-hammer/poly-hammer-utils/pull/3) |
| poly-hammer-workflows | [#5: Documentation notifications and release identity](https://github.com/poly-hammer/poly-hammer-workflows/pull/5) |
| poly-hammer-docs | [#76: Fumadocs, versions, MCP, and publication pipeline](https://github.com/poly-hammer/poly-hammer-docs/pull/76) |
| character-dna-addon | [#384: Fumadocs documentation and agent guidance](https://github.com/poly-hammer/character-dna-addon/pull/384) |
| character-control-rig-addon | [#56: Fumadocs documentation and agent guidance](https://github.com/poly-hammer/character-control-rig-addon/pull/56) |
| character-assembly-addon | [#7: Fumadocs documentation and agent guidance](https://github.com/poly-hammer/character-assembly-addon/pull/7) |
| ph-motion-addon | [#10: Motion documentation and agent guidance](https://github.com/poly-hammer/ph-motion-addon/pull/10) |

All addon PRs in the table are merged. DNA and Control Rig incorporated current main; Assembly was already current, and Motion's migration was previously merged. The current addon release workflows were retained instead of obsolete migration pins. Shared-workflows PR #5 remains separate; all four working docs notifiers pin its available commit `e013b6ffe4ccf1d562f51fc98bbde3f06b856a73`.

The docs CI matrix passed on Linux for both staging and production, including builds and HTTP/MCP smoke tests, after fixing optional dependency lock entries. DNA spelling checks now recognize Fumadocs and its legacy image filename. Check each PR's latest status before merging; the wider Blender/native CI suites run independently.

## Resources already configured

- Private [poly-hammer-docs-snapshots](https://github.com/poly-hammer/poly-hammer-docs-snapshots), initialized with a README. It contains documentation-only `next` snapshots for all five products.
- GitHub environment `docs-staging` in the docs repository, restricted to the `main` branch.
- Docs repository variables `DOCS_ARCHIVE_REPO_NAME=poly-hammer-docs-snapshots` and `VERCEL_ORG_ID=team_2AUg4TXhG3hWfKBugsYxrB2T`.
- Vercel [polyhammer-docs-staging](https://vercel.com/poly-hammers-projects/polyhammer-docs-staging), project ID `prj_Id78qUcRHvH0zxvJY1aGfHnDdPbl`, with Next.js, Node.js 24, standard build resources, and Vercel Authentication for all deployments. No Git repository is connected, so Vercel does not automatically deploy source pushes.
- Docs repository variables `VERCEL_STAGING_PROJECT_ID=prj_Id78qUcRHvH0zxvJY1aGfHnDdPbl` and `DOCS_STAGING_URL=https://polyhammer-docs-staging.vercel.app`. The hostname serves the verified protected staging deployment.
- `DOCS_PIPELINE_ENABLED=true` and `DOCS_PRODUCTION_ENABLED=false`. Staging publication and scheduled reconciliation are active; production remains off.

On November 18, secret-name checks confirmed the docs repository's `GH_PAT`, `GH_PAT` in all four add-on repositories, and `VERCEL_TOKEN` / `VERCEL_AUTOMATION_BYPASS_SECRET` in the docs repository's `docs-staging` environment. Values were not read or changed. The docs repository's older `GA_ID` secret is unused by the new pipeline. `GH_PAT` is the unified repository secret name for collection and notifications in all five repositories. Live collection verified the docs GH_PAT against private source repositories and the archive. Deployment and protected-site smoke tests verified both Vercel credentials. All four source GH_PATs were verified by successful main-event notification runs on November 21.

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

## GitHub credentials already configured

The docs repository uses **`GH_PAT`** for collection and archive writes. Each add-on reuses its existing **`GH_PAT`** for notifications. These values do not need to match. Both fine-grained and classic personal access tokens work with the same workflows. No GitHub App IDs, keys, installations, or extra add-on secrets are needed.

### Docs repository token permissions

The configured `GH_PAT` needs source reads and archive writes. For a new or replacement fine-grained token, open [New fine-grained personal access token](https://github.com/settings/personal-access-tokens/new), choose an expiration and resource owner **poly-hammer**, and select these five repositories:

| Repository | What the pipeline does |
| --- | --- |
| `character-dna-addon` | Read its docs folder and release metadata |
| `character-control-rig-addon` | Read its docs folder and release metadata |
| `character-assembly-addon` | Read its docs folder and release metadata |
| `ph-motion-addon` | Read Motion docs and release metadata |
| `poly-hammer-docs-snapshots` | Read/write immutable documentation release assets |

Set repository **Contents: Read and write**. Metadata read access is automatic; other permissions can remain unset. The write permission is needed for archive assets and applies to all five selected repositories, although the collector only reads source docs. Complete organization approval if pending. A token configured with the earlier six-repository recommendation remains compatible; the collector uses the built-in `GITHUB_TOKEN` for the docs repository itself.

### Existing add-on tokens

Each existing `GH_PAT` must be allowed to send `repository_dispatch` events to **`poly-hammer/poly-hammer-docs`**. For a fine-grained token, include that destination repository with **Contents: Read and write**. For a classic token, **`repo`** scope is required. Source-repository access alone is insufficient for a cross-repository notification. Preserve any other permissions these existing tokens need for package release workflows.

The source workflow explicitly maps the existing secret into the reusable workflow's input:

```yaml
secrets:
  GH_PAT: ${{ secrets.GH_PAT }}
```

### Secret placement and rotation

Keep `GH_PAT` as a repository Actions secret in `poly-hammer-docs`, and `GH_PAT` in `character-dna-addon`, `character-control-rig-addon`, `character-assembly-addon`, and `ph-motion-addon`. No extra documentation secret is needed, and the archive repository needs no stored secret. Do not move these secrets only into `docs-staging`: the collector and notifiers run outside that environment.

Both token types depend on the issuing account retaining repository access and any required organization approval or SSO authorization. Classic tokens with `repo` scope also work for collection but have broader access. The docs automation needs no `workflow` or `admin:org` scope; the archive contains no workflow files. Rotate each affected secret before expiry, keeping existing package-release consumers in mind if a `GH_PAT` is replaced.

The built-in docs `GITHUB_TOKEN` writes `docs-state`; npm/MDX build jobs and Vercel do not receive either PAT. All four sources have `DOCS_PIPELINE_ENABLED=true`. Only Motion is registered from its repository.

See [GitHub's PAT instructions](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) and [repository-dispatch permissions](https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event).

## Vercel credentials

These two environment secrets are already present in [docs-staging](https://github.com/poly-hammer/poly-hammer-docs/settings/environments). Deployment and protected-site smoke tests verified both credentials without displaying their values.

| Environment secret | Purpose |
| --- | --- |
| `VERCEL_TOKEN` | Fetch staging project settings and upload/promote deployments |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Test protected candidate deployments before promotion |

## Operate staging

1. The docs site and all addon migrations are merged. Source events and scheduled reconciliation collect current main docs. The shared notifier is pinned to its reviewed immutable commit.
2. All required secret names are present: docs `GH_PAT`, source `GH_PAT`, and the two staging Vercel secrets. Collection, archive writes, deployment, and protected-site tests have passed; all four source notification permissions are also verified. The Vercel project, project ID, and origin are configured. Review the pinned deployment CLI advisories described in [DEPLOYMENT_RUNBOOK.md](DEPLOYMENT_RUNBOOK.md) before activation.
3. Keep docs repository `DOCS_PIPELINE_ENABLED=true` and `DOCS_PRODUCTION_ENABLED=false`. Scheduled and release-triggered production jobs remain off while staging can build.
4. Initial bootstrap is complete. For a manual refresh, run **Publish documentation** on **main** with `command=sync` and `channel=staging`. Use `bootstrap` with a reviewed site SHA only when initializing a new state branch. Neither action deploys production while its gate is false.
5. Confirm the protected deployment's page/media rendering, product version selectors, search, Markdown, and `/api/mcp`. Verify protection with a logged-out browser. The workflow smoke tests use the automation bypass secret.
6. All four source notifiers are enabled and their main-push dispatches have succeeded. Confirm each new event updates the corresponding `next` snapshot in `docs-state`; production remains disabled.

Historical stable-version backfill and the production project's credentials/domain are subsequent steps in the runbook. Enable `DOCS_PRODUCTION_ENABLED` only once that separate project and release-history policy are ready. No production credentials or DNS changes are needed to start staging.
