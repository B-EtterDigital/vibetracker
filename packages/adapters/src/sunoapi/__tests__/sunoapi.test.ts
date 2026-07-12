import { test } from "node:test";
import assert from "node:assert/strict";
import { balanceRecord } from "../normalize.ts";
import { createSunoApiAdapter, createFixtureClient } from "../index.ts";

const ctx = { getSecret: async () => undefined, telemetry: { captureError() {}, addBreadcrumb() {} } };
const NOW = "2026-07-12T00:00:00.000Z";

test("balanceRecord: a credit balance becomes a labelled music balance snapshot", () => {
  const rec = balanceRecord(742, { now: NOW });
  assert.equal(rec.provider, "sunoapi");
  assert.equal(rec.category, "music");
  assert.equal(rec.operation, "balance");
  assert.equal(rec.rawAmount, 742);
  assert.equal(rec.rawUnit, "credits");
  assert.equal(rec.source, "balance_delta"); // a balance reading, not per-op spend
  assert.equal(rec.verified, false);
  assert.equal(rec.usdEst, undefined); // no rate -> no usd
  assert.equal(rec.ts, NOW);
});

test("creditUsd estimates usd from the balance", () => {
  const rec = balanceRecord(1000, { now: NOW, creditUsd: 0.1 });
  assert.equal(rec.usdEst, 100);
});

test("negative balances clamp to zero", () => {
  assert.equal(balanceRecord(-5, { now: NOW }).rawAmount, 0);
});

test("adapter.getUsage returns the balance snapshot; getBalance reports credits", async () => {
  const adapter = createSunoApiAdapter(createFixtureClient({ credits: 500 }), { now: NOW, creditUsd: 0.1 });
  const usage = await adapter.getUsage({ from: "2026-01-01", to: "2026-12-31" }, ctx);
  assert.equal(usage.length, 1);
  assert.equal(usage[0].provider, "sunoapi");
  assert.equal(usage[0].rawAmount, 500);
  assert.equal(usage[0].usdEst, 50);

  const bal = await adapter.getBalance!(ctx);
  assert.equal(bal.rawAmount, 500);
  assert.equal(bal.rawUnit, "credits");
});
