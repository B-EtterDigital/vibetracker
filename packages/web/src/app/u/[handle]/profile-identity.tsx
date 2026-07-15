// Viber identity plate — the flat-infographic poster that opens the profile (user order
// 2026-07-15: instruments exactly like the reference infographic). Two reads on one plate:
//
//  · TRAIT PIES — one % pie per discipline the viber actually uses (coding, image, video,
//    music…), only rendered with real usage. The FIRST SIGHT that says specialist or
//    all-rounder: one dominant pie vs a full row.
//  · BADGE WALL — every archetype held is an earned stamp with its criterion printed on it.
//    Hybrids stack badges; holding 2+ archetypes additionally earns the ALL-ROUNDER crest
//    (3+ reads MULTIHYBRID). Every viber type is a special — including the specialist.
//
// Data honesty is inherited: archetypes come from computeProfileSignals (measured thresholds,
// documented in lib/profile-signals.ts); trait shares are the same ops-weighted category mix as
// Specialization. This plate re-presents, it never re-derives.

import type { ProfileSignals } from "../../../lib/profile-signals";

// ---- badge sigils — one geometric mark per archetype, drawn, never emoji ----------------------

function SigilOrbit({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="6" fill="none" stroke={color} strokeWidth="2.5" />
      <path d="M 24 4 A 20 20 0 0 1 44 24" fill="none" stroke={color} strokeWidth="2.5" />
      <path d="M 24 44 A 20 20 0 0 1 4 24" fill="none" stroke={color} strokeWidth="2.5" />
      <circle cx="44" cy="24" r="3" fill={color} />
      <circle cx="4" cy="24" r="3" fill={color} />
      <path d="M 24 11 A 13 13 0 0 1 37 24" fill="none" stroke={color} strokeWidth="1.5" opacity="0.55" />
    </svg>
  );
}
function SigilLoop({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M 12 30 A 14 14 0 1 1 36 30" fill="none" stroke={color} strokeWidth="2.5" />
      <path d="M 36 30 l -6 -2 m 6 2 l 1 -6" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="square" />
      <circle cx="24" cy="38" r="4" fill="none" stroke={color} strokeWidth="2.5" />
    </svg>
  );
}
function SigilBurst({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="7" fill="none" stroke={color} strokeWidth="2.5" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const a = (deg * Math.PI) / 180;
        const x0 = 24 + 12 * Math.cos(a), y0 = 24 + 12 * Math.sin(a);
        const x1 = 24 + (deg % 90 === 0 ? 21 : 17) * Math.cos(a), y1 = 24 + (deg % 90 === 0 ? 21 : 17) * Math.sin(a);
        return <line key={deg} x1={x0} y1={y0} x2={x1} y2={y1} stroke={color} strokeWidth="2.5" />;
      })}
    </svg>
  );
}
function SigilBrackets({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M 18 12 L 6 24 L 18 36" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="square" />
      <path d="M 30 12 L 42 24 L 30 36" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="square" />
      <line x1="27" y1="10" x2="21" y2="38" stroke={color} strokeWidth="2" opacity="0.6" />
    </svg>
  );
}
function SigilSpark({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M 24 4 L 30 18 L 44 24 L 30 30 L 24 44 L 18 30 L 4 24 L 18 18 Z" fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="miter" />
      <circle cx="24" cy="24" r="3" fill={color} />
    </svg>
  );
}
// The all-rounder crest wears the full ramp — four quadrant arcs, four disciplines' colours.
function SigilCrest() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M 24 4 A 20 20 0 0 1 44 24" fill="none" stroke="#2ee8d6" strokeWidth="3" />
      <path d="M 44 24 A 20 20 0 0 1 24 44" fill="none" stroke="#ea7317" strokeWidth="3" />
      <path d="M 24 44 A 20 20 0 0 1 4 24" fill="none" stroke="#ffc64d" strokeWidth="3" />
      <path d="M 4 24 A 20 20 0 0 1 24 4" fill="none" stroke="#9f7cff" strokeWidth="3" />
      <path d="M 24 13 L 27 21 L 35 24 L 27 27 L 24 35 L 21 27 L 13 24 L 21 21 Z" fill="none" stroke="#eafff8" strokeWidth="2" />
    </svg>
  );
}

interface BadgeSpec {
  key: string;
  title: string;
  color: string;
  criterion: string;
  sigil: React.ReactNode;
  crest?: boolean;
}

