import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildHomeCommandDeck,
  buildHomeCommandPalette,
  buildHomeDatastreamReactor,
  buildHomeMissionSpine,
  buildHomeOperatorConstellation,
  buildHomeProofHud,
  buildHomeScanConductor,
  buildHomeSignalTape,
} from "../home-proof.ts";

test("home command deck presents the local-first proof flow", () => {
  const deck = buildHomeCommandDeck();

  assert.deepEqual(deck.map((item) => item.id), ["start", "scan", "trust", "share"]);
  assert.deepEqual(deck.map((item) => item.status), ["LOCAL", "SCAN", "SIDE", "DRY"]);
  assert.equal(deck[0].command, "npx vibetrack init --gui");
  assert.match(deck[1].note, /Higgsfield/);
  assert.match(deck[1].note, /Codex/);
  assert.match(deck[1].note, /local AI/);
  assert.match(deck[1].note, /regional adapters/);
  assert.match(deck[2].note, /NOT USAGE/);
  assert.match(deck[3].note, /Vibers Unite/);
  assert.match(deck[3].note, /c0vibe\.app/);
});

test("home command palette turns the hero into concrete guarded commands", () => {
  const palette = buildHomeCommandPalette();

  assert.equal(palette.headline, "COMMAND PALETTE");
  assert.match(palette.subline, /concrete next commands/);
  assert.deepEqual(palette.actions.map((action) => action.id), [
    "wizard",
    "surprises",
    "detect",
    "trust",
    "sync",
    "dry_run",
  ]);
  assert.deepEqual(palette.actions.map((action) => action.chord), [
    "CTRL+1",
    "CTRL+2",
    "CTRL+3",
    "CTRL+4",
    "CTRL+5",
    "CTRL+6",
  ]);
  assert.equal(palette.actions.every((action) => action.from.startsWith("#") && action.to.startsWith("#")), true);
  assert.equal(palette.actions.every((action) => action.frames.length === 4), true);
  assert.equal(palette.actions.every((action) => action.terminalLine.length === 64), true);
  assert.match(palette.terminalLines.join("\n"), /COMMAND-PALETTE/);
  assert.match(palette.terminalLines.join("\n"), /providerCalls 0 ledgerWrites 0 hiddenUpload 0/);
  assert.match(palette.terminalLines.join("\n"), /NOT USAGE/);
  assert.match(palette.terminalLines.join("\n"), /C0vibe\.app/);
  assert.equal(palette.terminalLines.every((line) => line.length === 64), true);

  const reel = palette.actions.find((action) => action.id === "surprises");
  const trust = palette.actions.find((action) => action.id === "trust");
  const sync = palette.actions.find((action) => action.id === "sync");
  const dryRun = palette.actions.find((action) => action.id === "dry_run");

  assert.match(reel?.command ?? "", /surprises/);
  assert.match(reel?.guardrail ?? "", /providerCalls=0/);
  assert.equal(trust?.impact, "not_usage");
  assert.match(trust?.guardrail ?? "", /never changes spend/);
  assert.equal(sync?.impact, "usage");
  assert.match(sync?.guardrail ?? "", /can write local usage rows/);
  assert.equal(dryRun?.impact, "privacy");
  assert.match(dryRun?.guardrail ?? "", /hiddenUpload=0/);
  assert.deepEqual(palette.totals, {
    actions: 6,
    localFirst: 4,
    notUsage: 1,
    previewProviderCalls: 0,
    previewLedgerWrites: 0,
    hiddenUploads: 0,
  });
});

