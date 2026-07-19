import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { NormalizedRecord } from "../../schema/record.ts";
import { readRecords, writeRecords } from "../jsonl.ts";

const original: NormalizedRecord = {
  ts: "2026-07-01T00:00:00Z",
  provider: "codex",
  category: "coding",
  operation: "session",
  quantity: 10,
  unit: "token",
  rawAmount: 10,
  rawUnit: "tokens",
  source: "log",
  confidence: "medium",
  verified: false,
};

test("a failure after fsync and before rename preserves plaintext and encrypted ledgers", () => {
  const dir = mkdtempSync(join(tmpdir(), "vibetracker-atomic-store-"));
  const previousPassphrase = process.env.VT_STORE_PASSPHRASE;
  try {
    for (const encrypted of [false, true]) {
      if (encrypted) process.env.VT_STORE_PASSPHRASE = "atomic-test-passphrase";
      else delete process.env.VT_STORE_PASSPHRASE;
      const path = join(dir, encrypted ? "records.jsonl.enc" : "records.jsonl");
      writeRecords(path, [original]);

      assert.throws(
        () => writeRecords(path, [{ ...original, rawAmount: 99 }], {
          beforeRename: () => { throw new Error("simulated pre-rename failure"); },
        }),
        /simulated pre-rename failure/,
      );
      assert.deepEqual(readRecords(path), [original]);
      assert.equal(readdirSync(dir).some((name) => name.endsWith(".tmp")), false);
    }
  } finally {
    if (previousPassphrase == null) delete process.env.VT_STORE_PASSPHRASE;
    else process.env.VT_STORE_PASSPHRASE = previousPassphrase;
    rmSync(dir, { recursive: true, force: true });
  }
});
