// Shared log-parse tier for coding agents & IDE plugins (Antigravity, Augment, Roo Code,
// OpenCode, Cline, …). Each supplies a directory + a per-line parser; this walks the logs,
// extracts token usage, and yields NormalizedRecords. Mirrors the proven Claude Code adapter.

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import type { Adapter, AdapterCtx, DateRange } from "../../../core/src/adapter.ts";
import type { NormalizedRecord, Category } from "../../../core/src/schema/record.ts";

export interface SessionLogEntry {
  ts: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  cacheTokens?: number;
  usd?: number;
}
export type ParseEntry = (raw: string) => SessionLogEntry | null;

export function collectSessionEntries(dir: string, parse: ParseEntry, opts: { maxFiles?: number } = {}): SessionLogEntry[] {
  const files: string[] = [];
  const walk = (d: string) => {
    let names: string[];
    try { names = readdirSync(d); } catch { return; }
    for (const n of names) {
      if (files.length >= (opts.maxFiles ?? Infinity)) break;
      const full = join(d, n);
      let s;
      try { s = statSync(full); } catch { continue; }
      if (s.isDirectory()) walk(full);
      else if (extname(n) === ".jsonl" || extname(n) === ".json") files.push(full);
    }
  };
  if (existsSync(dir)) walk(dir);

  const out: SessionLogEntry[] = [];
  for (const f of files) {
    let text: string;
    try { text = readFileSync(f, "utf8"); } catch { continue; }
    if (extname(f) === ".json") {
      let parsed: unknown;
      try { parsed = JSON.parse(text); } catch { continue; }
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) { const e = parse(JSON.stringify(item)); if (e) out.push(e); }
    } else {
      for (const line of text.split("\n")) { if (!line.trim()) continue; const e = parse(line); if (e) out.push(e); }
    }
  }
  return out;
}

export function entriesToRecords(entries: SessionLogEntry[], provider: string, category: Category): NormalizedRecord[] {
  const out: NormalizedRecord[] = [];
  for (const e of entries) {
    const total = (e.inputTokens ?? 0) + (e.outputTokens ?? 0) + (e.cacheTokens ?? 0);
    if (total <= 0 || !e.ts) continue;
    const rec: NormalizedRecord = {
      ts: e.ts, provider, category, operation: "message", model: e.model,
      quantity: 1, unit: "token", rawAmount: total, rawUnit: "tokens",
      source: "log", confidence: "high", verified: false,
    };
    if (e.usd != null) rec.usdEst = e.usd;
    out.push(rec);
  }
  return out;
}

export function createSessionLogAdapter(cfg: {
  id: string; dir: string; parse: ParseEntry; categories?: Category[]; maxFiles?: number;
}): Adapter {
  return {
    id: cfg.id,
    categories: cfg.categories ?? ["coding"],
    auth: { kind: "localLogs", hint: `local session logs (${cfg.dir})`, serverVerifiable: false },
    capabilities: { ledger: false, balance: false, feed: false },
    async getUsage(range: DateRange, ctx: AdapterCtx): Promise<NormalizedRecord[]> {
      let entries;
      try { entries = collectSessionEntries(cfg.dir, cfg.parse, { maxFiles: cfg.maxFiles }); }
      catch (err) { ctx.telemetry.captureError(err, { area: `adapter.${cfg.id}.collect`, severity: "error" }); throw err; }
      const fromT = Date.parse(range.from);
      const toT = Date.parse(range.to);
      const recs = entriesToRecords(entries, cfg.id, (cfg.categories?.[0] ?? "coding")).filter((r) => {
        const t = Date.parse(r.ts); return t >= fromT && t <= toT;
      });
      ctx.telemetry.addBreadcrumb(`adapter.${cfg.id}.collected`, { entries: entries.length, kept: recs.length });
      return recs;
    },
  };
}
