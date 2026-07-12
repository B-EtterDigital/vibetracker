import { test } from "node:test";
import assert from "node:assert/strict";
import { buildProfileHeroBridge } from "../profile-hero-bridge.ts";
import { buildVibeScoreReceipt } from "../vibe-score.ts";
import type { ProfileView } from "../data.ts";

const profile: ProfileView = {
  handle: "cyrill",
  created_at: "2026-07-05T00:00:00Z",
  isPremium: true,
  latest: {
    total_usd: 42.5,
    total_credits: 880,
    record_count: 1200,
    created_at: new Date().toISOString(),
    tier: "attested",
  },
  providers: [
    { provider: "higgsfield", ops: 24, credits: 500, usd: 32 },
    { provider: "claude-code", ops: 900, credits: 300, usd: 8 },
    { provider: "ollama", ops: 276, credits: 80, usd: 2.5 },
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

test("profile hero bridge condenses score, usage, source, trust, and publish rails", () => {
  const receipt = buildVibeScoreReceipt(profile);
  const bridge = buildProfileHeroBridge(profile, receipt);

  assert.equal(bridge.headline, "@cyrill signal bridge");
  assert.match(bridge.subline, /first-glance command board/);
  assert.match(bridge.terminalLines.join("\n"), /PROFILE-HERO-BRIDGE/);
  assert.match(bridge.terminalLines.join("\n"), /trust 1 NOT USAGE \/\/ usageWrites 0/);
  assert.match(bridge.terminalLines.join("\n"), /Vibers Unite/);
  assert.equal(bridge.terminalLines.every((line) => line.length === 56), true);
  assert.deepEqual(bridge.stages.map((stage) => stage.id), ["score", "usage", "rhythm", "source", "trust", "relay"]);
  assert.deepEqual(bridge.stages.map((stage) => stage.impact), ["score", "usage", "usage", "usage", "not_usage", "publish"]);
  assert.equal(bridge.stages.every((stage) => stage.mark.length >= 2), true);
  assert.equal(bridge.stages.every((stage) => stage.from.startsWith("#") && stage.to.startsWith("#")), true);
  assert.equal(bridge.stages.every((stage) => stage.terminalLine.length === 56), true);
  assert.equal(bridge.stages.find((stage) => stage.id === "usage")?.value, "1,200 ops");
  assert.equal(bridge.stages.find((stage) => stage.id === "rhythm")?.value, "3 active days");
  assert.equal(bridge.stages.find((stage) => stage.id === "source")?.value, "3 providers");
  assert.match(bridge.stages.find((stage) => stage.id === "source")?.note ?? "", /higgsfield/);
  assert.match(bridge.stages.find((stage) => stage.id === "trust")?.terminalLine ?? "", /NOT USAGE/);
  assert.match(bridge.stages.find((stage) => stage.id === "trust")?.guardrail ?? "", /zero usage writes/);
  assert.equal(bridge.stages.find((stage) => stage.id === "relay")?.value, "public");
  assert.deepEqual(bridge.totals, {
    score: receipt.score,
    usageStages: 4,
    notUsageStages: 1,
    publishStages: 1,
    activeDays: 3,
    providers: 3,
    usageWrites: 0,
  });
});

test("profile hero bridge has a safe waiting state without inventing activity", () => {
  const bridge = buildProfileHeroBridge({
    ...profile,
    latest: null,
    providers: [],
    usageDays: [],
    trustSignals: [],
  });

  assert.equal(bridge.totals.score, 0);
  assert.equal(bridge.totals.activeDays, 0);
  assert.equal(bridge.totals.providers, 0);
  assert.equal(bridge.totals.usageWrites, 0);
  assert.match(bridge.headline, /waiting/);
  assert.equal(bridge.stages.find((stage) => stage.id === "usage")?.value, "0 ops");
  assert.equal(bridge.stages.find((stage) => stage.id === "trust")?.value, "0 signals");
  assert.equal(bridge.stages.find((stage) => stage.id === "relay")?.value, "waiting");
  assert.match(bridge.terminalLines.join("\n"), /score 000\/100/);
  assert.match(bridge.shareLine, /not published/);
});
