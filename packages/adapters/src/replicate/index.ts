// Replicate adapter — implements the @vibetracker/core Adapter contract.
// Tier-1 (ledger): pulls the real per-prediction history. Replicate bills per
// GPU-second, so each prediction's metrics.predict_time IS the native usage amount.

import type { Adapter, AdapterCtx, DateRange } from "../../../core/src/adapter.ts";
import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import type { ReplicateClient } from "./client.ts";
import { normalizePredictions } from "./normalize.ts";

export interface ReplicateAdapterOpts {
  /** USD per GPU-second (estimate). Omit to leave usdEst undefined. */
  usdPerSecond?: number;
  /** Safety cap on pages walked per getUsage call. */
  maxPages?: number;
}

export function createReplicateAdapter(client: ReplicateClient, opts: ReplicateAdapterOpts = {}): Adapter {
  const maxPages = opts.maxPages ?? 1000;
  return {
    id: "replicate",
    categories: ["image", "video", "audio", "llm"],
    auth: { kind: "apiKey", hint: "read-only Replicate API token (Bearer r8_...)", serverVerifiable: true },
    capabilities: { ledger: true, balance: false, feed: false },

    async getUsage(range: DateRange, ctx: AdapterCtx): Promise<NormalizedRecord[]> {
      const out: NormalizedRecord[] = [];
      const fromT = Date.parse(range.from);
      const toT = Date.parse(range.to);
      // Replicate rejects created_after older than ~3 months with a 416; clamp the query
      // floor to a safe window (we still filter locally by the caller's real `range`).
      const REPLICATE_MAX_WINDOW_MS = 80 * 24 * 60 * 60 * 1000;
      const queryFrom = new Date(Math.max(fromT, Date.now() - REPLICATE_MAX_WINDOW_MS)).toISOString();
      let cursor: string | undefined;

      for (let page = 0; page < maxPages; page++) {
        let res;
        try {
          // Server-side date bounds on the first call; the `next` cursor carries them.
          res = await client.predictions(
            cursor
              ? { cursor }
              : { createdAfter: queryFrom, createdBefore: range.to },
          );
        } catch (err) {
          // VTRS: surface, never swallow.
          ctx.telemetry.captureError(err, { area: "adapter.replicate.predictions", severity: "error", page });
          throw err;
        }

        let reachedOlder = false;
        for (const rec of normalizePredictions(res.results, { usdPerSecond: opts.usdPerSecond })) {
          const t = Date.parse(rec.ts);
          if (t < fromT) { reachedOlder = true; continue; }
          if (t > toT) continue;
          out.push(rec);
        }
        ctx.telemetry.addBreadcrumb("adapter.replicate.page", { page, fetched: res.results.length, kept: out.length });

        // List is newest-first: once a page reaches past the window, or the cursor
        // runs out, we're done.
        if (reachedOlder || res.next == null) break;
        cursor = res.next;
      }
      return out;
    },
  };
}

export { createFixtureClient, createHttpClient } from "./client.ts";
export { normalizePredictions, inferCategory } from "./normalize.ts";
export type {
  ReplicateClient,
  ReplicatePrediction,
  ReplicatePage,
  ReplicateAccount,
} from "./client.ts";
