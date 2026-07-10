// `vibetracker total` — render merged usage as tables. Pure: takes records, returns text.

import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import { aggregate, totals, type AggRow, type GroupBy } from "../../../core/src/aggregate.ts";
import { formatTable, money } from "../format.ts";
import { renderMissionStrip } from "../mission-strip.ts";
import { providerBrand } from "../provider-brand.ts";

const frameWidth = 58;
const contentWidth = frameWidth - 4;

function fit(text: string, width = contentWidth): string {
  return text.length > width ? `${text.slice(0, Math.max(0, width - 1))}…` : text.padEnd(width);
}

function frameLine(text: string): string {
  return `| ${fit(text)} |`;
}

function usageBar(value: number, max: number, width = 18): string {
  if (max <= 0 || value <= 0) return "░".repeat(width);
  const filled = Math.max(1, Math.round((value / max) * width));
  return "█".repeat(Math.min(width, filled)) + "░".repeat(Math.max(0, width - filled));
}

function sourceMix(records: NormalizedRecord[]): string {
  const counts = new Map<string, number>();
  for (const record of records) counts.set(record.source, (counts.get(record.source) ?? 0) + 1);
  const parts = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 4)
    .map(([source, count]) => `${source}:${count}`);
  return parts.length ? parts.join("  ") : "none yet";
}

function providerOrbit(rows: AggRow[]): string[] {
  if (!rows.length) return [frameLine("provider orbit no providers yet")];
  const maxRaw = Math.max(0, ...rows.map((row) => row.raw));
  return [
    frameLine("provider orbit: branded usage signals"),
    ...rows.slice(0, 4).map((row) => {
      const brand = providerBrand(row.key);
      const spend = row.usd != null ? money(row.usd) : `${row.count} ops`;
      return frameLine(`[${brand.mark}] ${brand.label} ${spend} ${usageBar(row.raw, maxRaw, 10)}`);
    }),
  ];
}

function categoryMix(records: NormalizedRecord[]): string[] {
  const rows = aggregate(records, "category");
  if (!rows.length) return [frameLine("category mix waiting for usage records")];
  const maxRaw = Math.max(0, ...rows.map((row) => row.raw));
  return [
    frameLine("category mix: all AI work, not only coders"),
    ...rows.slice(0, 3).map((row) => frameLine(`${fit(row.key, 14)} ${usageBar(row.raw, maxRaw, 12)} ${row.count} ops`)),
  ];
}

function confidenceSummary(records: NormalizedRecord[]): string {
  const counts = new Map<string, number>([
    ["high", 0],
    ["medium", 0],
    ["low", 0],
  ]);
  for (const record of records) counts.set(record.confidence, (counts.get(record.confidence) ?? 0) + 1);
  const verified = records.filter((record) => record.verified).length;
  return `confidence high:${counts.get("high")} medium:${counts.get("medium")} low:${counts.get("low")} verified:${verified}`;
}

function renderUsageCockpit(records: NormalizedRecord[], by: GroupBy, rows: AggRow[]): string {
  const t = totals(records);
  const byProvider = aggregate(records, "provider");
  const top = byProvider[0];
  const maxRaw = Math.max(0, ...rows.map((row) => row.raw));
  const localish = records.filter((record) => ["local", "log", "proxy"].includes(record.source)).length;
  const verified = records.filter((record) => record.verified).length;
  const leader = top ? `${top.key} ${top.count} ops ${money(top.usd)}` : "no provider yet";
  const activeRows = rows.slice(0, 3).map((row) => `${fit(row.key, 18)} ${usageBar(row.raw, maxRaw)} ${row.count} ops`);
  return [
    "+------------------------------------------------------+",
    frameLine("VTK://USAGE-CORE//VIBERS-UNITE//C0VIBE.APP"),
    "|------------------------------------------------------|",
    frameLine(`${t.count} ops · ${t.providers} providers · ${t.credits} credits · ${t.usd != null ? `${money(t.usd)} est` : "no USD est"}`),
    frameLine(`top provider ${leader}`),
    frameLine(`local/proxy/log ${localish} · verified ${verified} · grouped by ${by}`),
    frameLine(`source mix ${sourceMix(records)}`),
    ...providerOrbit(byProvider),
    ...categoryMix(records),
    frameLine(confidenceSummary(records)),
    frameLine("GitHub/Codex trust rail: NOT USAGE"),
    frameLine("upload path: dry-run before c0vibe.app publish"),
    frameLine("trust signals stay labelled separately · not usage"),
    "|------------------------------------------------------|",
    ...(activeRows.length ? activeRows.map(frameLine) : [frameLine("no usage records yet · run vibetracker init --gui")]),
    "+------------------------------------------------------+",
  ].join("\n");
}

export function renderTotal(records: NormalizedRecord[], by: GroupBy = "model"): string {
  const t = totals(records);
  const aggregated = aggregate(records, by);
  const byProvider = aggregate(records, "provider");
  const localSavingsUsd = Number(records.filter((record) => record.source === "local").reduce((sum, record) => sum + (record.usdEst ?? 0), 0).toFixed(2));
  const rows = aggregated.map((r) => [
    r.key,
    String(r.count),
    r.credits ? String(r.credits) : "—",
    money(r.usd),
  ]);
  const table = formatTable(["" + by.toUpperCase(), "OPS", "CREDITS", "USD~"], rows);
  const summary =
    `${t.count} operations · ${t.providers} provider(s) · ${t.credits} credits` +
    (t.usd != null ? ` · ~${money(t.usd)} (est)` : "");
  return [
    renderMissionStrip({
      surface: "total",
      title: "Usage command relay",
      ops: t.count,
      providers: t.providers,
      credits: t.credits,
      usd: t.usd,
      localSavingsUsd,
      topProvider: byProvider[0]?.key,
      range: `grouped by ${by}`,
      next: "vibetracker stats -> insights -> upload --dry-run",
      empty: records.length === 0,
    }),
    renderUsageCockpit(records, by, aggregated),
    "",
    table,
    "",
    `TOTAL: ${summary}`,
  ].join("\n");
}
