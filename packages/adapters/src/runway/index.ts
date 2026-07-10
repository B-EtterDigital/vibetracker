// Runway adapter — implements the @vibetracker/core Adapter contract.
// Provider: Runway (dev.runwayml.com), a video-first generation platform (Gen-3/Gen-4 + partners).
//
// Tiering: Runway has NO per-generation usage-history/list endpoint (you can only GET a task by an
// id you already hold). The authoritative usage surface is the daily, per-model *credit* aggregate
// from POST /v1/organization/usage. This adapter treats that as its ledger (source "ledger"), and
// reports the wallet balance from GET /v1/organization. So it is a Tier-1 (ledger) + balance adapter,
// but the ledger granularity is day+model, not per-op — see normalize.ts.

import type { Adapter, AdapterCtx, DateRange, Balance } from "../../../core/src/adapter.ts";
import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import type { RunwayClient } from "./client.ts";
import { normalizeUsage } from "./normalize.ts";

const DAY_MS = 86_400_000;
/** Runway allows at most 90 days per usage query. */
const MAX_WINDOW_DAYS = 90;

/** Midnight-UTC epoch ms for the day containing `ms`. */
function dayStartUTC(ms: number): number {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** "YYYY-MM-DD" (UTC) for an epoch-ms instant. */
function toYMD(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export interface RunwayAdapterOpts {
  /** USD per credit (estimate). Runway API credits are ~$0.01 each — ⚠ VERIFY, it changes.
   *  Omit to leave usdEst undefined (native credits stay the source of truth). */
  creditUsd?: number;
  /** Safety cap on the number of ≤90-day windows walked per getUsage call. */
  maxWindows?: number;
}

export function createRunwayAdapter(client: RunwayClient, opts: RunwayAdapterOpts = {}): Adapter {
  const maxWindows = opts.maxWindows ?? 40; // 40 × 90d ≈ 9.8 years
  return {
    id: "runway",
    // Video is the primary surface; the shared API wallet also meters image, audio (ElevenLabs
    // family), and a text/LLM helper model, all of which the usage endpoint can report.
    categories: ["video", "image", "audio", "llm"],
    auth: {
      kind: "apiKey",
      hint: "server-side Runway API key (Authorization: Bearer + X-Runway-Version)",
      serverVerifiable: true,
    },
    // ledger = the daily per-model credit aggregate; balance = the org credit wallet.
    // feed = false: Runway exposes no task-list/feed endpoint to reconstruct per-op usage.
    capabilities: { ledger: true, balance: true, feed: false },

    async getUsage(range: DateRange, ctx: AdapterCtx): Promise<NormalizedRecord[]> {
      const out: NormalizedRecord[] = [];
      const fromT = Date.parse(range.from);
      const toT = Date.parse(range.to);
      if (Number.isNaN(fromT) || Number.isNaN(toT)) {
        const err = new Error(`Runway getUsage: invalid range ${range.from}..${range.to}`);
        ctx.telemetry.captureError(err, { area: "adapter.runway.getUsage", severity: "error", range });
        throw err;
      }

      // Day-aligned, inclusive of both ends. beforeDate is exclusive, so add one day.
      const fromDay = dayStartUTC(fromT);
      const toDay = dayStartUTC(toT);
      const endExclusive = toDay + DAY_MS;

      let windowStart = fromDay;
      for (let w = 0; w < maxWindows && windowStart < endExclusive; w++) {
        const windowEnd = Math.min(windowStart + MAX_WINDOW_DAYS * DAY_MS, endExclusive);
        let res;
        try {
          res = await client.usage({ startDate: toYMD(windowStart), beforeDate: toYMD(windowEnd) });
        } catch (err) {
          // VTRS: surface, never swallow.
          ctx.telemetry.captureError(err, { area: "adapter.runway.usage", severity: "error", window: w });
          throw err;
        }

        let kept = 0;
        for (const rec of normalizeUsage(res.results, { creditUsd: opts.creditUsd })) {
          const t = Date.parse(rec.ts); // midnight-UTC of the usage day
          if (t < fromDay || t > toDay) continue; // defensive: keep only the requested days
          out.push(rec);
          kept++;
        }
        ctx.telemetry.addBreadcrumb("adapter.runway.window", {
          window: w,
          startDate: toYMD(windowStart),
          beforeDate: toYMD(windowEnd),
          days: res.results.length,
          kept,
        });

        windowStart = windowEnd;
      }
      return out;
    },

    async getBalance(ctx: AdapterCtx): Promise<Balance> {
      let org;
      try {
        org = await client.organization();
      } catch (err) {
        ctx.telemetry.captureError(err, { area: "adapter.runway.organization", severity: "error" });
        throw err;
      }
      const balance: Balance = {
        rawAmount: org.creditBalance,
        rawUnit: "credits",
        fetchedAt: new Date().toISOString(),
      };
      if (opts.creditUsd != null) balance.usdEst = Number((org.creditBalance * opts.creditUsd).toFixed(2));
      return balance;
    },
  };
}

export { createFixtureClient, createHttpClient, RUNWAY_BASE_URL, RUNWAY_API_VERSION } from "./client.ts";
export type {
  RunwayClient,
  RunwayOrganization,
  RunwayUsageResponse,
  RunwayUsageResult,
  RunwayUsedCredit,
  RunwayUsageQuery,
  RunwayHttpOpts,
  RunwayModel,
} from "./client.ts";
