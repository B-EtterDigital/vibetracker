"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { buildInsightsRunwaySnapshot } from "../lib/insights-runway";
import styles from "./InsightsRunwayConsole.module.css";

interface InsightsRunwayConsoleProps {
  forecastUsd: number;
  localShadowUsd: number;
  topProvider: string;
  defaultCapUsd?: number;
  defaultLocalShiftPercent?: number;
}

const CAP_PRESETS = [
  { label: "Lean", value: 350 },
  { label: "Steady", value: 500 },
  { label: "Open", value: 750 },
] as const;

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function signedMoney(value: number): string {
  if (value === 0) return currency.format(0);
  return `${value > 0 ? "+" : "-"}${currency.format(Math.abs(value))}`;
}

export function InsightsRunwayConsole({
  forecastUsd,
  localShadowUsd,
  topProvider,
  defaultCapUsd = 500,
  defaultLocalShiftPercent = 35,
}: InsightsRunwayConsoleProps) {
  const [monthlyCapUsd, setMonthlyCapUsd] = useState(defaultCapUsd);
  const [localShiftPercent, setLocalShiftPercent] = useState(defaultLocalShiftPercent);
  const [reviewArmed, setReviewArmed] = useState(false);
  const snapshot = useMemo(
    () => buildInsightsRunwaySnapshot({ forecastUsd, localShadowUsd, monthlyCapUsd, localShiftPercent }),
    [forecastUsd, localShadowUsd, monthlyCapUsd, localShiftPercent],
  );
  const scopeStyle = {
    "--cap-marker": `${snapshot.capMarkerPercent}%`,
    "--adjusted-marker": `${snapshot.adjustedMarkerPercent}%`,
  } as CSSProperties;

  return (
    <section className={styles.console} data-state={snapshot.state} aria-labelledby="runway-console-title">
      <header className={styles.header}>
        <div>
          <span>VTK://RUNWAY-OSCILLOSCOPE//LOCAL-SIM//NO-WRITES</span>
          <h2 id="runway-console-title">Runway oscilloscope</h2>
        </div>
        <p>Set a monthly ceiling, shift repeat work local, and inspect the delta before changing a provider.</p>
      </header>

      <div className={styles.body}>
        <div className={styles.controls}>
          <div className={styles.stateLine}>
            <span>Planning state</span>
            <strong>{snapshot.stateLabel}</strong>
            <i aria-hidden="true" />
          </div>

          <div className={styles.metrics} aria-label="Runway planning metrics">
            <div>
              <span>Adjusted 30d</span>
              <strong>{currency.format(snapshot.adjustedUsd)}</strong>
            </div>
            <div>
              <span>Cap variance</span>
              <strong>{signedMoney(snapshot.varianceUsd)}</strong>
            </div>
            <div>
              <span>Runway</span>
              <strong>{snapshot.runwayDays}d</strong>
            </div>
            <div>
              <span>Pressure source</span>
              <strong>{topProvider}</strong>
            </div>
          </div>

          <fieldset className={styles.presetField}>
            <legend>Monthly ceiling</legend>
            <div className={styles.presets} aria-label="Monthly ceiling presets">
              {CAP_PRESETS.map((preset) => (
                <button
                  aria-pressed={monthlyCapUsd === preset.value}
                  className={monthlyCapUsd === preset.value ? styles.activePreset : undefined}
                  key={preset.value}
                  onClick={() => setMonthlyCapUsd(preset.value)}
                  type="button"
                >
                  <span>{preset.label}</span>
                  <b>${preset.value}</b>
                </button>
              ))}
            </div>
          </fieldset>

          <label className={styles.sliderRow}>
            <span>
              <b>Ceiling</b>
              <output htmlFor="runway-cap">{currency.format(monthlyCapUsd)}</output>
            </span>
            <input
              id="runway-cap"
              max="1000"
              min="200"
              onChange={(event) => setMonthlyCapUsd(Number(event.target.value))}
              step="25"
              type="range"
              value={monthlyCapUsd}
            />
          </label>

          <label className={styles.sliderRow}>
            <span>
              <b>Local shift</b>
              <output htmlFor="runway-local-shift">{localShiftPercent}% / -{currency.format(snapshot.localOffsetUsd)}</output>
            </span>
            <input
              id="runway-local-shift"
              max="100"
              min="0"
              onChange={(event) => setLocalShiftPercent(Number(event.target.value))}
              step="5"
              type="range"
              value={localShiftPercent}
            />
          </label>

          <label className={styles.reviewSwitch}>
            <input checked={reviewArmed} onChange={(event) => setReviewArmed(event.target.checked)} type="checkbox" />
            <span className={styles.switchTrack} aria-hidden="true"><i /></span>
            <span>
              <b>{reviewArmed ? "Review armed" : "Arm review"}</b>
              <small>Local state only. No usage data is written.</small>
            </span>
          </label>
        </div>

        <div className={styles.scopePanel}>
          <div className={styles.scopeTop}>
            <span><i aria-hidden="true" /> LIVE PLAN SIGNAL</span>
            <code>{snapshot.utilizationPercent}% of ceiling</code>
          </div>

          <div
            aria-label={`Runway waveform: ${currency.format(snapshot.adjustedUsd)} adjusted forecast against ${currency.format(monthlyCapUsd)} ceiling`}
            className={styles.scope}
            role="img"
            style={scopeStyle}
          >
            <div className={styles.axis} aria-hidden="true">
              <span>$1k</span><span>$750</span><span>$500</span><span>$250</span><span>$0</span>
            </div>
            <div className={styles.capLine} aria-hidden="true"><span>CAP {currency.format(monthlyCapUsd)}</span></div>
            <div className={styles.adjustedLine} aria-hidden="true"><span>PLAN {currency.format(snapshot.adjustedUsd)}</span></div>
            <div className={styles.waveform} aria-hidden="true">
              {snapshot.waveform.map((height, index) => (
                <i key={`${height}-${index}`} style={{ "--bar": `${height}%`, "--i": index } as CSSProperties} />
              ))}
            </div>
            <div className={styles.timeAxis} aria-hidden="true"><span>NOW</span><span>D10</span><span>D20</span><span>D30</span></div>
          </div>

          <div className={styles.readout} aria-live="polite">
            <div>
              <span>{reviewArmed ? "REVIEW QUEUED" : "PREVIEW ONLY"}</span>
              <b>{snapshot.stateLabel}</b>
            </div>
            <code>{snapshot.command}</code>
            <p>
              Forecast {currency.format(snapshot.projectedUsd)} minus local shadow offset {currency.format(snapshot.localOffsetUsd)}.
              This simulation changes 0 totals and 0 ranks.
            </p>
          </div>

          <footer className={styles.footer}>
            <span><i /> ESTIMATE</span>
            <span><i /> NOT SPEND</span>
            <span><i /> 0 WRITES</span>
            <strong>VIBERS UNITE</strong>
          </footer>
        </div>
      </div>
    </section>
  );
}
