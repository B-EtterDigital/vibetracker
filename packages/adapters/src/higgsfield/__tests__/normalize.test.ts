import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { normalizeTransactions, inferCategory } from "../normalize.ts";
import { createHiggsfieldAdapter, createFixtureClient } from "../index.ts";
import type { HiggsfieldPage } from "../client.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const page = JSON.parse(
  readFileSync(join(HERE, "..", "__fixtures__", "transactions.sample.json"), "utf8"),
) as HiggsfieldPage;

test("only spend/deduct become usage records (grants/refunds excluded)", () => {
  const recs = normalizeTransactions(page.items);
  assert.equal(recs.length, 6); // 8 items - 1 grant - 1 refund
  assert.ok(recs.every((r) => r.rawAmount > 0), "rawAmount is absolute");
  assert.ok(recs.every((r) => r.source === "ledger" && r.confidence === "high"));
});

test("category inference maps display names", () => {
  assert.equal(inferCategory("Nano Banana Pro"), "image");
  assert.equal(inferCategory("Seedance 1.0 Pro"), "video");
  assert.equal(inferCategory("Kling 2.1 Master"), "video");
  assert.equal(inferCategory("Voice Dubbing"), "audio");
  assert.equal(inferCategory("Something Unknown"), "other");
});

test("usdEst is populated only when a credit rate is given", () => {
  const withoutRate = normalizeTransactions(page.items);
  assert.ok(withoutRate.every((r) => r.usdEst === undefined));
  const withRate = normalizeTransactions(page.items, { creditUsd: 0.01 });
  const seedance = withRate.find((r) => r.model === "Seedance 1.0 Pro");
  assert.equal(seedance?.usdEst, 0.45); // 45 credits * $0.01
});

test("adapter.getUsage filters by date range and paginates via the client", async () => {
  const adapter = createHiggsfieldAdapter(
    createFixtureClient(page, { credits: 5848.5, subscription_plan_type: "ultra" }),
    { creditUsd: 0.01 },
  );
  const ctx = { getSecret: async () => undefined, telemetry: { captureError() {}, addBreadcrumb() {} } };

  const all = await adapter.getUsage({ from: "2026-06-01", to: "2026-06-30" }, ctx);
  assert.equal(all.length, 6);

  const narrow = await adapter.getUsage({ from: "2026-06-29T00:00:00Z", to: "2026-06-29T23:59:59Z" }, ctx);
  assert.equal(narrow.length, 3); // 2x Nano Banana + 1x Seedance on the 29th
});

test("adapter.getBalance returns current credits", async () => {
  const adapter = createHiggsfieldAdapter(
    createFixtureClient(page, { credits: 5848.5, subscription_plan_type: "ultra" }),
    { creditUsd: 0.01 },
  );
  const ctx = { getSecret: async () => undefined, telemetry: { captureError() {}, addBreadcrumb() {} } };
  const bal = await adapter.getBalance!(ctx);
  assert.equal(bal.rawAmount, 5848.5);
  assert.equal(bal.usdEst, 58.48); // 5848.5 * 0.01, JS float .toFixed(2) — usdEst is an estimate

});
