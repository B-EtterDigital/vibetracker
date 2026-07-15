import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDeviceCommandBridge } from "../device-command-bridge.ts";

test("device command bridge renders the valid first-run command path", () => {
  const bridge = buildDeviceCommandBridge("done", "AB-12-CD");

  assert.equal(bridge.headline, "Approved. Run the local-first scan path.");
  assert.equal(bridge.codeLabel, "AB1 2CD");
  assert.deepEqual(bridge.commands.map((command) => command.id), ["login", "doctor", "sync", "audit", "dry-run", "publish"]);
  assert.deepEqual(bridge.commands.map((command) => command.command), [
    "npx vibetrack login",
    "npx vibetrack doctor",
    "npx vibetrack sync",
    "npx vibetrack audit",
    "npx vibetrack upload --dry-run",
    "npx vibetrack upload",
  ]);
  assert.equal(bridge.commands.some((command) => command.command === "npx vibetrack sync --dry-run"), false);
  assert.deepEqual(bridge.totals, { identity: 1, not_usage: 1, local_only: 1, privacy: 2, publish: 1 });
  assert.equal(bridge.terminalLines.every((line) => line.length === 64), true);
  assert.match(bridge.terminalLines.join("\n"), /NO-AUTO-UPLOAD/);
  assert.match(bridge.terminalLines.join("\n"), /Vibers Unite/);
});

test("device command bridge keeps identity approval separate from usage upload", () => {
  const bridge = buildDeviceCommandBridge("done", "ABC123");
  const byId = new Map(bridge.commands.map((command) => [command.id, command]));

  assert.equal(byId.get("login")?.impact, "identity");
  assert.equal(byId.get("login")?.status, "approved");
  assert.equal(byId.get("doctor")?.impact, "not_usage");
  assert.match(byId.get("doctor")?.note ?? "", /without provider calls, uploads, or secret reads/);
  assert.equal(byId.get("sync")?.impact, "local_only");
  assert.match(byId.get("sync")?.note ?? "", /nothing leaves the machine/);
  assert.equal(byId.get("dry-run")?.impact, "privacy");
  assert.match(byId.get("dry-run")?.note ?? "", /before anything is sent/);
  assert.equal(byId.get("publish")?.impact, "publish");
  assert.equal(byId.get("publish")?.status, "manual");
  assert.match(byId.get("publish")?.note ?? "", /Only this command can send/);
});

test("device command bridge has a safe waiting state", () => {
  const bridge = buildDeviceCommandBridge("idle", "");
  const byId = new Map(bridge.commands.map((command) => [command.id, command]));

  assert.equal(bridge.headline, "First-run command bridge");
  assert.equal(bridge.codeLabel, "NO CODE");
  assert.equal(byId.get("login")?.status, "waiting");
  assert.equal(byId.get("sync")?.status, "after login");
  assert.equal(byId.get("dry-run")?.status, "needs token");
  assert.equal(byId.get("publish")?.status, "locked");
  assert.match(bridge.terminalLines.join("\n"), /code NO CODE/);
  assert.equal(bridge.commands.every((command) => command.meter >= 34 && command.meter <= 100), true);
});
