import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildCollectionBlackBox,
  buildCollectionCommandRunway,
  buildCollectionEncoreRecap,
  buildCollectionEventTape,
  buildCollectionFlightRecorder,
  buildCollectionHeroScanBridge,
  buildCollectionReplayDeck,
  buildCollectionSurpriseCascade,
  buildCollectionSignalStack,
  buildCollectionSurpriseDirector,
  buildCollectionSurpriseRun,
  buildCollectionSurpriseSequencer,
  buildCollectionTransmissionRibbon,
} from "../collection-surprises.ts";

test("collection surprise run sequences scanning and data collection beats", () => {
  const run = buildCollectionSurpriseRun();

  assert.equal(run.headline, "COLLECTION SURPRISE RUN");
  assert.deepEqual(run.moments.map((moment) => moment.id), [
    "higgsfield-mcp-prism",
    "codex-builder-trace",
    "local-lab-sonar",
    "creator-studio-meter",
    "regional-provider-pass",
    "c0vibe-review-relay",
  ]);
  assert.deepEqual(run.moments.map((moment) => moment.stage), ["01", "02", "03", "04", "05", "06"]);
  assert.deepEqual(run.choreography.map((step) => step.id), ["wake", "auth", "fetch", "validate", "review"]);
  assert.deepEqual(run.itinerary.map((item) => item.id), ["queue", "scan-beat", "checkpoint", "relay"]);
  assert.deepEqual(run.itinerary.map((item) => item.stage), ["01", "02", "03", "04"]);
  assert.deepEqual(run.encores.map((encore) => encore.id), [
    "higgsfield-logo-turn",
    "codex-cube-flip",
    "local-sonar-bloom",
    "c0vibe-unite-flash",
  ]);
  assert.deepEqual(run.encores.map((encore) => encore.gate), ["queue", "scan-beat", "checkpoint", "relay"]);
  assert.match(run.terminalLines.join("\n"), /SURPRISE-QUEUE/);
  assert.match(run.terminalLines.join("\n"), /choreography rail/);
  assert.match(run.terminalLines.join("\n"), /surprise itinerary/);
  assert.match(run.terminalLines.join("\n"), /surprise beats repeat/);
  assert.match(run.terminalLines.join("\n"), /encore reel/);
  assert.match(run.terminalLines.join("\n"), /branded encore/);
  assert.match(run.terminalLines.join("\n"), /Vibers Unite/);
});

test("collection surprise run keeps usage, trust, local, and publish rails explicit", () => {
  const run = buildCollectionSurpriseRun();
  const trust = run.moments.find((moment) => moment.id === "codex-builder-trace");
  const local = run.moments.find((moment) => moment.id === "local-lab-sonar");
  const relay = run.moments.find((moment) => moment.id === "c0vibe-review-relay");
  const validate = run.choreography.find((step) => step.id === "validate");
  const review = run.choreography.find((step) => step.id === "review");
  const queue = run.itinerary.find((item) => item.id === "queue");
  const scan = run.itinerary.find((item) => item.id === "scan-beat");
  const checkpoint = run.itinerary.find((item) => item.id === "checkpoint");
  const itineraryRelay = run.itinerary.find((item) => item.id === "relay");
  const higgsfieldEncore = run.encores.find((encore) => encore.id === "higgsfield-logo-turn");
  const codexEncore = run.encores.find((encore) => encore.id === "codex-cube-flip");
  const localEncore = run.encores.find((encore) => encore.id === "local-sonar-bloom");
  const c0vibeEncore = run.encores.find((encore) => encore.id === "c0vibe-unite-flash");

  assert.ok(run.moments.some((moment) => moment.providerIds.includes("higgsfield")));
  assert.ok(run.choreography.some((step) => step.marks.some((mark) => mark.id === "higgsfield")));
  assert.ok(trust);
  assert.equal(trust.impact, "trust");
  assert.match(trust.guardrail, /never changes usage totals/);
  assert.equal(trust.status, "not usage");

  assert.ok(local);
  assert.equal(local.impact, "local_only");
  assert.match(local.guardrail, /Local-only/);

  assert.ok(relay);
  assert.equal(relay.impact, "publish");
  assert.match(relay.note, /c0vibe\.app/);

  assert.equal(validate?.tone, "trust");
  assert.match(validate?.guardrail ?? "", /never alter spend totals/);
  assert.equal(review?.tone, "publish");
  assert.match(review?.detail ?? "", /c0vibe\.app/);

  assert.ok(queue);
  assert.equal(queue.impact, "privacy");
  assert.match(queue.cue, /Higgsfield prism and Codex cube/);
  assert.ok(queue.marks.some((mark) => mark.id === "higgsfield" && mark.mark === "HF"));
  assert.ok(queue.marks.some((mark) => mark.id === "codex-cli" && mark.mark === "CX"));

  assert.ok(scan);
  assert.match(scan.trigger, /before each provider fetch/);
  assert.match(scan.replay, /global rails/);

  assert.ok(checkpoint);
  assert.equal(checkpoint.impact, "trust");
  assert.match(checkpoint.cue, /LOCK, CLEAR, or HOLD/);

  assert.ok(itineraryRelay);
  assert.equal(itineraryRelay.impact, "publish");
  assert.match(itineraryRelay.cue, /Vibers Unite and c0vibe\.app/);

  assert.ok(higgsfieldEncore);
  assert.equal(higgsfieldEncore.impact, "usage");
  assert.match(higgsfieldEncore.caption, /validated records/);

  assert.ok(codexEncore);
  assert.equal(codexEncore.impact, "trust");
  assert.equal(codexEncore.status, "not usage");
  assert.match(codexEncore.guardrail, /NOT USAGE/);

  assert.ok(localEncore);
  assert.equal(localEncore.impact, "local_only");
  assert.match(localEncore.guardrail, /No upload/);

  assert.ok(c0vibeEncore);
  assert.equal(c0vibeEncore.impact, "publish");
  assert.match(c0vibeEncore.caption, /Vibers Unite/);
  assert.match(c0vibeEncore.trigger, /dry-run review/);
});

