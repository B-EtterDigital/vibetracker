// Deterministic demo profile: the fixture rendered at /u/demo so every visitor sees a fully
// unlocked board. Anchored to a FIXED last day ("2026-07-01") instead of the wall clock — no
// Date.now, no Math.random — so builds, tests, and screenshots produce byte-identical data.

import type { ProfileView } from "./data";
import type { ProfileTrustSignal } from "./profile-trust";

export const DEMO_HANDLE = "demo";

const ANCHOR_DAY_UTC = Date.UTC(2026, 6, 1); // 2026-07-01, the last (and busiest-labelled) day
const DAY_MS = 86_400_000;
const DAYS = 120;

// Per-provider verbatim targets (usd / credits / ops). Every id must exist in the real adapter
// registry; "codex-cli" is the live registry id for Codex (same hyphenation fix as llama-cpp).
const PROVIDER_ROWS: ProfileView["providers"] = [
  { provider: "claude-code", ops: 5210, credits: 9800, usd: 612 },
  { provider: "codex-cli", ops: 3900, credits: 6200, usd: 410 },
  { provider: "higgsfield", ops: 1450, credits: 24000, usd: 498 },
  { provider: "replicate", ops: 880, credits: 2900, usd: 173 },
  { provider: "runway", ops: 610, credits: 5100, usd: 342 },
  { provider: "kling", ops: 410, credits: 2400, usd: 166 },
  { provider: "suno", ops: 920, credits: 3600, usd: 214 },
  { provider: "elevenlabs", ops: 620, credits: 1300, usd: 76 },
  { provider: "openrouter", ops: 2210, credits: 4100, usd: 189 },
  { provider: "mistral", ops: 1140, credits: 1900, usd: 88 },
  { provider: "ollama", ops: 2350, credits: 0, usd: 0 },
];

// latest is BY CONSTRUCTION the sum of the provider rows, so the board's total, the provider
// bars, and the daily series can never drift apart.
const TOTAL_USD = PROVIDER_ROWS.reduce((sum, row) => sum + row.usd, 0); // 2768
const TOTAL_CREDITS = PROVIDER_ROWS.reduce((sum, row) => sum + row.credits, 0); // 61300
const TOTAL_OPS = PROVIDER_ROWS.reduce((sum, row) => sum + row.ops, 0); // 19700

// Raw daily usd shape before rescaling: an $8 base, a long sine ramp peaking mid-series, a weekly
// rhythm (+40% on weekday residues 2 and 4, -55% on 0 and 6), and two deliberate spike days.
function rawDailyUsd(i: number): number {
  if (i === 87) return 96.4;
  if (i === 112) return 84.2;
  let usd = 8 + 14 * Math.max(0, Math.sin((Math.PI * i) / (DAYS - 1))) ** 1.4;
  if (i % 7 === 2 || i % 7 === 4) usd *= 1.4;
  if (i % 7 === 0 || i % 7 === 6) usd *= 0.45;
  return Math.round(usd * 100) / 100;
}

// INVARIANT: the usageDays series sums to the latest totals EXACTLY (integer cents for usd, whole
// units for ops/credits). One constant factor rescales the raw series onto the target; the tiny
// integer residual left by per-element rounding is folded into the largest element (a spike day)
// so the sum lands on the target to the exact unit. Tests assert this invariant.
function scaleToExactSum(raw: readonly number[], targetUnits: number): number[] {
  const rawSum = raw.reduce((sum, value) => sum + value, 0);
  const factor = targetUnits / rawSum;
  const scaled = raw.map((value) => Math.round(value * factor));
  const residual = targetUnits - scaled.reduce((sum, value) => sum + value, 0);
  let largest = 0;
  for (let i = 1; i < scaled.length; i += 1) {
    if (scaled[i] > scaled[largest]) largest = i;
  }
  scaled[largest] += residual;
  return scaled;
}

function dayDate(i: number): string {
  return new Date(ANCHOR_DAY_UTC - (DAYS - 1 - i) * DAY_MS).toISOString().slice(0, 10);
}

// Exactly two public trust signals, shaped to pass profile-trust's isProfileTrustSignal guard
// (github_activity requires source github_cli + a days array; creator_activity requires manual
// source + metric). Labels and notes are the exact literal strings from the TrustSignal types.
const TRUST_SIGNALS: ProfileTrustSignal[] = [
  {
    kind: "github_activity",
    source: "github_cli",
    label: "GitHub activity evidence (not AI usage)",
    handle: DEMO_HANDLE,
    fetchedAt: "2026-07-01T12:00:00Z",
    from: "2026-04-03",
    to: "2026-07-01",
    windowDays: 90,
    totalContributions: 847,
    commitContributions: 512,
    issueContributions: 96,
    pullRequestContributions: 141,
    pullRequestReviewContributions: 60,
    repositoryContributions: 38,
    days: [
      { date: "2026-06-25", count: 3, level: 1 },
      { date: "2026-06-26", count: 7, level: 3 },
      { date: "2026-06-27", count: 0, level: 0 },
      { date: "2026-06-28", count: 12, level: 4 },
      { date: "2026-06-29", count: 5, level: 2 },
      { date: "2026-06-30", count: 9, level: 3 },
      { date: "2026-07-01", count: 4, level: 2 },
    ],
    confidence: "activity_evidence",
    affectsTotals: false,
    usageVerified: false,
    note: "Activity evidence only. Not counted as usage, spend, credits, or verified provider data.",
  },
  {
    kind: "creator_activity",
    source: "manual",
    label: "Creator activity evidence (not AI usage)",
    platform: "youtube",
    handle: DEMO_HANDLE,
    metric: "AI shorts published",
    count: 24,
    fetchedAt: "2026-07-01T12:00:00Z",
    windowDays: 90,
    confidence: "activity_evidence",
    affectsTotals: false,
    usageVerified: false,
    note: "Creator/public activity evidence only. Not counted as usage, spend, credits, or verified provider data.",
  },
];

// The 120-day series starts on 2026-03-04, which is also the account's created_at date, so the
// demo story is coherent: tracking began the day the account appeared.
export function buildDemoProfile(): ProfileView {
  const rawUsd = Array.from({ length: DAYS }, (_unused, i) => rawDailyUsd(i));
  const usdCents = scaleToExactSum(rawUsd, TOTAL_USD * 100);
  const ops = scaleToExactSum(rawUsd.map((usd) => Math.round(usd * 7)), TOTAL_OPS);
  const credits = scaleToExactSum(rawUsd.map((usd) => Math.round(usd * 18)), TOTAL_CREDITS);

  return {
    handle: DEMO_HANDLE,
    created_at: "2026-03-04T09:00:00Z",
    isPremium: false,
    latest: {
      total_usd: TOTAL_USD,
      total_credits: TOTAL_CREDITS,
      record_count: TOTAL_OPS,
      created_at: "2026-07-01T12:00:00Z",
      tier: "self_reported",
    },
    // Fresh copies on every call so callers can never mutate the module's fixtures.
    providers: PROVIDER_ROWS.map((row) => ({ ...row })),
    usageDays: usdCents.map((cents, i) => ({ date: dayDate(i), ops: ops[i], credits: credits[i], usd: cents / 100 })),
    trustSignals: structuredClone(TRUST_SIGNALS),
  };
}
