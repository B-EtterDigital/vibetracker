// Suno adapter — implements @vibetracker/core Adapter. Tier-2 (feed_recon): usage is
// reconstructed from the generation feed × credits-per-clip. Cookie auth, ToS-gray,
// clearly labelled estimated/self-reported (source feed_recon, confidence medium).

import type { Adapter, AdapterCtx, DateRange, Balance } from "../../../core/src/adapter.ts";
import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import type { SunoClient } from "./client.ts";
import { normalizeFeed, type SunoNormalizeOpts } from "./normalize.ts";

export function createSunoAdapter(client: SunoClient, opts: SunoNormalizeOpts & { maxPages?: number } = {}): Adapter {
  const maxPages = opts.maxPages ?? 500;
  return {
    id: "suno",
    categories: ["music"],
    auth: { kind: "cookie", hint: "Suno web session cookie (ToS-gray, personal use)", serverVerifiable: false },
    capabilities: { ledger: false, balance: true, feed: true },

    async getUsage(range: DateRange, ctx: AdapterCtx): Promise<NormalizedRecord[]> {
      const fromT = Date.parse(range.from);
      const toT = Date.parse(range.to);
      const out: NormalizedRecord[] = [];
      let cursor: string | undefined;
      for (let i = 0; i < maxPages; i++) {
        let page;
        try {
          page = await client.feed({ cursor });
        } catch (err) {
          ctx.telemetry.captureError(err, { area: "adapter.suno.feed", severity: "error", cursor });
          throw err;
        }
        let reachedOlder = false;
        for (const rec of normalizeFeed(page.clips, opts)) {
          const t = Date.parse(rec.ts);
          if (t < fromT) { reachedOlder = true; continue; }
          if (t > toT) continue;
          out.push(rec);
        }
        ctx.telemetry.addBreadcrumb("adapter.suno.page", { i, clips: page.clips.length, kept: out.length });
        if (reachedOlder || !page.next_cursor) break;
        cursor = page.next_cursor;
      }
      return out;
    },

    async getBalance(ctx: AdapterCtx): Promise<Balance> {
      let c;
      try {
        c = await client.credits();
      } catch (err) {
        ctx.telemetry.captureError(err, { area: "adapter.suno.credits", severity: "error" });
        throw err;
      }
      return { rawAmount: c.credits_left, rawUnit: "credits", fetchedAt: new Date().toISOString() };
    },
  };
}

export { createFixtureClient, createCookieClient } from "./client.ts";
export type { SunoClient, SunoClip, SunoFeedPage, SunoCredits } from "./client.ts";
