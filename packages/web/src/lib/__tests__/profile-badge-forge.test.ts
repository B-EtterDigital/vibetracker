import { test } from "node:test";
import assert from "node:assert/strict";
import { buildProfileBadgeForge } from "../profile-badge-forge.ts";
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
    { provider: "higgsfield", ops: 24, credits: 500, usd: 32 },
    { provider: "claude-code", ops: 900, credits: 300, usd: 8 },
    { provider: "ollama", ops: 276, credits: 80, usd: 2.5 },
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

test("profile badge forge creates share-ready cards from public aggregates", () => {
  const forge = buildProfileBadgeForge(profile);

  assert.equal(forge.profileUrl, "https://c0vibe.app/u/cyrill");
  assert.match(forge.headline, /Share @cyrill/);
  assert.deepEqual(forge.cards.map((card) => card.id), [
    "score_badge",
    "source_badge",
    "terminal_sig",
    "trust_badge",
    "publish_link",
  ]);
  assert.equal(forge.cards.find((card) => card.id === "source_badge")?.value, "higgsfield");
  assert.equal(forge.cards.find((card) => card.id === "source_badge")?.mark, "HF");
  assert.match(forge.snippets.find((snippet) => snippet.id === "plain")?.value ?? "", /1,200 ops/);
  assert.match(forge.snippets.find((snippet) => snippet.id === "markdown")?.value ?? "", /https:\/\/c0vibe\.app\/u\/cyrill/);
  assert.match(forge.snippets.find((snippet) => snippet.id === "html")?.value ?? "", /<a href=/);
  assert.match(forge.snippets.find((snippet) => snippet.id === "svg_badge")?.value ?? "", /vibetrack badge --out \.\/vibetracker-badge\.svg --handle cyrill --markdown/);
  assert.match(forge.terminalLines.join("\n"), /badge npx vibetrack badge/);
  assert.equal(forge.terminalLines.every((line) => line.length === 64), true);
});

test("profile badge forge keeps trust badge separate from usage", () => {
  const forge = buildProfileBadgeForge(profile);
  const trust = forge.cards.find((card) => card.id === "trust_badge");
  const usageCards = forge.cards.filter((card) => card.impact === "usage");

  assert.ok(trust);
  assert.equal(trust.impact, "not_usage");
  assert.match(trust.code, /NOT USAGE/);
  assert.match(trust.note, /never changes spend/);
  assert.equal(usageCards.some((card) => /NOT USAGE/.test(card.code)), false);
});

test("profile badge forge has a safe waiting state", () => {
  const forge = buildProfileBadgeForge({ ...profile, latest: null, providers: [], usageDays: [], trustSignals: [] });

  assert.match(forge.headline, /Prepare @cyrill/);
  assert.equal(forge.cards.find((card) => card.id === "score_badge")?.value, "0/100");
  assert.equal(forge.cards.find((card) => card.id === "source_badge")?.value, "waiting");
  assert.equal(forge.cards.find((card) => card.id === "publish_link")?.meter, 16);
  assert.match(forge.snippets.find((snippet) => snippet.id === "plain")?.value ?? "", /waiting for reviewed AI usage/);
  assert.match(forge.snippets.find((snippet) => snippet.id === "svg_badge")?.value ?? "", /--handle cyrill/);
});
