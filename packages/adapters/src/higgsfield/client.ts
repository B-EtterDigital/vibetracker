// Higgsfield data-source seam. The adapter talks to this interface, so the real
// transport (CLI JSON or MCP-over-HTTP) is swappable and testable with fixtures.
// Shapes verified against the live Higgsfield CLI (`account status`/`account transactions`).
//   status  -> { email, credits, subscription_plan_type }
//   txns    -> raw JSON ARRAY of { display_name, credits (neg=spend), action, created_at }

import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface HiggsfieldTx {
  display_name: string;               // "Nano Banana Pro"
  credits: number;                    // negative for spend/deduct, positive for grant/refund
  action: "spend" | "deduct" | "refund" | "grant" | (string & {});
  created_at: string;                 // ISO8601
}

export interface HiggsfieldBalance {
  credits: number;
  subscription_plan_type: string;     // "ultra" | "plus" | ...
}

export interface HiggsfieldPage {
  items: HiggsfieldTx[];
  next_cursor: number | null;
}

export interface HiggsfieldClient {
  balance(): Promise<HiggsfieldBalance>;
  transactions(args: { cursor?: number; size?: number }): Promise<HiggsfieldPage>;
}

export type HiggsfieldCliRunner = (args: string[]) => Promise<string>;

export interface HiggsfieldCliClientOpts {
  /** CLI executable name/path. Defaults to the installed `higgsfield` command. */
  command?: string;
  /** Test seam. Receives CLI args, returns stdout. */
  run?: HiggsfieldCliRunner;
}

export interface HiggsfieldMcpClientOpts {
  /** Streamable-HTTP MCP endpoint. Defaults to Higgsfield's hosted MCP. */
  endpoint?: string;
  /** Bearer token. When omitted, read from `credentialsPath`. */
  accessToken?: string;
  /** Path to the CLI credentials JSON ({ access_token }). Defaults to ~/.config/higgsfield/credentials.json. */
  credentialsPath?: string;
  /** Inject a fetch implementation (tests / non-global runtimes). Defaults to global fetch. */
  fetchImpl?: typeof fetch;
}

/** Default hosted Higgsfield MCP endpoint (Streamable-HTTP). */
export const HIGGSFIELD_MCP_ENDPOINT = "https://mcp.higgsfield.ai/mcp";
/** Default location of the Higgsfield CLI credentials written by `higgsfield login`. */
export const HIGGSFIELD_CREDENTIALS_PATH = "~/.config/higgsfield/credentials.json";
const MCP_PROTOCOL_VERSION = "2025-06-18";
const MCP_CLIENT_INFO = { name: "vibetracker", version: "0.1.0" } as const;

/** Deterministic, offline client backed by a captured page — used by tests and `--demo`. */
export function createFixtureClient(page: HiggsfieldPage, balance: HiggsfieldBalance): HiggsfieldClient {
  return {
    async balance() { return balance; },
    async transactions() {
      // one page then stop, so the adapter's pagination loop terminates
      return { items: page.items, next_cursor: null };
    },
  };
}

// ── shared parsing helpers ────────────────────────────────────────────────────

function parseJson<T>(raw: string, area: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    throw new Error(`Higgsfield returned invalid JSON for ${area}: ${(err as Error).message}`);
  }
}

/** Non-throwing JSON.parse for control flow (SSE frames, tool text parts). */
function tryParseJson(text: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

function finiteNumber(value: unknown, field: string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`Higgsfield response missing numeric ${field}`);
  return n;
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function safeStringify(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value) ?? String(value);
  } catch (err) {
    return `<unstringifiable: ${(err as Error).message}>`;
  }
}

function normalizeTx(raw: Record<string, unknown>): HiggsfieldTx {
  return {
    display_name: cleanString(raw.display_name ?? raw.displayName ?? raw.model ?? raw.name),
    credits: finiteNumber(raw.credits, "transaction.credits"),
    action: cleanString(raw.action) || "spend",
    created_at: cleanString(raw.created_at ?? raw.createdAt ?? raw.timestamp),
  };
}

/** Pull the transaction array out of a raw array or a defensive `{items|transactions|...}` envelope. */
function extractTxArray(payload: unknown, area: string): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    for (const key of ["items", "transactions", "results", "data"]) {
      if (Array.isArray(obj[key])) return obj[key] as Record<string, unknown>[];
    }
  }
  // Fail loudly: never silently return an empty page for an unrecognized shape.
  throw new Error(`Higgsfield ${area}: expected a transactions array, got ${safeStringify(payload).slice(0, 300)}`);
}

/** Map a transactions payload to a page. next_cursor walks the ledger by offset (cursor + size). */
function toPage(payload: unknown, cursor: number, size: number, area: string): HiggsfieldPage {
  const items = extractTxArray(payload, area).map(normalizeTx);
  const next_cursor = items.length >= size ? cursor + size : null;
  return { items, next_cursor };
}

