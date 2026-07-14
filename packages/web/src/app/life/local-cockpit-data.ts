interface AggregateRow {
  key: string;
  count: number;
  ops: number;
  usd: number;
}

interface TrendPoint {
  period: string;
  records: number;
  usd: number;
}

interface WorkflowRow {
  key: string;
  records: number;
  usd: number;
}

interface OverlapRow {
  category: string;
  providers: string[];
}

export interface LocalStatsPayload {
  range: { from?: string; to?: string };
  totals: { count: number; credits: number; usd: number; providers: number };
  byProvider: AggregateRow[];
  byDay: AggregateRow[];
  localSavingsUsd: number;
}

export interface LocalInsightsPayload {
  generatedAt: string;
  forecast: { trailingDays: number; dailyAvgUsd: number; projected30dUsd: number };
  alerts: string[];
  expensiveWorkflows: WorkflowRow[];
  overlaps: OverlapRow[];
  localSavingsUsd: number;
}

export interface CockpitSnapshot {
  generatedAt: string;
  range: { from?: string; to?: string };
  totals: {
    records: number;
    operations: number;
    providers: number;
    credits: number;
    usd: number;
    projected30dUsd: number;
    localSavingsUsd: number;
  };
  providers: Array<AggregateRow & { share: number }>;
  daily: Array<AggregateRow & { level: number }>;
  alerts: string[];
  workflows: WorkflowRow[];
  overlaps: OverlapRow[];
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} is not an object`);
  return value as Record<string, unknown>;
}

function number(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function aggregateRows(value: unknown): AggregateRow[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => {
    const row = object(entry, "aggregate row");
    return {
      key: text(row.key, "unknown"),
      count: number(row.count),
      ops: number(row.ops),
      usd: number(row.usd),
    };
  });
}

export function parseLocalStats(value: unknown): LocalStatsPayload {
  const root = object(value, "stats payload");
  const totals = object(root.totals, "stats totals");
  const range = object(root.range ?? {}, "stats range");
  return {
    range: { from: text(range.from) || undefined, to: text(range.to) || undefined },
    totals: {
      count: number(totals.count),
      credits: number(totals.credits),
      usd: number(totals.usd),
      providers: number(totals.providers),
    },
    byProvider: aggregateRows(root.byProvider),
    byDay: aggregateRows(root.byDay),
    localSavingsUsd: number(root.localSavingsUsd),
  };
}

export function parseLocalInsights(value: unknown): LocalInsightsPayload {
  const root = object(value, "insights payload");
  const forecast = object(root.forecast, "insights forecast");
  const workflows = Array.isArray(root.expensiveWorkflows) ? root.expensiveWorkflows : [];
  const overlaps = Array.isArray(root.overlaps) ? root.overlaps : [];
  return {
    generatedAt: text(root.generatedAt, new Date(0).toISOString()),
    forecast: {
      trailingDays: number(forecast.trailingDays, 30),
      dailyAvgUsd: number(forecast.dailyAvgUsd),
      projected30dUsd: number(forecast.projected30dUsd),
    },
    alerts: Array.isArray(root.alerts) ? root.alerts.filter((item): item is string => typeof item === "string") : [],
    expensiveWorkflows: workflows.map((entry) => {
      const row = object(entry, "workflow row");
      return { key: text(row.key, "unknown"), records: number(row.records), usd: number(row.usd) };
    }),
    overlaps: overlaps.map((entry) => {
      const row = object(entry, "overlap row");
      return {
        category: text(row.category, "unknown"),
        providers: Array.isArray(row.providers) ? row.providers.filter((item): item is string => typeof item === "string") : [],
      };
    }),
    localSavingsUsd: number(root.localSavingsUsd),
  };
}

export function buildCockpitSnapshot(stats: LocalStatsPayload, insights: LocalInsightsPayload): CockpitSnapshot {
  const operations = stats.byProvider.reduce((sum, row) => sum + row.ops, 0);
  const denominator = stats.totals.usd > 0 ? stats.totals.usd : Math.max(operations, 1);
  const providers = [...stats.byProvider]
    .sort((a, b) => (b.usd || b.ops) - (a.usd || a.ops))
    .slice(0, 7)
    .map((row) => ({ ...row, share: Math.min(100, ((stats.totals.usd > 0 ? row.usd : row.ops) / denominator) * 100) }));
  const recentDays = [...stats.byDay].sort((a, b) => a.key.localeCompare(b.key)).slice(-21);
  const maxDay = Math.max(...recentDays.map((row) => row.usd || row.ops), 1);
  return {
    generatedAt: insights.generatedAt,
    range: stats.range,
    totals: {
      records: stats.totals.count,
      operations,
      providers: stats.totals.providers,
      credits: stats.totals.credits,
      usd: stats.totals.usd,
      projected30dUsd: insights.forecast.projected30dUsd,
      localSavingsUsd: Math.max(stats.localSavingsUsd, insights.localSavingsUsd),
    },
    providers,
    daily: recentDays.map((row) => ({ ...row, level: Math.max(2, ((row.usd || row.ops) / maxDay) * 100) })),
    alerts: insights.alerts.slice(0, 4),
    workflows: insights.expensiveWorkflows.slice(0, 4),
    overlaps: insights.overlaps.slice(0, 4),
  };
}
