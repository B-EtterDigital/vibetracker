"use client";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { supabaseBrowser } from "../../lib/supabase-browser";
import {
  buildDeviceApprovalChamber,
  buildDeviceAuthControlRoom,
  buildDeviceApprovalRunway,
  buildDeviceAuthBridge,
  buildDeviceAuthLaunchTheatre,
  deviceAuthStatusLabel,
  splitDeviceCode,
  type DeviceApprovalChamber,
  type DeviceAuthControlRoom,
  type DeviceApprovalRunway,
} from "../../lib/device-auth";
import { buildDeviceCommandBridge, type DeviceCommandBridge } from "../../lib/device-command-bridge";
import { CliLoginEntry } from "./cli-login-entry";
import "./cli-login-entry.css";

function DeviceApprovalRunwayPanel({ runway }: { runway: DeviceApprovalRunway }) {
  return (
    <section className="device-approval-runway" aria-label="CLI approval zero-upload runway">
      <div className="device-approval-runway__head">
        <span>VTK://DEVICE-APPROVAL-RUNWAY//IDENTITY-NOT-USAGE</span>
        <b>{runway.codeLabel}</b>
      </div>
      <div className="device-approval-runway__body">
        <aside className="device-approval-runway__terminal" aria-label="Approval runway terminal readout">
          <div className="console-top"><span>approval@vibetracker</span><b>ZERO MOVEMENT</b></div>
          <pre>{runway.terminalLines.join("\n")}</pre>
          <div className="device-approval-runway__counters" aria-label="Approval runway counters">
            <span>{runway.counters.providerCalls} provider calls</span>
            <span>{runway.counters.hiddenUploads} hidden uploads</span>
            <span>{runway.counters.usageUploads} usage uploads</span>
            <span>{runway.counters.ledgerWrites} ledger writes</span>
          </div>
          <div className="device-approval-runway__surprises" aria-label="Approval runway ASCII surprises">
            {runway.surprises.map((surprise, index) => (
              <article
                style={{
                  "--i": index,
                  "--brand-from": surprise.from,
                  "--brand-to": surprise.to,
                  "--brand-ink": surprise.ink,
                } as CSSProperties}
                key={surprise.id}
              >
                <span>{surprise.mark}</span>
                <div>
                  {surprise.frames.map((frame, frameIndex) => (
                    <pre style={{ "--frame": frameIndex } as CSSProperties} key={`${surprise.id}-${frameIndex}`}>{frame}</pre>
                  ))}
                </div>
                <b>{surprise.label}</b>
                <small>{surprise.status}</small>
              </article>
            ))}
          </div>
        </aside>
        <div className="device-approval-runway__main">
          <div className="device-approval-runway__copy">
            <h2>{runway.headline}</h2>
            <p>{runway.subline}</p>
          </div>
          <div className="device-approval-runway__totals" aria-label="Approval runway signal totals">
            <span>{runway.totals.identity} identity</span>
            <span>{runway.totals.not_usage} not usage</span>
            <span>{runway.totals.privacy} privacy</span>
            <span>{runway.totals.local_only} local-only</span>
            <span>{runway.totals.publish} publish</span>
          </div>
          <div className="device-approval-runway__flight-tape" aria-label="Approval flight tape">
            {runway.flightTape.map((step, index) => (
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
                <div className="device-approval-tape__screen" aria-hidden="true">
                  {step.frames.map((frame, frameIndex) => (
                    <pre style={{ "--frame": frameIndex } as CSSProperties} key={`${step.id}-${frameIndex}`}>{frame}</pre>
                  ))}
                  <i>{step.mark}</i>
                </div>
                <div className="device-approval-tape__copy">
                  <span>{step.impact === "not_usage" ? "NOT USAGE" : step.impact.replace("_", " ")}</span>
                  <b>{step.label}</b>
                  <strong>{step.status}</strong>
                  <code>{step.command}</code>
                  <pre>{step.terminalLine}</pre>
                  <p>{step.readout}</p>
                  <small>{step.guardrail}</small>
                </div>
              </article>
            ))}
          </div>
          <div className="device-approval-runway__rails">
            {runway.rails.map((rail, index) => (
              <article
                data-impact={rail.impact}
                style={{
                  "--i": index,
                  "--meter": `${rail.meter}%`,
                  "--brand-from": rail.from,
                  "--brand-to": rail.to,
                  "--brand-ink": rail.ink,
                } as CSSProperties}
                key={rail.id}
              >
                <div className="device-approval-rail__screen" aria-hidden="true">
                  {rail.frames.map((frame, frameIndex) => (
                    <pre style={{ "--frame": frameIndex } as CSSProperties} key={`${rail.id}-${frameIndex}`}>{frame}</pre>
                  ))}
                  <i>{rail.mark}</i>
                </div>
                <div className="device-approval-rail__copy">
                  <div>
                    <span>{rail.phase}</span>
                    <b>{rail.label}</b>
                    <em>{rail.impact.replace("_", " ")}</em>
                  </div>
                  <strong>{rail.status}</strong>
                  <code>{rail.command}</code>
                  <p>{rail.note}</p>
                  <ul aria-label={`${rail.label} approval transcript`}>
                    {rail.transcript.map((line) => <li key={line}>{line}</li>)}
                  </ul>
                  <div className="device-approval-rail__meter" aria-label={`${rail.label} readiness ${rail.meter} percent`}>
                    <i />
                  </div>
                  <small>{rail.guardrail}</small>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DeviceCommandBridgePanel({ bridge }: { bridge: DeviceCommandBridge }) {
  return (
    <section className="device-command-bridge" aria-label="First-run terminal command bridge">
      <div className="device-command-bridge__head">
        <span>VTK://FIRST-RUN-COMMAND-BRIDGE//TERMINAL-CONTROLS-UPLOAD</span>
        <b>{bridge.codeLabel}</b>
      </div>
      <div className="device-command-bridge__body">
        <aside className="device-command-bridge__terminal" aria-label="First-run command bridge terminal">
          <div className="console-top"><span>commands@vibetracker</span><b>NO AUTO-UPLOAD</b></div>
          <pre>{bridge.terminalLines.join("\n")}</pre>
          <div className="device-command-bridge__ticker" aria-label="First-run command ticker">
            {bridge.ticker.map((item, index) => <span style={{ "--i": index } as CSSProperties} key={item}>{item}</span>)}
          </div>
        </aside>
        <div className="device-command-bridge__main">
          <div className="device-command-bridge__copy">
            <h2>{bridge.headline}</h2>
            <p>{bridge.subline}</p>
          </div>
          <div className="device-command-bridge__totals" aria-label="First-run command signal totals">
            <span>{bridge.totals.identity} identity</span>
            <span>{bridge.totals.not_usage} not usage</span>
            <span>{bridge.totals.local_only} local-only</span>
            <span>{bridge.totals.privacy} privacy</span>
            <span>{bridge.totals.publish} publish</span>
          </div>
          <div className="device-command-bridge__steps">
            {bridge.commands.map((command, index) => (
              <article
                data-impact={command.impact}
                style={{
                  "--i": index,
                  "--meter": `${command.meter}%`,
                  "--brand-from": command.from,
                  "--brand-to": command.to,
                  "--brand-ink": command.ink,
                } as CSSProperties}
                key={command.id}
              >
                <div className="device-command-step__screen" aria-hidden="true">
                  {command.frames.map((frame, frameIndex) => (
                    <pre style={{ "--frame": frameIndex } as CSSProperties} key={`${command.id}-${frameIndex}`}>{frame}</pre>
                  ))}
                  <i>{command.mark}</i>
                </div>
                <div className="device-command-step__copy">
                  <span>{command.impact === "not_usage" ? "NOT USAGE" : command.impact === "local_only" ? "LOCAL ONLY" : command.impact.toUpperCase()}</span>
                  <b>{command.label}</b>
                  <strong>{command.status}</strong>
                  <code>{command.command}</code>
                  <p>{command.note}</p>
                  <small>{command.surprise}</small>
                  <em aria-label={`${command.label} command readiness ${command.meter} percent`} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DeviceApprovalChamberPanel({ chamber }: { chamber: DeviceApprovalChamber }) {
  return (
    <section className="device-approval-chamber" aria-label="CLI approval zero-usage state chamber">
      <div className="device-approval-chamber__head">
        <div>
          <span>VTK://APPROVAL-CHAMBER//CLI-AUTH//ZERO-USAGE-MOVE</span>
          <b>{chamber.headline}</b>
        </div>
        <p>{chamber.subline}</p>
      </div>
      <div className="device-approval-chamber__body">
        <aside className="device-approval-chamber__terminal" aria-label="Approval chamber terminal">
          <div className="console-top"><span>chamber@cli-auth</span><b>{chamber.codeLabel}</b></div>
          <pre>{chamber.terminalLines.join("\n")}</pre>
          <div className="device-approval-chamber__counters" aria-label="Approval chamber zero movement counters">
            <span>{chamber.counters.providerCalls} provider calls</span>
            <span>{chamber.counters.promptReads} prompt reads</span>
            <span>{chamber.counters.outputReads} output reads</span>
            <span>{chamber.counters.hiddenUploads} hidden uploads</span>
            <span>{chamber.counters.usageUploads} usage uploads</span>
            <span>{chamber.counters.ledgerWrites} ledger writes</span>
          </div>
        </aside>
        <div className="device-approval-chamber__stages" aria-label="Approval chamber state stages">
          {chamber.stages.map((stage, index) => (
            <article
              data-impact={stage.impact}
              style={{
                "--i": index,
                "--meter": `${stage.meter}%`,
                "--brand-from": stage.from,
                "--brand-to": stage.to,
                "--brand-ink": stage.ink,
              } as CSSProperties}
              key={stage.id}
            >
              <div className="device-approval-chamber-stage__top">
                <i>{stage.mark}</i>
                <span>{stage.impact === "not_usage" ? "NOT USAGE" : stage.impact === "local_only" ? "LOCAL ONLY" : stage.impact.toUpperCase()}</span>
              </div>
              <div className="device-approval-chamber-stage__screen" aria-hidden="true">
                {stage.frames.map((frame, frameIndex) => (
                  <pre style={{ "--frame": frameIndex } as CSSProperties} key={`${stage.id}-${frameIndex}`}>{frame}</pre>
                ))}
              </div>
              <b>{stage.label}</b>
              <strong>{stage.value}</strong>
              <code>{stage.command}</code>
              <p>{stage.note}</p>
              <small>{stage.guardrail}</small>
              <ul aria-label={`${stage.label} approval chamber transcript`}>
                {stage.transcript.map((line) => <li key={`${stage.id}-${line}`}>{line}</li>)}
              </ul>
              <em aria-label={`${stage.label} chamber meter ${stage.meter} percent`} />
            </article>
          ))}
        </div>
      </div>
      <div className="device-approval-chamber__totals" aria-label="Approval chamber labelled totals">
        <span>{chamber.totals.identity} identity</span>
        <span>{chamber.totals.not_usage} not usage</span>
        <span>{chamber.totals.local_only} local-only</span>
        <span>{chamber.totals.privacy} privacy</span>
        <span>{chamber.totals.publish} publish</span>
      </div>
    </section>
  );
}

function DeviceAuthControlRoomPanel({ room }: { room: DeviceAuthControlRoom }) {
  return (
    <section className="device-auth-control-room" aria-label="CLI auth zero-movement control room">
      <div className="device-auth-control-room__head">
        <div>
          <span>VTK://CLI-AUTH-CONTROL//IDENTITY-ONLY//ZERO-USAGE-MOVEMENT</span>
          <b>{room.headline}</b>
        </div>
        <p>{room.subline}</p>
      </div>
      <div className="device-auth-control-room__body">
        <aside className="device-auth-control-terminal" aria-label="CLI auth control terminal">
          <div className="console-top"><span>control@cli-auth</span><b>{room.codeLabel}</b></div>
          <pre>{room.terminalLines.join("\n")}</pre>
          <div className="device-auth-control-counters" aria-label="CLI auth zero movement counters">
            <span>{room.counters.providerCalls} provider calls</span>
            <span>{room.counters.promptReads} prompt reads</span>
            <span>{room.counters.outputReads} output reads</span>
            <span>{room.counters.usageUploads} usage uploads</span>
            <span>{room.counters.ledgerWrites} ledger writes</span>
          </div>
        </aside>
        <div className="device-auth-control-signals" aria-label="CLI auth control signals">
          {room.signals.map((signal, index) => (
            <article
              data-impact={signal.impact}
              style={{
                "--i": index,
                "--meter": `${signal.meter}%`,
                "--brand-from": signal.from,
                "--brand-to": signal.to,
                "--brand-ink": signal.ink,
              } as CSSProperties}
              key={signal.id}
            >
              <div className="device-auth-control-signal__top">
                <span>{signal.impact === "not_usage" ? "NOT USAGE" : signal.impact.replace("_", " ")}</span>
                <b>{signal.label}</b>
                <em>{signal.status}</em>
              </div>
              <strong>{signal.value}</strong>
              <code>{signal.command}</code>
              <pre>{signal.terminal.join("\n")}</pre>
              <p>{signal.source} {"->"} {signal.target}</p>
              <div className="device-auth-control-signal__meter" aria-label={`${signal.label} control meter ${signal.meter} percent`}>
                <i />
              </div>
              <small>{signal.guardrail}</small>
            </article>
          ))}
        </div>
      </div>
      <div className="device-auth-control-invariants" aria-label="CLI auth control invariants">
        {room.invariants.map((invariant) => <span key={invariant}>{invariant}</span>)}
      </div>
    </section>
  );
}

// Browser fallback for machines without an existing `gh auth` session. The fast path verifies
// GitHub in the terminal and never opens this page; this path binds the token to WorkOS instead.
export default function CliLogin() {
  const [code, setCode] = useState("");
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const u = new URL(window.location.href);
    setCode((u.searchParams.get("code") ?? "").toUpperCase());
    setReady(true);
  }, []);

  async function approve() {
    setState("working");
    const { data } = await supabaseBrowser().auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setState("error");
      setMsg("You're not signed in. Sign into C0VIBE, then reopen this link.");
      return;
    }
    const res = await fetch("/api/cli/approve", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ user_code: code }),
    });
    if (res.ok) { setState("done"); setMsg("Device approved — return to your terminal."); }
    else { setState("error"); setMsg(((await res.json()) as { error?: string }).error ?? "approval failed"); }
  }

  if (!ready || !code) return <CliLoginEntry checking={!ready} />;

  const statusLabel = deviceAuthStatusLabel(state);
  const codeParts = splitDeviceCode(code);
  const authBridge = buildDeviceAuthBridge(state, code);
  const controlRoom = buildDeviceAuthControlRoom(state, code);
  const approvalChamber = buildDeviceApprovalChamber(state, code);
  const launchTheatre = buildDeviceAuthLaunchTheatre(state, code);
  const commandBridge = buildDeviceCommandBridge(state, code);
  const approvalRunway = buildDeviceApprovalRunway(state, code);

  return (
    <>
      <section className="device-hero">
        <div className="device-copy">
          <p className="eyebrow">C0VIBE device flow</p>
          <h1>Authorize the CLI</h1>
          <p>VibeTRACKER first reuses an existing GitHub CLI session. If none is available, match this code and approve with C0VIBE.</p>
          <div className="motto-rail" aria-label="C0VIBE motto">
            <span>Vibers Unite</span>
            <a href="https://c0vibe.app">c0vibe.app</a>
          </div>
        </div>

        <div className="device-terminal" aria-label="CLI login terminal">
          <div className="console-top"><span>auth@vibetracker</span><b>{statusLabel}</b></div>
          <pre>{[
            "+--------------------------------------------+",
            "| VTRK://CLI-AUTH//C0VIBE-SESSION            |",
            "|--------------------------------------------|",
            "| terminal shows  user_code                  |",
            "| browser checks  C0VIBE session             |",
            "| server issues   attested CLI token         |",
            "| usage records   still local until upload   |",
            "+--------------------------------------------+",
          ].join("\n")}</pre>
        </div>
      </section>

      <section className="device-approval-shell" aria-label="Approve VibeTRACKER CLI device">
        <div className="device-code-panel">
          <span>Terminal code</span>
          <code>{code || "NO-CODE"}</code>
          <div className="device-code-slots" aria-label="Terminal code chunks">
            {codeParts.map((part, index) => <i key={`${part}-${index}`}>{part}</i>)}
          </div>
          <p>Confirm this exact code is visible in your terminal before approving.</p>
        </div>

        <div className={`device-status device-status-${state}`} aria-live="polite">
          <span>{statusLabel}</span>
          <b>{state === "done" ? msg : state === "error" ? msg : code ? "Ready to approve this terminal session." : "Open this link from `npx vibetrack login` to load a code."}</b>
          <small>GitHub or C0VIBE proves identity only. Approval never uploads local records or marks uploaded usage provider-verified.</small>
        </div>

        <button type="button" onClick={approve} disabled={!code || state === "working" || state === "done"} className="device-approve-button">
          <span>{state === "working" ? "Approving..." : state === "done" ? "Approved" : "Approve this device"}</span>
          <i aria-hidden="true">OK</i>
        </button>
      </section>

      <DeviceApprovalChamberPanel chamber={approvalChamber} />

      <DeviceAuthControlRoomPanel room={controlRoom} />

      <DeviceApprovalRunwayPanel runway={approvalRunway} />

      <DeviceCommandBridgePanel bridge={commandBridge} />

      <section className="device-launch-theatre" aria-label="Terminal to GUI launch theatre">
        <div className="device-launch-theatre__head">
          <span>VTK://CLI-GUI-LAUNCH//DEVICE-AUTH//NO-USAGE-UPLOAD</span>
          <b>{launchTheatre.headline}</b>
        </div>
        <div className="device-launch-theatre__body">
          <aside className="device-launch-theatre__terminal" aria-label="CLI GUI launch terminal">
            <div className="console-top"><span>launch@vibetracker</span><b>{launchTheatre.steps.length} BEATS</b></div>
            <pre>{launchTheatre.terminalLines.join("\n")}</pre>
            <div className="device-launch-theatre__totals" aria-label="Launch theatre signal totals">
              <span>{launchTheatre.totals.identity} identity</span>
              <span>{launchTheatre.totals.not_usage} not usage</span>
              <span>{launchTheatre.totals.local_only} local-only</span>
              <span>{launchTheatre.totals.publish} publish rail</span>
            </div>
          </aside>
          <div className="device-launch-theatre__steps">
            {launchTheatre.steps.map((step, index) => (
              <article
                className={`device-launch-step device-launch-step--${step.impact}`}
                data-impact={step.impact}
                style={{ "--i": index, "--meter": `${step.meter}%` } as CSSProperties}
                key={step.id}
              >
                <div className="device-launch-step__screen" aria-hidden="true">
                  {step.frames.map((frame, frameIndex) => (
                    <pre style={{ "--frame": frameIndex } as CSSProperties} key={`${step.id}-${frameIndex}`}>{frame}</pre>
                  ))}
                  <span>{step.call}</span>
                </div>
                <div className="device-launch-step__copy">
                  <div>
                    <span>{step.phase}</span>
                    <b>{step.label}</b>
                    <em>{step.impact.replace("_", " ")}</em>
                  </div>
                  <p>{step.note}</p>
                  <code>{step.command}</code>
                  <ul aria-label={`${step.label} launch transcript`}>
                    {step.transcript.map((line) => <li key={line}>{line}</li>)}
                  </ul>
                  <div className="device-launch-step__meter" aria-label={`${step.label} readiness ${step.meter} percent`}>
                    <i />
                  </div>
                  <strong>{step.guardrail}</strong>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="device-auth-bridge" aria-label="C0VIBE CLI authorization bridge">
        <div className="device-auth-bridge__head">
          <span>VTK://CLI-AUTH-BRIDGE//C0VIBE-SESSION//LOCAL-LEDGER</span>
          <b>IDENTITY ONLY / NOT USAGE</b>
        </div>
        <div className="device-auth-bridge__grid">
          {authBridge.map((step, index) => (
            <article className={`device-auth-step device-auth-step--${step.status}`} style={{ "--i": index } as CSSProperties} key={step.id}>
              <span>{step.call}</span>
              <b>{step.label}</b>
              <p>{step.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="device-proof-grid" aria-label="CLI authorization boundaries">
        <div><b>GitHub-first</b><span>An existing `gh auth` session verifies in the terminal and skips this page.</span></div>
        <div><b>Session-bound</b><span>Approval requires the signed-in C0VIBE browser session.</span></div>
        <div><b>Token once</b><span>The CLI polls for the issued token and the server marks it claimed.</span></div>
        <div><b>Local-first</b><span>Usage records remain on disk until an explicit upload command.</span></div>
      </section>
    </>
  );
}
