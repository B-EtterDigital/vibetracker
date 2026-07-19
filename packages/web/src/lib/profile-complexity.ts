// Pure complexity/persona engine: maps a public ProfileView onto a signal tier, a deterministic
// panel reveal plan, tier progress, and a maker identity. Zero I/O, zero side effects, no clock —
// every read is a pure function of (profile, registry) so the profile page and its tests agree.

import type { ProfileView } from "./data";
import type { ProviderDescriptor } from "../../../adapters/src/index";
import { profileOps } from "./profile-ops.ts";

// Five signal tiers, an energy ladder. Deliberately hard: Supernova (85+) needs a footprint far
// beyond even a heavy multi-tool user, so it stays top-percentile rather than a default finish line.
export type SignalTier = "ember" | "spark" | "current" | "surge" | "supernova";
const TIER_RANK: Readonly<Record<SignalTier, number>> = { ember: 0, spark: 1, current: 2, surge: 3, supernova: 4 };

export interface ComplexityFacts {
  providers: number;
  categories: number;
  days: number;
  usd: number;
  ops: number;
  hasLocal: boolean;
  hasMedia: boolean;
}

export interface RevealPlan {
  chart: boolean;
  providerMix: boolean;
  categoryMix: boolean;
  insights: boolean;
  rhythm: boolean;
  trust: boolean;
}

export interface ComplexityRead {
  tier: SignalTier;
  score: number;
  facts: ComplexityFacts;
  reveal: RevealPlan;
  hint: string;
  progress: { pct: number; nextTier: SignalTier | null; pointsToNext: number | null; unlocksNext: string[]; grow: string[] };
  identity: { kind: "specialist" | "dual" | "allrounder" | "forming"; label: string; topCategory: string | null; topShare: number; fields: number };
}

// Local-runner ids that read as $0 / GPU-time signals even when their registry row carries no
// dedicated category tag. "llama-cpp" is the live registry id; "llamacpp" stays as a spec alias.
const LOCAL_IDS: ReadonlySet<string> = new Set(["ollama", "lmstudio", "comfyui", "llamacpp", "llama-cpp", "vllm", "jan", "gpt4all"]);

// Primary categories that read as generative media (drives the media reveal + score nudge).
const MEDIA_PRIMARY: ReadonlySet<string> = new Set(["image", "video", "music", "audio", "3d"]);

const HINTS: Readonly<Record<SignalTier, string>> = {
  ember: "ember signal: a first spark of tracked usage. the board grows with every sync.",
  spark: "spark signal: a real, multi-source footprint taking shape.",
  current: "current signal: steady, multi-domain AI usage flowing.",
  surge: "surge signal: deep, wide, high-volume creation. rare air.",
  supernova: "supernova signal: a top-percentile viber across every axis. full instrumentation.",
};

type UpgradeTier = "spark" | "current" | "surge" | "supernova";
const NEXT_TIER: Readonly<Record<SignalTier, UpgradeTier | null>> = {
  ember: "spark", spark: "current", current: "surge", surge: "supernova", supernova: null,
};

// Score floors where each upgraded tier begins (must mirror tierForScore's edges). Uneven on
// purpose: Surge spans a wide 60-84 band (a heavy user lands here) and Supernova starts at 85.
const TIER_FLOOR: Readonly<Record<UpgradeTier, number>> = { spark: 20, current: 40, surge: 60, supernova: 85 };

// What the next tier turns on, phrased for the profile page's progress rail.
const NEXT_UNLOCKS: Readonly<Record<UpgradeTier, readonly string[]>> = {
  spark: ["usage over time", "usage insights"],
  current: ["specialization mix"],
  surge: ["sync rhythm", "trust signals"],
  supernova: ["the supernova mark"],
};

interface MatchedProvider {
  usage: ProfileView["providers"][number];
  descriptor: ProviderDescriptor;
}

// Primary category = the descriptor's first category, or "other" when the row lists none.
function primaryCategory(descriptor: ProviderDescriptor): string {
  return descriptor.categories[0] ?? "other";
}

function sumBy<T>(items: readonly T[], pick: (item: T) => number): number {
  return items.reduce((total, item) => total + pick(item), 0);
}

// A registry row is local when it is tagged with a (future) "local" category or its id is a known
// local runner. The category branch is forward-compat: today's Category union has no "local"
// member, so the id set is the live path — hence the widening to readonly string[].
function isLocalDescriptor(descriptor: ProviderDescriptor): boolean {
  return (descriptor.categories as readonly string[]).includes("local") || LOCAL_IDS.has(descriptor.id);
}

