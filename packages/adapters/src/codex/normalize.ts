// Codex session usage entries -> NormalizedRecord[]. Pure. One record per session;
// cost = non-cached input + cached input + output, each × its per-token model rate.

import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import type { CodexUsageEntry } from "./parse.ts";
import { priceFor } from "./pricing.ts";

export function toRecords(entries: CodexUsageEntry[]): NormalizedRecord[] {
  return entries.map((e) => {
    const rec: NormalizedRecord = {
      ts: e.ts,
      provider: "codex",
      category: "coding",
      operation: "session",
      model: e.model,
      quantity: e.totalTokens,
      unit: "token",
      rawAmount: e.totalTokens,
      rawUnit: "tokens",
      tokenUsage: {
        input: e.nonCachedInput,
        output: e.output,
        cacheRead: e.cachedInput,
        cacheCreate: 0,
        reasoningOutput: e.reasoningOutput,
      },
      source: "log",
      confidence: "medium",
      verified: false,
    };
    const price = priceFor(e.model);
    if (price) {
      rec.usdEst = Number(
        (e.nonCachedInput * price.input + e.cachedInput * price.cachedInput +
         e.output * price.output).toFixed(6),
      );
    }
    return rec;
  });
}
