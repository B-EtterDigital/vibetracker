// Claude Code usage entries -> NormalizedRecord[]. Pure. Cost computed from the
// 4-way token split × model pricing (input/output/cache-write/cache-read differ).

import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import type { ClaudeUsageEntry } from "./parse.ts";
import { priceFor } from "./pricing.ts";

export function toRecords(entries: ClaudeUsageEntry[]): NormalizedRecord[] {
  return entries.map((e) => {
    const total = e.input + e.output + e.cacheWrite + e.cacheRead;
    const rec: NormalizedRecord = {
      ts: e.ts,
      provider: "claude-code",
      category: "coding",
      operation: "message",
      model: e.model,
      quantity: 1,
      unit: "token",
      rawAmount: total,
      rawUnit: "tokens",
      tokenUsage: {
        input: e.input,
        output: e.output,
        cacheRead: e.cacheRead,
        cacheCreate: e.cacheWrite,
      },
      source: "log",
      confidence: "high",
      verified: false,
    };
    const price = priceFor(e.model);
    if (price) {
      rec.usdEst = Number(
        (e.input * price.input + e.output * price.output +
         e.cacheWrite * price.cacheWrite + e.cacheRead * price.cacheRead).toFixed(6),
      );
    }
    return rec;
  });
}
