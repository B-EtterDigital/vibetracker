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

      // The stats API rejects ranges over 90 days with 400 (real incident 2026-07-19: the CLI
      // syncs an all-time 2000..2100 range). Walk the effective range in ≤89-day windows, clamped
      // to the platform epoch and now; windows are disjoint (from inclusive, to exclusive).
      const PLATFORM_EPOCH = Date.parse("2025-01-01T00:00:00.000Z");
      const WINDOW_MS = 89 * 24 * 60 * 60 * 1000;
      const effFrom = Math.max(normalizedRange.fromT, PLATFORM_EPOCH);
      const effTo = Math.min(normalizedRange.toT, Date.now());
      if (effFrom >= effTo) return records;
      let winStart = effFrom;
      let winEnd = Math.min(winStart + WINDOW_MS, effTo);

      for (let pageNumber = 0; pageNumber < maxPages; pageNumber++) {
        let page;
        try {
          page = await client.stats({
            from: new Date(winStart).toISOString(),
            to: new Date(winEnd).toISOString(),
            cursor,
            limit: pageSize,
          });
        } catch (error) {
          // A single server-broken era must not sink the whole history (real incident 2026-07-19:
          // the 2025-09-25→12-23 window 500s server-side while every other window is healthy).
          // 5xx on a window START (no cursor) → report loudly, skip that window, keep collecting.
          const serverSide = /failed: 5\d\d/.test(error instanceof Error ? error.message : "");
          ctx.telemetry.captureError(error, {
            area: "adapter.cynaps3.stats",
            severity: serverSide && !cursor ? "warn" : "error",
            page: pageNumber,
            cursor,
            window: `${new Date(winStart).toISOString()}..${new Date(winEnd).toISOString()}`,
          });
          if (serverSide && !cursor) {
            if (winEnd >= effTo) { exhausted = true; break; }
            winStart = winEnd;
            winEnd = Math.min(winStart + WINDOW_MS, effTo);
            cursors.clear();
            rangeSummary = undefined;
            continue;
          }
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
          // audit #11: when a window is exhausted, its summary must reconcile with what it
          // actually delivered — a contradictory producer (summary 72 / events 18) must be VISIBLE
          const windowFetched = cursors.size * pageSize + page.events.length; // pages before + this one
          if (rangeSummary && rangeSummary.operations !== windowFetched && page.events.length < pageSize) {
            ctx.telemetry.captureError(new Error(`Cynaps3 window summary/events mismatch: summary ${rangeSummary.operations} vs fetched ${windowFetched}`), {
              area: "adapter.cynaps3.reconcile", severity: "warn",
              window: `${new Date(winStart).toISOString()}..${new Date(winEnd).toISOString()}`,
            });
          }
          if (winEnd >= effTo) {
            exhausted = true;
            break;
          }
          // this window is drained — advance to the next disjoint ≤89-day window
          winStart = winEnd;
          winEnd = Math.min(winStart + WINDOW_MS, effTo);
          cursor = undefined;
          cursors.clear();
          rangeSummary = undefined; // summary consistency is a per-window contract
          continue;
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
