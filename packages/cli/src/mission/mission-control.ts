import { aggregate, type AggRow } from "../../../core/src/aggregate.ts";
import type { Confidence, NormalizedRecord, Source } from "../../../core/src/schema/record.ts";
import type { TrustSignal } from "../../../core/src/schema/trust-signal.ts";
import { computeIntegrity } from "../audit.ts";

const DAY_MS = 86_400_000;
export interface MissionMetric {
  records: number;
  ops: number;
  credits: number;
  usdEst: number;
}
export interface MissionRail extends MissionMetric {
  key: string;
  sharePct: number;
}
export interface MissionProofRail {
  key: string;
  label: string;
  records: number;
  sharePct: number;
}
export interface MissionAction {
  level: "clear" | "review" | "urgent";
  label: string;
  reason: string;
  command: string;
}
export interface MissionControl {
  schema: "vibetracker.mission-control/1.0";
  generatedAt: string;
  range: { from?: string; to?: string };
  overview: MissionMetric & { providers: number; categories: number };
  windows: { last7d: MissionMetric; last30d: MissionMetric };
  forecast: {
    basisDays: 7;
    dailyAvgUsdEst: number;
    projected30dUsdEst: number;
    budgetUsd?: number;
    budgetStatus: "unset" | "ok" | "near" | "over";
    projectedRatio?: number;
  };
  providers: MissionRail[];
  categories: MissionRail[];
  proof: {
    verifiedRecords: number;
    verifiedSharePct: number;
    sources: MissionProofRail[];
    confidence: MissionProofRail[];
    freshness: { fresh: number; warm: number; stale: number };
    staleProviders: string[];
    chainHead: string;
  };
  localAi: {
    records: number;
    ops: number;
    providers: string[];
    hostedEquivalentUsdEst: number;
  };
  latest: Array<Pick<NormalizedRecord, "ts" | "provider" | "category" | "operation" | "quantity" | "unit" | "source" | "confidence" | "verified">>;
  trust: {
    count: number;
    affectsUsage: false;
    usageVerified: false;
    signals: Array<{ kind: string; label: string; detail: string }>;
  };
  actions: MissionAction[];
  privacy: {
    usageReadOnly: true;
    uploads: false;
    usageWrites: false;
    excludes: string[];
    trustDiscovery: string;
  };
}
export interface MissionControlInput {
  records: NormalizedRecord[];
  trustSignals?: TrustSignal[];
  generatedAt?: string;
  budgetUsd?: number;
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
const CONFIDENCE_LABELS: Record<Confidence, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};
function round(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}
function operationCount(records: NormalizedRecord[]): number {
  return round(records.reduce((sum, record) =>
    sum + (Number.isFinite(record.quantity) && record.quantity > 0 ? record.quantity : 1), 0), 2);
}
function metrics(records: NormalizedRecord[]): MissionMetric {
  return {
    records: records.length,
    ops: operationCount(records),
    credits: round(records.reduce((sum, record) => sum + (record.rawUnit === "credits" ? record.rawAmount : 0), 0), 2),
    usdEst: round(records.reduce((sum, record) => sum + (record.usdEst ?? 0), 0), 2),
  };
}
function withinDays(records: NormalizedRecord[], now: number, days: number): NormalizedRecord[] {
  const cutoff = now - days * DAY_MS;
  return records.filter((record) => {
    const timestamp = Date.parse(record.ts);
    return Number.isFinite(timestamp) && timestamp >= cutoff && timestamp <= now;
  });
}
function rails(rows: AggRow[], totalOps: number, limit = 8): MissionRail[] {
  return rows
    .map((row) => ({
      key: row.key,
      records: row.count,
      ops: round(row.ops, 2),
      credits: round(row.credits, 2),
      usdEst: round(row.usd ?? 0, 2),
      sharePct: totalOps ? round((row.ops / totalOps) * 100, 4) : 0,
    }))
    .sort((a, b) => b.ops - a.ops || b.usdEst - a.usdEst || a.key.localeCompare(b.key))
    .slice(0, limit);
}
function proofRails<T extends string>(
  records: NormalizedRecord[],
  value: (record: NormalizedRecord) => T,
  labels: Record<T, string>,
): MissionProofRail[] {
  const counts = new Map<T, number>();
  for (const record of records) counts.set(value(record), (counts.get(value(record)) ?? 0) + 1);
  return [...counts.entries()]
    .map(([key, count]) => ({
      key,
      label: labels[key],
      records: count,
      sharePct: records.length ? round((count / records.length) * 100, 1) : 0,
    }))
    .sort((a, b) => b.records - a.records || a.key.localeCompare(b.key));
}
function freshness(records: NormalizedRecord[], now: number): MissionControl["proof"]["freshness"] & { staleProviders: string[] } {
  const newest = new Map<string, number>();
  for (const record of records) {
    const timestamp = Date.parse(record.ts);
    if (Number.isFinite(timestamp) && timestamp > (newest.get(record.provider) ?? -Infinity)) newest.set(record.provider, timestamp);
  }
  const result = { fresh: 0, warm: 0, stale: 0, staleProviders: [] as string[] };
  for (const [provider, timestamp] of newest) {
    const ageDays = Math.max(0, Math.floor((now - timestamp) / DAY_MS));
    if (ageDays <= 7) result.fresh += 1;
    else if (ageDays <= 30) result.warm += 1;
    else {
      result.stale += 1;
      result.staleProviders.push(provider);
    }
  }
  result.staleProviders.sort();
  return result;
}