// Criterion lines print the REAL earning thresholds from lib/profile-signals.ts — a badge you can
// see how to earn is a badge worth holding.
const BADGE_FOR: Record<string, Omit<BadgeSpec, "key">> = {
  "Swarm Orchestrator": {
    title: "Swarm Orchestrator",
    color: "#2ee8d6",
    criterion: "3+ active CLIs · 8+ cross-provider days · under 18% input + output share",
    sigil: <SigilOrbit color="#2ee8d6" />,
  },
  "Human-in-the-loop": {
    title: "Human-in-the-Loop",
    color: "#ffc64d",
    criterion: "22%+ input + output share of all measured tokens",
    sigil: <SigilLoop color="#ffc64d" />,
  },
  "Media Generator": {
    title: "Media Generator",
    color: "#ea7317",
    criterion: "400+ creative operations across image, video or music",
    sigil: <SigilBurst color="#ea7317" />,
  },
  "Solo Coder": {
    title: "Solo Coder",
    color: "#9f7cff",
    criterion: "measured token activity · up to 2 active CLIs · no stronger archetype",
    sigil: <SigilBrackets color="#9f7cff" />,
  },
  "AI Creator": {
    title: "AI Creator",
    color: "#36e39b",
    criterion: "active profile without a stronger measured archetype",
    sigil: <SigilSpark color="#36e39b" />,
  },
};

export function buildBadges(signals: ProfileSignals): BadgeSpec[] {
  const badges: BadgeSpec[] = signals.archetypes
    .filter((a) => BADGE_FOR[a])
    .map((a) => ({ key: a, ...BADGE_FOR[a] }));
  // The stacking rule: holding 2+ archetypes at once earns the crest on top — that's how a viber
  // wears two (or more) badges. 3+ archetypes upgrades the crest to MULTIHYBRID.
  if (badges.length >= 2) {
    badges.push({
      key: "all-rounder",
      title: badges.length >= 3 ? "Multihybrid" : "All-Rounder",
      color: "#eafff8",
      criterion: `holds ${badges.length} archetypes at once`,
      sigil: <SigilCrest />,
      crest: true,
    });
  }
  return badges;
}

export interface TraitLevelRead {
  id: string;
  label: string;
  level: number;     // 0..10
  progress: number;  // 0..1 toward the next level
  detail: string;    // "12.4k credits · next level at 25k credits"
}

export function ViberIdentity({
  signals,
  opsValue,
  traitLevels = [],
}: {
  signals: ProfileSignals;
  opsValue: string;
  traitLevels?: TraitLevelRead[];
}) {
  const badges = buildBadges(signals);

  return (
    <section className="vprofile-panel vident">
      <header className="vident-mast">
        <div className="vident-mast-left">
          <span className="vident-eyebrow">viber identity</span>
          <h2 className="vident-archetype">{signals.archetypeLabel}</h2>
          <p className="vident-blurb">{signals.archetypeBlurb} · {opsValue} operations</p>
        </div>
        <div className="vident-mast-count" aria-label={`${badges.length} badges earned`}>
          <b>{String(badges.length).padStart(2, "0")}</b>
          <span>badge{badges.length === 1 ? "" : "s"}<br />earned</span>
        </div>
      </header>

      <div className="vident-badges vident-badges--band">
        <span className="vident-badges-head">badges — every archetype is a special · hybrids stack</span>
        <div className="vident-badge-wall">
          {badges.map((badge) => (
            <div
              className={`vident-badge${badge.crest ? " vident-badge--crest" : ""}`}
              style={{ "--badge-c": badge.color } as React.CSSProperties}
              key={badge.key}
            >
              <span className="vident-badge-sigil">{badge.sigil}</span>
              <strong className="vident-badge-title">{badge.title}</strong>
              <span className="vident-badge-crit">{badge.criterion}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trait levels — ten medals per discipline (C0VIBE achievement design language: pure-energy
          pucks, deliberately static). Level 1 is easy; every level after it is earned. A trait a
          viber uses but hasn't levelled shows its first medal locked. */}
      {traitLevels.length ? (
        <div className="vident-levels">
          <span className="vident-badges-head">trait levels — L1 comes fast · L10 takes years</span>
          <div className="vident-level-row">
            {traitLevels.map((trait) => {
              const medal = String(Math.max(trait.level, 1)).padStart(2, "0");
              return (
                <div
                  className="vident-level"
                  data-locked={trait.level === 0 ? "true" : undefined}
                  key={trait.id}
                  title={`${trait.label} — ${trait.level === 0 ? "level 1 not reached yet" : `level ${trait.level} of 10`} · ${trait.detail}. Creative traits level on credits burned, coding on operations — thresholds are the same for every viber.`}
                >
                  <img src={`/badges/lvl-${medal}.webp`} alt="" width={72} height={72} loading="lazy" />
                  <strong>{trait.level === 0 ? "—" : `LVL ${trait.level}`}</strong>
                  <span>{trait.label}</span>
                  <i className="vident-level-track" aria-hidden="true">
                    <b style={{ width: `${Math.round(trait.progress * 100)}%` }} />
                  </i>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
