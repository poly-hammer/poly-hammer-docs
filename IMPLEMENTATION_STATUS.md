# Fumadocs implementation status

Updated November 14, 2026 (America/Chicago). The migration branches are pushed with open PRs, and local plus GitHub documentation CI checks passed. Staging infrastructure setup has started; no Vercel deployment or production cutover has occurred.

## Branches and worktrees

All worktrees are under `E:\repos\poly-hammer-workflows\.worktrees\`. Original working copies and unrelated changes were preserved.

| Repository | Branch | Worktree | Commit |
| --- | --- | --- | --- |
| poly-hammer-docs | `codex/fumadocs-site` | `docs-site` | See branch HEAD |
| character-dna-addon | `codex/fumadocs-dna-docs` | `dna-docs` | `a1d617c7e2a5161c8e4c2f253673d61653ab20a0` |
| character-control-rig-addon | `codex/fumadocs-control-rig-docs` | `control-rig-docs` | `465b6cdcb9b33eee14f94d3344f086b0a981a295` |
| character-assembly-addon | `codex/fumadocs-assembly-docs` | `assembly-docs` | `7f2535e371c69f43e79ca2eda6e6445b21f8b274` |
| ph-motion-addon (Motion and Generate) | `codex/fumadocs-motion-docs` | `motion-docs` | `3f479c3d4888eafbd8393345419a965f4ebb090e` |
| poly-hammer-workflows | `codex/fumadocs-notifications` | `docs-workflows` | `39a8928ba112ccf9d3054f6659bd8be7e6f9e667` |
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

Follow [STAGING_SETUP.md](STAGING_SETUP.md) and [DEPLOYMENT_RUNBOOK.md](DEPLOYMENT_RUNBOOK.md): configure scoped GitHub Apps, Vercel access/projects, credentials, canonical origins, and analytics; review/merge the PRs in dependency order; bootstrap staging and real release history; resolve historical missing docs/media and ambiguous old Motion tags; verify legacy sitemap URLs/anchors; test a real cross-repository main event and stable release; rehearse rollback; then switch DNS.

Created private `poly-hammer/poly-hammer-docs-snapshots`, the main-only `docs-staging` GitHub environment, and the known non-secret archive/team variables. Publication remains disabled with `DOCS_PIPELINE_ENABLED=false`; production has a separate `DOCS_PRODUCTION_ENABLED=false` gate for staging-only activation. Vercel creation in team `team_2AUg4TXhG3hWfKBugsYxrB2T` failed with HTTP 403; the supported CLI fallback had no saved credentials and its login flow was cancelled. No Vercel project, deployment, GitHub App, credential, domain, or DNS record was created or modified.

The add-ons still carry unused MkDocs development dependencies in their existing locked Python environments. The runtime/docs workflows no longer use them; remove those packages when refreshing locks in full checkouts with their native wheels available. The source utility checkout also lacks Motion/Generate packager modules; verify the currently installed packaging distribution before enabling those product release jobs.