test("collection surprise run is styled with provider marks and compact frames", () => {
  const run = buildCollectionSurpriseRun();

  assert.ok(run.credits.some((credit) => credit.includes("cli-spinners")));
  assert.ok(run.credits.some((credit) => credit.includes("drawille")));
  assert.ok(run.credits.some((credit) => credit.includes("Encore reel")));
  assert.ok(run.credits.some((credit) => credit.includes("checkpoint encores")));
  assert.equal(run.choreography.every((step) => step.meter >= 0 && step.meter <= 100), true);
  assert.equal(run.choreography.every((step) => step.marks.length > 0), true);
  assert.equal(run.choreography.every((step) => step.command.includes(":") || step.command.includes("(")), true);
  assert.equal(run.itinerary.every((item) => item.meter >= 0 && item.meter <= 100), true);
  assert.equal(run.itinerary.every((item) => item.marks.length > 0), true);
  assert.equal(run.itinerary.every((item) => item.cue.length > 0 && item.replay.length > 0), true);
  assert.equal(run.encores.every((encore) => encore.meter >= 0 && encore.meter <= 100), true);
  assert.equal(run.encores.every((encore) => encore.delayMs >= 0), true);
  assert.equal(run.encores.every((encore) => encore.marks.length === encore.providerIds.length), true);
  assert.equal(run.encores.every((encore) => encore.frames.length === 4), true);
  assert.equal(run.encores.every((encore) => encore.frames.every((frame) => frame.split("\n").length === 3)), true);
  assert.equal(run.encores.every((encore) => encore.frames.every((frame) => frame.split("\n").every((line) => line.length <= 7))), true);
  assert.equal(run.encores.every((encore) => encore.source.length > 0), true);
  assert.equal(run.moments.every((moment) => moment.meter >= 0 && moment.meter <= 100), true);
  assert.equal(run.moments.every((moment) => moment.marks.length === moment.providerIds.length), true);
  assert.equal(run.moments.every((moment) => moment.beats.length === 5), true);
  assert.equal(run.moments.every((moment) => moment.beats.some((beat) => beat.surprise)), true);
  assert.equal(run.moments.every((moment) => moment.marks.every((mark) => mark.from.startsWith("#") && mark.to.startsWith("#"))), true);
  assert.equal(run.moments.flatMap((moment) => moment.motion).every((line) => line.length <= 6), true);
  assert.equal(run.terminalLines.every((line) => line.length <= 56), true);
});

test("collection surprise run gives several authored surprises across the scan lifecycle", () => {
  const run = buildCollectionSurpriseRun();
  const surpriseBeatCount = run.moments
    .flatMap((moment) => moment.beats)
    .filter((beat) => beat.surprise).length;

  assert.equal(run.itinerary.length, 4);
  assert.equal(run.encores.length, 4);
  assert.ok(surpriseBeatCount >= 12);
  assert.deepEqual(
    run.encores.map((encore) => [encore.id, encore.gate, encore.trigger.includes("after") || encore.trigger.includes("while") || encore.trigger.includes("only")]),
    [
      ["higgsfield-logo-turn", "queue", true],
      ["codex-cube-flip", "scan-beat", true],
      ["local-sonar-bloom", "checkpoint", true],
      ["c0vibe-unite-flash", "relay", true],
    ],
  );
  assert.match(run.encores[0]?.frames.join("\n") ?? "", /HF/);
  assert.match(run.encores[1]?.frames.join("\n") ?? "", /CX/);
  assert.match(run.encores[2]?.frames.join("\n") ?? "", /127/);
  assert.match(run.encores[3]?.frames.join("\n") ?? "", /VIBERS/);
});

