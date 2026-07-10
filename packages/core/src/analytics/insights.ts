import type { NormalizedRecord } from "../schema/record.ts";

export interface TrendPoint {
  period: string;
  records: number;
  usd: number;
}

export interface ExpensiveWorkflow {
  key: string;
  records: number;
  usd: number;
}

export interface ProviderOverlap {
  category: string;
  providers: string[];
}

export interface CheapestEquivalent {
  category: string;
  provider: string;
  avgUsdPerRecord: number;
}

export interface UsageInsights {
  generatedAt: string;
  range: { from?: string; to?: string };
  daily: TrendPoint[];
  weekly: TrendPoint[];
  monthly: TrendPoint[];
  forecast: {
    trailingDays: number;
    dailyAvgUsd: number;
    projected30dUsd: number;
  };
  budget?: {
    usd: number;
    projectedRatio: number;
    status: "ok" | "near" | "over";
  };
  alerts: string[];
  expensiveWorkflows: ExpensiveWorkflow[];
  overlaps: ProviderOverlap[];
  cheapest: CheapestEquivalent[];
  localSavingsUsd: number;
}

function periodKey(ts: string, mode: "day" | "week" | "month"): string {
  const d = new Date(ts);
  if (mode === "day") return ts.slice(0, 10);
  if (mode === "month") return ts.slice(0, 7);
  const day = d.getUTCDay();
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - ((day + 6) % 7)));
  return monday.toISOString().slice(0, 10);
}

function trends(records: NormalizedRecord[], mode: "day" | "week" | "month"): TrendPoint[] {
  const map = new Map<string, TrendPoint>();
  for (const record of records) {
    const key = periodKey(record.ts, mode);
    const point = map.get(key) ?? { period: key, records: 0, usd: 0 };
    point.records += 1;
    point.usd = Number((point.usd + (record.usdEst ?? 0)).toFixed(2));
    map.set(key, point);
  }
  return [...map.values()].sort((a, b) => a.period.localeCompare(b.period));
}

function recentUsd(records: NormalizedRecord[], trailingDays: number): number {
  if (!records.length) return 0;
  const newest = Math.max(...records.map((r) => Date.parse(r.ts)).filter(Number.isFinite));
  const cutoff = newest - trailingDays * 86400000;
  return Number(records
    .filter((r) => Date.parse(r.ts) >= cutoff)
    .reduce((sum, r) => sum + (r.usdEst ?? 0), 0)
    .toFixed(2));
}

function expensive(records: NormalizedRecord[]): ExpensiveWorkflow[] {
  const map = new Map<string, ExpensiveWorkflow>();
  for (const r of records) {
    const key = `${r.provider}/${r.category}/${r.operation}`;
    const row = map.get(key) ?? { key, records: 0, usd: 0 };
    row.records += 1;
    row.usd = Number((row.usd + (r.usdEst ?? 0)).toFixed(2));
    map.set(key, row);
  }
  return [...map.values()].filter((r) => r.usd > 0).sort((a, b) => b.usd - a.usd).slice(0, 10);
}

function overlaps(records: NormalizedRecord[]): ProviderOverlap[] {
  const map = new Map<string, Set<string>>();
  for (const r of records) {
    const set = map.get(r.category) ?? new Set<string>();
    set.add(r.provider);
    map.set(r.category, set);
  }
  return [...map.entries()]
    .map(([category, providers]) => ({ category, providers: [...providers].sort() }))
    .filter((row) => row.providers.length > 1)
    .sort((a, b) => b.providers.length - a.providers.length || a.category.localeCompare(b.category));
}

function cheapest(records: NormalizedRecord[]): CheapestEquivalent[] {
  const byCategory = new Map<string, Map<string, { usd: number; count: number }>>();
  for (const r of records) {
    if (r.usdEst == null) continue;
    const providers = byCategory.get(r.category) ?? new Map<string, { usd: number; count: number }>();
    const row = providers.get(r.provider) ?? { usd: 0, count: 0 };
    row.usd += r.usdEst;
    row.count += 1;
    providers.set(r.provider, row);
    byCategory.set(r.category, providers);
  }
  return [...byCategory.entries()].flatMap(([category, providers]) => {
    if (providers.size < 2) return [];
    const sorted = [...providers.entries()]
      .map(([provider, row]) => ({ category, provider, avgUsdPerRecord: Number((row.usd / Math.max(1, row.count)).toFixed(4)) }))
      .sort((a, b) => a.avgUsdPerRecord - b.avgUsdPerRecord);
    return sorted.slice(0, 1);
  }).sort((a, b) => a.category.localeCompare(b.category));
}

export function computeUsageInsights(records: NormalizedRecord[], opts: { budgetUsd?: number; trailingDays?: number } = {}): UsageInsights {
  const times = records.map((r) => Date.parse(r.ts)).filter(Number.isFinite);
  const trailingDays = opts.trailingDays ?? 30;
  const recent = recentUsd(records, trailingDays);
  const dailyAvgUsd = Number((recent / Math.max(1, trailingDays)).toFixed(2));
  const projected30dUsd = Number((dailyAvgUsd * 30).toFixed(2));
  const localSavingsUsd = Number(records.filter((r) => r.source === "local").reduce((sum, r) => sum + (r.usdEst ?? 0), 0).toFixed(2));
  const alerts: string[] = [];
  const budget = opts.budgetUsd != null
    ? {
      usd: opts.budgetUsd,
      projectedRatio: Number((projected30dUsd / Math.max(0.01, opts.budgetUsd)).toFixed(2)),
      status: projected30dUsd > opts.budgetUsd ? "over" as const : projected30dUsd >= opts.budgetUsd * 0.8 ? "near" as const : "ok" as const,
    }
    : undefined;
  if (opts.budgetUsd != null && projected30dUsd > opts.budgetUsd) {
    alerts.push(`projected 30d spend ${projected30dUsd.toFixed(2)} exceeds budget ${opts.budgetUsd.toFixed(2)}`);
  } else if (budget?.status === "near") {
    alerts.push(`projected 30d spend ${projected30dUsd.toFixed(2)} is close to budget ${opts.budgetUsd!.toFixed(2)}`);
  }
  if (expensive(records)[0]?.usd && expensive(records)[0].usd > Math.max(50, projected30dUsd * 0.5)) {
    alerts.push(`top workflow dominates spend: ${expensive(records)[0].key}`);
  }
  return {
    generatedAt: new Date().toISOString(),
    range: times.length ? { from: new Date(Math.min(...times)).toISOString(), to: new Date(Math.max(...times)).toISOString() } : {},
    daily: trends(records, "day"),
    weekly: trends(records, "week"),
    monthly: trends(records, "month"),
    forecast: { trailingDays, dailyAvgUsd, projected30dUsd },
    budget,
    alerts,
    expensiveWorkflows: expensive(records),
    overlaps: overlaps(records),
    cheapest: cheapest(records),
    localSavingsUsd,
  };
}
