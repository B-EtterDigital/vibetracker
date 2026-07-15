import { test } from "node:test";
import assert from "node:assert/strict";
import { buildEvidenceCockpit } from "../evidence-cockpit.ts";

test("evidence cockpit presents the scan-to-share pipeline in order", () => {
  const cockpit = buildEvidenceCockpit();

  assert.equal(cockpit.headline, "FAST / HONEST / TRACEABLE");
  assert.deepEqual(cockpit.stages.map((stage) => stage.id), [
    "collect",
    "validate",
    "redact",
    "trust",
    "publish",
  ]);
  assert.deepEqual(cockpit.stages.map((stage) => stage.status), ["SCAN", "CHECK", "LOCAL", "SIDE", "RELAY"]);
  assert.ok(cockpit.stages.every((stage) => stage.meter >= 50 && stage.meter <= 100));
});

test("evidence cockpit keeps trust signals separate from usage totals", () => {
  const cockpit = buildEvidenceCockpit();
  const trust = cockpit.stages.find((stage) => stage.id === "trust");

  assert.ok(trust);
  assert.equal(trust.impact, "not_usage");
  assert.match(trust.note, /NOT USAGE/);
  assert.match(trust.note, /never change spend/);
  assert.match(trust.note, /Higgsfield MCP/);
  assert.match(trust.command, /trust list/);
});

test("evidence cockpit shows local-first dry-run privacy controls", () => {
  const cockpit = buildEvidenceCockpit();
  const redact = cockpit.stages.find((stage) => stage.id === "redact");
  const guards = cockpit.guards.map((guard) => guard.label);

  assert.ok(redact);
  assert.equal(redact.impact, "local_only");
  assert.match(redact.command, /--dry-run/);
  assert.match(redact.note, /prompts, files, and secrets out/);
  assert.ok(guards.includes("No prompt/content upload"));
  assert.ok(guards.includes("Verified and self-reported stay split"));
});

test("evidence cockpit terminal carries branded surprise beats", () => {
  const cockpit = buildEvidenceCockpit();
  const terminal = cockpit.terminalLines.join("\n");

  assert.match(terminal, /Higgsfield prism/);
  assert.match(terminal, /Codex builder trace/);
  assert.match(terminal, /Vibers Unite/);
  assert.match(terminal, /c0vibe\.app/);
  assert.equal(cockpit.terminalLines.every((line) => line.length <= 78), true);
  assert.ok(cockpit.stages.some((stage) => stage.ascii.join("\n").includes("C0VIBE")));
});

test("evidence cockpit exposes a labelled custody chain for public proof", () => {
  const cockpit = buildEvidenceCockpit();

  assert.deepEqual(cockpit.custody.map((link) => link.id), ["capture", "privacy", "trust", "publish"]);
  assert.deepEqual(cockpit.custody.map((link) => link.rail), ["USAGE", "LOCAL FIRST", "TRUST", "PUBLISH"]);
  assert.ok(cockpit.custody.every((link) => link.meter >= 80 && link.meter <= 100));
  assert.ok(cockpit.custody.every((link) => link.frames.length >= 3));
  assert.ok(cockpit.custody.some((link) => link.checks.includes("NO RAW PROMPTS")));
  assert.ok(cockpit.custody.some((link) => link.checks.includes("NOT USAGE")));
  assert.ok(cockpit.custody.some((link) => /C0VIBE datastream/.test(link.label)));
  assert.ok(cockpit.custody.some((link) => /npx vibetrack trust list/.test(link.command)));
});

