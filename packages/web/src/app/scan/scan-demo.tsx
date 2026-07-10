"use client";

// Client surface for /scan: the copy chips and the signature scripted
// scan-preview. Everything renders server-visible in its final state; JS only
// arms a staged reveal on mount. No network calls, no randomness — the sequence
// is a fixed-delay script over bundled sample numbers.

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

const STEP_MS = 450;

/** Reveal script. `at` is the reveal index the element becomes visible past. */
const STREAM_LINES: { verb: string; detail: string; at: number }[] = [
  { verb: "reading local logs", detail: "· claude code · codex · gemini cli", at: 0 },
  { verb: "detecting local runners", detail: "· ollama · lm studio · comfyui", at: 1 },
  { verb: "querying connected providers", detail: "· higgsfield · replicate · elevenlabs", at: 2 },
  { verb: "normalizing 12,847 records across 9 providers", detail: "", at: 3 },
];

const RESULT_CARDS: { label: string; value: string; at: number }[] = [
  { label: "total spent", value: "$1,284.06", at: 4 },
  { label: "credits", value: "48,210", at: 5 },
  { label: "days", value: "63", at: 6 },
  { label: "sources", value: "9", at: 7 },
];

const DIVIDER_AT = 4;
const NOTE_AT = 8;
const TOTAL_STEPS = 9;

/**
 * Copy-to-clipboard command chip. The visible copied / copy-blocked state IS the
 * error handling for the clipboard call — never a silent catch, mirroring the
 * committed TrackYours pattern.
 */
export function CopyChip({
  command,
  variant = "primary",
  subLabel,
}: {
  command: string;
  variant?: "primary" | "secondary";
  subLabel?: string;
}) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "blocked">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  async function copy() {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(command);
      setCopyState("copied");
    } catch {
      setCopyState("blocked");
    }
    timer.current = setTimeout(() => setCopyState("idle"), 1600);
  }
  const stateWord: ReactNode =
    copyState === "copied" ? "copied" : copyState === "blocked" ? "copy blocked" : "copy";
  return (
    <div className={`vscan-chip-wrap vscan-chip-${variant}`}>
      <button
        type="button"
        className="vscan-chip"
        onClick={copy}
        data-state={copyState}
        aria-label={`Copy ${command} to clipboard`}
      >
        <code>{command}</code>
        <span aria-live="polite">{stateWord}</span>
      </button>
      {subLabel ? <span className="vscan-chip-sub">{subLabel}</span> : null}
    </div>
  );
}

/**
 * Signature scripted scan-preview. Renders every line and stat card in its final
 * state for first paint (no-JS and reduced-motion show the whole result). On
 * mount, unless the user prefers reduced motion, `.is-armed` begins a staged
 * hide/reveal driven by a fixed-delay counter.
 */
export function ScanDemo() {
  const [armed, setArmed] = useState(false);
  const [revealed, setRevealed] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clearTimer();
    setArmed(true);
    setRevealed(0);
    let n = 0;
    timer.current = setInterval(() => {
      n += 1;
      setRevealed(n);
      if (n >= TOTAL_STEPS) clearTimer();
    }, STEP_MS);
  }, [clearTimer]);

  const prefersReduced = () =>
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!prefersReduced()) start();
    return clearTimer;
  }, [start, clearTimer]);

  // Not armed → everything is shown (SSR / no-JS / reduced-motion final state).
  const shown = (at: number): "true" | "false" => (!armed || revealed > at ? "true" : "false");

  function replay() {
    if (prefersReduced()) return; // already fully visible; nothing to reveal
    start();
  }

  return (
    <section
      className={`vscan-panel vscan-demo${armed ? " is-armed" : ""}`}
      aria-label="Scan preview — scripted demo, makes no network calls"
    >
      <header className="vscan-panel-head">
        <h2 className="vscan-panel-title">scan preview</h2>
        <span className="vscan-panel-sub">scripted demo · makes no calls</span>
      </header>

      <div className="vscan-demo-stream">
        {STREAM_LINES.map((line) => (
          <p className="vscan-demo-line" data-shown={shown(line.at)} key={line.verb}>
            <span className="vscan-demo-verb">{line.verb}</span>
            {line.detail ? <span className="vscan-demo-detail">{line.detail}</span> : null}
          </p>
        ))}
      </div>

      <div className="vscan-demo-divider" data-shown={shown(DIVIDER_AT)} aria-hidden="true" />

      <div className="vscan-demo-result">
        {RESULT_CARDS.map((card) => (
          <article className="vscan-demo-card" data-shown={shown(card.at)} key={card.label}>
            <span className="vscan-demo-card-label">{card.label}</span>
            <strong className="vscan-demo-card-value">{card.value}</strong>
          </article>
        ))}
      </div>

      <p className="vscan-demo-note" data-shown={shown(NOTE_AT)}>
        sample numbers from the bundled demo dataset. your scan reveals your own.
      </p>

      <button type="button" className="vscan-demo-replay" onClick={replay} aria-label="Replay the scan preview">
        replay
      </button>
    </section>
  );
}
