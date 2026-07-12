import { test } from "node:test";
import assert from "node:assert/strict";
import { buildProfileOperatorPoster } from "../profile-operator-poster.ts";
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

test("profile operator poster creates a deterministic shareable signal card", () => {
  const poster = buildProfileOperatorPoster(profile);
  const posterAgain = buildProfileOperatorPoster(profile);

  assert.equal(poster.headline, "@cyrill signal poster");
  assert.equal(poster.callsign, "CYRIL");
  assert.equal(poster.signalRows.length, 5);
  assert.deepEqual(poster.signalRows, posterAgain.signalRows);
  assert.match(poster.shareLine, /1,200 ops/);
  assert.deepEqual(poster.proofStamp, [
    "receipt attested // aggregate usage only",
    "privacy prompts 0 // outputs 0 // secrets 0",
    "trust sidecar 1 signal // NOT USAGE",
  ]);
  assert.match(poster.terminalLines.join("\n"), /PROFILE-POSTER/);
  assert.match(poster.terminalLines.join("\n"), /VIBERS-UNITE/);
  assert.match(poster.terminalLines.join("\n"), /NOT USAGE/);
  assert.match(poster.terminalLines.join("\n"), /aggregate-only \/\/ no prompts outputs secrets/);
  assert.match(poster.terminalLines.join("\n"), /usage rows only \/\/ trust impact none/);
  assert.match(poster.terminalLines.join("\n"), /marquee usage\/source\/trust\/relay proof rails/);
  assert.equal(poster.terminalLines.every((line) => line.length === 64), true);
  assert.deepEqual(poster.proofMarquee.map((rail) => rail.id), [
    "usage-feed",
    "source-field",
    "trust-sidecar",
    "c0vibe-relay",
  ]);
  assert.deepEqual(poster.proofMarquee.map((rail) => rail.impact), ["usage", "usage", "not_usage", "publish"]);
  assert.equal(poster.proofMarquee.every((rail) => rail.frames.length === 4), true);
  assert.equal(poster.proofMarquee.every((rail) => rail.terminalLine.length === 64), true);
  assert.equal(poster.proofMarquee.every((rail) => rail.meter >= 0 && rail.meter <= 100), true);
});

test("profile operator poster separates usage, trust, and relay panels", () => {
  const poster = buildProfileOperatorPoster(profile);
  const byId = new Map(poster.panels.map((panel) => [panel.id, panel]));

  assert.deepEqual(poster.panels.map((panel) => panel.id), ["usage", "source", "rhythm", "trust", "relay"]);
  assert.equal(byId.get("source")?.value, "higgsfield");
  assert.equal(byId.get("source")?.mark, "HF");
  assert.equal(byId.get("trust")?.impact, "not_usage");
  assert.match(byId.get("trust")?.note ?? "", /NOT USAGE/);
  assert.equal(byId.get("relay")?.impact, "publish");
  assert.equal(poster.panels.every((panel) => panel.meter >= 0 && panel.meter <= 100), true);

  const marquee = new Map(poster.proofMarquee.map((rail) => [rail.id, rail]));
  assert.equal(marquee.get("source-field")?.mark, "HF");
  assert.match(marquee.get("source-field")?.frames.join("\n") ?? "", /higgsfield/i);
  assert.equal(marquee.get("trust-sidecar")?.impact, "not_usage");
  assert.match(marquee.get("trust-sidecar")?.guardrail ?? "", /cannot change spend/);
  assert.match(marquee.get("trust-sidecar")?.frames.join("\n") ?? "", /NOT/);
  assert.equal(marquee.get("c0vibe-relay")?.mark, "C0");
  assert.match(marquee.get("c0vibe-relay")?.frames.join("\n") ?? "", /VIBERS/);
});

test("profile operator poster has a safe waiting state", () => {
  const poster = buildProfileOperatorPoster({ ...profile, latest: null, providers: [], usageDays: [], trustSignals: [] });

  assert.equal(poster.headline, "@cyrill waiting room");
  assert.match(poster.subline, /lights up after/);
  assert.equal(poster.panels.find((panel) => panel.id === "usage")?.value, "waiting");
  assert.equal(poster.panels.find((panel) => panel.id === "source")?.value, "none yet");
  assert.equal(poster.panels.find((panel) => panel.id === "trust")?.value, "0 signals");
  assert.match(poster.shareLine, /waiting for reviewed usage/);
  assert.deepEqual(poster.proofStamp, [
    "receipt draft // no reviewed usage bundle",
    "privacy prompts 0 // outputs 0 // secrets 0",
    "trust sidecar 0 signals // NOT USAGE",
  ]);
  assert.equal(poster.proofMarquee.find((rail) => rail.id === "usage-feed")?.value, "waiting");
  assert.equal(poster.proofMarquee.find((rail) => rail.id === "source-field")?.value, "waiting");
  assert.equal(poster.proofMarquee.find((rail) => rail.id === "trust-sidecar")?.value, "0 signals");
  assert.match(poster.proofMarquee.find((rail) => rail.id === "c0vibe-relay")?.value ?? "", /not synced/);
});