test("evidence cockpit exposes a tamper-evident proof replay without mixing trust into usage", () => {
  const cockpit = buildEvidenceCockpit();
  const replay = cockpit.replay;

  assert.equal(replay.headline, "Tamper-evident replay");
  assert.deepEqual(replay.events.map((event) => event.id), [
    "receipt",
    "schema",
    "redaction",
    "trust-sidecar",
    "c0vibe-relay",
  ]);
  assert.deepEqual(replay.events.map((event) => event.rail), ["CAPTURE", "VERIFY", "REDACT", "SIDECAR", "RELAY"]);
  assert.equal(replay.terminalLines.every((line) => line.length === 64), true);
  assert.match(replay.terminalLines.join("\n"), /PROOF-REPLAY/);
  assert.match(replay.terminalLines.join("\n"), /NOT USAGE/);
  assert.match(replay.terminalLines.join("\n"), /c0vibe\.app/);
  assert.deepEqual(replay.totals, {
    events: 5,
    sealed: 2,
    localOnly: 1,
    notUsage: 1,
    publish: 1,
    averageMeter: 89,
  });
  assert.ok(replay.events.every((event) => event.hash.startsWith("sha256:")));
  assert.ok(replay.events.every((event) => event.frames.length === 3));
  assert.ok(replay.events.every((event) => event.marks.length === 3));
  assert.ok(replay.events.every((event) => event.meter >= 80 && event.meter <= 100));

  const sidecar = replay.events.find((event) => event.id === "trust-sidecar");
  assert.ok(sidecar);
  assert.equal(sidecar.status, "NOT USAGE");
  assert.match(sidecar.note, /Higgsfield MCP/);
  assert.match(sidecar.invariant, /cannot mutate usage rank/);

  const redaction = replay.events.find((event) => event.id === "redaction");
  assert.ok(redaction);
  assert.equal(redaction.status, "LOCAL");
  assert.match(redaction.command, /--dry-run/);
  assert.match(redaction.invariant, /No raw content leaves/);

  const relay = replay.events.find((event) => event.id === "c0vibe-relay");
  assert.ok(relay);
  assert.match(relay.note, /vibe score, public profile/);
  assert.equal(relay.command, "npx vibetrack upload");
});

test("evidence cockpit exposes an operator verification bridge", () => {
  const cockpit = buildEvidenceCockpit();
  const bridge = cockpit.bridge;
  const trustGate = bridge.gates.find((gate) => gate.id === "trust-split");
  const localGate = bridge.gates.find((gate) => gate.id === "machine-boundary");
  const publishGate = bridge.gates.find((gate) => gate.id === "c0vibe-relay");

  assert.equal(bridge.headline, "Verification bridge");
  assert.match(bridge.subline, /what counts, what leaves, what is not usage/);
  assert.equal(bridge.terminalLines.every((line) => line.length === 64), true);
  assert.match(bridge.terminalLines.join("\n"), /PROOF-BRIDGE/);
  assert.match(bridge.terminalLines.join("\n"), /ZERO-HIDDEN/);
  assert.match(bridge.terminalLines.join("\n"), /0 usage writes/);
  assert.match(bridge.terminalLines.join("\n"), /Vibers Unite/);
  assert.match(bridge.terminalLines.join("\n"), /c0vibe\.app/);
  assert.deepEqual(bridge.gates.map((gate) => gate.id), [
    "usage-seal",
    "machine-boundary",
    "trust-split",
    "c0vibe-relay",
  ]);
  assert.deepEqual(bridge.gates.map((gate) => gate.rail), ["USAGE", "LOCAL FIRST", "NOT USAGE", "PUBLISH"]);
  assert.equal(bridge.gates.every((gate) => gate.frames.length === 3), true);
  assert.equal(bridge.gates.every((gate) => gate.checks.length === 3), true);
  assert.equal(bridge.gates.every((gate) => gate.meter >= 80 && gate.meter <= 100), true);
  assert.deepEqual(bridge.totals, {
    gates: 4,
    usageGates: 1,
    localOnly: 1,
    notUsage: 1,
    publish: 1,
    zeroHiddenUploads: 0,
    trustUsageWrites: 0,
    averageMeter: 89,
  });
  assert.ok(localGate);
  assert.match(localGate.answer, /dry-run preview/);
  assert.equal(localGate.writes, "0 hidden uploads");
  assert.ok(trustGate);
  assert.equal(trustGate.writes, "0 usage writes");
  assert.match(trustGate.invariant, /mutate 0 spend, 0 credits, 0 ops, and 0 rank/);
  assert.match(trustGate.answer, /Higgsfield MCP/);
  assert.ok(publishGate);
  assert.equal(publishGate.command, "npx vibetrack upload");
  assert.match(publishGate.invariant, /tier labels visible/);
});
