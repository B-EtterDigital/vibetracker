import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import { buildLiveConsoleFrame, parseLiveConsoleOptions } from "../live-console.ts";

const records: NormalizedRecord[] = [
  {
    ts: "2026-07-15T07:30:00Z",
    provider: "openai",
    category: "llm",
    operation: "responses",
    quantity: 120,
    unit: "request",
    rawAmount: 300_000,
    rawUnit: "tokens",
    usdEst: 18,
    source: "ledger",
    confidence: "high",
    verified: true,
  },
  {
    ts: "2026-07-14T06:00:00Z",
    provider: "ollama",
    category: "llm",
    operation: "local-inference",
    quantity: 80,
    unit: "request",
    rawAmount: 80,
    rawUnit: "requests",
    usdEst: 4,
    source: "local",
    confidence: "medium",
    verified: false,
  },
];

test("live console options are watch-first only for an interactive terminal", () => {
  assert.deepEqual(parseLiveConsoleOptions(["live"], true), {
    once: false,
    intervalSeconds: 5,
    trustEnabled: true,
  });
  assert.deepEqual(parseLiveConsoleOptions(["live", "--interval", "2.5", "--budget", "90", "--no-trust"], false), {
    once: true,
    intervalSeconds: 2.5,
    budgetUsd: 90,
    trustEnabled: false,
  });
  assert.throws(() => parseLiveConsoleOptions(["live", "--interval", "0"], true), /positive number/);
  assert.throws(() => parseLiveConsoleOptions(["live", "--interval", "61"], true), /60 seconds or less/);
  assert.throws(() => parseLiveConsoleOptions(["live", "--budget", "none"], true), /positive number/);
});

test("live console renders ledger, proof, budget, privacy, and command signals at fixed width", () => {
  const output = buildLiveConsoleFrame({
    records,
    trustSignals: [],
    generatedAt: "2026-07-15T08:00:00Z",
    budgetUsd: 50,
    frame: 7,
    intervalSeconds: 3,
    mode: "watch",
  });

  assert.match(output, /VTK:\/\/LIVE-OPS\/\/LOCAL-LEDGER\/\/READ-ONLY/);
  assert.match(output, /WATCH frame 7  \|  refresh 3s/);
  assert.match(output, /200 ops  \|  2 records  \|  2 providers/);
  assert.match(output, /OVER \$94\.20~ \/ \$50\.00/);
  assert.match(output, /verified 50\.0%/);
  assert.match(output, /openai/);
  assert.match(output, /ollama/);
  assert.match(output, /trust 0 NOT USAGE/);
  assert.match(output, /WRITES 0\. UPLOADS 0\. PROVIDER CALLS 0/);
  assert.doesNotMatch(output, /prompt text|secret value/);
  assert.equal(Math.max(...output.split("\n").map((row) => row.length)), 78);
});

test("empty live console gives real-source recovery without invented usage", () => {
  const output = buildLiveConsoleFrame({
    records: [],
    trustSignals: [],
    generatedAt: "2026-07-15T08:00:00Z",
    mode: "snapshot",
  });

  assert.match(output, /COLD \/ CONNECT SOURCE/);
  assert.match(output, /vibetracker init --gui/);
  assert.match(output, /vibetracker doctor/);
  assert.doesNotMatch(output, /sync --demo/);
});

test("CLI live mode exits after one frame in non-TTY mode", () => {
  const home = mkdtempSync(join(tmpdir(), "vibetracker-live-home-"));
  const result = spawnSync(process.execPath, ["bin/vibetracker.mjs", "live", "--no-trust"], {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: 5_000,
    env: { ...process.env, HOME: home, VT_NO_ANIM: "1", VT_NO_SURPRISES: "1" },
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /SNAPSHOT frame 1  \|  one shot/);
  assert.match(result.stdout, /WRITES 0\. UPLOADS 0\. PROVIDER CALLS 0/);
});
