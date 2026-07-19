// Capture measured coding-token and agent-presence aggregates from the newest local cc.json
// snapshot. The snapshot contains model-level token totals and per-day agent names, but it does
// not attribute tokens or cost to individual agents; those fields therefore remain zero.

import { readFileSync } from "node:fs";
import { basename } from "node:path";
import type { NormalizedRecord } from "../../core/src/schema/record.ts";
import { createConsoleTelemetry, type Telemetry } from "../../core/src/telemetry/index.ts";
import { CCUSAGE_PROVIDERS, findCcJson, providerForModel } from "./import-ccusage.ts";

export interface TokenScope { provider?: string; input: number; output: number; cacheRead: number; cacheCreation: number }
export type TokenBreakdown = { total: Omit<TokenScope, "provider">; byProvider: Array<TokenScope & { provider: string }> };
export interface AgentRollup { agent: string; activeDays: number; cost: number; tokens: number }
export interface CodingTelemetry {
  tokenBreakdown: TokenBreakdown;
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

type CodingTokenRecord = Pick<NormalizedRecord, "provider" | "category" | "unit" | "tokenUsage">;

function isCodingTokenProvider(provider: string): boolean {
  return CCUSAGE_PROVIDERS.includes(provider);
}

function scopeTokens(scope: Omit<TokenScope, "provider">): number {
  return scope.input + scope.output + scope.cacheRead + scope.cacheCreation;
}

function tokenBreakdownFromScopes(scopes: Iterable<TokenScope & { provider: string }>): TokenBreakdown | null {
  const total = { input: 0, output: 0, cacheRead: 0, cacheCreation: 0 };
  const byProvider = [...scopes];
  if (!byProvider.length) return null;
  for (const scope of byProvider) {
    total.input += scope.input;
    total.output += scope.output;
    total.cacheRead += scope.cacheRead;
    total.cacheCreation += scope.cacheCreation;
  }
  return {
    total,
    byProvider: byProvider.sort((a, b) =>
      scopeTokens(b) - scopeTokens(a) || a.provider.localeCompare(b.provider)),
  };
}

function ledgerProviderCoverage(records: ReadonlyArray<CodingTokenRecord>): {
  covered: Map<string, TokenScope & { provider: string }>;
  needsFallback: Set<string>;
  hasTokenRecords: boolean;
} {
  const groups = new Map<string, { scope: TokenScope & { provider: string }; complete: boolean }>();

  for (const record of records) {
    if (!isCodingTokenProvider(record.provider) || record.category !== "coding" || record.unit !== "token") continue;
    const group = groups.get(record.provider) ?? {
      scope: { provider: record.provider, input: 0, output: 0, cacheRead: 0, cacheCreation: 0 },
      complete: true,
    };
    if (!record.tokenUsage) {
      group.complete = false;
    } else {
      group.scope.input += finite(record.tokenUsage.input);
      group.scope.output += finite(record.tokenUsage.output);
      group.scope.cacheRead += finite(record.tokenUsage.cacheRead);
      group.scope.cacheCreation += finite(record.tokenUsage.cacheCreate);
    }
    groups.set(record.provider, group);
  }

  const covered = new Map<string, TokenScope & { provider: string }>();
  const needsFallback = new Set<string>();
  for (const [provider, group] of groups) {
    if (group.complete && scopeTokens(group.scope) > 0) covered.set(provider, group.scope);
    else needsFallback.add(provider);
  }
  return { covered, needsFallback, hasTokenRecords: groups.size > 0 };
}

/** Return only providers whose persisted token rows are complete and sum above zero. */
export function ledgerTokenBreakdown(records: ReadonlyArray<CodingTokenRecord>): TokenBreakdown | null {
  return tokenBreakdownFromScopes(ledgerProviderCoverage(records).covered.values());
}

/** Select one source per provider, falling back only for incomplete or zero ledger coverage. */
export function resolveCodingTelemetry(
  records: ReadonlyArray<CodingTokenRecord>,
  fallback: () => CodingTelemetry | null,
): CodingTelemetry | null {
  const coverage = ledgerProviderCoverage(records);
  if (!coverage.hasTokenRecords) return fallback();

  const fallbackTelemetry = coverage.needsFallback.size ? fallback() : null;
  const selected = new Map(coverage.covered);
  for (const scope of fallbackTelemetry?.tokenBreakdown.byProvider ?? []) {
    if (isCodingTokenProvider(scope.provider) && !selected.has(scope.provider)) {
      selected.set(scope.provider, scope);
    }
  }
  const tokenBreakdown = tokenBreakdownFromScopes(selected.values());
  if (!tokenBreakdown) return null;
  return {
    tokenBreakdown,
    agents: fallbackTelemetry?.agents ?? { crossProviderDays: 0, activeDays: 0, agents: [] },
    totalTokens: scopeTokens(tokenBreakdown.total),
    ...(fallbackTelemetry?.sourcePath ? { sourcePath: fallbackTelemetry.sourcePath } : {}),
  };
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
      if (!isCodingTokenProvider(provider)) continue;
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
