// sunoapi.org data-source seam. sunoapi.org is a third-party Suno API proxy: Bearer-key auth,
// documented at https://docs.sunoapi.org. Its ONLY account/billing endpoint is the remaining-credit
// balance — there is no generation-history or transaction endpoint — so usage is a balance snapshot
// (consumption over time is the balance delta across syncs). Fails loudly; never silent.
//
//   GET /api/v1/generate/credit  ->  { code: 200, msg: "success", data: <credits:int> }

export interface SunoApiCredits {
  credits: number; // remaining credit balance
}

export interface SunoApiClient {
  credits(): Promise<SunoApiCredits>;
}

/** Deterministic fixture client for tests (no network). */
export function createFixtureClient(credits: SunoApiCredits): SunoApiClient {
  return { async credits() { return credits; } };
}

/** Live client against api.sunoapi.org with Bearer-key auth. Throws on any non-200 or bad shape. */
export function createHttpClient(cfg: { apiKey: string; baseUrl?: string }): SunoApiClient {
  const base = cfg.baseUrl ?? "https://api.sunoapi.org";
  const headers = { authorization: `Bearer ${cfg.apiKey}`, "content-type": "application/json" };
  return {
    async credits() {
      const res = await fetch(`${base}/api/v1/generate/credit`, { headers });
      if (!res.ok) throw new Error(`sunoapi credits ${res.status}: ${await res.text()}`);
      const body = (await res.json()) as { code?: number; msg?: string; data?: unknown };
      if (body.code !== 200 || typeof body.data !== "number") {
        throw new Error(`sunoapi credits: unexpected response ${JSON.stringify(body).slice(0, 160)}`);
      }
      return { credits: body.data };
    },
  };
}
