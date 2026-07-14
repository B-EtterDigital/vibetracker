"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { LeaderboardBrief } from "./leaderboard-brief";
import { buildHomeBoardLens, HOME_BOARD_LENSES, type HomeBoardLensId } from "./leaderboard-lens";
import { SignalUplink, type UplinkCopyState } from "./signal-uplink";

export type HomeBoardTier = "verified" | "self_reported";

export interface HomeBoardRow {
  handle: string;
  rank: number;
  medal: string;
  usd: number;
  credits: number;
  ops: number;
  usdLabel: string;
  creditsLabel: string;
  opsLabel: string;
  identityVerified: boolean;
  identityProvider: string | null;
  usageTier: "verified" | "attested" | "self_reported";
}

export interface HomeBoardSnapshot {
  tier: HomeBoardTier;
  label: string;
  signal: string;
  blurb: string;
  status: "live" | "waiting" | "error";
  rows: HomeBoardRow[];
  totals: {
    operators: string;
    usd: string;
    credits: string;
    ops: string;
  };
}

const COMMAND = "npx vibetrack init --gui";
const PAGE_SIZE = 25;

function identityProofLabel(row: HomeBoardRow): string {
  if (!row.identityVerified) return "CLI upload; identity not verified";
  const usage = row.usageTier === "verified" ? "provider-verified usage" : "identity-attested CLI usage";
  if (row.identityProvider === "github") return `GitHub identity verified; ${usage}`;
  return `C0VIBE identity verified; ${usage}`;
}

function IdentityProof({ row }: { row: HomeBoardRow }) {
  return row.identityVerified ? (
    <span className="home-board__identity-proof" data-provider={row.identityProvider ?? "c0vibe"} title={identityProofLabel(row)} aria-label={identityProofLabel(row)}>
      <span aria-hidden="true">✓</span>
    </span>
  ) : (
    <span className="home-board__identity-proof home-board__identity-proof--cli" title={identityProofLabel(row)} aria-label={identityProofLabel(row)}>
      CLI
    </span>
  );
}

function statusCopy(status: HomeBoardSnapshot["status"]): string {
  if (status === "live") return "LIVE BOARD";
  if (status === "error") return "BOARD DEGRADED";
  return "WAITING FOR SIGNAL";
}

