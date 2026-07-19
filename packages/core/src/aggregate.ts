// Pure aggregation over NormalizedRecord[] — shared by the CLI and (later) the site.

import type { NormalizedRecord } from "./schema/record.ts";

export type GroupBy = "provider" | "category" | "model" | "day" | "account" | "profile" | "team";

export interface AggRow {
  key: string;
  count: number;        // number of records in the group
  ops: number;          // sum of `quantity` — the real operation count (a per-day record can stand
                        // for many operations, so this is NOT the record count)
  credits: number;      // sum of rawAmount where rawUnit === "credits"
  raw: number;          // sum of rawAmount regardless of unit
  usd?: number;         // sum of usdEst where present (estimate)
}

export interface Totals {
  count: number;
  credits: number;
  usd?: number;
  providers: number;
}

function keyOf(r: NormalizedRecord, by: GroupBy): string {
  if (by === "provider") return r.provider;
  if (by === "category") return r.category;
  if (by === "model") return r.model ?? "(unknown)";
  if (by === "account") return r.accountId ?? "(unscoped)";
  if (by === "profile") return r.profileId ?? "(unscoped)";
  if (by === "team") return r.teamId ?? "(unscoped)";
  return r.ts.slice(0, 10); // day
}

export function aggregate(records: NormalizedRecord[], by: GroupBy): AggRow[] {
  const map = new Map<string, AggRow>();
  for (const r of records) {
    const k = keyOf(r, by);
    const row = map.get(k) ?? { key: k, count: 0, ops: 0, credits: 0, raw: 0 };
    row.count += 1;
    // A record's `quantity` is how many operations it represents (1 per generation/message, but a
    // per-day rollup can carry hundreds). Non-positive quantities are inactive synthetic/history
    // rows, not operations. Token-unit records collapse any positive quantity or rawAmount
    // magnitude to one operation because their quantities represent token volume, not op counts.
    const hasPositiveQuantity = Number.isFinite(r.quantity) && r.quantity > 0;
    const hasPositiveRawAmount = Number.isFinite(r.rawAmount) && r.rawAmount > 0;
    row.ops += r.unit === "token"
      ? (hasPositiveQuantity || hasPositiveRawAmount ? 1 : 0)
      : (hasPositiveQuantity ? r.quantity : 0);
    row.raw += r.rawAmount;
    if (r.rawUnit === "credits") row.credits += r.rawAmount;
    if (r.usdEst != null) row.usd = Number(((row.usd ?? 0) + r.usdEst).toFixed(4));
    map.set(k, row);
  }
  return [...map.values()].sort((a, b) => b.raw - a.raw);
}

export function totals(records: NormalizedRecord[]): Totals {
  const t: Totals = { count: records.length, credits: 0, providers: 0 };
  const providers = new Set<string>();
  let usd = 0;
  let anyUsd = false;
  for (const r of records) {
    providers.add(r.provider);
    if (r.rawUnit === "credits") t.credits += r.rawAmount;
    if (r.usdEst != null) { usd += r.usdEst; anyUsd = true; }
  }
  t.providers = providers.size;
  if (anyUsd) t.usd = Number(usd.toFixed(2));
  return t;
}
