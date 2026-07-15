import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EXCLUDED_MARKED_IMPROVEMENT_NUMBERS,
  roadmapGroups,
  roadmapSummary,
  type AcceptedImprovement,
} from "../../../../core/src/capabilities/roadmap.ts";
import { buildRoadmapReleaseNavigator } from "../roadmap-release-navigator.ts";

test("release navigator reflects the capability manifest without inventing a future queue", () => {
  const summary = roadmapSummary();
  const navigator = buildRoadmapReleaseNavigator(roadmapGroups(), EXCLUDED_MARKED_IMPROVEMENT_NUMBERS);

  assert.equal(navigator.headline, "Capability release navigator");
  assert.deepEqual(navigator.totals, {
    items: summary.total,
    lanes: summary.groups,
    live: summary.live,
    accepted: summary.accepted,
    planned: summary.planned,
    excluded: EXCLUDED_MARKED_IMPROVEMENT_NUMBERS.length,
  });
  assert.equal(navigator.totals.live, 73);
  assert.equal(navigator.totals.accepted, 0);
  assert.equal(navigator.totals.planned, 0);
  assert.match(navigator.sourceNote, /not delivery dates/i);
  assert.match(navigator.sourceNote, /No ETA/);
  assert.match(navigator.fingerprint, /^[0-9A-F]{8}$/);
  assert.equal(navigator.lanes.every((lane) => lane.liveCoverage === 100), true);
  assert.equal(navigator.lanes.flatMap((lane) => lane.items).length, summary.total);
  assert.deepEqual(navigator.excludedNumbers, [...EXCLUDED_MARKED_IMPROVEMENT_NUMBERS].sort((a, b) => a - b));
});

test("release navigator derives mixed stages and sanitizes excluded source numbers", () => {
  const items: AcceptedImprovement[] = [
    { number: 1, group: "data", title: "Shipped collector", stage: "live", note: "implementation path" },
    { number: 2, group: "data", title: "Accepted collector", stage: "accepted", note: "committed only" },
    { number: 3, group: "data", title: "Planned collector", stage: "planned", note: "queued only" },
  ];
  const navigator = buildRoadmapReleaseNavigator([
    { group: "data", label: "Data coverage", items },
  ], [9, 4, 9, -2, 0, 4.5]);

  assert.deepEqual(navigator.totals, {
    items: 3,
    lanes: 1,
    live: 1,
    accepted: 1,
    planned: 1,
    excluded: 2,
  });
  assert.deepEqual(navigator.lanes[0].counts, { live: 1, accepted: 1, planned: 1 });
  assert.equal(navigator.lanes[0].liveCoverage, 33);
  assert.deepEqual(navigator.excludedNumbers, [4, 9]);
});

test("release navigator fingerprint is stable and reacts to source truth changes", () => {
  const first = buildRoadmapReleaseNavigator(roadmapGroups(), EXCLUDED_MARKED_IMPROVEMENT_NUMBERS);
  const second = buildRoadmapReleaseNavigator(roadmapGroups(), EXCLUDED_MARKED_IMPROVEMENT_NUMBERS);
  const changed = buildRoadmapReleaseNavigator(roadmapGroups(), [...EXCLUDED_MARKED_IMPROVEMENT_NUMBERS, 101]);

  assert.equal(first.fingerprint, second.fingerprint);
  assert.notEqual(first.fingerprint, changed.fingerprint);
});
