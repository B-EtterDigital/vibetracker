import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLaunchCapsule, buildLaunchSequence, buildScanCommandRunway, buildWizardFlightRecorder } from "../launch-sequence.ts";

test("launch sequence presents the terminal-to-GUI onboarding flow", () => {
  const steps = buildLaunchSequence();

  assert.deepEqual(steps.map((step) => step.id), ["gui", "connect", "collect", "share"]);
  assert.deepEqual(steps.map((step) => step.status), ["local", "consent", "audit", "dry-run"]);
  assert.equal(steps[0].command, "npx vibetrack init --gui");
  assert.match(steps[0].note, /ASCII CLI/);
  assert.match(steps[1].note, /OAuth/);
  assert.match(steps[1].note, /manual ledgers/);
  assert.match(steps[2].note, /trust signals/);
  assert.equal(steps[3].command, "npx vibetrack upload --dry-run");
  assert.match(steps[3].note, /Vibers Unite/);
  assert.match(steps[3].note, /c0vibe\.app/);
  assert.match(steps[3].note, /what leaves the machine/);
});

test("launch sequence terminal rows are short enough for compact cards", () => {
  const steps = buildLaunchSequence();

  assert.equal(steps.every((step) => step.terminal.length === 3), true);
  assert.equal(steps.flatMap((step) => step.terminal).every((line) => line.length <= 32), true);
});

test("launch capsule packages terminal GUI, usage, trust, privacy, and publish rails", () => {
  const capsule = buildLaunchCapsule();

  assert.equal(capsule.headline, "LAUNCH CAPSULE");
  assert.match(capsule.subline, /C0VIBE relay/);
  assert.match(capsule.terminalLines.join("\n"), /VIBERS-UNITE/);
  assert.match(capsule.terminalLines.join("\n"), /c0vibe\.app/);
  assert.deepEqual(capsule.lanes.map((lane) => lane.id), ["wizard", "capture", "trust", "privacy", "relay"]);
  assert.deepEqual(capsule.lanes.map((lane) => lane.impact), ["local_only", "usage", "trust", "privacy", "publish"]);
  assert.match(capsule.lanes.find((lane) => lane.id === "trust")?.note ?? "", /never inflate usage totals/);
  assert.equal(capsule.lanes.every((lane) => lane.meter >= 0 && lane.meter <= 100), true);
  assert.equal(capsule.lanes.every((lane) => lane.ascii.length === 3), true);
  assert.equal(capsule.lanes.every((lane) => lane.from.startsWith("#") && lane.to.startsWith("#")), true);
});

test("launch capsule terminal and lane copy fit compact home panels", () => {
  const capsule = buildLaunchCapsule();

  assert.equal(capsule.terminalLines.every((line) => line.length <= 56), true);
  assert.equal(capsule.lanes.every((lane) => lane.command.length <= 38), true);
  assert.equal(capsule.lanes.every((lane) => lane.value.length <= 16), true);
});

