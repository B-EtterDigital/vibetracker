// z.ai — usage/billing. OpenAI-compatible for inference. ⚠ VERIFY the usage endpoint.
// (Also trackable live via `vibetracker proxy`.)
import { createUsageAdapter, type UsageClient, type UsageItem } from "../_shared/http-usage.ts";
import type { DateRange } from "../../../core/src/adapter.ts";

export function createHttpClient(cfg: { apiKey: string; baseUrl?: string }): UsageClient {
  const base = cfg.baseUrl ?? "https://api.z.ai/api/paas/v4";
  return {
    async usage(range: DateRange): Promise<UsageItem[]> {
      const res = await fetch(`${base}/usage?start=${range.from}&end=${range.to}`, { headers: { Authorization: `Bearer ${cfg.apiKey}` } });
      if (!res.ok) throw new Error(`z.ai usage ${res.status}: ${await res.text()}`);
      const body = (await res.json()) as { data?: Array<{ date: string; model?: string; total_tokens?: number; cost?: number }> };
      return (body.data ?? []).map((d) => ({ ts: new Date(d.date).toISOString(), model: d.model, amount: d.total_tokens ?? 0, unit: "token", usd: d.cost, category: "llm" }));
    },
  };
}
export function createZaiAdapter(client: UsageClient) {
  return createUsageAdapter({ id: "zai", categories: ["llm"], client });
}
