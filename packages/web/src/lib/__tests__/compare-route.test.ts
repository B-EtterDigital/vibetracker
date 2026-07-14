import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildCompareParticipant,
  buildPublicComparison,
  sanitizeCompareHandle,
} from "../../app/compare/compare-model.ts";
import type { ProfileView } from "../data.ts";

const leftProfile: ProfileView = {
  handle: "left-viber",
  created_at: "2026-07-01T00:00:00Z",
  isPremium: true,
  identityVerified: true,
  identityProvider: "github",
  accountLinked: false,
  latest: {
    total_usd: 20,
    total_credits: 90,
    record_count: 2,
    created_at: "2026-07-14T00:00:00Z",
    tier: "attested",
  },
  providers: [
    { provider: "codex", ops: 1200, credits: 50, usd: 12 },
    { provider: "claude-code", ops: 800, credits: 40, usd: 8 },
  ],
  usageDays: [
    { date: "2026-07-13", ops: 900, credits: 40, usd: 9 },
    { date: "2026-07-14", ops: 1100, credits: 50, usd: 11 },
  ],
  categories: [],
  providerDays: [],
  providerModels: [],
  trustSignals: [{ kind: "github_activity" } as ProfileView["trustSignals"][number]],
  totalTokens: 2_000_000,
  rank: 1,
};

const rightProfile: ProfileView = {
  ...leftProfile,
  handle: "right-viber",
  identityVerified: false,
  identityProvider: undefined,
  latest: {
    total_usd: 5,
    total_credits: 20,
    record_count: 500,
    created_at: "2026-07-13T00:00:00Z",
    tier: "self_reported",
  },
  providers: [
    { provider: "codex", ops: 300, credits: 12, usd: 3 },
    { provider: "higgsfield", ops: 200, credits: 8, usd: 2 },
  ],
  usageDays: [{ date: "2026-07-13", ops: 500, credits: 20, usd: 5 }],
  trustSignals: [],
  totalTokens: 500_000,
  rank: 3,
};

test("comparison handle sanitizer accepts public handles and falls back on unsafe input", () => {
  assert.equal(sanitizeCompareHandle(" @B-EtterDigital ", "fallback"), "b-etterdigital");
  assert.equal(sanitizeCompareHandle(["cyrill_etter"], "fallback"), "cyrill_etter");
  assert.equal(sanitizeCompareHandle("../private", "fallback"), "fallback");
  assert.equal(sanitizeCompareHandle("-leading", "fallback"), "fallback");
  assert.equal(sanitizeCompareHandle(undefined, "fallback"), "fallback");
});

test("comparison participant uses authoritative provider operations instead of row count", () => {
  const participant = buildCompareParticipant(leftProfile);

  assert.equal(participant.operations, 2000);
  assert.equal(leftProfile.latest?.record_count, 2);
  assert.equal(participant.identityLabel, "GITHUB VERIFIED");
  assert.equal(participant.evidenceTier, "ATTESTED");
  assert.equal(participant.rankLabel, "#1 ON ATTESTED BOARD");
  assert.match(participant.fingerprint, /^[A-F0-9]{8}$/);
});

