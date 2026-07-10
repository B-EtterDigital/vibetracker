// `vibetracker import viberank <handle>` — recover coding history that only exists on
// viberank.app (submissions accumulated there survive local log pruning). The profile
// page server-renders totals into og: meta, so a plain fetch works — no browser, no auth.
//
// Strategy: viberank total − locally-tracked coding total = the "pre-history gap".
// That gap is written as provider "viberank-history", spread evenly across the days
// between --since and the oldest local coding record (flat baseline, clearly labeled),
// so daily charts stay readable and nothing is double-counted. Re-import replaces.

import type { NormalizedRecord } from "../../core/src/schema/record.ts";

export const VIBERANK_PROVIDER = "viberank-history";
/** Providers whose spend viberank already includes (coding agents submitted via ccusage). */
export const CODING_AGENT_PROVIDERS = ["claude-code", "codex", "openclaw", "hermes", "gemini-cli", "opencode", VIBERANK_PROVIDER];

export interface ViberankProfile { handle: string; name?: string; usd: number; tokens: number }

export function parseViberankMeta(html: string, handle: string): ViberankProfile | null {
  const desc = html.match(/og:description"?\s+content="([^"]+)"/)?.[1]
    ?? html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  if (!desc) return null;
  const m = desc.match(/\$([\d,]+(?:\.\d+)?) across ([\d.]+)\s*(B|M|K)? tokens/i);
  if (!m) return null;
  const usd = Number(m[1].replace(/,/g, ""));
  const mult = m[3] === "B" ? 1e9 : m[3] === "M" ? 1e6 : m[3] === "K" ? 1e3 : 1;
  const name = html.match(/<title>([^—|<]+)/)?.[1]?.trim();
  if (!Number.isFinite(usd) || usd <= 0) return null;
  return { handle, name, usd, tokens: Number(m[2]) * mult };
}

export async function fetchViberankProfile(handle: string): Promise<ViberankProfile> {
  const url = `https://www.viberank.app/profile/${encodeURIComponent(handle)}`;
  const res = await fetch(url, { headers: { "user-agent": "vibetracker (usage import)" } });
  if (!res.ok) throw new Error(`viberank profile ${res.status} for ${url}`);
  const parsed = parseViberankMeta(await res.text(), handle);
  if (!parsed) throw new Error(`could not read totals from ${url} — is the handle right?`);
  return parsed;
}

/** Spread the gap into per-day records between `sinceISO` and `untilISO` (exclusive). */
export function gapToRecords(p: ViberankProfile, gapUsd: number, gapTokens: number, sinceISO: string, untilISO: string): NormalizedRecord[] {
  if (gapUsd <= 0) return [];
  const start = Date.parse(sinceISO.slice(0, 10) + "T12:00:00Z");
  const end = Date.parse(untilISO.slice(0, 10) + "T12:00:00Z");
  const days = Math.max(1, Math.round((end - start) / 86400000));
  const out: NormalizedRecord[] = [];
  for (let i = 0; i < days; i++) {
    out.push({
      ts: new Date(start + i * 86400000).toISOString(),
      provider: VIBERANK_PROVIDER,
      category: "coding",
      operation: "import-day",
      model: `viberank @${p.handle} (evenly spread)`,
      quantity: 1,
      unit: "token",
      rawAmount: Math.round(Math.max(0, gapTokens) / days),
      rawUnit: "tokens",
      usdEst: Number((gapUsd / days).toFixed(4)),
      source: "ledger",
      confidence: "medium",
      verified: false,
    });
  }
  return out;
}