test("collection transmission ribbon pulls the scan surprises into the first screen", () => {
  const run = buildCollectionSurpriseRun();
  const ribbon = buildCollectionTransmissionRibbon(run);

  assert.equal(ribbon.headline, "SURPRISE TRANSMISSION RIBBON");
  assert.match(ribbon.subline, /first-screen scan bridge/);
  assert.match(ribbon.terminalLines.join("\n"), /FIRST-SCREEN/);
  assert.match(ribbon.terminalLines.join("\n"), /VIBERS-UNITE/);
  assert.match(ribbon.terminalLines.join("\n"), /NOT USAGE/);
  assert.deepEqual(ribbon.steps.map((step) => step.id), run.encores.map((encore) => encore.id));
  assert.deepEqual(ribbon.steps.map((step) => step.gate), ["queue", "scan-beat", "checkpoint", "relay"]);
  assert.equal(ribbon.steps.every((step) => step.frames.length === 4), true);
  assert.equal(ribbon.steps.every((step) => step.marks.length > 0), true);
  assert.equal(ribbon.steps.every((step) => step.meter >= 0 && step.meter <= 100), true);
  assert.equal(ribbon.steps.every((step) => step.guardrail.length > 0), true);
  assert.equal(ribbon.steps.find((step) => step.id === "codex-cube-flip")?.status, "not usage");
  assert.match(ribbon.steps.find((step) => step.id === "c0vibe-unite-flash")?.caption ?? "", /Vibers Unite/);
});

test("collection hero scan bridge makes the first viewport a labelled surprise console", () => {
  const run = buildCollectionSurpriseRun();
  const bridge = buildCollectionHeroScanBridge(run);

  assert.equal(bridge.headline, "HERO SCAN BRIDGE");
  assert.match(bridge.subline, /first viewport/);
  assert.match(bridge.motto, /Vibers Unite/);
  assert.match(bridge.motto, /C0vibe\.app/);
  assert.match(bridge.terminalLines.join("\n"), /HERO-SCAN-BRIDGE/);
  assert.match(bridge.terminalLines.join("\n"), /usageWrites 0/);
  assert.match(bridge.terminalLines.join("\n"), /not_usage 2/);
  assert.match(bridge.terminalLines.join("\n"), /visual only/);
  assert.equal(bridge.terminalLines.every((line) => line.length === 56), true);
  assert.deepEqual(bridge.stages.map((stage) => stage.id), run.encores.map((encore) => encore.id));
  assert.deepEqual(bridge.stages.map((stage) => stage.gate), ["queue", "scan-beat", "checkpoint", "relay"]);
  assert.deepEqual(bridge.stages.map((stage) => stage.railLabel), ["USAGE", "NOT USAGE", "NOT USAGE", "PUBLISH"]);
  assert.equal(bridge.stages.every((stage) => stage.frames.length === 4), true);
  assert.equal(bridge.stages.every((stage) => stage.marks.length > 0), true);
  assert.equal(bridge.stages.every((stage) => stage.terminalLines.length === 5), true);
  assert.equal(bridge.stages.every((stage) => stage.terminalLines.every((line) => line.length === 56)), true);
  assert.match(bridge.stages.find((stage) => stage.id === "higgsfield-logo-turn")?.frames.join("\n") ?? "", /HF/);
  assert.match(bridge.stages.find((stage) => stage.id === "codex-cube-flip")?.terminalLines.join("\n") ?? "", /NOT USAGE/);
  assert.match(bridge.stages.find((stage) => stage.id === "local-sonar-bloom")?.guardrail ?? "", /No upload/);
  assert.match(bridge.stages.find((stage) => stage.id === "c0vibe-unite-flash")?.cue ?? "", /Vibers Unite/);
  assert.deepEqual(bridge.totals, {
    stages: 4,
    surprises: 4,
    usage: 1,
    notUsage: 2,
    publish: 1,
    visualOnly: 4,
    usageWrites: 0,
  });
});

