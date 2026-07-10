// Pure normalizer: OpenAI Costs buckets -> NormalizedRecord[]. This API returns real
// USD per line item, so usdEst is authoritative here (rawUnit = usd).

import type { NormalizedRecord, Category } from "../../../core/src/schema/record.ts";
import type { OpenAICostBucket } from "./client.ts";

export function inferCategory(lineItem: string | null): Category {
  const s = (lineItem ?? "").toLowerCase();
  if (/image|dall[\s-]?e|gpt-image/.test(s)) return "image";
  if (/whisper|tts|audio|realtime|transcribe|speech/.test(s)) return "audio";
  if (/embed/.test(s)) return "llm";
  return "llm";
}

export function normalizeCosts(buckets: OpenAICostBucket[]): NormalizedRecord[] {
  const out: NormalizedRecord[] = [];
  for (const bucket of buckets) {
    const ts = new Date(bucket.start_time * 1000).toISOString();
    for (const r of bucket.results ?? []) {
      // amount.value arrives as a number OR a numeric string depending on API version
      const value = Number(r.amount?.value ?? 0);
      if (!Number.isFinite(value) || value === 0) continue;
      out.push({
        ts,
        provider: "openai",
        category: inferCategory(r.line_item),
        operation: "usage",
        model: r.line_item ?? undefined,
        quantity: 1,
        unit: "request",
        rawAmount: Number(value.toFixed(6)),
        rawUnit: (r.amount?.currency ?? "usd").toLowerCase(),
        usdEst: Number(value.toFixed(6)),
        source: "ledger",
        confidence: "high",
        verified: false,
      });
    }
  }
  return out;
}
