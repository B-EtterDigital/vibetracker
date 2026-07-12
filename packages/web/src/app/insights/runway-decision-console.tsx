"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  buildInsightsRunwaySnapshot,
  type InsightsRunwaySource,
} from "../../lib/insights-runway.ts";

interface RunwayDecisionConsoleProps {
  source: InsightsRunwaySource;
  recordCount: number;
  activeDays: number;
  providerCount: number;
}

type CopyState = "idle" | "copied" | "blocked";

const PLAN_PRESETS = [
  { id: "protect", label: "Protect", detail: "Hard ceiling", cap: 500, shift: 60, mark: "LOCK" },
  { id: "target", label: "Target", detail: "Current pace", cap: 650, shift: 35, mark: "LIVE" },
  { id: "explore", label: "Explore", detail: "More headroom", cap: 750, shift: 10, mark: "OPEN" },
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

export function RunwayDecisionConsole({
  source,
  recordCount,
  activeDays,
  providerCount,
}: RunwayDecisionConsoleProps) {
  const [monthlyCapUsd, setMonthlyCapUsd] = useState(650);
  const [localShiftPercent, setLocalShiftPercent] = useState(35);
  const [reviewArmed, setReviewArmed] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snapshot = useMemo(
    () => buildInsightsRunwaySnapshot({
      forecastUsd: source.forecastUsd,
      localShadowUsd: source.localShadowUsd,
      monthlyCapUsd,
      localShiftPercent,
    }),
    [localShiftPercent, monthlyCapUsd, source.forecastUsd, source.localShadowUsd],
  );

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  function applyPreset(preset: (typeof PLAN_PRESETS)[number]) {
    setMonthlyCapUsd(preset.cap);
    setLocalShiftPercent(preset.shift);
  }

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(snapshot.command);
      setCopyState("copied");
    } catch {
      setCopyState("blocked");
    }
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopyState("idle"), 1800);
  }

  const selectedPreset = PLAN_PRESETS.find(
    (preset) => preset.cap === monthlyCapUsd && preset.shift === localShiftPercent,
  )?.id;
  const scopeStyle = {
    "--cap-marker": `${snapshot.capMarkerPercent}%`,
    "--adjusted-marker": `${snapshot.adjustedMarkerPercent}%`,
  } as CSSProperties;
  const ledger = [
    { label: "Observed 30d pace", value: currency.format(snapshot.projectedUsd), impact: "estimate", note: `${activeDays} active days` },
    { label: "Local shadow offset", value: `-${currency.format(snapshot.localOffsetUsd)}`, impact: "not_spend", note: `${localShiftPercent}% scenario` },
    { label: "Adjusted plan", value: currency.format(snapshot.adjustedUsd), impact: "estimate", note: "dry-run result" },
    { label: "Monthly ceiling", value: currency.format(monthlyCapUsd), impact: "boundary", note: "local control" },
    { label: "Cap variance", value: signedMoney(snapshot.varianceUsd), impact: snapshot.state, note: `${snapshot.utilizationPercent}% utilized` },
  ];

  return (
    <div className="intel-surface">
      <section className="intel-console" data-state={snapshot.state} aria-labelledby="intel-title">
        <header className="intel-mast">
          <div>
            <p>VTK://RUNWAY-CONSOLE//ESTIMATE-ONLY//ZERO-WRITES</p>
            <h1 id="intel-title">See the burn. Bend the runway.</h1>
            <span>Turn reviewed usage pace into a budget decision without changing totals, providers, or rank.</span>
          </div>
          <div className="intel-readout">
            <span>ADJUSTED 30D</span>
            <strong>{currency.format(snapshot.adjustedUsd)}</strong>
            <b>{snapshot.stateLabel}</b>
          </div>
        </header>

        <div className="intel-contract" aria-label="Insights simulation contract">
          <span><b>{recordCount.toLocaleString("en-US")}</b> accepted rows</span>
          <span><b>{providerCount}</b> usage sources</span>
          <span><b>{activeDays}</b> active days</span>
          <span><b>0</b> usage writes</span>
        </div>

        <div className="intel-workspace">
          <nav className="intel-presets" aria-label="Runway planning presets">
            <p>PLAN MODES</p>
            {PLAN_PRESETS.map((preset) => (
              <button
                aria-pressed={selectedPreset === preset.id}
                key={preset.id}
                onClick={() => applyPreset(preset)}
                type="button"
              >
                <i aria-hidden="true">{preset.mark}</i>
                <span><b>{preset.label}</b><small>{preset.detail}</small></span>
              </button>
            ))}
            <div className="intel-presets__rule">
              <span>PRESSURE SOURCE</span>
              <b>{source.topProvider}</b>
              <small>Highest observed sample spend. No provider changes are applied here.</small>
            </div>
          </nav>

          <div className="intel-controls">
            <header>
              <div><p>PLANNING INPUTS / LIVE</p><h2>Runway controls</h2></div>
              <span>local simulation</span>
            </header>
            <label>
              <span><b>Monthly ceiling</b><small>Your planning boundary</small></span>
              <input
                aria-label="Monthly ceiling"
                max="1000"
                min="200"
                onChange={(event) => setMonthlyCapUsd(Number(event.target.value))}
                step="25"
                type="range"
                value={monthlyCapUsd}
              />
              <output>{currency.format(monthlyCapUsd)}</output>
            </label>
            <label>
              <span><b>Local shift</b><small>Repeat work moved to local tools</small></span>
              <input
                aria-label="Local shift"
                max="100"
                min="0"
                onChange={(event) => setLocalShiftPercent(Number(event.target.value))}
                step="5"
                type="range"
                value={localShiftPercent}
              />
              <output>{localShiftPercent}% / -{currency.format(snapshot.localOffsetUsd)}</output>
            </label>
            <label className="intel-review">
              <input checked={reviewArmed} onChange={(event) => setReviewArmed(event.target.checked)} type="checkbox" />
              <span aria-hidden="true"><i /></span>
              <b>{reviewArmed ? "Review armed" : "Arm review"}<small>Local state only. It writes no usage data.</small></b>
            </label>
          </div>

          <div className="intel-scope-panel">
            <div className="intel-scope__bar">
              <span><i aria-hidden="true" /> LIVE PLAN SIGNAL</span>
              <code>{snapshot.utilizationPercent}% of ceiling</code>
            </div>
            <div
              aria-label={`Runway waveform: ${currency.format(snapshot.adjustedUsd)} adjusted forecast against ${currency.format(monthlyCapUsd)} ceiling`}
              className="intel-scope"
              role="img"
              style={scopeStyle}
            >
              <div className="intel-scope__axis" aria-hidden="true"><span>$1k</span><span>$750</span><span>$500</span><span>$250</span><span>$0</span></div>
              <div className="intel-scope__cap" aria-hidden="true"><span>CAP {currency.format(monthlyCapUsd)}</span></div>
              <div className="intel-scope__plan" aria-hidden="true"><span>PLAN {currency.format(snapshot.adjustedUsd)}</span></div>
              <div className="intel-scope__wave" aria-hidden="true">
                {snapshot.waveform.map((height, index) => (
                  <i key={`${height}-${index}`} style={{ "--bar": `${height}%`, "--i": index } as CSSProperties} />
                ))}
              </div>
              <div className="intel-scope__time" aria-hidden="true"><span>NOW</span><span>D10</span><span>D20</span><span>D30</span></div>
            </div>
            <div className="intel-command" aria-live="polite">
              <span>{reviewArmed ? "REVIEW QUEUED" : "PREVIEW ONLY"}</span>
              <code>{snapshot.command}</code>
              <button data-state={copyState} onClick={copyCommand} type="button">
                {copyState === "copied" ? "Copied" : copyState === "blocked" ? "Clipboard blocked" : "Copy dry-run"}
              </button>
              <p>{copyState === "blocked" ? "Clipboard access failed. Select the command manually." : "Command preview only. No provider, usage total, or public profile changes here."}</p>
            </div>
          </div>
        </div>

        <section className="intel-ledger" aria-labelledby="intel-ledger-title">
          <header>
            <div><p>DELTA LEDGER / SAME SIMULATION</p><h2 id="intel-ledger-title">How the plan moves</h2></div>
            <code>{snapshot.runwayDays} days at current cap</code>
          </header>
          <div className="intel-ledger__head"><span>channel</span><span>observed</span><span>classification</span><span>basis</span></div>
          {ledger.map((row) => (
            <div className="intel-ledger__row" data-impact={row.impact} key={row.label}>
              <b>{row.label}</b><strong>{row.value}</strong>
              <em>{row.impact === "not_spend" ? "NOT SPEND" : row.impact.replace("_", " ").toUpperCase()}</em>
              <span>{row.note}</span>
            </div>
          ))}
        </section>

        <footer className="intel-foot">
          <span><i aria-hidden="true" /> estimate-only planning instrument</span>
          <span>0 totals / 0 rank / 0 provider writes</span>
          <a href="/score">Open Score Lab</a>
        </footer>
      </section>
    </div>
  );
}
