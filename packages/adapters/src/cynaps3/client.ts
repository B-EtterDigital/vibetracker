// PRODUCTION usage API per the Cynaps3 integration contract
// (sunomation/docs/integrations/vibeusage.md) — lives on the Cynaps3/SUNOMATION project, not the
// VibeUsage backend.
export const CYNAPS3_STATS_URL =
  "https://tvsvttguftnatztsedyx.supabase.co/functions/v1/vibeusage-stats";

export type Cynaps3UsageStatus = "completed" | "failed";
export type Cynaps3BillingOwner = "cynaps3" | "upstream-provider";

export interface Cynaps3UsageEvent {
  id: string;
  occurredAt: string;
  operation: string;
  status: Cynaps3UsageStatus;
  model?: string;
  tracksCreated: number;
  audioSeconds: number;
  creditsConsumed: number;
  toolId: "cynaps3";
  providerId: string;
  billingOwner: Cynaps3BillingOwner;
  upstreamEventId?: string;
}

export interface Cynaps3StatsSummary {
  operations: number;
  successfulOperations: number;
  failedOperations: number;
  tracksCreated: number;
  audioSeconds: number;
  creditsConsumed: number;
}

export interface Cynaps3StatsPage {
  schemaVersion: 1 | 2;
  provider: "cynaps3";
  account: {
    id: string;
    product: "musicmation";
  };
  generatedAt: string;
  summary: Cynaps3StatsSummary;
  events: Cynaps3UsageEvent[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface Cynaps3StatsArgs {
  from: string;
  to: string;
  cursor?: string;
  limit: number;
}

export interface Cynaps3Client {
  stats(args: Cynaps3StatsArgs): Promise<Cynaps3StatsPage>;
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Cynaps3 stats contract: ${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Cynaps3 stats contract: ${label} must be a non-empty string`);
  }
  return value;
}

function timestamp(value: unknown, label: string): string {
  const result = text(value, label);
  if (Number.isNaN(Date.parse(result))) {
    throw new Error(`Cynaps3 stats contract: ${label} must be an ISO timestamp`);
  }
  return result;
}

function amount(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`Cynaps3 stats contract: ${label} must be a non-negative finite number`);
  }
  return value;
}

function count(value: unknown, label: string): number {
  const result = amount(value, label);
  if (!Number.isInteger(result)) {
    throw new Error(`Cynaps3 stats contract: ${label} must be a whole number`);
  }
  return result;
}

function parseSummary(value: unknown): Cynaps3StatsSummary {
  const summary = object(value, "summary");
  const parsed = {
    operations: count(summary.operations, "summary.operations"),
    successfulOperations: count(summary.successfulOperations, "summary.successfulOperations"),
    failedOperations: count(summary.failedOperations, "summary.failedOperations"),
    tracksCreated: count(summary.tracksCreated, "summary.tracksCreated"),
    audioSeconds: amount(summary.audioSeconds, "summary.audioSeconds"),
    creditsConsumed: amount(summary.creditsConsumed, "summary.creditsConsumed"),
  };
  if (parsed.successfulOperations + parsed.failedOperations !== parsed.operations) {
    throw new Error("Cynaps3 stats contract: successful + failed operations must equal operations");
  }
  return parsed;
}

function providerId(value: unknown, label: string): string {
  const result = text(value, label).toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]{0,63}$/.test(result)) {
    throw new Error(`Cynaps3 stats contract: ${label} is not a provider id`);
  }
  return result;
}

function parseEvent(value: unknown, index: number, schemaVersion: 1 | 2): Cynaps3UsageEvent {
  const event = object(value, `events[${index}]`);
  const status = text(event.status, `events[${index}].status`);
  if (status !== "completed" && status !== "failed") {
    throw new Error(`Cynaps3 stats contract: events[${index}].status is unsupported`);
  }
  const model = event.model == null ? undefined : text(event.model, `events[${index}].model`);
  let eventProvider = "cynaps3";
  let billingOwner: Cynaps3BillingOwner = "cynaps3";
  let upstreamEventId: string | undefined;
  if (schemaVersion === 2) {
    if (event.toolId !== "cynaps3") {
      throw new Error(`Cynaps3 stats contract: events[${index}].toolId must be cynaps3`);
    }
    eventProvider = providerId(event.providerId, `events[${index}].providerId`);
    if (event.billingOwner !== "cynaps3" && event.billingOwner !== "upstream-provider") {
      throw new Error(`Cynaps3 stats contract: events[${index}].billingOwner is unsupported`);
    }
    billingOwner = event.billingOwner;
    upstreamEventId = event.upstreamEventId == null
      ? undefined
      : text(event.upstreamEventId, `events[${index}].upstreamEventId`);
    if (billingOwner === "upstream-provider" && !upstreamEventId) {
      throw new Error(`Cynaps3 stats contract: events[${index}].upstreamEventId is required for upstream billing`);
    }
  }
  return {
    id: text(event.id, `events[${index}].id`),
    occurredAt: timestamp(event.occurredAt, `events[${index}].occurredAt`),
    operation: text(event.operation, `events[${index}].operation`),
    status,
    ...(model ? { model } : {}),
    tracksCreated: count(event.tracksCreated, `events[${index}].tracksCreated`),
    audioSeconds: amount(event.audioSeconds, `events[${index}].audioSeconds`),
    creditsConsumed: amount(event.creditsConsumed, `events[${index}].creditsConsumed`),
    toolId: "cynaps3",
    providerId: eventProvider,
    billingOwner,
    ...(upstreamEventId ? { upstreamEventId } : {}),
  };
}

export function parseStatsPage(value: unknown): Cynaps3StatsPage {
  const root = object(value, "response");
  if ((root.schemaVersion !== 1 && root.schemaVersion !== 2) || root.provider !== "cynaps3") {
    throw new Error("Cynaps3 stats contract: expected schemaVersion 1 or 2 and provider cynaps3");
  }
  const schemaVersion = root.schemaVersion;
  const account = object(root.account, "account");
  if (account.product !== "musicmation") {
    throw new Error("Cynaps3 stats contract: account.product must be musicmation");
  }
  if (!Array.isArray(root.events)) {
    throw new Error("Cynaps3 stats contract: events must be an array");
  }
  const page = object(root.page, "page");
  if (typeof page.hasMore !== "boolean") {
    throw new Error("Cynaps3 stats contract: page.hasMore must be boolean");
  }
  const nextCursor = page.nextCursor == null ? null : text(page.nextCursor, "page.nextCursor");
  if (page.hasMore !== (nextCursor !== null)) {
    throw new Error("Cynaps3 stats contract: hasMore and nextCursor disagree");
  }
  return {
    schemaVersion,
    provider: "cynaps3",
    account: { id: text(account.id, "account.id"), product: "musicmation" },
    generatedAt: timestamp(root.generatedAt, "generatedAt"),
    summary: parseSummary(root.summary),
    events: root.events.map((event, index) => parseEvent(event, index, schemaVersion)),
    page: { nextCursor, hasMore: page.hasMore },
  };
}

export function createFixtureClient(pages: Cynaps3StatsPage[]): Cynaps3Client {
  return {
    async stats({ cursor }) {
      const index = cursor == null
        ? 0
        : pages.findIndex((page) => page.page.nextCursor === cursor) + 1;
      const page = pages[index];
      if (!page) throw new Error(`Cynaps3 fixture: unexpected cursor ${cursor ?? "<first>"}`);
      return parseStatsPage(page);
    },
  };
}

export interface Cynaps3HttpOpts {
  accessToken: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export function createHttpClient(opts: Cynaps3HttpOpts): Cynaps3Client {
  const accessToken = opts.accessToken?.trim();
  if (!accessToken) {
    throw new Error("Cynaps3 OAuth access token with usage:read scope required");
  }
  const baseUrl = (opts.baseUrl ?? CYNAPS3_STATS_URL).replace(/\/+$/, "");
  const doFetch = opts.fetchImpl ?? fetch;
  if (typeof doFetch !== "function") {
    throw new Error("Cynaps3 adapter: global fetch unavailable; pass fetchImpl");
  }

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  // The endpoint enforces 120 req/300s per IP and 60 req/60s per account — an unpaced ~100-page
  // history crawl trips them mid-run (live incident 2026-07-19). Pace every request so a full
  // crawl stays inside both budgets by construction.
  const MIN_REQUEST_INTERVAL_MS = 2_600;
  let lastRequestAt = 0;
  return {
    async stats(args) {
      const url = new URL(baseUrl);
      url.searchParams.set("from", args.from);
      url.searchParams.set("to", args.to);
      url.searchParams.set("limit", String(args.limit));
      if (args.cursor) url.searchParams.set("cursor", args.cursor);
      // The producer's auth path is nondeterministic (its Clerk metadata fetch flakes → sporadic
      // 401 with a VALID token — verified live 2026-07-19: same token, 401 then 200 twice). Retry
      // The producer's auth path can flake in bursts (transient PostgREST failures read as 401
      // server-side, live incident 2026-07-19) — ride out a burst with a patient exponential
      // ladder (2s, 4s, 8s, 16s, 30s ≈ one minute of cover) instead of failing a 50-page sync.
      let lastError: Error | undefined;
      let lastStatus = 0;
      const backoffMs = [0, 2_000, 4_000, 8_000, 16_000, 30_000];
      for (let attempt = 0; attempt < backoffMs.length; attempt++) {
        if (attempt > 0) await sleep(backoffMs[attempt]);
        // 401 bursts are sticky per keep-alive connection: the pinned edge instance keeps
        // rejecting while a FRESH connection succeeds immediately (verified live 2026-07-19 —
        // probe processes 200'd during the same minute the pooled connection 401'd every try).
        // On 401 retries, break the pin with a one-shot undici Agent when the runtime has it.
        let freshAgent: { close(): Promise<void> } | undefined;
        let attemptFetch = doFetch;
        const init: Record<string, unknown> = {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        };
        if (attempt > 0 && lastStatus === 401) {
          try {
            // undici's Agent only composes with undici's OWN fetch — Node's built-in fetch
            // rejects a foreign dispatcher, so both come from the package for this attempt.
            const undici = (await import("undici")) as unknown as {
              Agent: new (o: object) => { close(): Promise<void> };
              fetch: typeof fetch;
            };
            freshAgent = new undici.Agent({ pipelining: 0 });
            init.dispatcher = freshAgent;
            attemptFetch = undici.fetch as typeof doFetch;
          } catch (undiciMissing) {
            freshAgent = undefined; // non-Node runtime — retry rides the default dispatcher
          }
        }
        try {
          const wait = lastRequestAt + MIN_REQUEST_INTERVAL_MS - Date.now();
          if (wait > 0) await sleep(wait);
          lastRequestAt = Date.now();
          const response = await attemptFetch(url, init as RequestInit);
          if (response.ok) return parseStatsPage(await response.json());
          lastStatus = response.status;
          if (response.status === 429) {
            // honest rate limit — honor retry-after and keep going
            const retryAfter = Number(response.headers.get("retry-after")) || 30;
            await response.body?.cancel();
            lastError = new Error(`Cynaps3 stats request failed: 429 rate limited`);
            await sleep(Math.min(retryAfter, 120) * 1_000);
            continue;
          }
          const detail = (await response.text()).slice(0, 500);
          lastError = new Error(
            `Cynaps3 stats request failed: ${response.status} ${response.statusText}` +
              (detail ? ` - ${detail}` : ""),
          );
          if (response.status !== 401 && response.status < 500) break; // real client errors don't retry
        } finally {
          if (freshAgent) await freshAgent.close();
        }
      }
      throw lastError ?? new Error("Cynaps3 stats request failed");
    },
  };
}
