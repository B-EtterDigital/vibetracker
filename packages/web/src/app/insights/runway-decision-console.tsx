"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  buildInsightsRunwaySnapshot,
  type InsightsRunwaySnapshot,
  type InsightsRunwaySource,
} from "../../lib/insights-runway.ts";
import { InsightBrief } from "./insight-brief";
import { InsightMethodology, type InsightCopyState } from "./insight-methodology";
import { buildPlanScale } from "./plan-scale";

interface RunwayDecisionConsoleProps {
  source: InsightsRunwaySource;
  sourceMode: "public" | "demo" | "sample";
  handle: string;
  requestedHandle: string;
  notice: string | null;
  recordCount: number;
  activeDays: number;
  providerCount: number;
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function recommendation(snapshot: InsightsRunwaySnapshot) {
  const difference = currency.format(Math.abs(snapshot.varianceUsd));
  if (snapshot.state === "over") {
    return {
      label: "Action needed",
      title: "This plan is over budget.",
      body: `You would exceed the limit by ${difference}. Reduce paid usage, move more eligible work local, or raise the limit before relying on this plan.`,
    };
  }
  if (snapshot.state === "near") {
    return {
      label: "Very small buffer",
      title: "This plan leaves almost no room for a spike.",
      body: `Only ${difference} remains. One unusually heavy generation or coding day could push the month over your limit.`,
    };
  }
  return {
    label: "Healthy buffer",
    title: "This plan has room for heavier days.",
    body: `${difference} remains below the limit. Keep the plan unless your workload or provider mix changes materially.`,
  };
}

export function RunwayDecisionConsole({
  source,
  sourceMode,
  handle,
  requestedHandle,
  notice,
  recordCount,
  activeDays,
  providerCount,
}: RunwayDecisionConsoleProps) {
  const planScale = useMemo(() => buildPlanScale(source.forecastUsd), [source.forecastUsd]);
  const [monthlyCapUsd, setMonthlyCapUsd] = useState(planScale.presets[1].cap);
  const [localShiftPercent, setLocalShiftPercent] = useState(35);
  const [copyState, setCopyState] = useState<InsightCopyState>("idle");
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

  const selectedPreset = planScale.presets.find(
    (preset) => preset.cap === monthlyCapUsd && preset.shift === localShiftPercent,
  )?.id;
  const decision = recommendation(snapshot);
  const hasDailyEvidence = source.evidenceBasis === "calendar_window";
  const evidenceWindow = hasDailyEvidence
    ? `${source.observedDays} calendar ${source.observedDays === 1 ? "day" : "days"} · ${activeDays} active · ${source.idleDays} idle`
    : "latest upload total · daily rows unavailable";
  const evidenceDates = source.windowStart && source.windowEnd
    ? `${source.windowStart} → ${source.windowEnd}`
    : "no daily date range";
  const projectionFormula = hasDailyEvidence
    ? `${currency.format(source.observedUsd)} ÷ ${source.observedDays} days × 30`
    : "latest upload total used as provisional baseline";
  const comparisonMax = Math.max(snapshot.adjustedUsd, monthlyCapUsd, 1);
  const comparisonStyle = {
    "--plan-width": `${(snapshot.adjustedUsd / comparisonMax) * 100}%`,
    "--budget-width": `${(monthlyCapUsd / comparisonMax) * 100}%`,
  } as CSSProperties;
  const remainingLabel = snapshot.varianceUsd >= 0 ? "Budget remaining" : "Amount over budget";
  const isPublic = sourceMode === "public";
  const sourceLabel = isPublic ? "Live public profile" : sourceMode === "demo" ? "Bundled demo profile" : "Teaching sample";
  const publicBasis = source.providerBasis === "recent_30d" ? "latest 30-day provider detail" : "provider totals fallback";
  const sourceDetail = isPublic ? `@${handle} · ${publicBasis}` : sourceMode === "demo" ? "deterministic full-profile data" : "example numbers · not your account";
  const mastTitle = isPublic
    ? `@${handle}: usage translated into a monthly plan.`
    : sourceMode === "demo"
      ? "Demo usage, translated into a monthly plan."
      : "Example usage, translated into a monthly plan.";
  const mastDescription = isPublic
    ? "Start with the observed public aggregates, inspect the projection assumption, then choose the monthly limit you can actually enforce. Nothing here changes the profile."
    : sourceMode === "demo"
      ? "This deterministic demo teaches the forecast before you load a public profile. Inspect the observed window, projection, and budget decision in that order."
      : "This is not your account. Use the example to learn the forecast, then load a public profile above or create a real scan. Every number below stays read-only.";

  return (
    <div className="intel-surface">
      <section className="intel-console" data-source={sourceMode} data-state={snapshot.state} aria-labelledby="intel-title">
        <div className="intel-profile-picker">
          <div>
            <span>USAGE SOURCE</span>
            <strong>{sourceLabel}</strong>
            <small>{notice ?? sourceDetail}</small>
          </div>
          <form action="/insights" method="get">
            <label htmlFor="insights-handle">{isPublic ? "Analyze another public profile" : "Analyze a public profile"}</label>
            <div>
              <span aria-hidden="true">@</span>
              <input
                autoComplete="off"
                defaultValue={isPublic ? handle : requestedHandle}
                id="insights-handle"
                maxLength={64}
                name="handle"
                pattern="[a-zA-Z0-9_.\-]{1,64}"
                placeholder="github-handle"
              />
              <button type="submit">Load forecast</button>
            </div>
          </form>
          {sourceMode !== "sample" ? <a href="/insights">Use sample</a> : <a href="/scan">Create a real scan</a>}
        </div>
        <header className="intel-mast">
          <div className="intel-mast__copy">
            <p>MONTHLY AI COST PLAN</p>
            <h1 id="intel-title">{mastTitle}</h1>
            <span>{mastDescription}</span>
            <div className="intel-basis" aria-label="Observed spend to monthly projection">
              <div><small>01 · OBSERVED</small><b>{currency.format(source.observedUsd)}</b><span>{evidenceWindow}</span></div>
              <i aria-hidden="true">→</i>
              <div><small>02 · CALENDAR PACE</small><b>{hasDailyEvidence ? `${currency.format(source.dailyPaceUsd)} / day` : "Not available"}</b><span>{evidenceDates}</span></div>
              <i aria-hidden="true">→</i>
              <div><small>03 · 30-DAY PLAN</small><b>{currency.format(source.forecastUsd)}</b><span>{projectionFormula}</span></div>
            </div>
          </div>
          <div className="intel-readout" aria-live="polite">
            <span>CURRENT SCENARIO · PLANNED PAID SPEND</span>
            <strong>{currency.format(snapshot.adjustedUsd)}</strong>
            <small>of a {currency.format(monthlyCapUsd)} monthly limit</small>
            <b>{snapshot.varianceUsd >= 0 ? `${currency.format(snapshot.varianceUsd)} left` : `${currency.format(Math.abs(snapshot.varianceUsd))} over`}</b>
          </div>
        </header>

        <div className="intel-contract" aria-label="Usage data used by this calculation">
          <span><b>{isPublic ? `@${handle}` : sourceMode === "demo" ? "demo" : "example"}</b> {isPublic ? "public aggregates" : "not account data"}</span>
          <span><b>{recordCount.toLocaleString("en-US")}</b> accepted rows</span>
          <span><b>{providerCount}</b> providers</span>
          <span><b>{source.observedDays || "—"}</b> calendar days observed</span>
        </div>

        <InsightBrief
          localShiftPercent={localShiftPercent}
          snapshot={snapshot}
          source={source}
        />

        <section className="intel-decision" aria-labelledby="intel-decision-title">
          <header>
            <p>{decision.label}</p>
            <h2 id="intel-decision-title">{decision.title}</h2>
            <span>{decision.body}</span>
          </header>
          <div
            className="intel-comparison"
            role="img"
            aria-label={`Planned paid spend ${currency.format(snapshot.adjustedUsd)} compared with monthly budget ${currency.format(monthlyCapUsd)}. ${Math.abs(snapshot.varianceUsd).toFixed(2)} dollars ${snapshot.varianceUsd >= 0 ? "remaining" : "over budget"}.`}
            style={comparisonStyle}
          >
            <div><span>Planned spend</span><i><b /></i><strong>{currency.format(snapshot.adjustedUsd)}</strong></div>
            <div><span>Your limit</span><i><b /></i><strong>{currency.format(monthlyCapUsd)}</strong></div>
          </div>
          <div className="intel-decision__facts">
            <span><small>Observed spend</small><strong>{currency.format(source.observedUsd)}</strong><em>{evidenceWindow}</em></span>
            <span><small>30-day projection</small><strong>{currency.format(snapshot.projectedUsd)}</strong><em>{projectionFormula}</em></span>
            <span><small>{remainingLabel}</small><strong>{currency.format(Math.abs(snapshot.varianceUsd))}</strong><em>{snapshot.utilizationPercent}% of limit used</em></span>
          </div>
        </section>

        <div className="intel-workspace">
          <section className="intel-controls" aria-labelledby="intel-controls-title">
            <header>
              <div><p>CHANGE THE ASSUMPTIONS</p><h2 id="intel-controls-title">Choose your comfort level</h2></div>
              <span>Updates instantly</span>
            </header>
            <div className="intel-presets" role="group" aria-label="Planning presets">
              {planScale.presets.map((preset) => (
                <button
                  aria-pressed={selectedPreset === preset.id}
                  key={preset.id}
                  onClick={() => {
                    setMonthlyCapUsd(preset.cap);
                    setLocalShiftPercent(preset.shift);
                  }}
                  type="button"
                >
                  <b>{preset.label}</b>
                  <span>{currency.format(preset.cap)} · {preset.detail}</span>
                </button>
              ))}
            </div>
            <label>
              <span><b>Monthly spending limit</b><small>The most you are comfortable paying for AI providers in one month.</small></span>
              <input
                aria-label="Monthly spending limit"
                max={planScale.max}
                min={planScale.min}
                onChange={(event) => setMonthlyCapUsd(Number(event.target.value))}
                step={planScale.step}
                type="range"
                value={monthlyCapUsd}
              />
              <output>{currency.format(monthlyCapUsd)}</output>
            </label>
            <label>
              <span><b>Eligible work moved local</b><small>A scenario for repeat work that could run on local tools instead of paid providers.</small></span>
              <input
                aria-label="Eligible work moved local"
                max="100"
                min="0"
                onChange={(event) => setLocalShiftPercent(Number(event.target.value))}
                step="5"
                type="range"
                value={localShiftPercent}
              />
              <output>{localShiftPercent}% → save {currency.format(snapshot.localOffsetUsd)}</output>
              <p>
                This percentage applies only to {currency.format(source.localShadowUsd)} of estimated eligible work,
                not to the full {currency.format(source.forecastUsd)} forecast.
              </p>
            </label>
          </section>

        </div>

        <InsightMethodology
          copyState={copyState}
          handle={handle}
          localShiftPercent={localShiftPercent}
          monthlyCapUsd={monthlyCapUsd}
          onCopy={copyCommand}
          snapshot={snapshot}
          source={source}
          sourceMode={sourceMode}
        />

        <footer className="intel-foot">
          <span><i aria-hidden="true" /> {isPublic ? `Planning from @${handle}` : "Example planning only"}</span>
          <span>0 usage writes · 0 rank changes · 0 provider changes</span>
          <a href={isPublic ? `/u/${encodeURIComponent(handle)}` : "/score"}>{isPublic ? "Back to this profile" : "See how Vibe Score is calculated"}</a>
        </footer>
      </section>
    </div>
  );
}
