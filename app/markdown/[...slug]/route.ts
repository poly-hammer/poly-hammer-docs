import { source } from '@/lib/source';
import { pageMarkdown, markdownResponse } from '@/lib/agents';
import { resolveProductVersion } from '@/lib/published';
export async function GET(_request: Request, context: { params: Promise<{ slug: string[] }> }) {
  let { slug } = await context.params;
  if (slug.length === 1 && slug[0] === 'index') slug = [];
  if (slug[0] === 'blender-addons' && slug[2] === 'latest') {
    const version = resolveProductVersion(slug[1]);
    if (!version) return new Response('Unknown product', { status: 404 });
    slug[2] = version;
  }
  const page = source.getPage(slug);
  if (!page) return new Response('Document not found', { status: 404 });
  return markdownResponse(await pageMarkdown(page));
}
