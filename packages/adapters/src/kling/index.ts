// Kling adapter — implements @vibetracker/core Adapter. Tier-2 (feed_recon): usage is
// reconstructed from the task list. JWT (apiKey) auth. No per-op cost from the API, so
// records are counts by default; a per-model credit map upgrades them to credit spend.

import type { Adapter, AdapterCtx, DateRange } from "../../../core/src/adapter.ts";
import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import type { KlingClient } from "./client.ts";
import { normalizeTasks, type KlingNormalizeOpts } from "./normalize.ts";

export function createKlingAdapter(client: KlingClient, opts: KlingNormalizeOpts & { maxPages?: number } = {}): Adapter {
  const maxPages = opts.maxPages ?? 200;
  return {
    id: "kling",
    categories: ["video"],
    auth: { kind: "apiKey", hint: "Kling access-key/secret-key (JWT)", serverVerifiable: true },
    capabilities: { ledger: false, balance: false, feed: true },

    async getUsage(range: DateRange, ctx: AdapterCtx): Promise<NormalizedRecord[]> {
      const fromT = Date.parse(range.from);
      const toT = Date.parse(range.to);
      const out: NormalizedRecord[] = [];
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        let page;
        try {
          page = await client.tasks({ pageNum, pageSize: 100 });
        } catch (err) {
          ctx.telemetry.captureError(err, { area: "adapter.kling.tasks", severity: "error", pageNum });
          throw err;
        }
        for (const rec of normalizeTasks(page.data, opts)) {
          const t = Date.parse(rec.ts);
          if (t >= fromT && t <= toT) out.push(rec);
        }
        ctx.telemetry.addBreadcrumb("adapter.kling.page", { pageNum, tasks: page.data.length, kept: out.length });
        if (!page.has_more) break;
      }
      return out;
    },
  };
}

export { createFixtureClient, createHttpClient } from "./client.ts";
export type { KlingClient, KlingTask, KlingTaskPage } from "./client.ts";
