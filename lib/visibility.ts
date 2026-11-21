import { z } from 'zod';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import { visit } from 'unist-util-visit';

// Relative route prefixes, with whole-segment matching. No URLs, wildcards or traversal.
export const HiddenPathsSchema = z.array(z.string().regex(/^[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\/[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)*$/)).transform(paths => [...new Set(paths)].sort());
export function isPathVisible(url: string, hiddenPaths: readonly string[]) {
  const route = url.split(/[?#]/)[0].replace(/^\//, '').replace(/\.mdx?$/, '').replace(/(?:^|\/)index$/, '').replace(/\/$/, '');
  return !hiddenPaths.some(hidden => route === hidden || route.startsWith(hidden + '/'));
}

export function visibleMeta(meta: Record<string, any>, directory: string, hidden: readonly string[]) {
  if (!Array.isArray(meta.pages)) return meta;
  return { ...meta, pages: meta.pages.filter((entry: string) => {
    const link = entry.match(/^\[[^\]]+\]\(([^)]+)\)$/)?.[1];
    if (link) return !link.startsWith('/') || isPathVisible(link, hidden);
    if (/^(?:\.\.\.|!|---)/.test(entry)) return true;
    return isPathVisible([directory, entry].filter(Boolean).join('/'), hidden);
  }) };
}

// Remove promotional cards before compilation, so HTML, search and Markdown agree.
// Ordinary cross-references retain their readable label, without a hidden route link.
export function visibleContent(input: string, hidden: readonly string[]) {
  if (!hidden.length) return input;
  const tree = unified().use(remarkParse).use(remarkMdx).parse(input);
  const edits: { start: number; end: number; value: string }[] = [];
  visit(tree, (node: any) => {
    const href = node.attributes?.find((attribute: any) => attribute.name === 'href')?.value;
    const url = node.type === 'link' ? node.url : typeof href === 'string' ? href : undefined;
    if (!url?.startsWith('/') || isPathVisible(url, hidden)) return;
    const start = node.position?.start.offset, end = node.position?.end.offset;
    if (start == null || end == null) return;
    const children = node.children ?? [];
    const value = node.name === 'Card' || !children.length ? '' : input.slice(children[0].position.start.offset, children.at(-1).position.end.offset);
    edits.push({ start, end, value });
  });
  // Ignore nested edits when an outer card/link is already removed.
  const outer = edits.sort((a, b) => a.start - b.start || b.end - a.end).filter((edit, index, all) => !all.slice(0, index).some(parent => parent.start <= edit.start && parent.end >= edit.end));
  for (const edit of outer.reverse()) input = input.slice(0, edit.start) + edit.value + input.slice(edit.end);
  return input;
}
