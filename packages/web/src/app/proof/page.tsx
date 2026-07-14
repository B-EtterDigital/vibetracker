import type { CSSProperties } from "react";
import {
  buildEvidenceCockpit,
  type EvidenceCockpit,
  type EvidenceCockpitStage,
  type EvidenceCustodyLink,
  type EvidenceReplayDeck,
  type EvidenceReplayEvent,
  type EvidenceVerificationBridge,
  type EvidenceVerificationGate,
} from "../../lib/evidence-cockpit";
import { getProfile } from "../../lib/data";
import { LiveProofWorkbench } from "./live-proof-workbench";
import { buildLiveProofSnapshot, sanitizeProofHandle } from "./live-proof-snapshot";
import { buildProofVerdict } from "./proof-verdict";
import { ProofVerdictPanel } from "./proof-verdict-panel";
import "./live-proof-workbench.css";
import "./proof-verdict.css";

export const metadata = {
  title: "VibeUsage Proof Center",
  description: "A local-first proof cockpit that separates bundled contract fixtures from real user evidence.",
};

function railLabelFor(stage: EvidenceCockpitStage): string {
  if (stage.id === "publish") return "PUBLISH";
  if (stage.impact === "not_usage") return "NOT USAGE";
  if (stage.impact === "local_only") return "LOCAL ONLY";
  return "USAGE";
}

function custodyToneFor(link: EvidenceCustodyLink): string {
  return link.rail.toLowerCase().replace(/\s+/g, "_");
}

function replayToneFor(event: EvidenceReplayEvent): string {
  return event.rail.toLowerCase();
}

function bridgeToneFor(gate: EvidenceVerificationGate): string {
  return gate.rail.toLowerCase().replace(/\s+/g, "_");
}

