/** Synthetic CI content, never an actual product release or deployment input. */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { type Catalog } from '../lib/catalog';
if (fs.existsSync('docs.local.json')) throw new Error('Remove the local override before creating CI fixtures');
const channel = process.env.DOCS_CHANNEL === 'production' ? 'production' : 'staging';
const catalog: Catalog = { schemaVersion: 1, channel, siteCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), generation: 1, products: {} };
for (const product of ['character-dna', 'character-control-rig', 'character-assembly', 'ph-motion', 'ph-generate']) {
  const entry = catalog.products[product] = { latest: '0.15.0', versions: {} };
  for (const version of ['0.15.0', '0.14.0', ...(channel === 'staging' ? ['next'] : [])]) {
    const record = { commit: 'a'.repeat(40), digest: (version === '0.14.0' ? 'b' : 'c').repeat(64), archive: 'test-only', publishedAt: '2026-11-14T00:00:00Z', revision: 1, ...(version === 'next' ? {} : { releaseId: version === '0.14.0' ? 14 : 15, tag: version }) };
    if (version === 'next') Object.assign(entry, { next: record }); else (entry.versions as Record<string, typeof record>)[version] = record;
    const directory = path.join('.docs-build/snapshots', product, version);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, product === 'ph-generate' ? 'ph-generate.mdx' : 'index.mdx'), `---\ntitle: ${product} test fixture\ndescription: Synthetic documentation used only for automated tests.\n---\n\nInstall this test fixture for ${product} ${version}.\n\n## Test instructions\n\nFixture marker: ${version === '0.14.0' ? 'historicfixture' : version === 'next' ? 'unreleasedfixture' : 'currentfixture'}.\n`);
  }
}
fs.writeFileSync('.docs-build/catalog.json', JSON.stringify(catalog, null, 2));
