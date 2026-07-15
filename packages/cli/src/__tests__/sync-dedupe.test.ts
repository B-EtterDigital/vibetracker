import assert from "node:assert/strict";
import { test } from "node:test";
import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import { shouldReplaceSyncRecord, syncRecordKey } from "../sync-dedupe.ts";

function record(overrides: Partial<NormalizedRecord> = {}): NormalizedRecord {
  return {
    ts: "2026-07-16T12:00:00.000Z",
    provider: "suno",
    category: "music",
    operation: "generate",
    model: "suno-v4.5",
    quantity: 1,
    unit: "request",
    rawAmount: 10,
    rawUnit: "credits",
    source: "feed_recon",
    confidence: "medium",
    verified: false,
    ...overrides,
  };
}

test("stable source ids deduplicate a direct provider row and its orchestrated form", () => {
  const direct = record({ sourceEventId: "clip-123" });
  const orchestrated = record({ sourceEventId: "clip-123", toolId: "cynaps3", source: "ledger", confidence: "high" });
  assert.equal(syncRecordKey(direct), syncRecordKey(orchestrated));
  assert.equal(shouldReplaceSyncRecord(direct, orchestrated), true);
  assert.equal(shouldReplaceSyncRecord(orchestrated, direct), false);
});

test("provider remains part of the stable-event key", () => {
  assert.notEqual(
    syncRecordKey(record({ provider: "suno", sourceEventId: "123" })),
    syncRecordKey(record({ provider: "udio", sourceEventId: "123" })),
  );
});
