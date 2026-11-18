import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';
import { compile } from '@mdx-js/mdx';

function walk(directory: string): string[] { return fs.existsSync(directory) ? fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]) : []; }
const files = ['content/authored', 'content/synced'].flatMap(walk).filter(file => /\.mdx?$/.test(file));
const routes = new Set(files.map(file => '/' + file.replaceAll('\\', '/').replace(/^content\/(?:authored|synced)\//, '').replace(/\.mdx?$/, '').replace(/(?:^|\/)index$/, '')).map(route => route === '' ? '/' : route));
const catalog = JSON.parse(fs.readFileSync('.docs-build/catalog.json', 'utf8'));
const fixture = Object.values(catalog.products).some((product: any) => Object.values(product.versions).some((record: any) => record.archive === 'test-only'));
const errors: string[] = [];
const allowed = new Set(['Callout', 'DocVideo', 'DocImage', 'YouTubeEmbed', 'Cards', 'Card', 'div', 'br', 'kbd', 'a', 'span', 'sup', 'sub', 'mark']);
for (const file of files) {
  try {
    const { data, content } = matter(fs.readFileSync(file, 'utf8'));
    if (typeof data.title !== 'string' || typeof data.description !== 'string' || !data.description.trim()) throw new Error('title and description are required');
    const tree = unified().use(remarkParse).use(remarkMdx).use(remarkGfm).parse(content);
    visit(tree, (node: any) => {
      if (node.type === 'mdxjsEsm' || node.type === 'mdxFlowExpression' || node.type === 'mdxTextExpression') throw new Error(`Executable MDX is not allowed (${node.type})`);
      if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
        if (!allowed.has(node.name)) throw new Error(`Unsupported component: ${node.name}`);
        for (const attribute of node.attributes) {
          if (attribute.type !== 'mdxJsxAttribute' || /^on/i.test(attribute.name) || attribute.name === 'dangerouslySetInnerHTML') throw new Error('Unsafe JSX attribute');
          if (typeof attribute.value === 'object' && attribute.value !== null) {
            if (attribute.name !== 'style') throw new Error('Executable component property');
            const style = JSON.parse(attribute.value.value);
            if (Object.values(style).some(value => typeof value !== 'string' || /url\s*\(/i.test(value))) throw new Error('Unsafe style value');
          }
          if (['src', 'poster', 'href'].includes(attribute.name) && typeof attribute.value === 'string') checkUrl(attribute.value);
        }
      }
      if (node.type === 'image' || node.type === 'link' || node.type === 'definition') checkUrl(node.url);
    });
    await compile(content, { remarkPlugins: [remarkGfm] });
    function checkUrl(url: string) {
      if (/^(?:javascript|data|file|vbscript):/i.test(url)) throw new Error(`Unsafe URL: ${url}`);
      if (url.startsWith('/assets/') || url.startsWith('/docs-assets/')) {
        const local = path.join('public', decodeURIComponent(url.split(/[?#]/)[0]));
        if (!fs.existsSync(local)) throw new Error(`Missing asset ${url}`);
      }
      if (url.startsWith('/') && !url.startsWith('//') && !/\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|webm|mp4|pdf)(?:[?#]|$)/i.test(url) && !fixture) {
        let route = decodeURIComponent(url.split(/[?#]/)[0]).replace(/\/$/, '') || '/';
        if (/^\/(?:api\/|llms(?:-full)?\.txt|robots\.txt|sitemap\.xml)/.test(route)) return;
        route = route.replace(/\.md$/, '').replace(/\/index$/, '') || '/';
        route = route.replace(/^\/blender-addons\/([^/]+)\/latest(?=\/|$)/, (_, product) => `/blender-addons/${product}/${catalog.products[product]?.latest ?? (catalog.products[product]?.next ? 'next' : 'unavailable')}`);
        if (!routes.has(route)) throw new Error(`Missing document route: ${url}`);
      }
      if (!/^(?:[a-z]+:|\/|#)/i.test(url)) throw new Error(`Unresolved relative link: ${url}`);
    }
  } catch (error) { errors.push(`${file}: ${error instanceof Error ? error.message : String(error)}`); }
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`Validated ${files.length} documents: frontmatter, MDX policy, compilation, and local media.`);
