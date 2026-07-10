// Pure normalizer: Higgsfield transaction ledger -> VibeTRACKER NormalizedRecord[].
// No I/O, no deps — this is the tested heart of the adapter.

import type { NormalizedRecord, Category } from "../../../core/src/schema/record.ts";
import type { HiggsfieldTx } from "./client.ts";

// Actions that represent credits actually consumed (i.e. usage).
const CONSUMPTION = new Set(["spend", "deduct"]);

// Best-effort category inference from the product/model display name.
// Ordered: check the more specific media types before the generic "image".
const CATEGORY_RULES: Array<{ re: RegExp; category: Category }> = [
  { re: /(video|seedance|kling|runway|luma|veo|sora|hailuo|minimax|wan|motion|clip|reframe)/i, category: "video" },
  { re: /(voice|audio|dub|music|song|tts|speech|sound|sfx)/i, category: "audio" },
  { re: /(3d|mesh|glb|gaussian)/i, category: "3d" },
  { re: /(banana|soul|image|photo|flux|gpt-?image|upscale|outpaint|background|portrait|sticker)/i, category: "image" },
];

export function inferCategory(displayName: string): Category {
  for (const rule of CATEGORY_RULES) if (rule.re.test(displayName)) return rule.category;
  return "other";
}

export interface NormalizeOpts {
  /** USD per credit, if known. When set, usdEst is populated as a labelled ESTIMATE. */
  creditUsd?: number;
}

export function normalizeTransactions(items: HiggsfieldTx[], opts: NormalizeOpts = {}): NormalizedRecord[] {
  const out: NormalizedRecord[] = [];
  for (const tx of items) {
    if (!CONSUMPTION.has(tx.action)) continue;     // grants/refunds aren't usage
    const rawAmount = Math.abs(tx.credits);
    const record: NormalizedRecord = {
      ts: tx.created_at,
      provider: "higgsfield",
      category: inferCategory(tx.display_name),
      operation: tx.action,
      model: tx.display_name,
      quantity: 1,
      unit: "request",
      rawAmount,
      rawUnit: "credits",
      source: "ledger",
      confidence: "high",
      verified: false,
    };
    if (opts.creditUsd != null) record.usdEst = Number((rawAmount * opts.creditUsd).toFixed(4));
    out.push(record);
  }
  return out;
}
