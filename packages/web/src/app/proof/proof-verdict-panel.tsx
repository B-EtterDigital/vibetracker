import type { CSSProperties } from "react";
import type { ProofVerdict } from "./proof-verdict";

export function ProofVerdictPanel({ verdict }: { verdict: ProofVerdict }) {
  return (
    <section className="proof-verdict" aria-labelledby="proof-verdict-title">
      <header className="proof-verdict__head">
        <div>
          <p className="proof-verdict__kicker">read this page as a contract</p>
          <h2 id="proof-verdict-title">{verdict.headline}</h2>
          <p>{verdict.summary}</p>
        </div>
        <strong>bundled fixture</strong>
      </header>

      <div className="proof-verdict__boundaries" aria-label="Proof page boundaries">
        {verdict.boundaries.map((boundary) => <span key={boundary}>{boundary}</span>)}
      </div>

      <div className="proof-verdict__grid">
        <section aria-labelledby="proof-verdict-proves">
          <h3 id="proof-verdict-proves">Proven by this contract</h3>
          <ul>{verdict.proves.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
        <section aria-labelledby="proof-verdict-excludes">
          <h3 id="proof-verdict-excludes">Not proven on this page</h3>
          <ul>{verdict.excludes.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
        <section aria-labelledby="proof-verdict-next">
          <h3 id="proof-verdict-next">Prove your own run</h3>
          <ol>
            {verdict.actions.map((action) => (
              <li key={action.command}>
                <span>{action.label}</span>
                <code>{action.command}</code>
                <small>{action.note}</small>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <footer className="proof-verdict__foot">
        <div
          className="proof-verdict__coverage"
          role="progressbar"
          aria-label="Bundled fixture walkthrough coverage"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={verdict.walkthroughCoverage}
          style={{ "--coverage": `${verdict.walkthroughCoverage}%` } as CSSProperties}
        >
          <span>fixture walkthrough coverage</span>
          <b>{verdict.walkthroughCoverage}%</b>
          <i aria-hidden="true" />
        </div>
        <p>All percentage meters below describe this bundled walkthrough, not live readiness.</p>
        <nav aria-label="Proof next steps">
          <a href="/scan">open scan guide</a>
          <a href="/account">inspect identity status</a>
        </nav>
      </footer>
    </section>
  );
}
