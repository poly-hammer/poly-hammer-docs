import { z } from 'zod';
import { HiddenPathsSchema } from './visibility';

export const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
export const shaPattern = /^[a-f0-9]{40}$/;
export const digestPattern = /^[a-f0-9]{64}$/;

export const SnapshotSchema = z.object({
  commit: z.string().regex(shaPattern),
  digest: z.string().regex(digestPattern),
  archive: z.string().min(1),
  releaseId: z.number().int().positive().optional(),
  tag: z.string().optional(),
  publishedAt: z.iso.datetime(),
  revision: z.number().int().positive().default(1),
}).strict();
export const ProductSchema = z.object({
  latest: z.string().regex(versionPattern).nullable(),
  versions: z.record(z.string().regex(versionPattern), SnapshotSchema),
  next: SnapshotSchema.optional(),
}).strict().superRefine((product, ctx) => {
  if (product.latest && !product.versions[product.latest]) ctx.addIssue({ code: 'custom', message: 'Latest must refer to an archived version' });
});
export const CatalogSchema = z.object({
  schemaVersion: z.literal(1),
  channel: z.enum(['local', 'staging', 'production']),
  siteCommit: z.string().regex(shaPattern),
  generation: z.number().int().nonnegative(),
  hiddenPaths: HiddenPathsSchema.optional(),
  products: z.record(z.string().regex(/^[a-z0-9-]+$/), ProductSchema),
}).strict().superRefine((catalog, ctx) => {
  if (catalog.channel === 'production' && Object.values(catalog.products).some(p => p.next)) ctx.addIssue({ code: 'custom', message: 'Production cannot contain unreleased snapshots' });
});
export type Catalog = z.infer<typeof CatalogSchema>;
export type Snapshot = z.infer<typeof SnapshotSchema>;

export function compareVersions(a: string, b: string): number {
  if (!versionPattern.test(a) || !versionPattern.test(b)) throw new Error('Only stable semantic versions are accepted');
  const aa = a.split('.').map(BigInt), bb = b.split('.').map(BigInt);
  for (let i = 0; i < 3; i++) if (aa[i] !== bb[i]) return aa[i] > bb[i] ? 1 : -1;
  return 0;
}

export function addRelease(input: Catalog, product: string, version: string, snapshot: Snapshot): Catalog {
  const catalog = CatalogSchema.parse(structuredClone(input));
  if (!versionPattern.test(version)) throw new Error('Prereleases cannot enter the stable catalog');
  const verified = SnapshotSchema.parse(snapshot);
  if (!verified.releaseId || !verified.tag) throw new Error('Stable snapshots require release provenance');
  const entry = catalog.products[product] ?? { latest: null, versions: {} };
  const previous = entry.versions[version];
  if (previous) {
    if (previous.commit !== verified.commit || previous.digest !== verified.digest || previous.releaseId !== verified.releaseId) throw new Error('Published version identity changed; use an explicit documentation revision');
    return catalog;
  }
  entry.versions[version] = verified;
  if (!entry.latest || compareVersions(version, entry.latest) > 0) entry.latest = version;
  catalog.products[product] = entry;
  catalog.generation += 1;
  return CatalogSchema.parse(catalog);
}

export function selectedVersion(catalog: Catalog, product: string, version?: string): string | undefined {
  const entry = catalog.products[product];
  if (!entry) return undefined;
  if (version === 'next') return catalog.channel !== 'production' && entry.next ? 'next' : undefined;
  if (!version || version === 'latest') return entry.latest ?? (catalog.channel !== 'production' && entry.next ? 'next' : undefined);
  return entry.versions[version] ? version : undefined;
}
