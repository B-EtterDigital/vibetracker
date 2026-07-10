import type { CSSProperties } from "react";
import {
  buildCollectionBlackBox,
  buildCollectionCommandRunway,
  buildCollectionEncoreRecap,
  buildCollectionEventTape,
  buildCollectionFlightRecorder,
  buildCollectionHeroScanBridge,
  buildCollectionReplayDeck,
  buildCollectionSignalStack,
  buildCollectionSurpriseCascade,
  buildCollectionSurpriseDirector,
  buildCollectionSurpriseRun,
  buildCollectionSurpriseSequencer,
  buildCollectionTransmissionRibbon,
} from "../../lib/collection-surprises";

const SCAN_EQUALIZER_SIDE_EFFECTS = [
  "providerCalls=0",
  "ledgerWrites=0",
  "hiddenUploads=0",
  "promptReads=0",
] as const;

export const metadata = {
  title: "VibeUsage Scan Room",
  description: "A visual-only terminal GUI for VibeTRACKER scan, collection, validation, replay, and C0VIBE review surprises.",
};

function railLabelFor(impact: string): string {
  if (impact === "trust" || impact === "local_only") return "NOT USAGE";
  if (impact === "privacy") return "PRIVACY";
  if (impact === "publish") return "PUBLISH";
  return "USAGE";
}

function equalizerBars(meter: number, index: number): number[] {
  return Array.from({ length: 10 }, (_, barIndex) => {
    const wave = ((barIndex + 2) * (index + 3) * 13) % 46;
    return Math.max(18, Math.min(100, Math.round(meter * 0.54 + wave)));
  });
}

function ScanRoomPulseMasthead({ bridge }: { bridge: ReturnType<typeof buildCollectionHeroScanBridge> }) {
  return (
    <div className="scan-route-pulse" aria-label="Scan room opening pulse rails">
      <div className="scan-route-pulse__head">
        <span>VTK://SCAN-PULSE//VISUAL-ONLY//ZERO-WRITES</span>
        <b>{bridge.totals.surprises} surprises armed</b>
        <em>{bridge.totals.usageWrites} usage writes</em>
      </div>
      <div className="scan-route-pulse__rails" aria-label="Opening scan pulse stages">
        {bridge.stages.slice(0, 4).map((stage, index) => (
          <article
            className={`scan-route-pulse-rail scan-route-pulse-rail--${stage.impact}`}
            data-rail={stage.railLabel}
            style={{
              "--i": index,
              "--meter": `${stage.meter}%`,
              "--brand-from": stage.marks[0]?.from,
              "--brand-to": stage.marks[0]?.to,
              "--brand-ink": stage.marks[0]?.ink,
            } as CSSProperties}
            key={stage.id}
          >
            <pre aria-hidden="true">{stage.frames[0]}</pre>
            <div>
              <span>{stage.stage}</span>
              <b>{stage.gate}</b>
              <em>{stage.railLabel}</em>
            </div>
            <i aria-hidden="true" />
          </article>
        ))}
      </div>
    </div>
  );
}

function ScanSignalEqualizer({ bridge }: { bridge: ReturnType<typeof buildCollectionHeroScanBridge> }) {
  return (
    <div className="scan-signal-equalizer" aria-label="Scan room branded signal equalizer">
      <div className="scan-signal-equalizer__head">
        <span>VTK://SCAN-EQUALIZER//SIGNATURE-REVEALS//ZERO-SIDE-EFFECTS</span>
        <b>live scan equalizer</b>
        <em>Vibers Unite</em>
      </div>
      <div className="scan-signal-equalizer__body">
        <div className="scan-signal-equalizer__terminal" aria-label="Scan equalizer terminal counters">
          <div className="console-top"><span>equalizer@scan-room</span><b>C0VIBE.APP</b></div>
          <pre>{[
            "$ vibetrack scan --preview --surprises",
            `channels=${bridge.stages.length} visualOnly=${bridge.totals.visualOnly}`,
            SCAN_EQUALIZER_SIDE_EFFECTS.join(" "),
            "HF prism -> Codex cube -> local sonar -> C0VIBE flash",
            "usage labels stay separate from NOT USAGE trust rails",
          ].join("\n")}</pre>
        </div>
        <div className="scan-signal-equalizer__channels" aria-label="Scan equalizer branded provider channels">
          {bridge.stages.map((stage, index) => {
            const mark = stage.marks[0];
            return (
              <article
                className={`scan-equalizer-channel scan-equalizer-channel--${stage.impact}`}
                data-rail={stage.railLabel}
                style={{
                  "--i": index,
                  "--meter": `${stage.meter}%`,
                  "--brand-from": mark?.from,
                  "--brand-to": mark?.to,
                  "--brand-ink": mark?.ink,
                } as CSSProperties}
                key={stage.id}
              >
                <div className="scan-equalizer-channel__top">
                  <i>{mark?.mark ?? stage.stage}</i>
                  <span>{stage.railLabel}</span>
                </div>
                <div className="scan-equalizer-channel__bars" aria-hidden="true">
                  {equalizerBars(stage.meter, index).map((bar, barIndex) => (
                    <i
                      style={{ "--bar": `${bar}%`, "--b": barIndex } as CSSProperties}
                      key={`${stage.id}-${barIndex}`}
                    />
                  ))}
                </div>
                <b>{stage.label}</b>
                <small>{stage.status}</small>
              </article>
            );
          })}
        </div>
      </div>
      <div className="scan-signal-equalizer__scope" aria-label="Scan equalizer preview side effects">
        {SCAN_EQUALIZER_SIDE_EFFECTS.map((effect) => (
          <span key={effect}>{effect}</span>
        ))}
      </div>
    </div>
  );
}

