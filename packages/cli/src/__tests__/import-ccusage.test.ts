import assert from "node:assert/strict";
import { test } from "node:test";
import { ccusageToRecords } from "../import-ccusage.ts";

test("ccusageToRecords preserves the daily token-class split", () => {
  const [record] = ccusageToRecords({
    daily: [{
      period: "2026-07-18",
      modelBreakdowns: [{
        modelName: "[codex] gpt-5.5",
        inputTokens: 120,
        outputTokens: 30,
        cacheReadTokens: 80,
        cacheCreationTokens: 10,
        cost: 0.25,
      }],
    }],
  });

  assert.equal(record.provider, "codex");
  assert.equal(record.operation, "import-day");
  assert.equal(record.rawAmount, 240);
  assert.deepEqual(record.tokenUsage, {
    input: 120,
    output: 30,
    cacheRead: 80,
    cacheCreate: 10,
  });
});
