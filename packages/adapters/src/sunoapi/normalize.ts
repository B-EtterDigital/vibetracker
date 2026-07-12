// Pure normalizer: a sunoapi.org credit balance -> a single NormalizedRecord snapshot.
// sunoapi.org exposes no generation history, so this records the remaining balance as of `now`
// (source balance_delta); actual consumption is the delta between snapshots across syncs.

import type { NormalizedRecord } from "../../../core/src/schema/record.ts";

export interface SunoApiNormalizeOpts {
  /** USD per credit for the plan (estimate). Omit to leave usdEst undefined. */
  creditUsd?: number;
  /** Snapshot timestamp (ISO). Defaults to now; injectable for deterministic tests. */
  now?: string;
}

export function balanceRecord(credits: number, opts: SunoApiNormalizeOpts = {}): NormalizedRecord {
  const rec: NormalizedRecord = {
    ts: opts.now ?? new Date().toISOString(),
    provider: "sunoapi",
    category: "music",
    operation: "balance",
    quantity: 1,
    unit: "request",
    rawAmount: Math.max(0, credits),
    rawUnit: "credits",
    source: "balance_delta", // a balance reading, not a per-op ledger
    confidence: "high",       // the balance itself is exact; only usdEst is an estimate
    verified: false,
  };
  if (opts.creditUsd != null) rec.usdEst = Number((Math.max(0, credits) * opts.creditUsd).toFixed(4));
  return rec;
}
