# Polyhammer documentation

The site uses **Fumadocs with the Black theme**, Next.js, and Vercel. It serves both human documentation and version-aware agent interfaces. See [the migration plan](FUMADOCS_MIGRATION_PLAN.md) and [deployment runbook](DEPLOYMENT_RUNBOOK.md).

## Local development

Use Node.js 24 LTS and Python 3.13. From this repository:

```sh
npm ci
cp docs.local.example.json docs.local.json
```

Edit the ignored `docs.local.json` to point at the add-on checkouts or their separate worktrees. Paths may be absolute or relative to this repository. Only the `docs/` directory is used. Motion and Generate can point to the same repository.

```sh
npm run docs:prepare
npm run docs:validate
npm run dev
```

Open `http://localhost:3000`. Re-run preparation after changing add-on docs. Local source overrides are forbidden in CI and production. To use actual archived release snapshots instead, omit `docs.local.json`, materialize the chosen catalog with `scripts/docs_pipeline.py`, and then run preparation.

## Authoring

Central docs live in `content/authored/{portal,unreal-plugins,cli}/`. Blender add-on pages live in each source repository's `docs/`. Both use Markdown/MDX, YAML `title`/`description`, and `meta.json` navigation. The layout supplies the H1; begin body sections at H2.

Use `Callout`, `DocVideo`, `DocImage`, and `YouTubeEmbed` instead of MkDocs extensions and raw video embeds. Source links and media should be relative to the document within `docs/`. The publishing step rewrites them to the selected release and content-addressed media. Shared application components are centrally supplied; synced documents cannot import or execute code. See [AGENTS.md](AGENTS.md).

## Agent access

- `/api/mcp`: Streamable HTTP with `list_versions`, `list_docs`, `search_docs`, and `read_doc`.
- `/llms.txt` and `/llms-full.txt`: current documentation index and bundle.
- Append `.md` to a page URL; the homepage uses `/index.md`.
- `/api/versions`: per-product release catalog.
- `/api/docs?product=character-dna&version=0.15.0`: an exact-version bundle **when that release exists in the catalog**.

All interfaces serve the same published content. Search defaults to current releases and can be restricted to an exact product/version. MCP is public and read-only in production; it has no access to source repositories. Staging is access-protected and noindex.

## Checks

```sh
npm test
python -m unittest discover -s tests -p 'test_*.py'
npm run docs:prepare
npm run docs:validate
npm run typecheck
npm run build
npm start -- --port 3005
# In another terminal:
node scripts/smoke.mjs
```

CI uses synthetic two-version fixtures for untrusted pull requests and never grants them private-repository credentials. The fixture builder refuses a local override; fixtures are test inputs, not real release history. Publication separately builds verified real snapshots.

## CI/CD

Add-on main pushes notify staging; stable published releases notify production. An hourly reconciliation repairs missed notifications and retries failed publications. Python reads GitHub directory trees and downloads approved docs/media blobs only. A dedicated archive repository holds immutable content-addressed bundles; `docs-state` holds durable catalogs and deployment records. Production retains its approved site commit until explicit promotion, so releasing an add-on cannot publish unrelated central edits.

The pipeline is disabled until `DOCS_PIPELINE_ENABLED=true` and the runbook's GitHub/Vercel setup is complete. Existing deployments and domains are not changed by checking out these branches.
