import type { ScoreSignalBrief as ScoreSignalBriefModel } from "./score-model";

export function ScoreSignalBrief({ brief }: { brief: ScoreSignalBriefModel }) {
  return (
    <section className="score-signal-brief" aria-labelledby="score-signal-brief-title">
      <div className="score-signal-brief__metrics" aria-label="Score formula contract">
        <span><b>{brief.currentLabel}</b> current signal</span>
        <span><b>{brief.ceilingLabel}</b> usage rails</span>
        <span><b>+0</b> trust score delta</span>
        <span><b>0</b> page writes</span>
      </div>
      <div className="score-signal-brief__body">
        <header>
          <p>READ THIS SCORE / LIVE INTERPRETATION</p>
          <h2 id="score-signal-brief-title">{brief.headline}</h2>
          <span>{brief.explanation}</span>
        </header>
        <article data-tone="driver">
          <span>STRONGEST DRIVER</span>
          <b>{brief.strongest.label}</b>
          <strong>{brief.strongest.value}</strong>
          <small>{brief.strongest.note}</small>
        </article>
        <article data-tone="opportunity">
          <span>LARGEST OPEN GAIN</span>
          <b>{brief.opportunity.label}</b>
          <strong>{brief.opportunity.value}</strong>
          <small>{brief.opportunity.note}</small>
        </article>
      </div>
      <div className="score-signal-brief__equation">
        <span>RAW EQUATION</span>
        <code>{brief.equation}</code>
        <b>{brief.trustLabel} // TRUST != USAGE</b>
      </div>
    </section>
  );
}