function trustDetail(signal: TrustSignal): string {
  if (signal.kind === "github_activity") {
    return `@${signal.handle} · ${signal.totalContributions.toLocaleString("en-US")} contributions/${signal.windowDays}d`;
  }
  if (signal.kind === "creator_activity") {
    return `${signal.platform}/@${signal.handle} · ${signal.count.toLocaleString("en-US")} ${signal.metric}${signal.windowDays ? `/${signal.windowDays}d` : ""}`;
  }
  return `${signal.provider} MCP · ${signal.enabled ? "connected" : "not connected"} · ${signal.transport}`;
}

function missionActions(input: {
  records: NormalizedRecord[];
  staleProviders: string[];
  lowProofRecords: number;
  localOps: number;
  budgetStatus: MissionControl["forecast"]["budgetStatus"];
  budgetUsd?: number;
}): MissionAction[] {
  const actions: MissionAction[] = [];
  if (!input.records.length) {
    return [
      { level: "urgent", label: "Connect a real source", reason: "The local ledger is empty.", command: "vibetracker init --gui" },
      { level: "review", label: "Verify the machine", reason: "Check config, store, encryption, and provider readiness.", command: "vibetracker doctor" },
      { level: "clear", label: "Find local AI", reason: "Discover loopback model runners without writing usage.", command: "vibetracker detect" },
    ];
  }
  if (input.budgetStatus === "over" || input.budgetStatus === "near") {
    actions.push({
      level: input.budgetStatus === "over" ? "urgent" : "review",
      label: input.budgetStatus === "over" ? "Cap projected burn" : "Review budget runway",
      reason: `The 7-day run rate is ${input.budgetStatus} the configured monthly budget.`,
      command: `vibetracker insights --budget ${input.budgetUsd}`,
    });
  }
  if (input.staleProviders.length) {
    actions.push({
      level: "review",
      label: "Refresh stale providers",
      reason: `${input.staleProviders.slice(0, 3).join(", ")}${input.staleProviders.length > 3 ? " and more" : ""} have no event in 30 days.`,
      command: "vibetracker sync",
    });
  }
  if (input.lowProofRecords) {
    actions.push({
      level: "review",
      label: "Inspect proof quality",
      reason: `${input.lowProofRecords.toLocaleString("en-US")} record(s) use manual, reconstructed, or low-confidence evidence.`,
      command: "vibetracker audit",
    });
  }
  if (!input.localOps) {
    actions.push({ level: "clear", label: "Scan for local AI", reason: "No local-runner operations are represented yet.", command: "vibetracker detect" });
  }
  actions.push({ level: "clear", label: "Review before sharing", reason: "Inspect source mix, freshness, integrity, and trust separation.", command: "vibetracker audit" });
  return actions.filter((action, index, all) => all.findIndex((candidate) => candidate.command === action.command) === index).slice(0, 4);
}

