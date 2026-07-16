import type { CSSProperties } from "react";
import { buildHowToCommandAtlas, type HowToCommandAtlas, type HowToCommandGroupInput } from "../../lib/how-to-command-atlas";
import { buildInstallRunway } from "../../lib/install-runway";
import { buildLaunchSequence } from "../../lib/launch-sequence";
import { cliCommand, cliSequence } from "../../lib/cli-command.ts";
import { HowToFastStart } from "./how-to-fast-start";
import { BrowserBridgeCard } from "./browser-bridge-card";
import "./how-to-fast-start.css";
import "./browser-bridge-card.css";

export const metadata = {
  title: "Install VibeTRACKER · VibeUsage",
  description: "Install the local-first VibeTRACKER usage cockpit, inspect sources, audit proof, and preview every upload before publishing.",
};

const quickCommands = [
  { id: "01", title: "Open the visual wizard", command: cliCommand("init --gui") },
  { id: "02", title: "Show the launch kit", command: cliCommand("impress --open") },
  { id: "03", title: "Try safe demo data", command: cliCommand("sync --demo") },
  { id: "04", title: "Prove the source mix", command: cliCommand("audit") },
  { id: "05", title: "Preview sharing", command: cliCommand("upload --dry-run") },
];

const commandGroups: HowToCommandGroupInput[] = [
  {
    tag: "first-run",
    title: "First run",
    summary: "Open the local GUI, inspect coverage, connect the first provider, and see totals without uploading anything.",
    items: [
      ["Start the visual wizard", cliCommand("init --gui")],
      ["Open the impressive launch kit", cliCommand("impress --open")],
      ["Inspect the launch manifest", cliCommand("vibe --json")],
      ["Inspect coverage", cliCommand("providers --all")],
      ["Try safe demo data", cliCommand("sync --demo")],
      ["Connect a provider", cliCommand("connect openai --set adminKey=sk-...")],
      ["Use provider OAuth when available", cliCommand("oauth start huggingface --auth-url https://provider/oauth/authorize --token-url https://provider/oauth/token --client-id app")],
      ["Sync and view totals", cliSequence(["sync", "total --by provider"])],
      ["Audit proof", cliCommand("audit")],
    ],
  },
  {
    tag: "local-ai",
    title: "Local and creator AI",
    summary: "Track local models, creator subscriptions, voice work, ROI notes, and the AI-life dashboard.",
    items: [
      ["Detect local AI", cliCommand("detect")],
      ["Detect an OpenAI-compatible URL", cliCommand("detect --target http://127.0.0.1:1234")],
      ["Check provider freshness", cliCommand("providers check")],
      ["Forecast spend", cliCommand("insights --budget 200")],
      ["Amortize subscriptions", cliCommand("subscription add canva --usd 15 --from 2026-07-01 --to 2026-07-31 --profile creator")],
      ["Track voice work", cliCommand("add elevenlabs --characters 12000 --operation voice_clone --category audio")],
      ["Add ROI notes", cliCommand("roi add --from 2026-07-01 --to 2026-07-05 --note \"finished client video pack\" --value-usd 1200")],
      ["Open the AI-life dashboard", cliCommand("life")],
    ],
  },
  {
    tag: "public-board",
    title: "Public surfaces",
    summary: "Use the web pages as proof boards while trust labels stay visible.",
    items: [
      ["Provider status board", "/providers"],
      ["Contributor badges", "/contributors"],
      ["Accepted roadmap", `${cliCommand("roadmap")} -> /roadmap`],
      ["Passkey account proof", "/passkeys"],
    ],
  },
  {
    tag: "open-source",
    title: "Open-source extension",
    summary: "Scaffold adapters, generate fixtures, inspect plugins, and capture browser or desktop activity.",
    items: [
      ["Start a custom adapter", cliCommand("adapter scaffold my-provider --dry-run")],
      ["Redact a provider fixture", cliCommand("fixture redact raw.json --out packages/adapters/src/my-provider/__fixtures__/usage.sample.json")],
      ["Inspect plugin manifests", cliCommand("plugins path")],
      ["Capture browser activity", `${cliCommand("api serve --port 8765")}, then load packages/browser-extension`],
      ["Snapshot desktop tools", cliCommand("desktop scan --record")],
    ],
  },
  {
    tag: "privacy",
    title: "Privacy, signing, export",
    summary: "Preview every upload, add noise, sign bundles, seal ledgers, and keep storage encrypted.",
    items: [
      ["Review privacy boundaries", cliCommand("privacy")],
      ["Preview sharing", cliCommand("upload --dry-run")],
      ["Share noisy aggregates", cliCommand("export --private --epsilon 1")],
      ["Sign and verify a bundle", cliSequence(["bundle sign", "bundle verify ~/.vibetracker/signed-upload-bundle.json"])],
      ["Sign a CLI release", cliCommand("release sign --file dist/vibetracker.js")],
      ["Seal the local ledger", cliSequence(["ledger seal", "ledger verify"])],
      ["Use encrypted local storage", `VT_STORE_PASSPHRASE=... ${cliCommand("sync")}`],
      ["Preview opt-in telemetry", cliSequence(["telemetry preview", "telemetry opt-in"])],
      ["Export for Obsidian or Notion", cliCommand("export --format markdown --out ~/vibetracker.md")],
      ["Export for data lakes", cliCommand("export --format parquet --out ~/vibetracker.parquet")],
      ["Share to the self-reported board", cliCommand("upload --handle you")],
    ],
  },
];

