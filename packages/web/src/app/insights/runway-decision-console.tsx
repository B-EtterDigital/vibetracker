"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  buildInsightsRunwaySnapshot,
  type InsightsRunwaySnapshot,
  type InsightsRunwaySource,
} from "../../lib/insights-runway.ts";
import { InsightBrief } from "./insight-brief";
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

type CopyState = "idle" | "copied" | "blocked";

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
  const dailyPace = source.forecastUsd / 30;
  const comparisonMax = Math.max(snapshot.adjustedUsd, monthlyCapUsd, 1);
  const comparisonStyle = {
    "--plan-width": `${(snapshot.adjustedUsd / comparisonMax) * 100}%`,
    "--budget-width": `${(monthlyCapUsd / comparisonMax) * 100}%`,
  } as CSSProperties;
  const remainingLabel = snapshot.varianceUsd >= 0 ? "Budget remaining" : "Amount over budget";
  const isPublic = sourceMode === "public";
  const sourceLabel = isPublic ? "Live public profile" : sourceMode === "demo" ? "Bundled demo profile" : "Bundled sample";
  const publicBasis = source.providerBasis === "recent_30d" ? "latest 30-day provider detail" : "latest pace · provider totals fallback";
  const sourceDetail = isPublic ? `@${handle} · ${publicBasis}` : sourceMode === "demo" ? "deterministic full-profile data" : "explicit example data · not your account";
  const observationLabel = isPublic ? "observed active days" : sourceMode === "demo" ? "demo active days" : "sample active days";
  const knownLabel = isPublic ? `Known from @${handle}` : sourceMode === "demo" ? "Known from the demo" : "Known from the sample";

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
            <label htmlFor="insights-handle">Public profile handle</label>
            <div>
              <span aria-hidden="true">@</span>
              <input
                autoComplete="off"
                defaultValue={isPublic ? handle : requestedHandle}
                id="insights-handle"
                maxLength={64}
                name="handle"
                pattern="[a-zA-Z0-9_.\-]{1,64}"
                placeholder="cyrill-etter"
              />
              <button type="submit">Analyze profile</button>
            </div>
          </form>
          {sourceMode !== "sample" ? <a href="/insights">Use sample</a> : <a href="/u/demo">View demo profile</a>}
        </div>
        <header className="intel-mast">
          <div className="intel-mast__copy">
            <div className="intel-sample-flag">
              <b>{sourceLabel}</b>
              <span>{sourceDetail}</span>
            </div>
            <p>MONTHLY AI COST PLAN</p>
            <h1 id="intel-title">Know what next month may cost.</h1>
            <span>
              See the budget verdict, the strength of the evidence, and the lever that actually matters.
              Then test the assumptions without changing your usage or providers.
            </span>
            <div className="intel-basis">
              <b>Why the forecast is {currency.format(source.forecastUsd)}</b>
              <span>{currency.format(dailyPace)} average on {activeDays} {observationLabel} × 30 days.</span>
            </div>
          </div>
          <div className="intel-readout" aria-live="polite">
            <span>PLANNED PAID SPEND</span>
            <strong>{currency.format(snapshot.adjustedUsd)}</strong>
            <small>of a {currency.format(monthlyCapUsd)} monthly limit</small>
            <b>{snapshot.varianceUsd >= 0 ? `${currency.format(snapshot.varianceUsd)} left` : `${currency.format(Math.abs(snapshot.varianceUsd))} over`}</b>
          </div>
        </header>

        <div className="intel-contract" aria-label="Usage data used by this calculation">
          <span><b>{isPublic ? `@${handle}` : sourceMode}</b> {isPublic ? "public aggregates" : "not account data"}</span>
          <span><b>{recordCount.toLocaleString("en-US")}</b> accepted rows</span>
          <span><b>{providerCount}</b> providers</span>
          <span><b>{activeDays}</b> active days</span>
        </div>

        <InsightBrief
          activeDays={activeDays}
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
            <span><small>Forecast before changes</small><strong>{currency.format(snapshot.projectedUsd)}</strong><em>{currency.format(dailyPace)} active-day pace</em></span>
            <span><small>Estimated local savings</small><strong>−{currency.format(snapshot.localOffsetUsd)}</strong><em>{localShiftPercent}% of {currency.format(source.localShadowUsd)} eligible</em></span>
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

          <section className="intel-math" aria-labelledby="intel-math-title">
            <header><p>READ THE CALCULATION</p><h2 id="intel-math-title">Where the result comes from</h2></header>
            <ol>
              <li><span><b>30-day forecast</b><small>Active-day average × 30</small></span><strong>{currency.format(snapshot.projectedUsd)}</strong></li>
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
        </div>

        <section className="intel-details" aria-labelledby="intel-details-title">
          <header><p>CONFIDENCE BOUNDARY</p><h2 id="intel-details-title">What is known, estimated, and unchanged</h2></header>
          <div className="intel-details__grid">
            <div><b>{knownLabel}</b><span>Accepted usage rows, provider totals, active days, and observed spend.</span></div>
            <div><b>Estimated here</b><span>Next month’s spend and possible local savings. Workload changes can make both wrong.</span></div>
            <div><b>Never changed here</b><span>Usage totals, provider settings, public profile, score, and rank. This page writes nothing.</span></div>
          </div>
          <details className="intel-technical">
            <summary>Show the formula and CLI dry run</summary>
            <div>
              <p><code>{currency.format(dailyPace)} × 30 − ({currency.format(source.localShadowUsd)} × {localShiftPercent}%) = {currency.format(snapshot.adjustedUsd)}</code></p>
              <div className="intel-command" aria-live="polite">
                <code>{snapshot.command}</code>
                <button data-state={copyState} onClick={copyCommand} type="button">
                  {copyState === "copied" ? "Copied" : copyState === "blocked" ? "Clipboard blocked" : "Copy dry-run command"}
                </button>
                <span>{copyState === "blocked" ? "Clipboard access failed. Select the command manually." : "Preview only. The command retains --dry-run."}</span>
              </div>
            </div>
          </details>
        </section>

        <footer className="intel-foot">
          <span><i aria-hidden="true" /> {isPublic ? `Planning from @${handle}` : "Example planning only"}</span>
          <span>0 usage writes · 0 rank changes · 0 provider changes</span>
          <a href={isPublic ? `/u/${encodeURIComponent(handle)}` : "/score"}>{isPublic ? "Back to this profile" : "See how Vibe Score is calculated"}</a>
        </footer>
      </section>
    </div>
  );
}
