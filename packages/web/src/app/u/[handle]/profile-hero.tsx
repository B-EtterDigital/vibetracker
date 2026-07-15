// Profile hero — oriented to the C0VIBE / C0LINK public-profile header so migrating to C0VIBE
// feels like the same profile, not a different site: a big banner with a large SQUARE avatar and
// the name bottom-aligned over it (C0VIBE's `publicProfile.hero.css`: 132px square avatar with an
// accent ring, a tall banner, content at the banner foot). Rendered in VibeTRACKER's locked
// language — monospace, locked palette, the C0VIBE starfield as the banner, and a wash taken from
// the viber's OWN top discipline (signal, not decoration).
//
// Viber rule (canonical): an all-rounder is shown as the FULL SET of their disciplines, never
// collapsed to "generalist". Every discipline gets a pill.

import type { CSSProperties } from "react";
import type { BrandChip } from "./panels";
import { HeroCustomize } from "./profile-hero-custom";

// The five signal tiers, low → high. "Signal" measures how complete/deep a tracked profile is
// (sources, disciplines, history, spend, activity) — not a ranking of who spends most.
const SIGNAL_TIERS = ["ember", "spark", "current", "surge", "supernova"] as const;

export interface HeroDiscipline {
  id: string;
  label: string;
  color: string;
  share: number;
}

export interface HeroState {
  label: string;
  value: string;
  title?: string;
}

export interface HeroModel {
  model: string;
  spend: string;
}

export interface HeroMetric {
  label: string;
  value: string;
  note: string;
  title?: string;
}

export interface ProfileHeroProps {
  handle: string;
  accent: string;
  eyebrow: string;
  identity: string;
  identityVerified: boolean;
  identityProvider?: string;
  signalTier: string;
  signalHint: string;
  tierChip: string;
  metrics: HeroMetric[];
}

export interface ProfileHeroEvidenceProps {
  accent: string;
  signalTier: string;
  signalHint: string;
  since: string;
  state: HeroState[];
  topModels: HeroModel[];
  brands: BrandChip[];
  disciplines: HeroDiscipline[];
  userBio: string;
}

// Source = a big logo tile, no label until you hover — the name floats up on hover / focus. The
// title attribute keeps it accessible and gives a native tooltip.
function SourceTile({ brand }: { brand: BrandChip }) {
  return (
    <span className="vhero-source" tabIndex={0} title={brand.label} aria-label={brand.label}>
      {brand.logo ? (
        <img className="vhero-source-logo" src={brand.logo} alt="" width={40} height={40} loading="lazy" decoding="async" />
      ) : (
        <i
          className="vhero-source-glyph"
          style={{ background: `linear-gradient(135deg, ${brand.from}, ${brand.to})`, color: brand.ink }}
          aria-hidden="true"
        >
          {brand.mark}
        </i>
      )}
      <em className="vhero-source-name">{brand.label}</em>
    </span>
  );
}

export function ProfileHero({
  handle,
  accent,
  eyebrow,
  identity,
  identityVerified,
  identityProvider,
  signalTier,
  signalHint,
  tierChip,
  metrics,
}: ProfileHeroProps) {
  const proofLabel = identityVerified
    ? identityProvider === "github" ? "GitHub verified" : "C0VIBE verified"
    : "CLI handle only";
  const proofDetail = identityVerified
    ? `${proofLabel}; identity proof only, usage evidence remains separate`
    : "CLI handle only; identity is not verified and usage evidence remains separate";

  return (
    <section className="vhero" style={{ "--vhero-accent": accent } as CSSProperties}>
      {/* ---- banner: starfield + discipline wash, content bottom-aligned ---- */}
      <div className="vhero-banner">
        <span className="vhero-banner-art" aria-hidden="true" />
        <span className="vhero-banner-wash" aria-hidden="true" />
        <span className="vhero-banner-grid" aria-hidden="true" />

        {/* pre-login customization: banner + avatar preview instantly; saving needs sign-in */}
        <HeroCustomize />

        <div className="vhero-banner-foot">
          <div className="vhero-avatar" aria-hidden="true">
            <span className="vhero-avatar-ring" />
            <span className="vhero-avatar-mark">{handle.slice(0, 2)}</span>
            <i className={`vhero-avatar-tier vprofile-signal-${signalTier}`}>{signalTier}</i>
          </div>

          <div className="vhero-headline">
            <p className="vhero-eyebrow">{eyebrow}</p>
            <div className="vhero-name-line">
              <h1 className="vhero-name">@{handle}</h1>
              <span
                className="vhero-identity-proof"
                data-state={identityVerified ? "verified" : "cli"}
                role="img"
                aria-label={proofDetail}
                title={proofDetail}
              >
                <span aria-hidden="true">{identityVerified ? "✓" : "CLI"}</span>
                <b>{proofLabel}</b>
              </span>
            </div>
            <p className="vhero-identity" title={signalHint}>
              {identity}
              <i className="vhero-dot" aria-hidden="true" />
              {signalTier} signal
              <i className="vhero-dot" aria-hidden="true" />
              <span className="vhero-tier-chip">{tierChip.replace(/_/g, " ")}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ---- compact lifetime footprint: current-period evidence follows immediately after ---- */}
      <div className="vhero-body">
        <div className="vhero-footprint-head">
          <p>Lifetime footprint</p>
          <span>uploaded aggregates · current 30-day read follows</span>
        </div>

        <dl className="vhero-metrics">
          {metrics.map((metric) => (
            <div className="vhero-metric" key={metric.label}>
              <dt>{metric.label}</dt>
              <dd title={metric.title} aria-label={metric.title ?? metric.value}>{metric.value}</dd>
              <p>{metric.note}</p>
            </div>
          ))}
        </dl>
        {/* The C0VIBE join/migrate doors live ONLY in the band at the very end of the page. */}
      </div>
    </section>
  );
}

