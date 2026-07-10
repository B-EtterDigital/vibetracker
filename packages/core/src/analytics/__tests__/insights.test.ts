import { test } from "node:test";
import assert from "node:assert/strict";
import { computeUsageInsights } from "../insights.ts";
import type { NormalizedRecord } from "../../schema/record.ts";

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

test("computeUsageInsights forecasts, alerts, overlaps, cheapest provider, and local savings", () => {
  const insights = computeUsageInsights([
    rec({ ts: "2026-07-01T00:00:00Z", provider: "openai", category: "llm", usdEst: 30 }),
    rec({ ts: "2026-07-02T00:00:00Z", provider: "anthropic", category: "llm", usdEst: 5 }),
    rec({ ts: "2026-07-03T00:00:00Z", provider: "ollama", category: "llm", usdEst: 12, source: "local" }),
    rec({ ts: "2026-07-04T00:00:00Z", provider: "runway", category: "video", operation: "generate", usdEst: 80 }),
  ], { budgetUsd: 20, trailingDays: 7 });
  assert.ok(insights.forecast.projected30dUsd > 20);
  assert.equal(insights.budget?.status, "over");
  assert.ok((insights.budget?.projectedRatio ?? 0) > 1);
  assert.ok(insights.alerts.some((a) => a.includes("exceeds budget")));
  assert.ok(insights.overlaps.some((o) => o.category === "llm" && o.providers.includes("openai") && o.providers.includes("anthropic")));
  assert.equal(insights.cheapest.find((c) => c.category === "llm")?.provider, "anthropic");
  assert.equal(insights.localSavingsUsd, 12);
  assert.ok(insights.expensiveWorkflows[0].key.includes("runway/video/generate"));
});