export function buildMissionControl(input: MissionControlInput): MissionControl {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const now = Date.parse(generatedAt);
  if (!Number.isFinite(now)) throw new Error(`invalid mission generatedAt: ${generatedAt}`);
  if (input.budgetUsd != null && (!Number.isFinite(input.budgetUsd) || input.budgetUsd <= 0)) {
    throw new Error("mission budget must be a positive number");
  }

  const all = metrics(input.records);
  const last7dRecords = withinDays(input.records, now, 7);
  const last30dRecords = withinDays(input.records, now, 30);
  const last7d = metrics(last7dRecords);
  const dailyAvgUsdEst = round(last7d.usdEst / 7, 2);
  const projected30dUsdEst = round(dailyAvgUsdEst * 30, 2);
  const projectedRatio = input.budgetUsd != null ? round(projected30dUsdEst / input.budgetUsd, 2) : undefined;
  const budgetStatus = input.budgetUsd == null
    ? "unset" as const
    : projected30dUsdEst > input.budgetUsd
      ? "over" as const
      : projected30dUsdEst >= input.budgetUsd * 0.8
        ? "near" as const
        : "ok" as const;
  const fresh = freshness(input.records, now);
  const verifiedRecords = input.records.filter((record) => record.verified).length;
  const localRecords = input.records.filter((record) => record.source === "local");
  const local = metrics(localRecords);
  const localProviders = [...new Set(localRecords.map((record) => record.provider))].sort();
  const lowProofRecords = input.records.filter((record) =>
    record.confidence === "low" || record.source === "manual" || record.source === "feed_recon").length;
  const times = input.records.map((record) => Date.parse(record.ts)).filter(Number.isFinite).sort((a, b) => a - b);
  const trustSignals = input.trustSignals ?? [];
  const actions = missionActions({
    records: input.records,
    staleProviders: fresh.staleProviders,
    lowProofRecords,
    localOps: local.ops,
    budgetStatus,
    budgetUsd: input.budgetUsd,
  });

  return {
    schema: "vibetracker.mission-control/1.0",
    generatedAt,
    range: times.length ? { from: new Date(times[0]).toISOString(), to: new Date(times[times.length - 1]).toISOString() } : {},
    overview: {
      ...all,
      providers: new Set(input.records.map((record) => record.provider)).size,
      categories: new Set(input.records.map((record) => record.category)).size,
    },
    windows: { last7d, last30d: metrics(last30dRecords) },
    forecast: {
      basisDays: 7,
      dailyAvgUsdEst,
      projected30dUsdEst,
      ...(input.budgetUsd != null ? { budgetUsd: input.budgetUsd, projectedRatio } : {}),
      budgetStatus,
    },
    providers: rails(aggregate(input.records, "provider"), all.ops),
    categories: rails(aggregate(input.records, "category"), all.ops, 12),
    proof: {
      verifiedRecords,
      verifiedSharePct: input.records.length ? round((verifiedRecords / input.records.length) * 100, 1) : 0,
      sources: proofRails(input.records, (record) => record.source, SOURCE_LABELS),
      confidence: proofRails(input.records, (record) => record.confidence, CONFIDENCE_LABELS),
      freshness: { fresh: fresh.fresh, warm: fresh.warm, stale: fresh.stale },
      staleProviders: fresh.staleProviders,
      chainHead: computeIntegrity(input.records, trustSignals).chainHead,
    },
    localAi: {
      records: local.records,
      ops: local.ops,
      providers: localProviders,
      hostedEquivalentUsdEst: local.usdEst,
    },
    latest: [...input.records]
      .filter((record) => Number.isFinite(Date.parse(record.ts)))
      .sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts))
      .slice(0, 8)
      .map(({ ts, provider, category, operation, quantity, unit, source, confidence, verified }) =>
        ({ ts, provider, category, operation, quantity, unit, source, confidence, verified })),
    trust: {
      count: trustSignals.length,
      affectsUsage: false,
      usageVerified: false,
      signals: trustSignals.map((signal) => ({ kind: signal.kind, label: signal.label, detail: trustDetail(signal) })),
    },
    actions,
    privacy: {
      usageReadOnly: true,
      uploads: false,
      usageWrites: false,
      excludes: ["prompts", "outputs", "secrets", "media", "credential values"],
      trustDiscovery: "Separate trust discovery may invoke gh and codex; it never enters usage, spend, or verification totals.",
    },
  };
}

function compact(value: number, digits = 1): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: digits }).format(value);
}

