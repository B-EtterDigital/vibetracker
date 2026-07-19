import { randomBytes, timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { NormalizedRecord, Category } from "../../core/src/schema/record.ts";
import { ingestRecords } from "../../core/src/verify/validate.ts";
import { computeStats } from "../../core/src/stats.ts";
import { computeUsageInsights } from "../../core/src/analytics/insights.ts";

export interface BrowserCaptureEvent {
  provider?: string;
  category?: Category;
  operation?: string;
  model?: string;
  quantity?: number;
  unit?: NormalizedRecord["unit"];
  rawAmount?: number;
  rawUnit?: string;
  usdEst?: number;
  url?: string;
  title?: string;
  ts?: string;
  // a lifetime/balance figure — re-reading it REPLACES the prior snapshot for this
  // provider+operation instead of appending a duplicate that would inflate totals
  snapshot?: boolean;
}

export interface LocalApiDeps {
  readRecords: () => NormalizedRecord[];
  appendRecords: (records: NormalizedRecord[]) => void;
  // Replace any prior snapshot record with the same provider+operation, then store this one.
  // Absent → snapshots fall back to append (never worse than today).
  replaceSnapshot?: (record: NormalizedRecord) => void;
  log: (line: string) => void;
  // Store cookie-only credentials handed over by the browser extension's one-click connect.
  // Returns the credential FIELD NAMES stored (never values) so the response can confirm without
  // exposing the secret. Absent → the /connect route is disabled.
  connectProvider?: (provider: string, fields: Record<string, string>) => { stored: string[]; keyring: boolean } | Promise<{ stored: string[]; keyring: boolean }>;
  // Per-provider sync state for the extension's source board: booleans + a timestamp only —
  // never counts, never values. Absent → /sources returns an empty map.
  sourceStatus?: () => Record<string, { hasData: boolean; connected: boolean; lastTs?: string }>;
  // Run a full adapter sync (same as `vibetracker sync`) on request from the extension's
  // "Sync now" button. Absent → POST /sync answers 501.
  runSync?: () => Promise<{ fresh: number; targets: number }>;
  // The active user's public profile (handle + canonical URL) for the extension's profile button.
  // Absent or null handle → the extension links to the site root instead.
  profile?: () => { handle: string | null; url: string };
}

// The cookie-only sources the extension may connect. Kept here (not from the adapter registry) so
// the local API has an explicit allowlist — a rogue POST can never store creds for an arbitrary id.
const CONNECTABLE_PROVIDERS: Record<string, string[]> = {
  // cynaps3 hands over the live Clerk session token, which the CLI immediately redeems for
  // rotating OAuth credentials (first-party headless connect — see oauth.ts).
  cynaps3: ["clerkToken"],
  suno: ["sessionCookie"],
  udio: ["sessionToken"],
  seaart: ["sessionToken"],
  tensorart: ["sessionToken"],
  pixverse: ["sessionToken"],
  vidu: ["sessionToken"],
};

// Candidate ports the local bridge tries to bind, in preference order. The CLI walks this list and
// binds the first FREE one; the extension probes the same list for the first that answers /health.
// So a collision (something already on 8765 — e.g. watchdog_bd) self-heals to the next port instead
// of dead-ending with EADDRINUSE. MUST stay in sync with CANDIDATE_PORTS in
// packages/browser-extension/popup-model.mjs.
export const BRIDGE_PORTS = [8799, 8765, 8787, 8123];

export interface LocalApiSession {
  server: Server;
  token: string;
  dashboardUrl: string;
  port: number;
}

interface StartLocalApiOptions {
  port: number;
  deps: LocalApiDeps;
  token?: string;
  dashboardOrigin?: string;
}

// The canonical, user-facing production host. Every printed dashboard link uses this — never the
// stale build alias `vibetracker-betterdigital.netlify.app` (which stays allowed as a CORS origin
// below for preview deploys only; c0vibe.app is itself Netlify-hosted, so the netlify platform is
// fine — only that specific alias is wrong to show a user). Locked by a test in api-server.test.ts.
export const DEFAULT_DASHBOARD_ORIGIN = "https://vibeusage.c0vibe.app";

function isDashboardOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    if (url.protocol === "http:" && (url.hostname === "127.0.0.1" || url.hostname === "localhost")) return true;
    if (url.protocol !== "https:") return false;
    return url.hostname === "vibeusage.c0vibe.app"
      || url.hostname === "vibetracker-betterdigital.netlify.app"
      || /^[a-f0-9]+--vibetracker-betterdigital\.netlify\.app$/.test(url.hostname);
  } catch {
    return false;
  }
}

function requestOrigin(req: IncomingMessage): string | undefined {
  return typeof req.headers.origin === "string" ? req.headers.origin : undefined;
}

