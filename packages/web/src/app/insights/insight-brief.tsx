import type { CSSProperties } from "react";
import {
  buildInsightsEvidenceScope,
  type InsightsRunwaySnapshot,
  type InsightsRunwaySource,
} from "../../lib/insights-runway.ts";
import { InsightEvidenceScope } from "./insight-evidence-scope";

interface InsightBriefProps {
  localShiftPercent: number;
  monthlyCapUsd: number;
  snapshot: InsightsRunwaySnapshot;
  source: InsightsRunwaySource;
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function budgetSignal(snapshot: InsightsRunwaySnapshot, monthlyCapUsd: number) {
  if (snapshot.state === "over") {
    return {
      label: "Budget status",
      value: `${currency.format(Math.abs(snapshot.varianceUsd))} over`,
      note: `${snapshot.utilizationPercent}% of the ${currency.format(monthlyCapUsd)} limit. The scenario needs a real change.`,
    };
  }
  if (snapshot.state === "near") {
    return {
      label: "Budget status",
      value: `${currency.format(snapshot.varianceUsd)} left`,
      note: `${snapshot.utilizationPercent}% of the ${currency.format(monthlyCapUsd)} limit. One heavy day can erase the buffer.`,
    };
  }
  return {
    label: "Budget status",
    value: `${currency.format(snapshot.varianceUsd)} left`,
    note: `${snapshot.utilizationPercent}% of the ${currency.format(monthlyCapUsd)} limit. The scenario has usable headroom.`,
  };
}

function confidenceSignal(source: InsightsRunwaySource) {
  const scope = buildInsightsEvidenceScope(source);
  if (scope.confidence === "provisional") {
    return {
      label: "Forecast confidence",
      value: "Provisional",
      note: "No daily rhythm exists, so the latest upload total is a baseline rather than a monthly forecast.",
    };
  }
  return {
    label: "Forecast confidence",
    value: `${scope.confidence} · ${source.observedDays}/30 days`,
    note: `${scope.unobservedDays} days are unobserved. The current pace is extended ${scope.projectionMultiplier?.toFixed(1)}×.`,
  };
}

function actionSignal(snapshot: InsightsRunwaySnapshot, source: InsightsRunwaySource) {
  if (snapshot.state === "over") {
    return {
      value: "Cut paid work or raise the cap",
      note: `Start with ${source.topProvider}; it has the highest observed spend in this evidence window.`,
    };
  }
  if (snapshot.state === "near") {
    return {
      value: "Create a real buffer",
      note: `Review ${source.topProvider} jobs first, then lower paid usage or choose a limit you can enforce.`,
    };
  }
  return {
    value: "Keep watching the pace",
    note: `Review ${source.topProvider} first if the forecast rises; it is the largest observed cost driver.`,
  };
}

export function InsightBrief({ localShiftPercent, monthlyCapUsd, snapshot, source }: InsightBriefProps) {
  const budget = budgetSignal(snapshot, monthlyCapUsd);
  const confidence = confidenceSignal(source);
  const action = actionSignal(snapshot, source);
  const comparisonMax = Math.max(snapshot.adjustedUsd, monthlyCapUsd, 1);
  const comparisonStyle = {
    "--plan-width": `${(snapshot.adjustedUsd / comparisonMax) * 100}%`,
    "--budget-width": `${(monthlyCapUsd / comparisonMax) * 100}%`,
  } as CSSProperties;
  const evidenceSentence = source.evidenceBasis === "calendar_window"
    ? `${currency.format(source.observedUsd)} across ${source.observedDays} calendar days`
    : `${currency.format(source.observedUsd)} from the latest upload total`;

  return (
    <section className="intel-brief" aria-labelledby="intel-brief-title">
      <header className="intel-brief__header">
        <div>
          <p>OPERATOR BRIEF · READ THIS FIRST</p>
          <h2 id="intel-brief-title">The decision, without the dashboard jargon</h2>
        </div>
        <code aria-label="Calculation summary">
          observed {currency.format(source.observedUsd)} → projected {currency.format(snapshot.projectedUsd)} → planned {currency.format(snapshot.adjustedUsd)}
        </code>
      </header>

      <div className="intel-brief__signals">
        <article data-signal={snapshot.state}>
          <span>01</span><div><small>{budget.label}</small><strong>{budget.value}</strong></div><p>{budget.note}</p>
        </article>
        <article data-signal="confidence">
          <span>02</span><div><small>{confidence.label}</small><strong>{confidence.value}</strong></div><p>{confidence.note}</p>
        </article>
        <article data-signal="driver">
          <span>03</span><div><small>Review first</small><strong>{source.topProvider}</strong></div><p>Highest observed spend. That makes it the first place to inspect, not proof that it is wasteful.</p>
        </article>
        <article data-signal="action">
          <span>04</span><div><small>Do next</small><strong>{action.value}</strong></div><p>{action.note}</p>
        </article>
      </div>

      <div className="intel-brief__explanation">
        <p>
          <b>Plain English.</b> We saw {evidenceSentence}, extended that pace to a 30-day estimate of {currency.format(source.forecastUsd)},
          then subtracted {currency.format(snapshot.localOffsetUsd)} for the {localShiftPercent}% local-work scenario. The result is
          {" "}{currency.format(snapshot.adjustedUsd)} of estimated paid-provider spend against a {currency.format(monthlyCapUsd)} limit.
        </p>
        <div
          className="intel-comparison"
          role="img"
          aria-label={`Estimated paid-provider spend ${currency.format(snapshot.adjustedUsd)} compared with monthly limit ${currency.format(monthlyCapUsd)}.`}
          style={comparisonStyle}
        >
          <div><span>Expected bill</span><i><b /></i><strong>{currency.format(snapshot.adjustedUsd)}</strong></div>
          <div><span>Monthly limit</span><i><b /></i><strong>{currency.format(monthlyCapUsd)}</strong></div>
        </div>
      </div>

      <InsightEvidenceScope source={source} />
    </section>
  );
}
