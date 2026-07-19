import { test } from "node:test";
import assert from "node:assert/strict";
import { aggregate } from "../../aggregate.ts";
import type { NormalizedRecord } from "../../schema/record.ts";
import { estimateNativeUsd, NATIVE_RATES, type NativeRate } from "../native-rates.ts";

function record(overrides: Partial<NormalizedRecord> = {}): NormalizedRecord {
  return {
    ts: "2026-07-20T00:00:00.000Z",
    provider: "cynaps3",
    category: "music",
    operation: "generate",
    quantity: 1,
    unit: "request",
    rawAmount: 5,
    rawUnit: "credits",
    source: "ledger",
    confidence: "high",
    verified: false,
    ...overrides,
  };
}

test("native rate registry contains only the sourced planner rates", () => {
  assert.deepEqual(NATIVE_RATES, [
    {
      category: "music",
      unit: "track",
      usdPerUnit: 0.02,
      basis: "subscription",
      source: "Suno Premier $10/2,500 credits, 5 credits per clip",
      asOf: "2026-07",
    },
    {
      category: "music",
      unit: "variation",
      usdPerUnit: 0.02,
      basis: "subscription",
      source: "Suno Premier $10/2,500 credits, 5 credits per clip",
      asOf: "2026-07",
    },
    {
      provider: "midjourney",
      unit: "image",
      usdPerUnit: 0.033,
      basis: "subscription",
      source: "Midjourney Standard $30/mo ~900 fast images",
      asOf: "2026-07",
    },
  ]);
});

test("provider-specific rates resolve before category-wide rates", () => {
  const rates: NativeRate[] = [
    {
      category: "music",
      unit: "track",
      usdPerUnit: 0.02,
      basis: "subscription",
      source: "Suno Premier $10/2,500 credits, 5 credits per clip",
      asOf: "2026-07",
    },
    {
      provider: "cynaps3",
      category: "music",
      unit: "track",
      usdPerUnit: 0.5,
      basis: "api",
      source: "test-only provider rate",
      asOf: "2026-07",
    },
  ];

  assert.equal(estimateNativeUsd(record({ outputQuantity: 2, outputUnit: "track" }), rates), 1);
});

test("native estimates multiply the sourced rate by output quantity", () => {
  assert.equal(estimateNativeUsd(record({ outputQuantity: 2, outputUnit: "track" })), 0.04);
  assert.equal(estimateNativeUsd(record({ outputQuantity: 3, outputUnit: "variation" })), 0.06);
  assert.equal(estimateNativeUsd(record({
    provider: "midjourney",
    category: "image",
    outputQuantity: 3,
    outputUnit: "image",
  })), 0.099);
});

test("native estimates round non-exact binary products to six decimals", () => {
  assert.equal(estimateNativeUsd(record({ outputQuantity: 35, outputUnit: "track" })), 0.7);
});

test("an existing USD estimate is preserved", () => {
  assert.equal(estimateNativeUsd(record({
    outputQuantity: 2,
    outputUnit: "track",
    usdEst: 7.25,
  })), 7.25);
});

test("unpriced or absent native outputs stay unestimated", () => {
  assert.equal(estimateNativeUsd(record({ outputQuantity: 1, outputUnit: "clip" })), undefined);
  assert.equal(estimateNativeUsd(record({ operation: "lyrics-import" })), undefined);
  assert.equal(estimateNativeUsd(record({ outputQuantity: 0, outputUnit: "track" })), undefined);
});

test("aggregate rows pick up native USD estimates without aggregate changes", () => {
  const track = record({ outputQuantity: 2, outputUnit: "track" });
  const variation = record({ outputQuantity: 1, outputUnit: "variation" });
  const lyricsImport = record({ operation: "lyrics-import" });
  const priced = [track, variation, lyricsImport].map((entry) => {
    const usdEst = estimateNativeUsd(entry);
    return usdEst === undefined ? entry : { ...entry, usdEst };
  });

  const [row] = aggregate(priced, "category");
  assert.equal(row?.usd, 0.06);
  assert.equal(priced[2]?.usdEst, undefined);
});
