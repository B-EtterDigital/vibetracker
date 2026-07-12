// Pure complexity/persona engine: maps a public ProfileView onto a signal tier, a deterministic
// panel reveal plan, tier progress, and a maker identity. Zero I/O, zero side effects, no clock —
// every read is a pure function of (profile, registry) so the profile page and its tests agree.

import type { ProfileView } from "./data";
import type { ProviderDescriptor } from "../../../adapters/src/index";

export type SignalTier = "fresh" | "operator" | "supernova";

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
  fresh: "fresh signal: a few sources, early days. The board grows with every sync.",
  operator: "operator signal: steady, multi-source AI usage.",
  supernova: "supernova signal: deep, multi-domain AI usage. Full instrumentation unlocked.",
};

const NEXT_TIER: Readonly<Record<SignalTier, "operator" | "supernova" | null>> = { fresh: "operator", operator: "supernova", supernova: null };

// Score floors where each upgraded tier begins (must mirror tierForScore's edges).
const TIER_FLOOR: Readonly<Record<"operator" | "supernova", number>> = { operator: 30, supernova: 65 };

// Panels the next tier turns on, phrased for the profile page's progress rail.
const NEXT_UNLOCKS: Readonly<Record<"operator" | "supernova", readonly string[]>> = {
  operator: ["usage insights", "category mix"],
  supernova: ["sync rhythm", "trust signals"],
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
    days: profile.usageDays.length,
    // usd/ops prefer the reviewed submission totals; the provider sum is the fallback and spans
    // every provider row (matched or not) because spend is spend regardless of registry coverage.
    usd: profile.latest?.total_usd ?? sumBy(profile.providers, (provider) => provider.usd),
    ops: profile.latest?.record_count ?? sumBy(profile.providers, (provider) => provider.ops),
    hasLocal: descriptors.some(isLocalDescriptor),
    hasMedia: descriptors.some((descriptor) => MEDIA_PRIMARY.has(primaryCategory(descriptor))),
  };
}

// Additive, deterministic score. Every band is a multiple of 5, so the reachable score grid is
// {0,5,...,100}; the maximum band sum is exactly 100 and the clamp is a hard ceiling.
function scoreFacts(facts: ComplexityFacts): number {
  let score = 0;

  if (facts.providers >= 6) score += 25;
  else if (facts.providers >= 3) score += 15;

  if (facts.categories >= 3) score += 20;
  else if (facts.categories === 2) score += 10;

  if (facts.days >= 30) score += 20;
  else if (facts.days >= 7) score += 10;

  if (facts.usd >= 100) score += 15;
  else if (facts.usd >= 10) score += 10;

  if (facts.ops >= 1000) score += 10;
  if (facts.hasLocal) score += 5;
  if (facts.hasMedia) score += 5;

  return Math.min(100, score);
}

function tierForScore(score: number): SignalTier {
  if (score >= 65) return "supernova";
  if (score >= 30) return "operator";
  return "fresh";
}

function planReveal(tier: SignalTier, facts: ComplexityFacts, trustCount: number): RevealPlan {
  if (tier === "supernova") {
    // Every panel opens; trust additionally requires at least one public trust signal.
    return { chart: true, providerMix: true, categoryMix: true, insights: true, rhythm: true, trust: trustCount > 0 };
  }
  if (tier === "operator") {
    return { chart: true, providerMix: true, categoryMix: true, insights: true, rhythm: false, trust: false };
  }
  // fresh: hold everything back except the provider mix; the chart waits for a week of history.
  return { chart: facts.days >= 7, providerMix: true, categoryMix: false, insights: false, rhythm: false, trust: false };
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
