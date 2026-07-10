import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

function run(args: string[]) {
  return spawnSync(process.execPath, ["bin/vibetracker.mjs", ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, VT_NO_SURPRISES: "1", VT_NO_ANIM: "1" },
  });
}

test("surprises command exposes a safe machine-readable preview", () => {
  const result = run(["surprises", "--provider", "higgsfield,codex-cli", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.schema, "vibetracker.surprise-preview/0.1");
  assert.equal(payload.safePreview, true);
  assert.deepEqual(payload.providerIds, ["higgsfield", "codex-cli"]);
  assert.equal(payload.writes, false);
  assert.equal(payload.uploads, false);
  assert.equal(payload.providerCalls, false);
  assert.equal(payload.secretsRead, false);
});

test("surprises command renders static scan reel without provider calls", () => {
  const result = run(["motion", "higgsfield,codex-cli,ollama", "--static"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /SURPRISE-DIRECTOR\/\/SAFE-PREVIEW/);
  assert.match(result.stdout, /HIGGSFIELD TURN/);
  assert.match(result.stdout, /CODEX TRUST CUBE/);
  assert.match(result.stdout, /LOCAL LAB RADAR/);
  assert.match(result.stdout, /SURPRISE-FLIGHT-RECORDER/);
  assert.match(result.stdout, /visualOnly=true and usageWrites=false/);
  assert.match(result.stdout, /no provider calls, writes, or uploads/);
  assert.match(result.stdout, /no secret reads; no local records are changed/);
});

test("surprises command writes a script-free static HTML reel", () => {
  const dir = mkdtempSync(join(tmpdir(), "vibetracker-surprises-"));
  const out = join(dir, "reel.html");
  const result = run(["surprises", "--provider", "higgsfield,codex-cli", "--html", "--out", out]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /surprise reel/);
  assert.match(result.stdout, /static HTML; no scripts/);
  const html = readFileSync(out, "utf8");
  assert.match(html, /VibeTRACKER Surprise Reel/);
  assert.match(html, /Vibers<br>Unite/);
  assert.match(html, /HIGGSFIELD TURN/);
  assert.match(html, /CODEX TRUST CUBE/);
  assert.match(html, /Provider Arrival Runway/);
  assert.match(html, /SCAN-RUNWAY\/\/PROVIDER-ARRIVALS\/\/NO-FAKE-SPEND/);
  assert.match(html, /Flight Recorder/);
  assert.match(html, /SURPRISE-FLIGHT-RECORDER\/\/STATIC-GUI/);
  assert.doesNotMatch(html, /<script/i);
});
