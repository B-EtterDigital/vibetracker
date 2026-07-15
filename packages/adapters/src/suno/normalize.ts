// Pure normalizer: Suno clip feed -> NormalizedRecord[] via feed-reconstruction.
// No per-op ledger exists, so cost is reconstructed from a credits-per-clip constant.

import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import type { SunoClip } from "./client.ts";

// ⚠ VERIFY: Suno bills ~10 credits per generation which yields 2 tracks (~5/track).
export const DEFAULT_CREDITS_PER_CLIP = 5;

// Clips that represent real consumption (errored generations aren't billed).
function isConsuming(clip: SunoClip): boolean {
  const s = (clip.status ?? "complete").toLowerCase();
  return s !== "error" && s !== "failed";
}

export interface SunoNormalizeOpts { creditsPerClip?: number; creditUsd?: number; }

export function normalizeFeed(clips: SunoClip[], opts: SunoNormalizeOpts = {}): NormalizedRecord[] {
  const perClip = opts.creditsPerClip ?? DEFAULT_CREDITS_PER_CLIP;
  const out: NormalizedRecord[] = [];
  for (const clip of clips) {
    if (!isConsuming(clip)) continue;
    const rec: NormalizedRecord = {
      ts: clip.created_at,
      provider: "suno",
      category: "music",
      operation: "generate",
      model: clip.model_name,
      quantity: 1,
      unit: "request",
      rawAmount: perClip,
      rawUnit: "credits",
      outputQuantity: 1,
      outputUnit: "track",
      sourceEventId: clip.id,
      source: "feed_recon",   // reconstructed, not a real ledger
      confidence: "medium",   // estimated cost
      verified: false,
    };
    if (opts.creditUsd != null) rec.usdEst = Number((perClip * opts.creditUsd).toFixed(6));
    out.push(rec);
  }
  return out;
}