test("collection command runway turns scan collection into a visual-only cockpit", () => {
  const run = buildCollectionSurpriseRun();
  const runway = buildCollectionCommandRunway(run);

  assert.equal(runway.headline, "LIVE SCAN COMMAND RUNWAY");
  assert.match(runway.subline, /first-run cockpit/);
  assert.match(runway.terminalLines.join("\n"), /SCAN-COMMAND-RUNWAY/);
  assert.match(runway.terminalLines.join("\n"), /visualOnly=true/);
  assert.match(runway.terminalLines.join("\n"), /usageWrites 0/);
  assert.match(runway.terminalLines.join("\n"), /providerCalls 0/);
  assert.match(runway.terminalLines.join("\n"), /Vibers Unite/);
  assert.equal(runway.terminalLines.every((line) => line.length === 56), true);
  assert.deepEqual(runway.steps.map((step) => step.id), [
    "wake-auth-preview",
    "higgsfield-mcp-prism",
    "codex-builder-trace",
    "local-lab-sonar",
    "creator-studio-meter",
    "regional-provider-pass",
    "c0vibe-review-relay",
  ]);
  assert.deepEqual(runway.steps.map((step) => step.railLabel), [
    "PRIVACY",
    "USAGE",
    "NOT USAGE",
    "NOT USAGE",
    "USAGE",
    "USAGE",
    "PUBLISH",
  ]);
  assert.deepEqual(runway.totals, {
    steps: 7,
    usage: 3,
    notUsage: 2,
    privacy: 1,
    publish: 1,
    visualOnly: 7,
    usageWrites: 0,
  });
  assert.equal(runway.steps.every((step) => step.visualOnly), true);
  assert.equal(runway.steps.every((step) => step.usageWrites === false), true);
  assert.equal(runway.steps.every((step) => step.frames.length === 3), true);
  assert.equal(runway.steps.every((step) => step.transcript.length === 4), true);
  assert.equal(runway.steps.every((step) => step.meter >= 0 && step.meter <= 100), true);
  assert.equal(runway.steps.every((step) => step.from.startsWith("#") && step.to.startsWith("#")), true);
  assert.match(runway.steps.find((step) => step.id === "codex-builder-trace")?.transcript.join("\n") ?? "", /NOT USAGE/);
  assert.match(runway.steps.find((step) => step.id === "local-lab-sonar")?.guardrail ?? "", /Local-only/);
  assert.match(runway.steps.find((step) => step.id === "c0vibe-review-relay")?.note ?? "", /c0vibe\.app/);
});

test("collection surprise sequencer turns CLI signature reveals into a GUI timing rail", () => {
  const run = buildCollectionSurpriseRun();
  const sequencer = buildCollectionSurpriseSequencer(run);

  assert.equal(sequencer.headline, "SIGNATURE SURPRISE SEQUENCER");
  assert.match(sequencer.subline, /authored reveals/);
  assert.match(sequencer.terminalLines.join("\n"), /SIGNATURE-SEQUENCER/);
  assert.match(sequencer.terminalLines.join("\n"), /blink -> turn -> sparkle -> unite/);
  assert.match(sequencer.terminalLines.join("\n"), /NOT USAGE/);
  assert.deepEqual(sequencer.steps.map((step) => step.id), run.encores.map((encore) => encore.id));
  assert.equal(sequencer.steps.every((step) => step.beats.join(">") === "blink>turn>sparkle>unite"), true);
  assert.equal(sequencer.steps.every((step) => step.terminalLines.every((line) => line.length === 56)), true);
  assert.equal(sequencer.steps.every((step) => step.meter >= 0 && step.meter <= 100), true);
  assert.match(sequencer.steps.find((step) => step.id === "higgsfield-logo-turn")?.terminalLines.join("\n") ?? "", /HF/);
  assert.match(sequencer.steps.find((step) => step.id === "codex-cube-flip")?.terminalLines.join("\n") ?? "", /NOT USAGE/);
  assert.match(sequencer.steps.find((step) => step.id === "local-sonar-bloom")?.terminalLines.join("\n") ?? "", /NOT USAGE/);
  assert.match(sequencer.steps.find((step) => step.id === "c0vibe-unite-flash")?.terminalLines.join("\n") ?? "", /PUBLISH/);
  assert.equal(sequencer.steps.every((step) => step.guardrail.length > 0), true);
});

test("collection replay deck carries CLI live-turn cadence into the GUI", () => {
  const run = buildCollectionSurpriseRun();
  const replay = buildCollectionReplayDeck(run);

  assert.equal(replay.headline, "LIVE SCAN REPLAY RECORDER");
  assert.match(replay.subline, /same live-turn cadence as the terminal/);
  assert.match(replay.terminalLines.join("\n"), /GUI-LIVE-TURN/);
  assert.match(replay.terminalLines.join("\n"), /NOT USAGE/);
  assert.deepEqual(replay.lanes.map((lane) => lane.id), run.encores.map((encore) => encore.id));
  assert.deepEqual(replay.lanes.map((lane) => lane.gate), ["queue", "scan-beat", "checkpoint", "relay"]);
  assert.equal(replay.lanes.every((lane) => lane.frames.length === 4), true);
  assert.equal(replay.lanes.every((lane) => lane.terminalLines.some((line) => /LIVE TURN 01\/04/.test(line))), true);
  assert.equal(replay.lanes.every((lane) => lane.terminalLines.every((line) => line.length === 56)), true);
  assert.equal(replay.lanes.every((lane) => lane.meter >= 0 && lane.meter <= 100), true);
  assert.match(replay.lanes.find((lane) => lane.id === "higgsfield-logo-turn")?.terminalLines.join("\n") ?? "", /HF/);
  assert.match(replay.lanes.find((lane) => lane.id === "codex-cube-flip")?.terminalLines.join("\n") ?? "", /NOT USAGE/);
  assert.match(replay.lanes.find((lane) => lane.id === "local-sonar-bloom")?.terminalLines.join("\n") ?? "", /NOT USAGE/);
  assert.match(replay.lanes.find((lane) => lane.id === "c0vibe-unite-flash")?.terminalLines.join("\n") ?? "", /PUBLISH/);
});

