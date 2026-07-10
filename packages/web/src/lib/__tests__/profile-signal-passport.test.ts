import { test } from "node:test";
import assert from "node:assert/strict";
import { buildProfileSignalPassport } from "../profile-signal-passport.ts";
import type { ProfileView } from "../data.ts";

const profile: ProfileView = {
  handle: "cyrill",
  created_at: "2026-07-05T00:00:00Z",
  isPremium: true,
  latest: {
    total_usd: 42.5,
    total_credits: 880,
    record_count: 1200,
    created_at: "2026-07-05T00:00:00Z",
    tier: "attested",
  },
  providers: [
    { provider: "higgsfield", ops: 700, credits: 400, usd: 24 },
    { provider: "ollama", ops: 300, credits: 0, usd: 0 },
    { provider: "openai", ops: 200, credits: 480, usd: 18.5 },
  ],
  usageDays: [
    { date: "2026-07-03", ops: 200, credits: 180, usd: 12.5 },
    { date: "2026-07-04", ops: 500, credits: 300, usd: 18 },
    { date: "2026-07-05", ops: 500, credits: 400, usd: 12 },
  ],
  trustSignals: [{
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

test("profile signal passport creates a deterministic share artifact", () => {
  const passport = buildProfileSignalPassport(profile);
  const again = buildProfileSignalPassport(profile);

  assert.equal(passport.headline, "@cyrill signal passport");
  assert.equal(passport.profileUrl, "https://c0vibe.app/u/cyrill");
  assert.match(passport.passportId, /^VTK-[0-9A-F]{8}$/);
  assert.equal(passport.passportId, again.passportId);
  assert.deepEqual(passport.signalRows, again.signalRows);
  assert.equal(passport.signalRows.length, 5);
  assert.equal(passport.signalRows.every((row) => row.length === 34), true);
  assert.match(passport.terminalLines.join("\n"), /SIGNAL-PASSPORT/);
  assert.match(passport.terminalLines.join("\n"), /Vibers Unite/);
  assert.match(passport.terminalLines.join("\n"), /no prompts \/\/ no outputs \/\/ no secrets/);
  assert.equal(passport.terminalLines.every((line) => line.length === 64), true);
});

test("profile signal passport keeps usage, local, trust, and relay rails separate", () => {
  const passport = buildProfileSignalPassport(profile);
  const byId = new Map(passport.stamps.map((stamp) => [stamp.id, stamp]));

  assert.deepEqual(passport.stamps.map((stamp) => stamp.id), ["usage", "source", "rhythm", "trust", "relay"]);
  assert.equal(byId.get("usage")?.impact, "usage");
  assert.equal(byId.get("source")?.value, "higgsfield");
  assert.equal(byId.get("source")?.mark, "HF");
  assert.equal(byId.get("rhythm")?.value, "3 days");
  assert.match(byId.get("rhythm")?.note ?? "", /no prompts/);
  assert.equal(byId.get("trust")?.impact, "not_usage");
  assert.match(byId.get("trust")?.note ?? "", /NOT USAGE/);
  assert.match(byId.get("trust")?.note ?? "", /never changes spend/);
  assert.equal(byId.get("relay")?.impact, "publish");
  assert.match(byId.get("relay")?.note ?? "", /local ops/);
  assert.equal(passport.stamps.every((stamp) => stamp.meter >= 0 && stamp.meter <= 100), true);
});

test("profile signal passport has a safe waiting state", () => {
  const passport = buildProfileSignalPassport({ ...profile, latest: null, providers: [], usageDays: [], trustSignals: [] });

  assert.equal(passport.headline, "@cyrill passport waiting room");
  assert.match(passport.subline, /reviewed aggregate usage/);
  assert.equal(passport.stamps.find((stamp) => stamp.id === "usage")?.value, "waiting");
  assert.equal(passport.stamps.find((stamp) => stamp.id === "source")?.value, "no source");
  assert.equal(passport.stamps.find((stamp) => stamp.id === "rhythm")?.value, "offline");
  assert.equal(passport.stamps.find((stamp) => stamp.id === "trust")?.value, "0 signals");
  assert.equal(passport.stamps.find((stamp) => stamp.id === "relay")?.value, "not synced");
  assert.match(passport.terminalLines.join("\n"), /waiting for reviewed aggregate/);
});
