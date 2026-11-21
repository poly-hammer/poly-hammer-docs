# Poly Hammer documentation agent instructions

This repository uses **Fumadocs**, Next.js App Router, React, TypeScript, and the Black theme. Do not introduce MkDocs or use the retired Python build commands.

Use **Poly Hammer** (two words, capital P and H) in all visible text and metadata. Preserve existing domain names, repository slugs, and code identifiers. The documented add-ons are Character DNA, Character Control Rig, Character Assembly, and Poly Hammer Motion; do not publish Poly Hammer Generate documentation.

## Content ownership

- Author Portal, Unreal plugin, CLI, and shared pages in `content/authored/`.
- `content/published/` is the generated, visibility-filtered copy of central content. Never author there. `DOCS_HIDDEN_PATHS` is a JSON array of route prefixes; the pipeline pins each channel's visibility policy before building. Production defaults exclude CLI and Motion; do not reintroduce hidden products through cards, metadata, search, Markdown, MCP, redirects, or media.
- Blender add-on documentation is owned by each add-on repository's `docs/` folder. Change its source repository, not generated `content/synced/` or `public/docs-assets/`.
- Keep internal plans outside `docs/`. Directories named `plans` are excluded from collection and publication, including historical snapshots and local previews.
- Use **Blender Addons** for the section name. Major navigation icons inherit text color to work in both themes; mark decorative icons as hidden from assistive technology.
- `docs-sources.json` registers products and their approved documentation subtrees. Never clone private add-on code into this site or expose credentials in a catalog, URL, artifact, or build log.
- Use YAML `title` and `description`, one layout H1, descriptive H2/H3 headings, fenced examples, relative source links, and `meta.json` navigation. Synced MDX is restricted data: no imports, exports, executable expressions, or scripts. Existing literal JSON style objects are allowed by the validator.
- Shared media components are `DocVideo`, `DocImage`, and `YouTubeEmbed`; use `Callout` for notes. Include useful alt text and explain instructional media in surrounding prose. Do not invent transcripts.

## Agents, AEO, and SEO

Agent compatibility is a primary product requirement. Any content or component change must retain useful output in `.md`, `llms.txt`, `llms-full.txt`, product/version bundles, and the read-only `/api/mcp` tools. Use `asMarkdown()` for custom components. Keep explicit product/version context and stable citation URLs.

Production search and default agent indexes select the latest stable version of each product. Historical versions must remain queryable by exact version. Unavailable versions must never fall back silently. Staging `next` is clearly unreleased and is excluded entirely from production inputs. Keep canonical metadata, truthful structured data, crawlable HTML, a sitemap, and staging noindex. Do not promise search rankings or fabricate an AEO score.

## Publication invariants

- Production is a pinned site commit plus independently pinned release snapshots, never a copy of staging.
- Releases are immutable. A backfilled older release must not move `latest` backwards. Moving a published tag or replacing its source identity must fail.
- The Python collector only reads registered docs trees. Build jobs have no source/archive/state/deployment credentials. Review MDX before compilation.
- Desired state is persisted on `docs-state` before building. Deployment records are written only after smoke tests and promotion. Preserve retry/idempotency, compare-and-swap updates, and scheduled reconciliation.
- Site changes go to staging on main. Promote a reviewed main commit explicitly when publishing central docs or site code to production.

## Validation

Read `README.md` and `DEPLOYMENT_RUNBOOK.md` for commands. Run `npm test`, Python pipeline tests, content preparation/validation, typechecking, and a production build. Use `scripts/smoke.mjs` against the running build for HTML, Markdown, MCP, search, and version isolation. Never deploy synthetic fixtures or local overrides. The docs repository uses `GH_PAT` for private documentation collection and archive writes. Add-ons pass their existing `GH_PAT` secret to the notifier's `GH_PAT` input; do not require duplicate add-on secrets. Keep PATs out of build jobs and Vercel; store Vercel credentials in the documented GitHub environments. Do not add GitHub App setup requirements.
