// The one normalized record every adapter emits, regardless of provider.
// Native units are the source of truth; usdEst is always a labelled estimate.

export type Category =
  | "llm" | "coding" | "image" | "video" | "music" | "audio" | "3d" | "other";

export type Unit =
  | "token" | "image" | "clip" | "second" | "character" | "credit" | "request";

/** How the record was obtained — drives the trust/confidence UI. */
export type Source =
  | "ledger"        // real per-op transaction history (best)
  | "balance_delta" // inferred from balance snapshots over time
  | "log"           // parsed from local logs (e.g. Claude Code JSONL)
  | "feed_recon"    // reconstructed: generation feed × known credits/op
  | "proxy"         // captured by intercepting an MCP/CLI/HTTP call
  | "local"         // local model runner (Ollama/LM Studio/ComfyUI) — cost $0 or GPU-time
  | "manual";       // user-entered

export type Confidence = "high" | "medium" | "low";

export interface NormalizedRecord {
  ts: string;            // ISO8601 — when the usage happened
  provider: string;      // adapter id, e.g. "higgsfield"
  category: Category;
  operation: string;     // provider-native op, e.g. "generate_video"
  model?: string;        // model / preset if known
  quantity: number;      // count of units
  unit: Unit;
  rawAmount: number;     // native cost (credits / tokens / seconds)
  rawUnit: string;       // "credits" | "tokens" | ...
  usdEst?: number;       // derived, best-effort — NEVER the source of truth
  source: Source;
  confidence: Confidence;
  verified: boolean;     // set true only when the backend fetched it authoritatively
  accountId?: string;
  profileId?: string;
  teamId?: string;
  sessionId?: string;
}
