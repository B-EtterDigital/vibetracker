import type { HomeBoardRow } from "./leaderboard-console";
import { buildHomeBoardFieldState } from "./leaderboard-field-state";
import type { HomeBoardLensId } from "./leaderboard-lens";

export function LeaderboardFieldInstrument({
  rows,
  lens,
}: {
  rows: HomeBoardRow[];
  lens: HomeBoardLensId;
}) {
  const field = buildHomeBoardFieldState(rows, lens);

  return (
    <aside className="home-field" data-state={field.state} aria-label={`${field.lensLabel} field state`}>
      <header>
        <span>FIELD STATE</span>
        <strong>{field.status}</strong>
      </header>

      <p>{field.summary}</p>

      <dl>
        <div>
          <dt>Ranked</dt>
          <dd>{field.rankedCount}</dd>
        </div>
        <div>
          <dt>Active</dt>
          <dd>{field.activeCount}</dd>
        </div>
        <div>
          <dt>Strongest share</dt>
          <dd>{field.strongestShare}</dd>
        </div>
        <div>
          <dt>Compare</dt>
          <dd>{field.comparisonReady ? "YES" : "NO"}</dd>
        </div>
      </dl>

      <div className="home-field__threshold" aria-hidden="true">
        <i data-active={field.activeCount > 0} />
        <span />
        <i data-active={field.comparisonReady} />
      </div>
      <div className="home-field__threshold-labels">
        <span>1 SIGNAL</span>
        <span>2+ COMPARABLE</span>
      </div>
    </aside>
  );
}
