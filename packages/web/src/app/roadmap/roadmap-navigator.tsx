"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { ImprovementStage } from "../../../../core/src/capabilities/roadmap";
import type { RoadmapReleaseNavigator } from "../../lib/roadmap-release-navigator";

type RoadmapView = ImprovementStage | "excluded";
type CopyState = "idle" | "copied" | "blocked";

const VIEWS: Array<{ id: RoadmapView; label: string; detail: string }> = [
  { id: "live", label: "Shipped", detail: "named implementation path" },
  { id: "accepted", label: "Accepted", detail: "committed, not built" },
  { id: "planned", label: "Planned", detail: "queued, not built" },
  { id: "excluded", label: "Excluded", detail: "deliberately outside map" },
];

export function RoadmapNavigator({ navigator }: { navigator: RoadmapReleaseNavigator }) {
  const [view, setView] = useState<RoadmapView>("live");
  const [laneId, setLaneId] = useState(navigator.lanes[0]?.id);
  const [query, setQuery] = useState("");
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const viewRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lane = navigator.lanes.find((entry) => entry.id === laneId) ?? navigator.lanes[0];

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  const matchingItems = useMemo(() => {
    if (view === "excluded") return [];
    const needle = query.trim().toLowerCase();
    const source = needle ? navigator.lanes.flatMap((entry) => entry.items) : lane.items;
    return source.filter((item) => item.stage === view && (!needle || [item.title, item.note, item.group, String(item.number)].some((value) => value.toLowerCase().includes(needle))));
  }, [lane.items, navigator.lanes, query, view]);

  function moveView(index: number, event: KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const last = VIEWS.length - 1;
    const next = event.key === "Home"
      ? 0
      : event.key === "End"
        ? last
        : event.key === "ArrowLeft"
          ? index === 0 ? last : index - 1
          : index === last ? 0 : index + 1;
    setView(VIEWS[next].id);
    setQuery("");
    viewRefs.current[next]?.focus();
  }

  async function copySnapshot() {
    const receipt = [
      `VibeTRACKER capability snapshot ${navigator.fingerprint}`,
      `live ${navigator.totals.live} | accepted ${navigator.totals.accepted} | planned ${navigator.totals.planned} | excluded ${navigator.totals.excluded}`,
      "Source: core capability manifest. No dates or ETAs encoded.",
    ].join("\n");
    try {
      await window.navigator.clipboard.writeText(receipt);
      setCopyState("copied");
    } catch {
      setCopyState("blocked");
    }
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopyState("idle"), 1800);
  }

  const countFor = (id: RoadmapView) => id === "excluded" ? navigator.totals.excluded : navigator.totals[id];
  const emptyView = view !== "excluded" && matchingItems.length === 0;
  const copyLabel = copyState === "copied" ? "SNAPSHOT COPIED" : copyState === "blocked" ? "COPY BLOCKED" : "COPY SNAPSHOT";

  return (
    <section className="roadmap-navigator" aria-labelledby="roadmap-navigator-title">
      <header className="roadmap-navigator__mast">
        <div>
          <p>VTK://CAPABILITY-MANIFEST//NO-FAKE-DATES//READ-ONLY</p>
          <h1 id="roadmap-navigator-title">See what exists. See what does not.</h1>
          <span>Navigate the shipped capability manifest without confusing it for a dated product schedule. Future lanes stay empty until the source of truth actually changes.</span>
          <div className="roadmap-navigator__actions">
            <a href="https://github.com/B-EtterDigital/vibetracker" rel="noreferrer" target="_blank">OPEN SOURCE <span aria-hidden="true">↗</span></a>
            <a href="https://github.com/B-EtterDigital/vibetracker/issues/new" rel="noreferrer" target="_blank">PROPOSE WORK <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <aside aria-label="Capability manifest receipt">
          <span><i aria-hidden="true" /> SOURCE LOCKED</span>
          <strong>{navigator.fingerprint}</strong>
          <b>{navigator.sourceLabel}</b>
          <small>deterministic snapshot // not a signature</small>
        </aside>
      </header>

      <div className="roadmap-navigator__truth" role="note">
        <b>NO DATES IN SOURCE</b>
        <span>{navigator.sourceNote}</span>
      </div>

      <div className="roadmap-navigator__totals" aria-label="Capability state totals">
        <div data-state="live"><span>SHIPPED</span><strong>{navigator.totals.live}</strong><small>implementation named</small></div>
        <div data-state="accepted"><span>ACCEPTED</span><strong>{navigator.totals.accepted}</strong><small>committed, not built</small></div>
        <div data-state="planned"><span>PLANNED</span><strong>{navigator.totals.planned}</strong><small>queued, not built</small></div>
        <div data-state="excluded"><span>EXCLUDED</span><strong>{navigator.totals.excluded}</strong><small>outside this map</small></div>
        <div><span>CAPABILITY LANES</span><strong>{navigator.totals.lanes}</strong><small>{navigator.totals.items} manifest records</small></div>
      </div>

      <nav className="roadmap-navigator__views" role="tablist" aria-label="Roadmap states">
        {VIEWS.map((entry, index) => (
          <button
            aria-controls={`roadmap-panel-${entry.id}`}
            aria-selected={view === entry.id}
            id={`roadmap-tab-${entry.id}`}
            key={entry.id}
            onClick={() => { setView(entry.id); setQuery(""); }}
            onKeyDown={(event) => moveView(index, event)}
            ref={(node) => { viewRefs.current[index] = node; }}
            role="tab"
            tabIndex={view === entry.id ? 0 : -1}
            type="button"
          >
            <b>{String(index + 1).padStart(2, "0")}</b>
            <span>{entry.label}<small>{entry.detail}</small></span>
            <em>{countFor(entry.id)}</em>
          </button>
        ))}
      </nav>

      <div className="roadmap-navigator__workbench">
        <aside className="roadmap-navigator__lanes" aria-label="Capability lanes">
          <header><span>LANES</span><b>{navigator.lanes.length} source groups</b></header>
          {navigator.lanes.map((entry, index) => (
            <button
              aria-pressed={lane.id === entry.id}
              disabled={view === "excluded"}
              key={entry.id}
              onClick={() => { setLaneId(entry.id); setQuery(""); }}
              type="button"
            >
              <b>{String(index + 1).padStart(2, "0")}</b>
              <span>{entry.label}<small>{entry.counts.live} shipped // {entry.items.length} total</small></span>
              <i>{entry.liveCoverage}%</i>
            </button>
          ))}
        </aside>

        <div className="roadmap-navigator__panel" id={`roadmap-panel-${view}`} role="tabpanel" aria-labelledby={`roadmap-tab-${view}`}>
          <header>
            <div><span>{view === "excluded" ? "DECISION LOG" : `${view.toUpperCase()} / ${query ? "ALL LANES" : lane.label.toUpperCase()}`}</span><h2>{view === "live" ? lane.label : VIEWS.find((entry) => entry.id === view)?.label}</h2></div>
            {view !== "excluded" && <label><span>SEARCH MANIFEST</span><input aria-label="Search capability manifest" onChange={(event) => setQuery(event.target.value)} placeholder="title, command, item #" type="search" value={query} /></label>}
          </header>

          {view === "excluded" ? (
            <section className="roadmap-navigator__excluded" aria-label="Excluded source decisions">
              <p>These numbers were crossed out in the marked source and are intentionally absent from the accepted capability map. The source does not attach feature titles or delivery promises to them.</p>
              <div>{navigator.excludedNumbers.map((number) => <span key={number}>#{number}</span>)}</div>
            </section>
          ) : emptyView ? (
            <section className="roadmap-navigator__empty" role="status">
              <span>{view.toUpperCase()} QUEUE EMPTY</span>
              <h2>No {view} capability is encoded.</h2>
              <p>The interface does not promote shipped work, GitHub issues, or wish-list copy into this state. A future item appears here only after the core manifest labels it {view}.</p>
              <a href="https://github.com/B-EtterDigital/vibetracker/issues/new" rel="noreferrer" target="_blank">OPEN A PROPOSAL <span aria-hidden="true">↗</span></a>
            </section>
          ) : (
            <ol className="roadmap-navigator__items">
              {matchingItems.map((item) => (
                <li key={item.number}>
                  <span>#{String(item.number).padStart(3, "0")}</span>
                  <div><h3>{item.title}</h3><p>{item.note}</p></div>
                  <b>{item.stage}</b>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <footer className="roadmap-navigator__footer">
        <div>{navigator.invariants.map((invariant, index) => <span key={invariant}><b>{String(index + 1).padStart(2, "0")}</b>{invariant}</span>)}</div>
        <button onClick={copySnapshot} type="button">{copyLabel}</button>
        <small aria-live="polite">{copyState === "copied" ? "Capability snapshot copied to clipboard." : copyState === "blocked" ? "Clipboard permission was denied." : ""}</small>
      </footer>
    </section>
  );
}
