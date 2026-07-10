// The contract every provider adapter implements. One adapter per provider;
// the core handles storage, aggregation, and output.

import type { NormalizedRecord, Category } from "./schema/record.js";

export type AuthKind = "apiKey" | "oauth" | "cookie" | "mcp" | "localLogs" | "none";

export interface AuthSpec {
  kind: AuthKind;
  /** Human hint shown by `vibetracker connect`, e.g. "read-only API key". */
  hint?: string;
  /** True when the platform supports server-side authoritative fetch (→ verified data). */
  serverVerifiable?: boolean;
}

export interface DateRange {
  from: string; // ISO8601 inclusive
  to: string;   // ISO8601 inclusive
}

export interface Balance {
  rawAmount: number;
  rawUnit: string;   // "credits" | "characters" | "usd"
  usdEst?: number;
  fetchedAt: string; // ISO8601
}

/** Runtime context handed to every adapter call (creds resolver, telemetry, logger). */
export interface AdapterCtx {
  getSecret(key: string): Promise<string | undefined>;
  telemetry: import("./telemetry/index.js").Telemetry;
}

export interface Adapter {
  id: string;                 // "higgsfield"
  categories: Category[];
  auth: AuthSpec;
  capabilities: { ledger: boolean; balance: boolean; feed: boolean };
  getUsage(range: DateRange, ctx: AdapterCtx): Promise<NormalizedRecord[]>;
  getBalance?(ctx: AdapterCtx): Promise<Balance>;
}
