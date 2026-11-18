import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';
import { absoluteUrl, isProduction } from '@/lib/site';
export default function sitemap(): MetadataRoute.Sitemap { return isProduction ? source.getPages().filter(page => page.data.version !== 'next').map(page => ({ url: absoluteUrl(page.url), ...(page.data.updatedAt ? { lastModified: page.data.updatedAt } : {}) })) : []; }
