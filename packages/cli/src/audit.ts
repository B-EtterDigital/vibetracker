import { createHash } from "node:crypto";
import type { NormalizedRecord, Source } from "../../core/src/schema/record.ts";
import type { TrustSignal } from "../../core/src/schema/trust-signal.ts";
import type { ProviderDescriptor } from "../../adapters/src/registry.ts";
import type { VtConfig } from "./config.ts";
import { formatTable, money } from "./format.ts";

export interface SourceMixRow {
  source: Source;
  count: number;
  pct: number;
  usd?: number;
  label: string;
}

export interface FreshnessRow {
  provider: string;
  lastEvent: string;
  ageDays: number;
  status: "fresh" | "warm" | "stale";
}

export interface CoverageRow {
  id: string;
  label: string;
  tier: string;
  state: "tracked" | "connected" | "available" | "planned" | "manual";
  categories: string[];
  method: string;
}

export interface IntegrityReport {
  recordCount: number;
  chainHead: string;
  bundleFingerprint: string;
}

export interface UsageAudit {
  generatedAt: string;
  totals: { records: number; providers: number; usd?: number };
  sourceMix: SourceMixRow[];
  freshness: FreshnessRow[];
  coverage: {
    tracked: number;
    connected: number;
    available: number;
    planned: number;
    manual: number;
    gaps: CoverageRow[];
  };
  integrity: IntegrityReport;
  anomalies: string[];
  trustSignals: TrustSignal[];
}

const SOURCE_LABELS: Record<Source, string> = {
  ledger: "Provider ledger",
  balance_delta: "Balance delta",
  log: "Local logs",
  feed_recon: "Feed reconstruction",
  proxy: "Proxy capture",
  local: "Local runner",
  manual: "Manual entry",
};

const FIT_MARK = "…";

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

function fit(text: string, width: number): string {
  return text.length > width ? `${text.slice(0, Math.max(0, width - FIT_MARK.length))}${FIT_MARK}` : text.padEnd(width);
}

function frameLine(text: string): string {
  return `| ${fit(text, 52)} |`;
}

function bar(pct: number, width = 12): string {
  const filled = Math.max(0, Math.min(width, Math.round((pct / 100) * width)));
  return `${"█".repeat(filled)}${"░".repeat(width - filled)}`;
}

function sourceGlyph(source: Source): string {
  const glyphs: Record<Source, string> = {
    ledger: "LD",
    balance_delta: "BD",
    log: "LG",
    feed_recon: "FR",
    proxy: "PX",
    local: "LC",
    manual: "MN",
  };
  return glyphs[source];
}

function freshnessSummary(rows: FreshnessRow[]): string {
  const counts = { fresh: 0, warm: 0, stale: 0 };
  for (const row of rows) counts[row.status] += 1;
  return `fresh ${counts.fresh} · warm ${counts.warm} · stale ${counts.stale}`;
}

function renderAuditCockpit(a: UsageAudit): string {
  const sourceRows = a.sourceMix.length
    ? a.sourceMix.slice(0, 4).map((row) =>
      frameLine(`[${sourceGlyph(row.source)}] ${fit(row.label, 19)} ${String(row.count).padStart(4)} ${String(row.pct).padStart(5)}% ${bar(row.pct)}`))
    : [frameLine("[--] no usage records yet")];
  const trust = a.trustSignals.length
    ? `${a.trustSignals.length} trust signal(s) · NOT USAGE · separate`
    : "0 trust signals · NOT USAGE lane empty";
  const issues = a.anomalies.length
    ? `${a.anomalies.length} caveat(s) · inspect before sharing`
    : "0 caveats · audit stream looks clean";
  return [
    "+------------------------------------------------------+",
    frameLine("VTK://AUDIT-CORE//VIBERS-UNITE//C0VIBE.APP"),
    "|------------------------------------------------------|",
    frameLine(`${a.totals.records.toLocaleString("en-US")} records · ${a.totals.providers} provider(s)${a.totals.usd != null ? ` · ${money(a.totals.usd)} est.` : ""}`),
    frameLine(`freshness ${freshnessSummary(a.freshness)}`),
    frameLine(`coverage tracked ${a.coverage.tracked} · connected ${a.coverage.connected} · gaps ${a.coverage.gaps.length}`),
    frameLine(trust),
    frameLine(issues),
    "| source proof                                        |",
    ...sourceRows,
    "| integrity                                           |",
    frameLine(`chain  ${a.integrity.chainHead.slice(0, 12)}...${a.integrity.chainHead.slice(-8)}`),
    frameLine(`bundle ${a.integrity.bundleFingerprint.slice(0, 12)}...${a.integrity.bundleFingerprint.slice(-8)}`),
    frameLine("local-first audit · upload requires preview/review"),
    frameLine("Vibers Unite · c0vibe.app"),
    "+------------------------------------------------------+",
  ].join("\n");
}

