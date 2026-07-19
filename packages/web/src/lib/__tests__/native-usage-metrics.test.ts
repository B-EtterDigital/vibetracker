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

test("labels new music operation types: lyrics stays uncountable, import pluralizes normally", () => {
  // lyrics is an uncountable noun — "lyrics" at every count, never "lyricss".
  assert.equal(nativeUsageLine([
    { provider: "cynaps3", category: "music", outputUnit: "lyrics", outputs: 1, durationSeconds: 0 },
  ], "music"), "1 lyrics");
  assert.equal(nativeUsageLine([
    { provider: "cynaps3", category: "music", outputUnit: "lyrics", outputs: 3, durationSeconds: 0 },
  ], "music"), "3 lyrics");

  // import pluralizes normally.
  assert.equal(nativeUsageLine([
    { provider: "cynaps3", category: "music", outputUnit: "import", outputs: 1, durationSeconds: 0 },
  ], "music"), "1 import");
  assert.equal(nativeUsageLine([
    { provider: "cynaps3", category: "music", outputUnit: "import", outputs: 1_544, durationSeconds: 0 },
  ], "music"), "1,544 imports");

  // mixed with the existing track/variation types, sorted by unit key.
  assert.equal(nativeUsageLine([
    { provider: "cynaps3", category: "music", outputUnit: "import", outputs: 1_544, durationSeconds: 0 },
    { provider: "cynaps3", category: "music", outputUnit: "lyrics", outputs: 12, durationSeconds: 0 },
    { provider: "cynaps3", category: "music", outputUnit: "track", outputs: 2, durationSeconds: 0 },
  ], "music"), "1,544 imports · 12 lyrics · 2 tracks");
});
