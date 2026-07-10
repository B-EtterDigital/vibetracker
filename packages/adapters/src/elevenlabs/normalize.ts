// Pure normalizer: ElevenLabs character-stats time series -> NormalizedRecord[].
// Native unit = characters (the thing ElevenLabs meters). USD only if a rate is given.

import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import type { ElevenCharacterStats } from "./client.ts";

export interface ElevenNormalizeOpts { usdPerChar?: number; }

export function normalizeCharacterStats(stats: ElevenCharacterStats, opts: ElevenNormalizeOpts = {}): NormalizedRecord[] {
  const series = stats.usage?.["All"] ?? [];
  const out: NormalizedRecord[] = [];
  for (let i = 0; i < (stats.time?.length ?? 0); i++) {
    const chars = series[i] ?? 0;
    if (chars <= 0) continue;
    const rec: NormalizedRecord = {
      ts: new Date(stats.time[i]).toISOString(),
      provider: "elevenlabs",
      category: "audio",
      operation: "tts",
      quantity: chars,
      unit: "character",
      rawAmount: chars,
      rawUnit: "characters",
      source: "ledger",
      confidence: "high",
      verified: false,
    };
    if (opts.usdPerChar != null) rec.usdEst = Number((chars * opts.usdPerChar).toFixed(6));
    out.push(rec);
  }
  return out;
}
