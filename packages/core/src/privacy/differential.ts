import type { NormalizedRecord, Category } from "../schema/record.ts";

export interface PrivateAggregateRow {
  key: string;
  records: number;
  usd: number;
}

export interface PrivateAggregate {
  schema: "vibetracker.private-aggregate/0.1";
  epsilon: number;
  groupBy: "provider" | "category";
  generatedAt: string;
  rows: PrivateAggregateRow[];
  note: string;
}

export interface PrivateAggregateOpts {
  epsilon?: number;
  groupBy?: "provider" | "category";
  generatedAt?: string;
  random?: () => number;
}

const MIN_EPSILON = 0.1;
const MAX_EPSILON = 20;

function clampEpsilon(value: number | undefined): number {
  if (!Number.isFinite(value ?? NaN)) return 1;
  return Math.min(MAX_EPSILON, Math.max(MIN_EPSILON, value!));
}

function laplace(scale: number, random: () => number): number {
  const u = random() - 0.5;
  return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
}

export function privateAggregate(records: NormalizedRecord[], opts: PrivateAggregateOpts = {}): PrivateAggregate {
  const epsilon = clampEpsilon(opts.epsilon);
  const groupBy = opts.groupBy ?? "provider";
  const random = opts.random ?? Math.random;
  const grouped = new Map<string, { records: number; usd: number }>();
  for (const record of records) {
    const key = groupBy === "category" ? record.category as Category : record.provider;
    const row = grouped.get(key) ?? { records: 0, usd: 0 };
    row.records += 1;
    row.usd += record.usdEst ?? 0;
    grouped.set(key, row);
  }
  const rows = [...grouped.entries()].map(([key, row]) => ({
    key,
    records: Math.max(0, Math.round(row.records + laplace(1 / epsilon, random))),
    usd: Number(Math.max(0, row.usd + laplace(2 / epsilon, random)).toFixed(2)),
  })).sort((a, b) => b.usd - a.usd || b.records - a.records || a.key.localeCompare(b.key));
  return {
    schema: "vibetracker.private-aggregate/0.1",
    epsilon,
    groupBy,
    generatedAt: opts.generatedAt ?? new Date().toISOString(),
    rows,
    note: "Differentially private aggregate. Raw records are intentionally omitted.",
  };
}
