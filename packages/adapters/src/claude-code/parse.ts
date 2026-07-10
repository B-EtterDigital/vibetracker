// Parse Claude Code JSONL logs (~/.claude/projects/**/*.jsonl) into usage entries.
// Pure over a single line; a directory walker sits in index.ts. Log-parse tier.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

export interface ClaudeUsageEntry {
  ts: string;
  model: string;
  input: number;
  output: number;
  cacheWrite: number;
  cacheRead: number;
  dedupeKey: string | null;
}

export function parseLine(line: string): ClaudeUsageEntry | null {
  let o: any;
  try {
    o = JSON.parse(line);
  } catch {
    return null; // truncated/partial line during a live write — expected, skip
  }
  if (o?.type !== "assistant") return null;
  const u = o?.message?.usage;
  const model = o?.message?.model;
  if (!u || !model || model === "<synthetic>") return null; // synthetic = no real spend
  const input = u.input_tokens ?? 0;
  const output = u.output_tokens ?? 0;
  const cacheWrite = u.cache_creation_input_tokens ?? 0;
  const cacheRead = u.cache_read_input_tokens ?? 0;
  if (input + output + cacheWrite + cacheRead === 0) return null;
  const id = o?.message?.id ?? o?.uuid;
  const req = o?.requestId ?? "";
  return {
    ts: o.timestamp ?? o.ts ?? "",
    model, input, output, cacheWrite, cacheRead,
    dedupeKey: id ? `${id}:${req}` : null,
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

export interface CollectOpts { maxFiles?: number; }

/** Walk a Claude projects dir, parse every assistant-usage line, dedupe. */
export function collectEntries(dir: string, opts: CollectOpts = {}): ClaudeUsageEntry[] {
  const files = walkJsonl(dir, [], opts.maxFiles ?? Infinity);
  const seen = new Set<string>();
  const out: ClaudeUsageEntry[] = [];
  for (const file of files) {
    let text: string;
    try { text = readFileSync(file, "utf8"); } catch { continue; }
    for (const line of text.split("\n")) {
      if (!line.trim()) continue;
      const e = parseLine(line);
      if (!e) continue;
      if (e.dedupeKey) { if (seen.has(e.dedupeKey)) continue; seen.add(e.dedupeKey); }
      out.push(e);
    }
  }
  return out;
}
