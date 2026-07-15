"use client";

import type { CSSProperties } from "react";
import {
  buildPasskeyCeremonyControl,
  buildPasskeyProofConsole,
  buildPasskeyRecoveryRelay,
  type PasskeyProofInput,
} from "../../lib/passkey-proof-console";

export function PasskeyTechnicalReference({ input }: { input: PasskeyProofInput }) {
  const ceremony = buildPasskeyCeremonyControl(input);
  const relay = buildPasskeyRecoveryRelay(input);
  const proof = buildPasskeyProofConsole(input);

  return (
    <div className="passkey-technical-reference">
      <section className="passkey-ceremony-control" aria-label="Passkey ceremony identity control room">
        <div className="passkey-ceremony-control__head">
          <div><span>VTK://PASSKEY-CEREMONY//LOCAL-ONLY//ZERO-USAGE-MUTATION</span><b>{ceremony.headline}</b></div>
          <p>{ceremony.subline}</p>
        </div>
        <div className="passkey-ceremony-control__body">
          <aside className="passkey-ceremony-terminal" aria-label="Passkey ceremony terminal">
            <div className="console-top"><span>ceremony@passkey</span><b>SERVER VERIFY 0</b></div>
            <pre>{ceremony.terminalLines.join("\n")}</pre>
            <div className="passkey-ceremony-counters" aria-label="Passkey ceremony zero mutation counters">
              <span>{ceremony.counters.providerCalls} provider calls</span>
              <span>{ceremony.counters.promptReads} prompt reads</span>
              <span>{ceremony.counters.outputReads} output reads</span>
              <span>{ceremony.counters.usageMutations} usage mutations</span>
              <span>{ceremony.counters.publishWrites} publish writes</span>
            </div>
          </aside>
          <div className="passkey-ceremony-stages" aria-label="Passkey ceremony stages">
            {ceremony.stages.map((stage, index) => (
              <article className={`passkey-ceremony-stage passkey-ceremony-stage--${stage.impact}`} data-impact={stage.impact} style={{ "--i": index, "--meter": `${stage.meter}%` } as CSSProperties} key={stage.id}>
                <div className="passkey-ceremony-stage__top"><span>{stage.impact === "not_usage" ? "NOT USAGE" : stage.call}</span><b>{stage.label}</b><em>{stage.status}</em></div>
                <strong>{stage.value}</strong>
                <code>{stage.command}</code>
                <pre>{stage.terminal.join("\n")}</pre>
                <p>{stage.source} {"->"} {stage.target}</p>
                <div className="passkey-ceremony-stage__meter" aria-label={`${stage.label} ceremony meter ${stage.meter} percent`}><i /></div>
                <small>{stage.guardrail}</small>
              </article>
            ))}
          </div>
        </div>
        <div className="passkey-ceremony-invariants" aria-label="Passkey ceremony invariants">
          {ceremony.invariants.map((invariant) => <span key={invariant}>{invariant}</span>)}
        </div>
      </section>

      <section className="passkey-recovery-relay" aria-label="Passkey recovery relay">
        <div className="passkey-recovery-relay__head">
          <div><span>VTK://PASSKEY-RECOVERY-RELAY//LOCAL-ONLY//NOT-USAGE</span><b>{relay.headline}</b></div>
          <p>{relay.subline}</p>
        </div>
        <div className="passkey-recovery-relay__body">
          <aside className="passkey-recovery-relay__terminal" aria-label="Passkey recovery relay terminal">
            <div className="console-top"><span>recovery@passkey</span><b>{relay.totals.steps} STEPS</b></div>
            <pre>{relay.terminalLines.join("\n")}</pre>
            <div className="passkey-recovery-relay__counters" aria-label="Passkey recovery zero movement counters">
              <span>{relay.totals.providerCalls} provider calls</span>
              <span>{relay.totals.usageMutations} usage mutations</span>
              <span>{relay.totals.publicWrites} public writes</span>
              <span>{relay.totals.notUsage} not usage</span>
              <span>{relay.totals.averageMeter}% proof</span>
            </div>
          </aside>
          <div className="passkey-recovery-steps" aria-label="Passkey recovery drill steps">
            {relay.steps.map((step, index) => (
              <article className={`passkey-recovery-step passkey-recovery-step--${step.impact}`} data-impact={step.impact} style={{ "--i": index, "--meter": `${step.meter}%` } as CSSProperties} key={step.id}>
                <div className="passkey-recovery-step__top"><span>{step.impact === "not_usage" ? "NOT USAGE" : step.call}</span><div><b>{step.label}</b><em>{step.status}</em></div></div>
                <div className="passkey-recovery-step__screen" aria-label={`${step.label} recovery frames`}>
                  {step.frames.map((frame, frameIndex) => <pre style={{ "--frame": frameIndex } as CSSProperties} key={`${step.id}-${frame}`}>{frame}</pre>)}
                </div>
                <strong>{step.value}</strong><p>{step.note}</p><code>{step.command}</code>
                <ul className="passkey-recovery-step__checklist" aria-label={`${step.label} checklist`}>{step.checklist.map((item) => <li key={`${step.id}-${item}`}>{item}</li>)}</ul>
                <footer><span>{step.impact.replace("_", " ")}</span><em aria-label={`${step.label} proof meter ${step.meter} percent`} /></footer>
                <small>{step.guardrail}</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="passkey-proof-console" aria-label="Passkey local-boundary proof console">
        <div className="passkey-proof-console__head"><span>VTK://PASSKEY-PROOF//LOCAL-ONLY//NO-USAGE-MUTATION</span><b>{proof.headline}</b></div>
        <div className="passkey-proof-console__body">
          <aside className="passkey-proof-terminal" aria-label="Passkey proof terminal">
            <div className="console-top"><span>proof@passkey</span><b>{input.state}</b></div>
            <pre>{proof.terminalLines.join("\n")}</pre>
            <div className="passkey-proof-terminal__totals" aria-label="Passkey proof totals">
              <span>{proof.totals.identity} identity</span><span>{proof.totals.localOnly} local-only</span><span>{proof.totals.notUsage} not usage</span><span>{proof.totals.publish} publish</span>
            </div>
          </aside>
          <div className="passkey-proof-rails">
            {proof.rails.map((rail, index) => (
              <article className={`passkey-proof-rail passkey-proof-rail--${rail.impact}`} data-impact={rail.impact} style={{ "--i": index, "--meter": `${rail.meter}%` } as CSSProperties} key={rail.id}>
                <div className="passkey-proof-rail__top"><span>{rail.call}</span><b>{rail.label}</b><em>{rail.impact.replace("_", " ")}</em></div>
                <strong>{rail.value}</strong><pre>{rail.terminal.join("\n")}</pre><p>{rail.note}</p><code>{rail.command}</code>
                <div className="passkey-proof-rail__meter" aria-label={`${rail.label} proof meter ${rail.meter} percent`}><i /></div><small>{rail.guardrail}</small>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
