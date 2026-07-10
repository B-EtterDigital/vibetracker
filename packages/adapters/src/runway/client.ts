// Runway (dev.runwayml.com) data-source seam. The adapter talks to this interface,
// so the real transport (REST) is swappable and the logic is testable with a fixture.
//
// Shapes are taken from Runway's official OpenAPI-generated Node SDK
// (runwayml/sdk-node → src/resources/organization.ts, tasks.ts):
//   GET  /v1/organization        → OrganizationRetrieveResponse   (balance + tier + live usage)
//   POST /v1/organization/usage  → OrganizationRetrieveUsageResponse (credits by model & day, ≤90d)
//   GET  /v1/tasks/{id}          → TaskRetrieveResponse (single task; NO list endpoint exists)
//
// Auth (confirmed): Authorization: Bearer <API_KEY>  +  X-Runway-Version: 2024-11-06 (exact).
// ⚠ VERIFY: the version pin `2024-11-06` and the $0.01/credit price both change over time.
//
// NOTE ON TIERING: Runway exposes NO per-generation usage-history/list endpoint (you can only
// GET a task you already hold the id for). The authoritative usage surface is the daily,
// per-model *credit* aggregate from POST /v1/organization/usage — that is what this adapter
// normalizes (source "ledger"). A per-op "feed_recon" path is not possible without a task feed.

/** Base host for the Runway developer API. */
export const RUNWAY_BASE_URL = "https://api.dev.runwayml.com";

/** Required, pinned API version. ⚠ VERIFY when Runway ships a newer dated version. */
export const RUNWAY_API_VERSION = "2024-11-06";

// The model ids the usage endpoint can report. Kept as a widened string union so a
// newly-launched model never breaks normalization (it just falls through to defaults).
export type RunwayModel = string;

/** One model's net credit spend on one UTC day. `amount` may be negative on refund-heavy days. */
export interface RunwayUsedCredit {
  model: RunwayModel;
  amount: number;
}

/** One UTC day's usage bucket. */
export interface RunwayUsageResult {
  date: string;                 // "YYYY-MM-DD" (UTC)
  usedCredits: RunwayUsedCredit[];
}

/** POST /v1/organization/usage response. */
export interface RunwayUsageResponse {
  models: RunwayModel[];        // models seen in the window
  results: RunwayUsageResult[]; // one entry per day
}

/** Per-model tier limits from GET /v1/organization. */
export interface RunwayTierModelLimit {
  maxConcurrentGenerations: number;
  maxDailyGenerations: number;
}

/** GET /v1/organization response. */
export interface RunwayOrganization {
  creditBalance: number;                                  // credits remaining (API wallet)
  tier: {
    maxMonthlyCreditSpend: number;
    models: Record<string, RunwayTierModelLimit>;
  };
  usage: {
    models: Record<string, { dailyGenerations: number }>; // live "today" counters, not history
  };
}

/** Window for a single usage query. `startDate` inclusive, `beforeDate` exclusive (≤90d apart). */
export interface RunwayUsageQuery {
  startDate?: string;  // "YYYY-MM-DD" (UTC)
  beforeDate?: string; // "YYYY-MM-DD" (UTC), not inclusive
}

export interface RunwayClient {
  organization(): Promise<RunwayOrganization>;
  usage(query: RunwayUsageQuery): Promise<RunwayUsageResponse>;
}

/** Deterministic, offline client backed by captured responses — used by tests and `--demo`. */
export function createFixtureClient(
  usage: RunwayUsageResponse,
  organization: RunwayOrganization,
): RunwayClient {
  return {
    async organization() {
      return organization;
    },
    async usage(query: RunwayUsageQuery) {
      // The fixture ignores the window and returns everything; the adapter still
      // date-filters, so range assertions stay meaningful. `query` is referenced so
      // the fixture contract mirrors the HTTP client's signature.
      void query;
      return usage;
    },
  };
}

export interface RunwayHttpOpts {
  apiKey: string;
  /** Override the base URL (e.g. a proxy). Defaults to the Runway dev host. */
  baseUrl?: string;
  /** Override the pinned X-Runway-Version. Defaults to RUNWAY_API_VERSION. */
  version?: string;
  /** Inject a fetch implementation (tests / non-global runtimes). Defaults to global fetch. */
  fetchImpl?: typeof fetch;
}

/**
 * Real REST-backed client (global fetch, no new deps). Fails loudly when misconfigured
 * rather than silently returning empty data.
 */
export function createHttpClient(opts: RunwayHttpOpts): RunwayClient {
  const apiKey = opts.apiKey?.trim();
  if (!apiKey) {
    throw new Error(
      "Runway API key required — call createHttpClient({ apiKey }). " +
        "Create a server-side key in the developer portal at https://dev.runwayml.com.",
    );
  }
  const baseUrl = (opts.baseUrl ?? RUNWAY_BASE_URL).replace(/\/+$/, "");
  const version = opts.version ?? RUNWAY_API_VERSION;
  const doFetch = opts.fetchImpl ?? fetch;
  if (typeof doFetch !== "function") {
    throw new Error("global fetch unavailable — pass createHttpClient({ fetchImpl }).");
  }

  const baseHeaders = (): Record<string, string> => ({
    Authorization: `Bearer ${apiKey}`,
    "X-Runway-Version": version,
    "Content-Type": "application/json",
    Accept: "application/json",
  });

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const init: RequestInit = { method, headers: baseHeaders() };
    if (body !== undefined) init.body = JSON.stringify(body);
    const res = await doFetch(`${baseUrl}${path}`, init);
    if (!res.ok) {
      // Fail loudly: include status + response body so the caller/telemetry sees the cause.
      const detail = await res.text();
      throw new Error(`Runway API ${method} ${path} failed: ${res.status} ${res.statusText} — ${detail}`);
    }
    return (await res.json()) as T;
  }

  return {
    organization() {
      return request<RunwayOrganization>("GET", "/v1/organization");
    },
    usage(query: RunwayUsageQuery) {
      // The API accepts an empty body (defaults to the last 30 days), so omit undefined keys.
      const payload: RunwayUsageQuery = {};
      if (query.startDate) payload.startDate = query.startDate;
      if (query.beforeDate) payload.beforeDate = query.beforeDate;
      return request<RunwayUsageResponse>("POST", "/v1/organization/usage", payload);
    },
  };
}
