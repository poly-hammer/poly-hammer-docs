# Polyhammer documentation migration plan

**Prepared:** November 14, 2026

**Target repository:** `E:\repos\poly-hammer-docs`

**Status (November 18):** All seven `codex/fumadocs-*` branches are pushed with PRs. Local validation and the GitHub staging/production documentation CI matrix passed. The private archive, GitHub staging environment, and protected Vercel staging project are configured; both Vercel secrets are present in `docs-staging`. GitHub authentication uses the docs repository's `GH_PAT` and each add-on's existing `GH_PAT`, without GitHub Apps or duplicate add-on secrets. All five repository secret names are verified; fine-grained and classic PATs are supported. Effective credential permissions, real historical backfill, first staging deployment, and production cutover remain to be verified or completed. See [STAGING_SETUP.md](STAGING_SETUP.md), [DEPLOYMENT_RUNBOOK.md](DEPLOYMENT_RUNBOOK.md), and [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md).

**Agent compatibility is a primary requirement.** The implementation includes a read-only Streamable HTTP MCP endpoint, version-aware Markdown, `llms.txt`/`llms-full.txt`, exact-version bundles, canonical URLs, structured metadata, and updated add-on agent instructions. Search visibility and answer-engine rankings are goals measured after publication, not guaranteed scores.

## 1. Objective and agreed scope

Rebuild the Polyhammer documentation site using **Next.js, Fumadocs UI and Fumadocs MDX, the Fumadocs Black theme, and Vercel**. Replace the existing MkDocs build and deployment pipeline with explicit documentation synchronization, independent staging and production snapshots, and historical documentation versions for Blender add-ons.

The user authorized choosing GitHub Pages or Vercel; this plan selects Vercel for separate deployment targets, prebuilt uploads, deployment validation, promotion, and rollback.

The migration includes existing documentation, instructional media, navigation, branding, search, analytics, useful Markdown-copy functionality, URLs and redirects, and contributor instructions. Custom particle backgrounds, the glowing cursor, and animation-specific page-transition code are excluded. Instructional videos and animated GIFs remain in scope.

The site will have four main sections:

1. Blender Add-ons.
2. Unreal Plugins.
3. Polyhammer Portal.
4. Polyhammer CLI.

Blender add-on documentation remains authored beside the add-on code and is synchronized on repository events. Unreal, Portal, and CLI documentation remains authored directly in the docs repository initially. The source registry must allow additional event-driven documentation sources later.

### Non-negotiable publishing rules

- Every push to an add-on's `main` branch requests a staging build; do not restrict this trigger to `docs/**` changes.
- Only a verified stable production release advances an add-on's production documentation.
- Releasing one add-on must not publish another add-on's unreleased documentation.
- An add-on release must not publish unapproved docs-site application changes or centrally authored documentation.
- Historical release documentation must remain accessible through an add-on-specific version dropdown.
- A failed sync, validation, build, or deployment must leave the live site intact.
- Published source snapshots, assets, and deployment provenance must be recoverable and auditable.
- Only approved documentation content is transferred from private repositories into build inputs and public outputs.

## 2. Evidence and current-state inventory

This plan is based on inspection of the local documentation sources, the docs site's sync script and workflow, the add-on notification and release workflows, the shared workflow repository, the release helper, the live sitemap, and current official Fumadocs, GitHub, and Vercel documentation. Counts describe the inspected working-tree snapshots, not every historical release. Compatibility findings are a static audit, not a completed Fumadocs compilation test.

### 2.1 Source inventory

| Source | Markdown pages | Ownership and current state |
| --- | ---: | --- |
| `character-dna-addon/docs` | 23 | Synced by the current central configuration |
| `character-control-rig-addon/docs` | 5 | Synced; local aggregated copies contain older documentation |
| `character-assembly-addon/docs` | 3 | Synced by the current central configuration |
| `ph-motion-addon/docs` | 4 | Includes Motion and Generate; has a docs workflow but is absent from the central source list |
| Centrally authored docs | 3 | Homepage, Portal extension-repository instructions, Interchange getting-started guide |
| **Total current source inventory** | **38** | Includes four Motion/Generate pages to add to the consolidated site |

