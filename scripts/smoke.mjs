import assert from 'node:assert/strict';
import fs from 'node:fs';
import visibilityDefaults from '../docs-visibility.json' with { type: 'json' };

const base = process.env.DOCS_TEST_URL ?? 'http://localhost:3005';
const headers = process.env.VERCEL_AUTOMATION_BYPASS_SECRET ? { 'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET } : {};
async function get(path, status = 200) {
  const response = await fetch(new URL(path, base), { headers });
  assert.equal(response.status, status, `${path}: HTTP ${response.status}`);
  return response;
}
let requestId = 0;
async function rpc(method, params) {
  const response = await fetch(new URL('/api/mcp', base), { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: ++requestId, method, params }) });
  assert.equal(response.status, 200, `MCP ${method}: HTTP ${response.status}`);
  const text = await response.text();
  const message = JSON.parse(text.startsWith('event:') || text.startsWith('data:') ? text.split('\n').find(line => line.startsWith('data:')).slice(5) : text);
  assert(!message.error, `MCP ${method}: ${JSON.stringify(message.error)}`);
  return message.result;
}
const versions = await (await get('/api/versions')).json();
await rpc('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'polyhammer-docs-smoke', version: '1.0' } });
const inputs = fs.existsSync('.docs-build/catalog.json') ? JSON.parse(fs.readFileSync('.docs-build/catalog.json', 'utf8')) : {};
const build = fs.existsSync('.docs-build/site.json') ? JSON.parse(fs.readFileSync('.docs-build/site.json', 'utf8')) : {};
const hiddenPaths = inputs.hiddenPaths ?? build.hiddenPaths ?? (process.env.DOCS_HIDDEN_PATHS ? JSON.parse(process.env.DOCS_HIDDEN_PATHS) : visibilityDefaults[versions.channel]);
const visible = route => !hiddenPaths.some(prefix => route === `/${prefix}` || route.startsWith(`/${prefix}/`));
const home = await (await get('/')).text();
if (build.siteUrl) {
  const canonical = home.match(/<link\b[^>]*\brel="canonical"[^>]*>/)?.[0].match(/\bhref="([^"]+)"/)?.[1];
  assert(canonical, 'Missing homepage canonical URL');
  assert.equal(new URL(canonical).origin, new URL(build.siteUrl).origin,
    'The tested hostname must serve the intended canonical origin, including before DNS cutover');
}
const initialDnaVersion = versions.products['character-dna']?.latest ?? (versions.products['character-dna']?.unreleased ? 'next' : null);
const buttonLabels = html => [...html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)].map(match => match[1].replace(/<[^>]*>/g, ''));
for (const route of ['/blender-addons', '/unreal-plugins', '/portal', '/cli', '/agents']) {
  if (!visible(route)) {
    assert(!home.includes(`href="${route}"`), `Hidden section remains in navigation: ${route}`);
    await get(route, 404);
    await get(`${route}.md`, 404);
    continue;
  }
  assert(home.includes(`href="${route}"`), `Missing section entry link: ${route}`);
  await get(route);
  await get(`${route}.md`);
}
if (initialDnaVersion) {
  const labels = buttonLabels(await (await get(`/blender-addons/character-dna/${initialDnaVersion}`)).text());
  assert(labels.some(text => text.includes('Blender Addons')), 'Missing Blender section dropdown');
  assert(labels.some(text => text.includes('Character DNA')), 'Missing Blender product dropdown');
  assert(labels.some(text => text.includes(initialDnaVersion === 'next' ? 'Next (unreleased)' : initialDnaVersion)), 'Missing Blender version dropdown');
}
if (visible('/unreal-plugins/poly-hammer-interchange')) {
  const unrealLanding = await (await get('/unreal-plugins.md')).text();
  assert(unrealLanding.includes('/unreal-plugins/poly-hammer-interchange/getting-started'), 'Unreal selection page must link to the plugin docs');
  const interchange = await (await get('/unreal-plugins/poly-hammer-interchange/getting-started')).text();
  const buttons = buttonLabels(interchange);
  assert(buttons.some(text => text.includes('Unreal Plugins')), 'Missing Unreal section dropdown');
  assert(buttons.some(text => text.includes('Poly Hammer Interchange')), 'Missing Unreal plugin dropdown');
}
if (visible('/portal')) {
  const portalLanding = await (await get('/portal.md')).text();
  assert(portalLanding.includes('Poly Hammer Portal') && portalLanding.includes('/portal/blender-extension-repo'), 'Portal home must introduce the product and link to setup');
}
assert(!versions.products['ph-generate'], 'Unpublished product must not appear in the version catalog');
await get('/blender-addons/ph-generate/next', 404);
await get('/blender-addons/ph-generate/next.md', 404);
for (const path of ['/', '/blender-addons', '/unreal-plugins', '/portal', '/cli', '/agents'].filter(visible)) {
  const html = await (await get(path)).text();
  assert.match(html, /rel="canonical"/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /<h1/);
}
const index = await (await get('/llms.txt')).text();
assert.match(index, /\/api\/mcp/);
const full = await (await get('/llms-full.txt')).text();
const sitemap = await (await get('/sitemap.xml')).text();
for (const prefix of hiddenPaths) {
  assert(!index.includes(`/${prefix}`) && !full.includes(`/${prefix}`) && !sitemap.includes(`/${prefix}`), `Hidden path leaked into exports: ${prefix}`);
  await get(`/${prefix}`, 404);
  await get(`/${prefix}.md`, 404);
  assert((await rpc('tools/call', { name: 'read_doc', arguments: { url: `/${prefix}` } })).isError);
}
for (const product of ['character-dna', 'character-control-rig', 'character-assembly', 'ph-motion']) {
  if (visible(`/blender-addons/${product}`)) continue;
  assert(!versions.products[product], `Hidden product leaked into version catalog: ${product}`);
  await get(`/docs-assets/${product}/${'c'.repeat(64)}/visibility-fixture.svg`, 404);
  await get(`/api/docs?product=${product}&version=latest`, 400);
  for (const version of ['latest', 'next', '0.15.0', '0.14.0']) {
    await get(`/blender-addons/${product}/${version}`, 404);
    await get(`/blender-addons/${product}/${version}.md`, 404);
    assert((await rpc('tools/call', { name: 'read_doc', arguments: { url: `/blender-addons/${product}/${version}` } })).isError);
  }
  const listed = await rpc('tools/call', { name: 'list_versions', arguments: { product } });
  assert.deepEqual(JSON.parse(listed.content[0].text), []);
  assert((await rpc('tools/call', { name: 'search_docs', arguments: { product, query: 'install' } })).isError);
}
if (!visible('/blender-addons/ph-motion')) {
  await get('/ph-motion-addon/index', 404);
  await get('/ph-motion/index', 404);
}
for (const [route, query] of [['/cli', 'Poly Hammer CLI'], ['/blender-addons/ph-motion', 'Poly Hammer Motion']]) {
  if (visible(route)) continue;
  assert(!full.includes(query), `Hidden product name leaked into Markdown: ${query}`);
  const found = await (await get(`/api/search?query=${encodeURIComponent(query)}`)).json();
  assert(found.every(result => !result.url.startsWith(route)), `Search exposes hidden documentation: ${route}`);
}
assert.match(full, /Canonical URL:/);
assert(!index.includes('/plans/'), 'Internal plans must not enter the agent index');
assert(!full.includes('/plans/'), 'Internal plans must not enter the Markdown bundle');
assert(!full.includes('internalplanfixture'));
assert(!(await (await get('/api/search?query=internalplanfixture')).json()).length);
assert(!full.includes('unpublishedfeaturefixture'));
assert(!(await (await get('/api/search?query=unpublishedfeaturefixture')).json()).length);
if (process.env.DOCS_SITE_URL) assert(index.includes(new URL(process.env.DOCS_SITE_URL).origin));
if (visible('/agents')) assert.match(await (await get('/agents.md')).text(), /Streamable HTTP/);
assert((await (await get('/api/search?query=Poly%20Hammer')).json()).length > 0);
const tools = await rpc('tools/list', {});
assert.deepEqual(tools.tools.map(tool => tool.name).sort(), ['list_docs', 'list_versions', 'read_doc', 'search_docs']);
assert(!(await rpc('tools/call', { name: 'list_versions', arguments: {} })).isError);
const dna = versions.products['character-dna'];
if (dna) {
  for (const page of ['pro-features/mesh-editor', 'workflows/custom-topology-metadata']) {
    assert(!index.includes(`/${page}`) && !full.includes(`/${page}`), `Unpublished page leaked into agent exports: ${page}`);
    for (const version of [...dna.versions, ...(dna.unreleased ? ['next'] : []), 'latest']) {
      const route = `/blender-addons/character-dna/${version}/${page}`;
      await get(route, 404);
      await get(`${route}.md`, 404);
      const hidden = await rpc('tools/call', { name: 'read_doc', arguments: { url: route } });
      assert(hidden.isError);
      assert.match(hidden.content[0].text, /Document not found/);
    }
  }
}
for (const [product, entry] of Object.entries(versions.products)) {
  const version = entry.latest ?? (entry.unreleased ? 'next' : null);
  if (!version) continue;
  const route = `/blender-addons/${product}/${version}`;
  await get(`${route}/plans/internal`, 404);
  await get(`${route}/plans/internal.md`, 404);
  await get(`${route}/plans/test-suite-refactor`, 404);
  await get(`${route}/plans/test-suite-refactor.md`, 404);
  await get(`/blender-addons/${product}/latest`);
  const markdown = await (await get(`${route}.md`)).text();
  assert(markdown.includes(`Version: ${version}`));
  const docs = await rpc('tools/call', { name: 'list_docs', arguments: { product, version } });
  assert(!docs.isError);
  const pages = JSON.parse(docs.content[0].text).documents;
  assert(pages.length > 0);
  assert(pages.every(page => !page.url.includes('/plans/')), 'Internal plans must not enter the MCP catalog');
  assert(pages.every(page => !/\/(?:pro-features\/mesh-editor|workflows\/custom-topology-metadata)$/.test(page.url)), 'Unpublished features must not enter the MCP catalog');
  assert(pages.every(page => page.version === version));
  const read = await rpc('tools/call', { name: 'read_doc', arguments: { url: pages[0].url } });
  assert(!read.isError);
  assert.equal(JSON.parse(read.content[0].text).version, version);
  const first = JSON.parse((await rpc('tools/call', { name: 'list_docs', arguments: { product, version, limit: 1 } })).content[0].text);
  assert.equal(first.documents.length, 1);
  assert.equal(first.nextOffset, first.total > 1 ? 1 : null);
  if (first.nextOffset !== null) {
    const second = JSON.parse((await rpc('tools/call', { name: 'list_docs', arguments: { product, version, offset: first.nextOffset, limit: 1 } })).content[0].text);
    assert.notEqual(second.documents[0].url, first.documents[0].url);
  }
  const chunk = JSON.parse((await rpc('tools/call', { name: 'read_doc', arguments: { url: pages[0].url, limit: 100 } })).content[0].text);
  assert.equal(chunk.nextOffset, 100);
  assert.equal(chunk.markdown.length, 100);
  const unknown = await rpc('tools/call', { name: 'search_docs', arguments: { product, version: '999999.0.0', query: 'install' } });
  assert(unknown.isError);
  await get(`/api/docs?product=${product}&version=999999.0.0`, 404);
  for (const old of entry.versions.filter(value => value !== entry.latest)) {
    const text = await (await get(`/blender-addons/${product}/${old}.md`)).text();
    assert(text.includes(`Version: ${old}`));
    const oldPages = await rpc('tools/call', { name: 'list_docs', arguments: { product, version: old } });
    assert(JSON.parse(oldPages.content[0].text).documents.every(page => page.version === old));
  }
  if (versions.channel === 'production') {
    assert(!entry.unreleased);
    await get(`/blender-addons/${product}/next`, 404);
    assert(!index.includes(`/${product}/next`));
  }
}
if (full.includes('currentfixture')) {
  assert(!(await (await get('/api/search?query=historicfixture')).json()).length);
  assert(!(await (await get('/api/search?query=unreleasedfixture')).json()).length);
  const historical = await rpc('tools/call', { name: 'search_docs', arguments: { product: 'character-dna', version: '0.14.0', query: 'historicfixture' } });
  assert(JSON.parse(historical.content[0].text).results.length > 0);
}
assert((await rpc('tools/call', { name: 'read_doc', arguments: { url: 'https://example.org/private' } })).isError);
const robots = await (await get('/robots.txt')).text();
assert.match(robots, versions.channel === 'production' ? /Sitemap:/ : /Disallow: \//);
console.log(`HTTP, metadata, Markdown, search, and MCP checks passed (${versions.channel}).`);
