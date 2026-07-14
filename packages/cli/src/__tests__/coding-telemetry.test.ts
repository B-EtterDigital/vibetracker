import assert from "node:assert/strict";
import test from "node:test";
import { ccusageToCodingTelemetry } from "../coding-telemetry.ts";

test("ccusage → measured token breakdown + per-agent delegation aggregates", () => {
  const daily = [
    { modelBreakdowns: [{ modelName: "gpt-5.5", inputTokens: 1e6, outputTokens: 1e5, cacheReadTokens: 8e6, cacheCreationTokens: 5e5 }],
      agents: [{ agent: "codex", totalCost: 40, totalTokens: 9.6e6 }, { agent: "claude", totalCost: 10, totalTokens: 2e6 }] },
    { modelBreakdowns: [{ modelName: "claude-opus-4-8", inputTokens: 5e5, outputTokens: 5e4, cacheReadTokens: 4e6, cacheCreationTokens: 2e5 }],
      agents: [{ agent: "claude", totalCost: 12, totalTokens: 4.75e6 }] },
  ];
  const t = ccusageToCodingTelemetry(daily)!;
  assert.ok(t, "telemetry produced");
  // token totals are summed from real per-model tokens (measured)
  assert.equal(t.tokenBreakdown.total.cacheRead, 12e6);
  assert.equal(t.tokenBreakdown.total.input, 1.5e6);
  // per-provider split maps models to codex/claude
  assert.ok(t.tokenBreakdown.byProvider.some((p) => p.provider === "codex"));
  assert.ok(t.tokenBreakdown.byProvider.some((p) => p.provider === "claude-code"));
  // agents: codex 1 day, claude 2 days; day 1 ran 2 agents → 1 cross-provider day
  const codex = t.agents.agents.find((a) => a.agent === "codex")!;
  const claude = t.agents.agents.find((a) => a.agent === "claude")!;
  assert.equal(codex.activeDays, 1);
  assert.equal(claude.activeDays, 2);
  assert.equal(t.agents.crossProviderDays, 1);
});

test("empty ccusage input yields null (no fabricated aggregates)", () => {
  assert.equal(ccusageToCodingTelemetry([]), null);
});
