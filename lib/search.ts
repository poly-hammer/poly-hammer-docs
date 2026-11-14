import { createFromSource } from 'fumadocs-core/search/server';
import { source } from './source';
import { resolveProductVersion } from './published';

export const searchServer = createFromSource(source, {
  buildIndex(page) {
    const current = !page.data.product || page.data.version === resolveProductVersion(page.data.product);
    return { title: page.data.title, description: page.data.description, url: page.url, id: page.url, structuredData: page.data.structuredData, tag: [...(current ? ['current'] : []), ...(page.data.product ? [`${page.data.product}:${page.data.version}`] : ['central'])] };
  },
});
