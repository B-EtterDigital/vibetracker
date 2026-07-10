import { test } from "node:test";
import assert from "node:assert/strict";
import { createOpenRouterAdapter, createFixtureClient } from "../index.ts";

const ctx = { getSecret: async () => undefined, telemetry: { captureError() {}, addBreadcrumb() {} } };
const range = { from: "2000-01-01", to: "2100-01-01" };

test("getUsage emits a to-date USD snapshot", async () => {
  const a = createOpenRouterAdapter(createFixtureClient({ total_credits: 50, total_usage: 12.34 }), { snapshotTs: "2026-07-02T00:00:00Z" });
  const recs = await a.getUsage(range, ctx);
  assert.equal(recs.length, 1);
  assert.equal(recs[0].provider, "openrouter");
  assert.equal(recs[0].usdEst, 12.34);
  assert.equal(recs[0].rawUnit, "usd");
  assert.equal(recs[0].source, "balance_delta");
});

test("getBalance returns remaining USD credits", async () => {
  const a = createOpenRouterAdapter(createFixtureClient({ total_credits: 50, total_usage: 12.34 }));
  const bal = await a.getBalance!(ctx);
  assert.equal(bal.rawAmount, 37.66);
  assert.equal(bal.rawUnit, "usd");
});

test("no usage yet → no snapshot record", async () => {
  const a = createOpenRouterAdapter(createFixtureClient({ total_credits: 5, total_usage: 0 }));
  assert.equal((await a.getUsage(range, ctx)).length, 0);
});
