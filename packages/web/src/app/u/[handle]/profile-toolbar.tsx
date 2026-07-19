"use client";

// "My Tools" dock (user orders 2026-07-19): every tracked tool as a logo chip; CLICKING a chip
// unfolds a statement panel beneath the rail — the viber's own words about that tool when they
// have left some, otherwise a clear general description — plus that tool's measured stats.
// Clicking through chips swaps the panel content in place; clicking the active chip folds it.
// The unfold is a pure CSS grid-rows spring (transform/opacity only, reduced-motion aware).

import { useState } from "react";

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
}

function fmtInt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}
function fmtUsd(n: number): string {
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`;
}

export function ToolbarDock({ brands }: { brands: DockBrand[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
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
            <p className="vtooldock-text">{active.statement ?? active.blurb}</p>
            {!active.statement ? (
              <p className="vtooldock-hint">no personal statement for this tool yet — this is the general description</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
