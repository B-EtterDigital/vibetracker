import type { InsightsRunwaySnapshot, InsightsRunwaySource } from "../../lib/insights-runway.ts";

export type InsightCopyState = "idle" | "copied" | "blocked";

interface InsightMethodologyProps {
  copyState: InsightCopyState;
  handle: string;
  localShiftPercent: number;
  monthlyCapUsd: number;
  onCopy: () => void;
  snapshot: InsightsRunwaySnapshot;
  source: InsightsRunwaySource;
  sourceMode: "public" | "demo" | "sample";
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function InsightMethodology({ copyState, handle, localShiftPercent, monthlyCapUsd, onCopy, snapshot, source, sourceMode }: InsightMethodologyProps) {
  const hasDailyEvidence = source.evidenceBasis === "calendar_window";
  const evidenceWindow = hasDailyEvidence
    ? `${source.observedDays} calendar ${source.observedDays === 1 ? "day" : "days"} · ${source.activeDays} active · ${source.idleDays} idle`
    : "latest upload total · daily rows unavailable";
  const projectionFormula = hasDailyEvidence
    ? `${currency.format(source.observedUsd)} ÷ ${source.observedDays} days × 30`
    : "latest upload total used as provisional baseline";
  const isPublic = sourceMode === "public";
  const knownLabel = isPublic ? `Known from @${handle}` : sourceMode === "demo" ? "Known from the demo" : "Known from the sample";
  const remainingLabel = snapshot.varianceUsd >= 0 ? "Budget remaining" : "Amount over budget";

  return (
    <details className="intel-methodology">
      <summary>
        <div><span>OPERATOR METHOD</span><b>Calculation &amp; confidence ledger</b></div>
        <p>Open six calculation rows, provider review, evidence boundaries, formula, and CLI dry run.</p>
        <i aria-hidden="true" />
      </summary>
      <div className="intel-methodology__body">
        <section className="intel-math" aria-labelledby="intel-math-title">
          <header><p>READ THE CALCULATION</p><h2 id="intel-math-title">Where the result comes from</h2></header>
          <ol>
            <li><span><b>Observed source period</b><small>{evidenceWindow}</small></span><strong>{currency.format(source.observedUsd)}</strong></li>
            <li data-operation="project"><span><b>Same-rhythm 30-day projection</b><small>{projectionFormula}</small></span><strong>{currency.format(snapshot.projectedUsd)}</strong></li>
            <li data-operation="minus"><span><b>Estimated local savings</b><small>{localShiftPercent}% of eligible work</small></span><strong>−{currency.format(snapshot.localOffsetUsd)}</strong></li>
            <li data-operation="equals"><span><b>Planned paid spend</b><small>Forecast after this scenario</small></span><strong>{currency.format(snapshot.adjustedUsd)}</strong></li>
            <li data-operation="compare"><span><b>Your monthly limit</b><small>The boundary you selected</small></span><strong>{currency.format(monthlyCapUsd)}</strong></li>
            <li data-state={snapshot.state}><span><b>{remainingLabel}</b><small>{snapshot.stateLabel}</small></span><strong>{currency.format(Math.abs(snapshot.varianceUsd))}</strong></li>
          </ol>
          <div className="intel-provider-note">
            <span>WHERE TO REVIEW FIRST</span>
            <b>{source.topProvider}</b>
            <p>It has the highest observed spend in this {isPublic ? "public profile" : "example"}. That does not mean it is wasteful; check its high-cost jobs before changing providers.</p>
          </div>
        </section>

        <section className="intel-details" aria-labelledby="intel-details-title">
          <header><p>CONFIDENCE BOUNDARY</p><h2 id="intel-details-title">What is known, estimated, and unchanged</h2></header>
          <div className="intel-details__grid">
            <div><b>{knownLabel}</b><span>{currency.format(source.observedUsd)} observed across {evidenceWindow}, plus provider totals and accepted rows.</span></div>
            <div><b>Estimated here</b><span>The 30-day projection assumes the same calendar rhythm. Local savings are a separate scenario. Either can be wrong if work changes.</span></div>
            <div><b>Never changed here</b><span>Usage totals, provider settings, public profile, score, and rank. This page writes nothing.</span></div>
          </div>
          <details className="intel-technical">
            <summary>Show the formula and CLI dry run</summary>
            <div>
              <p><code>{hasDailyEvidence ? `${currency.format(source.observedUsd)} ÷ ${source.observedDays} × 30` : currency.format(source.observedUsd)} − ({currency.format(source.localShadowUsd)} × {localShiftPercent}%) = {currency.format(snapshot.adjustedUsd)}</code></p>
              <div className="intel-command" aria-live="polite">
                <code>{snapshot.command}</code>
                <button data-state={copyState} onClick={onCopy} type="button">
                  {copyState === "copied" ? "Copied" : copyState === "blocked" ? "Clipboard blocked" : "Copy dry-run command"}
                </button>
                <span>{copyState === "blocked" ? "Clipboard access failed. Select the command manually." : "Preview only. The command retains --dry-run."}</span>
              </div>
            </div>
          </details>
        </section>
      </div>
    </details>
  );
}
