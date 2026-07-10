// `vibetracker stats` renderer — breakdowns across every dimension.

import type { Stats } from "../../../core/src/stats.ts";
import type { AggRow } from "../../../core/src/aggregate.ts";
import { formatTable, money } from "../format.ts";
import { renderMissionStrip } from "../mission-strip.ts";
import { providerBrand } from "../provider-brand.ts";

const frameWidth = 62;
const contentWidth = frameWidth - 4;

function fit(text: string, width = contentWidth): string {
  return text.length > width ? `${text.slice(0, Math.max(0, width - 1))}…` : text.padEnd(width);
}

function frameLine(text: string): string {
  return `| ${fit(text)} |`;
}

function bar(value: number, max: number, width = 16): string {
  if (value <= 0 || max <= 0) return "░".repeat(width);
  const filled = Math.max(1, Math.round((value / max) * width));
  return "█".repeat(Math.min(width, filled)) + "░".repeat(Math.max(0, width - filled));
}

function leader(rows: AggRow[], fallback: string): string {
  const top = rows[0];
  return top ? `${top.key} ${top.count} ops ${money(top.usd)}` : fallback;
}

function dayStrip(rows: AggRow[]): string {
  const days = rows.slice(-14);
  if (!days.length) return "no day history yet";
  const max = Math.max(...days.map((row) => row.raw));
  return days.map((row) => bar(row.raw, max, 3)).join(" ");
}

function heatCell(raw: number, max: number): string {
  if (raw <= 0 || max <= 0) return "·";
  const ratio = raw / max;
  if (ratio <= 0.25) return "░";
  if (ratio <= 0.5) return "▒";
  if (ratio <= 0.75) return "▓";
  return "█";
}

function usageHeatline(rows: AggRow[]): string[] {
  const days = rows.slice(-14);
  if (!days.length) {
    return [
      frameLine("GitHub-scale heatline waiting for daily usage"),
      frameLine("legend · none ░ low ▒ medium ▓ high █ peak"),
      frameLine("heatline is USAGE ONLY; trust rails never light cells"),
    ];
  }
  const max = Math.max(...days.map((row) => row.raw));
  const cells = days.map((row) => heatCell(row.raw, max)).join(" ");
  const labels = days.map((row) => row.key.slice(5).replace("-", "/")).join(" ");
  const ops = days.reduce((sum, row) => sum + row.count, 0);
  const usd = days.reduce((sum, row) => sum + (row.usd ?? 0), 0);
  return [
    frameLine("GitHub-scale heatline: daily usage rhythm"),
    frameLine(`days ${labels}`),
    frameLine(`heat ${cells}  ${ops} ops ${money(Number(usd.toFixed(2)))}`),
    frameLine("legend · none ░ low ▒ medium ▓ high █ peak"),
    frameLine("heatline is USAGE ONLY; trust rails never light cells"),
  ];
}

function providerRace(rows: AggRow[]): string[] {
  if (!rows.length) return [frameLine("provider race waiting for usage")];
  const max = Math.max(...rows.map((row) => row.raw));
  return [
    frameLine("provider race: branded spend and volume"),
    ...rows.slice(0, 3).map((row) => {
      const brand = providerBrand(row.key);
      const score = row.usd != null ? money(row.usd) : `${row.count} ops`;
      return frameLine(`[${brand.mark}] ${brand.label} ${score} ${bar(row.raw, max, 10)}`);
    }),
  ];
}

function scopedCount(rows: AggRow[]): number {
  return rows.filter((row) => row.key !== "(unscoped)").length;
}

function scopedLead(rows: AggRow[], label: string): string {
  const top = rows.find((row) => row.key !== "(unscoped)") ?? rows[0];
  if (!top) return `${label} none yet`;
  return `${label} ${top.key} ${top.count} ops ${money(top.usd)}`;
}

