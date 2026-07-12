// Codex adapter — log-parse tier. Reads local Codex CLI session JSONL, no network/auth.
// One ~/.codex/sessions/**/*.jsonl file = one coding session with cumulative token usage.
// Mirrors the Claude Code adapter against a different local data source.

import type { Adapter, AdapterCtx, DateRange } from "../../../core/src/adapter.ts";
import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import { homedir } from "node:os";
import { join } from "node:path";
import { collectEntries } from "./parse.ts";
import { toRecords } from "./normalize.ts";

export interface CodexAdapterOpts {
  logDir?: string;   // default ~/.codex/sessions
  maxFiles?: number; // cap for quick scans
}

export function createCodexAdapter(opts: CodexAdapterOpts = {}): Adapter {
  const dir = opts.logDir ?? join(homedir(), ".codex", "sessions");
  return {
    id: "codex",
    categories: ["coding"],
    auth: { kind: "localLogs", hint: "reads ~/.codex/sessions/**/*.jsonl", serverVerifiable: false },
    capabilities: { ledger: false, balance: false, feed: false },

    async getUsage(range: DateRange, ctx: AdapterCtx): Promise<NormalizedRecord[]> {
      const fromT = Date.parse(range.from);
      const toT = Date.parse(range.to);
      let entries;
      try {
        entries = collectEntries(dir, { maxFiles: opts.maxFiles });
      } catch (err) {
        ctx.telemetry.captureError(err, { area: "adapter.codex.collect", severity: "error", dir });
        throw err;
      }
      const recs = toRecords(entries).filter((r) => {
        const t = Date.parse(r.ts);
        return t >= fromT && t <= toT;
      });
      ctx.telemetry.addBreadcrumb("adapter.codex.collected", { sessions: entries.length, kept: recs.length });
      return recs;
    },
  };
}

export { collectEntries, parseSession } from "./parse.ts";
export { toRecords } from "./normalize.ts";
export { priceFor } from "./pricing.ts";
