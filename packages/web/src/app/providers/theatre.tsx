import type { CSSProperties } from "react";
import type { ProviderSurpriseDirector } from "../../lib/provider-scan";

// Extracted verbatim from the former providers/page.tsx theatre stack. Class names are
// preserved so the existing globals.css rules keep styling this panel. It is a visual
// encore only: no provider calls, no ledger writes, no hidden uploads.
export function ProviderSurpriseDirectorPanel({ director }: { director: ProviderSurpriseDirector }) {
  return (
    <section className="scanner-surprise-director" aria-label="Provider surprise director">
      <div className="scanner-surprise-director__head">
        <div>
          <span>VTK://PROVIDER-SURPRISE-DIRECTOR//VISUAL-ONLY//NO-HIDDEN-UPLOAD</span>
          <b>{director.headline}</b>
        </div>
        <p>{director.subline}</p>
      </div>
      <div className="scanner-surprise-director__body">
        <aside className="scanner-surprise-director__terminal" aria-label="Provider surprise director terminal">
          <div className="console-top"><span>director@providers</span><b>VIBERS UNITE</b></div>
          <pre>{director.terminalLines.join("\n")}</pre>
          <div className="scanner-surprise-director__totals" aria-label="Provider surprise director totals">
            <span>{director.totals.cues} cues</span>
            <span>{director.totals.usageEligible} usage eligible</span>
            <span>{director.totals.notUsage} not usage</span>
            <span>{director.totals.manual} manual</span>
            <span>{director.totals.publish} publish</span>
            <span>{director.totals.hiddenUpload} hidden uploads</span>
          </div>
          <strong>{director.motto}</strong>
        </aside>
        <div className="scanner-director-cues" aria-label="Provider surprise cue sequence">
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
                <span>{cue.stage.slice(0, 2)}</span>
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
                <small>{cue.profileEffect}</small>
                <small>{cue.guardrail}</small>
              </div>
              <div className="scanner-director-cue__marks" aria-label={`${cue.label} provider marks`}>
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
