// Capture measured coding-token and agent-presence aggregates from the newest local cc.json
// snapshot. The snapshot contains model-level token totals and per-day agent names, but it does
// not attribute tokens or cost to individual agents; those fields therefore remain zero.

import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { createConsoleTelemetry, type Telemetry } from "../../core/src/telemetry/index.ts";
import { findCcJson, providerForModel } from "./import-ccusage.ts";

export interface TokenScope { provider?: string; input: number; output: number; cacheRead: number; cacheCreation: number }
export interface AgentRollup { agent: string; activeDays: number; cost: number; tokens: number }
export interface CodingTelemetry {
  tokenBreakdown: { total: Omit<TokenScope, "provider">; byProvider: Array<TokenScope & { provider: string }> };
  agents: { crossProviderDays: number; activeDays: number; agents: AgentRollup[] };
  totalTokens: number;
  sourcePath?: string;
}

interface CcModelBreakdown {
  modelName?: string;
  inputTokens?: number; outputTokens?: number; cacheCreationTokens?: number; cacheReadTokens?: number;
}
interface CcDay {
  modelBreakdowns?: CcModelBreakdown[];
  metadata?: { agents?: string[] };
}

export interface CollectCodingTelemetryOptions {
  path?: string;
  telemetry?: Telemetry;
}

function finite(value: number | undefined): number {
  return Number.isFinite(value) && (value ?? 0) > 0 ? value! : 0;
}

export function ccusageToCodingTelemetry(daily: CcDay[]): CodingTelemetry | null {
  if (!Array.isArray(daily) || !daily.length) return null;
  const total = { input: 0, output: 0, cacheRead: 0, cacheCreation: 0 };
  const byProvider = new Map<string, TokenScope & { provider: string }>();
  const agentDays = new Map<string, number>();
  let crossProviderDays = 0;

  for (const day of daily) {
    const providersToday = new Set<string>();
    for (const model of day.modelBreakdowns ?? []) {
      if (typeof model.modelName !== "string" || !model.modelName.trim()) continue;
      const { provider } = providerForModel(model.modelName);
      providersToday.add(provider);
      const input = finite(model.inputTokens);
      const output = finite(model.outputTokens);
      const cacheRead = finite(model.cacheReadTokens);
      const cacheCreation = finite(model.cacheCreationTokens);
      total.input += input;
      total.output += output;
      total.cacheRead += cacheRead;
      total.cacheCreation += cacheCreation;
      const aggregate = byProvider.get(provider) ?? { provider, input: 0, output: 0, cacheRead: 0, cacheCreation: 0 };
      aggregate.input += input;
      aggregate.output += output;
      aggregate.cacheRead += cacheRead;
      aggregate.cacheCreation += cacheCreation;
      byProvider.set(provider, aggregate);
    }
    if (providersToday.size >= 2) crossProviderDays += 1;

    const agentsToday = new Set(
      (day.metadata?.agents ?? [])
        .filter((agent): agent is string => typeof agent === "string")
        .map((agent) => agent.trim().toLowerCase())
        .filter(Boolean),
    );
    for (const agent of agentsToday) agentDays.set(agent, (agentDays.get(agent) ?? 0) + 1);
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
      agents: [...agentDays.entries()]
        .map(([agent, activeDays]) => ({ agent, activeDays, cost: 0, tokens: 0 }))
        .sort((a, b) => b.activeDays - a.activeDays || a.agent.localeCompare(b.agent))
        .slice(0, 32),
    },
    totalTokens,
  };
}

export function collectCodingTelemetry(options: CollectCodingTelemetryOptions = {}): CodingTelemetry | null {
  const telemetry = options.telemetry ?? createConsoleTelemetry();
  const path = options.path ?? findCcJson();
  if (!path) {
    telemetry.addBreadcrumb("cli.coding_telemetry.snapshot_missing", {}, "info");
    return null;
  }

  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as { daily?: unknown };
    if (!Array.isArray(parsed.daily)) {
      throw new Error("cc.json does not contain a daily array");
    }
    const result = ccusageToCodingTelemetry(parsed.daily as CcDay[]);
    if (!result) {
      telemetry.addBreadcrumb("cli.coding_telemetry.snapshot_empty", { file: basename(path) }, "warn");
      return null;
    }
    return { ...result, sourcePath: path };
  } catch (err) {
    telemetry.captureError(err, {
      area: "cli.coding-telemetry.snapshot",
      severity: "warn",
      file: basename(path),
    });
    return null;
  }
}
