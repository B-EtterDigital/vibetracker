"use client";

// Two contribution calendars, one geometry. Both are built to the rules of the graph on
// github.com: 53 week columns × 7 weekday rows, Sunday-first, month labels over the week each
// month opens in, four intensity levels, a day readout, and a Less→More legend.
//
//   Sync rhythm       — AI SPEND per day, teal. The one signal we hold for every day of the
//                        history (coding from the viberank daily series, media from ledgers).
//                        Levels are cut at quartiles of the active days so a single outlier day
//                        can't flatten a year into level 1.
//   GitHub contributions — the viber's REAL git activity, GitHub's own green, using the exact
//                        per-day levels GitHub returns. Labelled activity evidence, NOT AI usage:
//                        it never touches spend, credits, ops, or the signal score.

import { useMemo, useState } from "react";

const DAY_MS = 86_400_000;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKS = 53;

interface Cell {
  date: string;
  level: number;
  title: string;
  active: boolean;
  week: number;
  day: number;
}

function iso(t: number): string {
  return new Date(t).toISOString().slice(0, 10);
}

function longDate(date: string): string {
  const d = new Date(Date.parse(`${date}T00:00:00Z`));
  return `${WEEKDAYS[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

// A GitHub year: end on the last day with data, walk back 53 Sunday-aligned weeks, drop a month
// label over the first week each month opens in (skipping one that would collide with the prior).
function grid(
  entries: Map<string, { level: number; title: string }>,
  lastDate: string,
): { cells: Cell[]; months: Array<{ week: number; label: string }> } {
  const end = Date.parse(`${lastDate}T00:00:00Z`);
  if (!Number.isFinite(end)) return { cells: [], months: [] };
  const gridEnd = end + (6 - new Date(end).getUTCDay()) * DAY_MS;
  const gridStart = gridEnd - (WEEKS * 7 - 1) * DAY_MS;

  const cells: Cell[] = [];
  const months: Array<{ week: number; label: string }> = [];
  let seenMonth = -1;

  for (let i = 0; i < WEEKS * 7; i += 1) {
    const t = gridStart + i * DAY_MS;
    if (t > end) break;
    const date = iso(t);
    const hit = entries.get(date);
    const week = Math.floor(i / 7);
    const day = i % 7;
    cells.push({
      date,
      level: hit?.level ?? 0,
      title: hit?.title ?? `No activity on ${longDate(date)}`,
      active: (hit?.level ?? 0) > 0,
      week,
      day,
    });
    const month = new Date(t).getUTCMonth();
    if (day === 0 && month !== seenMonth) {
      seenMonth = month;
      if (!months.length || week - months[months.length - 1].week >= 3) months.push({ week, label: MONTHS[month] });
    }
  }
  return { cells, months };
}

function longestStreak(cells: Cell[]): number {
  let best = 0;
  let run = 0;
  for (const c of cells) {
    run = c.active ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

function Calendar({
  cells,
  months,
  ramp,
  summary,
  title,
  sub,
  label,
}: {
  cells: Cell[];
  months: Array<{ week: number; label: string }>;
  ramp: "spend" | "github";
  summary: string;
  title: string;
  sub: string;
  label: string;
}) {
  const [hover, setHover] = useState<Cell | null>(null);
  const readout = hover ? hover.title : summary;

  return (
    <section className={`vprofile-panel vheat vheat--${ramp}`}>
      <header className="vprofile-panel-head">
        <h2 className="vprofile-panel-title">{title}</h2>
        <span className="vprofile-panel-sub">{sub}</span>
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
          <div className="vheat-cells" role="img" aria-label={label} onMouseLeave={() => setHover(null)}>
            {cells.map((c) => (
              <span
                className={`vheat-cell vheat-l${c.level}`}
                style={{ gridColumn: c.week + 1, gridRow: c.day + 1 }}
                onMouseEnter={() => setHover(c)}
                title={c.title}
                aria-hidden="true"
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

export interface HeatDay {
  date: string;
  ops: number;
  usd: number;
}

function usdLabel(usd: number): string {
  if (usd >= 1000) return `$${Math.round(usd).toLocaleString("en-US")}`;
  if (usd >= 1) return `$${usd.toFixed(0)}`;
  return `$${usd.toFixed(2)}`;
}

function quartiles(values: number[]): [number, number, number] {
  const sorted = values.slice().sort((a, b) => a - b);
  const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))];
  return [at(0.25), at(0.5), at(0.75)];
}

// AI spend per day. GitHub cuts its own levels at quartiles of the active days; we do the same
// so one $7k day cannot flatten a year of ordinary work into a single dim shade.
export function SyncRhythm({ days }: { days: HeatDay[] }) {
  const view = useMemo(() => {
    const withData = days.filter((d) => d.usd > 0);
    if (!withData.length) return null;
    const lastDate = days.reduce((m, d) => (d.date > m ? d.date : m), days[0].date);
    const gridStart = Date.parse(`${lastDate}T00:00:00Z`) - (WEEKS * 7 - 1) * DAY_MS;
    const active = withData.filter((d) => Date.parse(`${d.date}T00:00:00Z`) >= gridStart);
    const [q1, q2, q3] = quartiles(active.map((d) => d.usd));
    const entries = new Map(
      active.map((d) => {
        const level = d.usd > q3 ? 4 : d.usd > q2 ? 3 : d.usd > q1 ? 2 : 1;
        const opsText = d.ops > 0 ? ` · ${d.ops.toLocaleString("en-US")} ops` : "";
        return [d.date, { level, title: `${usdLabel(d.usd)}${opsText} on ${longDate(d.date)}` }] as const;
      }),
    );
    const { cells, months } = grid(entries, lastDate);
    const total = active.reduce((s, d) => s + d.usd, 0);
    return {
      cells,
      months,
      summary: `${active.length} active days in the last year · ${usdLabel(total)} · longest streak ${longestStreak(cells)} days`,
      label: `Daily AI spend calendar. ${active.length} active days, ${usdLabel(total)} total.`,
    };
  }, [days]);

  if (!view) return null;
  return (
    <Calendar
      cells={view.cells}
      months={view.months}
      ramp="spend"
      summary={view.summary}
      label={view.label}
      title="Sync rhythm"
      sub="AI spend per day"
    />
  );
}

export interface GitDay {
  date: string;
  count: number;
  level: number;
}

// The viber's real GitHub contributions, using the per-day levels GitHub itself returns.
// Activity evidence, not AI usage — labelled, and it never feeds spend/ops/score.
export function GitHubContributions({ handle, total, days }: { handle: string; total: number; days: GitDay[] }) {
  const view = useMemo(() => {
    const clean = days.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.date));
    if (!clean.length) return null;
    const lastDate = clean.reduce((m, d) => (d.date > m ? d.date : m), clean[0].date);
    const entries = new Map(
      clean.map((d) => {
        const level = Math.max(0, Math.min(4, Math.round(d.level)));
        const noun = d.count === 1 ? "contribution" : "contributions";
        return [d.date, {
          level: d.count > 0 && level === 0 ? 1 : level,
          title: d.count > 0 ? `${d.count.toLocaleString("en-US")} ${noun} on ${longDate(d.date)}` : `No contributions on ${longDate(d.date)}`,
        }] as const;
      }),
    );
    const { cells, months } = grid(entries, lastDate);
    const active = clean.filter((d) => d.count > 0).length;
    return {
      cells,
      months,
      summary: `${total.toLocaleString("en-US")} contributions in the last year · ${active} active days · longest streak ${longestStreak(cells)} days`,
      label: `GitHub contribution calendar for ${handle}. ${total.toLocaleString("en-US")} contributions, ${active} active days. Activity evidence, not AI usage.`,
    };
  }, [days, total, handle]);

  if (!view) return null;
  return (
    <Calendar
      cells={view.cells}
      months={view.months}
      ramp="github"
      summary={view.summary}
      label={view.label}
      title="GitHub contributions"
      sub={`@${handle} · activity evidence, not AI usage`}
    />
  );
}
