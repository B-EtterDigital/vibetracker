import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildPasskeyCeremonyControl, buildPasskeyProofConsole, buildPasskeyRecoveryRelay } from "../passkey-proof-console.ts";

test("passkey ceremony control maps account proof without mutating usage", () => {
  const ceremony = buildPasskeyCeremonyControl({
    state: "verified",
    supported: true,
    hasCredential: true,
  });

  assert.equal(ceremony.headline, "Passkey ceremony control");
  assert.equal(ceremony.terminalLines.every((line) => line.length === 66), true);
  assert.match(ceremony.terminalLines.join("\n"), /PASSKEY-CEREMONY/);
  assert.match(ceremony.terminalLines.join("\n"), /C0VIBE\.APP/);
  assert.match(ceremony.terminalLines.join("\n"), /Vibers Unite/);
  assert.deepEqual(ceremony.stages.map((stage) => stage.id), [
    "secure-context",
    "authenticator-prompt",
    "credential-preview",
    "usage-firewall",
    "cli-link",
    "public-publish",
  ]);
  assert.deepEqual(ceremony.stages.map((stage) => stage.impact), [
    "identity",
    "identity",
    "local_only",
    "not_usage",
    "privacy",
    "publish",
  ]);
  assert.deepEqual(ceremony.counters, {
    providerCalls: 0,
    promptReads: 0,
    outputReads: 0,
    usageMutations: 0,
    publishWrites: 0,
  });
  assert.deepEqual(ceremony.totals, {
    identity: 2,
    local_only: 1,
    not_usage: 1,
    privacy: 1,
    publish: 1,
  });
  assert.equal(ceremony.stages.every((stage) => stage.terminal.length === 4), true);
  assert.equal(ceremony.stages.every((stage) => stage.terminal.every((line) => line.length === 66)), true);

  const firewall = ceremony.stages.find((stage) => stage.id === "usage-firewall");
  assert.ok(firewall);
  assert.equal(firewall.impact, "not_usage");
  assert.equal(firewall.value, "NOT USAGE");
  assert.match(firewall.guardrail, /rank/);

  const publish = ceremony.stages.find((stage) => stage.id === "public-publish");
  assert.ok(publish);
  assert.equal(publish.command, "vibetracker upload --dry-run");
  assert.match(publish.target, /c0vibe\.app/);
  assert.match(publish.value, /Vibers Unite/);

  assert.equal(ceremony.invariants.some((line) => /not usage truth/.test(line)), true);
  assert.equal(ceremony.invariants.some((line) => /No provider calls/.test(line)), true);
  assert.equal(ceremony.invariants.some((line) => /rank remain unchanged/.test(line)), true);
});

test("passkey proof console separates identity proof from usage and publish state", () => {
  const consoleState = buildPasskeyProofConsole({
    state: "verified",
    supported: true,
    hasCredential: true,
  });

  assert.equal(consoleState.headline, "Passkey proof console");
  assert.equal(consoleState.terminalLines.every((line) => line.length === 64), true);
  assert.match(consoleState.terminalLines.join("\n"), /IDENTITY-ONLY/);
  assert.match(consoleState.terminalLines.join("\n"), /C0VIBE\.APP/);
  assert.match(consoleState.terminalLines.join("\n"), /Vibers Unite/);
  assert.deepEqual(consoleState.rails.map((rail) => rail.id), [
    "browser-boundary",
    "credential-vault",
    "usage-firewall",
    "cli-approval",
    "c0vibe-publish",
  ]);
  assert.deepEqual(consoleState.rails.map((rail) => rail.impact), [
    "identity",
    "local_only",
    "not_usage",
    "privacy",
    "publish",
  ]);
  assert.equal(consoleState.rails.every((rail) => rail.terminal.length === 4), true);
  assert.equal(consoleState.rails.every((rail) => rail.meter > 0 && rail.meter <= 100), true);

  const firewall = consoleState.rails.find((rail) => rail.id === "usage-firewall");
  assert.ok(firewall);
  assert.equal(firewall.value, "NOT USAGE");
  assert.match(firewall.note, /never change spend/);

  const cli = consoleState.rails.find((rail) => rail.id === "cli-approval");
  assert.ok(cli);
  assert.equal(cli.value, "asserted");
  assert.match(cli.guardrail, /preview/);

  const publish = consoleState.rails.find((rail) => rail.id === "c0vibe-publish");
  assert.ok(publish);
  assert.match(publish.command, /upload --dry-run/);
  assert.match(publish.value, /Vibers Unite/);
});

