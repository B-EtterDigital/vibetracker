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

export interface HeroDiscipline {
  id: string;
  label: string;
  color: string;
  share: number;
}

export interface HeroState {
  label: string;
  value: string;
}

export interface ProfileHeroProps {
  handle: string;
  accent: string;
  eyebrow: string;
  identity: string;
  signalTier: string;
  signalHint: string;
  tierChip: string;
  bio: string;
  since: string;
  disciplines: HeroDiscipline[];
  state: HeroState[];
  brands: BrandChip[];
  joinHref: string;
  migrateHref: string;
}

function BrandPill({ brand }: { brand: BrandChip }) {
  return (
    <span className="vhero-brand-pill">
      {brand.logo ? (
        <i className="vprofile-mark vprofile-mark--logo" aria-hidden="true">
          <img src={brand.logo} alt="" width={14} height={14} loading="lazy" decoding="async" />
        </i>
      ) : (
        <i
          className="vprofile-mark"
          style={{ background: `linear-gradient(135deg, ${brand.from}, ${brand.to})`, color: brand.ink }}
          aria-hidden="true"
        >
          {brand.mark}
        </i>
      )}
      {brand.label}
    </span>
  );
}

export function ProfileHero({
  handle,
  accent,
  eyebrow,
  identity,
  signalTier,
  signalHint,
  tierChip,
  bio,
  since,
  disciplines,
  state,
  brands,
  joinHref,
  migrateHref,
}: ProfileHeroProps) {
  return (
    <section className="vhero" style={{ "--vhero-accent": accent } as CSSProperties}>
      {/* ---- banner: starfield + discipline wash, content bottom-aligned ---- */}
      <div className="vhero-banner">
        <span className="vhero-banner-art" aria-hidden="true" />
        <span className="vhero-banner-wash" aria-hidden="true" />
        <span className="vhero-banner-grid" aria-hidden="true" />

        <div className="vhero-banner-foot">
          <div className="vhero-avatar" aria-hidden="true">
            <span className="vhero-avatar-ring" />
            <span className="vhero-avatar-mark">{handle.slice(0, 2)}</span>
            <i className={`vhero-avatar-tier vprofile-signal-${signalTier}`}>{signalTier}</i>
          </div>

          <div className="vhero-headline">
            <p className="vhero-eyebrow">{eyebrow}</p>
            <h1 className="vhero-name">@{handle}</h1>
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

      {/* ---- body: bio + disciplines + doors on the left, viber state on the right ---- */}
      <div className="vhero-body">
        <div className="vhero-lead">
          <p className="vhero-bio">{bio}</p>

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

          <div className="vhero-actions">
            <a className="vhero-cta vhero-cta--primary" href={joinHref}>
              Join C0VIBE — free
              <i aria-hidden="true">&#8599;</i>
            </a>
            <a className="vhero-cta" href={migrateHref}>Migrate this profile</a>
          </div>
        </div>

        <aside className="vhero-state" aria-label="Viber state">
          <p className="vhero-state-head">viber state</p>
          <dl className="vhero-state-grid">
            {state.map((row) => (
              <div className="vhero-state-cell" key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
          <p className="vhero-state-foot">viber since {since}</p>
        </aside>
      </div>

      {brands.length ? (
        <div className="vhero-brands" aria-label="Top sources by estimated spend">
          {brands.map((brand) => <BrandPill brand={brand} key={brand.id} />)}
        </div>
      ) : null}
    </section>
  );
}
