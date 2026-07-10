import { renderCollectionCheckpoint, renderProviderScanBeat, renderSyncSurpriseQueue } from "./sync-surprises.ts";

export interface ShowcaseOptions {
  compact?: boolean;
}

const width = 62;
const contentWidth = width - 4;

function fit(text: string, size = contentWidth): string {
  return text.length > size ? `${text.slice(0, Math.max(0, size - 1))}…` : text.padEnd(size);
}

function frameLine(text: string): string {
  return `| ${fit(text)} |`;
}

function panel(title: string, rows: string[]): string {
  return [
    "+------------------------------------------------------------+",
    frameLine(title),
    "|------------------------------------------------------------|",
    ...rows.map((row) => frameLine(row)),
    "+------------------------------------------------------------+",
  ].join("\n");
}

function commandRail(): string {
  return panel("VTK://SHOWCASE//FIRST-RUN-COMMAND-RAIL", [
    "$ npx vibetrack init --gui",
    "$ vibetracker sync --demo",
    "$ vibetracker audit",
    "$ vibetracker upload --dry-run",
    "$ vibetracker life",
    "terminal charm enters GUI; source truth stays visible",
  ]);
}

function proofRail(): string {
  return panel("VTK://SHOWCASE//PROOF-BOUNDARY//NO-FAKE-SPEND", [
    "usage        provider receipts, logs, proxy, local runners",
    "local_only   dry-run preview, secret scan, encrypted store",
    "not_usage    GitHub/creator cadence; never spend",
    "privacy      no prompt/content upload; aggregate first",
    "identity     C0VIBE login attests account, not usage",
    "motto        Vibers Unite // c0vibe.app",
  ]);
}

function sourceMatrix(): string {
  return panel("VTK://SHOWCASE//SOURCE-MATRIX//AI-LIFE", [
    "[HF] Higgsfield MCP     creator video/image usage source",
    "[CX] Codex / builders   trust/build context, NOT USAGE",
    "[OL] Ollama local       loopback signal, local-first",
    "[CU] ComfyUI graph      workflow capture, no outputs",
    "[QW] Qwen/Kimi/Doubao   regional confidence labels",
    "[GH] GitHub heatgrid    cadence only, never spend/rank",
  ]);
}

const replayCards = [
  {
    mark: "HF",
    label: "Higgsfield prism",
    impact: "usage",
    tone: "pink",
    frame: " /\\ \n<HF>\n \\/ ",
    command: "LIVE TURN 01/04 HF PRISM",
    note: "usage records only after MCP/local consent",
  },
  {
    mark: "CX",
    label: "Codex diff cube",
    impact: "not_usage",
    tone: "cyan",
    frame: "+CX+\n|git|\n+GH+",
    command: "LIVE TURN 02/04 CX TRUST",
    note: "builder cadence stays a trust side rail",
  },
  {
    mark: "OL",
    label: "Local sonar",
    impact: "local_only",
    tone: "green",
    frame: "127.\n0.0.\n 1 ",
    command: "LIVE TURN 03/04 LAN BLOOM",
    note: "loopback checks stay on the machine",
  },
  {
    mark: "C0",
    label: "C0VIBE relay",
    impact: "publish",
    tone: "gold",
    frame: "VIBE\nUNITE\nAPP ",
    command: "LIVE TURN 04/04 REVIEW",
    note: "c0vibe.app only after dry-run review",
  },
] as const;

function scanReplayRail(): string {
  return panel("VTK://SHOWCASE//SCAN-REPLAY//CLI-TO-GUI", [
    "LIVE TURN 01/04 HF PRISM     usage      validated rows",
    "LIVE TURN 02/04 CX TRUST     NOT USAGE  builder context",
    "LIVE TURN 03/04 LAN BLOOM    local_only loopback only",
    "LIVE TURN 04/04 REVIEW       publish    review gate",
    "static GUI mirrors terminal cadence; no scripts",
  ]);
}

function motionCreditRail(): string {
  return panel("VTK://SHOWCASE//OSS-MOTION-CREDITS//LOCAL-ONLY", [
    "cli-spinners MIT timing rail",
    "ascii-globe MIT global source-field cue",
    "drawille MIT unicode braille signal texture",
    "custom turntables rotate provider marks",
    "credits visible; no CDN, scripts, or network calls",
  ]);
}

