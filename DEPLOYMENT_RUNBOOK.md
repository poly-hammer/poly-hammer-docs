# Documentation deployment runbook

## Current implementation and activation boundary

The Fumadocs application, converted add-on content, agent instructions, collector, immutable catalogs, release notifier, publication workflows, MCP, Markdown endpoints, SEO metadata, and smoke checks are implemented on isolated migration branches. The pipeline remains disabled by default. No live domain has been moved and no real release history has been fabricated. `0.15.0`/`0.14.0` in automated fixtures are synthetic test versions; they do not assert that these add-on releases exist.

All seven branches are pushed with PRs. The private snapshot archive, main-only `docs-staging` GitHub environment, and protected Vercel staging project now exist. On November 16, the user authorized the CLI login and the CLI created/configured `polyhammer-docs-staging`; MCP project creation still returns HTTP 403. The staging project ID, assigned origin, and both Vercel environment secret names are verified in GitHub. The docs DOCS_GITHUB_TOKEN and four source GH_PAT secret names are now verified too. Effective token permissions and the first docs deployment remain to be verified; deployment will test the Vercel secret values. See [STAGING_SETUP.md](STAGING_SETUP.md) for current resources, PR links, credentials, and the staging-only activation sequence.

The existing MkDocs site is recoverable from docs commit `a6482a790a40ab0f63b4e515027712d51e863fb4`; the original checkout remains on main. The converted central docs and media live in `content/authored` and `public`. Custom background animation code is retired. Legacy MkDocs packages remain in the add-ons' existing Python development locks: regenerating those locks requires native wheel files absent from the isolated documentation worktrees. They are not used by the new authoring or publishing paths. Remove them during the next full-checkout dependency refresh.

## Merge and enable order

1. Review/push the `poly-hammer-utils` release-identity branch, commit `2354d851722599b4b16ad414b764eb50ab3ff66e`. It refuses moved tags and uses `GITHUB_SHA`. Motion and Generate use `ph-motion/<version>` and `ph-generate/<version>` tags. Existing ambiguous Motion tags need an explicit historical ownership decision before backfill.
2. Review the shared workflows branch, commit `ccb30bb5af689b9e0f8a7e2600fcf537c3c35607`. All four add-on documentation notifiers pin this PAT-based revision. Their package-release workflows retain the earlier `39a8928ba112ccf9d3054f6659bd8be7e6f9e667` pin because the release helper is unchanged. The release workflow overlays only the tested identity helper, preserving each installed product-specific packager. Verify the installed utility package contains the Motion/Generate packaging modules; they are absent from the inspected local utility main checkout and are an existing packaging dependency.
3. Merge the docs site branch with the enable variable still unset. Confirm the configured PAT permissions, archive repository, Vercel projects, and environments below.
4. Merge each add-on's separate documentation branch. Its notifier is also disabled until the repository variable is enabled. Source MDX requires the new collector; do not reconnect the old MkDocs build.
5. Run the synthetic CI matrix, then test real source snapshots and review legacy redirects. Bootstrap staging with the full reviewed docs main SHA. Inspect it with a human and an MCP client.
6. Bootstrap/sync production against a temporary production hostname; verify all historical versions and assets. Only then assign `docs.polyhammer.com`, remove its old GitHub Pages domain mapping, update DNS, and verify TLS. Retain the old site deployment for rollback.
7. Enable each source notifier and the scheduled reconciliation. Exercise one main push and a real stable release. Confirm only the affected release changes production, then confirm staging refreshes.

Push the pinned utility/workflow commits before merging their callers; immutable refs unavailable on GitHub will fail. Prefer merging these branches without squash, or replace all pins with the resulting reviewed commit IDs before merging callers.

## GitHub resources and permissions

Create a **private** `poly-hammer/poly-hammer-docs-snapshots` repository initialized with a README. Use it only for documentation bundles, never addon packages or private code. Release assets are named by their content digest. Preserve published assets indefinitely; repository administrators must not replace/delete assets or tags in routine maintenance. Copies are digest-verified every time they are materialized.

Use the docs repository's **`DOCS_GITHUB_TOKEN`** PAT for collection/archive writes and each add-on's existing **`GH_PAT`** for notifications. All five repository secret names are verified. This replaces the three-App setup without requiring duplicate add-on secrets. Fine-grained and classic PATs are supported; their values need not match.

For the collector's fine-grained PAT, select resource owner `poly-hammer` and the four add-on repositories plus `poly-hammer-docs-snapshots`, with **Contents: Read and write** and automatic Metadata read. The archive needs write access; the permission also applies to the sources even though the collector only reads their docs. The earlier six-repository token configuration remains compatible. Separately, each add-on's fine-grained `GH_PAT` must include `poly-hammer-docs` with **Contents: Read and write** for repository dispatch. Complete organization approval if pending.