function usd(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fit(value: string, width: number): string {
  return value.length > width ? `${value.slice(0, Math.max(0, width - 3))}...` : value.padEnd(width);
}

function line(value = ""): string {
  return `| ${fit(value, 74)} |`;
}

function bar(pct: number, width = 16): string {
  const rounded = Math.round((pct / 100) * width);
  const filled = Math.max(pct > 0 ? 1 : 0, Math.min(width, rounded));
  return `${"#".repeat(filled)}${".".repeat(width - filled)}`;
}

function percent(value: number): string {
  return value > 0 && value < 0.1 ? "<0.1" : value.toFixed(1);
}

export function renderMissionControl(mission: MissionControl): string {
  const providerRows = mission.providers.length
    ? mission.providers.map((row) => line(`${fit(row.key, 18)} ${bar(row.sharePct)} ${percent(row.sharePct).padStart(5)}%  ${compact(row.ops)} ops  ${usd(row.usdEst)}~`))
    : [line("No usage records yet. Connect a real source to arm this rail.")];
  const sourceRows = mission.proof.sources.length
    ? mission.proof.sources.map((row) => line(`${fit(row.label, 22)} ${bar(row.sharePct, 12)} ${String(row.sharePct.toFixed(1)).padStart(5)}%  ${row.records.toLocaleString("en-US")} records`))
    : [line("No source proof yet.")];
  const latestRows = mission.latest.length
    ? mission.latest.slice(0, 5).map((record) => line(`${record.ts.slice(0, 16).replace("T", " ")}  ${fit(record.provider, 14)} ${fit(record.category, 8)} ${fit(record.operation, 18)} ${record.source}`))
    : [line("No recent activity.")];
  const trustRows = mission.trust.signals.length
    ? mission.trust.signals.slice(0, 3).map((signal) => line(`${signal.kind}: ${signal.detail} - NOT USAGE`))
    : [line("No trust context discovered - NOT USAGE lane remains separate.")];
  const actionRows = mission.actions.flatMap((action, index) => [
    line(`${String(index + 1).padStart(2, "0")} [${action.level.toUpperCase()}] ${action.label} - ${action.reason}`),
    line(`   $ ${action.command}`),
  ]);
  const budget = mission.forecast.budgetUsd == null
    ? "budget gate UNSET - add --budget N for runway status"
    : `budget gate ${mission.forecast.budgetStatus.toUpperCase()} - ${usd(mission.forecast.projected30dUsdEst)}~ projected / ${usd(mission.forecast.budgetUsd)} cap`;

  return [
    "+----------------------------------------------------------------------------+",
    line("VTK://MISSION-CONTROL//LOCAL-LEDGER//READ-ONLY"),
    line(`generated ${mission.generatedAt}  schema ${mission.schema}`),
    "+----------------------------------------------------------------------------+",
    line("LIVE LEDGER"),
    line(`${compact(mission.overview.ops)} ops  ${mission.overview.records.toLocaleString("en-US")} records  ${mission.overview.providers} providers  ${mission.overview.categories} categories`),
    line(`${compact(mission.overview.credits)} credits  ${usd(mission.overview.usdEst)} estimated all-time spend`),
    line(`7d ${compact(mission.windows.last7d.ops)} ops / ${usd(mission.windows.last7d.usdEst)}~  |  30d ${compact(mission.windows.last30d.ops)} ops / ${usd(mission.windows.last30d.usdEst)}~`),
    line(`burn ${usd(mission.forecast.dailyAvgUsdEst)}~/day  |  projected 30d ${usd(mission.forecast.projected30dUsdEst)}~`),
    line(budget),
    "+------------------------------ PROVIDER RAIL -------------------------------+",
    ...providerRows,
    "+------------------------------- PROOF RAIL ---------------------------------+",
    line(`verified ${mission.proof.verifiedSharePct.toFixed(1)}% (${mission.proof.verifiedRecords}/${mission.overview.records})  freshness F${mission.proof.freshness.fresh} W${mission.proof.freshness.warm} S${mission.proof.freshness.stale}`),
    ...sourceRows,
    line(`integrity ${mission.proof.chainHead.slice(0, 18)}...${mission.proof.chainHead.slice(-12)}`),
    "+------------------------------ LATEST ACTIVITY -----------------------------+",
    ...latestRows,
    "+-------------------------- LOCAL AI + TRUST SIDE RAIL ----------------------+",
    line(`local AI ${compact(mission.localAi.ops)} ops across ${mission.localAi.providers.length} provider(s)  hosted equivalent ${usd(mission.localAi.hostedEquivalentUsdEst)}~`),
    ...trustRows,
    "+-------------------------------- NEXT MOVES --------------------------------+",
    ...actionRows,
    "+----------------------------------------------------------------------------+",
    line("PRIVACY: excludes prompts, outputs, secrets, media, and credential values."),
    line("USAGE: read-only. WRITES: 0. UPLOADS: 0. Trust context never affects totals."),
    line("Vibers Unite // c0vibe.app"),
    "+----------------------------------------------------------------------------+",
  ].join("\n");
}
