// Pure normalizer: Anthropic Cost Report buckets -> NormalizedRecord[]. Real USD.

import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import type { AnthropicCostBucket } from "./client.ts";

export function normalizeCostReport(buckets: AnthropicCostBucket[]): NormalizedRecord[] {
  const out: NormalizedRecord[] = [];
  for (const bucket of buckets) {
    for (const r of bucket.results ?? []) {
      const value = typeof r.amount === "string" ? parseFloat(r.amount) : (r.amount ?? 0);
      if (!value) continue;
      out.push({
        ts: bucket.starting_at,
        provider: "anthropic",
        category: "llm",
        operation: "usage",
        model: r.model ?? undefined,
        quantity: 1,
        unit: "request",
        rawAmount: Number(value.toFixed(6)),
        rawUnit: (r.currency ?? "usd").toLowerCase(),
        usdEst: Number(value.toFixed(6)),
        source: "ledger",
        confidence: "high",
        verified: false,
      });
    }
  }
  return out;
}
