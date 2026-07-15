import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildDeviceApprovalChamber,
  buildDeviceApprovalRunway,
  buildDeviceAuthBridge,
  buildDeviceAuthControlRoom,
  buildDeviceAuthLaunchTheatre,
  deviceAuthStatusLabel,
  splitDeviceCode,
} from "../device-auth.ts";

test("device auth status labels match the CLI approval state", () => {
  assert.equal(deviceAuthStatusLabel("idle"), "waiting");
  assert.equal(deviceAuthStatusLabel("working"), "approving");
  assert.equal(deviceAuthStatusLabel("done"), "approved");
  assert.equal(deviceAuthStatusLabel("error"), "needs attention");
});

test("device code chunks are compact and normalized for the auth UI", () => {
  assert.deepEqual(splitDeviceCode("ab-12-cd"), ["AB1", "2CD"]);
  assert.deepEqual(splitDeviceCode(""), ["NO", "CODE"]);
});

test("device auth bridge separates identity approval from local usage records", () => {
  const bridge = buildDeviceAuthBridge("done", "ABC123");

  assert.deepEqual(bridge.map((step) => step.id), ["terminal", "browser", "token", "ledger"]);
  assert.deepEqual(bridge.map((step) => step.status), ["match-code", "session", "attested", "local-first"]);
  assert.equal(bridge[0].call, "ABC 123");
  assert.equal(bridge[1].call, "APPROVED");
  assert.equal(bridge[2].call, "ISSUED");
  assert.match(bridge[1].detail, /identity only/);
  assert.match(bridge[1].detail, /not usage totals/);
  assert.match(bridge[3].detail, /explicit upload command/);
});

test("device auth control room maps approval to zero usage movement", () => {
  const room = buildDeviceAuthControlRoom("done", "ab-12-cd");

  assert.equal(room.headline, "Auth control room: identity approved");
  assert.equal(room.codeLabel, "AB1 2CD");
  assert.deepEqual(room.counters, {
    providerCalls: 0,
    promptReads: 0,
    outputReads: 0,
    usageUploads: 0,
    ledgerWrites: 0,
  });
  assert.deepEqual(room.signals.map((signal) => signal.id), [
    "terminal-code",
    "browser-session",
    "token-poll",
    "local-ledger",
    "dry-run",
    "public-relay",
  ]);
  assert.deepEqual(room.totals, {
    identity: 2,
    not_usage: 1,
    local_only: 1,
    privacy: 1,
    publish: 1,
  });
  assert.equal(room.terminalLines.every((line) => line.length === 62), true);
  assert.match(room.terminalLines.join("\n"), /CLI-AUTH-CONTROL/);
  assert.match(room.terminalLines.join("\n"), /approval is not usage/);
  assert.equal(room.signals.every((signal) => signal.terminal.length === 4), true);
  assert.equal(room.signals.every((signal) => signal.terminal.every((line) => line.length === 62)), true);
  assert.equal(room.signals.every((signal) => signal.meter >= 34 && signal.meter <= 100), true);
  assert.equal(room.signals.every((signal) => signal.from.startsWith("#") && signal.to.startsWith("#")), true);

  const token = room.signals.find((signal) => signal.id === "token-poll");
  assert.ok(token);
  assert.equal(token.impact, "not_usage");
  assert.match(token.guardrail, /uploads zero usage/);

  const dryRun = room.signals.find((signal) => signal.id === "dry-run");
  assert.ok(dryRun);
  assert.equal(dryRun.command, "npx vibetrack upload --dry-run");
  assert.match(dryRun.guardrail, /sends nothing/);

  const publish = room.signals.find((signal) => signal.id === "public-relay");
  assert.ok(publish);
  assert.equal(publish.value, "Vibers Unite");
  assert.match(publish.target, /c0vibe\.app/);

  assert.ok(room.invariants.some((invariant) => /zero AI providers/.test(invariant)));
  assert.ok(room.invariants.some((invariant) => /uploads zero usage/.test(invariant)));
});