export function ProfileHeroEvidence({
  accent,
  signalTier,
  signalHint,
  since,
  state,
  topModels,
  brands,
  disciplines,
  userBio,
}: ProfileHeroEvidenceProps) {
  return (
    <section
      className="vhero-evidence"
      style={{ "--vhero-accent": accent } as CSSProperties}
      aria-labelledby="vhero-evidence-title"
    >
      <header className="vhero-evidence-head">
        <div>
          <p>Evidence bay</p>
          <h2 id="vhero-evidence-title">What sits behind this profile</h2>
        </div>
        <span>models ranked by spend · sources are complete</span>
      </header>

      {disciplines.length ? (
        <ul className="vhero-disciplines" aria-label="Disciplines this viber creates in">
          {disciplines.map((d) => (
            <li className="vhero-discipline" style={{ "--vd": d.color } as CSSProperties} key={d.id}>
              <i aria-hidden="true" />
              {d.label}
              <b>{d.share < 1 ? "<1" : Math.round(d.share)}%</b>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="vhero-evidence-grid">
        <aside className="vhero-state" aria-label="Viber state">
          <p className="vhero-state-head">viber state</p>
          <dl className="vhero-state-grid">
            {state.map((row) => (
              <div className="vhero-state-cell" key={row.label}>
                <dt>{row.label}</dt>
                <dd title={row.title} aria-label={row.title ?? row.value}>{row.value}</dd>
              </div>
            ))}
          </dl>

          {topModels.length ? (
            <div className="vhero-topmodels">
              <p className="vhero-topmodels-head">top 5 models · by spend</p>
              <ol className="vhero-topmodels-list">
                {topModels.map((m, i) => (
                  <li key={m.model}>
                    <span className="vhero-topmodels-rank">{i + 1}</span>
                    <span className="vhero-topmodels-name" title={m.model}>{m.model}</span>
                    <span className="vhero-topmodels-spend">{m.spend}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          <p className="vhero-state-foot">
            viber since {since}
            <span className="vhero-signal-note" title={signalHint}>
              signal = how deep your tracked profile is ·{" "}
              {SIGNAL_TIERS.map((t, i) => (
                <span key={t}>
                  {i > 0 ? " → " : " "}
                  {t === signalTier ? <b>{t}</b> : t}
                </span>
              ))}
            </span>
          </p>
        </aside>

        <div className="vhero-evidence-stack">
          {brands.length ? (
            <div className="vhero-sources" aria-label="Sources tracked on this profile">
              <p className="vhero-sources-head">
                Tracked sources
                <span>{brands.length} total · focus a tile for its name</span>
              </p>
              <div className="vhero-source-row">
                {brands.map((brand) => <SourceTile brand={brand} key={brand.id} />)}
              </div>
            </div>
          ) : null}

          <div className="vhero-biobar">
            {userBio ? (
              <p className="vhero-userbio">{userBio}</p>
            ) : (
              <p className="vhero-addbio">
                <i aria-hidden="true">+</i>
                Add a bio — <code>vibetracker profile --bio &quot;…&quot;</code> then re-sync
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
