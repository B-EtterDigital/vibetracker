import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildVibeScoreCalibrationChamber,
  buildVibeScoreMixerConsole,
  buildVibeScoreReceipt,
  buildVibeScoreReactor,
} from "../vibe-score.ts";
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
  categories: [], trustSignals: [{
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

test("vibe score receipt is derived from usage datastream factors", () => {
  const receipt = buildVibeScoreReceipt(profile);
  const usage = receipt.factors.find((factor) => factor.id === "usage");
  const rhythm = receipt.factors.find((factor) => factor.id === "rhythm");
  const coverage = receipt.factors.find((factor) => factor.id === "coverage");

  assert.ok(receipt.score > 0 && receipt.score <= 100);
  assert.match(receipt.headline, /Vibe Score/);
  assert.equal(usage?.impact, "score");
  assert.equal(usage?.value, "1,200 ops");
  assert.match(usage?.note ?? "", /\$42\.50/);
  assert.equal(rhythm?.value, "3 active days");
  assert.match(rhythm?.note ?? "", /daily aggregate rows/i);
  assert.equal(coverage?.value, "3 providers");
  assert.match(receipt.terminalLines.join("\n"), /C0VIBE\.APP/);
});

test("vibe score keeps trust as not usage context", () => {
  const receipt = buildVibeScoreReceipt(profile);
  const noTrustReceipt = buildVibeScoreReceipt({ ...profile, trustSignals: [] });
  const trust = receipt.factors.find((factor) => factor.id === "trust");

  assert.ok(trust);
  assert.equal(trust.impact, "not_usage");
  assert.match(trust.note, /NOT USAGE/);
  assert.equal(receipt.score, noTrustReceipt.score);
  assert.match(receipt.terminalLines.join("\n"), /trust \d+\/8 \+0 SCORE/);
  assert.match(trust.note, /\+0 score/);
  assert.match(trust.note, /never changes spend/);
});

test("vibe score has a safe offline state", () => {
  const receipt = buildVibeScoreReceipt({ ...profile, latest: null, providers: [], usageDays: [], trustSignals: [] });

  assert.equal(receipt.score, 0);
  assert.equal(receipt.tier, "offline");
  assert.match(receipt.headline, /waiting for first reviewed upload/);
  assert.equal(receipt.factors.every((factor) => factor.points === 0), true);
  assert.match(receipt.shareLine, /not published/);
});

test("vibe score reactor renders an oscilloscope from the same datastream receipt", () => {
  const receipt = buildVibeScoreReceipt(profile);
  const reactor = buildVibeScoreReactor(profile, receipt);

  assert.equal(reactor.score, receipt.score);
  assert.equal(reactor.tier, receipt.tier);
  assert.match(reactor.headline, new RegExp(receipt.tier.toUpperCase()));
  assert.match(reactor.subline, /score receipt/);
  assert.match(reactor.terminalLines.join("\n"), /SCORE-REACTOR/);
  assert.match(reactor.terminalLines.join("\n"), /C0VIBE\.APP/);
  assert.match(reactor.terminalLines.join("\n"), /NOT USAGE/);
  assert.match(reactor.terminalLines.join("\n"), /Vibers Unite/);
  assert.equal(reactor.terminalLines.every((line) => line.length === 56), true);
  assert.deepEqual(reactor.rails.map((rail) => rail.id), ["usage", "rhythm", "coverage", "freshness", "trust"]);
  assert.equal(reactor.rails.every((rail) => rail.signal.length === 14), true);
  assert.equal(reactor.rails.every((rail) => rail.meter >= 0 && rail.meter <= 100), true);
  assert.equal(reactor.rails.find((rail) => rail.id === "usage")?.impact, "score");
  assert.equal(reactor.rails.find((rail) => rail.id === "trust")?.impact, "not_usage");
  assert.equal(reactor.rails.find((rail) => rail.id === "trust")?.code, "trust.sideRail.notUsage");
  assert.match(reactor.rails.find((rail) => rail.id === "trust")?.guardrail ?? "", /cannot change spend/);
  assert.equal(reactor.signalRows.length, 6);
  assert.equal(reactor.signalRows.every((line) => line.length === 56), true);
  assert.match(reactor.signalRows.join("\n"), /NOT USAGE/);
  assert.match(reactor.seal, /^[0-9A-F]{8}$/);
  assert.ok(reactor.guardrails.some((guardrail) => /Trust appears as context only/.test(guardrail)));
});

test("vibe score reactor has a safe offline oscilloscope", () => {
  const offlineProfile = { ...profile, latest: null, providers: [], usageDays: [], trustSignals: [] };
  const reactor = buildVibeScoreReactor(offlineProfile);

  assert.equal(reactor.score, 0);
  assert.equal(reactor.tier, "offline");
  assert.match(reactor.headline, /waiting for first reviewed upload/);
  assert.equal(reactor.rails.every((rail) => rail.points === 0), true);
  assert.equal(reactor.rails.every((rail) => rail.meter === 0), true);
  assert.match(reactor.signalRows[0] ?? "", /000\/100/);
  assert.match(reactor.shareLine, /not published/);
});

test("vibe score mixer console shows the source to surface contract", () => {
  const receipt = buildVibeScoreReceipt(profile);
  const reactor = buildVibeScoreReactor(profile, receipt);
  const mixer = buildVibeScoreMixerConsole(profile, receipt, reactor);

  assert.equal(mixer.score, receipt.score);
  assert.equal(mixer.tier, receipt.tier);
  assert.equal(mixer.seal, reactor.seal);
  assert.match(mixer.headline, /Score mixer/);
  assert.match(mixer.subline, /four scoring rails/);
  assert.match(mixer.terminalLines.join("\n"), /SCORE-MIXER/);
  assert.match(mixer.terminalLines.join("\n"), /trust side rail -> context only -> \+0 score/);
  assert.deepEqual(mixer.lanes.map((lane) => lane.id), [
    "accepted-records",
    "daily-heatgrid",
    "provider-map",
    "freshness",
    "trust-side-rail",
    "public-surfaces",
  ]);
  assert.equal(mixer.lanes.every((lane) => lane.terminalLines.length >= 4), true);
  assert.equal(mixer.lanes.every((lane) => lane.meter >= 0 && lane.meter <= 100), true);
  assert.equal(mixer.lanes.find((lane) => lane.id === "trust-side-rail")?.status, "context");
  assert.equal(mixer.lanes.find((lane) => lane.id === "trust-side-rail")?.contribution, "+0 score");
  assert.match(mixer.lanes.find((lane) => lane.id === "trust-side-rail")?.note ?? "", /without changing it/);
  assert.equal(mixer.lanes.find((lane) => lane.id === "public-surfaces")?.status, "publishes");
  assert.ok(mixer.outputs.some((output) => output.label === "Heatgrid" && output.route === "daily://heatgrid"));
  assert.ok(mixer.outputs.some((output) => output.label === "Trust rail" && /NOT USAGE/.test(output.note)));
  assert.ok(mixer.invariants.some((invariant) => /Trust signals add \+0 score/.test(invariant)));
});

test("vibe score calibration chamber makes score mutation inspectable", () => {
  const receipt = buildVibeScoreReceipt(profile);
  const reactor = buildVibeScoreReactor(profile, receipt);
  const chamber = buildVibeScoreCalibrationChamber(profile, receipt, reactor);
  const trustStep = chamber.steps.find((step) => step.id === "trust-quarantine");
  const publishStep = chamber.steps.find((step) => step.id === "public-seal");

  assert.equal(chamber.score, receipt.score);
  assert.equal(chamber.tier, receipt.tier);
  assert.equal(chamber.seal, reactor.seal);
  assert.match(chamber.headline, /calibration chamber/i);
  assert.match(chamber.subline, /quarantined trust rail/);
  assert.equal(chamber.terminalLines.every((line) => line.length === 70), true);
  assert.match(chamber.terminalLines.join("\n"), /SCORE-CALIBRATION/);
  assert.match(chamber.terminalLines.join("\n"), /NOT-USAGE/);
  assert.match(chamber.terminalLines.join("\n"), /\+0 score/);
  assert.match(chamber.terminalLines.join("\n"), /public writes 0/);
  assert.match(chamber.terminalLines.join("\n"), /Vibers Unite/);
  assert.match(chamber.terminalLines.join("\n"), /c0vibe\.app/);
  assert.deepEqual(chamber.steps.map((step) => step.id), [
    "usage-mass",
    "daily-rhythm",
    "provider-breadth",
    "freshness-decay",
    "trust-quarantine",
    "public-seal",
  ]);
  assert.deepEqual(chamber.steps.map((step) => step.impact), [
    "score",
    "score",
    "score",
    "score",
    "not_usage",
    "publish",
  ]);
  assert.equal(chamber.steps.every((step) => step.frames.length === 3), true);
  assert.equal(chamber.steps.every((step) => step.checklist.length === 4), true);
  assert.equal(chamber.steps.every((step) => step.meter >= 0 && step.meter <= 100), true);
  assert.equal(chamber.totals.steps, 6);
  assert.equal(chamber.totals.scoreSteps, 4);
  assert.equal(chamber.totals.notUsage, 1);
  assert.equal(chamber.totals.publish, 1);
  assert.equal(chamber.totals.scoreDelta, receipt.score);
  assert.equal(chamber.totals.trustDelta, 0);
  assert.equal(chamber.totals.usageWrites, 0);
  assert.equal(chamber.totals.publicWrites, 0);
  assert.ok(chamber.totals.averageMeter > 0);
  assert.equal(trustStep?.delta, "+0 score");
  assert.equal(trustStep?.statusLabel, "NOT USAGE");
  assert.match(trustStep?.guardrail ?? "", /mutate score, spend, credits, ops, rank/);
  assert.equal(publishStep?.delta, "0 writes");
  assert.match(publishStep?.guardrail ?? "", /dry-run/);
});
