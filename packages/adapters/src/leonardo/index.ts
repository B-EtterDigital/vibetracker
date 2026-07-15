import type { Adapter, AdapterCtx, Balance, DateRange } from "../../../core/src/adapter.ts";
import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import type { LeonardoClient, LeonardoMeResponse } from "./client.ts";
import { normalizeGenerations } from "./normalize.ts";

export interface LeonardoAdapterOpts {
  pageSize?: number;
  maxPages?: number;
}

function userDetails(me: LeonardoMeResponse) {
  const details = me.user_details?.[0];
  if (!details?.user?.id) {
    throw new Error("Leonardo.ai GET /me returned no user ID for this API key");
  }
  return details;
}

export function createLeonardoAdapter(client: LeonardoClient, opts: LeonardoAdapterOpts = {}): Adapter {
  const pageSize = opts.pageSize ?? 10;
  const maxPages = opts.maxPages ?? 10_000;
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 1_000) {
    throw new Error("Leonardo.ai pageSize must be an integer from 1 to 1000");
  }
  if (!Number.isInteger(maxPages) || maxPages < 1) {
    throw new Error("Leonardo.ai maxPages must be a positive integer");
  }

  return {
    id: "leonardo",
    categories: ["image"],
    auth: {
      kind: "apiKey",
      hint: "Leonardo.ai Production API key (Bearer)",
      serverVerifiable: true,
    },
    capabilities: { ledger: false, balance: true, feed: true },

    async getUsage(range: DateRange, ctx: AdapterCtx): Promise<NormalizedRecord[]> {
      const fromT = Date.parse(range.from);
      const toT = Date.parse(range.to);
      if (Number.isNaN(fromT) || Number.isNaN(toT) || fromT > toT) {
        const err = new Error(`Leonardo.ai getUsage: invalid range ${range.from}..${range.to}`);
        ctx.telemetry.captureError(err, { area: "adapter.leonardo.getUsage", severity: "error", range });
        throw err;
      }

      let me: LeonardoMeResponse;
      try {
        me = await client.me();
      } catch (err) {
        ctx.telemetry.captureError(err, { area: "adapter.leonardo.me", severity: "error" });
        throw err;
      }
      let details;
      try {
        details = userDetails(me);
      } catch (err) {
        ctx.telemetry.captureError(err, { area: "adapter.leonardo.identity", severity: "error" });
        throw err;
      }

      const out: NormalizedRecord[] = [];
      let offset = 0;
      let exhausted = false;
      for (let page = 0; page < maxPages; page++) {
        let response;
        try {
          response = await client.generations({ userId: details.user!.id!, limit: pageSize, offset });
        } catch (err) {
          ctx.telemetry.captureError(err, { area: "adapter.leonardo.generations", severity: "error", page, offset });
          throw err;
        }
        const generations = response.generations ?? [];
        if (generations.length === 0) {
          exhausted = true;
          break;
        }

        let kept = 0;
        for (const record of normalizeGenerations(generations)) {
          const time = Date.parse(record.ts);
          if (time < fromT || time > toT) continue;
          record.accountId = details.user!.id!;
          out.push(record);
          kept++;
        }
        ctx.telemetry.addBreadcrumb("adapter.leonardo.page", {
          page,
          offset,
          fetched: generations.length,
          kept,
        });
        offset += generations.length;
      }
      if (!exhausted) {
        const err = new Error(
          `Leonardo.ai generation history exceeded the ${maxPages}-page safety cap at offset ${offset}`,
        );
        ctx.telemetry.captureError(err, {
          area: "adapter.leonardo.pagination",
          severity: "error",
          maxPages,
          offset,
        });
        throw err;
      }
      return out;
    },

    async getBalance(ctx: AdapterCtx): Promise<Balance> {
      let me;
      try {
        me = await client.me();
      } catch (err) {
        ctx.telemetry.captureError(err, { area: "adapter.leonardo.balance", severity: "error" });
        throw err;
      }
      let details;
      try {
        details = userDetails(me);
      } catch (err) {
        ctx.telemetry.captureError(err, { area: "adapter.leonardo.identity", severity: "error" });
        throw err;
      }
      return {
        rawAmount: (details.apiPaidTokens ?? 0) + (details.apiSubscriptionTokens ?? 0),
        rawUnit: "api_tokens",
        fetchedAt: new Date().toISOString(),
      };
    },
  };
}

export { createFixtureClient, createHttpClient, LEONARDO_BASE_URL } from "./client.ts";
export type {
  LeonardoClient,
  LeonardoGeneration,
  LeonardoGeneratedImage,
  LeonardoGenerationsResponse,
  LeonardoHttpOpts,
  LeonardoMeResponse,
  LeonardoUserDetails,
} from "./client.ts";
export { normalizeGenerations } from "./normalize.ts";