function originAllowed(origin: string | undefined, pathname: string): boolean {
  if (!origin) return true;
  if (isDashboardOrigin(origin)) return true;
  // the extension talks to /capture, /connect, /sync, /sources (board state), and the /health
  // liveness probe from its chrome-extension:// origin (the popup banner + board need them)
  return (pathname === "/capture" || pathname === "/connect" || pathname === "/sync" || pathname === "/health" || pathname === "/sources")
    && origin.startsWith("chrome-extension://");
}

// Validate a /connect body: known provider, and only its allowlisted fields, each a non-empty
// string of sane length. Returns the sanitized creds or an error reason — never logs a value.
function validateConnect(body: unknown): { provider: string; fields: Record<string, string> } | { error: string } {
  if (!body || typeof body !== "object") return { error: "invalid body" };
  const provider = (body as { provider?: unknown }).provider;
  if (typeof provider !== "string" || !CONNECTABLE_PROVIDERS[provider]) return { error: "unknown or non-connectable provider" };
  const allowed = CONNECTABLE_PROVIDERS[provider];
  const raw = (body as { fields?: unknown }).fields;
  if (!raw || typeof raw !== "object") return { error: "missing fields" };
  const fields: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!allowed.includes(key)) return { error: `field not allowed for ${provider}: ${key}` };
    if (typeof value !== "string" || !value.trim() || value.length > 8192) return { error: `invalid value for ${key}` };
    fields[key] = value.trim();
  }
  if (!Object.keys(fields).length) return { error: "no credential fields supplied" };
  return { provider, fields };
}

function corsHeaders(req: IncomingMessage, pathname: string): Record<string, string> {
  const origin = requestOrigin(req);
  if (!origin || !originAllowed(origin, pathname)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "authorization,content-type",
    "access-control-allow-private-network": "true",
    vary: "Origin, Access-Control-Request-Private-Network",
  };
}

function json(req: IncomingMessage, res: ServerResponse, status: number, payload: unknown, pathname: string): void {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...corsHeaders(req, pathname),
  });
  res.end(status === 204 ? undefined : JSON.stringify(payload, null, 2));
}

