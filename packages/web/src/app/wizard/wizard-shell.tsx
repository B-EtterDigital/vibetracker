"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildWizardRunbook,
  DEFAULT_WIZARD_OPTIONS,
  WIZARD_MODES,
  WIZARD_SOURCES,
  type WizardModeId,
  type WizardOptions,
  type WizardSourceId,
} from "./wizard-command";

type CopyState = "idle" | "copied" | "blocked";

interface WizardSequenceStep {
  id: string;
  call: string;
  title: string;
  note: string;
  status: "local" | "consent" | "audit" | "dry-run";
}

interface WizardShellProps {
  sequence: WizardSequenceStep[];
  proofCounters: Record<string, number>;
  runwaySummary: {
    tracks: number;
    localFirst: number;
    publishGates: number;
  };
}

function modeFor(id: WizardModeId) {
  return WIZARD_MODES.find((mode) => mode.id === id) ?? WIZARD_MODES[0];
}

export function WizardShell({ sequence, proofCounters, runwaySummary }: WizardShellProps) {
  const [options, setOptions] = useState<WizardOptions>(DEFAULT_WIZARD_OPTIONS);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runbook = useMemo(() => buildWizardRunbook(options), [options]);
  const activeMode = modeFor(options.mode);
  const sideEffects = Object.values(proofCounters).reduce((total, value) => total + value, 0);
  const usageRails = runbook.selectedSources.filter((source) => source.rail === "usage").length;
  const localRails = runbook.selectedSources.length - usageRails;

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  function chooseMode(mode: WizardModeId) {
    setOptions((current) => ({ ...current, mode }));
  }

  function toggleSource(source: WizardSourceId) {
    setOptions((current) => ({
      ...current,
      sources: current.sources.includes(source)
        ? current.sources.filter((item) => item !== source)
        : [...current.sources, source],
    }));
  }

  function toggleOption(key: "receipt" | "publishPreview") {
    setOptions((current) => ({ ...current, [key]: !current[key] }));
  }

  async function copyRunbook() {
    try {
      await navigator.clipboard.writeText(runbook.commands.join("\n"));
      setCopyState("copied");
    } catch {
      setCopyState("blocked");
    }
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopyState("idle"), 1800);
  }

  return (
    <div className="wizard-surface">
      <section className="wizard-console" aria-labelledby="wizard-title">
        <header className="wizard-console__mast">
          <div>
            <p className="wizard-console__eyebrow">VTK://FIRST-RUN//LOCAL-COMMAND-DECK</p>
            <h1 id="wizard-title">Build your first usage runbook</h1>
            <p className="wizard-console__lede">
              Choose how VibeTRACKER starts, declare the source rails you use, and inspect every command before it reaches your terminal.
            </p>
          </div>
          <div className="wizard-console__readiness" data-state="ready">
            <span><i aria-hidden="true" />READY / LOCAL</span>
            <code>nothing runs on this page</code>
          </div>
        </header>

        <div className="wizard-console__telemetry" aria-label="Generated runbook summary">
          <span>
            <small>COMMANDS</small>
            <b>{String(runbook.commands.length).padStart(2, "0")}</b>
            <em>manual paste</em>
          </span>
          <span>
            <small>SOURCE RAILS</small>
            <b>{String(runbook.selectedSources.length).padStart(2, "0")}</b>
            <em>{usageRails} usage / {localRails} local</em>
          </span>
          <span>
            <small>EVIDENCE</small>
            <b>{options.receipt ? "ARMED" : "AUDIT"}</b>
            <em>{options.receipt ? "local receipt" : "no receipt"}</em>
          </span>
          <span>
            <small>RELAY</small>
            <b>{options.publishPreview ? "DRY RUN" : "LOCAL"}</b>
            <em>{sideEffects} page writes</em>
          </span>
        </div>

        <div className="wizard-workspace">
          <nav className="wizard-phases" aria-label="First-run phases">
            <p>RUNBOOK / 01</p>
            <ol>
              <li data-active="true"><span>01</span><b>Start mode</b><small>choose the entry point</small></li>
              <li data-active={options.sources.length > 0}><span>02</span><b>Source rails</b><small>{options.sources.length} selected</small></li>
              <li data-active="true"><span>03</span><b>Proof gates</b><small>review before relay</small></li>
            </ol>
            <div className="wizard-phases__seal">
              <span>BOUNDARY</span>
              <b>usage != trust</b>
              <small>prompts, outputs, and secrets remain excluded</small>
            </div>
          </nav>

          <div className="wizard-config">
            <fieldset className="wizard-config__section wizard-modes">
              <legend><span>01</span> Choose the start mode</legend>
              <div className="wizard-modes__options">
                {WIZARD_MODES.map((mode) => (
                  <button
                    aria-pressed={options.mode === mode.id}
                    key={mode.id}
                    onClick={() => chooseMode(mode.id)}
                    type="button"
                  >
                    <i aria-hidden="true">{mode.mark}</i>
                    <span><b>{mode.label}</b><small>{mode.detail}</small></span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="wizard-config__section wizard-sources">
              <legend><span>02</span> Select source rails</legend>
              <p className="wizard-config__hint">Selections prepare discovery commands. They do not connect an account.</p>
              <div className="wizard-sources__grid">
                {WIZARD_SOURCES.map((source) => {
                  const checked = options.sources.includes(source.id);
                  return (
                    <label data-checked={checked} data-rail={source.rail} key={source.id}>
                      <input
                        checked={checked}
                        onChange={() => toggleSource(source.id)}
                        type="checkbox"
                      />
                      <i aria-hidden="true">{source.mark}</i>
                      <span><b>{source.label}</b><small>{source.detail}</small></span>
                      <em>{source.rail === "local" ? "LOCAL" : "USAGE"}</em>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="wizard-config__section wizard-guards">
              <legend><span>03</span> Arm proof gates</legend>
              <div className="wizard-guards__rows">
                <label>
                  <input checked readOnly type="checkbox" />
                  <span><b>Secret boundary</b><small>Prompts, outputs, and credentials never enter the runbook.</small></span>
                  <em>LOCKED</em>
                </label>
                <label>
                  <input checked={options.receipt} onChange={() => toggleOption("receipt")} type="checkbox" />
                  <span><b>Local sync receipt</b><small>Write an inspectable receipt beside the local ledger.</small></span>
                  <em>{options.receipt ? "ARMED" : "OFF"}</em>
                </label>
                <label>
                  <input checked={options.publishPreview} onChange={() => toggleOption("publishPreview")} type="checkbox" />
                  <span><b>C0VIBE dry run</b><small>Preview the aggregate bundle without publishing it.</small></span>
                  <em>{options.publishPreview ? "DRY RUN" : "LOCAL"}</em>
                </label>
              </div>
            </fieldset>
          </div>

          <aside className="wizard-terminal" aria-label="Generated local command runbook">
            <div className="wizard-terminal__bar">
              <span><i aria-hidden="true" />runbook@local</span>
              <b>{activeMode.mark}</b>
            </div>
            <div className="wizard-terminal__status">
              <span>PLAN READY</span>
              <code>{runbook.status}</code>
            </div>
            <ol className="wizard-terminal__commands">
              {runbook.commands.map((command, index) => (
                <li data-primary={index === 0} key={command}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <code>{command}</code>
                </li>
              ))}
            </ol>
            <div className="wizard-terminal__boundary">
              <span>provider calls <b>0</b></span>
              <span>uploads <b>0</b></span>
              <span>ledger writes <b>0</b></span>
            </div>
            <button data-state={copyState} onClick={copyRunbook} type="button">
              <span>{copyState === "copied" ? "Runbook copied" : copyState === "blocked" ? "Clipboard blocked" : "Copy runbook"}</span>
              <kbd aria-hidden="true">{copyState === "copied" ? "OK" : "COPY"}</kbd>
            </button>
            <p aria-live="polite">
              {copyState === "blocked"
                ? "Clipboard access failed. Select the commands above manually."
                : "Paste into your terminal when you are ready. This page executes nothing."}
            </p>
          </aside>
        </div>

        <section className="wizard-sequence" aria-labelledby="wizard-sequence-title">
          <header>
            <div>
              <p>FIRST MINUTE / VERIFIED ORDER</p>
              <h2 id="wizard-sequence-title">What the runbook will ask you to review</h2>
            </div>
            <span>VIBERS UNITE / AFTER REVIEW</span>
          </header>
          <ol>
            {sequence.map((step) => (
              <li data-status={step.status} key={step.id}>
                <span>{step.call}</span>
                <div><b>{step.title}</b><p>{step.note}</p></div>
                <em>{step.status === "dry-run" ? "PREVIEW" : step.status.toUpperCase()}</em>
              </li>
            ))}
          </ol>
        </section>

        <footer className="wizard-console__foot">
          <span><i aria-hidden="true" /> local-first command plan</span>
          <span>{runwaySummary.tracks} tracks / {runwaySummary.localFirst} local checks / {runwaySummary.publishGates} relay gate</span>
          <span>trust signals remain NOT USAGE</span>
          <a href="/how-to">Open the CLI guide</a>
        </footer>
      </section>
    </div>
  );
}