test("home scan conductor choreographs surprises while proving preview side effects stay zero", () => {
  const conductor = buildHomeScanConductor();

  assert.equal(conductor.headline, "SCAN CONDUCTOR");
  assert.match(conductor.subline, /zero side effects/);
  assert.deepEqual(conductor.beats.map((beat) => beat.id), ["queue", "detect", "collect", "verify", "redact", "relay"]);
  assert.deepEqual(conductor.beats.map((beat) => beat.railLabel), [
    "VISUAL ONLY",
    "LOCAL ONLY",
    "USAGE",
    "NOT USAGE",
    "PRIVACY",
    "PUBLISH",
  ]);
  assert.equal(conductor.beats.every((beat) => beat.from.startsWith("#") && beat.to.startsWith("#")), true);
  assert.equal(conductor.beats.every((beat) => beat.pulse.length === 4), true);
  assert.equal(conductor.beats.every((beat) => beat.transcript.length === 3), true);
  assert.equal(conductor.beats.every((beat) => beat.preview.providerCalls === 0), true);
  assert.equal(conductor.beats.every((beat) => beat.preview.ledgerWrites === 0), true);
  assert.equal(conductor.beats.every((beat) => beat.preview.uploads === 0), true);
  assert.equal(conductor.terminalLines.every((line) => line.length === 64), true);
  assert.match(conductor.terminalLines.join("\n"), /SCAN-CONDUCTOR/);
  assert.match(conductor.terminalLines.join("\n"), /providerCalls 0 ledgerWrites 0 hiddenUpload 0/);
  assert.match(conductor.terminalLines.join("\n"), /NOT USAGE/);
  assert.match(conductor.terminalLines.join("\n"), /C0vibe\.app/);

  const collect = conductor.beats.find((beat) => beat.id === "collect");
  const verify = conductor.beats.find((beat) => beat.id === "verify");
  const relay = conductor.beats.find((beat) => beat.id === "relay");

  assert.equal(collect?.impact, "usage");
  assert.match(collect?.guardrail ?? "", /preview writes nothing/);
  assert.equal(verify?.impact, "trust");
  assert.match(verify?.guardrail ?? "", /never changes spend/);
  assert.equal(relay?.impact, "publish");
  assert.match(relay?.cue ?? "", /Vibers Unite/);
  assert.deepEqual(conductor.totals, {
    beats: 6,
    surprises: 6,
    previewProviderCalls: 0,
    previewLedgerWrites: 0,
    hiddenUploads: 0,
    usageCommands: 1,
    notUsageRails: 1,
  });
});

test("home proof HUD explains which streams feed score, profile, board, and public relay", () => {
  const hud = buildHomeProofHud();

  assert.equal(hud.headline, "PROOF HUD");
  assert.match(hud.subline, /truth table/);
  assert.deepEqual(hud.channels.map((channel) => channel.id), [
    "usage_rows",
    "trust_sidecar",
    "local_shadow",
    "privacy_gate",
    "score_engine",
    "public_relay",
  ]);
  assert.equal(hud.channels.every((channel) => channel.from.startsWith("#") && channel.to.startsWith("#")), true);
  assert.equal(hud.channels.every((channel) => channel.readout.length === 3), true);
  assert.equal(hud.terminalLines.every((line) => line.length === 64), true);
  assert.match(hud.terminalLines.join("\n"), /PROOF-HUD/);
  assert.match(hud.terminalLines.join("\n"), /NOT USAGE/);
  assert.match(hud.terminalLines.join("\n"), /hiddenUpload 0/);
  assert.match(hud.terminalLines.join("\n"), /C0vibe\.app/);

  const usage = hud.channels.find((channel) => channel.id === "usage_rows");
  const trust = hud.channels.find((channel) => channel.id === "trust_sidecar");
  const local = hud.channels.find((channel) => channel.id === "local_shadow");
  const privacy = hud.channels.find((channel) => channel.id === "privacy_gate");
  const relay = hud.channels.find((channel) => channel.id === "public_relay");

  assert.deepEqual(usage?.feeds, { score: true, profile: true, leaderboard: true, publicRelay: true });
  assert.equal(trust?.status, "NOT USAGE");
  assert.deepEqual(trust?.feeds, { score: false, profile: true, leaderboard: false, publicRelay: true });
  assert.equal(local?.impact, "local_only");
  assert.equal(local?.feeds.publicRelay, false);
  assert.equal(privacy?.feeds.profile, false);
  assert.match(privacy?.readout.join("\n") ?? "", /hiddenUpload:0/);
  assert.match(relay?.note ?? "", /Vibers Unite/);
  assert.deepEqual(hud.totals, {
    channels: 6,
    scoreFeeds: 2,
    profileFeeds: 5,
    leaderboardFeeds: 2,
    publicRelayFeeds: 4,
    notUsageChannels: 1,
    hiddenUploads: 0,
  });
});

