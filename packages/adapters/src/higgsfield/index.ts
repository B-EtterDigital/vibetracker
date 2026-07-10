// Higgsfield adapter — implements the @vibetracker/core Adapter contract.
// Tier-1 (ledger): pulls the real credit-transaction history and current balance.

import type { Adapter, AdapterCtx, DateRange, Balance } from "../../../core/src/adapter.ts";
import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import type { HiggsfieldClient } from "./client.ts";
import { normalizeTransactions } from "./normalize.ts";

export interface HiggsfieldAdapterOpts {
  /** USD per credit for the plan (estimate). Omit to leave usdEst undefined. */
  creditUsd?: number;
  /** Safety cap on pages walked per getUsage call. */
  maxPages?: number;
}

export function createHiggsfieldAdapter(client: HiggsfieldClient, opts: HiggsfieldAdapterOpts = {}): Adapter {
  const maxPages = opts.maxPages ?? 1000;
  return {
    id: "higgsfield",
    categories: ["image", "video", "audio", "3d"],
    auth: { kind: "mcp", hint: "Higgsfield MCP (transactions/balance)", serverVerifiable: true },
    capabilities: { ledger: true, balance: true, feed: false },

    async getUsage(range: DateRange, ctx: AdapterCtx): Promise<NormalizedRecord[]> {
      const out: NormalizedRecord[] = [];
      const fromT = Date.parse(range.from);
      const toT = Date.parse(range.to);
      let cursor: number | undefined;

      for (let page = 0; page < maxPages; page++) {
        let res;
        try {
          res = await client.transactions({ cursor, size: 100 });
        } catch (err) {
          // VTRS: surface, never swallow.
          ctx.telemetry.captureError(err, { area: "adapter.higgsfield.transactions", severity: "error", page });
          throw err;
        }

        let reachedOlder = false;
        for (const rec of normalizeTransactions(res.items, { creditUsd: opts.creditUsd })) {
          const t = Date.parse(rec.ts);
          if (t < fromT) { reachedOlder = true; continue; }
          if (t > toT) continue;
          out.push(rec);
        }
        ctx.telemetry.addBreadcrumb("adapter.higgsfield.page", { page, fetched: res.items.length, kept: out.length });

        if (reachedOlder || res.next_cursor == null) break;   // ledger is newest-first
        cursor = res.next_cursor;
      }
      return out;
    },

    async getBalance(ctx: AdapterCtx): Promise<Balance> {
      let b;
      try {
        b = await client.balance();
      } catch (err) {
        ctx.telemetry.captureError(err, { area: "adapter.higgsfield.balance", severity: "error" });
        throw err;
      }
      const balance: Balance = { rawAmount: b.credits, rawUnit: "credits", fetchedAt: new Date().toISOString() };
      if (opts.creditUsd != null) balance.usdEst = Number((b.credits * opts.creditUsd).toFixed(2));
      return balance;
    },
  };
}

export { createFixtureClient, createMcpClient } from "./client.ts";
export type { HiggsfieldClient, HiggsfieldTx, HiggsfieldBalance, HiggsfieldPage } from "./client.ts";
