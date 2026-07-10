// x.ai (Grok) — usage/billing. OpenAI-compatible for inference; usage via mgmt API.
// ⚠ VERIFY the usage endpoint + shape. (Also trackable live via `vibetracker proxy`.)
import { createUsageAdapter, type UsageClient, type UsageItem } from "../_shared/http-usage.ts";
import type { DateRange } from "../../../core/src/adapter.ts";

export function createHttpClient(cfg: { apiKey: string; baseUrl?: string }): UsageClient {
  const base = cfg.baseUrl ?? "https://api.x.ai/v1";
  return {
    async usage(range: DateRange): Promise<UsageItem[]> {
      const res = await fetch(`${base}/usage?start=${range.from}&end=${range.to}`, { headers: { Authorization: `Bearer ${cfg.apiKey}` } });
      if (!res.ok) throw new Error(`x.ai usage ${res.status}: ${await res.text()}`);
      const body = (await res.json()) as { data?: Array<{ date: string; model?: string; total_tokens?: number; cost?: number }> };
      return (body.data ?? []).map((d) => ({ ts: new Date(d.date).toISOString(), model: d.model, amount: d.total_tokens ?? 0, unit: "token", usd: d.cost, category: "llm" }));
    },
  };
}
export function createXaiAdapter(client: UsageClient) {
  return createUsageAdapter({ id: "xai", categories: ["llm"], client });
}
