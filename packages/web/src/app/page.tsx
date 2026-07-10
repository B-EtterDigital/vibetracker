import { getLeaderboard } from "../lib/data";
import {
  BOARD_HEATGRID_COLORS,
  buildLeaderboardArena,
  buildLeaderboardBroadcastWall,
  buildLeaderboardHeatgrid,
  buildLeaderboardPodiumWave,
  buildLeaderboardProofTower,
  buildLeaderboardRaceControl,
  formatUsd,
  formatInt,
  TIER_BLURB,
  TIER_SIGNAL,
  type LeaderboardBroadcastWall,
  type LeaderboardHeatgrid,
  type LeaderboardPodiumWave,
  type LeaderboardProofTower,
  type LeaderboardRaceControl,
  type Tier,
} from "../lib/leaderboard";
import { TrustBadge } from "../components/TrustBadge";
import { UsageSignalDock } from "../components/UsageSignalDock";
import { roadmapHighlights, roadmapSummary } from "../../../core/src/capabilities/roadmap";
import {
  buildHomeCommandDeck,
  buildHomeCommandPalette,
  buildHomeDatastreamReactor,
  buildHomeMissionSpine,
  buildHomeOperatorConstellation,
  buildHomeProofHud,
  buildHomeScanConductor,
  buildHomeSignalTape,
  type HomeCommandPalette,
  type HomeDatastreamReactor,
  type HomeMissionSpine,
  type HomeOperatorConstellation,
  type HomeProofHud,
  type HomeScanConductor,
} from "../lib/home-proof";
import { buildHomeControlTower, type HomeControlTower } from "../lib/home-control-tower";
import { buildEvidenceCockpit } from "../lib/evidence-cockpit";
import { buildHomeScanRoom } from "../lib/home-scan-room";
import { buildGuiTerminalDoctor } from "../lib/gui-terminal-doctor";
import {
  buildCollectionBlackBox,
  buildCollectionEncoreRecap,
  buildCollectionEventTape,
  buildCollectionFlightRecorder,
  buildCollectionHeroScanBridge,
  buildCollectionSignalStack,
  buildCollectionReplayDeck,
  buildCollectionSurpriseCascade,
  buildCollectionSurpriseDirector,
  buildCollectionSurpriseRun,
  buildCollectionSurpriseSequencer,
  buildCollectionTransmissionRibbon,
  type CollectionBlackBoxDeck,
  type CollectionEncoreRecapDeck,
  type CollectionEventTape,
  type CollectionFlightRecorderDeck,
  type CollectionHeroScanBridge,
  type CollectionReplayDeck,
  type CollectionSignalStack,
  type CollectionSurpriseCascade,
  type CollectionSurpriseDirector,
  type CollectionSurpriseSequencer,
  type CollectionTransmissionRibbon,
} from "../lib/collection-surprises";
import { buildSourceAtlas } from "../lib/source-atlas";
import { buildAsciiMotionLab } from "../lib/ascii-motion-lab";
import { buildLaunchCapsule, buildScanCommandRunway, type LaunchCapsule, type ScanCommandRunway } from "../lib/launch-sequence";
import { buildAiLifeCockpit, type AiLifeCockpit } from "../lib/ai-life-cockpit";
import type { CSSProperties } from "react";

export const revalidate = 60; // ISR: refresh the board every minute

const asciiDeck = [
  "+------------------------------------------------------+",
  "| VTRK://LOCAL-FIRST/AI-USAGE-MATRIX                   |",
  "|------------------------------------------------------|",
  "| cli  github  higgsfield  replicate  ollama  comfyui |",
  "| lmstudio  runway  qwen  kimi  mistral  suno  voice  |",
  "|------------------------------------------------------|",
  "| usage totals: verified / self-reported / local-only  |",
  "| trust signals: visible, labelled, never spend totals |",
  "+------------------------------------------------------+",
].join("\n");

const heroLaunchSpine = [
  {
    id: "usage",
    rail: "USAGE",
    label: "Spend heat",
    command: "vibetrack scan --dry-run",
    note: "Accepted usage rows feed score, profile, board, and public relay.",
    metric: "score feed",
    mark: "$",
    meter: 92,
    from: "#39d353",
    to: "#2ee8d6",
    ink: "#071013",
    cells: [28, 46, 62, 88, 71, 56, 94],
  },
  {
    id: "trust",
    rail: "NOT USAGE",
    label: "Trust sidecar",
    command: "vibetrack trust --collect",
    note: "GitHub and Higgsfield MCP evidence stays labelled context, never spend.",
    metric: "0 spend",
    mark: "TS",
    meter: 84,
    from: "#ffc64d",
    to: "#ff4fd8",
    ink: "#170b00",
    cells: [22, 32, 52, 64, 48, 76, 58],
  },
  {
    id: "local",
    rail: "LOCAL ONLY",
    label: "Local loop",
    command: "vibetrack scan local-ai",
    note: "Ollama, LM Studio, and ComfyUI stay on-machine until the user exports.",
    metric: "0 upload",
    mark: "127",
    meter: 89,
    from: "#36e39b",
    to: "#2ee8d6",
    ink: "#071013",
    cells: [18, 44, 38, 72, 88, 54, 67],
  },
  {
    id: "privacy",
    rail: "PRIVACY",
    label: "Redaction gate",
    command: "vibetrack upload --dry-run",
    note: "Dry-run receipts expose every field before anything can leave.",
    metric: "hiddenUpload=0",
    mark: "RG",
    meter: 96,
    from: "#9f7cff",
    to: "#ff7768",
    ink: "#ffffff",
    cells: [36, 24, 58, 42, 79, 64, 48],
  },
  {
    id: "publish",
    rail: "PUBLISH",
    label: "C0VIBE relay",
    command: "vibetrack profile --relay c0vibe.app",
    note: "Vibers Unite appears only after explicit profile publish approval.",
    metric: "c0vibe.app",
    mark: "C0",
    meter: 100,
    from: "#2ee8d6",
    to: "#ffc64d",
    ink: "#071013",
    cells: [40, 55, 70, 86, 94, 82, 100],
  },
];

const homeViberSpectrum = [
  {
    id: "creator",
    rail: "CREATOR AI",
    label: "Visual + audio makers",
    command: "vibetrack scan creators --preview",
    note: "Higgsfield, Runway, Pika, Suno, ElevenLabs, ComfyUI, and manual ledgers stay labelled before usage.",
    guard: "usage after rows",
    mark: "CR",
    impact: "usage",
    meter: 92,
    from: "#ff4fd8",
    to: "#ffc64d",
    ink: "#170b00",
    frames: ["IMG\nVID\nAUD", "VOICE\n3D\nMUSIC", "LEDGER\nLABEL\nOK"],
  },
  {
    id: "builder",
    rail: "BUILDER AI",
    label: "Coders + operators",
    command: "vibetrack trust collect --builders",
    note: "Codex, GitHub, packages, Replicate CLI, and contribution cadence become trust evidence, not spend.",
    guard: "NOT USAGE",
    mark: "CX",
    impact: "trust",
    meter: 100,
    from: "#24292f",
    to: "#39d353",
    ink: "#ffffff",
    frames: ["CODEX\nGITHUB\nPKG", "TRUST\nSIDE\nRAIL", "SPEND\nUNCHANGED\nOK"],
  },
  {
    id: "local",
    rail: "LOCAL LAB",
    label: "On-machine models",
    command: "vibetrack detect --local --dry-run",
    note: "Ollama, LM Studio, ComfyUI, InvokeAI, vLLM, and loopback proxy traces stay local-only.",
    guard: "0 upload",
    mark: "127",
    impact: "local",
    meter: 96,
    from: "#36e39b",
    to: "#2ee8d6",
    ink: "#071013",
    frames: ["OLLAMA\nLMSTUDIO\n127", "COMFY\nINVOKE\nVLLM", "LOCAL\nONLY\nSAVE"],
  },
  {
    id: "regional",
    rail: "WORLD AI",
    label: "Chinese + EU sources",
    command: "vibetrack scan regional --preview",
    note: "Qwen, Kimi, DeepSeek, Mistral, Le Chat, Stability, and other regional adapters keep brand rails.",
    guard: "provider labelled",
    mark: "CN",
    impact: "usage",
    meter: 88,
    from: "#ff7768",
    to: "#9f7cff",
    ink: "#ffffff",
    frames: ["QWEN\nKIMI\nDEEP", "EU\nMISTRAL\nSTAB", "BRAND\nCOLORS\nOK"],
  },
  {
    id: "research",
    rail: "RESEARCH",
    label: "Knowledge workflows",
    command: "vibetrack import research --manual",
    note: "Poe, Perplexity, Hugging Face, Notion, Obsidian, and PDFs can enter as reviewable manual ledgers.",
    guard: "review first",
    mark: "RX",
    impact: "privacy",
    meter: 94,
    from: "#ffc64d",
    to: "#2ee8d6",
    ink: "#071013",
    frames: ["POE\nHF\nPPLX", "NOTION\nPDF\nNOTES", "REDACT\nREVIEW\nFIRST"],
  },
  {
    id: "relay",
    rail: "C0VIBE",
    label: "Public proof relay",
    command: "vibetrack upload --review --to c0vibe.app",
    note: "Profile, Vibe Score, heatgrid, and public board feed only from reviewed aggregate datastreams.",
    guard: "Vibers Unite",
    mark: "C0",
    impact: "publish",
    meter: 100,
    from: "#2ee8d6",
    to: "#ffc64d",
    ink: "#071013",
    frames: ["C0VIBE\nAPP", "SCORE\nHEAT\nPROFILE", "VIBERS\nUNITE\nGO"],
  },
];

