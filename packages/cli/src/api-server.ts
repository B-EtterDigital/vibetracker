import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
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

function json(res: ServerResponse, status: number, payload: unknown): void {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
  });
  res.end(JSON.stringify(payload, null, 2));
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

export function startLocalApiServer(opts: { port: number; deps: LocalApiDeps }): void {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "127.0.0.1"}`);
    if (req.method === "OPTIONS") { json(res, 204, {}); return; }
    if (req.method === "GET" && url.pathname === "/health") { json(res, 200, { ok: true, service: "vibetracker-api" }); return; }
    if (req.method === "GET" && url.pathname === "/records") { json(res, 200, { records: opts.deps.readRecords() }); return; }
    if (req.method === "GET" && url.pathname === "/stats") { json(res, 200, computeStats(opts.deps.readRecords())); return; }
    if (req.method === "GET" && url.pathname === "/insights") { json(res, 200, computeUsageInsights(opts.deps.readRecords())); return; }
    if (req.method === "POST" && url.pathname === "/capture") {
      try {
        const payload = JSON.parse(await readBody(req)) as BrowserCaptureEvent;
        const { accepted, rejected } = ingestRecords([captureEventToRecord(payload)], { untrustedSource: true });
        if (accepted.length) opts.deps.appendRecords(accepted);
        json(res, rejected.length ? 400 : 200, { accepted: accepted.length, rejected });
      } catch (err) {
        json(res, 400, { error: (err as Error).message });
      }
      return;
    }
    json(res, 404, { error: "not found" });
  });
  server.listen(opts.port, "127.0.0.1", () => {
    opts.deps.log(`VibeTRACKER local API listening on http://127.0.0.1:${opts.port}`);
    opts.deps.log("Endpoints: /health /records /stats /insights POST /capture");
  });
}
