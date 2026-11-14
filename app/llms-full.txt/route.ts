import { pageMarkdown, markdownResponse } from '@/lib/agents';
import { publishedPages } from '@/lib/published';
export async function GET() { return markdownResponse((await Promise.all(publishedPages().map(pageMarkdown))).join('\n\n---\n\n'), 'text/plain; charset=utf-8'); }
