import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { normalizeUsage, inferCategory, inferOperation } from "../normalize.ts";
import { createRunwayAdapter, createFixtureClient } from "../index.ts";
import type { RunwayUsageResponse, RunwayOrganization } from "../client.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const usage = JSON.parse(
  readFileSync(join(HERE, "..", "__fixtures__", "usage.sample.json"), "utf8"),
) as RunwayUsageResponse;
const org = JSON.parse(
  readFileSync(join(HERE, "..", "__fixtures__", "organization.sample.json"), "utf8"),
) as RunwayOrganization;

const ctx = { getSecret: async () => undefined, telemetry: { captureError() {}, addBreadcrumb() {} } };

test("only positive net-credit buckets become usage records (refunds/zero excluded)", () => {
  const recs = normalizeUsage(usage.results);
  // 8 (model,day) buckets minus 1 negative (kling refund) minus 1 zero (gen4_image) = 6
  assert.equal(recs.length, 6);
  assert.ok(recs.every((r) => r.rawAmount > 0), "rawAmount is positive net credits");
  assert.ok(recs.every((r) => r.provider === "runway"));
  assert.ok(recs.every((r) => r.source === "ledger" && r.confidence === "high"));
  assert.ok(recs.every((r) => r.verified === false), "records are never self-verified");
  assert.ok(recs.every((r) => r.unit === "credit" && r.rawUnit === "credits" && r.quantity === 1));
  // day-granular ts is anchored at midnight UTC
  assert.ok(recs.every((r) => r.ts.endsWith("T00:00:00.000Z")));
});

test("category inference maps Runway model ids (video-first default)", () => {
  assert.equal(inferCategory("gen4_turbo"), "video");
  assert.equal(inferCategory("gen4.5"), "video");
  assert.equal(inferCategory("kling2.5_turbo_pro"), "video");
  assert.equal(inferCategory("gen4_image"), "image");
  assert.equal(inferCategory("gpt_image_2"), "image");
  assert.equal(inferCategory("eleven_v3"), "audio");
  assert.equal(inferCategory("eleven_voice_dubbing"), "audio");
  assert.equal(inferCategory("gemini_2.5_flash"), "llm");
  assert.equal(inferCategory("some_future_model"), "video"); // unknown -> platform default
});

test("operation is derived from category", () => {
  assert.equal(inferOperation("video"), "generate_video");
  assert.equal(inferOperation("image"), "generate_image");
  assert.equal(inferOperation("audio"), "generate_audio");
  assert.equal(inferOperation("llm"), "inference");
});

test("usdEst is populated only when a credit rate is given", () => {
  const withoutRate = normalizeUsage(usage.results);
  assert.ok(withoutRate.every((r) => r.usdEst === undefined));
  const withRate = normalizeUsage(usage.results, { creditUsd: 0.01 });
  const g45 = withRate.find((r) => r.model === "gen4.5");
  assert.equal(g45?.usdEst, 5); // 500 credits * $0.01
});

test("adapter.getUsage filters by date range across the day-bucketed ledger", async () => {
  const adapter = createRunwayAdapter(createFixtureClient(usage, org), { creditUsd: 0.01 });

  const all = await adapter.getUsage({ from: "2026-06-01", to: "2026-06-30" }, ctx);
  assert.equal(all.length, 6);

  const oneDay = await adapter.getUsage({ from: "2026-06-05", to: "2026-06-05" }, ctx);
  assert.equal(oneDay.length, 2); // gen4_turbo + gen4_image on the 5th

  const narrow = await adapter.getUsage(
    { from: "2026-06-12T00:00:00Z", to: "2026-06-12T23:59:59Z" },
    ctx,
  );
  assert.equal(narrow.length, 2); // gen4.5 + eleven_v3 on the 12th
});

test("adapter.getUsage surfaces client failure via telemetry, then rethrows", async () => {
  const boom = new Error("429 rate limited");
  const failing = createRunwayAdapter(
    { async organization() { throw boom; }, async usage() { throw boom; } },
  );
  let captured: unknown;
  const spyCtx = {
    getSecret: async () => undefined,
    telemetry: { captureError(err: unknown) { captured = err; }, addBreadcrumb() {} },
  };
  await assert.rejects(
    () => failing.getUsage({ from: "2026-06-01", to: "2026-06-30" }, spyCtx),
    /rate limited/,
  );
  assert.equal(captured, boom, "error was routed to VTRS before rethrow");
});

test("adapter.getBalance returns the org credit wallet", async () => {
  const adapter = createRunwayAdapter(createFixtureClient(usage, org), { creditUsd: 0.01 });
  const bal = await adapter.getBalance!(ctx);
  assert.equal(bal.rawAmount, 1875);
  assert.equal(bal.rawUnit, "credits");
  assert.equal(bal.usdEst, 18.75); // 1875 * 0.01 — usdEst is a labelled estimate
});

test("adapter surface: auth kind apiKey, honest capabilities", () => {
  const adapter = createRunwayAdapter(createFixtureClient(usage, org));
  assert.equal(adapter.id, "runway");
  assert.equal(adapter.auth.kind, "apiKey");
  assert.equal(adapter.auth.serverVerifiable, true);
  assert.deepEqual(adapter.capabilities, { ledger: true, balance: true, feed: false });
});
