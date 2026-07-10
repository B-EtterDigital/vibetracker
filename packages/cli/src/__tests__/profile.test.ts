import { test } from "node:test";
import assert from "node:assert/strict";
import { renderProfileHtml } from "../profile.ts";
import type { TrustSignal } from "../../../core/src/schema/trust-signal.ts";

const record = {
  ts: "2026-07-01T00:00:00Z",
  provider: "claude-code",
  category: "coding",
  operation: "message",
  quantity: 1,
  unit: "token",
  rawAmount: 1000,
  rawUnit: "tokens",
  usdEst: 0.01,
  source: "log",
  confidence: "high",
  verified: false,
} as const;

const githubSignal: TrustSignal = {
  kind: "github_activity",
  source: "github_cli",
  label: "GitHub activity evidence (not AI usage)",
  handle: "B-EtterDigital",
  fetchedAt: "2026-07-05T00:00:00Z",
  from: "2026-04-06T00:00:00Z",
  to: "2026-07-05T00:00:00Z",
  windowDays: 90,
  totalContributions: 430,
  commitContributions: 321,
  issueContributions: 12,
  pullRequestContributions: 34,
  pullRequestReviewContributions: 56,
  repositoryContributions: 7,
  days: [
    { date: "2026-07-01", count: 0, level: 0 },
    { date: "2026-07-02", count: 3, level: 1 },
    { date: "2026-07-03", count: 8, level: 3 },
    { date: "2026-07-04", count: 21, level: 4 },
  ],
  confidence: "activity_evidence",
  affectsTotals: false,
  usageVerified: false,
  note: "Activity evidence only. Not counted as usage, spend, credits, or verified provider data.",
};

const higgsfieldMcpSignal: TrustSignal = {
  kind: "higgsfield_mcp",
  source: "codex_mcp",
  label: "Higgsfield MCP connection evidence (not AI usage)",
  provider: "higgsfield",
  mcpName: "higgsfield",
  transport: "streamable_http",
  auth: "oauth",
  urlHost: "mcp.higgsfield.ai",
  enabled: true,
  fetchedAt: "2026-07-06T00:00:00Z",
  confidence: "activity_evidence",
  affectsTotals: false,
  usageVerified: false,
  note: "Higgsfield MCP connection evidence only. Not counted as usage, spend, credits, or verified provider data.",
};

test("profile renders GitHub activity as a separate not-usage trust signal", () => {
  const html = renderProfileHtml([record], [githubSignal], [{
    id: "roi-test",
    from: "2026-07-01T00:00:00Z",
    to: "2026-07-05T00:00:00Z",
    note: "Published launch video",
    valueUsd: 500,
    tags: ["launch"],
    createdAt: "2026-07-05T00:00:00Z",
  }]);
  assert.match(html, /<!doctype html>/);
  assert.match(html, /name="viewport"/);
  assert.match(html, /Trust signals/);
  assert.match(html, /GitHub activity evidence \(not AI usage\)/);
  assert.match(html, /NOT USAGE/);
  assert.match(html, /official GitHub contribution colors/);
  assert.match(html, /#39d353/);
  assert.match(html, /ghgrid/);
  assert.match(html, /pmark/);
  assert.match(html, /Not counted as usage/);
  assert.match(html, /Trust & integrity/);
  assert.match(html, /Source mix/);
  assert.match(html, /Local integrity/);
  assert.match(html, /bundle/);
  assert.match(html, /AI life ROI/);
  assert.match(html, /Published launch video/);
  assert.match(html, /VIBERS UNITE/);
  assert.match(html, /c0vibe\.app/);
  assert.match(html, /VTK:\/\/LOCAL-PROFILE\/\/SHARE-CARD/);
  assert.match(html, /Trust signals stay labelled/);
  assert.match(html, /Local signal cockpit/);
  assert.match(html, /VTK:\/\/LOCAL-SIGNAL-COCKPIT\/\/VIBERS-UNITE/);
  assert.match(html, /signal-cockpit/);
  assert.match(html, /Usage core/);
  assert.match(html, /Trust rail/);
  assert.match(html, /Privacy gate/);
  assert.match(html, /C0VIBE relay/);
  assert.match(html, /vibetracker upload --dry-run/);
  assert.match(html, /GitHub, Codex, and creator cadence stay labelled NOT USAGE/);
  assert.match(html, /Source-to-score passport/);
  assert.match(html, /VTK:\/\/PROFILE-DATASTREAM-PASSPORT\/\/SOURCE-TO-SCORE/);
  assert.match(html, /datastream-passport/);
  assert.match(html, /Upload aggregate/);
  assert.match(html, /Provider mix/);
  assert.match(html, /Heatgrid rhythm/);
  assert.match(html, /Score inputs/);
  assert.match(html, /Trust side rail/);
  assert.match(html, /C0VIBE relay/);
  assert.match(html, /profile, heatgrid, score, badges share this stream/);
  assert.match(html, /profile, heatgrid, vibe score inputs, share badges, and trust side rails/);
  assert.match(html, /No raw prompts, outputs, or secrets/);
  assert.match(html, /Local profile does not self-certify verified rank/);
  assert.match(html, /Cannot change spend, credits, operations, rank, or verified status/);
  assert.match(html, /daily aggregate -&gt; heatgrid/);
  assert.match(html, /Profile black box replay/);
  assert.match(html, /profile-replay/);
  assert.match(html, /VTK:\/\/PROFILE-BLACK-BOX\/\/REPLAY-RECORDER\/\/NO-SECRETS/);
  assert.match(html, /source mix, heatgrid, score receipt, trust side rail, and C0VIBE relay/i);
  assert.match(html, /Aggregate captured/);
  assert.match(html, /Provider mix replayed/);
  assert.match(html, /Heatgrid rhythm sealed/);
  assert.match(html, /Score receipt linked/);
  assert.match(html, /Trust rail isolated/);
  assert.match(html, /C0VIBE relay armed/);
  assert.match(html, /prompts 0 \/\/ outputs 0 \/\/ secrets 0 \/\/ raw files 0/);
  assert.match(html, /Replay metadata only/);
  assert.match(html, /No prompts, model outputs, pasted keys, raw provider payloads, or hidden usage/);
  assert.match(html, /provider orbit/);
  assert.match(html, /AI life dashboard/);
  assert.match(html, /VTK:\/\/AI-LIFE-DASHBOARD\/\/VIBERS-UNITE\/\/C0VIBE\.APP/);
  assert.match(html, /coders, creators, researchers, operators, and local-AI builders/);
  assert.match(html, /trust signals/);
  assert.match(html, /NOT USAGE/);
  assert.match(html, /ROI notes/);
  assert.match(html, /separate outcomes/);
  assert.match(html, /Code &amp; agents/);
  assert.match(html, /Creator studio/);
  assert.match(html, /Local AI lab/);
  assert.match(html, /CLI \/ MCP rail/);
  assert.match(html, /Ledger &amp; manual/);
});

test("profile renders Higgsfield MCP as a separate not-usage trust signal", () => {
  const html = renderProfileHtml([record], [higgsfieldMcpSignal], []);

  assert.match(html, /Higgsfield MCP connection evidence \(not AI usage\)/);
  assert.match(html, /streamable_http/);
  assert.match(html, /mcp\.higgsfield\.ai/);
  assert.match(html, /NOT USAGE/);
  assert.match(html, /Not counted as usage/);
});
