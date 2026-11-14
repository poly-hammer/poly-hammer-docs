import assert from 'node:assert/strict';

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
for (const path of ['/', '/blender-addons', '/unreal-plugins', '/portal', '/cli', '/agents']) {
  const html = await (await get(path)).text();
  assert.match(html, /rel="canonical"/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /<h1/);
}
const index = await (await get('/llms.txt')).text();
assert.match(index, /\/api\/mcp/);
const full = await (await get('/llms-full.txt')).text();
assert.match(full, /Canonical URL:/);
if (process.env.DOCS_SITE_URL) assert(index.includes(new URL(process.env.DOCS_SITE_URL).origin));
assert.match(await (await get('/agents.md')).text(), /Streamable HTTP/);
assert((await (await get('/api/search?query=Polyhammer')).json()).length > 0);
await rpc('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'polyhammer-docs-smoke', version: '1.0' } });
const tools = await rpc('tools/list', {});
assert.deepEqual(tools.tools.map(tool => tool.name).sort(), ['list_docs', 'list_versions', 'read_doc', 'search_docs']);
assert(!(await rpc('tools/call', { name: 'list_versions', arguments: {} })).isError);
for (const [product, entry] of Object.entries(versions.products)) {
  const version = entry.latest ?? (entry.unreleased ? 'next' : null);
  if (!version) continue;
  const route = `/blender-addons/${product}/${version}`;
  await get(`/blender-addons/${product}/latest`);
  const markdown = await (await get(`${route}.md`)).text();
  assert(markdown.includes(`Version: ${version}`));
  const docs = await rpc('tools/call', { name: 'list_docs', arguments: { product, version } });
  assert(!docs.isError);
  const pages = JSON.parse(docs.content[0].text).documents;
  assert(pages.length > 0);
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
