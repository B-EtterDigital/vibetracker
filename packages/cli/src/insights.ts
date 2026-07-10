import type { UsageInsights } from "../../core/src/analytics/insights.ts";
import { formatTable, money } from "./format.ts";
import { renderMissionStrip } from "./mission-strip.ts";
import { providerBrand } from "./provider-brand.ts";

const frameWidth = 66;
const contentWidth = frameWidth - 4;

function fit(text: string, width = contentWidth): string {
  return text.length > width ? `${text.slice(0, Math.max(0, width - 1))}…` : text.padEnd(width);
}

function frameLine(text: string): string {
  return `| ${fit(text)} |`;
}

function bar(value: number, max: number, width = 18): string {
  if (value <= 0 || max <= 0) return "░".repeat(width);
  const filled = Math.max(1, Math.round((value / max) * width));
  return "█".repeat(Math.min(width, filled)) + "░".repeat(Math.max(0, width - filled));
}

function rangeLabel(insights: UsageInsights): string {
  return insights.range.from ? `${insights.range.from.slice(0, 10)} → ${insights.range.to?.slice(0, 10)}` : "no records";
}

function workflowProvider(key?: string): string | undefined {
  return key?.split("/")[0];
}

function brandWorkflow(key?: string): string {
  if (!key) return "none yet";
  const provider = workflowProvider(key) ?? key;
  const brand = providerBrand(provider);
  return `[${brand.mark}] ${key} · ${brand.from}->${brand.to}`;
}

function monthSignal(insights: UsageInsights): string {
  const rows = insights.monthly.slice(-6);
  if (!rows.length) return "no monthly signal yet";
  const max = Math.max(...rows.map((row) => row.usd));
  return rows.map((row) => `${row.period}:${bar(row.usd, max, 4)}`).join(" ");
}

function budgetLine(insights: UsageInsights): string {
  if (!insights.budget) return "budget unset · run insights --budget N for burn radar";
  const status = insights.budget.status.toUpperCase();
  const pct = Math.round(insights.budget.projectedRatio * 100);
  return `${status} ${money(insights.forecast.projected30dUsd)} / ${money(insights.budget.usd)} projected · ${pct}%`;
}

function burnCompass(insights: UsageInsights): string {
  if (!insights.budget) return "burn compass budget unset · forecast-only mode";
  const status = insights.budget.status.toUpperCase();
  const daily = insights.forecast.dailyAvgUsd;
  if (daily <= 0) return `burn compass ${status} · no daily burn detected`;
  const days = Math.floor(insights.budget.usd / daily);
  const max = Math.max(insights.forecast.projected30dUsd, insights.budget.usd);
  return `burn compass ${status} · ${days}d budget runway ${bar(insights.forecast.projected30dUsd, max, 12)}`;
}

function cheapestLine(insights: UsageInsights): string {
  const row = insights.cheapest[0];
  if (!row) return "no equivalent-provider evidence yet";
  const brand = providerBrand(row.provider);
  return `[${brand.mark}] ${row.category} via ${brand.label} at ${money(row.avgUsdPerRecord)}/op`;
}

function workflowConstellation(insights: UsageInsights): string[] {
  const rows = insights.expensiveWorkflows.slice(0, 3);
  if (!rows.length) return [frameLine("workflow constellation waiting for priced workflows")];
  const max = Math.max(...rows.map((row) => row.usd));
  return [
    frameLine("workflow constellation: hot spend nodes"),
    ...rows.map((row) => {
      const brand = providerBrand(workflowProvider(row.key) ?? row.key);
      return frameLine(`[${brand.mark}] ${row.key} ${money(row.usd)} ${bar(row.usd, max, 10)}`);
    }),
  ];
}

function actionRail(insights: UsageInsights): string {
  const cheapest = insights.cheapest[0];
  if (insights.alerts.length && cheapest) {
    const brand = providerBrand(cheapest.provider);
    return `action rail: swap ${cheapest.category} to [${brand.mark}] or cap budget`;
  }
  if (insights.localSavingsUsd > 0) return "action rail: keep local wins visible before upload";
  if (!insights.budget) return "action rail: rerun with --budget for burn guard";
  return "action rail: dry-run upload when numbers look right";
}

function budgetGate(insights: UsageInsights): string {
  if (!insights.budget) return "FORECAST · add --budget to arm spend gate";
  const status = insights.budget.status.toUpperCase();
  if (insights.budget.status === "over") return `${status} · cap spend before profile publish`;
  if (insights.budget.status === "near") return `${status} · review expensive workflows first`;
  return `${status} · dry-run publish allowed after review`;
}

function runwayLine(insights: UsageInsights): string {
  const daily = insights.forecast.dailyAvgUsd;
  if (!insights.budget) return `runway forecast-only · ${money(daily)}/day observed`;
  if (daily <= 0) return `runway quiet · ${money(insights.budget.usd)} budget untouched`;
  const days = Math.floor(insights.budget.usd / daily);
  return `runway ${days}d at ${money(daily)}/day · 30d ${money(insights.forecast.projected30dUsd)}`;
}

function switchCandidate(insights: UsageInsights): string {
  const cheapest = insights.cheapest[0];
  if (!cheapest) return "switch rail no overlap evidence yet";
  const brand = providerBrand(cheapest.provider);
  return `switch rail ${cheapest.category} -> [${brand.mark}] ${brand.label} ${money(cheapest.avgUsdPerRecord)}/op`;
}

