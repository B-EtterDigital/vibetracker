// Import a ccusage export (`cc.json`) — the all-time daily/model aggregates ccusage keeps
// even after Claude Code prunes the raw session logs. This recovers history the live
// `~/.claude/projects` no longer has. Pure conversion + a small locator.

import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { NormalizedRecord } from "../../core/src/schema/record.ts";

export interface CcModelBreakdown {
  modelName: string;
  inputTokens?: number; outputTokens?: number;
  cacheCreationTokens?: number; cacheReadTokens?: number;
  cost?: number;
}
export interface CcDay {
  period?: string; date?: string;
  modelBreakdowns?: CcModelBreakdown[];
  metadata?: { agents?: string[] };
}
export interface CcJson { daily?: CcDay[]; totals?: Record<string, number>; }

// ccusage rolls several coding agents into one file; map each model to its provider.
export function providerForModel(model: string): { provider: string; model: string } {
  let m = (model ?? "").trim();
  const pref = m.match(/^\[([^\]]+)\]\s*/);
  const agent = pref ? pref[1].toLowerCase() : "";
  if (pref) m = m.slice(pref[0].length);
  if (agent === "openclaw") return { provider: "openclaw", model: m };
  if (agent === "hermes") return { provider: "hermes", model: m };
  if (agent === "codex" || /^(gpt|o[0-9]|codex)/i.test(m)) return { provider: "codex", model: m };
  if (/^gemini/i.test(m)) return { provider: "gemini-cli", model: m };
  return { provider: "claude-code", model: m }; // claude-* and anything else
}

/** Providers this importer owns — replaced wholesale on import to avoid double-counting. */
export const CCUSAGE_PROVIDERS = ["claude-code", "codex", "openclaw", "hermes", "gemini-cli"];

export function ccusageToRecords(cc: CcJson): NormalizedRecord[] {
  const out: NormalizedRecord[] = [];
  for (const day of cc.daily ?? []) {
    const date = day.period ?? day.date;
    if (!date) continue;
    const ts = `${date}T12:00:00.000Z`;
    for (const mb of day.modelBreakdowns ?? []) {
      const total = (mb.inputTokens ?? 0) + (mb.outputTokens ?? 0) + (mb.cacheCreationTokens ?? 0) + (mb.cacheReadTokens ?? 0);
      if (total <= 0) continue;
      const { provider, model } = providerForModel(mb.modelName);
      out.push({
        // "import-day" marks a day-level aggregate: sync uses it as a cutoff so live-log
        // records for already-imported days are never double-counted.
        ts, provider, category: "coding", operation: "import-day", model,
        quantity: 1, unit: "token", rawAmount: total, rawUnit: "tokens",
        usdEst: Number((mb.cost ?? 0).toFixed(6)),
        source: "log", confidence: "high", verified: false,
      });
    }
  }
  return out;
}

// Look in the usual spots so `vibetracker import` can work with no argument.
export function findCcJson(): string | undefined {
  const candidates = [
    join(process.cwd(), "cc.json"),
    join(homedir(), "cc.json"),
    join(homedir(), ".vibetracker", "cc.json"),
    join(homedir(), ".config", "C0VIBE", "byocli", "cc.json"),
  ];
  return candidates.find((p) => existsSync(p));
}
