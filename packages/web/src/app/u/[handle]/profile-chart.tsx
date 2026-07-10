"use client";

// One hero chart: usd/day over a selectable trailing range. Dates are parsed
// deterministically from "YYYY-MM-DD" (no locale/timezone variance), so the
// server-rendered markup and the hydrated client markup always match.

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
    let max = 0;
    for (const p of points) max = Math.max(max, p.value);
    return { points, max: Math.max(1, max), usdMode };
  }, [days, range]);

  if (!model) {
    return <p className="vprofile-dim-note">no daily series in this submission</p>;
  }

  const { points, max, usdMode } = model;
  const denom = Math.max(1, points.length - 1);
  const x = (i: number) => 10 + (i / denom) * 700;
  const y = (v: number) => 210 - (v / max) * 190;
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(2)} ${y(p.value).toFixed(2)}`).join(" ");
  const area = `${line} L${x(points.length - 1).toFixed(2)} 210 L${x(0).toFixed(2)} 210 Z`;
  const gridValue = (v: number) => (usdMode ? `$${Math.round(v).toLocaleString("en-US")}` : Math.round(v).toLocaleString("en-US"));
  const tickCount = Math.min(8, points.length);
  const ticks = [...new Set(
    Array.from({ length: tickCount }, (_, k) => Math.round((k * (points.length - 1)) / Math.max(1, tickCount - 1))),
  )];
  const activePoint = active == null ? null : points[active];

  function onMove(event: MouseEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width) return;
    const fx = ((event.clientX - rect.left) / rect.width) * 720;
    const index = Math.round(((fx - 10) / 700) * denom);
    setActive(Math.min(points.length - 1, Math.max(0, index)));
  }

  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    const current = active ?? points.length - 1;
    let next: number | null = null;
    if (event.key === "ArrowLeft") next = Math.max(0, current - 1);
    else if (event.key === "ArrowRight") next = Math.min(points.length - 1, current + 1);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = points.length - 1;
    else if (event.key === "Escape") {
      setActive(null);
      return;
    } else return;
    event.preventDefault();
    setActive(next);
  }

  const tipLeft = active == null ? 0 : (x(active) / 720) * 100;
  const anchor = (pct: number) => (pct < 8 ? "0%" : pct > 92 ? "-100%" : "-50%");

  return (
    <div className="vprofile-chart">
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
      <div
        className="vprofile-chart-stage"
        role="group"
        aria-label="Usage over time chart"
        tabIndex={0}
        onKeyDown={onKey}
        onBlur={() => setActive(null)}
      >
        <svg viewBox="0 0 720 220" preserveAspectRatio="none" onMouseMove={onMove} onMouseLeave={() => setActive(null)}>
          <defs>
            <linearGradient id="vp-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2ee8d6" stopOpacity="0.28" />
              <stop offset="1" stopColor="#2ee8d6" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[max, max / 2, 0].map((v) => (
            <line
              x1="10"
              x2="710"
              y1={y(v)}
              y2={y(v)}
              stroke="rgba(217,255,242,0.12)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              key={`grid-${v}`}
            />
          ))}
          <path d={area} fill="url(#vp-area)" stroke="none" />
          <path d={line} fill="none" stroke="#2ee8d6" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          {activePoint ? (
            <line
              x1={x(active as number)}
              x2={x(active as number)}
              y1="20"
              y2="210"
              stroke="rgba(46,232,214,0.45)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>
        {[max, max / 2, 0].map((v) => (
          <span className="vprofile-chart-ylabel" style={{ top: `${y(v) - 14}px` }} key={`ylabel-${v}`}>
            {gridValue(v)}
          </span>
        ))}
        {activePoint ? (
          <>
            <span
              className="vprofile-chart-dot"
              style={{ left: `${tipLeft}%`, top: `${y(activePoint.value)}px` }}
              aria-hidden="true"
            />
            <span
              className="vprofile-chart-tip"
              style={{ left: `${tipLeft}%`, top: `${y(activePoint.value) - 10}px`, transform: `translate(${anchor(tipLeft)}, -100%)` }}
              aria-live="polite"
            >
              {activePoint.date} · {usdMode ? formatUsd(activePoint.value) : `${formatInt(activePoint.value)} cr`}
            </span>
          </>
        ) : null}
      </div>
      <div className="vprofile-chart-xlabels" aria-hidden="true">
        {ticks.map((i) => (
          <span
            style={{ left: `${(x(i) / 720) * 100}%`, transform: `translateX(${anchor((x(i) / 720) * 100)})` }}
            key={`tick-${i}`}
          >
            {shortDate(points[i].date)}
          </span>
        ))}
      </div>
      {!usdMode ? <p className="vprofile-dim-note">showing credits (no usd recorded)</p> : null}
    </div>
  );
}
