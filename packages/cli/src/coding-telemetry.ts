// Measure-at-source: capture the coding-agent token + delegation aggregates from ccusage AT SYNC
// TIME, before Claude Code / Codex prune their logs. Everything this produces is MEASURED (real
// token counts, real per-agent active days), not reconstructed — that is the whole point: run it
// on every upload and the backend accumulates a measured history the pruned logs would have lost.

import { spawnSync } from "node:child_process";
import { providerForModel } from "./import-ccusage.ts";

export interface CommandResult {
  status: number | null;
  stdout?: string | Buffer;
  stderr?: string | Buffer;
  error?: { message?: string };
}
export type CommandRunner = (command: string, args: string[]) => CommandResult;

export interface TokenScope { provider?: string; input: number; output: number; cacheRead: number; cacheCreation: number }
export interface AgentRollup { agent: string; activeDays: number; cost: number; tokens: number }
export interface CodingTelemetry {
  tokenBreakdown: { total: Omit<TokenScope, "provider">; byProvider: Array<TokenScope & { provider: string }> };
  agents: { crossProviderDays: number; activeDays: number; agents: AgentRollup[] };
  totalTokens: number;
}

interface CcModelBreakdown {
  modelName?: string;
  inputTokens?: number; outputTokens?: number; cacheCreationTokens?: number; cacheReadTokens?: number;
  cost?: number;
}
interface CcAgentDay { agent?: string; totalCost?: number; totalTokens?: number }
interface CcDay { modelBreakdowns?: CcModelBreakdown[]; agents?: CcAgentDay[] }

function defaultRun(command: string, args: string[]): CommandResult {
  // ccusage on PATH first; fall back to npx. --by-agent is the multi-CLI (delegation) breakdown.
  const direct = spawnSync(command, args, { encoding: "utf8", timeout: 120_000 });
  if (direct.status === 0) return direct;
  return spawnSync("npx", ["-y", "ccusage@latest", ...args], { encoding: "utf8", timeout: 180_000 });
}

function tok(m: CcModelBreakdown): number {
  return (m.inputTokens ?? 0) + (m.outputTokens ?? 0) + (m.cacheCreationTokens ?? 0) + (m.cacheReadTokens ?? 0);
}

// Parse a `ccusage daily --json --breakdown --by-agent` payload into measured aggregates.
export function ccusageToCodingTelemetry(daily: CcDay[]): CodingTelemetry | null {
  if (!Array.isArray(daily) || !daily.length) return null;
  const total = { input: 0, output: 0, cacheRead: 0, cacheCreation: 0 };
  const byProvider = new Map<string, TokenScope & { provider: string }>();
  const agentDays = new Map<string, number>();
  const agentCost = new Map<string, number>();
  const agentTok = new Map<string, number>();
  let crossProviderDays = 0;

  for (const day of daily) {
    for (const m of day.modelBreakdowns ?? []) {
      const { provider } = providerForModel(m.modelName ?? "");
      total.input += m.inputTokens ?? 0;
      total.output += m.outputTokens ?? 0;
      total.cacheRead += m.cacheReadTokens ?? 0;
      total.cacheCreation += m.cacheCreationTokens ?? 0;
      const p = byProvider.get(provider) ?? { provider, input: 0, output: 0, cacheRead: 0, cacheCreation: 0 };
      p.input += m.inputTokens ?? 0;
      p.output += m.outputTokens ?? 0;
      p.cacheRead += m.cacheReadTokens ?? 0;
      p.cacheCreation += m.cacheCreationTokens ?? 0;
      byProvider.set(provider, p);
    }
    const agentsToday = new Set<string>();
    for (const a of day.agents ?? []) {
      const name = typeof a.agent === "string" ? a.agent : "";
      if (!name) continue;
      agentsToday.add(name);
      agentCost.set(name, (agentCost.get(name) ?? 0) + (a.totalCost ?? 0));
      agentTok.set(name, (agentTok.get(name) ?? 0) + (a.totalTokens ?? 0));
    }
    for (const name of agentsToday) agentDays.set(name, (agentDays.get(name) ?? 0) + 1);
    if (agentsToday.size >= 2) crossProviderDays += 1;
  }

  const totalTokens = total.input + total.output + total.cacheRead + total.cacheCreation;
  if (totalTokens <= 0) return null;

  return {
    tokenBreakdown: {
      total,
      byProvider: [...byProvider.values()].sort((a, b) =>
        (b.input + b.output + b.cacheRead + b.cacheCreation) - (a.input + a.output + a.cacheRead + a.cacheCreation)),
    },
    agents: {
      crossProviderDays,
      activeDays: daily.length,
      agents: [...agentDays.keys()]
        .map((agent) => ({ agent, activeDays: agentDays.get(agent) ?? 0, cost: Math.round((agentCost.get(agent) ?? 0) * 100) / 100, tokens: agentTok.get(agent) ?? 0 }))
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 32),
    },
    totalTokens,
  };
}

// Best-effort: returns null (never throws) if ccusage isn't installed or produced nothing usable.
export function collectCodingTelemetry(run: CommandRunner = defaultRun): CodingTelemetry | null {
  let res: CommandResult;
  try {
    res = run("ccusage", ["daily", "--json", "--breakdown", "--by-agent"]);
  } catch (_err) {
    return null;
  }
  if (res.status !== 0) return null;
  let parsed: { daily?: CcDay[] };
  try {
    parsed = JSON.parse(String(res.stdout ?? ""));
  } catch (_err) {
    return null;
  }
  return ccusageToCodingTelemetry(parsed.daily ?? []);
}