Classic PATs need **`repo`** scope and organization SSO authorization if required. They cannot be restricted to selected repositories and can reach repositories the issuing account can access, subject to organization policy. Documentation operations need no `admin:org` or `workflow` scope. Keep the snapshot archive free of workflow files. Preserve any other permissions the add-ons' existing `GH_PAT` consumers need for package releases.

Keep `DOCS_GITHUB_TOKEN` as a repository Actions secret in the docs repository and `GH_PAT` in each add-on. The source workflows map `DOCS_GITHUB_TOKEN: ${{ secrets.GH_PAT }}` into the reusable notifier. The archive needs no stored secret. Do not put these secrets only in `docs-staging`: collection and notification jobs run outside that environment.

Rotate each affected repository secret before its token expires and retain the issuing account's access. The first real collection and notification runs must verify effective permissions; secret presence alone cannot verify them. No App registration, App ID, private key, installation, or installation-token action is required. See [GitHub PAT setup](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) and [dispatch permissions](https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event).

The built-in docs `GITHUB_TOKEN` writes only the `docs-state` branch during collection/deployment. Protect main, require reviewed workflow changes, and restrict `docs-staging`/`docs-production` environments to main. Allow the workflow identity to update `docs-state` without allowing force pushes. Do not make pull-request workflows privileged. Stable release publication is automatic after tests; manual reviewers are optional organizational policy, not required by this implementation.

GitHub does not provide a docs-directory-only repository token. The collector traverses only registered docs trees and fetches approved document/media blobs. Its reader and archive environment variables receive the same `DOCS_GITHUB_TOKEN`; the state writer still uses the built-in `GITHUB_TOKEN`. Never pass the PAT into npm, MDX compilation, or Vercel.

| Location | Variable/secret | Value |
| --- | --- | --- |
| Docs repository variable | `DOCS_PIPELINE_ENABLED` | `true` after setup and bootstrap planning |
| Docs repository variable | `DOCS_PRODUCTION_ENABLED` | Keep `false` during staging setup; enable only after production resources and historical backfill are ready |
| Docs repository variable | `DOCS_ARCHIVE_REPO_NAME` | `poly-hammer-docs-snapshots` |
| Docs repository secret | `DOCS_GITHUB_TOKEN` | Source reads and snapshot archive writes; name verified |
| Each add-on repository secret | `GH_PAT` | Existing PAT with dispatch access to `poly-hammer-docs`; all four names verified |
| Docs repository variable | `VERCEL_ORG_ID` | Poly Hammer Vercel team ID |
| Docs repository variables | `VERCEL_STAGING_PROJECT_ID`, `VERCEL_PRODUCTION_PROJECT_ID` | Separate project IDs |
| Docs repository variables | `DOCS_STAGING_URL`, `DOCS_PRODUCTION_URL` | Canonical HTTPS origins, no trailing slash |
| Docs repository variable | `DOCS_GA_ID` | Existing `G-...` GA4 ID, optional; production only |
| Each docs GitHub environment secret | `VERCEL_TOKEN` | Scoped deployment credential |
| Each docs GitHub environment secret | `VERCEL_AUTOMATION_BYPASS_SECRET` | For smoke tests against protected deployment URLs |
| Each add-on variable | `DOCS_PIPELINE_ENABLED` | `true` once the receiver works |

Configure secrets directly in GitHub/Vercel; never paste credentials into chat or commit them. These administrative credentials are not supplied by the implementation.

## Vercel configuration

Create separate Next.js projects named `polyhammer-docs-staging` and `polyhammer-docs-production` in the Poly Hammer team. Use Node.js 24 and standard resources. Disable automatic Git deployments: only the catalog-driven workflow may publish. Do not add `DOCS_GITHUB_TOKEN` to Vercel. Keep project environment variables empty except intentional public configuration; the pipeline passes channel/origin/analytics explicitly and transfers only `project.json` from `vercel pull`, never pulled environment files.

Protect **all staging deployments**, including its production-target deployment. Production custom domains must allow anonymous readers and MCP clients; protect production candidate URLs until tested. Configure automation bypass credentials in the matching GitHub environment. Verify protection settings with a logged-out browser, because noindex does not provide access control.

Both projects use Vercel's production build target, with different `DOCS_CHANNEL` values. The pipeline stages a prebuilt production-target deployment with `--skip-domain`, tests that exact deployment, then promotes it without rebuilding. Do not promote a Preview build into production: that can rebuild with different variables. The deployment CLI is pinned separately from the application; its upstream transitive dependencies currently report advisories, so review/refresh that tool pin before activation. The application dependency audit is separate and passed with zero advisories during implementation.

Retain the existing GA4 property. Enable page views for browser history changes in its enhanced measurement settings and verify navigation in DebugView. Staging never loads the analytics component. Confirm the current privacy/consent configuration before carrying it across the domain cutover.

## Bootstrap and historical backfill

