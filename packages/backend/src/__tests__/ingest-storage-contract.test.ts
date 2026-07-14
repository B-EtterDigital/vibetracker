import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const rangeMigration = readFileSync("supabase/migrations/010_vibetracker_usage_counts_bigint.sql", "utf8");
const quantityMigration = readFileSync("supabase/migrations/011_vibetracker_usage_counts_numeric.sql", "utf8");
const edge = readFileSync("supabase/functions/vibetracker-ingest/index.ts", "utf8");

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
