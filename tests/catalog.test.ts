import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addRelease, CatalogSchema, compareVersions, selectedVersion, versionProvenance, type Catalog, type Snapshot } from '../lib/catalog.js';

const snapshot: Snapshot = { commit: 'a'.repeat(40), digest: 'b'.repeat(64), archive: 'archive/v1.zip', releaseId: 1, tag: '0.15.0', publishedAt: '2026-11-14T12:00:00Z', revision: 1 };
const empty: Catalog = { schemaVersion: 1, channel: 'production', siteCommit: 'c'.repeat(40), generation: 0, products: {} };

test('initial main baseline has distinct immutable release provenance', () => {
  const initial: Snapshot = { ...snapshot, releaseCommit: 'f'.repeat(40), bootstrap: { kind: 'initial-main', sourceBranch: 'main', approvedAt: '2026-11-21T13:45:20Z', reason: 'Approved migration baseline' } };
  const catalog = addRelease(empty, 'dna', '0.15.0', initial);
  assert.equal(versionProvenance(catalog.products.dna)['0.15.0'].kind, 'initial-main');
  assert.equal(versionProvenance(catalog.products.dna)['0.15.0'].releaseCommit, 'f'.repeat(40));
  assert.throws(() => addRelease(catalog, 'dna', '0.15.0', { ...initial, releaseCommit: 'e'.repeat(40) }));
  assert.throws(() => addRelease(empty, 'dna', '0.15.0', { ...initial, releaseCommit: undefined }));
  assert.equal(versionProvenance(addRelease(empty, 'dna', '0.15.0', snapshot).products.dna)['0.15.0'].kind, 'release-tag');
});

test('releasing one product preserves every other product and the approved site commit', () => {
  const first = addRelease(empty, 'dna', '0.15.0', snapshot);
  const second = addRelease(first, 'rig', '0.3.0', { ...snapshot, releaseId: 2, tag: '0.3.0' });
  assert.deepEqual(second.products.dna, first.products.dna);
  assert.equal(second.siteCommit, empty.siteCommit);
  assert.equal(Object.keys(first.products).length, 1);
});
test('maintenance releases do not replace latest and ordering is semantic', () => {
  const catalog = addRelease(addRelease(empty, 'dna', '0.15.0', snapshot), 'dna', '0.9.1', { ...snapshot, releaseId: 2, tag: '0.9.1' });
  assert.equal(catalog.products.dna.latest, '0.15.0');
  assert.equal(compareVersions('0.10.0', '0.9.99'), 1);
});
test('duplicate releases are idempotent; moved or recreated releases fail', () => {
  const catalog = addRelease(empty, 'dna', '0.15.0', snapshot);
  assert.deepEqual(addRelease(catalog, 'dna', '0.15.0', snapshot), catalog);
  assert.throws(() => addRelease(catalog, 'dna', '0.15.0', { ...snapshot, commit: 'd'.repeat(40) }));
  assert.throws(() => addRelease(catalog, 'dna', '0.15.0', { ...snapshot, releaseId: 4 }));
});
test('production never accepts next, prereleases, or dangling latest pointers', () => {
  assert.throws(() => CatalogSchema.parse({ ...empty, products: { dna: { latest: null, versions: {}, next: snapshot } } }));
  assert.throws(() => addRelease(empty, 'dna', '0.16.0-beta.1', snapshot));
  assert.throws(() => CatalogSchema.parse({ ...empty, products: { dna: { latest: '0.15.0', versions: {} } } }));
});
test('explicit unknown versions do not silently fall back to latest', () => {
  const catalog = addRelease(empty, 'dna', '0.15.0', snapshot);
  assert.equal(selectedVersion(catalog, 'dna'), '0.15.0');
  assert.equal(selectedVersion(catalog, 'dna', '0.14.0'), undefined);
  assert.equal(selectedVersion(catalog, 'dna', 'next'), undefined);
});
