import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { toRecords as claudeRecords } from "../../../adapters/src/claude-code/normalize.ts";
import { toRecords as codexRecords } from "../../../adapters/src/codex/normalize.ts";
import { ingestRecords } from "../../../core/src/verify/validate.ts";
import { readRecords, writeRecords } from "../../../core/src/store/jsonl.ts";
import { ccusageToRecords } from "../import-ccusage.ts";

test("Claude Code, Codex, and ccusage token classes survive ingest and store persistence", () => {
  const dir = mkdtempSync(join(tmpdir(), "vibetracker-token-usage-"));
  try {
    const claude = claudeRecords([{
      ts: "2026-07-18T10:00:00.000Z",
      model: "claude-sonnet-4",
      input: 100,
      output: 20,
      cacheRead: 70,
      cacheWrite: 10,
      dedupeKey: "message-1:request-1",
    }])[0];
    const codex = codexRecords([{
      ts: "2026-07-18T11:00:00.000Z",
      model: "gpt-5.5",
      nonCachedInput: 80,
      cachedInput: 40,
      output: 30,
      reasoningOutput: 7,
      totalTokens: 150,
    }])[0];
    const [ccusage] = ccusageToRecords({
      daily: [{
        period: "2026-07-18",
        modelBreakdowns: [{
          modelName: "[codex] gpt-5.5",
          inputTokens: 60,
          outputTokens: 20,
          cacheReadTokens: 30,
          cacheCreationTokens: 5,
        }],
      }],
    });
    const withUnknownNestedKey = {
      ...ccusage,
      tokenUsage: { ...ccusage.tokenUsage!, unknownClass: 999 },
    };

    const { accepted, rejected } = ingestRecords([claude, codex, withUnknownNestedKey], {
      untrustedSource: true,
    });
    assert.equal(rejected.length, 0);
    assert.equal(accepted.length, 3);

    const path = join(dir, "records.jsonl");
    writeRecords(path, accepted);
    const persisted = readRecords(path);
    assert.deepEqual(persisted.map((record) => record.tokenUsage), [
      { input: 100, output: 20, cacheRead: 70, cacheCreate: 10 },
      { input: 80, output: 30, cacheRead: 40, cacheCreate: 0, reasoningOutput: 7 },
      { input: 60, output: 20, cacheRead: 30, cacheCreate: 5 },
    ]);
    assert.equal("unknownClass" in (persisted[2].tokenUsage as object), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
