import { test } from "node:test";
import assert from "node:assert/strict";
import { formatMediaDuration, nativeUsageLine } from "../native-usage-metrics.ts";

test("formats generated media duration for scan-friendly specialization copy", () => {
  assert.equal(formatMediaDuration(0), "0s");
  assert.equal(formatMediaDuration(482.5), "8m 03s");
  assert.equal(formatMediaDuration(7_503), "2h 05m");
});

test("summarizes all native outputs in a category without mixing other disciplines", () => {
  const line = nativeUsageLine([
    { provider: "cynaps3", category: "music", outputUnit: "track", outputs: 4, durationSeconds: 482.5 },
    { provider: "suno", category: "music", outputUnit: "track", outputs: 2, durationSeconds: 120 },
    { provider: "runway", category: "video", outputUnit: "clip", outputs: 3, durationSeconds: 18 },
  ], "music");
  assert.equal(line, "6 tracks · 10m 03s generated audio");
});

test("returns no story bullet when a specialization has no native media metrics", () => {
  assert.equal(nativeUsageLine([], "music"), null);
  assert.equal(nativeUsageLine(undefined, "music"), null);
});
