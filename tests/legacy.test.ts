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

test('MkDocs image and text attributes are converted before escaping prose', async () => {
  const input = '# Rig Instances\n\nManage rigs.\n\n![Rig](../images/rig.png){: class="rounded-image center-image"}\n\n![Maps](../images/maps.png)\n{: class="center-image" style="width:500px"}\n\nUse [the guide](guide.md){: target="blank"} and **Red**{: class="red"}.';
  const result = normalizeLegacy(input);
  assert.ok(result.content.includes('<DocImage src="../images/rig.png" alt="Rig" />'));
  assert.ok(result.content.includes('<DocImage src="../images/maps.png" alt="Maps" width="500" />'));
  assert.ok(result.content.includes('Use [the guide](guide.md) and **Red**.'));
  assert.doesNotMatch(result.content, /(?:\{|&#123;):|rounded-image|center-image/);
  await compile(result.content);
});

test('MkDocs attribute syntax remains intact inside code examples', async () => {
  const example = '![Rig](rig.png){: class="rounded-image"}';
  const result = normalizeLegacy(`# Examples\n\nKeep code literal.\n\n\`${example}\`\n\n\`\`\`md\n${example}\n\`\`\``);
  assert.ok(result.content.includes(`\`${example}\``));
  assert.ok(result.content.includes(`\`\`\`md\n${example}\n\`\`\``));
  await compile(result.content);
});

test('generated descriptions retain the complete introductory paragraph', () => {
  const intro = 'A [Rig Instance](terminology.md) ties together components (i.e., head and body) which trigger RigLogic evaluations per `.dna` file. This panel manages the instances in your scene and the data each one links to. The sidebar is context-sensitive to the **active** instance selected here.';
  const result = normalizeLegacy(`# Rig Instances\n\n${intro}\n\n## Settings\n\nOther content.`);
  assert.equal(result.description, intro.replace('[Rig Instance](terminology.md)', 'Rig Instance').replace(/[*`]/g, ''));
  assert.ok(result.description.length > 190);
  assert.ok(result.description.endsWith('instance selected here.'));
  assert.equal(normalizeLegacy(`---\ntitle: Rig Instances\ndescription: An authored summary.\n---\n\n${intro}`).description, 'An authored summary.');
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
