// OpenRouter — LLM gateway, BYOK-native. Balance + cumulative usage via the credits API.
//   GET https://openrouter.ai/api/v1/credits -> { data: { total_credits, total_usage } } (USD)
// Auth: Authorization: Bearer <OPENROUTER_API_KEY>.
// ⚠ Per-operation history needs the proxy tier (roadmap); this is a to-date snapshot.

export interface OpenRouterCredits { total_credits: number; total_usage: number }
export interface OpenRouterClient { credits(): Promise<OpenRouterCredits> }

export function createFixtureClient(c: OpenRouterCredits): OpenRouterClient {
  return { async credits() { return c; } };
}

export function createHttpClient(cfg: { apiKey: string; baseUrl?: string }): OpenRouterClient {
  const base = cfg.baseUrl ?? "https://openrouter.ai";
  return {
    async credits() {
      const res = await fetch(`${base}/api/v1/credits`, { headers: { Authorization: `Bearer ${cfg.apiKey}` } });
      if (!res.ok) throw new Error(`OpenRouter credits ${res.status}: ${await res.text()}`);
      const body = (await res.json()) as { data: OpenRouterCredits };
      return body.data;
    },
  };
}
