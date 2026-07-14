"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { ContributorLaunchpad } from "../../lib/contributor-forge";
import type { ContributorPulse } from "./contributor-pulse";

type CopyState = "idle" | "copied" | "blocked";

interface ContributorIntakeProps {
  launchpad: ContributorLaunchpad;
  pulse: ContributorPulse;
}

function proposalUrl(issue: string, path: string): string {
  const title = `[contribution] ${issue}`;
  const body = [
    "## Proposed contribution",
    issue,
    "",
    `Target path: \`${path}\``,
    "",
    "## Proof I will provide",
    "- [ ] focused tests",
    "- [ ] privacy boundary checked",
    "- [ ] no usage or rank mutation",
  ].join("\n");
  return `https://github.com/B-EtterDigital/vibetracker/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}

export function ContributorIntake({ launchpad, pulse }: ContributorIntakeProps) {
  const [selectedId, setSelectedId] = useState(launchpad.lanes[0]?.id);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedIndex = Math.max(0, launchpad.lanes.findIndex((lane) => lane.id === selectedId));
  const selected = launchpad.lanes[selectedIndex];

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  function moveLane(index: number, event: KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const last = launchpad.lanes.length - 1;
    const next = event.key === "Home"
      ? 0
      : event.key === "End"
        ? last
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? index === 0 ? last : index - 1
          : index === last ? 0 : index + 1;
    setSelectedId(launchpad.lanes[next].id);
    setCopyState("idle");
    tabRefs.current[next]?.focus();
  }

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(selected.command);
      setCopyState("copied");
    } catch {
      setCopyState("blocked");
    }
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopyState("idle"), 1800);
  }

  const copyLabel = copyState === "copied" ? "COPIED" : copyState === "blocked" ? "COPY BLOCKED" : "COPY COMMAND";

  return (
    <section className="contributor-console" aria-labelledby="contributor-console-title">
      <header className="contributor-console__mast">
        <div className="contributor-console__copy">
          <p>VTK://CONTRIBUTOR-INTAKE//PUBLIC-REPO//PROOF-REQUIRED</p>
          <h1 id="contributor-console-title">Open source needs receipts too.</h1>
          <span>Choose one useful lane, see the exact proof boundary, and open a proposal before writing code. Contributor credit stays separate from tracked usage and leaderboard rank.</span>
          <div className="contributor-console__actions">
            <a href={pulse.repositoryUrl} rel="noreferrer" target="_blank">OPEN REPOSITORY <span aria-hidden="true">↗</span></a>
            <a href="https://github.com/B-EtterDigital/vibetracker/issues/new" rel="noreferrer" target="_blank">OPEN PROPOSAL <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <aside className="contributor-console__receipt" data-state={pulse.state} aria-label="GitHub repository receipt">
          <div><i aria-hidden="true" /><b>{pulse.state === "live" ? "LIVE GITHUB" : "GITHUB UNAVAILABLE"}</b></div>
          <strong>{pulse.state === "live" ? pulse.fingerprint : "NO RECEIPT"}</strong>
          <span>{pulse.repository}</span>
          <small>{pulse.state === "live" ? `repository fingerprint // refreshed ${pulse.pushedLabel}` : "no cached values substituted"}</small>
        </aside>
      </header>

      {pulse.state === "live" ? (
        <div className="contributor-pulse" aria-label="Live GitHub repository state">
          <div><span>CONTRIBUTORS</span><strong>{pulse.contributorCount}</strong><small>GitHub API</small></div>
          <div><span>CONTRIBUTIONS</span><strong>{pulse.contributionTotal}</strong><small>reported by GitHub</small></div>
          <div><span>OPEN ISSUES</span><strong>{pulse.openIssues}</strong><small>pull requests excluded</small></div>
          <div><span>STARS / FORKS</span><strong>{pulse.stars} / {pulse.forks}</strong><small>public repository</small></div>
          <div><span>DEFAULT BRANCH</span><strong>{pulse.defaultBranch}</strong><small>last push {pulse.pushedLabel}</small></div>
        </div>
      ) : (
        <div className="contributor-pulse contributor-pulse--unavailable" role="status">
          <strong>LIVE REPOSITORY STATE HELD</strong>
          <span>{pulse.message}</span>
        </div>
      )}

      <div className="contributor-console__workspace">
        <aside className="contributor-console__lanes">
          <header><span>01</span><div><b>SELECT A LANE</b><small>{launchpad.lanes.length} deterministic routes</small></div></header>
          <nav role="tablist" aria-label="Contribution lanes" aria-orientation="vertical">
            {launchpad.lanes.map((lane, index) => (
              <button
                aria-controls={`contributor-panel-${lane.id}`}
                aria-selected={selected.id === lane.id}
                id={`contributor-tab-${lane.id}`}
                key={lane.id}
                onClick={() => { setSelectedId(lane.id); setCopyState("idle"); }}
                onKeyDown={(event) => moveLane(index, event)}
                ref={(node) => { tabRefs.current[index] = node; }}
                role="tab"
                tabIndex={selected.id === lane.id ? 0 : -1}
                type="button"
              >
                <b>{String(index + 1).padStart(2, "0")}</b>
                <span>{lane.label}<small>{lane.impact} // {lane.call}</small></span>
                <i aria-hidden="true" />
              </button>
            ))}
          </nav>
        </aside>

        <article
          aria-labelledby={`contributor-tab-${selected.id}`}
          className="contributor-console__panel"
          id={`contributor-panel-${selected.id}`}
          role="tabpanel"
        >
          <header>
            <div><span>02 / ACTIVE LANE</span><h2>{selected.label}</h2><p>{selected.note}</p></div>
            <strong>{selected.meter}<small>/100 readiness</small></strong>
          </header>

          <div className="contributor-console__command">
            <span>COMMAND</span>
            <code>{selected.command}</code>
            <button onClick={copyCommand} type="button">{copyLabel}</button>
            <small aria-live="polite">{copyState === "copied" ? "Command copied to clipboard." : copyState === "blocked" ? "Clipboard permission was denied." : ""}</small>
          </div>

          <dl className="contributor-console__spec">
            <div><dt>TARGET PATH</dt><dd><code>{selected.path}</code></dd></div>
            <div><dt>PROPOSAL</dt><dd>{selected.issue}</dd></div>
            <div><dt>GUARDRAIL</dt><dd>{selected.guardrail}</dd></div>
          </dl>

          <div className="contributor-console__checklist">
            <span>ACCEPTANCE PACKET</span>
            <ol>{selected.checklist.map((item, index) => <li key={item}><b>{String(index + 1).padStart(2, "0")}</b>{item}</li>)}</ol>
          </div>

          <footer>
            <div><span>USAGE IMPACT</span><b>{selected.usageImpact}</b></div>
            <div><span>RANK IMPACT</span><b>{selected.rankImpact}</b></div>
            <div><span>BADGE RAILS</span><b>{selected.marks.join(" / ") || "REVIEW"}</b></div>
            <a href={proposalUrl(selected.issue, selected.path)} rel="noreferrer" target="_blank">PROPOSE THIS LANE <span aria-hidden="true">↗</span></a>
          </footer>
        </article>
      </div>

      <section className="contributor-console__repo" aria-labelledby="repo-state-title">
        <header><span>03</span><div><h2 id="repo-state-title">Repository queue</h2><p>Only public GitHub facts appear here. Empty means empty; unavailable means unavailable.</p></div></header>
        {pulse.state === "live" ? (
          <div className="contributor-console__repo-grid">
            <div>
              <span>RECORDED CONTRIBUTORS</span>
              {pulse.contributors.length ? <ul>{pulse.contributors.map((person) => <li key={person.login}><a href={person.href} rel="noreferrer" target="_blank">@{person.login}</a><b>{person.contributions} contribution{person.contributions === 1 ? "" : "s"}</b></li>)}</ul> : <p>No contributor records were returned by GitHub.</p>}
            </div>
            <div>
              <span>OPEN CONTRIBUTION ISSUES</span>
              {pulse.issues.length ? <ul>{pulse.issues.map((issue) => <li key={issue.number}><a href={issue.href} rel="noreferrer" target="_blank">#{issue.number} {issue.title}</a><b>{issue.labels.join(" / ") || "unlabelled"}</b></li>)}</ul> : <p>No maintainer-labelled issue exists yet. Open a proposal before coding.</p>}
            </div>
          </div>
        ) : <p className="contributor-console__repo-held">The queue is hidden because GitHub could not be verified. Open the repository directly for current state.</p>}
      </section>
    </section>
  );
}
