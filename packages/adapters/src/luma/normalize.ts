// Pure normalizer: Luma (Dream Machine) generation feed -> VibeTRACKER NormalizedRecord[].
// No I/O, no deps — this is the tested heart of the adapter.
//
// Honesty note: the Luma /generations endpoint is a FEED. It reports which generations
// ran (type, model, state, time) but NOT what each cost. So the best-available source is
// "feed_recon" — we count real generation events, and only attach a credit cost when the
// caller supplies a (necessarily estimated) per-model pricing map. `verified` is always
// false; nothing here was fetched from an authoritative per-op spend ledger.

import type { NormalizedRecord, Category } from "../../../core/src/schema/record.ts";
import type { LumaGeneration, LumaGenerationState } from "./client.ts";

// Which generation states count as billable usage.
// Luma refunds failed generations, and queued/dreaming aren't finished, so only
// "completed" is treated as consumed usage by default. ⚠ VERIFY refund-on-failure policy.
export const DEFAULT_BILLABLE_STATES: readonly LumaGenerationState[] = ["completed"];

/** Category from the generation_type discriminator ("video" | "image"). */
export function inferCategory(generationType: string): Category {
  const t = String(generationType).toLowerCase();
  if (t.includes("video")) return "video";
  if (t.includes("image")) return "image";
  return "other";
}

export interface NormalizeOpts {
  /**
   * Estimated credits charged per generation, keyed by model id (e.g. { "ray-2": 5000 }).
   * When a generation's model is present, the record uses unit "credit" and this amount;
   * otherwise it falls back to counting one request. Pricing is reconstructed, not billed.
   */
  creditsByModel?: Record<string, number>;
  /**
   * USD per credit. Only used together with `creditsByModel` to populate `usdEst` as a
   * labelled ESTIMATE. Omit to leave usdEst undefined.
   */
  creditUsd?: number;
  /** Generation states that count as usage. Default: DEFAULT_BILLABLE_STATES (["completed"]). */
  billableStates?: readonly string[];
}

export function normalizeGenerations(items: LumaGeneration[], opts: NormalizeOpts = {}): NormalizedRecord[] {
  const billable = new Set<string>(opts.billableStates ?? DEFAULT_BILLABLE_STATES);
  const out: NormalizedRecord[] = [];

  for (const g of items) {
    if (!billable.has(g.state)) continue; // in-progress / refunded-on-failure aren't usage

    const credits = opts.creditsByModel?.[g.model];
    const hasCredits = credits != null;

    const record: NormalizedRecord = {
      ts: g.created_at,
      provider: "luma",
      category: inferCategory(g.generation_type),
      operation: "generate",
      model: g.model,
      quantity: 1,
      unit: hasCredits ? "credit" : "request",
      rawAmount: hasCredits ? credits : 1,
      rawUnit: hasCredits ? "credits" : "request",
      // Feed reconstruction: real events, cost (if any) mapped from a static price sheet.
      source: "feed_recon",
      // The event is real (medium); a reconstructed credit cost is lower trust (low).
      confidence: hasCredits ? "low" : "medium",
      verified: false,
      sessionId: g.id,
    };
    if (hasCredits && opts.creditUsd != null) {
      record.usdEst = Number((credits * opts.creditUsd).toFixed(4));
    }
    out.push(record);
  }
  return out;
}
