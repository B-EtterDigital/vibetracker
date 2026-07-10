import { test } from "node:test";
import assert from "node:assert/strict";
import { buildProfileDatastreamReceipt } from "../profile-datastream.ts";
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

test("profile datastream receipt traces public profile inputs into the score", () => {
  const score = buildVibeScoreReceipt(profile);
  const receipt = buildProfileDatastreamReceipt(profile, score);

  assert.match(receipt.headline, /@cyrill datastream lineage/);
  assert.match(receipt.subline, /source-to-score receipt/);
  assert.match(receipt.terminalLines.join("\n"), /PROFILE-DATASTREAM/);
  assert.match(receipt.terminalLines.join("\n"), /score \d{3}\/100/);
  assert.match(receipt.terminalLines.join("\n"), /Vibers Unite/);
  assert.equal(receipt.terminalLines.every((line) => line.length === 56), true);
  assert.match(receipt.seal, /^[0-9A-F]{8}$/);
  assert.deepEqual(receipt.lanes.map((lane) => lane.id), ["upload", "providers", "daily", "score", "trust", "publish"]);
  assert.deepEqual(receipt.totals, {
    records: 1200,
    providers: 3,
    activeDays: 3,
    trustSignals: 1,
    score: score.score,
  });
  assert.equal(receipt.lanes.every((lane) => lane.meter >= 0 && lane.meter <= 100), true);
  assert.equal(receipt.lanes.every((lane) => lane.terminalLines.length === 4), true);
  assert.equal(receipt.lanes.every((lane) => lane.terminalLines.every((line) => line.length === 56)), true);
  assert.equal(receipt.lanes.find((lane) => lane.id === "providers")?.mark, "HF");
  assert.equal(receipt.lanes.find((lane) => lane.id === "score")?.value, `${score.score}/100`);
  assert.equal(receipt.lanes.find((lane) => lane.id === "trust")?.impact, "not_usage");
  assert.match(receipt.lanes.find((lane) => lane.id === "trust")?.note ?? "", /NOT USAGE/);
  assert.match(receipt.lanes.find((lane) => lane.id === "trust")?.guardrail ?? "", /cannot change spend/);
  assert.ok(receipt.guardrails.some((guardrail) => /never renders prompts/.test(guardrail)));
});

test("profile datastream receipt has a safe waiting state", () => {
  const waitingProfile = { ...profile, latest: null, providers: [], usageDays: [], trustSignals: [] };
  const score = buildVibeScoreReceipt(waitingProfile);
  const receipt = buildProfileDatastreamReceipt(waitingProfile, score);

  assert.match(receipt.headline, /datastream waiting/);
  assert.equal(receipt.totals.records, 0);
  assert.equal(receipt.totals.providers, 0);
  assert.equal(receipt.totals.score, 0);
  assert.equal(receipt.lanes.find((lane) => lane.id === "upload")?.value, "waiting");
  assert.equal(receipt.lanes.find((lane) => lane.id === "publish")?.value, "draft");
  assert.equal(receipt.lanes.find((lane) => lane.id === "score")?.meter, 0);
  assert.equal(receipt.lanes.find((lane) => lane.id === "trust")?.impact, "not_usage");
  assert.match(receipt.terminalLines.join("\n"), /publish draft/);
  assert.match(receipt.terminalLines.join("\n"), /NOT USAGE/);
});
