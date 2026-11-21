import assert from 'node:assert/strict';
import test from 'node:test';
import { waitForDocs } from '../scripts/wait-for-docs.mjs';

function edge(statuses: number[]) {
  let elapsed = 0;
  let attempts = 0;
  return {
    get attempts() { return attempts; },
    options: {
      request: async () => new Response(null, { status: statuses[Math.min(attempts++, statuses.length - 1)] }),
      now: () => elapsed,
      sleep: async (ms = 0) => { elapsed += ms; },
      timeout: 30, interval: 10,
    },
  };
}

test('initial alias propagation can settle before strict smoke checks begin', async () => {
  const server = edge([404, 503, 200]);
  await waitForDocs('https://docs.example.com/api/versions', {}, server.options);
  assert.equal(server.attempts, 3);
});

test('a permanently missing hostname fails within the readiness deadline', async () => {
  const server = edge([404]);
  await assert.rejects(waitForDocs('https://docs.example.com/api/versions', {}, server.options), /deadline/);
  assert.equal(server.attempts, 3);
});

test('authentication and application errors fail immediately', async () => {
  for (const status of [401, 403, 500]) {
    const server = edge([status, 200]);
    await assert.rejects(waitForDocs('https://docs.example.com/api/versions', {}, server.options), new RegExp(`HTTP ${status}`));
    assert.equal(server.attempts, 1);
  }
});
