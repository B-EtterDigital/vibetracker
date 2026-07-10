// Pure normalizer: Runway daily credit-usage aggregates -> VibeTRACKER NormalizedRecord[].
// No I/O, no deps — this is the tested heart of the adapter.
//
// The source (POST /v1/organization/usage) reports, per UTC day, the NET credits spent per
// model. That is authoritative credit-spend history (source "ledger"), but it is bucketed by
// day+model, not per generation — so we emit one record per (day, model) with quantity 1.

import type { NormalizedRecord, Category } from "../../../core/src/schema/record.ts";
import type { RunwayUsageResult } from "./client.ts";

// Best-effort category inference from the Runway model id.
// Runway is a video-first platform, so anything not clearly image/audio/llm defaults to "video".
// Ordered: match the more specific media types before falling through.
const CATEGORY_RULES: Array<{ re: RegExp; category: Category }> = [
  // ElevenLabs-family audio (voice/tts/sfx/dubbing/isolation/scribe) + generic voice processing.
  { re: /(eleven_|voice_|_sts_|isolation|dub|scribe|speech|sound|sfx|audio)/i, category: "audio" },
  // Text/LLM helper models (e.g. gemini flash used for prompt work), but NOT the *image* variants.
  { re: /(gemini_2\.5_flash|gpt_(?!image)[a-z0-9]+_text|_llm)/i, category: "llm" },
  // Still-image models + image upscalers/stock/campaign renders.
  { re: /(image|precision_upscaler|marketing_stock|campaign_image|product_swap|outpaint|photo)/i, category: "image" },
];

/** Map a Runway model id to a VibeTRACKER category. Unknown ids default to "video". */
export function inferCategory(model: string): Category {
  for (const rule of CATEGORY_RULES) if (rule.re.test(model)) return rule.category;
  return "video";
}

/** A readable, category-derived operation. The usage endpoint gives model+credits only, so the
 *  operation is inferred from the category rather than reported per-op. */
export function inferOperation(category: Category): string {
  switch (category) {
    case "image": return "generate_image";
    case "audio": return "generate_audio";
    case "llm":   return "inference";
    default:      return "generate_video";
  }
}

export interface NormalizeOpts {
  /** USD per credit, if known. When set, usdEst is populated as a labelled ESTIMATE.
   *  Runway API credits are ~$0.01 each (⚠ VERIFY — varies and changes over time). */
  creditUsd?: number;
}

/**
 * Turn day/model credit aggregates into usage records.
 * - Skips amount <= 0: a non-positive day is a net refund/no-op, not usage.
 * - quantity is always 1 (one aggregate bucket); rawAmount carries the net credits.
 */
export function normalizeUsage(results: RunwayUsageResult[], opts: NormalizeOpts = {}): NormalizedRecord[] {
  const out: NormalizedRecord[] = [];
  for (const day of results) {
    // Anchor day-granular data at midnight UTC so downstream date filtering is deterministic.
    const ts = `${day.date}T00:00:00.000Z`;
    for (const used of day.usedCredits) {
      if (!(used.amount > 0)) continue; // net refund / zero day is not usage
      const category = inferCategory(used.model);
      const record: NormalizedRecord = {
        ts,
        provider: "runway",
        category,
        operation: inferOperation(category),
        model: used.model,
        quantity: 1,
        unit: "credit",
        rawAmount: used.amount,
        rawUnit: "credits",
        source: "ledger",
        // Credit totals are authoritative; granularity is daily (not per-op) and net of refunds.
        confidence: "high",
        verified: false,
      };
      if (opts.creditUsd != null) record.usdEst = Number((used.amount * opts.creditUsd).toFixed(4));
      out.push(record);
    }
  }
  return out;
}
