"use client";

// The profile's interactive usage chart. One hero surface, several lenses:
//   - "All"        — the combined usd/day total (teal), the overall signal.
//   - a provider   — click a brand chip and its own daily curve loads here, in its brand colour.
//   - "All together" — every source in one picture, as either a clean FLAT stacked area or a real
//                      3D scene: brand-coloured ribbons floating on separate planes in perspective,
//                      so every source is visible and none is hidden. No outline strokes anywhere —
//                      separation is carried by fill, gradient and depth, never a cheap stroke.
// Each lens plots the metric that source actually carries: USD for spend-bearing coding sources,
// ops/day for a flat-fee media source. Dates parse deterministically from "YYYY-MM-DD" so server
// and hydrated markup match. The vertical scale is a nice-rounded linear domain with gridlines.

import { useMemo, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react";
import { formatInt, formatUsd } from "../../../lib/leaderboard";

export interface ChartDay {
  date: string;
  ops: number;
  credits: number;
  usd: number;
}

export interface ProviderSeries {
  id: string;
  label: string;
  color: string;
  days: ChartDay[];
}

type Range = "30d" | "90d" | "all";
type Metric = "usd" | "credits" | "ops";
type View = "all" | "stacked" | { provider: string };

const RANGES: Range[] = ["30d", "90d", "all"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 86_400_000;
const VW = 1000;
const VH = 240;
const TOP = 14;
const BASE = 226;
const COMBINED_COLOR = "#2ee8d6";

function shortDate(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  return m ? `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}` : date;
}
const toStamp = (date: string): number => Date.parse(`${date}T00:00:00Z`);
const toDate = (stamp: number): string => new Date(stamp).toISOString().slice(0, 10);

function niceStep(value: number): number {
  if (value <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  const n = value / pow;
  const s = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return s * pow;
}
const valueAt = (d: ChartDay, m: Metric): number => (m === "usd" ? d.usd : m === "credits" ? d.credits : d.ops);
const USD_STORY_FLOOR = 10;
function metricOf(totalUsd: number, totalOps: number, totalCredits: number): Metric {
  if (totalUsd >= USD_STORY_FLOOR) return "usd";
  if (totalOps > 0) return "ops";
  if (totalCredits > 0) return "credits";
  return "ops";
}
const unitLabel = (m: Metric): string => (m === "usd" ? "USD per day" : m === "credits" ? "credits per day" : "ops per day");
// Centered moving average — turns spiky daily bars into smooth ribbons so the layers read clean.
function smooth(values: number[], window: number): number[] {
  if (window <= 1) return values;
  const half = Math.floor(window / 2);
  return values.map((_v, i) => {
    const lo = Math.max(0, i - half);
    const hi = Math.min(values.length - 1, i + half);
    let sum = 0;
    for (let j = lo; j <= hi; j += 1) sum += values[j];
    return sum / (hi - lo + 1);
  });
}
function viewKey(view: View): string {
  return view === "all" || view === "stacked" ? view : `p:${view.provider}`;
}

export function ProfileUsageChart({ days, providers = [] }: { days: ChartDay[]; providers?: ProviderSeries[] }) {
  const [range, setRange] = useState<Range>("all");
  const [view, setView] = useState<View>("all");
  const [threeD, setThreeD] = useState(true);
  const [active, setActive] = useState<number | null>(null);

  const model = useMemo(() => {
    const valid = days.filter((d) => Number.isFinite(toStamp(d.date)));
    if (!valid.length) return null;
    const sorted = valid.slice().sort((a, b) => (a.date < b.date ? -1 : 1));
    const end = toStamp(sorted[sorted.length - 1].date);
    const start = range === "all" ? toStamp(sorted[0].date) : end - (range === "30d" ? 29 : 89) * DAY_MS;
    const axis: string[] = [];
    for (let t = start; t <= end; t += DAY_MS) axis.push(toDate(t));
    const align = (source: ChartDay[]): ChartDay[] => {
      const byDate = new Map(source.map((d) => [d.date, d]));
      return axis.map((date) => byDate.get(date) ?? { date, ops: 0, credits: 0, usd: 0 });
    };
    const combined = align(sorted);
    const combinedMetric = metricOf(
      combined.reduce((s, d) => s + d.usd, 0),
      combined.reduce((s, d) => s + d.ops, 0),
      combined.reduce((s, d) => s + d.credits, 0),
    );
    const provSeries = providers
      .map((p) => {
        const aligned = align(p.days);
        const totalUsd = aligned.reduce((s, d) => s + d.usd, 0);
        const totalCredits = aligned.reduce((s, d) => s + d.credits, 0);
        const totalOps = aligned.reduce((s, d) => s + d.ops, 0);
        return { id: p.id, label: p.label, color: p.color, aligned, metric: metricOf(totalUsd, totalOps, totalCredits), rank: totalUsd || totalOps };
      })
      .filter((p) => p.rank > 0)
      .sort((a, b) => b.rank - a.rank);
    return { axis, combined, combinedMetric, provSeries };
  }, [days, providers, range]);

  if (!model) return <p className="vprofile-dim-note">no daily series in this submission</p>;
  const { axis, combined, combinedMetric, provSeries } = model;
  const selected = typeof view === "object" ? provSeries.find((p) => p.id === view.provider) ?? null : null;
  const stacked = view === "stacked";
  const scene3d = stacked && threeD;

  // Stacking shares one metric across bands and uses OPERATIONS on purpose: dollars are dominated
  // by one coding source, but ops balance coding and media into a colourful "all your activity"
  // picture. Single lenses use their own metric; "All" keeps the usd headline.
  const metric: Metric = stacked ? "ops" : selected ? selected.metric : combinedMetric;
  const activeColor = view === "all" ? COMBINED_COLOR : selected ? selected.color : COMBINED_COLOR;

  const single = view === "all" ? combined.map((d) => valueAt(d, metric)) : selected ? selected.aligned.map((d) => valueAt(d, metric)) : combined.map((d) => valueAt(d, metric));

  // Smoothed per-provider series for the stacked lenses (shared by flat + 3D).
  const win = Math.min(11, Math.max(3, Math.round(axis.length / 32)) | 1);
  const smoothed = stacked ? provSeries.map((p) => smooth(p.aligned.map((d) => valueAt(d, metric)), win)) : [];
  // Flat mode stacks cumulatively (max = the daily sum); 3D floats each source from the baseline on
  // its own plane (max = the tallest single source), so every ribbon is full-height and visible.
  const cumTops: number[][] = [];
  if (stacked && !scene3d) {
    let running = axis.map(() => 0);
    for (const vals of smoothed) {
      running = running.map((base, i) => base + vals[i]);
      cumTops.push(running.slice());
    }
  }
  const scaleBasis = scene3d
    ? Math.max(1, ...smoothed.map((vals) => Math.max(...vals, 0)))
    : stacked
      ? Math.max(1, ...(cumTops.length ? cumTops[cumTops.length - 1] : [0]))
      : Math.max(1, ...single);
  const step = niceStep(scaleBasis / 4);
  const niceMax = Math.max(step, Math.ceil(scaleBasis / step) * step);
  const ticks: number[] = [];
  for (let v = 0; v <= niceMax + 1e-6; v += step) ticks.push(v);
  const perDayTotal = stacked && !scene3d && cumTops.length ? cumTops[cumTops.length - 1] : single;
  const avg = perDayTotal.reduce((s, v) => s + v, 0) / Math.max(1, perDayTotal.length);

  const denom = Math.max(1, axis.length - 1);
  const x = (i: number) => (i / denom) * VW;
  const y = (v: number) => BASE - (v / niceMax) * (BASE - TOP);
  const fmt = (v: number) => (metric === "usd" ? `$${Math.round(v).toLocaleString("en-US")}` : Math.round(v).toLocaleString("en-US"));
  const fmtTip = (v: number) => (metric === "usd" ? formatUsd(v) : `${formatInt(v)} ${metric === "credits" ? "cr" : "ops"}`);
  const leftPct = (i: number) => (x(i) / VW) * 100;
  const anchor = (pct: number) => (pct < 8 ? "0%" : pct > 92 ? "-100%" : "-50%");

  const linePath = (values: number[]) => values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const areaPath = (values: number[]) => `${linePath(values)} L${VW} ${BASE} L0 ${BASE} Z`;
  const bandPath = (lower: number[], upper: number[]) => {
    const top = upper.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
    const bottom = lower.map((_v, i) => `L${x(lower.length - 1 - i).toFixed(1)} ${y(lower[lower.length - 1 - i]).toFixed(1)}`).join(" ");
    return `${top} ${bottom} Z`;
  };

  const tickCount = Math.min(7, axis.length);
  const xticks = [...new Set(Array.from({ length: tickCount }, (_, k) => Math.round((k * (axis.length - 1)) / Math.max(1, tickCount - 1))))];
  const activePoint = active == null ? null : { date: axis[active], value: perDayTotal[active] };
  const hoverable = !scene3d;

  function onMove(event: MouseEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width) return;
    const index = Math.round(((event.clientX - rect.left) / rect.width) * denom);
    setActive(Math.min(axis.length - 1, Math.max(0, index)));
  }
  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    const current = active ?? axis.length - 1;
    let next: number | null = null;
    if (event.key === "ArrowLeft") next = Math.max(0, current - 1);
    else if (event.key === "ArrowRight") next = Math.min(axis.length - 1, current + 1);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = axis.length - 1;
    else if (event.key === "Escape") return setActive(null);
    else return;
    event.preventDefault();
    setActive(next);
  }

  const viewLabel = view === "all" ? "All sources" : stacked ? "All together" : selected?.label ?? "";

  return (
    <div className={`vprofile-chart${stacked ? " vprofile-chart--stacked" : ""}`}>
      <div className="vprofile-chart-top">
        <div className="vprofile-chart-legend" aria-hidden="true">
          <span className="vprofile-chart-key"><i className="vprofile-chart-swatch" style={{ background: activeColor }} />{viewLabel} · {unitLabel(metric)}</span>
          {!stacked ? <span className="vprofile-chart-key"><i className="vprofile-chart-swatch vprofile-chart-swatch--avg" />avg {fmt(avg)}/day</span> : null}
        </div>
        <div className="vprofile-chart-controls">
          {stacked ? (
            <div className="vprofile-chart-dim" role="group" aria-label="Chart depth">
              <button type="button" className="vprofile-chart-range" aria-pressed={!threeD} onClick={() => setThreeD(false)}>Flat</button>
              <button type="button" className="vprofile-chart-range" aria-pressed={threeD} onClick={() => setThreeD(true)}>3D</button>
            </div>
          ) : null}
          <div className="vprofile-chart-ranges" role="group" aria-label="Chart range">
            {RANGES.map((r) => (
              <button type="button" className="vprofile-chart-range" aria-pressed={range === r} onClick={() => { setRange(r); setActive(null); }} key={r}>{r}</button>
            ))}
          </div>
        </div>
      </div>

      {provSeries.length > 0 ? (
        <div className="vprofile-chart-series" role="group" aria-label="Choose a source to chart">
          <button type="button" className="vprofile-series-chip" aria-pressed={view === "all"} onClick={() => { setView("all"); setActive(null); }}>
            <i className="vprofile-series-dot" style={{ background: COMBINED_COLOR }} />All
          </button>
          <button type="button" className="vprofile-series-chip vprofile-series-chip--stack" aria-pressed={stacked} onClick={() => { setView("stacked"); setActive(null); }}>
            <i className="vprofile-series-stack" aria-hidden="true"><span /><span /><span /></i>All together
          </button>
          {provSeries.map((p) => (
            <button type="button" className="vprofile-series-chip" aria-pressed={typeof view === "object" && view.provider === p.id} onClick={() => { setView({ provider: p.id }); setActive(null); }} key={p.id}>
              <i className="vprofile-series-dot" style={{ background: p.color }} />{p.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="vprofile-chart-stage" key={viewKey(view) + (scene3d ? "-3d" : "")}>
        {ticks.map((v) => (
          <span className="vprofile-chart-ylabel" style={{ top: `${y(v)}px` }} key={`yl-${v}`}>{fmt(v)}</span>
        ))}
        <div
          className={`vprofile-chart-plot${scene3d ? " vprofile-chart-plot--scene" : ""}`}
          role="group"
          aria-label={`Usage over time. ${viewLabel}, ${unitLabel(metric)}, peak ${fmt(niceMax)}, average ${fmt(avg)}.`}
          tabIndex={0}
          onKeyDown={onKey}
          onBlur={() => setActive(null)}
        >
          {scene3d ? (
            // Real 3D: each source is a full-height ribbon on its own plane, floated toward the
            // viewer in perspective (biggest at the back). Fills + drop-shadows separate the
            // layers — never a stroke. Every source stays visible; none is hidden behind another.
            <div className="vprofile-scene">
              <div className="vprofile-scene-deck">
                <div className="vprofile-scene-grid" aria-hidden="true">
                  {ticks.map((v) => <span style={{ top: `${(y(v) / VH) * 100}%` }} key={`g3-${v}`} />)}
                </div>
                {provSeries.map((p, k) => {
                  // Biggest source (k=0) sits at the back plane (z=0); smaller ones float toward the
                  // viewer, so the tall back ribbon rises behind the shorter front ones — all visible.
                  return (
                    <div className="vprofile-scene-layer" style={{ transform: `translateZ(${k * 26}px)`, zIndex: k + 1 } as CSSProperties} key={p.id}>
                      <svg viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none">
                        <defs>
                          <linearGradient id={`vp-l-${p.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stopColor={p.color} stopOpacity="0.95" />
                            <stop offset="1" stopColor={p.color} stopOpacity="0.45" />
                          </linearGradient>
                        </defs>
                        <path d={areaPath(smoothed[k])} fill={`url(#vp-l-${p.id})`} />
                      </svg>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <svg viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none" onMouseMove={hoverable ? onMove : undefined} onMouseLeave={() => setActive(null)}>
              <defs>
                <linearGradient id="vp-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={activeColor} stopOpacity="0.34" />
                  <stop offset="0.55" stopColor={activeColor} stopOpacity="0.12" />
                  <stop offset="1" stopColor={activeColor} stopOpacity="0" />
                </linearGradient>
                {stacked ? provSeries.map((p) => (
                  <linearGradient id={`vp-b-${p.id}`} x1="0" y1="0" x2="0" y2="1" key={p.id}>
                    <stop offset="0" stopColor={p.color} stopOpacity="0.92" />
                    <stop offset="1" stopColor={p.color} stopOpacity="0.6" />
                  </linearGradient>
                )) : null}
              </defs>
              {ticks.map((v) => (
                <line x1="0" x2={VW} y1={y(v)} y2={y(v)} stroke="rgba(217,255,242,0.1)" strokeWidth="1" vectorEffect="non-scaling-stroke" key={`g-${v}`} />
              ))}
              {stacked ? (
                // Flat stacked: gradient-filled bands, no stroke — a hairline surface gap between
                // bands (via the SVG background showing through a 0.4px inset) reads clean, not cheap.
                cumTops.map((top, k) => {
                  const lower = k === 0 ? axis.map(() => 0) : cumTops[k - 1];
                  return <path d={bandPath(lower, top)} fill={`url(#vp-b-${provSeries[k].id})`} key={provSeries[k].id} />;
                })
              ) : (
                <>
                  <line x1="0" x2={VW} y1={y(avg)} y2={y(avg)} stroke="rgba(217,255,242,0.28)" strokeWidth="1" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                  <path d={areaPath(single)} fill="url(#vp-area)" stroke="none" />
                  <path d={linePath(single)} fill="none" stroke={activeColor} strokeWidth="2.25" vectorEffect="non-scaling-stroke" />
                </>
              )}
              {activePoint && hoverable ? (
                <line x1={x(active as number)} x2={x(active as number)} y1={TOP} y2={BASE} stroke="rgba(46,232,214,0.45)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              ) : null}
            </svg>
          )}
          {activePoint && hoverable ? (
            <>
              {!stacked ? <span className="vprofile-chart-dot" style={{ left: `${leftPct(active as number)}%`, top: `${y(activePoint.value)}px`, background: activeColor }} aria-hidden="true" /> : null}
              <span
                className="vprofile-chart-tip"
                style={{ left: `${leftPct(active as number)}%`, top: `${y(activePoint.value) - 10}px`, transform: `translate(${anchor(leftPct(active as number))}, -100%)` }}
                aria-live="polite"
              >
                {shortDate(activePoint.date)} · {fmtTip(activePoint.value)}{stacked ? " total" : ""}
              </span>
            </>
          ) : null}
        </div>
      </div>

      <div className="vprofile-chart-xlabels" aria-hidden="true">
        {xticks.map((i) => (
          <span style={{ left: `${leftPct(i)}%`, transform: `translateX(${anchor(leftPct(i))})` }} key={`xt-${i}`}>{shortDate(axis[i])}</span>
        ))}
      </div>
    </div>
  );
}
