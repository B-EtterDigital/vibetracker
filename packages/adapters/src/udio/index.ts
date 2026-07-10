// Udio adapter — implements the @vibetracker/core Adapter contract.
// Tier-2 (feed_recon): Udio has no credit ledger, so usage is reconstructed from the
// generation feed × a known credits-per-generation constant. Balance comes from the
// account credits view. Auth is a reverse-engineered web session cookie (ToS-gray,
// personal-use only), which is NOT server-verifiable.

import type { Adapter, AdapterCtx, DateRange, Balance } from "../../../core/src/adapter.ts";
import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import type { UdioClient } from "./client.ts";
import { normalizeFeed } from "./normalize.ts";

export interface UdioAdapterOpts {
  /** Credits charged per generation (estimate). ⚠ VERIFY */
  creditsPerGen?: number;
  /** USD per credit for the plan (estimate). Omit to leave usdEst undefined. */
  creditUsd?: number;
  /** Safety cap on feed pages walked per getUsage call. */
  maxPages?: number;
}

export function createUdioAdapter(client: UdioClient, opts: UdioAdapterOpts = {}): Adapter {
  const maxPages = opts.maxPages ?? 1000;
  return {
    id: "udio",
    categories: ["music"],
    auth: {
      kind: "cookie",
      hint: "Udio web session cookie (sb-api-auth-token) — reverse-engineered, personal-use only",
      serverVerifiable: false,
    },
    capabilities: { ledger: false, balance: true, feed: true },

    async getUsage(range: DateRange, ctx: AdapterCtx): Promise<NormalizedRecord[]> {
      const out: NormalizedRecord[] = [];
      const fromT = Date.parse(range.from);
      const toT = Date.parse(range.to);
      let cursor: string | undefined;

      for (let page = 0; page < maxPages; page++) {
        let res;
        try {
          res = await client.feed({ cursor, pageSize: 100 });
        } catch (err) {
          // VTRS: surface, never swallow.
          ctx.telemetry.captureError(err, { area: "adapter.udio.feed", severity: "error", page });
          throw err;
        }

        let reachedOlder = false;
        for (const rec of normalizeFeed(res.data, {
          creditsPerGen: opts.creditsPerGen,
          creditUsd: opts.creditUsd,
        })) {
          const t = Date.parse(rec.ts);
          if (t < fromT) { reachedOlder = true; continue; }
          if (t > toT) continue;
          out.push(rec);
        }
        ctx.telemetry.addBreadcrumb("adapter.udio.page", { page, fetched: res.data.length, kept: out.length });

        // Feed is newest-first, so once we cross below the window we can stop. ⚠ VERIFY ordering
        if (reachedOlder || res.next == null) break;
        cursor = res.next;
      }
      return out;
    },

    async getBalance(ctx: AdapterCtx): Promise<Balance> {
      let c;
      try {
        c = await client.credits();
      } catch (err) {
        ctx.telemetry.captureError(err, { area: "adapter.udio.credits", severity: "error" });
        throw err;
      }
      const balance: Balance = { rawAmount: c.credits, rawUnit: "credits", fetchedAt: new Date().toISOString() };
      if (opts.creditUsd != null) balance.usdEst = Number((c.credits * opts.creditUsd).toFixed(2));
      return balance;
    },
  };
}

export { createFixtureClient, createSessionClient } from "./client.ts";
export { normalizeFeed, isConsuming, DEFAULT_CREDITS_PER_GEN } from "./normalize.ts";
export type { UdioClient, UdioSong, UdioFeedPage, UdioCredits, UdioFeedArgs, SessionClientOpts } from "./client.ts";
