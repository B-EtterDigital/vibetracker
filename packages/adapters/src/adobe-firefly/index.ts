// Adobe Firefly — generative credits (this is what Photoshop's generative AI consumes).
// ⚠ VERIFY the Firefly usage endpoint + auth (x-api-key + OAuth bearer).
import { createUsageAdapter, type UsageClient, type UsageItem } from "../_shared/http-usage.ts";
import type { DateRange } from "../../../core/src/adapter.ts";

export function createHttpClient(cfg: { apiKey: string; token?: string; baseUrl?: string }): UsageClient {
  const base = cfg.baseUrl ?? "https://firefly-api.adobe.io";
  return {
    async usage(range: DateRange): Promise<UsageItem[]> {
      const res = await fetch(`${base}/v3/usage?from=${range.from}&to=${range.to}`, {
        headers: { "x-api-key": cfg.apiKey, ...(cfg.token ? { Authorization: `Bearer ${cfg.token}` } : {}) },
      });
      if (!res.ok) throw new Error(`Adobe Firefly usage ${res.status}: ${await res.text()}`);
      const body = (await res.json()) as { items?: Array<{ date: string; operation?: string; credits?: number }> };
      return (body.items ?? []).map((i) => ({ ts: new Date(i.date).toISOString(), operation: i.operation ?? "generate", amount: i.credits ?? 0, unit: "credit", rawUnit: "credits", category: "image" }));
    },
  };
}
export function createAdobeFireflyAdapter(client: UsageClient) {
  return createUsageAdapter({ id: "adobe-firefly", categories: ["image"], client });
}
