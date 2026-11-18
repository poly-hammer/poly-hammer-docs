import build from '../.docs-build/site.json';
// Public configuration travels with the tested artifact, including server functions.
export const siteUrl = build.siteUrl;
export const isProduction = build.channel === 'production';
export const siteName = 'Poly Hammer Documentation';
export function absoluteUrl(url: string) { return new URL(url, siteUrl).toString(); }
