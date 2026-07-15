import type { HomeBoardRow } from "./leaderboard-console";
import { buildHomeBoardFieldState } from "./leaderboard-field-state";
import type { HomeBoardLensId } from "./leaderboard-lens";
import type { CSSProperties } from "react";

const GRID_LINES = [20, 40, 60, 80];

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
        <span>OPERATOR FIELD // {field.lensLabel.toUpperCase()}</span>
        <strong>{field.status}</strong>
      </header>

      <div
        className="home-field__scope"
        role="img"
        aria-label={`${field.lensLabel} distribution topology: ${field.activeCount} active of ${field.rankedCount} ranked operators`}
      >
        <div className="home-field__grid" aria-hidden="true">
          {GRID_LINES.map((line) => (
            <i className="home-field__grid-line home-field__grid-line--horizontal" style={{ "--line": `${line}%` } as CSSProperties} key={`h-${line}`} />
          ))}
          {GRID_LINES.map((line) => (
            <i className="home-field__grid-line home-field__grid-line--vertical" style={{ "--line": `${line}%` } as CSSProperties} key={`v-${line}`} />
          ))}
        </div>
        <span className="home-field__axis home-field__axis--top" aria-hidden="true">100% SHARE</span>
        <span className="home-field__axis home-field__axis--bottom" aria-hidden="true">RANK ORDER -&gt;</span>
        <i className="home-field__sweep" aria-hidden="true" />
        {field.points.map((point, index) => (
          <span
            className="home-field__beacon"
            data-active={point.active}
            style={{ "--x": point.x, "--y": point.y, "--delay": `${index * 70}ms` } as CSSProperties}
            title={`${point.label}: ${point.share} of ${field.lensLabel.toLowerCase()} in this lane`}
            key={`${point.label}-${index}`}
          >
            <i aria-hidden="true" />
            <b>{String(index + 1).padStart(2, "0")}</b>
          </span>
        ))}
        {!field.points.length ? <span className="home-field__scope-empty">NO RANKED ROWS</span> : null}
      </div>

      <div className="home-field__scope-meta">
        <span>DISTRIBUTION TOPOLOGY</span>
        <code>NORMALIZED DISPLAY // ZERO RANK WEIGHT</code>
      </div>

      {field.points.length ? (
        <div className="home-field__legend" aria-label="Leading operator field beacons">
          {field.points.slice(0, 3).map((point, index) => (
            <span key={`${point.label}-legend`}><b>{String(index + 1).padStart(2, "0")}</b><code>{point.label}</code><em>{point.share}</em></span>
          ))}
        </div>
      ) : null}

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
