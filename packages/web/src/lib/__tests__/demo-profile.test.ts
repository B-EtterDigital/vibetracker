import { test } from "node:test";
import assert from "node:assert/strict";
import { DEMO_HANDLE, buildDemoProfile } from "../demo-profile.ts";
import { readComplexity } from "../profile-complexity.ts";
import { publicTrustSignals } from "../profile-trust.ts";
import { PROVIDERS } from "../../../../adapters/src/registry.ts";

const DAY_MS = 86_400_000;

test("demo profile is fully deterministic: two builds are deep-equal and never share references", () => {
  const first = buildDemoProfile();
  const second = buildDemoProfile();

  assert.deepEqual(first, second);
  assert.notEqual(first.providers, second.providers);
  assert.notEqual(first.usageDays, second.usageDays);
  assert.notEqual(first.trustSignals, second.trustSignals);
  assert.equal(first.handle, DEMO_HANDLE);
  assert.equal(DEMO_HANDLE, "demo");
  assert.equal(first.isPremium, false);
  assert.equal(first.created_at, "2026-03-04T09:00:00Z");
});

test("sums invariant: usageDays sums equal the latest totals exactly (cents for usd, units for ops/credits)", () => {
  const profile = buildDemoProfile();

  assert.ok(profile.latest);
  assert.equal(profile.latest.total_usd, 110720); // provider usd sum (top-viber sample: six-figure coding spend)
  assert.equal(profile.latest.total_credits, 61300);
  assert.equal(profile.latest.record_count, 19700); // provider ops sum incl. the elevenlabs arbitration row
  assert.equal(profile.latest.created_at, "2026-07-01T12:00:00Z");
  assert.equal(profile.latest.tier, "self_reported");

  // Provider rows sum to the same latest totals (latest is derived from them by construction).
  assert.equal(profile.providers.reduce((sum, row) => sum + row.usd, 0), profile.latest.total_usd);
  assert.equal(profile.providers.reduce((sum, row) => sum + row.credits, 0), profile.latest.total_credits);
  assert.equal(profile.providers.reduce((sum, row) => sum + row.ops, 0), profile.latest.record_count);

  // Daily series lands on the totals to the exact cent / unit (the scaleToExactSum invariant).
  const usdCents = profile.usageDays.reduce((sum, day) => sum + Math.round(day.usd * 100), 0);
  assert.equal(usdCents, profile.latest.total_usd * 100);
  assert.equal(profile.usageDays.reduce((sum, day) => sum + day.ops, 0), profile.latest.record_count);
  assert.equal(profile.usageDays.reduce((sum, day) => sum + day.credits, 0), profile.latest.total_credits);

  for (const day of profile.usageDays) {
    assert.ok(day.usd > 0, `day ${day.date} should carry positive usd`);
    assert.ok(Math.abs(day.usd * 100 - Math.round(day.usd * 100)) < 1e-6, `day ${day.date} usd is cent-precise`);
    assert.ok(Number.isInteger(day.ops) && day.ops >= 0);
    assert.ok(Number.isInteger(day.credits) && day.credits >= 0);
  }
});

test("complexity read against the REAL registry: surge at 64 with every panel revealed", () => {
  const read = readComplexity(buildDemoProfile(), PROVIDERS);

  // Under the hardened curve the curated sample lands at Surge (a full band below Supernova) yet
  // still opens every panel, because Surge unlocks rhythm + trust and the demo carries trust signals.
  assert.equal(read.tier, "surge");
  assert.equal(read.score, 64); // 15 sources + 20 categories + 6 days + 12 usd + 4 ops + 3 media + 4 local
  assert.deepEqual(read.reveal, { chart: true, providerMix: true, categoryMix: true, insights: true, rhythm: true, trust: true });
  assert.equal(read.facts.providers, 11);
  assert.equal(read.facts.days, 120);
  assert.equal(read.facts.categories, 8); // the true per-record category rollup
  assert.equal(read.facts.hasLocal, true); // ollama
  assert.equal(read.facts.hasMedia, true); // higgsfield primary category is image

  // Identity now reads the true per-record categories (profile.categories, eight fields): coding
  // leads at 8000 ops but well under 60%, so the read is an eight-field allrounder.
  assert.equal(read.identity.kind, "allrounder");
  assert.equal(read.identity.label, "allrounder across 8 fields");
  assert.equal(read.identity.topCategory, "coding");
  assert.equal(read.identity.topShare, 41); // round(8000 / 19700 * 100)
  assert.equal(read.identity.fields, 8);
});

test("trust signals: exactly two, and both survive the profile-trust public guard", () => {
  const profile = buildDemoProfile();

  assert.equal(profile.trustSignals.length, 2);
  assert.deepEqual(publicTrustSignals(profile.trustSignals), profile.trustSignals);
  assert.equal(profile.trustSignals[0]?.kind, "github_activity");
  assert.equal(profile.trustSignals[1]?.kind, "creator_activity");
});

test("usage days: 120 consecutive UTC dates ending on the fixed 2026-07-01 anchor", () => {
  const profile = buildDemoProfile();

  assert.equal(profile.usageDays.length, 120);
  assert.equal(profile.usageDays[0]?.date, "2026-03-04"); // matches created_at's date
  assert.equal(profile.usageDays[119]?.date, "2026-07-01");
  for (let i = 1; i < profile.usageDays.length; i += 1) {
    const previous = Date.parse(`${profile.usageDays[i - 1]?.date}T00:00:00Z`);
    const current = Date.parse(`${profile.usageDays[i]?.date}T00:00:00Z`);
    assert.equal(current - previous, DAY_MS, `gap between day ${i - 1} and ${i}`);
  }
});

test("every demo provider id exists in the real adapter registry", () => {
  const profile = buildDemoProfile();
  const registryIds = new Set(PROVIDERS.map((provider) => provider.id));

  assert.equal(profile.providers.length, 11);
  for (const row of profile.providers) {
    assert.ok(registryIds.has(row.provider), `provider "${row.provider}" is missing from the registry`);
  }
});
