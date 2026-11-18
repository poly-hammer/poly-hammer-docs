# Fumadocs implementation status

Updated November 18, 2026 (America/Chicago). The migration uses one shared GitHub PAT, `DOCS_GITHUB_TOKEN`, instead of three GitHub Apps. Fine-grained and classic tokens are supported. The protected Vercel staging project is configured, its two environment secret names are verified, and the CLI is authenticated; no docs deployment or production cutover has occurred.

## Branches and worktrees

All worktrees are under `E:\repos\poly-hammer-workflows\.worktrees\`. Original working copies and unrelated changes were preserved.

| Repository | Branch | Worktree | Commit |
| --- | --- | --- | --- |
| poly-hammer-docs | `codex/fumadocs-site` | `docs-site` | See branch HEAD |
| character-dna-addon | `codex/fumadocs-dna-docs` | `dna-docs` | `9692de07224f2ad041e15b9fad09824fc6ccff58` |
| character-control-rig-addon | `codex/fumadocs-control-rig-docs` | `control-rig-docs` | `4ccd05842c668b75717c6b440e35b5dd3fc33d4c` |
| character-assembly-addon | `codex/fumadocs-assembly-docs` | `assembly-docs` | `6f8f31fda7b639e208e0485f3c60a07d0bc184e9` |
| ph-motion-addon (Motion and Generate) | `codex/fumadocs-motion-docs` | `motion-docs` | `f5179316bfc41c145b6fab2b804ed1bef99577d7` |
| poly-hammer-workflows | `codex/fumadocs-notifications` | `docs-workflows` | `ccb30bb5af689b9e0f8a7e2600fcf537c3c35607` |
| poly-hammer-utils | `codex/fumadocs-release-identity` | `docs-utils` | `2354d851722599b4b16ad414b764eb50ab3ff66e` |

All branches are pushed; [STAGING_SETUP.md](STAGING_SETUP.md) links all seven open PRs. The utility/workflow pins are available remotely. Merge without squashing or update callers to the reviewed resulting commits. Control Rig's new 0.5.0 main release was merged into its documentation branch, retaining its new authoring content and converting the added callout to MDX.

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
- Eight TypeScript catalog/adapter tests and seven Python collector/integrity/event tests passed.
- All 88 existing/new utility tests passed, including five new immutable-release tests.
- Local HTTP smoke tests passed for real docs and synthetic production/staging catalogs containing two stable versions plus staging `next`.
- MCP initialize, tool discovery, version listing, scoped search/read, pagination contracts, unknown-version errors, and external-URL refusal exercised. Markdown output preserves media as usable absolute links.
- Browser checked the Black theme, add-on navigation, product-specific version dropdown, historical-version navigation, and older-version notice. Two fixture version numbers are test data, not real archived releases.
- Workflow YAML parses; actionlint passes with shellcheck/pyflakes unavailable and one narrow suppression for its outdated schema warning on GitHub's officially documented `concurrency.queue` property.
- Application dependency audit reports zero vulnerabilities. Deployment CLI dependencies are isolated from the app and need an upstream advisory review before activation.
- GitHub's staging and production docs CI jobs passed after repairing optional dependency entries in the lockfile with the runner's npm version. The DNA spelling configuration now recognizes Fumadocs and preserves the legacy media filename. The composed 44-page validator passed again after incorporating Control Rig 0.5.0 documentation.
- Add-on pre-commit checks passed. Only auto-version hooks were skipped: they watch unchanged add-on/native source files and cannot initialize in sparse worktrees without native wheels. Blender runtime tests were not needed for documentation-only source changes; release helper behavior was tested separately.

## Remaining before launch

Follow [STAGING_SETUP.md](STAGING_SETUP.md) and [DEPLOYMENT_RUNBOOK.md](DEPLOYMENT_RUNBOOK.md): configure the shared `DOCS_GITHUB_TOKEN` PAT, production Vercel resources/credentials, canonical origins, and analytics; review/merge the PRs in dependency order; bootstrap staging and real release history; resolve historical missing docs/media and ambiguous old Motion tags; verify legacy sitemap URLs/anchors; test a real cross-repository main event and stable release; rehearse rollback; then switch DNS.

Created private `poly-hammer/poly-hammer-docs-snapshots`, the main-only `docs-staging` GitHub environment, and the non-secret archive/team/project/origin variables. On November 16, the user authorized Vercel CLI login; the authenticated Owner account created `polyhammer-docs-staging` (`prj_Id78qUcRHvH0zxvJY1aGfHnDdPbl`) in team `team_2AUg4TXhG3hWfKBugsYxrB2T`. The project uses Node.js 24, Next.js, standard resources, all-deployment authentication, and assigned hostname `polyhammer-docs-staging.vercel.app`. The migration worktree is linked to it. MCP read checks pass, but MCP project creation still returns 403; CLI operations work. Publication remains disabled with `DOCS_PIPELINE_ENABLED=false` and `DOCS_PRODUCTION_ENABLED=false`. Both Vercel secret names are verified in `docs-staging`; their values remain untested until deployment. The shared `DOCS_GITHUB_TOKEN` PAT is the remaining staging credential to configure. No documentation deployment, production domain mapping, or production DNS change has occurred.

The add-ons still carry unused MkDocs development dependencies in their existing locked Python environments. The runtime/docs workflows no longer use them; remove those packages when refreshing locks in full checkouts with their native wheels available. The source utility checkout also lacks Motion/Generate packager modules; verify the currently installed packaging distribution before enabling those product release jobs.
