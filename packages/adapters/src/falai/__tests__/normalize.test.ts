import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { normalizeUsage, inferCategory, inferOperation, mapUnit } from "../normalize.ts";
import { createFalAdapter, createFixtureClient } from "../index.ts";
import type { FalUsagePage, FalBilling } from "../client.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const usage = JSON.parse(
  readFileSync(join(HERE, "..", "__fixtures__", "usage.sample.json"), "utf8"),
) as FalUsagePage;
const billing = JSON.parse(
  readFileSync(join(HERE, "..", "__fixtures__", "billing.sample.json"), "utf8"),
) as FalBilling;

const ctx = { getSecret: async () => undefined, telemetry: { captureError() {}, addBreadcrumb() {} } };

test("normalizeUsage flattens every time_series row into a ledger record", () => {
  const recs = normalizeUsage(usage);
  assert.equal(recs.length, 7); // 2 + 3 + 2 rows across 3 buckets
  assert.ok(recs.every((r) => r.provider === "falai"));
  assert.ok(recs.every((r) => r.source === "ledger" && r.confidence === "high"));
  assert.ok(recs.every((r) => r.verified === false));
});

test("category inference maps fal endpoint ids", () => {
  assert.equal(inferCategory("fal-ai/flux/dev"), "image");
  assert.equal(inferCategory("fal-ai/flux-pro/v1.1"), "image");
  assert.equal(inferCategory("fal-ai/veo3"), "video");
  assert.equal(inferCategory("fal-ai/kling-video/v2/master/image-to-video"), "video"); // "image" present but video wins
  assert.equal(inferCategory("fal-ai/whisper"), "audio");
  assert.equal(inferCategory("fal-ai/any-llm"), "llm");
  assert.equal(inferCategory("fal-ai/hunyuan3d-v21"), "3d");
  assert.equal(inferCategory("fal-ai/some-unknown-thing"), "other");
});

test("operation inference reads the endpoint verb", () => {
  assert.equal(inferOperation("fal-ai/kling-video/v2/master/image-to-video"), "image-to-video");
  assert.equal(inferOperation("fal-ai/whisper"), "transcribe");
  assert.equal(inferOperation("fal-ai/hunyuan3d-v21"), "image-to-3d");
  assert.equal(inferOperation("fal-ai/veo3"), "inference"); // no verb in the id
});

test("native unit is preserved in rawUnit; core Unit enum in unit", () => {
  const recs = normalizeUsage(usage);
  const flux = recs.find((r) => r.model === "fal-ai/flux/dev")!;
  assert.equal(flux.rawUnit, "megapixel");     // native string kept verbatim
  assert.equal(flux.unit, "request");          // megapixel has no enum slot -> request
  assert.equal(flux.rawAmount, 12);            // native metered amount == quantity

  const veo = recs.find((r) => r.model === "fal-ai/veo3")!;
  assert.equal(veo.rawUnit, "second");
  assert.equal(veo.unit, "second");
  assert.equal(veo.quantity, 8);

  assert.equal(mapUnit("image"), "image");
  assert.equal(mapUnit("token"), "token");
  assert.equal(mapUnit("compute"), "request"); // unknown -> request
});

test("usdEst comes straight from the API cost (USD)", () => {
  const recs = normalizeUsage(usage);
  const veo = recs.find((r) => r.model === "fal-ai/veo3")!;
  assert.equal(veo.usdEst, 4.0);
  const whisper = recs.find((r) => r.model === "fal-ai/whisper")!;
  assert.equal(whisper.usdEst, 0.012);
  assert.ok(recs.every((r) => typeof r.usdEst === "number"));
});

test("record timestamp is the bucket time", () => {
  const recs = normalizeUsage(usage);
  const flux = recs.find((r) => r.model === "fal-ai/flux/dev")!;
  assert.equal(flux.ts, "2026-06-29T00:00:00Z");
});

test("adapter.getUsage returns all rows for a wide range", async () => {
  const adapter = createFalAdapter(createFixtureClient(usage, billing));
  const all = await adapter.getUsage({ from: "2026-06-01", to: "2026-06-30T23:59:59Z" }, ctx);
  assert.equal(all.length, 7);
});

test("adapter.getUsage date filter drops out-of-range buckets", async () => {
  const adapter = createFalAdapter(createFixtureClient(usage, billing));
  const narrow = await adapter.getUsage(
    { from: "2026-06-28T00:00:00Z", to: "2026-06-28T23:59:59Z" },
    ctx,
  );
  assert.equal(narrow.length, 3); // only the 2026-06-28 bucket
  assert.ok(narrow.every((r) => r.ts.startsWith("2026-06-28")));
});

test("adapter.getBalance returns USD credit balance", async () => {
  const adapter = createFalAdapter(createFixtureClient(usage, billing));
  const bal = await adapter.getBalance!(ctx);
  assert.equal(bal.rawAmount, 137.42);
  assert.equal(bal.rawUnit, "usd");
  assert.equal(bal.usdEst, 137.42);
});

test("adapter metadata reflects fal's real capabilities", () => {
  const adapter = createFalAdapter(createFixtureClient(usage, billing));
  assert.equal(adapter.id, "falai");
  assert.equal(adapter.auth.kind, "apiKey");
  assert.equal(adapter.capabilities.ledger, true);
  assert.equal(adapter.capabilities.balance, true);
  assert.equal(adapter.capabilities.feed, false);
});
