// Devin (Cognition) — autonomous coding agent, billed in ACUs. ⚠ VERIFY usage endpoint.
import { createUsageAdapter, type UsageClient, type UsageItem } from "../_shared/http-usage.ts";
import type { DateRange } from "../../../core/src/adapter.ts";

export function createHttpClient(cfg: { apiKey: string; baseUrl?: string }): UsageClient {
  const base = cfg.baseUrl ?? "https://api.devin.ai/v1";
  return {
    async usage(range: DateRange): Promise<UsageItem[]> {
      const res = await fetch(`${base}/consumption?from=${range.from}&to=${range.to}`, { headers: { Authorization: `Bearer ${cfg.apiKey}` } });
      if (!res.ok) throw new Error(`Devin consumption ${res.status}: ${await res.text()}`);
      const body = (await res.json()) as { items?: Array<{ date: string; acus?: number; usd?: number; session_id?: string }> };
      return (body.items ?? []).map((i) => ({ ts: new Date(i.date).toISOString(), operation: i.session_id ?? "session", amount: i.acus ?? 0, unit: "credit", rawUnit: "ACU", usd: i.usd, category: "coding" }));
    },
  };
}
export function createDevinAdapter(client: UsageClient) {
  return createUsageAdapter({ id: "devin", categories: ["coding"], client });
}