Run **Publish documentation** on main with `command=bootstrap`, `channel=staging`, and `site_commit=<full reviewed main SHA>`. It creates an orphan `docs-state` journal if absent and initializes the production site pin without deploying production. Staging then collects current main documentation for all registered products.

For staging-only activation, set `DOCS_PIPELINE_ENABLED=true` and keep `DOCS_PRODUCTION_ENABLED=false`. This permits staging main events, manual builds, and scheduled reconciliation without attempting a deployment to an unconfigured production project. After provisioning production and reviewing the historical backfill policy, enable `DOCS_PRODUCTION_ENABLED` before its first manual sync; stable-release events and schedules can then publish production.

Run the same workflow with `command=sync`, `channel=production`. It enumerates every published, non-draft, non-prerelease stable tag and resolves the exact commit. New snapshots are archived, verified, and added without changing other products or the site pin. Annotated tags are resolved through GitHub's commit API. Backfilled older versions cannot replace a newer `latest`.

Some historical tags may predate docs, contain unsupported syntax, have missing media, or be ambiguous shared-repository tags. The collector must fail rather than invent historical content. Inspect the exact failing release. Record any deliberately unsupported tag in `docs-release-exclusions.json` as `"product-id:exact-tag": "reviewed reason"`; then retry. Never substitute current main documentation for an older release. Existing ambiguous Motion/Generate tags are intentionally not matched by the new prefixed registry rules; add an audited ownership map in a separate change if they must be recovered.

The compatibility adapter converts common historical MkDocs callouts, HTML media, and image attributes without editing the archived source. Unsupported historical constructs require an explicit adapter improvement and test. Every archived version must compile and pass link/media validation before production can advance. Initial backfill is deliberately stricter than best-effort ingestion.

## Normal publication

| Change/event | Result |
| --- | --- |
| Add-on push to main, including non-doc changes | Typed notification; reconcile main SHA; build staging with `next` snapshots |
| Stable GitHub release published | Verify release through GitHub; archive its tag commit; update production catalog and deploy; refresh staging afterward |
| Draft/prerelease | No production publication |
| Docs repo main push | Build staging using new site/central content |
| Manual production sync with `site_commit` | Promote that reviewed main site/central-doc commit with existing stable product snapshots |
| Hourly reconciliation | Recover missed events, discover stable releases, and retry desired catalogs not successfully deployed |

Workflow runs queue up to GitHub's supported concurrency limit. Reconciliation supplies correctness even if a dispatch or queued run is lost. State updates are fast-forward compare-and-swap writes; a conflict fails safely for retry. Duplicate releases are idempotent. If a released tag moves or is recreated with a different release ID, publication fails for investigation.

`docs-state/{staging,production}.json` records desired catalogs. `*-deployment.json` records the tested deployment URL, catalog digest, generation, and site commit. A build failure leaves the previous live deployment in service and the desired catalog available for retry. If promotion succeeds but recording fails, a retry may deploy the same desired catalog again; content identity is preserved.

## Verification and rollback

Run `node scripts/smoke.mjs` with `DOCS_TEST_URL` set to the deployment URL. In CI the protected URL uses the environment's bypass secret. Check the version dropdown with two releases, same-page/fallback navigation, numbered canonical links, old URL redirects, search scope, copied Markdown, media links, and a real MCP client. Confirm `/next` is 404 on production and absent from its search, agent indexes, sitemap, and page tree. Check mobile/keyboard navigation and screen-reader labels.

Check every published legacy sitemap URL before DNS cutover. `legacy-redirects.json` maps renamed Control Rig pages to their nearest current equivalents; validate whether older exact releases should replace any of these compatibility destinations. Fragment identifiers may need explicit aliases if headings changed. Monitor 404s after launch and add evidence-based redirects rather than routing every missing page to the homepage.

For an immediate rollback, disable `DOCS_PIPELINE_ENABLED` in the docs repository, use Vercel rollback to the recorded known-good deployment, and verify its exact catalog and Markdown/MCP output. Restore the matching catalog and deployment record from `docs-state` history with a reviewed fast-forward commit; otherwise reconciliation would republish the newer desired state. Re-enable only after resolving the failed change. Keep the old GitHub Pages deployment available through the cutover window. DNS rollback is a separate operational action.

Do not automatically delete historical versions, overwrite published snapshots, or move release tags. Emergency documentation corrections require a reviewed revision mechanism or a new released version; the first implementation intentionally rejects silent mutation.

## Reference documentation

- [Fumadocs LLM integration](https://www.fumadocs.dev/docs/next/integrations/llms)
- [Fumadocs MCP utilities](https://www.fumadocs.dev/docs/headless/utils/mcp)
- [GitHub workflow concurrency and queues](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)
- [Vercel prebuilt deployments](https://vercel.com/docs/cli/deploy)
- [Vercel production promotion](https://vercel.com/docs/cli/promote)
- [Google AI features and search guidance](https://developers.google.com/search/docs/appearance/ai-features)
