import { test } from "node:test";
import assert from "node:assert/strict";
import { buildHomeScanRoom } from "../home-scan-room.ts";

test("home scan room turns registry data into branded not-usage theatre", () => {
  const room = buildHomeScanRoom();

  assert.equal(room.headline, "BRANDED SCAN ROOM");
  assert.deepEqual(room.scenes.map((scene) => scene.id), [
    "higgsfield-field",
    "codex-orbit",
    "local-lab-array",
    "c0vibe-relay",
  ]);
  assert.equal(room.scenes.every((scene) => scene.foot.includes("not usage")), true);
  assert.equal(room.scenes.every((scene) => scene.primaryMark.length >= 2), true);
  assert.equal(room.scenes.every((scene) => scene.marks.length === scene.providerIds.length), true);
  assert.match(room.terminalLines.join("\n"), /VIBERS-UNITE/);
  assert.match(room.terminalLines.join("\n"), /not_usage/);
  assert.ok(room.metrics.some((metric) => metric.label === "local runners"));
  assert.ok(room.metrics.some((metric) => metric.note.includes("not usage")));
});

test("home scan room keeps provider marks styled for the GUI", () => {
  const room = buildHomeScanRoom();
  const higgsfield = room.scenes.find((scene) => scene.id === "higgsfield-field");
  const relay = room.scenes.find((scene) => scene.id === "c0vibe-relay");

  assert.ok(higgsfield);
  assert.equal(higgsfield.primaryMark, "HF");
  assert.match(higgsfield.brandFrom, /^#/);
  assert.match(higgsfield.brandTo, /^#/);
  assert.ok(higgsfield.marks.some((mark) => mark.id === "higgsfield" && mark.mark === "HF"));

  assert.ok(relay);
  assert.equal(relay.foot.includes("Vibers Unite"), true);
  assert.match(relay.ascii.join("\n"), /C0VIBE\.APP/);
});
