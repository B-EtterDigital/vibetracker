import type { CSSProperties } from "react";
import { buildInstallRunway, type InstallRunway } from "../../lib/install-runway";
import {
  buildLaunchCapsule,
  buildLaunchSequence,
  buildScanCommandRunway,
  buildWizardFlightRecorder,
  type LaunchCapsule,
  type LaunchSequenceStep,
  type ScanCommandRunway,
  type WizardFlightRecorder,
} from "../../lib/launch-sequence";

export const metadata = {
  title: "VibeUsage First Run Wizard",
  description: "A terminal-to-GUI onboarding cockpit for VibeTRACKER install, source scan, safe sync, dry-run review, and C0VIBE publish.",
};

function labelForImpact(impact: string): string {
  if (impact === "local" || impact === "local_only") return "LOCAL ONLY";
  if (impact === "trust") return "NOT USAGE";
  if (impact === "privacy") return "PRIVACY";
  if (impact === "publish") return "PUBLISH";
  if (impact === "creator") return "CREATOR";
  if (impact === "install") return "INSTALL";
  return "USAGE";
}

function operatorImpactFor(step: LaunchSequenceStep): "local_only" | "privacy" | "usage" | "publish" {
  if (step.status === "local") return "local_only";
  if (step.status === "consent") return "privacy";
  if (step.status === "dry-run") return "publish";
  return "usage";
}

function operatorFramesFor(step: LaunchSequenceStep): string[] {
  if (step.id === "gui") return ["VTK\nCLI\nGUI", "TERM\n ->\nGUI", "LOCAL\nONLY\nBOOT"];
  if (step.id === "connect") return ["KEYS\nMASK\nOK", "MCP\nOAUTH\nLABEL", "SOURCE\nTRUST\nSPLIT"];
  if (step.id === "collect") return ["SCAN\nHF CX\nLOCAL", "LEDGER\nLOCAL\nWRITE", "RAILS\nCHECK\nOK"];
  return ["DRY\nRUN\nFIRST", "C0VIBE\nREVIEW\nONLY", "VIBERS\nUNITE\nAPP"];
}

function operatorChecksFor(step: LaunchSequenceStep): string[] {
  if (step.id === "gui") return ["inline terminal", "local GUI", "provider calls 0"];
  if (step.id === "connect") return ["secret mask", "source labels", "trust split"];
  if (step.id === "collect") return ["branded scan", "local ledger", "audit rails"];
  return ["dry-run review", "0 hidden uploads", "explicit publish"];
}

const WIZARD_PREFLIGHT_SEALS = [
  "providerCalls=0",
  "ledgerWrites=0",
  "hiddenUpload=0",
  "promptReads=0",
  "outputReads=0",
] as const;

function wizardPreflightBars(meter: number, index: number): number[] {
  return Array.from({ length: 8 }, (_, barIndex) => {
    const pulse = ((barIndex + 3) * (index + 5) * 11) % 40;
    return Math.max(16, Math.min(100, Math.round(meter * 0.58 + pulse)));
  });
}

function WizardPreflightStrip({
  runway,
  sequence,
  scanRunway,
  recorder,
  capsule,
}: {
  runway: InstallRunway;
  sequence: LaunchSequenceStep[];
  scanRunway: ScanCommandRunway;
  recorder: WizardFlightRecorder;
  capsule: LaunchCapsule;
}) {
  const channels = [
    {
      id: "terminal",
      label: "Terminal opens",
      impact: "local_only",
      value: `${sequence.length} commands`,
      detail: "ASCII command path stays visible inside the GUI.",
      mark: "VT",
      from: "#36e39b",
      to: "#2ee8d6",
      ink: "#071013",
      meter: 96,
    },
    {
      id: "sources",
      label: "Sources label",
      impact: "usage",
      value: `${runway.totals.tracks} tracks`,
      detail: "Hosted, creator, local, manual, trust, and publish rails are named before scan.",
      mark: "SRC",
      from: "#ff4fd8",
      to: "#ffc64d",
      ink: "#140812",
      meter: 92,
    },
    {
      id: "trust",
      label: "Trust quarantines",
      impact: "trust",
      value: "NOT USAGE",
      detail: "GitHub, Codex, and MCP evidence cannot boost score, spend, heatgrid, or rank.",
      mark: "+0",
      from: "#ffc64d",
      to: "#39d353",
      ink: "#071013",
      meter: 100,
    },
    {
      id: "privacy",
      label: "Dry-run locks",
      impact: "privacy",
      value: `${recorder.totals.sideEffects} side effects`,
      detail: "Prompt reads, output reads, provider calls, hidden uploads, and publish writes stay zero.",
      mark: "RG",
      from: "#9f7cff",
      to: "#ff7768",
      ink: "#ffffff",
      meter: 100,
    },
    {
      id: "relay",
      label: "C0VIBE waits",
      impact: "publish",
      value: `${capsule.lanes.length} relay lanes`,
      detail: "Profile, score, heatgrid, and public relay wake only after reviewed aggregate upload.",
      mark: "C0",
      from: "#2ee8d6",
      to: "#ffc64d",
      ink: "#071013",
      meter: 97,
    },
  ];

  return (
    <div className="wizard-preflight-strip" aria-label="First-run wizard preflight strip">
      <div className="wizard-preflight-strip__head">
        <span>VTK://WIZARD-PREFLIGHT//TERMINAL-GUI//ZERO-SIDE-EFFECTS</span>
        <b>preflight contract</b>
        <em>Vibers Unite</em>
      </div>
      <div className="wizard-preflight-strip__body">
        <div className="wizard-preflight-strip__terminal" aria-label="Wizard preflight terminal counters">
          <div className="console-top"><span>preflight@wizard</span><b>C0VIBE.APP</b></div>
          <pre>{[
            "$ vibetracker init --gui --preflight",
            `tracks=${runway.totals.tracks} commands=${sequence.length} relay=${capsule.lanes.length}`,
            `providerCalls=${scanRunway.totals.providerCalls} ledgerWrites=${scanRunway.totals.ledgerWrites} hiddenUpload=${scanRunway.totals.hiddenUpload}`,
            `promptReads=${recorder.counters.promptReads} outputReads=${recorder.counters.outputReads} publishWrites=${recorder.counters.publishWrites}`,
            "terminal -> sources -> trust +0 -> dry-run -> c0vibe review",
          ].join("\n")}</pre>
        </div>
        <div className="wizard-preflight-channels" aria-label="Wizard preflight launch rails">
          {channels.map((channel, index) => (
            <article
              className={`wizard-preflight-channel wizard-preflight-channel--${channel.impact}`}
              data-impact={labelForImpact(channel.impact)}
              style={{
                "--i": index,
                "--meter": `${channel.meter}%`,
                "--brand-from": channel.from,
                "--brand-to": channel.to,
                "--brand-ink": channel.ink,
              } as CSSProperties}
              key={channel.id}
            >
              <div className="wizard-preflight-channel__top">
                <i>{channel.mark}</i>
                <span>{labelForImpact(channel.impact)}</span>
              </div>
              <div className="wizard-preflight-channel__bars" aria-hidden="true">
                {wizardPreflightBars(channel.meter, index).map((bar, barIndex) => (
                  <i
                    style={{ "--bar": `${bar}%`, "--b": barIndex } as CSSProperties}
                    key={`${channel.id}-${barIndex}`}
                  />
                ))}
              </div>
              <b>{channel.label}</b>
              <strong>{channel.value}</strong>
              <small>{channel.detail}</small>
            </article>
          ))}
        </div>
      </div>
      <div className="wizard-preflight-strip__seals" aria-label="Wizard preflight zero side-effect seals">
        {WIZARD_PREFLIGHT_SEALS.map((seal) => (
          <span key={seal}>{seal}</span>
        ))}
      </div>
    </div>
  );
}