/** Map a status/balance payload to HiggsfieldBalance, tolerating a one-level wrapper. */
function toBalance(payload: unknown, area: string): HiggsfieldBalance {
  const obj = findBalanceObject(payload);
  if (!obj) {
    throw new Error(`Higgsfield ${area}: no 'credits' field in payload: ${safeStringify(payload).slice(0, 300)}`);
  }
  return {
    credits: finiteNumber(obj.credits, "credits"),
    subscription_plan_type: cleanString(
      obj.subscription_plan_type ?? obj.subscriptionPlanType ?? obj.plan ?? obj.plan_type,
    ),
  };
}

function findBalanceObject(payload: unknown): Record<string, unknown> | null {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const obj = payload as Record<string, unknown>;
    if ("credits" in obj) return obj;
    for (const key of ["result", "data", "balance", "output"]) {
      const inner = obj[key];
      if (inner && typeof inner === "object" && !Array.isArray(inner) && "credits" in (inner as Record<string, unknown>)) {
        return inner as Record<string, unknown>;
      }
    }
  }
  return null;
}

// ── CLI transport (default) ───────────────────────────────────────────────────

function runHiggsfieldCli(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", (err) => {
      reject(new Error(`Higgsfield CLI failed to start (${command}): ${err.message}. Is @higgsfield/cli installed and on PATH?`));
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }
      const detail = (stderr || stdout || `exit ${code}`).replace(/\s+/g, " ").trim();
      reject(new Error(`Higgsfield CLI exited ${code}: ${detail.slice(0, 300)} (run \`higgsfield login\` if unauthenticated)`));
    });
  });
}

/**
 * Real CLI-backed client — the DEFAULT transport. Uses the user's authenticated
 * Higgsfield CLI session (`@higgsfield/cli`, binary `higgsfield`). Fails loudly when
 * the CLI is missing/unauthenticated; the adapter routes that to VTRS telemetry.
 */
export function createCliClient(opts: HiggsfieldCliClientOpts = {}): HiggsfieldClient {
  const command = opts.command ?? "higgsfield";
  const run = opts.run ?? ((args: string[]) => runHiggsfieldCli(command, args));
  return {
    async balance() {
      const raw = await run(["account", "status", "--json"]);
      return toBalance(parseJson<unknown>(raw, "account status"), "account status");
    },
    async transactions({ cursor, size = 100 }) {
      const c = cursor ?? 0;
      // Offset pagination: the CLI prints the page as a raw array and has no next_cursor.
      const args = ["account", "transactions", "--json", "--size", String(size), "--cursor", String(c)];
      const raw = await run(args);
      return toPage(parseJson<unknown>(raw, "account transactions"), c, size, "account transactions");
    },
  };
}

// ── MCP transport (Streamable-HTTP) ───────────────────────────────────────────

function expandHome(p: string): string {
  if (p === "~") return homedir();
  if (p.startsWith("~/") || p.startsWith("~\\")) return join(homedir(), p.slice(2));
  return p;
}

function resolveMcpToken(opts: HiggsfieldMcpClientOpts): string {
  const direct = opts.accessToken?.trim();
  if (direct) return direct;

  const path = expandHome(opts.credentialsPath ?? HIGGSFIELD_CREDENTIALS_PATH);
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch (err) {
    throw new Error(
      `Higgsfield MCP: no access token supplied and cannot read credentials at ${path}: ${(err as Error).message}. ` +
        "Pass { accessToken } or run `higgsfield login`.",
    );
  }
  const creds = parseJson<Record<string, unknown>>(raw, `credentials (${path})`);
  const token = typeof creds.access_token === "string" ? creds.access_token.trim() : "";
  if (!token) throw new Error(`Higgsfield MCP: missing 'access_token' in credentials at ${path}`);
  return token;
}

async function readBody(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch (err) {
    return `<unreadable body: ${(err as Error).message}>`;
  }
}

/** Parse a JSON-RPC message from either an application/json body or an SSE text/event-stream body. */
function parseRpcBody(rawBody: string, contentType: string): unknown {
  const ct = contentType.toLowerCase();
  if (ct.includes("text/event-stream") || (!ct.includes("application/json") && /^\s*(event|data):/m.test(rawBody))) {
    return parseSse(rawBody);
  }
  const parsed = tryParseJson(rawBody);
  if (!parsed.ok) {
    throw new Error(`Higgsfield MCP: response was not JSON (content-type ${contentType || "unknown"}). Raw body: ${rawBody.slice(0, 500)}`);
  }
  return parsed.value;
}

