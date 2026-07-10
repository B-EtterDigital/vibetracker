import { test } from "node:test";
import assert from "node:assert/strict";
import { readComplexity } from "../profile-complexity.ts";
import type { ProviderDescriptor } from "../../../../adapters/src/registry.ts";
import type { ProfileView } from "../data.ts";

// --- fixture builders (fake descriptors only; the real registry is never imported) ---

function descriptor(id: string, categories: ProviderDescriptor["categories"]): ProviderDescriptor {
  return { id, label: id.toUpperCase(), domain: "ai", categories, tier: "ledger", auth: "apiKey", status: "built", verified: false, method: "test fixture" };
}

function usage(provider: string, ops = 0, usd = 0): ProfileView["providers"][number] {
  return { provider, ops, credits: 0, usd };
}

function latest(total_usd: number, record_count: number): ProfileView["latest"] {
  return { total_usd, total_credits: 0, record_count, created_at: "2026-01-01T00:00:00.000Z", tier: "self_reported" };
}

function days(count: number): ProfileView["usageDays"] {
  return Array.from({ length: count }, (_unused, index) => ({ date: `2026-03-${String((index % 27) + 1).padStart(2, "0")}`, ops: 1, credits: 0, usd: 0 }));
}

// The engine only reads trustSignals.length, so a count-only fixture is the correct test scope.
function trustSignals(count: number): ProfileView["trustSignals"] {
  return Array.from({ length: count }, () => ({}) as ProfileView["trustSignals"][number]);
}

function profile(overrides: Partial<ProfileView> = {}): ProfileView {
  return { handle: "tester", created_at: "2026-01-01T00:00:00.000Z", isPremium: false, latest: null, providers: [], usageDays: [], trustSignals: [], ...overrides };
}

const HINT = {
  fresh: "fresh signal: a few sources, early days. The board grows with every sync.",
  operator: "operator signal: steady, multi-source AI usage.",
  supernova: "supernova signal: deep, multi-domain AI usage. Full instrumentation unlocked.",
};

// Shared fake registry with a spread of primary categories, one local-runner id, and media rows.
const REGISTRY: ProviderDescriptor[] = [
  descriptor("openai", ["llm", "image", "audio"]),
  descriptor("mistral", ["llm"]),
  descriptor("claude-code", ["coding", "llm"]),
  descriptor("cursor", ["coding"]),
  descriptor("higgsfield", ["image", "video", "audio"]),
  descriptor("replicate", ["video", "image"]),
  descriptor("ollama", ["llm"]),
];

const RICH_PROVIDERS = [usage("higgsfield"), usage("replicate"), usage("openai"), usage("claude-code"), usage("ollama"), usage("mistral"), usage("cursor")];

test("fresh tier: empty and sparse profiles stay fresh with the chart gated under seven days", () => {
  const empty = readComplexity(profile(), REGISTRY);
  assert.equal(empty.tier, "fresh");
  assert.equal(empty.score, 0);
  assert.equal(empty.hint, HINT.fresh);
  assert.deepEqual(empty.facts, { providers: 0, categories: 0, days: 0, usd: 0, ops: 0, hasLocal: false, hasMedia: false });
  assert.deepEqual(empty.reveal, { chart: false, providerMix: true, categoryMix: false, insights: false, rhythm: false, trust: false });

  const sparse = readComplexity(profile({ providers: [usage("openai", 4, 2), usage("mistral", 3, 1)], usageDays: days(5) }), REGISTRY);
  assert.equal(sparse.tier, "fresh");
  assert.equal(sparse.score, 0);
  assert.equal(sparse.reveal.chart, false); // 5 days < 7 gates the chart
  assert.equal(sparse.reveal.providerMix, true);
  assert.equal(sparse.hint, HINT.fresh);
});

test("operator tier: a four-provider, two-category, twenty-day, $50 profile scores 45 and opens the operator panel set", () => {
  const read = readComplexity(
    profile({ providers: [usage("openai"), usage("mistral"), usage("claude-code"), usage("cursor")], usageDays: days(20), latest: latest(50, 400) }),
    REGISTRY,
  );
  assert.equal(read.tier, "operator");
  assert.equal(read.score, 45); // 15 providers + 10 categories + 10 days + 10 usd
  assert.deepEqual(read.facts, { providers: 4, categories: 2, days: 20, usd: 50, ops: 400, hasLocal: false, hasMedia: false });
  assert.deepEqual(read.reveal, { chart: true, providerMix: true, categoryMix: true, insights: true, rhythm: false, trust: false });
  assert.equal(read.hint, HINT.operator);
});

test("supernova tier: seven providers with local, media, deep history, spend, ops, and a trust signal max out with every panel", () => {
  const read = readComplexity(profile({ providers: RICH_PROVIDERS, usageDays: days(40), latest: latest(250, 1500), trustSignals: trustSignals(1) }), REGISTRY);
  assert.equal(read.tier, "supernova");
  assert.equal(read.score, 100);
  assert.ok(read.score >= 65);
  assert.deepEqual(read.facts, { providers: 7, categories: 4, days: 40, usd: 250, ops: 1500, hasLocal: true, hasMedia: true });
  assert.deepEqual(read.reveal, { chart: true, providerMix: true, categoryMix: true, insights: true, rhythm: true, trust: true });
  assert.equal(read.hint, HINT.supernova);
});

