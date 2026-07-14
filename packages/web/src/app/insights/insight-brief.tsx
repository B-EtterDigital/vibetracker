import type { InsightsRunwaySnapshot, InsightsRunwaySource } from "../../lib/insights-runway.ts";

interface InsightBriefProps {
  localShiftPercent: number;
  snapshot: InsightsRunwaySnapshot;
  source: InsightsRunwaySource;
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function evidence(source: InsightsRunwaySource) {
  if (source.evidenceBasis === "upload_total_fallback") {
    return {
      label: "No daily rhythm",
      value: "Upload total only",
      note: "Daily rows are unavailable, so this uses the latest uploaded total as a provisional baseline.",
    };
  }
  if (source.observedDays >= 21) {
    return {
      label: "Full evidence window",
      value: `${source.observedDays} days observed`,
      note: `${source.activeDays} active and ${source.idleDays} idle days are included in the calendar-day pace.`,
    };
  }
  return {
    label: source.observedDays >= 7 ? "Partial evidence window" : "Thin evidence window",
    value: `${source.observedDays} days observed`,
    note: `${source.activeDays} active and ${source.idleDays} idle days. Treat the projection as directional until more days arrive.`,
  };
}

function verdict(snapshot: InsightsRunwaySnapshot) {
  if (snapshot.state === "over") {
    return {
      label: "Over budget",
      value: `${currency.format(Math.abs(snapshot.varianceUsd))} over`,
      note: "The selected limit does not cover the planned paid spend.",
    };
  }
  if (snapshot.state === "near") {
    return {
      label: "No real buffer",
      value: `${snapshot.utilizationPercent}% committed`,
      note: `${currency.format(snapshot.varianceUsd)} remains, so one heavy day can break the plan.`,
    };
  }
  return {
    label: "Inside budget",
    value: `${currency.format(snapshot.varianceUsd)} free`,
    note: `${snapshot.utilizationPercent}% of the selected limit is committed by this scenario.`,
  };
}

function lever(snapshot: InsightsRunwaySnapshot, source: InsightsRunwaySource, localShiftPercent: number) {
  const impactPercent = source.forecastUsd > 0
    ? Math.round((snapshot.localOffsetUsd / source.forecastUsd) * 100)
    : 0;
  return {
    label: impactPercent >= 10 ? "Material lever" : "Small lever",
    value: `${currency.format(snapshot.localOffsetUsd)} saved`,
    note: `${localShiftPercent}% local applies to only ${currency.format(source.localShadowUsd)} of eligible work, changing the forecast by ${impactPercent}%.`,
  };
}

export function InsightBrief({ localShiftPercent, snapshot, source }: InsightBriefProps) {
  const budgetSignal = verdict(snapshot);
  const evidenceSignal = evidence(source);
  const leverSignal = lever(snapshot, source, localShiftPercent);
  const actionTail = snapshot.state === "over"
    ? "The local-work assumption does not close this gap."
    : snapshot.state === "near"
      ? "The local-work assumption does not create a dependable buffer."
      : "Most of this buffer comes from the higher limit, not from local savings.";

  return (
    <section className="intel-brief" aria-labelledby="intel-brief-title">
      <header className="intel-brief__header">
        <div>
          <p>READ THIS FIRST</p>
          <h2 id="intel-brief-title">What this scenario is actually saying</h2>
        </div>
        <code aria-label="Calculation summary">
          {currency.format(source.observedUsd)} observed → {currency.format(snapshot.projectedUsd)} projected → {currency.format(snapshot.adjustedUsd)} planned
        </code>
      </header>

      <div className="intel-brief__signals">
        {[budgetSignal, evidenceSignal, leverSignal].map((signal, index) => (
          <article data-signal={index === 0 ? snapshot.state : index === 1 ? "confidence" : "lever"} key={signal.label}>
            <span>0{index + 1}</span>
            <div><small>{signal.label}</small><strong>{signal.value}</strong></div>
            <p>{signal.note}</p>
          </article>
        ))}
      </div>

      <div className="intel-brief__action">
        <span>NEXT DECISION</span>
        <p>
          Review <b>{source.topProvider}</b> jobs first, then decide whether the selected limit is a hard cap or a warning line.
          {" "}{actionTail}
        </p>
      </div>
    </section>
  );
}
