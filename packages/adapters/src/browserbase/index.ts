// Browserbase — headless browser sessions. ⚠ VERIFY the sessions/usage endpoint + shape.
import { createUsageAdapter, type UsageClient, type UsageItem } from "../_shared/http-usage.ts";

export function createHttpClient(cfg: { apiKey: string; baseUrl?: string }): UsageClient {
  const base = cfg.baseUrl ?? "https://api.browserbase.com/v1";
  return {
    async usage(): Promise<UsageItem[]> {
      const res = await fetch(`${base}/sessions`, { headers: { "x-bb-api-key": cfg.apiKey } });
      if (!res.ok) throw new Error(`Browserbase sessions ${res.status}: ${await res.text()}`);
      const list = (await res.json()) as Array<{ id: string; startedAt?: string; endedAt?: string; createdAt?: string }>;
      return (Array.isArray(list) ? list : []).map((s) => {
        const start = s.startedAt ?? s.createdAt ?? "";
        const secs = s.startedAt && s.endedAt ? Math.max(0, (Date.parse(s.endedAt) - Date.parse(s.startedAt)) / 1000) : 1;
        return { ts: start ? new Date(start).toISOString() : "", operation: "session", amount: secs, unit: "second", category: "other" };
      });
    },
  };
}
export function createBrowserbaseAdapter(client: UsageClient) {
  return createUsageAdapter({ id: "browserbase", categories: ["other"], client });
}
