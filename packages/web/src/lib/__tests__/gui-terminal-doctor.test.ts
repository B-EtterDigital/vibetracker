import { test } from "node:test";
import assert from "node:assert/strict";
import { buildGuiTerminalDoctor } from "../gui-terminal-doctor.ts";

test("GUI terminal doctor exposes local health commands and trust boundaries", () => {
  const doctor = buildGuiTerminalDoctor();

  assert.equal(doctor.headline, "GUI DOCTOR RACK");
  assert.match(doctor.terminalLines.join("\n"), /GUI-DOCTOR/);
  assert.match(doctor.terminalLines.join("\n"), /VIBERS-UNITE/);
  assert.match(doctor.terminalLines.join("\n"), /NOT USAGE/);
  assert.ok(doctor.checks.some((check) => check.command === "vibetracker doctor"));
  assert.ok(doctor.checks.some((check) => check.command === "vibetracker upload --dry-run"));
  assert.ok(doctor.checks.some((check) => check.impact === "not_usage" && check.note.includes("separately from usage spend")));
  assert.ok(doctor.checks.every((check) => check.meter >= 0 && check.meter <= 100));
});

test("GUI terminal doctor keeps branded surprise pulses ready for the homepage", () => {
  const doctor = buildGuiTerminalDoctor();

  assert.deepEqual(doctor.pulses.map((pulse) => pulse.id), ["higgsfield", "codex-cli", "ollama", "c0vibe"]);
  assert.equal(doctor.pulses.every((pulse) => pulse.ascii.length === 3), true);
  assert.ok(doctor.pulses.every((pulse) => pulse.mark.length >= 2));
  assert.ok(doctor.pulses.every((pulse) => pulse.from.startsWith("#") && pulse.to.startsWith("#")));
  assert.match(doctor.pulses[0].note, /MCP prism/);
  assert.match(doctor.pulses[1].note, /fake spend/);
  assert.match(doctor.pulses[3].note, /c0vibe\.app/);
});

test("GUI terminal doctor terminal rows fit compact GUI panes", () => {
  const doctor = buildGuiTerminalDoctor();

  assert.equal(doctor.terminalLines.every((line) => line.length <= 56), true);
  assert.equal(doctor.pulses.flatMap((pulse) => pulse.ascii).every((line) => line.length <= 8), true);
});
