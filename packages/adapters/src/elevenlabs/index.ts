// ElevenLabs adapter — implements @vibetracker/core Adapter. Tier-1: usage from the
// character-stats time series, plus a balance (remaining characters this cycle).

import type { Adapter, AdapterCtx, DateRange, Balance } from "../../../core/src/adapter.ts";
import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import type { ElevenLabsClient } from "./client.ts";
import { normalizeCharacterStats, type ElevenNormalizeOpts } from "./normalize.ts";

export function createElevenLabsAdapter(client: ElevenLabsClient, opts: ElevenNormalizeOpts = {}): Adapter {
  return {
    id: "elevenlabs",
    categories: ["audio"],
    auth: { kind: "apiKey", hint: "ElevenLabs xi-api-key", serverVerifiable: true },
    capabilities: { ledger: true, balance: true, feed: false },

    async getUsage(range: DateRange, ctx: AdapterCtx): Promise<NormalizedRecord[]> {
      const startUnix = Date.parse(range.from);
      const endUnix = Date.parse(range.to);
      let stats;
      try {
        stats = await client.characterStats({ startUnix, endUnix });
      } catch (err) {
        ctx.telemetry.captureError(err, { area: "adapter.elevenlabs.characterStats", severity: "error" });
        throw err;
      }
      const recs = normalizeCharacterStats(stats, opts).filter((r) => {
        const t = Date.parse(r.ts);
        return t >= startUnix && t <= endUnix;
      });
      ctx.telemetry.addBreadcrumb("adapter.elevenlabs.usage", { buckets: stats.time?.length ?? 0, kept: recs.length });
      return recs;
    },

    async getBalance(ctx: AdapterCtx): Promise<Balance> {
      let sub;
      try {
        sub = await client.subscription();
      } catch (err) {
        ctx.telemetry.captureError(err, { area: "adapter.elevenlabs.subscription", severity: "error" });
        throw err;
      }
      const remaining = Math.max(0, (sub.character_limit ?? 0) - (sub.character_count ?? 0));
      return { rawAmount: remaining, rawUnit: "characters", fetchedAt: new Date().toISOString() };
    },
  };
}

export { createFixtureClient, createHttpClient } from "./client.ts";
export type { ElevenLabsClient, ElevenSubscription, ElevenCharacterStats } from "./client.ts";
