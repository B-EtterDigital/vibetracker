// Generic usage-ledger adapter. A provider supplies a client that returns UsageItem[]
// (its usage/billing endpoint mapped to a common shape); this normalizes + filters.
// Used by HuggingFace, RunPod, Browserbase, Devin, x.ai, z.ai, GLM, Adobe Firefly, …

import type { Adapter, AdapterCtx, DateRange, AuthSpec } from "../../../core/src/adapter.ts";
import type { NormalizedRecord, Category, Unit } from "../../../core/src/schema/record.ts";

export interface UsageItem {
  ts: string;
  model?: string;
  category?: Category;
  operation?: string;
  amount: number;      // native quantity
  unit: Unit;
  rawUnit?: string;    // defaults to unit
  usd?: number;        // when the API returns cost
}
export interface UsageClient { usage(range: DateRange): Promise<UsageItem[]> }

export function createFixtureUsageClient(items: UsageItem[]): UsageClient {
  return { async usage() { return items; } };
}

export function usageItemsToRecords(items: UsageItem[], provider: string, defaultCategory: Category): NormalizedRecord[] {
  const out: NormalizedRecord[] = [];
  for (const it of items) {
    if (!(it.amount > 0) || !it.ts) continue;
    const rec: NormalizedRecord = {
      ts: it.ts, provider, category: it.category ?? defaultCategory, operation: it.operation ?? "usage",
      model: it.model, quantity: 1, unit: it.unit, rawAmount: it.amount, rawUnit: it.rawUnit ?? it.unit,
      source: "ledger", confidence: "high", verified: false,
    };
    if (it.usd != null) rec.usdEst = it.usd;
    out.push(rec);
  }
  return out;
}

export function createUsageAdapter(cfg: {
  id: string; categories: Category[]; client: UsageClient; auth?: AuthSpec; balance?: boolean;
}): Adapter {
  return {
    id: cfg.id,
    categories: cfg.categories,
    auth: cfg.auth ?? { kind: "apiKey", hint: `${cfg.id} usage API`, serverVerifiable: true },
    capabilities: { ledger: true, balance: cfg.balance ?? false, feed: false },
    async getUsage(range: DateRange, ctx: AdapterCtx): Promise<NormalizedRecord[]> {
      let items;
      try { items = await cfg.client.usage(range); }
      catch (err) { ctx.telemetry.captureError(err, { area: `adapter.${cfg.id}.usage`, severity: "error" }); throw err; }
      const fromT = Date.parse(range.from);
      const toT = Date.parse(range.to);
      const recs = usageItemsToRecords(items, cfg.id, cfg.categories[0]).filter((r) => {
        const t = Date.parse(r.ts); return t >= fromT && t <= toT;
      });
      ctx.telemetry.addBreadcrumb(`adapter.${cfg.id}.usage`, { items: items.length, kept: recs.length });
      return recs;
    },
  };
}
