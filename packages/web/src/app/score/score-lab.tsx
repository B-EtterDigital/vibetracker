"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  buildScoreLabSnapshot,
  SCORE_LAB_PRESETS,
  type ScoreLabInput,
} from "./score-model";

type CopyState = "idle" | "copied" | "blocked";

const CONTROLS: ReadonlyArray<{
  key: keyof ScoreLabInput;
  label: string;
  detail: string;
  min: number;
  max: number;
  step: number;
  suffix: string;
}> = [
  { key: "records", label: "Accepted usage", detail: "Reviewed usage rows only", min: 0, max: 10000, step: 50, suffix: " rows" },
  { key: "usd", label: "Estimated spend", detail: "Spend attached to accepted rows", min: 0, max: 500, step: 0.5, suffix: " USD" },
  { key: "activeDays", label: "Daily rhythm", detail: "Days with usage activity", min: 0, max: 90, step: 1, suffix: " days" },
  { key: "providers", label: "Source breadth", detail: "Providers with accepted usage", min: 0, max: 10, step: 1, suffix: " sources" },
  { key: "freshnessDays", label: "Upload age", detail: "Days since reviewed upload", min: 0, max: 90, step: 1, suffix: "d old" },
];

function formatControlValue(key: keyof ScoreLabInput, value: number, suffix: string): string {
  if (key === "usd") return `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  return `${value.toLocaleString("en-US")}${suffix}`;
}

export function ScoreLab() {
  const [input, setInput] = useState<ScoreLabInput>({ ...SCORE_LAB_PRESETS[1].input });
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snapshot = useMemo(() => buildScoreLabSnapshot(input), [input]);
  const score = snapshot.receipt.score;

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  function update(key: keyof ScoreLabInput, value: number) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  function applyPreset(preset: (typeof SCORE_LAB_PRESETS)[number]) {
    setInput({ ...preset.input });
  }

  async function copyReceipt() {
    try {
      await navigator.clipboard.writeText(snapshot.receipt.shareLine);
      setCopyState("copied");
    } catch {
      setCopyState("blocked");
    }
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopyState("idle"), 1800);
  }

  return (
    <div className="score-surface">
      <section className="score-instrument" aria-labelledby="score-title">
        <header className="score-instrument__mast">
          <div>
            <p>VTK://SCORE-LAB//FORMULA-OPEN//NO-TRUST-MUTATION</p>
            <h1 id="score-title">Tune the signal. Inspect every point.</h1>
            <span>Adjust a sample usage profile with the production score formula. Nothing writes to a ledger, profile, or rank.</span>
          </div>
          <div className="score-gauge" style={{ "--score": `${score * 3.6}deg` } as CSSProperties}>
            <div><strong>{score}</strong><span>/ 100</span><small>{snapshot.receipt.tier}</small></div>
          </div>
        </header>

        <div className="score-instrument__contract" aria-label="Score formula contract">
          <span><b>{snapshot.scoringPoints}</b> scoring points</span>
          <span><b>{snapshot.scoringMax}</b> formula maximum</span>
          <span><b>+0</b> trust score delta</span>
          <span><b>0</b> page writes</span>
        </div>

        <div className="score-workspace">
          <nav className="score-presets" aria-label="Score Lab presets">
            <p>SAMPLE SIGNALS</p>
            {SCORE_LAB_PRESETS.map((preset) => {
              const selected = Object.entries(preset.input).every(([key, value]) => input[key as keyof ScoreLabInput] === value);
              return (
                <button aria-pressed={selected} key={preset.id} onClick={() => applyPreset(preset)} type="button">
                  <i aria-hidden="true">{preset.mark}</i>
                  <span><b>{preset.label}</b><small>{preset.detail}</small></span>
                </button>
              );
            })}
            <div className="score-presets__rule">
              <span>PERMANENT RULE</span>
              <b>trust != usage</b>
              <small>{input.trustSignals} visible context signal{input.trustSignals === 1 ? "" : "s"}, always +0 score.</small>
            </div>
          </nav>

          <div className="score-controls">
            <header>
              <div><p>INPUT CHANNELS / LIVE</p><h2>Usage formula controls</h2></div>
              <span>local simulation</span>
            </header>
            <div className="score-controls__rows">
              {CONTROLS.map((control) => {
                const value = input[control.key];
                const pct = ((value - control.min) / (control.max - control.min)) * 100;
                return (
                  <label key={control.key}>
                    <span><b>{control.label}</b><small>{control.detail}</small></span>
                    <input
                      aria-label={control.label}
                      max={control.max}
                      min={control.min}
                      onChange={(event) => update(control.key, Number(event.target.value))}
                      step={control.step}
                      style={{ "--value": `${pct}%` } as CSSProperties}
                      type="range"
                      value={value}
                    />
                    <output>{formatControlValue(control.key, value, control.suffix)}</output>
                  </label>
                );
              })}
            </div>
            <label className="score-trust-control">
              <span><b>Trust side rail</b><small>GitHub, MCP, and public proof context</small></span>
              <input
                aria-label="Trust side rail signals"
                max="5"
                min="0"
                onChange={(event) => update("trustSignals", Number(event.target.value))}
                style={{ "--value": `${input.trustSignals * 20}%` } as CSSProperties}
                type="range"
                value={input.trustSignals}
              />
              <output>{input.trustSignals} signals / +0 score</output>
            </label>
          </div>

          <aside className="score-receipt" aria-label="Live Vibe Score receipt">
            <div className="score-receipt__bar"><span><i aria-hidden="true" />formula@local</span><b>READ ONLY</b></div>
            <div className="score-receipt__score">
              <span>VIBE SCORE</span>
              <strong>{score}<small>/100</small></strong>
              <em>{snapshot.receipt.tier}</em>
            </div>
            <ol>
              {snapshot.receipt.factors.map((factor) => {
                const meter = factor.max ? Math.round((factor.points / factor.max) * 100) : 0;
                return (
                  <li data-impact={factor.impact} key={factor.id}>
                    <div><span>{factor.label}</span><b>{factor.impact === "not_usage" ? "+0" : `+${factor.points}`}<small> / {factor.max}</small></b></div>
                    <i aria-hidden="true"><span style={{ "--meter": `${meter}%` } as CSSProperties} /></i>
                    <p>{factor.value} · {factor.note}</p>
                  </li>
                );
              })}
            </ol>
            <button data-state={copyState} onClick={copyReceipt} type="button">
              <span>{copyState === "copied" ? "Receipt copied" : copyState === "blocked" ? "Clipboard blocked" : "Copy score receipt"}</span>
              <kbd aria-hidden="true">{copyState === "copied" ? "OK" : "COPY"}</kbd>
            </button>
            <p aria-live="polite">{copyState === "blocked" ? "Clipboard access failed. Select the receipt text manually." : "Share line only. No profile or score is published."}</p>
          </aside>
        </div>

        <section className="score-ledger" aria-labelledby="score-ledger-title">
          <header>
            <div><p>FORMULA LEDGER / SAME RECEIPT</p><h2 id="score-ledger-title">Where the points come from</h2></div>
            <code>{snapshot.receipt.headline}</code>
          </header>
          <div className="score-ledger__head"><span>channel</span><span>observed value</span><span>score delta</span><span>boundary</span></div>
          {snapshot.receipt.factors.map((factor) => (
            <div className="score-ledger__row" data-impact={factor.impact} key={factor.id}>
              <b>{factor.label}</b>
              <span>{factor.value}</span>
              <strong>{factor.impact === "not_usage" ? "+0" : `+${factor.points}`}</strong>
              <em>{factor.impact === "not_usage" ? "VISIBLE CONTEXT / NOT USAGE" : "ACCEPTED USAGE"}</em>
            </div>
          ))}
        </section>

        <footer className="score-instrument__foot">
          <span><i aria-hidden="true" /> production formula / local sample</span>
          <span>score changes write 0 records</span>
          <a href="/u/demo">Inspect the live demo profile</a>
        </footer>
      </section>
    </div>
  );
}
