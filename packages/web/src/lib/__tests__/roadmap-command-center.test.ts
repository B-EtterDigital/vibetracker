import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EXCLUDED_MARKED_IMPROVEMENT_NUMBERS,
  roadmapGroups,
  roadmapSummary,
} from "../../../../core/src/capabilities/roadmap.ts";
import { buildRoadmapCommandCenter, buildRoadmapMissionRadar } from "../roadmap-command-center.ts";

test("roadmap command center maps the accepted roadmap into labelled product lanes", () => {
  const summary = roadmapSummary();
  const center = buildRoadmapCommandCenter(roadmapGroups());

  assert.equal(center.headline, "Roadmap command center");
  assert.equal(center.totals.items, summary.total);
  assert.equal(center.totals.live, summary.live);
  assert.equal(center.totals.accepted, summary.accepted);
  assert.equal(center.totals.planned, summary.planned);
  assert.equal(center.totals.lanes, 5);
  assert.equal(center.terminalLines.every((line) => line.length === 64), true);
  assert.match(center.terminalLines.join("\n"), /AI-LIFE-DASHBOARD/);
  assert.match(center.terminalLines.join("\n"), /Vibers Unite/);
  assert.match(center.terminalLines.join("\n"), /no fake built claims/);

  assert.deepEqual(center.lanes.map((lane) => lane.id), [
    "capture",
    "trust-boundary",
    "operator-ux",
    "open-forge",
    "life-dashboard",
  ]);
  assert.deepEqual(center.lanes.map((lane) => lane.impact), [
    "usage",
    "trust",
    "ux",
    "open_source",
    "product",
  ]);
  assert.equal(center.lanes.every((lane) => lane.terminal.length === 4), true);
  assert.equal(center.lanes.every((lane) => lane.meter >= 0 && lane.meter <= 100), true);

  const laneNumbers = new Set(center.lanes.flatMap((lane) => lane.itemNumbers));
  assert.equal(laneNumbers.size, summary.total);
  for (const number of EXCLUDED_MARKED_IMPROVEMENT_NUMBERS) {
    assert.equal(laneNumbers.has(number), false);
  }

  const trust = center.lanes.find((lane) => lane.id === "trust-boundary");
  assert.ok(trust);
  assert.match(trust.guardrail, /NOT USAGE/);
  assert.match(trust.command, /upload --dry-run/);

  const life = center.lanes.find((lane) => lane.id === "life-dashboard");
  assert.ok(life);
  assert.match(life.command, /vibetracker life/);
  assert.match(life.note, /coding, creating, research, and publishing/);
});

test("roadmap mission radar turns the marked list into honest operating bands", () => {
  const summary = roadmapSummary();
  const radar = buildRoadmapMissionRadar(roadmapGroups());

  assert.equal(radar.headline, "Marked-list mission radar");
  assert.match(radar.subline, /crossed-image decisions/);
  assert.equal(radar.totals.items, summary.total);
  assert.equal(radar.totals.live, summary.live);
  assert.equal(radar.totals.accepted, summary.accepted);
  assert.equal(radar.totals.planned, summary.planned);
  assert.equal(radar.totals.bands, 4);
  assert.equal(radar.terminalLines.every((line) => line.length === 66), true);
  assert.match(radar.terminalLines.join("\n"), /ROADMAP-RADAR/);
  assert.match(radar.terminalLines.join("\n"), /crossed-out marks stay excluded/);
  assert.match(radar.terminalLines.join("\n"), /Vibers Unite/);

  assert.deepEqual(radar.bands.map((band) => band.id), [
    "source-mesh",
    "proof-boundary",
    "operator-experience",
    "open-forge",
  ]);
  assert.deepEqual(radar.bands.map((band) => band.tone), [
    "usage",
    "trust",
    "ux",
    "open_source",
  ]);
  assert.equal(radar.bands.every((band) => band.terminal.length === 4), true);
  assert.equal(radar.bands.every((band) => band.meter >= 0 && band.meter <= 100), true);

  const radarNumbers = new Set(radar.bands.flatMap((band) => band.primaryNumbers));
  for (const number of EXCLUDED_MARKED_IMPROVEMENT_NUMBERS) {
    assert.equal(radarNumbers.has(number), false);
  }

  const proof = radar.bands.find((band) => band.id === "proof-boundary");
  assert.ok(proof);
  assert.match(proof.guardrail, /NOT USAGE/);
  assert.match(proof.note, /redaction/);

  assert.ok(radar.pulses.some((pulse) => pulse.route === "https://c0vibe.app" && pulse.value === "Vibers Unite"));
  assert.ok(radar.invariants.some((invariant) => /No crossed-out improvement/.test(invariant)));
  assert.ok(radar.invariants.some((invariant) => /not rank input/i.test(invariant)));
});
