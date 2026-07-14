import assert from "node:assert/strict";
import test from "node:test";
import { computeProfileSignals } from "../profile-signals.ts";
import type { ProfileView } from "../data.ts";

// Minimal ProfileView with just the fields the signal engine reads; the rest are empty.
function base(over: Partial<ProfileView>): ProfileView {
  return {
    handle: "t", created_at: "2026-01-01", isPremium: false,
    latest: { total_usd: 1000, total_credits: 0, record_count: 1, created_at: "2026-01-01", tier: "self_reported" },
    providers: [], usageDays: [], categories: [], providerDays: [], providerModels: [], trustSignals: [],
    ...over,
  };
}
const tokens = (input: number, output: number, cacheRead: number, cacheCreation: number) => ({
  totalTokens: input + output + cacheRead + cacheCreation,
  tokenBreakdown: [{ scope: "total", input, output, cacheRead, cacheCreation }],
});

test("agentic multi-agent profile reads as Swarm Orchestrator", () => {
  const s = computeProfileSignals(base({
    ...tokens(1e9, 1e8, 90e9, 1e9),                 // 1.2% conversation — heavily agentic
    crossProviderDays: 30,
    agents: [
      { agent: "codex", activeDays: 80, cost: 40000, tokens: 60e9 },
      { agent: "claude", activeDays: 20, cost: 10000, tokens: 25e9 },
      { agent: "hermes", activeDays: 10, cost: 100, tokens: 2e9 },
    ],
  }));
  assert.ok(s.archetypes.includes("Swarm Orchestrator"), s.archetypes.join());
  assert.ok(s.humanRatio < 0.05);
  assert.equal(s.agentCount, 3);
});

test("high conversation ratio reads as Human-in-the-loop", () => {
  const s = computeProfileSignals(base({ ...tokens(4e9, 3e9, 3e9, 0) }));   // 70% conversation
  assert.ok(s.archetypes.includes("Human-in-the-loop"), s.archetypes.join());
});

test("heavy media output + orchestration reads as All-rounder", () => {
  const s = computeProfileSignals(base({
    ...tokens(1e9, 1e8, 90e9, 1e9),
    crossProviderDays: 20,
    agents: [
      { agent: "codex", activeDays: 60, cost: 30000, tokens: 50e9 },
      { agent: "claude", activeDays: 30, cost: 12000, tokens: 30e9 },
      { agent: "gemini", activeDays: 5, cost: 50, tokens: 1e9 },
    ],
    categories: [
      { category: "coding", ops: 200000, credits: 0, usd: 200000 },
      { category: "music", ops: 2000, credits: 0, usd: 80 },
      { category: "image", ops: 1000, credits: 0, usd: 300 },
    ],
  }));
  assert.equal(s.archetypeLabel, "All-rounder");
  assert.ok(s.archetypes.includes("Swarm Orchestrator") && s.archetypes.includes("Media Generator"), s.archetypes.join());
});

test("subscription footprint estimates parallel accounts from last-30-day spend", () => {
  const days = Array.from({ length: 30 }, (_v, i) => `2026-06-${String(i + 1).padStart(2, "0")}`);
  const providerDays = days.flatMap((date) => [
    { provider: "codex", date, ops: 0, credits: 0, usd: 500 },        // $15k/30d → ~3x ChatGPT Pro
    { provider: "claude-code", date, ops: 0, credits: 0, usd: 200 },  // $6k/30d → ~1x Claude Max
  ]);
  const s = computeProfileSignals(base({ providerDays }));
  const gpt = s.footprint.find((f) => f.label === "ChatGPT Pro");
  const claude = s.footprint.find((f) => f.label === "Claude Max");
  assert.ok(gpt && gpt.count >= 2, JSON.stringify(s.footprint));
  assert.ok(claude && claude.count >= 1, JSON.stringify(s.footprint));
});

test("ship rate is commits per billion tokens from the github signal", () => {
  const s = computeProfileSignals(base({
    ...tokens(1e9, 1e9, 8e9, 0),   // 10B tokens
    trustSignals: [{ kind: "github_activity", source: "github_cli", totalContributions: 500 } as never],
  }));
  assert.equal(s.shipRate, 50);   // 500 commits / 10B tokens
});
