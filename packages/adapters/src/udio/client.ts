// Udio (Uncharted Labs) data-source seam. The adapter talks to this interface, so the
// real transport (reverse-engineered web session) is swappable and the logic is testable
// with a fixture.
//
// ACCESS REALITY (researched 2026-07):
//   - Udio ships NO official public API. Its help center states plainly that a public API
//     is not offered. There are no self-service keys, SDK, or docs.  ⚠ VERIFY (policy can change)
//   - The only programmatic access is by replaying the browser's web-app session — the
//     Supabase auth cookie `sb-api-auth-token` — against https://www.udio.com/api/*.
//     This is reverse-engineered (flowese/UdioWrapper, Cortexelus gist) and NOT endorsed.
//   - Tier classification for VibeTRACKER: ToS-GRAY, cookie-auth, FEED-RECONSTRUCTION.
//     Treat as personal-use only; never ship shared/hosted scraping of Udio.
//
// Confirmed shapes are marked as such; everything reverse-engineered is marked ⚠ VERIFY.

/** One generation as it appears in the account library/feed. */
export interface UdioSong {
  id: string;                 // confirmed field
  title: string;              // confirmed field
  created_at: string;         // ISO8601 — confirmed field
  model?: string;             // e.g. "udio-1.5", "udio-1.5-allegro"  ⚠ VERIFY exact key/values
  status?: string;            // "complete" | "processing" | "failed"  ⚠ VERIFY
  finished?: boolean;         // true once audio is rendered  ⚠ VERIFY
  prompt?: string;            // confirmed field
  song_path?: string;         // download URL — confirmed field
}

/** Account credit/subscription snapshot. No confirmed public endpoint exists. ⚠ VERIFY */
export interface UdioCredits {
  credits: number;            // remaining monthly credits  ⚠ VERIFY (field name + semantics)
  subscription_tier?: string; // "free" | "standard" | "pro"  ⚠ VERIFY
}

/** A page of the library/feed. Envelope key + cursor scheme are reverse-engineered. ⚠ VERIFY */
export interface UdioFeedPage {
  data: UdioSong[];
  next: string | null;        // opaque cursor for the next (older) page, or null when done
}

export interface UdioFeedArgs {
  cursor?: string;            // opaque cursor from the previous page
  pageSize?: number;          // page size hint  ⚠ VERIFY (param name)
}

export interface UdioClient {
  /** Current account credit balance. */
  credits(): Promise<UdioCredits>;
  /** One page of the generation feed/library, newest-first. */
  feed(args?: UdioFeedArgs): Promise<UdioFeedPage>;
}

/** Deterministic, offline client backed by a captured page + credits — used by tests and `--demo`. */
export function createFixtureClient(page: UdioFeedPage, credits: UdioCredits): UdioClient {
  return {
    async credits() { return credits; },
    async feed() {
      // one page then stop, so the adapter's pagination loop terminates
      return { data: page.data, next: null };
    },
  };
}

export interface SessionClientOpts {
  /** Value of the `sb-api-auth-token` cookie copied from a logged-in udio.com browser session. */
  sessionToken: string;
  /** Override for tests / self-host proxies. Defaults to the public web app origin. */
  baseUrl?: string;
  /** Injectable fetch (defaults to global fetch — Node 25+). */
  fetchImpl?: typeof fetch;
}

/**
 * Real session-backed client.
 *
 * ToS-GRAY: this replays a personal browser session cookie against undocumented endpoints.
 * Udio offers no public API, so this is reverse-engineered and unsupported — intended for
 * PERSONAL, non-automated, read-only usage tracking of your OWN account. It fails loudly
 * rather than silently returning empty data, and it never verifies data server-side
 * (serverVerifiable: false on the adapter).
 *
 * Endpoints and response envelopes below are reverse-engineered and unstable. ⚠ VERIFY.
 */
export function createSessionClient(opts: SessionClientOpts): UdioClient {
  if (!opts.sessionToken) {
    throw new Error(
      "Udio session client requires a sessionToken (the `sb-api-auth-token` cookie from a " +
      "logged-in udio.com session). Udio has no public API; this is reverse-engineered and " +
      "personal-use only.",
    );
  }
  const base = (opts.baseUrl ?? "https://www.udio.com").replace(/\/+$/, "");
  const doFetch = opts.fetchImpl ?? fetch;
  const headers: Record<string, string> = {
    // ⚠ VERIFY: cookie name `sb-api-auth-token` is confirmed (Supabase auth), but the exact
    // value encoding and refresh flow are not. No official API — reverse-engineered.
    cookie: `sb-api-auth-token=${opts.sessionToken}`,
    accept: "application/json",
  };

  async function getJson(path: string): Promise<unknown> {
    const res = await doFetch(`${base}${path}`, { headers, method: "GET" });
    if (!res.ok) {
      // Fail loudly — a 401/403 almost always means the session cookie expired.
      throw new Error(
        `Udio request failed: GET ${path} -> ${res.status} ${res.statusText}. ` +
        (res.status === 401 || res.status === 403
          ? "The sb-api-auth-token cookie is likely expired — re-copy it from a fresh browser session."
          : "Endpoint is reverse-engineered and may have changed (⚠ VERIFY)."),
      );
    }
    return res.json();
  }

  return {
    async credits(): Promise<UdioCredits> {
      // ⚠ VERIFY: no confirmed public credits endpoint. Path + response shape are guesses.
      const raw = (await getJson("/api/credits")) as Record<string, unknown>;
      const credits = Number(raw.credits ?? raw.remaining ?? raw.balance);
      if (!Number.isFinite(credits)) {
        throw new Error(
          "Udio credits response did not contain a numeric credit balance (⚠ VERIFY endpoint/shape). " +
          `Got keys: ${Object.keys(raw).join(", ") || "<none>"}`,
        );
      }
      const tier = raw.subscription_tier ?? raw.tier ?? raw.plan;
      return { credits, subscription_tier: typeof tier === "string" ? tier : undefined };
    },

    async feed(args: UdioFeedArgs = {}): Promise<UdioFeedPage> {
      // ⚠ VERIFY: feed path, query params, and envelope key are reverse-engineered.
      const params = new URLSearchParams();
      params.set("pageSize", String(args.pageSize ?? 100));
      if (args.cursor) params.set("cursor", args.cursor);
      const raw = (await getJson(`/api/feed?${params.toString()}`)) as Record<string, unknown>;
      const data = (raw.data ?? raw.songs ?? raw.items) as UdioSong[] | undefined;
      if (!Array.isArray(data)) {
        throw new Error(
          "Udio feed response did not contain a song array (⚠ VERIFY endpoint/shape). " +
          `Got keys: ${Object.keys(raw).join(", ") || "<none>"}`,
        );
      }
      const next = raw.next ?? raw.next_cursor ?? null;
      return { data, next: typeof next === "string" ? next : null };
    },
  };
}