test("public comparison separates comparable usage from cross-tier rank", () => {
  const snapshot = buildPublicComparison(leftProfile, rightProfile);

  assert.equal(snapshot.crossTier, true);
  assert.match(snapshot.comparisonStatus, /RANKS STAY ON SEPARATE EVIDENCE BOARDS/);
  assert.match(snapshot.fingerprint, /^[A-F0-9]{8}$/);
  assert.equal(snapshot.metricRows.length, 6);
  assert.deepEqual(snapshot.metricRows.map((metric) => metric.id), ["operations", "spend", "score", "providers", "activeDays", "credits"]);
  assert.equal(snapshot.metricRows[0].leftValue, 2000);
  assert.equal(snapshot.metricRows[0].rightValue, 500);
  assert.equal(snapshot.metricRows[0].deltaLabel, "LEFT +1,500");
  assert.equal(snapshot.commonProviders, 1);
  assert.equal(snapshot.leftOnlyProviders, 1);
  assert.equal(snapshot.rightOnlyProviders, 1);
  assert.equal(snapshot.providerRows.find((provider) => provider.provider === "codex")?.presence, "shared");
  assert.equal(snapshot.providerRows.find((provider) => provider.provider === "claude-code")?.presence, "left_only");
  assert.equal(snapshot.providerRows.find((provider) => provider.provider === "higgsfield")?.presence, "right_only");
  assert.match(snapshot.receipt, /rank_comparison blocked_cross_tier/);
  assert.match(snapshot.receipt, /NOT USAGE \/ \+0 SCORE/);
  assert.match(snapshot.guardrails.join("\n"), /never declares a rank winner/);
  assert.match(snapshot.guardrails.join("\n"), /prompts, outputs, secrets, raw files/);
});

test("same-tier comparison permits board context without recalculating rank", () => {
  const snapshot = buildPublicComparison(leftProfile, {
    ...rightProfile,
    latest: { ...rightProfile.latest!, tier: "attested" },
  });

  assert.equal(snapshot.crossTier, false);
  assert.match(snapshot.comparisonStatus, /SHARE THE SAME EVIDENCE TIER/);
  assert.match(snapshot.receipt, /rank_comparison same_tier/);
  assert.match(snapshot.guardrails.join("\n"), /not recalculated here/);
});

test("compare route is real, discoverable, interactive, responsive, and honest when data is missing", () => {
  const page = readFileSync("packages/web/src/app/compare/page.tsx", "utf8");
  const model = readFileSync("packages/web/src/app/compare/compare-model.ts", "utf8");
  const lab = readFileSync("packages/web/src/app/compare/compare-lab.tsx", "utf8");
  const styles = readFileSync("packages/web/src/app/compare/compare.css", "utf8");
  const responsive = readFileSync("packages/web/src/app/compare/compare-responsive.css", "utf8");
  const layout = readFileSync("packages/web/src/app/layout.tsx", "utf8");

  assert.match(layout, /href="\/compare" title="Compare two real public usage receipts/);
  assert.match(layout, /Compare lab<small>two public receipts on one scope/);
  assert.match(page, /Promise\.allSettled/);
  assert.match(page, /getProfile\(leftHandle\)/);
  assert.match(page, /getProfile\(rightHandle\)/);
  assert.match(page, /buildPublicComparison/);
  assert.match(page, /result\.value\?\.latest/);
  assert.doesNotMatch(page, /buildDemoProfile|DEMO_HANDLE/);
  assert.match(model, /profileOps\(profile\)/);
  assert.match(model, /buildVibeScoreReceipt\(profile\)/);
  assert.match(model, /buildProfileBlackBoxReplay\(profile\)/);
  assert.match(model, /blocked_cross_tier/);
  assert.match(model, /NOT USAGE/);
  assert.match(model, /PRIVACY/);
  assert.match(lab, /role="tablist"/);
  assert.match(lab, /role="tabpanel"/);
  assert.match(lab, /aria-selected/);
  assert.match(lab, /ArrowLeft/);
  assert.match(lab, /navigator\.clipboard\.writeText\(snapshot\.receipt\)/);
  assert.match(lab, /fabricated operations 0/);
  assert.match(lab, /fabricated rank winners 0/);
  assert.match(lab, /No cached values substituted/);
  assert.match(lab, /Filter provider rows/);
  assert.match(styles, /\.compare-overview/);
  assert.match(styles, /\.compare-provider-row/);
  assert.match(styles, /\.compare-evidence/);
  assert.match(responsive, /@media \(max-width: 640px\)/);
  assert.match(responsive, /@media \(min-width: 2200px\)/);
  assert.match(responsive, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(styles + responsive, /gradient\(/);
  assert.doesNotMatch(lab, /dangerouslySetInnerHTML/);
});