test("passkey recovery relay drills safe account recovery without usage movement", () => {
  const relay = buildPasskeyRecoveryRelay({
    state: "verified",
    supported: true,
    hasCredential: true,
  });

  assert.equal(relay.headline, "Recovery relay");
  assert.equal(relay.terminalLines.every((line) => line.length === 64), true);
  assert.match(relay.terminalLines.join("\n"), /PASSKEY-RECOVERY-RELAY/);
  assert.match(relay.terminalLines.join("\n"), /NOT-USAGE/);
  assert.match(relay.terminalLines.join("\n"), /rankImpact 0/);
  assert.match(relay.terminalLines.join("\n"), /Vibers Unite/);
  assert.match(relay.terminalLines.join("\n"), /c0vibe\.app/);
  assert.deepEqual(relay.steps.map((step) => step.id), [
    "secure-context-check",
    "credential-receipt",
    "backup-authenticator",
    "cli-refresh",
    "usage-freeze",
    "public-dry-run",
  ]);
  assert.deepEqual(relay.steps.map((step) => step.impact), [
    "identity",
    "local_only",
    "identity",
    "privacy",
    "not_usage",
    "publish",
  ]);
  assert.equal(relay.steps.every((step) => step.frames.length === 3), true);
  assert.equal(relay.steps.every((step) => step.checklist.length === 4), true);
  assert.equal(relay.steps.every((step) => step.meter > 0 && step.meter <= 100), true);
  assert.deepEqual(relay.totals, {
    steps: 6,
    identity: 2,
    localOnly: 1,
    notUsage: 1,
    privacy: 1,
    publish: 1,
    providerCalls: 0,
    usageMutations: 0,
    publicWrites: 0,
    averageMeter: 91,
  });

  const backup = relay.steps.find((step) => step.id === "backup-authenticator");
  assert.ok(backup);
  assert.match(backup.guardrail, /usage rank/);
  assert.match(backup.command, /navigator\.credentials\.create/);

  const token = relay.steps.find((step) => step.id === "cli-refresh");
  assert.ok(token);
  assert.equal(token.command, "vibetracker login --refresh");
  assert.match(token.guardrail, /does not read/);

  const freeze = relay.steps.find((step) => step.id === "usage-freeze");
  assert.ok(freeze);
  assert.equal(freeze.value, "rankImpact 0");
  assert.equal(freeze.impact, "not_usage");
  assert.match(freeze.guardrail, /NOT USAGE/);

  const publish = relay.steps.find((step) => step.id === "public-dry-run");
  assert.ok(publish);
  assert.equal(publish.command, "vibetracker upload --dry-run");
  assert.match(publish.guardrail, /No c0vibe\.app write/);
});

test("passkey proof console shows blocked secure-context state honestly", () => {
  const consoleState = buildPasskeyProofConsole({
    state: "idle",
    supported: false,
    hasCredential: false,
  });
  const browser = consoleState.rails.find((rail) => rail.id === "browser-boundary");
  const vault = consoleState.rails.find((rail) => rail.id === "credential-vault");

  assert.ok(browser);
  assert.equal(browser.value, "secure context needed");
  assert.equal(browser.meter < 50, true);
  assert.ok(vault);
  assert.equal(vault.value, "no local proof");
});

test("passkeys route exposes the ceremony console with responsive SFF styling", () => {
  const page = readFileSync("packages/web/src/app/passkeys/page.tsx", "utf8");
  const layout = readFileSync("packages/web/src/app/layout.tsx", "utf8");
  const css = readFileSync("packages/web/src/app/globals.css", "utf8");

  assert.match(layout, /href="\/passkeys"/);   // reachable from the header
  assert.match(page, /buildPasskeyCeremonyControl/);
  assert.match(page, /buildPasskeyRecoveryRelay/);
  assert.match(page, /PasskeyCeremonyControlPanel/);
  assert.match(page, /PasskeyRecoveryRelayPanel/);
  assert.match(page, /VTK:\/\/PASSKEY-CEREMONY\/\/IDENTITY-ONLY\/\/ZERO-USAGE-MUTATION/);
  assert.match(page, /VTK:\/\/PASSKEY-RECOVERY-RELAY\/\/IDENTITY-ONLY\/\/NOT-USAGE/);
  assert.match(page, /providerCalls/);
  assert.match(page, /promptReads/);
  assert.match(page, /outputReads/);
  assert.match(page, /usageMutations/);
  assert.match(page, /publishWrites/);
  assert.match(page, /publicWrites/);
  assert.match(page, /relay\.steps\.map/);
  assert.match(page, /step\.checklist\.map/);
  assert.match(page, /stage\.impact === "not_usage"/);
  assert.match(page, /step\.impact === "not_usage"/);
  assert.match(page, /stage\.source/);
  assert.match(page, /stage\.target/);
  assert.match(page, /Vibers Unite/);
  assert.match(page, /c0vibe\.app/);
  assert.doesNotMatch(page, /dangerouslySetInnerHTML/);

  assert.match(css, /\.passkey-ceremony-control/);
  assert.match(css, /\.passkey-ceremony-stage--not_usage/);
  assert.match(css, /\.passkey-ceremony-counters/);
  assert.match(css, /\.passkey-ceremony-invariants/);
  assert.match(css, /\.passkey-recovery-relay/);
  assert.match(css, /\.passkey-recovery-step--not_usage/);
  assert.match(css, /\.passkey-recovery-step__screen/);
  assert.match(css, /\.passkey-recovery-step__checklist/);
  assert.match(css, /\.passkey-recovery-step footer em::before/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /passkey-ceremony-stage__meter i \{ transform: none; \}/);
  assert.match(css, /passkey-recovery-step__screen pre:first-child/);
  assert.match(css, /@media \(max-width: 1040px\)[\s\S]*passkey-ceremony-control__body/);
  assert.match(css, /@media \(max-width: 1040px\)[\s\S]*passkey-recovery-relay__body/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*passkey-ceremony-control__head/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*passkey-recovery-relay__head/);
});
