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
}

export interface LocalApiDeps {
  readRecords: () => NormalizedRecord[];
  appendRecords: (records: NormalizedRecord[]) => void;
  log: (line: string) => void;
}

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

const DEFAULT_DASHBOARD_ORIGIN = "https://vibetracker-betterdigital.netlify.app";

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
  return pathname === "/capture" && origin.startsWith("chrome-extension://");
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

    const extensionCapture = url.pathname === "/capture" && origin?.startsWith("chrome-extension://");
    if (!extensionCapture && !bearerMatches(req, token)) {
      json(req, res, 401, { error: "session token required" }, url.pathname);
      return;
    }

    try {
      if (req.method === "GET" && url.pathname === "/health") {
        json(req, res, 200, { ok: true, service: "vibetracker-api" }, url.pathname);
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
        if (accepted.length) opts.deps.appendRecords(accepted);
        json(req, res, rejected.length ? 400 : 200, { accepted: accepted.length, rejected }, url.pathname);
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
