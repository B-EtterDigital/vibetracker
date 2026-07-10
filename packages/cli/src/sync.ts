// Multi-provider sync orchestrator. Resilient: one provider failing does NOT abort the
// others — the failure is surfaced (the adapter already routed it to VTRS) and reported
// per-provider, never silently dropped.

import type { Adapter, AdapterCtx, DateRange } from "../../core/src/adapter.ts";
import type { NormalizedRecord } from "../../core/src/schema/record.ts";

export interface SyncTarget { id: string; adapter: Adapter; }
export interface SyncResult { provider: string; records: NormalizedRecord[]; error?: string; }

export async function runSync(targets: SyncTarget[], range: DateRange, ctx: AdapterCtx): Promise<SyncResult[]> {
  const out: SyncResult[] = [];
  for (const t of targets) {
    try {
      const records = await t.adapter.getUsage(range, ctx);
      out.push({ provider: t.id, records });
    } catch (err) {
      // Adapter already captured this via ctx.telemetry; record it so the run continues.
      out.push({ provider: t.id, records: [], error: err instanceof Error ? err.message : String(err) });
    }
  }
  return out;
}
