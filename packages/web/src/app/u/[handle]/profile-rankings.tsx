// LEADERBOARD PLACEMENTS — where this viber ranks on each category board (SMOA lane M, 2026-07-20).
// One card per CategoryRank returned by fetchCategoryRanks. Honesty is absolute: this component
// renders exactly what the data layer returns and never fabricates a rank. When there are no
// ranks it renders nothing at all.

import type { CategoryRank } from "../../../lib/leaderboard-contract.ts";
import { disciplineLabel, formatBoardUsd, isTopThree } from "../../leaderboard-params.ts";

export function ProfileRankings({ ranks }: { ranks: CategoryRank[] }) {
  if (!ranks.length) return null;

  return (
    <section className="vprofile-panel vrank" aria-labelledby="vrank-title">
      <header className="vrank-head">
        <span className="vrank-eyebrow" id="vrank-title">LEADERBOARD PLACEMENTS</span>
      </header>
      <div className="vrank-grid">
        {ranks.map((rank) => {
          const top = isTopThree(rank.rank);
          return (
            <div className={`vrank-card${top ? " vrank-card--top" : ""}`} key={rank.category}>
              <b className="vrank-pos" data-top3={top ? "true" : undefined}>#{rank.rank}</b>
              <span className="vrank-cat">{disciplineLabel(rank.category).toUpperCase()}</span>
              <span className="vrank-of">of {rank.of} vibers</span>
              <span className="vrank-usd">{formatBoardUsd(rank.usd)}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
