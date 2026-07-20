import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const leaderboardDataSource = readFileSync(
  new URL("../leaderboard-data.ts", import.meta.url),
  "utf8",
);

interface QueryResult {
  data: unknown;
  error: null | { message: string; code?: string };
}

function mockSupabaseReturning(results: Record<string, QueryResult>) {
  const calls: string[] = [];
  const client = {
    from(table: string) {
      calls.push(table);
      const builder = {
        select() { return builder; },
        order() { return builder; },
        limit() { return Promise.resolve(results[table] ?? { data: [], error: null }); },
      };
      return builder;
    },
  };
  return { client, calls };
}

function loadLeaderboardData(supabaseServer: () => unknown) {
  const projectRequire = createRequire(import.meta.url);
  const ts = projectRequire("typescript");
  const source = ts.transpileModule(leaderboardDataSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const loaded = { exports: {} as Record<string, unknown> };
  const stubRequire = (id: string) => {
    if (id === "./supabase") return { supabaseServer };
    if (id === "../../../core/src/telemetry") {
      return { createConsoleTelemetry: () => ({ captureError() {}, addBreadcrumb() {} }) };
    }
    throw new Error(`unexpected leaderboard-data import: ${id}`);
  };
  new Function("require", "exports", "module", source)(stubRequire, loaded.exports, loaded);
  return loaded.exports;
}

const identities = [
  { id: "identity-ada", canonical_handle: "ada", display_name: "Ada Lovelace", country: "ch" },
  { id: "identity-bob", canonical_handle: "bob", display_name: "Bob", country: "de" },
];

const submissions = [
  {
    id: "ada-old",
    identity_id: "identity-ada",
    handle: null,
    created_at: "2026-07-18T00:00:00.000Z",
    vibetracker_submission_providers: [{ ops: 999, usd: 999 }],
    vibetracker_submission_provider_daily: [{ category: "coding", day: "2026-07-18", ops: 999, credits: 0, usd: 999 }],
    vibetracker_submission_provider_models: [{ category: "coding", model: "old-model" }],
    vibetracker_submission_daily_usage: [{ day: "2026-07-18", ops: 999, credits: 0, usd: 999 }],
  },
  {
    id: "legacy-new",
    identity_id: null,
    handle: "LegacyViber",
    created_at: "2026-07-20T08:00:00.000Z",
    vibetracker_submission_providers: [{ ops: 70, usd: 60 }],
    vibetracker_submission_provider_daily: [
      { category: "image", day: "2026-07-20", ops: 70, credits: 0, usd: 60 },
      { category: null, day: "2026-07-19", ops: 2, credits: 0, usd: 5 },
    ],
    vibetracker_submission_provider_models: [{ category: "image", model: "legacy-image" }],
    vibetracker_submission_daily_usage: [{ day: "2026-07-20", ops: 70, credits: 0, usd: 60 }],
  },
  {
    id: "legacy-ada-collision",
    identity_id: null,
    handle: "ADA",
    created_at: "2026-07-20T11:00:00.000Z",
    vibetracker_submission_providers: [{ ops: 500, usd: 500 }],
    vibetracker_submission_provider_daily: [{ category: "coding", day: "2026-07-20", ops: 500, credits: 0, usd: 500 }],
    vibetracker_submission_provider_models: [{ category: "coding", model: "legacy-collision-model" }],
    vibetracker_submission_daily_usage: [{ day: "2026-07-20", ops: 500, credits: 0, usd: 500 }],
  },
  {
    id: "ada-new",
    identity_id: "identity-ada",
    handle: null,
    created_at: "2026-07-20T10:00:00.000Z",
    vibetracker_submission_providers: [{ ops: 1, usd: 34.2 }],
    vibetracker_submission_provider_daily: [
      { category: "coding", day: "2026-07-19", ops: 2, credits: 0, usd: 8 },
      { category: "coding", day: "2026-07-20", ops: 3, credits: 0, usd: 12 },
      { category: "image", day: "2026-07-20", ops: 10, credits: 0, usd: 244 },
      { category: "audio", day: "2026-07-20", ops: 0, credits: 0, usd: 1 },
    ],
    vibetracker_submission_provider_models: [
      { category: "coding", model: "code-model" },
      { category: "coding", model: "code-model" },
      { category: "image", model: "image-model" },
    ],
    vibetracker_submission_daily_usage: [
      { day: "2026-07-18", ops: 0, credits: 0, usd: 0 },
      { day: "2026-07-19", ops: 2, credits: 0, usd: 8 },
      { day: "2026-07-20", ops: 13, credits: 0, usd: 257 },
    ],
  },
  {
    id: "bob-new",
    identity_id: "identity-bob",
    handle: null,
    created_at: "2026-07-20T09:00:00.000Z",
    vibetracker_submission_providers: [{ ops: 50, usd: 90 }],
    vibetracker_submission_provider_daily: [
      { category: "coding", day: "2026-07-20", ops: 30, credits: 0, usd: 50 },
      { category: "image", day: "2026-07-20", ops: 20, credits: 0, usd: 40 },
    ],
    vibetracker_submission_provider_models: [{ category: "coding", model: "code-model" }],
    vibetracker_submission_daily_usage: [{ day: "2026-07-20", ops: 50, credits: 0, usd: 90 }],
  },
];

function runtime() {
  const mock = mockSupabaseReturning({
    vibetracker_submissions: { data: submissions, error: null },
    vibetracker_public_identities: { data: identities, error: null },
  });
  return { ...mock, exports: loadLeaderboardData(() => mock.client) };
}

test("fetchLeaderboard uses latest aggregate rows, filters categories, changes sort, and passes country/legacy rows", async () => {
  const allRuntime = runtime();
  const fetchLeaderboard = allRuntime.exports.fetchLeaderboard as (filters: unknown) => Promise<Array<Record<string, unknown>>>;
  const all = await fetchLeaderboard({ category: "all", sort: "usd" });

  assert.deepEqual(all.map((row) => [row.rank, row.handle, row.totalUsd]), [
    [1, "ada", 265],
    [2, "bob", 90],
    [3, "LegacyViber", 65],
  ]);
  assert.equal(all[0]?.country, "ch");
  assert.equal(all[0]?.displayName, "Ada Lovelace");
  assert.equal(all[0]?.topCategory, "image");
  assert.equal(all[0]?.activeDays, 2);
  assert.equal(all[0]?.modelCount, 2);
  assert.equal(all[0]?.attested, true);
  assert.equal(all[2]?.country, null);
  assert.equal(all[2]?.attested, false);
  assert.deepEqual(allRuntime.calls, ["vibetracker_submissions", "vibetracker_public_identities"]);

  const categoryRuntime = runtime();
  const fetchCategoryBoard = categoryRuntime.exports.fetchLeaderboard as (filters: unknown) => Promise<Array<Record<string, unknown>>>;
  const codingByOps = await fetchCategoryBoard({ category: "coding", sort: "ops" });
  assert.deepEqual(codingByOps.map((row) => [row.rank, row.handle, row.totalOps, row.totalUsd]), [
    [1, "bob", 30, 50],
    [2, "ada", 5, 20],
  ]);
  assert.equal(codingByOps[1]?.modelCount, 1);
});

test("the all board ranks by provider-daily sums and stays consistent with its category parts", async () => {
  const testRuntime = runtime();
  const fetchLeaderboard = testRuntime.exports.fetchLeaderboard as (filters: unknown) => Promise<Array<Record<string, unknown>>>;
  const all = await fetchLeaderboard({ category: "all", sort: "usd" });
  const ada = all.find((row) => row.handle === "ada");
  const legacy = all.find((row) => row.handle === "LegacyViber");

  assert.equal(all[0]?.handle, "ada", "daily aggregate sum must outrank the lower provider total");
  assert.equal(ada?.totalUsd, 20 + 244 + 1);
  assert.equal(ada?.totalOps, 5 + 10);
  assert.equal(legacy?.totalUsd, 65, "legacy null-category rows remain part of the all-board sum");
});

test("an attested identity suppresses a legacy board entry with the same normalized handle", async () => {
  const testRuntime = runtime();
  const fetchLeaderboard = testRuntime.exports.fetchLeaderboard as (filters: unknown) => Promise<Array<Record<string, unknown>>>;
  const all = await fetchLeaderboard({ category: "all", sort: "usd" });
  const adaRows = all.filter((row) => String(row.handle).toLowerCase() === "ada");

  assert.equal(adaRows.length, 1);
  assert.equal(adaRows[0]?.attested, true);
  assert.equal(adaRows[0]?.totalUsd, 265);
});

test("fetchCategoryRanks ranks only positive-op categories and reports each board size", async () => {
  const testRuntime = runtime();
  const fetchCategoryRanks = testRuntime.exports.fetchCategoryRanks as (handle: string) => Promise<Array<Record<string, unknown>>>;
  const placements = await fetchCategoryRanks("ADA");

  assert.deepEqual(placements, [
    { category: "coding", rank: 2, of: 2, usd: 20, ops: 5 },
    { category: "image", rank: 1, of: 3, usd: 244, ops: 10 },
  ]);
  assert.deepEqual(testRuntime.calls, ["vibetracker_submissions", "vibetracker_public_identities"]);
});
