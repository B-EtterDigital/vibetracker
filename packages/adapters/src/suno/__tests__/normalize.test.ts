import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { normalizeFeed, DEFAULT_CREDITS_PER_CLIP } from "../normalize.ts";
import { createSunoAdapter, createFixtureClient } from "../index.ts";

const fix = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "__fixtures__", "feed.sample.json"), "utf8"),
) as any;
const ctx = { getSecret: async () => undefined, telemetry: { captureError() {}, addBreadcrumb() {} } };

test("normalizeFeed reconstructs credits and skips errored clips", () => {
  const recs = normalizeFeed(fix.feed.clips);
  assert.equal(recs.length, 2); // errored clip dropped
  assert.ok(recs.every((r: any) => r.source === "feed_recon" && r.confidence === "medium"));
  assert.ok(recs.every((r: any) => r.category === "music" && r.rawAmount === DEFAULT_CREDITS_PER_CLIP));
  assert.ok(recs.every((r: any) => r.outputQuantity === 1 && r.outputUnit === "track" && r.sourceEventId));
});

test("creditsPerClip and creditUsd overrides flow through", () => {
  const recs = normalizeFeed(fix.feed.clips, { creditsPerClip: 4, creditUsd: 0.01 });
  assert.equal(recs[0].rawAmount, 4);
  assert.equal(recs[0].usdEst, 0.04);
});

test("adapter.getUsage filters by date; getBalance reports credits_left", async () => {
  const adapter = createSunoAdapter(createFixtureClient(fix.feed, fix.credits));
  const all = await adapter.getUsage({ from: "2026-06-01", to: "2026-06-30" }, ctx);
  assert.equal(all.length, 2);
  const bal = await adapter.getBalance!(ctx);
  assert.equal(bal.rawAmount, 1200);
  assert.equal(bal.rawUnit, "credits");
});
