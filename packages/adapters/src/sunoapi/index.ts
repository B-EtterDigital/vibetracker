// sunoapi.org adapter — implements @vibetracker/core Adapter. Third-party Suno API proxy with
// Bearer-key auth. Its only account endpoint is the remaining-credit balance (no generation
// history), so getUsage returns a single balance snapshot and getBalance returns the live balance;
// consumption over time is the balance delta across syncs.

import type { Adapter, AdapterCtx, DateRange, Balance } from "../../../core/src/adapter.ts";
import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import type { SunoApiClient } from "./client.ts";
import { balanceRecord, type SunoApiNormalizeOpts } from "./normalize.ts";

export function createSunoApiAdapter(client: SunoApiClient, opts: SunoApiNormalizeOpts = {}): Adapter {
  return {
    id: "sunoapi",
    categories: ["music"],
    auth: { kind: "apiKey", hint: "sunoapi.org API key (Bearer)", serverVerifiable: true },
    capabilities: { ledger: false, balance: true, feed: false },

    async getUsage(_range: DateRange, ctx: AdapterCtx): Promise<NormalizedRecord[]> {
      let c;
      try {
        c = await client.credits();
      } catch (err) {
        ctx.telemetry.captureError(err, { area: "adapter.sunoapi.credits", severity: "error" });
        throw err;
      }
      ctx.telemetry.addBreadcrumb("adapter.sunoapi.balance", { credits: c.credits });
      return [balanceRecord(c.credits, opts)];
    },

    async getBalance(ctx: AdapterCtx): Promise<Balance> {
      let c;
      try {
        c = await client.credits();
      } catch (err) {
        ctx.telemetry.captureError(err, { area: "adapter.sunoapi.balance", severity: "error" });
        throw err;
      }
      return { rawAmount: c.credits, rawUnit: "credits", fetchedAt: new Date().toISOString() };
    },
  };
}

export { createFixtureClient, createHttpClient } from "./client.ts";
export type { SunoApiClient, SunoApiCredits } from "./client.ts";
