import { test } from "node:test";
import assert from "node:assert/strict";
import { readComplexity } from "../profile-complexity.ts";
import type { ProviderDescriptor } from "../../../../adapters/src/index.ts";
import type { ProfileView } from "../data.ts";

// --- fixture builders (fake descriptors only; the real registry is never imported) ---

function descriptor(id: string, categories: ProviderDescriptor["categories"]): ProviderDescriptor {
  return { id, label: id.toUpperCase(), domain: "ai", categories, tier: "ledger", auth: "apiKey", status: "built", verified: false, method: "test fixture" };
}

function usage(provider: string, ops = 0, usd = 0, credits = 0): ProfileView["providers"][number] {
  return { provider, ops, credits, usd };
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
  return { handle: "tester", created_at: "2026-01-01T00:00:00.000Z", isPremium: false, latest: null, providers: [], usageDays: [], categories: [], providerDays: [], trustSignals: [], ...overrides };
}

const HINT = {
  ember: "ember signal: a first spark of tracked usage. the board grows with every sync.",
  spark: "spark signal: a real, multi-source footprint taking shape.",
  current: "current signal: steady, multi-domain AI usage flowing.",
  surge: "surge signal: deep, wide, high-volume creation. rare air.",
  supernova: "supernova signal: a top-percentile viber across every axis. full instrumentation.",
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

// Wider registries for the harder upper tiers: eight sources across seven primary categories, and a
// twelve-source / eight-category set for the near-max Supernova reach.
const WIDE: ProviderDescriptor[] = [
  descriptor("code-a", ["coding"]), descriptor("code-b", ["coding"]),
  descriptor("img", ["image"]), descriptor("vid", ["video"]),
  descriptor("music", ["music"]), descriptor("audio", ["audio"]),
  descriptor("threed", ["3d"]), descriptor("ollama", ["llm"]),
];
const WIDE_PROVIDERS = WIDE.map((d) => usage(d.id));
const MAX_REG: ProviderDescriptor[] = [
  ...WIDE,
  descriptor("tool", ["other"]), descriptor("code-c", ["coding"]),
  descriptor("img2", ["image"]), descriptor("vid2", ["video"]),
];
const MAX_PROVIDERS = MAX_REG.map((d) => usage(d.id));

test("ember tier: empty and sparse profiles stay ember with the chart gated under seven days", () => {
  const empty = readComplexity(profile(), REGISTRY);
  assert.equal(empty.tier, "ember");
  assert.equal(empty.score, 0);
  assert.equal(empty.hint, HINT.ember);
  assert.deepEqual(empty.facts, { providers: 0, categories: 0, days: 0, usd: 0, ops: 0, hasLocal: false, hasMedia: false });
  assert.deepEqual(empty.reveal, { chart: false, providerMix: true, categoryMix: false, insights: false, rhythm: false, trust: false });
  assert.deepEqual(empty.progress, { pct: 0, nextTier: "spark", pointsToNext: 20, unlocksNext: ["usage over time", "usage insights"], grow: ["more days of history", "more connected sources"] });

  const sparse = readComplexity(profile({ providers: [usage("openai", 4, 2), usage("mistral", 3, 1)], usageDays: days(5) }), REGISTRY);
  assert.equal(sparse.tier, "ember"); // two sources only (4); one category, no days/usd
  assert.equal(sparse.score, 4);
  assert.equal(sparse.reveal.chart, false); // 5 days < 7 gates the chart
  assert.equal(sparse.reveal.providerMix, true);
});

test("spark tier: six sources, three categories, a month, media + local score 22 and open the chart + insights", () => {
  const read = readComplexity(
    profile({ providers: [usage("openai"), usage("mistral"), usage("claude-code"), usage("cursor"), usage("ollama"), usage("higgsfield")], usageDays: days(30) }),
    REGISTRY,
  );
  assert.equal(read.tier, "spark");
  assert.equal(read.score, 22); // 6 sources (9) + 3 categories (4) + 30 days (2) + media (3) + local (4)
  assert.equal(read.hint, HINT.spark);
  assert.deepEqual(read.reveal, { chart: true, providerMix: true, categoryMix: false, insights: true, rhythm: false, trust: false });
  assert.equal(read.progress.nextTier, "current");
  assert.equal(read.progress.pointsToNext, 18); // 40 - 22
});

test("current tier: eight sources, seven categories, three months, $30k and 6k ops score 54 and add the specialization mix", () => {
  const read = readComplexity(profile({ providers: WIDE_PROVIDERS, usageDays: days(90), latest: latest(30_000, 6_000) }), WIDE);
  assert.equal(read.tier, "current");
  assert.equal(read.score, 54); // 15 sources + 15 categories + 6 days + 7 usd + 4 ops + 3 media + 4 local
  assert.equal(read.hint, HINT.current);
  assert.deepEqual(read.reveal, { chart: true, providerMix: true, categoryMix: true, insights: true, rhythm: false, trust: false });
  assert.equal(read.progress.nextTier, "surge");
  assert.equal(read.progress.pointsToNext, 6); // 60 - 54
});

test("surge tier: a heavy viber — eight sources, seven categories, 200 days, $150k, 30k ops — lands at 67, high but below the top", () => {
  const read = readComplexity(
    profile({ providers: WIDE_PROVIDERS, usageDays: days(200), latest: latest(150_000, 30_000), trustSignals: trustSignals(2) }),
    WIDE,
  );
  assert.equal(read.tier, "surge");
  assert.equal(read.score, 67); // 15 + 15 + 12 days + 12 usd + 6 ops + 3 media + 4 local
  assert.ok(read.score >= 60 && read.score < 85, "high, but a full band below Supernova");
  assert.equal(read.hint, HINT.surge);
  assert.deepEqual(read.reveal, { chart: true, providerMix: true, categoryMix: true, insights: true, rhythm: true, trust: true });
  assert.equal(read.progress.nextTier, "supernova");
  assert.equal(read.progress.pointsToNext, 18); // 85 - 67
});

test("supernova tier: only a near-max footprint — 12 sources, all 8 categories, 2 years, $1M, 100k ops — reaches the top", () => {
  const read = readComplexity(
    profile({ providers: MAX_PROVIDERS, usageDays: days(730), latest: latest(1_000_000, 100_000), trustSignals: trustSignals(3) }),
    MAX_REG,
  );
  assert.equal(read.tier, "supernova");
  assert.equal(read.score, 93); // 18 + 20 + 20 days + 20 usd + 8 ops + 3 media + 4 local
  assert.equal(read.hint, HINT.supernova);
  assert.deepEqual(read.reveal, { chart: true, providerMix: true, categoryMix: true, insights: true, rhythm: true, trust: true });
  assert.deepEqual(read.progress, { pct: 93, nextTier: null, pointsToNext: null, unlocksNext: [], grow: [] });
});

test("trust reveal gate: a surge profile with zero trust signals keeps trust hidden while every other panel opens", () => {
  const base: Partial<ProfileView> = { providers: WIDE_PROVIDERS, usageDays: days(200), latest: latest(150_000, 30_000) };
  const withTrust = readComplexity(profile({ ...base, trustSignals: trustSignals(2) }), WIDE);
  const withoutTrust = readComplexity(profile({ ...base, trustSignals: trustSignals(0) }), WIDE);

  assert.equal(withTrust.tier, "surge");
  assert.equal(withoutTrust.tier, "surge");
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

test("clamp: only a 20-source, all-category, two-year, seven-figure, six-figure-ops footprint reaches the 100 ceiling", () => {
  const bigReg = [...MAX_REG, ...Array.from({ length: 8 }, (_u, i) => descriptor(`fill-${i}`, ["coding"]))]; // 20 sources, 8 distinct categories
  const maxed = readComplexity(
    profile({ providers: bigReg.map((d) => usage(d.id)), usageDays: days(730), latest: latest(1_000_000, 100_000), trustSignals: trustSignals(3) }),
    bigReg,
  );
  assert.equal(maxed.facts.providers, 20);
  assert.equal(maxed.score, 100); // 25 + 20 + 20 + 20 + 8 + 3 + 4 = 100, held at the ceiling by the clamp
  assert.equal(maxed.tier, "supernova");
  assert.deepEqual(maxed.progress, { pct: 100, nextTier: null, pointsToNext: null, unlocksNext: [], grow: [] });
});

test("tier edge: the ember|spark flip lands at exactly 20", () => {
  // Eight coding/llm sources across two categories score 19 (ember); a single tracked op tips it to
  // 20 (spark). No media or local runner, so only the source count + ops move the score.
  const reg = Array.from({ length: 8 }, (_u, i) => descriptor(`n-${i}`, i < 4 ? ["coding"] : ["llm"]));
  const eight = reg.map((d) => usage(d.id));
  assert.equal(readComplexity(profile({ providers: eight }), reg).score, 19); // 8 sources (15) + 2 categories (4)
  assert.equal(readComplexity(profile({ providers: eight }), reg).tier, "ember");
  assert.equal(readComplexity(profile({ providers: eight, latest: latest(0, 100) }), reg).score, 20); // + 1 op band
  assert.equal(readComplexity(profile({ providers: eight, latest: latest(0, 100) }), reg).tier, "spark");
});

test("maker identity: activity distribution resolves specialist, dual, allrounder, credits fallback, and forming without spend influence", () => {
  // (a) 70/30 ops across image/llm -> specialist, even though spend points the other way.
  const specialist = readComplexity(profile({ providers: [usage("higgsfield", 70, 1), usage("openai", 30, 999)] }), REGISTRY);
  assert.deepEqual(specialist.identity, { kind: "specialist", label: "image specialist", topCategory: "image", topShare: 70, fields: 2 });

  // (b) 45/40/15 ops -> dual-wield; the higher activity share is listed first.
  const dual = readComplexity(
    profile({ providers: [usage("higgsfield", 45, 1), usage("openai", 40, 999), usage("claude-code", 15, 500)] }),
    REGISTRY,
  );
  assert.deepEqual(dual.identity, { kind: "dual", label: "dual-wield: image + llm", topCategory: "image", topShare: 45, fields: 3 });

  // (c) 30/25/25/20 ops across four categories -> allrounder.
  const spread = readComplexity(
    profile({ providers: [usage("higgsfield", 30, 1), usage("openai", 25, 999), usage("claude-code", 25, 500), usage("replicate", 20, 250)] }),
    REGISTRY,
  );
  assert.deepEqual(spread.identity, { kind: "allrounder", label: "allrounder across 4 fields", topCategory: "image", topShare: 30, fields: 4 });

  // (d) no operation counts -> credits carry the activity distribution without consulting USD.
  const creditsOnly = readComplexity(profile({ providers: [usage("ollama", 0, 999, 80), usage("higgsfield", 0, 1, 20)] }), REGISTRY);
  assert.deepEqual(creditsOnly.identity, { kind: "specialist", label: "llm specialist", topCategory: "llm", topShare: 80, fields: 2 });

  // (e) empty profile -> forming, with the always-presentable label.
  const forming = readComplexity(profile(), REGISTRY);
  assert.deepEqual(forming.identity, { kind: "forming", label: "signal forming", topCategory: null, topShare: 0, fields: 0 });
});
