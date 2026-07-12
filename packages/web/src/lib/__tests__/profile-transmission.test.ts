import { test } from "node:test";
import assert from "node:assert/strict";
import { buildProfileTransmissionDeck } from "../profile-transmission.ts";
import type { ProfileView } from "../data.ts";

const profile: ProfileView = {
  handle: "cyrill",
  created_at: "2026-07-05T00:00:00Z",
  isPremium: true,
  latest: {
    total_usd: 64.5,
    total_credits: 1200,
    record_count: 2400,
    created_at: "2026-07-05T00:00:00Z",
    tier: "attested",
  },
  providers: [
    { provider: "higgsfield", ops: 200, credits: 800, usd: 44 },
    { provider: "claude-code", ops: 1800, credits: 300, usd: 14 },
    { provider: "ollama", ops: 400, credits: 100, usd: 6.5 },
  ],
  usageDays: [
    { date: "2026-07-03", ops: 600, credits: 250, usd: 14.5 },
    { date: "2026-07-04", ops: 800, credits: 400, usd: 20 },
    { date: "2026-07-05", ops: 1000, credits: 550, usd: 30 },
  ],
  categories: [], providerDays: [], trustSignals: [{
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

test("profile transmission deck separates usage proof, trust side rail, and publish receipt", () => {
  const deck = buildProfileTransmissionDeck(profile);

  assert.equal(deck.headline, "Profile datastream is live");
  assert.deepEqual(deck.stages.map((stage) => stage.id), ["ingest", "daily", "provider", "trust", "publish"]);
  assert.deepEqual(deck.stages.map((stage) => stage.impact), ["usage", "usage", "usage", "not_usage", "publish"]);
  assert.equal(deck.stages[0].value, "2,400 ops");
  assert.match(deck.stages[0].note, /\$64\.50/);
  assert.equal(deck.stages[1].value, "3 active days");
  assert.equal(deck.stages[1].status, "by-day");
  assert.equal(deck.stages[2].mark, "HF");
  assert.match(deck.stages[3].note, /NOT USAGE/);
  assert.match(deck.stages[4].note, /c0vibe/i);
  assert.match(deck.terminalLines.join("\n"), /Vibers Unite/);
});

test("profile transmission deck has a safe waiting state", () => {
  const deck = buildProfileTransmissionDeck({ ...profile, latest: null, providers: [], usageDays: [], trustSignals: [] });

  assert.equal(deck.headline, "Profile datastream is waiting");
  assert.equal(deck.stages[0].status, "empty");
  assert.equal(deck.stages[0].value, "waiting");
  assert.equal(deck.stages[1].status, "empty");
  assert.equal(deck.stages[2].value, "0 sources");
  assert.equal(deck.stages[3].impact, "not_usage");
  assert.equal(deck.stages[4].status, "draft");
  assert.match(deck.terminalLines.join("\n"), /no reviewed bundle/);
});

test("profile transmission stages are meterable and brand styled", () => {
  const deck = buildProfileTransmissionDeck(profile);

  assert.equal(deck.stages.every((stage) => stage.meter >= 0 && stage.meter <= 100), true);
  assert.equal(deck.stages.every((stage) => stage.from.startsWith("#") && stage.to.startsWith("#")), true);
  assert.equal(deck.stages.every((stage) => stage.route.includes("->")), true);
});
