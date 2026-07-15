"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type {
  AsciiMotionLab,
  AsciiMotionRig,
  AsciiMotionTheatreBeat,
} from "../../lib/ascii-motion-lab.ts";

interface MotionSequencerProps {
  lab: AsciiMotionLab;
}

type SequenceMode = "cues" | "rigs";
type CopyState = "idle" | "copied" | "blocked";

function frameLabel(item: AsciiMotionTheatreBeat | AsciiMotionRig): string {
  return "rail" in item
    ? `T+${String(item.second).padStart(2, "0")}s / ${item.rail}`
    : `${item.library} / ${item.license}`;
}

function itemNote(item: AsciiMotionTheatreBeat | AsciiMotionRig): string {
  return "signal" in item ? item.signal : item.note;
}

function itemBoundary(item: AsciiMotionTheatreBeat | AsciiMotionRig): string {
  return "boundary" in item ? item.boundary : item.guardrail;
}

export function MotionSequencer({ lab }: MotionSequencerProps) {
  const [mode, setMode] = useState<SequenceMode>("cues");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [frameIndex, setFrameIndex] = useState(0);
  const [tempoMs, setTempoMs] = useState(760);
  const [playing, setPlaying] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const items = mode === "cues" ? lab.theatreBeats : lab.rigs;
  const selected = items[selectedIndex] ?? items[0];
  const currentFrame = selected?.frames[frameIndex] ?? "";
  const zeroEffects = "sideEffects" in selected
    ? selected.sideEffects
    : {
        providerCalls: 0,
        hiddenUploads: 0,
        usageWrites: 0,
        trustWrites: 0,
        promptReads: 0,
        outputReads: 0,
        publishWrites: 0,
      };

  const stageStyle = useMemo(() => ({
    "--motion-from": selected?.from ?? "#2de4c2",
    "--motion-to": selected?.to ?? "#46bbef",
    "--motion-ink": selected?.ink ?? "#03100e",
  }) as CSSProperties, [selected]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPlaying(!query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!playing || !selected) return;
    const timer = window.setInterval(
      () => setFrameIndex((current) => (current + 1) % selected.frames.length),
      tempoMs,
    );
    return () => window.clearInterval(timer);
  }, [playing, selected, tempoMs]);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  function choose(nextMode: SequenceMode, index: number) {
    setMode(nextMode);
    setSelectedIndex(index);
    setFrameIndex(0);
  }

  function step(direction: -1 | 1) {
    setSelectedIndex((current) => (current + direction + items.length) % items.length);
    setFrameIndex(0);
  }

  async function copyCue() {
    try {
      await navigator.clipboard.writeText(selected.command);
      setCopyState("copied");
    } catch {
      setCopyState("blocked");
    }
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopyState("idle"), 1800);
  }

  return (
    <div className="seq-surface">
      <section className="seq-console" aria-labelledby="seq-title">
        <header className="seq-mast">
          <div>
            <p>VTK://MOTION-SEQUENCER//VISUAL-ONLY//NOT-EVIDENCE</p>
            <h1 id="seq-title">Direct the signal.</h1>
            <span>Play the credited terminal rigs behind VibeTRACKER feedback. Motion explains state; accepted records prove usage.</span>
          </div>
          <div className="seq-master">
            <span>MASTER CUE</span>
            <strong>{selected.mark}</strong>
            <b>{playing ? "RUNNING" : "PAUSED"}</b>
          </div>
        </header>

        <div className="seq-contract" aria-label="Motion sequencer contract">
          <span><b>{lab.theatreBeats.length}</b> live cues</span>
          <span><b>{lab.rigs.length}</b> credited rigs</span>
          <span><b>{lab.references.length}</b> source references</span>
          <span><b>0</b> usage writes</span>
        </div>

        <div className="seq-toolbar">
          <div className="seq-modes" aria-label="Sequencer mode">
            <button aria-pressed={mode === "cues"} onClick={() => choose("cues", 0)} type="button">Live cues</button>
            <button aria-pressed={mode === "rigs"} onClick={() => choose("rigs", 0)} type="button">OSS rigs</button>
          </div>
          <div className="seq-transport" aria-label="Playback controls">
            <button aria-label="Previous cue" onClick={() => step(-1)} title="Previous cue" type="button">←</button>
            <button aria-label={playing ? "Pause playback" : "Start playback"} onClick={() => setPlaying((current) => !current)} title={playing ? "Pause" : "Play"} type="button">
              {playing ? "❚❚" : "▶"}
            </button>
            <button aria-label="Next cue" onClick={() => step(1)} title="Next cue" type="button">→</button>
          </div>
          <label className="seq-tempo">
            <span>Frame tempo</span>
            <input
              aria-label="Frame tempo"
              max="1600"
              min="300"
              onChange={(event) => setTempoMs(Number(event.target.value))}
              step="20"
              type="range"
              value={tempoMs}
            />
            <output>{tempoMs}ms</output>
          </label>
        </div>

        <div className="seq-workspace">
          <nav className="seq-timeline" aria-label={mode === "cues" ? "Live motion cues" : "Credited motion rigs"}>
            <p>{mode === "cues" ? "SEQUENCE / 00:00–00:22" : "RIG LIBRARY / MIT"}</p>
            {items.map((item, index) => (
              <button
                aria-pressed={selectedIndex === index}
                key={item.id}
                onClick={() => choose(mode, index)}
                type="button"
              >
                <i style={{ "--cue-from": item.from, "--cue-to": item.to } as CSSProperties} aria-hidden="true">{item.mark}</i>
                <span>
                  <b>{item.label}</b>
                  <small>{"rail" in item ? `T+${String(item.second).padStart(2, "0")}s · ${item.rail}` : item.library}</small>
                </span>
              </button>
            ))}
          </nav>

          <div className="seq-stage" style={stageStyle}>
            <div className="seq-stage__bar">
              <span><i aria-hidden="true" /> {frameLabel(selected)}</span>
              <code>FRAME {frameIndex + 1}/{selected.frames.length}</code>
            </div>
            <div
              aria-label={`Animated ASCII frame for ${selected.label}. Frame ${frameIndex + 1} of ${selected.frames.length}.`}
              className="seq-screen"
              role="img"
            >
              <div className="seq-screen__grid" aria-hidden="true" />
              <pre aria-hidden="true">{currentFrame}</pre>
              <div className="seq-screen__scan" aria-hidden="true" />
              <div className="seq-screen__clock" aria-hidden="true">
                {selected.frames.map((_, index) => <i data-active={frameIndex === index} key={index} />)}
              </div>
            </div>
            <div className="seq-cue-copy">
              <div>
                <span>{mode === "cues" ? "LIVE SIGNAL" : "OSS RIG"}</span>
                <h2>{selected.label}</h2>
                <p>{itemNote(selected)}</p>
              </div>
              <code>{selected.command}</code>
              <button data-state={copyState} onClick={copyCue} type="button">
                {copyState === "copied" ? "Copied" : copyState === "blocked" ? "Clipboard blocked" : "Copy cue"}
              </button>
              <small aria-live="polite">{copyState === "blocked" ? "Clipboard access failed. Select the cue manually." : itemBoundary(selected)}</small>
            </div>
          </div>

          <aside className="seq-proof" aria-label="Visual-only side-effect ledger">
            <div className="seq-proof__bar"><span>BOUNDARY LEDGER</span><b>NOT EVIDENCE</b></div>
            <div className="seq-proof__status">
              <strong>0</strong><span>total side effects</span><small>VISUAL FEEDBACK ONLY</small>
            </div>
            <dl>
              <div><dt>provider calls</dt><dd>{zeroEffects.providerCalls}</dd></div>
              <div><dt>hidden uploads</dt><dd>{zeroEffects.hiddenUploads}</dd></div>
              <div><dt>usage writes</dt><dd>{zeroEffects.usageWrites}</dd></div>
              <div><dt>trust writes</dt><dd>{zeroEffects.trustWrites}</dd></div>
              <div><dt>prompt reads</dt><dd>{zeroEffects.promptReads}</dd></div>
              <div><dt>output reads</dt><dd>{zeroEffects.outputReads}</dd></div>
              <div><dt>publish writes</dt><dd>{zeroEffects.publishWrites}</dd></div>
            </dl>
            {"checks" in selected ? (
              <div className="seq-proof__checks">
                {selected.checks.map((check) => <span key={check}>{check}</span>)}
              </div>
            ) : (
              <div className="seq-proof__checks">
                <span>{selected.author}</span><span>{selected.license}</span><span>{selected.stage}</span>
              </div>
            )}
          </aside>
        </div>

        <details className="seq-sources">
          <summary>
            <div><p>ATTRIBUTION BUS / SOURCE TRUTH</p><h2 id="seq-sources-title">Every borrowed motion cue stays credited</h2></div>
            <code>{lab.references.length} references / no bundled GPL code</code>
          </summary>
          <div className="seq-sources__ledger" aria-labelledby="seq-sources-title">
            <div className="seq-sources__head"><span>project</span><span>license</span><span>design cue</span><span>guardrail</span></div>
            {lab.references.map((reference) => (
              <a className="seq-source" href={reference.url} key={reference.id} rel="noreferrer" target="_blank">
                <b>{reference.project}</b>
                <strong>{reference.license}</strong>
                <span>{reference.cue}</span>
                <em>{reference.guardrail}</em>
              </a>
            ))}
          </div>
        </details>

        <footer className="seq-foot">
          <span><i aria-hidden="true" /> credited visual feedback</span>
          <span>motion never acts as usage evidence</span>
          <a href="/scan">Open local scan</a>
        </footer>
      </section>
    </div>
  );
}
