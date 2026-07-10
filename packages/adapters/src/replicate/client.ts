// Replicate data-source seam. The adapter talks to this interface, so the real
// transport (REST over global fetch) is swappable and the logic is testable with a
// fixture. Shapes verified against the live Replicate HTTP API:
//   GET https://api.replicate.com/v1/predictions   (list, newest-first, 100/page)
//   GET https://api.replicate.com/v1/account        (identity)
// Auth: Bearer API token (`Authorization: Bearer r8_...`).

/** A single prediction as returned by GET /v1/predictions. */
export interface ReplicatePrediction {
  id: string;
  model: string;        // "{owner}/{name}", e.g. "black-forest-labs/flux-schnell"
  version?: string;     // 64-char version id
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled" | (string & {});
  created_at: string;   // ISO8601 — when the prediction was created
  started_at?: string;
  completed_at?: string;
  source?: "web" | "api" | (string & {});
  // Present once the prediction terminates. predict_time = GPU/CPU seconds billed.
  metrics?: { predict_time?: number; total_time?: number };
}

/** Paginated list envelope. `next`/`previous` are fully-qualified cursor URLs (or null). */
export interface ReplicatePage {
  results: ReplicatePrediction[];
  next: string | null;
  previous: string | null;
}

/** GET /v1/account — identity only; Replicate exposes no credit balance (postpaid). */
export interface ReplicateAccount {
  type: string;         // "user" | "organization"
  username: string;
  name?: string;
  github_url?: string;
}

export interface PredictionsQuery {
  /** A `next` URL from a prior page (fully-qualified, carries the cursor). */
  cursor?: string;
  /** ISO8601 lower bound (maps to ?created_after=). */
  createdAfter?: string;
  /** ISO8601 upper bound (maps to ?created_before=). */
  createdBefore?: string;
}

export interface ReplicateClient {
  predictions(args: PredictionsQuery): Promise<ReplicatePage>;
  account(): Promise<ReplicateAccount>;
}

/** Deterministic, offline client backed by a captured page — used by tests and `--demo`. */
export function createFixtureClient(
  page: ReplicatePage,
  account: ReplicateAccount = { type: "user", username: "fixture" },
): ReplicateClient {
  return {
    async predictions() {
      // one page then stop, so the adapter's pagination loop terminates
      return { results: page.results, next: null, previous: null };
    },
    async account() {
      return account;
    },
  };
}

export interface HttpClientOpts {
  token: string;
  /** Override for tests; defaults to the real API host. */
  baseUrl?: string;
}

/**
 * Real REST-backed client over global fetch. Fails loudly on any non-2xx or
 * transport error — it never silently returns an empty page.
 */
export function createHttpClient(opts: HttpClientOpts): ReplicateClient {
  if (!opts.token) throw new Error("Replicate API token is required (Authorization: Bearer r8_...).");
  const base = opts.baseUrl ?? "https://api.replicate.com";
  const headers = { Authorization: `Bearer ${opts.token}`, "User-Agent": "vibetracker" };

  async function getJson<T>(url: string): Promise<T> {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      let detail = "";
      try {
        detail = await res.text();
      } catch (bodyErr) {
        // Body was unreadable — keep the status, note why, and still throw.
        detail = `<unreadable body: ${bodyErr instanceof Error ? bodyErr.message : String(bodyErr)}>`;
      }
      throw new Error(`Replicate ${res.status} ${res.statusText} for ${url}: ${detail.slice(0, 300)}`);
    }
    return (await res.json()) as T;
  }

  return {
    async predictions({ cursor, createdAfter, createdBefore }: PredictionsQuery = {}) {
      let url: string;
      if (cursor) {
        // `next` is already a fully-qualified URL carrying the opaque cursor param.
        url = cursor;
      } else {
        const u = new URL("/v1/predictions", base);
        if (createdAfter) u.searchParams.set("created_after", createdAfter);
        if (createdBefore) u.searchParams.set("created_before", createdBefore);
        url = u.toString();
      }
      return getJson<ReplicatePage>(url);
    },
    async account() {
      // ⚠ VERIFY: /v1/account confirmed in docs; used for identity/verification only.
      // Replicate publishes no per-account credit-balance endpoint (usage is postpaid,
      // billed per GPU-second), so the adapter reports capabilities.balance = false.
      return getJson<ReplicateAccount>(new URL("/v1/account", base).toString());
    },
  };
}
