import { test } from "node:test";
import assert from "node:assert/strict";
import { buildProfileBroadcastStrip } from "../profile-broadcast-strip.ts";
import type { ProfileView } from "../data.ts";

const profile: ProfileView = {
  handle: "cyrill",
  created_at: "2026-07-05T00:00:00Z",
  isPremium: true,
  latest: {
    total_usd: 42.5,
    total_credits: 880,
    record_count: 1200,
    created_at: "2026-07-05T00:00:00Z",
    tier: "attested",
  },
  providers: [
    { provider: "higgsfield", ops: 700, credits: 400, usd: 24 },
    { provider: "ollama", ops: 300, credits: 0, usd: 0 },
    { provider: "openai", ops: 200, credits: 480, usd: 18.5 },
  ],
  usageDays: [
    { date: "2026-07-03", ops: 200, credits: 180, usd: 12.5 },
    { date: "2026-07-04", ops: 500, credits: 300, usd: 18 },
    { date: "2026-07-05", ops: 500, credits: 400, usd: 12 },
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

test("profile broadcast strip creates a deterministic share-first public rail", () => {
  const strip = buildProfileBroadcastStrip(profile);
  const again = buildProfileBroadcastStrip(profile);

  assert.equal(strip.headline, "@cyrill public broadcast strip");
  assert.equal(strip.profileUrl, "https://c0vibe.app/u/cyrill");
  assert.equal(strip.signalRows.length, 4);
  assert.deepEqual(strip.signalRows, again.signalRows);
  assert.deepEqual(strip.pulses, again.pulses);
  assert.match(strip.terminalLines.join("\n"), /PROFILE-BROADCAST/);
  assert.match(strip.terminalLines.join("\n"), /VIBERS-UNITE/);
  assert.match(strip.terminalLines.join("\n"), /NOT USAGE/);
  assert.equal(strip.terminalLines.every((line) => line.length === 64), true);
  assert.match(strip.ticker.join(" | "), /1,200 ops/);
  assert.match(strip.ticker.join(" | "), /c0vibe\.app/);
});

test("profile broadcast strip separates usage, local, trust, and publish rails", () => {
  const strip = buildProfileBroadcastStrip(profile);
  const byId = new Map(strip.rails.map((rail) => [rail.id, rail]));

  assert.deepEqual(strip.rails.map((rail) => rail.id), ["usage", "source", "local", "trust", "relay"]);
  assert.deepEqual(strip.pulses.map((pulse) => pulse.id), ["usage", "source", "local", "trust", "relay"]);
  assert.equal(byId.get("source")?.value, "higgsfield");
  assert.equal(byId.get("source")?.mark, "HF");
  assert.equal(byId.get("local")?.impact, "local_only");
  assert.equal(byId.get("local")?.mark, "OL");
  assert.match(byId.get("local")?.note ?? "", /Local/);
  assert.equal(byId.get("trust")?.impact, "not_usage");
  assert.match(byId.get("trust")?.note ?? "", /NOT USAGE/);
  assert.equal(byId.get("relay")?.impact, "publish");
  assert.equal(strip.rails.every((rail) => rail.meter >= 0 && rail.meter <= 100), true);
});

test("profile broadcast pulse rail feels live without writing usage", () => {
  const strip = buildProfileBroadcastStrip(profile);
  const byId = new Map(strip.pulses.map((pulse) => [pulse.id, pulse]));

  assert.equal(strip.pulses.length, 5);
  assert.equal(strip.pulses.every((pulse) => pulse.frames.length === 4), true);
  assert.equal(strip.pulses.every((pulse) => pulse.terminalLines.length === 4), true);
  assert.equal(strip.pulses.every((pulse) => pulse.terminalLines.every((line) => line.length === 46)), true);
  assert.equal(strip.pulses.every((pulse) => pulse.visualOnly), true);
  assert.equal(strip.pulses.every((pulse) => pulse.usageWrites === false), true);
  assert.equal(byId.get("trust")?.railLabel, "NOT USAGE");
  assert.equal(byId.get("trust")?.command, "trust:sidecar.lock");
  assert.match(byId.get("trust")?.detail ?? "", /not usage/i);
  assert.deepEqual(byId.get("relay")?.frames, ["C0", "VIBE", "UNITE", "LIVE"]);
  assert.match(byId.get("relay")?.terminalLines.join("\n") ?? "", /usageWrites=0/);
});

test("profile broadcast strip has a safe waiting state", () => {
  const strip = buildProfileBroadcastStrip({ ...profile, latest: null, providers: [], usageDays: [], trustSignals: [] });

  assert.equal(strip.headline, "@cyrill broadcast waiting room");
  assert.match(strip.subline, /first reviewed upload/);
  assert.equal(strip.rails.find((rail) => rail.id === "usage")?.value, "waiting");
  assert.equal(strip.rails.find((rail) => rail.id === "source")?.value, "no source");
  assert.equal(strip.rails.find((rail) => rail.id === "local")?.value, "ready");
  assert.equal(strip.rails.find((rail) => rail.id === "trust")?.value, "0 signals");
  assert.equal(strip.pulses.find((pulse) => pulse.id === "usage")?.value, "waiting");
  assert.equal(strip.pulses.find((pulse) => pulse.id === "source")?.value, "no source");
  assert.equal(strip.pulses.find((pulse) => pulse.id === "relay")?.value, "not synced");
  assert.match(strip.ticker.join(" | "), /waiting for reviewed usage/);
});
