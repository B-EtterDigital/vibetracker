import { test } from "node:test";
import assert from "node:assert/strict";
import { computeUsageInsights } from "../../../core/src/analytics/insights.ts";
import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import { renderInsights } from "../insights.ts";

const rec = (overrides: Partial<NormalizedRecord>): NormalizedRecord => ({
  ts: "2026-07-01T00:00:00Z",
  provider: "openai",
  category: "llm",
  operation: "chat",
  quantity: 1,
  unit: "request",
  rawAmount: 1,
  rawUnit: "request",
  usdEst: 10,
  source: "ledger",
  confidence: "high",
  verified: false,
  ...overrides,
});

test("renderInsights opens with an intelligence deck and preserves tables", () => {
  const insights = computeUsageInsights([
    rec({ ts: "2026-07-01T00:00:00Z", provider: "openai", category: "llm", usdEst: 30 }),
    rec({ ts: "2026-07-02T00:00:00Z", provider: "anthropic", category: "llm", usdEst: 5 }),
    rec({ ts: "2026-07-03T00:00:00Z", provider: "ollama", category: "llm", usdEst: 12, source: "local" }),
    rec({ ts: "2026-07-04T00:00:00Z", provider: "runway", category: "video", operation: "generate", usdEst: 80 }),
  ], { budgetUsd: 20, trailingDays: 7 });

  const output = renderInsights(insights);

  assert.match(output, /VTK:\/\/INSIGHT-DECK\/\/VIBERS-UNITE\/\/C0VIBE\.APP/);
  assert.match(output, /VTK:\/\/ECONOMY-REACTOR\/\/USAGE-ONLY\/\/NO-TRUST-SPEND/);
  assert.match(output, /VTK:\/\/MISSION-STRIP\/\/INSIGHTS\/\/VIBERS-UNITE/);
  assert.match(output, /30d forecast \$544\.20/);
  assert.match(output, /surprise cadence: queue -> scan beat -> checkpoint encore/);
  assert.match(output, /burn OVER \$544\.20 \/ \$20\.00 projected/);
  assert.match(output, /burn compass OVER · 1d budget runway/);
  assert.match(output, /money radar uses usage rows only; trust\/context stays outside/);
  assert.match(output, /budget gate OVER · cap spend before profile publish/);
  assert.match(output, /runway 1d at \$18\.14\/day · 30d \$544\.20/);
  assert.match(output, /switch rail llm -> \[AN\] Anthropic \$5\.00\/op/);
  assert.match(output, /publish gate dry-run -> secret scan -> c0vibe\.app/);
  assert.match(output, /no prompts, outputs, secrets, or trust metrics enter spend/);
  assert.match(output, /local savings \$12\.00 · ROI evidence stays local-first/);
  assert.match(output, /expensive workflow \[RW\] runway\/video\/generate/);
  assert.match(output, /workflow constellation: hot spend nodes/);
  assert.match(output, /\[RW\] runway\/video\/generate \$80\.00/);
  assert.match(output, /\[OA\] openai\/llm\/chat \$30\.00/);
  assert.match(output, /\[OL\] ollama\/llm\/chat \$12\.00/);
  assert.match(output, /overlap radar 1 categories · cheapest \[AN\] llm via Anthropic/);
  assert.match(output, /action rail: swap llm to \[AN\] or cap budget/);
  assert.match(output, /privacy: dry-run before publish · trust signals are not usage/);
  assert.match(output, /VIBETRACKER INSIGHTS/);
  assert.match(output, /Most expensive workflows/);
  assert.match(output, /runway\/video\/generate\s+1\s+\$80\.00/);
  assert.match(output, /Cheapest observed provider by category/);
});

test("renderInsights gives an empty-state insight deck", () => {
  const output = renderInsights(computeUsageInsights([], { budgetUsd: 10 }));

  assert.match(output, /VTK:\/\/MISSION-STRIP\/\/INSIGHTS\/\/VIBERS-UNITE/);
  assert.match(output, /top rail none yet/);
  assert.match(output, /range no records/);
  assert.match(output, /budget unset|OK \$0\.00 \/ \$10\.00 projected/);
  assert.match(output, /burn compass OK · no daily burn detected/);
  assert.match(output, /VTK:\/\/ECONOMY-REACTOR\/\/USAGE-ONLY\/\/NO-TRUST-SPEND/);
  assert.match(output, /budget gate OK · dry-run publish allowed after review/);
  assert.match(output, /runway quiet · \$10\.00 budget untouched/);
  assert.match(output, /switch rail no overlap evidence yet/);
  assert.match(output, /expensive workflow none yet/);
  assert.match(output, /workflow constellation waiting for priced workflows/);
  assert.match(output, /action rail: dry-run upload when numbers look right/);
  assert.match(output, /monthly signal no monthly signal yet/);
  assert.match(output, /Weekly trend\n  \(none\)/);
});