function sourceToScoreRail(): string {
  return panel("VTK://SHOWCASE//SOURCE-TO-SCORE-PASSPORT//OFFLINE", [
    "01 upload aggregate -> local review bundle",
    "02 provider mix -> source atlas and profile",
    "03 daily aggregate -> GitHub-color heatgrid",
    "04 usage factors -> vibe score receipt",
    "NO trust side rail -> NOT USAGE, no rank impact",
    "C0 relay -> profile + SVG badge after dry-run",
    "profile/heatgrid/score/badge share reviewed aggregates",
    "no raw prompts, outputs, or secrets leave this demo",
  ]);
}

function scoreReactorRail(): string {
  return panel("VTK://SHOWCASE//SCORE-REACTOR//NO-TRUST-SPEND", [
    "usage input -> provider receipts and local model rows",
    "local value -> loopback savings, never leaves machine",
    "trust input -> GitHub/Higgsfield signals, NOT USAGE",
    "privacy gate -> prompt/output/key counters stay zero",
    "publish relay -> c0vibe.app only after dry-run review",
    "reactor output -> vibe score receipt + profile passport",
  ]);
}

function shareKitRail(): string {
  return panel("VTK://SHOWCASE//SHARE-KIT//README-PROFILE", [
    "vibetracker profile -> local HTML passport",
    "vibetracker badge -> static SVG source-to-score",
    "vibetracker upload --dry-run -> review bundle",
    "c0vibe.app public profile waits for consent",
    "demo data is illustrative; real sync decides totals",
  ]);
}

function checkpointRail(): string {
  return renderCollectionCheckpoint({
    providerId: "higgsfield",
    label: "Higgsfield",
    status: "new",
    received: 42,
    accepted: 40,
    fresh: 28,
    duplicate: 2,
    usd: 12.4,
    sourceMix: [
      { source: "ledger", count: 24 },
      { source: "feed_recon", count: 12 },
      { source: "manual", count: 4 },
    ],
    hint: "showcase data is illustrative; real sync validates before storage",
  });
}