function impactLabel(value: string): string {
  return value.replace(/_/g, " ").toUpperCase();
}

function HowToCommandAtlasPanel({ atlas }: { atlas: HowToCommandAtlas }) {
  return (
    <section className="howto-command-atlas" aria-label="VibeTRACKER command atlas and scanner surprise map">
      <div className="howto-command-atlas__head">
        <span>VTK://COMMAND-ATLAS//SCANNER-SURPRISES//OSS-CREDIT</span>
        <b>{atlas.headline}</b>
      </div>
      <div className="howto-command-atlas__body">
        <aside className="howto-command-atlas__terminal" aria-label="Command atlas terminal">
          <div className="console-top"><span>atlas@vibetracker</span><b>{atlas.totals.commands} COMMANDS</b></div>
          <pre>{atlas.terminalLines.join("\n")}</pre>
          <div className="howto-command-atlas__ticker" aria-label="Command atlas ticker">
            {atlas.ticker.map((line) => <span key={line}>{line}</span>)}
          </div>
          <div className="howto-command-atlas__credits" aria-label="ASCII motion attribution">
            {atlas.credits.map((credit) => <span key={credit}>{credit}</span>)}
          </div>
        </aside>

        <div className="howto-command-atlas__main">
          <div className="howto-command-atlas__copy">
            <span>{atlas.subline}</span>
            <div className="howto-command-atlas__totals" aria-label="Command atlas totals">
              <b>{atlas.totals.usage} usage</b>
              <b>{atlas.totals.localOnly} local-only</b>
              <b>{atlas.totals.privacy} privacy</b>
              <b>{atlas.totals.notUsage} not usage</b>
              <b>{atlas.totals.publish} publish</b>
            </div>
          </div>

          <div className="howto-command-atlas__launch-board" aria-label="First-run launch board">
            {atlas.launchBoard.map((step, index) => (
              <article
                className={`howto-launch-board-step howto-launch-board-step--${step.impact}`}
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
                <div className="howto-launch-board-step__screen" aria-hidden="true">
                  {step.frames.map((frame, frameIndex) => (
                    <pre style={{ "--f": frameIndex } as CSSProperties} key={`${step.id}-${frameIndex}`}>{frame}</pre>
                  ))}
                </div>
                <div className="howto-launch-board-step__copy">
                  <span>{step.status}</span>
                  <b>{step.label}</b>
                  <code>{step.command}</code>
                  <pre>{step.terminalLine}</pre>
                  <p>{step.result}</p>
                  <small>{step.guardrail}</small>
                </div>
                <div className="howto-launch-board-step__meter" aria-label={`${step.label} confidence ${step.meter} percent`}>
                  <i />
                </div>
              </article>
            ))}
          </div>

          <div className="howto-command-atlas__lanes" aria-label="Command atlas lanes">
            {atlas.lanes.map((lane, index) => (
              <article
                className={`howto-command-lane howto-command-lane--${lane.impact}`}
                data-impact={lane.impact}
                style={{
                  "--i": index,
                  "--meter": `${lane.meter}%`,
                  "--brand-from": lane.from,
                  "--brand-to": lane.to,
                  "--brand-ink": lane.ink,
                } as CSSProperties}
                key={lane.id}
              >
                <div className="howto-command-lane__top">
                  <i>{lane.mark}</i>
                  <span>{impactLabel(lane.impact)}</span>
                </div>
                <b>{lane.label}</b>
                <p>{lane.summary}</p>
                <code>{lane.primaryCommand}</code>
                <div className="howto-command-lane__preview" aria-label={`${lane.label} command preview`}>
                  {lane.items.slice(0, 4).map((item) => (
                    <span
                      style={{
                        "--brand-from": item.from,
                        "--brand-to": item.to,
                        "--brand-ink": item.ink,
                      } as CSSProperties}
                      data-impact={item.impact}
                      key={item.id}
                    >
                      <i>{item.mark}</i>
                      <em>{impactLabel(item.impact)}</em>
                    </span>
                  ))}
                </div>
                <div className="howto-command-lane__meter" aria-label={`${lane.label} readiness ${lane.meter} percent`}>
                  <i />
                </div>
                <footer>
                  <span>{lane.commandCount} commands</span>
                  <strong>{lane.items.filter((item) => item.impact === "not_usage").length} not usage</strong>
                </footer>
              </article>
            ))}
          </div>

          <div className="howto-command-atlas__surprises" aria-label="Scanner surprise replay queue">
            {atlas.surprises.map((surprise, index) => (
              <article
                className={`howto-command-surprise howto-command-surprise--${surprise.impact}`}
                style={{
                  "--i": index,
                  "--meter": `${surprise.meter}%`,
                  "--delay": `${surprise.delayMs}ms`,
                  "--brand-from": surprise.marks[0]?.from,
                  "--brand-to": surprise.marks[0]?.to,
                  "--brand-ink": surprise.marks[0]?.ink,
                } as CSSProperties}
                key={surprise.id}
              >
                <div className="howto-command-surprise__screen" aria-hidden="true">
                  {surprise.frames.map((frame, frameIndex) => (
                    <pre style={{ "--f": frameIndex } as CSSProperties} key={`${surprise.id}-${frameIndex}`}>
                      {frame}
                    </pre>
                  ))}
                </div>
                <div className="howto-command-surprise__copy">
                  <span>{surprise.status}</span>
                  <b>{surprise.label}</b>
                  <code>{surprise.command}</code>
                  <p>{surprise.caption}</p>
                  <small>{surprise.guardrail}</small>
                </div>
                <footer>
                  <span>{surprise.trigger}</span>
                  <strong>{surprise.source}</strong>
                </footer>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HowTo() {
  const installRunway = buildInstallRunway();
  const launchSequence = buildLaunchSequence();
  const commandAtlas = buildHowToCommandAtlas(commandGroups);

  return (
    <>
      <HowToFastStart commands={quickCommands} />

      <BrowserBridgeCard startCommand={cliCommand("start")} />

      <details className="howto-manual">
        <summary>
          <span>Advanced operator manual</span>
          <b>Open 37 commands, five lanes, setup choreography, and proof rails</b>
          <i aria-hidden="true" />
        </summary>
        <div className="howto-manual__body">

      <section className="install-runway" aria-label="First-run install runway">
        <div className="install-runway__head">
          <span>VTK://INSTALL-RUNWAY//ASCII-TO-GUI//C0VIBE</span>
          <b>{installRunway.headline}</b>
        </div>
        <div className="install-runway__body">
          <aside className="install-runway-terminal" aria-label="Install runway terminal">
            <div className="console-top"><span>install@vibetracker</span><b>{installRunway.totals.tracks} TRACKS</b></div>
            <pre>{installRunway.terminalLines.join("\n")}</pre>
            <div className="install-runway-terminal__totals" aria-label="Install runway totals">
              <span>{installRunway.totals.localFirst} local-first</span>
              <span>{installRunway.totals.notUsage} not-usage guards</span>
              <span>{installRunway.totals.publishGates} publish gates</span>
              <span>{installRunway.totals.visualOnly} visual-only handoffs</span>
              <span>{installRunway.totals.usageWrites} usage writes</span>
            </div>
            <div className="install-runway-handoff" aria-label="Terminal to GUI handoff tape">
              {installRunway.handoff.map((step, index) => (
                <article
                  className={`install-runway-handoff__step install-runway-handoff__step--${step.impact}`}
                  data-impact={step.impact}
                  style={{ "--i": index, "--meter": `${step.meter}%` } as CSSProperties}
                  key={step.id}
                >
                  <div>
                    <span>{step.key}</span>
                    <b>{step.label}</b>
                    <em>{step.status}</em>
                  </div>
                  <div className="install-runway-handoff__frames" aria-hidden="true">
                    {step.frames.map((frame, frameIndex) => (
                      <i style={{ "--i": frameIndex } as CSSProperties} key={`${step.id}-${frame}`}>{frame}</i>
                    ))}
                  </div>
                  <code>{step.command}</code>
                  <pre>{step.terminal.join("\n")}</pre>
                  <strong>{step.visualOnly ? "visual only" : "writes data"} / {step.usageWrites ? "usage write" : "zero writes"}</strong>
                </article>
              ))}
            </div>
          </aside>
          <div className="install-runway-tracks">
            {installRunway.tracks.map((track, index) => (
              <article
                className={`install-runway-track install-runway-track--${track.impact}`}
                data-impact={track.impact}
                style={{ "--i": index, "--meter": `${track.meter}%` } as CSSProperties}
                key={track.id}
              >
                <div className="install-runway-track__top">
                  <span>{track.call}</span>
                  <b>{track.label}</b>
                  <em>{track.impact}</em>
                </div>
                <div className="install-runway-track__frames" aria-label={`${track.label} animation frames`}>
                  {track.frames.map((frame, frameIndex) => (
                    <i style={{ "--i": frameIndex } as CSSProperties} key={`${track.id}-${frame}`}>{frame}</i>
                  ))}
                </div>
                <pre>{track.terminal.join("\n")}</pre>
                <p>{track.note}</p>
                <code>{track.command}</code>
                <div className="install-runway-track__meter" aria-label={`${track.label} readiness ${track.meter} percent`}>
                  <i />
                </div>
                <strong>{track.guardrail}</strong>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="wizard-choreography" aria-label="Terminal-to-GUI wizard choreography">
        <div className="wizard-choreography__head">
          <span>VTK://WIZARD-CHOREOGRAPHY//TERMINAL-IN-GUI//VIBERS-UNITE</span>
          <b>ASCII FIRST / GUI QUALITY</b>
        </div>
        <div className="wizard-choreography__grid">
          {launchSequence.map((step, index) => (
            <article className={`wizard-step wizard-step--${step.status}`} style={{ "--i": index } as CSSProperties} key={step.id}>
              <div className="wizard-step__top">
                <span>{step.call}</span>
                <b>{step.title}</b>
                <em>{step.status}</em>
              </div>
              <code>{step.command}</code>
              <p>{step.note}</p>
              <pre>{step.terminal.map((line) => `> ${line}`).join("\n")}</pre>
            </article>
          ))}
        </div>
      </section>

      <HowToCommandAtlasPanel atlas={commandAtlas} />

      <section className="launch-rack" aria-label="Launch command groups">
        {commandGroups.map((group) => (
          <article key={group.tag} className="launch-group">
            <header>
              <span>{group.tag}</span>
              <h2>{group.title}</h2>
              <p>{group.summary}</p>
            </header>
            <ol className="command-sequence command-sequence-panel">
              {group.items.map(([label, command]) => (
                <li key={label}>
                  <b>{label}</b>
                  <code>{command}</code>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </section>
        </div>
      </details>

      <section className="privacy-callout">
        <b>Nothing leaves your machine until upload.</b>
        <p>
          Uploads are <strong>self-reported</strong> and shown separately from Verified backend-fetched
          entries. GitHub activity and similar evidence are trust signals only: labelled <strong>not usage</strong>,
          excluded from spend totals, and attached separately.
        </p>
      </section>
    </>
  );
}
