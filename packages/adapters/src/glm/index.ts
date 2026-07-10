// GLM / Zhipu (BigModel) — usage/billing. ⚠ VERIFY the usage endpoint + auth (JWT).
import { createUsageAdapter, type UsageClient, type UsageItem } from "../_shared/http-usage.ts";
import type { DateRange } from "../../../core/src/adapter.ts";

export function createHttpClient(cfg: { apiKey: string; baseUrl?: string }): UsageClient {
  const base = cfg.baseUrl ?? "https://open.bigmodel.cn/api/paas/v4";
  return {
    async usage(range: DateRange): Promise<UsageItem[]> {
      const res = await fetch(`${base}/usage?start=${range.from}&end=${range.to}`, { headers: { Authorization: `Bearer ${cfg.apiKey}` } });
      if (!res.ok) throw new Error(`GLM usage ${res.status}: ${await res.text()}`);
      const body = (await res.json()) as { data?: Array<{ date: string; model?: string; total_tokens?: number; cost?: number }> };
      return (body.data ?? []).map((d) => ({ ts: new Date(d.date).toISOString(), model: d.model, amount: d.total_tokens ?? 0, unit: "token", usd: d.cost, category: "llm" }));
    },
  };
}
export function createGlmAdapter(client: UsageClient) {
  return createUsageAdapter({ id: "glm", categories: ["llm"], client });
}
