// Server-side ingest handler for uploaded usage bundles. Framework-agnostic and pure so
// it's unit-testable; the Supabase edge function is a thin wrapper around it.
//
// SECURITY (PLAN §7 + docs/compliance/TRUST_MODEL.md):
//  1. An upload is UNTRUSTED — re-run the sanitize/whitelist boundary, reject hostile data.
//  2. tier is SERVER-controlled, never read from the client: authenticated → 'attested',
//     anonymous → 'self_reported'. An upload can NEVER be 'verified' (that needs a backend
//     connector that fetches from the provider). No self-promotion via the payload.
//  3. AGGREGATES ONLY leave this function — individual records, prompts, model names, and
//     keys are never returned or persisted. Only per-provider rollups, totals, and
//     clearly labelled non-usage trust signals.

import { ingestRecords } from "../../core/src/verify/validate.ts";
import { aggregate, totals } from "../../core/src/aggregate.ts";
import type { CreatorPlatform, GitHubContributionDay, TrustSignal } from "../../core/src/schema/trust-signal.ts";

export interface UploadBundle {
  schema?: string;
  handle?: string;
  generatedAt?: string;
  tier?: string;      // ignored — the server sets tier from auth, never the client
  records?: unknown[];
  trustSignals?: unknown[];
}

export interface ProviderRollup { provider: string; ops: number; credits: number; usd?: number }
export interface DailyRollup { date: string; ops: number; credits: number; usd?: number }
export interface CategoryRollup { category: string; ops: number; credits: number; usd?: number }

export interface IngestResult {
  ok: boolean;
  errors: string[];
  handle: string;
  userId?: string;
  tier: "attested" | "self_reported";        // never 'verified' from an upload
  accepted: number;
  rejected: number;
  totals: { count: number; credits: number; usd?: number; providers: number };
  byProvider: ProviderRollup[];              // the ONLY breakdown that leaves the server
  byDay: DailyRollup[];                      // aggregate-only rhythm data for public heatgrids
  byCategory: CategoryRollup[];              // true per-record category rollup (Vibe Categories) — a
                                             // single provider (e.g. Higgsfield) splits across image/
                                             // video/3d here, which a provider-primary rollup cannot do
  trustSignals: TrustSignal[];               // labelled evidence only; never counted in totals
}

const MAX_RECORDS = 200_000;
const MAX_TRUST_SIGNALS = 8;
const HANDLE_RE = /^[a-zA-Z0-9_.-]{1,64}$/;
const GITHUB_HANDLE_RE = /^[a-zA-Z0-9-]{1,39}$/;
const HOST_RE = /^[a-z0-9.-]{1,120}$/i;
const CREATOR_PLATFORMS = new Set<CreatorPlatform>(["youtube", "x", "linkedin", "huggingface", "npm", "pypi"]);

function cleanText(v: unknown, max = 120): string {
  return typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, max) : "";
}

function boundedInt(v: unknown, max = 1_000_000_000): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(max, Math.floor(n));
}

function cleanIso(v: unknown): string {
  const s = cleanText(v, 40);
  return Number.isFinite(Date.parse(s)) ? new Date(s).toISOString() : "";
}

function cleanGithubDays(raw: unknown): GitHubContributionDay[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(-366).map((item) => {
    const o = typeof item === "object" && item !== null ? item as Record<string, unknown> : {};
    const date = cleanText(o.date, 10);
    const count = boundedInt(o.count, 1_000_000);
    const level = Math.max(0, Math.min(4, boundedInt(o.level, 4))) as 0 | 1 | 2 | 3 | 4;
    return /^\d{4}-\d{2}-\d{2}$/.test(date) ? { date, count, level: count > 0 ? Math.max(1, level) as 1 | 2 | 3 | 4 : 0 } : null;
  }).filter((d): d is GitHubContributionDay => d !== null);
}

