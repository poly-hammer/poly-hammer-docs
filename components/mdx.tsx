import defaultComponents from 'fumadocs-ui/mdx';
import { asMarkdown, md } from 'fumadocs-core/server';
import type { MDXComponents } from 'mdx/types';
import { absoluteUrl } from '@/lib/site';

type VideoProps = { src: string; title: string; poster?: string; autoPlay?: boolean; loop?: boolean; muted?: boolean };
export function DocVideo({ src, title, poster, ...playback }: VideoProps) {
  if (asMarkdown()) return md`[Video: ${title}](${absoluteUrl(src)})`;
  return <figure><video {...playback} src={src} poster={poster} controls playsInline preload="metadata" aria-label={title} className="w-full rounded-xl"><a href={src}>Watch: {title}</a></video><figcaption>{title}</figcaption></figure>;
}
export function DocImage({ src, alt, width }: { src: string; alt: string; width?: string }) {
  if (asMarkdown()) return md`![${alt}](${absoluteUrl(src)})`;
  return <img src={src} alt={alt} width={width} loading="lazy" className="max-w-full rounded-lg mx-auto" />;
}
export function YouTubeEmbed({ src, title }: { src: string; title: string }) {
  if (asMarkdown()) return md`[Video tutorial: ${title}](${src})`;
  if (!/^https:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\//.test(src)) throw new Error('Unsupported video embed origin');
  return <figure><iframe src={src} title={title} loading="lazy" allowFullScreen className="w-full aspect-video rounded-xl border-0" /><figcaption>{title}</figcaption></figure>;
}
export function getMDXComponents(components?: MDXComponents) { return { ...defaultComponents, DocVideo, DocImage, YouTubeEmbed, ...components } satisfies MDXComponents; }
export const useMDXComponents = getMDXComponents;
declare global { type MDXProvidedComponents = ReturnType<typeof getMDXComponents>; }
