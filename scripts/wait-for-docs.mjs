import { setTimeout as delay } from 'node:timers/promises';

// Alias metadata can be ready before Vercel's edge begins serving a new hostname.
// Wait only at startup; the full smoke suite must still pass without retries.
export async function waitForDocs(url, headers, {
  request = fetch, sleep = (ms = 0) => delay(ms), now = () => performance.now(),
  timeout = 60_000, interval = 3_000,
} = {}) {
  const deadline = now() + timeout;
  while (now() < deadline) {
    const response = await request(url, {
      headers, signal: AbortSignal.timeout(Math.max(1, Math.min(5_000, deadline - now()))),
    });
    await response.body?.cancel();
    if (response.status === 200) return;
    if (![404, 502, 503, 504].includes(response.status)) {
      throw new Error(`Documentation readiness: HTTP ${response.status}`);
    }
    await sleep(Math.max(0, Math.min(interval, deadline - now())));
  }
  throw new Error('Documentation hostname did not become ready within the deadline');
}
