import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { computeIntegrity } from "../audit.ts";
import { createLedgerSeal, ledgerVerifySummary, verifyLedgerSeal, writeLedgerSeal } from "../ledger.ts";
import type { NormalizedRecord } from "../../../core/src/schema/record.ts";

const record: NormalizedRecord = {
  ts: "2026-07-01T00:00:00Z",
  provider: "local",
  category: "llm",
  operation: "message",
  quantity: 1,
  unit: "request",
  rawAmount: 1,
  rawUnit: "request",
  source: "local",
  confidence: "high",
  verified: false,
};

test("ledger seal verifies current chain and detects record changes", () => {
  const dir = mkdtempSync(join(tmpdir(), "vibetracker-ledger-"));
  try {
    const sealPath = join(dir, "seal.json");
    const integrity = computeIntegrity([record]);
    writeLedgerSeal(sealPath, createLedgerSeal(integrity, "2026-07-05T00:00:00Z"));

    const ok = verifyLedgerSeal(sealPath, integrity);
    assert.equal(ok.ok, true);
    assert.match(ledgerVerifySummary(ok), /ledger verified/);

    const changed = verifyLedgerSeal(sealPath, computeIntegrity([{ ...record, rawAmount: 2 }]));
    assert.equal(changed.ok, false);
    assert.match(changed.reason ?? "", /record chain|bundle fingerprint|record count/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