function scopeRail(s: Stats): string[] {
  const active = scopedCount(s.byAccount) + scopedCount(s.byProfile) + scopedCount(s.byTeam);
  if (!active) {
    return [
      frameLine("scope rail waiting: add --account --profile --team"),
      frameLine("multi-account/team split lights when scoped"),
    ];
  }
  return [
    frameLine(`scope rail accounts:${scopedCount(s.byAccount)} profiles:${scopedCount(s.byProfile)} teams:${scopedCount(s.byTeam)}`),
    frameLine(scopedLead(s.byAccount, "account lead")),
    frameLine(scopedLead(s.byProfile, "profile lead")),
    frameLine(scopedLead(s.byTeam, "team lead")),
    frameLine("team/org separation is USAGE ONLY; trust stays sidecar"),
  ];
}

function laneRadar(rows: AggRow[]): string {
  const sum = (keys: string[]) => rows
    .filter((row) => keys.includes(row.key))
    .reduce((total, row) => total + row.count, 0);
  const creator = sum(["image", "video", "music", "audio", "3d"]);
  const builder = sum(["llm", "coding"]);
  const ops = sum(["other"]);
  return `viber lanes creator:${creator} builder:${builder} ops:${ops}`;
}

function renderStatsDeck(s: Stats, range: string, head: string): string {
  const t = s.totals;
  return [
    "+----------------------------------------------------------+",
    frameLine("VTK://STATS-DECK//VIBERS-UNITE//C0VIBE.APP"),
    "|----------------------------------------------------------|",
    frameLine(`range ${range}`),
    frameLine(head),
    frameLine(`provider lead ${leader(s.byProvider, "none yet")}`),
    frameLine(`category lead ${leader(s.byCategory, "none yet")}`),
    frameLine(`model lead ${leader(s.topModels, "none yet")}`),
    ...providerRace(s.byProvider),
    ...scopeRail(s),
    frameLine(laneRadar(s.byCategory)),
    frameLine("all AI work counts: creator + builder + local + infra"),
    frameLine(`local savings ${money(s.localSavingsUsd)} · providers ${t.providers}`),
    ...usageHeatline(s.byDay),
    frameLine(`14d signal ${dayStrip(s.byDay)}`),
    frameLine("privacy: local ledger first · publish only after dry-run"),
    "+----------------------------------------------------------+",
  ].join("\n");
}

function tbl(title: string, rows: AggRow[]): string {
  if (!rows.length) return `\n${title}\n  (none)`;
  const body = formatTable(
    ["", "OPS", "CREDITS", "USD~"],
    rows.map((r) => [r.key, String(r.count), r.credits ? String(r.credits) : "—", money(r.usd)]),
  );
  return `\n${title}\n${body}`;
}

export function renderStats(s: Stats): string {
  const t = s.totals;
  const range = s.range.from ? `${s.range.from.slice(0, 10)} → ${s.range.to!.slice(0, 10)}` : "no data";
  const head =
    `${t.count} ops · ${t.providers} provider(s) · ${t.credits} credits` +
    (t.usd != null ? ` · ~${money(t.usd)} (est)` : "") +
    (s.localSavingsUsd ? ` · local-equiv ~${money(s.localSavingsUsd)} saved` : "");
  return [
    renderMissionStrip({
      surface: "stats",
      title: "Stats command relay",
      ops: t.count,
      providers: t.providers,
      credits: t.credits,
      usd: t.usd,
      localSavingsUsd: s.localSavingsUsd,
      topProvider: s.byProvider[0]?.key,
      range,
      next: "vibetracker insights --budget <usd> -> profile",
      empty: t.count === 0,
    }),
    renderStatsDeck(s, range, head),
    "",
    `USAGE STATS  (${range})`,
    head,
    tbl("By provider", s.byProvider),
    tbl("By category", s.byCategory),
    tbl("By account", s.byAccount),
    tbl("By profile", s.byProfile),
    tbl("By team/org", s.byTeam),
    tbl("Top models", s.topModels.slice(0, 8)),
    tbl("By day (last 14)", s.byDay.slice(-14)),
  ].join("\n");
}