function ProofDatastreamSpinePanel({ evidence }: { evidence: EvidenceCockpit }) {
  const spine = [
    {
      id: "usage",
      rail: "USAGE",
      label: "Reviewed usage receipt",
      value: `${evidence.bridge.totals.usageGates} usage gate`,
      command: evidence.custody[0]?.command ?? "vibetracker sync --providers auto",
      note: "Score, heatgrid, profile, and leaderboard read the same accepted aggregate receipt.",
      meter: 94,
      frames: ["USAGE \nRECEIPT\nSEALED", "SCORE \nPROFILE\nBOARD "],
    },
    {
      id: "local",
      rail: "LOCAL ONLY",
      label: "Machine boundary",
      value: `${evidence.bridge.totals.zeroHiddenUploads} hidden uploads`,
      command: "vibetracker upload --dry-run",
      note: "The preview is visible before relay; raw prompts, files, secrets, and private paths stay blocked.",
      meter: 90,
      frames: ["LOCAL \nDRYRUN\nFIRST ", "0 RAW \nPROMPT\nSHIP  "],
    },
    {
      id: "trust",
      rail: "NOT USAGE",
      label: "Trust sidecar",
      value: `${evidence.bridge.totals.trustUsageWrites} usage writes`,
      command: "vibetracker trust scan",
      note: "GitHub, Higgsfield MCP, creator cadence, and package signals explain credibility without changing spend.",
      meter: 87,
      frames: ["TRUST \nSIDE  \nCAR   ", "HIGGS \nMCP +0\nUSAGE "],
    },
    {
      id: "publish",
      rail: "PUBLISH",
      label: "C0VIBE relay",
      value: `${evidence.bridge.totals.publish} publish gate`,
      command: "vibetracker upload --target c0vibe",
      note: "c0vibe.app receives reviewed aggregates plus labelled trust context only after the user approves publish.",
      meter: 86,
      frames: ["C0VIBE\n.APP  \nRELAY ", "VIBERS\nUNITE \nLIVE  "],
    },
  ];

  const terminalLines = [
    "VTK DATASTREAM SPINE // SAME RECEIPT",
    "$ vibetracker proof --explain",
    "[usage] accepted aggregates -> score/profile/heatgrid",
    "[local] dry-run preview -> 0 hidden uploads",
    "[trust] sidecar context -> +0 usage writes",
    "[relay] c0vibe.app -> reviewed publish only",
    "motto: Vibers Unite",
  ];

  return (
    <section className="proof-datastream-spine" aria-label="Proof datastream spine">
      <div className="proof-datastream-spine__head">
        <div>
          <span>VTK://DATASTREAM-SPINE//SCORE-PROFILE-PUBLISH//TRUST-SIDECAR</span>
          <b>One reviewed receipt, four honest surfaces</b>
        </div>
        <p>
          The visible contract: usage can feed public score/profile surfaces, local preview protects the machine,
          trust stays labelled as not usage, and C0VIBE publish remains explicit.
        </p>
      </div>
      <div className="proof-datastream-spine__body">
        <aside className="proof-datastream-spine__terminal" aria-label="Proof datastream terminal">
          <div className="console-top"><span>spine@proof</span><b>{evidence.bridge.totals.averageMeter}% FIXTURE</b></div>
          <pre>{terminalLines.join("\n")}</pre>
          <div className="proof-datastream-spine__handoff" aria-label="Proof datastream handoff labels">
            <span>score feeds from usage</span>
            <span>profile feeds from receipt</span>
            <span>trust is not usage</span>
            <a href="https://c0vibe.app">c0vibe.app</a>
          </div>
        </aside>
        <div className="proof-datastream-spine__nodes" aria-label="Proof datastream nodes">
          {spine.map((node, index) => (
            <article
              className={`proof-spine-node proof-spine-node--${node.id}`}
              data-rail={node.rail}
              key={node.id}
              style={{ "--i": index, "--meter": `${node.meter}%` } as CSSProperties}
            >
              <div className="proof-spine-node__top">
                <span>{node.rail}</span>
                <b>{node.label}</b>
              </div>
              <div className="proof-spine-node__screen" aria-hidden="true">
                {node.frames.map((frame, frameIndex) => (
                  <pre key={`${node.id}-${frameIndex}`}>{frame}</pre>
                ))}
              </div>
              <strong>{node.value}</strong>
              <code>{node.command}</code>
              <p>{node.note}</p>
              <footer>
                <i />
                <em>{node.meter}%</em>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProofBlackBoxPanel({ evidence }: { evidence: EvidenceCockpit }) {
  const terminalLines = [
    "VTK BLACK BOX // LOCAL FIRST",
    "01 capture receipts -> schema gate",
    "02 dry-run review -> redaction preview",
    "03 trust sidecar -> NOT USAGE labels",
    "04 C0VIBE relay -> reviewed aggregates only",
    "status: NO RAW PROMPTS / 0 hidden uploads / NO FAKE PROOF",
    "motto: Vibers Unite // c0vibe.app",
  ];

  return (
    <section className="proof-black-box" aria-label="Proof black box custody chain">
      <div className="proof-black-box__head">
        <span>VTK://BLACK-BOX//CUSTODY//NO-RAW-PROMPTS//0-HIDDEN-UPLOADS</span>
        <b>USAGE + TRUST + PRIVACY + PUBLISH</b>
      </div>
      <div className="proof-black-box__body">
        <aside className="proof-black-box__terminal" aria-label="Proof custody terminal">
          <div className="console-top"><span>custody@local</span><b>BUNDLED</b></div>
          <pre>{terminalLines.join("\n")}</pre>
          <div className="proof-black-box__badges" aria-label="Proof custody guarantees">
            <span>NO RAW PROMPTS</span>
            <span>0 hidden uploads</span>
            <span>NOT USAGE labels</span>
            <span>Vibers Unite</span>
            <a href="https://c0vibe.app">c0vibe.app</a>
          </div>
        </aside>
        <div className="proof-black-box__chain" aria-label="Proof custody links">
          {evidence.custody.map((link, index) => (
            <article
              className={`proof-custody-link proof-custody-link--${custodyToneFor(link)}`}
              data-rail={link.rail}
              key={link.id}
              style={{ "--i": index, "--meter": `${link.meter}%` } as CSSProperties}
            >
              <div className="proof-custody-link__top">
                <span>{link.rail}</span>
                <b>{link.label}</b>
              </div>
              <div className="proof-custody-link__scope" aria-hidden="true">
                {link.frames.map((frame, frameIndex) => (
                  <pre key={`${link.id}-${frameIndex}`}>{frame}</pre>
                ))}
              </div>
              <strong>{link.title}</strong>
              <code>{link.command}</code>
              <p>{link.note}</p>
              <div className="proof-custody-link__checks" aria-label={`${link.label} proof checks`}>
                {link.checks.map((check) => (
                  <em key={check}>{check}</em>
                ))}
              </div>
              <footer>
                <i aria-hidden="true" />
                <small>{link.meter}%</small>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProofVerificationBridgePanel({ bridge }: { bridge: EvidenceVerificationBridge }) {
  return (
    <section className="proof-verification-bridge" aria-label="Proof verification bridge">
      <div className="proof-verification-bridge__head">
        <div>
          <span>VTK://PROOF-BRIDGE//OPERATOR-QUESTIONS//ZERO-HIDDEN-UPLOADS</span>
          <b>{bridge.headline}</b>
        </div>
        <p>{bridge.subline}</p>
      </div>
      <div className="proof-verification-bridge__body">
        <aside className="proof-verification-bridge__terminal" aria-label="Proof verification bridge terminal">
          <div className="console-top"><span>bridge@proof</span><b>{bridge.totals.averageMeter}% FIXTURE</b></div>
          <pre>{bridge.terminalLines.join("\n")}</pre>
          <div className="proof-verification-bridge__totals" aria-label="Proof verification bridge totals">
            <span>{bridge.totals.usageGates} usage gate</span>
            <span>{bridge.totals.localOnly} local gate</span>
            <span>{bridge.totals.notUsage} not usage</span>
            <span>{bridge.totals.trustUsageWrites} trust usage writes</span>
            <span>{bridge.totals.zeroHiddenUploads} hidden uploads</span>
          </div>
        </aside>
        <div className="proof-verification-gates" aria-label="Proof verification gates">
          {bridge.gates.map((gate, index) => (
            <article
              className={`proof-verification-gate proof-verification-gate--${bridgeToneFor(gate)}`}
              data-rail={gate.rail}
              key={gate.id}
              style={{ "--i": index, "--meter": `${gate.meter}%` } as CSSProperties}
            >
              <div className="proof-verification-gate__top">
                <span>{gate.rail}</span>
                <b>{gate.label}</b>
              </div>
              <div className="proof-verification-gate__screen" aria-hidden="true">
                {gate.frames.map((frame, frameIndex) => (
                  <pre key={`${gate.id}-${frameIndex}`}>{frame}</pre>
                ))}
              </div>
              <strong>{gate.question}</strong>
              <p>{gate.answer}</p>
              <code>{gate.command}</code>
              <small>{gate.writes}</small>
              <div className="proof-verification-gate__checks" aria-label={`${gate.label} checks`}>
                {gate.checks.map((check) => <em key={check}>{check}</em>)}
              </div>
              <footer aria-label={`${gate.label} invariant`}>
                <i />
                <span>{gate.invariant}</span>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProofReplayRecorderPanel({ replay }: { replay: EvidenceReplayDeck }) {
  return (
    <section className="proof-replay-recorder" aria-label="Tamper-evident proof replay recorder">
      <div className="proof-replay-recorder__head">
        <div>
          <span>VTK://PROOF-REPLAY//TAMPER-EVIDENT//LOCAL-FIRST//NOT-USAGE-SIDECAR</span>
          <b>{replay.headline}</b>
        </div>
        <p>{replay.subline}</p>
      </div>
      <div className="proof-replay-recorder__body">
        <aside className="proof-replay-recorder__terminal" aria-label="Proof replay terminal">
          <div className="console-top"><span>replay@proof</span><b>{replay.totals.events} EVENTS</b></div>
          <pre>{replay.terminalLines.join("\n")}</pre>
          <div className="proof-replay-recorder__totals" aria-label="Proof replay totals">
            <span>{replay.totals.sealed} sealed</span>
            <span>{replay.totals.localOnly} local</span>
            <span>{replay.totals.notUsage} not usage</span>
            <span>{replay.totals.publish} publish</span>
            <span>{replay.totals.averageMeter}% fixture</span>
          </div>
        </aside>
        <div className="proof-replay-events" aria-label="Proof replay events">
          {replay.events.map((event, index) => (
            <article
              className={`proof-replay-event proof-replay-event--${replayToneFor(event)}`}
              data-status={event.status}
              key={event.id}
              style={{ "--i": index, "--meter": `${event.meter}%` } as CSSProperties}
            >
              <div className="proof-replay-event__top">
                <span>{event.rail}</span>
                <div>
                  <b>{event.label}</b>
                  <em>{event.status}</em>
                </div>
              </div>
              <div className="proof-replay-event__screen" aria-hidden="true">
                {event.frames.map((frame, frameIndex) => (
                  <pre key={`${event.id}-frame-${frameIndex}`}>{frame}</pre>
                ))}
              </div>
              <code>{event.command}</code>
              <small>{event.checkpoint}</small>
              <p>{event.note}</p>
              <div className="proof-replay-event__hash" aria-label={`${event.label} sealed hash`}>
                <i>{event.hash}</i>
              </div>
              <div className="proof-replay-event__marks" aria-label={`${event.label} replay marks`}>
                {event.marks.map((mark, markIndex) => (
                  <strong style={{ "--i": markIndex } as CSSProperties} key={`${event.id}-${mark}-${markIndex}`}>{mark}</strong>
                ))}
              </div>
              <div
                className="proof-replay-event__meter"
                role="progressbar"
                aria-label={`${event.label} fixture coverage`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={event.meter}
              >
                <i />
              </div>
              <footer>{event.invariant}</footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

interface ProofPageProps {
  searchParams: Promise<{ handle?: string | string[] }>;
}

export default async function ProofPage({ searchParams }: ProofPageProps) {
  const evidence = buildEvidenceCockpit();
  const verdict = buildProofVerdict(evidence);
  const params = await searchParams;
  const requestedHandle = sanitizeProofHandle(params.handle);
  let liveProfile: Awaited<ReturnType<typeof getProfile>> = null;
  let loadFailed = false;
  try {
    liveProfile = await getProfile(requestedHandle);
  } catch {
    // getProfile records the failed public query through product telemetry.
    loadFailed = true;
  }
  const snapshot = liveProfile ? buildLiveProofSnapshot(liveProfile) : null;

  return (
    <>
      <section className="proof-route-intro" aria-label="VibeTRACKER proof center introduction">
        <div>
          <p className="eyebrow">Proof center</p>
          <h1>Inspect a public usage receipt.</h1>
          <p>
            Start with a real public aggregate: what was counted, which provider rollups exist, what
            trust context cannot affect, and where the receipt was published. The bundled contract
            remains below for operators who need the complete scan-to-share specification.
          </p>
        </div>
        <div className="motto-rail" aria-label="Proof center motto">
          <span>Vibers Unite</span>
          <a href="https://c0vibe.app">C0vibe.app</a>
          <code>NO FAKE PROOF</code>
        </div>
      </section>

      <LiveProofWorkbench loadFailed={loadFailed} requestedHandle={requestedHandle} snapshot={snapshot} />

      <details className="proof-blueprint">
        <summary>Open the bundled proof contract</summary>
        <div className="proof-blueprint__body">
          <ProofVerdictPanel verdict={verdict} />

          <ProofDatastreamSpinePanel evidence={evidence} />

          <section className="proof-route-cockpit evidence-cockpit" aria-label="VibeTRACKER proof center evidence cockpit">
            <div className="evidence-cockpit__head">
              <span>VTK://PROOF-CENTER//LOCAL-FIRST//NO-FAKE-PROOF//NO-HIDDEN-UPLOADS</span>
              <b>{evidence.headline}</b>
            </div>
            <div className="evidence-cockpit__body">
              <aside className="evidence-terminal" aria-label="Proof center terminal">
                <div className="console-top"><span>proof@local</span><b>TRACEABLE</b></div>
                <pre>{evidence.terminalLines.join("\n")}</pre>
                <div className="evidence-relay" aria-label="Proof center relay">
                  <span>Vibers Unite</span>
                  <a href="https://c0vibe.app">c0vibe.app</a>
                  <code>dry-run first</code>
                </div>
              </aside>
              <div className="evidence-stages" aria-label="Proof center stages">
                {evidence.stages.map((stage, index) => (
                  <article
                    className={`evidence-stage evidence-stage--${stage.impact}`}
                    data-rail={railLabelFor(stage)}
                    style={{ "--i": index, "--meter": `${stage.meter}%` } as CSSProperties}
                    key={stage.id}
                  >
                    <div className="evidence-stage__screen" aria-hidden="true">
                      <pre>{stage.ascii.join("\n")}</pre>
                      <span>{stage.status}</span>
                    </div>
                    <div className="evidence-stage__copy">
                      <b>{stage.label}</b>
                      <strong>{railLabelFor(stage)}</strong>
                      <code>{stage.command}</code>
                      <p>{stage.note}</p>
                    </div>
                    <div
                      className="evidence-stage__meter"
                      role="progressbar"
                      aria-label={`${stage.label} fixture coverage`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={stage.meter}
                    >
                      <i />
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <div className="evidence-guards" aria-label="Proof center guard rails">
              {evidence.guards.map((guard) => (
                <div key={guard.id}>
                  <b>{guard.label}</b>
                  <span>{guard.note}</span>
                </div>
              ))}
            </div>
          </section>

          <ProofVerificationBridgePanel bridge={evidence.bridge} />

          <ProofBlackBoxPanel evidence={evidence} />

          <ProofReplayRecorderPanel replay={evidence.replay} />
        </div>
      </details>
    </>
  );
}
