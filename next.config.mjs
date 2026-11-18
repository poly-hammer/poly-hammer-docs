import { createMDX } from 'fumadocs-mdx/next';
import redirects from './legacy-redirects.json' with { type: 'json' };
import fs from 'node:fs';

export default createMDX()({
  reactStrictMode: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  async headers() {
    const build = fs.existsSync('.docs-build/site.json') ? JSON.parse(fs.readFileSync('.docs-build/site.json', 'utf8')) : {};
    return build.channel === 'production' ? [] : [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }];
  },
  async rewrites() { return { beforeFiles: [{ source: '/:path*.md', destination: '/markdown/:path*' }], afterFiles: [], fallback: [] }; },
  async redirects() {
    const catalog = fs.existsSync('.docs-build/catalog.json') ? JSON.parse(fs.readFileSync('.docs-build/catalog.json', 'utf8')) : { products: {} };
    const versions = Object.entries(catalog.products).flatMap(([product, entry]) => {
      const version = entry.latest ?? (entry.next ? 'next' : null);
      return version ? [
        { source: `/blender-addons/${product}/latest/:path*`, destination: `/blender-addons/${product}/${version}/:path*`, permanent: false },
        { source: `/blender-addons/${product}`, destination: `/blender-addons/${product}/${version}`, permanent: false },
      ] : [];
    });
    return [
      ...versions,
      ...(fs.existsSync('.docs-build/legacy-assets.json') ? JSON.parse(fs.readFileSync('.docs-build/legacy-assets.json', 'utf8')) : []),
      ...Object.entries(redirects).map(([source, destination]) => ({ source, destination, permanent: true })),
      ...['character-dna', 'character-control-rig', 'character-assembly'].map(product => ({ source: `/${product}-addon/:path*`, destination: `/blender-addons/${product}/latest/:path*`, permanent: true })),
      { source: '/poly-hammer-portal/:path*', destination: '/portal/:path*', permanent: true },
      { source: '/poly-hammer-interchange/:path*', destination: '/unreal-plugins/poly-hammer-interchange/:path*', permanent: true },
      { source: '/ph-motion-addon/:path*', destination: '/blender-addons/ph-motion/latest/:path*', permanent: true },
      { source: '/ph-motion/:path*', destination: '/blender-addons/ph-motion/latest/:path*', permanent: true },
    ];
  },
});