export function LeaderboardConsole({ boards }: { boards: HomeBoardSnapshot[] }) {
  // Open on a board that actually has entries. Verified is empty until the GitHub/WorkOS identity
  // system is live, so defaulting to it hid every self-reported viber (who IS ranked) behind an
  // empty tab. Fall back to the declared "verified" only when nothing has data yet.
  const firstLiveTier = (boards.find((board) => board.rows.length > 0)?.tier ?? "verified") as HomeBoardTier;
  const [tier, setTier] = useState<HomeBoardTier>(firstLiveTier);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [lensId, setLensId] = useState<HomeBoardLensId>("usd");
  const [copyState, setCopyState] = useState<UplinkCopyState>("idle");

  const active = boards.find((board) => board.tier === tier) ?? boards[0];
  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return active.rows;
    return active.rows.filter((row) => row.handle.toLowerCase().includes(normalized));
  }, [active.rows, query]);
  const lens = useMemo(() => buildHomeBoardLens(active.rows, lensId), [active.rows, lensId]);
  const visibleRows = expanded ? filteredRows : filteredRows.slice(0, PAGE_SIZE);
  const isWaitingEmpty = active.status === "waiting" && active.rows.length === 0;

  function selectTier(nextTier: HomeBoardTier) {
    setTier(nextTier);
    setQuery("");
    setExpanded(false);
  }

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(COMMAND);
      setCopyState("copied");
    } catch {
      setCopyState("blocked");
    }
  }

  return (
    <section className="home-board" aria-labelledby="home-board-title">
      <header className="home-board__mast">
        <div>
          <p className="home-board__eyebrow">PUBLIC AI USAGE LEDGER</p>
          <h1 id="home-board-title">VibeUsage</h1>
          <p className="home-board__dek">
            Ranked AI spend with identity-verified and handle-only CLI operators kept in separate lanes.
          </p>
        </div>
        <div className="home-board__status" data-state={active.status} aria-live="polite">
          <i aria-hidden="true" />
          <span>{statusCopy(active.status)}</span>
          <code>ISR 60S</code>
        </div>
      </header>

      <div className="home-board__controls">
        <div className="home-board__tiers" role="group" aria-label="Leaderboard trust tier">
          {boards.map((board) => (
            <button
              type="button"
              aria-pressed={tier === board.tier}
              onClick={() => selectTier(board.tier)}
              key={board.tier}
            >
              <span>{board.label}</span>
              <small>{board.signal}</small>
            </button>
          ))}
        </div>
        <button
          className="home-board__copy"
          type="button"
          data-state={copyState}
          onClick={copyCommand}
          title="Copy VibeTRACKER GUI install command"
        >
          <span aria-hidden="true">[+]</span>
          <code>{COMMAND}</code>
          <b>{copyState === "copied" ? "COPIED" : copyState === "blocked" ? "COPY BLOCKED" : "COPY"}</b>
        </button>
      </div>

      <div className="home-board__boundary" data-tier={active.tier}>
        <div>
          <span>ACTIVE LANE</span>
          <b>{active.label}</b>
        </div>
        <p>{active.blurb}</p>
        <strong>TRUST +0 // MIXED RANKS 0</strong>
      </div>

      <dl className="home-board__metrics" aria-label={`${active.label} leaderboard totals`}>
        <div><dt>Ranked operators</dt><dd>{active.totals.operators}</dd></div>
        <div><dt>Spend signal</dt><dd>{active.totals.usd}</dd></div>
        <div><dt>Credits</dt><dd>{active.totals.credits}</dd></div>
        <div><dt>Accepted records</dt><dd>{active.totals.ops}</dd></div>
      </dl>

      {active.status !== "error" ? <LeaderboardBrief rows={active.rows} /> : null}

      {isWaitingEmpty ? (
        <SignalUplink tier={active.tier} copyState={copyState} onCopy={copyCommand} />
      ) : (
        <section className="home-board__chart" aria-labelledby="home-chart-title">
          <div className="home-board__section-head home-board__section-head--chart">
            <div>
              <p>TOP SIGNAL</p>
              <h2 id="home-chart-title">{lens.title}</h2>
            </div>
            <div className="home-board__lens-panel">
              <span>{lens.meta}</span>
              <div className="home-board__lens" role="group" aria-label="Runway display lens">
                {HOME_BOARD_LENSES.map((item) => (
                  <button
                    type="button"
                    aria-pressed={lensId === item.id}
                    onClick={() => setLensId(item.id)}
                    key={item.id}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <small>RANK ORDER UNCHANGED</small>
            </div>
          </div>
          {active.status === "error" ? (
            <div className="home-board__empty" role="status">
              <b>Board temporarily unavailable.</b>
              <span>The diagnostic is recorded; no fallback usage is invented.</span>
            </div>
          ) : lens.rows.length ? (
            <ol className="home-board__runway">
              {lens.rows.map(({ row, barWidth, valueLabel }) => (
                <li key={row.handle}>
                  <a href={`/u/${row.handle}`}>
                    <span className="home-board__rank">{row.medal}</span>
                    <span className="home-board__operator"><b>@{row.handle}</b><IdentityProof row={row} /></span>
                    <span className="home-board__bar" aria-hidden="true">
                      <i style={{ "--bar": barWidth } as CSSProperties} />
                    </span>
                    <strong>{valueLabel}</strong>
                  </a>
                </li>
              ))}
            </ol>
          ) : null}
        </section>
      )}

      {!isWaitingEmpty && active.status !== "error" ? (
        <section className="home-board__directory" aria-labelledby="home-directory-title">
          <div className="home-board__section-head home-board__section-head--directory">
            <div>
              <p>PUBLIC DIRECTORY</p>
              <h2 id="home-directory-title">All ranked operators</h2>
            </div>
            <label>
              <span>Search handle</span>
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setExpanded(false);
                }}
                placeholder="type a handle"
              />
            </label>
          </div>
          <div className="home-board__table-shell">
            <table>
              <thead>
                <tr><th>#</th><th>Operator</th><th>Spend</th><th>Credits</th><th>Records</th><th aria-label="Open profile" /></tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.handle}>
                    <td data-label="Rank">{row.medal}</td>
                    <td data-label="Operator"><span className="home-board__operator"><a href={`/u/${row.handle}`}>@{row.handle}</a><IdentityProof row={row} /></span></td>
                    <td data-label="Spend">{row.usdLabel}</td>
                    <td data-label="Credits">{row.creditsLabel}</td>
                    <td data-label="Records">{row.opsLabel}</td>
                    <td><a href={`/u/${row.handle}`} aria-label={`Open @${row.handle} profile`}>-&gt;</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!visibleRows.length ? (
              <p className="home-board__no-match">No handles match &quot;{query}&quot;.</p>
            ) : null}
          </div>
          {filteredRows.length > PAGE_SIZE ? (
            <button className="home-board__more" type="button" onClick={() => setExpanded((value) => !value)}>
              {expanded ? "Show top 25" : `Show all ${filteredRows.length}`}
            </button>
          ) : null}
        </section>
      ) : null}

      <details className="home-board__encore">
        <summary>Open signal discipline</summary>
        <div>
          <span><b>USAGE</b> feeds spend and credits; accepted records show bundle depth.</span>
          <span><b>NOT USAGE</b> trust evidence explains context and adds zero.</span>
          <span><b>LOCAL ONLY</b> stays on-machine until explicit review.</span>
          <span><b>PUBLISH</b> is manual; hidden uploads remain zero.</span>
        </div>
      </details>
    </section>
  );
}
