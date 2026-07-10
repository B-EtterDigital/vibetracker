// Luma (Dream Machine) adapter — implements the @vibetracker/core Adapter contract.
// Tier: feed_recon (generation feed) + balance. Luma exposes no per-op spend ledger,
// so `capabilities.ledger` is false; usage is reconstructed from the generations feed
// and (optionally) a per-model credit price sheet.

import type { Adapter, AdapterCtx, DateRange, Balance } from "../../../core/src/adapter.ts";
import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import type { LumaClient } from "./client.ts";
import { normalizeGenerations, type NormalizeOpts } from "./normalize.ts";

export interface LumaAdapterOpts extends NormalizeOpts {
  /** Page size for the generations feed. */
  pageSize?: number;
  /** Safety cap on pages walked per getUsage call. */
  maxPages?: number;
}

export function createLumaAdapter(client: LumaClient, opts: LumaAdapterOpts = {}): Adapter {
  const pageSize = opts.pageSize ?? 100;
  const maxPages = opts.maxPages ?? 1000;

  return {
    id: "luma",
    categories: ["video", "image"],
    auth: { kind: "apiKey", hint: "Luma Dream Machine API key (Bearer)", serverVerifiable: true },
    // Feed + balance, no authoritative per-op spend ledger.
    capabilities: { ledger: false, balance: true, feed: true },

    async getUsage(range: DateRange, ctx: AdapterCtx): Promise<NormalizedRecord[]> {
      const out: NormalizedRecord[] = [];
      const fromT = Date.parse(range.from);
      const toT = Date.parse(range.to);
      let offset = 0;

      // Offset pagination. Feed ordering isn't guaranteed (⚠ VERIFY newest-first), so we
      // walk every page up to maxPages and filter by created_at rather than early-stopping
      // on date — dropping records under an unknown sort order would be worse than a few
      // extra reads.
      for (let page = 0; page < maxPages; page++) {
        let res;
        try {
          res = await client.generations({ limit: pageSize, offset });
        } catch (err) {
          // VTRS: surface, never swallow.
          ctx.telemetry.captureError(err, { area: "adapter.luma.generations", severity: "error", page, offset });
          throw err;
        }

        for (const rec of normalizeGenerations(res.generations, opts)) {
          const t = Date.parse(rec.ts);
          if (t < fromT || t > toT) continue;
          out.push(rec);
        }
        ctx.telemetry.addBreadcrumb("adapter.luma.page", {
          page, offset, fetched: res.generations.length, kept: out.length,
        });

        if (!res.has_more || res.generations.length === 0) break;
        offset += res.generations.length;
      }
      return out;
    },

    async getBalance(ctx: AdapterCtx): Promise<Balance> {
      let c;
      try {
        c = await client.credits();
      } catch (err) {
        ctx.telemetry.captureError(err, { area: "adapter.luma.credits", severity: "error" });
        throw err;
      }
      // Luma documents credit_balance as available balance in USD cents (⚠ VERIFY unit);
      // usdEst is the exact cents→dollars conversion, not a pricing estimate.
      const balance: Balance = {
        rawAmount: c.credit_balance,
        rawUnit: "usd_cents",
        usdEst: Number((c.credit_balance / 100).toFixed(2)),
        fetchedAt: new Date().toISOString(),
      };
      return balance;
    },
  };
}

export { createFixtureClient, createHttpClient } from "./client.ts";
export type {
  LumaClient, LumaGeneration, LumaGenerationsPage, LumaCredits,
  LumaGenerationType, LumaGenerationState, LumaHttpOpts,
} from "./client.ts";
export { normalizeGenerations, inferCategory, DEFAULT_BILLABLE_STATES } from "./normalize.ts";
export type { NormalizeOpts } from "./normalize.ts";
