import { test } from "node:test";
import assert from "node:assert/strict";
import { buildProfileSignalConstellation } from "../profile-signal-constellation.ts";
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
    tier: "self_reported",
  },
  providers: [
    { provider: "higgsfield", ops: 24, credits: 500, usd: 32 },
    { provider: "claude-code", ops: 900, credits: 300, usd: 8 },
    { provider: "ollama", ops: 276, credits: 80, usd: 0 },
  ],
  usageDays: [
    { date: "2026-07-03", ops: 200, credits: 180, usd: 12.5 },
    { date: "2026-07-04", ops: 500, credits: 300, usd: 18 },
    { date: "2026-07-05", ops: 500, credits: 400, usd: 12 },
  ],
  trustSignals: [{
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

test("profile signal constellation separates usage nodes from trust evidence", () => {
  const constellation = buildProfileSignalConstellation(profile);

  assert.equal(constellation.headline, "Profile signal constellation");
  assert.match(constellation.subline, /3 usage nodes/);
  assert.match(constellation.terminalLines.join("\n"), /NOT USAGE/);
  assert.match(constellation.terminalLines.join("\n"), /VIBERS UNITE/);

  const usageNodes = constellation.nodes.filter((node) => node.impact === "usage");
  assert.deepEqual(usageNodes.map((node) => node.id), [
    "provider-higgsfield",
    "provider-claude-code",
    "provider-ollama",
  ]);
  assert.equal(usageNodes.every((node) => node.note.includes("feed usage totals")), true);
  assert.equal(usageNodes.every((node) => node.meter >= 24 && node.meter <= 100), true);

  const trust = constellation.nodes.find((node) => node.id === "trust-side-rail");
  assert.ok(trust);
  assert.equal(trust.impact, "not_usage");
  assert.match(trust.note, /never changes spend/);
  assert.equal(trust.value, "1 signals");

  const relay = constellation.nodes.find((node) => node.id === "c0vibe-relay");
  assert.ok(relay);
  assert.equal(relay.impact, "publish");
  assert.match(relay.note, /local review/);
});

test("profile signal constellation handles profiles with no usage upload", () => {
  const constellation = buildProfileSignalConstellation({
    ...profile,
    latest: null,
    providers: [],
    usageDays: [],
    trustSignals: [],
  });

  assert.match(constellation.subline, /No usage nodes yet/);
  assert.equal(constellation.nodes.filter((node) => node.impact === "usage").length, 0);
  assert.equal(constellation.nodes.some((node) => node.id === "trust-side-rail" && node.impact === "not_usage"), true);
  assert.equal(constellation.nodes.some((node) => node.id === "c0vibe-relay" && node.value === "not synced"), true);
  assert.equal(constellation.legend.some((item) => item.impact === "not_usage" && item.note.includes("NOT USAGE")), true);
});
