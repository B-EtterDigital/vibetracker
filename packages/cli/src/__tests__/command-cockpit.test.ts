import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";
import { commandCockpitPayload, renderCommandCockpit, renderCommandCockpitHtml } from "../command-cockpit.ts";

function run(args: string[]) {
  return spawnSync(process.execPath, ["bin/vibetracker.mjs", ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, VT_NO_SURPRISES: "1", VT_NO_ANIM: "1" },
  });
}

test("command cockpit payload exposes the local-first command path", () => {
  const payload = commandCockpitPayload();
  const commands = payload.lanes.flatMap((lane) => lane.commands.map((command) => command.command));

  assert.equal(payload.schema, "vibetracker.command-cockpit/0.1");
  assert.equal(payload.safePreview, true);
  assert.equal(payload.writes, false);
  assert.equal(payload.uploads, false);
  assert.equal(payload.providerCalls, false);
  assert.equal(payload.secretsRead, false);
  assert.deepEqual(commands, [
    "vibetracker init --gui",
    "vibetracker doctor",
    "vibetracker surprises --html --out surprise-reel.html",
    "vibetracker detect",
    "vibetracker sync",
    "vibetracker audit",
    "vibetracker upload --dry-run",
    "vibetracker upload",
  ]);
});

test("command cockpit text keeps trust and preview rails separate", () => {
  const text = renderCommandCockpit();

  assert.match(text, /COMMAND-COCKPIT/);
  assert.match(text, /no provider calls, writes, uploads/);
  assert.match(text, /trust and preview rails stay NOT USAGE/);
  assert.match(text, /proof path: preview -> collect -> review -> publish/);
  assert.match(text, /vibetracker upload --dry-run/);
  assert.match(text, /Vibers Unite \/\/ c0vibe\.app/);
});

test("command cockpit html is static, branded, and script-free", () => {
  const html = renderCommandCockpitHtml();

  assert.match(html, /VibeTRACKER Command Cockpit/);
  assert.match(html, /VTK:\/\/COMMAND-COCKPIT\/\/STATIC-GUI\/\/LOCAL-FIRST/);
  assert.match(html, /Command<br>Cockpit/);
  assert.match(html, /vibetracker init --gui/);
  assert.match(html, /vibetracker surprises --html --out surprise-reel\.html/);
  assert.match(html, /doctor\/surprises are NOT USAGE/);
  assert.match(html, /VTK:\/\/COMMAND-SEQUENCER\/\/PROOF-PATH\/\/NO-AUTORUN/);
  assert.match(html, /Proof Path Sequencer/);
  assert.match(html, /Recommended operator order only/);
  assert.match(html, /safe preview first, local collection second, dry-run review before publish/);
  assert.match(html, /01/);
  assert.match(html, /init --gui/);
  assert.match(html, /doctor \+ surprises/);
  assert.match(html, /upload --dry-run/);
  assert.match(html, /publish only reviewed aggregates to c0vibe\.app/);
  assert.match(html, /Static file:/);
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /https?:\/\//i);
});

test("cockpit command writes a script-free static HTML file", () => {
  const dir = mkdtempSync(join(tmpdir(), "vibetracker-cockpit-"));
  const out = join(dir, "cockpit.html");
  const result = run(["cockpit", "--html", "--out", out]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /command cockpit/);
  assert.match(result.stdout, /static HTML; no scripts/);
  const html = readFileSync(out, "utf8");
  assert.match(html, /VibeTRACKER Command Cockpit/);
  assert.match(html, /Proof Path Sequencer/);
  assert.match(html, /vibetracker upload --dry-run/);
  assert.doesNotMatch(html, /<script/i);
});

test("commands alias exposes machine-readable cockpit metadata", () => {
  const result = run(["commands", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.schema, "vibetracker.command-cockpit/0.1");
  assert.equal(payload.safePreview, true);
  assert.equal(payload.lanes.length, 3);
});
