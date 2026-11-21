import { catalog } from '@/lib/published';
import { compareVersions, versionProvenance } from '@/lib/catalog';
export async function GET() {
  return Response.json({ channel: catalog.channel, products: Object.fromEntries(Object.entries(catalog.products).map(([id, product]) => [id, { latest: product.latest, versions: Object.keys(product.versions).sort((a, b) => compareVersions(b, a)), provenance: versionProvenance(product), unreleased: Boolean(product.next) }])) });
}
