import { createUsageAdapter, type UsageClient, type UsageItem } from "../_shared/http-usage.ts";
import type { DateRange } from "../../../core/src/adapter.ts";

export function createHttpClient(cfg: { apiKey: string; baseUrl?: string }): UsageClient {
  const base = cfg.baseUrl ?? "https://api.perplexity.ai";
  return {
    async usage(range: DateRange): Promise<UsageItem[]> {
      const url = new URL(`${base}/usage`);
      url.searchParams.set("start", range.from);
      url.searchParams.set("end", range.to);
      const res = await fetch(url, { headers: { Authorization: `Bearer ${cfg.apiKey}` } });
      if (!res.ok) throw new Error(`Perplexity usage ${res.status}: ${await res.text()}`);
      const body = await res.json() as { data?: Array<{ date: string; model?: string; total_tokens?: number; requests?: number; cost?: number }> };
      return (body.data ?? []).map((d) => ({
        ts: new Date(d.date).toISOString(),
        model: d.model,
        amount: d.total_tokens ?? d.requests ?? 0,
        unit: d.total_tokens != null ? "token" : "request",
        usd: d.cost,
        category: "llm",
      }));
    },
  };
}

export function createPerplexityAdapter(client: UsageClient) {
  return createUsageAdapter({ id: "perplexity", categories: ["llm"], client, balance: true });
}
