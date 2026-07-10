import { buildAppShellStatus } from "../lib/app-shell-status";
import type { CSSProperties } from "react";

export function UsageSignalDock() {
  const shellStatus = buildAppShellStatus();

  return (
    <section className="app-shell-dock" aria-label="VibeTRACKER global signal dock">
      <div className="usage-instrument">
        <div className="usage-instrument__copy">
          <div className="usage-instrument__kicker">
            <span><i aria-hidden="true" /> system online</span>
            <code>VTK://SIGNAL-DECK</code>
          </div>
          <p className="usage-instrument__title">Your AI life.<br /><span>One honest ledger.</span></p>
          <p className="usage-instrument__lede">
            Track spend, credits, local runs, and creator tools without mixing trust signals into usage.
          </p>
          <div className="usage-instrument__actions">
            <a href="/wizard">Start a local scan <span aria-hidden="true">-&gt;</span></a>
            <a href="/proof">Inspect proof</a>
          </div>
        </div>
        <div className="usage-instrument__scope" aria-label="Five-channel usage signal monitor">
          <div className="usage-instrument__scope-head">
            <div><i aria-hidden="true" /><span>live signal monitor</span></div>
            <code>preview only // 0 writes</code>
          </div>
          <div className="usage-instrument__channels">
            {shellStatus.spectrum.rails.map((rail, index) => (
              <article
                className={`usage-channel usage-channel--${rail.impact}`}
                data-impact={rail.impact}
                style={{
                  "--i": index,
                  "--meter": `${rail.meter}%`,
                  "--brand-from": rail.from,
                  "--brand-to": rail.to,
                } as CSSProperties}
                key={rail.id}
              >
                <div className="usage-channel__identity">
                  <i>{rail.mark}</i>
                  <div><span>{rail.label}</span><b>{rail.value}</b></div>
                </div>
                <div className="usage-channel__wave" aria-hidden="true">
                  {rail.bars.map((bar, barIndex) => (
                    <i
                      style={{ "--b": barIndex, "--bar": `${bar}%` } as CSSProperties}
                      key={`${rail.id}-${barIndex}`}
                    />
                  ))}
                </div>
                <code>{rail.command}</code>
                <em aria-label={`${rail.label} signal strength ${rail.meter} percent`}><i /></em>
              </article>
            ))}
          </div>
          <div className="usage-instrument__scope-foot">
            <span><i aria-hidden="true" /> usage counted</span>
            <span><i aria-hidden="true" /> trust separated</span>
            <span><i aria-hidden="true" /> local stays local</span>
            <strong>hidden uploads: 0</strong>
          </div>
        </div>
      </div>
      <details className="app-shell-diagnostics">
        <summary>
          <span>Advanced telemetry</span>
          <b>{shellStatus.spectrum.rails.length} isolated rails // 0 hidden side effects</b>
        </summary>
        <div className="usage-diagnostics" aria-label="Advanced telemetry rail details">
          {shellStatus.spectrum.rails.map((rail, index) => (
            <article
              style={{
                "--i": index,
                "--brand-from": rail.from,
                "--brand-to": rail.to,
              } as CSSProperties}
              key={rail.id}
            >
              <i>{rail.mark}</i>
              <div><span>{rail.label}</span><b>{rail.value}</b></div>
              <code>{rail.command}</code>
              <small>{rail.guardrail}</small>
            </article>
          ))}
        </div>
      </details>
    </section>
  );
}
