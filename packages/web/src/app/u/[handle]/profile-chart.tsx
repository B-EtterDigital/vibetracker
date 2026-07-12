"use client";

// One hero chart: usd/day over a selectable trailing range. Dates are parsed
// deterministically from "YYYY-MM-DD" (no locale/timezone variance), so the
// server-rendered markup and the hydrated client markup always match. The
// vertical scale is a "nice"-rounded linear domain with gridlines, a legend,
// and an average reference line, so spike days read against a clear axis
// instead of crushing the daily signal.

import { useMemo, useState, type KeyboardEvent, type MouseEvent } from "react";
import { formatInt, formatUsd } from "../../../lib/leaderboard";

export interface ChartDay {
  date: string;
  ops: number;
  credits: number;
  usd: number;
}

type Range = "30d" | "90d" | "all";

const RANGES: Range[] = ["30d", "90d", "all"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 86_400_000;
// viewBox: horizontal is stretched to fill (preserveAspectRatio none); vertical
// is locked 1:1 to the CSS height so HTML label overlays align to SVG gridlines.
const VW = 1000;
const VH = 240;
const TOP = 14;
const BASE = 226;

function shortDate(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  return m ? `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}` : date;
}

function toStamp(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

function toDate(stamp: number): string {
  return new Date(stamp).toISOString().slice(0, 10);
}

// Round a raw range up to a clean axis: a nice step (1/2/5 x 10^n) sized for
// roughly four gridlines, then the smallest multiple of it that covers the max.
function niceStep(value: number): number {
  if (value <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  const n = value / pow;
  const s = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return s * pow;
}

export function ProfileUsageChart({ days }: { days: ChartDay[] }) {
  const [range, setRange] = useState<Range>("all");
  const [active, setActive] = useState<number | null>(null);

  const model = useMemo(() => {
    const valid = days.filter((d) => Number.isFinite(toStamp(d.date)));
    if (!valid.length) return null;
    const sorted = valid.slice().sort((a, b) => (a.date < b.date ? -1 : 1));
    const usdMode = sorted.some((d) => d.usd > 0);
    const byDate = new Map(sorted.map((d) => [d.date, d]));
    const end = toStamp(sorted[sorted.length - 1].date);
    const start = range === "all" ? toStamp(sorted[0].date) : end - (range === "30d" ? 29 : 89) * DAY_MS;
    const points: { date: string; value: number }[] = [];
    for (let t = start; t <= end; t += DAY_MS) {
      const day = byDate.get(toDate(t));
      points.push({ date: toDate(t), value: day ? (usdMode ? day.usd : day.credits) : 0 });
    }
    let rawMax = 0;
    let sum = 0;
    for (const p of points) {
      rawMax = Math.max(rawMax, p.value);
      sum += p.value;
    }
    const step = niceStep(Math.max(rawMax, 1) / 4);
    const niceMax = Math.max(step, Math.ceil(rawMax / step) * step);
    const ticks: number[] = [];
    for (let v = 0; v <= niceMax + 1e-6; v += step) ticks.push(v);
    return { points, max: niceMax, avg: sum / points.length, ticks, usdMode };
  }, [days, range]);

  if (!model) {
    return <p className="vprofile-dim-note">no daily series in this submission</p>;
  }

  const { points, max, avg, ticks, usdMode } = model;
  const denom = Math.max(1, points.length - 1);
  const x = (i: number) => (i / denom) * VW;
  const y = (v: number) => BASE - (v / max) * (BASE - TOP);
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");
  const area = `${line} L${VW} ${BASE} L0 ${BASE} Z`;
  const fmt = (v: number) => (usdMode ? `$${Math.round(v).toLocaleString("en-US")}` : Math.round(v).toLocaleString("en-US"));
  const tickCount = Math.min(7, points.length);
  const xticks = [...new Set(
    Array.from({ length: tickCount }, (_, k) => Math.round((k * (points.length - 1)) / Math.max(1, tickCount - 1))),
  )];
  const activePoint = active == null ? null : points[active];
  const leftPct = (i: number) => (x(i) / VW) * 100;
  const anchor = (pct: number) => (pct < 8 ? "0%" : pct > 92 ? "-100%" : "-50%");

  function onMove(event: MouseEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width) return;
    const index = Math.round(((event.clientX - rect.left) / rect.width) * denom);
    setActive(Math.min(points.length - 1, Math.max(0, index)));
  }

  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    const current = active ?? points.length - 1;
    let next: number | null = null;
    if (event.key === "ArrowLeft") next = Math.max(0, current - 1);
    else if (event.key === "ArrowRight") next = Math.min(points.length - 1, current + 1);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = points.length - 1;
    else if (event.key === "Escape") return setActive(null);
    else return;
    event.preventDefault();
    setActive(next);
  }

  const unit = usdMode ? "USD per day" : "credits per day";

  return (
    <div className="vprofile-chart">
      <div className="vprofile-chart-top">
        <div className="vprofile-chart-legend" aria-hidden="true">
          <span className="vprofile-chart-key"><i className="vprofile-chart-swatch" />{unit}</span>
          <span className="vprofile-chart-key"><i className="vprofile-chart-swatch vprofile-chart-swatch--avg" />avg {fmt(avg)}/day</span>
        </div>
        <div className="vprofile-chart-ranges" role="group" aria-label="Chart range">
          {RANGES.map((r) => (
            <button
              type="button"
              className="vprofile-chart-range"
              aria-pressed={range === r}
              onClick={() => {
                setRange(r);
                setActive(null);
              }}
              key={r}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="vprofile-chart-stage">
        {ticks.map((v) => (
          <span className="vprofile-chart-ylabel" style={{ top: `${y(v)}px` }} key={`yl-${v}`}>
            {fmt(v)}
          </span>
        ))}
        <div
          className="vprofile-chart-plot"
          role="group"
          aria-label={`Usage over time chart. ${unit}, peak ${fmt(max)}, average ${fmt(avg)}.`}
          tabIndex={0}
          onKeyDown={onKey}
          onBlur={() => setActive(null)}
        >
          <svg viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none" onMouseMove={onMove} onMouseLeave={() => setActive(null)}>
            <defs>
              <linearGradient id="vp-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#2ee8d6" stopOpacity="0.34" />
                <stop offset="0.55" stopColor="#2ee8d6" stopOpacity="0.12" />
                <stop offset="1" stopColor="#2ee8d6" stopOpacity="0" />
              </linearGradient>
            </defs>
            {ticks.map((v) => (
              <line x1="0" x2={VW} y1={y(v)} y2={y(v)} stroke="rgba(217,255,242,0.1)" strokeWidth="1" vectorEffect="non-scaling-stroke" key={`g-${v}`} />
            ))}
            <line x1="0" x2={VW} y1={y(avg)} y2={y(avg)} stroke="rgba(217,255,242,0.28)" strokeWidth="1" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
            <path d={area} fill="url(#vp-area)" stroke="none" />
            <path d={line} fill="none" stroke="#2ee8d6" strokeWidth="2.25" vectorEffect="non-scaling-stroke" />
            {activePoint ? (
              <line x1={x(active as number)} x2={x(active as number)} y1={TOP} y2={BASE} stroke="rgba(46,232,214,0.45)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            ) : null}
          </svg>
          {activePoint ? (
            <>
              <span className="vprofile-chart-dot" style={{ left: `${leftPct(active as number)}%`, top: `${y(activePoint.value)}px` }} aria-hidden="true" />
              <span
                className="vprofile-chart-tip"
                style={{ left: `${leftPct(active as number)}%`, top: `${y(activePoint.value) - 10}px`, transform: `translate(${anchor(leftPct(active as number))}, -100%)` }}
                aria-live="polite"
              >
                {shortDate(activePoint.date)} · {usdMode ? formatUsd(activePoint.value) : `${formatInt(activePoint.value)} cr`}
              </span>
            </>
          ) : null}
        </div>
      </div>
      <div className="vprofile-chart-xlabels" aria-hidden="true">
        {xticks.map((i) => (
          <span style={{ left: `${leftPct(i)}%`, transform: `translateX(${anchor(leftPct(i))})` }} key={`xt-${i}`}>
            {shortDate(points[i].date)}
          </span>
        ))}
      </div>
      {!usdMode ? <p className="vprofile-dim-note">showing credits (no usd recorded)</p> : null}
    </div>
  );
}