test("collection event tape mirrors the flight recorder as a compact visual-only log", () => {
  const run = buildCollectionSurpriseRun();
  const recorder = buildCollectionFlightRecorder(run);
  const tape = buildCollectionEventTape(run);

  assert.equal(tape.headline, "LIVE EVENT TAPE");
  assert.match(tape.subline, /visual-only scan events/);
  assert.match(tape.terminalLines.join("\n"), /COLLECTION-EVENT-TAPE/);
  assert.match(tape.terminalLines.join("\n"), /NO-HIDDEN-UPLOAD/);
  assert.match(tape.terminalLines.join("\n"), /Vibers Unite/);
  assert.deepEqual(tape.totals, {
    rows: recorder.events.length,
    visualOnly: recorder.events.length,
    usageWrites: 0,
    hiddenUploads: 0,
    promptExports: 0,
    outputExports: 0,
  });
  assert.deepEqual(tape.rows.map((row) => row.id), recorder.events.map((event) => event.id));
  assert.deepEqual(tape.rows.slice(0, 4).map((row) => row.phase), ["queue", "scan", "checkpoint", "recap"]);
  assert.equal(tape.rows.every((row) => row.visualOnly), true);
  assert.equal(tape.rows.every((row) => row.usageWrites === false), true);
  assert.equal(tape.rows.every((row) => /^[0-9A-F]{8}$/.test(row.checksum)), true);
  assert.equal(tape.rows.every((row) => row.line.includes(row.checksum)), true);
  assert.equal(tape.rows.every((row) => row.from.startsWith("#") && row.to.startsWith("#")), true);
  assert.match(tape.rows.find((row) => row.mark === "CX")?.line ?? "", /NOT USAGE/);
  assert.match(tape.rows.find((row) => row.mark === "C0")?.line ?? "", /PUBLISH/);
});

test("collection black box records replayable scan telemetry without storing prompts", () => {
  const run = buildCollectionSurpriseRun();
  const blackBox = buildCollectionBlackBox(run);

  assert.equal(blackBox.headline, "SCANNER BLACK BOX");
  assert.match(blackBox.subline, /replayable GUI flight recorder/);
  assert.match(blackBox.terminalLines.join("\n"), /SCANNER-BLACK-BOX/);
  assert.match(blackBox.terminalLines.join("\n"), /NO PROMPTS \/ NO OUTPUTS \/ NO SECRET VALUES RECORDED/);
  assert.match(blackBox.terminalLines.join("\n"), /Vibers Unite/);
  assert.deepEqual(blackBox.cells.map((cell) => cell.id), ["wake", "auth", "fetch", "validate", "review"]);
  assert.deepEqual(blackBox.cells.map((cell) => cell.stage), ["01", "02", "03", "04", "05"]);
  assert.equal(blackBox.cells.every((cell) => cell.frames.length === 4), true);
  assert.equal(blackBox.cells.every((cell) => cell.transcript.length === 5), true);
  assert.equal(blackBox.cells.every((cell) => cell.transcript.every((line) => line.length === 56)), true);
  assert.equal(blackBox.cells.every((cell) => /^[0-9A-F]{8}$/.test(cell.checksum)), true);
  assert.equal(new Set(blackBox.cells.map((cell) => cell.checksum)).size, blackBox.cells.length);
  assert.equal(blackBox.cells.every((cell) => cell.marks.length > 0), true);
  assert.equal(blackBox.cells.every((cell) => cell.meter >= 0 && cell.meter <= 100), true);
  assert.match(blackBox.cells.find((cell) => cell.id === "validate")?.transcript.join("\n") ?? "", /NOT USAGE/);
  assert.match(blackBox.cells.find((cell) => cell.id === "review")?.transcript.join("\n") ?? "", /PUBLISH/);
  assert.match(blackBox.cells.find((cell) => cell.id === "auth")?.guardrail ?? "", /Secrets stay local/);
});

