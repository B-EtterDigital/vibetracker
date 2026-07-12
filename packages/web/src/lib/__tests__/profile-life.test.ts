import { test } from "node:test";
import assert from "node:assert/strict";
import { buildProfileLifeDashboard } from "../profile-life.ts";
import type { ProfileView } from "../data.ts";

const profile: ProfileView = {
  handle: "cyrill",
  created_at: "2026-07-05T00:00:00Z",
  isPremium: true,
  latest: {
    total_usd: 30.5,
    total_credits: 420,
    record_count: 1200,
    created_at: "2026-07-05T00:00:00Z",
    tier: "attested",
  },
  providers: [
    { provider: "higgsfield", ops: 300, credits: 250, usd: 20 },
    { provider: "codex-cli", ops: 700, credits: 120, usd: 8 },
    { provider: "ollama", ops: 200, credits: 50, usd: 2.5 },
  ],
  usageDays: [
    { date: "2026-07-04", ops: 400, credits: 140, usd: 10.5 },
    { date: "2026-07-05", ops: 800, credits: 280, usd: 20 },
  ],
  categories: [], providerDays: [], providerModels: [], trustSignals: [{
    kind: "github_activity",
    source: "github_cli",
    label: "GitHub activity evidence (not AI usage)",
    handle: "B-EtterDigital",
    fetchedAt: "2026-07-05T00:00:00Z",
    from: "2026-07-01T00:00:00Z",
    to: "2026-07-05T00:00:00Z",
    windowDays: 5,
    totalContributions: 33,
    commitContributions: 20,
    issueContributions: 1,
    pullRequestContributions: 7,
    pullRequestReviewContributions: 5,
    repositoryContributions: 0,
    days: [],
    confidence: "activity_evidence",
    affectsTotals: false,
    usageVerified: false,
    note: "Activity evidence only. Not counted as usage, spend, credits, or verified provider data.",
  }],
};

test("profile life dashboard derives a public AI-life command deck from usage rollups", () => {
  const life = buildProfileLifeDashboard(profile);

  assert.equal(life.headline, "$30.50 across 1,200 operations");
  assert.match(life.subline, /higgsfield leads/);
  assert.deepEqual(life.tiles.map((tile) => tile.id), ["spend", "ops", "credits", "providers", "trust", "relay"]);
  assert.equal(life.tiles.find((tile) => tile.id === "trust")?.usageImpact, "not_usage");
  assert.equal(life.tiles.find((tile) => tile.id === "relay")?.usageImpact, "not_usage");
  assert.equal(life.tiles.find((tile) => tile.id === "spend")?.usageImpact, "usage");
  assert.match(life.terminalLines.join("\n"), /NOT USAGE \/\/ rank impact none/);
  assert.match(life.terminalLines.join("\n"), /Vibers Unite \/\/ c0vibe\.app/);
});

test("profile life dashboard separates creator, builder, local, and trust lanes", () => {
  const life = buildProfileLifeDashboard(profile);
  const byId = new Map(life.lanes.map((lane) => [lane.id, lane]));

  assert.equal(byId.get("creator")?.label, "Creator studio");
  assert.equal(byId.get("creator")?.providerIds[0], "higgsfield");
  assert.equal(byId.get("builder")?.label, "Builder agents");
  assert.equal(byId.get("builder")?.providerIds[0], "codex-cli");
  assert.equal(byId.get("local")?.label, "Local AI lab");
  assert.equal(byId.get("local")?.providerIds[0], "ollama");
  assert.equal(byId.get("trust")?.usageImpact, "not_usage");
  assert.match(byId.get("trust")?.note ?? "", /never change spend/);
});

test("profile life dashboard fails safe when no usage bundle exists", () => {
  const life = buildProfileLifeDashboard({ ...profile, latest: null, providers: [], usageDays: [], trustSignals: [] });

  assert.equal(life.headline, "No usage bundle published yet");
  assert.match(life.terminalLines.join("\n"), /no uploaded usage bundle yet/);
  assert.equal(life.lanes.length, 1);
  assert.equal(life.lanes[0].id, "trust");
  assert.equal(life.lanes[0].usageImpact, "not_usage");
  assert.equal(life.tiles.find((tile) => tile.id === "trust")?.value, "0");
});