function HomeViberSpectrumPreludePanel() {
  const terminalLines = [
    "VTK://HOME-VIBER-SPECTRUM//AI-LIFE//VIBERS-UNITE",
    "$ vibetrack scan --all-vibers --dry-run",
    "[creator] image video music voice 3d manual ledgers",
    "[builder] codex github packages cli trust side rail",
    "[local] ollama lm studio comfyui invokeai vllm 127.0.0.1",
    "[regional] qwen kimi deepseek mistral stability eu cn global",
    "[publish] profile + vibe score + heatgrid wait for review",
    "providerCalls=0 hiddenUpload=0 promptReads=0 outputReads=0",
    "Vibers Unite // C0vibe.app",
  ];

  return (
    <section className="home-viber-spectrum" aria-label="VibeTRACKER all-viber first-contact spectrum">
      <div className="home-viber-spectrum__head">
        <div>
          <span>VTK://HOME-VIBER-SPECTRUM//AI-LIFE//VIBERS-UNITE</span>
          <b>all-viber signal spectrum</b>
        </div>
        <p>Not only coders: creators, researchers, local labs, global providers, trust signals, and C0VIBE publishing stay separated before any score moves.</p>
      </div>
      <div className="home-viber-spectrum__body">
        <aside className="home-viber-spectrum__terminal" aria-label="All-viber spectrum terminal">
          <div className="console-top"><span>spectrum@home</span><b>DRY RUN</b></div>
          <pre>{terminalLines.join("\n")}</pre>
          <div className="home-viber-spectrum__counters" aria-label="All-viber spectrum safety counters">
            <span>{homeViberSpectrum.length} viber lanes</span>
            <span>0 provider calls</span>
            <span>0 hidden uploads</span>
            <span>0 prompt reads</span>
            <span>trust != usage</span>
            <span>review before publish</span>
          </div>
        </aside>
        <div className="home-viber-spectrum__lanes" aria-label="All-viber spectrum lanes">
          {homeViberSpectrum.map((lane, index) => (
            <article
              className={`home-viber-spectrum-lane home-viber-spectrum-lane--${lane.impact}`}
              data-rail={lane.rail}
              style={{
                "--i": index,
                "--meter": `${lane.meter}%`,
                "--brand-from": lane.from,
                "--brand-to": lane.to,
                "--brand-ink": lane.ink,
              } as CSSProperties}
              key={lane.id}
            >
              <div className="home-viber-spectrum-lane__top">
                <i>{lane.mark}</i>
                <div>
                  <span>{lane.rail}</span>
                  <b>{lane.label}</b>
                </div>
              </div>
              <div className="home-viber-spectrum-lane__screen" aria-hidden="true">
                {lane.frames.map((frame, frameIndex) => (
                  <pre style={{ "--f": frameIndex } as CSSProperties} key={`${lane.id}-${frameIndex}`}>
                    {frame}
                  </pre>
                ))}
              </div>
              <code>{lane.command}</code>
              <p>{lane.note}</p>
              <footer aria-label={`${lane.label} spectrum readiness ${lane.meter} percent`}>
                <em />
                <strong>{lane.guard}</strong>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomeBootPanoramaPanel({
  tower,
  mission,
  conductor,
  proof,
}: {
  tower: HomeControlTower;
  mission: HomeMissionSpine;
  conductor: HomeScanConductor;
  proof: HomeProofHud;
}) {
  const terminalLines = [
    "+----------------------------------------------------------------+",
    "| VTK://HOME-BOOT-PANORAMA//LIVE-SHELL//VIBERS-UNITE            |",
    `| routes ${tower.totals.routes} // scan beats ${conductor.totals.beats} // surprises ${conductor.totals.surprises} // proof rails ${proof.totals.channels}       |`,
    `| hidden uploads ${tower.totals.hiddenUploads} // provider calls ${tower.totals.providerCalls} // prompt reads ${tower.totals.promptReads} // output reads ${tower.totals.outputReads} |`,
    `| score feeds ${mission.totals.scoreFeeds} // profile feeds ${mission.totals.profileFeeds} // public relay feeds ${mission.totals.publicRelayFeeds}              |`,
    "| terminal charm stays inside the GUI // C0vibe.app review gate  |",
    "+----------------------------------------------------------------+",
  ];
  const rails = [
    {
      id: "terminal",
      label: "Terminal handoff",
      impact: "LOCAL ONLY",
      route: "/wizard",
      command: "npx vibetrack init --gui",
      value: `${tower.totals.routes} routes`,
      note: "The first control surface is still the real CLI, rendered inside the GUI.",
      guardrail: "providerCalls=0 hiddenUpload=0",
      meter: 98,
      mark: "VT",
      from: "#2ee8d6",
      to: "#36e39b",
      ink: "#071013",
      frames: ["$VT\nINIT\nGUI", "TERM\nIN\nGUI", "LOCAL\nONLY\nOK"],
    },
    {
      id: "scan",
      label: "Branded scan theatre",
      impact: "USAGE",
      route: "/scan",
      command: "vibetrack scan --dry-run",
      value: `${conductor.totals.surprises} reveals`,
      note: "Higgsfield, Codex, local AI, regional sources, and C0VIBE get staged feedback.",
      guardrail: "dry run first; usage rows require review",
      meter: 95,
      mark: "HF",
      from: "#ff4fd8",
      to: "#7c5cff",
      ink: "#ffffff",
      frames: ["HF\nPRISM\nTURN", "CX\nDIFF\nCUBE", "AI\nSONAR\nPING"],
    },
    {
      id: "proof",
      label: "Proof boundary",
      impact: "PRIVACY",
      route: "/proof",
      command: "vibetrack sync --dry-run --receipt",
      value: `${proof.totals.hiddenUploads} uploads`,
      note: "No prompt text, output text, secrets, or raw files move through the public surface.",
      guardrail: "raw reads=0 hidden uploads=0",
      meter: 100,
      mark: "PR",
      from: "#ffc64d",
      to: "#ff7768",
      ink: "#1b0b00",
      frames: ["RAW\nREADS\n0", "DRY\nRUN\nFIRST", "SAFE\nREVIEW\nOK"],
    },
    {
      id: "trust",
      label: "Trust side rail",
      impact: "NOT USAGE",
      route: "/sources",
      command: "vibetrack trust --collect",
      value: `${mission.totals.notUsageCells} sidecar`,
      note: "GitHub, creator cadence, and MCP connection evidence explain context only.",
      guardrail: "trust cannot change spend, rank, score totals, or verified usage",
      meter: 91,
      mark: "NO",
      from: "#ffc64d",
      to: "#ff4fd8",
      ink: "#1b0b00",
      frames: ["TRUST\nSIDE\nRAIL", "NOT\nUSAGE\nOK", "RANK\nBOOST\n0"],
    },
    {
      id: "relay",
      label: "C0VIBE public relay",
      impact: "PUBLISH",
      route: "/u/demo",
      command: "vibetrack upload --review",
      value: `${mission.totals.publicRelayFeeds} feeds`,
      note: "The same reviewed datastream powers profile, vibe score, heatgrid, and leaderboard.",
      guardrail: "explicit publish gate; no hidden sync",
      meter: 96,
      mark: "C0",
      from: "#2ee8d6",
      to: "#ffc64d",
      ink: "#071013",
      frames: ["C0VIBE\nAPP\nRELAY", "VIBERS\nUNITE\nNOW", "PUBLIC\nPROFILE\nOK"],
    },
  ];

  return (
    <section className="home-boot-panorama" aria-label="VibeTRACKER live boot panorama">
      <div className="home-boot-panorama__head">
        <div>
          <span>VTK://HOME-BOOT-PANORAMA//LIVE-SHELL//NO-FAKE-USAGE</span>
          <b>live boot panorama</b>
        </div>
        <p>One first-screen command room: terminal handoff, scan theatre, proof boundary, trust side rail, and C0VIBE relay.</p>
      </div>
      <div className="home-boot-panorama__body">
        <aside className="home-boot-panorama__terminal" aria-label="Home boot panorama terminal">
          <div className="console-top"><span>boot@vibetracker</span><b>VIBERS UNITE</b></div>
          <pre>{terminalLines.join("\n")}</pre>
          <div className="home-boot-panorama__seals" aria-label="Boot panorama zero side effect seals">
            <span>providerCalls {tower.totals.providerCalls}</span>
            <span>hiddenUpload {tower.totals.hiddenUploads}</span>
            <span>promptReads {tower.totals.promptReads}</span>
            <span>outputReads {tower.totals.outputReads}</span>
            <a href="https://c0vibe.app">C0vibe.app</a>
          </div>
        </aside>
        <div className="home-boot-panorama__radar" aria-label="Boot panorama route radar">
          <i />
          <i />
          <i />
          <strong>C0</strong>
          <span>CLI</span>
          <span>SCAN</span>
          <span>PROOF</span>
          <span>SCORE</span>
          <span>PROFILE</span>
          <code>Vibers Unite</code>
        </div>
        <div className="home-boot-panorama__rails" aria-label="Boot panorama proof rails">
          {rails.map((rail, index) => (
            <a
              className={`home-boot-rail home-boot-rail--${rail.id}`}
              data-impact={rail.impact}
              href={rail.route}
              style={{
                "--i": index,
                "--meter": `${rail.meter}%`,
                "--brand-from": rail.from,
                "--brand-to": rail.to,
                "--brand-ink": rail.ink,
              } as CSSProperties}
              key={rail.id}
            >
              <div className="home-boot-rail__top">
                <i>{rail.mark}</i>
                <span>{rail.impact}</span>
              </div>
              <div className="home-boot-rail__screen" aria-hidden="true">
                {rail.frames.map((frame, frameIndex) => (
                  <pre style={{ "--f": frameIndex } as CSSProperties} key={`${rail.id}-${frameIndex}`}>{frame}</pre>
                ))}
              </div>
              <b>{rail.label}</b>
              <strong>{rail.value}</strong>
              <code>{rail.command}</code>
              <p>{rail.note}</p>
              <small>{rail.guardrail}</small>
              <footer aria-label={`${rail.label} boot panorama meter ${rail.meter} percent`}>
                <em />
                <span>{rail.meter}%</span>
              </footer>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function LeaderboardRaceControlPanel({ race }: { race: LeaderboardRaceControl }) {
  return (
    <section className="leaderboard-race-control" aria-label={`${race.headline} public race control`}>
      <div className="leaderboard-race-control__head">
        <div>
          <span>VTK://PUBLIC-RACE-CONTROL//NO-MIXED-RANKS</span>
          <b>{race.headline}</b>
        </div>
        <p>{race.subline}</p>
      </div>
      <div className="leaderboard-race-control__body">
        <aside className="leaderboard-race-terminal" aria-label={`${race.headline} terminal race summary`}>
          <div className="console-top"><span>race@vibetracker</span><b>LIVE BOARD</b></div>
          <pre>{race.terminalLines.join("\n")}</pre>
        </aside>
        <div className="leaderboard-race-panel">
          <div className="leaderboard-race-stream" aria-label={`${race.headline} public board datastream`}>
            {race.stream.map((stage, index) => (
              <article
                className={`leaderboard-race-stream__stage leaderboard-race-stream__stage--${stage.tone}`}
                style={{ "--i": index, "--meter": `${stage.meter}%` } as CSSProperties}
                key={stage.id}
              >
                <span>{stage.label}</span>
                <b>{stage.value}</b>
                <small>{stage.note}</small>
                <i aria-label={`${stage.label} stream meter ${stage.meter} percent`} />
              </article>
            ))}
          </div>
          <div className="leaderboard-race-pipeline" aria-label={`${race.headline} rank pipeline`}>
            {race.pipeline.map((step, index) => (
              <article
                className="leaderboard-race-pipeline__step"
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
                <div className="leaderboard-race-pipeline__screen" aria-hidden="true">
                  {step.frames.map((frame, frameIndex) => (
                    <pre style={{ "--frame": frameIndex } as CSSProperties} key={`${step.id}-${frameIndex}`}>
                      {frame}
                    </pre>
                  ))}
                  <i>{step.mark}</i>
                </div>
                <div className="leaderboard-race-pipeline__copy">
                  <span>
                    {step.impact === "tier_boundary"
                      ? "TIER BOUNDARY"
                      : step.impact === "ranked_usage"
                        ? "RANKED USAGE"
                        : step.impact.toUpperCase()}
                  </span>
                  <b>{step.label}</b>
                  <code>{step.command}</code>
                  <strong>{step.value}</strong>
                  <pre>{step.terminalLine}</pre>
                  <small>{step.note}</small>
                </div>
              </article>
            ))}
          </div>
          <div className="leaderboard-race-grid">
            {race.cards.map((card, index) => (
              <article
                className={`leaderboard-race-card leaderboard-race-card--${card.tone}`}
                style={{ "--i": index, "--meter": `${card.meter}%` } as CSSProperties}
                key={card.id}
              >
                <span>{card.label}</span>
                <b>{card.value}</b>
                <strong>{card.status}</strong>
                <p>{card.note}</p>
                <i aria-label={`${card.label} meter ${card.meter} percent`} />
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function LeaderboardPodiumWavePanel({ wave }: { wave: LeaderboardPodiumWave }) {
  return (
    <section className="leaderboard-podium-wave" aria-label={`${wave.headline} visual-only public podium waveform`}>
      <div className="leaderboard-podium-wave__head">
        <div>
          <span>VTK://PODIUM-WAVEFORM//VISUAL-ONLY//NO-TRUST-BOOST</span>
          <b>{wave.headline}</b>
        </div>
        <p>{wave.subline}</p>
      </div>
      <div className="leaderboard-podium-wave__body">
        <aside className="leaderboard-podium-wave__terminal" aria-label={`${wave.headline} terminal`}>
          <div className="console-top"><span>wave@leaderboard</span><b>VISUAL ONLY</b></div>
          <pre>{wave.terminalLines.join("\n")}</pre>
          <div className="leaderboard-podium-wave__totals" aria-label={`${wave.headline} zero mix counters`}>
            <span>{wave.totals.rankedOperators} ranked</span>
            <span>{wave.totals.podiumOperators} podium</span>
            <span>{wave.totals.waveformBars} bars</span>
            <span>{formatUsd(wave.totals.totalUsd)} total</span>
            <span>{wave.totals.hiddenTrustBoost} trust boost</span>
            <span>{wave.totals.mixedRanks} mixed ranks</span>
          </div>
          <div className="leaderboard-podium-wave__guards" aria-label={`${wave.headline} guard rails`}>
            {wave.guards.map((guard, index) => (
              <article
                data-impact={guard.impact}
                style={{ "--i": index, "--meter": `${guard.meter}%` } as CSSProperties}
                key={guard.id}
              >
                <span>{guard.label}</span>
                <b>{guard.value}</b>
                <small>{guard.note}</small>
                <em aria-label={`${guard.label} guard meter ${guard.meter} percent`} />
              </article>
            ))}
          </div>
        </aside>
        <div className="leaderboard-podium-wave__operators" aria-label={`${wave.headline} operator waveform bars`}>
          {wave.operators.length ? wave.operators.map((operator, index) => (
            <a
              className="leaderboard-podium-wave-operator"
              data-impact={operator.impact}
              href={`/u/${operator.handle.slice(1)}`}
              style={{
                "--i": index,
                "--meter": `${operator.meter}%`,
                "--brand-from": operator.from,
                "--brand-to": operator.to,
                "--brand-ink": operator.ink,
              } as CSSProperties}
              key={operator.id}
            >
              <div className="leaderboard-podium-wave-operator__top">
                <span>{operator.rank}</span>
                <b>{operator.handle}</b>
                <i>{operator.share}</i>
              </div>
              <div className="leaderboard-podium-wave-operator__bars" aria-hidden="true">
                {operator.bars.map((bar, barIndex) => (
                  <i
                    style={{
                      "--b": barIndex,
                      "--bar": `${bar}%`,
                    } as CSSProperties}
                    key={`${operator.id}-${barIndex}`}
                  />
                ))}
              </div>
              <strong>{operator.spend}</strong>
              <small>{operator.ops} · {operator.credits}</small>
              <code>{operator.terminalLine}</code>
              <p>{operator.delta} · {operator.checksum}</p>
              <p>{operator.note}</p>
              <em aria-label={`${operator.handle} waveform meter ${operator.meter} percent`} />
            </a>
          )) : (
            <article className="leaderboard-podium-wave-empty">
              <span>--</span>
              <b>Waveform armed</b>
              <p>Bars appear after this separated trust tier receives ranked usage rows.</p>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}

function LeaderboardHeatgridPanel({ heatgrid }: { heatgrid: LeaderboardHeatgrid }) {
  return (
    <section className="leaderboard-heatgrid" aria-label={`${heatgrid.headline} official GitHub color usage heatgrid`}>
      <div className="leaderboard-heatgrid__head">
        <div>
          <span>VTK://BOARD-HEATGRID//OFFICIAL-GH-COLORS//VISUAL-ONLY</span>
          <b>{heatgrid.headline}</b>
        </div>
        <p>{heatgrid.subline}</p>
      </div>
      <div className="leaderboard-heatgrid__body">
        <aside className="leaderboard-heatgrid__terminal" aria-label={`${heatgrid.headline} terminal`}>
          <div className="console-top"><span>heatgrid@leaderboard</span><b>OFFICIAL GH</b></div>
          <pre>{heatgrid.terminalLines.join("\n")}</pre>
          <div className="leaderboard-heatgrid__totals" aria-label={`${heatgrid.headline} safety totals`}>
            <span>{heatgrid.totals.cells} cells</span>
            <span>{heatgrid.totals.activeCells} active</span>
            <span>level {heatgrid.totals.maxLevel}</span>
            <span>{heatgrid.totals.hiddenTrustBoost} trust boost</span>
            <span>{heatgrid.totals.mixedRanks} mixed ranks</span>
            <span>{heatgrid.totals.providerCalls} provider calls</span>
          </div>
        </aside>
        <div className="leaderboard-heatgrid__stage">
          <div className="leaderboard-heatgrid__grid" aria-label={`${heatgrid.headline} official GitHub color cells`}>
            {heatgrid.cells.map((cell, index) => (
              <span
                className="leaderboard-heatgrid-cell"
                data-level={cell.level}
                aria-label={`${cell.label}: ${cell.value}; level ${cell.level}; ${cell.checksum}`}
                title={`${cell.label}: ${cell.value}`}
                style={{
                  "--i": index,
                  "--gh": cell.color,
                  "--meter": `${cell.meter}%`,
                } as CSSProperties}
                key={cell.id}
              />
            ))}
          </div>
          <div className="leaderboard-heatgrid__legend" aria-label="Official GitHub contribution color levels">
            {BOARD_HEATGRID_COLORS.map((color, level) => (
              <span style={{ "--gh": color } as CSSProperties} key={color}>
                <i />
                L{level}
              </span>
            ))}
          </div>
          <div className="leaderboard-heatgrid__lanes" aria-label={`${heatgrid.headline} proof lanes`}>
            {heatgrid.lanes.map((lane, index) => (
              <article
                className="leaderboard-heatgrid-lane"
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
                <i>{lane.mark}</i>
                <span>{lane.label}</span>
                <b>{lane.value}</b>
                <p>{lane.note}</p>
                <em aria-label={`${lane.label} heatgrid lane meter ${lane.meter} percent`} />
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function LeaderboardBroadcastWallPanel({ wall }: { wall: LeaderboardBroadcastWall }) {
  return (
    <section className="leaderboard-broadcast-wall" aria-label={`${wall.headline} public broadcast wall`}>
      <div className="leaderboard-broadcast-wall__head">
        <div>
          <span>VTK://BROADCAST-WALL//PUBLIC-SIGNAL//C0VIBE.APP</span>
          <b>{wall.headline}</b>
        </div>
        <p>{wall.subline}</p>
      </div>
      <div className="leaderboard-broadcast-wall__body">
        <aside className="leaderboard-broadcast-terminal" aria-label={`${wall.headline} terminal`}>
          <div className="console-top"><span>broadcast@leaderboard</span><b>C0VIBE</b></div>
          <pre>{wall.terminalLines.join("\n")}</pre>
          <div className="leaderboard-broadcast-ticker">{wall.ticker}</div>
          <div className="leaderboard-signal-tape" aria-label={`${wall.headline} signal tape`}>
            {wall.signalTape.map((item, index) => (
              <article
                data-impact={item.impact}
                style={{
                  "--i": index,
                  "--meter": `${item.meter}%`,
                  "--brand-from": item.from,
                  "--brand-to": item.to,
                  "--brand-ink": item.ink,
                } as CSSProperties}
                key={item.id}
              >
                <i>{item.mark}</i>
                <span>{item.label}</span>
                <code>{item.command}</code>
                <b>{item.value}</b>
                <em aria-label={`${item.label} signal meter ${item.meter} percent`} />
                <small>{item.note}</small>
              </article>
            ))}
          </div>
        </aside>
        <div className="leaderboard-broadcast-grid">
          {wall.cards.length ? wall.cards.map((card, index) => (
            <a
              className={`leaderboard-broadcast-card leaderboard-broadcast-card--${card.tone}`}
              data-impact={card.impact}
              href={`/u/${card.handle.slice(1)}`}
              style={{ "--i": index, "--meter": `${card.meter}%` } as CSSProperties}
              key={card.id}
            >
              <span>{card.rank}</span>
              <b>{card.handle}</b>
              <strong>{card.spend}</strong>
              <small>{card.ops} · {card.gap}</small>
              <p>{card.note}</p>
              <i aria-label={`${card.handle} broadcast meter ${card.meter} percent`} />
            </a>
          )) : (
            <article className="leaderboard-broadcast-empty">
              <span>--</span>
              <b>Board waiting</b>
              <p>Ranked usage rows will populate this wall after the separated trust tier receives public entries.</p>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}

function LeaderboardProofTowerPanel({ tower }: { tower: LeaderboardProofTower }) {
  return (
    <section className="leaderboard-proof-tower" aria-label={`${tower.headline} public proof tower`}>
      <div className="leaderboard-proof-tower__head">
        <div>
          <span>VTK://PROOF-TOWER//PUBLIC-RANKS//NO-MIXED-TIERS</span>
          <b>{tower.headline}</b>
        </div>
        <p>{tower.subline}</p>
      </div>
      <div className="leaderboard-proof-tower__body">
        <aside className="leaderboard-proof-terminal" aria-label={`${tower.headline} terminal`}>
          <div className="console-top"><span>tower@leaderboard</span><b>NO TRUST BOOST</b></div>
          <pre>{tower.terminalLines.join("\n")}</pre>
          <div className="leaderboard-proof-totals" aria-label={`${tower.headline} safety totals`}>
            <span>{tower.totals.rankedOperators} ranked</span>
            <span>{tower.totals.podiumOperators} podium</span>
            <span>{formatUsd(tower.totals.podiumUsd)} podium</span>
            <span>{tower.totals.hiddenTrustBoost} trust boost</span>
            <span>{tower.totals.mixedRanks} mixed ranks</span>
          </div>
        </aside>
        <div className="leaderboard-proof-stage">
          <div className="leaderboard-proof-beams" aria-label={`${tower.headline} podium beams`}>
            {tower.beams.length ? tower.beams.map((beam, index) => (
              <a
                className={`leaderboard-proof-beam leaderboard-proof-beam--${beam.impact}`}
                data-impact={beam.railLabel}
                href={`/u/${beam.handle.slice(1)}`}
                style={{
                  "--i": index,
                  "--meter": `${beam.meter}%`,
                  "--brand-from": beam.from,
                  "--brand-to": beam.to,
                  "--brand-ink": beam.ink,
                } as CSSProperties}
                key={beam.id}
              >
                <div className="leaderboard-proof-beam__top">
                  <span>{beam.rank}</span>
                  <b>{beam.handle}</b>
                  <i>{beam.railLabel}</i>
                </div>
                <div className="leaderboard-proof-beam__screen" aria-hidden="true">
                  {beam.frames.map((frame, frameIndex) => (
                    <pre style={{ "--f": frameIndex } as CSSProperties} key={`${beam.id}-${frameIndex}`}>
                      {frame}
                    </pre>
                  ))}
                </div>
                <strong>{beam.spend}</strong>
                <small>{beam.ops} · {beam.checksum}</small>
                <p>{beam.note}</p>
                <em aria-label={`${beam.handle} proof beam meter ${beam.meter} percent`} />
              </a>
            )) : (
              <article className="leaderboard-proof-empty">
                <span>--</span>
                <b>Tower armed</b>
                <p>Rank beams appear only after this separated trust tier has public ranked usage rows.</p>
              </article>
            )}
          </div>
          <div className="leaderboard-proof-guards" aria-label={`${tower.headline} guard rails`}>
            {tower.guards.map((guard, index) => (
              <article
                data-impact={guard.impact}
                style={{
                  "--i": index,
                  "--meter": `${guard.meter}%`,
                  "--brand-from": guard.from,
                  "--brand-to": guard.to,
                  "--brand-ink": guard.ink,
                } as CSSProperties}
                key={guard.id}
              >
                <i>{guard.mark}</i>
                <span>{guard.label}</span>
                <b>{guard.value}</b>
                <small>{guard.note}</small>
                <em aria-label={`${guard.label} guard meter ${guard.meter} percent`} />
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function LaunchCapsulePanel({ capsule }: { capsule: LaunchCapsule }) {
  return (
    <section className="launch-capsule" aria-label="VibeTRACKER launch capsule">
      <div className="launch-capsule__head">
        <span>VTK://LAUNCH-CAPSULE//TERMINAL-GUI//C0VIBE.APP</span>
        <b>{capsule.headline}</b>
      </div>
      <div className="launch-capsule__body">
        <aside className="launch-capsule__terminal" aria-label="Launch capsule terminal">
          <div className="console-top"><span>launch@local</span><b>VIBERS UNITE</b></div>
          <pre>{capsule.terminalLines.join("\n")}</pre>
          <p>{capsule.subline}</p>
        </aside>
        <div className="launch-capsule__lanes">
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
                  <span>{lane.impact === "trust" ? "NOT USAGE" : lane.impact.replace("_", " ")}</span>
                  <b>{lane.label}</b>
                </div>
              </div>
              <pre aria-hidden="true">{lane.ascii.join("\n")}</pre>
              <strong>{lane.value}</strong>
              <code>{lane.command}</code>
              <p>{lane.note}</p>
              <footer aria-label={`${lane.label} readiness ${lane.meter} percent`}>
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

function AiLifeCockpitPanel({ cockpit }: { cockpit: AiLifeCockpit }) {
  return (
    <section className="ai-life-cockpit" aria-label="AI life cockpit">
      <div className="ai-life-cockpit__head">
        <span>VTK://AI-LIFE-COCKPIT//CREATORS-CODERS-LOCAL-GLOBAL</span>
        <b>{cockpit.headline}</b>
      </div>
      <div className="ai-life-cockpit__body">
        <aside className="ai-life-cockpit__terminal" aria-label="AI life cockpit terminal">
          <div className="console-top"><span>life@vibetracker</span><b>VIBERS UNITE</b></div>
          <pre>{cockpit.terminalLines.join("\n")}</pre>
          <div className="ai-life-cockpit__totals" aria-label="AI life catalog totals">
            <span>{cockpit.totals.providers} providers</span>
            <span>{cockpit.totals.built} built</span>
            <span>{cockpit.totals.verified} verified</span>
            <span>{cockpit.totals.local} local</span>
            <span>{cockpit.totals.manual} manual</span>
          </div>
          <p>{cockpit.subline}</p>
        </aside>
        <div className="ai-life-cockpit__lanes">
          {cockpit.lanes.map((lane, index) => (
            <article
              className={`ai-life-lane ai-life-lane--${lane.impact}`}
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
              <div className="ai-life-lane__top">
                <i>{lane.mark}</i>
                <div>
                  <span>{lane.railLabel}</span>
                  <b>{lane.label}</b>
                </div>
                <strong>{lane.value}</strong>
              </div>
              <div className="ai-life-lane__screen" aria-hidden="true">
                <pre>{lane.ascii.join("\n")}</pre>
              </div>
              <div className="ai-life-lane__providers" aria-label={`${lane.label} source marks`}>
                {lane.providers.slice(0, 6).map((provider) => (
                  <i
                    style={{
                      "--brand-from": provider.from,
                      "--brand-to": provider.to,
                      "--brand-ink": provider.ink,
                    } as CSSProperties}
                    title={`${provider.label}: ${provider.method}`}
                    key={`${lane.id}-${provider.id}`}
                  >
                    {provider.mark}
                  </i>
                ))}
              </div>
              <code>{lane.command}</code>
              <p>{lane.note}</p>
              <small>{lane.guardrail}</small>
              <div className="ai-life-lane__meter" aria-label={`${lane.label} cockpit meter ${lane.meter} percent`}>
                <i />
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="ai-life-cockpit__rhythm" aria-label="AI life cockpit rhythm rail">
        {cockpit.rhythm.map((item, index) => (
          <article className={`ai-life-rhythm ai-life-rhythm--${item.impact}`} style={{ "--i": index } as CSSProperties} key={item.id}>
            <span>{item.label}</span>
            <b>{item.value}</b>
            <p>{item.note}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function SurpriseTransmissionRibbonPanel({ ribbon }: { ribbon: CollectionTransmissionRibbon }) {
  return (
    <section className="surprise-transmission" aria-label="First-screen scan surprise transmission ribbon">
      <div className="surprise-transmission__head">
        <span>VTK://SURPRISE-RIBBON//FIRST-SCREEN//NO-FAKE-SPEND</span>
        <b>{ribbon.headline}</b>
      </div>
      <div className="surprise-transmission__body">
        <aside className="surprise-transmission__terminal" aria-label="Surprise transmission terminal">
          <div className="console-top"><span>surprise@local</span><b>VIBERS UNITE</b></div>
          <pre>{ribbon.terminalLines.join("\n")}</pre>
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
                <i>{step.status}</i>
                <strong>{step.label}</strong>
                <code>{step.command}</code>
                <p>{step.cue}</p>
                <small>{step.guardrail}</small>
              </div>
              <div className="surprise-transmission-step__marks" aria-label={`${step.label} transmission marks`}>
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
              <div className="surprise-transmission-step__meter" aria-label={`${step.label} transmission meter ${step.meter} percent`}>
                <i />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HeroScanBridgePanel({ bridge }: { bridge: CollectionHeroScanBridge }) {
  return (
    <div className="hero-scan-bridge" aria-label="First-screen scan surprise bridge">
      <div className="hero-scan-bridge__head">
        <div>
          <span>VTK://HERO-SCAN-BRIDGE//VISUAL-ONLY//C0VIBE.APP</span>
          <b>{bridge.headline}</b>
        </div>
        <p>{bridge.motto}</p>
      </div>
      <div className="hero-scan-bridge__body">
        <aside className="hero-scan-bridge__terminal" aria-label={`${bridge.headline} terminal`}>
          <div className="console-top"><span>hero-scan@local</span><b>NO USAGE WRITES</b></div>
          <pre>{bridge.terminalLines.join("\n")}</pre>
          <div className="hero-scan-bridge__totals" aria-label={`${bridge.headline} safety totals`}>
            <span>{bridge.totals.stages} stages</span>
            <span>{bridge.totals.surprises} surprises</span>
            <span>{bridge.totals.usage} usage</span>
            <span>{bridge.totals.notUsage} not usage</span>
            <span>{bridge.totals.publish} publish</span>
            <span>{bridge.totals.usageWrites} writes</span>
          </div>
          <p>{bridge.subline}</p>
        </aside>
        <div className="hero-scan-bridge__stages" aria-label={`${bridge.headline} surprise stages`}>
          {bridge.stages.map((stage, index) => (
            <article
              className={`hero-scan-stage hero-scan-stage--${stage.impact}`}
              data-rail={stage.railLabel}
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
              <div className="hero-scan-stage__top">
                <span>{stage.stage}</span>
                <b>{stage.gate}</b>
                <i>{stage.railLabel}</i>
              </div>
              <div className="hero-scan-stage__screen" aria-hidden="true">
                {stage.frames.map((frame, frameIndex) => (
                  <pre style={{ "--f": frameIndex } as CSSProperties} key={`${stage.id}-${frameIndex}`}>
                    {frame}
                  </pre>
                ))}
              </div>
              <div className="hero-scan-stage__copy">
                <strong>{stage.label}</strong>
                <code>{stage.command}</code>
                <p>{stage.cue}</p>
                <small>{stage.guardrail}</small>
              </div>
              <pre className="hero-scan-stage__lines" aria-label={`${stage.label} hero scan lines`}>
                {stage.terminalLines.join("\n")}
              </pre>
              <div className="hero-scan-stage__marks" aria-label={`${stage.label} provider marks`}>
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
              <div className="hero-scan-stage__meter" aria-label={`${stage.label} hero scan meter ${stage.meter} percent`}>
                <i />
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function HomeControlTowerPanel({ tower }: { tower: HomeControlTower }) {
  const ledgerRows = [
    ["provider calls", tower.totals.providerCalls],
    ["ledger writes", tower.totals.ledgerWrites],
    ["hidden uploads", tower.totals.hiddenUploads],
    ["prompt reads", tower.totals.promptReads],
    ["output reads", tower.totals.outputReads],
    ["publish writes", tower.totals.publishWrites],
  ] as const;

  return (
    <section className="home-control-tower" aria-label="VibeTRACKER route control tower">
      <div className="home-control-tower__head">
        <div>
          <span>VTK://HOME-CONTROL-TOWER//ROUTE-FLIGHT-DECK//NO-HIDDEN-SYNC</span>
          <b>{tower.headline}</b>
        </div>
        <p>{tower.subline}</p>
      </div>
      <div className="home-control-tower__body">
        <aside className="home-control-tower__terminal" aria-label={`${tower.headline} terminal`}>
          <div className="console-top"><span>tower@vibetracker</span><b>VIBERS UNITE</b></div>
          <pre>{tower.terminalLines.join("\n")}</pre>
          <div className="home-control-tower__totals" aria-label={`${tower.headline} route totals`}>
            <span>{tower.totals.decks} decks</span>
            <span>{tower.totals.routes} routes</span>
            <span>{tower.totals.notUsageDecks} not usage</span>
            <span>{tower.totals.localOnlyDecks} local only</span>
            <span>{tower.totals.hiddenUploads} hidden uploads</span>
          </div>
        </aside>
        <div className="home-control-tower__decks" aria-label={`${tower.headline} route decks`}>
          {tower.decks.map((deck, index) => (
            <a
              className={`home-control-deck home-control-deck--${deck.rail}`}
              data-rail={deck.rail === "local_only" ? "LOCAL ONLY" : deck.rail.toUpperCase()}
              href={deck.href}
              style={{
                "--i": index,
                "--meter": `${deck.meter}%`,
                "--brand-from": deck.from,
                "--brand-to": deck.to,
                "--brand-ink": deck.ink,
              } as CSSProperties}
              key={deck.id}
            >
              <div className="home-control-deck__top">
                <i>{deck.mark}</i>
                <div>
                  <span>{deck.status}</span>
                  <b>{deck.label}</b>
                </div>
              </div>
              <div className="home-control-deck__screen" aria-hidden="true">
                {deck.frames.map((frame, frameIndex) => (
                  <pre style={{ "--f": frameIndex } as CSSProperties} key={`${deck.id}-${frameIndex}`}>
                    {frame}
                  </pre>
                ))}
              </div>
              <code>{deck.command}</code>
              <p>{deck.note}</p>
              <div className="home-control-deck__checks" aria-label={`${deck.label} checks`}>
                {deck.checks.map((check) => <span key={`${deck.id}-${check}`}>{check}</span>)}
              </div>
              <footer aria-label={`${deck.label} route meter ${deck.meter} percent`}>
                <em />
                <strong>{deck.route}</strong>
              </footer>
            </a>
          ))}
        </div>
        <aside className="home-control-ledger" aria-label="Control tower side-effect ledger">
          <div>
            <span>VTK://VISIBLE-LEDGER//FIRST-SCREEN</span>
            <b>{tower.totals.zeroSideEffects ? "0" : "!"}</b>
            <p>total preview side effects</p>
          </div>
          {ledgerRows.map(([label, value]) => (
            <span key={label}>
              <strong>{value}</strong>
              {label}
            </span>
          ))}
          <footer>
            <b>Vibers Unite</b>
            <a href="https://c0vibe.app">c0vibe.app</a>
          </footer>
        </aside>
      </div>
    </section>
  );
}

function HomeDatastreamReactorPanel({ reactor }: { reactor: HomeDatastreamReactor }) {
  return (
    <section className="home-datastream-reactor" aria-label="Reviewed usage datastream reactor">
      <div className="home-datastream-reactor__head">
        <div>
          <span>VTK://DATASTREAM-REACTOR//SCORE-PROFILE-HEATGRID//C0VIBE</span>
          <b>{reactor.headline}</b>
        </div>
        <p>{reactor.subline}</p>
      </div>
      <div className="home-datastream-reactor__body">
        <aside className="home-datastream-reactor__terminal" aria-label={`${reactor.headline} terminal`}>
          <div className="console-top"><span>reactor@vibetracker</span><b>REVIEWED STREAM</b></div>
          <pre>{reactor.terminalLines.join("\n")}</pre>
          <div className="home-datastream-reactor__totals" aria-label={`${reactor.headline} feed totals`}>
            <span>{reactor.totals.nodes} nodes</span>
            <span>{reactor.totals.scoreFeeds} score feeds</span>
            <span>{reactor.totals.profileFeeds} profile feeds</span>
            <span>{reactor.totals.heatgridFeeds} heatgrid feeds</span>
            <span>{reactor.totals.publicRelayFeeds} relay feeds</span>
            <span>{reactor.totals.notUsageNodes} not usage</span>
          </div>
          <div className="home-datastream-reactor__seals" aria-label={`${reactor.headline} zero side-effect seals`}>
            {reactor.seals.map((seal) => (
              <span key={seal}>{seal}</span>
            ))}
          </div>
        </aside>
        <div className="home-datastream-reactor__core" aria-label="Datastream reactor core">
          <div className="home-datastream-reactor__orbit" aria-hidden="true">
            <i />
            <i />
            <i />
            <strong>C0</strong>
            <span>score</span>
            <span>profile</span>
            <span>heatgrid</span>
            <span>relay</span>
          </div>
          <div className="home-datastream-reactor__nodes" aria-label={`${reactor.headline} nodes`}>
            {reactor.nodes.map((node, index) => (
              <article
                className={`home-datastream-node home-datastream-node--${node.impact}`}
                data-rail={node.railLabel}
                style={{
                  "--i": index,
                  "--meter": `${node.meter}%`,
                  "--brand-from": node.from,
                  "--brand-to": node.to,
                  "--brand-ink": node.ink,
                } as CSSProperties}
                key={node.id}
              >
                <div className="home-datastream-node__top">
                  <i>{node.mark}</i>
                  <div>
                    <span>{node.status}</span>
                    <b>{node.label}</b>
                  </div>
                </div>
                <div className="home-datastream-node__screen" aria-hidden="true">
                  {node.frames.map((frame, frameIndex) => (
                    <pre style={{ "--f": frameIndex } as CSSProperties} key={`${node.id}-${frameIndex}`}>
                      {frame}
                    </pre>
                  ))}
                </div>
                <code>{node.command}</code>
                <p>{node.note}</p>
                <div className="home-datastream-node__feeds" aria-label={`${node.label} feed map`}>
                  <span data-on={node.feeds.score}>score</span>
                  <span data-on={node.feeds.profile}>profile</span>
                  <span data-on={node.feeds.heatgrid}>heatgrid</span>
                  <span data-on={node.feeds.leaderboard}>board</span>
                  <span data-on={node.feeds.publicRelay}>relay</span>
                </div>
                <footer aria-label={`${node.label} reactor meter ${node.meter} percent`}>
                  <em />
                  <strong>{node.railLabel}</strong>
                </footer>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeMissionSpinePanel({ spine }: { spine: HomeMissionSpine }) {
  return (
    <section className="home-mission-spine" aria-label="VibeTRACKER mission spine">
      <div className="home-mission-spine__head">
        <div>
          <span>VTK://MISSION-SPINE//FIRST-SCREEN//C0VIBE.APP</span>
          <b>{spine.headline}</b>
        </div>
        <p>{spine.subline}</p>
      </div>
      <div className="home-mission-spine__body">
        <aside className="home-mission-spine__terminal" aria-label={`${spine.headline} terminal`}>
          <div className="console-top"><span>mission@vibetracker</span><b>VIBERS UNITE</b></div>
          <pre>{spine.terminalLines.join("\n")}</pre>
          <div className="home-mission-spine__totals" aria-label={`${spine.headline} feed totals`}>
            <span>{spine.totals.cells} cells</span>
            <span>{spine.totals.scoreFeeds} score feeds</span>
            <span>{spine.totals.profileFeeds} profile feeds</span>
            <span>{spine.totals.leaderboardFeeds} board feeds</span>
            <span>{spine.totals.publicRelayFeeds} relay feeds</span>
            <span>{spine.totals.notUsageCells} not usage</span>
            <span>{spine.totals.localOnlyCells} local only</span>
            <span>{spine.totals.hiddenUploads} hidden uploads</span>
          </div>
        </aside>
        <div className="home-mission-spine__cells" aria-label={`${spine.headline} labelled feed cells`}>
          {spine.cells.map((cell, index) => (
            <article
              className={`home-mission-cell home-mission-cell--${cell.impact}`}
              data-impact={cell.impact === "local_only" ? "LOCAL ONLY" : cell.impact.toUpperCase()}
              style={{
                "--i": index,
                "--meter": `${cell.meter}%`,
                "--brand-from": cell.from,
                "--brand-to": cell.to,
                "--brand-ink": cell.ink,
              } as CSSProperties}
              key={cell.id}
            >
              <div className="home-mission-cell__top">
                <i>{cell.mark}</i>
                <div>
                  <span>{cell.status}</span>
                  <b>{cell.label}</b>
                </div>
              </div>
              <div className="home-mission-cell__scope" aria-hidden="true">
                {cell.frames.map((frame, frameIndex) => (
                  <pre style={{ "--f": frameIndex } as CSSProperties} key={`${cell.id}-${frameIndex}`}>
                    {frame}
                  </pre>
                ))}
              </div>
              <code>{cell.command}</code>
              <p>{cell.note}</p>
              <div className="home-mission-cell__feeds" aria-label={`${cell.label} feed map`}>
                <span data-on={cell.feeds.score}>score</span>
                <span data-on={cell.feeds.profile}>profile</span>
                <span data-on={cell.feeds.leaderboard}>board</span>
                <span data-on={cell.feeds.publicRelay}>relay</span>
              </div>
              <footer aria-label={`${cell.label} readiness ${cell.meter} percent`}>
                <em />
                <strong>{cell.meter}%</strong>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomeCommandPalettePanel({ palette }: { palette: HomeCommandPalette }) {
  return (
    <section className="home-command-palette" aria-label="First-screen guarded command palette">
      <div className="home-command-palette__head">
        <div>
          <span>VTK://COMMAND-PALETTE//FIRST-SCREEN//NO-HIDDEN-WRITES</span>
          <b>{palette.headline}</b>
        </div>
        <p>{palette.subline}</p>
      </div>
      <div className="home-command-palette__body">
        <aside className="home-command-palette__terminal" aria-label={`${palette.headline} terminal`}>
          <div className="console-top"><span>palette@local</span><b>GUARDED</b></div>
          <pre>{palette.terminalLines.join("\n")}</pre>
          <div className="home-command-palette__totals" aria-label={`${palette.headline} safety totals`}>
            <span>{palette.totals.actions} commands</span>
            <span>{palette.totals.localFirst} local first</span>
            <span>{palette.totals.notUsage} not usage</span>
            <span>{palette.totals.previewProviderCalls} preview calls</span>
            <span>{palette.totals.previewLedgerWrites} preview writes</span>
            <span>{palette.totals.hiddenUploads} hidden uploads</span>
          </div>
        </aside>
        <div className="home-command-palette__actions" aria-label={`${palette.headline} guarded actions`}>
          {palette.actions.map((action, index) => (
            <article
              className={`home-command-palette-action home-command-palette-action--${action.impact}`}
              data-impact={action.impact === "not_usage" ? "NOT USAGE" : action.impact.replace("_", " ").toUpperCase()}
              style={{
                "--i": index,
                "--meter": `${action.meter}%`,
                "--brand-from": action.from,
                "--brand-to": action.to,
                "--brand-ink": action.ink,
              } as CSSProperties}
              key={action.id}
            >
              <div className="home-command-palette-action__top">
                <i>{action.mark}</i>
                <div>
                  <span>{action.chord}</span>
                  <b>{action.label}</b>
                </div>
              </div>
              <div className="home-command-palette-action__screen" aria-hidden="true">
                {action.frames.map((frame, frameIndex) => (
                  <pre style={{ "--f": frameIndex } as CSSProperties} key={`${action.id}-${frameIndex}`}>
                    {frame}
                  </pre>
                ))}
              </div>
              <code>{action.command}</code>
              <p>{action.cue}</p>
              <small>{action.guardrail}</small>
              <pre className="home-command-palette-action__line" aria-label={`${action.label} terminal line`}>
                {action.terminalLine}
              </pre>
              <footer aria-label={`${action.label} readiness ${action.meter} percent`}>
                <em />
                <strong>{action.meter}%</strong>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomeScanConductorPanel({ conductor }: { conductor: HomeScanConductor }) {
  return (
    <section className="home-scan-conductor" aria-label="Scan conductor surprise rail">
      <div className="home-scan-conductor__head">
        <div>
          <span>VTK://SCAN-CONDUCTOR//NO-HIDDEN-SIDE-EFFECTS//C0VIBE.APP</span>
          <b>{conductor.headline}</b>
        </div>
        <p>{conductor.subline}</p>
      </div>
      <div className="home-scan-conductor__body">
        <aside className="home-scan-conductor__terminal" aria-label={`${conductor.headline} terminal`}>
          <div className="console-top"><span>conductor@local</span><b>ZERO PREVIEW WRITES</b></div>
          <pre>{conductor.terminalLines.join("\n")}</pre>
          <div className="home-scan-conductor__totals" aria-label={`${conductor.headline} safety totals`}>
            <span>{conductor.totals.beats} beats</span>
            <span>{conductor.totals.surprises} surprises</span>
            <span>{conductor.totals.previewProviderCalls} preview calls</span>
            <span>{conductor.totals.previewLedgerWrites} preview writes</span>
            <span>{conductor.totals.hiddenUploads} hidden uploads</span>
            <span>{conductor.totals.usageCommands} usage command</span>
            <span>{conductor.totals.notUsageRails} not usage rail</span>
          </div>
        </aside>
        <div className="home-scan-conductor__beats" aria-label={`${conductor.headline} beats`}>
          {conductor.beats.map((beat, index) => (
            <article
              className={`home-scan-conductor-beat home-scan-conductor-beat--${beat.impact}`}
              data-rail={beat.railLabel}
              style={{
                "--i": index,
                "--meter": `${beat.meter}%`,
                "--brand-from": beat.from,
                "--brand-to": beat.to,
                "--brand-ink": beat.ink,
              } as CSSProperties}
              key={beat.id}
            >
              <div className="home-scan-conductor-beat__top">
                <i>{beat.mark}</i>
                <div>
                  <span>{beat.railLabel}</span>
                  <b>{beat.label}</b>
                </div>
              </div>
              <div className="home-scan-conductor-beat__scope" aria-hidden="true">
                {beat.pulse.map((frame, frameIndex) => (
                  <pre style={{ "--f": frameIndex } as CSSProperties} key={`${beat.id}-${frameIndex}`}>
                    {frame}
                  </pre>
                ))}
              </div>
              <code>{beat.command}</code>
              <p>{beat.cue}</p>
              <small>{beat.guardrail}</small>
              <div className="home-scan-conductor-beat__transcript" aria-label={`${beat.label} transcript`}>
                {beat.transcript.map((line) => (
                  <span key={`${beat.id}-${line}`}>{line}</span>
                ))}
              </div>
              <footer aria-label={`${beat.label} preview side effects`}>
                <em>{beat.preview.providerCalls} calls</em>
                <em>{beat.preview.ledgerWrites} writes</em>
                <em>{beat.preview.uploads} uploads</em>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomeProofHudPanel({ hud }: { hud: HomeProofHud }) {
  return (
    <section className="home-proof-hud" aria-label="VibeTRACKER proof HUD">
      <div className="home-proof-hud__head">
        <div>
          <span>VTK://PROOF-HUD//DATASTREAM-TRUTH//NO-MIXED-SIGNALS</span>
          <b>{hud.headline}</b>
        </div>
        <p>{hud.subline}</p>
      </div>
      <div className="home-proof-hud__body">
        <aside className="home-proof-hud__terminal" aria-label={`${hud.headline} terminal`}>
          <div className="console-top"><span>proof@local</span><b>TRUTH TABLE</b></div>
          <pre>{hud.terminalLines.join("\n")}</pre>
          <div className="home-proof-hud__totals" aria-label={`${hud.headline} datastream totals`}>
            <span>{hud.totals.channels} channels</span>
            <span>{hud.totals.scoreFeeds} score feeds</span>
            <span>{hud.totals.profileFeeds} profile feeds</span>
            <span>{hud.totals.leaderboardFeeds} board feeds</span>
            <span>{hud.totals.publicRelayFeeds} relay feeds</span>
            <span>{hud.totals.notUsageChannels} not usage</span>
            <span>{hud.totals.hiddenUploads} hidden uploads</span>
          </div>
        </aside>
        <div className="home-proof-hud__matrix" aria-label={`${hud.headline} channel matrix`}>
          {hud.channels.map((channel, index) => (
            <article
              className={`home-proof-channel home-proof-channel--${channel.impact}`}
              data-status={channel.status}
              style={{
                "--i": index,
                "--meter": `${channel.meter}%`,
                "--brand-from": channel.from,
                "--brand-to": channel.to,
                "--brand-ink": channel.ink,
              } as CSSProperties}
              key={channel.id}
            >
              <div className="home-proof-channel__top">
                <i>{channel.mark}</i>
                <div>
                  <span>{channel.status}</span>
                  <b>{channel.label}</b>
                </div>
              </div>
              <code>{channel.command}</code>
              <p>{channel.note}</p>
              <div className="home-proof-channel__readout" aria-label={`${channel.label} readout`}>
                {channel.readout.map((line) => (
                  <span key={`${channel.id}-${line}`}>{line}</span>
                ))}
              </div>
              <div className="home-proof-channel__feeds" aria-label={`${channel.label} feed switches`}>
                <em data-on={channel.feeds.score}>score</em>
                <em data-on={channel.feeds.profile}>profile</em>
                <em data-on={channel.feeds.leaderboard}>board</em>
                <em data-on={channel.feeds.publicRelay}>relay</em>
              </div>
              <footer aria-label={`${channel.label} proof confidence ${channel.meter} percent`}>
                <span />
                <strong>{channel.meter}%</strong>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ScanCommandRunwayPanel({ runway }: { runway: ScanCommandRunway }) {
  return (
    <section className="scan-command-runway" aria-label="Scan command runway">
      <div className="scan-command-runway__head">
        <div>
          <span>VTK://SCAN-COMMAND-RUNWAY//VISUAL-ONLY//C0VIBE.APP</span>
          <b>{runway.headline}</b>
        </div>
        <p>{runway.subline}</p>
      </div>
      <div className="scan-command-runway__body">
        <aside className="scan-command-runway__terminal" aria-label="Scan command runway terminal">
          <div className="console-top"><span>runway@local</span><b>NO HIDDEN UPLOAD</b></div>
          <pre>{runway.terminalLines.join("\n")}</pre>
          <div className="scan-command-runway__totals" aria-label="Scan command runway safety totals">
            <span>{runway.totals.steps} phases</span>
            <span>{runway.totals.visualOnly} visual only</span>
            <span>{runway.totals.providerCalls} provider calls</span>
            <span>{runway.totals.ledgerWrites} ledger writes</span>
            <span>{runway.totals.hiddenUpload} hidden uploads</span>
          </div>
        </aside>
        <div className="scan-command-runway__steps" aria-label="Scan command phases">
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
              <div className="scan-command-runway-step__transcript" aria-label={`${step.label} terminal transcript`}>
                {step.transcript.map((line) => (
                  <span key={`${step.id}-${line}`}>{line}</span>
                ))}
              </div>
              <div className="scan-command-runway-step__meter" aria-label={`${step.label} readiness ${step.meter} percent`}>
                <i />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ScannerSurpriseDirectorPanel({ director }: { director: CollectionSurpriseDirector }) {
  return (
    <section className="scanner-surprise-director" aria-label="Scanner surprise director">
      <div className="scanner-surprise-director__head">
        <div>
          <span>VTK://SURPRISE-DIRECTOR//SHOWRUN//NO-FAKE-PROOF</span>
          <b>{director.headline}</b>
        </div>
        <p>{director.subline}</p>
      </div>
      <div className="scanner-surprise-director__body">
        <aside className="scanner-surprise-director__terminal" aria-label="Scanner surprise director terminal">
          <div className="console-top"><span>director@local</span><b>VIBERS UNITE</b></div>
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

function CollectionSurpriseCascadePanel({ cascade }: { cascade: CollectionSurpriseCascade }) {
  return (
    <section className="collection-surprise-cascade" aria-label="Collection surprise cascade">
      <div className="collection-surprise-cascade__head">
        <div>
          <span>VTK://SURPRISE-CASCADE//SCAN-COLLECT//NO-FAKE-PROOF</span>
          <b>{cascade.headline}</b>
        </div>
        <p>{cascade.subline}</p>
      </div>
      <div className="collection-surprise-cascade__body">
        <aside className="collection-surprise-cascade__terminal" aria-label="Surprise cascade terminal">
          <div className="console-top"><span>cascade@local</span><b>VIBERS UNITE</b></div>
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

function CollectionFlightRecorderPanel({ recorder, tape }: { recorder: CollectionFlightRecorderDeck; tape: CollectionEventTape }) {
  return (
    <section className="collection-flight-recorder" aria-label="Collection surprise flight recorder">
      <div className="collection-flight-recorder__head">
        <div>
          <span>VTK://SURPRISE-FLIGHT-RECORDER//GUI//NO-FAKE-PROOF</span>
          <b>{recorder.headline}</b>
        </div>
        <p>{recorder.subline}</p>
      </div>
      <div className="collection-flight-recorder__body">
        <aside className="collection-flight-recorder__terminal" aria-label="Surprise flight recorder terminal">
          <div className="console-top"><span>flight@local</span><b>VISUAL ONLY</b></div>
          <pre>{recorder.terminalLines.join("\n")}</pre>
          <div className="collection-flight-recorder__totals" aria-label="Surprise flight recorder totals">
            <span>{recorder.totals.events} events</span>
            <span>{recorder.totals.usage} usage</span>
            <span>{recorder.totals.notUsage} not usage</span>
            <span>{recorder.totals.localOnly} local</span>
            <span>{recorder.totals.publish} publish</span>
            <span>{recorder.totals.writes} writes</span>
          </div>
          <div className="collection-control-tape" aria-label="Collection control tape">
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
          <div className="collection-event-tape" aria-label="Compact collection event tape">
            <div className="collection-event-tape__head">
              <span>{tape.headline}</span>
              <b>{tape.totals.usageWrites} writes</b>
            </div>
            <pre>{tape.terminalLines.join("\n")}</pre>
            <div className="collection-event-tape__rows">
              {tape.rows.map((row, index) => (
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
        <div className="collection-flight-events" aria-label="Recorded visual-only scan surprise events">
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

function CollectionSignalStackPanel({ stack }: { stack: CollectionSignalStack }) {
  return (
    <section className="collection-signal-stack" aria-label="Collection signal stack control room">
      <div className="collection-signal-stack__head">
        <span>VTK://SIGNAL-STACK//GUI-TERMINAL//NO-MIXED-RAILS</span>
        <b>{stack.headline}</b>
      </div>
      <div className="collection-signal-stack__body">
        <aside className="collection-signal-stack__terminal" aria-label="Signal stack terminal transcript">
          <div className="console-top"><span>stack@local</span><b>CONTROL ROOM</b></div>
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

function CollectionSurpriseSequencerPanel({ sequencer }: { sequencer: CollectionSurpriseSequencer }) {
  return (
    <section className="collection-surprise-sequencer" aria-label="Signature surprise sequencer">
      <div className="collection-surprise-sequencer__head">
        <span>VTK://SIGNATURE-SEQUENCER//GUI//TIMED-REVEALS</span>
        <b>{sequencer.headline}</b>
      </div>
      <div className="collection-surprise-sequencer__body">
        <aside className="collection-surprise-sequencer__terminal" aria-label="Signature sequencer terminal transcript">
          <div className="console-top"><span>sequencer@local</span><b>BLINK TURN SPARK</b></div>
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
                <i>{step.impact === "trust" || step.impact === "local_only" ? "NOT USAGE" : step.impact.toUpperCase()}</i>
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

function ScanReplayRecorderPanel({ replay }: { replay: CollectionReplayDeck }) {
  return (
    <section className="scan-replay-recorder" aria-label="Live scan replay recorder">
      <div className="scan-replay-recorder__head">
        <span>VTK://SCAN-REPLAY//CLI-TO-GUI//VIBERS-UNITE</span>
        <b>{replay.headline}</b>
      </div>
      <div className="scan-replay-recorder__body">
        <aside className="scan-replay-recorder__terminal" aria-label="Scan replay terminal transcript">
          <div className="console-top"><span>replay@local</span><b>LIVE TURN</b></div>
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
                <i>{lane.impact === "trust" || lane.impact === "local_only" ? "NOT USAGE" : lane.impact.toUpperCase()}</i>
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
  );
}

function ScannerBlackBoxPanel({ blackBox }: { blackBox: CollectionBlackBoxDeck }) {
  return (
    <section className="scanner-black-box" aria-label="Replayable scanner black box">
      <div className="scanner-black-box__head">
        <span>VTK://SCANNER-BLACK-BOX//LOCAL-REPLAY//NO-PROMPTS</span>
        <b>{blackBox.headline}</b>
      </div>
      <div className="scanner-black-box__body">
        <aside className="scanner-black-box__terminal" aria-label="Scanner black box terminal transcript">
          <div className="console-top"><span>blackbox@local</span><b>REPLAY HASH</b></div>
          <pre>{blackBox.terminalLines.join("\n")}</pre>
          <p>{blackBox.subline}</p>
        </aside>
        <div className="scanner-black-box__cells">
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
                <i>{cell.impact === "trust" || cell.impact === "local_only" ? "NOT USAGE" : cell.impact.toUpperCase()}</i>
              </div>
              <div className="scanner-black-cell__scope">
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

function CollectionEncoreRecapPanel({ recap }: { recap: CollectionEncoreRecapDeck }) {
  return (
    <section className="collection-encore-recap" aria-label="Collection encore recap">
      <div className="collection-encore-recap__head">
        <div>
          <span>VTK://COLLECTION-ENCORE//GUI-RECAP//NO-EXTRA-ROWS</span>
          <b>{recap.headline}</b>
        </div>
        <p>{recap.subline}</p>
      </div>
      <div className="collection-encore-recap__body">
        <aside className="collection-encore-recap__terminal" aria-label="Collection encore recap terminal">
          <div className="console-top"><span>encore@local</span><b>SCAN FINALE</b></div>
          <pre>{recap.terminalLines.join("\n")}</pre>
          <div className="collection-encore-recap__totals" aria-label="Collection encore recap totals">
            <span>{recap.totals.rails} rails</span>
            <span>{recap.totals.usage} usage</span>
            <span>{recap.totals.notUsage} not usage</span>
            <span>{recap.totals.publish} publish</span>
            <span>{recap.totals.replayFrames} frames</span>
            <span>{recap.totals.checksums} hashes</span>
          </div>
        </aside>
        <div className="collection-encore-recap__rails" aria-label="Collection encore recap rails">
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
  );
}

function HomeOperatorConstellationPanel({ constellation }: { constellation: HomeOperatorConstellation }) {
  return (
    <section className="home-operator-constellation" aria-label="VibeTRACKER operator constellation">
      <div className="home-operator-constellation__head">
        <div>
          <span>VTK://OPERATOR-CONSTELLATION//SOURCE-TRUTH//C0VIBE.APP</span>
          <b>{constellation.headline}</b>
        </div>
        <p>{constellation.subline}</p>
      </div>
      <div className="home-operator-constellation__body">
        <aside className="home-operator-terminal" aria-label="Operator constellation terminal">
          <div className="console-top"><span>constellation@local</span><b>VIBERS UNITE</b></div>
          <pre>{constellation.terminalLines.join("\n")}</pre>
          <div className="home-operator-rails" aria-label="Constellation data rails">
            {constellation.rails.map((rail, index) => (
              <article style={{ "--i": index } as CSSProperties} key={rail.id}>
                <span>{rail.label}</span>
                <b>{rail.value}</b>
                <small>{rail.note}</small>
              </article>
            ))}
          </div>
        </aside>
        <div className="home-operator-map" aria-label="Separated usage and trust signal map">
          {constellation.nodes.map((node, index) => (
            <article
              className={`home-operator-node home-operator-node--${node.impact}`}
              data-impact={node.impact}
              style={{
                "--i": index,
                "--meter": `${node.meter}%`,
                "--x": `${node.x}%`,
                "--y": `${node.y}%`,
                "--brand-from": node.from,
                "--brand-to": node.to,
                "--brand-ink": node.ink,
              } as CSSProperties}
              key={node.id}
            >
              <i>{node.mark}</i>
              <div>
                <span>{node.status}</span>
                <b>{node.label}</b>
              </div>
              <code>{node.command}</code>
              <p>{node.note}</p>
              <em aria-label={`${node.label} readiness ${node.meter} percent`} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

async function Board({ tier }: { tier: Tier }) {
  const tierClass = tier === "verified" ? "verified" : "self";
  let arena;
  try {
    arena = buildLeaderboardArena(tier, await getLeaderboard(tier));
  } catch (err) {
    // Surface the failure in the UI (not silent); DB unconfigured in preview shows here.
    return (
      <div className={`leaderboard-arena leaderboard-arena--${tierClass} leaderboard-arena--error`}>
        <div className="leaderboard-arena__head">
          <span>VTK://LEADERBOARD-ARENA//ERROR//NO-SILENT-FAIL</span>
          <b>{TIER_SIGNAL[tier]}</b>
        </div>
        <p className="err">Leaderboard unavailable: {(err as Error).message}</p>
      </div>
    );
  }
  const race = buildLeaderboardRaceControl(arena);
  const podiumWave = buildLeaderboardPodiumWave(arena);
  const boardHeatgrid = buildLeaderboardHeatgrid(arena);
  const broadcast = buildLeaderboardBroadcastWall(arena);
  const proofTower = buildLeaderboardProofTower(arena);
  if (!arena.rows.length) {
    return (
      <div className={`leaderboard-arena leaderboard-arena--${tierClass}`}>
        <div className="leaderboard-arena__head">
          <span>{`VTK://LEADERBOARD-ARENA//${tier.toUpperCase()}//NO-MIXED-RANKS`}</span>
          <b>{TIER_SIGNAL[tier]}</b>
        </div>
        <div className="leaderboard-arena__empty">
          <pre>{arena.terminalLines.join("\n")}</pre>
          <p>No entries yet{tier === "verified" ? " - Verified needs backend-fetched data." : "."}</p>
        </div>
        <LeaderboardRaceControlPanel race={race} />
        <LeaderboardPodiumWavePanel wave={podiumWave} />
        <LeaderboardHeatgridPanel heatgrid={boardHeatgrid} />
        <LeaderboardProofTowerPanel tower={proofTower} />
        <LeaderboardBroadcastWallPanel wall={broadcast} />
      </div>
    );
  }
  return (
    <div className={`leaderboard-arena leaderboard-arena--${tierClass}`} aria-label={`${arena.label} usage leaderboard arena`}>
      <div className="leaderboard-arena__head">
        <span>{`VTK://LEADERBOARD-ARENA//${tier.toUpperCase()}//NO-MIXED-RANKS`}</span>
        <b>{TIER_SIGNAL[tier]}</b>
      </div>
      <div className="leaderboard-arena__body">
        <aside className="leaderboard-terminal" aria-label={`${arena.label} leaderboard terminal summary`}>
          <div className="console-top"><span>board@vibetracker</span><b>{arena.label}</b></div>
          <pre>{arena.terminalLines.join("\n")}</pre>
        </aside>
        <div className="leaderboard-live">
          <div className="leaderboard-totals" aria-label={`${arena.label} leaderboard totals`}>
            <div><span>Ranked operators</span><b>{formatInt(arena.rows.length)}</b></div>
            <div><span>Spend signal</span><b>{formatUsd(arena.totalUsd)}</b></div>
            <div><span>Operations</span><b>{formatInt(arena.totalOps)}</b></div>
          </div>
          <div className="leaderboard-podium" aria-label={`${arena.label} top operators`}>
            {arena.podium.map((row, index) => (
              <a href={`/u/${row.handle}`} style={{ "--i": index } as CSSProperties} key={row.handle}>
                <span>{row.medal}</span>
                <b>@{row.handle}</b>
                <small>{formatUsd(row.total_usd)} est / {formatInt(row.record_count)} ops</small>
                <i>{formatInt(row.total_credits)} credits</i>
              </a>
            ))}
          </div>
        </div>
      </div>
      <LeaderboardRaceControlPanel race={race} />
      <LeaderboardPodiumWavePanel wave={podiumWave} />
      <LeaderboardHeatgridPanel heatgrid={boardHeatgrid} />
      <LeaderboardProofTowerPanel tower={proofTower} />
      <LeaderboardBroadcastWallPanel wall={broadcast} />
      <div className="leaderboard-table-shell">
        <table className="board">
          <thead>
            <tr>
              <th className="rank">#</th><th>Handle</th>
              <th className="num">Spend (est)</th><th className="num">Credits</th><th className="num">Ops</th>
            </tr>
          </thead>
          <tbody>
            {arena.rows.map((r) => (
              <tr key={r.handle}>
                <td className="rank">{r.medal}</td>
                <td><a href={`/u/${r.handle}`}>@{r.handle}</a></td>
                <td className="num">{formatUsd(r.total_usd)}</td>
                <td className="num">{formatInt(r.total_credits)}</td>
                <td className="num">{formatInt(r.record_count)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Home() {
  const roadmap = roadmapSummary();
  const highlights = roadmapHighlights(4);
  const commandDeck = buildHomeCommandDeck();
  const controlTower = buildHomeControlTower();
  const commandPalette = buildHomeCommandPalette();
  const missionSpine = buildHomeMissionSpine();
  const datastreamReactor = buildHomeDatastreamReactor(missionSpine);
  const scanConductor = buildHomeScanConductor();
  const proofHud = buildHomeProofHud();
  const signalTape = buildHomeSignalTape();
  const operatorConstellation = buildHomeOperatorConstellation();
  const evidence = buildEvidenceCockpit();
  const scanRoom = buildHomeScanRoom();
  const guiDoctor = buildGuiTerminalDoctor();
  const collectionRun = buildCollectionSurpriseRun();
  const heroScanBridge = buildCollectionHeroScanBridge(collectionRun);
  const collectionRibbon = buildCollectionTransmissionRibbon(collectionRun);
  const scanCommandRunway = buildScanCommandRunway();
  const collectionDirector = buildCollectionSurpriseDirector(collectionRun);
  const collectionCascade = buildCollectionSurpriseCascade(collectionRun);
  const collectionFlightRecorder = buildCollectionFlightRecorder(collectionRun);
  const collectionEventTape = buildCollectionEventTape(collectionRun);
  const collectionStack = buildCollectionSignalStack(collectionRun);
  const collectionSequencer = buildCollectionSurpriseSequencer(collectionRun);
  const collectionReplay = buildCollectionReplayDeck(collectionRun);
  const collectionBlackBox = buildCollectionBlackBox(collectionRun);
  const collectionEncoreRecap = buildCollectionEncoreRecap(collectionRun);
  const sourceAtlas = buildSourceAtlas();
  const motionLab = buildAsciiMotionLab();
  const launchCapsule = buildLaunchCapsule();
  const aiLifeCockpit = buildAiLifeCockpit();
  return (
    <>
      <UsageSignalDock />
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">VibeTRACKER operator console</p>
            <h1>Who spends the most on AI?</h1>
            <p>Coding, image, video, music, audio, 3D, local models, and global providers - one tracker. Run <code>npx vibetrack init --gui</code>.</p>
            <div className="motto-rail" aria-label="C0VIBE motto">
              <span>Vibers Unite</span>
              <a href="https://c0vibe.app">c0vibe.app</a>
            </div>
          </div>
          <div className="ascii-console" aria-label="VibeTRACKER terminal GUI preview">
            <div className="console-top"><span>vibetracker@local</span><b>ASCII GUI</b></div>
            <pre>{asciiDeck}</pre>
            <div className="hero-signal-tape" aria-label="Hero provider signal tape">
              {signalTape.map((row, index) => (
                <div
                  className={`hero-signal-tape__row hero-signal-tape__row--${row.impact}`}
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
                  <span>{row.label}</span>
                  <code>{row.command}</code>
                  <b>{row.status}</b>
                  <em aria-label={`${row.label} signal meter ${row.meter} percent`} />
                  <small>{row.note}</small>
                </div>
              ))}
            </div>
            <details className="hero-diagnostics">
              <summary>Inspect the five proof rails</summary>
              <div className="hero-launch-spine" aria-label="First-screen launch spine: usage, trust, local, privacy, publish">
                {heroLaunchSpine.map((rail, index) => (
                  <article
                    className={`hero-launch-rail hero-launch-rail--${rail.id}`}
                    data-rail={rail.rail}
                    style={{
                      "--i": index,
                      "--meter": `${rail.meter}%`,
                      "--brand-from": rail.from,
                      "--brand-to": rail.to,
                      "--brand-ink": rail.ink,
                    } as CSSProperties}
                    key={rail.id}
                  >
                    <div className="hero-launch-rail__top">
                      <i>{rail.mark}</i>
                      <div>
                        <span>{rail.rail}</span>
                        <b>{rail.label}</b>
                      </div>
                    </div>
                    <div className="hero-launch-rail__grid" aria-hidden="true">
                      {rail.cells.map((cell, cellIndex) => (
                        <span
                          style={{
                            "--c": cellIndex,
                            "--cell-scale": (0.34 + cell / 100).toFixed(2),
                            opacity: 0.28 + cell / 140,
                          } as CSSProperties}
                          key={`${rail.id}-${cellIndex}`}
                        />
                      ))}
                    </div>
                    <code>{rail.command}</code>
                    <p>{rail.note}</p>
                    <footer aria-label={`${rail.label} first-screen meter ${rail.meter} percent`}>
                      <em />
                      <strong>{rail.metric}</strong>
                    </footer>
                  </article>
                ))}
              </div>
            </details>
            <div className="console-feed">
              <span>&gt; scan providers</span>
              <span>&gt; label trust signals</span>
              <span>&gt; keep totals honest</span>
            </div>
          </div>
	        </div>
	        <HomeViberSpectrumPreludePanel />
	        <HeroScanBridgePanel bridge={heroScanBridge} />
	      </section>

      <HomeBootPanoramaPanel
        tower={controlTower}
        mission={missionSpine}
        conductor={scanConductor}
        proof={proofHud}
      />

      <HomeDatastreamReactorPanel reactor={datastreamReactor} />

      <HomeControlTowerPanel tower={controlTower} />

      <HomeMissionSpinePanel spine={missionSpine} />

      <HomeCommandPalettePanel palette={commandPalette} />

      <HomeScanConductorPanel conductor={scanConductor} />

      <HomeProofHudPanel hud={proofHud} />

      <SurpriseTransmissionRibbonPanel ribbon={collectionRibbon} />

      <ScanCommandRunwayPanel runway={scanCommandRunway} />

      <ScannerSurpriseDirectorPanel director={collectionDirector} />

      <CollectionSurpriseCascadePanel cascade={collectionCascade} />

      <CollectionFlightRecorderPanel recorder={collectionFlightRecorder} tape={collectionEventTape} />

      <CollectionSignalStackPanel stack={collectionStack} />

      <CollectionSurpriseSequencerPanel sequencer={collectionSequencer} />

      <ScanReplayRecorderPanel replay={collectionReplay} />

      <ScannerBlackBoxPanel blackBox={collectionBlackBox} />

      <CollectionEncoreRecapPanel recap={collectionEncoreRecap} />

      <section className="home-command-deck" aria-label="VibeTRACKER command deck">
        <div className="home-command-deck__head">
          <span>VTK://HOME-COMMAND-DECK//VIBERS-UNITE//C0VIBE.APP</span>
          <b>NO CONFETTI / REAL PROOF</b>
        </div>
        <div className="home-command-deck__grid">
          {commandDeck.map((item, index) => (
            <article className={`home-command home-command--${item.id}`} style={{ "--i": index } as CSSProperties} key={item.id}>
              <span>{item.status}</span>
              <b>{item.label}</b>
              <code>{item.command}</code>
              <small>{item.note}</small>
            </article>
          ))}
        </div>
      </section>

      <LaunchCapsulePanel capsule={launchCapsule} />

      <AiLifeCockpitPanel cockpit={aiLifeCockpit} />

      <HomeOperatorConstellationPanel constellation={operatorConstellation} />

      <section className="gui-doctor" aria-label="VibeTRACKER GUI doctor cockpit">
        <div className="gui-doctor__head">
          <span>VTK://GUI-DOCTOR//INLINE-TERMINAL//LOCAL-FIRST</span>
          <b>{guiDoctor.headline}</b>
        </div>
        <div className="gui-doctor__body">
          <aside className="gui-doctor__terminal" aria-label="Inline terminal doctor preview">
            <div className="console-top"><span>doctor@local</span><b>HEALTH</b></div>
            <pre>{guiDoctor.terminalLines.join("\n")}</pre>
            <div className="gui-doctor__pulsebar" aria-label="Provider surprise pulses">
              {guiDoctor.pulses.map((pulse, index) => (
                <div
                  style={{
                    "--brand-from": pulse.from,
                    "--brand-to": pulse.to,
                    "--brand-ink": pulse.ink,
                    "--i": index,
                  } as CSSProperties}
                  key={pulse.id}
                >
                  <i>{pulse.mark}</i>
                  <pre>{pulse.ascii.join("\n")}</pre>
                  <span>{pulse.label}</span>
                </div>
              ))}
            </div>
          </aside>
          <div className="gui-doctor__checks">
            {guiDoctor.checks.map((check, index) => (
              <article
                className={`gui-doctor-check gui-doctor-check--${check.impact}`}
                style={{ "--i": index, "--meter": `${check.meter}%` } as CSSProperties}
                key={check.id}
              >
                <div>
                  <span>{check.status}</span>
                  <b>{check.label}</b>
                </div>
                <code>{check.command}</code>
                <p>{check.note}</p>
                <div className="gui-doctor-check__meter" aria-label={`${check.label} readiness ${check.meter} percent`}>
                  <i />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="collection-run" aria-label="VibeTRACKER scanning surprise run">
        <div className="collection-run__head">
          <span>VTK://COLLECTION-RUN//SCANNING-SURPRISES//NO-FAKE-SPEND</span>
          <b>{collectionRun.headline}</b>
        </div>
        <div className="collection-run__body">
          <aside className="collection-run__terminal" aria-label="Collection run terminal">
            <div className="console-top"><span>collect@local</span><b>SURPRISE QUEUE</b></div>
            <pre>{collectionRun.terminalLines.join("\n")}</pre>
            <div className="collection-run__credits" aria-label="Collection run visual credits">
              {collectionRun.credits.map((credit) => <span key={credit}>{credit}</span>)}
            </div>
          </aside>
          <div className="collection-run__main">
            <div className="collection-choreography" aria-label="Collection scan choreography">
              {collectionRun.choreography.map((step, index) => (
                <article
                  className={`collection-choreo-step collection-choreo-step--${step.tone}`}
                  style={{
                    "--i": index,
                    "--meter": `${step.meter}%`,
                    "--brand-from": step.marks[0]?.from,
                    "--brand-to": step.marks[0]?.to,
                    "--brand-ink": step.marks[0]?.ink,
                  } as CSSProperties}
                  key={step.id}
                >
                  <div className="collection-choreo-step__top">
                    <span>{step.stage}</span>
                    <i>{step.label}</i>
                  </div>
                  <b>{step.command}</b>
                  <p>{step.detail}</p>
                  <small>{step.guardrail}</small>
                  <div className="collection-choreo-step__marks" aria-label={`${step.label} marks`}>
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
                  <div className="collection-choreo-step__pulse" aria-label={`${step.label} checkpoint meter ${step.meter} percent`}>
                    <i />
                  </div>
                </article>
              ))}
            </div>
            <div className="collection-itinerary" aria-label="Collection surprise itinerary">
              {collectionRun.itinerary.map((item, index) => (
                <article
                  className={`collection-itinerary-step collection-itinerary-step--${item.impact}`}
                  style={{
                    "--i": index,
                    "--meter": `${item.meter}%`,
                    "--brand-from": item.marks[0]?.from,
                    "--brand-to": item.marks[0]?.to,
                    "--brand-ink": item.marks[0]?.ink,
                  } as CSSProperties}
                  key={item.id}
                >
                  <div className="collection-itinerary-step__top">
                    <span>{item.stage}</span>
                    <b>{item.label}</b>
                  </div>
                  <p>{item.trigger}</p>
                  <strong>{item.cue}</strong>
                  <small>{item.replay}</small>
                  <div className="collection-itinerary-step__marks" aria-label={`${item.label} provider marks`}>
                    {item.marks.map((mark) => (
                      <i
                        style={{
                          "--brand-from": mark.from,
                          "--brand-to": mark.to,
                          "--brand-ink": mark.ink,
                        } as CSSProperties}
                        title={mark.label}
                        key={`${item.id}-${mark.id}`}
                      >
                        {mark.mark}
                      </i>
                    ))}
                  </div>
                  <div className="collection-itinerary-step__meter" aria-label={`${item.label} surprise meter ${item.meter} percent`}>
                    <i />
                  </div>
                </article>
              ))}
            </div>
            <div className="collection-encore-reel" aria-label="Collection surprise encore reel">
              {collectionRun.encores.map((encore, index) => (
                <article
                  className={`collection-encore collection-encore--${encore.impact}`}
                  style={{
                    "--i": index,
                    "--meter": `${encore.meter}%`,
                    "--delay": `${encore.delayMs}ms`,
                    "--brand-from": encore.marks[0]?.from,
                    "--brand-to": encore.marks[0]?.to,
                    "--brand-ink": encore.marks[0]?.ink,
                  } as CSSProperties}
                  key={encore.id}
                >
                  <div className="collection-encore__top">
                    <span>{encore.stage}</span>
                    <b>{encore.gate}</b>
                  </div>
                  <div className="collection-encore__screen" aria-hidden="true">
                    {encore.frames.map((frame, frameIndex) => (
                      <pre style={{ "--f": frameIndex } as CSSProperties} key={`${encore.id}-${frameIndex}`}>
                        {frame}
                      </pre>
                    ))}
                  </div>
                  <div className="collection-encore__copy">
                    <i>{encore.status}</i>
                    <strong>{encore.label}</strong>
                    <code>{encore.command}</code>
                    <p>{encore.caption}</p>
                    <small>{encore.guardrail}</small>
                  </div>
                  <div className="collection-encore__marks" aria-label={`${encore.label} provider marks`}>
                    {encore.marks.map((mark) => (
                      <i
                        style={{
                          "--brand-from": mark.from,
                          "--brand-to": mark.to,
                          "--brand-ink": mark.ink,
                        } as CSSProperties}
                        title={mark.label}
                        key={`${encore.id}-${mark.id}`}
                      >
                        {mark.mark}
                      </i>
                    ))}
                  </div>
                  <div className="collection-encore__meter" aria-label={`${encore.label} encore meter ${encore.meter} percent`}>
                    <i />
                  </div>
                </article>
              ))}
            </div>
            <div className="collection-run__grid">
              {collectionRun.moments.map((moment, index) => (
                <article
                  className={`collection-moment collection-moment--${moment.impact}`}
                  style={{
                    "--i": index,
                    "--meter": `${moment.meter}%`,
                    "--brand-from": moment.marks[0]?.from,
                    "--brand-to": moment.marks[0]?.to,
                    "--brand-ink": moment.marks[0]?.ink,
                  } as CSSProperties}
                  key={moment.id}
                >
                  <div className="collection-moment__screen" aria-hidden="true">
                    <pre>{moment.ascii.join("\n")}</pre>
                    <div className="collection-moment__turntable">
                      {moment.motion.map((frame, frameIndex) => (
                        <pre style={{ "--f": frameIndex } as CSSProperties} key={`${moment.id}-${frame}`}>
                          {frame}
                        </pre>
                      ))}
                    </div>
                    <span>{moment.call}</span>
                  </div>
                  <div className="collection-moment__copy">
                    <div>
                      <i>{moment.stage}</i>
                      <span>{moment.status}</span>
                    </div>
                    <b>{moment.label}</b>
                    <code>{moment.command}</code>
                    <p>{moment.note}</p>
                    <small>{moment.guardrail}</small>
                  </div>
                  <div className="collection-moment__marks" aria-label={`${moment.label} source marks`}>
                    {moment.marks.map((mark) => (
                      <i
                        style={{
                          "--brand-from": mark.from,
                          "--brand-to": mark.to,
                          "--brand-ink": mark.ink,
                        } as CSSProperties}
                        title={mark.label}
                        key={mark.id}
                      >
                        {mark.mark}
                      </i>
                    ))}
                  </div>
                  <div className="collection-moment__cadence" aria-label={`${moment.label} surprise cadence`}>
                    {moment.beats.map((beat, beatIndex) => (
                      <span
                        data-surprise={beat.surprise ? "true" : "false"}
                        style={{ "--b": beatIndex } as CSSProperties}
                        title={beat.detail}
                        key={`${moment.id}-${beat.label}`}
                      >
                        <b>{beat.label}</b>
                        <small>{beat.detail}</small>
                      </span>
                    ))}
                  </div>
                  <div className="collection-moment__meter" aria-label={`${moment.label} collection confidence ${moment.meter} percent`}>
                    <i />
                  </div>
                  <footer>
                    <span>{moment.impact.replace("_", " ")}</span>
                    <span>{moment.source}</span>
                  </footer>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="ascii-motion-lab" aria-label="ASCII motion lab and open-source credits">
        <div className="ascii-motion-lab__head">
          <span>VTK://ASCII-MOTION-LAB//OSS-CREDITS//NOT-USAGE</span>
          <b>{motionLab.headline}</b>
        </div>
        <div className="ascii-motion-lab__body">
          <aside className="ascii-motion-lab__terminal" aria-label="ASCII motion lab terminal">
            <div className="console-top"><span>motion@local</span><b>OSS CREDIT</b></div>
            <pre>{motionLab.terminalLines.join("\n")}</pre>
            <div className="ascii-motion-lab__credits" aria-label="Open-source animation credits">
              {motionLab.credits.map((credit) => <span key={credit}>{credit}</span>)}
            </div>
          </aside>
          <div className="ascii-motion-lab__main">
            <div className="ascii-motion-lab__rigs">
              {motionLab.rigs.map((rig, index) => (
                <article
                  className={`ascii-motion-rig ascii-motion-rig--${rig.id}`}
                  style={{
                    "--i": index,
                    "--meter": `${rig.meter}%`,
                    "--brand-from": rig.from,
                    "--brand-to": rig.to,
                    "--brand-ink": rig.ink,
                  } as CSSProperties}
                  key={rig.id}
                >
                  <div className="ascii-motion-rig__screen" aria-hidden="true">
                    <pre>{rig.frames.join("\n")}</pre>
                    <div>
                      {rig.glyphs.map((glyph, glyphIndex) => (
                        <i style={{ "--g": glyphIndex } as CSSProperties} key={`${rig.id}-${glyph}`}>
                          {glyph}
                        </i>
                      ))}
                    </div>
                  </div>
                  <div className="ascii-motion-rig__copy">
                    <div>
                      <i>{rig.mark}</i>
                      <span>{rig.stage}</span>
                    </div>
                    <b>{rig.label}</b>
                    <code>{rig.command}</code>
                    <p>{rig.note}</p>
                    <small>{rig.guardrail}</small>
                  </div>
                  <footer>
                    <a href={rig.url}>{rig.library}</a>
                    <span>{rig.author}</span>
                    <em>{rig.license}</em>
                  </footer>
                  <div className="ascii-motion-rig__meter" aria-label={`${rig.label} visual readiness ${rig.meter} percent`}>
                    <i />
                  </div>
                </article>
              ))}
            </div>
            <div className="ascii-motion-lab__references" aria-label="Niche terminal motion research references">
              {motionLab.references.map((reference, index) => (
                <article style={{ "--i": index } as CSSProperties} key={reference.id}>
                  <span>{reference.cue}</span>
                  <b>{reference.label}</b>
                  <a href={reference.url}>{reference.project}</a>
                  <small>{reference.author} · {reference.license}</small>
                  <p>{reference.note}</p>
                  <em>{reference.guardrail}</em>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="evidence-cockpit" aria-label="Usage evidence cockpit">
        <div className="evidence-cockpit__head">
          <span>VTK://EVIDENCE-COCKPIT//LOCAL-FIRST//NO-FAKE-PROOF</span>
          <b>{evidence.headline}</b>
        </div>
        <div className="evidence-cockpit__body">
          <aside className="evidence-terminal" aria-label="Evidence collection terminal">
            <div className="console-top"><span>evidence@local</span><b>SCANNING</b></div>
            <pre>{evidence.terminalLines.join("\n")}</pre>
            <div className="evidence-relay" aria-label="C0VIBE relay">
              <span>Vibers Unite</span>
              <a href="https://c0vibe.app">c0vibe.app</a>
            </div>
          </aside>
          <div className="evidence-stages">
            {evidence.stages.map((stage, index) => (
              <article
                className={`evidence-stage evidence-stage--${stage.impact}`}
                style={{ "--i": index, "--meter": `${stage.meter}%` } as CSSProperties}
                key={stage.id}
              >
                <div className="evidence-stage__screen" aria-hidden="true">
                  <pre>{stage.ascii.join("\n")}</pre>
                  <span>{stage.status}</span>
                </div>
                <div className="evidence-stage__copy">
                  <b>{stage.label}</b>
                  <code>{stage.command}</code>
                  <p>{stage.note}</p>
                </div>
                <div className="evidence-stage__meter" aria-label={`${stage.label} readiness ${stage.meter} percent`}>
                  <i />
                </div>
              </article>
            ))}
          </div>
        </div>
        <div className="evidence-guards" aria-label="Evidence guard rails">
          {evidence.guards.map((guard) => (
            <div key={guard.id}>
              <b>{guard.label}</b>
              <span>{guard.note}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="home-scan-room provider-theatre" aria-label="VibeTRACKER branded scan room">
        <div className="provider-theatre__head">
          <span>VTK://HOME-SCAN-ROOM//BRANDED-SURPRISES//NOT-USAGE</span>
          <b>{scanRoom.headline}</b>
        </div>
        <div className="home-scan-room__body">
          <aside className="home-scan-room__terminal" aria-label="Home scan room terminal">
            <div className="console-top"><span>scan-room@local</span><b>VIBERS UNITE</b></div>
            <pre>{scanRoom.terminalLines.join("\n")}</pre>
            <div className="home-scan-room__metrics">
              {scanRoom.metrics.map((metric) => (
                <div key={metric.label}>
                  <b>{metric.value}</b>
                  <span>{metric.label}</span>
                  <small>{metric.note}</small>
                </div>
              ))}
            </div>
          </aside>
          <div className="provider-theatre__grid home-scan-room__grid">
            {scanRoom.scenes.map((scene, index) => (
              <article
                className={`provider-theatre-card provider-theatre-card--${scene.id}`}
                style={{
                  "--brand-from": scene.brandFrom,
                  "--brand-to": scene.brandTo,
                  "--brand-ink": scene.brandInk,
                  "--i": index,
                  "--meter": `${scene.meter}%`,
                } as CSSProperties}
                key={scene.id}
              >
                <div className="provider-theatre-card__screen" aria-hidden="true">
                  <pre>{scene.ascii.join("\n")}</pre>
                  <span>{scene.call}</span>
                </div>
                <div className="provider-theatre-card__copy">
                  <div>
                    <span>{scene.badge}</span>
                    <b>{scene.label}</b>
                    <em>{scene.status}</em>
                  </div>
                  <p>{scene.copy}</p>
                  <div className="provider-theatre-marks" aria-label={`${scene.label} provider marks`}>
                    {scene.marks.map((mark) => (
                      <i
                        style={{
                          "--brand-from": mark.from,
                          "--brand-to": mark.to,
                          "--brand-ink": mark.ink,
                        } as CSSProperties}
                        key={mark.id}
                      >
                        {mark.mark}
                      </i>
                    ))}
                  </div>
                  <div className="provider-theatre-meter" aria-label={`${scene.label} scan readiness ${scene.meter} percent`}>
                    <i />
                  </div>
                  <footer>
                    <strong>{scene.primaryMark}</strong>
                    {scene.foot.map((item) => <span key={item}>{item}</span>)}
                  </footer>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="source-atlas" aria-label="VibeTRACKER source signal atlas">
        <div className="source-atlas__head">
          <span>VTK://SOURCE-ATLAS//REGISTRY-DRIVEN//VIBERS-UNITE</span>
          <b>{sourceAtlas.headline}</b>
        </div>
        <div className="source-atlas__body">
          <aside className="source-atlas__terminal" aria-label="Source signal atlas terminal">
            <div className="console-top"><span>atlas@local</span><b>NO FAKE USAGE</b></div>
            <pre>{sourceAtlas.terminalLines.join("\n")}</pre>
            <div className="source-atlas__metrics" aria-label="Source atlas metrics">
              {sourceAtlas.metrics.map((metric) => (
                <div key={metric.label}>
                  <b>{metric.value}</b>
                  <span>{metric.label}</span>
                  <small>{metric.note}</small>
                </div>
              ))}
            </div>
          </aside>
          <div className="source-atlas__map" aria-label="Branded source signal map">
            <div
              className="source-atlas__relay"
              style={{
                "--x": sourceAtlas.relay.x,
                "--y": sourceAtlas.relay.y,
                "--brand-from": sourceAtlas.relay.from,
                "--brand-to": sourceAtlas.relay.to,
                "--brand-ink": sourceAtlas.relay.ink,
              } as CSSProperties}
            >
              <i>{sourceAtlas.relay.mark}</i>
              <b>{sourceAtlas.relay.label}</b>
              <span>{sourceAtlas.relay.detail}</span>
            </div>
            {sourceAtlas.beacons.map((node, index) => (
              <a
                className={`source-atlas-node source-atlas-node--${node.impact}`}
                href="/providers"
                style={{
                  "--x": node.x,
                  "--y": node.y,
                  "--i": index,
                  "--meter": `${node.meter}%`,
                  "--brand-from": node.from,
                  "--brand-to": node.to,
                  "--brand-ink": node.ink,
                } as CSSProperties}
                title={`${node.label}: ${node.detail}`}
                key={`${node.id}-${index}`}
              >
                <i>{node.mark}</i>
                <span>{node.label}</span>
              </a>
            ))}
          </div>
        </div>
        <div className="source-atlas__lanes" aria-label="Source atlas lanes">
          {sourceAtlas.lanes.map((lane, laneIndex) => (
            <article className={`source-atlas-lane source-atlas-lane--${lane.id}`} style={{ "--i": laneIndex } as CSSProperties} key={lane.id}>
              <div className="source-atlas-lane__top">
                <span>{lane.call}</span>
                <b>{lane.label}</b>
                <em>{lane.count} mapped</em>
              </div>
              <p>{lane.note}</p>
              <div className="source-atlas-lane__nodes" aria-label={`${lane.label} highlighted providers`}>
                {lane.nodes.slice(0, 6).map((node) => (
                  <i
                    style={{
                      "--brand-from": node.from,
                      "--brand-to": node.to,
                      "--brand-ink": node.ink,
                    } as CSSProperties}
                    title={`${node.label}: ${node.detail}`}
                    key={node.id}
                  >
                    {node.mark}
                  </i>
                ))}
                {lane.overflow > 0 ? <strong>+{lane.overflow}</strong> : null}
              </div>
              <footer>
                <span>{lane.built} built</span>
                <span>{lane.verified} verified</span>
              </footer>
            </article>
          ))}
        </div>
      </section>

      <section className="signal-grid" aria-label="VibeTRACKER coverage">
        <div>
          <b>154 services mapped</b>
          <span>OpenAI, Anthropic, Qwen, Doubao, Kimi, Mistral, Replicate, Runway, Higgsfield, ComfyUI, Ollama, LM Studio, and more.</span>
        </div>
        <div>
          <b>Terminal-first GUI</b>
          <span>The wizard opens a local GUI with an inline terminal pane, command hints, provider filters, and source-mix proof.</span>
        </div>
        <div>
          <b>Trust signals stay separate</b>
          <span>GitHub activity can add context, but it is clearly labelled as not usage and never changes spend totals.</span>
        </div>
        <div>
          <b>{roadmap.total} accepted improvements</b>
          <span>{roadmap.live} live, {roadmap.accepted} accepted, {roadmap.planned} planned from the marked roadmap. No planned item is counted as usage.</span>
        </div>
      </section>

      <section>
        <h2>Accepted Roadmap</h2>
        <p className="muted">Selected improvements are tracked as product capabilities, not fake adapter claims.</p>
        <div className="roadmap-strip">
          {highlights.map((item) => (
            <a key={item.number} href="/roadmap">
              <span>#{item.number}</span>
              <b>{item.title}</b>
              <small>{item.stage}</small>
            </a>
          ))}
        </div>
      </section>

      <section id="verified">
        <h2>Verified <TrustBadge tier="verified" /></h2>
        <p className="muted">{TIER_BLURB.verified}</p>
        <Board tier="verified" />
      </section>

      <section id="self">
        <h2>Self-reported <TrustBadge tier="self_reported" /></h2>
        <p className="muted">{TIER_BLURB.self_reported}</p>
        <Board tier="self_reported" />
      </section>
    </>
  );
}
