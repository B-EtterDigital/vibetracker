import { test } from "node:test";
import assert from "node:assert/strict";
import { createUsageAdapter, createFixtureUsageClient, usageItemsToRecords, type UsageItem } from "../http-usage.ts";

const items: UsageItem[] = [
  { ts: "2026-06-01T10:00:00Z", model: "grok-3", amount: 1500, unit: "token", usd: 0.02, category: "llm" },
  { ts: "2026-06-02T10:00:00Z", operation: "pod", amount: 3600, unit: "second", usd: 0.5, category: "other" },
  { ts: "", amount: 0, unit: "token" }, // dropped (no ts / zero amount)
];
const ctx = { getSecret: async () => undefined, telemetry: { captureError() {}, addBreadcrumb() {} } };

test("usageItemsToRecords maps items, drops empties, tags ledger + usdEst", () => {
  const recs = usageItemsToRecords(items, "huggingface", "other");
  assert.equal(recs.length, 2);
  assert.ok(recs.every((r) => r.provider === "huggingface" && r.source === "ledger"));
  assert.equal(recs[0].usdEst, 0.02);
  assert.equal(recs[1].unit, "second");
});

test("createUsageAdapter.getUsage filters by range", async () => {
  const a = createUsageAdapter({ id: "runpod", categories: ["other"], client: createFixtureUsageClient(items) });
  assert.equal((await a.getUsage({ from: "2026-06-01", to: "2026-06-30" }, ctx)).length, 2);
  assert.equal((await a.getUsage({ from: "2026-06-02", to: "2026-06-30" }, ctx)).length, 1);
});
