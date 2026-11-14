import type { MetadataRoute } from 'next';
import { absoluteUrl, isProduction } from '@/lib/site';
export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: '*', ...(isProduction ? { allow: '/' } : { disallow: '/' }) }, ...(isProduction ? { sitemap: absoluteUrl('/sitemap.xml') } : {}) }; }
