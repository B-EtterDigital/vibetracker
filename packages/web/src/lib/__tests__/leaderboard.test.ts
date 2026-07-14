import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  BOARD_HEATGRID_COLORS,
  buildLeaderboardArena,
  buildLeaderboardBroadcastWall,
  buildLeaderboardHeatgrid,
  buildLeaderboardPodiumWave,
  buildLeaderboardProofTower,
  buildLeaderboardRaceControl,
  rankByUsd,
  medalFor,
  formatUsd,
  TIER_LABEL,
} from "../leaderboard.ts";

const rows = [
  { handle: "b", total_usd: 50, total_credits: 100, record_count: 10 },
  { handle: "a", total_usd: 200, total_credits: 300, record_count: 40 },
  { handle: "c", total_usd: 50, total_credits: 999, record_count: 5 },
];

test("rankByUsd sorts by usd desc, tie-breaks on credits, assigns rank + medal", () => {
  const r = rankByUsd(rows);
  assert.deepEqual(r.map((x) => x.handle), ["a", "c", "b"]); // c beats b on credits tie
  assert.equal(r[0].rank, 1);
  assert.equal(r[0].medal, "🥇");
  assert.equal(r[2].medal, "🥉"); // top-3 get medals; "#N" is covered in the medalFor test
});

test("medalFor + formatUsd", () => {
  assert.equal(medalFor(2), "🥈");
  assert.equal(medalFor(9), "#9");
  assert.equal(formatUsd(1234.5), "$1,234.5");
  assert.equal(formatUsd(null), "—");
});

test("trust tiers are labelled and kept distinct", () => {
  assert.equal(TIER_LABEL.verified, "Verified");
  assert.equal(TIER_LABEL.self_reported, "Self-reported");
});

test("buildLeaderboardArena prepares public board totals without mixing tiers", () => {
  const verified = buildLeaderboardArena("verified", rows);
  assert.equal(verified.tier, "verified");
  assert.equal(verified.label, "Verified");
  assert.deepEqual(verified.rows.map((row) => row.handle), ["a", "c", "b"]);
  assert.deepEqual(verified.podium.map((row) => row.medal), ["🥇", "🥈", "🥉"]);
  assert.equal(verified.totalUsd, 300);
  assert.equal(verified.totalCredits, 1399);
  assert.equal(verified.totalOps, 55);
  assert.equal(verified.leader?.handle, "a");
  assert.match(verified.terminalLines.join("\n"), /github \/ c0vibe/);
  assert.match(verified.terminalLines.join("\n"), /@a/);

  const self = buildLeaderboardArena("self_reported", []);
  assert.equal(self.rows.length, 0);
  assert.equal(self.podium.length, 0);
  assert.equal(self.leader, null);
  assert.match(self.terminalLines.join("\n"), /unverified handle/);
  assert.match(self.terminalLines.join("\n"), /none/);
});

