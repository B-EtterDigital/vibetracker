import { test } from "node:test";
import assert from "node:assert/strict";
import { buildUsageAudit, computeIntegrity, renderUsageAudit } from "../audit.ts";
import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import type { TrustSignal } from "../../../core/src/schema/trust-signal.ts";

const records: NormalizedRecord[] = [
  {
    ts: "2026-07-01T00:00:00Z",
    provider: "higgsfield",
    category: "video",
    operation: "spend",
    quantity: 1,
    unit: "credit",
    rawAmount: 12,
    rawUnit: "credits",
    usdEst: 0.12,
    source: "ledger",
    confidence: "high",
    verified: false,
  },
  {
    ts: "2026-07-02T00:00:00Z",
    provider: "suno",
    category: "music",
    operation: "generate",
    quantity: 1,
    unit: "credit",
    rawAmount: 10,
    rawUnit: "credits",
    usdEst: 0.1,
    source: "feed_recon",
    confidence: "medium",
    verified: false,
  },
];

const providers: any[] = [
  { id: "higgsfield", label: "Higgsfield", tier: "ledger", status: "built", auth: "mcp", categories: ["video"], method: "ledger" },
  { id: "suno", label: "Suno", tier: "feed_recon", status: "built", auth: "cookie", categories: ["music"], method: "feed" },
  { id: "runway", label: "Runway", tier: "ledger", status: "built", auth: "apiKey", categories: ["video"], method: "usage" },
  { id: "midjourney", label: "Midjourney", tier: "manual", status: "manual-only", auth: "none", categories: ["image"], method: "manual" },
];

const githubTrust: TrustSignal = {
  kind: "github_activity",
  source: "github_cli",
  label: "GitHub activity evidence (not AI usage)",
  handle: "viber",
  fetchedAt: "2026-07-05T00:00:00Z",
  from: "2026-06-05",
  to: "2026-07-05",
  windowDays: 30,
  totalContributions: 123,
  commitContributions: 80,
  issueContributions: 10,
  pullRequestContributions: 20,
  pullRequestReviewContributions: 12,
  repositoryContributions: 1,
  confidence: "activity_evidence",
  affectsTotals: false,
  usageVerified: false,
  note: "Activity evidence only. Not counted as usage, spend, credits, or verified provider data.",
};

test("computeIntegrity is deterministic and changes with records", () => {
  const a = computeIntegrity(records);
  const b = computeIntegrity(records);
  const c = computeIntegrity(records.slice(0, 1));
  assert.equal(a.chainHead, b.chainHead);
  assert.equal(a.bundleFingerprint, b.bundleFingerprint);
  assert.notEqual(a.chainHead, c.chainHead);
});

test("buildUsageAudit separates source mix, freshness, coverage, and anomalies", () => {
  const audit = buildUsageAudit({
    records,
    providers,
    config: { enabled: ["higgsfield"] },
    generatedAt: "2026-07-05T00:00:00Z",
  });
  assert.equal(audit.totals.records, 2);
  assert.equal(audit.totals.providers, 2);
  assert.equal(audit.totals.usd, 0.22);
  assert.equal(audit.sourceMix.find((r) => r.source === "ledger")?.count, 1);
  assert.equal(audit.sourceMix.find((r) => r.source === "feed_recon")?.pct, 50);
  assert.equal(audit.coverage.tracked, 2);
  assert.equal(audit.coverage.available, 1);
  assert.equal(audit.coverage.manual, 1);
  assert.ok(audit.anomalies.some((a) => a.includes("feed-reconstructed")));
});

test("renderUsageAudit labels coverage gaps as not counted usage", () => {
  const audit = buildUsageAudit({
    records,
    providers,
    config: { enabled: ["higgsfield"] },
    trustSignals: [githubTrust],
    generatedAt: "2026-07-05T00:00:00Z",
  });
  const text = renderUsageAudit(audit);
  assert.match(text, /VTK:\/\/AUDIT-CORE\/\/VIBERS-UNITE\/\/C0VIBE\.APP/);
  assert.match(text, /source proof/);
  assert.match(text, /\[LD\].+Provider ledger.+50.+██████░░░░░░/);
  assert.match(text, /1 trust signal\(s\) · NOT USAGE · separate/);
  assert.match(text, /local-first audit · upload requires preview\/review/);
  assert.match(text, /Vibers Unite · c0vibe\.app/);
  assert.match(text, /Coverage gaps \(not counted as usage\)/);
  assert.match(text, /Source mix/);
  assert.match(text, /Integrity/);
  assert.match(text, /github_activity\s+@viber.+NOT USAGE/);
});
