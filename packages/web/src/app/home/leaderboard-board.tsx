// The category-aware public leaderboard (SMOA run 2026-07-20, lane M redesign). VTK terminal
// aesthetic: IBM Plex mono, bone/mint ink, dashed hairlines, uppercase panel headers. State is
// carried entirely in shareable URL search params (?cat=music&sort=ops) so every board is a
// link — the filter rail is plain <a> anchors and the whole surface stays a server component
// (no client JS, no client bundle). Data honesty is inherited from fetchLeaderboard: rows are
// rendered exactly as the planner contract delivers them, with no fabricated flags or ranks.

import { LEADERBOARD_CATEGORIES, type LeaderboardRow } from "../../lib/leaderboard-contract.ts";
import {
  boardHref,
  categoryPillLabel,
  flagEmoji,
  formatBoardUsd,
  formatCompactInt,
  isTopThree,
  rankLabel,
  rowInfoLine,
} from "../leaderboard-params.ts";
import type { LeaderboardFilters } from "../../lib/leaderboard-contract.ts";

const SORTS = [
  { id: "usd", label: "SPEND" },
  { id: "ops", label: "OPS" },
] as const;

function FilterRail({ filters }: { filters: LeaderboardFilters }) {
  return (
    <div className="vlb-rail">
      <nav className="vlb-cats" aria-label="Filter leaderboard by discipline">
        {LEADERBOARD_CATEGORIES.map((category) => {
          const active = category === filters.category;
          return (
            <a
              className="vlb-pill"
              key={category}
              href={boardHref(category, filters.sort)}
              data-active={active ? "true" : undefined}
              aria-current={active ? "page" : undefined}
            >
              {categoryPillLabel(category)}
            </a>
          );
        })}
      </nav>
      <div className="vlb-sort" role="group" aria-label="Sort leaderboard">
        {SORTS.map((sortOption) => {
          const active = sortOption.id === filters.sort;
          return (
            <a
              className="vlb-sort-toggle"
              key={sortOption.id}
              href={boardHref(filters.category, sortOption.id)}
              data-active={active ? "true" : undefined}
              aria-current={active ? "page" : undefined}
            >
              {sortOption.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}

function BoardRow({ row }: { row: LeaderboardRow }) {
  const top = isTopThree(row.rank);
  const flag = flagEmoji(row.country);
  const info = rowInfoLine(row);
  return (
    <a
      className={`vlb-row${top ? " vlb-row--top" : ""}`}
      href={`/u/${row.handle}`}
      data-top3={top ? "true" : undefined}
    >
      <span className="vlb-rank" aria-hidden="true">{rankLabel(row.rank)}</span>
      {flag ? (
        <span className="vlb-flag" role="img" aria-label={`country ${row.country}`} title={row.country ?? undefined}>
          {flag}
        </span>
      ) : null}
      <span className="vlb-id">
        <span className="vlb-handle">
          {row.handle}
          {row.attested ? (
            <span className="vlb-attested" role="img" aria-label="identity-attested usage" title="identity-attested usage">
              ✓
            </span>
          ) : null}
        </span>
        {info ? <span className="vlb-info">{info}</span> : null}
      </span>
      <span className="vlb-figures">
        <b className="vlb-usd">{formatBoardUsd(row.totalUsd)}</b>
        <span className="vlb-ops">{formatCompactInt(row.totalOps)} ops</span>
      </span>
    </a>
  );
}

export function LeaderboardBoard({
  filters,
  rows,
}: {
  filters: LeaderboardFilters;
  rows: LeaderboardRow[];
}) {
  return (
    <section className="vlb" aria-labelledby="vlb-title">
      <header className="vlb-mast">
        <p className="vlb-eyebrow">PUBLIC AI USAGE LEDGER</p>
        <h1 id="vlb-title">VibeUsage</h1>
        <p className="vlb-dek">
          Who spends the most on AI — filtered by discipline, ranked by spend or operations.
        </p>
      </header>

      <FilterRail filters={filters} />

      {rows.length ? (
        <div className="vlb-rows">
          {rows.map((row) => (
            <BoardRow row={row} key={row.handle} />
          ))}
        </div>
      ) : (
        <p className="vlb-empty" role="status">
          no vibers on this board yet — be the first: npx vibetrack
        </p>
      )}
    </section>
  );
}