function canonicalJson(value: unknown): string {
  if (value == null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj).sort().map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(",")}}`;
}

export function computeIntegrity(records: NormalizedRecord[], trustSignals: TrustSignal[] = []): IntegrityReport {
  let chain = "vibetracker-record-chain-v1";
  for (const r of records) chain = sha256(`${chain}\n${canonicalJson(r)}`);
  const bundleFingerprint = sha256(canonicalJson({
    schema: "vibetracker.audit/0.1",
    recordCount: records.length,
    records,
    trustSignals,
  }));
  return { recordCount: records.length, chainHead: chain, bundleFingerprint };
}

function sourceMix(records: NormalizedRecord[]): SourceMixRow[] {
  const total = Math.max(1, records.length);
  const map = new Map<Source, SourceMixRow>();
  for (const r of records) {
    const row = map.get(r.source) ?? { source: r.source, label: SOURCE_LABELS[r.source], count: 0, pct: 0 };
    row.count += 1;
    if (r.usdEst != null) row.usd = Number(((row.usd ?? 0) + r.usdEst).toFixed(2));
    map.set(r.source, row);
  }
  return [...map.values()]
    .map((r) => ({ ...r, pct: Number(((r.count / total) * 100).toFixed(1)) }))
    .sort((a, b) => b.count - a.count);
}

function freshness(records: NormalizedRecord[]): FreshnessRow[] {
  const now = Date.now();
  const map = new Map<string, string>();
  for (const r of records) {
    if (!map.has(r.provider) || r.ts > map.get(r.provider)!) map.set(r.provider, r.ts);
  }
  return [...map.entries()].map(([provider, lastEvent]) => {
    const ageDays = Math.max(0, Math.floor((now - Date.parse(lastEvent)) / 86400000));
    return {
      provider,
      lastEvent,
      ageDays,
      status: ageDays <= 7 ? "fresh" : ageDays <= 30 ? "warm" : "stale",
    };
  }).sort((a, b) => b.ageDays - a.ageDays);
}

function coverage(records: NormalizedRecord[], providers: ProviderDescriptor[], cfg: VtConfig): UsageAudit["coverage"] {
  const trackedIds = new Set(records.map((r) => r.provider));
  const enabled = new Set(cfg.enabled);
  const gaps: CoverageRow[] = [];
  let tracked = trackedIds.size, connected = 0, available = 0, planned = 0, manual = 0;
  for (const p of providers) {
    let state: CoverageRow["state"];
    if (trackedIds.has(p.id)) { state = "tracked"; }
    else if (enabled.has(p.id)) { state = "connected"; connected++; }
    else if (p.status === "built" || p.tier === "proxy") { state = "available"; available++; }
    else if (p.tier === "manual" || p.status === "manual-only") { state = "manual"; manual++; }
    else { state = "planned"; planned++; }
    if (state !== "tracked") {
      gaps.push({ id: p.id, label: p.label, tier: p.tier, state, categories: p.categories, method: p.method });
    }
  }
  return { tracked, connected, available, planned, manual, gaps };
}

function anomalies(records: NormalizedRecord[], fresh: FreshnessRow[]): string[] {
  const out: string[] = [];
  const manual = records.filter((r) => r.source === "manual").length;
  if (manual) out.push(`${manual} manual record(s) need user trust, not provider proof.`);
  const recon = records.filter((r) => r.source === "feed_recon").length;
  if (recon) out.push(`${recon} feed-reconstructed record(s) are estimated from generation feeds.`);
  for (const f of fresh.filter((r) => r.status === "stale").slice(0, 5)) {
    out.push(`${f.provider} is stale: newest event ${f.ageDays} day(s) old.`);
  }
  const byDay = new Map<string, number>();
  for (const r of records) byDay.set(r.ts.slice(0, 10), (byDay.get(r.ts.slice(0, 10)) ?? 0) + (r.usdEst ?? 0));
  const vals = [...byDay.values()].filter((n) => n > 0);
  if (vals.length >= 5) {
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const peak = Math.max(...vals);
    if (peak > avg * 5) out.push(`one-day estimated spend spike: ${money(peak)} vs ${money(avg)} daily average.`);
  }
  return out;
}

export function buildUsageAudit(opts: {
  records: NormalizedRecord[];
  providers: ProviderDescriptor[];
  config: VtConfig;
  trustSignals?: TrustSignal[];
  generatedAt?: string;
}): UsageAudit {
  const usd = opts.records.reduce((a, r) => a + (r.usdEst ?? 0), 0);
  const fresh = freshness(opts.records);
  return {
    generatedAt: opts.generatedAt ?? new Date().toISOString(),
    totals: { records: opts.records.length, providers: new Set(opts.records.map((r) => r.provider)).size, ...(usd ? { usd: Number(usd.toFixed(2)) } : {}) },
    sourceMix: sourceMix(opts.records),
    freshness: fresh,
    coverage: coverage(opts.records, opts.providers, opts.config),
    integrity: computeIntegrity(opts.records, opts.trustSignals ?? []),
    anomalies: anomalies(opts.records, fresh),
    trustSignals: opts.trustSignals ?? [],
  };
}

export function renderUsageAudit(a: UsageAudit): string {
  const mix = formatTable(["SOURCE", "RECORDS", "SHARE", "USD~"], a.sourceMix.map((r) => [
    r.label, String(r.count), `${r.pct}%`, money(r.usd),
  ]));
  const fresh = formatTable(["PROVIDER", "NEWEST", "AGE", "STATUS"], a.freshness.slice(0, 12).map((r) => [
    r.provider, r.lastEvent.slice(0, 10), `${r.ageDays}d`, r.status,
  ]));
  const gaps = formatTable(["PROVIDER", "STATE", "TIER", "CATEGORIES"], a.coverage.gaps.slice(0, 18).map((r) => [
    r.id, r.state, r.tier, r.categories.join("/"),
  ]));
  const signals = a.trustSignals.length
    ? a.trustSignals.map((s) => s.kind === "github_activity"
      ? `  github_activity  @${s.handle} · ${s.totalContributions.toLocaleString("en-US")} contributions/${s.windowDays}d · NOT USAGE`
      : s.kind === "creator_activity"
        ? `  creator_activity/${s.platform}  @${s.handle} · ${s.count.toLocaleString("en-US")} ${s.metric}${s.windowDays ? `/${s.windowDays}d` : ""} · NOT USAGE`
      : `  ${s.kind}`).join("\n")
    : "  (none)";
  const anomaliesText = a.anomalies.length ? a.anomalies.map((s) => `  - ${s}`).join("\n") : "  (none)";
  return [
    renderAuditCockpit(a),
    "",
    "VIBETRACKER AUDIT",
    `${a.totals.records.toLocaleString("en-US")} records · ${a.totals.providers} provider(s)` + (a.totals.usd != null ? ` · ${money(a.totals.usd)} est.` : ""),
    "",
    "Source mix",
    mix || "  (none)",
    "",
    "Freshness",
    fresh || "  (none)",
    "",
    "Coverage gaps (not counted as usage)",
    `tracked ${a.coverage.tracked} · connected ${a.coverage.connected} · available ${a.coverage.available} · planned ${a.coverage.planned} · manual ${a.coverage.manual}`,
    gaps || "  (none)",
    "",
    "Integrity",
    `  records: ${a.integrity.recordCount}`,
    `  chain:   ${a.integrity.chainHead.slice(0, 16)}…${a.integrity.chainHead.slice(-8)}`,
    `  bundle:  ${a.integrity.bundleFingerprint.slice(0, 16)}…${a.integrity.bundleFingerprint.slice(-8)}`,
    "",
    "Trust signals",
    signals,
    "",
    "Anomalies / caveats",
    anomaliesText,
  ].join("\n");
}
