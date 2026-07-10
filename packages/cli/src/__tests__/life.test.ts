import { test } from "node:test";
import assert from "node:assert/strict";
import { lifeDemoInput, renderLifeCommand } from "../life.ts";
import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import type { TrustSignal } from "../../../core/src/schema/trust-signal.ts";

function rec(overrides: Partial<NormalizedRecord> = {}): NormalizedRecord {
  return {
    ts: "2026-07-01T00:00:00Z",
    provider: "higgsfield",
    category: "video",
    operation: "generation",
    model: "canvas",
    quantity: 1,
    unit: "credit",
    rawAmount: 10,
    rawUnit: "credits",
    usdEst: 2,
    source: "ledger",
    confidence: "high",
    verified: true,
    ...overrides,
  };
}

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
  confidence: "activity_evidence",
  affectsTotals: false,
  usageVerified: false,
  note: "Activity evidence only. Not counted as usage, spend, credits, or verified provider data.",
};

test("life command renders a terminal-native AI life cockpit", () => {
  const output = renderLifeCommand({
    records: [
      rec(),
      rec({ provider: "ollama", category: "llm", source: "local", rawAmount: 500, rawUnit: "tokens", usdEst: undefined, verified: false }),
      rec({ provider: "qwen", category: "llm", source: "ledger", rawAmount: 2, rawUnit: "request", usdEst: 0.3, verified: false }),
    ],
    trustSignals: [githubSignal],
  });

  assert.match(output, /VTK:\/\/MISSION-STRIP\/\/LIFE\/\/VIBERS-UNITE/);
  assert.match(output, /VTK:\/\/LIFE-COCKPIT\/\/CLI\/\/VIBERS-UNITE/);
  assert.match(output, /VTK:\/\/LIFE-SIGNAL-ROOM\/\/AI-LIFE\/\/VIBERS-UNITE/);
  assert.match(output, /creator usage \| builder NOT USAGE \| local-only/);
  assert.match(output, /publish path: dry-run -> Vibers Unite -> c0vibe\.app/);
  assert.match(output, /Vibers Unite \/\/ c0vibe\.app \/\/ local proof before publish/);
  assert.match(output, /signal counts are lane views; trust never changes usage totals/);
  assert.match(output, /prism -> diff cube -> sonar -> C0 relay/);
  assert.match(output, /AI LIFE LANES/);
  assert.match(output, /Creator studio/);
  assert.match(output, /Builder agents\s+NOT USAGE/);
  assert.match(output, /Local AI lab/);
  assert.match(output, /Regional AI/);
  assert.match(output, /Manual ledgers/);
  assert.match(output, /C0VIBE relay/);
  assert.match(output, /\[HF\] Higgsfield/);
  assert.match(output, /\[OL\] Ollama/);
  assert.match(output, /\[QW\] Qwen/);
  assert.match(output, /NOT USAGE: never changes spend/);
});

test("life command has a useful empty state before any ledger rows exist", () => {
  const output = renderLifeCommand({ records: [], trustSignals: [] });

  assert.match(output, /range no records yet/);
  assert.match(output, /vibetracker init --gui -> sync/);
  assert.match(output, /provider orbit waiting for first usage source/);
  assert.match(output, /NO LEDGER · 0 usage rows · 0 trust signals/);
  assert.match(output, /C0 relay\s+LOCKED\s+publish/);
  assert.match(output, /catalog \d+ providers/);
  assert.match(output, /Builder agents\s+NOT USAGE/);
  assert.match(output, /Nothing leaves the machine before dry-run review/);
  assert.equal(output.split("\n").filter((line) => line.startsWith("| ")).every((line) => line.length <= 68), true);
});

test("life command demo mode renders a filled cockpit without implying real ledger writes", () => {
  const output = renderLifeCommand(lifeDemoInput());

  assert.match(output, /range offline demo/);
  assert.match(output, /demo: no writes, no browser open, no upload, no secrets/);
  assert.match(output, /vibetracker init --gui -> real sync/);
  assert.match(output, /DEMO ONLY · 8 usage rows · 2 trust signals/);
  assert.match(output, /creator prism\s+DEMO\s+usage/);
  assert.match(output, /diff cube\s+DEMO\s+not_usage\s+2 trust/);
  assert.match(output, /Creator studio\s+usage\s+\d+ ops/);
  assert.match(output, /Builder agents\s+NOT USAGE\s+2 trust/);
  assert.match(output, /Local AI lab\s+local_only\s+\d+ ops/);
  assert.match(output, /Regional AI\s+usage\s+\d+ ops/);
  assert.match(output, /Manual ledgers\s+privacy\s+\d+ ops/);
  assert.match(output, /\[HF\] Higgsfield/);
  assert.match(output, /\[QW\] Qwen/);
  assert.match(output, /NOT USAGE: never changes spend/);
  assert.equal(output.split("\n").filter((line) => line.startsWith("| ")).every((line) => line.length <= 68), true);
});
