import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const data = readFileSync("packages/web/src/lib/data.ts", "utf8");
const page = readFileSync("packages/web/src/app/u/[handle]/page.tsx", "utf8");

test("profile queries report hard failures through VTRS and rethrow", () => {
  assert.match(data, /createConsoleTelemetry/);
  assert.match(data, /area: "web\.profile\.load"/);
  assert.match(data, /telemetry\.captureError\(error/);
  assert.match(data, /throw error/);
  assert.match(data, /if \(handleError\) throw queryFailure\("profile\.handle", handleError\)/);
  assert.match(data, /if \(error\) throw queryFailure\("profile\.providers", error\)/);
  assert.match(data, /if \(error\) throw queryFailure\("profile\.latest", error\)/);
});

test("optional rollout tables leave warning breadcrumbs before fallback", () => {
  assert.match(data, /profile\.trust-signals\.fallback/);
  assert.match(data, /profile\.daily-usage\.fallback/);
  assert.match(data, /area: "web\.profile\.optional-data"/);
  assert.match(data, /code: error\.code \?\? "unknown"/);
  assert.match(data, /}, "warn"\)/);
});

test("the public route distinguishes missing profiles from backend failures", () => {
  assert.match(page, /const profile = await getProfile\(handle\)/);
  assert.match(page, /if \(!profile\) notFound\(\)/);
  assert.doesNotMatch(page, /catch\s*(\([^)]*\))?\s*\{/);
});