function renderEconomyReactor(insights: UsageInsights): string {
  const projected = insights.forecast.projected30dUsd;
  const budget = insights.budget?.usd ?? projected;
  const max = Math.max(projected, budget, insights.localSavingsUsd, 1);
  return [
    "+----------------------------------------------------------------+",
    frameLine("VTK://ECONOMY-REACTOR//USAGE-ONLY//NO-TRUST-SPEND"),
    "|----------------------------------------------------------------|",
    frameLine("money radar uses usage rows only; trust/context stays outside"),
    frameLine(`budget gate ${budgetGate(insights)} ${bar(projected, max, 10)}`),
    frameLine(runwayLine(insights)),
    frameLine(switchCandidate(insights)),
    frameLine(`local shadow ${money(insights.localSavingsUsd)} saved locally ${bar(insights.localSavingsUsd, max, 10)}`),
    frameLine(`hot node ${brandWorkflow(insights.expensiveWorkflows[0]?.key)}`),
    frameLine("publish gate dry-run -> secret scan -> c0vibe.app"),
    frameLine("no prompts, outputs, secrets, or trust metrics enter spend"),
    "+----------------------------------------------------------------+",
  ].join("\n");
}

function renderInsightDeck(insights: UsageInsights): string {
  const projected = insights.forecast.projected30dUsd;
  const budgetMax = insights.budget?.usd ?? projected;
  const burnBar = bar(projected, Math.max(projected, budgetMax));
  return [
    "+----------------------------------------------------------------+",
    frameLine("VTK://INSIGHT-DECK//VIBERS-UNITE//C0VIBE.APP"),
    "|----------------------------------------------------------------|",
    frameLine(`range ${rangeLabel(insights)} · generated ${insights.generatedAt.slice(0, 10)}`),
    frameLine(`forecast ${money(insights.forecast.dailyAvgUsd)}/day · 30d ${money(projected)} ${burnBar}`),
    frameLine(`burn ${budgetLine(insights)}`),
    frameLine(burnCompass(insights)),
    frameLine(`local savings ${money(insights.localSavingsUsd)} · ROI evidence stays local-first`),
    frameLine(`expensive workflow ${brandWorkflow(insights.expensiveWorkflows[0]?.key)}`),
    ...workflowConstellation(insights),
    frameLine(`overlap radar ${insights.overlaps.length} categories · cheapest ${cheapestLine(insights)}`),
    frameLine(actionRail(insights)),
    frameLine(`monthly signal ${monthSignal(insights)}`),
    frameLine("privacy: dry-run before publish · trust signals are not usage"),
    "+----------------------------------------------------------------+",
  ].join("\n");
}

function tableOrNone(headers: string[], rows: string[][]): string {
  return rows.length ? formatTable(headers, rows) : "  (none)";
}

function insightOps(insights: UsageInsights): number {
  return insights.daily.reduce((sum, row) => sum + row.records, 0);
}

function insightProviders(insights: UsageInsights): number {
  const providers = new Set<string>();
  for (const row of insights.expensiveWorkflows) {
    const provider = workflowProvider(row.key);
    if (provider) providers.add(provider);
  }
  for (const row of insights.overlaps) for (const provider of row.providers) providers.add(provider);
  for (const row of insights.cheapest) providers.add(row.provider);
  return providers.size;
}

function insightTopProvider(insights: UsageInsights): string | undefined {
  return workflowProvider(insights.expensiveWorkflows[0]?.key)
    ?? insights.cheapest[0]?.provider
    ?? insights.overlaps[0]?.providers[0];
}

export function renderInsights(insights: UsageInsights): string {
  const weeklyRows = insights.weekly.slice(-8).map((row) => [
    row.period,
    String(row.records),
    money(row.usd),
  ]);
  const expensiveRows = insights.expensiveWorkflows.slice(0, 8).map((row) => [
    row.key,
    String(row.records),
    money(row.usd),
  ]);
  const overlapRows = insights.overlaps.slice(0, 8).map((row) => [
    row.category,
    row.providers.join(", "),
  ]);
  const cheapestRows = insights.cheapest.slice(0, 8).map((row) => [
    row.category,
    row.provider,
    money(row.avgUsdPerRecord),
  ]);
  const alerts = insights.alerts.length ? insights.alerts.map((a) => `  - ${a}`).join("\n") : "  (none)";
  return [
    renderMissionStrip({
      surface: "insights",
      title: "Insight command relay",
      ops: insightOps(insights),
      providers: insightProviders(insights),
      credits: 0,
      usd: insights.forecast.projected30dUsd,
      spendLabel: "30d forecast",
      localSavingsUsd: insights.localSavingsUsd,
      topProvider: insightTopProvider(insights),
      range: rangeLabel(insights),
      next: "vibetracker upload --dry-run -> c0vibe.app profile",
      empty: !insights.daily.length,
    }),
    renderInsightDeck(insights),
    "",
    renderEconomyReactor(insights),
    "",
    "VIBETRACKER INSIGHTS",
    rangeLabel(insights),
    "",
    "Forecast",
    `  trailing ${insights.forecast.trailingDays}d avg: ${money(insights.forecast.dailyAvgUsd)} / day`,
    `  projected 30d spend: ${money(insights.forecast.projected30dUsd)}`,
    `  local savings observed: ${money(insights.localSavingsUsd)}`,
    "",
    "Burn alerts",
    alerts,
    "",
    "Weekly trend",
    tableOrNone(["WEEK", "OPS", "USD~"], weeklyRows),
    "",
    "Most expensive workflows",
    tableOrNone(["WORKFLOW", "OPS", "USD~"], expensiveRows),
    "",
    "Provider overlap",
    tableOrNone(["CATEGORY", "PROVIDERS"], overlapRows),
    "",
    "Cheapest observed provider by category",
    tableOrNone(["CATEGORY", "CHEAPEST OBSERVED", "AVG USD/OP"], cheapestRows),
  ].join("\n");
}
