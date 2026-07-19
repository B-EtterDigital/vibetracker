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

  return {
    async stats(args) {
      const url = new URL(baseUrl);
      url.searchParams.set("from", args.from);
      url.searchParams.set("to", args.to);
      url.searchParams.set("limit", String(args.limit));
      if (args.cursor) url.searchParams.set("cursor", args.cursor);
      const response = await doFetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });
      if (!response.ok) {
        const detail = (await response.text()).slice(0, 500);
        throw new Error(
          `Cynaps3 stats request failed: ${response.status} ${response.statusText}` +
            (detail ? ` - ${detail}` : ""),
        );
      }
      return parseStatsPage(await response.json());
    },
  };
}