function WizardCommandBridgePanel({
  sequence,
  scanRunway,
  recorder,
  capsule,
}: {
  sequence: LaunchSequenceStep[];
  scanRunway: ScanCommandRunway;
  recorder: WizardFlightRecorder;
  capsule: LaunchCapsule;
}) {
  const bridgeLines = [
    "VTK://FIRST-RUN-WIZARD//COMMAND-BRIDGE//VIBERS-UNITE",
    "$ npx vibetracker init --gui",
    "[00] ascii terminal stays alive inside the GUI",
    "[01] source cards light up before any usage row",
    "[02] trust rails are labelled NOT USAGE",
    "[03] prompt/output/secret reads remain 0",
    "[04] C0VIBE profile + score + heatgrid wait for review",
    `counters: providerCalls=${scanRunway.totals.providerCalls} hiddenUpload=${scanRunway.totals.hiddenUpload} sideEffects=${recorder.totals.sideEffects}`,
    "motto: Vibers Unite // C0vibe.app",
  ];
  const bridgeStats = [
    { label: "commands", value: sequence.length, detail: "terminal to GUI" },
    { label: "scan phases", value: scanRunway.totals.steps, detail: "visual first" },
    { label: "hidden upload", value: scanRunway.totals.hiddenUpload, detail: "must be zero" },
    { label: "relay lanes", value: capsule.lanes.length, detail: "review gated" },
  ];
  const bridgeStages = [
    {
      id: "ignite",
      call: "00",
      label: "Terminal ignite",
      impact: "local_only",
      command: sequence[0]?.command ?? "npx vibetracker init --gui",
      value: "command visible",
      note: "The wizard opens like a terminal tool, then the GUI wraps it without hiding the command path.",
      from: "#36e39b",
      to: "#2ee8d6",
      ink: "#071013",
      meter: 96,
      frames: ["$ vt\ninit\n--gui", "TERM\nLIVE\nGUI", "LOCAL\nONLY\n0 CALLS"],
    },
    {
      id: "providers",
      call: "01",
      label: "Provider theatre",
      impact: "usage",
      command: "vibetracker detect --all --preview",
      value: `${scanRunway.totals.visualOnly} preview beats`,
      note: "Higgsfield, local AI, creator tools, regional providers, and manual ledgers animate as labels first.",
      from: "#ff4fd8",
      to: "#7c5cff",
      ink: "#ffffff",
      meter: 92,
      frames: ["HF\nCX\nLOCAL", "CN\nEU\nOSS", "LABELS\nBEFORE\nROWS"],
    },
    {
      id: "proof",
      call: "02",
      label: "Proof rails",
      impact: "privacy",
      command: "vibetracker upload --dry-run",
      value: `${recorder.totals.sideEffects} side effects`,
      note: "The first minute repeats the privacy proof: no prompt reads, no output reads, no hidden uploads.",
      from: "#ffc64d",
      to: "#36e39b",
      ink: "#071013",
      meter: 100,
      frames: ["PROMPT\nREADS\n0", "OUTPUT\nREADS\n0", "HIDDEN\nUPLOAD\n0"],
    },
    {
      id: "relay",
      call: "03",
      label: "C0VIBE relay",
      impact: "publish",
      command: "vibetracker upload --review",
      value: "review first",
      note: "Profile, Vibe Score, and heatgrid feed from the reviewed aggregate stream only.",
      from: "#2ee8d6",
      to: "#ffc64d",
      ink: "#071013",
      meter: 97,
      frames: ["C0VIBE\nAPP", "VIBE\nSCORE\nWAIT", "VIBERS\nUNITE\nOK"],
    },
  ];

  return (
    <section className="wizard-command-bridge" aria-label="First-run wizard command bridge">
      <div className="wizard-command-bridge__head">
        <div>
          <span>VTK://FIRST-RUN-WIZARD//COMMAND-BRIDGE//VIBERS-UNITE</span>
          <b>first minute command bridge</b>
        </div>
        <p>The terminal stays in the product surface while provider theatre, privacy proof, trust labels, and the C0VIBE review gate wake up in sequence.</p>
      </div>
      <div className="wizard-command-bridge__body">
        <aside className="wizard-command-bridge__terminal" aria-label="Command bridge terminal">
          <div className="console-top"><span>bridge@wizard</span><b>NO HIDDEN UPLOAD</b></div>
          <pre>{bridgeLines.join("\n")}</pre>
          <div className="wizard-command-bridge__stats" aria-label="Command bridge safety stats">
            {bridgeStats.map((stat) => (
              <span key={stat.label}>
                <b>{stat.value}</b>
                <em>{stat.label}</em>
                <small>{stat.detail}</small>
              </span>
            ))}
          </div>
        </aside>
        <div className="wizard-command-bridge__stages" aria-label="Command bridge staged handoff">
          {bridgeStages.map((stage, index) => (
            <article
              className={`wizard-command-stage wizard-command-stage--${stage.impact}`}
              data-impact={labelForImpact(stage.impact)}
              style={{
                "--i": index,
                "--meter": `${stage.meter}%`,
                "--tone": stage.from,
                "--tone-2": stage.to,
                "--brand-ink": stage.ink,
              } as CSSProperties}
              key={stage.id}
            >
              <div className="wizard-command-stage__top">
                <span>{stage.call}</span>
                <b>{stage.label}</b>
                <i>{labelForImpact(stage.impact)}</i>
              </div>
              <div className="wizard-command-stage__screen" aria-hidden="true">
                {stage.frames.map((frame, frameIndex) => (
                  <pre style={{ "--f": frameIndex } as CSSProperties} key={`${stage.id}-${frameIndex}`}>
                    {frame}
                  </pre>
                ))}
              </div>
              <strong>{stage.value}</strong>
              <code>{stage.command}</code>
              <p>{stage.note}</p>
              <footer aria-label={`${stage.label} bridge readiness ${stage.meter} percent`}>
                <i />
                <small>{stage.meter}%</small>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function WizardLiveTerminalViewportPanel({
  sequence,
  scanRunway,
  recorder,
  capsule,
}: {
  sequence: LaunchSequenceStep[];
  scanRunway: ScanCommandRunway;
  recorder: WizardFlightRecorder;
  capsule: LaunchCapsule;
}) {
  const terminalLines = [
    "VTK://FIRST-RUN-WIZARD//LIVE-TERMINAL-VIEWPORT//ASCII-TO-GUI",
    "$ npx vibetracker init --gui",
    "spawn terminal pane -> mount GUI shell -> keep command visible",
    "source labels: hosted creator local trust manual publish",
    `safety: providerCalls=${scanRunway.totals.providerCalls} ledgerWrites=${scanRunway.totals.ledgerWrites} hiddenUpload=${scanRunway.totals.hiddenUpload}`,
    `privacy: promptReads=${recorder.counters.promptReads} outputReads=${recorder.counters.outputReads} publishWrites=${recorder.counters.publishWrites}`,
    "trust: MCP/GitHub/Codex != usage // score waits for aggregate rows",
    `relay: ${capsule.lanes.length} C0VIBE lanes // profile + score + heatgrid after review`,
    "Vibers Unite // C0vibe.app",
  ];
  const panes = [
    {
      id: "terminal",
      call: "00",
      label: "ASCII terminal",
      impact: "local_only",
      value: "command visible",
      command: sequence[0]?.command ?? "npx vibetracker init --gui",
      note: "The first thing the user sees is the real command path, not a marketing screen.",
      meter: 96,
      frames: ["$ vt\ninit\n--gui", "TERM\nLIVE\nGUI", "LOCAL\nONLY\nBOOT"],
    },
    {
      id: "sources",
      call: "01",
      label: "Source runway",
      impact: "usage",
      value: `${scanRunway.totals.steps} scan phases`,
      command: "vibetracker detect --all",
      note: "Providers, creator tools, local AI, and manual ledgers get labels before any record counts.",
      meter: 90,
      frames: ["HF CX\nLOCAL\nLEDGER", "LABEL\nFIRST\nSCAN", "USAGE\nAFTER\nROWS"],
    },
    {
      id: "trust",
      call: "02",
      label: "Trust quarantine",
      impact: "trust",
      value: "NOT USAGE",
      command: "vibetracker trust collect",
      note: "GitHub, Codex, and MCP connection evidence can display, but never boost spend or score.",
      meter: 100,
      frames: ["TRUST\nSIDE\nRAIL", "+0\nSCORE\nLOCK", "NOT\nUSAGE\nOK"],
    },
    {
      id: "privacy",
      call: "03",
      label: "Dry-run proof",
      impact: "privacy",
      value: `${recorder.totals.sideEffects} side effects`,
      command: "vibetracker upload --dry-run",
      note: "Prompt bodies, outputs, secrets, hidden uploads, and publish writes remain zero in first-run preview.",
      meter: 100,
      frames: ["DRY\nRUN\nFIRST", "HIDDEN\nUPLOAD\n0", "PROMPT\nREADS\n0"],
    },
    {
      id: "publish",
      call: "04",
      label: "C0VIBE review",
      impact: "publish",
      value: `${capsule.lanes.length} relay lanes`,
      command: "vibetracker upload --review",
      note: "Profile, Vibe Score, heatgrid, and public relay wake up only after reviewed aggregate upload.",
      meter: 96,
      frames: ["C0VIBE\nREVIEW\nGATE", "SCORE\nHEAT\nPROFILE", "VIBERS\nUNITE\nAPP"],
    },
  ];

  return (
    <section className="wizard-live-viewport" aria-label="First-run live terminal viewport">
      <div className="wizard-live-viewport__head">
        <div>
          <span>VTK://FIRST-RUN-WIZARD//LIVE-TERMINAL-VIEWPORT//ASCII-TO-GUI</span>
          <b>live terminal viewport</b>
        </div>
        <p>The opening bridge: ASCII terminal on the left, GUI command surface on the right, with every safety rail labelled before collection starts.</p>
      </div>
      <div className="wizard-live-viewport__body">
        <aside className="wizard-live-viewport__terminal" aria-label="Live terminal viewport transcript">
          <div className="console-top"><span>live@wizard</span><b>ASCII TO GUI</b></div>
          <pre>{terminalLines.join("\n")}</pre>
          <div className="wizard-live-viewport__status" aria-label="Live terminal viewport side-effect counters">
            <span>{scanRunway.totals.providerCalls} provider calls</span>
            <span>{scanRunway.totals.ledgerWrites} ledger writes</span>
            <span>{scanRunway.totals.hiddenUpload} hidden uploads</span>
            <span>{recorder.counters.promptReads} prompt reads</span>
            <span>{recorder.counters.outputReads} output reads</span>
            <span>{recorder.counters.publishWrites} publish writes</span>
          </div>
        </aside>
        <div className="wizard-live-viewport__panes" aria-label="Live terminal to GUI panes">
          {panes.map((pane, index) => (
            <article
              className={`wizard-live-pane wizard-live-pane--${pane.impact}`}
              data-impact={labelForImpact(pane.impact)}
              style={{ "--i": index, "--meter": `${pane.meter}%` } as CSSProperties}
              key={pane.id}
            >
              <div className="wizard-live-pane__top">
                <span>{pane.call}</span>
                <b>{pane.label}</b>
                <i>{labelForImpact(pane.impact)}</i>
              </div>
              <div className="wizard-live-pane__screen" aria-hidden="true">
                {pane.frames.map((frame, frameIndex) => (
                  <pre style={{ "--f": frameIndex } as CSSProperties} key={`${pane.id}-${frameIndex}`}>
                    {frame}
                  </pre>
                ))}
              </div>
              <strong>{pane.value}</strong>
              <code>{pane.command}</code>
              <p>{pane.note}</p>
              <footer aria-label={`${pane.label} live viewport confidence ${pane.meter} percent`}>
                <em />
                <small>{pane.meter}%</small>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function WizardOperatorDeckPanel({
  sequence,
  scanRunway,
}: {
  sequence: LaunchSequenceStep[];
  scanRunway: ScanCommandRunway;
}) {
  const terminalLines = [
    "VTK://WIZARD-OPERATOR-DECK//FIRST-MINUTE//TERMINAL-IN-GUI",
    "$ npx vibetracker init --gui",
    "[00] boot inline terminal -> local GUI",
    "[01] connect consented sources -> labels before scan",
    "[02] preview scan runway -> visualOnly=true",
    "[03] dry-run review -> 0 hidden uploads",
    "[04] C0VIBE relay -> explicit publish only",
    "motto: Vibers Unite // c0vibe.app",
  ];

  return (
    <section className="wizard-operator-deck" aria-label="First-run wizard operator deck">
      <div className="wizard-operator-deck__head">
        <div>
          <span>VTK://FIRST-RUN-WIZARD//OPERATOR-DECK//TERMINAL-IN-GUI</span>
          <b>first minute command deck</b>
        </div>
        <p>One glance shows the command path, the inline terminal, the safe scan preview, and the C0VIBE review gate.</p>
      </div>
      <div className="wizard-operator-deck__body">
        <aside className="wizard-operator-deck__terminal" aria-label="First-run wizard command terminal">
          <div className="console-top"><span>operator@wizard</span><b>NO HIDDEN UPLOAD</b></div>
          <pre>{terminalLines.join("\n")}</pre>
          <div className="wizard-operator-deck__totals" aria-label="Wizard operator safety totals">
            <span>{sequence.length} commands</span>
            <span>{scanRunway.totals.visualOnly} visual only</span>
            <span>{scanRunway.totals.providerCalls} provider calls</span>
            <span>{scanRunway.totals.ledgerWrites} ledger writes</span>
            <span>{scanRunway.totals.hiddenUpload} hidden uploads</span>
          </div>
        </aside>
        <div className="wizard-operator-actions" aria-label="First-run wizard command actions">
          {sequence.map((step, index) => {
            const impact = operatorImpactFor(step);
            return (
              <article
                className={`wizard-operator-action wizard-operator-action--${impact}`}
                data-impact={labelForImpact(impact)}
                style={{ "--i": index, "--meter": `${82 + index * 4}%` } as CSSProperties}
                key={step.id}
              >
                <div className="wizard-operator-action__top">
                  <span>{step.call}</span>
                  <b>{step.title}</b>
                  <i>{labelForImpact(impact)}</i>
                </div>
                <div className="wizard-operator-action__screen" aria-hidden="true">
                  {operatorFramesFor(step).map((frame, frameIndex) => (
                    <pre style={{ "--f": frameIndex } as CSSProperties} key={`${step.id}-${frameIndex}`}>
                      {frame}
                    </pre>
                  ))}
                </div>
                <code>{step.command}</code>
                <p>{step.note}</p>
                <div className="wizard-operator-action__checks" aria-label={`${step.title} first-run checks`}>
                  {operatorChecksFor(step).map((check) => (
                    <em key={`${step.id}-${check}`}>{check}</em>
                  ))}
                </div>
                <pre className="wizard-operator-action__terminal" aria-label={`${step.title} terminal preview`}>
                  {step.terminal.join("\n")}
                </pre>
                <footer aria-label={`${step.title} first-run confidence`}>
                  <i />
                  <small>{82 + index * 4}%</small>
                </footer>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function WizardSignalCockpitPanel({
  sequence,
  scanRunway,
  recorder,
  capsule,
}: {
  sequence: LaunchSequenceStep[];
  scanRunway: ScanCommandRunway;
  recorder: WizardFlightRecorder;
  capsule: LaunchCapsule;
}) {
  const terminalLines = [
    "VTK://WIZARD-SIGNAL-COCKPIT//ASCII-GUI//VIBERS-UNITE",
    "$ vibetracker init --gui --signal-cockpit",
    `[00] ${sequence[0]?.command ?? "npx vibetracker init --gui"} -> terminal stays visible`,
    "[01] Higgsfield MCP -> authenticated source label before usage",
    "[02] local AI sonar -> Ollama / LM Studio / ComfyUI stay local",
    "[03] Codex cube -> trust signal // NOT USAGE // no spend boost",
    "[04] C0VIBE relay -> profile + vibe score + heatgrid after review",
    `totals: providerCalls=${scanRunway.totals.providerCalls} ledgerWrites=${scanRunway.totals.ledgerWrites} hiddenUpload=${scanRunway.totals.hiddenUpload}`,
    `flightRecorder.sideEffects=${recorder.totals.sideEffects} // launchLanes=${capsule.lanes.length}`,
    "motto: Vibers Unite // C0vibe.app",
  ];

  const stats = [
    { label: "commands", value: sequence.length, note: "CLI + GUI" },
    { label: "visual beats", value: scanRunway.totals.visualOnly, note: "preview only" },
    { label: "hidden uploads", value: scanRunway.totals.hiddenUpload, note: "must stay zero" },
    { label: "side effects", value: recorder.totals.sideEffects, note: "first minute" },
  ];

  const stages = [
    {
      id: "terminal",
      call: "00",
      label: "ASCII handoff",
      impact: "local_only",
      command: sequence[0]?.command ?? "npx vibetracker init --gui",
      note: "The CLI charm is embedded in the GUI so the user sees the real command path first.",
      meter: 94,
      from: "#2ee8d6",
      to: "#36e39b",
      ink: "#071013",
      frames: ["$ vt\ninit\n--gui", "TERM\n ->\n GUI", "LOCAL\nONLY\nBOOT"],
      checks: ["terminal visible", "local GUI", "provider calls 0"],
    },
    {
      id: "higgsfield",
      call: "01",
      label: "Higgsfield prism",
      impact: "usage",
      command: "vibetracker connect higgsfield",
      note: "The authenticated MCP becomes a separate provider source before any usage row is accepted.",
      meter: 88,
      from: "#ff4fd8",
      to: "#7c5cff",
      ink: "#ffffff",
      frames: [" /\\ \n-HF-\n \\/ ", " ◢◣ \n HF \n ◥◤ ", " ◤◥ \n-HF-\n ◣◢ "],
      checks: ["MCP auth", "source label", "usage only after rows"],
    },
    {
      id: "local-ai",
      call: "02",
      label: "Local AI sonar",
      impact: "local_only",
      command: "vibetracker detect --local",
      note: "Ollama, LM Studio, ComfyUI, InvokeAI, vLLM, and loopback proxy traces pulse without leaving the machine.",
      meter: 95,
      from: "#36e39b",
      to: "#2ee8d6",
      ink: "#071013",
      frames: [" .  \n<LM>\n .  ", " :::\n127\n :::", "LOCAL\nMODEL\nOK"],
      checks: ["loopback scan", "cloud savings", "local-only label"],
    },
    {
      id: "codex",
      call: "03",
      label: "Codex trust cube",
      impact: "trust",
      command: "vibetracker trust collect --codex",
      note: "Codex, GitHub, packages, and creator cadence can strengthen the profile, but never change usage totals.",
      meter: 100,
      from: "#24292f",
      to: "#39d353",
      ink: "#ffffff",
      frames: ["CX░\nGH▒\n≠$$", "GH▒\nCX▓\n≠$$", "TRUST\nNOT\nUSE"],
      checks: ["NOT USAGE", "trust rail", "spend unchanged"],
    },
    {
      id: "c0vibe",
      call: "04",
      label: "C0VIBE relay",
      impact: "publish",
      command: "vibetracker upload --dry-run",
      note: "The profile, vibe score, and heatgrid feed from reviewed aggregates only after the user approves upload.",
      meter: 96,
      from: "#2ee8d6",
      to: "#ffc64d",
      ink: "#071013",
      frames: ["C0V\nIBE\nAPP", "VIB\nERS\nUNI", "REVIEW\nTHEN\nPUBLISH"],
      checks: ["dry-run first", "aggregate only", "Vibers Unite"],
    },
  ];

  return (
    <section className="wizard-signal-cockpit" aria-label="First-run wizard signal cockpit">
      <div className="wizard-signal-cockpit__head">
        <div>
          <span>VTK://FIRST-RUN-WIZARD//SIGNAL-COCKPIT//NO-HIDDEN-UPLOAD</span>
          <b>terminal-in-GUI signal cockpit</b>
        </div>
        <p>
          A first-screen command theatre for the wizard: ASCII boot, provider source labels, local AI sonar, trust rails,
          and the reviewed C0VIBE handoff all in one view.
        </p>
      </div>
      <div className="wizard-signal-cockpit__body">
        <aside className="wizard-signal-cockpit__terminal" aria-label="Signal cockpit terminal">
          <div className="console-top"><span>cockpit@wizard</span><b>PREVIEW ONLY</b></div>
          <pre>{terminalLines.join("\n")}</pre>
          <div className="wizard-signal-cockpit__stats" aria-label="Signal cockpit side-effect counters">
            {stats.map((stat) => (
              <span key={stat.label}>
                <b>{stat.value}</b>
                <em>{stat.label}</em>
                <small>{stat.note}</small>
              </span>
            ))}
          </div>
        </aside>
        <div className="wizard-signal-cockpit__stages" aria-label="Signal cockpit staged provider feedback">
          {stages.map((stage, index) => (
            <article
              className={`wizard-signal-stage wizard-signal-stage--${stage.impact}`}
              data-impact={labelForImpact(stage.impact)}
              style={{
                "--i": index,
                "--meter": `${stage.meter}%`,
                "--tone": stage.from,
                "--tone-2": stage.to,
                "--brand-ink": stage.ink,
              } as CSSProperties}
              key={stage.id}
            >
              <div className="wizard-signal-stage__top">
                <span>{stage.call}</span>
                <b>{stage.label}</b>
                <i>{labelForImpact(stage.impact)}</i>
              </div>
              <div className="wizard-signal-stage__screen" aria-hidden="true">
                {stage.frames.map((frame, frameIndex) => (
                  <pre style={{ "--f": frameIndex } as CSSProperties} key={`${stage.id}-${frameIndex}`}>
                    {frame}
                  </pre>
                ))}
              </div>
              <code>{stage.command}</code>
              <p>{stage.note}</p>
              <div className="wizard-signal-stage__checks" aria-label={`${stage.label} cockpit checks`}>
                {stage.checks.map((check) => (
                  <em key={`${stage.id}-${check}`}>{check}</em>
                ))}
              </div>
              <footer aria-label={`${stage.label} cockpit readiness ${stage.meter} percent`}>
                <i />
                <small>{stage.meter}%</small>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function WizardLaunchReceiptPanel({
  runway,
  sequence,
  scanRunway,
  recorder,
  capsule,
}: {
  runway: InstallRunway;
  sequence: LaunchSequenceStep[];
  scanRunway: ScanCommandRunway;
  recorder: WizardFlightRecorder;
  capsule: LaunchCapsule;
}) {
  const rows = [
    {
      id: "boot",
      call: "00",
      label: "ASCII terminal boots",
      value: `${sequence.length} steps`,
      impact: "LOCAL ONLY",
      command: "npx vibetracker init --gui",
      note: "The first command stays visible while the GUI takes over.",
      check: "providerCalls=0",
      meter: 96,
    },
    {
      id: "sources",
      call: "01",
      label: "Source labels lock",
      value: `${runway.totals.tracks} tracks`,
      impact: "USAGE",
      command: "vibetracker detect --all",
      note: "Hosted, creator, local, manual, trust, and publish lanes are named before scan.",
      check: "detected is not counted",
      meter: 90,
    },
    {
      id: "surprises",
      call: "02",
      label: "Provider theatre runs",
      value: `${scanRunway.totals.visualOnly} visual`,
      impact: "VISUAL ONLY",
      command: "vibetracker scan --dry-run",
      note: "Higgsfield, Codex, local AI, regional sources, and C0VIBE can animate without writing usage.",
      check: "ledgerWrites=0",
      meter: 94,
    },
    {
      id: "proof",
      call: "03",
      label: "Privacy proof repeats",
      value: `${recorder.totals.sideEffects} side effects`,
      impact: "PRIVACY",
      command: "vibetracker upload --dry-run",
      note: "Raw prompts, outputs, secrets, and hidden uploads stay out of the first-run receipt.",
      check: "hiddenUpload=0",
      meter: 100,
    },
    {
      id: "relay",
      call: "04",
      label: "C0VIBE waits",
      value: `${capsule.lanes.length} relay lanes`,
      impact: "PUBLISH",
      command: "vibetracker upload --review",
      note: "Profile, vibe score, heatgrid, and public relay move only after reviewed aggregate upload.",
      check: "Vibers Unite",
      meter: 96,
    },
  ];
  const terminalLines = [
    "VTK://WIZARD-LAUNCH-RECEIPT//FIRST-RUN//NO-HIDDEN-SIDE-EFFECTS",
    "$ vibetracker init --gui --receipt",
    `tracks=${runway.totals.tracks} steps=${sequence.length} visualOnly=${scanRunway.totals.visualOnly}`,
    `providerCalls=${scanRunway.totals.providerCalls} ledgerWrites=${scanRunway.totals.ledgerWrites} hiddenUpload=${scanRunway.totals.hiddenUpload}`,
    `promptReads=${recorder.counters.promptReads} outputReads=${recorder.counters.outputReads} publishWrites=${recorder.counters.publishWrites}`,
    "trust signals stay NOT USAGE // score waits for reviewed aggregates",
    "profile + vibe score + heatgrid feed from the same reviewed datastream",
    "Vibers Unite // C0vibe.app",
  ];

  return (
    <section className="wizard-launch-receipt" aria-label="First-run wizard launch receipt">
      <div className="wizard-launch-receipt__head">
        <div>
          <span>VTK://FIRST-RUN-WIZARD//LAUNCH-RECEIPT//NO-HIDDEN-SIDE-EFFECTS</span>
          <b>launch receipt</b>
        </div>
        <p>Immediate proof for the first run: command path, source labels, visual-only scan theatre, privacy counters, and the C0VIBE review gate.</p>
      </div>
      <div className="wizard-launch-receipt__body">
        <aside className="wizard-launch-receipt__terminal" aria-label="Wizard launch receipt terminal">
          <div className="console-top"><span>receipt@wizard</span><b>SIDE EFFECTS {recorder.totals.sideEffects}</b></div>
          <pre>{terminalLines.join("\n")}</pre>
          <div className="wizard-launch-receipt__seals" aria-label="Wizard launch receipt safety seals">
            <span>{scanRunway.totals.providerCalls} provider calls</span>
            <span>{scanRunway.totals.ledgerWrites} ledger writes</span>
            <span>{scanRunway.totals.hiddenUpload} hidden uploads</span>
            <span>{recorder.counters.promptReads} prompt reads</span>
            <span>{recorder.counters.outputReads} output reads</span>
            <span>{recorder.counters.publishWrites} publish writes</span>
          </div>
        </aside>
        <div className="wizard-launch-receipt__rows" aria-label="Wizard launch receipt rows">
          {rows.map((row, index) => (
            <article
              className={`wizard-launch-receipt-row wizard-launch-receipt-row--${row.id}`}
              data-impact={row.impact}
              style={{ "--i": index, "--meter": `${row.meter}%` } as CSSProperties}
              key={row.id}
            >
              <div className="wizard-launch-receipt-row__top">
                <span>{row.call}</span>
                <b>{row.label}</b>
                <i>{row.impact}</i>
              </div>
              <strong>{row.value}</strong>
              <code>{row.command}</code>
              <p>{row.note}</p>
              <small>{row.check}</small>
              <footer aria-label={`${row.label} launch receipt confidence ${row.meter} percent`}>
                <em />
                <small>{row.meter}%</small>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function WizardFlightRecorderPanel({ recorder }: { recorder: WizardFlightRecorder }) {
  return (
    <section className="wizard-flight-recorder" aria-label="First-minute wizard flight recorder">
      <div className="wizard-flight-recorder__head">
        <div>
          <span>VTK://FIRST-RUN-WIZARD//FLIGHT-RECORDER//CLI-TO-GUI</span>
          <b>{recorder.headline}</b>
        </div>
        <p>{recorder.subline}</p>
      </div>
      <div className="wizard-flight-recorder__body">
        <aside className="wizard-flight-recorder__terminal" aria-label="Wizard flight recorder terminal">
          <div className="console-top"><span>recorder@wizard</span><b>SIDE EFFECTS {recorder.totals.sideEffects}</b></div>
          <pre>{recorder.terminalLines.join("\n")}</pre>
          <div className="wizard-flight-recorder__counters" aria-label="Wizard flight recorder zero side-effect counters">
            <span>{recorder.counters.providerCalls} provider calls</span>
            <span>{recorder.counters.ledgerWrites} ledger writes</span>
            <span>{recorder.counters.hiddenUpload} hidden uploads</span>
            <span>{recorder.counters.promptReads} prompt reads</span>
            <span>{recorder.counters.outputReads} output reads</span>
            <span>{recorder.counters.publishWrites} publish writes</span>
          </div>
        </aside>
        <div className="wizard-flight-events" aria-label="First-minute wizard events">
          {recorder.events.map((event, index) => (
            <article
              className={`wizard-flight-event wizard-flight-event--${event.impact}`}
              data-impact={labelForImpact(event.impact)}
              style={{
                "--i": index,
                "--meter": `${event.meter}%`,
                "--brand-from": event.from,
                "--brand-to": event.to,
                "--brand-ink": event.ink,
              } as CSSProperties}
              key={event.id}
            >
              <div className="wizard-flight-event__top">
                <span>{event.second}</span>
                <b>{event.label}</b>
                <i>{labelForImpact(event.impact)}</i>
              </div>
              <div className="wizard-flight-event__screen" aria-hidden="true">
                {event.frames.map((frame, frameIndex) => (
                  <pre style={{ "--f": frameIndex } as CSSProperties} key={`${event.id}-${frameIndex}`}>
                    {frame}
                  </pre>
                ))}
              </div>
              <strong>{event.value}</strong>
              <code>{event.command}</code>
              <p>{event.note}</p>
              <div className="wizard-flight-event__checks" aria-label={`${event.label} consent checks`}>
                {event.checks.map((check) => (
                  <em key={`${event.id}-${check}`}>{check}</em>
                ))}
              </div>
              <footer aria-label={`${event.label} flight recorder confidence ${event.meter} percent`}>
                <i />
                <small>{event.guardrail}</small>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function InstallRunwayPanel({ runway }: { runway: InstallRunway }) {
  return (
    <section className="wizard-route-runway install-runway" aria-label="VibeTRACKER first-run install runway">
      <div className="install-runway__head">
        <span>VTK://FIRST-RUN-WIZARD//INSTALL-RUNWAY//TERMINAL-TO-GUI</span>
        <b>{runway.headline}</b>
      </div>
      <div className="install-runway__body">
        <aside className="install-runway-terminal" aria-label="First-run wizard terminal">
          <div className="console-top"><span>wizard@local</span><b>TERMINAL FIRST</b></div>
          <pre>{runway.terminalLines.join("\n")}</pre>
          <div className="install-runway-terminal__totals" aria-label="Install runway safety totals">
            <span>{runway.totals.tracks} tracks</span>
            <span>{runway.totals.handoffSteps} handoffs</span>
            <span>{runway.totals.localFirst} local first</span>
            <span>{runway.totals.notUsage} not usage</span>
            <span>{runway.totals.publishGates} publish gates</span>
            <span>{runway.totals.visualOnly} visual only</span>
            <span>{runway.totals.usageWrites} usage writes</span>
          </div>
          <div className="install-runway-handoff" aria-label="Terminal to GUI handoff">
            {runway.handoff.map((step, index) => (
              <article
                className={`install-runway-handoff__step install-runway-handoff__step--${step.impact}`}
                data-impact={labelForImpact(step.impact)}
                style={{ "--i": index, "--meter": `${step.meter}%` } as CSSProperties}
                key={step.id}
              >
                <div>
                  <span>{step.key}</span>
                  <b>{step.label}</b>
                  <em>{step.status}</em>
                </div>
                <div className="install-runway-handoff__frames" aria-hidden="true">
                  {step.frames.map((frame) => (
                    <i key={`${step.id}-${frame}`}>{frame}</i>
                  ))}
                </div>
                <code>{step.command}</code>
                <pre>{step.terminal.join("\n")}</pre>
                <strong>calls={String(step.providerCalls)} writes={String(step.usageWrites)}</strong>
              </article>
            ))}
          </div>
        </aside>
        <div className="install-runway-tracks" aria-label="First-run wizard tracks">
          {runway.tracks.map((track, index) => (
            <article
              className={`install-runway-track install-runway-track--${track.impact}`}
              style={{ "--i": index, "--meter": `${track.meter}%` } as CSSProperties}
              key={track.id}
            >
              <div className="install-runway-track__top">
                <span>{track.call}</span>
                <b>{track.label}</b>
                <em>{labelForImpact(track.impact)}</em>
              </div>
              <div className="install-runway-track__frames" aria-hidden="true">
                {track.frames.map((frame) => (
                  <i key={`${track.id}-${frame}`}>{frame}</i>
                ))}
              </div>
              <pre>{track.terminal.join("\n")}</pre>
              <code>{track.command}</code>
              <p>{track.note}</p>
              <strong>{track.guardrail}</strong>
              <div className="install-runway-track__meter" aria-label={`${track.label} install runway readiness ${track.meter} percent`}>
                <i />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function LaunchCapsulePanel({ capsule }: { capsule: LaunchCapsule }) {
  return (
    <section className="wizard-route-capsule launch-capsule" aria-label="First-run wizard launch capsule">
      <div className="launch-capsule__head">
        <span>VTK://FIRST-RUN-WIZARD//LAUNCH-CAPSULE//VIBERS-UNITE</span>
        <b>{capsule.headline}</b>
      </div>
      <div className="launch-capsule__body">
        <aside className="launch-capsule__terminal" aria-label="Launch capsule terminal">
          <div className="console-top"><span>capsule@wizard</span><b>ASCII + GUI</b></div>
          <pre>{capsule.terminalLines.join("\n")}</pre>
          <p>{capsule.subline}</p>
        </aside>
        <div className="launch-capsule__lanes" aria-label="Launch capsule lanes">
          {capsule.lanes.map((lane, index) => (
            <article
              className={`launch-capsule-lane launch-capsule-lane--${lane.impact}`}
              style={{
                "--i": index,
                "--meter": `${lane.meter}%`,
                "--brand-from": lane.from,
                "--brand-to": lane.to,
                "--brand-ink": lane.ink,
              } as CSSProperties}
              key={lane.id}
            >
              <div className="launch-capsule-lane__top">
                <i>{lane.mark}</i>
                <div>
                  <span>{labelForImpact(lane.impact)}</span>
                  <b>{lane.label}</b>
                </div>
              </div>
              <pre aria-hidden="true">{lane.ascii.join("\n")}</pre>
              <strong>{lane.value}</strong>
              <code>{lane.command}</code>
              <p>{lane.note}</p>
              <footer aria-label={`${lane.label} launch readiness ${lane.meter} percent`}>
                <em />
                <small>{lane.meter}%</small>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function WizardChoreographyPanel({ steps }: { steps: LaunchSequenceStep[] }) {
  return (
    <section className="wizard-route-steps wizard-choreography" aria-label="Terminal to GUI wizard choreography">
      <div className="wizard-choreography__head">
        <span>VTK://FIRST-RUN-WIZARD//CHOREOGRAPHY//INLINE-TERMINAL</span>
        <b>terminal-to-GUI choreography</b>
      </div>
      <div className="wizard-choreography__grid">
        {steps.map((step, index) => (
          <article className={`wizard-step wizard-step--${step.status}`} style={{ "--i": index } as CSSProperties} key={step.id}>
            <div className="wizard-step__top">
              <span>{step.call}</span>
              <b>{step.title}</b>
              <em>{step.status}</em>
            </div>
            <code>{step.command}</code>
            <p>{step.note}</p>
            <pre>{step.terminal.join("\n")}</pre>
          </article>
        ))}
      </div>
    </section>
  );
}

function ScanCommandRunwayPanel({ runway }: { runway: ScanCommandRunway }) {
  return (
    <section className="wizard-route-scan scan-command-runway" aria-label="First-run wizard scan command runway">
      <div className="scan-command-runway__head">
        <div>
          <span>VTK://FIRST-RUN-WIZARD//SCAN-COMMAND-RUNWAY//VISUAL-ONLY</span>
          <b>{runway.headline}</b>
        </div>
        <p>{runway.subline}</p>
      </div>
      <div className="scan-command-runway__body">
        <aside className="scan-command-runway__terminal" aria-label="Wizard scan command runway terminal">
          <div className="console-top"><span>scan@wizard</span><b>NO HIDDEN UPLOAD</b></div>
          <pre>{runway.terminalLines.join("\n")}</pre>
          <div className="scan-command-runway__totals" aria-label="Wizard scan safety totals">
            <span>{runway.totals.steps} phases</span>
            <span>{runway.totals.visualOnly} visual only</span>
            <span>{runway.totals.providerCalls} provider calls</span>
            <span>{runway.totals.ledgerWrites} ledger writes</span>
            <span>{runway.totals.hiddenUpload} hidden uploads</span>
          </div>
        </aside>
        <div className="scan-command-runway__steps" aria-label="Wizard scan phases">
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
                <span>{step.phase}</span>
                <b>{step.railLabel}</b>
                <i>{step.mark}</i>
              </div>
              <div className="scan-command-runway-step__screen" aria-hidden="true">
                {step.frames.map((frame, frameIndex) => (
                  <pre style={{ "--f": frameIndex } as CSSProperties} key={`${step.id}-${frameIndex}`}>
                    {frame}
                  </pre>
                ))}
              </div>
              <div className="scan-command-runway-step__copy">
                <strong>{step.label}</strong>
                <code>{step.command}</code>
                <p>{step.cue}</p>
                <small>{step.guardrail}</small>
              </div>
              <div className="scan-command-runway-step__transcript" aria-label={`${step.label} wizard transcript`}>
                {step.transcript.map((line) => (
                  <span key={`${step.id}-${line}`}>{line}</span>
                ))}
              </div>
              <div className="scan-command-runway-step__meter" aria-label={`${step.label} wizard readiness ${step.meter} percent`}>
                <i />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function WizardPage() {
  const runway = buildInstallRunway();
  const sequence = buildLaunchSequence();
  const capsule = buildLaunchCapsule();
  const scanRunway = buildScanCommandRunway();
  const flightRecorder = buildWizardFlightRecorder();

  return (
    <>
      <section className="wizard-route-intro" aria-label="VibeTRACKER first-run wizard introduction">
        <div>
          <p className="eyebrow">First-run wizard</p>
          <h1>Open in a terminal, then let the GUI take over</h1>
          <p>
            A full first-minute path for VibeTRACKER: ASCII terminal boot, inline GUI,
            source detection, branded scan feedback, creator ledgers, dry-run review,
            and C0VIBE publish. It stays a tool surface, not a landing page.
          </p>
          <WizardPreflightStrip
            runway={runway}
            sequence={sequence}
            scanRunway={scanRunway}
            recorder={flightRecorder}
            capsule={capsule}
          />
        </div>
        <div className="motto-rail" aria-label="First-run wizard motto">
          <span>Vibers Unite</span>
          <a href="https://c0vibe.app">C0vibe.app</a>
          <code>TERMINAL + GUI</code>
        </div>
      </section>
      <WizardCommandBridgePanel
        sequence={sequence}
        scanRunway={scanRunway}
        recorder={flightRecorder}
        capsule={capsule}
      />
      <WizardLiveTerminalViewportPanel
        sequence={sequence}
        scanRunway={scanRunway}
        recorder={flightRecorder}
        capsule={capsule}
      />
      <WizardSignalCockpitPanel
        sequence={sequence}
        scanRunway={scanRunway}
        recorder={flightRecorder}
        capsule={capsule}
      />
      <WizardLaunchReceiptPanel
        runway={runway}
        sequence={sequence}
        scanRunway={scanRunway}
        recorder={flightRecorder}
        capsule={capsule}
      />
      <WizardFlightRecorderPanel recorder={flightRecorder} />
      <WizardOperatorDeckPanel sequence={sequence} scanRunway={scanRunway} />
      <InstallRunwayPanel runway={runway} />
      <WizardChoreographyPanel steps={sequence} />
      <LaunchCapsulePanel capsule={capsule} />
      <ScanCommandRunwayPanel runway={scanRunway} />
    </>
  );
}
