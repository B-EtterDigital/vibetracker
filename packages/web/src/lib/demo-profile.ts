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
// A curated top-viber sample: broad sources, a year-plus of history, media + local, and a
// six-figure coding spend, so it lands at Surge and renders every panel (a "fully unlocked board"
// per the design lock). Totals are derived from these rows, so the sum invariants hold by construction.
const PROVIDER_ROWS: ProfileView["providers"] = [
  { provider: "claude-code", ops: 5210, credits: 9800, usd: 24480 },
  { provider: "codex-cli", ops: 3900, credits: 6200, usd: 16400 },
  { provider: "higgsfield", ops: 1450, credits: 24000, usd: 19920 },
  { provider: "replicate", ops: 880, credits: 2900, usd: 6920 },
  { provider: "runway", ops: 610, credits: 5100, usd: 13680 },
  { provider: "kling", ops: 410, credits: 2400, usd: 6640 },
  { provider: "suno", ops: 920, credits: 3600, usd: 8560 },
  { provider: "elevenlabs", ops: 620, credits: 1300, usd: 3040 },
  { provider: "openrouter", ops: 2210, credits: 4100, usd: 7560 },
  { provider: "mistral", ops: 1140, credits: 1900, usd: 3520 },
  { provider: "ollama", ops: 2350, credits: 0, usd: 0 },
];

// Vibe Categories from each record's OWN category — Higgsfield's 1450 ops split across
// image/video/3d here, which a provider-primary rollup collapses into one. ops sum to
// TOTAL_OPS and usd to TOTAL_USD so the specialization panel never drifts from the board.
const CATEGORY_ROWS: ProfileView["categories"] = [
  { category: "coding", ops: 8000, credits: 16000, usd: 40000 },
  { category: "research", ops: 5000, credits: 6000, usd: 13000 },
  { category: "video", ops: 1530, credits: 17000, usd: 24800 },
  { category: "image", ops: 1580, credits: 12000, usd: 15200 },
  { category: "music", ops: 920, credits: 3600, usd: 8560 },
  { category: "3d", ops: 250, credits: 5400, usd: 4720 },
  { category: "audio", ops: 620, credits: 1300, usd: 3040 },
  { category: "other", ops: 1800, credits: 0, usd: 1400 },
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

// Per-provider daily series for the interactive chart: each provider's totals distributed across
// the 120 days with a provider-specific phase, so a clicked provider reads as its own distinct
// curve in the big chart. Illustrative — the combined exact-sum invariant lives in usageDays.
function demoProviderDays(): ProfileView["providerDays"] {
  const out: ProfileView["providerDays"] = [];
  PROVIDER_ROWS.forEach((row, j) => {
    const shape = Array.from({ length: DAYS }, (_unused, i) =>
      Math.max(0.1, rawDailyUsd(i) * (1 + 0.55 * Math.sin((2 * Math.PI * i) / DAYS + j * 1.7))));
    const usdCents = scaleToExactSum(shape, Math.round(row.usd * 100));
    const ops = scaleToExactSum(shape, row.ops);
    const credits = scaleToExactSum(shape, row.credits);
    for (let i = 0; i < DAYS; i += 1) {
      if (usdCents[i] <= 0 && ops[i] <= 0 && credits[i] <= 0) continue;
      out.push({ provider: row.provider, date: dayDate(i), ops: Math.max(0, ops[i]), credits: Math.max(0, credits[i]), usd: Math.max(0, usdCents[i]) / 100 });
    }
  });
  return out;
}

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
    // Music is billed by Suno but orchestrated in Cynaps3. The separate tool aggregate makes the
    // sample exercise the same no-double-count attribution contract as a real v2 usage export.
    tools: PROVIDER_ROWS.map((row) => ({
      tool: row.provider === "suno" ? "cynaps3" : row.provider,
      ops: row.ops,
    })),
    usageDays: usdCents.map((cents, i) => ({ date: dayDate(i), ops: ops[i], credits: credits[i], usd: cents / 100 })),
    categories: CATEGORY_ROWS.map((row) => ({ ...row })),
    providerDays: demoProviderDays(),
    providerModels: [],
    nativeMetrics: [
      { provider: "suno", category: "music", outputUnit: "track", outputs: 1840, durationSeconds: 496_800 },
    ],
    trustSignals: structuredClone(TRUST_SIGNALS),
    // Sample token-breakdown + cross-provider delegation so /u/demo showcases those panels. Whole
    // numbers, cache-read dominant (the honest agentic-coding signature), a two-agent orchestration.
    totalTokens: 61_400_000_000,
    crossProviderDays: 22,
    tokenBreakdown: [
      { scope: "total", input: 2_100_000_000, output: 190_000_000, cacheRead: 58_600_000_000, cacheCreation: 510_000_000 },
      { scope: "codex", input: 1_300_000_000, output: 110_000_000, cacheRead: 39_000_000_000, cacheCreation: 300_000_000 },
      { scope: "claude-code", input: 800_000_000, output: 80_000_000, cacheRead: 19_600_000_000, cacheCreation: 210_000_000 },
    ],
    agents: [
      { agent: "codex", activeDays: 74, cost: 16_400, tokens: 40_000_000_000 },
      { agent: "claude", activeDays: 38, cost: 24_480, tokens: 20_800_000_000 },
      { agent: "gemini", activeDays: 9, cost: 120, tokens: 600_000_000 },
    ],
    rank: 3,
  };
}
