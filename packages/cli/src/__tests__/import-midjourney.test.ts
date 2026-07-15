import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  buildMidjourneyLifetimeRecord,
  isMidjourneyLifetimeImport,
  parseMidjourneyInfo,
} from "../import-midjourney.ts";
import { GUIDE } from "../wizard.ts";
import { readRecords } from "../../../core/src/store/jsonl.ts";

test("Midjourney /info text yields the lifetime image count", () => {
  assert.equal(parseMidjourneyInfo("Lifetime Usage\n12,345 images (421.3 hours)"), 12_345);
  assert.equal(parseMidjourneyInfo("9,876 generations - Lifetime Usage"), 9_876);
  assert.equal(parseMidjourneyInfo("Fast Time Remaining 12.4 / 30 hours"), null);
});

test("lifetime import counts every image as an image operation", () => {
  const record = buildMidjourneyLifetimeRecord({
    images: 12_345,
    asOf: "2026-07-15",
    usdEst: 720,
    profileId: "studio",
  });
  assert.deepEqual(record, {
    ts: "2026-07-15T12:00:00.000Z",
    provider: "midjourney",
    category: "image",
    operation: "lifetime_images",
    quantity: 12_345,
    unit: "image",
    rawAmount: 12_345,
    rawUnit: "images",
    outputQuantity: 12_345,
    outputUnit: "image",
    usdEst: 720,
    source: "manual",
    confidence: "low",
    verified: false,
    profileId: "studio",
  });
});

test("re-import replacement cannot delete separate Midjourney spend rows", () => {
  const imported = buildMidjourneyLifetimeRecord({ images: 10, asOf: "2026-07-15" });
  assert.equal(isMidjourneyLifetimeImport(imported), true);
  assert.equal(isMidjourneyLifetimeImport({ ...imported, operation: "subscription" }), false);
  assert.equal(isMidjourneyLifetimeImport({ ...imported, provider: "higgsfield" }), false);
});

test("invalid counts fail closed and setup never requests a Midjourney cookie", () => {
  assert.throws(() => buildMidjourneyLifetimeRecord({ images: 0, asOf: "2026-07-15" }), /whole number/);
  assert.throws(() => buildMidjourneyLifetimeRecord({ images: 2.5, asOf: "2026-07-15" }), /whole number/);
  assert.match(GUIDE.midjourney.why ?? "", /does not provide a public usage API/);
  assert.match((GUIDE.midjourney.steps ?? []).join(" "), /\/info/);
  assert.doesNotMatch(JSON.stringify(GUIDE.midjourney), /cookie|session-token/i);
});

test("CLI re-import replaces the lifetime snapshot instead of stacking it", () => {
  const home = mkdtempSync(join(tmpdir(), "vibetracker-midjourney-"));
  try {
    const run = (images: number) => spawnSync(process.execPath, [
      "bin/vibetracker.mjs",
      "import",
      "midjourney",
      "--images",
      String(images),
      "--as-of",
      "2026-07-15",
    ], {
      cwd: process.cwd(),
      env: { ...process.env, HOME: home, VT_NO_SURPRISES: "1", NO_COLOR: "1" },
      encoding: "utf8",
      timeout: 20_000,
    });

    const first = run(12_345);
    assert.equal(first.status, 0, first.stderr);
    assert.match(first.stdout, /12,345 images counted/);

    const second = run(12_999);
    assert.equal(second.status, 0, second.stderr);
    assert.match(second.stdout, /12,999 images counted/);

    const records = readRecords(join(home, ".vibetracker", "records.jsonl"));
    assert.equal(records.length, 1);
    assert.equal(records[0].quantity, 12_999);
    assert.equal(records[0].rawAmount, 12_999);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});
