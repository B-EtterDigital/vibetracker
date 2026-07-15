// Flat-infographic board (user reference 2026-07-15, arrangement orders applied):
//   · LEFT — the hexagon spiral, BIG, anchored into the panel's top-left corner: CLI distribution
//     by active days, coils uncoiling into solid leaders with staircase dots. Bio sits under it.
//   · RIGHT — trait % pies in ONE line (a pie only exists where usage exists), the segmented
//     monthly stack columns below them, every segment labelled on hover.
// Every element carries a detailed plain-language tooltip; entrance animations are CSS-only
// (transform/opacity, reduced-motion aware) and can be replayed by clicking an instrument.
// Palette: the reference's warm contrast with the teal switched to blue/dark-blue (user order).
// All marks re-present the same measured aggregates the text panels hold — never re-derived.

export const INFO_RAMP = ["#f0553d", "#f28c33", "#f2d5a3", "#2f7fd4", "#1d4e89", "#9f7cff"];

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function fmtUsd(n: number): string {
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`;
}

// ---- trait pies -------------------------------------------------------------------------------

export interface TraitPie {
  id: string;
  label: string;
  color: string;
  pct: number; // 0..100 share of operations
}

function pieSlicePath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
}

function SharePie({ pct, color, size = 72 }: { pct: number; color: string; size?: number }) {
  const c = size / 2;
  const r = c - 2;
  // a trait that exists is always visible — floor the slice so <1% still reads as presence
  const sweep = Math.min(359.9, Math.max(12, (pct / 100) * 360));
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="vinfo-pie" aria-hidden="true">
      <circle cx={c} cy={c} r={r} fill="rgba(217,255,242,0.1)" />
      {sweep >= 359.8
        ? <circle cx={c} cy={c} r={r} fill={color} />
        : <path d={pieSlicePath(c, c, r, -90, -90 + sweep)} fill={color} />}
    </svg>
  );
}

// Clickable when onSelect is provided: each circle opens its specialization (hex + story + bars
// switch); clicking the active circle returns to the overview. data-active drives the ring.
export function TraitPies({
  traits,
  activeId,
  onSelect,
}: {
  traits: TraitPie[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
}) {
  return (
    <div className="vinfo-pies" data-selected={activeId ? "true" : undefined}
      aria-label={`Trait mix: ${traits.map((t) => `${t.label} ${t.pct >= 1 ? Math.round(t.pct) : "<1"}%`).join(", ")}`}>
      {traits.map((trait, i) => (
        <button
          type="button"
          className="vinfo-pie-item"
          key={trait.id}
          data-active={trait.id === activeId ? "true" : undefined}
          onClick={onSelect ? () => onSelect(trait.id) : undefined}
          style={{ "--i": i } as React.CSSProperties}
          aria-pressed={trait.id === activeId}
          title={`${trait.label} — ${trait.pct >= 1 ? `${Math.round(trait.pct)}%` : "under 1%"} of all your operations. Click to open this specialization (the hexagon, story and bars switch to it); click again for the overview.`}
        >
          <SharePie pct={trait.pct} color={trait.color} />
          <strong>{trait.pct >= 1 ? `${Math.round(trait.pct)}%` : "<1%"}</strong>
          <span>{trait.label}</span>
        </button>
      ))}
    </div>
  );
}

// ---- hexagon spiral, corner-anchored ------------------------------------------------------------

export interface SpiralItem { label: string; pct: string; color?: string }

// Big open hexagons anchored into the top-left corner; each coil's trace ends at its BOTTOM
// vertex, so bigger coils exit lower and the solid leaders fan naturally to staircase dots —
// no elbows, no crossings.
// The dark navy coil keeps its weight as a shape, but navy TEXT and leader marks are unreadable
// on the dark surface — those switch to a readable royal-blue ink.
const readableInk = (color: string) => (color === "#1d4e89" ? "#7da4f0" : color);

export function PolygonSpiral({ items, sides = 6, ariaContext }: { items: SpiralItem[]; sides?: number; ariaContext?: string }) {
  const shown = items.slice(0, 5);
  const base = 57;
  const step = 44;
  const rMax = base + (shown.length - 1) * step;
  const cx = rMax + 8;
  const cy = rMax + 8;
  const W = 880;
  const H = cy + rMax + 30;
  const angleStep = 360 / sides;
  const endAngle = sides === 6 ? 90 : 54; // hexagons end at the bottom vertex
  const angles = Array.from({ length: sides }, (_, k) => endAngle - (sides - 1 - k) * angleStep);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="vinfo-spiral" role="img"
      aria-label={`${ariaContext ?? "Distribution"}: ${shown.map((s) => `${s.label} ${s.pct}`).join(", ")}`}>
      {shown.map((item, i) => {
        const r = base + i * step;
        const color = item.color ?? INFO_RAMP[i % INFO_RAMP.length];
        const ink = readableInk(color);
        const pts = angles.map((deg) => polar(cx, cy, r, deg));
        const end = pts[pts.length - 1];
        const dotX = cx + rMax + 36 + i * 32; // the staircase: each row's dot lands further right
        const path = `M ${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ")}`;
        const tip = `${item.label} — ${item.pct} of ${ariaContext ?? "this distribution"}. Bigger coil = bigger share.`;
        return (
          <g key={item.label} style={{ "--i": i } as React.CSSProperties} className="vinfo-coilgroup">
            <title>{tip}</title>
            {/* staged sequence per row: coil draws → stripe sweeps left→right → dot pops →
                percentage fades in → tool name last (timing lives in the CSS classes) */}
            <path className="vinfo-coil" pathLength={1} d={path} fill="none" stroke={color} strokeWidth="7" strokeLinejoin="miter" />
            <line className="vinfo-lead" pathLength={1} x1={end[0]} y1={end[1]} x2={dotX} y2={end[1]} stroke={ink} strokeWidth="2.5" />
            <circle className="vinfo-lead-dot" cx={dotX} cy={end[1]} r="5.5" fill={ink} />
            <text className="vinfo-spiral-pct" x={dotX + 16} y={end[1] + 1} dominantBaseline="middle">{item.pct}</text>
            <circle className="vinfo-label-dot" cx={dotX + 84} cy={end[1]} r="3" fill={ink} />
            <text className="vinfo-spiral-label" x={dotX + 97} y={end[1] + 1} dominantBaseline="middle" fill={ink}>{item.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ---- segmented stack columns over a dotted dot-rail -------------------------------------------

export interface StackMonth {
  label: string;
  sharePct: number;
  segments: Array<{ id: string; label: string; value: number; color: string }>;
}

export function StackColumns({ months, ariaLabel }: { months: StackMonth[]; ariaLabel: string }) {
  const barW = 28;
  // viewBox ends AT the last bar's right edge — the SVG's right edge is the alignment line the
  // trait pies share, so "flush right" is truly flush.
  const W = 26 + (months.length - 1) * 74 + barW + 2;
  const H = 400;
  const plotTop = 48;
  const plotBottom = 322;
  const max = Math.max(...months.map((m) => m.segments.reduce((s, x) => s + x.value, 0)), 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="vinfo-stack" role="img" aria-label={ariaLabel}>
      {months.map((month, i) => {
        const x = 26 + i * 74;
        const total = month.segments.reduce((s, seg) => s + seg.value, 0);
        const fullH = (total / max) * (plotBottom - plotTop);
        let y = plotBottom;
        return (
          <g key={month.label + i} className="vinfo-column" style={{ "--i": i } as React.CSSProperties}>
            <text x={x + barW / 2} y={plotTop - 18} textAnchor="middle" className="vinfo-stack-pct">
              <title>{`${month.label} carried ${month.sharePct >= 1 ? Math.round(month.sharePct) : "under 1"}% of the whole window's spend (${fmtUsd(total)}).`}</title>
              {month.sharePct >= 1 ? `${Math.round(month.sharePct)}%` : "<1%"}
            </text>
            <rect x={x} y={plotTop} width={barW} height={Math.max(plotBottom - plotTop - fullH, 0)} fill="rgba(217,255,242,0.09)">
              <title>{`Headroom — ${month.label} spent less than the window's biggest month. The bars share one scale, so heights compare honestly.`}</title>
            </rect>
            {month.segments.map((seg) => {
              const h = total > 0 ? (seg.value / total) * fullH : 0;
              y -= h;
              const share = total > 0 ? Math.round((seg.value / total) * 100) : 0;
              return (
                <rect className="vinfo-seg" key={seg.id} x={x} y={y} width={barW} height={Math.max(h, 0)} fill={seg.color} stroke="#0d1419" strokeWidth="2">
                  <title>{`${month.label} · ${seg.label} — ${fmtUsd(seg.value)} (${share >= 1 ? share : "<1"}% of ${month.label}). Colour = source, same colour in every bar.`}</title>
                </rect>
              );
            })}
            <circle cx={x + barW / 2} cy={plotBottom + 30} r="5" fill="rgba(217,255,242,0.45)" />
            <text x={x + barW / 2} y={plotBottom + 60} textAnchor="middle" className="vinfo-stack-month">{month.label}</text>
          </g>
        );
      })}
      <line x1="16" y1={plotBottom + 30} x2={W - 2} y2={plotBottom + 30} stroke="rgba(217,255,242,0.3)" strokeWidth="2" strokeDasharray="1 7" strokeLinecap="round" />
    </svg>
  );
}

// ---- % donut (signal-read rows) ---------------------------------------------------------------

export function Donut({ pct, center, color, size = 58 }: { pct: number | null; center: string; color: string; size?: number }) {
  const c = size / 2;
  const r = c - 4;
  const path = (() => {
    if (pct == null) return null;
    const sweep = Math.min(359.9, Math.max(4, (pct / 100) * 360));
    const [x0, y0] = polar(c, c, r, -90);
    const [x1, y1] = polar(c, c, r, -90 + sweep);
    return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  })();
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="vinfo-donut" aria-hidden="true">
      <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(217,255,242,0.12)" strokeWidth="4" />
      {path ? <path className="vinfo-donut-arc" pathLength={1} d={path} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" /> : null}
      <text x={c} y={c + 1} textAnchor="middle" dominantBaseline="middle" className="vinfo-donut-center" fill={color}>{center}</text>
    </svg>
  );
}

// ---- the logo toolbar — directly under the hero, opened by a brutalist nameplate ---------------

export interface ToolbarBrand { id: string; label: string; logo?: string; mark: string; from: string }

export function SourceToolbar({ brands }: { brands: ToolbarBrand[] }) {
  if (!brands.length) return null;
  return (
    <div className="vtoolbar" role="list" aria-label="AI toolset — every source tracked on this profile">
      <b className="vtoolbar-title" aria-hidden="true">AI Toolset:</b>
      {brands.map((b, i) => (
        <span
          className="vtoolbar-item"
          role="listitem"
          key={b.id}
          style={{ "--i": i } as React.CSSProperties}
          title={`${b.label} — a tracked source on this profile. Hover any logo for its name; the full stack with spend per source lives in Usage below.`}
        >
          {b.logo
            ? <img src={b.logo} alt={b.label} loading="lazy" />
            : <i style={{ background: b.from }} aria-hidden="true">{b.mark}</i>}
        </span>
      ))}
    </div>
  );
}

// The composed board itself is a client component (clickable specialization switching):
// see profile-board.tsx. This file keeps the pure SVG instruments it composes.
