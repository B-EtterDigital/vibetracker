import {
  EXCLUDED_MARKED_IMPROVEMENT_NUMBERS,
  roadmapGroups,
  roadmapSummary,
} from "../../../../core/src/capabilities/roadmap";
import type { CSSProperties } from "react";
import { buildRoadmapCommandCenter, buildRoadmapMissionRadar } from "../../lib/roadmap-command-center";

function RoadmapMissionRadarPanel({ radar }: { radar: ReturnType<typeof buildRoadmapMissionRadar> }) {
  return (
    <section className="roadmap-mission-radar" aria-label="Marked-list mission radar">
      <div className="roadmap-mission-radar__head">
        <div>
          <span>VTK://ROADMAP-RADAR//MARKED-LIST//NO-FAKE-BUILT</span>
          <b>{radar.headline}</b>
        </div>
        <p>{radar.subline}</p>
      </div>
      <div className="roadmap-mission-radar__body">
        <aside className="roadmap-mission-terminal" aria-label="Roadmap mission radar terminal">
          <div className="console-top"><span>radar@roadmap</span><b>{radar.totals.coverage}% LIVE</b></div>
          <pre>{radar.terminalLines.join("\n")}</pre>
          <div className="roadmap-mission-pulses" aria-label="Roadmap mission pulses">
            {radar.pulses.map((pulse) => (
              <article key={pulse.label}>
                <span>{pulse.label}</span>
                <strong>{pulse.value}</strong>
                <code>{pulse.route}</code>
                <p>{pulse.note}</p>
              </article>
            ))}
          </div>
        </aside>
        <div className="roadmap-mission-bands" aria-label="Roadmap mission bands">
          {radar.bands.map((band, index) => (
            <article
              className={`roadmap-mission-band roadmap-mission-band--${band.tone}`}
              style={{ "--i": index, "--meter": `${band.meter}%` } as CSSProperties}
              data-band={band.id}
              key={band.id}
            >
              <div className="roadmap-mission-band__top">
                <span>{band.call}</span>
                <b>{band.label}</b>
                <em>{band.meter}% live</em>
              </div>
              <pre>{band.terminal.join("\n")}</pre>
              <p>{band.note}</p>
              <div className="roadmap-mission-band__numbers" aria-label={`${band.label} primary roadmap numbers`}>
                {band.primaryNumbers.map((number, numberIndex) => (
                  <i style={{ "--i": numberIndex } as CSSProperties} key={`${band.id}-${number}`}>#{number}</i>
                ))}
              </div>
              <footer aria-label={`${band.label} stage counts`}>
                <span>{band.live} live</span>
                <span>{band.accepted} accepted</span>
                <span>{band.planned} planned</span>
              </footer>
              <div className="roadmap-mission-band__meter" aria-label={`${band.label} radar meter ${band.meter} percent`}>
                <i />
              </div>
              <strong>{band.guardrail}</strong>
            </article>
          ))}
        </div>
      </div>
      <div className="roadmap-mission-invariants" aria-label="Roadmap mission invariants">
        {radar.invariants.map((invariant) => <span key={invariant}>{invariant}</span>)}
      </div>
    </section>
  );
}

