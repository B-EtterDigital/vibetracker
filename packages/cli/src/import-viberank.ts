// `vibetracker import viberank <handle>` — recover coding history that only exists on
// viberank.app (submissions accumulated there survive local log pruning). The profile
// page server-renders totals AND a per-model cost breakdown, so a plain fetch works —
// no browser, no auth.
//
// Strategy: decompose the viberank history into REAL provider records — codex /
// claude-code / gemini-cli, all AI Coding — from the page's per-model cost breakdown,
// instead of one fake "viberank-history" provider. Each model's USD is spread evenly
// across the profile's active day range (joined..last-updated). A single residual model
// reconciles the itemized sum up to viberank's header total. Re-import replaces.

import type { Category, NormalizedRecord } from "../../core/src/schema/record.ts";

/** Legacy fake provider written by the OLD importer — kept ONLY so the handler can purge it. */
export const VIBERANK_PROVIDER = "viberank-history";

/** The residual bucket that reconciles itemized per-model USD up to viberank's header total. */
export const RESIDUAL_MODEL = "(other coding models)";

export interface ViberankModelCost { model: string; usd: number }

/** Aggregate parsed from og:description (kept separate from the richer profile shape). */
export interface ViberankMeta { handle: string; name?: string; usd: number; tokens: number }

export interface ViberankProfile extends ViberankMeta {
  models: ViberankModelCost[]; // per-model USD breakdown scraped from the page
  joined?: string;             // ISO day "YYYY-MM-DD" (from "Joined M/D/YYYY")
  lastUpdated?: string;        // ISO day if parseable
}

/** Input to the pure decomposer. Deterministic: the end date is injected, never Date.now. */
export interface ViberankDecomposeInput {
  handle?: string;
  total: number;               // viberank header total USD (the reconcile target)
  joined?: string;             // ISO day — start of the active range
  lastUpdated?: string;        // ISO day — end of the active range, if known
  end?: string;                // convenience end override (also accepted via opts.end)
  models: ViberankModelCost[]; // per-model USD breakdown
}

export interface DecomposeOpts { end?: string; joined?: string }

// ---- page parsing (pure, regex-only, never throws) -------------------------------------

