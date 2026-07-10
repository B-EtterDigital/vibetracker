// Higgsfield data-source seam. The adapter talks to this interface, so the real
// transport (MCP client, CLI JSON, or REST) is swappable and testable with fixtures.
// Shapes verified against Higgsfield account status/transactions JSON.

import { spawn } from "node:child_process";

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
      reject(new Error(`Higgsfield CLI failed to start (${command}): ${err.message}`));
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }
      const detail = (stderr || stdout || `exit ${code}`).replace(/\s+/g, " ").trim();
      reject(new Error(`Higgsfield CLI exited ${code}: ${detail.slice(0, 300)}`));
    });
  });
}

function parseCliJson<T>(raw: string, area: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    throw new Error(`Higgsfield CLI returned invalid JSON for ${area}: ${(err as Error).message}`);
  }
}

function finiteNumber(value: unknown, field: string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`Higgsfield CLI response missing numeric ${field}`);
  return n;
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeTx(raw: Record<string, unknown>): HiggsfieldTx {
  return {
    display_name: cleanString(raw.display_name ?? raw.displayName ?? raw.model ?? raw.name),
    credits: finiteNumber(raw.credits, "transaction.credits"),
    action: cleanString(raw.action) || "spend",
    created_at: cleanString(raw.created_at ?? raw.createdAt ?? raw.timestamp),
  };
}

function toTransactionPage(payload: unknown, cursor: number | undefined, size: number): HiggsfieldPage {
  const obj = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const rawItems = Array.isArray(payload)
    ? payload
    : Array.isArray(obj.items)
      ? obj.items
      : Array.isArray(obj.transactions)
        ? obj.transactions
        : [];
  const items = rawItems.map((item) => normalizeTx(item as Record<string, unknown>));
  const explicitNext = obj.next_cursor ?? obj.nextCursor;
  const next =
    typeof explicitNext === "number" ? explicitNext
    : typeof explicitNext === "string" && explicitNext.trim() ? Number(explicitNext)
    : items.length >= size ? (cursor ?? 0) + items.length
    : null;
  return { items, next_cursor: Number.isFinite(next) ? next : null };
}

/** Real CLI-backed client. Uses the user's authenticated Higgsfield CLI session. */
export function createCliClient(opts: HiggsfieldCliClientOpts = {}): HiggsfieldClient {
  const command = opts.command ?? "higgsfield";
  const run = opts.run ?? ((args: string[]) => runHiggsfieldCli(command, args));
  return {
    async balance() {
      const raw = await run(["account", "status", "--json"]);
      const parsed = parseCliJson<Record<string, unknown>>(raw, "account status");
      return {
        credits: finiteNumber(parsed.credits, "credits"),
        subscription_plan_type: cleanString(parsed.subscription_plan_type ?? parsed.subscriptionPlanType),
      };
    },
    async transactions({ cursor, size = 100 }) {
      const args = ["account", "transactions", "--size", String(size), "--json"];
      if (cursor != null) args.push("--cursor", String(cursor));
      const raw = await run(args);
      return toTransactionPage(parseCliJson<unknown>(raw, "account transactions"), cursor, size);
    },
  };
}

/**
 * Real read client used by the CLI today. Codex can authenticate the Higgsfield MCP,
 * but the published VibeTRACKER CLI cannot call Codex's in-process MCP tool registry.
 * Until a standalone MCP transport is embedded here, use Higgsfield's authenticated
 * JSON CLI commands as the side-effect-free ledger source.
 */
export function createMcpClient(): HiggsfieldClient {
  return createCliClient();
}
