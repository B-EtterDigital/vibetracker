import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { normalizeCharacterStats } from "../normalize.ts";
import { createElevenLabsAdapter, createFixtureClient } from "../index.ts";

const fix = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "__fixtures__", "usage.sample.json"), "utf8"),
) as any;

const ctx = { getSecret: async () => undefined, telemetry: { captureError() {}, addBreadcrumb() {} } };

test("normalizeCharacterStats skips empty buckets, counts characters", () => {
  const recs = normalizeCharacterStats(fix.characterStats);
  assert.equal(recs.length, 2); // the 0-usage day is dropped
  assert.equal(recs[0].unit, "character");
  assert.equal(recs[0].category, "audio");
  assert.equal(recs.reduce((s: number, r: any) => s + r.rawAmount, 0), 82000);
});

test("usdEst appears only with a per-character rate", () => {
  assert.ok(normalizeCharacterStats(fix.characterStats)[0].usdEst === undefined);
  const withRate = normalizeCharacterStats(fix.characterStats, { usdPerChar: 0.00003 });
  assert.equal(withRate[0].usdEst, 0.36); // 12000 * 0.00003
});

test("getBalance returns remaining characters this cycle", async () => {
  const adapter = createElevenLabsAdapter(createFixtureClient(fix.subscription, fix.characterStats));
  const bal = await adapter.getBalance!(ctx);
  assert.equal(bal.rawAmount, 18000); // 100000 - 82000
  assert.equal(bal.rawUnit, "characters");
});

test("getUsage returns the character records within range", async () => {
  const adapter = createElevenLabsAdapter(createFixtureClient(fix.subscription, fix.characterStats));
  const recs = await adapter.getUsage({ from: "2020-01-01", to: "2100-01-01" }, ctx);
  assert.equal(recs.length, 2);
});
