import assert from 'node:assert/strict';
import test from 'node:test';
import { HiddenPathsSchema, isPathVisible, visibleContent, visibleMeta } from '../lib/visibility';

test('visibility matches complete route prefixes and rejects ambiguous configuration', () => {
  const hidden = HiddenPathsSchema.parse(['cli', 'blender-addons/ph-motion', 'cli']);
  for (const route of ['/cli', '/cli.md', '/cli/index', '/blender-addons/ph-motion/0.15.0/guide']) assert(!isPathVisible(route, hidden));
  for (const route of ['/client', '/blender-addons/ph-motion-extra', '/portal']) assert(isPathVisible(route, hidden));
  for (const value of [['/cli'], ['../cli'], ['cli?x'], ['*'], 'cli']) assert(!HiddenPathsSchema.safeParse(value).success);
});

test('hidden cards and nav entries cannot enter HTML, search or Markdown; code examples remain literal', () => {
  const input = '<Cards>\n<Card title="Secret product" href="/cli" description="secret-marker" />\n<Card title="Portal" href="/portal" />\n</Cards>\n\nSee [the tool](/cli/setup) and [Portal](/portal).\n\n```mdx\n<Card href="/cli" />\n```';
  const output = visibleContent(input, ['cli']);
  assert(!output.includes('secret-marker'));
  assert(output.includes('href="/portal"'));
  assert(output.includes('See the tool and [Portal](/portal)'));
  assert(output.includes('```mdx\n<Card href="/cli" />\n```'));
  assert.deepEqual(visibleMeta({ pages: ['index', 'cli', '[CLI](/cli)', 'portal'] }, '', ['cli']).pages, ['index', 'portal']);
  assert.deepEqual(visibleMeta({ pages: ['character-dna', 'ph-motion'] }, 'blender-addons', ['blender-addons/ph-motion']).pages, ['character-dna']);
});