// Join each profile provider to its registry descriptor by id. Unmatched providers drop out here,
// so they contribute no categories, carry no identity weight, and are never local or media.
function matchProviders(profile: ProfileView, registry: readonly ProviderDescriptor[]): MatchedProvider[] {
  return profile.providers.flatMap((usage) => {
    const descriptor = registry.find((candidate) => candidate.id === usage.provider);
    return descriptor ? [{ usage, descriptor }] : [];
  });
}

function readFacts(profile: ProfileView, matched: readonly MatchedProvider[]): ComplexityFacts {
  const descriptors = matched.map((pair) => pair.descriptor);
  return {
    providers: profile.providers.length,
    // True per-record categories when present (a single provider can span several); the
    // provider-primary set is the fallback for submissions that predate the category rollup.
    categories: profile.categories.length > 0
      ? profile.categories.length
      : new Set(descriptors.map(primaryCategory)).size,
    days: profile.usageDays.filter((day) => day.ops > 0 || day.usd > 0 || day.credits > 0).length,
    // usd/ops prefer the reviewed submission totals; the provider sum is the fallback and spans
    // every provider row (matched or not) because spend is spend regardless of registry coverage.
    usd: profile.latest?.total_usd ?? sumBy(profile.providers, (provider) => provider.usd),
    ops: profileOps(profile),
    hasLocal: descriptors.some(isLocalDescriptor),
    hasMedia: descriptors.some((descriptor) => MEDIA_PRIMARY.has(primaryCategory(descriptor))),
  };
}

// Additive, deterministic score, deliberately hard to top out. Max band sum is exactly 100 and the
// clamp is a hard ceiling. Reference: a heavy multi-tool viber (~9 sources, 7 categories, ~330 days,
// ~$200k coding, media, no local runner) scores ~60 — Surge, high but a full band below Supernova.
function scoreFacts(facts: ComplexityFacts): number {
  let score = 0;

  // Breadth of sources — max 25.
  if (facts.providers >= 20) score += 25;
  else if (facts.providers >= 12) score += 18;
  else if (facts.providers >= 8) score += 15;
  else if (facts.providers >= 4) score += 9;
  else if (facts.providers >= 2) score += 4;

  // Range of making (categories) — max 20; the full eight-category sweep is required to top it.
  if (facts.categories >= 8) score += 20;
  else if (facts.categories >= 6) score += 15;
  else if (facts.categories >= 4) score += 9;
  else if (facts.categories >= 2) score += 4;

  // Tenure — max 20; two years of history is the ceiling.
  if (facts.days >= 730) score += 20;
  else if (facts.days >= 365) score += 15;
  else if (facts.days >= 180) score += 12;
  else if (facts.days >= 90) score += 6;
  else if (facts.days >= 30) score += 2;

  // Scale of spend — max 20; a seven-figure spend is the ceiling.
  if (facts.usd >= 1_000_000) score += 20;
  else if (facts.usd >= 250_000) score += 15;
  else if (facts.usd >= 100_000) score += 12;
  else if (facts.usd >= 25_000) score += 7;
  else if (facts.usd >= 5_000) score += 3;
  else if (facts.usd >= 500) score += 1;

  // Volume of operations — max 8.
  if (facts.ops >= 100_000) score += 8;
  else if (facts.ops >= 25_000) score += 6;
  else if (facts.ops >= 5_000) score += 4;
  else if (facts.ops >= 1_000) score += 3;
  else if (facts.ops >= 100) score += 1;

  // Range bonuses — max 7.
  if (facts.hasMedia) score += 3;
  if (facts.hasLocal) score += 4;

  return Math.min(100, score);
}

function tierForScore(score: number): SignalTier {
  if (score >= 85) return "supernova";
  if (score >= 60) return "surge";
  if (score >= 40) return "current";
  if (score >= 20) return "spark";
  return "ember";
}

function planReveal(tier: SignalTier, facts: ComplexityFacts, trustCount: number): RevealPlan {
  const rank = TIER_RANK[tier];
  const atLeast = (t: SignalTier) => rank >= TIER_RANK[t];
  return {
    // Ember earns the chart only after a week of history; Spark and up always show it.
    chart: atLeast("spark") || facts.days >= 7,
    providerMix: true,
    insights: atLeast("spark"),
    categoryMix: atLeast("current"),
    rhythm: atLeast("surge"),
    // Trust opens at Surge but still needs at least one public trust signal to render.
    trust: atLeast("surge") && trustCount > 0,
  };
}

