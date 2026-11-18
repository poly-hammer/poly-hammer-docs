# Fumadocs implementation status

Updated November 18, 2026 (America/Chicago). The protected Fumadocs staging site is deployed. Live collection verified the docs repository's `GH_PAT` for private-source reads and archive writes; Vercel deployment and protection-bypass credentials passed live smoke tests. All five repository secret names are `GH_PAT`. Source event-notifier permissions still need a real notification after their PRs merge. Production remains disabled.

## Branches and worktrees

All worktrees are under `E:\repos\poly-hammer-workflows\.worktrees\`. Original working copies and unrelated changes were preserved.

| Repository | Branch | Worktree | Commit |
| --- | --- | --- | --- |
| poly-hammer-docs | `codex/fumadocs-site` | `docs-site` | See branch HEAD |
| character-dna-addon | `codex/fumadocs-dna-docs` | `dna-docs` | `d6815df7469a0c4b71576b842535310c1f365d1c` |
| character-control-rig-addon | `codex/fumadocs-control-rig-docs` | `control-rig-docs` | `a24e8ba512500e9868835dbc6dc2b3a8182f1992` |
| character-assembly-addon | `codex/fumadocs-assembly-docs` | `assembly-docs` | `bad1b92a2deb453cb93ccd9277da54ffa5eb521d` |
| ph-motion-addon (Motion and Generate) | `codex/fumadocs-motion-docs` | `motion-docs` | `f73e503757248bbe030d6f8a6f4a35b543da8f77` |
| poly-hammer-workflows | `codex/fumadocs-notifications` | `docs-workflows` | `e013b6ffe4ccf1d562f51fc98bbde3f06b856a73` |
| poly-hammer-utils | `codex/fumadocs-release-identity` | `docs-utils` | `2354d851722599b4b16ad414b764eb50ab3ff66e` |

All branches are pushed. Utility PR #3, docs PR #76, and staging compatibility/artifact fixes #77/#78 are merged. The shared-workflows PR and four add-on documentation PRs remain open; [STAGING_SETUP.md](STAGING_SETUP.md) links them. The utility/workflow pins are available remotely. Merge without squashing or update callers to the reviewed resulting commits. Control Rig's new 0.5.0 main release was merged into its documentation branch, retaining its new authoring content and converting the added callout to MDX.

## Implemented

- Next.js/Fumadocs Black application with Blender Add-ons, Unreal Plugins, Portal, and CLI sections; existing central pages, logos, screenshots, and instructional videos preserved.
- All 35 source add-on Markdown documents converted to MDX with frontmatter, callouts, source-relative media, and navigation metadata. The composed local site has 44 pages, including new section/agent pages and the shared Motion/Generate client guide.
- Product-scoped native version dropdowns, numbered URLs, latest aliases, historical notices, and version-scoped search.
- Read-only Streamable HTTP MCP with four tools; Markdown pages, current-document indexes/bundles, exact-version bundles, metadata, sitemap, staging noindex, and optional production analytics.
- Root `AGENTS.md` and tracked `.github/instructions/documentation.instructions.md` guidance in each add-on repository. Old authoring tasks and docs notification workflows replaced.
- Docs-only Python GitHub collector; bounded/safe archive handling; immutable releases; content-addressed assets; durable desired/deployed catalogs; main-versus-release routing; reconciliation; separate credential-free build jobs; tested-deployment promotion.
- Release helper pins tags to the exact commit, refuses mutation, and separates Motion/Generate tags. Shared workflows are pinned by commit.
- Retired central MkDocs build, cloning script, configuration, and background effects. The original site remains recoverable in Git and the original checkout.

## Verification completed

- Real converted content: preparation, 44-page validation (frontmatter, restricted MDX, compilation, internal routes, and media), TypeScript checks, and optimized Next.js build passed.
- Eleven TypeScript catalog/adapter tests and ten Python collector/integrity/event/artifact tests passed.
- All 88 existing/new utility tests passed, including five new immutable-release tests.
- Local HTTP smoke tests passed for real docs and synthetic production/staging catalogs containing two stable versions plus staging `next`.
- MCP initialize, tool discovery, version listing, scoped search/read, pagination contracts, unknown-version errors, and external-URL refusal exercised. Markdown output preserves media as usable absolute links.
- Browser checked the Black theme, add-on navigation, product-specific version dropdown, historical-version navigation, and older-version notice. Two fixture version numbers are test data, not real archived releases.
- Workflow YAML parses; actionlint passes with shellcheck/pyflakes unavailable and one narrow suppression for its outdated schema warning on GitHub's officially documented `concurrency.queue` property.
- Application dependency audit reports zero vulnerabilities. Deployment CLI dependencies are isolated from the app and need an upstream advisory review before activation.
- GitHub's staging and production docs CI jobs passed after repairing optional dependency entries in the lockfile with the runner's npm version. The DNA spelling configuration now recognizes Fumadocs and preserves the legacy media filename. The composed 44-page validator passed again after incorporating Control Rig 0.5.0 documentation.
- Add-on pre-commit checks passed. Only auto-version hooks were skipped: they watch unchanged add-on/native source files and cannot initialize in sparse worktrees without native wheels. Blender runtime tests were not needed for documentation-only source changes; release helper behavior was tested separately.

## Remaining before launch

Follow [STAGING_SETUP.md](STAGING_SETUP.md) and [DEPLOYMENT_RUNBOOK.md](DEPLOYMENT_RUNBOOK.md): verify source notification-token permissions and set up production Vercel resources/credentials, canonical origins, and analytics; review/merge the PRs in dependency order; backfill real release history; resolve historical missing docs/media and ambiguous old Motion tags; verify legacy sitemap URLs/anchors; test a real cross-repository main event and stable release; rehearse rollback; then switch DNS.

Created private `poly-hammer/poly-hammer-docs-snapshots`, the main-only `docs-staging` GitHub environment, and the non-secret archive/team/project/origin variables. On November 16, the user authorized Vercel CLI login; the authenticated Owner account created `polyhammer-docs-staging` (`prj_Id78qUcRHvH0zxvJY1aGfHnDdPbl`) in team `team_2AUg4TXhG3hWfKBugsYxrB2T`. The project uses Node.js 24, Next.js, standard resources, all-deployment authentication, and assigned hostname `polyhammer-docs-staging.vercel.app`. The migration worktree is linked to it. MCP read checks pass, but MCP project creation still returns 403; CLI operations work. Staging publication is enabled with `DOCS_PIPELINE_ENABLED=true`; `DOCS_PRODUCTION_ENABLED=false` keeps production disabled. Both Vercel environment credentials passed deployment and protected-site smoke tests. The docs repository GH_PAT and all four add-on GH_PAT secret names are verified. The docs GH_PAT passed live source reads and archive writes. Source-notifier tokens remain untested until their PRs merge. Staging is deployed; no production domain mapping or production DNS change has occurred.

The add-ons still carry unused MkDocs development dependencies in their existing locked Python environments. The runtime/docs workflows no longer use them; remove those packages when refreshing locks in full checkouts with their native wheels available. The source utility checkout also lacks Motion/Generate packager modules; verify the currently installed packaging distribution before enabling those product release jobs.
