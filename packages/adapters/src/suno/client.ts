// Suno data-source seam. Suno has NO official public consumer usage API; access is via
// a Clerk web-session cookie against undocumented endpoints (community wrappers like
// gcui-art/suno-api). ToS-GRAY, personal-use, read-only. ⚠ VERIFY all endpoints/shapes.
//   feed:    the list of generated clips (created_at, model_name, status)
//   credits: remaining credits / monthly usage
// A clip is one track; Suno bills ~10 credits per generation → 2 tracks (~5/track).

export interface SunoClip {
  id: string;
  created_at: string;      // ISO8601
  model_name?: string;
  status?: string;         // "complete" | "streaming" | "error" | ...
  title?: string;
}
export interface SunoFeedPage { clips: SunoClip[]; next_cursor?: string | null; }
export interface SunoCredits { credits_left: number; monthly_limit?: number; monthly_usage?: number; }

export interface SunoClient {
  credits(): Promise<SunoCredits>;
  feed(args: { cursor?: string }): Promise<SunoFeedPage>;
}

export function createFixtureClient(page: SunoFeedPage, credits: SunoCredits): SunoClient {
  return { async credits() { return credits; }, async feed() { return { ...page, next_cursor: null }; } };
}

// ToS-gray real client: replays a personal browser session. Fails loudly; never silent.
export function createCookieClient(cfg: { sessionCookie: string; baseUrl?: string }): SunoClient {
  const base = cfg.baseUrl ?? "https://studio-api.suno.ai"; // ⚠ VERIFY base + paths
  const headers = { cookie: cfg.sessionCookie };
  return {
    async credits() {
      const res = await fetch(`${base}/api/billing/info/`, { headers });
      if (!res.ok) throw new Error(`Suno credits ${res.status}: ${await res.text()}`);
      return (await res.json()) as SunoCredits;
    },
    async feed({ cursor }) {
      const u = new URL(`${base}/api/feed/`);
      if (cursor) u.searchParams.set("cursor", cursor);
      const res = await fetch(u, { headers });
      if (!res.ok) throw new Error(`Suno feed ${res.status}: ${await res.text()}`);
      const body = (await res.json()) as SunoClip[] | SunoFeedPage;
      return Array.isArray(body) ? { clips: body, next_cursor: null } : body;
    },
  };
}