// Growth hints are breadth/consistency only, fixed breadth-first priority (days, sources, categories), capped at two. Spend-based
// hints (usd/ops) are deliberately excluded: tier progress must never be a pay-to-rank incentive.
function growHints(facts: ComplexityFacts): string[] {
  const grow: string[] = [];
  if (facts.days < 30) grow.push("more days of history");
  if (facts.providers < 6) grow.push("more connected sources");
  if (facts.categories < 3) grow.push("more categories of making");
  return grow.slice(0, 2);
}

function readProgress(tier: SignalTier, score: number, facts: ComplexityFacts): ComplexityRead["progress"] {
  const nextTier = NEXT_TIER[tier];
  return {
    pct: score,
    nextTier,
    pointsToNext: nextTier === null ? null : TIER_FLOOR[nextTier] - score,
    unlocksNext: nextTier === null ? [] : [...NEXT_UNLOCKS[nextTier]],
    grow: growHints(facts),
  };
}

// Per-primary-category totals for the identity read. Zero amounts never open a bucket, so the
// bucket count is exactly the number of categories carrying weight (`fields`).
function bucketByPrimary(matched: readonly MatchedProvider[], pick: (usage: MatchedProvider["usage"]) => number): Map<string, number> {
  const totals = new Map<string, number>();
  for (const { usage, descriptor } of matched) {
    const amount = pick(usage);
    if (amount > 0) {
      const key = primaryCategory(descriptor);
      totals.set(key, (totals.get(key) ?? 0) + amount);
    }
  }
  return totals;
}

// Maker identity comes from activity, never spend. Operations lead; providers that expose
// credits instead of operation counts fall back to credit weight so their work still resolves.
// The true per-record category rollup (profile.categories) is preferred when present, so the
// identity headline matches the specialization panel exactly and stays correct even when a
// provider id is missing from the registry (which would otherwise drop its ops from the read).
function readIdentity(matched: readonly MatchedProvider[], categories: ProfileView["categories"]): ComplexityRead["identity"] {
  const categoryBuckets = new Map<string, number>();
  for (const row of categories) {
    if (row.ops > 0) categoryBuckets.set(row.category, (categoryBuckets.get(row.category) ?? 0) + row.ops);
  }
  const opsBuckets = categoryBuckets.size > 0 ? categoryBuckets : bucketByPrimary(matched, (usage) => usage.ops);
  const buckets = opsBuckets.size > 0 ? opsBuckets : bucketByPrimary(matched, (usage) => usage.credits);
  if (buckets.size === 0) {
    return { kind: "forming", label: "signal forming", topCategory: null, topShare: 0, fields: 0 };
  }

  // Rank by total descending, alphabetical on ties, so top/dual picks are fully deterministic.
  const ranked = [...buckets.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  const totalAll = sumBy(ranked, ([, total]) => total);
  const share = (total: number) => Math.round((total / totalAll) * 100);
  const [topCategory, topTotal] = ranked[0];
  const topShare = share(topTotal);
  const fields = ranked.length;
  const runnerUp = ranked[1];
  const base = { topCategory, topShare, fields };

  if (topShare >= 60) return { kind: "specialist", label: `${topCategory} specialist`, ...base };
  if (runnerUp && topShare >= 35 && share(runnerUp[1]) >= 35) {
    return { kind: "dual", label: `dual-wield: ${topCategory} + ${runnerUp[0]}`, ...base };
  }
  if (fields >= 3) return { kind: "allrounder", label: `allrounder across ${fields} fields`, ...base };
  // Defensive floor so every profile still resolves to a presentable label: a single field always
  // reads specialist (its 100% share short-circuits above); any other low-spread split reads dual.
  if (!runnerUp) return { kind: "specialist", label: `${topCategory} specialist`, ...base };
  return { kind: "dual", label: `dual-wield: ${topCategory} + ${runnerUp[0]}`, ...base };
}

export function readComplexity(profile: ProfileView, registry: readonly ProviderDescriptor[]): ComplexityRead {
  const matched = matchProviders(profile, registry);
  const facts = readFacts(profile, matched);
  const score = scoreFacts(facts);
  const tier = tierForScore(score);
  const reveal = planReveal(tier, facts, profile.trustSignals.length);
  return { tier, score, facts, reveal, hint: HINTS[tier], progress: readProgress(tier, score, facts), identity: readIdentity(matched, profile.categories) };
}