test("collection encore recap makes the GUI scan finish feel replayable without new usage", () => {
  const run = buildCollectionSurpriseRun();
  const recap = buildCollectionEncoreRecap(run);

  assert.equal(recap.headline, "COLLECTION ENCORE RECAP");
  assert.match(recap.subline, /completed scan/);
  assert.match(recap.terminalLines.join("\n"), /COLLECTION-ENCORE/);
  assert.match(recap.terminalLines.join("\n"), /NO-EXTRA-ROWS/);
  assert.match(recap.terminalLines.join("\n"), /Vibers Unite/);
  assert.equal(recap.terminalLines.every((line) => line.length === 56), true);
  assert.deepEqual(recap.rails.map((rail) => rail.id), run.encores.map((encore) => encore.id));
  assert.deepEqual(recap.rails.map((rail) => rail.gate), ["queue", "scan-beat", "checkpoint", "relay"]);
  assert.deepEqual(recap.rails.map((rail) => rail.railLabel), ["USAGE", "NOT USAGE", "NOT USAGE", "PUBLISH"]);
  assert.equal(recap.rails.every((rail) => rail.frames.length === 4), true);
  assert.equal(recap.rails.every((rail) => rail.recapLines.length === 5), true);
  assert.equal(recap.rails.every((rail) => rail.recapLines.every((line) => line.length === 56)), true);
  assert.equal(recap.rails.every((rail) => /^[0-9A-F]{8}$/.test(rail.checksum)), true);
  assert.equal(recap.totals.checksums, recap.rails.length);
  assert.deepEqual(recap.totals, { rails: 4, usage: 1, notUsage: 2, publish: 1, replayFrames: 16, checksums: 4 });
  assert.match(recap.rails.find((rail) => rail.id === "higgsfield-logo-turn")?.recapLines.join("\n") ?? "", /HF/);
  assert.match(recap.rails.find((rail) => rail.id === "codex-cube-flip")?.recapLines.join("\n") ?? "", /NOT USAGE/);
  assert.match(recap.rails.find((rail) => rail.id === "local-sonar-bloom")?.guardrail ?? "", /No upload/);
  assert.match(recap.rails.find((rail) => rail.id === "c0vibe-unite-flash")?.caption ?? "", /Vibers Unite/);
});

test("collection signal stack makes the GUI terminal feel like a live control room", () => {
  const run = buildCollectionSurpriseRun();
  const stack = buildCollectionSignalStack(run);

  assert.equal(stack.headline, "SIGNAL STACK CONTROL ROOM");
  assert.match(stack.subline, /dense GUI terminal instrument/);
  assert.match(stack.terminalLines.join("\n"), /SIGNAL-STACK/);
  assert.match(stack.terminalLines.join("\n"), /queue hello/);
  assert.match(stack.terminalLines.join("\n"), /LOCK \/ CLEAR \/ HOLD truth/);
  assert.match(stack.terminalLines.join("\n"), /ledger rows decide truth/);
  assert.match(stack.terminalLines.join("\n"), /NOT USAGE/);
  assert.deepEqual(stack.stages.map((stage) => stage.id), ["queue", "scan-beat", "checkpoint", "relay"]);
  assert.deepEqual(stack.stages.map((stage) => stage.stage), ["01", "02", "03", "04"]);
  assert.deepEqual(stack.stages.map((stage) => stage.label), [
    "Higgsfield prism turn",
    "Codex diff cube",
    "Local sonar bloom",
    "C0VIBE unite flash",
  ]);
  assert.equal(stack.stages.every((stage) => stage.frames.length === 4), true);
  assert.equal(stack.stages.every((stage) => stage.signalLines.length === 4), true);
  assert.equal(stack.stages.every((stage) => stage.marks.length > 0), true);
  assert.equal(stack.stages.every((stage) => stage.meter >= 0 && stage.meter <= 100), true);
  assert.match(stack.stages.find((stage) => stage.id === "queue")?.frames.join("\n") ?? "", /HF/);
  assert.match(stack.stages.find((stage) => stage.id === "scan-beat")?.frames.join("\n") ?? "", /CX/);
  assert.match(stack.stages.find((stage) => stage.id === "checkpoint")?.guardrail ?? "", /No upload/);
  assert.equal(stack.stages.find((stage) => stage.id === "relay")?.status, "review gate");
  assert.match(stack.stages.find((stage) => stage.id === "relay")?.caption ?? "", /Vibers Unite/);
});

