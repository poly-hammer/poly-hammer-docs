import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compile } from '@mdx-js/mdx';
import { normalizeLegacy, convertAdmonitions } from '../lib/legacy.js';

test('callout conversion retains nested lists/code and ends at the next unindented paragraph', () => {
  const converted = convertAdmonitions('!!! warning "Version"\n    Keep this.\n\n    - One\n    - Two\n\nNext paragraph.');
  assert.match(converted, /<Callout type="warn" title="Version">/);
  assert.match(converted, /- One\n- Two/);
  assert.ok(converted.indexOf('</Callout>') < converted.indexOf('Next paragraph.'));
});
test('conversion never transforms syntax examples inside fenced code', () => {
  const result = normalizeLegacy('# Test\n\nIntro.\n\n```md\n!!! note\n    Example\n<img src="x.png">\n```');
  assert.match(result.content, /!!! note\n    Example/);
  assert.match(result.content, /<img src="x.png">/);
});
test('videos retain their source, poster, title and playback behavior', () => {
  const result = normalizeLegacy('# Test\n\n<video autoplay muted loop poster="../x.png" aria-label="Importing DNA"><source src="../x.webm" type="video/webm"></video>');
  assert.match(result.content, /<DocVideo src="\.\.\/x.webm" poster="\.\.\/x.png" title="Importing DNA" autoPlay loop muted/);
});

test('legacy prose comparisons compile without changing code or existing escapes', async () => {
  const input = '# Targets\n\nRequire <=25% and keep {threshold}. Already \\<=25%.\n\n`new / baseline <= 0.25`\n\n```text\n<=25% {threshold}\n```';
  const result = normalizeLegacy(input);
  assert.ok(result.content.includes('Require &lt;=25% and keep &#123;threshold&#125;. Already \\<=25%.'));
  assert.ok(result.content.includes('`new / baseline <= 0.25`'));
  assert.ok(result.content.includes('```text\n<=25% {threshold}\n```'));
  await compile(result.content);
});

test('legacy autolinks become MDX links while inline examples remain literal', async () => {
  const result = normalizeLegacy('# Development\n\nUse <https://api.example.com> or <http://localhost:8000>. Contact <docs@example.com>.\n\n`<https://api.example.com>`');
  assert.ok(result.content.includes('[https://api.example.com](<https://api.example.com>)'));
  assert.ok(result.content.includes('[http://localhost:8000](<http://localhost:8000>)'));
  assert.ok(result.content.includes('[docs@example.com](<mailto:docs@example.com>)'));
  assert.ok(result.content.includes('`<https://api.example.com>`'));
  await compile(result.content);
});

test('private links outside the docs folder retain a source reference without publishing private code links', async () => {
  const input = '# Development\n\nSee the [native guide](../../native/README.md) for details. See [setup](setup.md) too.';
  const context = { directory: 'docs', relativePage: 'contributing/development.md', private: true };
  const result = normalizeLegacy(input, context);
  assert.ok(result.content.includes('native guide in the source repository (native/README.md)'));
  assert.ok(result.content.includes('[setup](setup.md)'));
  assert.ok(normalizeLegacy(input, { ...context, private: false }).content.includes('[native guide](../../native/README.md)'));
  await compile(result.content);
});
