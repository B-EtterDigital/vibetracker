import { test } from "node:test";
import assert from "node:assert/strict";
import { buildProfileCommandCenter } from "../profile-command-center.ts";
import type { ProfileView } from "../data.ts";

const profile: ProfileView = {
  handle: "cyrill",
  created_at: "2026-07-05T00:00:00Z",
  isPremium: true,
  latest: {
    total_usd: 42.5,
    total_credits: 880,
    record_count: 1200,
    created_at: new Date().toISOString(),
    tier: "attested",
  },
  providers: [
    { provider: "higgsfield", ops: 24, credits: 500, usd: 32 },
    { provider: "claude-code", ops: 900, credits: 300, usd: 8 },
    { provider: "ollama", ops: 276, credits: 80, usd: 2.5 },
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

test("profile command center summarizes score, usage, source, rhythm, trust, and relay", () => {
  const center = buildProfileCommandCenter(profile);

  assert.equal(center.callsign, "CYRI");
  assert.match(center.headline, /@cyrill command center/);
  assert.match(center.subline, /Top source higgsfield/);
  assert.deepEqual(center.rings.map((ring) => ring.id), ["score", "usage", "source", "rhythm", "trust", "relay"]);
  assert.match(center.terminalLines.join("\n"), /PROFILE-COMMAND/);
  assert.match(center.terminalLines.join("\n"), /C0VIBE\.APP/);
  assert.match(center.terminalLines.join("\n"), /stream/);
  assert.match(center.terminalLines.join("\n"), /records -> score -> c0vibe\.app/);
  assert.match(center.terminalLines.join("\n"), /pulse/);
  assert.match(center.terminalLines.join("\n"), /Vibers Unite/);
  assert.equal(center.rings.every((ring) => ring.meter >= 0 && ring.meter <= 100), true);
  assert.deepEqual(center.streamSpine.map((stage) => stage.id), ["upload", "usage", "score", "trust", "relay"]);
  assert.equal(center.streamSpine.every((stage) => stage.meter >= 0 && stage.meter <= 100), true);
  assert.deepEqual(center.relayTicks.map((tick) => tick.id), ["receipt", "usage", "trust", "publish"]);
  assert.deepEqual(center.heroScope.map((tick) => tick.id), ["receipt", "usage", "trust", "publish"]);
  assert.equal(center.relayTicks.every((tick) => tick.meter >= 0 && tick.meter <= 100), true);
  assert.equal(center.heroScope.every((tick) => tick.meter >= 0 && tick.meter <= 100), true);
  assert.match(center.terminalLines.join("\n"), /relay tape/);
  assert.equal(center.waveform.length, profile.usageDays.length + 2);
  assert.equal(center.waveform[0].id, "usage-2026-07-03");
  assert.equal(center.waveform.at(-2)?.impact, "not_usage");
  assert.equal(center.waveform.at(-1)?.id, "relay-c0vibe");
  assert.equal(center.waveform.every((point) => point.meter >= 0 && point.meter <= 100), true);
  assert.equal(center.terminalLines.every((line) => line.length === 56), true);
});

test("profile command center keeps trust context out of usage scoring", () => {
  const center = buildProfileCommandCenter(profile);
  const trust = center.rings.find((ring) => ring.id === "trust");
  const source = center.rings.find((ring) => ring.id === "source");

  assert.ok(trust);
  assert.equal(trust.impact, "not_usage");
  assert.match(trust.note, /NOT USAGE/);
  assert.equal(trust.value, "1");
  const streamTrust = center.streamSpine.find((stage) => stage.id === "trust");
  assert.ok(streamTrust);
  assert.equal(streamTrust.impact, "not_usage");
  assert.match(streamTrust.note, /Never alters spend or score/);
  const waveTrust = center.waveform.find((point) => point.id === "trust-side-rail");
  assert.ok(waveTrust);
  assert.equal(waveTrust.impact, "not_usage");
  assert.match(waveTrust.detail, /NOT USAGE/);
  const relayTrust = center.relayTicks.find((tick) => tick.id === "trust");
  const heroTrust = center.heroScope.find((tick) => tick.id === "trust");
  assert.ok(relayTrust);
  assert.equal(relayTrust.impact, "not_usage");
  assert.equal(relayTrust.status, "NOT USAGE");
  assert.match(relayTrust.note, /never spend/);
  assert.ok(heroTrust);
  assert.equal(heroTrust.impact, "not_usage");
  assert.equal(heroTrust.status, "NOT USAGE");

  assert.ok(source);
  assert.equal(source.impact, "usage");
  assert.equal(source.value, "higgsfield");
  assert.equal(center.sources[0].id, "higgsfield");
  assert.equal(center.sources[0].mark, "HF");
  assert.match(center.shareLine, /1,200 ops/);
});

test("profile command center has a safe waiting state", () => {
  const center = buildProfileCommandCenter({ ...profile, latest: null, providers: [], usageDays: [], trustSignals: [] });

  assert.equal(center.callsign, "CYRI");
  assert.match(center.headline, /waiting for first upload/);
  assert.equal(center.rings.find((ring) => ring.id === "score")?.value, "0/100");
  assert.equal(center.rings.find((ring) => ring.id === "source")?.value, "waiting");
  assert.equal(center.rings.find((ring) => ring.id === "relay")?.value, "not synced");
  assert.equal(center.streamSpine.find((stage) => stage.id === "upload")?.value, "waiting");
  assert.equal(center.streamSpine.find((stage) => stage.id === "relay")?.note, "relay waits for reviewed usage");
  assert.deepEqual(center.waveform.map((point) => point.id), ["usage-waiting", "trust-side-rail", "relay-c0vibe"]);
  assert.equal(center.waveform.find((point) => point.id === "relay-c0vibe")?.value, "waiting");
  assert.equal(center.relayTicks.find((tick) => tick.id === "receipt")?.status, "0/100");
  assert.equal(center.relayTicks.find((tick) => tick.id === "publish")?.status, "waiting");
  assert.equal(center.heroScope.find((tick) => tick.id === "publish")?.status, "waiting");
  assert.equal(center.sources.length, 0);
  assert.match(center.shareLine, /waiting for reviewed usage/);
});