export function parseViberankMeta(html: string, handle: string): ViberankMeta | null {
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

// Only accept model-name spans that look like AI-model ids, so unrelated UI text sharing the
// same class isn't mistaken for a model. Anchored at the start; generous on families.
const MODEL_ID = /^(?:gpt-|o[1-4]\b|codex|claude|gemini|grok|deepseek|qwen|llama|mistral|kimi|glm|fable|opus|haiku|sonnet)/i;
// The server-rendered leaderboard row: a model-name span (class "…font-mono truncate")
// immediately followed by its cost span (">$AMOUNT<"). This closest pairing is far more
// reliable than the escaped RSC-flight payload, where the cost sits deep in nested nodes.
const MODEL_ROW = /font-mono truncate[^>]*>([^<]+)<\/span>\s*<span[^>]*>\$([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})/g;

/**
 * Extract the per-model USD breakdown from the server-rendered profile. viberank renders each
 * model as a `font-mono truncate` span immediately followed by a `$AMOUNT` cost span; we pair
 * the two. Guarded by a model-id allowlist and de-duped by model (first occurrence wins).
 */
export function parseViberankModels(html: string): ViberankModelCost[] {
  const out: ViberankModelCost[] = [];
  const seen = new Set<string>();
  for (const m of html.matchAll(MODEL_ROW)) {
    const model = m[1].trim();
    const key = model.toLowerCase();
    if (seen.has(key)) continue;
    if (!MODEL_ID.test(model)) continue;
    const usd = Number(m[2].replace(/,/g, ""));
    if (!Number.isFinite(usd) || usd <= 0) continue;
    seen.add(key);
    out.push({ model, usd });
  }
  return out;
}

const isoDay = (mm: RegExpMatchArray | null | undefined): string | undefined =>
  mm ? `${mm[3]}-${String(mm[1]).padStart(2, "0")}-${String(mm[2]).padStart(2, "0")}` : undefined;

/** viberank shows US-format dates: "Joined M/D/YYYY" (and, when present, a last-updated date). */
export function parseViberankDates(html: string): { joined?: string; lastUpdated?: string } {
  // "Joined <!-- -->8/19/2025" — tolerate the React SSR comment marker between label and date.
  const joined = isoDay(html.match(/Joined\b[^0-9]{0,15}(\d{1,2})\/(\d{1,2})\/(\d{4})/i));
  const lastUpdated = isoDay(
    html.match(/(?:Last\s+updated|Last\s+submission|Last\s+upload|Updated)[^0-9]{0,12}(\d{1,2})\/(\d{1,2})\/(\d{4})/i),
  );
  return { joined, lastUpdated };
}

export async function fetchViberankProfile(handle: string): Promise<ViberankProfile> {
  const url = `https://www.viberank.app/profile/${encodeURIComponent(handle)}`;
  const res = await fetch(url, { headers: { "user-agent": "vibetracker (usage import)" } });
  if (!res.ok) throw new Error(`viberank profile ${res.status} for ${url}`);
  const html = await res.text();
  const meta = parseViberankMeta(html, handle);
  if (!meta) throw new Error(`could not read totals from ${url} — is the handle right?`);
  const models = parseViberankModels(html);
  const { joined, lastUpdated } = parseViberankDates(html);
  return { ...meta, models, joined, lastUpdated };
}

// ---- decomposition (pure, deterministic) ------------------------------------------------

/** Map a viberank model name to its real provider + category (first match wins, case-insensitive). */
export function classifyModel(model: string): { provider: string; category: Category } {
  const m = (model ?? "").trim();
  if (/^gpt-5|codex/i.test(m)) return { provider: "codex", category: "coding" };
  if (/claude|fable|opus|haiku|sonnet/i.test(m)) return { provider: "claude-code", category: "coding" };
  if (/gemini/i.test(m)) return { provider: "gemini-cli", category: "coding" };
  return { provider: "codex", category: "coding" };
}

/**
 * Decompose viberank history into REAL provider records — never provider "viberank-history".
 *
 * Time distribution: each model's USD is spread EVENLY across the active day range
 * [joined .. end] (inclusive), one record per day. Daily granularity isn't reliably parseable
 * from the page, so an even spread across the real active range is the honest, deterministic
 * choice. A fair-cent split makes each model's daily shares sum to EXACTLY its USD, so the
 * grand total reconciles to viberank's header total with zero rounding drift.
 *
 * Pure & deterministic: the end date is injected (opts.end / input.end / input.lastUpdated) —
 * there is no Date.now here. The impure "or today" fallback lives in the CLI handler.
 */
export function decomposeViberank(input: ViberankDecomposeInput, opts: DecomposeOpts = {}): NormalizedRecord[] {
  const endISO = (opts.end ?? input.end ?? input.lastUpdated)?.slice(0, 10);
  if (!endISO) throw new Error("decomposeViberank: an end date is required (opts.end / input.end / input.lastUpdated)");
  const joinedISO = (opts.joined ?? input.joined)?.slice(0, 10) ?? endISO; // no joined date → single end-day bucket

  const DAY = 86400000;
  const start = Date.parse(`${joinedISO}T12:00:00.000Z`);
  const end = Date.parse(`${endISO}T12:00:00.000Z`);
  const span = Number.isFinite(start) && Number.isFinite(end) ? end - start : 0;
  const nDays = span > 0 ? Math.round(span / DAY) + 1 : 1; // inclusive [joined..end]; inverted/bad → 1 day
  const days: string[] = [];
  for (let i = 0; i < nDays; i++) days.push(new Date(start + i * DAY).toISOString());

  // RECONCILE: the itemized per-model sum under-counts the header total (the header rolls in
  // models the page doesn't itemize). Add ONE residual so the grand total matches viberank.
  const models = input.models
    .filter((m) => Number.isFinite(m.usd) && m.usd > 0)
    .map((m) => ({ model: m.model, usd: m.usd }));
  const sumModels = models.reduce((a, m) => a + m.usd, 0);
  const residual = input.total - sumModels;
  if (residual > 0.005) models.push({ model: RESIDUAL_MODEL, usd: residual });

  const out: NormalizedRecord[] = [];
  for (const m of models) {
    const { provider, category } = classifyModel(m.model);
    // Fair-cent split: distribute integer cents so the model's records sum to exactly its USD.
    const cents = Math.round(m.usd * 100);
    const base = Math.floor(cents / nDays);
    const rem = cents - base * nDays;
    for (let i = 0; i < nDays; i++) {
      const dayCents = base + (i < rem ? 1 : 0);
      out.push({
        ts: days[i],
        provider,
        category,
        operation: "import",
        model: m.model,
        quantity: 0,
        unit: "credit",
        rawAmount: 0,
        rawUnit: "usd",
        usdEst: Number((dayCents / 100).toFixed(2)),
        source: "feed_recon",
        confidence: "low",
        verified: false,
      });
    }
  }
  return out;
}
