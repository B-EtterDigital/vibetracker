import type { NormalizedRecord, Source } from "../../../core/src/schema/record.ts";

const DAY_MS = 86_400_000;

export type DeltaState = "up" | "down" | "flat" | "new" | "dormant";

export interface CompareMetric {
  records: number;
  ops: number;
  credits: number;
  usdEst: number;
  providers: number;
  categories: number;
}

export interface CompareDelta {
  amount: number;
  pct: number | null;
  state: DeltaState;
}

export interface CompareRail {
  key: string;
  current: { records: number; ops: number; usdEst: number };
  previous: { records: number; ops: number; usdEst: number };
  opsDelta: CompareDelta;
  usdDelta: CompareDelta;
}

export interface ShareMetric {
  records: number;
  sharePct: number;
}

export interface ShareComparison {
  current: ShareMetric;
  previous: ShareMetric;
  sharePointDelta: number;
}

export interface SourceComparison extends ShareComparison {
  source: Source;
  label: string;
}

export interface CompareAction {
  level: "clear" | "review" | "urgent";
  label: string;
  reason: string;
  command: string;
}

export interface UsageComparison {
  schema: "vibetracker.usage-compare/1.0";
  generatedAt: string;
  windowDays: number;
  currentRange: { from: string; to: string; bounds: "inclusive" };
  previousRange: { from: string; to: string; bounds: "from-inclusive-to-exclusive" };
  current: CompareMetric;
  previous: CompareMetric;
  delta: Record<keyof CompareMetric, CompareDelta>;
  providers: CompareRail[];
  categories: CompareRail[];
  proof: {
    verified: ShareComparison;
    highConfidence: ShareComparison;
    lowProof: ShareComparison;
    sources: SourceComparison[];
  };
  newProviders: string[];
  dormantProviders: string[];
  actions: CompareAction[];
  privacy: {
    usageReadOnly: true;
    usageWrites: 0;
    uploads: 0;
    excludes: string[];
    estimateNotice: string;
    trustNotice: string;
  };
}