test("collection surprise director showruns scan reveals without changing usage totals", () => {
  const run = buildCollectionSurpriseRun();
  const director = buildCollectionSurpriseDirector(run);

  assert.equal(director.headline, "SCANNER SURPRISE DIRECTOR");
  assert.match(director.subline, /first-screen showrunner/);
  assert.match(director.motto, /Vibers Unite/);
  assert.match(director.motto, /C0vibe\.app/);
  assert.match(director.terminalLines.join("\n"), /SURPRISE-DIRECTOR/);
  assert.match(director.terminalLines.join("\n"), /Higgsfield HF, Codex CX/);
  assert.match(director.terminalLines.join("\n"), /NOT USAGE/);
  assert.equal(director.terminalLines.every((line) => line.length === 56), true);
  assert.deepEqual(director.cues.map((cue) => cue.id), [
    "higgsfield-logo-turn",
    "codex-cube-flip",
    "local-sonar-bloom",
    "c0vibe-unite-flash",
  ]);
  assert.deepEqual(director.cues.map((cue) => cue.gate), ["queue", "scan-beat", "checkpoint", "relay"]);
  assert.deepEqual(director.cues.map((cue) => cue.railLabel), ["USAGE", "NOT USAGE", "NOT USAGE", "PUBLISH"]);
  assert.equal(director.cues.every((cue) => cue.frames.length === 4), true);
  assert.equal(director.cues.every((cue) => cue.marks.length > 0), true);
  assert.equal(director.cues.every((cue) => /^T\+\d+\.\d{2}s$/.test(cue.timing)), true);
  assert.equal(director.cues.every((cue) => cue.operatorLine.includes(cue.railLabel)), true);
  assert.match(director.cues.find((cue) => cue.id === "higgsfield-logo-turn")?.frames.join("\n") ?? "", /HF/);
  assert.match(director.cues.find((cue) => cue.id === "codex-cube-flip")?.guardrail ?? "", /NOT USAGE/);
  assert.match(director.cues.find((cue) => cue.id === "local-sonar-bloom")?.guardrail ?? "", /No upload/);
  assert.match(director.cues.find((cue) => cue.id === "c0vibe-unite-flash")?.caption ?? "", /Vibers Unite/);
  assert.deepEqual(director.totals, {
    cues: 4,
    usage: 1,
    notUsage: 2,
    publish: 1,
    providers: 7,
  });
});

test("collection surprise cascade repeats authored reveals through scan and collection", () => {
  const run = buildCollectionSurpriseRun();
  const cascade = buildCollectionSurpriseCascade(run);

  assert.equal(cascade.headline, "SURPRISE CASCADE");
  assert.match(cascade.subline, /Sixteen tiny GUI-terminal reveals/);
  assert.match(cascade.motto, /Vibers Unite/);
  assert.match(cascade.terminalLines.join("\n"), /SURPRISE-CASCADE/);
  assert.match(cascade.terminalLines.join("\n"), /NO PROMPTS \/ NO OUTPUTS \/ NO SECRET VALUES RECORDED/);
  assert.match(cascade.terminalLines.join("\n"), /c0vibe\.app/);
  assert.equal(cascade.terminalLines.every((line) => line.length === 56), true);
  assert.equal(cascade.beats.length, 16);
  assert.equal(cascade.beats.filter((beat) => beat.surprise).length, 12);
  assert.deepEqual(cascade.beats.slice(0, 4).map((beat) => beat.sourceEncoreId), [
    "higgsfield-logo-turn",
    "higgsfield-logo-turn",
    "higgsfield-logo-turn",
    "higgsfield-logo-turn",
  ]);
  assert.deepEqual(cascade.beats.slice(0, 4).map((beat) => beat.reveal), ["blink", "turn", "lock", "unite"]);
  assert.deepEqual([...new Set(cascade.beats.map((beat) => beat.gate))], ["queue", "scan-beat", "checkpoint", "relay"]);
  assert.equal(cascade.beats.every((beat) => beat.operatorLines.length === 4), true);
  assert.equal(cascade.beats.every((beat) => beat.operatorLines.every((line) => line.length === 56)), true);
  assert.equal(cascade.beats.every((beat) => /^T\+\d+\.\d{2}s$/.test(beat.timing)), true);
  assert.equal(cascade.beats.every((beat) => beat.meter >= 42 && beat.meter <= 100), true);
  assert.match(cascade.beats.find((beat) => beat.sourceEncoreId === "higgsfield-logo-turn")?.frame ?? "", /HF/);
  assert.match(cascade.beats.find((beat) => beat.sourceEncoreId === "codex-cube-flip")?.operatorLines.join("\n") ?? "", /NOT USAGE/);
  assert.match(cascade.beats.find((beat) => beat.sourceEncoreId === "local-sonar-bloom")?.caption ?? "", /Local/);
  assert.match(cascade.beats.find((beat) => beat.sourceEncoreId === "c0vibe-unite-flash")?.caption ?? "", /C0VIBE/);
  assert.deepEqual(cascade.totals, {
    beats: 16,
    surprises: 12,
    usage: 4,
    notUsage: 8,
    publish: 4,
    maxDelayMs: 2140,
  });
});

