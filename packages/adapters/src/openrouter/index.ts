// OpenRouter adapter — balance tier. Real USD balance + a to-date usage snapshot.
// (Per-op history would come from the proxy tier; see PLAN.)

import type { Adapter, AdapterCtx, DateRange, Balance } from "../../../core/src/adapter.ts";
import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import type { OpenRouterClient } from "./client.ts";

export function createOpenRouterAdapter(client: OpenRouterClient, opts: { snapshotTs?: string } = {}): Adapter {
  return {
    id: "openrouter",
    categories: ["llm"],
    auth: { kind: "apiKey", hint: "OpenRouter API key (BYOK)", serverVerifiable: true },
    capabilities: { ledger: false, balance: true, feed: false },

    async getUsage(_range: DateRange, ctx: AdapterCtx): Promise<NormalizedRecord[]> {
      let c;
      try {
        c = await client.credits();
      } catch (err) {
        ctx.telemetry.captureError(err, { area: "adapter.openrouter.credits", severity: "error" });
        throw err;
      }
      if (c.total_usage <= 0) return [];
      const usd = Number(c.total_usage.toFixed(6));
      return [{
        // "snapshot" = lifetime total-to-date. sync REPLACES the previous snapshot for
        // this provider instead of appending, so re-syncs never double-count it.
        ts: opts.snapshotTs ?? new Date().toISOString(),
        provider: "openrouter", category: "llm", operation: "snapshot",
        quantity: 1, unit: "request", rawAmount: usd, rawUnit: "usd", usdEst: usd,
        source: "balance_delta", confidence: "medium", verified: false,
      }];
    },

    async getBalance(ctx: AdapterCtx): Promise<Balance> {
      let c;
      try {
        c = await client.credits();
      } catch (err) {
        ctx.telemetry.captureError(err, { area: "adapter.openrouter.credits", severity: "error" });
        throw err;
      }
      const remaining = Number((c.total_credits - c.total_usage).toFixed(6));
      return { rawAmount: remaining, rawUnit: "usd", usdEst: remaining, fetchedAt: new Date().toISOString() };
    },
  };
}

export { createFixtureClient, createHttpClient } from "./client.ts";
export type { OpenRouterClient, OpenRouterCredits } from "./client.ts";
