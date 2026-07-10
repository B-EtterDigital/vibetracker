import { test } from "node:test";
import assert from "node:assert/strict";
import {
  GITHUB_LEVEL_COLORS,
  isProfileTrustSignal,
  publicTrustSignals,
  trustSignalMark,
  trustSignalMetric,
  trustSignalTitle,
  trustSignalWindow,
} from "../profile-trust.ts";
import type {
  GitHubActivityTrustSignal,
  HiggsfieldMcpTrustSignal,
} from "../../../../core/src/schema/trust-signal.ts";

const github = {
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
  days: [{ date: "2026-07-05", count: 9, level: 4 }],
  confidence: "activity_evidence",
  affectsTotals: false,
  usageVerified: false,
  note: "Activity evidence only. Not counted as usage, spend, credits, or verified provider data.",
} satisfies GitHubActivityTrustSignal;

const higgsfieldMcp = {
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
} satisfies HiggsfieldMcpTrustSignal;

test("profile trust helpers keep GitHub evidence separate from usage", () => {
  assert.equal(GITHUB_LEVEL_COLORS[4], "#39d353");
  assert.equal(isProfileTrustSignal(github), true);
  assert.equal(trustSignalTitle(github), "GitHub activity");
  assert.equal(trustSignalMetric(github), "33 contributions");
  assert.equal(trustSignalWindow(github), "5d window");
  assert.equal(trustSignalMark(github), "GH");
});

test("profile trust helpers label Higgsfield MCP as not-usage connection evidence", () => {
  assert.equal(isProfileTrustSignal(higgsfieldMcp), true);
  assert.equal(trustSignalTitle(higgsfieldMcp), "Higgsfield MCP");
  assert.equal(trustSignalMetric(higgsfieldMcp), "OAuth MCP enabled");
  assert.equal(trustSignalWindow(higgsfieldMcp), "streamable_http · mcp.higgsfield.ai");
  assert.equal(trustSignalMark(higgsfieldMcp), "HF");
});

test("publicTrustSignals rejects self-promoting or malformed proof", () => {
  const accepted = publicTrustSignals([
    github,
    higgsfieldMcp,
    { ...github, affectsTotals: true },
    { ...github, usageVerified: true },
    { ...higgsfieldMcp, enabled: false },
    { ...higgsfieldMcp, usageVerified: true },
    { kind: "github_activity", source: "github_cli", affectsTotals: false, usageVerified: false },
    { kind: "creator_activity", source: "manual", handle: "creator", metric: "uploads", count: 12, affectsTotals: false, usageVerified: false },
  ]);

  assert.equal(accepted.length, 3);
  assert.deepEqual(accepted.map((signal) => signal.kind), ["github_activity", "higgsfield_mcp", "creator_activity"]);
});
