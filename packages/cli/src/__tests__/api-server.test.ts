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

test("local API /connect stores allowlisted cookie creds without leaking values", async () => {
  const stored: Array<{ provider: string; fields: string[] }> = [];
  const logs: string[] = [];
  const session = await startLocalApiServer({
    port: 0,
    token: "test-session-token",
    deps: {
      readRecords: () => [],
      appendRecords: () => {},
      log: (line) => logs.push(line),
      connectProvider: (provider, fields) => {
        stored.push({ provider, fields: Object.keys(fields) });
        return { stored: Object.keys(fields), keyring: true };
      },
    },
  });
  const base = `http://127.0.0.1:${session.port}`;
  const ext = "chrome-extension://vibetracker-test";
  try {
    // happy path: known provider, allowlisted field, from the extension origin
    const ok = await fetch(`${base}/connect`, {
      method: "POST",
      headers: { origin: ext, "content-type": "application/json" },
      body: JSON.stringify({ provider: "suno", fields: { sessionCookie: "SECRET_VALUE" } }),
    });
    assert.equal(ok.status, 200);
    const okBody = await ok.json() as { provider: string; stored: string[] };
    assert.equal(okBody.provider, "suno");
    assert.deepEqual(okBody.stored, ["sessionCookie"]);
    assert.equal(stored[0].provider, "suno");
    // the secret value must never appear in any server log line
    assert.equal(logs.some((l) => l.includes("SECRET_VALUE")), false);

    // unknown provider is refused
    const badProvider = await fetch(`${base}/connect`, {
      method: "POST", headers: { origin: ext, "content-type": "application/json" },
      body: JSON.stringify({ provider: "evil", fields: { sessionCookie: "x" } }),
    });
    assert.equal(badProvider.status, 400);

    // a field not on the provider's allowlist is refused
    const badField = await fetch(`${base}/connect`, {
      method: "POST", headers: { origin: ext, "content-type": "application/json" },
      body: JSON.stringify({ provider: "suno", fields: { apiKey: "x" } }),
    });
    assert.equal(badField.status, 400);

    // a non-extension origin cannot reach /connect at all
    const hostile = await fetch(`${base}/connect`, {
      method: "POST", headers: { origin: "https://hostile.example", "content-type": "application/json" },
      body: JSON.stringify({ provider: "suno", fields: { sessionCookie: "x" } }),
    });
    assert.equal(hostile.status, 403);
  } finally {
    await new Promise<void>((resolve, reject) => session.server.close((error) => error ? reject(error) : resolve()));
  }
});

test("local API /capture replaces snapshots (re-reading a lifetime total never double-counts)", async () => {
  let store: NormalizedRecord[] = [];
  const session = await startLocalApiServer({
    port: 0, token: "t",
    deps: {
      readRecords: () => store,
      appendRecords: (records) => { store = [...store, ...records]; },
      replaceSnapshot: (rec) => {
        store = store.filter((r) => !(r.source === "manual" && r.provider === rec.provider && r.operation === rec.operation));
        store.push(rec);
      },
      log: () => {},
    },
  });
  const base = `http://127.0.0.1:${session.port}`;
  const ext = "chrome-extension://x";
  const readMidjourney = (n: number) => fetch(`${base}/capture`, {
    method: "POST", headers: { origin: ext, "content-type": "application/json" },
    body: JSON.stringify({ provider: "midjourney", category: "image", operation: "lifetime_images", quantity: n, unit: "image", snapshot: true }),
  });
  try {
    await readMidjourney(3982);
    await readMidjourney(4050); // re-read with a newer total
    await readMidjourney(4120); // and again
    const mj = store.filter((r) => r.provider === "midjourney" && r.operation === "lifetime_images");
    assert.equal(mj.length, 1, "only ONE lifetime record survives");
    assert.equal(mj[0].quantity, 4120, "it holds the latest value");

    // a non-snapshot capture still appends normally
    await fetch(`${base}/capture`, {
      method: "POST", headers: { origin: ext, "content-type": "application/json" },
      body: JSON.stringify({ provider: "browser-test", quantity: 1 }),
    });
    assert.equal(store.filter((r) => r.provider === "browser-test").length, 1);
  } finally {
    await new Promise<void>((resolve, reject) => session.server.close((error) => error ? reject(error) : resolve()));
  }
});

test("local API /health answers the extension's token-free liveness probe", async () => {
  const session = await startLocalApiServer({
    port: 0, token: "t",
    deps: { readRecords: () => [], appendRecords: () => {}, log: () => {} },
  });
  const base = `http://127.0.0.1:${session.port}`;
  try {
    // the extension probes /health with NO bearer token — must succeed
    const health = await fetch(`${base}/health`, { headers: { origin: "chrome-extension://x" } });
    assert.equal(health.status, 200);
    assert.equal((await health.json() as { ok: boolean }).ok, true);
    // but a data read is not even reachable from the extension origin (stricter than 401)
    const stats = await fetch(`${base}/stats`, { headers: { origin: "chrome-extension://x" } });
    assert.equal(stats.status, 403);
  } finally {
    await new Promise<void>((resolve, reject) => session.server.close((error) => error ? reject(error) : resolve()));
  }
});

test("local API /connect is disabled when the CLI does not provide connectProvider", async () => {
  const session = await startLocalApiServer({
    port: 0, token: "t",
    deps: { readRecords: () => [], appendRecords: () => {}, log: () => {} },
  });
  const base = `http://127.0.0.1:${session.port}`;
  try {
    const res = await fetch(`${base}/connect`, {
      method: "POST",
      headers: { origin: "chrome-extension://x", "content-type": "application/json" },
      body: JSON.stringify({ provider: "suno", fields: { sessionCookie: "x" } }),
    });
    assert.equal(res.status, 501);
  } finally {
    await new Promise<void>((resolve, reject) => session.server.close((error) => error ? reject(error) : resolve()));
  }
});
