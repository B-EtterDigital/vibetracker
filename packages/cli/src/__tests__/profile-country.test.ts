import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { writeRecords } from "../../../core/src/store/jsonl.ts";

function runCli(home: string, args: string[]) {
  const emptyPath = join(home, "empty-path");
  mkdirSync(emptyPath, { recursive: true });
  return spawnSync(process.execPath, [join(process.cwd(), "bin", "vibetracker.mjs"), ...args], {
    cwd: home,
    encoding: "utf8",
    timeout: 20_000,
    env: {
      ...process.env,
      HOME: home,
      PATH: emptyPath,
      VT_NO_ANIM: "1",
      VT_NO_SURPRISES: "1",
      NO_COLOR: "1",
    },
  });
}

test("profile --country persists lowercase config and rides attested bundles only", () => {
  const home = mkdtempSync(join(tmpdir(), "vibetracker-profile-country-"));
  const storeDir = join(home, ".vibetracker");
  const configPath = join(storeDir, "config.json");
  try {
    mkdirSync(storeDir, { recursive: true });
    writeFileSync(configPath, JSON.stringify({ enabled: [], token: "test-attested-token" }));

    const saved = runCli(home, ["profile", "--country", "CH"]);
    assert.equal(saved.status, 0, saved.stderr);
    assert.match(saved.stdout, /country:\s+ch/);
    assert.equal(JSON.parse(readFileSync(configPath, "utf8")).country, "ch");

    const invalid = runCli(home, ["profile", "--country", "CHE"]);
    assert.equal(invalid.status, 2);
    assert.match(invalid.stderr, /ISO 3166-1 alpha-2/);
    assert.equal(JSON.parse(readFileSync(configPath, "utf8")).country, "ch");

    writeRecords(join(storeDir, "records.jsonl"), [{
      ts: "2026-07-20T00:00:00.000Z",
      provider: "codex",
      category: "coding",
      operation: "session",
      quantity: 1,
      unit: "operation",
      source: "local",
      confidence: "high",
      verified: false,
    }]);
    const attested = runCli(home, ["upload", "--url", "http://127.0.0.1:1/ingest", "--no-ccusage", "--no-orchestration"]);
    assert.equal(attested.status, 0, attested.stderr);
    const attestedBundle = JSON.parse(readFileSync(join(storeDir, "upload-bundle.json"), "utf8"));
    assert.deepEqual(attestedBundle.profile, { country: "ch" });

    writeFileSync(configPath, JSON.stringify({ enabled: [], country: "ch" }));
    const anonymous = runCli(home, ["upload", "--url", "http://127.0.0.1:1/ingest", "--no-ccusage", "--no-orchestration"]);
    assert.equal(anonymous.status, 0, anonymous.stderr);
    const anonymousBundle = JSON.parse(readFileSync(join(storeDir, "upload-bundle.json"), "utf8"));
    assert.equal("profile" in anonymousBundle, false);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});
