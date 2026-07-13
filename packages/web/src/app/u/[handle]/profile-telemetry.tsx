"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { formatInt, formatUsd } from "../../../lib/leaderboard";
import type { ChartDay, ProviderSeries } from "./profile-chart";
import {
  buildTelemetryModel,
  shortTelemetryDate,
  TELEMETRY_RANGES,
  type TelemetryMetric,
  type TelemetryRange,
} from "./profile-telemetry-model";

const METRICS: Array<{ id: TelemetryMetric; label: string }> = [
  { id: "usd", label: "Spend" },
  { id: "ops", label: "Ops" },
  { id: "credits", label: "Credits" },
];

function formatMetric(value: number, metric: TelemetryMetric): string {
  if (metric === "usd") return formatUsd(value);
  return metric === "credits" ? `${formatInt(value)} cr` : `${formatInt(value)} ops`;
}

function compactMetric(value: number, metric: TelemetryMetric): string {
  const magnitude = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (metric === "usd") {
    if (magnitude >= 1_000_000) return `${sign}$${(magnitude / 1_000_000).toFixed(1)}m`;
    if (magnitude >= 10_000) return `${sign}$${(magnitude / 1_000).toFixed(1)}k`;
    return formatUsd(value);
  }
  if (magnitude >= 1_000_000_000) return `${sign}${(magnitude / 1_000_000_000).toFixed(1)}b`;
  if (magnitude >= 1_000_000) return `${sign}${(magnitude / 1_000_000).toFixed(1)}m`;
  if (magnitude >= 10_000) return `${sign}${(magnitude / 1_000).toFixed(1)}k`;
  return Math.round(value).toLocaleString("en-US");
}

function deltaCopy(deltaPercent: number | null): string {
  if (deltaPercent == null) return "new signal";
  if (Math.abs(deltaPercent) < 0.05) return "0.0%";
  return `${deltaPercent > 0 ? "+" : ""}${deltaPercent.toFixed(1)}%`;
}

function initialMetric(days: ChartDay[]): TelemetryMetric {
  if (days.some((day) => Number.isFinite(day.usd) && day.usd > 0)) return "usd";
  if (days.some((day) => Number.isFinite(day.ops) && day.ops > 0)) return "ops";
  return "credits";
}

export function UsageTelemetry({ days, providers = [] }: { days: ChartDay[]; providers?: ProviderSeries[] }) {
  const [range, setRange] = useState<TelemetryRange>(30);
  const [metric, setMetric] = useState<TelemetryMetric>(() => initialMetric(days));
  const model = useMemo(() => buildTelemetryModel(days, providers, range, metric), [days, providers, range, metric]);

  if (!model) return null;

  const state = model.delta > 0 ? "up" : model.delta < 0 ? "down" : "flat";
  const velocity = model.currentTotal / range;
  const leadDelta = model.lead
    ? `${model.lead.delta > 0 ? "+" : ""}${compactMetric(model.lead.delta, metric)}`
    : "no source signal";
  const ariaSummary = `${range} day ${metric} comparison. Current ${formatMetric(model.currentTotal, metric)}. Previous ${formatMetric(model.previousTotal, metric)}. Change ${deltaCopy(model.deltaPercent)}.`;

  return (
    <section className="vprofile-panel vtelemetry" data-state={state} aria-labelledby="vtelemetry-title">
      <header className="vtelemetry-head">
        <div>
          <p className="vtelemetry-kicker">USAGE DELTA / ADJACENT WINDOWS / ZERO TRUST MIXING</p>
          <h2 id="vtelemetry-title">Delta scope</h2>
        </div>
        <div className="vtelemetry-controls">
          <div className="vtelemetry-control">
            <span>window</span>
            <div role="group" aria-label="Comparison window">
              {TELEMETRY_RANGES.map((daysInRange) => (
                <button type="button" aria-pressed={range === daysInRange} onClick={() => setRange(daysInRange)} key={daysInRange}>
                  {daysInRange}d
                </button>
              ))}
            </div>
          </div>
          <div className="vtelemetry-control">
            <span>metric</span>
            <div role="group" aria-label="Comparison metric">
              {METRICS.map((item) => (
                <button type="button" aria-pressed={metric === item.id} onClick={() => setMetric(item.id)} key={item.id}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="vtelemetry-readouts">
        <div>
          <span>current / {range}d</span>
          <strong>{compactMetric(model.currentTotal, metric)}</strong>
          <small>{model.currentLabel}</small>
        </div>
        <div className="vtelemetry-delta">
          <span>period delta</span>
          <strong>{deltaCopy(model.deltaPercent)}</strong>
          <small>{model.delta > 0 ? "+" : ""}{formatMetric(model.delta, metric)} vs prior</small>
        </div>
        <div>
          <span>daily velocity</span>
          <strong>{compactMetric(velocity, metric)}</strong>
          <small>per calendar day</small>
        </div>
        <div>
          <span>active signal</span>
          <strong>{model.activeDays}<i>/{range}</i></strong>
          <small>{METRICS.find((item) => item.id === metric)?.label.toLowerCase()} days online</small>
        </div>
      </div>

      <div className="vtelemetry-scope">
        <div className="vtelemetry-scope-head">
          <div className="vtelemetry-legend">
            <span><i className="vtelemetry-key vtelemetry-key--current" />current</span>
            <span><i className="vtelemetry-key vtelemetry-key--previous" />previous</span>
          </div>
          <code>{metric.toUpperCase()} / DAILY BUCKETS / {range * 2}D SOURCE WINDOW</code>
        </div>
        <div
          className="vtelemetry-comb"
          role="img"
          aria-label={ariaSummary}
          style={{ "--vtelemetry-buckets": range } as CSSProperties}
        >
          {model.current.map((point, index) => {
            const previous = model.previous[index];
            const currentHeight = point.value > 0 ? Math.max(2, (point.value / model.maxBucket) * 100) : 0;
            const previousHeight = previous.value > 0 ? Math.max(2, (previous.value / model.maxBucket) * 100) : 0;
            return (
              <span
                className="vtelemetry-pair"
                style={{ "--vtelemetry-current": `${currentHeight}%`, "--vtelemetry-previous": `${previousHeight}%` } as CSSProperties}
                title={`${shortTelemetryDate(point.date)} ${formatMetric(point.value, metric)} / ${shortTelemetryDate(previous.date)} ${formatMetric(previous.value, metric)}`}
                key={point.date}
              >
                <i className="vtelemetry-bar vtelemetry-bar--previous" />
                <i className="vtelemetry-bar vtelemetry-bar--current" />
              </span>
            );
          })}
        </div>
        <div className="vtelemetry-axis" aria-hidden="true">
          <span>{shortTelemetryDate(model.current[0].date)}</span>
          <span>now</span>
        </div>
      </div>

      <footer className="vtelemetry-tape">
        <span><b>PRIOR</b>{model.previousLabel} · {formatMetric(model.previousTotal, metric)}</span>
        <span><b>PEAK</b>{shortTelemetryDate(model.peak.date)} · {formatMetric(model.peak.value, metric)}</span>
        <span><b>LEAD SOURCE</b>{model.lead ? `${model.lead.label} · ${leadDelta}` : "no source signal"}</span>
        <span><b>BOUNDARY</b>usage aggregates only</span>
      </footer>
    </section>
  );
}
