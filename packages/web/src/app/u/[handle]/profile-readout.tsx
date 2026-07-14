import { formatUsd } from "../../../lib/leaderboard";
import type { TelemetryModel } from "./profile-telemetry-model";

interface ProfileReadoutProps {
  handle: string;
  model: TelemetryModel | null;
  category: { label: string; share: number } | null;
  trust: string;
  hasGitHubEvidence: boolean;
  through: string;
}

function compactUsd(value: number): string {
  const magnitude = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (magnitude >= 1_000_000) return `${sign}$${(magnitude / 1_000_000).toFixed(1)}m`;
  if (magnitude >= 10_000) return `${sign}$${(magnitude / 1_000).toFixed(1)}k`;
  return formatUsd(value);
}

function deltaPercent(value: number | null): string {
  if (value == null) return "new";
  if (Math.abs(value) < 0.05) return "0.0%";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function trendRead(model: TelemetryModel): { headline: string; state: string } {
  if (model.currentTotal <= 0) {
    return { headline: "No usage landed in the latest 30-day window.", state: "quiet" };
  }
  if (model.deltaPercent == null) {
    return { headline: "The latest 30 days established a new usage baseline.", state: "new" };
  }
  if (model.deltaPercent >= 5) {
    return { headline: `Usage accelerated ${model.deltaPercent.toFixed(1)}% versus the previous 30 days.`, state: "up" };
  }
  if (model.deltaPercent <= -5) {
    return { headline: `Usage eased ${Math.abs(model.deltaPercent).toFixed(1)}% versus the previous 30 days.`, state: "down" };
  }
  return { headline: "Usage held steady against the previous 30 days.", state: "flat" };
}

export function ProfileReadout({ handle, model, category, trust, hasGitHubEvidence, through }: ProfileReadoutProps) {
  if (!model) return null;

  const trend = trendRead(model);
  const lead = model.lead;
  const trustLabel = trust.replace(/_/g, "-");
  const leadChange = !lead || lead.delta === 0
    ? "unchanged from"
    : lead.delta > 0
      ? `up ${compactUsd(lead.delta)} from`
      : `down ${compactUsd(Math.abs(lead.delta))} from`;
  const evidence = hasGitHubEvidence
    ? "GitHub activity is separate work evidence, not verification of usage totals."
    : "No separate activity evidence is attached to this profile.";
  const plainRead = [
    model.currentTotal > 0 ? (trend.state === "up" ? "Activity is accelerating" : trend.state === "down" ? "Activity has cooled" : "Activity is stable") : "Activity is quiet",
    lead ? `led by ${lead.label}` : null,
    category ? `with ${category.label} dominating recorded operations` : null,
  ].filter(Boolean).join(", ");

  return (
    <section className="vprofile-readout" data-state={trend.state} aria-labelledby="vprofile-readout-title">
      <header className="vprofile-readout__head">
        <div>
          <span className="vprofile-readout__eyebrow">Latest 30-day read</span>
          <h2 id="vprofile-readout-title">{trend.headline}</h2>
        </div>
        <time dateTime={model.current[model.current.length - 1].date}>through {through}</time>
      </header>

      <p className="vprofile-readout__summary">
        <strong>{compactUsd(model.currentTotal)}</strong> API-equivalent usage across {model.activeDays} active days.
        {lead ? ` ${lead.label} led with ${compactUsd(lead.value)}, ${leadChange} the prior window.` : ""}
      </p>

      <dl className="vprofile-readout__facts">
        <div>
          <dt>Momentum</dt>
          <dd className="vprofile-readout__value">{deltaPercent(model.deltaPercent)}</dd>
          <dd className="vprofile-readout__note">vs previous 30d</dd>
        </div>
        <div>
          <dt>Lead source</dt>
          <dd className="vprofile-readout__value">{lead?.label ?? "No signal"}</dd>
          <dd className="vprofile-readout__note">{lead ? `${compactUsd(lead.value)} this window` : "no source activity"}</dd>
        </div>
        <div>
          <dt>Work mix</dt>
          <dd className="vprofile-readout__value">{category ? `${Math.round(category.share)}%` : "No signal"}</dd>
          <dd className="vprofile-readout__note">{category ? `${category.label} operations` : "no category activity"}</dd>
        </div>
        <div>
          <dt>Trust boundary</dt>
          <dd className="vprofile-readout__value">{trustLabel}</dd>
          <dd className="vprofile-readout__note">{hasGitHubEvidence ? "GitHub evidence attached" : "usage totals only"}</dd>
        </div>
      </dl>

      <div className="vprofile-readout__footer">
        <p className="vprofile-readout__plain"><b>What this tells you:</b> {plainRead}. The totals are {trustLabel}. {evidence}</p>
        <a href={`/insights?handle=${encodeURIComponent(handle)}`}>
          <span>Plan this usage</span>
          <b>Open live cost scenario</b>
        </a>
      </div>
    </section>
  );
}