test("trust reveal gate: a supernova profile with zero trust signals keeps trust hidden while every other panel opens", () => {
  const base: Partial<ProfileView> = { providers: RICH_PROVIDERS, usageDays: days(40), latest: latest(250, 1500) };
  const withTrust = readComplexity(profile({ ...base, trustSignals: trustSignals(2) }), REGISTRY);
  const withoutTrust = readComplexity(profile({ ...base, trustSignals: trustSignals(0) }), REGISTRY);

  assert.equal(withTrust.tier, "supernova");
  assert.equal(withoutTrust.tier, "supernova");
  assert.equal(withTrust.reveal.trust, true);
  assert.equal(withoutTrust.reveal.trust, false);
  assert.deepEqual(withoutTrust.reveal, { chart: true, providerMix: true, categoryMix: true, insights: true, rhythm: true, trust: false });
});

test("registry join: unmatched provider ids add spend and ops but never categories, local, or media", () => {
  const sparse = profile({ providers: [usage("openai", 10, 5), usage("llama-cpp", 40, 12), usage("midjourney", 30, 8)], usageDays: days(2) });

  const read = readComplexity(sparse, REGISTRY); // llama-cpp + midjourney are absent from REGISTRY
  assert.equal(read.facts.providers, 3);
  assert.equal(read.facts.categories, 1); // only the matched openai (llm) counts
  assert.equal(read.facts.hasLocal, false); // llama-cpp is a local id but unmatched -> ignored
  assert.equal(read.facts.hasMedia, false); // midjourney would be media if matched -> ignored
  assert.equal(read.facts.usd, 25); // 5 + 12 + 8 summed across all providers (latest is null)
  assert.equal(read.facts.ops, 80); // 10 + 40 + 30 summed across all providers

  // Once the same ids exist in the registry the local + media facts flip on.
  const matchedRegistry = [...REGISTRY, descriptor("llama-cpp", ["llm"]), descriptor("midjourney", ["image"])];
  const matched = readComplexity(sparse, matchedRegistry);
  assert.equal(matched.facts.hasLocal, true); // llama-cpp — the live hyphenated registry id — is a known local runner
  assert.equal(matched.facts.hasMedia, true); // midjourney primary category is image
  assert.equal(matched.facts.categories, 2); // llm + image
});

test("score boundaries and clamp: tiers flip at 30 and 65, and the richest reachable profile is capped at 100", () => {
  // Every band is a multiple of 5, so the reachable grid is {0,5,...,100}. The tier edges are
  // exercised at the adjacent reachable scores: 25|30 for fresh|operator, 60|65 for operator|supernova.
  const boundaryRegistry = [descriptor("ollama", ["llm"]), ...Array.from({ length: 6 }, (_u, i) => descriptor(`llm-${i}`, ["llm"]))];
  const sixLlm = Array.from({ length: 6 }, (_u, i) => usage(`llm-${i}`));

  const fresh25 = readComplexity(profile({ providers: sixLlm, usageDays: days(3) }), boundaryRegistry);
  assert.equal(fresh25.score, 25); // 6 providers only; one category, no days/usd/ops/local/media
  assert.equal(fresh25.tier, "fresh");

  const op30 = readComplexity(profile({ providers: [usage("ollama"), ...sixLlm.slice(1)], usageDays: days(3) }), boundaryRegistry);
  assert.equal(op30.score, 30); // +5 for the local runner tips it across the 30 edge
  assert.equal(op30.tier, "operator");

  // Three non-media categories (llm/coding/other) so hasMedia stays off.
  const mixRegistry = [
    descriptor("m-llm-a", ["llm"]), descriptor("m-llm-b", ["llm"]),
    descriptor("m-code-a", ["coding"]), descriptor("m-code-b", ["coding"]),
    descriptor("m-other-a", ["other"]), descriptor("m-other-b", ["other"]),
    descriptor("ollama", ["llm"]),
  ];
  const sixMix = [usage("m-llm-a"), usage("m-llm-b"), usage("m-code-a"), usage("m-code-b"), usage("m-other-a"), usage("m-other-b")];

  const op60 = readComplexity(profile({ providers: sixMix, usageDays: days(3), latest: latest(120, 500) }), mixRegistry);
  assert.equal(op60.score, 60); // 25 providers + 20 categories + 15 usd
  assert.equal(op60.tier, "operator");

  const nova65 = readComplexity(profile({ providers: [...sixMix, usage("ollama")], usageDays: days(3), latest: latest(120, 500) }), mixRegistry);
  assert.equal(nova65.score, 65); // +5 for the local runner tips it across the 65 edge
  assert.equal(nova65.tier, "supernova");

  // Richest reachable profile: all seven bands fire and the raw sum equals the clamp ceiling.
  const maxRegistry = [...mixRegistry, descriptor("higgsfield", ["image", "video"])];
  const maxed = readComplexity(
    profile({ providers: [...sixMix, usage("ollama"), usage("higgsfield")], usageDays: days(40), latest: latest(250, 1500), trustSignals: trustSignals(3) }),
    maxRegistry,
  );
  assert.equal(maxed.score, 100); // 25+20+20+15+10+5+5 = 100, held at the ceiling by the clamp
  assert.equal(maxed.tier, "supernova");
});
