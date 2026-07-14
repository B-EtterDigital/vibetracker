import assert from "node:assert/strict";
import test from "node:test";
import { normalizeOrchestration } from "../profile-orchestration-data.ts";

test("normalizes a usable orchestration trace and recomputes client-controlled ratios", () => {
  const trace = normalizeOrchestration({
    activityHours: 12,
    wallHours: 4,
    overlapRatio: 999,
    peakOverlap: 99,
    nightStarts: 3,
    longestSpanHours: 20,
    sessionFiles: 3,
    windowDays: 90,
    filesAvailable: 12,
    filesScanned: 10,
    sampledFiles: 20,
    readBytes: 1024,
    limited: false,
  });

  assert.deepEqual(trace, {
    activityHours: 12,
    wallHours: 4,
    overlapRatio: 3,
    peakOverlap: 3,
    nightStarts: 3,
    longestSpanHours: 12,
    sessionFiles: 3,
    windowDays: 31,
    filesAvailable: 12,
    filesScanned: 10,
    sampledFiles: 10,
    readBytes: 1024,
    limited: true,
  });
});

test("drops malformed, coerced, and unusable orchestration values", () => {
  assert.equal(normalizeOrchestration(null), undefined);
  assert.equal(normalizeOrchestration([]), undefined);
  assert.equal(normalizeOrchestration({ activityHours: "12", wallHours: 4, sessionFiles: 3, filesScanned: 3 }), undefined);
  assert.equal(normalizeOrchestration({ activityHours: 12, wallHours: 0, sessionFiles: 3, filesScanned: 3 }), undefined);
  assert.equal(normalizeOrchestration({ activityHours: 12, wallHours: 4, sessionFiles: 0, filesScanned: 3 }), undefined);
});
