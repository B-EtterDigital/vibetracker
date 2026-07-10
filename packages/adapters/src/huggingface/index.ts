// Hugging Face — Inference + billing. ⚠ VERIFY the usage/billing endpoint + shape.
import { createUsageAdapter, type UsageClient, type UsageItem } from "../_shared/http-usage.ts";
import type { DateRange } from "../../../core/src/adapter.ts";

export function createHttpClient(cfg: { apiKey: string; baseUrl?: string }): UsageClient {
  const base = cfg.baseUrl ?? "https://huggingface.co";
  return {
    async usage(range: DateRange): Promise<UsageItem[]> {
      const u = new URL(`${base}/api/billing/usage`);
      u.searchParams.set("from", range.from);
      u.searchParams.set("to", range.to);
      const res = await fetch(u, { headers: { Authorization: `Bearer ${cfg.apiKey}` } });
      if (!res.ok) throw new Error(`HuggingFace usage ${res.status}: ${await res.text()}`);
      const body = (await res.json()) as { items?: Array<{ date: string; sku?: string; quantity?: number; cost?: number }> };
      return (body.items ?? []).map((i) => ({ ts: new Date(i.date).toISOString(), operation: i.sku, amount: i.quantity ?? 1, unit: "request", usd: i.cost, category: "other" }));
    },
  };
}
export function createHuggingFaceAdapter(client: UsageClient) {
  return createUsageAdapter({ id: "huggingface", categories: ["llm", "image", "other"], client });
}
