import {
  buildInsightsEvidenceScope,
  type InsightsRunwaySource,
} from "../../lib/insights-runway.ts";

interface InsightEvidenceScopeProps {
  source: InsightsRunwaySource;
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const CONFIDENCE_COPY = {
  provisional: "No daily rhythm is available. The latest upload total is a provisional baseline, not a monthly pace.",
  thin: "Most of the 30-day window is unobserved. Use the projection as a directional warning, not a bill prediction.",
  partial: "The calendar rhythm is useful but incomplete. A few heavy or idle days can still move the plan materially.",
  broad: "At least 21 calendar days are represented, so the pace includes a broad mix of active and idle time.",
} as const;

export function InsightEvidenceScope({ source }: InsightEvidenceScopeProps) {
  const scope = buildInsightsEvidenceScope(source);
  const observedDays = Math.min(30, Math.max(0, source.observedDays));
  const activeDays = Math.min(observedDays, Math.max(0, source.activeDays));
  const slots = Array.from({ length: 30 }, (_, index) => (
    index < activeDays ? "active" : index < observedDays ? "idle" : "unobserved"
  ));
  const stretch = scope.projectionMultiplier ? `${scope.projectionMultiplier.toFixed(1)}×` : "n/a";
  const summary = source.evidenceBasis === "upload_total_fallback"
    ? `${currency.format(source.observedUsd)} is the only observed baseline. No calendar-day multiplier is applied.`
    : `${scope.unobservedDays} of 30 calendar days are outside the evidence window. The same-rhythm projection stretches the observed pace ${stretch}.`;

  return (
    <section className="intel-scope" aria-label="Forecast evidence aperture">
      <header>
        <span>EVIDENCE APERTURE</span>
        <b data-confidence={scope.confidence}>{scope.confidence} confidence</b>
      </header>

      <div
        className="intel-scope__rail"
        role="img"
        aria-label={`Aggregate coverage slots, not calendar order: ${activeDays} active days, ${Math.max(0, observedDays - activeDays)} idle days, and ${scope.unobservedDays} unobserved days.`}
      >
        {slots.map((state, index) => <i aria-hidden="true" data-slot={state} key={`${state}-${index}`} />)}
      </div>

      <div className="intel-scope__legend" aria-hidden="true">
        <span data-slot="active">{activeDays} active</span>
        <span data-slot="idle">{Math.max(0, observedDays - activeDays)} idle</span>
        <span data-slot="unobserved">{scope.unobservedDays} outside window</span>
      </div>

      <dl className="intel-scope__facts">
        <div><dt>Coverage</dt><dd>{scope.coveragePercent}%</dd></div>
        <div><dt>Projection stretch</dt><dd>{stretch}</dd></div>
        <div><dt>+10% local</dt><dd>−{currency.format(scope.localSensitivityUsd)}</dd></div>
      </dl>

      <p><b>Read:</b> {CONFIDENCE_COPY[scope.confidence]} {summary} Even at 100% of eligible work moved local, the scenario floor is {currency.format(scope.scenarioFloorUsd)}.</p>
    </section>
  );
}