The [published sitemap](https://docs.polyhammer.com/sitemap.xml), inspected on November 14, 2026, contains 34 pages, matching the three configured add-on sources and three centrally authored pages. The four Motion/Generate pages account for the difference from the migration inventory.

The docs repository's generated local copies are not authoritative. Use each add-on repository for current source content; use live pages, the sitemap, and older copies to identify existing and historical URLs. Production inputs must ultimately come from verified release commits.

### 2.2 Existing pipeline and limitations

| Existing file or area | Finding | Consequence |
| --- | --- | --- |
| `poly-hammer-docs/scripts/sync_docs.py` | Shallow-clones entire repositories at their default branches | Cannot reproduce release-specific content; downloads more than documentation |
| Same sync script | Reuses cached clones unless forced | Local previews can use stale source content |
| Same sync script | Copies docs and patches markers in `mkdocs.yml` | Transport and navigation generation are tightly coupled |
| `poly-hammer-docs/.github/workflows/docs.yml` | One GitHub Pages production target | No separate staging deployment or release-isolated content selection |
| Add-on `.github/workflows/docs.yaml` files | Mostly trigger on changes under `docs/**` | Does not meet the requested every-main-push staging behavior |
| `poly-hammer-utils/src/poly_hammer_utils/addon/release.py` | Existing docs dispatch has an empty client payload | Receiver cannot identify the source, exact commit, or release |
| `poly-hammer-utils/src/poly_hammer_utils/extension/release.py` | Release creation does not explicitly pin the tested commit; existing releases may be deleted/recreated | Release-to-docs identity needs strengthening |
| Central `pyproject.toml` source list | Omits `ph-motion-addon` | Motion's notification cannot make its documentation appear |
| `scripts/hooks.py` and `overrides/` | MkDocs/shadcn fixes and Jinja templates | Replace their user-facing behavior using Fumadocs/React; remove obsolete runtime patches |

The current central theme is **mkdocs-shadcn**. The verified upstream maintenance announcement concerns **Material for MkDocs**, whose maintenance ends May 5, 2027. MkDocs core's repository did not display an archival notice when inspected. The architecture and publishing requirements are sufficient reasons for this migration without relying on a claim that every MkDocs project is discontinued. [Material announcement](https://github.com/squidfunk/mkdocs-material/issues/8523), [MkDocs core](https://github.com/mkdocs/mkdocs).

### 2.3 Publication and content exceptions

- Character DNA's `plans/test-suite-refactor.md`, `pro-features/mesh-editor.md`, and `workflows/custom-topology-metadata.md` are absent from its current navigation but appear in the live sitemap. Preserve existing published content by default; record any deliberate retirement before cutover. Navigation exclusion is not a publication or privacy boundary.
- Motion's development guide links to `../../native/README.md`, outside `docs/`. Move the public explanation into `docs/`, summarize it, or use an appropriate repository link. Do not widen the synchronizer to arbitrary source files to satisfy this link.
- Motion and Generate share one repository and have separate release jobs. Define product-specific version ownership before enabling their production version catalog.
- Character Control Rig has undergone a page reorganization. Include older guide URLs in the redirect inventory even if they no longer occur in the current sitemap.

## 3. Markdown compatibility and conversion

### 3.1 Measured conversion scope

The special-syntax scan excluded fenced code. Categories overlap.

| Feature | Observed scope | Required treatment |
| --- | ---: | --- |
| Ordinary Markdown bodies without the special constructs below | 11 pages | Mainly frontmatter and link preparation |
| MkDocs admonitions, such as `!!! note` | 42 blocks in 21 pages | Convert to Fumadocs callouts |
| Python-Markdown attribute lists | 12 occurrences in 6 pages | Convert image classes/sizing into supported components or styles |
| HTML media/layout markup | 22 pages | Normalize markup and media paths |
| Embedded videos | 25 placements | Preserve media, posters, controls, accessibility text, and fallbacks |
| YouTube embeds | 2 | Convert to a responsive embed component |
| YAML frontmatter | None of the 38 pages | Add titles and useful descriptions |
| Source navigation | Four add-on configurations | Convert ordering, groups, and labels to Fumadocs metadata |

All 38 documents are migration candidates. At least 27 need more than basic metadata preparation. Prose, headings below the page title, lists, tables, links, and fenced code should largely carry over. Fumadocs supports Markdown/MDX and GitHub-flavored Markdown. Its standard layout renders the page title from frontmatter. [Markdown documentation](https://www.fumadocs.dev/docs/next/markdown).

### 3.2 Authoring format

- Retain `.md` for simple documents.
- Use `.mdx` for pages that benefit from shared components.
- Add `title` and, where useful, `description` frontmatter. Preserve separate sidebar labels when they differ from page titles.
- Remove a duplicated leading H1 when the layout supplies it. Audit pages containing multiple H1s rather than deleting them blindly.
- Preserve important existing heading IDs, or provide explicit anchor aliases.
- Keep source-owned navigation in `docs/meta.json` files.
- Define a documentation format version inside the docs subtree so the synchronizer does not need to inspect application code.
- Reject unknown conversion constructs with an actionable report; do not silently discard them.

Create a small set of shared components: `DocVideo`, `YouTubeEmbed`, screenshot/image styling, and side-by-side image layouts. Map note/info, warning, tip, and other callout categories deliberately. Preserve semantic content while replacing repeated inline presentation markup.

Do not blindly rename all files to `.mdx`: literal braces, angle brackets, HTML attributes, void tags, and comments can require changes under MDX parsing. Use parser-aware transformations and a reviewed conversion report. Keep the pinned compiler preset consistent; preserve Fumadocs defaults when extending compiler options.

### 3.3 Media and link conversion

The current sources mix two path conventions:

- Markdown links and images generally resolve relative to the Markdown source file.
- Raw HTML media often resolves relative to the rendered MkDocs page URL.

A path such as `../../images/...` can therefore be valid in the current rendered page and invalid relative to its source file. The converter must understand which convention applies, not apply a universal string replacement.

Resolve links to their intended source targets, then emit normalized URLs under the selected product/version namespace or a shared content-hash asset namespace. Validate `src`, `poster`, `href`, Markdown references, downloads, and iframe URLs. Preserve instructional WebM, GIF, AVIF, PNG, and other required assets.

### 3.4 Legacy releases

Source branches can adopt the new authoring contract, but existing release tags will still contain MkDocs content. Maintain a deterministic legacy adapter for these snapshots. Store reviewed legacy navigation mappings centrally, keyed to their relevant source revisions, instead of fetching root-level `mkdocs.yml` during normal docs-only synchronization.

Archive both the approved source material and normalized renderable content, together with conversion metadata. Old snapshots should not silently change when the converter changes. A corrected conversion creates an explicit documentation revision.

The legacy adapter can be removed only when no retained snapshot requires it, or when all affected snapshots have an audited normalized representation that no longer depends on that adapter at build time.

## 4. Site architecture and visual design

### 4.1 Information architecture

| Main section | Base URL | Initial content ownership |
| --- | --- | --- |
| Blender Add-ons | `/blender-addons/` | Synced add-on sources; centrally authored section landing page |
| Unreal Plugins | `/unreal-plugins/` | Docs repository; Interchange is the first plugin |
| Polyhammer Portal | `/portal/` | Docs repository |
| Polyhammer CLI | `/cli/` | Docs repository |

Each add-on gets a product landing page, current documentation, and independent version catalog. Portal, Unreal, and CLI remain unversioned initially. A CLI landing page can identify the scope of future documentation without inventing unsupported instructions.

Use Fumadocs collections for independent content roots and a combined, namespaced source/page tree. Fumadocs supports collections, multiple sources, and root folders for scoped navigation. This eliminates central YAML patching and Markdown concatenation. Authentication, synchronization, release selection, and archival remain our application/pipeline responsibilities. [Collections](https://www.fumadocs.dev/docs/mdx/collections), [multiple sources](https://www.fumadocs.dev/docs/headless/source-api/source), [page conventions](https://www.fumadocs.dev/docs/headless/page-conventions).

### 4.2 Framework and hosting choices

- Next.js with Fumadocs UI and Fumadocs MDX.
- TypeScript for the application and content integration.
- A pinned supported Node.js version, a locked JavaScript dependency graph, and locked Python sync dependencies.
- One docs application; no initial requirement for Turborepo or multiple application packages.
- Pre-render documentation pages where practical; use the supported search integration on Vercel.
- Keep the application compatible with static content delivery. A pure static export is optional, not a launch requirement; it requires explicit static search configuration. [Fumadocs static builds](https://www.fumadocs.dev/docs/next/deploying/static).

### 4.3 Black theme and retained functionality

Use the actual Black preset, with dark mode as the default and a retained theme toggle:

```css
@import 'tailwindcss';
@import 'fumadocs-ui/css/black.css';
@import 'fumadocs-ui/css/preset.css';
```

Preserve the Polyhammer logo, favicon, relevant section icons, footer/social links, analytics, responsive navigation, page table of contents, code highlighting/copying, and useful Markdown-copy or raw-document access. Replace the homepage with clear entry cards for the four sections. Avoid porting the old stylesheet wholesale; preserve intentional behavior through small components and theme overrides. [Fumadocs themes](https://www.fumadocs.dev/docs/ui/theme).

Remove particle backgrounds, cursor effects, animation-related opacity/navigation scripts, obsolete Jinja templates, and MkDocs-specific monkey patches after cutover.

## 5. Versioned add-on documentation

### 5.1 Confirmed framework support

Fumadocs supports versioning part of a documentation site using typed root folders. Version folders marked with `root: "version"` under the same parent form a dropdown group. The selected version gets its own sidebar. Switching versions opens the equivalent page when present, otherwise that version's index. Nested dropdown groups allow section and version selection to coexist. [Official versioning guide](https://www.fumadocs.dev/docs/next/navigation#versioning), [dropdown groups](https://www.fumadocs.dev/docs/ui/layouts/docs#tabs-groups).

Example generated metadata, using the user's illustrative version number rather than asserting the current release:

```json
{
  "title": "0.15.0",
  "root": "version"
}
```

Generate version ordering and the `Latest` label from the catalog. Do not rely on alphabetical ordering. Scope version groups beneath each product. Product switching should open that product's appropriate default rather than assuming different products share version numbers.

### 5.2 URL model

| URL | Meaning |
| --- | --- |
| `/blender-addons/character-dna/0.15.0/` | A specific, retained release's documentation |
| `/blender-addons/character-dna/0.14.0/` | An older retained version |
| `/blender-addons/character-dna/latest/` | Moving alias to the current stable version |
| `/blender-addons/character-dna/` | Entry point to the current stable documentation |
| Staging `/blender-addons/character-dna/next/` | Main-branch documentation, labeled `Unreleased` |

Use stable version URLs for sharing and citations. Use temporary redirects for moving aliases so clients do not permanently cache an older default. Do not render duplicate page copies under both `latest` and the numbered URL. Canonical URLs identify the numbered version.

Apply the same pattern independently to other add-ons. Specific version content remains stable, while the shared site layout and theme may evolve. This is content versioning within one application, not a promise to freeze an entire old website's dependencies and appearance.

### 5.3 Latest-version policy

- Include verified, published, non-prerelease production versions.
- Select the default using an explicit product policy and semantic version ordering.
- Publishing an older maintenance release adds it to the catalog without automatically making it `latest`.
- Support an audited override for withdrawn releases or a different supported default.
- Drafts, prereleases, and staging snapshots do not advance production's stable pointer.
- Every version published through the new pipeline is retained unless deliberately retired through a reviewed policy.

The dropdown shows only available, validated versions. Never offer a version whose pages or required assets were not successfully built.

### 5.4 Historical backfill and corrections

Inventory release tags and resolve each to its actual commit. Backfill only documentation that can be reconstructed from that release or another explicitly approved historical source. Do not label today's documentation as an old release when the old release had none.

Backfill in reviewed batches: fetch the release docs and media, apply the legacy adapter, validate, archive the snapshot, and add it to the catalog. Large historical backfills can follow the initial launch.

Documentation corrections create a new audited docs revision for the same product version, preserving the prior archive bundle. The public product-version URL can render the approved corrected revision. This must not move the add-on's release tag. Store correction provenance as a docs patch/revision or another explicit approved source.

Deleting or recreating a GitHub release must not automatically erase historical documentation. Treat unexpected identity or commit changes as an exception requiring review.

### 5.5 Version-aware links and search

- Internal links within an add-on resolve within the active version.
- Cross-product links use a declared compatible version where needed, or clearly intentional links to current documentation; do not silently assume versions align across products.
- Preserve anchors when switching versions where available. Add explicit mappings for important renamed pages; use the framework's index fallback for absent pages.
- Show an older-version banner with the selected version and a link to the latest release.
- Search within an add-on defaults to its active product/version. Provide explicit broader search.
- Site-level search defaults to current documentation, avoiding dozens of indistinguishable historical hits.
- Ensure search and sitemap generation use the deployed catalog, not every file present in a cache.

Fumadocs search supports tag filtering. Populate a product/version tag and configure the client to select it from the current page context. [Search filtering](https://www.fumadocs.dev/docs/headless/search/orama#tag-filter).

## 6. Repository layout and configuration contract

The following is a proposed layout, not an assertion that these files already exist:

```text
E:/repos/poly-hammer-docs/
  app/                          Next.js routes and layouts
  components/docs/              Shared documentation components
  lib/source.ts                 Source mounts, URL mapping, navigation
  source.config.ts              Fumadocs collection schemas
  docs-sources.json              Source registry
  content/
    authored/
      blender-addons/            Section landing content
      unreal-plugins/
      portal/
      cli/
    synced/                     Generated and ignored by Git
      character-dna-addon/
        0.15.0/
        0.14.0/
        next/                   Staging/local builds only
      character-control-rig-addon/
      character-assembly-addon/
      ph-motion-addon/
  public/
    assets/                     Central branding/media
    docs-assets/                Generated versioned/content-addressed media
  scripts/
    sync_docs.py
    convert_legacy_docs.*
    validate_docs.*
    validate_event.*
    update_catalog.*
  tests/                        Pipeline and migration acceptance tests
  .github/workflows/
    validate.yml
    receive-docs-event.yml
    deploy-docs.yml
    reconcile-docs.yml
```

The application maps source IDs to public slugs; repository names do not dictate the public URL. Define collections per stable content source and discover retained versions beneath it, avoiding a new handwritten application configuration for every release. Merge sources with explicit namespaces and collision checks. Generated version metadata must not overwrite source-owned page navigation.

### 6.1 Source registry

Each source entry defines:

- Stable source/product ID and display name.
- Provider, repository, and documentation subtree.
- Public URL mount.
- Main branch and release-selection policy.
- Product mapping when a repository ships multiple products.
- Supported documentation-format versions and legacy adapter rules.
- Allowed file types and explicit publication inclusions/exclusions.
- Public/private source-link behavior.
- Versioning enabled/disabled and latest-selection policy.

Initially register the four Blender source repositories. The registry must support centrally authored sources and future externally synced Unreal, Portal, CLI, or other products without special-case transport code.

## 7. State, release catalogs, and durable archives

### 7.1 Separate channel state

Maintain persistent staging and production state, preferably on a dedicated `docs-state` branch. Keep generated content out of the application branch. State must be updated atomically, with conflict detection and retries.

| State | Required information |
| --- | --- |
| Staging desired state | Site commit, each source's main commit, `next` snapshot identities, retained release catalog references |
| Production desired state | Approved site commit, per-product version catalog, latest pointers, pending verified updates |
| Deployed state | Exact successful manifest/catalog revision, deployment ID, artifact digest, promotion time |
| Event receipts | Stable event ID, source identity, source commit/release, processing status, retry/error information |

The site commit pins both application code and centrally authored content. A production add-on release uses the currently approved site commit, not the docs repository's current `main`.

Distinguish requested state from successfully deployed state. Failed candidates remain visible as failures/pending work and must not be recorded as deployed. A subsequent release must not silently discard an earlier failed desired update; correct, retry, or explicitly revert that candidate.

### 7.2 Version record

Each retained product version records:

- Product version and documentation revision.
- Source repository identity, release ID, and original tag.
- Fully resolved commit SHA and docs tree identity.
- Archive location and cryptographic content digest.
- Source format, converter identity, and normalized-content format.
- Publication timestamp and explicit lifecycle/default status.
- Optional compatibility metadata for cross-product links.

Keep credentials out of manifests. Public build metadata should expose only intended public provenance; keep sensitive operational details in the private archive or workflow records.

### 7.3 Persistent storage

Use a dedicated private GitHub documentation archive repository with durable docs-only bundles attached to releases. This uses the existing GitHub ecosystem and avoids requiring a new storage provider for launch. Configure controlled writes and no automatic retention expiry for published bundles.

Each archive bundle contains approved documentation, navigation, required media, and integrity/provenance metadata. Retain original approved content plus normalized content where legacy conversion is necessary. Do not include add-on source code, `.git`, test fixtures, native libraries, environment files, or credentials.

Expiring GitHub Actions artifacts and caches are delivery/performance mechanisms, not the only copy of historical documentation. Staging bundles may be temporary; production history must be durable. Test recovery from the archive and maintain a backup/recovery policy.

Archive bundles can initially be self-contained. Deduplicate identical assets in published output and caches using content hashes. More elaborate archive deduplication is optional if storage growth later justifies it. Never overwrite an older version's asset URL with a newer file.

## 8. Python synchronization design

Keep Python for authenticated transport, immutable snapshot resolution, validation, and reporting. Remove full-repository cloning, add-on environment installation, and navigation patching from the normal synchronization path.

### 8.1 Fetch algorithm

1. Read the selected channel manifest/catalog and validate its schema.
2. For new snapshots, verify the source against the registry and resolve the exact commit.
3. Read tree metadata and descend only into the approved `docs/` subtree.
4. Download approved documentation blobs and media using authenticated GitHub APIs.
5. Handle truncated tree responses with complete traversal rather than accepting partial results.
6. Verify blob identities, allowed paths, file types, size limits, and required entry pages.
7. Detect LFS pointers and apply an explicit docs-only retrieval policy, or fail with instructions. Never silently publish pointer text.
8. Normalize content through the selected adapter and validate publication inventory.
9. Assemble the source in a temporary directory, then replace its generated destination only after success.
10. Emit a machine-readable source/change/error report and a deterministic bundle digest.

For existing production versions, reuse validated durable archives rather than refetching every historical repository tree on every deployment.

GitHub's blob API supports read access using repository Contents permissions and individual blobs up to 100 MB. Larger docs assets require an explicit alternative. The inspected current documentation contained no unresolved LFS pointers. GitHub permissions are repository-scoped; the synchronizer enforces the docs-only transfer boundary. [Git blob API](https://docs.github.com/en/rest/git/blobs).

### 8.2 Reliability and local development

- Cache blobs by immutable identity and archives by content digest.
- Use bounded concurrency, timeouts, rate-limit handling, and retry/backoff.
- Never fall back from a missing release snapshot to `main`.
- Fail if a configured source unexpectedly lacks documentation; do not quietly remove it.
- Reject traversal paths, symlinks escaping the source root, unexpected submodules, and duplicate/case-colliding output paths.
- Replacing generated source trees must remove stale files after rename/deletion without touching authored content.
- Support explicit local checkout overrides for previews, marked as development input and unavailable to production publishing.
- A warm or offline local preview can use a validated cached public/release snapshot; report which snapshot it is using.

## 9. Authentication and build isolation

Use **personal access tokens**, with `GH_PAT` in the docs repository for source reads/archive writes and each add-on's existing `GH_PAT` for notifications. The values need not be identical. This is the user-approved simplification of the earlier three-App design; no App registrations, IDs, PEM keys, installation-token actions, or duplicate add-on secrets are needed.

The docs collector's fine-grained PAT requires the four source repositories and `poly-hammer-docs-snapshots`, with repository **Contents: Read and write** and automatic Metadata read. GitHub applies write permission to every selected repository, although the collector only reads the sources. The earlier six-repository configuration is also compatible. Each add-on's `GH_PAT` must separately allow destination `poly-hammer/poly-hammer-docs` with Contents write to dispatch events; source-only access is insufficient. Classic PATs with **`repo`** scope work for either role but cannot be restricted to selected repositories. Organization policy, approval, SSO authorization, expiry, and the issuing user's membership can affect availability. [PAT setup](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens).

The user configured `GH_PAT` as a docs repository Actions secret. All four source repositories already have `GH_PAT`; callers map `GH_PAT: ${{ secrets.GH_PAT }}` into the reusable notifier. The archive is an API target and needs no stored secret. These credentials are repository secrets, outside `docs-staging`. Their names are verified; successful collection/dispatch runs must verify actual permissions. The built-in source `GITHUB_TOKEN` does not supply cross-repository access. [Dispatch permissions](https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event).

| Credential | Use and job boundary |
| --- | --- |
| `GH_PAT` in the docs repository | Source reads and archive writes only in the collection job |
| Existing `GH_PAT` in each add-on, mapped to the notifier's `GH_PAT` input | Typed repository-dispatch requests from trusted main/release workflows |
| Docs repository's built-in `GITHUB_TOKEN` | Durable `docs-state` writes; remains separate from the PAT |
| Environment-scoped Vercel credentials | Project settings, deployment, smoke checks, and promotion for the selected target |

Rotate the affected repository secrets before their tokens expire. A missing token fails with a configuration error. The archive uses documentation-only release assets and no workflow files, so the documentation operations do not require `workflow` or `admin:org`. Preserve any additional access existing `GH_PAT` consumers need for package releases when rotating those tokens. Never expose PATs to the compilation or Vercel deployment jobs.

Separate synchronization, compilation, and deployment jobs. Pass approved docs-only artifacts between them. Remove source-reader credentials before compiling content. Treat MDX as executable input: permit the agreed components, validate imports and expressions, and reject scripts, executable metadata, and includes outside allowed documentation roots. Fumadocs' include facilities are not a security boundary. [Include behavior](https://www.fumadocs.dev/docs/mdx/include).

Untrusted pull requests must not obtain private repository or deployment credentials. Validate authored changes against an approved public documentation baseline or sanitized release artifact; trusted post-merge jobs perform private synchronization. Do not run arbitrary PR content through privileged `pull_request_target` jobs.

Hide edit/source links that expose inaccessible private repositories. Protect staging access when it contains unreleased information, and set `noindex` as a separate search-engine policy. Confirm the chosen Vercel account supports the required protection, build sizes, and retention before provisioning.

## 10. Event contract and CI/CD workflows

### 10.1 Event matrix

| Event | Staging | Production |
| --- | --- | --- |
| Any configured add-on push to `main` | Update `next`; request build | No change |
| Stable, verified production release | May refresh release comparison choices without replacing `next` | Add version; advance latest if eligible; build |
| Draft/prerelease | Optional isolated preview | No stable catalog change |
| Docs repository merge to `main` | Update site/central-content commit; build | No change |
| Explicit docs-site release/publish | No required change | Advance approved site/central-content commit; keep add-on version snapshots |
| Pull request | Validate and optionally preview approved inputs | No publication |
| Retry/reconciliation | Repair requested state/build failures | Recover verified missing work without bypassing release policy |
| Rollback | Restore selected staging state if needed | Restore deployment and corresponding catalog/latest state |

The explicit docs-site release is the production path for Portal, Unreal, CLI, and application changes. It must not require manufacturing an add-on release. It is also the controlled path for documentation revisions and backfill publication.

### 10.2 Reusable source notifier

Add a small reusable docs notification workflow in `poly-hammer-workflows`. Each add-on invokes it from a main-push workflow and a release workflow. Pin shared workflow dependencies to reviewed revisions/releases.

Do not install Blender, native dependencies, or the entire add-on environment merely to send a documentation event.

Suggested payload fields:

```json
{
  "schema_version": 1,
  "source_id": "character-dna",
  "repository": "poly-hammer/character-dna-addon",
  "kind": "release-published",
  "commit_sha": "<fully-resolved-commit-sha>",
  "release_id": "<github-release-id>",
  "tag": "<release-tag>",
  "event_id": "<stable-deduplication-id>",
  "source_run_id": "<workflow-run-id>"
}
```

This is a proposed schema with placeholders, not a captured event. For main pushes, omit release-only fields. The receiver derives channel eligibility from verified facts; it does not trust a caller-supplied production flag, arbitrary repository, archive URL, or filesystem path.

### 10.3 Receiving and validating events

The receiver workflow must exist on the docs repository's default branch. Its control logic can run there, but the website build checks out the manifest's selected site commit.

Validate sender identity, source registration, payload schema, source commit, and event provenance. For releases, read the release through GitHub, reject drafts/prereleases, resolve the tag to the actual commit, and verify the product policy. Do not treat `target_commitish` or a version label alone as proof of exact source identity.

For main events, verify the source branch and ancestry/current-head relationship. Delayed events must not roll `next` back to an older commit. Every accepted main push requests a staging build; cached identical content may reduce fetch/build cost. A superseded deployment may be skipped while retaining processing records and ensuring the newest requested state is deployed.

### 10.4 Release trigger and package identity

Use `release: published` with stable-release filtering as the normal release event. GitHub suppresses most workflow events caused by `GITHUB_TOKEN`; publish package releases with the existing appropriate PAT or explicitly dispatch after successful production publication. Deduplicate when both paths exist. [Release events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#release), [token behavior](https://docs.github.com/en/actions/concepts/security/github_token).

Update release creation so that:

- The release tag points to the exact tested/package source commit.
- An existing tag is verified against that commit.
- Production package publication succeeds before the release becomes the docs-publishing signal.
- Published versions are not silently moved or deleted/recreated to overwrite identity.
- A manual release must meet the same exact-source and production-readiness contract.

For Motion and Generate, choose product-specific tags/metadata and docs mappings, or define an explicit aggregate release. One product's release must not publish unreleased documentation for the other product merely because they share a repository.

### 10.5 Concurrency, idempotency, and reconciliation

- Persist validated event receipts and requested catalog updates before relying on a deployment queue.
- Serialize production state changes and promotions; use compare-and-swap updates with retries for conflicts.
- Merge independent product updates rather than overwriting a whole catalog from a stale base.
- Key idempotency to source, event/release identity, resolved commit, and docs revision/digest as appropriate.
- Preserve immutable version entries when updating the latest pointer.
- Before promotion, confirm the candidate is still the intended deployment state.
- Use separate staging and production concurrency groups.
- `queue: max` can retain multiple pending GitHub Actions runs, but the queue is bounded; it does not replace durable state and recovery. [Concurrency documentation](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency).
- Add repository-native scheduled and manual reconciliation to detect missed notifications, pending desired state, and verified releases not yet archived/published. Do not create a Codex automation for this pipeline.
- Surface failures through workflow status and operational alerts configured during implementation. Do not create external messaging integrations without an explicit team choice.

## 11. Vercel build, deployment, and rollback

### 11.1 Targets

| Project | Proposed domain | Inputs |
| --- | --- | --- |
| `poly-hammer-docs-staging` | `staging.docs.polyhammer.com` | Staging manifest, current central content, add-on `next` and approved release comparisons |
| `poly-hammer-docs-production` | `docs.polyhammer.com` | Approved site commit and production version catalog |

Make GitHub Actions the deployment authority. Disable competing automatic Git deployments so an application push cannot bypass synchronization or promote incomplete content.

Build in Actions with frozen lockfiles and a pinned toolchain, then upload prebuilt output. Vercel does not need access to private add-on repositories. The official Vercel example supports building in CI and uploading prebuilt artifacts. [GitHub Actions integration](https://github.com/vercel/examples/tree/main/ci-cd/github-actions).

### 11.2 Production sequence

1. Select a complete candidate manifest and its approved site commit.
2. Retrieve validated archives and any newly verified snapshot.
3. Materialize the candidate versioned source tree and assets.
4. Validate content, links, publication inventory, application types, and build output.
5. Produce the prebuilt deployment using the production project's intended configuration.
6. Upload with `--prebuilt --prod --skip-domain` so the live domain remains unchanged.
7. Smoke-test the resulting deployment URL, including protected-deployment access where applicable.
8. Confirm the candidate has not been superseded, then promote that exact deployment.
9. Record the successful catalog, deployment ID, and artifact digest.

Vercel documents delayed domain assignment with `--skip-domain` and later promotion. [Deployment options](https://vercel.com/docs/cli/deploy).

Use separate analytics configuration and canonical host settings for staging and production. Production analytics should not be polluted by routine staging validation. Test redirects, media responses, search, mobile navigation, and accessibility on the actual deployed output.

### 11.3 Rollback and recovery

Retain the preceding deployment ID and its full manifest/catalog. Rollback restores both the hosted deployment and the intended/deployed state, including latest pointers. Record a rollback hold or approved desired-state revision so reconciliation does not immediately undo the rollback.

Keep a recoverable copy of the last MkDocs output and its source/build configuration during cutover. Test restoration before moving the production domain. Define who owns release failures, catalog corrections, domain changes, and rollback execution.

## 12. URL preservation, search, SEO, and publication policy

Create a version-controlled redirect inventory before migration. It must cover the live sitemap, internal links, older Control Rig pages, known product aliases, and previously published asset URLs. Inspect available access/search data during implementation if it can identify important URLs missing from source history.

| Existing prefix | New route family |
| --- | --- |
| `/character-dna-addon/` | `/blender-addons/character-dna/latest/` |
| `/character-control-rig-addon/` | `/blender-addons/character-control-rig/latest/` |
| `/character-assembly-addon/` | `/blender-addons/character-assembly/latest/` |
| `/poly-hammer-interchange/` | `/unreal-plugins/poly-hammer-interchange/` |
| `/poly-hammer-portal/` | `/portal/` |

Use permanent redirects for stable structural moves and temporary redirects for the moving latest target. Apply specific renamed-page and media rules before broad prefix rules. Avoid loops and unnecessary chains where possible. New internal links should point directly to their intended final routes.

Preserve important heading IDs: URL fragments are not sent to the server, so a server redirect alone cannot repair a renamed anchor. Handle trailing slashes and `index` conventions consistently. A retired page needs an intentional replacement or retirement response rather than a blanket redirect to the homepage.

Use self-canonical numbered-version pages, older-version banners, appropriate page descriptions, and a sitemap derived from published pages. Decide historical search-engine indexing explicitly; never canonicalize semantically different historical documentation indiscriminately to the latest page.

Set staging/preview `noindex`, keep production canonical hostnames correct, and verify that unpublished or excluded files do not appear in pages, search results, sitemap entries, raw Markdown endpoints, or exported content.

## 13. Validation and acceptance criteria

### 13.1 Content and application validation

- Every current source page has an explicit migrated, retained, or approved-retired disposition.
- Titles, navigation order, callouts, tables, code, and page/anchor links are correct.
- All required images, videos, posters, GIFs, and iframe embeds render with the intended behavior.
- No source or public asset path accidentally depends on a local checkout location.
- Desktop and mobile layouts, keyboard navigation, focus behavior, theme selection, search, and video controls are usable.
- No duplicated H1, broken sidebar item, URL collision, or missing version index.
- Redirect targets and canonical URLs agree with the migration map.
- Staging is excluded from production analytics and indexing.
- Raw/processed Markdown output does not expose private paths or excluded content.

### 13.2 Versioning and pipeline scenarios

| Scenario | Expected result |
| --- | --- |
| Add-on A releases while B has unreleased main changes | Only A's production catalog changes |
| Add-on release while central docs have unapproved changes | Build uses the approved site/central-content commit |
| New release | New version appears; prior pages and media remain intact |
| Older maintenance release | Added to dropdown; latest remains correct |
| Missing equivalent page during version switch | Opens mapped replacement or selected version's index |
| Product switch | Uses that product's own version policy |
| Duplicate event | Idempotent processing; no duplicate version or unnecessary state regression |
| Delayed main/release event | Does not regress selected state |
| Two concurrent product releases | Both updates survive and are eventually deployed |
| Failed sync/build/smoke test | Live deployment and deployed manifest remain unchanged |
| Missing release docs | Explicit failure; no fallback to main |
| Renamed/deleted source file | No stale generated page or asset remains unintentionally |
| Missing or moved tag | Archived history remains recoverable; unexpected identity changes are flagged |
| Untrusted PR | No private source or deployment credentials are available |
| Historical docs correction | New audited docs revision, prior archive retained, product tag unchanged |
| Rollback followed by reconciliation | Rolled-back state remains active until deliberately advanced |
| Rebuild from archives and lockfiles | Same approved content and provenance are recoverable |

Write meaningful unit/integration tests for event validation, source selection, semantic version handling, path safety, catalog merging, idempotency, and legacy conversion. Use representative real pages for end-to-end rendering checks and production-like deployment smoke tests. This planning task does not itself claim those tests have run.

## 14. Implementation phases and deliverables

| Phase | Deliverables | Exit condition |
| --- | --- | --- |
| 1. Inventory and contracts | Current/historical URL list, asset inventory, source registry, publication policy, release mappings, initial manifests | Every source and current page has an explicit disposition; initial production source commits are verified |
| 2. Fumadocs/versioning prototype | Black theme, four sections, shared components, two DNA versions and an independently versioned second add-on | Nested navigation, version switching, media, search scoping, and fallback behavior work on desktop/mobile |
| 3. Current-content conversion | All 38 current documents, metadata, normalized assets, redirects, contributor instructions, legacy adapter | No unexplained missing content, links, anchors, or media |
| 4. Sync and archive layer | Python fetcher, local overrides, schemas, deterministic bundles, durable archive, scoped credentials | Reproducible docs-only snapshots from public/private sources and archived versions |
| 5. Release identity and event integration | Exact-commit release tags, shared notifier, receiver, persistent state, concurrency/reconciliation | Main events select staging; verified stable releases select only their product's production updates |
| 6. Deployment and historical pilot | Two Vercel projects, prebuilt deployment, smoke tests, promotion/rollback, initial historical backfill | Acceptance scenarios pass against deployed previews; rollback rehearsal succeeds |
| 7. Shadow operation and cutover | Compare output with MkDocs, monitor events, freeze/transfer pending work, switch domain | No dropped accepted events; new production is healthy; rollback path remains available |
| 8. Cleanup and continuing backfill | Remove obsolete MkDocs path, update authoring workflows, batch additional historical versions | One documented pipeline remains; historical additions follow the same release/catalog contract |

### Suggested implementation PR boundaries

1. Add source/publication schemas and migration inventories.
2. Add Fumadocs application and versioning prototype.
3. Add shared components, converters, source metadata, and current content migration.
4. Add synchronization, catalogs, archive storage, and focused tests.
5. Add source notifiers and strengthen release identity in the helper/workflows.
6. Add staging/production deployment, promotion, and reconciliation.
7. Add verified historical versions and complete URL mappings.
8. Cut over, update contributor docs/tasks, and remove obsolete MkDocs dependencies/templates/workflows.

Deploy the new application to staging before removing the current production pipeline. Enable one test source/event path first, verify it, then expand to all configured sources. Keep cutover coordination explicit so an event arriving during the transition is reconciled into the new catalog.

## 15. Effort, risks, and implementation decisions

### 15.1 Estimate

Allow approximately **15–23 engineering days** for the initial 38-page migration, version catalogs, durable archives, and CI/CD redesign, followed by several days of shadow operation. This combines the earlier 12–18-day migration estimate with roughly 3–5 additional days for versioning-related pipeline work. Historical backfill beyond the pilot is additional and depends on release count, missing assets, and legacy content quality.

The estimate assumes no major prose rewrite and straightforward PAT, archive-repository, Vercel, and domain setup. It is a planning estimate, not a measured implementation schedule.

### 15.2 Main risks and mitigations

| Risk | Mitigation |
| --- | --- |
| HTML paths depend on MkDocs output URLs | Context-aware conversion plus page/media validation |
| Historical tags lack useful docs or assets | Honest availability inventory; batch validated backfill |
| Release tag does not identify the shipped commit | Strengthen release helper and verify exact commit before publishing |
| Private or internal files enter public output | Explicit publication contract, docs-only fetches, isolated compilation, artifact checks |
| Concurrent events overwrite or regress catalog state | Durable receipts, atomic updates, serialized promotions, reconciliation |
| Media and version count increase build size/time | Immutable caches, published asset deduplication, measure builds before broader backfill |
| Shared renderer changes break old normalized content | Versioned format contract and archived-page regression fixtures |
| Unversioned URLs or old anchors break | Complete redirect inventory and preserved IDs |
| Rollback is undone automatically | Restore desired/deployed state and record a rollback hold |

### 15.3 Decisions to finalize during implementation

These are implementation inputs, not reasons to delay preparing this plan:

- Confirm staging hostname availability and Vercel access-protection/account capabilities.
- Confirm exact initial stable release commits and the oldest historical versions worth backfilling first.
- Define Motion versus Generate version/tag ownership and cross-product compatibility rules.
- Record any intentional retirement of already published non-navigation pages; preserve them by default until decided.
- Select operational owners and notification destinations for failed docs releases.
- Confirm archive backup/access policy and the explicit process for docs-only corrections.
- Pin and validate the exact Fumadocs/Next.js versions used by the prototype before bulk conversion.

## 16. Completion definition

The migration is complete when the Fumadocs Black site serves all approved existing content and required media, all four main sections are present, add-ons have independent version dropdowns, verified historical versions remain accessible, every configured main push requests staging, stable releases publish isolated production updates, central docs have an explicit production publishing path, redirects and version-aware search work, private source code stays out of public artifacts, rollback has been rehearsed, and the obsolete MkDocs publishing path has been retired.

## 17. Source references

Official references were consulted on November 14, 2026. Recheck exact APIs and pin package/action versions during implementation.

- [Fumadocs overview](https://www.fumadocs.dev/docs)
- [Collections](https://www.fumadocs.dev/docs/mdx/collections)
- [Multiple content sources](https://www.fumadocs.dev/docs/headless/source-api/source)
- [Page slugs, metadata, and root folders](https://www.fumadocs.dev/docs/headless/page-conventions)
- [Markdown and components](https://www.fumadocs.dev/docs/next/markdown)
- [Themes, including Black](https://www.fumadocs.dev/docs/ui/theme)
- [Partial-site and full-site versioning](https://www.fumadocs.dev/docs/next/navigation#versioning)
- [Nested dropdown groups](https://www.fumadocs.dev/docs/ui/layouts/docs#tabs-groups)
- [Search tag filtering](https://www.fumadocs.dev/docs/headless/search/orama#tag-filter)
- [Static builds](https://www.fumadocs.dev/docs/next/deploying/static)
- [Include behavior](https://www.fumadocs.dev/docs/mdx/include)
- [GitHub repository dispatch](https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event)
- [GitHub Git blobs](https://docs.github.com/en/rest/git/blobs)
- [GitHub release workflow events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#release)
- [GitHub token event behavior](https://docs.github.com/en/actions/concepts/security/github_token)
- [GitHub workflow concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)
- [Vercel GitHub Actions example](https://github.com/vercel/examples/tree/main/ci-cd/github-actions)
- [Vercel deployment and promotion options](https://vercel.com/docs/cli/deploy)
- [Current Polyhammer sitemap](https://docs.polyhammer.com/sitemap.xml)

Local evidence includes `mkdocs.yml`, `pyproject.toml`, `scripts/sync_docs.py`, `scripts/hooks.py`, `.github/workflows/docs.yml`, `overrides/`, and authored `docs/` in `E:\repos\poly-hammer-docs`; documentation and workflows in the four inspected add-on repositories; release workflows in `E:\repos\poly-hammer-workflows`; and release helpers in `E:\repos\poly-hammer-utils`.
