// RunPod — GPU serverless / pods. ⚠ VERIFY the billing GraphQL query + shape.
import { createUsageAdapter, type UsageClient, type UsageItem } from "../_shared/http-usage.ts";

export function createHttpClient(cfg: { apiKey: string; baseUrl?: string }): UsageClient {
  const base = cfg.baseUrl ?? "https://api.runpod.io/graphql";
  return {
    async usage(): Promise<UsageItem[]> {
      const res = await fetch(base, {
        method: "POST",
        headers: { "content-type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
        body: JSON.stringify({ query: "{ myself { pods { name costPerHr runtime { uptimeInSeconds } } } }" }),
      });
      if (!res.ok) throw new Error(`RunPod ${res.status}: ${await res.text()}`);
      const body = (await res.json()) as { data?: { myself?: { pods?: Array<{ name?: string; costPerHr?: number; runtime?: { uptimeInSeconds?: number } }> } } };
      const now = new Date().toISOString();
      return (body.data?.myself?.pods ?? []).map((p) => {
        const secs = p.runtime?.uptimeInSeconds ?? 0;
        return { ts: now, operation: p.name ?? "pod", amount: secs, unit: "second", category: "other",
          usd: p.costPerHr != null ? Number((p.costPerHr * (secs / 3600)).toFixed(4)) : undefined };
      });
    },
  };
}
export function createRunPodAdapter(client: UsageClient) {
  return createUsageAdapter({ id: "runpod", categories: ["other"], client });
}
