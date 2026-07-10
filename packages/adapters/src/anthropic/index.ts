// Anthropic org-billing adapter — implements @vibetracker/core Adapter. Tier-1
// (ledger): the Cost Report Admin API returns real USD spend bucketed by time.

import type { Adapter, AdapterCtx, DateRange } from "../../../core/src/adapter.ts";
import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import type { AnthropicClient } from "./client.ts";
import { normalizeCostReport } from "./normalize.ts";

export function createAnthropicAdapter(client: AnthropicClient, opts: { maxPages?: number } = {}): Adapter {
  const maxPages = opts.maxPages ?? 500;
  return {
    id: "anthropic",
    categories: ["llm"],
    auth: { kind: "apiKey", hint: "Anthropic admin key (Cost Report API)", serverVerifiable: true },
    capabilities: { ledger: true, balance: false, feed: false },

    async getUsage(range: DateRange, ctx: AdapterCtx): Promise<NormalizedRecord[]> {
      const out: NormalizedRecord[] = [];
      let page: string | undefined;
      for (let i = 0; i < maxPages; i++) {
        let res;
        try {
          res = await client.costReport({ startingAt: range.from, endingAt: range.to, page });
        } catch (err) {
          ctx.telemetry.captureError(err, { area: "adapter.anthropic.costReport", severity: "error", page });
          throw err;
        }
        for (const rec of normalizeCostReport(res.data)) {
          const t = Date.parse(rec.ts);
          if (t >= Date.parse(range.from) && t <= Date.parse(range.to)) out.push(rec);
        }
        ctx.telemetry.addBreadcrumb("adapter.anthropic.page", { i, buckets: res.data.length, kept: out.length });
        if (!res.has_more || !res.next_page) break;
        page = res.next_page;
      }
      return out;
    },
  };
}

export { createFixtureClient, createHttpClient } from "./client.ts";
export type { AnthropicClient, AnthropicCostPage, AnthropicCostBucket } from "./client.ts";
