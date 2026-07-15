import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildPasskeyCeremonyControl, buildPasskeyProofConsole, buildPasskeyRecoveryRelay } from "../passkey-proof-console.ts";

test("passkey ceremony control maps a local assertion without mutating usage", () => {
  const ceremony = buildPasskeyCeremonyControl({
    state: "asserted",
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
    "local_only",
    "local_only",
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
    identity: 0,
    local_only: 3,
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

  assert.equal(ceremony.invariants.some((line) => /does not verify a server account/.test(line)), true);
  assert.equal(ceremony.invariants.some((line) => /No provider calls/.test(line)), true);
  assert.equal(ceremony.invariants.some((line) => /rank remain unchanged/.test(line)), true);
});

test("passkey boundary console separates local authenticator state from usage and publish state", () => {
  const consoleState = buildPasskeyProofConsole({
    state: "asserted",
    supported: true,
    hasCredential: true,
  });

  assert.equal(consoleState.headline, "Passkey boundary console");
  assert.equal(consoleState.terminalLines.every((line) => line.length === 64), true);
  assert.match(consoleState.terminalLines.join("\n"), /LOCAL-ONLY/);
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
    "local_only",
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
  assert.equal(cli.value, "GitHub/server required");
  assert.match(cli.guardrail, /grants no token/);

  const publish = consoleState.rails.find((rail) => rail.id === "c0vibe-publish");
  assert.ok(publish);
  assert.match(publish.command, /upload --dry-run/);
  assert.match(publish.value, /Vibers Unite/);
});

test("passkey recovery relay drills safe account recovery without usage movement", () => {
  const relay = buildPasskeyRecoveryRelay({
    state: "asserted",
    supported: true,
    hasCredential: true,
  });

  assert.equal(relay.headline, "Recovery relay");
  assert.equal(relay.terminalLines.every((line) => line.length === 64), true);
  assert.match(relay.terminalLines.join("\n"), /PASSKEY-RECOVERY-RELAY/);
  assert.match(relay.terminalLines.join("\n"), /LOCAL-ONLY/);
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
    "local_only",
    "local_only",
    "local_only",
    "privacy",
    "not_usage",
    "publish",
  ]);
  assert.equal(relay.steps.every((step) => step.frames.length === 3), true);
  assert.equal(relay.steps.every((step) => step.checklist.length === 4), true);
  assert.equal(relay.steps.every((step) => step.meter > 0 && step.meter <= 100), true);
  assert.deepEqual(relay.totals, {
    steps: 6,
    identity: 0,
    localOnly: 3,
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

test("passkeys route leads with GitHub-first identity truth and collapses the technical diagrams", () => {
  const page = readFileSync("packages/web/src/app/passkeys/page.tsx", "utf8");
  const client = readFileSync("packages/web/src/app/passkeys/passkey-local-console.tsx", "utf8");
  const reference = readFileSync("packages/web/src/app/passkeys/passkey-technical-reference.tsx", "utf8");
  const layout = readFileSync("packages/web/src/app/layout.tsx", "utf8");
  const css = readFileSync("packages/web/src/app/globals.css", "utf8");
  const localCss = readFileSync("packages/web/src/app/passkeys/passkey-local.css", "utf8");

  assert.match(layout, /href="\/passkeys"/);
  assert.match(page, /<PasskeyLocalConsole/);
  assert.match(client, /GitHub proves the account\. This key stays local\./);
  assert.match(client, /NOT AN ACCOUNT LOGIN/);
  assert.match(client, /server verification: none/);
  assert.match(client, /SIGN IN WITH GITHUB/);
  assert.match(client, /CREATE LOCAL KEY/);
  assert.match(client, /CHECK LOCAL KEY/);
  assert.match(client, /CLEAR REFERENCE/);
  assert.match(client, /No server verified this assertion/);
  assert.match(client, /<details className="passkey-technical">/);
  assert.match(client, /<PasskeyTechnicalReference/);
  assert.doesNotMatch(client, /proof verified|verified for this session|proves account control/i);

  assert.match(reference, /buildPasskeyCeremonyControl/);
  assert.match(reference, /buildPasskeyRecoveryRelay/);
  assert.match(reference, /VTK:\/\/PASSKEY-CEREMONY\/\/LOCAL-ONLY\/\/ZERO-USAGE-MUTATION/);
  assert.match(reference, /VTK:\/\/PASSKEY-RECOVERY-RELAY\/\/LOCAL-ONLY\/\/NOT-USAGE/);
  assert.match(reference, /providerCalls/);
  assert.match(reference, /promptReads/);
  assert.match(reference, /outputReads/);
  assert.match(reference, /usageMutations/);
  assert.match(reference, /publishWrites/);
  assert.match(reference, /publicWrites/);
  assert.match(reference, /relay\.steps\.map/);
  assert.match(reference, /step\.checklist\.map/);
  assert.match(reference, /stage\.impact === "not_usage"/);
  assert.match(reference, /step\.impact === "not_usage"/);
  assert.match(reference, /stage\.source/);
  assert.match(reference, /stage\.target/);
  assert.doesNotMatch(reference, /dangerouslySetInnerHTML/);

  assert.match(localCss, /\.passkey-local__warning/);
  assert.match(localCss, /\.passkey-local__rails/);
  assert.match(localCss, /\.passkey-local__console/);
  assert.match(localCss, /@media \(max-width: 620px\)/);
  assert.match(localCss, /@media \(min-width: 2200px\)/);
  assert.match(localCss, /max-width: min\(2640px, 95vw\)/);
  assert.match(localCss, /prefers-reduced-motion: reduce/);

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