test("collection flight recorder turns scan surprises into a visual-only GUI event tape", () => {
  const run = buildCollectionSurpriseRun();
  const recorder = buildCollectionFlightRecorder(run);

  assert.equal(recorder.headline, "SURPRISE FLIGHT RECORDER");
  assert.match(recorder.subline, /GUI flight tape/);
  assert.match(recorder.motto, /Vibers Unite/);
  assert.match(recorder.terminalLines.join("\n"), /SURPRISE-FLIGHT-RECORDER/);
  assert.match(recorder.terminalLines.join("\n"), /NO PROVIDER CALLS \/ NO USAGE WRITES/);
  assert.match(recorder.terminalLines.join("\n"), /NO PROMPTS \/ NO OUTPUTS \/ NO SECRET VALUES/);
  assert.match(recorder.terminalLines.join("\n"), /visualOnly=true and usageWrites=false/);
  assert.match(recorder.terminalLines.join("\n"), /c0vibe\.app/);
  assert.equal(recorder.terminalLines.every((line) => line.length === 56), true);
  assert.deepEqual(recorder.controlTape.map((step) => step.id), ["scan", "fetch", "validate", "seal"]);
  assert.deepEqual(recorder.controlTape.map((step) => step.railLabel), ["VISUAL ONLY", "USAGE/LOCAL", "NO BOOST", "PUBLISH"]);
  assert.deepEqual(recorder.controlTape.map((step) => step.impact), ["privacy", "usage", "trust", "publish"]);
  assert.deepEqual(recorder.controlTape.map((step) => step.value), ["4 queued", "4 beats", "4 checks", "4 seals"]);
  assert.equal(recorder.controlTape.every((step) => step.frames.length === 4), true);
  assert.equal(recorder.controlTape.every((step) => step.terminalLines.length === 4), true);
  assert.equal(recorder.controlTape.every((step) => step.terminalLines.every((line) => line.length === 56)), true);
  assert.equal(recorder.controlTape.every((step) => step.visualOnly), true);
  assert.equal(recorder.controlTape.every((step) => step.usageWrites === false), true);
  assert.match(recorder.controlTape.find((step) => step.id === "fetch")?.detail ?? "", /4 usage events, 4 local-only events/);
  assert.match(recorder.controlTape.find((step) => step.id === "validate")?.detail ?? "", /8 not-usage events/);
  assert.match(recorder.controlTape.find((step) => step.id === "seal")?.terminalLines.join("\n") ?? "", /usageWrites=0/);
  assert.equal(recorder.events.length, 16);
  assert.deepEqual(recorder.events.slice(0, 4).map((event) => event.phase), ["queue", "scan", "checkpoint", "recap"]);
  assert.deepEqual(recorder.events.slice(0, 4).map((event) => event.mark), ["HF", "HF", "HF", "HF"]);
  assert.deepEqual(recorder.events.map((event) => event.sequence), Array.from({ length: 16 }, (_, index) => index + 1));
  assert.deepEqual([...new Set(recorder.events.map((event) => event.gate))], ["queue", "scan-beat", "checkpoint", "relay"]);
  assert.equal(recorder.events.every((event) => event.visualOnly), true);
  assert.equal(recorder.events.every((event) => event.usageWrites === false), true);
  assert.equal(recorder.events.every((event) => event.promptExport === false), true);
  assert.equal(recorder.events.every((event) => event.outputExport === false), true);
  assert.equal(recorder.events.every((event) => event.secretRead === false), true);
  assert.equal(recorder.events.every((event) => event.transcript.length === 4), true);
  assert.equal(recorder.events.every((event) => event.transcript.every((line) => line.length === 56)), true);
  assert.equal(recorder.events.every((event) => /^[0-9A-F]{8}$/.test(event.checksum)), true);
  assert.equal(new Set(recorder.events.map((event) => event.checksum)).size, recorder.events.length);
  assert.equal(recorder.events.every((event) => /^T\+\d+\.\d{2}s$/.test(event.timing)), true);
  assert.match(recorder.events.find((event) => event.id === "codex-cube-flip-queue")?.transcript.join("\n") ?? "", /NOT USAGE/);
  assert.match(recorder.events.find((event) => event.id === "local-sonar-bloom-recap")?.guardrail ?? "", /No upload/);
  assert.match(recorder.events.find((event) => event.id === "c0vibe-unite-flash-recap")?.transcript.join("\n") ?? "", /PUBLISH/);
  assert.deepEqual(recorder.totals, {
    events: 16,
    usage: 4,
    notUsage: 8,
    localOnly: 4,
    publish: 4,
    visualOnly: 16,
    writes: 0,
    checksums: 16,
  });
});