test("device approval chamber mirrors the live auth state without moving usage", () => {
  const chamber = buildDeviceApprovalChamber("done", "ab-12-cd");

  assert.equal(chamber.headline, "Approval chamber: return to terminal");
  assert.equal(chamber.codeLabel, "AB1 2CD");
  assert.deepEqual(chamber.counters, {
    providerCalls: 0,
    promptReads: 0,
    outputReads: 0,
    hiddenUploads: 0,
    usageUploads: 0,
    ledgerWrites: 0,
  });
  assert.deepEqual(chamber.stages.map((stage) => stage.id), [
    "code-lock",
    "session-check",
    "token-slot",
    "terminal-return",
  ]);
  assert.deepEqual(chamber.stages.map((stage) => stage.impact), [
    "identity",
    "identity",
    "not_usage",
    "local_only",
  ]);
  assert.deepEqual(chamber.totals, {
    identity: 2,
    not_usage: 1,
    local_only: 1,
    privacy: 0,
    publish: 0,
  });
  assert.equal(chamber.terminalLines.every((line) => line.length === 64), true);
  assert.match(chamber.terminalLines.join("\n"), /APPROVAL-CHAMBER/);
  assert.match(chamber.terminalLines.join("\n"), /ZERO-USAGE-MOVE/);
  assert.match(chamber.terminalLines.join("\n"), /hiddenUploads 0/);
  assert.match(chamber.terminalLines.join("\n"), /usageUploads 0/);
  assert.match(chamber.terminalLines.join("\n"), /ledgerWrites 0/);
  assert.match(chamber.terminalLines.join("\n"), /Vibers Unite/);
  assert.match(chamber.terminalLines.join("\n"), /c0vibe\.app/);
  assert.equal(chamber.stages.every((stage) => stage.frames.length === 3), true);
  assert.equal(chamber.stages.every((stage) => stage.transcript.length === 3), true);
  assert.equal(chamber.stages.every((stage) => stage.meter >= 34 && stage.meter <= 100), true);
  assert.equal(chamber.stages.every((stage) => stage.from.startsWith("#") && stage.to.startsWith("#")), true);

  const token = chamber.stages.find((stage) => stage.id === "token-slot");
  assert.ok(token);
  assert.equal(token.impact, "not_usage");
  assert.match(token.guardrail, /uploads zero usage/);

  const terminal = chamber.stages.find((stage) => stage.id === "terminal-return");
  assert.ok(terminal);
  assert.equal(terminal.impact, "local_only");
  assert.match(terminal.note, /writes the local ledger first/);
});

test("device auth launch theatre carries terminal-to-GUI surprises without collecting usage", () => {
  const theatre = buildDeviceAuthLaunchTheatre("done", "ABC123");

  assert.equal(theatre.headline, "Terminal to GUI launch");
  assert.deepEqual(theatre.steps.map((step) => step.id), [
    "terminal-match",
    "browser-session",
    "token-issue",
    "local-ledger",
    "c0vibe-relay",
  ]);
  assert.deepEqual(theatre.totals, {
    identity: 2,
    not_usage: 1,
    local_only: 1,
    publish: 1,
  });
  assert.equal(theatre.terminalLines.every((line) => line.length === 64), true);
  assert.match(theatre.terminalLines.join("\n"), /C0VIBE\.APP/);
  assert.match(theatre.terminalLines.join("\n"), /Vibers Unite/);
  assert.equal(theatre.steps.every((step) => step.frames.length === 3), true);
  assert.equal(theatre.steps.every((step) => step.transcript.length === 3), true);
  assert.equal(theatre.steps.every((step) => step.meter >= 36 && step.meter <= 100), true);

  const session = theatre.steps.find((step) => step.id === "browser-session");
  assert.ok(session);
  assert.equal(session.impact, "not_usage");
  assert.match(session.guardrail, /NOT USAGE/);

  const local = theatre.steps.find((step) => step.id === "local-ledger");
  assert.ok(local);
  assert.equal(local.impact, "local_only");
  assert.match(local.note, /stay on disk/);

  const relay = theatre.steps.find((step) => step.id === "c0vibe-relay");
  assert.ok(relay);
  assert.equal(relay.impact, "publish");
  assert.match(relay.frames.join("\n"), /C0VIBE\.APP/);
  assert.match(relay.transcript.join("\n"), /Vibers Unite/);
});

