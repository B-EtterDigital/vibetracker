// Pure complexity/persona engine: maps a public ProfileView onto a signal tier and a
// deterministic panel reveal plan. Zero I/O, zero side effects, no clock — the read is a pure
// function of (profile, registry) so the profile page and its tests always agree exactly.

import type { ProfileView } from "./data";
import type { ProviderDescriptor } from "../../../adapters/src/registry";

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
}

// Local-runner ids that read as $0 / GPU-time signals even when their registry row carries no
// dedicated category tag. "llama-cpp" is the live registry id; "llamacpp" stays as a spec alias.
const LOCAL_IDS: ReadonlySet<string> = new Set([
  "ollama",
  "lmstudio",
  "comfyui",
  "llamacpp",
  "llama-cpp",
  "vllm",
  "jan",
  "gpt4all",
]);

// Primary categories that read as generative media (drives the media reveal + score nudge).
const MEDIA_PRIMARY: ReadonlySet<string> = new Set(["image", "video", "music", "audio", "3d"]);

const HINTS: Readonly<Record<SignalTier, string>> = {
  fresh: "fresh signal: a few sources, early days. The board grows with every sync.",
  operator: "operator signal: steady, multi-source AI usage.",
  supernova: "supernova signal: deep, multi-domain AI usage. Full instrumentation unlocked.",
};

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
// so they contribute no categories and are never counted as local or media.
function matchedDescriptors(
  profile: ProfileView,
  registry: readonly ProviderDescriptor[],
): ProviderDescriptor[] {
  return profile.providers
    .map((provider) => registry.find((descriptor) => descriptor.id === provider.provider))
    .filter((descriptor): descriptor is ProviderDescriptor => descriptor !== undefined);
}

function readFacts(profile: ProfileView, registry: readonly ProviderDescriptor[]): ComplexityFacts {
  const matched = matchedDescriptors(profile, registry);
  const distinctPrimary = new Set(matched.map(primaryCategory));

  return {
    providers: profile.providers.length,
    categories: distinctPrimary.size,
    days: profile.usageDays.length,
    // usd/ops prefer the reviewed submission totals; the provider sum is the fallback and spans
    // every provider row (matched or not) because spend is spend regardless of registry coverage.
    usd: profile.latest?.total_usd ?? sumBy(profile.providers, (provider) => provider.usd),
    ops: profile.latest?.record_count ?? sumBy(profile.providers, (provider) => provider.ops),
    hasLocal: matched.some(isLocalDescriptor),
    hasMedia: matched.some((descriptor) => MEDIA_PRIMARY.has(primaryCategory(descriptor))),
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

export function readComplexity(profile: ProfileView, registry: readonly ProviderDescriptor[]): ComplexityRead {
  const facts = readFacts(profile, registry);
  const score = scoreFacts(facts);
  const tier = tierForScore(score);
  const reveal = planReveal(tier, facts, profile.trustSignals.length);
  return { tier, score, facts, reveal, hint: HINTS[tier] };
}
