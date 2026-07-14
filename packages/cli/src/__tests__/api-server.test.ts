import assert from "node:assert/strict";
import { test } from "node:test";
import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import { startLocalApiServer } from "../api-server.ts";

const record: NormalizedRecord = {
  ts: "2026-07-14T00:00:00.000Z",
  provider: "codex-cli",
  category: "coding",
  operation: "session",
  quantity: 12,
  unit: "request",
  rawAmount: 12,
  rawUnit: "request",
  usdEst: 4.25,
  source: "log",
  confidence: "high",
  verified: false,
};

test("local API protects usage reads and issues a fragment-only dashboard session", async () => {
  const appended: NormalizedRecord[] = [];
  const logs: string[] = [];
  const session = await startLocalApiServer({
    port: 0,
    token: "test-session-token",
    deps: {
      readRecords: () => [record],
      appendRecords: (records) => appended.push(...records),
      log: (line) => logs.push(line),
    },
  });
  const base = `http://127.0.0.1:${session.port}`;
  const origin = "https://vibetracker-betterdigital.netlify.app";

  try {
    const missingToken = await fetch(`${base}/stats`, { headers: { origin } });
    assert.equal(missingToken.status, 401);

    const hostileOrigin = await fetch(`${base}/stats`, {
      headers: { origin: "https://hostile.example", authorization: `Bearer ${session.token}` },
    });
    assert.equal(hostileOrigin.status, 403);

    const stats = await fetch(`${base}/stats`, {
      headers: { origin, authorization: `Bearer ${session.token}` },
    });
    assert.equal(stats.status, 200);
    assert.equal(stats.headers.get("access-control-allow-origin"), origin);
    assert.equal(stats.headers.get("access-control-allow-private-network"), "true");
    assert.equal(stats.headers.get("cache-control"), "no-store");
    assert.equal((await stats.json() as { totals: { count: number } }).totals.count, 1);

    const canonicalOrigin = await fetch(`${base}/health`, {
      headers: { origin: "https://vibeusage.c0vibe.app", authorization: `Bearer ${session.token}` },
    });
    assert.equal(canonicalOrigin.status, 200);

    const preflight = await fetch(`${base}/insights`, {
      method: "OPTIONS",
      headers: {
        origin,
        "access-control-request-private-network": "true",
        "access-control-request-headers": "authorization",
      },
    });
    assert.equal(preflight.status, 204);
    assert.match(preflight.headers.get("access-control-allow-headers") ?? "", /authorization/);

    const capture = await fetch(`${base}/capture`, {
      method: "POST",
      headers: { origin: "chrome-extension://vibetracker-test", "content-type": "application/json" },
      body: JSON.stringify({ provider: "browser-test", quantity: 1 }),
    });
    assert.equal(capture.status, 200);
    assert.equal(appended.length, 1);

    const url = new URL(session.dashboardUrl);
    assert.equal(url.origin, origin);
    assert.equal(url.search, "");
    assert.equal(url.hash, `#local=${session.token}&port=${session.port}`);
    assert.equal(logs.some((line) => line.includes(session.dashboardUrl)), true);
  } finally {
    await new Promise<void>((resolve, reject) => session.server.close((error) => error ? reject(error) : resolve()));
  }
});
