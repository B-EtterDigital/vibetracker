// Luma (Dream Machine) data-source seam. The adapter talks to this interface, so the
// real HTTP transport is swappable and the logic is testable with a fixture.
//
// Shapes verified against the public Dream Machine API docs
// (docs.lumalabs.ai — GET /generations, GET /credits). Base URL:
//   https://api.lumalabs.ai/dream-machine/v1
// Auth: Authorization: Bearer <API key> (create at lumalabs.ai/dream-machine/api).
//
// NOTE: Luma has no per-operation *spend ledger*. /generations is a feed (what ran,
// not what it cost); /credits is a current-balance snapshot in USD cents. Any credit
// cost per generation is reconstructed from a static pricing map — see normalize.ts.

export type LumaGenerationType = "video" | "image" | (string & {});
export type LumaGenerationState =
  | "queued" | "dreaming" | "completed" | "failed" | (string & {});

export interface LumaGeneration {
  id: string;                           // UUID
  generation_type: LumaGenerationType;  // "video" | "image"
  state: LumaGenerationState;           // "queued" | "dreaming" | "completed" | "failed"
  failure_reason: string | null;
  created_at: string;                   // ISO8601
  model: string;                        // "ray-2" | "ray-flash-2" | "photon-1" | "photon-flash-1" | ...
  assets?: {
    video?: string;
    image?: string;
    progress_video?: string;
  };
  request?: Record<string, unknown>;    // original request params (varies by type)
}

/** GET /generations response — an object, not a bare array (offset pagination). */
export interface LumaGenerationsPage {
  has_more: boolean;
  count: number;
  limit: number;
  offset: number;
  generations: LumaGeneration[];
}

/** GET /credits response. `credit_balance` is documented as available balance in USD cents. ⚠ VERIFY unit. */
export interface LumaCredits {
  credit_balance: number;
}

export interface LumaClient {
  generations(args: { limit?: number; offset?: number }): Promise<LumaGenerationsPage>;
  credits(): Promise<LumaCredits>;
}

/**
 * Deterministic, offline client backed by a captured feed — used by tests and `--demo`.
 * Serves `all` with real offset slicing so the adapter's pagination loop is exercised
 * end-to-end and terminates.
 */
export function createFixtureClient(all: LumaGeneration[], credits: LumaCredits): LumaClient {
  return {
    async generations({ limit = 100, offset = 0 }) {
      const slice = all.slice(offset, offset + limit);
      return {
        has_more: offset + slice.length < all.length,
        count: all.length,
        limit,
        offset,
        generations: slice,
      };
    },
    async credits() {
      return credits;
    },
  };
}

export interface LumaHttpOpts {
  apiKey: string;
  /** Override for testing / proxies. Defaults to the public Dream Machine base URL. */
  baseUrl?: string;
}

/**
 * Real HTTP-backed client using the global `fetch`. Fails loudly: throws on a missing
 * API key and on any non-2xx response, so the adapter never silently returns empty data.
 */
export function createHttpClient(opts: LumaHttpOpts): LumaClient {
  const apiKey = opts.apiKey?.trim();
  if (!apiKey) {
    throw new Error(
      "Luma adapter: missing API key. Set a Dream Machine key (Bearer) from " +
      "lumalabs.ai/dream-machine/api and pass it to createHttpClient({ apiKey }).",
    );
  }
  const baseUrl = (opts.baseUrl ?? "https://api.lumalabs.ai/dream-machine/v1").replace(/\/+$/, "");
  const headers = { Authorization: `Bearer ${apiKey}`, Accept: "application/json" };

  return {
    async generations({ limit = 100, offset = 0 }) {
      const url = `${baseUrl}/generations?limit=${encodeURIComponent(String(limit))}&offset=${encodeURIComponent(String(offset))}`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new Error(`Luma GET /generations failed: ${res.status} ${res.statusText}`);
      }
      return (await res.json()) as LumaGenerationsPage;
    },
    async credits() {
      const res = await fetch(`${baseUrl}/credits`, { headers });
      if (!res.ok) {
        throw new Error(`Luma GET /credits failed: ${res.status} ${res.statusText}`);
      }
      return (await res.json()) as LumaCredits;
    },
  };
}
