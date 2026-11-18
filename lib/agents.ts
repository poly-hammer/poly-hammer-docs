import { source, type DocPage } from './source';
import { absoluteUrl } from './site';
import { getMDXComponents } from '@/components/mdx';
import { publishedPages } from './published';

export async function pageMarkdown(page: DocPage): Promise<string> {
  const rendered = source.getPage(page.slugs, { props: { components: getMDXComponents() } }) ?? page;
  const body = await rendered.data.getText('processed');
  return `# ${page.data.title}\n\n${page.data.description ?? ''}\n\nCanonical URL: ${absoluteUrl(page.url)}\nProduct: ${page.data.product ?? 'Poly Hammer'}\nVersion: ${page.data.version ?? 'current'}\nChannel: ${page.data.channel ?? 'central'}\n${page.data.updatedAt ? `Updated: ${page.data.updatedAt}\n` : ''}\n${body}\n`;
}
export function agentIndex(): string {
  return '# Poly Hammer Documentation\n\n> Official documentation for Poly Hammer Blender add-ons, Unreal plugins, Portal, and CLI.\n\nUse explicit product versions when answering questions about installed add-ons. `next` means unreleased development documentation. The default index and full bundle select current versions; use the version catalog to discover older releases.\n\n## Agent interfaces\n\n' +
    `- [Connection instructions](${absoluteUrl('/agents.md')})\n- [Version catalog](${absoluteUrl('/api/versions')})\n- [Read-only MCP endpoint](${absoluteUrl('/api/mcp')})\n- [Current documentation bundle](${absoluteUrl('/llms-full.txt')})\n\n## Documents\n\n` + publishedPages().map(page => `- [${page.data.title}](${absoluteUrl(`${page.url === '/' ? '/index' : page.url}.md`)}): ${page.data.description ?? ''}${page.data.version ? ` (${page.data.product} ${page.data.version})` : ''}`).join('\n') + '\n';
}
export function markdownResponse(text: string, contentType = 'text/markdown; charset=utf-8'): Response { return new Response(text, { headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=0, must-revalidate', 'X-Content-Type-Options': 'nosniff' } }); }
