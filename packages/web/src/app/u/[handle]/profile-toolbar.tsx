"use client";

// "My Tools" dock (user orders 2026-07-19): every tracked tool as a logo chip; CLICKING a chip
// unfolds a statement panel beneath the rail — the viber's own words about that tool when they
// have left some, otherwise a clear general description — plus that tool's measured stats.
// Clicking through chips swaps the panel content in place; clicking the active chip folds it.
// The unfold is a pure CSS grid-rows spring (transform/opacity only, reduced-motion aware).

import { useState } from "react";

// Per-tool DEEP STATS: the tool's real footprint, every value aggregated in page.tsx from data
// ALREADY loaded on the profile (providerDays + providerModels + nativeMetrics) — no fetch, no new
// backend, nothing fabricated. Any field that is absent renders nothing.
export interface DeepStats {
  ops: number;
  usd: number;
  activeDays: number;
  firstDay: string | null;
  lastDay: string | null;
  topModel: string | null;
  models: number;
  daily: Array<{ day: string; ops: number }>;
  // pre-formatted native-outputs line (built with the shared native-counts formatter), when present
  nativeCounts?: string;
}

export interface DockBrand {
  id: string;
  label: string;
  mark: string;
  from: string;
  logo?: string;
  // the viber's own statement about this tool (authoring UI ships next); fallback = description
  statement?: string;
  blurb: string;
  stats?: { ops: number; credits: number; usd: number };
  deep?: DeepStats;
}

function fmtInt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}
function fmtUsd(n: number): string {
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`;
}

const DOCK_MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtMonthYear(iso: string): string {
  const m = /^(\d{4})-(\d{2})/.exec(iso);
  return m ? `${DOCK_MON[Number(m[2]) - 1]} ${m[1]}` : iso;
}
function fmtDayShort(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return iso === new Date().toISOString().slice(0, 10) ? "today" : `${DOCK_MON[Number(m[2]) - 1]} ${Number(m[3])}`;
}

// 90-day ops sparkline: a bare 2px polyline in the existing mint accent, no axes/dots, decorative
// (aria-hidden). Rendered only with 2+ day-points that carry at least one operation.
function DockSparkline({ daily }: { daily: DeepStats["daily"] }) {
  if (daily.length < 2 || !daily.some((d) => d.ops > 0)) return null;
  const w = 220, h = 36, pad = 2;
  const max = Math.max(...daily.map((d) => d.ops), 1);
  const points = daily
    .map((d, i) => `${((i / (daily.length - 1)) * w).toFixed(1)},${(pad + (1 - d.ops / max) * (h - pad * 2)).toFixed(1)}`)
    .join(" ");
  return (
    <svg className="vtooldock-spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke="rgba(46, 232, 214, 0.6)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// The per-tool numbers beside the statement: a 3×2 grid of measured facts, the ops sparkline, and
// the native-outputs line. Suppressed entirely for a tool with no measured operations or spend.
function DockDeep({ deep }: { deep: DeepStats }) {
  if (deep.ops <= 0 && deep.usd <= 0) return null;
  const cells: Array<{ k: string; v: string }> = [
    { k: "ops", v: fmtInt(deep.ops) },
    ...(deep.usd > 0 ? [{ k: "api-eq", v: fmtUsd(deep.usd) }] : []),
    { k: "active days", v: fmtInt(deep.activeDays) },
    ...(deep.firstDay ? [{ k: "first used", v: fmtMonthYear(deep.firstDay) }] : []),
    ...(deep.lastDay ? [{ k: "last used", v: fmtDayShort(deep.lastDay) }] : []),
    ...(deep.topModel ? [{ k: "top model", v: deep.topModel }] : []),
  ];
  return (
    <div className="vtooldock-deep">
      <dl className="vtooldock-grid">
        {cells.map((c) => (
          <div className="vtooldock-cell" key={c.k}>
            <dt>{c.k}</dt>
            <dd>{c.v}</dd>
          </div>
        ))}
      </dl>
      <DockSparkline daily={deep.daily} />
      {deep.nativeCounts ? <p className="vtooldock-native">{deep.nativeCounts}</p> : null}
    </div>
  );
}

// `defaultActiveId` only seeds the initially-open chip (the useState initial value); omitting it
// keeps the dock folded on mount exactly as before. It exists so the panel can be rendered in an
// open state without a click (server render, tests) — it never changes the click behaviour.
export function ToolbarDock({ brands, handle, defaultActiveId }: { brands: DockBrand[]; handle?: string; defaultActiveId?: string }) {
  const [activeId, setActiveId] = useState<string | null>(defaultActiveId ?? null);
  if (!brands.length) return null;
  const active = brands.find((b) => b.id === activeId) ?? null;

  return (
    <div className="vtooldock">
      <div className="vtoolbar" role="list" aria-label="AI toolset — every tool tracked on this profile">
        <b className="vtoolbar-title" aria-hidden="true">My Tools:</b>
        {brands.map((b, i) => (
          <button
            type="button"
            className="vtoolbar-item"
            role="listitem"
            key={b.id}
            data-active={b.id === activeId ? "true" : undefined}
            style={{ "--i": i } as React.CSSProperties}
            onClick={() => setActiveId((cur) => (cur === b.id ? null : b.id))}
            aria-pressed={b.id === activeId}
            title={`${b.label} — ${b.blurb} Click to unfold this tool's story and stats.`}
          >
            {b.logo
              ? <img src={b.logo} alt={b.label} loading="lazy" />
              : <i style={{ background: b.from }} aria-hidden="true">{b.mark}</i>}
          </button>
        ))}
      </div>
      <div className="vtooldock-panel" data-open={active ? "true" : undefined} aria-live="polite">
        {active ? (
          <div className="vtooldock-card" key={active.id}>
            <div className="vtooldock-head">
              {active.logo
                ? <img src={active.logo} alt="" />
                : <i style={{ background: active.from }} aria-hidden="true">{active.mark}</i>}
              <b>{active.label}</b>
              {active.stats && (active.stats.ops > 0 || active.stats.usd > 0) ? (
                <span className="vtooldock-stats">
                  {fmtInt(active.stats.ops)} ops
                  {active.stats.credits > 0 ? ` · ${fmtInt(active.stats.credits)} cr` : ""}
                  {active.stats.usd > 0 ? ` · ${fmtUsd(active.stats.usd)} API-eq` : ""}
                </span>
              ) : null}
            </div>
            <div className="vtooldock-body">
              <div className="vtooldock-say">
                <p className="vtooldock-text">{active.statement ?? active.blurb}</p>
                {active.statement ? (
                  handle ? <p className="vtooldock-byline">— @{handle}</p> : null
                ) : (
                  <p className="vtooldock-hint">no personal statement yet — the profile owner can add one: vibetracker statement &lt;tool-id&gt;</p>
                )}
              </div>
              {active.deep ? <DockDeep deep={active.deep} /> : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
