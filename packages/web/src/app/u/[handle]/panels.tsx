"use client";

// Presentational panels for the public profile dashboard. Every prop is a
// serializable value computed by the server page; nothing here re-derives
// locale-dependent strings, so SSR and hydration always agree.

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { TrustBadge } from "../../../components/TrustBadge";
import type { ComplexityRead, SignalTier } from "../../../lib/profile-complexity";
import { GITHUB_LEVEL_COLORS } from "../../../lib/profile-trust";
import type { UsageTier } from "../../../components/TrustBadge";
import { ProfileUsageChart, type ChartDay, type ProviderSeries } from "./profile-chart";
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
  { id: "ember", at: 0 },
  { id: "spark", at: 20 },
  { id: "current", at: 40 },
  { id: "surge", at: 60 },
  { id: "supernova", at: 85 },
];

export interface BrandChip {
  id: string;
  label: string;
  mark: string;
  from: string;
  to: string;
  ink: string;
  logo?: string;
}

export type StatMarkKind = "spent" | "credits" | "days" | "sources" | "tokens" | "rank" | "ops" | "commits" | "disciplines";

export interface StatCard {
  label: string;
  mark: StatMarkKind;
  value: string;
  sub: string;
  accent?: string;
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

// The identity header now lives in profile-hero.tsx (ProfileHero) — the C0LINK-adapted
// hero with the glow sigil, discipline pills, quick-state rail, and C0VIBE CTAs.

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
      {kind === "tokens" ? (<><path d="M3 5.5 8 3l5 2.5-5 2.5Z" /><path d="M3 8.5 8 11l5-2.5" /><path d="M3 11 8 13.5 13 11" /></>) : null}
      {kind === "rank" ? (<><path d="M5.5 3h5v3.5a2.5 2.5 0 0 1-5 0Z" /><path d="M8 8.5V11" /><path d="M5.5 13h5" /><path d="M4 4.2H3v1a1.6 1.6 0 0 0 1.5 1.5M12 4.2h1v1a1.6 1.6 0 0 1-1.5 1.5" strokeWidth="1" /></>) : null}
      {kind === "ops" ? (<><path d="M2.5 8.5 5 8.5 6.5 4.5 9.5 12 11 8.5 13.5 8.5" /></>) : null}
      {kind === "commits" ? (<><path d="M8 2.5V6M8 10v3.5" /><circle cx="8" cy="8" r="2.2" /></>) : null}
      {kind === "disciplines" ? (<><circle cx="5" cy="5" r="1.5" /><circle cx="11" cy="5" r="1.5" /><circle cx="5" cy="11" r="1.5" /><circle cx="11" cy="11" r="1.5" /></>) : null}
    </svg>
  );
}

export function StatCards({ cards }: { cards: StatCard[] }) {
  return (
    <div className="vprofile-stats">
      {cards.map((card) => (
        <article
          className="vprofile-panel vprofile-stat"
          style={card.accent ? ({ "--stat-accent": card.accent } as CSSProperties) : undefined}
          key={card.label}
        >
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
            // One fill div; the hard-stop gradient is sized to the full track (100/pct of the fill
            // width) so the five tier thresholds stay fixed at 20% / 40% / 60% / 85%.
            backgroundImage: "linear-gradient(90deg, #ffc64d 0 20%, #ff9d4d 20% 40%, #2ee8d6 40% 60%, #36e39b 60% 85%, #9f7cff 85% 100%)",
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

export function UsagePanel({ days, providers = [] }: { days: ChartDay[]; providers?: ProviderSeries[] }) {
  const sub = providers.length > 0 ? "usd/day · click a source" : "usd/day";
  return (
    <section className="vprofile-panel vprofile-usage">
      <PanelHead title="Usage over time" sub={sub} />
      <ProfileUsageChart days={days} providers={providers} />
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
  mix: { rows: MixBar[]; rest?: MixBar[]; more: string | null } | null;
  insights: KeyValueRow[] | null;
}) {
  const rest = mix?.rest ?? [];
  return (
    <div className="vprofile-cols">
      {mix ? (
        <section className="vprofile-panel">
          <PanelHead title="Your stack" sub="(by spend)" />
          <div className="vprofile-bars" role="group" aria-label="Provider mix by spend">
            {mix.rows.map((bar) => <BarRow bar={bar} key={bar.id} />)}
            {rest.length > 0 && mix.more ? (
              <details className="vprofile-bar-fold">
                <summary className="vprofile-bar-more">{mix.more}</summary>
                <div className="vprofile-bars" role="group" aria-label="More providers">
                  {rest.map((bar) => <BarRow bar={bar} key={bar.id} />)}
                </div>
              </details>
            ) : mix.more ? (
              <p className="vprofile-bar-more">{mix.more}</p>
            ) : null}
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

// Sync rhythm moved to profile-heatmap.tsx (SyncRhythm): a real GitHub-geometry contribution
// calendar keyed on daily spend — the one signal we hold for every day of the history.
export function TrustRow({ tier, signals }: { tier: UsageTier; signals: TrustChip[] }) {
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
      title="Copy npx vibetrack init to clipboard"
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

// The profile's closing CTA now lives in profile-cta.tsx (C0vibeBand): claim/migrate the
// board into a free C0VIBE account, alongside the local-first "track yours" lane.
