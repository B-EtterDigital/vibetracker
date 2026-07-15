import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { operatorRouteFor } from "../../components/operator-menu-model.ts";
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
  const controlStyles = readFileSync("packages/web/src/app/wizard/wizard-controls.css", "utf8");
  const layoutStyles = readFileSync("packages/web/src/app/wizard/wizard-layout.css", "utf8");
  const manifest = readFileSync("packages/web/src/app/wizard/module.sweetspot.json", "utf8");

  assert.ok(operatorRouteFor("/wizard"));
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
  assert.match(controlStyles, /\.wizard-sources__grid/);
  assert.match(styles, /\.wrap:has\(\.wizard-surface\)::before/);
  assert.match(styles, /overflow-wrap: anywhere/);
  assert.match(controlStyles, /:focus-visible/);
  assert.match(layoutStyles, /@media \(min-width: 2200px\)/);
  assert.match(layoutStyles, /\.wizard-surface \{ width: min\(2640px, 95vw\); \}/);
  assert.match(layoutStyles, /grid-template-columns: 240px minmax\(0, 1\.2fr\) minmax\(700px, 0\.8fr\)/);
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
    "npx vibetrack providers --domain ai",
    "npx vibetrack providers --domain creative",
    "npx vibetrack providers --domain dev",
    "npx vibetrack detect --json",
    "npx vibetrack sync --receipt --out ~/.vibetracker/receipts",
    "npx vibetrack audit",
    "npx vibetrack upload --dry-run",
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
    "npx vibetrack detect --json",
    "npx vibetrack audit",
  ]);
  assert.equal(localRunbook.status, "1 source rail / local only");
  assert.ok(localRunbook.commands.every((command) => command !== "npx vibetrack upload"));
  assert.equal(WIZARD_MODES.length, 3);
});