export function RoadmapBlueprint() {
  const summary = roadmapSummary();
  const groups = roadmapGroups();
  const commandCenter = buildRoadmapCommandCenter(groups);
  const missionRadar = buildRoadmapMissionRadar(groups);
  const cockpitDeck = [
    "+------------------------------------------------------+",
    "| VTRK://ROADMAP-CONTROL//C0VIBE-READY                 |",
    "|------------------------------------------------------|",
    `| accepted signals ${String(summary.total).padStart(3, "0")}  groups ${String(summary.groups).padStart(2, "0")}  excluded ${String(EXCLUDED_MARKED_IMPROVEMENT_NUMBERS.length).padStart(2, "0")} |`,
    `| live ${String(summary.live).padStart(3, "0")}  accepted ${String(summary.accepted).padStart(3, "0")}  planned ${String(summary.planned).padStart(3, "0")}                     |`,
    "|------------------------------------------------------|",
    "| browser desktop local-ai creator-ai trust privacy ux |",
    "| adapters analytics exports open-source public board  |",
    "|------------------------------------------------------|",
    "| crossed marks stay out. not-usage labels stay loud.  |",
    "+------------------------------------------------------+",
  ].join("\n");
  const summaryCards = [
    { label: "Live now", value: summary.live, note: "Already visible in CLI, GUI, audit, profile, exports, providers, or public pages." },
    { label: "Accepted", value: summary.accepted, note: "Committed direction, still labelled honestly until built." },
    { label: "Planned", value: summary.planned, note: "Queued work that must not inflate current capability claims." },
    { label: "Excluded", value: EXCLUDED_MARKED_IMPROVEMENT_NUMBERS.length, note: "Crossed-out image items stay out of the accepted product map." },
  ];

  return (
    <>
      <section className="roadmap-hero" aria-label="Accepted roadmap cockpit">
        <div className="roadmap-copy">
          <p className="eyebrow">C0VIBE roadmap cockpit</p>
          <h1>Roadmap control room</h1>
          <p>{summary.total} selected improvements across {summary.groups} lanes. Crossed-out items are intentionally absent, and every future-facing item keeps its stage label.</p>
          <div className="motto-rail" aria-label="C0VIBE motto">
            <span>Vibers Unite</span>
            <a href="https://c0vibe.app">c0vibe.app</a>
          </div>
        </div>
        <div className="roadmap-terminal" aria-label="Roadmap terminal summary">
          <div className="console-top"><span>roadmap@local</span><b>truth map</b></div>
          <pre>{cockpitDeck}</pre>
          <div className="roadmap-feed">
            <span>&gt; load marked image decisions</span>
            <span>&gt; filter crossed-out numbers</span>
            <span>&gt; publish accepted capability lanes</span>
          </div>
        </div>
      </section>

      <section className="roadmap-cockpit" aria-label="Roadmap summary">
        {summaryCards.map((card) => (
          <article key={card.label}>
            <span>{card.label}</span>
            <b>{card.value}</b>
            <p>{card.note}</p>
          </article>
        ))}
      </section>

      <RoadmapMissionRadarPanel radar={missionRadar} />

      <section className="roadmap-command-center" aria-label="Roadmap AI life command center">
        <div className="roadmap-command-center__head">
          <span>VTK://ROADMAP-COMMAND//AI-LIFE-DASHBOARD//C0VIBE</span>
          <b>{commandCenter.headline}</b>
        </div>
        <div className="roadmap-command-center__body">
          <aside className="roadmap-command-terminal" aria-label="Roadmap command terminal">
            <div className="console-top"><span>trajectory@roadmap</span><b>{commandCenter.totals.coverage}% LIVE</b></div>
            <pre>{commandCenter.terminalLines.join("\n")}</pre>
            <div className="roadmap-command-terminal__totals" aria-label="Roadmap command totals">
              <span>{commandCenter.totals.items} items</span>
              <span>{commandCenter.totals.live} live</span>
              <span>{commandCenter.totals.accepted} accepted</span>
              <span>{commandCenter.totals.planned} planned</span>
            </div>
          </aside>
          <div className="roadmap-command-lanes">
            {commandCenter.lanes.map((lane, index) => (
              <article
                className={`roadmap-command-lane roadmap-command-lane--${lane.impact}`}
                style={{ "--i": index, "--meter": `${lane.meter}%` } as CSSProperties}
                data-impact={lane.impact}
                key={lane.id}
              >
                <div className="roadmap-command-lane__top">
                  <span>{lane.call}</span>
                  <b>{lane.label}</b>
                  <em>{lane.impact.replace("_", " ")}</em>
                </div>
                <pre>{lane.terminal.join("\n")}</pre>
                <p>{lane.note}</p>
                <code>{lane.command}</code>
                <div className="roadmap-command-lane__numbers" aria-label={`${lane.label} source roadmap items`}>
                  {lane.itemNumbers.slice(0, 10).map((number, numberIndex) => (
                    <i style={{ "--i": numberIndex } as CSSProperties} key={`${lane.id}-${number}`}>#{number}</i>
                  ))}
                </div>
                <div className="roadmap-command-lane__meter" aria-label={`${lane.label} live coverage ${lane.meter} percent`}>
                  <i />
                </div>
                <strong>{lane.guardrail}</strong>
              </article>
            ))}
          </div>
        </div>
      </section>

      <nav className="roadmap-jumpbar" aria-label="Roadmap lane shortcuts">
        {groups.map((group) => (
          <a key={group.group} href={`#lane-${group.group}`}>
            <span>{String(group.items.length).padStart(2, "0")}</span>
            <b>{group.label}</b>
          </a>
        ))}
      </nav>

      <section className="roadmap-lanes" aria-label="Accepted roadmap lanes">
        {groups.map((group) => (
          <section key={group.group} id={`lane-${group.group}`} className="roadmap-group">
            <header>
              <span>{String(group.items.length).padStart(2, "0")} records</span>
              <h2>{group.label}</h2>
              <p>Accepted capability lane. Items below keep their source numbers and stage tags.</p>
            </header>
            <div className="roadmap-list roadmap-list-cockpit">
              {group.items.map((item) => (
                <article key={item.number} className={`roadmap-item roadmap-item-${item.stage}`}>
                  <span>#{item.number}</span>
                  <div>
                    <b>{item.title}</b>
                    <p>{item.note}</p>
                  </div>
                  <i>{item.stage}</i>
                </article>
              ))}
            </div>
          </section>
        ))}
      </section>

      <section className="roadmap-exclusions">
        <h2>Excluded from the marked image</h2>
        <p className="muted">These original numbers were crossed out and are not part of the accepted roadmap: {EXCLUDED_MARKED_IMPROVEMENT_NUMBERS.join(", ")}.</p>
      </section>
    </>
  );
}
