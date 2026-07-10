import { createUsageAdapter, type UsageClient, type UsageItem } from "../_shared/http-usage.ts";
import type { DateRange } from "../../../core/src/adapter.ts";

export function createHttpClient(cfg: { apiKey: string; baseUrl?: string }): UsageClient {
  const base = cfg.baseUrl ?? "https://ark.cn-beijing.volces.com";
  return {
    async usage(range: DateRange): Promise<UsageItem[]> {
      const url = new URL(`${base}/api/v3/usage`);
      url.searchParams.set("start", range.from);
      url.searchParams.set("end", range.to);
      const res = await fetch(url, { headers: { Authorization: `Bearer ${cfg.apiKey}` } });
      if (!res.ok) throw new Error(`Doubao usage ${res.status}: ${await res.text()}`);
      const body = await res.json() as { data?: Array<{ date: string; model?: string; total_tokens?: number; cost?: number; modality?: string }> };
      return (body.data ?? []).map((d) => ({ ts: new Date(d.date).toISOString(), model: d.model, amount: d.total_tokens ?? 0, unit: "token", usd: d.cost, category: d.modality === "video" ? "video" : d.modality === "audio" ? "audio" : d.modality === "image" ? "image" : "llm" }));
    },
  };
}

export function createDoubaoAdapter(client: UsageClient) {
  return createUsageAdapter({ id: "doubao", categories: ["llm", "image", "video", "audio"], client });
}