test("home mission spine summarizes first-screen feed boundaries", () => {
  const spine = buildHomeMissionSpine();

  assert.equal(spine.headline, "MISSION SPINE");
  assert.match(spine.subline, /first-screen map/);
  assert.deepEqual(spine.cells.map((cell) => cell.id), [
    "usage_datastream",
    "trust_sidecar",
    "local_capture",
    "privacy_gate",
    "score_feed",
    "c0vibe_profile",
  ]);
  assert.deepEqual(spine.cells.map((cell) => cell.status), [
    "COUNTS",
    "NOT USAGE",
    "LOCAL",
    "0 UPLOAD",
    "DERIVED",
    "VIBERS UNITE",
  ]);
  assert.equal(spine.cells.every((cell) => cell.frames.length === 4), true);
  assert.equal(spine.cells.every((cell) => cell.meter > 0 && cell.meter <= 100), true);
  assert.equal(spine.cells.every((cell) => cell.from.startsWith("#") && cell.to.startsWith("#")), true);
  assert.equal(spine.terminalLines.every((line) => line.length === 64), true);
  assert.match(spine.terminalLines.join("\n"), /MISSION-SPINE/);
  assert.match(spine.terminalLines.join("\n"), /NOT USAGE/);
  assert.match(spine.terminalLines.join("\n"), /hiddenUpload 0/);
  assert.match(spine.terminalLines.join("\n"), /Vibers Unite/);

  const usage = spine.cells.find((cell) => cell.id === "usage_datastream");
  const trust = spine.cells.find((cell) => cell.id === "trust_sidecar");
  const local = spine.cells.find((cell) => cell.id === "local_capture");
  const privacy = spine.cells.find((cell) => cell.id === "privacy_gate");
  const publish = spine.cells.find((cell) => cell.id === "c0vibe_profile");

  assert.deepEqual(usage?.feeds, { score: true, profile: true, leaderboard: true, publicRelay: true });
  assert.equal(trust?.impact, "trust");
  assert.match(trust?.note ?? "", /labelled context/);
  assert.equal(local?.impact, "local_only");
  assert.match(local?.note ?? "", /stay on-machine/);
  assert.equal(privacy?.status, "0 UPLOAD");
  assert.deepEqual(privacy?.feeds, { score: false, profile: false, leaderboard: false, publicRelay: false });
  assert.match(publish?.note ?? "", /c0vibe\.app/);
  assert.deepEqual(spine.totals, {
    cells: 6,
    scoreFeeds: 2,
    profileFeeds: 5,
    leaderboardFeeds: 2,
    publicRelayFeeds: 4,
    notUsageCells: 1,
    localOnlyCells: 1,
    hiddenUploads: 0,
  });
});

test("home datastream reactor shows the reviewed stream feeding score profile heatgrid and c0vibe", () => {
  const spine = buildHomeMissionSpine();
  const reactor = buildHomeDatastreamReactor(spine);

  assert.equal(reactor.headline, "DATASTREAM REACTOR");
  assert.match(reactor.subline, /accepted usage rows feed score, profile, heatgrid, board, and C0VIBE/);
  assert.deepEqual(reactor.nodes.map((node) => node.id), [
    "accepted_usage",
    "receipt_normalizer",
    "score_reactor",
    "profile_surface",
    "heatgrid_replay",
    "c0vibe_relay",
    "trust_quarantine",
  ]);
  assert.deepEqual(reactor.nodes.map((node) => node.railLabel), [
    "USAGE SOURCE",
    "PRIVACY GATE",
    "SCORE FEED",
    "PROFILE FEED",
    "OFFICIAL GH COLORS",
    "PUBLISH",
    "NOT USAGE",
  ]);
  assert.equal(reactor.nodes.every((node) => node.frames.length === 3), true);
  assert.equal(reactor.nodes.every((node) => node.meter >= 90 && node.meter <= 100), true);
  assert.equal(reactor.nodes.every((node) => node.from.startsWith("#") && node.to.startsWith("#")), true);
  assert.equal(reactor.nodes.every((node) => Object.values(node.sideEffects).every((value) => value === 0)), true);
  assert.equal(reactor.terminalLines.every((line) => line.length === 64), true);
  assert.match(reactor.terminalLines.join("\n"), /DATASTREAM-REACTOR/);
  assert.match(reactor.terminalLines.join("\n"), /scoreFeeds 2 profileFeeds 5/);
  assert.match(reactor.terminalLines.join("\n"), /accepted usage -> score -> profile -> heatgrid -> c0vibe/);
  assert.match(reactor.terminalLines.join("\n"), /trust sidecar -> profile context only \/\/ NOT USAGE/);
  assert.match(reactor.terminalLines.join("\n"), /hiddenUpload 0 rankMutations 0 trustBoosts 0/);
  assert.deepEqual(reactor.seals, [
    "hiddenUpload=0",
    "rankMutations=0",
    "trustBoosts=0",
    "promptReads=0",
    "outputReads=0",
    "rawContent=0",
  ]);

  const accepted = reactor.nodes.find((node) => node.id === "accepted_usage");
  const heatgrid = reactor.nodes.find((node) => node.id === "heatgrid_replay");
  const trust = reactor.nodes.find((node) => node.id === "trust_quarantine");

  assert.deepEqual(accepted?.feeds, { score: true, profile: true, heatgrid: true, leaderboard: true, publicRelay: true });
  assert.equal(heatgrid?.railLabel, "OFFICIAL GH COLORS");
  assert.equal(heatgrid?.feeds.heatgrid, true);
  assert.equal(trust?.railLabel, "NOT USAGE");
  assert.equal(trust?.feeds.score, false);
  assert.equal(trust?.feeds.heatgrid, false);
  assert.deepEqual(reactor.totals, {
    nodes: 7,
    scoreFeeds: 2,
    profileFeeds: 6,
    heatgridFeeds: 3,
    leaderboardFeeds: 3,
    publicRelayFeeds: 6,
    notUsageNodes: 1,
    hiddenUploads: 0,
    rankMutations: 0,
    trustBoosts: 0,
    promptReads: 0,
    outputReads: 0,
  });
});

