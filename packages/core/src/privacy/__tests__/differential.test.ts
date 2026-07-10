import { test } from "node:test";
import assert from "node:assert/strict";
import { privateAggregate } from "../differential.ts";
import type { NormalizedRecord } from "../../schema/record.ts";

const records: NormalizedRecord[] = [{
  ts: "2026-07-01T00:00:00Z",
  provider: "openai",
  category: "llm",
  operation: "usage",
  quantity: 1,
  unit: "request",
  rawAmount: 1,
  rawUnit: "request",
  usdEst: 10,
  source: "ledger",
  confidence: "high",
  verified: false,
}];

test("privateAggregate emits noisy aggregates without raw records", () => {
  const aggregate = privateAggregate(records, {
    epsilon: 1,
    generatedAt: "2026-07-05T00:00:00Z",
    random: () => 0.5,
  });
  assert.equal(aggregate.schema, "vibetracker.private-aggregate/0.1");
  assert.equal(aggregate.rows[0].key, "openai");
  assert.equal(aggregate.rows[0].records, 1);
  assert.equal(JSON.stringify(aggregate).includes("\"operation\""), false);
});
