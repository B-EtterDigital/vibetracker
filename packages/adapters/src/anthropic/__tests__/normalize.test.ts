import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { normalizeCostReport } from "../normalize.ts";
import { createAnthropicAdapter, createFixtureClient } from "../index.ts";
import type { AnthropicCostPage } from "../index.ts";

const page = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "__fixtures__", "cost_report.sample.json"), "utf8"),
) as AnthropicCostPage;

test("normalizeCostReport parses string USD amounts and skips zeros", () => {
  const recs = normalizeCostReport(page.data);
  assert.equal(recs.length, 3); // the $0 sonnet row dropped
  const opus = recs.find((r) => r.model === "claude-opus-4" && r.rawAmount > 40)!;
  assert.equal(opus.rawAmount, 42.175);
  assert.equal(opus.usdEst, 42.175);
  assert.equal(opus.rawUnit, "usd");
  assert.equal(opus.category, "llm");
});

test("adapter.getUsage sums real dollars across buckets", async () => {
  const adapter = createAnthropicAdapter(createFixtureClient(page));
  const ctx = { getSecret: async () => undefined, telemetry: { captureError() {}, addBreadcrumb() {} } };
  const recs = await adapter.getUsage({ from: "2026-05-01", to: "2026-07-01" }, ctx);
  const usd = recs.reduce((s, r) => s + (r.usdEst ?? 0), 0);
  assert.equal(recs.length, 3);
  assert.equal(Number(usd.toFixed(3)), 55.375); // 42.175 + 3.2 + 10
});
