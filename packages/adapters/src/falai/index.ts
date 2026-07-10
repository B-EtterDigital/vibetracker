// fal.ai adapter — implements the @vibetracker/core Adapter contract.
// Tier-1 (ledger): pulls the real per-endpoint usage history and current credit balance
// from the fal Platform APIs. fal is USD-native, so usd figures come from the API itself.

import type { Adapter, AdapterCtx, DateRange, Balance } from "../../../core/src/adapter.ts";
import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import type { FalClient } from "./client.ts";
import { normalizeUsage } from "./normalize.ts";

export interface FalAdapterOpts {
  /** Safety cap on pages walked per getUsage call. */
  maxPages?: number;
  /** Page size passed to the usage endpoint. */
  pageSize?: number;
}

export function createFalAdapter(client: FalClient, opts: FalAdapterOpts = {}): Adapter {
  const maxPages = opts.maxPages ?? 1000;
  const pageSize = opts.pageSize ?? 500;

  return {
    id: "falai",
    // fal serves image, video, audio, 3d and llm endpoints under one usage ledger.
    categories: ["image", "video", "audio", "3d", "llm"],
    auth: {
      kind: "apiKey",
      hint: "fal Admin API key: FAL_KEY = \"key_id:key_secret\" (ADMIN scope, header `Authorization: Key …`)",
      serverVerifiable: true,
    },
    // fal has a real usage ledger + a billing balance; no chronological generation feed API.
    capabilities: { ledger: true, balance: true, feed: false },

    async getUsage(range: DateRange, ctx: AdapterCtx): Promise<NormalizedRecord[]> {
      const out: NormalizedRecord[] = [];
      const fromT = Date.parse(range.from);
      const toT = Date.parse(range.to);
      let cursor: string | undefined;

      for (let page = 0; page < maxPages; page++) {
        let res;
        try {
          res = await client.usage({ start: range.from, end: range.to, cursor, limit: pageSize });
        } catch (err) {
          // VTRS: surface, never swallow.
          ctx.telemetry.captureError(err, { area: "adapter.falai.usage", severity: "error", page });
          throw err;
        }

        for (const rec of normalizeUsage(res)) {
          // The endpoint already filters by start/end; re-check defensively (inclusive both ends).
          const t = Date.parse(rec.ts);
          if (Number.isFinite(t) && (t < fromT || t > toT)) continue;
          out.push(rec);
        }
        ctx.telemetry.addBreadcrumb("adapter.falai.page", {
          page,
          buckets: res.time_series?.length ?? 0,
          kept: out.length,
        });

        if (!res.has_more || res.next_cursor == null) break;
        cursor = res.next_cursor;
      }
      return out;
    },

    async getBalance(ctx: AdapterCtx): Promise<Balance> {
      let b;
      try {
        b = await client.billing();
      } catch (err) {
        ctx.telemetry.captureError(err, { area: "adapter.falai.billing", severity: "error" });
        throw err;
      }
      const credits = b.credits;
      if (!credits) {
        // Fail loudly: a balance of "nothing" would misreport remaining funds as zero.
        const err = new Error(
          "fal billing returned no credits — request expand=credits and use an ADMIN-scoped key.",
        );
        ctx.telemetry.captureError(err, { area: "adapter.falai.billing", severity: "error" });
        throw err;
      }
      const currency = (credits.currency ?? "USD").toUpperCase();
      const balance: Balance = {
        rawAmount: credits.current_balance,
        rawUnit: currency.toLowerCase(),   // fal balance is USD ("usd")
        fetchedAt: new Date().toISOString(),
      };
      if (currency === "USD") balance.usdEst = Number(credits.current_balance.toFixed(2));
      return balance;
    },
  };
}

export { createFixtureClient, createHttpClient } from "./client.ts";
export { normalizeUsage, inferCategory, inferOperation, mapUnit } from "./normalize.ts";
export type {
  FalClient,
  FalUsageResult,
  FalUsageBucket,
  FalUsagePage,
  FalBilling,
  FalUsageQuery,
  FalHttpOpts,
} from "./client.ts";
