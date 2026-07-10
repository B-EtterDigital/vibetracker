import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { normalizeGenerations, inferCategory } from "../normalize.ts";
import { createLumaAdapter, createFixtureClient } from "../index.ts";
import type { LumaGeneration, LumaCredits } from "../client.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(
  readFileSync(join(HERE, "..", "__fixtures__", "generations.sample.json"), "utf8"),
) as { generations: LumaGeneration[]; credits: LumaCredits };

const gens = fixture.generations;
const completedCount = gens.filter((g) => g.state === "completed").length; // 5

// A representative (estimated) per-model credit price sheet for the map-based tests.
const CREDITS_BY_MODEL = { "ray-2": 5000, "ray-flash-2": 1500, "photon-1": 200, "photon-flash-1": 80 };

const ctx = { getSecret: async () => undefined, telemetry: { captureError() {}, addBreadcrumb() {} } };

test("only completed generations become usage records (failed/dreaming excluded)", () => {
  const recs = normalizeGenerations(gens);
  assert.equal(recs.length, completedCount);
  assert.ok(recs.every((r) => r.provider === "luma" && r.operation === "generate"));
  assert.ok(recs.every((r) => r.source === "feed_recon" && r.verified === false));
  assert.ok(recs.every((r) => r.quantity === 1));
});

test("without a credit map, records count one request at medium confidence", () => {
  const recs = normalizeGenerations(gens);
  assert.ok(recs.every((r) => r.unit === "request" && r.rawAmount === 1 && r.rawUnit === "request"));
  assert.ok(recs.every((r) => r.confidence === "medium" && r.usdEst === undefined));
});

test("with a credit map, records carry reconstructed credit cost at low confidence", () => {
  const recs = normalizeGenerations(gens, { creditsByModel: CREDITS_BY_MODEL });
  const ray2 = recs.find((r) => r.model === "ray-2");
  assert.equal(ray2?.unit, "credit");
  assert.equal(ray2?.rawAmount, 5000);
  assert.equal(ray2?.rawUnit, "credits");
  assert.ok(recs.every((r) => r.unit === "credit" && r.confidence === "low"));
});

test("usdEst is populated only when both a credit map and a usd rate are given", () => {
  const noRate = normalizeGenerations(gens, { creditsByModel: CREDITS_BY_MODEL });
  assert.ok(noRate.every((r) => r.usdEst === undefined));
  const withRate = normalizeGenerations(gens, { creditsByModel: CREDITS_BY_MODEL, creditUsd: 0.0001 });
  const ray2 = withRate.find((r) => r.model === "ray-2");
  assert.equal(ray2?.usdEst, 0.5); // 5000 credits * $0.0001
});

test("billableStates is configurable (include failed/dreaming)", () => {
  const all = normalizeGenerations(gens, { billableStates: ["completed", "failed", "dreaming"] });
  assert.equal(all.length, gens.length);
});

test("category inference from generation_type", () => {
  assert.equal(inferCategory("video"), "video");
  assert.equal(inferCategory("image"), "image");
  assert.equal(inferCategory("audio"), "other");
});

test("adapter.getUsage paginates the feed and filters by date range", async () => {
  const adapter = createLumaAdapter(createFixtureClient(gens, fixture.credits), { pageSize: 3 });

  const june = await adapter.getUsage({ from: "2026-06-01T00:00:00Z", to: "2026-06-30T23:59:59Z" }, ctx);
  assert.equal(june.length, 4); // 5 completed - 1 completed in May

  const narrow = await adapter.getUsage({ from: "2026-06-29T00:00:00Z", to: "2026-06-29T23:59:59Z" }, ctx);
  assert.equal(narrow.length, 2); // ray-2 video + photon-1 image on the 29th
});

test("adapter.getBalance converts the USD-cents credit balance", async () => {
  const adapter = createLumaAdapter(createFixtureClient(gens, fixture.credits));
  const bal = await adapter.getBalance!(ctx);
  assert.equal(bal.rawAmount, fixture.credits.credit_balance);
  assert.equal(bal.rawUnit, "usd_cents");
  assert.equal(bal.usdEst, Number((fixture.credits.credit_balance / 100).toFixed(2))); // 42.76
});

test("adapter identity + capabilities are honest (feed, no ledger)", () => {
  const adapter = createLumaAdapter(createFixtureClient(gens, fixture.credits));
  assert.equal(adapter.id, "luma");
  assert.deepEqual(adapter.categories, ["video", "image"]);
  assert.equal(adapter.auth.kind, "apiKey");
  assert.deepEqual(adapter.capabilities, { ledger: false, balance: true, feed: true });
});
