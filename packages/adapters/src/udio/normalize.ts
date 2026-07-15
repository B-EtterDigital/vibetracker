// Pure normalizer: Udio generation feed -> VibeTRACKER NormalizedRecord[].
// No I/O, no deps — this is the tested heart of the adapter.
//
// TIER: feed-reconstruction. Udio exposes no per-op credit ledger, so we reconstruct usage
// from the library/feed of generations and multiply by a KNOWN-CONSTANT credits-per-generation.
// That constant is the weak link and is intentionally overridable + flagged ⚠ VERIFY.
//
// NUANCE (⚠ VERIFY): a single Udio "generation" request typically renders TWO song variations,
// which surface as two feed items. Per the VibeTRACKER contract we emit ONE record per feed
// item (quantity 1, unit "request", rawAmount = creditsPerGen). If Udio bills per request
// rather than per song, this over-counts 2x — hence source "feed_recon" / confidence "medium".

import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import type { UdioSong } from "./client.ts";

/**
 * Credits consumed per generation. Udio publishes no stable per-op price, so this is a
 * placeholder constant and MUST be treated as an estimate. ⚠ VERIFY against a real account.
 */
export const DEFAULT_CREDITS_PER_GEN = 10;

// Statuses that did NOT consume credits (failed generations are refunded; unfinished ones
// haven't settled yet). Anything else counts as a completed, credit-consuming generation.
const NON_CONSUMING_STATUS = new Set(["failed", "error", "canceled", "cancelled"]); // ⚠ VERIFY

export interface NormalizeOpts {
  /** Credits charged per generation. Defaults to DEFAULT_CREDITS_PER_GEN. ⚠ VERIFY */
  creditsPerGen?: number;
  /** USD per credit, if known. When set, usdEst is populated as a labelled ESTIMATE. */
  creditUsd?: number;
}

/** True when a feed item represents a settled, credit-consuming generation. */
export function isConsuming(song: UdioSong): boolean {
  if (song.status && NON_CONSUMING_STATUS.has(song.status.toLowerCase())) return false;
  if (song.finished === false) return false; // still rendering — not yet settled  ⚠ VERIFY
  return true;
}

export function normalizeFeed(songs: UdioSong[], opts: NormalizeOpts = {}): NormalizedRecord[] {
  const creditsPerGen = opts.creditsPerGen ?? DEFAULT_CREDITS_PER_GEN;
  const out: NormalizedRecord[] = [];
  for (const song of songs) {
    if (!isConsuming(song)) continue; // skip failed / in-flight generations
    const record: NormalizedRecord = {
      ts: song.created_at,
      provider: "udio",
      category: "music",
      operation: "generate",
      quantity: 1,
      unit: "request",
      rawAmount: creditsPerGen,
      rawUnit: "credits",
      outputQuantity: 1,
      outputUnit: "track",
      sourceEventId: song.id,
      source: "feed_recon",
      confidence: "medium",
      verified: false,
    };
    if (song.model) record.model = song.model;
    if (opts.creditUsd != null) record.usdEst = Number((creditsPerGen * opts.creditUsd).toFixed(4));
    out.push(record);
  }
  return out;
}
