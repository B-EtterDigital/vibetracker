import { test } from "node:test";
import assert from "node:assert/strict";
import { buildProfileBlackBoxReplay, buildProfileProofSpine } from "../profile-proof.ts";
import type { ProfileView } from "../data.ts";

const profile: ProfileView = {
  handle: "cyrill",
  created_at: "2026-07-05T00:00:00Z",
  isPremium: true,
  latest: {
    total_usd: 12.34,
    total_credits: 42,
    record_count: 1200,
    created_at: "2026-07-05T00:00:00Z",
    tier: "self_reported",
  },
  providers: [
    { provider: "higgsfield", ops: 3, credits: 20, usd: 10 },
    { provider: "claude-code", ops: 10, credits: 22, usd: 2.34 },
  ],
  usageDays: [
    { date: "2026-07-05", ops: 1200, credits: 42, usd: 12.34 },
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

test("public profile proof spine separates usage, provider, trust, and publish state", () => {
  const spine = buildProfileProofSpine(profile);

  assert.deepEqual(spine.map((cell) => cell.id), ["usage", "providers", "trust", "publish"]);
  assert.equal(spine[0].value, "1,200");
  assert.match(spine[1].note, /Top source: higgsfield/);
  assert.equal(spine[2].value, "1");
  assert.match(spine[2].note, /NOT USAGE/);
  assert.equal(spine[3].value, "SELF REPORTED");
  assert.match(spine[3].note, /Vibers Unite/);
  assert.match(spine[3].note, /c0vibe\.app/);
});

test("public profile proof spine handles an unsynced profile", () => {
  const spine = buildProfileProofSpine({ ...profile, latest: null, providers: [], usageDays: [], trustSignals: [] });

  assert.equal(spine[0].value, "0");
  assert.match(spine[0].note, /No usage upload yet/);
  assert.equal(spine[1].value, "0");
  assert.equal(spine[2].value, "0");
  assert.equal(spine[3].value, "NOT SYNCED");
});

test("public black box replay exposes aggregate stages and privacy rails", () => {
  const replay = buildProfileBlackBoxReplay(profile);

  assert.equal(replay.events.length, 7);
  assert.deepEqual(replay.events.map((event) => event.id), ["capture", "provider", "heatgrid", "score", "trust", "review", "publish"]);
  assert.match(replay.headline, /@cyrill public black box replay/);
  assert.match(replay.terminalLines.join("\n"), /PUBLIC-BLACK-BOX/);
  assert.match(replay.terminalLines.join("\n"), /prompts 0 \/\/ outputs 0 \/\/ secrets 0 \/\/ raw files 0/);
  assert.match(replay.terminalLines.join("\n"), /trust 1 NOT USAGE \/\/ rank impact 0/);
  assert.equal(replay.events[0].value, "1,200 ops");
  assert.equal(replay.events[1].mark, "HF");
  assert.equal(replay.events[3].impact, "score");
  assert.equal(replay.events[4].impact, "not_usage");
  assert.match(replay.events[4].guardrail, /Cannot change spend, credits, operations, rank, or verified status/);
  assert.equal(replay.events[5].impact, "local_only");
  assert.match(replay.events[5].guardrail, /Nothing leaves the machine/);
  assert.equal(replay.events[6].value, "live");
  assert.match(replay.guardrails.join("\n"), /USAGE/);
  assert.match(replay.guardrails.join("\n"), /NOT USAGE/);
  assert.match(replay.guardrails.join("\n"), /LOCAL ONLY/);
  assert.match(replay.guardrails.join("\n"), /c0vibe\.app/);
});

test("public black box replay stays quiet for unsynced profiles", () => {
  const replay = buildProfileBlackBoxReplay({ ...profile, latest: null, providers: [], usageDays: [], trustSignals: [] });

  assert.match(replay.headline, /waiting/);
  assert.match(replay.terminalLines.join("\n"), /records 0 \/\/ providers 0 \/\/ active days 0/);
  assert.equal(replay.events[0].value, "waiting");
  assert.equal(replay.events[3].status, "offline");
  assert.equal(replay.events[4].value, "0 signals");
  assert.equal(replay.events[5].status, "pending");
  assert.equal(replay.events[6].value, "draft");
  assert.equal(replay.events[6].status, "NOT SYNCED");
});
