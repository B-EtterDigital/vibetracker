import { test } from "node:test";
import assert from "node:assert/strict";
import { aggregate, totals } from "../aggregate.ts";
import type { NormalizedRecord } from "../schema/record.ts";

function rec(p: Partial<NormalizedRecord>): NormalizedRecord {
  return {
    ts: "2026-06-29T10:00:00Z", provider: "higgsfield", category: "image",
    operation: "spend", quantity: 1, unit: "request", rawAmount: 2, rawUnit: "credits",
    source: "ledger", confidence: "high", verified: false, ...p,
  };
}

const records: NormalizedRecord[] = [
  rec({ model: "Nano Banana Pro", rawAmount: 2, usdEst: 0.02, ts: "2026-06-29T10:00:00Z" }),
  rec({ model: "Nano Banana Pro", rawAmount: 2, usdEst: 0.02, ts: "2026-06-29T11:00:00Z" }),
  rec({ model: "Seedance 1.0 Pro", category: "video", rawAmount: 45, usdEst: 0.45, ts: "2026-06-28T10:00:00Z" }),
  rec({ provider: "openai", model: "gpt-image-1", rawAmount: 100, rawUnit: "tokens", ts: "2026-06-28T10:00:00Z" }),
];

test("aggregate by model sums credits and sorts by raw desc", () => {
  const rows = aggregate(records, "model");
  assert.equal(rows[0].key, "gpt-image-1");   // raw 100 is largest
  const banana = rows.find((r) => r.key === "Nano Banana Pro")!;
  assert.equal(banana.count, 2);
  assert.equal(banana.credits, 4);
  assert.equal(banana.usd, 0.04);
});

test("aggregate by day groups on the date part of ts", () => {
  const rows = aggregate(records, "day");
  assert.deepEqual(new Set(rows.map((r) => r.key)), new Set(["2026-06-29", "2026-06-28"]));
});

test("totals: credits exclude non-credit units; usd only when present", () => {
  const t = totals(records);
  assert.equal(t.count, 4);
  assert.equal(t.credits, 49);        // 2+2+45 (tokens excluded)
  assert.equal(t.providers, 2);
  assert.equal(t.usd, 0.49);
});

test("totals: no usd when no record has an estimate", () => {
  const t = totals([rec({ usdEst: undefined })]);
  assert.equal(t.usd, undefined);
});