test("wizard flight recorder captures the first minute without side effects", () => {
  const recorder = buildWizardFlightRecorder();

  assert.equal(recorder.headline, "FIRST-MINUTE FLIGHT RECORDER");
  assert.match(recorder.subline, /ASCII CLI hands off to the GUI/);
  assert.match(recorder.terminalLines.join("\n"), /WIZARD-FLIGHT-RECORDER/);
  assert.match(recorder.terminalLines.join("\n"), /C0VIBE\.APP/);
  assert.match(recorder.terminalLines.join("\n"), /Vibers Unite/);
  assert.match(recorder.terminalLines.join("\n"), /providerCalls=0/);
  assert.match(recorder.terminalLines.join("\n"), /publishWrites=0/);
  assert.equal(recorder.terminalLines.every((line) => line.length === 64), true);
  assert.deepEqual(recorder.events.map((event) => event.id), [
    "terminal-boot",
    "consent-lock",
    "scan-preview",
    "proof-review",
    "public-relay",
  ]);
  assert.deepEqual(recorder.events.map((event) => event.second), ["00s", "12s", "28s", "44s", "60s"]);
  assert.deepEqual(recorder.events.map((event) => event.impact), ["local_only", "privacy", "usage", "privacy", "publish"]);
  assert.equal(recorder.events.every((event) => event.frames.length === 3), true);
  assert.equal(recorder.events.every((event) => event.checks.length === 3), true);
  assert.equal(recorder.events.every((event) => event.meter > 0 && event.meter <= 100), true);
  assert.equal(recorder.events.every((event) => event.from.startsWith("#") && event.to.startsWith("#")), true);
  assert.deepEqual(recorder.counters, {
    providerCalls: 0,
    ledgerWrites: 0,
    hiddenUpload: 0,
    promptReads: 0,
    outputReads: 0,
    publishWrites: 0,
  });
  assert.deepEqual(recorder.totals, {
    events: 5,
    localOnly: 1,
    usage: 1,
    privacy: 2,
    publish: 1,
    sideEffects: 0,
  });
  assert.match(recorder.events.find((event) => event.id === "terminal-boot")?.command ?? "", /--gui/);
  assert.match(recorder.events.find((event) => event.id === "scan-preview")?.note ?? "", /Higgsfield prism/);
  assert.match(recorder.events.find((event) => event.id === "public-relay")?.note ?? "", /c0vibe\.app/);
  assert.match(recorder.events.find((event) => event.id === "public-relay")?.value ?? "", /Vibers Unite/);
});

test("scan command runway previews surprise phases without side effects", () => {
  const runway = buildScanCommandRunway();

  assert.equal(runway.headline, "SCAN COMMAND RUNWAY");
  assert.match(runway.subline, /before collection starts/);
  assert.match(runway.terminalLines.join("\n"), /SCAN-COMMAND-RUNWAY/);
  assert.match(runway.terminalLines.join("\n"), /providerCalls=0 \/\/ ledgerWrites=0 \/\/ hiddenUpload=0/);
  assert.match(runway.terminalLines.join("\n"), /Vibers Unite/);
  assert.match(runway.terminalLines.join("\n"), /c0vibe\.app/i);
  assert.equal(runway.terminalLines.every((line) => line.length === 64), true);
  assert.deepEqual(runway.steps.map((step) => step.id), ["detect", "higgsfield", "local", "creator", "trust", "privacy", "relay"]);
  assert.deepEqual(runway.steps.map((step) => step.railLabel), [
    "LOCAL-ONLY",
    "USAGE",
    "LOCAL-ONLY",
    "USAGE",
    "NOT USAGE",
    "PRIVACY",
    "PUBLISH",
  ]);
  assert.equal(runway.steps.every((step) => step.frames.length === 4), true);
  assert.equal(runway.steps.every((step) => step.transcript.length === 3), true);
  assert.equal(runway.steps.every((step) => step.visualOnly === true), true);
  assert.equal(runway.steps.every((step) => step.providerCalls === false), true);
  assert.equal(runway.steps.every((step) => step.ledgerWrites === false), true);
  assert.equal(runway.steps.every((step) => step.hiddenUpload === false), true);
  assert.match(runway.steps.find((step) => step.id === "higgsfield")?.label ?? "", /Higgsfield/);
  assert.match(runway.steps.find((step) => step.id === "trust")?.cue ?? "", /Codex/);
  assert.match(runway.steps.find((step) => step.id === "local")?.cue ?? "", /Ollama/);
  assert.match(runway.steps.find((step) => step.id === "relay")?.cue ?? "", /Vibers Unite/);
  assert.deepEqual(runway.totals, {
    steps: 7,
    visualOnly: 7,
    providerCalls: 0,
    ledgerWrites: 0,
    hiddenUpload: 0,
  });
});