function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
  };
  return value.replace(/[&<>"]/g, (char) => entities[char] ?? char);
}

function replayCardsHtml(): string {
  return replayCards.map((card, index) => `
          <article class="replay-card replay-card--${card.tone}" data-impact="${card.impact}" style="--i:${index}">
            <div class="replay-card__top"><span>${escapeHtml(card.mark)}</span><b>${escapeHtml(card.impact)}</b></div>
            <pre>${escapeHtml(card.frame)}</pre>
            <strong>${escapeHtml(card.label)}</strong>
            <code>${escapeHtml(card.command)}</code>
            <small>${escapeHtml(card.note)}</small>
          </article>`).join("");
}

function visualCreditsHtml(): string {
  return [
    "cli-spinners MIT timing rail",
    "ascii-globe MIT source-field cue",
    "drawille MIT braille signal texture",
    "VibeTRACKER custom provider turntables",
  ].map((credit) => `<span>${escapeHtml(credit)}</span>`).join("");
}

function passportHtml(): string {
  const lanes = [
    ["UP", "upload aggregate", "local review bundle", "usage"],
    ["MX", "provider mix", "source atlas + profile", "usage"],
    ["HG", "heatgrid rhythm", "daily aggregate cells", "usage"],
    ["SC", "score input", "vibe score receipt", "score"],
    ["NO", "trust side rail", "NOT USAGE, no rank impact", "not_usage"],
    ["C0", "share relay", "profile + SVG badge", "publish"],
  ];
  return lanes.map(([mark, label, value, impact], index) => `
            <article class="passport-lane" data-impact="${escapeHtml(impact)}" style="--i:${index}">
              <span>${escapeHtml(mark)}</span>
              <b>${escapeHtml(label)}</b>
              <small>${escapeHtml(value)}</small>
            </article>`).join("");
}

function reactorHtml(): string {
  const lanes = [
    ["US", "usage core", "provider + local model rows", "72", "usage"],
    ["LC", "local shadow", "loopback savings stays local", "58", "local_only"],
    ["TR", "trust side rail", "GitHub + MCP signals, NOT USAGE", "34", "not_usage"],
    ["PR", "privacy gate", "prompts outputs keys stay zero", "100", "privacy"],
    ["C0", "publish relay", "c0vibe.app after dry-run review", "46", "publish"],
  ];
  return lanes.map(([mark, label, value, level, impact], index) => `
            <article class="reactor-lane" data-impact="${escapeHtml(impact)}" style="--i:${index};--level:${escapeHtml(level)}%">
              <span>${escapeHtml(mark)}</span>
              <b>${escapeHtml(label)}</b>
              <div class="reactor-meter" aria-hidden="true"><i></i></div>
              <small>${escapeHtml(value)}</small>
            </article>`).join("");
}

export function renderShowcase(options: ShowcaseOptions = {}): string {
  const compact = Boolean(options.compact);
  const sections = [
    panel("VTK://SHOWCASE//VIBETRACKER//VIBERS-UNITE", [
      "offline demo; no calls, no upload, no secrets read",
      "built for coders, creators, researchers, local AI",
      "terminal proof first; GUI carries source truth",
      "effects point at usage, trust, or privacy boundaries",
    ]),
    commandRail(),
    proofRail(),
    sourceMatrix(),
    scanReplayRail(),
    motionCreditRail(),
    sourceToScoreRail(),
    scoreReactorRail(),
    shareKitRail(),
    renderProviderScanBeat({ providerId: "higgsfield", label: "Higgsfield", index: 0, total: 3 }),
    renderProviderScanBeat({ providerId: "codex-cli", label: "Codex CLI", index: 1, total: 3 }),
    checkpointRail(),
  ];
  if (!compact) {
    sections.splice(4, 0, ...renderSyncSurpriseQueue(["higgsfield", "codex-cli", "ollama", "replicate"]));
  }
  sections.push(panel("VTK://SHOWCASE//NEXT-ACTION", [
    "run: npx vibetrack init --gui",
    "then: vibetracker sync --demo",
    "review: vibetracker upload --dry-run",
    "share: c0vibe.app only after local review",
  ]));
  return sections.join("\n\n");
}

export function renderShowcaseHtml(options: ShowcaseOptions = {}): string {
  const terminal = escapeHtml(renderShowcase(options));
  const mode = options.compact ? "compact scan" : "full scan";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>VibeTRACKER Offline Showcase</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #080a0d;
      --ink: #f3f7f2;
      --muted: #90a09b;
      --line: rgba(166, 255, 204, 0.22);
      --green: #39ff88;
      --cyan: #40d9ff;
      --pink: #ff4fa3;
      --gold: #ffd166;
      --violet: #9d8cff;
      --red: #ff5f57;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; min-height: 100%; background: var(--bg); }
    body {
      color: var(--ink);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      overflow-x: hidden;
    }
    body::before {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      background:
        linear-gradient(rgba(255,255,255,0.025) 50%, transparent 50%) 0 0 / 100% 4px,
        linear-gradient(90deg, rgba(57,255,136,0.10), transparent 18%, rgba(64,217,255,0.08) 55%, transparent 80%);
      mix-blend-mode: screen;
      opacity: 0.58;
    }
    .frame {
      min-height: 100vh;
      display: grid;
      grid-template-columns: minmax(280px, 0.72fr) minmax(320px, 1fr);
      gap: 28px;
      padding: clamp(18px, 4vw, 54px);
      align-items: stretch;
    }
    .intro, .terminal {
      border: 1px solid var(--line);
      background: rgba(8, 12, 14, 0.88);
      box-shadow: 0 0 0 1px rgba(64,217,255,0.10), 0 24px 80px rgba(0,0,0,0.55);
    }
    .intro {
      display: grid;
      align-content: space-between;
      gap: 26px;
      padding: clamp(20px, 3vw, 34px);
      min-height: 620px;
    }
    .eyebrow {
      color: var(--green);
      font-size: 12px;
      letter-spacing: 0;
      text-transform: uppercase;
    }
    h1 {
      margin: 12px 0 16px;
      font-size: clamp(34px, 5vw, 72px);
      line-height: 0.92;
      letter-spacing: 0;
    }
    .lede {
      max-width: 58ch;
      color: #c8d6d1;
      line-height: 1.55;
      font-size: 15px;
    }
    .logo {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      margin: 28px 0;
    }
    .logo span {
      min-height: 84px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(255,255,255,0.12);
      color: var(--green);
      font-size: clamp(22px, 4vw, 44px);
      font-weight: 800;
      text-shadow: 0 0 18px rgba(57,255,136,0.45);
      animation: turn 5.8s ease-in-out infinite;
    }
    .logo span:nth-child(2) {
      color: var(--cyan);
      animation-delay: -1.8s;
      text-shadow: 0 0 18px rgba(64,217,255,0.48);
    }
    .logo span:nth-child(3) {
      color: var(--pink);
      animation-delay: -3.2s;
      text-shadow: 0 0 18px rgba(255,79,163,0.44);
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .chip {
      border: 1px solid color-mix(in srgb, var(--brand), white 14%);
      color: var(--brand);
      padding: 8px 10px;
      min-height: 34px;
      background: color-mix(in srgb, var(--brand), transparent 88%);
    }
    .chip:nth-child(1) { --brand: var(--pink); }
    .chip:nth-child(2) { --brand: var(--cyan); }
    .chip:nth-child(3) { --brand: var(--green); }
    .chip:nth-child(4) { --brand: var(--gold); }
    .chip:nth-child(5) { --brand: var(--violet); }
    .replay {
      margin: 22px 0 0;
      border: 1px solid rgba(64,217,255,0.18);
      background: rgba(0,0,0,0.22);
      overflow: hidden;
    }
    .replay-head {
      padding: 9px 10px;
      border-bottom: 1px solid rgba(255,255,255,0.10);
      color: var(--cyan);
      font-size: 11px;
      text-transform: uppercase;
    }
    .replay-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1px;
      background: rgba(255,255,255,0.08);
    }
    .replay-card {
      --tone: var(--cyan);
      position: relative;
      min-height: 176px;
      display: grid;
      align-content: start;
      gap: 7px;
      padding: 10px;
      background: radial-gradient(circle at 50% 0, color-mix(in srgb, var(--tone) 16%, transparent), transparent 45%), #05080a;
      overflow: hidden;
    }
    .replay-card::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(118deg, transparent 0 42%, color-mix(in srgb, var(--tone) 14%, transparent) 50%, transparent 59%);
      transform: translateX(-96%);
      animation: sweep 5.4s ease-in-out infinite;
      animation-delay: calc(var(--i) * -0.65s);
      pointer-events: none;
    }
    .replay-card--pink { --tone: var(--pink); }
    .replay-card--cyan { --tone: var(--cyan); }
    .replay-card--green { --tone: var(--green); }
    .replay-card--gold { --tone: var(--gold); }
    .replay-card > * { position: relative; z-index: 1; }
    .replay-card__top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .replay-card__top span {
      display: inline-grid;
      place-items: center;
      min-width: 32px;
      min-height: 26px;
      color: #04100b;
      background: var(--tone);
      font-weight: 900;
    }
    .replay-card__top b {
      color: var(--tone);
      font-size: 9px;
      text-transform: uppercase;
      overflow-wrap: anywhere;
    }
    .replay-card pre {
      position: relative;
      margin: 0;
      padding: 0;
      max-height: none;
      min-height: 48px;
      overflow: hidden;
      white-space: pre;
      color: #f5fff9;
      font-size: 14px;
      line-height: 1.05;
      text-shadow: 0 0 14px color-mix(in srgb, var(--tone) 46%, transparent);
      animation: turn 5.8s ease-in-out infinite;
      animation-delay: calc(var(--i) * -0.9s);
    }
    .replay-card strong {
      color: var(--ink);
      font-size: 12px;
      text-transform: uppercase;
    }
    .replay-card code {
      display: block;
      color: #d8ffe6;
      border: 1px solid color-mix(in srgb, var(--tone) 28%, transparent);
      padding: 6px;
      background: rgba(0,0,0,0.2);
      font-size: 10px;
      overflow-wrap: anywhere;
    }
    .replay-card small {
      color: var(--muted);
      line-height: 1.35;
    }
    .motion-credit {
      display: grid;
      gap: 6px;
      margin-top: 12px;
      padding: 10px;
      border: 1px solid rgba(255,209,102,0.20);
      background: rgba(255,209,102,0.055);
      color: var(--gold);
      font-size: 10px;
      line-height: 1.25;
    }
    .motion-credit span {
      overflow-wrap: anywhere;
    }
    .passport {
      margin-top: 14px;
      border: 1px solid rgba(57,255,136,0.20);
      background: linear-gradient(180deg, rgba(57,255,136,0.055), rgba(0,0,0,0.20));
      overflow: hidden;
    }
    .passport-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 9px 10px;
      border-bottom: 1px solid rgba(255,255,255,0.10);
      color: var(--green);
      font-size: 11px;
      text-transform: uppercase;
    }
    .passport-head b {
      color: var(--gold);
      font-size: 10px;
    }
    .passport-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1px;
      background: rgba(255,255,255,0.08);
    }
    .passport-lane {
      --lane: var(--cyan);
      position: relative;
      min-height: 92px;
      padding: 10px;
      background: linear-gradient(150deg, color-mix(in srgb, var(--lane) 12%, #05080a), #05080a);
      overflow: hidden;
      display: grid;
      align-content: start;
      gap: 6px;
      animation: rise 0.48s cubic-bezier(.22,.68,.12,1) both;
      animation-delay: calc(var(--i) * 70ms);
    }
    .passport-lane::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 2px;
      background: linear-gradient(var(--lane), transparent);
    }
    .passport-lane[data-impact="usage"] { --lane: var(--green); }
    .passport-lane[data-impact="score"] { --lane: var(--cyan); }
    .passport-lane[data-impact="not_usage"] { --lane: var(--gold); border-left: 1px dashed rgba(255,209,102,0.42); }
    .passport-lane[data-impact="publish"] { --lane: var(--pink); }
    .passport-lane > * { position: relative; z-index: 1; }
    .passport-lane span {
      display: inline-grid;
      place-items: center;
      width: 32px;
      height: 26px;
      color: #04100b;
      background: var(--lane);
      font-weight: 900;
    }
    .passport-lane b {
      color: var(--ink);
      text-transform: uppercase;
      font-size: 11px;
      line-height: 1.16;
    }
    .passport-lane small {
      color: var(--muted);
      line-height: 1.3;
    }
    .passport-note {
      margin: 0;
      padding: 10px;
      color: var(--muted);
      font-size: 10.5px;
      line-height: 1.35;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    .reactor {
      margin-top: 14px;
      border: 1px solid rgba(64,217,255,0.22);
      background:
        radial-gradient(circle at 14% 0, rgba(64,217,255,0.14), transparent 34%),
        radial-gradient(circle at 88% 18%, rgba(255,79,163,0.12), transparent 32%),
        rgba(0,0,0,0.24);
      overflow: hidden;
    }
    .reactor-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 9px 10px;
      border-bottom: 1px solid rgba(255,255,255,0.10);
      color: var(--cyan);
      font-size: 11px;
      text-transform: uppercase;
    }
    .reactor-head b {
      color: var(--gold);
      font-size: 10px;
    }
    .reactor-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 1px;
      background: rgba(255,255,255,0.08);
    }
    .reactor-lane {
      --lane: var(--cyan);
      position: relative;
      min-height: 132px;
      padding: 10px;
      display: grid;
      align-content: start;
      gap: 7px;
      background:
        linear-gradient(160deg, color-mix(in srgb, var(--lane) 14%, #05080a), #05080a);
      overflow: hidden;
      animation: rise 0.48s cubic-bezier(.22,.68,.12,1) both;
      animation-delay: calc(var(--i) * 70ms);
    }
    .reactor-lane::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(118deg, transparent 0 42%, color-mix(in srgb, var(--lane) 16%, transparent) 50%, transparent 59%);
      transform: translateX(-96%);
      animation: sweep 5.4s ease-in-out infinite;
      animation-delay: calc(var(--i) * -0.7s);
      pointer-events: none;
    }
    .reactor-lane[data-impact="usage"] { --lane: var(--green); }
    .reactor-lane[data-impact="local_only"] { --lane: var(--violet); }
    .reactor-lane[data-impact="not_usage"] { --lane: var(--gold); border-left: 1px dashed rgba(255,209,102,0.42); }
    .reactor-lane[data-impact="privacy"] { --lane: var(--cyan); }
    .reactor-lane[data-impact="publish"] { --lane: var(--pink); }
    .reactor-lane > * {
      position: relative;
      z-index: 1;
    }
    .reactor-lane span {
      display: inline-grid;
      place-items: center;
      width: 32px;
      height: 26px;
      color: #04100b;
      background: var(--lane);
      font-weight: 900;
    }
    .reactor-lane b {
      color: var(--ink);
      text-transform: uppercase;
      font-size: 10.5px;
      line-height: 1.16;
    }
    .reactor-meter {
      height: 8px;
      border: 1px solid color-mix(in srgb, var(--lane) 32%, transparent);
      background: rgba(0,0,0,0.34);
      overflow: hidden;
    }
    .reactor-meter i {
      display: block;
      width: var(--level);
      height: 100%;
      background: linear-gradient(90deg, var(--lane), #f5fff9);
      transform-origin: left;
      animation: reactorFill 3.6s ease-in-out infinite;
    }
    .reactor-lane small {
      color: var(--muted);
      line-height: 1.28;
      overflow-wrap: anywhere;
    }
    .reactor-note {
      margin: 0;
      padding: 10px;
      color: var(--muted);
      font-size: 10.5px;
      line-height: 1.35;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    .signal {
      border-top: 1px solid rgba(255,255,255,0.10);
      padding-top: 20px;
    }
    .signal-label {
      color: var(--muted);
      font-size: 12px;
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    .heatgrid {
      display: grid;
      grid-template-columns: repeat(14, 1fr);
      gap: 5px;
      max-width: 420px;
    }
    .heatgrid i {
      display: block;
      aspect-ratio: 1;
      border-radius: 3px;
      background: #ebedf0;
      opacity: 0.22;
      animation: heatFill 4.8s steps(5, end) infinite;
    }
    .heatgrid i:nth-child(4n) { background: #9be9a8; animation-delay: -0.7s; }
    .heatgrid i:nth-child(5n) { background: #40c463; animation-delay: -1.4s; }
    .heatgrid i:nth-child(7n) { background: #30a14e; animation-delay: -2.1s; }
    .heatgrid i:nth-child(11n) { background: #216e39; animation-delay: -3.1s; }
    .meta {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      margin-top: 18px;
    }
    .meta b {
      display: block;
      color: var(--ink);
      font-size: 22px;
      line-height: 1.1;
    }
    .meta span {
      color: var(--muted);
      font-size: 12px;
    }
    .terminal {
      position: relative;
      min-height: 620px;
      overflow: hidden;
    }
    .terminal::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(105deg, transparent 0 42%, rgba(57,255,136,0.12) 50%, transparent 58% 100%);
      transform: translateX(-120%);
      animation: sweep 5.2s ease-in-out infinite;
      pointer-events: none;
    }
    .termbar {
      height: 44px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 16px;
      border-bottom: 1px solid rgba(255,255,255,0.10);
      background: rgba(255,255,255,0.035);
      color: var(--muted);
      font-size: 12px;
    }
    .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--red); }
    .dot:nth-child(2) { background: var(--gold); }
    .dot:nth-child(3) { background: var(--green); }
    .term-title { margin-left: 8px; color: #d7eee5; }
    pre {
      position: relative;
      margin: 0;
      padding: 18px;
      max-height: calc(100vh - 140px);
      min-height: 576px;
      overflow: auto;
      white-space: pre;
      color: #d8ffe6;
      font-size: 13px;
      line-height: 1.38;
      text-shadow: 0 0 12px rgba(57,255,136,0.25);
    }
    .footer {
      color: var(--muted);
      font-size: 12px;
      line-height: 1.45;
    }
    @keyframes turn {
      0%, 100% { transform: perspective(460px) rotateY(0deg); filter: brightness(1); }
      48% { transform: perspective(460px) rotateY(18deg); filter: brightness(1.25); }
    }
    @keyframes sweep {
      0%, 38% { transform: translateX(-120%); }
      62%, 100% { transform: translateX(120%); }
    }
    @keyframes heatFill {
      0%, 100% { opacity: 0.22; transform: scale(0.96); }
      46% { opacity: 1; transform: scale(1); }
    }
    @keyframes rise {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes reactorFill {
      0%, 100% { transform: scaleX(0.72); filter: brightness(0.96); }
      48% { transform: scaleX(1); filter: brightness(1.25); }
    }
    @media (max-width: 920px) {
      .frame { grid-template-columns: 1fr; padding: 14px; }
      .intro, .terminal { min-height: auto; }
      pre { max-height: none; white-space: pre-wrap; overflow-wrap: anywhere; }
      .meta { grid-template-columns: 1fr; }
      .replay-grid { grid-template-columns: 1fr; }
      .passport-grid { grid-template-columns: 1fr; }
      .reactor-grid { grid-template-columns: 1fr; }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.001ms !important;
        animation-iteration-count: 1 !important;
        scroll-behavior: auto !important;
      }
    }
  </style>
</head>
<body>
  <main class="frame" aria-label="VibeTRACKER offline showcase">
    <section class="intro">
      <div>
        <div class="eyebrow">VTK://STATIC-GUI//OFFLINE//${escapeHtml(mode)}</div>
        <h1>VibeTRACKER</h1>
        <p class="lede">
          A local-first AI usage cockpit for coders, creators, researchers, and local
          model runners. This showcase is a static file: no provider calls, no upload,
          no script execution, and no secret reads.
        </p>
        <div class="logo" aria-label="animated C0VIBE logo">
          <span>C0</span><span>VI</span><span>BE</span>
        </div>
        <div class="chips" aria-label="provider signal colors">
          <span class="chip">Higgsfield MCP</span>
          <span class="chip">Codex CLI</span>
          <span class="chip">Ollama</span>
          <span class="chip">GitHub heatgrid</span>
          <span class="chip">ComfyUI</span>
        </div>
        <div class="replay" aria-label="scriptless live scan replay recorder">
          <div class="replay-head">VTK://SCAN-REPLAY//STATIC-GUI//NO-SCRIPT</div>
          <div class="replay-grid">
${replayCardsHtml()}
          </div>
          <div class="motion-credit" aria-label="open-source motion credits">
${visualCreditsHtml()}
          </div>
        </div>
        <div class="passport" aria-label="source-to-score passport">
          <div class="passport-head"><span>VTK://SOURCE-TO-SCORE//STATIC-GUI//OFFLINE</span><b>share kit runway</b></div>
          <div class="passport-grid">
${passportHtml()}
          </div>
          <p class="passport-note">profile, heatgrid, score, and badge share reviewed aggregates. No raw prompts, outputs, or secrets leave this demo. Trust stays NOT USAGE.</p>
        </div>
        <div class="reactor" aria-label="source-to-score reactor">
          <div class="reactor-head"><span>VTK://SCORE-REACTOR//STATIC-GUI//NO-TRUST-SPEND</span><b>profile proof engine</b></div>
          <div class="reactor-grid">
${reactorHtml()}
          </div>
          <p class="reactor-note">Usage and local rows feed the score. Trust side rails add context only: NOT USAGE, no spend, no rank inflation. Privacy and publish gates stay visible before c0vibe.app.</p>
        </div>
      </div>
      <div class="signal">
        <div class="signal-label">GitHub-style cadence signal, clearly labelled not usage</div>
        <div class="heatgrid" aria-hidden="true">
          ${Array.from({ length: 84 }, () => "<i></i>").join("")}
        </div>
        <div class="meta">
          <span><b>0</b> provider calls in this tour</span>
          <span><b>0</b> uploads before review</span>
          <span><b>∞</b> Vibers Unite at c0vibe.app</span>
        </div>
      </div>
      <p class="footer">
        Generated by <strong>vibetracker demo --html</strong>. Open this file anywhere;
        the terminal proof stays visible beside the GUI layer.
      </p>
    </section>
    <section class="terminal" aria-label="inline terminal showcase">
      <div class="termbar">
        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        <span class="term-title">vibetracker://showcase/inline-terminal</span>
      </div>
      <pre>${terminal}</pre>
    </section>
  </main>
</body>
</html>`;
}