export interface UsageCompareInput {
  records: NormalizedRecord[];
  days?: number;
  asOf?: string;
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

function round(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}

function metric(records: NormalizedRecord[]): CompareMetric {
  return {
    records: records.length,
    ops: round(records.reduce((sum, record) => sum + (Number.isFinite(record.quantity) && record.quantity > 0 ? record.quantity : 1), 0)),
    credits: round(records.reduce((sum, record) => sum + (record.rawUnit === "credits" && Number.isFinite(record.rawAmount) ? record.rawAmount : 0), 0)),
    usdEst: round(records.reduce((sum, record) => sum + (Number.isFinite(record.usdEst) ? record.usdEst! : 0), 0)),
    providers: new Set(records.map((record) => record.provider)).size,
    categories: new Set(records.map((record) => record.category)).size,
  };
}

function delta(current: number, previous: number): CompareDelta {
  const amount = round(current - previous);
  if (amount === 0) return { amount, pct: 0, state: "flat" };
  if (previous === 0) return { amount, pct: null, state: current > 0 ? "new" : "flat" };
  if (current === 0) return { amount, pct: -100, state: "dormant" };
  return { amount, pct: round((amount / previous) * 100, 1), state: amount > 0 ? "up" : "down" };
}

function railMetric(records: NormalizedRecord[]): CompareRail["current"] {
  const result = metric(records);
  return { records: result.records, ops: result.ops, usdEst: result.usdEst };
}

function buildRails(current: NormalizedRecord[], previous: NormalizedRecord[], field: "provider" | "category"): CompareRail[] {
  const keys = new Set([...current.map((record) => record[field]), ...previous.map((record) => record[field])]);
  return [...keys].map((key) => {
    const currentMetric = railMetric(current.filter((record) => record[field] === key));
    const previousMetric = railMetric(previous.filter((record) => record[field] === key));
    return {
      key,
      current: currentMetric,
      previous: previousMetric,
      opsDelta: delta(currentMetric.ops, previousMetric.ops),
      usdDelta: delta(currentMetric.usdEst, previousMetric.usdEst),
    };
  }).sort((a, b) => Math.abs(b.usdDelta.amount) - Math.abs(a.usdDelta.amount)
    || Math.abs(b.opsDelta.amount) - Math.abs(a.opsDelta.amount)
    || a.key.localeCompare(b.key));
}

function share(records: NormalizedRecord[], predicate: (record: NormalizedRecord) => boolean): ShareMetric {
  const count = records.filter(predicate).length;
  return { records: count, sharePct: records.length ? round((count / records.length) * 100, 1) : 0 };
}

function compareShare(current: ShareMetric, previous: ShareMetric): ShareComparison {
  return { current, previous, sharePointDelta: round(current.sharePct - previous.sharePct, 1) };
}

function actionsFor(comparison: Pick<UsageComparison, "current" | "previous" | "delta" | "proof" | "newProviders" | "dormantProviders">): CompareAction[] {
  if (!comparison.current.records) {
    return [{
      level: "urgent",
      label: "Current window is empty",
      reason: "No normalized usage records landed in the selected current window.",
      command: "vibetracker sync",
    }];
  }

  const actions: CompareAction[] = [];
  const spend = comparison.delta.usdEst;
  if (spend.pct !== null && Math.abs(spend.pct) >= 25) {
    actions.push({
      level: spend.pct > 0 ? "urgent" : "review",
      label: spend.pct > 0 ? "Estimated spend accelerated" : "Estimated spend declined",
      reason: `USD estimate moved ${Math.abs(spend.pct).toFixed(1)}% against the previous window.`,
      command: "vibetracker insights",
    });
  }
  if (comparison.proof.lowProof.sharePointDelta >= 10 || comparison.proof.verified.sharePointDelta <= -10) {
    actions.push({
      level: "urgent",
      label: "Proof quality weakened",
      reason: `Low-proof share moved ${comparison.proof.lowProof.sharePointDelta >= 0 ? "+" : ""}${comparison.proof.lowProof.sharePointDelta.toFixed(1)} points.`,
      command: "vibetracker audit",
    });
  }
  if (comparison.newProviders.length) {
    actions.push({
      level: "review",
      label: "New provider activity",
      reason: `${comparison.newProviders.join(", ")} appeared only in the current window.`,
      command: "vibetracker providers check",
    });
  }
  if (comparison.dormantProviders.length) {
    actions.push({
      level: "review",
      label: "Provider activity stopped",
      reason: `${comparison.dormantProviders.join(", ")} appeared only in the previous window.`,
      command: "vibetracker sync",
    });
  }
  return actions.length ? actions.slice(0, 4) : [{
    level: "clear",
    label: "Window is stable",
    reason: "No material spend, proof, or provider shift crossed the review gates.",
    command: "vibetracker mission",
  }];
}

export function buildUsageComparison(input: UsageCompareInput): UsageComparison {
  const days = input.days ?? 7;
  if (!Number.isInteger(days) || days < 1 || days > 365) throw new Error("days must be an integer from 1 to 365");
  const asOf = new Date(input.asOf ?? new Date().toISOString());
  if (!Number.isFinite(asOf.getTime())) throw new Error("asOf must be a valid ISO timestamp");
  const currentStart = asOf.getTime() - days * DAY_MS;
  const previousStart = currentStart - days * DAY_MS;
  const currentRecords = input.records.filter((record) => {
    const ts = Date.parse(record.ts);
    return Number.isFinite(ts) && ts >= currentStart && ts <= asOf.getTime();
  });
  const previousRecords = input.records.filter((record) => {
    const ts = Date.parse(record.ts);
    return Number.isFinite(ts) && ts >= previousStart && ts < currentStart;
  });
  const current = metric(currentRecords);
  const previous = metric(previousRecords);
  const metricKeys: Array<keyof CompareMetric> = ["records", "ops", "credits", "usdEst", "providers", "categories"];
  const metricDelta = Object.fromEntries(metricKeys.map((key) => [key, delta(current[key], previous[key])])) as UsageComparison["delta"];
  const providers = buildRails(currentRecords, previousRecords, "provider");
  const categories = buildRails(currentRecords, previousRecords, "category");
  const verified = compareShare(share(currentRecords, (record) => record.verified), share(previousRecords, (record) => record.verified));
  const highConfidence = compareShare(share(currentRecords, (record) => record.confidence === "high"), share(previousRecords, (record) => record.confidence === "high"));
  const lowProof = compareShare(
    share(currentRecords, (record) => record.confidence === "low" || record.source === "manual" || record.source === "feed_recon"),
    share(previousRecords, (record) => record.confidence === "low" || record.source === "manual" || record.source === "feed_recon"),
  );
  const sourceKeys = new Set([...currentRecords.map((record) => record.source), ...previousRecords.map((record) => record.source)]);
  const sources = [...sourceKeys].map((source) => ({
    source,
    label: SOURCE_LABELS[source],
    ...compareShare(share(currentRecords, (record) => record.source === source), share(previousRecords, (record) => record.source === source)),
  })).sort((a, b) => b.current.records - a.current.records || a.label.localeCompare(b.label));
  const newProviders = providers.filter((provider) => provider.previous.records === 0 && provider.current.records > 0).map((provider) => provider.key);
  const dormantProviders = providers.filter((provider) => provider.current.records === 0 && provider.previous.records > 0).map((provider) => provider.key);
  const proof = { verified, highConfidence, lowProof, sources };
  const comparison: UsageComparison = {
    schema: "vibetracker.usage-compare/1.0",
    generatedAt: asOf.toISOString(),
    windowDays: days,
    currentRange: { from: new Date(currentStart).toISOString(), to: asOf.toISOString(), bounds: "inclusive" },
    previousRange: { from: new Date(previousStart).toISOString(), to: new Date(currentStart).toISOString(), bounds: "from-inclusive-to-exclusive" },
    current,
    previous,
    delta: metricDelta,
    providers,
    categories,
    proof,
    newProviders,
    dormantProviders,
    actions: [],
    privacy: {
      usageReadOnly: true,
      usageWrites: 0,
      uploads: 0,
      excludes: ["prompts", "outputs", "secrets", "media", "credential values"],
      estimateNotice: "All USD values are labelled best-effort estimates; native units remain the source of truth.",
      trustNotice: "Activity trust signals are separate NOT USAGE context and are excluded from this comparison.",
    },
  };
  comparison.actions = actionsFor(comparison);
  return comparison;
}

function signed(value: number, suffix = ""): string {
  return `${value > 0 ? "+" : ""}${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}${suffix}`;
}

function deltaLabel(value: CompareDelta, money = false): string {
  const amount = money ? `${value.amount > 0 ? "+" : value.amount < 0 ? "-" : ""}$${Math.abs(value.amount).toFixed(2)}~` : signed(value.amount);
  return `${amount} (${value.pct === null ? value.state.toUpperCase() : signed(value.pct, "%")})`;
}

function row(value: string): string {
  return value.length > 78 ? `${value.slice(0, 75)}...` : value;
}

function rangeLabel(value: { from: string; to: string }): string {
  const date = (iso: string) => new Date(iso).toISOString().slice(0, 10);
  return `${date(value.from)} -> ${date(value.to)}`;
}

export function renderUsageComparison(comparison: UsageComparison): string {
  const lines = [
    "VTK://USAGE-COMPARE//LOCAL-LEDGER//READ-ONLY",
    "=".repeat(78),
    row(`CURRENT  ${rangeLabel(comparison.currentRange)}  |  ${comparison.windowDays} DAYS`),
    row(`PREVIOUS ${rangeLabel(comparison.previousRange)}  |  IMMEDIATELY PRECEDING`),
    "-".repeat(78),
    row(`USD ESTIMATE  $${comparison.current.usdEst.toFixed(2)}~ vs $${comparison.previous.usdEst.toFixed(2)}~  ${deltaLabel(comparison.delta.usdEst, true)}`),
    row(`OPERATIONS    ${comparison.current.ops.toLocaleString("en-US")} vs ${comparison.previous.ops.toLocaleString("en-US")}  ${deltaLabel(comparison.delta.ops)}`),
    row(`RECORDS       ${comparison.current.records.toLocaleString("en-US")} vs ${comparison.previous.records.toLocaleString("en-US")}  ${deltaLabel(comparison.delta.records)}`),
    row(`CREDITS       ${comparison.current.credits.toLocaleString("en-US")} vs ${comparison.previous.credits.toLocaleString("en-US")}  ${deltaLabel(comparison.delta.credits)}`),
    "-".repeat(78),
    "PROVIDER SHIFTS (current / previous / USD estimate delta)",
    ...comparison.providers.slice(0, 8).map((provider) => row(`  ${provider.key.padEnd(20)} ${String(provider.current.ops).padStart(10)} / ${String(provider.previous.ops).padStart(10)} / ${deltaLabel(provider.usdDelta, true)}`)),
    "-".repeat(78),
    row(`PROOF  verified ${comparison.proof.verified.current.sharePct.toFixed(1)}% vs ${comparison.proof.verified.previous.sharePct.toFixed(1)}% (${signed(comparison.proof.verified.sharePointDelta, "pt")})`),
    row(`       high confidence ${comparison.proof.highConfidence.current.sharePct.toFixed(1)}% vs ${comparison.proof.highConfidence.previous.sharePct.toFixed(1)}% (${signed(comparison.proof.highConfidence.sharePointDelta, "pt")})`),
    row(`       low proof ${comparison.proof.lowProof.current.sharePct.toFixed(1)}% vs ${comparison.proof.lowProof.previous.sharePct.toFixed(1)}% (${signed(comparison.proof.lowProof.sharePointDelta, "pt")})`),
    "-".repeat(78),
    "ACTIONS",
    ...comparison.actions.map((action) => row(`  [${action.level.toUpperCase()}] ${action.label}: ${action.command}`)),
    "-".repeat(78),
    "USD: estimate only; native units remain source of truth.",
    "PRIVACY: excludes prompts, outputs, secrets, media, credential values.",
    "TRUST: separate NOT USAGE context. USAGE WRITES: 0. UPLOADS: 0.",
  ];
  return lines.map(row).join("\n");
}
