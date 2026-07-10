import { test } from "node:test";
import assert from "node:assert/strict";
import {
  renderSecretScan,
  renderUploadBlocked,
  renderUploadFailure,
  renderUploadPreview,
  renderUploadSuccess,
} from "../upload.ts";
import type { UsageAudit } from "../audit.ts";
import type { SecretFinding } from "../../../core/src/security/secrets.ts";

const audit: UsageAudit = {
  generatedAt: "2026-07-05T00:00:00Z",
  totals: { records: 4, providers: 3, usd: 42.5 },
  sourceMix: [
    { source: "ledger", label: "Provider ledger", count: 2, pct: 50, usd: 40 },
    { source: "local", label: "Local runner", count: 1, pct: 25, usd: 2.5 },
    { source: "manual", label: "Manual entry", count: 1, pct: 25 },
  ],
  freshness: [],
  coverage: { tracked: 3, connected: 0, available: 10, planned: 7, manual: 4, gaps: [] },
  integrity: { recordCount: 4, chainHead: "a".repeat(64), bundleFingerprint: "b".repeat(64) },
  anomalies: [],
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

const base = {
  handle: "cyrill",
  endpoint: "https://vibeusage.c0vibe.app/api/ingest",
  accepted: 4,
  tier: "attested" as const,
  audit,
  findings: [] as SecretFinding[],
  site: "https://vibeusage.c0vibe.app",
};

test("renderUploadPreview shows a local-first transmission cockpit", () => {
  const text = renderUploadPreview(base);

  assert.match(text, /VTK:\/\/UPLOAD-COCKPIT\/\/WHAT-LEAVES-MY-MACHINE/);
  assert.match(text, /VIBERS UNITE \/\/ c0vibe\.app/);
  assert.match(text, /records 4 \/\/ providers 3 \/\/ est \$42\.50/);
  assert.match(text, /trust signals 1 \/\/ labelled NOT USAGE/);
  assert.match(text, /trust sidecar 1 evidence item\(s\) \/\/ NOT USAGE/);
  assert.match(text, /seal chain aaaaaaaaaaaaaaaa\.\.\.aaaaaaaa \/\/ bundle bbbbbbb/);
  assert.match(text, /Provider ledger:###### 50%/);
  assert.match(text, /VTK:\/\/TRANSMISSION-SEQUENCER\/\/LOCAL-REVIEW\/\/NO-SECRETS/);
  assert.match(text, /transmission stages: scan -> redact -> review -> publish/);
  assert.match(text, /stage lock DRY-RUN \/\/ waiting for consent/);
  assert.match(text, /01 scan\s+secret sweep\s+local only/);
  assert.match(text, /02 redact\s+prompts\/keys\/files zero exported/);
  assert.match(text, /03 review\s+aggregate manifest user consent gate/);
  assert.match(text, /04 publish\s+WAITING\s+dry-run; nothing uploaded/);
  assert.match(text, /redaction manifest: prompts no \/\/ keys no \/\/ raw files no/);
  assert.match(text, /trust sidecar travels labelled NOT USAGE/);
  assert.match(text, /share kit: profile -> SVG badge -> README/);
  assert.match(text, /badge npx vibetrack badge --out \.\/vibetracker-badge\.svg/);
  assert.match(text, /handle --handle cyrill --markdown/);
  assert.match(text, /badge is local SVG; trust rail remains NOT USAGE/);
  assert.match(text, /no API keys, prompts, screenshots, raw provider payloads, or local files/);
  assert.match(text, /secret scan clean/);
  assert.match(text, /nothing uploaded/);
});

test("upload renderers make block, success, and deferred states explicit", () => {
  const findings: SecretFinding[] = [{ path: "$.records[0].apiKey", kind: "sensitive_field", preview: "sk-x...7890" }];

  assert.match(renderSecretScan(findings), /secret scan BLOCK 1 potential secret/);
  assert.match(renderUploadBlocked({ ...base, findings }), /VTK:\/\/UPLOAD-BLOCKED\/\/LOCAL-PROTECTION-ACTIVE/);
  assert.match(renderUploadBlocked({ ...base, findings }), /records held local/);
  assert.match(renderUploadBlocked({ ...base, findings }), /stage lock BLOCKED \/\/ payload stays local/);
  assert.match(renderUploadBlocked({ ...base, findings }), /04 publish\s+HELD LOCAL\s+blocked by secret gate/);

  const success = renderUploadSuccess(base, {
    profileUrl: "/u/cyrill",
    tier: "attested",
    accepted: 4,
    trustSignalsPersisted: 1,
  });
  assert.match(success, /VTK:\/\/UPLOAD-COMPLETE\/\/C0VIBE-PROFILE-FEED-LIVE/);
  assert.match(success, /trust side rail 1\/1 persisted \/\/ NOT USAGE/);
  assert.match(success, /profile https:\/\/vibeusage\.c0vibe\.app\/u\/cyrill/);
  assert.match(success, /stage lock SENT \/\/ aggregate-only profile update/);
  assert.match(success, /04 publish\s+C0VIBE LIVE\s+reviewed aggregate sent/);
  assert.match(success, /trust sidecar travels labelled NOT USAGE/);
  assert.match(success, /share kit: profile -> SVG badge -> README/);
  assert.match(success, /handle --handle cyrill --markdown/);

  const failed = renderUploadFailure(base, "could not reach: network down", "/home/user/.vibetracker/upload-bundle.json");
  assert.match(failed, /VTK:\/\/UPLOAD-DEFERRED\/\/LOCAL-BUNDLE-SAVED/);
  assert.match(failed, /retry later: vibetracker upload/);
});
