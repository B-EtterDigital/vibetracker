"use client";

// The composed infographic board, interactive (user orders 2026-07-15): clicking a trait circle
// opens that SPECIALIZATION — the hexagon switches to that trait's model distribution, the story
// text below tells that trait's detail (bullets welcome, shape varies per spec), and the bars
// filter to that trait's sources. Clicking the active circle returns to the overview. Every
// switch re-mounts the instruments so their build-up animations replay in front of the user —
// the very first build-up runs long; switches run snappier (the --vspd CSS multiplier).

import { useState } from "react";
import {
  PolygonSpiral,
  StackColumns,
  TraitPies,
  type SpiralItem,
  type StackMonth,
  type TraitPie,
} from "./profile-infographic";

export interface BoardStory {
  title: string;
  intro?: string;
  bullets: string[];
  foot?: string;
}

export interface BoardSpec {
  id: string;
  label: string;
  spiralTitle: string;
  spiral: SpiralItem[];
  months: StackMonth[];
  story: BoardStory;
}

export function InfographicBoard({
  traits,
  specs,
}: {
  traits: TraitPie[];
  specs: Record<string, BoardSpec>;
}) {
  const [activeId, setActiveId] = useState<string>("all");
  const [booted, setBooted] = useState(false);
  const spec = specs[activeId] ?? specs.all;

  const select = (id: string) => {
    setBooted(true); // after the first interaction, animations run snappier
    setActiveId((current) => (current === id ? "all" : id));
  };

  return (
    <section className={`vprofile-panel vboard${booted ? " vboard--fast" : ""}`}>
      <div className="vboard-left" key={`left-${spec.id}`}>
        {spec.spiral.length >= 1 ? (
          <PolygonSpiral items={spec.spiral} sides={6} ariaContext={spec.spiralTitle} />
        ) : null}
        <div className="vboard-bio">
          <h3 className="vboard-story-title">{spec.story.title}</h3>
          {spec.story.intro ? <p>{spec.story.intro}</p> : null}
          {spec.story.bullets.length ? (
            <ul className="vboard-story-list">
              {spec.story.bullets.map((line) => <li key={line}>{line}</li>)}
            </ul>
          ) : null}
          {spec.story.foot ? <p className="vboard-story-foot">{spec.story.foot}</p> : null}
        </div>
      </div>
      <div className="vboard-right">
        {traits.length ? (
          <TraitPies traits={traits} activeId={activeId === "all" ? null : activeId} onSelect={select} />
        ) : null}
        {spec.months.length >= 2 ? (
          <div key={`bars-${spec.id}`} className="vboard-bars-mount">
            <StackColumns
              months={spec.months}
              ariaLabel={`${spec.spiralTitle} — monthly spend: ${spec.months.map((m) => `${m.label} ${Math.round(m.sharePct)}%`).join(", ")}`}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
