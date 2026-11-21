import catalogData from '../.docs-build/published-catalog.json';
import { CatalogSchema, selectedVersion } from './catalog';
import { source } from './source';

export const catalog = CatalogSchema.parse(catalogData);
export function resolveProductVersion(product: string, version?: string) { return selectedVersion(catalog, product, version); }
export function publishedPages(product?: string, version?: string) {
  if (product) {
    const selected = resolveProductVersion(product, version);
    return selected ? source.getPages().filter(page => page.data.product === product && page.data.version === selected) : [];
  }
  return source.getPages().filter(page => !page.data.product || page.data.version === resolveProductVersion(page.data.product));
}
