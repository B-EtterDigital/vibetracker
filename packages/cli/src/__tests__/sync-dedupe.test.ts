import assert from "node:assert/strict";
import { test } from "node:test";
import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import {
  reconcileFullScanProviders,
  reconcileImportDayRows,
  shouldReplaceSyncRecord,
  syncRecordKey,
} from "../sync-dedupe.ts";

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

test("full-log records replace every import-day model row for the same provider day", () => {
  const codexImportA = record({
    provider: "codex", ts: "2026-07-16T12:00:00.000Z", operation: "import-day", source: "log", model: "gpt-5.5",
  });
  const codexImportB = record({
    provider: "codex", ts: "2026-07-16T12:00:00.000Z", operation: "import-day", source: "log", model: "gpt-5.4",
  });
  const otherDay = record({
    provider: "codex", ts: "2026-07-15T12:00:00.000Z", operation: "import-day", source: "log",
  });
  const otherProvider = record({
    provider: "claude-code", ts: "2026-07-16T12:00:00.000Z", operation: "import-day", source: "log",
  });
  const fullScan = record({
    provider: "codex", ts: "2026-07-16T18:00:00.000Z", operation: "session", source: "log",
  });

  const result = reconcileImportDayRows(
    [codexImportA, codexImportB, otherDay, otherProvider],
    [fullScan],
  );

  assert.deepEqual(result.coveredDays, ["codex|2026-07-16"]);
  assert.deepEqual(result.superseded, [codexImportA, codexImportB]);
  assert.deepEqual(result.kept, [otherDay, otherProvider]);
});

test("non-log records do not supersede imported coding history", () => {
  const imported = record({ provider: "codex", operation: "import-day", source: "log" });
  const apiRow = record({ provider: "codex", operation: "usage", source: "ledger" });

  const result = reconcileImportDayRows([imported], [apiRow]);

  assert.deepEqual(result.superseded, []);
  assert.deepEqual(result.kept, [imported]);
});

test("explicit full-scan reconciliation converges represented providers to parser truth", () => {
  const codexImport = record({ provider: "codex", category: "coding", operation: "import-day", source: "log", rawAmount: 70 });
  const staleCodexSession = record({ provider: "codex", category: "coding", operation: "session", source: "log", rawAmount: 20 });
  const claudeImport = record({ provider: "claude-code", operation: "import-day", source: "log", rawAmount: 30 });
  const unrelated = record({ provider: "suno", source: "ledger", rawAmount: 10 });
  const codexMusic = record({ provider: "codex", category: "music", operation: "manual-track", source: "manual", rawAmount: 12 });
  const parsedCodex = record({ provider: "codex", category: "coding", operation: "session", source: "log", rawAmount: 84 });

  const result = reconcileFullScanProviders(
    [codexImport, staleCodexSession, claudeImport, unrelated, codexMusic],
    [parsedCodex],
  );

  assert.deepEqual(result.providers, ["codex"]);
  assert.deepEqual(result.superseded, [codexImport, staleCodexSession]);
  assert.deepEqual(result.kept, [claudeImport, unrelated, codexMusic]);
  assert.ok(result.kept.includes(codexMusic));
  assert.equal([...result.kept, parsedCodex]
    .filter((item) => item.provider === "codex" && item.category === "coding")
    .reduce((sum, item) => sum + item.rawAmount, 0), 84);
});