function bearerMatches(req: IncomingMessage, token: string): boolean {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return false;
  const supplied = Buffer.from(header.slice(7));
  const expected = Buffer.from(token);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function providerFromUrl(url?: string): string {
  let host = "";
  try {
    host = url ? new URL(url).hostname.replace(/^www\./, "") : "";
  } catch (err) {
    void err;
    host = "";
  }
  if (/chatgpt|openai/.test(host)) return "openai-web";
  if (/claude\.ai/.test(host)) return "claude-web";
  if (/perplexity/.test(host)) return "perplexity-web";
  if (/poe\.com/.test(host)) return "poe-web";
  if (/midjourney/.test(host)) return "midjourney";
  if (/canva/.test(host)) return "canva";
  return host.split(".")[0] || "browser";
}

export function captureEventToRecord(event: BrowserCaptureEvent): NormalizedRecord {
  const provider = event.provider || providerFromUrl(event.url);
  const category = event.category || "llm";
  const host = providerFromUrl(event.url);
  return {
    ts: event.ts ? new Date(event.ts).toISOString() : new Date().toISOString(),
    provider,
    category,
    operation: event.operation || "browser_capture",
    ...(event.model ? { model: event.model } : {}),
    quantity: event.quantity ?? 1,
    unit: event.unit ?? "request",
    rawAmount: event.rawAmount ?? event.quantity ?? 1,
    rawUnit: event.rawUnit ?? event.unit ?? "request",
    ...(Number.isFinite(event.usdEst) ? { usdEst: event.usdEst } : {}),
    source: "manual",
    confidence: "low",
    verified: false,
    sessionId: host ? `browser:${host}` : "browser",
  };
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => { body += chunk; if (body.length > 1_000_000) req.destroy(new Error("body too large")); });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

export async function startLocalApiServer(opts: StartLocalApiOptions): Promise<LocalApiSession> {
  const token = opts.token ?? randomBytes(24).toString("base64url");
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "127.0.0.1"}`);
    const origin = requestOrigin(req);

    if (!originAllowed(origin, url.pathname)) {
      json(req, res, 403, { error: "origin not allowed" }, url.pathname);
      return;
    }
    if (req.method === "OPTIONS") {
      json(req, res, 204, {}, url.pathname);
      return;
    }

    // /health is a token-free liveness ping (returns no data) so the extension popup can show
    // "app running" without holding the session token; writes still need the extension origin.
    // /sources is equally token-free but boolean-only (which providers have data — no counts,
    // no values) and originAllowed already restricts it to extension/dashboard origins.
    const healthPing = req.method === "GET" && (url.pathname === "/health" || url.pathname === "/sources");
    const extensionWrite = (url.pathname === "/capture" || url.pathname === "/connect" || url.pathname === "/sync")
      && origin?.startsWith("chrome-extension://");
    if (!healthPing && !extensionWrite && !bearerMatches(req, token)) {
      json(req, res, 401, { error: "session token required" }, url.pathname);
      return;
    }

    try {
      if (req.method === "GET" && url.pathname === "/health") {
        json(req, res, 200, { ok: true, service: "vibetracker-api" }, url.pathname);
        return;
      }
      if (req.method === "GET" && url.pathname === "/sources") {
        json(req, res, 200, {
          sources: opts.deps.sourceStatus ? opts.deps.sourceStatus() : {},
          profile: opts.deps.profile ? opts.deps.profile() : null,
        }, url.pathname);
        return;
      }
      // "Sync now" from the extension — runs the same adapter pass as `vibetracker sync`.
      if (req.method === "POST" && url.pathname === "/sync") {
        if (!opts.deps.runSync) { json(req, res, 501, { error: "sync not available in this session" }, url.pathname); return; }
        const result = await opts.deps.runSync();
        json(req, res, 200, { ok: true, ...result }, url.pathname);
        return;
      }
      if (req.method === "GET" && url.pathname === "/records") {
        json(req, res, 200, { records: opts.deps.readRecords() }, url.pathname);
        return;
      }
      if (req.method === "GET" && url.pathname === "/stats") {
        json(req, res, 200, computeStats(opts.deps.readRecords()), url.pathname);
        return;
      }
      if (req.method === "GET" && url.pathname === "/insights") {
        json(req, res, 200, computeUsageInsights(opts.deps.readRecords()), url.pathname);
        return;
      }
      if (req.method === "POST" && url.pathname === "/capture") {
        const payload = JSON.parse(await readBody(req)) as BrowserCaptureEvent;
        const { accepted, rejected } = ingestRecords([captureEventToRecord(payload)], { untrustedSource: true });
        if (accepted.length) {
          // snapshot (lifetime/balance) → replace the prior value for this provider+operation so
          // re-reading never double-counts; everything else appends
          if (payload.snapshot && opts.deps.replaceSnapshot) {
            for (const record of accepted) opts.deps.replaceSnapshot(record);
          } else {
            opts.deps.appendRecords(accepted);
          }
        }
        json(req, res, rejected.length ? 400 : 200, { accepted: accepted.length, rejected, snapshot: Boolean(payload.snapshot) }, url.pathname);
        return;
      }
      if (req.method === "POST" && url.pathname === "/connect") {
        if (!opts.deps.connectProvider) {
          json(req, res, 501, { error: "connect not enabled on this local API" }, url.pathname);
          return;
        }
        const validated = validateConnect(JSON.parse(await readBody(req)));
        if ("error" in validated) {
          // log the REASON only — never the body/value
          opts.deps.log(`[vibetracker-api] /connect rejected: ${validated.error}`);
          json(req, res, 400, { error: validated.error }, url.pathname);
          return;
        }
        // connectProvider may be async: cynaps3 redeems the handed-over Clerk token for rotating
        // OAuth credentials INSIDE this request (the token lives ~60s). Redemption failures get a
        // friendly 502 with a value-free message instead of the generic 500.
        let result: { stored: string[]; keyring: boolean };
        try {
          result = await opts.deps.connectProvider(validated.provider, validated.fields);
        } catch (connectErr) {
          const reason = (connectErr instanceof Error ? connectErr.message : "connect failed").slice(0, 200);
          opts.deps.log(`[vibetracker-api] /connect ${validated.provider} failed: ${reason}`);
          json(req, res, 502, { error: reason }, url.pathname);
          return;
        }
        opts.deps.log(`[vibetracker-api] connected ${validated.provider} — ${result.stored.length} secret(s) → ${result.keyring ? "keyring" : "config (mode 600)"}`);
        json(req, res, 200, { ok: true, provider: validated.provider, stored: result.stored, keyring: result.keyring }, url.pathname);
        return;
      }
      json(req, res, 404, { error: "not found" }, url.pathname);
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown local API error";
      opts.deps.log(`[vibetracker-api] ${req.method ?? "UNKNOWN"} ${url.pathname} failed: ${message}`);
      json(req, res, 500, { error: "local API request failed" }, url.pathname);
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(opts.port, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  const port = typeof address === "object" && address ? address.port : opts.port;
  const dashboardOrigin = opts.dashboardOrigin ?? DEFAULT_DASHBOARD_ORIGIN;
  const dashboardUrl = `${dashboardOrigin}/life#local=${encodeURIComponent(token)}&port=${port}`;
  opts.deps.log(`VibeTRACKER local API listening on http://127.0.0.1:${port}`);
  opts.deps.log(`Private dashboard: ${dashboardUrl}`);
  opts.deps.log("The session token stays in the URL fragment and is stripped after connection.");
  opts.deps.log("Endpoints: /health /records /stats /insights POST /capture");

  return { server, token, dashboardUrl, port };
}
