"use client";

// The composed infographic board, interactive (user orders 2026-07-15 + 2026-07-19): clicking a
// trait circle opens that SPECIALIZATION — the hexagon switches to that trait's model
// distribution, the story tells its detail, the bars filter to its sources. Clicking the SAME
// circle again switches to the trait's SOURCE distribution (which platforms power it — fal.ai,
// Higgsfield, Leonardo, … for image gen). A third click returns to the overview. The active
// circle wears a mode chip ("models" / "sources") so every click gives visible feedback. Every
// switch re-mounts the instruments so their build-up animations replay.

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
  // second-click view: the source/provider distribution behind this trait
  providerDist?: SpiralItem[];
}

type BoardView = "models" | "sources";

export function InfographicBoard({
  traits,
  specs,
}: {
  traits: TraitPie[];
  specs: Record<string, BoardSpec>;
}) {
  const [activeId, setActiveId] = useState<string>("all");
  const [view, setView] = useState<BoardView>("models");
  const [booted, setBooted] = useState(false);
  const spec = specs[activeId] ?? specs.all;

  const select = (id: string) => {
    setBooted(true); // after the first interaction, animations run snappier
    if (activeId !== id) {
      setActiveId(id);
      setView("models");
      return;
    }
    // same circle again: models → sources (when a distribution exists) → overview
    if (view === "models" && (specs[id]?.providerDist?.length ?? 0) > 0) {
      setView("sources");
      return;
    }
    setActiveId("all");
    setView("models");
  };

  // the displayed instrument set depends on the view: sources swaps the hexagon + titles
  const showingSources = activeId !== "all" && view === "sources" && (spec.providerDist?.length ?? 0) > 0;
  const spiralItems = showingSources ? spec.providerDist! : spec.spiral;
  const spiralTitle = showingSources
    ? `${spec.label} — source distribution by operations`
    : spec.spiralTitle;
  const foot = showingSources
    ? "the platforms powering this specialization — click the circle once more for the overview"
    : spec.story.foot;

  return (
    <section className={`vprofile-panel vboard${booted ? " vboard--fast" : ""}`}>
      <div className="vboard-left" key={`left-${spec.id}-${showingSources ? "src" : "mod"}`}>
        {spiralItems.length >= 1 ? (
          <PolygonSpiral items={spiralItems} sides={6} ariaContext={spiralTitle} />
        ) : null}
        <div className="vboard-bio">
          <h3 className="vboard-story-title">{showingSources ? `${spec.story.title} — sources` : spec.story.title}</h3>
          {spec.story.intro && !showingSources ? <p>{spec.story.intro}</p> : null}
          {spec.story.bullets.length ? (
            <ul className="vboard-story-list">
              {spec.story.bullets.map((line) => <li key={line}>{line}</li>)}
            </ul>
          ) : null}
          {foot ? <p className="vboard-story-foot">{foot}</p> : null}
        </div>
      </div>
      <div className="vboard-right">
        {traits.length ? (
          <TraitPies
            traits={traits}
            activeId={activeId === "all" ? null : activeId}
            mode={showingSources ? "sources" : "models"}
            onSelect={select}
          />
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
