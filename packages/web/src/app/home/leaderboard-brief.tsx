import { buildLeaderboardReadout, type BoardReadoutRow } from "./leaderboard-readout";

export function LeaderboardBrief({ rows }: { rows: BoardReadoutRow[] }) {
  const readout = buildLeaderboardReadout(rows);

  return (
    <section className="home-readout" aria-labelledby="home-readout-title">
      <header>
        <div>
          <p>BOARD READOUT</p>
          <h2 id="home-readout-title">What the ranking actually means</h2>
        </div>
        <code>DERIVED // CURRENT LANE // ZERO RANK WEIGHT</code>
      </header>

      <div className="home-readout__summary">
        <span aria-hidden="true" />
        <p>{readout.summary}</p>
        <small>Calculated from the visible board rows. Nothing here changes rank.</small>
      </div>

      <div className="home-readout__signals">
        {readout.signals.map((signal, index) => (
          <article data-signal={signal.id} key={signal.id}>
            <span>0{index + 1}</span>
            <small>{signal.label}</small>
            <strong>{signal.value}</strong>
            <p>{signal.note}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
