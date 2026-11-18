import path from 'node:path';
import fs from 'node:fs';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { SKIP, visit } from 'unist-util-visit';

const posix = path.posix;
const quote = (text: string) => JSON.stringify(text);

type LegacyContext = { directory: string; relativePage: string; private?: boolean };

function normalizeMarkdownText(content: string, context?: LegacyContext): string {
  const edits: { start: number; end: number; value: string }[] = [];
  const tree = unified().use(remarkParse).use(remarkGfm).parse(content);
  visit(tree, node => {
    const start = node.position?.start.offset, end = node.position?.end.offset;
    if (start === undefined || end === undefined) return;
    const raw = content.slice(start, end);
    if (node.type === 'link' && context?.private && raw.startsWith('[') && raw.includes('](') && !/^(?:[a-z]+:|[/#])/i.test(node.url)) {
      const target = posix.normalize(posix.join(posix.dirname(context.relativePage), decodeURIComponent(node.url.split(/[?#]/)[0])));
      const repositoryPath = posix.normalize(posix.join(context.directory, target));
      if (target.startsWith('../') && repositoryPath !== '..' && !repositoryPath.startsWith('../')) {
        const label = raw.slice(1, raw.lastIndexOf(']('));
        const reference = repositoryPath.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('{', '&#123;').replaceAll('}', '&#125;');
        edits.push({ start, end, value: `${label} in the source repository (${reference})` });
        return SKIP;
      }
    }
    if (node.type === 'link' && raw.startsWith('<') && raw.endsWith('>')) {
      const label = raw.slice(1, -1).replace(/[\\[\]]/g, '\\$&');
      edits.push({ start, end, value: `[${label}](<${node.url}>)` });
      return SKIP;
    }
    if (node.type !== 'text') return;
    // Preserve code, HTML, and existing Markdown escapes; only escape prose.
    const entities: Record<string, string> = { '<': '&lt;', '{': '&#123;', '}': '&#125;' };
    const value = raw.replace(/(\\*)([<{}])/g, (_, slashes: string, character: string) =>
      slashes + (slashes.length % 2 ? character : entities[character]));
    if (value !== raw) edits.push({ start, end, value });
  });
  for (const edit of edits.sort((a, b) => b.start - a.start)) content = content.slice(0, edit.start) + edit.value + content.slice(edit.end);
  return content;
}

export function convertAdmonitions(text: string): string {
  const lines = text.split('\n');
  const output: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const match = /^(\s*)!!!\s+(\w+)(?:\s+"([^"]*)")?\s*$/.exec(lines[i]);
    if (!match) { output.push(lines[i]); continue; }
    const indent = match[1].length;
    const body: string[] = [];
    while (i + 1 < lines.length && (!lines[i + 1].trim() || lines[i + 1].startsWith(' '.repeat(indent + 4)))) {
      const line = lines[++i];
      body.push(line.trim() ? line.slice(indent + 4) : '');
    }
    const type = ({ warning: 'warn', danger: 'error', error: 'error', tip: 'idea', success: 'success' } as Record<string, string>)[match[2]] ?? 'info';
    output.push(`<Callout type=${quote(type)} title=${quote(match[3] || (match[2][0].toUpperCase() + match[2].slice(1)))}>`, '', convertAdmonitions(body.join('\n')).trim(), '', '</Callout>', '');
  }
  return output.join('\n');
}

function attributes(tag: string): Record<string, string> {
  return Object.fromEntries([...tag.matchAll(/([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(m => [m[1], m[2] ?? m[3]]));
}

export function normalizeLegacy(input: string, context?: LegacyContext): { title: string; description: string; content: string; metadata: Record<string, unknown> } {
  const parsed = matter(input.replaceAll('\r\n', '\n'));
  const h1 = /^#\s+(.+)$/m.exec(parsed.content);
  const title = String(parsed.data.title ?? h1?.[1] ?? 'Documentation');
  let content = parsed.content;
  if (h1 && content.slice(0, h1.index).trim() === '') content = content.slice(h1.index + h1[0].length).trimStart();
  if (parsed.data.title && parsed.data.description) return { title, description: String(parsed.data.description), content: content.trim() + '\n', metadata: parsed.data };
  content = normalizeMarkdownText(content, context);
  const code: string[] = [];
  content = content.replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, block => `CODEBLOCKTOKEN${code.push(block) - 1}ENDTOKEN`);
  content = convertAdmonitions(content);
  content = content.replace(/<video\b([^>]*)>([\s\S]*?)<\/video>/gi, (_, raw, body) => {
    const attrs = attributes(raw), src = attrs.src ?? attributes(body).src;
    if (!src) throw new Error('Video has no source');
    const title = attrs['aria-label'] ?? path.posix.basename(src).replace(/\.[^.]+$/, '').replaceAll('_', ' ').replaceAll('-', ' ');
    return `<DocVideo src=${quote(src)}${attrs.poster ? ` poster=${quote(attrs.poster)}` : ''} title=${quote(title)}${/\bautoplay\b/i.test(raw) ? ' autoPlay' : ''}${/\bloop\b/i.test(raw) ? ' loop' : ''}${/\bmuted\b/i.test(raw) ? ' muted' : ''} />`;
  });
  content = content.replace(/<iframe\b([^>]*)>[\s\S]*?<\/iframe>/gi, (_, raw) => {
    const attrs = attributes(raw);
    return `<YouTubeEmbed src=${quote(attrs.src)} title=${quote(attrs.title ?? 'Video tutorial')} />`;
  });
  content = content.replace(/!\[([^\]]*)\]\(([^)]+)\)\{:[^}\n]*\}/g, (_, alt, src) => `<DocImage src=${quote(src)} alt=${quote(alt)} />`);
  content = content.replace(/\{:\s*[^}\n]+\}/g, '');
  content = content.replace(/<img\b([^>]*?)\/?\s*>/gi, (_, raw) => {
    const attrs = attributes(raw);
    return `<DocImage src=${quote(attrs.src)} alt=${quote(attrs.alt ?? '')}${attrs.width ? ` width=${quote(attrs.width)}` : ''} />`;
  });
  content = content.replace(/<div\b([^>]*)>/gi, (_, raw) => {
    const attrs = attributes(raw);
    const styles = Object.fromEntries((attrs.style ?? '').split(';').filter(Boolean).map(pair => {
      const split = pair.indexOf(':');
      return [pair.slice(0, split).trim().replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()), pair.slice(split + 1).trim()];
    }));
    return `<div${Object.keys(styles).length ? ` style={${JSON.stringify(styles)}}` : ''}>`;
  });
  content = content.replace(/<!--([\s\S]*?)-->/g, '{/*$1*/}').replace(/<br\s*\/?\s*>/gi, '<br />');
  content = content.replace(/CODEBLOCKTOKEN(\d+)ENDTOKEN/g, (_, i) => code[Number(i)]);
  const paragraph = content.split(/\n\s*\n/).find(p => p.trim() && !/^(?:<|#|```|\||- )/.test(p.trim())) ?? title;
  const description = String(parsed.data.description ?? paragraph.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '').replace(/\s+/g, ' ').slice(0, 190));
  return { title, description, content: content.trim() + '\n', metadata: parsed.data };
}

export function sourceTarget(root: string, relativePage: string, target: string, html: boolean): string | undefined {
  const pathname = target.split(/[?#]/)[0];
  if (!pathname || /^(?:[a-z]+:|\/\/|\/)/i.test(pathname)) return undefined;
  const directory = posix.dirname(relativePage);
  const rendered = posix.basename(relativePage).replace(/\.mdx?$/, '') === 'index' ? directory : posix.join(directory, posix.basename(relativePage).replace(/\.mdx?$/, ''));
  const candidates = [posix.normalize(posix.join(html ? rendered : directory, decodeURIComponent(pathname))), posix.normalize(posix.join(directory, decodeURIComponent(pathname)))];
  for (const candidate of candidates) {
    if (candidate === '..' || candidate.startsWith('../')) continue;
    for (const suffix of ['', '.mdx', '.md', '/index.mdx', '/index.md']) {
      if (fs.existsSync(path.join(root, candidate + suffix)) && fs.statSync(path.join(root, candidate + suffix)).isFile()) return candidate + suffix;
    }
  }
  return undefined;
}
