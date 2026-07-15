import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const rangeMigration = readFileSync("supabase/migrations/010_vibetracker_usage_counts_bigint.sql", "utf8");
const quantityMigration = readFileSync("supabase/migrations/011_vibetracker_usage_counts_numeric.sql", "utf8");
const selfReportedMigration = readFileSync("supabase/migrations/012_vibetracker_self_reported.sql", "utf8");
const orchestrationMigration = readFileSync("supabase/migrations/013_vibetracker_orchestration.sql", "utf8");
const nativeMetricsMigration = readFileSync("supabase/migrations/20260715131500_vibetracker_native_metrics.sql", "utf8");
const edgeBytes = readFileSync("supabase/functions/vibetracker-ingest/index.ts");
const edge = edgeBytes.toString("utf8");

test("production usage rollups accept large and fractional normalized quantities", () => {
  for (const table of [
    "vibetracker_submission_providers",
    "vibetracker_submission_daily_usage",
    "vibetracker_submission_categories",
    "vibetracker_submission_provider_daily",
  ]) {
    assert.match(quantityMigration, new RegExp(`alter table public\\.${table}[\\s\\S]*?alter column ops type numeric`));
  }
  assert.match(quantityMigration, /vibetracker_submission_provider_models[\s\S]*alter column ops type numeric/);
});

test("failed required-provider persistence cannot leave a non-empty partial submission", () => {
  assert.match(rangeMigration, /record_count > 0[\s\S]*not exists[\s\S]*vibetracker_submission_providers/);
  assert.match(edge, /if \(bpErr\)[\s\S]*vibetracker_submissions"\)\.delete\(\)\.eq\("id", sub\.id\)/);
  assert.match(edge, /cleanupError: "partial submission cleanup failed"/);
});

test("self-reported profile truths stay bounded, sanitized, and source-safe", () => {
  const forbiddenControlByte = edgeBytes.findIndex(
    (byte) => byte < 9 || (byte > 13 && byte < 32) || byte === 127,
  );

  assert.equal(forbiddenControlByte, -1, "edge source must not contain literal control bytes");
  assert.match(selfReportedMigration, /self_reported_agents integer[\s\S]*self_reported_agents <= 1000/);
  assert.match(selfReportedMigration, /self_reported_subs text[\s\S]*char_length\(self_reported_subs\) <= 200/);
  assert.match(selfReportedMigration, /constraint vibetracker_submissions_self_reported_agents_check/);
  assert.match(selfReportedMigration, /constraint vibetracker_submissions_self_reported_subs_check/);
  assert.match(edge, /selfAgentsRaw > 0 && selfAgentsRaw <= 1000/);
  assert.match(edge, /rawSelf\.subs\.replace\(\/\[\\x00-\\x1f\\x7f\]\+\/g, " "\)/);
});

test("local orchestration evidence stays numeric-only, invariant-safe, and explicitly derived", () => {
  assert.match(orchestrationMigration, /orchestration jsonb/);
  assert.match(orchestrationMigration, /constraint vibetracker_submissions_orchestration_object_check/);
  assert.match(orchestrationMigration, /jsonb_typeof\(orchestration\) = 'object'/);
  assert.match(orchestrationMigration, /not exact process runtime, billing time, human effort, or verified concurrency/i);
  assert.match(edge, /typeof value === "number" && Number\.isFinite\(value\) && value >= 0/);
  assert.match(edge, /activityHours/);
  assert.match(edge, /overlapRatio: wallHours > 0 \? Math\.round\(\(activityHours \/ wallHours\) \* 10\) \/ 10 : 0/);
  assert.match(edge, /filesAvailable = Math\.max\(filesScanned/);
  assert.match(edge, /limited: rawOrch\.limited === true \|\| filesScanned < filesAvailable/);
  assert.doesNotMatch(edge, /computeHours|peakConcurrent|overnightSessions|longestRunHours/);
});

test("native media metrics are aggregate-only, bounded by constraints, and public read-only", () => {
  assert.match(nativeMetricsMigration, /create table if not exists public\.vibetracker_submission_native_metrics/);
  assert.match(nativeMetricsMigration, /output_unit in \('track', 'image', 'clip', 'file'\)/);
  assert.match(nativeMetricsMigration, /outputs\s+numeric not null default 0 check \(outputs >= 0\)/);
  assert.match(nativeMetricsMigration, /duration_seconds\s+numeric not null default 0 check \(duration_seconds >= 0\)/);
  assert.match(nativeMetricsMigration, /enable row level security/);
  assert.match(nativeMetricsMigration, /for select using \(true\)/);
  assert.doesNotMatch(nativeMetricsMigration, /for (insert|update|delete)/i);
  assert.match(edge, /vibetracker_submission_native_metrics/);
  assert.match(edge, /result\.byNativeMetric/);
});
