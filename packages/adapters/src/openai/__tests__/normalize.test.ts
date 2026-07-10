import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { normalizeCosts, inferCategory } from "../normalize.ts";
import { createOpenAIAdapter, createFixtureClient } from "../index.ts";
import type { OpenAICostsPage } from "../index.ts";

const page = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "__fixtures__", "costs.sample.json"), "utf8"),
) as OpenAICostsPage;

test("normalizeCosts skips zero-value line items and keeps real USD", () => {
  const recs = normalizeCosts(page.data);
  assert.equal(recs.length, 3); // whisper (0) dropped
  assert.ok(recs.every((r) => r.rawUnit === "usd" && r.usdEst === r.rawAmount));
  assert.ok(recs.every((r) => r.source === "ledger"));
});

test("category inference from line item", () => {
  assert.equal(inferCategory("dall-e-3"), "image");
  assert.equal(inferCategory("whisper-1"), "audio");
  assert.equal(inferCategory("gpt-4o-2024-08-06"), "llm");
});

test("adapter.getUsage sums real dollars across buckets", async () => {
  const adapter = createOpenAIAdapter(createFixtureClient(page));
  const ctx = { getSecret: async () => undefined, telemetry: { captureError() {}, addBreadcrumb() {} } };
  const recs = await adapter.getUsage({ from: "2020-01-01", to: "2100-01-01" }, ctx);
  const usd = recs.reduce((s, r) => s + (r.usdEst ?? 0), 0);
  assert.equal(recs.length, 3);
  assert.equal(Number(usd.toFixed(2)), 20.7); // 12.5 + 3.2 + 5.0
});
