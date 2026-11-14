import { searchServer } from '@/lib/search';
export async function GET(request: Request) {
  const url = new URL(request.url);
  if ((url.searchParams.get('query') ?? '').length > 500) return Response.json({ error: 'Query is too long' }, { status: 400 });
  if (url.searchParams.get('tag') === 'all') url.searchParams.delete('tag');
  else if (!url.searchParams.has('tag')) url.searchParams.set('tag', 'current');
  return searchServer.GET(new Request(url, request));
}
