// Parse Codex CLI session logs (~/.codex/sessions/**/*.jsonl) into usage entries.
// One JSONL file = one coding session; the pure parse works over a file's whole
// text, and a directory walker sits below. Log-parse tier.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

export interface CodexUsageEntry {
  ts: string;
  model: string;
  nonCachedInput: number; // input_tokens - cached_input_tokens (never negative)
  cachedInput: number;    // cached_input_tokens
  output: number;         // output_tokens (already includes reasoning_output_tokens)
  totalTokens: number;    // cumulative total_tokens for the whole session
}

interface TokenUsage {
  input_tokens?: number;
  cached_input_tokens?: number;
  output_tokens?: number;
  reasoning_output_tokens?: number;
  total_tokens?: number;
}

/**
 * Parse one session file's full text into a single usage entry.
 *   MODEL   — last `turn_context` payload.model (model can change mid-session; last wins).
 *   TOKENS  — last `event_msg`/`token_count` with a populated `info.total_token_usage`
 *             (cumulative per session; early events carry `info: null`).
 *   TS      — last line `timestamp`; if none, `fallbackTs` (derived from the file path).
 * Returns null when there is no turn_context model, no populated token usage, or
 * zero total tokens — those sessions carry no real spend and are skipped.
 */
export function parseSession(text: string, fallbackTs = ""): CodexUsageEntry | null {
  let model: string | null = null;
  let usage: TokenUsage | null = null;
  let ts = "";
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    let o: any;
    try {
      o = JSON.parse(line);
    } catch {
      continue; // truncated/partial line during a live write — expected, skip
    }
    if (typeof o?.timestamp === "string") ts = o.timestamp;
    if (o?.type === "turn_context") {
      const m = o?.payload?.model;
      if (typeof m === "string" && m) model = m; // last turn_context wins
    } else if (o?.type === "event_msg" && o?.payload?.type === "token_count") {
      const info = o?.payload?.info;
      if (info && info.total_token_usage) usage = info.total_token_usage; // last populated wins
    }
  }
  if (!model || !usage) return null; // no model or never a populated token_count — skip
  const input = usage.input_tokens ?? 0;
  const cachedInput = usage.cached_input_tokens ?? 0;
  const output = usage.output_tokens ?? 0;
  const totalTokens = usage.total_tokens ?? 0;
  if (totalTokens === 0) return null; // zero-token session — no real spend, skip
  return {
    ts: ts || fallbackTs,
    model,
    nonCachedInput: Math.max(0, input - cachedInput),
    cachedInput,
    output,
    totalTokens,
  };
}

function walkJsonl(dir: string, out: string[] = [], maxFiles = Infinity): string[] {
  let entries: string[];
  try { entries = readdirSync(dir); } catch { return out; }
  for (const name of entries) {
    if (out.length >= maxFiles) break;
    const full = join(dir, name);
    let s;
    try { s = statSync(full); } catch { continue; }
    if (s.isDirectory()) walkJsonl(full, out, maxFiles);
    else if (extname(name) === ".jsonl") out.push(full);
  }
  return out;
}

/** ISO-midnight ts derived from a …/sessions/YYYY/MM/DD/… path, else "". */
function dateFromPath(file: string): string {
  const m = file.match(/(?:^|[\\/])(\d{4})[\\/](\d{2})[\\/](\d{2})[\\/]/);
  return m ? `${m[1]}-${m[2]}-${m[3]}T00:00:00.000Z` : "";
}

export interface CollectOpts { maxFiles?: number; }

/** Walk a Codex sessions dir; one entry per session file that carries real usage. */
export function collectEntries(dir: string, opts: CollectOpts = {}): CodexUsageEntry[] {
  const files = walkJsonl(dir, [], opts.maxFiles ?? Infinity);
  const out: CodexUsageEntry[] = [];
  for (const file of files) {
    let text: string;
    try { text = readFileSync(file, "utf8"); } catch { continue; }
    const e = parseSession(text, dateFromPath(file));
    if (e) out.push(e);
  }
  return out;
}
