import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { normalizePredictions, inferCategory } from "../normalize.ts";
import { createReplicateAdapter, createFixtureClient } from "../index.ts";
import type { ReplicatePage } from "../client.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const page = JSON.parse(
  readFileSync(join(HERE, "..", "__fixtures__", "predictions.sample.json"), "utf8"),
) as ReplicatePage;

const noopCtx = { getSecret: async () => undefined, telemetry: { captureError() {}, addBreadcrumb() {} } };

test("only predictions with billed predict_time become usage records", () => {
  const recs = normalizePredictions(page.results);
  assert.equal(recs.length, 6); // 8 results - 1 processing (no metrics) - 1 canceled (no predict_time)
  assert.ok(recs.every((r) => r.rawAmount > 0), "rawAmount is billed seconds");
  assert.ok(recs.every((r) => r.provider === "replicate"));
  assert.ok(recs.every((r) => r.operation === "predict"));
  assert.ok(recs.every((r) => r.unit === "second" && r.rawUnit === "seconds"));
  assert.ok(recs.every((r) => r.source === "ledger" && r.confidence === "high" && r.verified === false));
});

test("category inference maps model slugs to media types", () => {
  assert.equal(inferCategory("black-forest-labs/flux-schnell"), "image");
  assert.equal(inferCategory("black-forest-labs/flux-1.1-pro"), "image");
  assert.equal(inferCategory("tencent/hunyuan-video"), "video");
  assert.equal(inferCategory("openai/whisper"), "audio");
  assert.equal(inferCategory("meta/meta-llama-3-8b-instruct"), "llm");
  assert.equal(inferCategory("some-owner/mystery-model"), "other");
});

test("rawAmount carries predict_time seconds and model is the slug", () => {
  const recs = normalizePredictions(page.results);
  const video = recs.find((r) => r.model === "tencent/hunyuan-video");
  assert.equal(video?.rawAmount, 128.7);
  assert.equal(video?.category, "video");
  assert.equal(video?.quantity, 1);
});

test("usdEst is populated only when a per-second rate is given", () => {
  const withoutRate = normalizePredictions(page.results);
  assert.ok(withoutRate.every((r) => r.usdEst === undefined));

  const withRate = normalizePredictions(page.results, { usdPerSecond: 0.001 });
  const video = withRate.find((r) => r.model === "tencent/hunyuan-video");
  assert.equal(video?.usdEst, 0.1287); // 128.7s * $0.001/s
});

test("adapter exposes the ledger-tier apiKey contract", () => {
  const adapter = createReplicateAdapter(createFixtureClient(page));
  assert.equal(adapter.id, "replicate");
  assert.equal(adapter.auth.kind, "apiKey");
  assert.deepEqual(adapter.capabilities, { ledger: true, balance: false, feed: false });
  assert.equal(adapter.getBalance, undefined);
});

test("adapter.getUsage filters by date range and paginates via the client", async () => {
  const adapter = createReplicateAdapter(createFixtureClient(page), { usdPerSecond: 0.001 });

  const all = await adapter.getUsage({ from: "2026-06-01", to: "2026-06-30" }, noopCtx);
  assert.equal(all.length, 6);

  const narrow = await adapter.getUsage(
    { from: "2026-06-29T00:00:00Z", to: "2026-06-29T23:59:59Z" },
    noopCtx,
  );
  assert.equal(narrow.length, 2); // two flux-schnell on the 29th; the processing one has no metrics
  assert.ok(narrow.every((r) => r.model === "black-forest-labs/flux-schnell"));
});
