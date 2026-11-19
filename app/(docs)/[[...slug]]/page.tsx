import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { DocsPage, DocsTitle, DocsDescription, DocsBody, MarkdownCopyButton } from 'fumadocs-ui/layouts/docs/page';
import { source } from '@/lib/source';
import { catalog, resolveProductVersion } from '@/lib/published';
import { absoluteUrl, isProduction } from '@/lib/site';
import { getMDXComponents } from '@/components/mdx';

type Props = { params: Promise<{ slug?: string[] }> };
function getPage(slug: string[]) { return source.getPage(slug); }
export function generateStaticParams() { return source.generateParams(); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug = [] } = await params;
  const page = getPage(slug);
  if (!page) return {};
  return { title: page.data.title, description: page.data.description, alternates: { canonical: absoluteUrl(page.url), types: { 'text/markdown': absoluteUrl(`${page.url === '/' ? '/index' : page.url}.md`) } }, robots: { index: isProduction && page.data.version !== 'next', follow: true }, openGraph: { title: page.data.title, description: page.data.description, url: absoluteUrl(page.url), type: 'article' } };
}
export default async function Page({ params }: Props) {
  const { slug = [] } = await params;
  if (slug[0] === 'blender-addons' && slug[1] && (!slug[2] || slug[2] === 'latest')) {
    const version = resolveProductVersion(slug[1]);
    if (!version) notFound();
    const target = ['blender-addons', slug[1], version, ...slug.slice(3)];
    if (!getPage(target)) notFound();
    redirect('/' + target.join('/'));
  }
  const page = getPage(slug);
  if (!page) notFound();
  const Content = page.data.body;
  const version = page.data.version, product = page.data.product;
  const latest = product ? catalog.products[product]?.latest : undefined;
  const schema = { '@context': 'https://schema.org', '@type': 'TechArticle', headline: page.data.title, description: page.data.description, url: absoluteUrl(page.url), inLanguage: 'en', publisher: { '@type': 'Organization', name: 'Poly Hammer', url: 'https://polyhammer.com' }, ...(page.data.updatedAt ? { dateModified: page.data.updatedAt } : {}), ...(version ? { version } : {}) };
  const breadcrumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Documentation', item: absoluteUrl('/') }, { '@type': 'ListItem', position: 2, name: page.data.title, item: absoluteUrl(page.url) }] };
  return <DocsPage toc={page.data.toc} full={page.data.full}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([schema, breadcrumbs]).replace(/</g, '\\u003c') }} />
    <header className="docs-page-header">
      {version === 'next' && <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">Unreleased development documentation.</p>}
      {version && version !== 'next' && latest && version !== latest && <p className="rounded-lg border p-3 text-sm">You are reading {product} {version}. <a className="underline" href={`/blender-addons/${product}/latest`}>Read the latest version ({latest}).</a></p>}
      <DocsTitle>{page.data.title}</DocsTitle><DocsDescription>{page.data.description}</DocsDescription>
      <div className="flex flex-wrap items-center gap-4 text-sm text-fd-muted-foreground mb-4"><MarkdownCopyButton markdownUrl={`${page.url === '/' ? '/index' : page.url}.md`} /><a href={`${page.url === '/' ? '/index' : page.url}.md`}>Read Markdown</a>{version && <span>{version}</span>}</div>
    </header>
    <DocsBody><Content components={getMDXComponents()} /></DocsBody>
  </DocsPage>;
}
