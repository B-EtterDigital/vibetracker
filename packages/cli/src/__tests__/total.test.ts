import { test } from "node:test";
import assert from "node:assert/strict";
import { renderTotal } from "../commands/total.ts";
import type { NormalizedRecord } from "../../../core/src/schema/record.ts";

function rec(overrides: Partial<NormalizedRecord> = {}): NormalizedRecord {
  return {
    ts: "2026-07-01T00:00:00Z",
    provider: "openai",
    category: "llm",
    operation: "chat",
    model: "gpt-x",
    quantity: 1,
    unit: "request",
    rawAmount: 1,
    rawUnit: "request",
    source: "ledger",
    confidence: "high",
    verified: false,
    ...overrides,
  };
}

test("renderTotal includes usage cockpit without losing the table summary", () => {
  const output = renderTotal([
    rec({ provider: "openai", rawAmount: 1200, rawUnit: "tokens", usdEst: 1.2, source: "ledger", verified: true }),
    rec({ provider: "ollama", category: "llm", model: "llama", rawAmount: 800, source: "local" }),
    rec({ provider: "higgsfield", category: "video", model: "canvas", rawAmount: 12, rawUnit: "credits", usdEst: 3, source: "feed_recon" }),
  ], "provider");

  assert.match(output, /VTK:\/\/USAGE-CORE\/\/VIBERS-UNITE\/\/C0VIBE\.APP/);
  assert.match(output, /VTK:\/\/MISSION-STRIP\/\/TOTAL\/\/VIBERS-UNITE/);
  assert.match(output, /surprise cadence: queue -> scan beat -> checkpoint encore/);
  assert.match(output, /c0vibe\.app/);
  assert.match(output, /top provider openai 1 ops \$1\.20/);
  assert.match(output, /local\/proxy\/log 1 · verified 1 · grouped by provider/);
  assert.match(output, /source mix feed_recon:1  ledger:1  local:1/);
  assert.match(output, /provider orbit: branded usage signals/);
  assert.match(output, /\[OA\] OpenAI \$1\.20/);
  assert.match(output, /\[HF\] Higgsfield \$3\.00/);
  assert.match(output, /category mix: all AI work, not only coders/);
  assert.match(output, /llm\s+█+░*\s+2 ops/);
  assert.match(output, /video\s+█+░+\s+1 ops/);
  assert.match(output, /confidence high:3 medium:0 low:0 verified:1/);
  assert.match(output, /GitHub\/Codex trust rail: NOT USAGE/);
  assert.match(output, /upload path: dry-run before c0vibe\.app publish/);
  assert.match(output, /trust signals stay labelled separately · not usage/);
  assert.match(output, /PROVIDER\s+OPS\s+CREDITS\s+USD~/);
  assert.match(output, /higgsfield\s+1\s+12\s+\$3\.00/);
  assert.match(output, /TOTAL: 3 operations · 3 provider\(s\) · 12 credits · ~\$4\.20 \(est\)/);
});

test("renderTotal gives an empty-state cockpit", () => {
  const output = renderTotal([], "model");

  assert.match(output, /VTK:\/\/MISSION-STRIP\/\/TOTAL\/\/VIBERS-UNITE/);
  assert.match(output, /top rail none yet/);
  assert.match(output, /provider orbit no providers yet/);
  assert.match(output, /category mix waiting for usage records/);
  assert.match(output, /confidence high:0 medium:0 low:0 verified:0/);
  assert.match(output, /GitHub\/Codex trust rail: NOT USAGE/);
  assert.match(output, /no usage records yet · run vibetracker init --gui/);
  assert.match(output, /TOTAL: 0 operations · 0 provider\(s\) · 0 credits/);
});
