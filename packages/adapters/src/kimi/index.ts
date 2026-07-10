import { createUsageAdapter, type UsageClient, type UsageItem } from "../_shared/http-usage.ts";
import type { DateRange } from "../../../core/src/adapter.ts";

export function createHttpClient(cfg: { apiKey: string; baseUrl?: string }): UsageClient {
  const base = cfg.baseUrl ?? "https://api.moonshot.cn/v1";
  return {
    async usage(range: DateRange): Promise<UsageItem[]> {
      const url = new URL(`${base}/usage`);
      url.searchParams.set("start", range.from);
      url.searchParams.set("end", range.to);
      const res = await fetch(url, { headers: { Authorization: `Bearer ${cfg.apiKey}` } });
      if (!res.ok) throw new Error(`Kimi usage ${res.status}: ${await res.text()}`);
      const body = await res.json() as { data?: Array<{ date: string; model?: string; tokens?: number; cost?: number }> };
      return (body.data ?? []).map((d) => ({ ts: new Date(d.date).toISOString(), model: d.model, amount: d.tokens ?? 0, unit: "token", usd: d.cost, category: "llm" }));
    },
  };
}

export function createKimiAdapter(client: UsageClient) {
  return createUsageAdapter({ id: "kimi", categories: ["llm"], client });
}
