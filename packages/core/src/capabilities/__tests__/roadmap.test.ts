import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ACCEPTED_IMPROVEMENTS,
  EXCLUDED_MARKED_IMPROVEMENT_NUMBERS,
  roadmapGroups,
  roadmapSummary,
} from "../roadmap.ts";

test("accepted roadmap contains the non-crossed marked improvements only", () => {
  const accepted = new Set(ACCEPTED_IMPROVEMENTS.map((item) => item.number));
  assert.equal(ACCEPTED_IMPROVEMENTS.length, 73);
  for (const n of EXCLUDED_MARKED_IMPROVEMENT_NUMBERS) {
    assert.equal(accepted.has(n), false, `crossed-out item ${n} should not be accepted`);
  }
  for (const n of [1, 4, 13, 21, 33, 41, 50, 60, 70, 81, 96, 100]) {
    assert.equal(accepted.has(n), true, `selected item ${n} should be accepted`);
  }
});

test("roadmap summary matches grouped items", () => {
  const summary = roadmapSummary();
  const groupedCount = roadmapGroups().reduce((sum, group) => sum + group.items.length, 0);
  assert.equal(summary.total, groupedCount);
  assert.equal(summary.groups, 10);
  assert.equal(summary.live + summary.accepted + summary.planned, summary.total);
  assert.equal(summary.live, 73);
  assert.equal(summary.accepted, 0);
  assert.equal(summary.planned, 0);
});