test("buildLeaderboardRaceControl derives live race cards from the separated arena", () => {
  const arena = buildLeaderboardArena("verified", rows);
  const race = buildLeaderboardRaceControl(arena);

  assert.equal(race.headline, "Verified race control");
  assert.match(race.subline, /@a/);
  assert.match(race.terminalLines.join("\n"), /RACE-CONTROL\/\/VERIFIED\/\/NO-MIXED-RANKS/);
  assert.match(race.terminalLines.join("\n"), /stream/);
  assert.deepEqual(race.stream.map((stage) => stage.id), ["ingest", "tier_split", "rank_solve", "public_relay"]);
  assert.match(race.stream.find((stage) => stage.id === "tier_split")?.note ?? "", /no mixed ranks/);
  assert.equal(race.stream.every((stage) => stage.meter >= 0 && stage.meter <= 100), true);
  assert.deepEqual(race.pipeline.map((step) => step.id), ["ingest_usage", "tier_guard", "rank_solver", "c0vibe_relay"]);
  assert.deepEqual(race.pipeline.map((step) => step.impact), ["ranked_usage", "tier_boundary", "ranked_usage", "publish"]);
  assert.equal(race.pipeline.every((step) => step.frames.length === 4), true);
  assert.equal(race.pipeline.every((step) => step.terminalLine.length === 64), true);
  assert.equal(race.pipeline.every((step) => step.from.startsWith("#") && step.to.startsWith("#")), true);
  assert.match(race.pipeline.find((step) => step.id === "tier_guard")?.note ?? "", /no mixed ranks/);
  assert.match(race.pipeline.find((step) => step.id === "rank_solver")?.note ?? "", /trust never boosts rank/);
  assert.match(race.pipeline.find((step) => step.id === "c0vibe_relay")?.frames.join("\n") ?? "", /UNITE/);
  assert.deepEqual(race.cards.map((card) => card.id), [
    "leader",
    "gap",
    "ops_crown",
    "efficiency",
    "field_density",
  ]);

  const leader = race.cards.find((card) => card.id === "leader");
  const gap = race.cards.find((card) => card.id === "gap");
  const ops = race.cards.find((card) => card.id === "ops_crown");
  const efficiency = race.cards.find((card) => card.id === "efficiency");
  const field = race.cards.find((card) => card.id === "field_density");

  assert.equal(leader?.value, "@a");
  assert.equal(leader?.status, "rank #1");
  assert.equal(gap?.value, "$150");
  assert.equal(gap?.status, "#1 over #2");
  assert.equal(ops?.value, "@a");
  assert.equal(ops?.status, "40 ops");
  assert.equal(efficiency?.value, "@a");
  assert.equal(efficiency?.status, "$5/op");
  assert.equal(field?.value, "100%");
  assert.equal(race.cards.every((card) => card.meter >= 0 && card.meter <= 100), true);
});

test("buildLeaderboardRaceControl is safe for empty tiers", () => {
  const race = buildLeaderboardRaceControl(buildLeaderboardArena("self_reported", []));

  assert.match(race.headline, /Self-reported/);
  assert.match(race.subline, /waiting/);
  assert.match(race.terminalLines.join("\n"), /SELF_REPORTED/);
  assert.equal(race.stream.find((stage) => stage.id === "ingest")?.value, "0 rows");
  assert.equal(race.stream.find((stage) => stage.id === "public_relay")?.note, "relay waits for rows");
  assert.equal(race.pipeline.find((step) => step.id === "ingest_usage")?.impact, "waiting");
  assert.equal(race.pipeline.find((step) => step.id === "rank_solver")?.value, "waiting");
  assert.equal(race.pipeline.find((step) => step.id === "c0vibe_relay")?.impact, "waiting");
  assert.equal(race.cards.find((card) => card.id === "leader")?.value, "waiting");
  assert.equal(race.cards.find((card) => card.id === "gap")?.note, "Need a runner-up before the gap becomes meaningful.");
  assert.equal(race.stream.every((stage) => stage.meter >= 0 && stage.meter <= 100), true);
  assert.equal(race.pipeline.every((step) => step.meter >= 0 && step.meter <= 100), true);
  assert.equal(race.cards.every((card) => card.meter >= 0 && card.meter <= 100), true);
});

