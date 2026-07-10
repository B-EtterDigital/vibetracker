// fal.ai data-source seam. The adapter talks to this interface, so the real
// transport (REST) is swappable and the logic is testable with a fixture.
//
// Shapes modelled on the fal Platform APIs (verified against public docs):
//   GET https://api.fal.ai/v1/models/usage      — per-endpoint usage ledger (Tier-1)
//   GET https://api.fal.ai/v1/account/billing    — current credit balance
// Auth: `Authorization: Key <FAL_KEY>` where FAL_KEY = "key_id:key_secret" (ADMIN scope).
// The usage + billing Platform APIs require an ADMIN-scoped key. ⚠ VERIFY scope on a live key.

/** One aggregated usage row for a single endpoint within a time bucket. */
export interface FalUsageResult {
  endpoint_id: string;                 // "fal-ai/flux/dev"
  unit: string;                        // billed unit: "image" | "second" | "megapixel" | "request" | "token" | ...
  quantity: number;                    // number of billed units
  unit_price?: number;                 // USD per unit
  cost?: number;                       // USD total for this row (quantity * unit_price)
  currency?: string;                   // "USD"
  auth_method?: string;                // "Production Key" | "Admin Key" | ...
}

/** A time bucket (day/hour/…) holding one row per endpoint used in that window. */
export interface FalUsageBucket {
  bucket: string;                      // ISO8601 with tz offset, e.g. "2026-06-29T00:00:00Z"
  results: FalUsageResult[];
}

/** Response of GET /v1/models/usage?expand=time_series. */
export interface FalUsagePage {
  time_series?: FalUsageBucket[];
  summary?: FalUsageResult[];          // present only when expand=summary is requested
  next_cursor: string | null;
  has_more: boolean;
}

/** Response of GET /v1/account/billing?expand=credits. */
export interface FalBilling {
  username: string;
  credits?: { current_balance: number; currency: string };
}

export interface FalUsageQuery {
  start: string;                       // ISO8601 inclusive
  end: string;                         // ISO8601 exclusive (fal convention)
  cursor?: string;
  limit?: number;
}

export interface FalClient {
  usage(q: FalUsageQuery): Promise<FalUsagePage>;
  billing(): Promise<FalBilling>;
}

/** Deterministic, offline client backed by captured data — used by tests and `--demo`. */
export function createFixtureClient(page: FalUsagePage, billing: FalBilling): FalClient {
  return {
    async usage() {
      // one page then stop, so the adapter's pagination loop terminates
      return { time_series: page.time_series, summary: page.summary, next_cursor: null, has_more: false };
    },
    async billing() {
      return billing;
    },
  };
}

export interface FalHttpOpts {
  key: string;
  /** Override for tests / self-hosted gateways. Defaults to the public Platform API. */
  baseUrl?: string;
}

/**
 * Real REST-backed client. Fails loudly on missing key or non-2xx responses —
 * never silently returns empty usage (which would understate spend).
 */
export function createHttpClient({ key, baseUrl }: FalHttpOpts): FalClient {
  if (!key || !key.trim()) {
    throw new Error(
      "fal adapter: missing API key. Set FAL_KEY = \"key_id:key_secret\" (ADMIN scope) and inject via createHttpClient({ key }).",
    );
  }
  const base = (baseUrl ?? "https://api.fal.ai/v1").replace(/\/+$/, "");
  const headers = { Authorization: `Key ${key}`, Accept: "application/json" };

  async function get(url: URL, area: string): Promise<unknown> {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      let detail: string;
      try {
        detail = await res.text();
      } catch (readErr) {
        // body unreadable — the status line below is still actionable, so surface why.
        detail = `<unreadable body: ${readErr instanceof Error ? readErr.message : String(readErr)}>`;
      }
      throw new Error(`fal ${area} ${res.status} ${res.statusText}: ${detail.slice(0, 300)}`);
    }
    return await res.json();
  }

  return {
    async usage({ start, end, cursor, limit }) {
      const url = new URL(`${base}/models/usage`);
      url.searchParams.set("start", start);
      url.searchParams.set("end", end);
      url.searchParams.append("expand", "time_series");
      if (limit != null) url.searchParams.set("limit", String(limit));
      if (cursor) url.searchParams.set("cursor", cursor);
      return (await get(url, "usage")) as FalUsagePage;
    },
    async billing() {
      const url = new URL(`${base}/account/billing`);
      url.searchParams.set("expand", "credits");
      return (await get(url, "billing")) as FalBilling;
    },
  };
}
