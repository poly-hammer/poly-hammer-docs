# Production setup status

Prepared on November 21, 2026. **No production deployment has been created. Do not deploy, enable production publication, or move the live domain until the owner explicitly approves the launch.**

## Configured resources

| Resource | Current setting |
| --- | --- |
| Vercel team | `poly-hammers-projects` / `team_2AUg4TXhG3hWfKBugsYxrB2T` |
| Production project | [polyhammer-docs-production](https://vercel.com/poly-hammers-projects/polyhammer-docs-production) |
| Production project ID | `prj_gUQWwctf1SFxzaei5xIhraG50uam` |
| Framework / runtime | Next.js / Node.js 24.x |
| Install / build | `npm ci` / `npm run build`, standard build machine |
| Git integration | None; only the catalog-driven workflow may upload prebuilt output |
| Deployment protection | Vercel Authentication for all deployments during setup |
| GitHub environment | `docs-production`, only the `main` branch |
| Approval | Required reviewer `jack-yao91`; administrator bypass disabled |
| Repository variable `VERCEL_PRODUCTION_PROJECT_ID` | `prj_gUQWwctf1SFxzaei5xIhraG50uam` |
| Repository variable `DOCS_PRODUCTION_URL` | `https://docs.polyhammer.com`, the canonical origin; DNS has not moved |
| Repository variable `DOCS_PRODUCTION_VERIFY_URL` | `https://polyhammer-docs-production.vercel.app` for pre-cutover HTTP verification after approval; not serving a deployment yet |
| Repository variable `DOCS_PRODUCTION_ENABLED` | `false` |
| Repository variable `DOCS_PRODUCTION_HIDDEN_PATHS` | `["cli","blender-addons/ph-motion"]` |

Staging remains a different project. No DNS records, live-domain assignments, or GitHub Pages settings were changed. `docs.polyhammer.com` remains outside this new project. Project environment variables do not need GitHub or Vercel credentials: GitHub Actions supplies public build configuration and embeds it in the tested artifact.

The publication configuration check runs before collection changes a catalog. It rejects missing production values, a disabled production gate, publication from another branch, or production settings that point at staging. This also catches GitHub expression fallbacks when a production variable is empty.

## Production credentials

Both required secret names were verified in `docs-production` after the owner configured them on November 21. Their values were not read. The instructions below describe their scope and replacement procedure; credential access verification is separate from a deployment.

Open [GitHub environments](https://github.com/poly-hammer/poly-hammer-docs/settings/environments), select **docs-production**, and add these environment secrets directly. They cannot be retrieved or copied out of the existing staging environment.

| Secret | Source and scope |
| --- | --- |
| `VERCEL_TOKEN` | A [Vercel access token](https://vercel.com/account/settings/tokens) permitted to read project settings and deploy/promote `polyhammer-docs-production` in the Poly Hammer team. An existing team-scoped CI token can be used if it has that access; no local CLI login token should be extracted. |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Generate a secret under the **production project's** [Settings → Deployment Protection → Protection Bypass for Automation](https://vercel.com/poly-hammers-projects/polyhammer-docs-production/settings/deployment-protection). It allows CI smoke tests through authentication; it is not a deployment credential. Do not use the staging project's bypass secret. |

Keep both values out of chat, repository files, commands with literal secret arguments, and build artifacts. The existing repository `GH_PAT` is still used for collection; no extra PAT or GitHub App is needed. Vercel's documented [automation bypass](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation) applies only to tests against the protected project.

Secrets are accessible only after environment approval. The workflow's settings and deployment jobs both use `docs-production`; GitHub may request approval at both points. Do not approve either on the owner's behalf. Self-review is allowed so the owner can approve a manually triggered run using the same GitHub account. See [GitHub environment rules](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments).

After adding the secrets, run **Check production credentials (no deployment)** on `main` and have the owner approve that specific environment request. This workflow is deliberately available while `DOCS_PRODUCTION_ENABLED=false`: it makes one read-only project API call, checks the team/runtime/Git settings, and checks that the bypass value is present. It does not collect content, write catalogs, build, deploy, promote, or change domains. Reading settings does not prove deployment-write permissions; the bypass secret's actual HTTP authorization also cannot be verified until an approved deployment exists.

The owner approved [credential check 44908535570](https://github.com/poly-hammer/poly-hammer-docs/actions/runs/44908535570), which passed on November 21. The token can read the expected production project and its settings are correct; the bypass value is present. No production deployment was created by the check.

## Remaining release-content verification

The production catalog is initialized but still empty (generation 0), with an old bootstrap site pin. It has no successful production deployment record. The first approved run must supply the full reviewed **main commit SHA containing the current visibility feature and publication checks**; do not reuse the bootstrap pin or run an unqualified first sync.

A paginated release inventory found these stable releases. This inventory is not a claim that their historical Markdown and assets have been built successfully:

| Product | Stable releases | Newest | Oldest |
| --- | ---: | --- | --- |
| Character DNA | 14 | 0.15.1 | 0.8.5 |
| Character Control Rig | 13 | 0.5.2 | 0.1.5 |
| Character Assembly | 7 | 0.4.3 | 0.2.0 |

The first production sync checks and archives these exact released snapshots, then validates every generated page and media link. It must fail on unsupported content rather than substitute current main. Any exclusions require an explicit reviewed reason in `docs-release-exclusions.json`. Motion is excluded by the production visibility policy. The local Markdown remains intact, and staging still shows CLI and Motion.

## First publication, only after approval

1. Confirm both environment secrets are present, this setup change is reviewed on main, and the exact site SHA and historical-release policy are approved. Confirm `DOCS_PRODUCTION_HIDDEN_PATHS` still hides CLI and Motion. During approved launch preparation, attach the final custom domain to the production project as described in [DNS_CUTOVER.md](DNS_CUTOVER.md), without changing its traffic-routing DNS record. Both the canonical domain and verification hostname must be configured on this project before promotion.
2. After explicit owner approval, set `DOCS_PRODUCTION_ENABLED=true` and run **Publish documentation** on `main` with `channel=production`, `command=sync`, and `site_commit=<full approved main SHA>`. State already exists; do not bootstrap again. Enabling the gate also permits scheduled and release-event production jobs, so perform the manual sync immediately and check any queued runs before approving them.
3. The owner reviews the requested environment approvals. The workflow collects immutable release snapshots, builds without source/deployment secrets, uploads with `--skip-domain`, tests HTML/Markdown/search/MCP and hidden routes, then promotes that exact build to the configured Vercel aliases. Canonical URLs already use the final domain, while `DOCS_PRODUCTION_VERIFY_URL` directs pre-cutover HTTP tests to the temporary hostname. Both aliases are checked against the same project and deployment. Even this pre-cutover step is a production deployment and is **not authorized yet**.
4. Review the running production artifact, historical version selectors, legacy redirects, media, and agent interfaces. Verify no `next`, CLI, or Motion content is exposed. Resolve any build or smoke-test failures before moving the live domain.
5. **Leave DNS cutover to the owner as the final traffic switch.** Follow [DNS_CUTOVER.md](DNS_CUTOVER.md) for Route 53, the exact Vercel target, public protection settings, verification, GitHub Pages cleanup, and rollback. The canonical origin is already built correctly, so no canonical-URL rebuild is needed after switching DNS. Remove `DOCS_PRODUCTION_VERIFY_URL` after public verification so subsequent checks use the live domain.
6. Stable release events and scheduled reconciliation then update production using its pinned site SHA. Main pushes still update staging. The GitHub required reviewer remains in place until the owner explicitly chooses a different approval policy.

The implementation and recovery procedure are described in [DEPLOYMENT_RUNBOOK.md](DEPLOYMENT_RUNBOOK.md). Setting secrets or variables does not itself deploy the site while the production gate remains false.