export function sanitizeTrustSignals(raw: unknown): TrustSignal[] {
  if (!Array.isArray(raw)) return [];
  const out: TrustSignal[] = [];
  for (const item of raw.slice(0, MAX_TRUST_SIGNALS)) {
    const o = typeof item === "object" && item !== null ? item as Record<string, unknown> : {};
    if (o.kind === "higgsfield_mcp" && o.source === "codex_mcp") {
      const transport = cleanText(o.transport, 40);
      const urlHost = cleanText(o.urlHost, 120).toLowerCase();
      if (o.provider !== "higgsfield" || o.mcpName !== "higgsfield" || o.auth !== "oauth" || o.enabled !== true || !transport || !HOST_RE.test(urlHost)) continue;
      out.push({
        kind: "higgsfield_mcp",
        source: "codex_mcp",
        label: "Higgsfield MCP connection evidence (not AI usage)",
        provider: "higgsfield",
        mcpName: "higgsfield",
        transport,
        auth: "oauth",
        urlHost,
        enabled: true,
        fetchedAt: cleanIso(o.fetchedAt) || new Date(0).toISOString(),
        confidence: "activity_evidence",
        affectsTotals: false,
        usageVerified: false,
        note: "Higgsfield MCP connection evidence only. Not counted as usage, spend, credits, or verified provider data.",
      });
      continue;
    }
    if (o.kind === "creator_activity" && o.source === "manual") {
      const platform = cleanText(o.platform, 24) as CreatorPlatform;
      const handle = cleanText(o.handle, 80);
      const metric = cleanText(o.metric, 40) || "activity";
      const count = boundedInt(o.count);
      if (!CREATOR_PLATFORMS.has(platform) || !handle) continue;
      const url = cleanText(o.url, 240);
      out.push({
        kind: "creator_activity",
        source: "manual",
        label: "Creator activity evidence (not AI usage)",
        platform,
        handle,
        metric,
        count,
        ...(url ? { url } : {}),
        fetchedAt: cleanIso(o.fetchedAt) || new Date(0).toISOString(),
        ...(o.windowDays != null ? { windowDays: Math.max(1, Math.min(3660, boundedInt(o.windowDays, 3660) || 1)) } : {}),
        confidence: "activity_evidence",
        affectsTotals: false,
        usageVerified: false,
        note: "Creator/public activity evidence only. Not counted as usage, spend, credits, or verified provider data.",
      });
      continue;
    }
    if (o.kind !== "github_activity" || o.source !== "github_cli") continue;
    const handle = cleanText(o.handle, 39);
    const from = cleanIso(o.from);
    const to = cleanIso(o.to);
    if (!GITHUB_HANDLE_RE.test(handle) || !from || !to) continue;
    out.push({
      kind: "github_activity",
      source: "github_cli",
      label: "GitHub activity evidence (not AI usage)",
      handle,
      fetchedAt: cleanIso(o.fetchedAt) || to,
      from,
      to,
      windowDays: Math.max(1, Math.min(366, boundedInt(o.windowDays, 366) || 365)),
      totalContributions: boundedInt(o.totalContributions),
      commitContributions: boundedInt(o.commitContributions),
      issueContributions: boundedInt(o.issueContributions),
      pullRequestContributions: boundedInt(o.pullRequestContributions),
      pullRequestReviewContributions: boundedInt(o.pullRequestReviewContributions),
      repositoryContributions: boundedInt(o.repositoryContributions),
      days: cleanGithubDays(o.days),
      confidence: "activity_evidence",
      affectsTotals: false,
      usageVerified: false,
      note: "Activity evidence only. Not counted as usage, spend, credits, or verified provider data.",
    });
  }
  return out;
}

export function handleIngest(payload: unknown, opts: { userId?: string; maxRecords?: number } = {}): IngestResult {
  const max = opts.maxRecords ?? MAX_RECORDS;
  const errors: string[] = [];
  const bundle: UploadBundle = typeof payload === "object" && payload !== null ? (payload as UploadBundle) : {};

  const handleRaw = typeof bundle.handle === "string" ? bundle.handle : "anonymous";
  // "demo" (any casing/padding) is reserved for the bundled sample profile, so no upload
  // can ever shadow /u/demo. Both write paths share this validator — the edge function is
  // a thin wrapper around handleIngest — so this is the single guard for every write.
  // Same shape as the invalid-handle path: default to anonymous + recorded error.
  const demoReserved = handleRaw.trim().toLowerCase() === "demo";
  const handle = !demoReserved && HANDLE_RE.test(handleRaw) ? handleRaw : "anonymous";
  if (demoReserved) errors.push(`handle "demo" is reserved for the sample profile`);
  else if (!HANDLE_RE.test(handleRaw)) errors.push("invalid handle; defaulted to anonymous");

  const recs = Array.isArray(bundle.records) ? bundle.records : [];
  if (!Array.isArray(bundle.records)) errors.push("records missing or not an array");
  if (recs.length > max) errors.push(`too many records (${recs.length} > ${max}); truncated`);
  const limited = recs.slice(0, max);

  // Untrusted boundary: sanitize, reject hostile, force verified:false.
  const { accepted, rejected } = ingestRecords(limited, { untrustedSource: true });

  // tier is server-controlled — the client's payload.tier is ignored on purpose.
  const tier: "attested" | "self_reported" = opts.userId ? "attested" : "self_reported";

  const t = totals(accepted);
  const byProvider: ProviderRollup[] = aggregate(accepted, "provider").map((r) => ({
    provider: r.key, ops: r.count, credits: r.credits, usd: r.usd,
  }));
  const byDay: DailyRollup[] = aggregate(accepted, "day")
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((r) => ({ date: r.key, ops: r.count, credits: r.credits, usd: r.usd }));
  const byCategory: CategoryRollup[] = aggregate(accepted, "category")
    .map((r) => ({ category: r.key, ops: r.count, credits: r.credits, usd: r.usd }));
  const trustSignals = sanitizeTrustSignals(bundle.trustSignals);

  // Individual records are intentionally NOT returned — only aggregates leave here.
  return {
    ok: errors.length === 0,
    errors,
    handle,
    userId: opts.userId,
    tier,
    accepted: accepted.length,
    rejected: rejected.length,
    totals: { count: t.count, credits: t.credits, usd: t.usd, providers: t.providers },
    byProvider,
    byDay,
    byCategory,
    trustSignals,
  };
}
