// Claude Code adapter — log-parse tier. Reads local session JSONL, no network/auth.
// Proves the core contract against a totally different data source than Higgsfield.

import type { Adapter, AdapterCtx, DateRange } from "../../../core/src/adapter.ts";
import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import { homedir } from "node:os";
import { join } from "node:path";
import { collectEntries } from "./parse.ts";
import { toRecords } from "./normalize.ts";

export interface ClaudeCodeAdapterOpts {
  logDir?: string;   // default ~/.claude/projects
  maxFiles?: number; // cap for quick scans
}

export function createClaudeCodeAdapter(opts: ClaudeCodeAdapterOpts = {}): Adapter {
  const dir = opts.logDir ?? join(homedir(), ".claude", "projects");
  return {
    id: "claude-code",
    categories: ["coding", "llm"],
    auth: { kind: "localLogs", hint: "reads ~/.claude/projects/**/*.jsonl", serverVerifiable: false },
    capabilities: { ledger: false, balance: false, feed: false },

    async getUsage(range: DateRange, ctx: AdapterCtx): Promise<NormalizedRecord[]> {
      const fromT = Date.parse(range.from);
      const toT = Date.parse(range.to);
      let entries;
      try {
        entries = collectEntries(dir, { maxFiles: opts.maxFiles });
      } catch (err) {
        ctx.telemetry.captureError(err, { area: "adapter.claude-code.collect", severity: "error", dir });
        throw err;
      }
      const recs = toRecords(entries).filter((r) => {
        const t = Date.parse(r.ts);
        return t >= fromT && t <= toT;
      });
      ctx.telemetry.addBreadcrumb("adapter.claude-code.collected", { entries: entries.length, kept: recs.length });
      return recs;
    },
  };
}

export { collectEntries, parseLine } from "./parse.ts";
export { toRecords } from "./normalize.ts";