test("home route retires the mission-spine theatre from the default leaderboard surface", () => {
  const page = readFileSync("packages/web/src/app/page.tsx", "utf8");

  assert.match(page, /LeaderboardBoard/);
  assert.doesNotMatch(page, /buildHomeMissionSpine|buildHomeDatastreamReactor|HomeMissionSpinePanel|HomeCommandPalettePanel/);
});

test("home signal tape makes the first-screen terminal feel alive without mixing proof rails", () => {
  const tape = buildHomeSignalTape();

  assert.deepEqual(tape.map((row) => row.id), ["higgsfield", "codex", "local", "global", "c0vibe"]);
  assert.deepEqual(tape.map((row) => row.mark), ["HF", "CX", "OL", "QW", "C0"]);
  assert.equal(tape.every((row) => row.meter >= 0 && row.meter <= 100), true);
  assert.equal(tape.every((row) => row.from.startsWith("#") && row.to.startsWith("#")), true);

  const codex = tape.find((row) => row.id === "codex");
  const local = tape.find((row) => row.id === "local");
  const relay = tape.find((row) => row.id === "c0vibe");

  assert.equal(codex?.impact, "trust");
  assert.match(codex?.status ?? "", /NOT USAGE/);
  assert.match(codex?.note ?? "", /out of spend totals/);

  assert.equal(local?.impact, "local_only");
  assert.match(local?.note ?? "", /stay on-machine/);

  assert.equal(relay?.impact, "publish");
  assert.equal(relay?.meter, 100);
  assert.match(relay?.note ?? "", /Vibers Unite/);
  assert.match(relay?.note ?? "", /c0vibe\.app/);
});

test("home keeps signal discipline behind one compact disclosure", () => {
  const consoleSource = readFileSync("packages/web/src/app/home/leaderboard-console.tsx", "utf8");
  const styles = readFileSync("packages/web/src/app/home/home.css", "utf8");

  assert.match(consoleSource, /<details className="home-board__encore">/);
  assert.match(consoleSource, /Open signal discipline/);
  assert.match(consoleSource, /USAGE/);
  assert.match(consoleSource, /NOT USAGE/);
  assert.match(consoleSource, /LOCAL ONLY/);
  assert.match(consoleSource, /PUBLISH/);
  assert.match(consoleSource, /hidden uploads remain zero/);
  assert.match(styles, /\.home-board__encore/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});

test("home operator constellation maps usage, trust, local, privacy, and publish rails", () => {
  const constellation = buildHomeOperatorConstellation();

  assert.equal(constellation.headline, "OPERATOR CONSTELLATION");
  assert.match(constellation.subline, /usage, trust, local AI, privacy, and public profile/);
  assert.deepEqual(constellation.nodes.map((node) => node.id), [
    "provider_readout",
    "trust_sidecar",
    "local_loopback",
    "privacy_gate",
    "c0vibe_relay",
  ]);
  assert.deepEqual(constellation.nodes.map((node) => node.impact), [
    "usage",
    "trust",
    "local_only",
    "privacy",
    "publish",
  ]);
  assert.equal(constellation.nodes.every((node) => node.meter >= 0 && node.meter <= 100), true);
  assert.equal(constellation.nodes.every((node) => node.from.startsWith("#") && node.to.startsWith("#")), true);
  assert.equal(constellation.nodes.every((node) => node.x >= 0 && node.x <= 100 && node.y >= 0 && node.y <= 100), true);

  const terminal = constellation.terminalLines.join("\n");
  assert.match(terminal, /VIBERS-UNITE/);
  assert.match(terminal, /NOT USAGE/);
  assert.match(terminal, /c0vibe\.app/);

  const trust = constellation.nodes.find((node) => node.id === "trust_sidecar");
  const local = constellation.nodes.find((node) => node.id === "local_loopback");
  const publish = constellation.nodes.find((node) => node.id === "c0vibe_relay");

  assert.match(trust?.note ?? "", /never spend/);
  assert.match(local?.note ?? "", /private by default/);
  assert.equal(publish?.meter, 100);
  assert.match(publish?.note ?? "", /score, profile, and board/);
  assert.deepEqual(constellation.rails.map((rail) => rail.id), ["source_truth", "score_feed", "public_profile"]);
});
