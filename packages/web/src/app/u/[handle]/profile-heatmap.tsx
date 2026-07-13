"use client";

// Sync rhythm — a real contribution calendar, built to the same rules as the one on GitHub:
// 53 week columns × 7 weekday rows, Sunday-first, month labels over the week each month opens in,
// four intensity levels cut at quartiles of the ACTIVE days (not a linear share of the max, which
// buries every ordinary day under one outlier), and a readout naming the exact day under the cursor.
//
// Intensity is DAILY SPEND, because that is the one signal we hold for every day of the history:
// coding spend comes from the viberank daily series (the full record — local agent logs are pruned
// after a few months), media spend from provider ledgers. Operation counts exist only for days whose
// logs survive, so they ride in the readout rather than driving the colour, and a day is never
// coloured from a number we had to invent.

import { useMemo, useState } from "react";

const DAY_MS = 86_400_000;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKS = 53;

export interface HeatDay {
  date: string;
  ops: number;
  usd: number;
}

interface Cell {
  date: string;
  ops: number;
  usd: number;
  level: number;
  week: number;
  day: number;
}

function iso(t: number): string {
  return new Date(t).toISOString().slice(0, 10);
}

function usdLabel(usd: number): string {
  if (usd >= 1000) return `$${Math.round(usd).toLocaleString("en-US")}`;
  if (usd >= 1) return `$${usd.toFixed(0)}`;
  return `$${usd.toFixed(2)}`;
}

function longDate(date: string): string {
  const t = Date.parse(`${date}T00:00:00Z`);
  const d = new Date(t);
  return `${WEEKDAYS[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

// GitHub cuts its four levels at quartiles of the active days, so a single $7k outlier
// cannot flatten a year of ordinary work into level 1.
function quartiles(values: number[]): [number, number, number] {
  const sorted = values.slice().sort((a, b) => a - b);
  const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))];
  return [at(0.25), at(0.5), at(0.75)];
}

function build(days: HeatDay[]): { cells: Cell[]; months: Array<{ week: number; label: string }>; active: number; streak: number; total: number } {
  const byDate = new Map(days.map((d) => [d.date, d]));
  const stamps = days.map((d) => Date.parse(`${d.date}T00:00:00Z`)).filter(Number.isFinite);
  if (!stamps.length) return { cells: [], months: [], active: 0, streak: 0, total: 0 };

  // End on the last day with data, and walk back a full GitHub year (53 weeks), Sunday-aligned.
  const end = Math.max(...stamps);
  const endDow = new Date(end).getUTCDay();
  const gridEnd = end + (6 - endDow) * DAY_MS;
  const gridStart = gridEnd - (WEEKS * 7 - 1) * DAY_MS;

  const active = days.filter((d) => d.date >= iso(gridStart) && d.date <= iso(end) && d.usd > 0);
  const [q1, q2, q3] = quartiles(active.map((d) => d.usd));

  const cells: Cell[] = [];
  const months: Array<{ week: number; label: string }> = [];
  let seenMonth = -1;
  let streak = 0;
  let best = 0;

  for (let i = 0; i < WEEKS * 7; i += 1) {
    const t = gridStart + i * DAY_MS;
    if (t > end) break;
    const date = iso(t);
    const hit = byDate.get(date);
    const usd = hit?.usd ?? 0;
    const ops = hit?.ops ?? 0;
    const week = Math.floor(i / 7);
    const day = i % 7;

    let level = 0;
    if (usd > 0) level = usd > q3 ? 4 : usd > q2 ? 3 : usd > q1 ? 2 : 1;
    cells.push({ date, ops, usd, level, week, day });

    if (usd > 0) {
      streak += 1;
      best = Math.max(best, streak);
    } else {
      streak = 0;
    }

    const month = new Date(t).getUTCMonth();
    if (day === 0 && month !== seenMonth) {
      seenMonth = month;
      // Skip a label that would collide with the previous one in the first column of a month.
      if (!months.length || week - months[months.length - 1].week >= 3) {
        months.push({ week, label: MONTHS[month] });
      }
    }
  }

  return {
    cells,
    months,
    active: active.length,
    streak: best,
    total: active.reduce((sum, d) => sum + d.usd, 0),
  };
}

export function SyncRhythm({ days }: { days: HeatDay[] }) {
  const { cells, months, active, streak, total } = useMemo(() => build(days), [days]);
  const [hover, setHover] = useState<Cell | null>(null);

  if (!cells.length) return null;

  const readout = hover
    ? hover.usd > 0
      ? `${usdLabel(hover.usd)}${hover.ops > 0 ? ` · ${hover.ops.toLocaleString("en-US")} ops` : ""} on ${longDate(hover.date)}`
      : `No tracked usage on ${longDate(hover.date)}`
    : `${active} active days in the last year · ${usdLabel(total)} · longest streak ${streak} days`;

  return (
    <section className="vprofile-panel vheat">
      <header className="vprofile-panel-head">
        <h2 className="vprofile-panel-title">Sync rhythm</h2>
        <span className="vprofile-panel-sub">(spend per day)</span>
      </header>

      <div className="vheat-scroll">
        <div className="vheat-grid" style={{ ["--vheat-weeks" as string]: WEEKS }}>
          <div className="vheat-months" aria-hidden="true">
            {months.map((m) => (
              <span style={{ gridColumn: m.week + 1 }} key={`${m.label}-${m.week}`}>{m.label}</span>
            ))}
          </div>

          <div className="vheat-dows" aria-hidden="true">
            {WEEKDAYS.map((d, i) => (
              <span style={{ gridRow: i + 1 }} key={d}>{i % 2 === 1 ? d : ""}</span>
            ))}
          </div>

          <div
            className="vheat-cells"
            role="img"
            aria-label={`Daily spend calendar. ${active} active days in the last year, ${usdLabel(total)} total, longest streak ${streak} days.`}
            onMouseLeave={() => setHover(null)}
          >
            {cells.map((c) => (
              <button
                type="button"
                className={`vheat-cell vheat-l${c.level}`}
                style={{ gridColumn: c.week + 1, gridRow: c.day + 1 }}
                onMouseEnter={() => setHover(c)}
                onFocus={() => setHover(c)}
                onBlur={() => setHover(null)}
                title={c.usd > 0 ? `${usdLabel(c.usd)} on ${longDate(c.date)}` : `No tracked usage on ${longDate(c.date)}`}
                tabIndex={c.level > 0 ? 0 : -1}
                key={c.date}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="vheat-foot">
        <p className="vheat-readout" aria-live="polite">{readout}</p>
        <div className="vheat-legend" aria-hidden="true">
          Less
          <i className="vheat-cell vheat-l0" />
          <i className="vheat-cell vheat-l1" />
          <i className="vheat-cell vheat-l2" />
          <i className="vheat-cell vheat-l3" />
          <i className="vheat-cell vheat-l4" />
          More
        </div>
      </div>
    </section>
  );
}
