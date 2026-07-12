"use client";

// Presentational panels for the public profile dashboard. Every prop is a
// serializable value computed by the server page; nothing here re-derives
// locale-dependent strings, so SSR and hydration always agree.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { TrustBadge } from "../../../components/TrustBadge";
import type { ComplexityRead, SignalTier } from "../../../lib/profile-complexity";
import { GITHUB_LEVEL_COLORS } from "../../../lib/profile-trust";
import type { Tier } from "../../../lib/leaderboard";
import { ProfileUsageChart, type ChartDay } from "./profile-chart";
import { vibeColor } from "../../../../../core/src/vibe-categories";

const DAY_MS = 86_400_000;

// Committed category palette — single source for category bars, top tags, and
// the identity headline color. Unknown categories stay honestly grey.
export const CATEGORY_COLORS: Record<string, string> = {
  coding: "#2ee8d6",
  llm: "#36e39b",
  image: "#ff4fd8",
  video: "#9f7cff",
  music: "#ffc64d",
  audio: "#ffc64d",
  "3d": "#ff7768",
  local: "#36e39b",
  other: "#7a8a93",
};

export type SignalTierName = SignalTier;
export type IdentityRead = ComplexityRead["identity"];
export type ProgressRead = ComplexityRead["progress"];

const TIER_MARKS: Array<{ id: SignalTierName; at: number }> = [
  { id: "fresh", at: 0 },
  { id: "operator", at: 30 },
  { id: "supernova", at: 65 },
];

function identityColor(identity: IdentityRead): string {
  if (identity.kind === "allrounder") return "#2ee8d6";
  if (identity.kind === "forming") return "#ffc64d";
  return vibeColor(identity.topCategory);
}

export interface BrandChip {
  id: string;
  label: string;
  mark: string;
  from: string;
  to: string;
  ink: string;
  logo?: string;
}

export type StatMarkKind = "spent" | "credits" | "days" | "sources";

export interface StatCard {
  label: string;
  mark: StatMarkKind;
  value: string;
  sub: string;
}

export interface MixBar {
  id: string;
  label: string;
  amount: string;
  share: number;
  mark?: string;
  from?: string;
  to?: string;
  ink?: string;
  logo?: string;
  color?: string;
  tag?: string;
  top?: boolean;
}

export interface KeyValueRow {
  label: string;
  value: string;
}

export interface TrustChip {
  mark: string;
  title: string;
  metric: string;
  window: string;
  note: string;
}

function PanelHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <header className="vprofile-panel-head">
      <h2 className="vprofile-panel-title">{title}</h2>
      {sub ? <span className="vprofile-panel-sub">{sub}</span> : null}
    </header>
  );
}