test("buildLeaderboardPodiumWave compares podium operators without changing proof rails", () => {
  const wave = buildLeaderboardPodiumWave(buildLeaderboardArena("verified", rows));

  assert.equal(wave.headline, "Verified podium waveform");
  assert.match(wave.subline, /top 3 ranked operators/);
  assert.match(wave.terminalLines.join("\n"), /PODIUM-WAVEFORM\/\/VERIFIED\/\/VISUAL-ONLY/);
  assert.match(wave.terminalLines.join("\n"), /hidden trust boost 0/);
  assert.match(wave.terminalLines.join("\n"), /mixed ranks 0/);
  assert.match(wave.terminalLines.join("\n"), /Vibers Unite/);
  assert.equal(wave.terminalLines.every((line) => line.length === 64), true);
  assert.deepEqual(wave.operators.map((operator) => operator.handle), ["@a", "@c", "@b"]);
  assert.deepEqual(wave.operators.map((operator) => operator.rank), ["🥇", "🥈", "🥉"]);
  assert.equal(wave.operators.every((operator) => operator.impact === "ranked_usage"), true);
  assert.equal(wave.operators.every((operator) => operator.bars.length === 9), true);
  assert.equal(wave.operators.every((operator) => operator.bars.every((bar) => bar >= 0 && bar <= 100)), true);
  assert.equal(wave.operators.every((operator) => operator.meter >= 0 && operator.meter <= 100), true);
  assert.equal(wave.operators.every((operator) => /^[A-Z0-9]{6}$/.test(operator.checksum)), true);
  assert.equal(new Set(wave.operators.map((operator) => operator.checksum)).size, wave.operators.length);
  assert.match(wave.operators[0]?.delta ?? "", /leader signal/);
  assert.match(wave.operators[1]?.delta ?? "", /behind #1/);
  assert.match(wave.operators[0]?.note ?? "", /visual-only/);
  assert.equal(wave.operators.every((operator) => operator.terminalLine.length === 64), true);
  assert.deepEqual(wave.guards.map((guard) => guard.id), ["source", "tier", "math", "relay"]);
  assert.equal(wave.guards.find((guard) => guard.id === "tier")?.impact, "tier_boundary");
  assert.match(wave.guards.find((guard) => guard.id === "math")?.note ?? "", /trust sidecars never boost/);
  assert.equal(wave.guards.find((guard) => guard.id === "relay")?.value, "c0vibe.app");
  assert.deepEqual(wave.totals, {
    rankedOperators: 3,
    podiumOperators: 3,
    waveformBars: 27,
    totalUsd: 300,
    hiddenTrustBoost: 0,
    mixedRanks: 0,
  });
});

test("buildLeaderboardPodiumWave has a safe waiting state", () => {
  const wave = buildLeaderboardPodiumWave(buildLeaderboardArena("self_reported", []));

  assert.match(wave.headline, /Self-reported/);
  assert.match(wave.subline, /waiting/);
  assert.match(wave.terminalLines.join("\n"), /SELF_REPORTED/);
  assert.equal(wave.terminalLines.every((line) => line.length === 64), true);
  assert.equal(wave.operators.length, 0);
  assert.deepEqual(wave.guards.map((guard) => guard.id), ["source", "tier", "math", "relay"]);
  assert.equal(wave.guards.find((guard) => guard.id === "math")?.impact, "waiting");
  assert.equal(wave.guards.find((guard) => guard.id === "relay")?.value, "waiting");
  assert.deepEqual(wave.totals, {
    rankedOperators: 0,
    podiumOperators: 0,
    waveformBars: 0,
    totalUsd: 0,
    hiddenTrustBoost: 0,
    mixedRanks: 0,
  });
});

test("buildLeaderboardHeatgrid uses official GitHub colors without changing rank rails", () => {
  const heatgrid = buildLeaderboardHeatgrid(buildLeaderboardArena("verified", rows));

  assert.equal(heatgrid.headline, "Verified board heatgrid");
  assert.match(heatgrid.subline, /Official GitHub contribution colors/);
  assert.match(heatgrid.terminalLines.join("\n"), /BOARD-HEATGRID\/\/VERIFIED\/\/OFFICIAL-GH-COLORS/);
  assert.match(heatgrid.terminalLines.join("\n"), /visual-only/);
  assert.match(heatgrid.terminalLines.join("\n"), /hidden trust boost 0/);
  assert.match(heatgrid.terminalLines.join("\n"), /mixed ranks 0/);
  assert.match(heatgrid.terminalLines.join("\n"), /Vibers Unite/);
  assert.equal(heatgrid.terminalLines.every((line) => line.length === 64), true);
  assert.equal(heatgrid.cells.length, 35);
  assert.equal(heatgrid.cells.every((cell) => BOARD_HEATGRID_COLORS.includes(cell.color)), true);
  assert.equal(heatgrid.cells.some((cell) => cell.level === 4 && cell.color === "#39d353"), true);
  assert.equal(heatgrid.cells.every((cell) => cell.meter >= 0 && cell.meter <= 100), true);
  assert.equal(heatgrid.cells.every((cell) => /^[A-Z0-9]{6}$/.test(cell.checksum)), true);
  assert.deepEqual(heatgrid.lanes.map((lane) => lane.id), ["ranked_usage", "tier_boundary", "trust_zero", "relay"]);
  assert.equal(heatgrid.lanes.find((lane) => lane.id === "tier_boundary")?.impact, "tier_boundary");
  assert.match(heatgrid.lanes.find((lane) => lane.id === "trust_zero")?.note ?? "", /NOT USAGE/);
  assert.deepEqual(heatgrid.totals, {
    cells: 35,
    activeCells: 35,
    maxLevel: 4,
    hiddenTrustBoost: 0,
    mixedRanks: 0,
    providerCalls: 0,
    ledgerWrites: 0,
  });
});

test("buildLeaderboardHeatgrid has a safe waiting state", () => {
  const heatgrid = buildLeaderboardHeatgrid(buildLeaderboardArena("self_reported", []));

  assert.match(heatgrid.headline, /Self-reported/);
  assert.match(heatgrid.subline, /waiting/);
  assert.match(heatgrid.terminalLines.join("\n"), /SELF_REPORTED/);
  assert.equal(heatgrid.terminalLines.every((line) => line.length === 64), true);
  assert.equal(heatgrid.cells.length, 35);
  assert.equal(heatgrid.cells.every((cell) => cell.level === 0 && cell.color === BOARD_HEATGRID_COLORS[0]), true);
  assert.equal(heatgrid.cells.every((cell) => cell.label === "waiting"), true);
  assert.equal(heatgrid.totals.activeCells, 0);
  assert.equal(heatgrid.lanes.find((lane) => lane.id === "ranked_usage")?.impact, "waiting");
  assert.equal(heatgrid.lanes.find((lane) => lane.id === "relay")?.value, "waiting");
  assert.equal(heatgrid.totals.providerCalls, 0);
  assert.equal(heatgrid.totals.ledgerWrites, 0);
});

test("buildLeaderboardBroadcastWall renders a separated public signal wall", () => {
  const wall = buildLeaderboardBroadcastWall(buildLeaderboardArena("verified", rows));

  assert.equal(wall.headline, "Verified broadcast wall");
  assert.match(wall.subline, /Top 3 operators/);
  assert.match(wall.terminalLines.join("\n"), /BROADCAST-WALL\/\/VERIFIED\/\/NO-MIXED-RANKS/);
  assert.match(wall.terminalLines.join("\n"), /Vibers Unite/);
  assert.match(wall.terminalLines.join("\n"), /tape/);
  assert.equal(wall.terminalLines.every((line) => line.length === 64), true);
  assert.deepEqual(wall.cards.map((card) => card.handle), ["@a", "@c", "@b"]);
  assert.deepEqual(wall.cards.map((card) => card.tone), ["champion", "runner", "runner"]);
  assert.equal(wall.cards[0].gap, "leader signal");
  assert.equal(wall.cards[1].gap, "$150 behind #1");
  assert.equal(wall.cards.every((card) => card.impact === "ranked_usage"), true);
  assert.equal(wall.cards.every((card) => card.meter >= 0 && card.meter <= 100), true);
  assert.deepEqual(wall.signalTape.map((item) => item.id), ["leader", "spread", "usage", "tier", "relay"]);
  assert.equal(wall.signalTape.every((item) => item.meter >= 0 && item.meter <= 100), true);
  assert.equal(wall.signalTape.find((item) => item.id === "leader")?.value, "@a");
  assert.equal(wall.signalTape.find((item) => item.id === "usage")?.value, "55 ops");
  assert.equal(wall.signalTape.find((item) => item.id === "tier")?.impact, "tier_boundary");
  assert.match(wall.signalTape.find((item) => item.id === "tier")?.note ?? "", /no mixed ranks/);
  assert.equal(wall.signalTape.find((item) => item.id === "relay")?.value, "c0vibe.app");
  assert.match(wall.ticker, /🥇 @a \$200/);
});

test("buildLeaderboardBroadcastWall has a safe empty state", () => {
  const wall = buildLeaderboardBroadcastWall(buildLeaderboardArena("self_reported", []));

  assert.match(wall.headline, /Self-reported/);
  assert.match(wall.subline, /waiting/);
  assert.match(wall.terminalLines.join("\n"), /SELF_REPORTED/);
  assert.equal(wall.cards.length, 0);
  assert.deepEqual(wall.signalTape.map((item) => item.id), ["leader", "spread", "usage", "tier", "relay"]);
  assert.equal(wall.signalTape.find((item) => item.id === "leader")?.value, "waiting");
  assert.equal(wall.signalTape.find((item) => item.id === "relay")?.value, "waiting");
  assert.equal(wall.signalTape.find((item) => item.id === "leader")?.impact, "waiting");
  assert.equal(wall.signalTape.every((item) => item.meter >= 0 && item.meter <= 100), true);
  assert.match(wall.ticker, /board waiting/);
});

test("buildLeaderboardProofTower turns separated ranks into a public proof relay", () => {
  const tower = buildLeaderboardProofTower(buildLeaderboardArena("verified", rows));

  assert.equal(tower.headline, "Verified proof tower");
  assert.match(tower.subline, /without trust boosts or mixed tiers/);
  assert.match(tower.terminalLines.join("\n"), /PROOF-TOWER\/\/VERIFIED\/\/NO-MIXED-RANKS/);
  assert.match(tower.terminalLines.join("\n"), /hidden trust boost 0/);
  assert.match(tower.terminalLines.join("\n"), /Vibers Unite/);
  assert.equal(tower.terminalLines.every((line) => line.length === 64), true);
  assert.deepEqual(tower.beams.map((beam) => beam.handle), ["@a", "@c", "@b"]);
  assert.deepEqual(tower.beams.map((beam) => beam.railLabel), ["RANKED USAGE", "RANKED USAGE", "RANKED USAGE"]);
  assert.equal(tower.beams.every((beam) => beam.impact === "ranked_usage"), true);
  assert.equal(tower.beams.every((beam) => beam.frames.length === 4), true);
  assert.equal(tower.beams.every((beam) => /^[A-Z0-9]{6}$/.test(beam.checksum)), true);
  assert.equal(new Set(tower.beams.map((beam) => beam.checksum)).size, tower.beams.length);
  assert.equal(tower.beams.every((beam) => beam.meter >= 0 && beam.meter <= 100), true);
  assert.deepEqual(tower.guards.map((guard) => guard.id), ["tier", "source", "rank", "relay"]);
  assert.equal(tower.guards.find((guard) => guard.id === "tier")?.impact, "tier_boundary");
  assert.match(tower.guards.find((guard) => guard.id === "source")?.note ?? "", /where the row came from/);
  assert.equal(tower.guards.find((guard) => guard.id === "relay")?.value, "c0vibe.app");
  assert.deepEqual(tower.totals, {
    rankedOperators: 3,
    podiumOperators: 3,
    podiumUsd: 300,
    hiddenTrustBoost: 0,
    mixedRanks: 0,
  });
});

test("buildLeaderboardProofTower has a safe waiting state", () => {
  const tower = buildLeaderboardProofTower(buildLeaderboardArena("self_reported", []));

  assert.match(tower.headline, /Self-reported/);
  assert.match(tower.subline, /waiting/);
  assert.match(tower.terminalLines.join("\n"), /SELF_REPORTED/);
  assert.equal(tower.terminalLines.every((line) => line.length === 64), true);
  assert.equal(tower.beams.length, 0);
  assert.deepEqual(tower.guards.map((guard) => guard.id), ["tier", "source", "rank", "relay"]);
  assert.equal(tower.guards.find((guard) => guard.id === "rank")?.impact, "waiting");
  assert.equal(tower.guards.find((guard) => guard.id === "relay")?.value, "waiting");
  assert.deepEqual(tower.totals, {
    rankedOperators: 0,
    podiumOperators: 0,
    podiumUsd: 0,
    hiddenTrustBoost: 0,
    mixedRanks: 0,
  });
});

test("home leaderboard route retires the multi-theatre board for one calm instrument", () => {
  const page = readFileSync("packages/web/src/app/page.tsx", "utf8");
  const consoleSource = readFileSync("packages/web/src/app/home/leaderboard-console.tsx", "utf8");

  assert.match(page, /buildLeaderboardArena/);
  assert.match(page, /loadBoard\("verified"\)/);
  assert.match(page, /loadBoard\("self_reported"\)/);
  assert.match(page, /LeaderboardConsole/);
  assert.doesNotMatch(page, /buildLeaderboardPodiumWave|buildLeaderboardHeatgrid|buildLeaderboardBroadcastWall|buildLeaderboardProofTower/);
  assert.doesNotMatch(page, /LeaderboardPodiumWavePanel|LeaderboardHeatgridPanel|LeaderboardBroadcastWallPanel|LeaderboardProofTowerPanel/);
  assert.match(consoleSource, /TRUST \+0 \/\/ MIXED RANKS 0/);
  assert.match(consoleSource, /className="home-board__runway"/);
  assert.match(consoleSource, /className="home-board__table-shell"/);
});