function HeroScanBridgePanel({ bridge }: { bridge: ReturnType<typeof buildCollectionHeroScanBridge> }) {
  return (
    <section className="scan-route-hero collection-hero-scan-bridge" aria-label="VibeTRACKER first-screen scan surprise bridge">
      <div className="collection-hero-scan-bridge__head">
        <div>
          <span>VTK://SCAN-ROOM//HERO-SCAN-BRIDGE//SURPRISES-ARMED</span>
          <b>{bridge.headline}</b>
        </div>
        <p>{bridge.subline}</p>
      </div>
      <div className="collection-hero-scan-bridge__body">
        <aside className="collection-hero-scan-bridge__terminal" aria-label="First-screen scan bridge terminal">
          <div className="console-top"><span>hero-scan@local</span><b>VISUAL ONLY</b></div>
          <pre>{bridge.terminalLines.join("\n")}</pre>
          <div className="collection-hero-scan-bridge__totals" aria-label="First-screen scan bridge safety totals">
            <span>{bridge.totals.stages} stages</span>
            <span>{bridge.totals.surprises} surprises</span>
            <span>{bridge.totals.usage} usage</span>
            <span>{bridge.totals.notUsage} not usage</span>
            <span>{bridge.totals.publish} publish</span>
            <span>{bridge.totals.usageWrites} writes</span>
          </div>
          <strong>{bridge.motto}</strong>
        </aside>
        <div className="collection-hero-scan-bridge__stages" aria-label="First-screen scan surprise stages">
          {bridge.stages.map((stage, index) => (
            <article
              className={`collection-hero-scan-stage collection-hero-scan-stage--${stage.impact}`}
              data-gate={stage.gate}
              style={{
                "--i": index,
                "--meter": `${stage.meter}%`,
                "--delay": `${stage.delayMs}ms`,
                "--brand-from": stage.marks[0]?.from,
                "--brand-to": stage.marks[0]?.to,
                "--brand-ink": stage.marks[0]?.ink,
              } as CSSProperties}
              key={stage.id}
            >
              <div className="collection-hero-scan-stage__top">
                <span>{stage.stage}</span>
                <b>{stage.gate}</b>
                <i>{stage.railLabel}</i>
              </div>
              <div className="collection-hero-scan-stage__screen" aria-hidden="true">
                {stage.frames.map((frame, frameIndex) => (
                  <pre style={{ "--f": frameIndex } as CSSProperties} key={`${stage.id}-${frameIndex}`}>
                    {frame}
                  </pre>
                ))}
              </div>
              <div className="collection-hero-scan-stage__copy">
                <strong>{stage.label}</strong>
                <code>{stage.command}</code>
                <p>{stage.cue}</p>
                <small>{stage.guardrail}</small>
              </div>
              <pre className="collection-hero-scan-stage__lines" aria-label={`${stage.label} first-screen bridge lines`}>
                {stage.terminalLines.join("\n")}
              </pre>
              <div className="collection-hero-scan-stage__marks" aria-label={`${stage.label} first-screen bridge marks`}>
                {stage.marks.map((mark) => (
                  <i
                    style={{
                      "--brand-from": mark.from,
                      "--brand-to": mark.to,
                      "--brand-ink": mark.ink,
                    } as CSSProperties}
                    title={mark.label}
                    key={`${stage.id}-${mark.id}`}
                  >
                    {mark.mark}
                  </i>
                ))}
              </div>
              <div className="collection-hero-scan-stage__meter" aria-label={`${stage.label} first-screen bridge meter ${stage.meter} percent`}>
                <i />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ScanCommandRunwayPanel({ runway }: { runway: ReturnType<typeof buildCollectionCommandRunway> }) {
  return (
    <section className="scan-command-runway" aria-label="Live scan command runway">
      <div className="scan-command-runway__head">
        <div>
          <span>VTK://SCAN-ROOM//COMMAND-RUNWAY//LIVE-GUI//NO-FAKE-USAGE</span>
          <b>{runway.headline}</b>
        </div>
        <p>{runway.subline}</p>
      </div>
      <div className="scan-command-runway__body">
        <aside className="scan-command-runway__terminal" aria-label="Live scan command runway terminal">
          <div className="console-top"><span>runway@scan-room</span><b>VISUAL ONLY</b></div>
          <pre>{runway.terminalLines.join("\n")}</pre>
          <div className="scan-command-runway__totals" aria-label="Live scan command runway totals">
            <span>{runway.totals.steps} steps</span>
            <span>{runway.totals.usage} usage</span>
            <span>{runway.totals.notUsage} not usage</span>
            <span>{runway.totals.privacy} privacy</span>
            <span>{runway.totals.publish} publish</span>
            <span>{runway.totals.usageWrites} writes</span>
          </div>
        </aside>
        <div className="scan-command-runway__steps" aria-label="Live scan command runway steps">
          {runway.steps.map((step, index) => (
            <article
              className={`scan-command-runway-step scan-command-runway-step--${step.impact}`}
              data-impact={step.railLabel}
              style={{
                "--i": index,
                "--meter": `${step.meter}%`,
                "--tone": step.from,
                "--tone-2": step.to,
                "--brand-ink": step.ink,
              } as CSSProperties}
              key={step.id}
            >
              <div className="scan-command-runway-step__top">
                <span>{step.stage}</span>
                <b>{step.railLabel}</b>
                <i>{step.mark}</i>
              </div>
              <div className="scan-command-runway-step__screen" aria-hidden="true">
                {step.frames.map((frame, frameIndex) => (
                  <pre style={{ "--f": frameIndex } as CSSProperties} key={`${step.id}-${frameIndex}`}>{frame}</pre>
                ))}
              </div>
              <div className="scan-command-runway-step__copy">
                <strong>{step.label}</strong>
                <code>{step.command}</code>
                <p>{step.note}</p>
                <small>{step.guardrail} // visualOnly={String(step.visualOnly)} // usageWrites={String(step.usageWrites)}</small>
              </div>
              <div className="scan-command-runway-step__transcript" aria-label={`${step.label} command runway transcript`}>
                {step.transcript.map((line) => (
                  <span key={`${step.id}-${line}`}>{line}</span>
                ))}
              </div>
              <div className="scan-command-runway-step__meter" aria-label={`${step.label} command runway meter ${step.meter} percent`}>
                <i />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ScannerSurpriseDirectorPanel({ director }: { director: ReturnType<typeof buildCollectionSurpriseDirector> }) {
  return (
    <section className="scanner-surprise-director" aria-label="Scanner surprise director">
      <div className="scanner-surprise-director__head">
        <div>
          <span>VTK://SCAN-ROOM//SURPRISE-DIRECTOR//SHOWRUN//NO-FAKE-PROOF</span>
          <b>{director.headline}</b>
        </div>
        <p>{director.subline}</p>
      </div>
      <div className="scanner-surprise-director__body">
        <aside className="scanner-surprise-director__terminal" aria-label="Scanner surprise director terminal">
          <div className="console-top"><span>director@scan-room</span><b>VIBERS UNITE</b></div>
          <pre>{director.terminalLines.join("\n")}</pre>
          <div className="scanner-surprise-director__totals" aria-label="Scanner surprise director totals">
            <span>{director.totals.cues} cues</span>
            <span>{director.totals.usage} usage</span>
            <span>{director.totals.notUsage} not usage</span>
            <span>{director.totals.publish} publish</span>
            <span>{director.totals.providers} marks</span>
          </div>
          <strong>{director.motto}</strong>
        </aside>
        <div className="scanner-director-cues" aria-label="Scanner surprise cue sequence">
          {director.cues.map((cue, index) => (
            <article
              className={`scanner-director-cue scanner-director-cue--${cue.impact}`}
              data-impact={cue.impact}
              style={{
                "--i": index,
                "--meter": `${cue.meter}%`,
                "--delay": `${cue.delayMs}ms`,
                "--brand-from": cue.marks[0]?.from,
                "--brand-to": cue.marks[0]?.to,
                "--brand-ink": cue.marks[0]?.ink,
              } as CSSProperties}
              key={cue.id}
            >
              <div className="scanner-director-cue__top">
                <span>{cue.stage}</span>
                <b>{cue.gate}</b>
                <i>{cue.railLabel}</i>
              </div>
              <div className="scanner-director-cue__screen" aria-hidden="true">
                {cue.frames.map((frame, frameIndex) => (
                  <pre style={{ "--f": frameIndex } as CSSProperties} key={`${cue.id}-${frameIndex}`}>
                    {frame}
                  </pre>
                ))}
              </div>
              <div className="scanner-director-cue__copy">
                <strong>{cue.label}</strong>
                <code>{cue.command}</code>
                <p>{cue.caption}</p>
                <small>{cue.guardrail}</small>
              </div>
              <div className="scanner-director-cue__marks" aria-label={`${cue.label} director marks`}>
                {cue.marks.map((mark, markIndex) => (
                  <i
                    style={{
                      "--m": markIndex,
                      "--brand-from": mark.from,
                      "--brand-to": mark.to,
                      "--brand-ink": mark.ink,
                    } as CSSProperties}
                    title={mark.label}
                    key={`${cue.id}-${mark.id}`}
                  >
                    {mark.mark}
                  </i>
                ))}
              </div>
              <footer className="scanner-director-cue__foot">
                <span>{cue.timing}</span>
                <b>{cue.operatorLine}</b>
              </footer>
              <div className="scanner-director-cue__meter" aria-label={`${cue.label} director meter ${cue.meter} percent`}>
                <i />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ScanLogoEncoreReelPanel({
  ribbon,
  credits,
}: {
  ribbon: ReturnType<typeof buildCollectionTransmissionRibbon>;
  credits: string[];
}) {
  const creditLines = credits
    .filter((credit) => /cli-spinners|ascii-globe|drawille|Encore reel/.test(credit))
    .slice(0, 2)
    .map((credit) => `| credit ${credit}`.slice(0, 56).padEnd(56, " "));

  return (
    <section className="surprise-transmission scan-logo-encore-reel" aria-label="Scan room logo encore reel">
      <div className="surprise-transmission__head">
        <span>VTK://SURPRISE-RIBBON//LOGO-ENCORE//SCAN-COLLECT//NO-FAKE-SPEND</span>
        <b>{ribbon.headline}</b>
      </div>
      <div className="surprise-transmission__body">
        <aside className="surprise-transmission__terminal" aria-label="Scan room logo encore terminal">
          <div className="console-top"><span>logo-reel@scan-room</span><b>HF CX 127 C0</b></div>
          <pre>{[...ribbon.terminalLines, ...creditLines].join("\n")}</pre>
          <p>{ribbon.subline}</p>
        </aside>
        <div className="surprise-transmission__steps">
          {ribbon.steps.map((step, index) => (
            <article
              className={`surprise-transmission-step surprise-transmission-step--${step.impact}`}
              style={{
                "--i": index,
                "--meter": `${step.meter}%`,
                "--delay": `${step.delayMs}ms`,
                "--brand-from": step.marks[0]?.from,
                "--brand-to": step.marks[0]?.to,
                "--brand-ink": step.marks[0]?.ink,
              } as CSSProperties}
              key={step.id}
            >
              <div className="surprise-transmission-step__top">
                <span>{step.stage}</span>
                <b>{step.gate}</b>
              </div>
              <div className="surprise-transmission-step__screen" aria-hidden="true">
                {step.frames.map((frame, frameIndex) => (
                  <pre style={{ "--f": frameIndex } as CSSProperties} key={`${step.id}-${frameIndex}`}>
                    {frame}
                  </pre>
                ))}
              </div>
              <div className="surprise-transmission-step__copy">
                <i>{railLabelFor(step.impact)} / {step.status}</i>
                <strong>{step.label}</strong>
                <code>{step.command}</code>
                <p>{step.cue}</p>
                <small>{step.guardrail}</small>
              </div>
              <div className="surprise-transmission-step__marks" aria-label={`${step.label} logo encore marks`}>
                {step.marks.map((mark) => (
                  <i
                    style={{
                      "--brand-from": mark.from,
                      "--brand-to": mark.to,
                      "--brand-ink": mark.ink,
                    } as CSSProperties}
                    title={mark.label}
                    key={`${step.id}-${mark.id}`}
                  >
                    {mark.mark}
                  </i>
                ))}
              </div>
              <div className="surprise-transmission-step__meter" aria-label={`${step.label} logo encore meter ${step.meter} percent`}>
                <i />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CollectionSurpriseCascadePanel({ cascade }: { cascade: ReturnType<typeof buildCollectionSurpriseCascade> }) {
  return (
    <section className="collection-surprise-cascade" aria-label="Collection surprise cascade">
      <div className="collection-surprise-cascade__head">
        <div>
          <span>VTK://SCAN-ROOM//SURPRISE-CASCADE//SCAN-COLLECT//NO-FAKE-PROOF</span>
          <b>{cascade.headline}</b>
        </div>
        <p>{cascade.subline}</p>
      </div>
      <div className="collection-surprise-cascade__body">
        <aside className="collection-surprise-cascade__terminal" aria-label="Surprise cascade terminal">
          <div className="console-top"><span>cascade@scan-room</span><b>VIBERS UNITE</b></div>
          <pre>{cascade.terminalLines.join("\n")}</pre>
          <div className="collection-surprise-cascade__totals" aria-label="Surprise cascade totals">
            <span>{cascade.totals.beats} beats</span>
            <span>{cascade.totals.surprises} surprise</span>
            <span>{cascade.totals.usage} usage</span>
            <span>{cascade.totals.notUsage} not usage</span>
            <span>{cascade.totals.publish} publish</span>
            <span>{cascade.totals.maxDelayMs}ms max</span>
          </div>
          <strong>{cascade.motto}</strong>
        </aside>
        <div className="collection-cascade-beats" aria-label="Timed collection surprise beats">
          {cascade.beats.map((beat, index) => (
            <article
              className={`collection-cascade-beat collection-cascade-beat--${beat.impact}`}
              data-surprise={beat.surprise ? "true" : "false"}
              style={{
                "--i": index,
                "--meter": `${beat.meter}%`,
                "--delay": `${beat.delayMs}ms`,
                "--brand-from": beat.marks[0]?.from,
                "--brand-to": beat.marks[0]?.to,
                "--brand-ink": beat.marks[0]?.ink,
              } as CSSProperties}
              key={beat.id}
            >
              <div className="collection-cascade-beat__top">
                <i>{beat.stage}</i>
                <span>{beat.timing}</span>
                <b>{beat.railLabel}</b>
              </div>
              <pre className="collection-cascade-beat__frame" aria-label={`${beat.label} frame`}>
                {beat.frame}
              </pre>
              <div className="collection-cascade-beat__copy">
                <strong>{beat.label}</strong>
                <code>{beat.command}</code>
                <p>{beat.caption}</p>
                <small>{beat.guardrail}</small>
              </div>
              <pre className="collection-cascade-beat__operator" aria-label={`${beat.label} operator lines`}>
                {beat.operatorLines.join("\n")}
              </pre>
              <div className="collection-cascade-beat__marks" aria-label={`${beat.label} cascade marks`}>
                {beat.marks.map((mark, markIndex) => (
                  <i
                    style={{
                      "--m": markIndex,
                      "--brand-from": mark.from,
                      "--brand-to": mark.to,
                      "--brand-ink": mark.ink,
                    } as CSSProperties}
                    title={mark.label}
                    key={`${beat.id}-${mark.id}`}
                  >
                    {mark.mark}
                  </i>
                ))}
              </div>
              <div className="collection-cascade-beat__meter" aria-label={`${beat.label} cascade meter ${beat.meter} percent`}>
                <i />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ScannerBlackBoxPanel({ blackBox }: { blackBox: ReturnType<typeof buildCollectionBlackBox> }) {
  return (
    <section className="scanner-black-box" aria-label="Replayable scanner black box">
      <div className="scanner-black-box__head">
        <span>VTK://SCAN-ROOM//SCANNER-BLACK-BOX//LOCAL-REPLAY//NO-PROMPTS</span>
        <b>{blackBox.headline}</b>
      </div>
      <div className="scanner-black-box__body">
        <aside className="scanner-black-box__terminal" aria-label="Scanner black box terminal transcript">
          <div className="console-top"><span>blackbox@scan-room</span><b>REPLAY HASH</b></div>
          <pre>{blackBox.terminalLines.join("\n")}</pre>
          <p>{blackBox.subline}</p>
        </aside>
        <div className="scanner-black-box__cells" aria-label="Replayable scanner black box cells">
          {blackBox.cells.map((cell, index) => (
            <article
              className={`scanner-black-cell scanner-black-cell--${cell.impact}`}
              style={{
                "--i": index,
                "--meter": `${cell.meter}%`,
                "--brand-from": cell.marks[0]?.from,
                "--brand-to": cell.marks[0]?.to,
                "--brand-ink": cell.marks[0]?.ink,
              } as CSSProperties}
              key={cell.id}
            >
              <div className="scanner-black-cell__top">
                <span>{cell.stage}</span>
                <b>{cell.id}</b>
                <i>{railLabelFor(cell.impact)}</i>
              </div>
              <div className="scanner-black-cell__scope" aria-hidden="true">
                {cell.frames.map((frame, frameIndex) => (
                  <pre style={{ "--f": frameIndex } as CSSProperties} key={`${cell.id}-${frameIndex}`}>
                    {frame}
                  </pre>
                ))}
              </div>
              <div className="scanner-black-cell__copy">
                <strong>{cell.label}</strong>
                <code>{cell.command}</code>
                <p>{cell.guardrail}</p>
              </div>
              <pre className="scanner-black-cell__transcript" aria-label={`${cell.label} black box transcript`}>
                {cell.transcript.join("\n")}
              </pre>
              <div className="scanner-black-cell__foot">
                <span>{cell.checksum}</span>
                <b>{cell.status}</b>
              </div>
              <div className="scanner-black-cell__marks" aria-label={`${cell.label} black box marks`}>
                {cell.marks.map((mark) => (
                  <i
                    style={{
                      "--brand-from": mark.from,
                      "--brand-to": mark.to,
                      "--brand-ink": mark.ink,
                    } as CSSProperties}
                    title={mark.label}
                    key={`${cell.id}-${mark.id}`}
                  >
                    {mark.mark}
                  </i>
                ))}
              </div>
              <div className="scanner-black-cell__meter" aria-label={`${cell.label} black box meter ${cell.meter} percent`}>
                <i />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ScanFlightRecorderPanel({
  recorder,
  tape,
}: {
  recorder: ReturnType<typeof buildCollectionFlightRecorder>;
  tape: ReturnType<typeof buildCollectionEventTape>;
}) {
  return (
    <section className="scan-route-hero collection-flight-recorder" aria-label="VibeTRACKER scan room flight recorder">
      <div className="collection-flight-recorder__head">
        <div>
          <span>VTK://SCAN-ROOM//SURPRISE-FLIGHT-RECORDER//NO-FAKE-PROOF</span>
          <b>{recorder.headline}</b>
        </div>
        <p>{recorder.subline}</p>
      </div>
      <div className="collection-flight-recorder__body">
        <aside className="collection-flight-recorder__terminal" aria-label="Scan room terminal recorder">
          <div className="console-top"><span>scan-room@local</span><b>VISUAL ONLY</b></div>
          <pre>{recorder.terminalLines.join("\n")}</pre>
          <div className="collection-flight-recorder__totals" aria-label="Scan room safety totals">
            <span>{recorder.totals.events} events</span>
            <span>{recorder.totals.usage} usage</span>
            <span>{recorder.totals.notUsage} not usage</span>
            <span>{recorder.totals.localOnly} local</span>
            <span>{recorder.totals.publish} publish</span>
            <span>{recorder.totals.writes} writes</span>
          </div>
          <div className="collection-control-tape" aria-label="Scan room control tape">
            {recorder.controlTape.map((step, index) => (
              <article
                data-impact={step.impact}
                style={{
                  "--i": index,
                  "--meter": `${step.meter}%`,
                  "--brand-from": step.from,
                  "--brand-to": step.to,
                  "--brand-ink": step.ink,
                } as CSSProperties}
                key={step.id}
              >
                <div className="collection-control-tape__screen" aria-hidden="true">
                  {step.frames.map((frame, frameIndex) => (
                    <pre style={{ "--frame": frameIndex } as CSSProperties} key={`${step.id}-${frameIndex}`}>
                      {frame}
                    </pre>
                  ))}
                  <i>{step.id.toUpperCase()}</i>
                </div>
                <div className="collection-control-tape__copy">
                  <span>{step.railLabel}</span>
                  <b>{step.label}</b>
                  <code>{step.command}</code>
                  <strong>{step.value}</strong>
                  <pre>{step.terminalLines.join("\n")}</pre>
                  <small>{step.detail}</small>
                  <em aria-label={`${step.label} control tape meter ${step.meter} percent`} />
                </div>
              </article>
            ))}
          </div>
          <strong>{recorder.motto}</strong>
          <div className="collection-event-tape" aria-label="Compact visual-only scan event tape">
            <div className="collection-event-tape__head">
              <span>{tape.headline}</span>
              <b>{tape.totals.usageWrites} writes</b>
            </div>
            <pre>{tape.terminalLines.join("\n")}</pre>
            <div className="collection-event-tape__rows">
              {tape.rows.slice(0, 12).map((row, index) => (
                <article
                  data-phase={row.phase}
                  style={{
                    "--i": index,
                    "--meter": `${row.meter}%`,
                    "--brand-from": row.from,
                    "--brand-to": row.to,
                    "--brand-ink": row.ink,
                  } as CSSProperties}
                  key={row.id}
                >
                  <i>{row.mark}</i>
                  <span>{row.timing}</span>
                  <b>{row.railLabel}</b>
                  <code>{row.line}</code>
                  <em aria-label={`${row.label} event tape meter ${row.meter} percent`} />
                </article>
              ))}
            </div>
          </div>
        </aside>
        <div className="collection-flight-events" aria-label="Recorded scan room visual-only events">
          {recorder.events.map((event, index) => (
            <article
              className={`collection-flight-event collection-flight-event--${event.impact}`}
              data-phase={event.phase}
              style={{
                "--i": index,
                "--meter": `${event.meter}%`,
                "--delay": `${event.delayMs}ms`,
                "--brand-from": event.marks[0]?.from,
                "--brand-to": event.marks[0]?.to,
                "--brand-ink": event.marks[0]?.ink,
              } as CSSProperties}
              key={event.id}
            >
              <div className="collection-flight-event__top">
                <i>{event.stage}</i>
                <span>{event.timing}</span>
                <b>{event.railLabel}</b>
              </div>
              <pre className="collection-flight-event__frame" aria-label={`${event.label} flight recorder frame`}>
                {event.frame}
              </pre>
              <div className="collection-flight-event__copy">
                <strong>{event.mark} {event.label}</strong>
                <code>{event.command}</code>
                <p>{event.cue}</p>
                <small>{event.guardrail}</small>
              </div>
              <pre className="collection-flight-event__transcript" aria-label={`${event.label} flight recorder transcript`}>
                {event.transcript.join("\n")}
              </pre>
              <div className="collection-flight-event__marks" aria-label={`${event.label} flight recorder marks`}>
                {event.marks.map((mark, markIndex) => (
                  <i
                    style={{
                      "--m": markIndex,
                      "--brand-from": mark.from,
                      "--brand-to": mark.to,
                      "--brand-ink": mark.ink,
                    } as CSSProperties}
                    title={mark.label}
                    key={`${event.id}-${mark.id}`}
                  >
                    {mark.mark}
                  </i>
                ))}
              </div>
              <footer className="collection-flight-event__foot">
                <span>{event.checksum}</span>
                <b>{event.visualOnly ? "visualOnly=true" : "usage write"}</b>
              </footer>
              <div className="collection-flight-event__meter" aria-label={`${event.label} flight recorder meter ${event.meter} percent`}>
                <i />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SignalStackPanel({ stack }: { stack: ReturnType<typeof buildCollectionSignalStack> }) {
  return (
    <section className="collection-signal-stack" aria-label="Scan room signal stack">
      <div className="collection-signal-stack__head">
        <span>VTK://SCAN-ROOM//SIGNAL-STACK//NO-MIXED-RAILS</span>
        <b>{stack.headline}</b>
      </div>
      <div className="collection-signal-stack__body">
        <aside className="collection-signal-stack__terminal" aria-label="Scan room signal stack terminal">
          <div className="console-top"><span>stack@scan-room</span><b>CONTROL ROOM</b></div>
          <pre>{stack.terminalLines.join("\n")}</pre>
          <p>{stack.subline}</p>
        </aside>
        <div className="collection-signal-stack__stages">
          {stack.stages.map((stage, index) => (
            <article
              className={`collection-signal-stage collection-signal-stage--${stage.impact}`}
              style={{
                "--i": index,
                "--meter": `${stage.meter}%`,
                "--brand-from": stage.marks[0]?.from,
                "--brand-to": stage.marks[0]?.to,
                "--brand-ink": stage.marks[0]?.ink,
              } as CSSProperties}
              key={stage.id}
            >
              <div className="collection-signal-stage__top">
                <span>{stage.stage}</span>
                <b>{stage.id}</b>
                <i>{stage.status}</i>
              </div>
              <div className="collection-signal-stage__visual" aria-hidden="true">
                <div className="collection-signal-stage__frames">
                  {stage.frames.map((frame, frameIndex) => (
                    <pre style={{ "--f": frameIndex } as CSSProperties} key={`${stage.id}-${frameIndex}`}>
                      {frame}
                    </pre>
                  ))}
                </div>
                <div className="collection-signal-stage__marks">
                  {stage.marks.map((mark, markIndex) => (
                    <i
                      style={{
                        "--m": markIndex,
                        "--brand-from": mark.from,
                        "--brand-to": mark.to,
                        "--brand-ink": mark.ink,
                      } as CSSProperties}
                      title={mark.label}
                      key={`${stage.id}-${mark.id}`}
                    >
                      {mark.mark}
                    </i>
                  ))}
                </div>
              </div>
              <div className="collection-signal-stage__copy">
                <strong>{stage.label}</strong>
                <code>{stage.command}</code>
                <p>{stage.caption}</p>
                <small>{stage.guardrail}</small>
              </div>
              <pre className="collection-signal-stage__lines" aria-label={`${stage.label} signal lines`}>
                {stage.signalLines.join("\n")}
              </pre>
              <div className="collection-signal-stage__meter" aria-label={`${stage.label} stack meter ${stage.meter} percent`}>
                <i />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SurpriseSequencerPanel({ sequencer }: { sequencer: ReturnType<typeof buildCollectionSurpriseSequencer> }) {
  return (
    <section className="collection-surprise-sequencer" aria-label="Scan room signature surprise sequencer">
      <div className="collection-surprise-sequencer__head">
        <span>VTK://SCAN-ROOM//SIGNATURE-SEQUENCER//TIMED-REVEALS</span>
        <b>{sequencer.headline}</b>
      </div>
      <div className="collection-surprise-sequencer__body">
        <aside className="collection-surprise-sequencer__terminal" aria-label="Scan room signature sequencer terminal">
          <div className="console-top"><span>sequencer@scan-room</span><b>BLINK TURN SPARK</b></div>
          <pre>{sequencer.terminalLines.join("\n")}</pre>
          <p>{sequencer.subline}</p>
        </aside>
        <div className="collection-surprise-sequencer__steps">
          {sequencer.steps.map((step, index) => (
            <article
              className={`collection-surprise-sequence collection-surprise-sequence--${step.impact}`}
              style={{
                "--i": index,
                "--meter": `${step.meter}%`,
                "--delay": `${step.delayMs}ms`,
                "--brand-from": step.marks[0]?.from,
                "--brand-to": step.marks[0]?.to,
                "--brand-ink": step.marks[0]?.ink,
              } as CSSProperties}
              key={step.id}
            >
              <div className="collection-surprise-sequence__top">
                <span>{step.stage}</span>
                <b>{step.gate}</b>
                <i>{railLabelFor(step.impact)}</i>
              </div>
              <div className="collection-surprise-sequence__reel" aria-hidden="true">
                {step.frames.map((frame, frameIndex) => (
                  <pre style={{ "--f": frameIndex } as CSSProperties} key={`${step.id}-${frameIndex}`}>
                    {frame}
                  </pre>
                ))}
              </div>
              <div className="collection-surprise-sequence__beats" aria-label={`${step.label} signature reveal beats`}>
                {step.beats.map((beat, beatIndex) => (
                  <span style={{ "--b": beatIndex } as CSSProperties} key={`${step.id}-${beat}`}>
                    <b>{beat}</b>
                    <i />
                  </span>
                ))}
              </div>
              <div className="collection-surprise-sequence__copy">
                <strong>{step.label}</strong>
                <code>{step.command}</code>
                <p>{step.caption}</p>
                <small>{step.guardrail}</small>
              </div>
              <pre className="collection-surprise-sequence__terminal" aria-label={`${step.label} sequencer lines`}>
                {step.terminalLines.join("\n")}
              </pre>
              <div className="collection-surprise-sequence__marks" aria-label={`${step.label} sequencer marks`}>
                {step.marks.map((mark) => (
                  <i
                    style={{
                      "--brand-from": mark.from,
                      "--brand-to": mark.to,
                      "--brand-ink": mark.ink,
                    } as CSSProperties}
                    title={mark.label}
                    key={`${step.id}-${mark.id}`}
                  >
                    {mark.mark}
                  </i>
                ))}
              </div>
              <div className="collection-surprise-sequence__meter" aria-label={`${step.label} sequencer meter ${step.meter} percent`}>
                <i />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReplayAndRecapPanel({
  replay,
  recap,
}: {
  replay: ReturnType<typeof buildCollectionReplayDeck>;
  recap: ReturnType<typeof buildCollectionEncoreRecap>;
}) {
  return (
    <>
      <section className="scan-replay-recorder" aria-label="Scan room live replay recorder">
        <div className="scan-replay-recorder__head">
          <span>VTK://SCAN-ROOM//CLI-TO-GUI//VIBERS-UNITE</span>
          <b>{replay.headline}</b>
        </div>
        <div className="scan-replay-recorder__body">
          <aside className="scan-replay-recorder__terminal" aria-label="Scan room replay terminal">
            <div className="console-top"><span>replay@scan-room</span><b>LIVE TURN</b></div>
            <pre>{replay.terminalLines.join("\n")}</pre>
            <p>{replay.subline}</p>
          </aside>
          <div className="scan-replay-recorder__lanes">
            {replay.lanes.map((lane, index) => (
              <article
                className={`scan-replay-lane scan-replay-lane--${lane.impact}`}
                data-impact={lane.impact}
                style={{
                  "--i": index,
                  "--meter": `${lane.meter}%`,
                  "--delay": `${lane.delayMs}ms`,
                  "--brand-from": lane.marks[0]?.from,
                  "--brand-to": lane.marks[0]?.to,
                  "--brand-ink": lane.marks[0]?.ink,
                } as CSSProperties}
                key={lane.id}
              >
                <div className="scan-replay-lane__top">
                  <span>{lane.stage}</span>
                  <b>{lane.gate}</b>
                </div>
                <div className="scan-replay-lane__screen" aria-hidden="true">
                  {lane.frames.map((frame, frameIndex) => (
                    <pre style={{ "--f": frameIndex } as CSSProperties} key={`${lane.id}-${frameIndex}`}>
                      {frame}
                    </pre>
                  ))}
                </div>
                <div className="scan-replay-lane__copy">
                  <i>{railLabelFor(lane.impact)}</i>
                  <strong>{lane.label}</strong>
                  <code>{lane.command}</code>
                  <p>{lane.caption}</p>
                  <small>{lane.guardrail}</small>
                </div>
                <pre className="scan-replay-lane__transcript" aria-label={`${lane.label} live turn transcript`}>
                  {lane.terminalLines.slice(0, 5).join("\n")}
                </pre>
                <div className="scan-replay-lane__marks" aria-label={`${lane.label} replay marks`}>
                  {lane.marks.map((mark) => (
                    <i
                      style={{
                        "--brand-from": mark.from,
                        "--brand-to": mark.to,
                        "--brand-ink": mark.ink,
                      } as CSSProperties}
                      title={mark.label}
                      key={`${lane.id}-${mark.id}`}
                    >
                      {mark.mark}
                    </i>
                  ))}
                </div>
                <div className="scan-replay-lane__meter" aria-label={`${lane.label} replay meter ${lane.meter} percent`}>
                  <i />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="collection-encore-recap" aria-label="Scan room collection encore recap">
        <div className="collection-encore-recap__head">
          <div>
            <span>VTK://SCAN-ROOM//COLLECTION-ENCORE//NO-EXTRA-ROWS</span>
            <b>{recap.headline}</b>
          </div>
          <p>{recap.subline}</p>
        </div>
        <div className="collection-encore-recap__body">
          <aside className="collection-encore-recap__terminal" aria-label="Scan room encore recap terminal">
            <div className="console-top"><span>encore@scan-room</span><b>SCAN FINALE</b></div>
            <pre>{recap.terminalLines.join("\n")}</pre>
            <div className="collection-encore-recap__totals" aria-label="Scan room encore recap totals">
              <span>{recap.totals.rails} rails</span>
              <span>{recap.totals.usage} usage</span>
              <span>{recap.totals.notUsage} not usage</span>
              <span>{recap.totals.publish} publish</span>
              <span>{recap.totals.replayFrames} frames</span>
              <span>{recap.totals.checksums} hashes</span>
            </div>
          </aside>
          <div className="collection-encore-recap__rails" aria-label="Scan room encore recap rails">
            {recap.rails.map((rail, index) => (
              <article
                className={`collection-recap-rail collection-recap-rail--${rail.impact}`}
                style={{
                  "--i": index,
                  "--meter": `${rail.meter}%`,
                  "--delay": `${rail.delayMs}ms`,
                  "--brand-from": rail.marks[0]?.from,
                  "--brand-to": rail.marks[0]?.to,
                  "--brand-ink": rail.marks[0]?.ink,
                } as CSSProperties}
                key={rail.id}
              >
                <div className="collection-recap-rail__top">
                  <span>{rail.stage}</span>
                  <b>{rail.gate}</b>
                  <i>{rail.railLabel}</i>
                </div>
                <div className="collection-recap-rail__screen" aria-hidden="true">
                  {rail.frames.map((frame, frameIndex) => (
                    <pre style={{ "--f": frameIndex } as CSSProperties} key={`${rail.id}-${frameIndex}`}>
                      {frame}
                    </pre>
                  ))}
                </div>
                <div className="collection-recap-rail__copy">
                  <strong>{rail.label}</strong>
                  <code>{rail.command}</code>
                  <p>{rail.caption}</p>
                  <small>{rail.guardrail}</small>
                </div>
                <pre className="collection-recap-rail__lines" aria-label={`${rail.label} recap lines`}>
                  {rail.recapLines.join("\n")}
                </pre>
                <div className="collection-recap-rail__marks" aria-label={`${rail.label} recap marks`}>
                  {rail.marks.map((mark) => (
                    <i
                      style={{
                        "--brand-from": mark.from,
                        "--brand-to": mark.to,
                        "--brand-ink": mark.ink,
                      } as CSSProperties}
                      title={mark.label}
                      key={`${rail.id}-${mark.id}`}
                    >
                      {mark.mark}
                    </i>
                  ))}
                </div>
                <footer className="collection-recap-rail__foot">
                  <span>{rail.checksum}</span>
                  <b>{rail.status}</b>
                </footer>
                <div className="collection-recap-rail__meter" aria-label={`${rail.label} recap meter ${rail.meter} percent`}>
                  <i />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default function ScanPage() {
  const run = buildCollectionSurpriseRun();
  const bridge = buildCollectionHeroScanBridge(run);
  const runway = buildCollectionCommandRunway(run);
  const ribbon = buildCollectionTransmissionRibbon(run);
  const director = buildCollectionSurpriseDirector(run);
  const cascade = buildCollectionSurpriseCascade(run);
  const blackBox = buildCollectionBlackBox(run);
  const recorder = buildCollectionFlightRecorder(run);
  const tape = buildCollectionEventTape(run);
  const stack = buildCollectionSignalStack(run);
  const sequencer = buildCollectionSurpriseSequencer(run);
  const replay = buildCollectionReplayDeck(run);
  const recap = buildCollectionEncoreRecap(run);

  return (
    <>
      <section className="scan-route-intro" aria-label="VibeTRACKER scan room introduction">
        <div>
          <p className="eyebrow">Scan room</p>
          <h1>Collection theatre with proof rails</h1>
          <p>
            A dedicated GUI for the moments users actually wait through: provider queue,
            scan beat, validation checkpoint, and C0VIBE review relay. Every animation is
            labelled as usage, not-usage, local-only, privacy, or publish.
          </p>
          <ScanRoomPulseMasthead bridge={bridge} />
          <ScanSignalEqualizer bridge={bridge} />
        </div>
        <div className="motto-rail" aria-label="Scan room motto">
          <span>Vibers Unite</span>
          <a href="https://c0vibe.app">C0vibe.app</a>
          <code>NO USAGE WRITES</code>
        </div>
      </section>
      <HeroScanBridgePanel bridge={bridge} />
      <ScanCommandRunwayPanel runway={runway} />
      <ScanLogoEncoreReelPanel ribbon={ribbon} credits={run.credits} />
      <ScannerSurpriseDirectorPanel director={director} />
      <CollectionSurpriseCascadePanel cascade={cascade} />
      <ScannerBlackBoxPanel blackBox={blackBox} />
      <ScanFlightRecorderPanel recorder={recorder} tape={tape} />
      <SignalStackPanel stack={stack} />
      <SurpriseSequencerPanel sequencer={sequencer} />
      <ReplayAndRecapPanel replay={replay} recap={recap} />
    </>
  );
}