/** Extract the JSON-RPC message from an SSE stream — prefer the frame carrying result/error. */
function parseSse(rawBody: string): unknown {
  const frames = rawBody.split(/\r?\n\r?\n/);
  let last: unknown;
  let found = false;
  for (const frame of frames) {
    const dataLines: string[] = [];
    for (const line of frame.split(/\r?\n/)) {
      const m = /^data:\s?(.*)$/.exec(line);
      if (m) dataLines.push(m[1]);
    }
    if (dataLines.length === 0) continue;
    const blob = dataLines.join("\n").trim();
    if (!blob || blob === "[DONE]") continue;
    const parsed = tryParseJson(blob);
    if (!parsed.ok) continue;
    last = parsed.value;
    found = true;
    if (parsed.value && typeof parsed.value === "object" && ("result" in parsed.value || "error" in parsed.value)) {
      return parsed.value; // the JSON-RPC response frame
    }
  }
  if (!found) {
    throw new Error(`Higgsfield MCP: no JSON data frame in SSE stream. Raw body: ${rawBody.slice(0, 500)}`);
  }
  return last;
}

/** Pull the tool's real payload out of an MCP tool result (structuredContent or content[].text JSON). */
function extractToolPayload(result: unknown, tool: string): unknown {
  if (result && typeof result === "object") {
    const r = result as Record<string, unknown>;
    if (r.structuredContent != null) return r.structuredContent;
    if (Array.isArray(r.content)) {
      for (const part of r.content) {
        if (part && typeof part === "object") {
          const p = part as Record<string, unknown>;
          if (p.type === "text" && typeof p.text === "string") {
            const parsed = tryParseJson(p.text);
            if (parsed.ok) return parsed.value;
          }
        }
      }
    }
  }
  // Fail loudly with the raw result rather than silently returning empty.
  throw new Error(`Higgsfield MCP ${tool}: could not extract a JSON payload from tool result: ${safeStringify(result).slice(0, 600)}`);
}

/**
 * Real MCP transport over Streamable-HTTP. Speaks minimal JSON-RPC 2.0: `initialize`
 * (+ initialized notification), then `tools/call` for `transactions` / `balance`.
 * Handles application/json and SSE responses, keeps the server's Mcp-Session-Id.
 */
export function createMcpClient(opts: HiggsfieldMcpClientOpts = {}): HiggsfieldClient {
  const endpoint = opts.endpoint ?? HIGGSFIELD_MCP_ENDPOINT;
  const doFetch = opts.fetchImpl ?? fetch;
  if (typeof doFetch !== "function") {
    throw new Error("Higgsfield MCP: global fetch unavailable — pass createMcpClient({ fetchImpl }).");
  }

  let token: string | null = null;
  const getToken = (): string => (token ??= resolveMcpToken(opts));

  let sessionId: string | null = null;
  let rpcId = 0;
  let initPromise: Promise<void> | null = null;

  async function rpc(method: string, params: unknown, expectResult: boolean): Promise<unknown> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    };
    if (sessionId) headers["Mcp-Session-Id"] = sessionId;

    const message = expectResult
      ? { jsonrpc: "2.0", id: ++rpcId, method, params }
      : { jsonrpc: "2.0", method, params }; // notification: no id, no response expected

    const res = await doFetch(endpoint, { method: "POST", headers, body: JSON.stringify(message) });

    const sid = res.headers.get("Mcp-Session-Id");
    if (sid) sessionId = sid;

    if (!res.ok) {
      const detail = await readBody(res);
      throw new Error(`Higgsfield MCP ${method} failed: ${res.status} ${res.statusText} — ${detail.slice(0, 500)}`);
    }

    if (!expectResult) {
      await readBody(res); // drain; notifications carry no JSON-RPC result
      return undefined;
    }

    const rawBody = await res.text();
    const parsed = parseRpcBody(rawBody, res.headers.get("content-type") ?? "");
    if (parsed && typeof parsed === "object" && "error" in parsed && (parsed as Record<string, unknown>).error) {
      const e = (parsed as Record<string, unknown>).error as Record<string, unknown>;
      throw new Error(`Higgsfield MCP ${method} error ${cleanString(e.code) || String(e.code ?? "")}: ${cleanString(e.message) || safeStringify(e)}`);
    }
    return (parsed as Record<string, unknown> | null)?.result;
  }

  function ensureInitialized(): Promise<void> {
    if (!initPromise) {
      initPromise = (async () => {
        await rpc("initialize", {
          protocolVersion: MCP_PROTOCOL_VERSION,
          capabilities: {},
          clientInfo: MCP_CLIENT_INFO,
        }, true);
        await rpc("notifications/initialized", {}, false);
      })().catch((err) => {
        initPromise = null; // allow a retry on the next call; surface the failure now
        throw err;
      });
    }
    return initPromise;
  }

  async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    await ensureInitialized();
    const result = await rpc("tools/call", { name, arguments: args }, true);
    return extractToolPayload(result, name);
  }

  return {
    async balance() {
      return toBalance(await callTool("balance", {}), "MCP balance");
    },
    async transactions({ cursor, size = 100 }) {
      const c = cursor ?? 0;
      return toPage(await callTool("transactions", { cursor: c, size }), c, size, "MCP transactions");
    },
  };
}