test("device approval runway proves approval is identity-only and zero-upload", () => {
  const runway = buildDeviceApprovalRunway("done", "ab-12-cd");

  assert.equal(runway.headline, "Identity approved. Collection is still terminal-gated.");
  assert.equal(runway.codeLabel, "AB1 2CD");
  assert.deepEqual(runway.counters, {
    providerCalls: 0,
    hiddenUploads: 0,
    usageUploads: 0,
    ledgerWrites: 0,
  });
  assert.deepEqual(runway.rails.map((rail) => rail.id), [
    "code-mirror",
    "session-proof",
    "zero-upload",
    "privacy-dry-run",
    "local-scan",
    "public-relay",
  ]);
  assert.deepEqual(runway.flightTape.map((step) => step.id), [
    "terminal-code",
    "browser-session",
    "zero-movement",
    "local-ledger",
    "public-relay",
  ]);
  assert.deepEqual(runway.flightTape.map((step) => step.impact), ["identity", "identity", "not_usage", "local_only", "publish"]);
  assert.deepEqual(runway.totals, {
    identity: 2,
    not_usage: 1,
    privacy: 1,
    local_only: 1,
    publish: 1,
  });
  assert.equal(runway.terminalLines.every((line) => line.length === 64), true);
  assert.match(runway.terminalLines.join("\n"), /provider calls 0/);
  assert.match(runway.terminalLines.join("\n"), /Higgsfield prism/);
  assert.match(runway.terminalLines.join("\n"), /Codex cube/);
  assert.match(runway.terminalLines.join("\n"), /Vibers Unite/);
  assert.equal(runway.rails.every((rail) => rail.frames.length === 3), true);
  assert.equal(runway.rails.every((rail) => rail.transcript.length === 3), true);
  assert.equal(runway.rails.every((rail) => rail.meter >= 38 && rail.meter <= 100), true);
  assert.equal(runway.flightTape.every((step) => step.frames.length === 4), true);
  assert.equal(runway.flightTape.every((step) => step.terminalLine.length === 64), true);
  assert.equal(runway.flightTape.every((step) => step.from.startsWith("#") && step.to.startsWith("#")), true);
  assert.equal(runway.flightTape.every((step) => step.meter >= 38 && step.meter <= 100), true);
  assert.equal(runway.surprises.length, 3);
  assert.equal(runway.surprises.every((surprise) => surprise.frames.length === 3), true);

  const zeroTape = runway.flightTape.find((step) => step.id === "zero-movement");
  assert.ok(zeroTape);
  assert.equal(zeroTape.impact, "not_usage");
  assert.match(zeroTape.guardrail, /No provider calls or uploads/);
  assert.match(zeroTape.terminalLine, /NOT USAGE/);

  const localTape = runway.flightTape.find((step) => step.id === "local-ledger");
  assert.ok(localTape);
  assert.match(localTape.guardrail, /Local until explicit command/);

  const relayTape = runway.flightTape.find((step) => step.id === "public-relay");
  assert.ok(relayTape);
  assert.match(relayTape.frames.join("\n"), /UNITE/);
  assert.match(relayTape.readout, /Vibers Unite/);

  const zero = runway.rails.find((rail) => rail.id === "zero-upload");
  assert.ok(zero);
  assert.equal(zero.impact, "not_usage");
  assert.match(zero.note, /does not call AI providers/);
  assert.match(zero.transcript.join("\n"), /usage uploads zero/);

  const publish = runway.rails.find((rail) => rail.id === "public-relay");
  assert.ok(publish);
  assert.equal(publish.impact, "publish");
  assert.match(publish.guardrail, /Publish command required/);
});
