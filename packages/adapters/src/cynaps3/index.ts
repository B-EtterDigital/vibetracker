import type { Adapter, AdapterCtx, DateRange } from "../../../core/src/adapter.ts";
import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import type { Cynaps3Client, Cynaps3StatsSummary } from "./client.ts";
import { normalizeEvents } from "./normalize.ts";

export interface Cynaps3AdapterOpts {
  pageSize?: number;
  maxPages?: number;
}

function validRange(range: DateRange): { from: string; to: string; fromT: number; toT: number } {
  const fromT = Date.parse(range.from);
  const toT = Date.parse(range.to);
  if (Number.isNaN(fromT) || Number.isNaN(toT) || fromT > toT) {
    throw new Error(`Cynaps3 getUsage: invalid range ${range.from}..${range.to}`);
  }
  return {
    from: new Date(fromT).toISOString(),
    to: new Date(toT).toISOString(),
    fromT,
    toT,
  };
}

export function createCynaps3Adapter(client: Cynaps3Client, opts: Cynaps3AdapterOpts = {}): Adapter {
  const pageSize = opts.pageSize ?? 100;
  const maxPages = opts.maxPages ?? 10_000;
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 200) {
    throw new Error("Cynaps3 pageSize must be an integer from 1 to 200");
  }
  if (!Number.isInteger(maxPages) || maxPages < 1) {
    throw new Error("Cynaps3 maxPages must be a positive integer");
  }

  return {
    id: "cynaps3",
    categories: ["music"],
    auth: {
      kind: "oauth",
      hint: "Cynaps3 OAuth access token (usage:read)",
      serverVerifiable: true,
    },
    capabilities: { ledger: true, balance: false, feed: true },

    async getUsage(range: DateRange, ctx: AdapterCtx): Promise<NormalizedRecord[]> {
      let normalizedRange;
      try {
        normalizedRange = validRange(range);
      } catch (error) {
        ctx.telemetry.captureError(error, { area: "adapter.cynaps3.range", severity: "error", range });
        throw error;
      }

      const records: NormalizedRecord[] = [];
      const eventIds = new Set<string>();
      const billedEventIds = new Set<string>();
      const cursors = new Set<string>();
      let cursor: string | undefined;
      let accountId: string | undefined;
      let rangeSummary: Cynaps3StatsSummary | undefined;
      let exhausted = false;

      for (let pageNumber = 0; pageNumber < maxPages; pageNumber++) {
        let page;
        try {
          page = await client.stats({
            from: normalizedRange.from,
            to: normalizedRange.to,
            cursor,
            limit: pageSize,
          });
        } catch (error) {
          ctx.telemetry.captureError(error, {
            area: "adapter.cynaps3.stats",
            severity: "error",
            page: pageNumber,
            cursor,
          });
          throw error;
        }

        if (accountId && accountId !== page.account.id) {
          const error = new Error("Cynaps3 stats contract: account changed during pagination");
          ctx.telemetry.captureError(error, { area: "adapter.cynaps3.identity", severity: "error" });
          throw error;
        }
        accountId = page.account.id;

        if (rangeSummary && JSON.stringify(rangeSummary) !== JSON.stringify(page.summary)) {
          const error = new Error("Cynaps3 stats contract: range summary changed during pagination");
          ctx.telemetry.captureError(error, { area: "adapter.cynaps3.summary", severity: "error" });
          throw error;
        }
        rangeSummary = page.summary;

        for (const event of page.events) {
          const occurredAt = Date.parse(event.occurredAt);
          if (occurredAt < normalizedRange.fromT || occurredAt > normalizedRange.toT) {
            const error = new Error(`Cynaps3 stats contract: event ${event.id} is outside the requested range`);
            ctx.telemetry.captureError(error, { area: "adapter.cynaps3.range", severity: "error" });
            throw error;
          }
          if (eventIds.has(event.id)) {
            const error = new Error(`Cynaps3 stats contract: duplicate event id ${event.id}`);
            ctx.telemetry.captureError(error, { area: "adapter.cynaps3.pagination", severity: "error" });
            throw error;
          }
          eventIds.add(event.id);
          const billedProvider = event.billingOwner === "upstream-provider" ? event.providerId : "cynaps3";
          const billedEventId = event.upstreamEventId ?? event.id;
          const billedEventKey = `${billedProvider}:${billedEventId}`;
          if (billedEventIds.has(billedEventKey)) {
            const error = new Error(`Cynaps3 stats contract: duplicate billed event ${billedEventKey}`);
            ctx.telemetry.captureError(error, { area: "adapter.cynaps3.pagination", severity: "error" });
            throw error;
          }
          billedEventIds.add(billedEventKey);
        }
        records.push(...normalizeEvents(page.events, accountId));
        ctx.telemetry.addBreadcrumb("adapter.cynaps3.page", {
          page: pageNumber,
          fetched: page.events.length,
          total: records.length,
        });

        if (!page.page.hasMore) {
          exhausted = true;
          break;
        }
        const nextCursor = page.page.nextCursor!;
        if (cursors.has(nextCursor)) {
          const error = new Error("Cynaps3 stats contract: pagination cursor repeated");
          ctx.telemetry.captureError(error, { area: "adapter.cynaps3.pagination", severity: "error" });
          throw error;
        }
        cursors.add(nextCursor);
        cursor = nextCursor;
      }

      if (!exhausted) {
        const error = new Error(`Cynaps3 history exceeded the ${maxPages}-page safety cap`);
        ctx.telemetry.captureError(error, {
          area: "adapter.cynaps3.pagination",
          severity: "error",
          maxPages,
        });
        throw error;
      }
      return records;
    },
  };
}

export {
  CYNAPS3_STATS_URL,
  createFixtureClient,
  createHttpClient,
  parseStatsPage,
} from "./client.ts";
export type {
  Cynaps3Client,
  Cynaps3HttpOpts,
  Cynaps3StatsArgs,
  Cynaps3StatsPage,
  Cynaps3StatsSummary,
  Cynaps3UsageEvent,
  Cynaps3UsageStatus,
  Cynaps3BillingOwner,
} from "./client.ts";
export { normalizeEvents } from "./normalize.ts";
