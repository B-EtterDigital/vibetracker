// OpenAI adapter — implements @vibetracker/core Adapter. Tier-1 (ledger): the
// organization Costs API returns real per-line-item USD, bucketed by time.

import type { Adapter, AdapterCtx, DateRange } from "../../../core/src/adapter.ts";
import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import type { OpenAIClient } from "./client.ts";
import { normalizeCosts } from "./normalize.ts";

export function createOpenAIAdapter(client: OpenAIClient, opts: { maxPages?: number } = {}): Adapter {
  const maxPages = opts.maxPages ?? 500;
  return {
    id: "openai",
    categories: ["llm", "image", "audio"],
    auth: { kind: "apiKey", hint: "OpenAI admin key (Costs API)", serverVerifiable: true },
    capabilities: { ledger: true, balance: false, feed: false },

    async getUsage(range: DateRange, ctx: AdapterCtx): Promise<NormalizedRecord[]> {
      // OpenAI's costs API errors on very old start_time; clamp the query floor to ~179
      // days (its bucket limit) — local filtering still honors the caller's real range.
      const floor = Math.floor(Date.now() / 1000) - 179 * 86400;
      const startTime = Math.max(Math.floor(Date.parse(range.from) / 1000), floor);
      const endTime = Math.min(Math.floor(Date.parse(range.to) / 1000), Math.floor(Date.now() / 1000));
      const out: NormalizedRecord[] = [];
      let page: string | undefined;

      for (let i = 0; i < maxPages; i++) {
        let res;
        try {
          res = await client.costs({ startTime, endTime, page });
        } catch (err) {
          ctx.telemetry.captureError(err, { area: "adapter.openai.costs", severity: "error", page });
          throw err;
        }
        for (const rec of normalizeCosts(res.data)) {
          const t = Date.parse(rec.ts);
          if (t >= Date.parse(range.from) && t <= Date.parse(range.to)) out.push(rec);
        }
        ctx.telemetry.addBreadcrumb("adapter.openai.page", { i, buckets: res.data.length, kept: out.length });
        if (!res.has_more || !res.next_page) break;
        page = res.next_page;
      }
      return out;
    },
  };
}

export { createFixtureClient, createHttpClient } from "./client.ts";
export type { OpenAIClient, OpenAICostsPage, OpenAICostBucket } from "./client.ts";
