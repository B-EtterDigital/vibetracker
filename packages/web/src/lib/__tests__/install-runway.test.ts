import { test } from "node:test";
import assert from "node:assert/strict";
import { buildInstallRunway } from "../install-runway.ts";

test("install runway turns first run into a labelled terminal-to-gui command center", () => {
  const runway = buildInstallRunway();

  assert.equal(runway.headline, "First-run install runway");
  assert.equal(runway.terminalLines.every((line) => line.length === 64), true);
  assert.match(runway.terminalLines.join("\n"), /TERMINAL-TO-GUI/);
  assert.match(runway.terminalLines.join("\n"), /Vibers Unite/);
  assert.match(runway.terminalLines.join("\n"), /no upload before preview/);
  assert.deepEqual(runway.tracks.map((track) => track.id), [
    "terminal-gui",
    "source-detect",
    "safe-sync",
    "creator-ledger",
    "privacy-publish",
  ]);
  assert.deepEqual(runway.tracks.map((track) => track.impact), [
    "install",
    "local",
    "usage",
    "creator",
    "publish",
  ]);
  assert.equal(runway.tracks.every((track) => track.frames.length === 3), true);
  assert.equal(runway.tracks.every((track) => track.terminal.length === 4), true);
  assert.equal(runway.tracks.every((track) => track.meter > 0 && track.meter <= 100), true);
  assert.deepEqual(runway.handoff.map((step) => step.id), ["tty", "gui", "scan", "review"]);
  assert.deepEqual(runway.handoff.map((step) => step.impact), ["install", "install", "local", "privacy"]);
  assert.equal(runway.handoff.every((step) => step.frames.length === 3), true);
  assert.equal(runway.handoff.every((step) => step.terminal.length === 3), true);
  assert.equal(runway.handoff.every((step) => step.terminal.every((line) => line.length === 36)), true);
  assert.equal(runway.handoff.every((step) => step.visualOnly), true);
  assert.equal(runway.handoff.every((step) => step.usageWrites === false), true);
  assert.equal(runway.handoff.every((step) => step.providerCalls === false), true);

  const boot = runway.tracks.find((track) => track.id === "terminal-gui");
  assert.ok(boot);
  assert.match(boot.command, /init --gui/);
  assert.match(boot.guardrail, /not a landing page/);

  const gui = runway.handoff.find((step) => step.id === "gui");
  assert.ok(gui);
  assert.match(gui.command, /init --gui/);
  assert.match(gui.terminal.join("\n"), /terminal remains inline/);

  const scan = runway.handoff.find((step) => step.id === "scan");
  assert.ok(scan);
  assert.match(scan.terminal.join("\n"), /no provider calls yet/);

  const review = runway.handoff.find((step) => step.id === "review");
  assert.ok(review);
  assert.match(review.command, /upload --dry-run/);
  assert.match(review.terminal.join("\n"), /NOT USAGE/);

  const privacy = runway.tracks.find((track) => track.id === "privacy-publish");
  assert.ok(privacy);
  assert.match(privacy.command, /upload --dry-run/);
  assert.match(privacy.guardrail, /NOT USAGE/);

  assert.equal(runway.totals.tracks, 5);
  assert.equal(runway.totals.handoffSteps, 4);
  assert.equal(runway.totals.localFirst >= 2, true);
  assert.equal(runway.totals.notUsage >= 2, true);
  assert.equal(runway.totals.publishGates >= 1, true);
  assert.equal(runway.totals.visualOnly, 4);
  assert.equal(runway.totals.usageWrites, 0);
});