export function ProfileHeader({
  handle,
  since,
  tierChip,
  signalTier,
  signalHint,
  identity,
  brands,
}: {
  handle: string;
  since: string;
  tierChip: string;
  signalTier: SignalTierName;
  signalHint: string;
  identity: IdentityRead;
  brands: BrandChip[];
}) {
  return (
    <section className="vprofile-header">
      <div className="vprofile-header-main">
        <span className="vprofile-monogram" aria-hidden="true">{handle.slice(0, 2)}</span>
        <div className="vprofile-header-id">
          <h1 className="vprofile-handle">@{handle}</h1>
          <p className="vprofile-identity" style={{ color: identityColor(identity) }}>
            {identity.label}
            <span> · {signalTier} signal</span>
          </p>
          <div className="vprofile-header-chips">
            <span className="vprofile-chip vprofile-chip-tier">{tierChip}</span>
            <span className={`vprofile-chip vprofile-chip-signal vprofile-signal-${signalTier}`} title={signalHint}>
              <i>signal read</i> {signalTier}
            </span>
            <span className="vprofile-joined">viber since {since}</span>
          </div>
        </div>
      </div>
      {brands.length ? (
        <div className="vprofile-header-brands" aria-label="Top providers by estimated spend">
          {brands.map((b) => (
            <span className="vprofile-brand-pill" key={b.id}>
              {b.logo ? (
                <i className="vprofile-mark vprofile-mark--logo" aria-hidden="true">
                  <img src={b.logo} alt="" width={14} height={14} loading="lazy" decoding="async" />
                </i>
              ) : (
                <i
                  className="vprofile-mark"
                  style={{ background: `linear-gradient(135deg, ${b.from}, ${b.to})`, color: b.ink }}
                  aria-hidden="true"
                >
                  {b.mark}
                </i>
              )}
              {b.label}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

// Small geometric stat marks: stroke-only inline SVG, no icon library.
const WEEK_DOTS = [1.5, 3.67, 5.83, 8, 10.17, 12.33, 14.5];

function StatMark({ kind }: { kind: StatMarkKind }) {
  return (
    <svg className="vprofile-stat-mark" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      {kind === "spent" ? (<><circle cx="8" cy="8" r="5.5" /><circle cx="8" cy="8" r="1.1" /></>) : null}
      {kind === "credits" ? <path d="M4 12.5V9.5M8 12.5V6.5M12 12.5V3.5" /> : null}
      {kind === "days"
        ? WEEK_DOTS.map((cx, index) => (
            index < 4
              ? <circle cx={cx} cy="8" r="0.9" fill="currentColor" stroke="none" key={cx} />
              : <circle cx={cx} cy="8" r="0.9" strokeWidth="0.9" key={cx} />
          ))
        : null}
      {kind === "sources" ? (<><path d="M5 5.5L11 5.5L8 11Z" strokeWidth="1" /><circle cx="5" cy="5.5" r="1.8" /><circle cx="11" cy="5.5" r="1.8" /><circle cx="8" cy="11" r="1.8" /></>) : null}
    </svg>
  );
}

export function StatCards({ cards }: { cards: StatCard[] }) {
  return (
    <div className="vprofile-stats">
      {cards.map((card) => (
        <article className="vprofile-panel vprofile-stat" key={card.label}>
          <span className="vprofile-stat-label"><StatMark kind={card.mark} />{card.label}</span>
          <strong className="vprofile-stat-value">{card.value}</strong>
          <span className="vprofile-stat-sub">{card.sub}</span>
        </article>
      ))}
    </div>
  );
}

export function SignalProgress({ tier, progress }: { tier: SignalTierName; progress: ProgressRead }) {
  const pct = Math.min(100, Math.max(0, progress.pct));
  let next = "top signal reached. full instrumentation live.";
  if (progress.nextTier) {
    next = `${progress.pointsToNext ?? 0} points to ${progress.nextTier}: unlocks ${progress.unlocksNext.join(" + ")}.`;
    if (progress.grow.length) next += ` grow by ${progress.grow.join(" · ")}.`;
  }
  return (
    <section className="vprofile-panel vprofile-progress">
      <PanelHead title="signal progress" sub="usage builds your profile" />
      <div className="vprofile-progress__track" role="img" aria-label={`signal progress ${Math.round(pct)} percent`}>
        <span
          className="vprofile-progress__fill"
          style={{
            width: `${pct}%`,
            // One fill div; the hard-stop gradient is sized to the full track
            // (100/pct of the fill width) so tier thresholds stay at 30%/65%.
            backgroundImage: "linear-gradient(90deg, #ffc64d 0 30%, #2ee8d6 30% 65%, #36e39b 65% 100%)",
            backgroundSize: `${10000 / Math.max(pct, 1)}% 100%`,
            backgroundRepeat: "no-repeat",
          }}
        />
      </div>
      <div className="vprofile-progress__tiers" aria-hidden="true">
        {TIER_MARKS.map((markpoint) => (
          <span
            className={`vprofile-progress__tier${tier === markpoint.id ? ` vprofile-signal-${markpoint.id}` : ""}`}
            style={{ left: `${markpoint.at}%` }}
            key={markpoint.id}
          >
            {markpoint.id}
          </span>
        ))}
      </div>
      <p className="vprofile-progress__next">{next}</p>
    </section>
  );
}

export function UsagePanel({ days }: { days: ChartDay[] }) {
  return (
    <section className="vprofile-panel vprofile-usage">
      <PanelHead title="Usage over time" sub="usd/day" />
      <ProfileUsageChart days={days} />
    </section>
  );
}

function BarRow({ bar }: { bar: MixBar }) {
  const fill = bar.color ?? `linear-gradient(90deg, ${bar.from}, ${bar.to})`;
  return (
    <div className="vprofile-bar-row">
      <div className="vprofile-bar-line">
        {bar.logo ? (
          <i className="vprofile-mark vprofile-mark-lg vprofile-mark--logo" aria-hidden="true">
            <img src={bar.logo} alt="" width={14} height={14} loading="lazy" decoding="async" />
          </i>
        ) : bar.mark ? (
          <i
            className="vprofile-mark vprofile-mark-lg"
            style={{ background: `linear-gradient(135deg, ${bar.from}, ${bar.to})`, color: bar.ink }}
            aria-hidden="true"
          >
            {bar.mark}
          </i>
        ) : null}
        <span className="vprofile-bar-label">{bar.label}</span>
        {bar.tag ? <em className="vprofile-stack-tag">{bar.tag}</em> : null}
        {bar.top ? <em className="vprofile-top-tag" style={{ color: bar.color }}>top</em> : null}
        <span className="vprofile-bar-amount">{bar.amount}</span>
      </div>
      <div className="vprofile-bar-track" aria-hidden="true">
        <span className="vprofile-bar-fill" style={{ width: `${Math.min(100, Math.max(0, bar.share))}%`, background: fill }} />
      </div>
    </div>
  );
}

function KeyValueList({ rows }: { rows: KeyValueRow[] }) {
  return (
    <dl className="vprofile-kv">
      {rows.map((row) => (
        <div className="vprofile-kv-row" key={row.label}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function MixRow({
  mix,
  insights,
}: {
  mix: { rows: MixBar[]; more: string | null } | null;
  insights: KeyValueRow[] | null;
}) {
  return (
    <div className="vprofile-cols">
      {mix ? (
        <section className="vprofile-panel">
          <PanelHead title="Your stack" sub="(by spend)" />
          <div className="vprofile-bars" role="group" aria-label="Provider mix by spend">
            {mix.rows.map((bar) => <BarRow bar={bar} key={bar.id} />)}
            {mix.more ? <p className="vprofile-bar-more">{mix.more}</p> : null}
          </div>
        </section>
      ) : null}
      {insights ? (
        <section className="vprofile-panel">
          <PanelHead title="Usage insights" />
          <KeyValueList rows={insights} />
        </section>
      ) : null}
    </div>
  );
}

export function CategoryMix({ rows, sub }: { rows: MixBar[]; sub: string }) {
  return (
    <section className="vprofile-panel">
      <PanelHead title="Specialization" sub={sub} />
      <div className="vprofile-bars" role="group" aria-label="Where the usage lives, by primary category">
        {rows.map((bar, index) => (
          <BarRow
            bar={{ ...bar, color: vibeColor(bar.id), top: index === 0 }}
            key={bar.id}
          />
        ))}
      </div>
    </section>
  );
}

function isoDate(t: number): string {
  return new Date(t).toISOString().slice(0, 10);
}

export function RhythmStrip({ days }: { days: { date: string; ops: number }[] }) {
  const byDate = new Map(days.map((d) => [d.date, d.ops]));
  const stamps = days
    .map((d) => Date.parse(`${d.date}T00:00:00Z`))
    .filter((t) => Number.isFinite(t));
  const cells: Array<{ date: string; ops: number; level: number } | null> = [];
  if (stamps.length) {
    const end = Math.max(...stamps);
    const start = Math.max(Math.min(...stamps), end - (26 * 7 - 1) * DAY_MS);
    const gridStart = start - new Date(start).getUTCDay() * DAY_MS;
    let max = 0;
    for (let t = start; t <= end; t += DAY_MS) max = Math.max(max, byDate.get(isoDate(t)) ?? 0);
    for (let t = gridStart; t <= end; t += DAY_MS) {
      if (t < start) {
        cells.push(null);
        continue;
      }
      const date = isoDate(t);
      const ops = byDate.get(date) ?? 0;
      const level = ops === 0 || max === 0 ? 0 : Math.min(4, Math.max(1, Math.ceil((ops / max) * 4)));
      cells.push({ date, ops, level });
    }
  }
  return (
    <section className="vprofile-panel">
      <PanelHead title="Sync rhythm" sub="(ops per day)" />
      {cells.length ? (
        <div className="vprofile-heat-scroll">
          <div className="vprofile-heat" aria-label="Ops per day heat strip, one column per week">
            {cells.map((cell, index) =>
              cell ? (
                <span
                  className="vprofile-heat-cell"
                  style={{ background: GITHUB_LEVEL_COLORS[cell.level] }}
                  title={`${cell.date}: ${cell.ops} ops`}
                  key={cell.date}
                />
              ) : (
                <span className="vprofile-heat-cell vprofile-heat-blank" key={`pad-${index}`} />
              ),
            )}
          </div>
        </div>
      ) : (
        <p className="vprofile-dim-note">no daily series in this submission</p>
      )}
    </section>
  );
}

export function TrustRow({ tier, signals }: { tier: Tier; signals: TrustChip[] }) {
  return (
    <section className="vprofile-panel">
      <PanelHead title="Trust signals" sub="(labelled evidence, never usage)" />
      <div className="vprofile-trust-row">
        <TrustBadge tier={tier} />
        {signals.map((signal, index) => (
          <span className="vprofile-trust-chip" title={signal.note} key={`${signal.title}-${index}`}>
            <i>{signal.mark}</i> {signal.title} · {signal.metric} · {signal.window}
          </span>
        ))}
        {!signals.length ? <span className="vprofile-dim-note">no trust signals attached</span> : null}
      </div>
    </section>
  );
}

export function CopyInitChip() {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "blocked">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  // The visible copied / copy blocked state IS the error handling for the clipboard
  // call: never a silent catch — the user always sees whether the command landed.
  async function copy() {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText("npx vibetrack init");
      setCopyState("copied");
    } catch {
      setCopyState("blocked");
    }
    timer.current = setTimeout(() => setCopyState("idle"), 1600);
  }
  const stateWord: ReactNode =
    copyState === "copied" ? "copied" : copyState === "blocked" ? "copy blocked" : "copy";
  return (
    <button
      type="button"
      className="vprofile-cta-cmd"
      onClick={copy}
      data-state={copyState}
      aria-label="Copy npx vibetrack init to clipboard"
    >
      <code>npx vibetrack init</code>
      <span aria-live="polite">{stateWord}</span>
    </button>
  );
}

export function DemoBanner() {
  return (
    <section className="vprofile-demo-banner">
      <span className="vprofile-demo-banner__label">sample profile</span>
      <p>This is what your board becomes after one upload. Every number below is bundled demo data.</p>
      <CopyInitChip />
    </section>
  );
}

export interface GhostPanel {
  name: string;
  unlock: string;
}

export function LockedPanels({ note, items }: { note: string; items: GhostPanel[] }) {
  return (
    <section className="vprofile-panel vprofile-locked">
      <PanelHead title="your dashboard, waiting" sub={note} />
      <div className="vprofile-locked__grid">
        {items.map((ghost) => (
          <div className="vprofile-ghost" key={ghost.name}>
            <b>{ghost.name}</b>
            <span>{ghost.unlock}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TrackYours({ providerCount }: { providerCount: number }) {
  return (
    <section className="vprofile-panel vprofile-cta">
      <p className="vprofile-cta-copy">Track yours, locally first. Upload only when you choose.</p>
      <div className="vprofile-cta-actions">
        <CopyInitChip />
        <a className="vprofile-cta-link" href="/providers">browse {providerCount} providers</a>
      </div>
    </section>
  );
}
