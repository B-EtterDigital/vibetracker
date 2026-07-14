import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const rangeMigration = readFileSync("supabase/migrations/010_vibetracker_usage_counts_bigint.sql", "utf8");
const quantityMigration = readFileSync("supabase/migrations/011_vibetracker_usage_counts_numeric.sql", "utf8");
const selfReportedMigration = readFileSync("supabase/migrations/012_vibetracker_self_reported.sql", "utf8");
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
