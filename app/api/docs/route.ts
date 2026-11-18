import { publishedPages, catalog } from '@/lib/published';
import { pageMarkdown, markdownResponse } from '@/lib/agents';
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const product = query.get('product') ?? undefined, version = query.get('version') ?? undefined;
  if (!product || !catalog.products[product]) return Response.json({ error: 'A known product is required; see /api/versions' }, { status: 400 });
  const pages = publishedPages(product, version);
  if (!pages.length) return Response.json({ error: 'Version is unavailable' }, { status: 404 });
  return markdownResponse((await Promise.all(pages.map(pageMarkdown))).join('\n\n---\n\n'));
}
