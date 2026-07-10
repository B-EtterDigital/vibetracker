import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { appendRecords, readRecords, writeRecords } from "../jsonl.ts";
import type { NormalizedRecord } from "../../schema/record.ts";

const record: NormalizedRecord = {
  ts: "2026-07-01T00:00:00Z",
  provider: "openai",
  category: "llm",
  operation: "usage",
  quantity: 1,
  unit: "request",
  rawAmount: 1,
  rawUnit: "request",
  source: "ledger",
  confidence: "high",
  verified: false,
};

test("encrypted JSONL store round-trips and does not expose plaintext", () => {
  const dir = mkdtempSync(join(tmpdir(), "vibetracker-store-"));
  const prev = process.env.VT_STORE_PASSPHRASE;
  process.env.VT_STORE_PASSPHRASE = "correct horse battery staple";
  try {
    const path = join(dir, "records.jsonl.enc");
    writeRecords(path, [record]);
    appendRecords(path, [{ ...record, provider: "anthropic" }]);
    const raw = readFileSync(path, "utf8");
    assert.equal(raw.includes("openai"), false);
    const records = readRecords(path);
    assert.equal(records.length, 2);
    assert.equal(records[1].provider, "anthropic");
  } finally {
    if (prev == null) delete process.env.VT_STORE_PASSPHRASE;
    else process.env.VT_STORE_PASSPHRASE = prev;
    rmSync(dir, { recursive: true, force: true });
  }
});
