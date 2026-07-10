// Rich stats over usage records — breakdowns by every dimension + a local-vs-hosted
// savings figure. Pure; built on aggregate()/totals().

import type { NormalizedRecord } from "./schema/record.ts";
import { aggregate, totals, type AggRow, type Totals } from "./aggregate.ts";

export interface Stats {
  range: { from?: string; to?: string };
  totals: Totals;
  byProvider: AggRow[];
  byCategory: AggRow[];
  byModel: AggRow[];
  byAccount: AggRow[];
  byProfile: AggRow[];
  byTeam: AggRow[];
  byDay: AggRow[];            // chronological
  topModels: AggRow[];        // by spend/volume, top 10
  localSavingsUsd: number;    // usd that local runs would have cost on a hosted API (source: local)
}

export function computeStats(records: NormalizedRecord[]): Stats {
  const times = records.map((r) => Date.parse(r.ts)).filter((n) => !Number.isNaN(n));
  const range = times.length
    ? { from: new Date(Math.min(...times)).toISOString(), to: new Date(Math.max(...times)).toISOString() }
    : {};

  const byDay = aggregate(records, "day").sort((a, b) => a.key.localeCompare(b.key));
  const localSavingsUsd = Number(
    records.filter((r) => r.source === "local").reduce((s, r) => s + (r.usdEst ?? 0), 0).toFixed(2),
  );

  return {
    range,
    totals: totals(records),
    byProvider: aggregate(records, "provider"),
    byCategory: aggregate(records, "category"),
    byModel: aggregate(records, "model"),
    byAccount: aggregate(records, "account"),
    byProfile: aggregate(records, "profile"),
    byTeam: aggregate(records, "team"),
    byDay,
    topModels: aggregate(records, "model").slice(0, 10),
    localSavingsUsd,
  };
}
