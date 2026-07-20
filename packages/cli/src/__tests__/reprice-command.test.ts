import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  closeSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import { readRecords, writeRecords } from "../../../core/src/store/jsonl.ts";

function record(overrides: Partial<NormalizedRecord> = {}): NormalizedRecord {
  return {
    ts: "2026-07-20T00:00:00.000Z",
    provider: "codex",
    category: "coding",
    operation: "session",
    model: "gpt-5.5",
    quantity: 4_000_000,
    unit: "token",
    rawAmount: 4_000_000,
    rawUnit: "tokens",
    tokenUsage: {
      input: 1_000_000,
      output: 1_000_000,
      cacheRead: 1_000_000,
      cacheCreate: 1_000_000,
    },
    source: "log",
    confidence: "medium",
    verified: false,
    ...overrides,
  };
}

function run(home: string, args: string[]) {
  const env = {
    ...process.env,
    HOME: home,
    VT_NO_ANIM: "1",
    VT_NO_SURPRISES: "1",
    NO_COLOR: "1",
    FORCE_COLOR: "0",
  };
  delete env.VT_STORE_PASSPHRASE;
  return spawnSync(process.execPath, ["bin/vibetracker.mjs", ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    env,
  });
}

test("reconcile --reprice preserves estimates, surfaces unknown models, and atomically replaces the ledger", () => {
  const home = mkdtempSync(join(tmpdir(), "vibetracker-reprice-"));
  const storeDir = join(home, ".vibetracker");
  const store = join(storeDir, "records.jsonl");
  mkdirSync(storeDir, { recursive: true });
  const original = [
    record(),
    record({
      model: "mystery-model",
      quantity: 20,
      rawAmount: 20,
      tokenUsage: { input: 10, output: 2, cacheRead: 3, cacheCreate: 5 },
    }),
    record({ model: "gpt-5.5", usdEst: 99 }),
  ];
  writeRecords(store, original);

  try {
    const dryRun = run(home, ["reconcile", "--reprice", "--dry-run"]);
    assert.equal(dryRun.status, 0, dryRun.stderr || dryRun.stdout);
    assert.match(dryRun.stdout, /would price 1 ledger rows in one atomic rewrite/);
    assert.match(dryRun.stderr, /mystery-model · 20 tokens/);
    assert.deepEqual(readRecords(store), original);

    const oldDescriptor = openSync(store, "r");
    try {
      const result = run(home, ["reconcile", "--reprice"]);
      assert.equal(result.status, 0, result.stderr || result.stdout);
      assert.match(result.stdout, /priced 1 ledger rows in one atomic rewrite/);
      assert.match(result.stderr, /mystery-model · 20 tokens/);

      const persisted = readRecords(store);
      assert.equal(persisted[0]?.usdEst, 35.5);
      assert.equal(persisted[1]?.usdEst, undefined);
      assert.equal(persisted[2]?.usdEst, 99);
      assert.equal(JSON.parse(readFileSync(oldDescriptor, "utf8").split("\n")[0]!).usdEst, undefined);
      assert.equal(readdirSync(storeDir).some((name) => name.endsWith(".tmp")), false);
    } finally {
      closeSync(oldDescriptor);
    }
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});
