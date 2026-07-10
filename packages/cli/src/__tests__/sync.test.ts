import { test } from "node:test";
import assert from "node:assert/strict";
import { runSync } from "../sync.ts";
import type { Adapter } from "../../../core/src/adapter.ts";

const rec: any = {
  ts: "2026-06-01T00:00:00Z", provider: "x", category: "other", operation: "op",
  quantity: 1, unit: "request", rawAmount: 1, rawUnit: "request",
  source: "ledger", confidence: "high", verified: false,
};

function fakeAdapter(id: string, records: any[], throwMsg?: string): Adapter {
  return {
    id, categories: ["other"], auth: { kind: "none" },
    capabilities: { ledger: false, balance: false, feed: false },
    async getUsage() { if (throwMsg) throw new Error(throwMsg); return records; },
  };
}

const ctx = { getSecret: async () => undefined, telemetry: { captureError() {}, addBreadcrumb() {} } };
const range = { from: "2000-01-01", to: "2100-01-01" };

test("runSync collects per-provider records and isolates a failing provider", async () => {
  const results = await runSync([
    { id: "good", adapter: fakeAdapter("good", [rec]) },
    { id: "bad", adapter: fakeAdapter("bad", [], "boom") },
    { id: "good2", adapter: fakeAdapter("good2", [rec, rec]) },
  ], range, ctx);

  assert.equal(results.length, 3);
  assert.equal(results[0].records.length, 1);
  assert.equal(results[1].error, "boom");        // failure surfaced, not swallowed
  assert.equal(results[1].records.length, 0);
  assert.equal(results[2].records.length, 2);    // sync continued past the failure
});
