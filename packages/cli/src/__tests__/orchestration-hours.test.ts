import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { collectOrchestrationHours, summarizeIntervals } from "../orchestration-hours.ts";

const HOUR = 3_600_000;

test("summarizeIntervals derives bounded activity, wall time, and overlap", () => {
  const result = summarizeIntervals([
    { start: 0, end: HOUR },
    { start: HOUR / 2, end: HOUR + HOUR / 2 },
  ], { sessionFiles: 2, windowDays: 7, filesAvailable: 3, filesScanned: 2, limited: true });
  assert.ok(result);
  assert.equal(result.activityHours, 2);
  assert.equal(result.wallHours, 1.5);
  assert.equal(result.overlapRatio, 1.3);
  assert.equal(result.peakOverlap, 2);
  assert.equal(result.longestSpanHours, 1);
  assert.equal(result.sessionFiles, 2);
  assert.equal(result.windowDays, 7);
  assert.equal(result.filesAvailable, 3);
  assert.equal(result.filesScanned, 2);
  assert.equal(result.limited, true);
});

test("back-to-back spans do not inflate peak overlap", () => {
  const result = summarizeIntervals([
    { start: 0, end: HOUR },
    { start: HOUR, end: 2 * HOUR },
  ]);
  assert.equal(result?.peakOverlap, 1);
});

test("summarizeIntervals returns null without observed spans", () => {
  assert.equal(summarizeIntervals([]), null);
});

test("collector respects the recent window and reports scan coverage", (t) => {
  const root = mkdtempSync(join(tmpdir(), "vibetracker-orchestration-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const now = Date.parse("2026-07-15T00:00:00.000Z");
  const recent = join(root, "recent.jsonl");
  const old = join(root, "old.jsonl");
  const line = (timestamp: string) => JSON.stringify({ timestamp });
  writeFileSync(recent, `${line("2026-07-14T22:00:00.000Z")}\n${line("2026-07-14T22:10:00.000Z")}\n`);
  writeFileSync(old, `${line("2026-06-01T00:00:00.000Z")}\n${line("2026-06-01T00:10:00.000Z")}\n`);
  utimesSync(recent, new Date(now - HOUR), new Date(now - HOUR));
  utimesSync(old, new Date(now - 40 * 24 * HOUR), new Date(now - 40 * 24 * HOUR));

  const result = collectOrchestrationHours({ roots: [root], now, windowDays: 7, maxBytes: 1_000_000 });
  assert.ok(result);
  assert.equal(result.activityHours, 0.2);
  assert.equal(result.filesAvailable, 1);
  assert.equal(result.filesScanned, 1);
  assert.equal(result.sessionFiles, 1);
  assert.equal(result.limited, false);
});

test("collector stops at the byte budget and breadcrumbs partial coverage", (t) => {
  const root = mkdtempSync(join(tmpdir(), "vibetracker-orchestration-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const now = Date.parse("2026-07-15T00:00:00.000Z");
  mkdirSync(join(root, "nested"));
  const content = `${JSON.stringify({ timestamp: "2026-07-14T22:00:00.000Z", pad: "x".repeat(120) })}\n${JSON.stringify({ timestamp: "2026-07-14T22:10:00.000Z" })}\n`;
  const newest = join(root, "newest.jsonl");
  const second = join(root, "nested", "second.jsonl");
  writeFileSync(newest, content);
  writeFileSync(second, content);
  utimesSync(newest, new Date(now - HOUR), new Date(now - HOUR));
  utimesSync(second, new Date(now - 2 * HOUR), new Date(now - 2 * HOUR));
  const breadcrumbs: string[] = [];
  const result = collectOrchestrationHours({
    roots: [root],
    now,
    maxBytes: Buffer.byteLength(content) + 1,
    telemetry: {
      captureError(error) { assert.fail(String(error)); },
      addBreadcrumb(event) { breadcrumbs.push(event); },
    },
  });
  assert.ok(result);
  assert.equal(result.filesAvailable, 2);
  assert.equal(result.filesScanned, 1);
  assert.equal(result.limited, true);
  assert.ok(breadcrumbs.includes("cli.orchestration.coverage_limited"));
});
