// OpenAI data-source seam. Uses the Costs API (real USD by line item), which needs
// an ADMIN key. Shapes per https://platform.openai.com/docs/api-reference/usage
//   GET https://api.openai.com/v1/organization/costs?start_time=<unix>&limit=...
// Auth: Authorization: Bearer <admin key>.  ⚠ VERIFY exact field names against current docs.

export interface OpenAICostResult {
  amount: { value: number; currency: string };
  line_item: string | null;
  project_id?: string | null;
}
export interface OpenAICostBucket {
  start_time: number; // unix seconds
  end_time: number;
  results: OpenAICostResult[];
}
export interface OpenAICostsPage {
  data: OpenAICostBucket[];
  has_more: boolean;
  next_page: string | null;
}

export interface OpenAIClient {
  costs(args: { startTime: number; endTime?: number; page?: string }): Promise<OpenAICostsPage>;
}

export function createFixtureClient(page: OpenAICostsPage): OpenAIClient {
  return { async costs() { return page; } };
}

export function createHttpClient(cfg: { adminKey: string; baseUrl?: string }): OpenAIClient {
  const base = cfg.baseUrl ?? "https://api.openai.com";
  return {
    async costs({ startTime, endTime, page }) {
      const u = new URL(`${base}/v1/organization/costs`);
      u.searchParams.set("start_time", String(startTime));
      if (endTime) u.searchParams.set("end_time", String(endTime));
      u.searchParams.set("limit", "180");
      if (page) u.searchParams.set("page", page);
      const res = await fetch(u, { headers: { Authorization: `Bearer ${cfg.adminKey}` } });
      if (!res.ok) throw new Error(`OpenAI costs API ${res.status}: ${await res.text()}`);
      return (await res.json()) as OpenAICostsPage;
    },
  };
}
