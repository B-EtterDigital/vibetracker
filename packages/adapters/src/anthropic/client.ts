// Anthropic Admin billing seam (org-level API spend — distinct from the claude-code
// local-log adapter). Uses the Cost Report Admin API:
//   GET https://api.anthropic.com/v1/organizations/cost_report?starting_at=<ISO>&ending_at=<ISO>
// Auth: header `x-api-key: <admin key sk-ant-admin...>` + `anthropic-version`.
// ⚠ VERIFY exact response envelope and field names against current Admin API docs.

export interface AnthropicCostResult {
  amount: string | number;          // USD; the API returns a decimal string
  currency?: string;
  model?: string | null;
  description?: string | null;
}
export interface AnthropicCostBucket {
  starting_at: string;              // ISO8601
  ending_at: string;
  results: AnthropicCostResult[];
}
export interface AnthropicCostPage {
  data: AnthropicCostBucket[];
  has_more: boolean;
  next_page: string | null;
}

export interface AnthropicClient {
  costReport(args: { startingAt: string; endingAt: string; page?: string }): Promise<AnthropicCostPage>;
}

export function createFixtureClient(page: AnthropicCostPage): AnthropicClient {
  return { async costReport() { return page; } };
}

export function createHttpClient(cfg: { adminKey: string; baseUrl?: string; version?: string }): AnthropicClient {
  const base = cfg.baseUrl ?? "https://api.anthropic.com";
  return {
    async costReport({ startingAt, endingAt, page }) {
      const u = new URL(`${base}/v1/organizations/cost_report`);
      u.searchParams.set("starting_at", startingAt);
      u.searchParams.set("ending_at", endingAt);
      if (page) u.searchParams.set("page", page);
      const res = await fetch(u, {
        headers: { "x-api-key": cfg.adminKey, "anthropic-version": cfg.version ?? "2023-06-01" },
      });
      if (!res.ok) throw new Error(`Anthropic cost_report ${res.status}: ${await res.text()}`);
      return (await res.json()) as AnthropicCostPage;
    },
  };
}
