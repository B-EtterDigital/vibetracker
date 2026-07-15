import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { normalizeFeed, isConsuming, DEFAULT_CREDITS_PER_GEN } from "../normalize.ts";
import { createUdioAdapter, createFixtureClient } from "../index.ts";
import type { UdioFeedPage, UdioCredits, UdioSong } from "../client.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const page = JSON.parse(
  readFileSync(join(HERE, "..", "__fixtures__", "feed.sample.json"), "utf8"),
) as UdioFeedPage;
const credits = JSON.parse(
  readFileSync(join(HERE, "..", "__fixtures__", "credits.sample.json"), "utf8"),
) as UdioCredits;

test("only settled generations become usage records (failed / processing excluded)", () => {
  const recs = normalizeFeed(page.data);
  assert.equal(recs.length, 5); // 7 items - 1 failed - 1 processing
  assert.ok(recs.every((r) => r.provider === "udio" && r.category === "music"));
  assert.ok(recs.every((r) => r.operation === "generate" && r.unit === "request" && r.quantity === 1));
  assert.ok(recs.every((r) => r.rawUnit === "credits" && r.rawAmount === DEFAULT_CREDITS_PER_GEN));
  assert.ok(recs.every((r) => r.source === "feed_recon" && r.confidence === "medium" && r.verified === false));
  assert.ok(recs.every((r) => r.outputQuantity === 1 && r.outputUnit === "track" && r.sourceEventId));
});

test("isConsuming skips failed and unfinished generations", () => {
  const failed: UdioSong = { id: "x", title: "x", created_at: "2026-06-28T09:05:00Z", status: "failed" };
  const processing: UdioSong = { id: "y", title: "y", created_at: "2026-06-27T14:20:00Z", finished: false };
  const done: UdioSong = { id: "z", title: "z", created_at: "2026-06-27T10:00:00Z", status: "complete", finished: true };
  assert.equal(isConsuming(failed), false);
  assert.equal(isConsuming(processing), false);
  assert.equal(isConsuming(done), true);
});

test("model is carried through from the song when present", () => {
  const recs = normalizeFeed(page.data);
  assert.ok(recs.some((r) => r.model === "udio-1.5"));
  assert.ok(recs.some((r) => r.model === "udio-1.5-allegro"));
});

test("creditsPerGen is overridable and drives rawAmount", () => {
  const recs = normalizeFeed(page.data, { creditsPerGen: 25 });
  assert.ok(recs.every((r) => r.rawAmount === 25));
});

test("usdEst is populated only when a credit rate is given", () => {
  const withoutRate = normalizeFeed(page.data);
  assert.ok(withoutRate.every((r) => r.usdEst === undefined));
  const withRate = normalizeFeed(page.data, { creditsPerGen: 10, creditUsd: 0.02 });
  assert.ok(withRate.every((r) => r.usdEst === 0.2)); // 10 credits * $0.02
});

test("adapter.getUsage filters by date range and reconstructs from the feed", async () => {
  const adapter = createUdioAdapter(createFixtureClient(page, credits), { creditUsd: 0.02 });
  const ctx = { getSecret: async () => undefined, telemetry: { captureError() {}, addBreadcrumb() {} } };

  const all = await adapter.getUsage({ from: "2026-06-01", to: "2026-06-30" }, ctx);
  assert.equal(all.length, 5);

  const narrow = await adapter.getUsage({ from: "2026-06-29T00:00:00Z", to: "2026-06-29T23:59:59Z" }, ctx);
  assert.equal(narrow.length, 3); // 2x synthwave + 1x acoustic on the 29th
});

test("adapter.getBalance returns current credits", async () => {
  const adapter = createUdioAdapter(createFixtureClient(page, credits), { creditUsd: 0.02 });
  const ctx = { getSecret: async () => undefined, telemetry: { captureError() {}, addBreadcrumb() {} } };
  const bal = await adapter.getBalance!(ctx);
  assert.equal(bal.rawAmount, 840);
  assert.equal(bal.rawUnit, "credits");
  assert.equal(bal.usdEst, 16.8); // 840 * 0.02 — usdEst is an estimate
});

test("adapter advertises cookie auth, non-verifiable, feed+balance capabilities", () => {
  const adapter = createUdioAdapter(createFixtureClient(page, credits));
  assert.equal(adapter.auth.kind, "cookie");
  assert.equal(adapter.auth.serverVerifiable, false);
  assert.deepEqual(adapter.capabilities, { ledger: false, balance: true, feed: true });
  assert.deepEqual(adapter.categories, ["music"]);
});
