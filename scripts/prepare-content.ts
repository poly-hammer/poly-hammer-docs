import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import YAML from 'yaml';
import { normalizeLegacy, sourceTarget } from '../lib/legacy.js';
import { CatalogSchema, compareVersions, type Catalog, type Snapshot } from '../lib/catalog.js';
import { HiddenPathsSchema, isPathVisible, visibleContent, visibleMeta } from '../lib/visibility.js';
import visibilityDefaults from '../docs-visibility.json';

const root = process.cwd();
const registry = JSON.parse(fs.readFileSync('docs-sources.json', 'utf8')) as { sources: Source[] };
type Source = { id: string; title: string; repository: string; directory: string; mount: string; include: string[]; exclude?: string[]; entry?: string; private?: boolean; legacyDescriptions?: Record<string, string> };
function walk(directory: string): string[] { return fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => { if (entry.isDirectory() && entry.name.toLowerCase() === 'plans') return []; if (entry.isSymbolicLink()) throw new Error(`Symlink in docs: ${entry.name}`); return entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]; }); }
function sha(directory: string): string { return execFileSync('git', ['-c', `safe.directory=${directory}`, '-C', directory, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); }
function write(file: string, value: string) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, value); }
function selected(source: Source, file: string) { return !source.exclude?.includes(file) && (source.include.includes('**') || source.include.includes(file)); }
function slug(relative: string, source: Source): string { const value = relative.replace(/\.mdx?$/, '').replace(/(?:^|\/)index$/, ''); return value === source.entry ? '' : value; }
const previousGenerated = ['content/synced', 'content/published', 'public/docs-assets'];
for (const relative of previousGenerated) {
  const destination = path.resolve(root, relative);
  if (!destination.startsWith(root + path.sep)) throw new Error('Generated directory escaped workspace');
  if (fs.existsSync(destination)) {
    if (fs.lstatSync(destination).isSymbolicLink()) throw new Error('Generated destination is a symlink');
    fs.rmSync(destination, { recursive: true });
  }
  fs.mkdirSync(destination, { recursive: true });
}
const localFile = path.join(root, 'docs.local.json');
const local = fs.existsSync(localFile) ? JSON.parse(fs.readFileSync(localFile, 'utf8')).sources as Record<string, string> : undefined;
let catalog: Catalog;
const snapshots = new Map<string, string>();
if (local) {
  if (process.env.DOCS_CHANNEL === 'production' || process.env.CI) throw new Error('Local overrides are not permitted in CI or production');
  catalog = { schemaVersion: 1, channel: 'local', generation: 0, siteCommit: sha(root), products: {} };
  for (const source of registry.sources) {
    const repo = local[source.id];
    if (!repo) continue;
    const directory = path.join(path.resolve(repo), source.directory);
    const hash = crypto.createHash('sha256');
    for (const file of walk(directory)) { hash.update(path.relative(directory, file).replaceAll('\\', '/')); hash.update(fs.readFileSync(file)); }
    catalog.products[source.id] = { latest: null, versions: {}, next: { commit: sha(path.resolve(repo)), digest: hash.digest('hex'), archive: 'local', publishedAt: new Date().toISOString(), revision: 1 } };
    snapshots.set(`${source.id}/next`, directory);
  }
} else {
  const filename = process.env.DOCS_CATALOG ?? '.docs-build/catalog.json';
  catalog = CatalogSchema.parse(JSON.parse(fs.readFileSync(filename, 'utf8')));
  if (process.env.DOCS_CHANNEL && process.env.DOCS_CHANNEL !== catalog.channel) throw new Error('Catalog channel does not match deployment channel');
  for (const source of registry.sources) {
    const product = catalog.products[source.id];
    if (!product) continue;
    for (const version of [...Object.keys(product.versions), ...(product.next ? ['next'] : [])]) snapshots.set(`${source.id}/${version}`, path.resolve('.docs-build/snapshots', source.id, version));
  }
}
catalog = CatalogSchema.parse(catalog);
// CI publishes the collector's pinned policy. Local/fixture builds may select it directly.
const configuredHidden = process.env.DOCS_HIDDEN_PATHS?.trim();
const hiddenPaths = HiddenPathsSchema.parse(catalog.hiddenPaths ?? (configuredHidden ? JSON.parse(configuredHidden) : visibilityDefaults[catalog.channel]));
const authoredFiles = walk('content/authored');
const knownPaths = [...registry.sources.map(source => source.mount), ...authoredFiles.filter(file => /\.mdx?$/.test(file)).map(file => path.relative('content/authored', file).replaceAll('\\', '/').replace(/\.mdx?$/, '').replace(/(?:^|\/)index$/, ''))];
for (const hidden of hiddenPaths) if (!knownPaths.some(route => route === hidden || route.startsWith(hidden + '/'))) throw new Error(`Unknown hidden documentation path: ${hidden}`);
if (catalog.hiddenPaths && configuredHidden && JSON.stringify(hiddenPaths) !== JSON.stringify(HiddenPathsSchema.parse(JSON.parse(configuredHidden)))) throw new Error('Visibility differs from the collected catalog; reconcile before building');
const publicCatalog: Catalog = { ...catalog, products: Object.fromEntries(Object.entries(catalog.products).filter(([id]) => {
  const source = registry.sources.find(source => source.id === id);
  return source && isPathVisible(source.mount, hiddenPaths);
})) };
delete publicCatalog.hiddenPaths;
// Compile only publishable authored files; originals remain available in the repository.
for (const file of authoredFiles) {
  const relative = path.relative('content/authored', file).replaceAll('\\', '/');
  const route = relative.replace(/\.(?:mdx?|json)$/, '').replace(/(?:^|\/)meta$/, '');
  if (!isPathVisible(route, hiddenPaths)) continue;
  let value = fs.readFileSync(file, 'utf8');
  if (relative.endsWith('meta.json')) value = JSON.stringify(visibleMeta(JSON.parse(value), path.posix.dirname(relative) === '.' ? '' : path.posix.dirname(relative), hiddenPaths), null, 2);
  else if (/\.mdx?$/.test(relative)) {
    const frontmatter = value.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/)?.[0] ?? '';
    value = frontmatter + visibleContent(value.slice(frontmatter.length), hiddenPaths);
  }
  write(path.join('content/published', relative), value);
}
const oldPrefixes = Object.fromEntries(registry.sources.map(s => [`/${s.repository.split('/')[1]}`, `/${s.mount}`]));
function externalLink(target: string): string {
  let value = target.replace(/^https:\/\/docs\.polyhammer\.com(?=\/)/, '');
  for (const [old, mount] of Object.entries(oldPrefixes)) if (value === old || value.startsWith(old + '/') || value.startsWith(old + '#')) value = mount + '/latest' + value.slice(old.length);
  return value.replace(/^\/poly-hammer-portal(?=\/|$)/, '/portal').replace(/^\/poly-hammer-interchange(?=\/|$)/, '/unreal-plugins/poly-hammer-interchange');
}
let count = 0;
const assetRedirects: { source: string; destination: string; permanent: false }[] = [];
for (const source of registry.sources) {
  const product = publicCatalog.products[source.id];
  if (!product) continue;
  const versions = [...Object.keys(product.versions).sort((a, b) => compareVersions(b, a)), ...(product.next ? ['next'] : [])];
  const productFolder = path.join('content/synced', source.mount);
  write(path.join(productFolder, 'meta.json'), JSON.stringify({ title: source.title, root: true, pages: versions }, null, 2));
  for (const version of versions) {
    const directory = snapshots.get(`${source.id}/${version}`)!;
    const record: Snapshot = version === 'next' ? product.next! : product.versions[version];
    if (!fs.existsSync(directory)) throw new Error(`Missing snapshot ${source.id}/${version}`);
    const all = walk(directory);
    const pages = all.filter(file => /\.mdx?$/.test(file) && selected(source, path.relative(directory, file).replaceAll('\\', '/')) && isPathVisible(`${source.mount}/${version}/${slug(path.relative(directory, file).replaceAll('\\', '/'), source)}`, hiddenPaths));
    const pageSet = new Set(pages.map(file => path.relative(directory, file).replaceAll('\\', '/')));
    if (!pages.length) throw new Error(`Empty product documentation ${source.id}`);
    const assetBase = `/docs-assets/${source.id}/${record.digest}`;
    for (const file of all) if (/\.(?:png|jpe?g|gif|webp|avif|svg|ico|webm|mp4|pdf)$/i.test(file)) {
      const destination = path.join('public', assetBase, path.relative(directory, file));
      fs.mkdirSync(path.dirname(destination), { recursive: true }); fs.copyFileSync(file, destination);
      if (version === (product.latest ?? 'next')) {
        const relativeAsset = path.relative(directory, file).replaceAll('\\', '/');
        assetRedirects.push({ source: `/${source.repository.split('/')[1]}/${relativeAsset}`, destination: `${assetBase}/${relativeAsset}`, permanent: false });
      }
    }
    for (const file of pages) {
      const relative = path.relative(directory, file).replaceAll('\\', '/');
      const input = fs.readFileSync(file, 'utf8');
      const legacy = !input.startsWith('---');
      const parsed = normalizeLegacy(input, { directory: source.directory, relativePage: relative, private: source.private });
      const rewrite = (target: string, html = false): string => {
        if (/^https?:|^\//.test(target)) return externalLink(target);
        if (target.startsWith('#')) return target;
        const resolved = sourceTarget(directory, relative, target, legacy && html);
        if (!resolved) {
          const repositoryPath = path.posix.normalize(path.posix.join(source.directory, path.posix.dirname(relative), target.split(/[?#]/)[0]));
          if (!source.private && !repositoryPath.startsWith('../') && repositoryPath.startsWith('tests/')) return `https://github.com/${source.repository}/blob/${record.commit}/${repositoryPath}${target.match(/[?#].*$/)?.[0] ?? ''}`;
          return target;
        }
        const fragment = target.match(/[?#].*$/)?.[0] ?? '';
        if (/\.mdx?$/.test(resolved)) {
          if (!pageSet.has(resolved)) throw new Error(`Document not in product snapshot: ${relative} -> ${target}`);
          return `/${source.mount}/${version}/${slug(resolved, source)}${fragment}`;
        }
        return `${assetBase}/${resolved}${fragment}`;
      };
      let body = parsed.content.replace(/(!?\[[^\]]*\]\()([^\s)]+)([^)]*\))/g, (_, begin, target, end) => `${begin}${rewrite(target)}${end}`);
      body = body.replace(/\b(src|poster|href)="([^"]+)"/g, (_, key, target) => `${key}=${JSON.stringify(rewrite(target, true))}`);
      // Authored frontmatter takes precedence over summaries for legacy snapshots.
      const description = parsed.metadata.description == null ? source.legacyDescriptions?.[relative] ?? parsed.description : parsed.description;
      const metadata = { ...parsed.metadata, title: parsed.title, description, product: source.id, version, channel: catalog.channel, sourceCommit: record.commit, updatedAt: record.publishedAt };
      write(path.join(productFolder, version, relative.replace(/\.mdx?$/, '') === source.entry ? 'index.mdx' : relative.replace(/\.md$/, '.mdx')), `---\n${YAML.stringify(metadata)}---\n\n${visibleContent(body, hiddenPaths)}`);
      count++;
    }
    for (const file of all.filter(file => path.basename(file) === 'meta.json')) {
      const relative = path.relative(directory, file);
      const metadata = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (source.entry) continue;
      write(path.join(productFolder, version, relative), JSON.stringify(visibleMeta(metadata, `${source.mount}/${version}/${path.dirname(relative).replaceAll('\\', '/')}`.replace(/\/\.$/, ''), hiddenPaths), null, 2));
    }
    const metaFile = path.join(productFolder, version, 'meta.json');
    const existing = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, 'utf8')) : {};
    write(metaFile, JSON.stringify({ ...existing, title: version === 'next' ? 'Next (unreleased)' : `${version}${product.latest === version ? ' (Latest)' : ''}`, root: 'version', pages: source.entry ? ['index', '...'] : existing.pages ?? ['index', '...'] }, null, 2));
  }
}
write('.docs-build/catalog.json', JSON.stringify(catalog, null, 2) + '\n');
write('.docs-build/published-catalog.json', JSON.stringify(publicCatalog, null, 2) + '\n');
write('.docs-build/legacy-assets.json', JSON.stringify(assetRedirects, null, 2) + '\n');
const siteUrl = new URL(process.env.DOCS_SITE_URL ?? 'http://localhost:3000');
if (!['http:', 'https:'].includes(siteUrl.protocol) || siteUrl.username || siteUrl.password || siteUrl.pathname !== '/' || siteUrl.search || siteUrl.hash) throw new Error('DOCS_SITE_URL must be an HTTP(S) origin');
if (catalog.channel === 'production' && siteUrl.protocol !== 'https:' && siteUrl.hostname !== 'localhost') throw new Error('Production requires an HTTPS origin');
write('.docs-build/site.json', JSON.stringify({ channel: catalog.channel, siteUrl: siteUrl.origin, hiddenPaths }, null, 2) + '\n');
console.log(`Prepared ${count} versioned pages for ${catalog.channel}; ${Object.keys(publicCatalog.products).length} visible products.`);
