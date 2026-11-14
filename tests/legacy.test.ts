import { test } from 'node:test';
import assert from 'node:assert/strict';
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
