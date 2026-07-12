import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildWizardRunbook,
  DEFAULT_WIZARD_OPTIONS,
  WIZARD_MODES,
  WIZARD_SOURCES,
} from "../../app/wizard/wizard-command.ts";

test("wizard route is a focused interactive command deck", () => {
  const page = readFileSync("packages/web/src/app/wizard/page.tsx", "utf8");
  const shell = readFileSync("packages/web/src/app/wizard/wizard-shell.tsx", "utf8");
  const styles = readFileSync("packages/web/src/app/wizard/wizard.css", "utf8");
  const layoutStyles = readFileSync("packages/web/src/app/wizard/wizard-layout.css", "utf8");
  const manifest = readFileSync("packages/web/src/app/wizard/module.sweetspot.json", "utf8");
  const layout = readFileSync("packages/web/src/app/layout.tsx", "utf8");

  assert.match(layout, /href="\/wizard"><span>05<\/span>Wizard/);
  assert.match(page, /buildInstallRunway/);
  assert.match(page, /buildLaunchSequence/);
  assert.match(page, /buildWizardFlightRecorder/);
  assert.match(page, /<WizardShell/);
  assert.match(page, /\.\/wizard\.css/);
  assert.match(shell, /^"use client";/);
  assert.match(shell, /buildWizardRunbook/);
  assert.match(shell, /navigator\.clipboard\.writeText/);
  assert.match(shell, /Clipboard access failed/);
  assert.match(shell, /nothing runs on this page/);
  assert.match(shell, /type="checkbox"/);
  assert.match(shell, /aria-pressed=/);
  assert.match(shell, /aria-live="polite"/);
  assert.match(shell, /usage != trust/);
  assert.match(shell, /trust signals remain NOT USAGE/);
  assert.match(styles, /\.wizard-workspace/);
  assert.match(styles, /\.wizard-terminal/);
  assert.match(styles, /\.wizard-sources__grid/);
  assert.match(styles, /:focus-visible/);
  assert.match(layoutStyles, /@media \(max-width: 760px\)/);
  assert.match(layoutStyles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(manifest, /000-vibetracker\.web\.first-run-command-deck/);
  assert.doesNotMatch(shell, /dangerouslySetInnerHTML/);
  assert.doesNotMatch(page, /WizardPreflightStrip|WizardCommandBridgePanel|WizardSignalCockpitPanel/);
});

test("runbook generator emits only real reviewed CLI steps", () => {
  const defaultRunbook = buildWizardRunbook(DEFAULT_WIZARD_OPTIONS);
  assert.equal(defaultRunbook.primary, "npx vibetrack init --gui");
  assert.equal(defaultRunbook.selectedSources.length, WIZARD_SOURCES.length);
  assert.deepEqual(defaultRunbook.commands, [
    "npx vibetrack init --gui",
    "vibetracker providers --domain ai",
    "vibetracker providers --domain creative",
    "vibetracker providers --domain dev",
    "vibetracker detect --json",
    "vibetracker sync --receipt --out ~/.vibetracker/receipts",
    "vibetracker audit",
    "vibetracker upload --dry-run",
  ]);
  assert.match(defaultRunbook.status, /4 source rails/);
  assert.match(defaultRunbook.status, /publish preview locked/);

  const localRunbook = buildWizardRunbook({
    mode: "terminal",
    sources: ["local"],
    receipt: false,
    publishPreview: false,
  });
  assert.equal(localRunbook.primary, "npx vibetrack init");
  assert.deepEqual(localRunbook.commands, [
    "npx vibetrack init",
    "vibetracker detect --json",
    "vibetracker audit",
  ]);
  assert.equal(localRunbook.status, "1 source rail / local only");
  assert.ok(localRunbook.commands.every((command) => command !== "vibetracker upload"));
  assert.equal(WIZARD_MODES.length, 3);
});
