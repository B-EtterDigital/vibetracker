import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import Globe from "ascii-globe";
import cliSpinners from "cli-spinners";
import DrawilleCanvas from "drawille";
import type { ProviderDescriptor } from "../../adapters/src/registry.ts";
import type { SetupPlan } from "./wizard.ts";
import type { UsageAudit } from "./audit.ts";
import type { TrustSignal } from "../../core/src/schema/trust-signal.ts";
import { roadmapHighlights, roadmapSummary } from "../../core/src/capabilities/roadmap.ts";
import { providerBrand, providerStyle } from "./provider-brand.ts";

export interface WizardGuiState {
  providers: ProviderDescriptor[];
  plan: SetupPlan;
  audit: UsageAudit;
}

export interface WizardGuiDeps {
  open: (url: string) => void;
  log: (s: string) => void;
}

const esc = (s: unknown): string => String(s).replace(/[&<>"]/g, (c) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
}[c]!));

const jsonForScript = (value: unknown): string => JSON.stringify(value).replace(/</g, "\\u003c");

interface SurpriseScene {
  label: string;
  frames: string[];
  tone: string;
  log: string;
}

interface LogoSignal {
  label: string;
  tone: string;
  frames: string[];
}

interface SurpriseRelayPulse {
  id: string;
  phase: string;
  label: string;
  tone: string;
  mark: string;
  value: string;
  detail: string;
  terminal: string;
  meter: number;
}

interface WizardLineageLane {
  id: string;
  label: string;
  mark: string;
  tone: string;
  value: string;
  route: string;
  impact: "usage" | "not_usage" | "privacy" | "publish";
  meter: number;
  note: string;
  guardrail: string;
  terminal: string;
}

interface TerminalRecorderEvent {
  id: string;
  phase: string;
  label: string;
  mark: string;
  tone: string;
  impact: "usage" | "not_usage" | "local" | "privacy" | "publish";
  transcript: string;
  detail: string;
  meter: number;
}

interface WizardLaunchRunwayStep {
  id: string;
  phase: string;
  label: string;
  mark: string;
  tone: string;
  rail: "privacy" | "usage" | "not_usage" | "local" | "publish";
  command: string;
  detail: string;
  terminal: string;
  meter: number;
}

const frame = (lines: string[]): string => lines.join("\n");

function signalSeed(input: string): number {
  return Array.from(input).reduce((hash, char) => ((hash * 33) ^ char.charCodeAt(0)) >>> 0, 5381);
}

function buildBrailleSignalField(input: string, width = 24, height = 12): string {
  try {
    const canvas = new DrawilleCanvas(width, height);
    let seed = signalSeed(input);
    const next = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed;
    };
    for (let i = 0; i < 42; i += 1) {
      const x = next() % width;
      const y = next() % height;
      canvas.set(x, y);
      if (i % 6 === 0) canvas.set(Math.min(width - 1, x + 1), y);
      if (i % 8 === 0) canvas.set(x, Math.min(height - 1, y + 1));
    }
    const rows = canvas.frame().split("\n").filter((line) => line.trim()).slice(0, 4);
    return rows.length ? rows.join("\n") : "⠁ ⠂ ⠄ ⡀\n ⠈ ⠐ ⠠ ";
  } catch {
    return "⠁ ⠂ ⠄ ⡀\n ⠈ ⠐ ⠠ ";
  }
}

function buildWorldScanFrames(): string[] {
  const globe = new Globe({
    size: 0.36,
    land: "#",
    water: ".",
    background: " ",
    pin: "*",
    tilt: 18,
    pins: [
      { lat: 37.77, long: -122.42, char: "C" },
      { lat: 52.52, long: 13.4, char: "E" },
      { lat: 35.68, long: 139.69, char: "A" },
      { lat: 1.35, long: 103.82, char: "L" },
    ],
  });
  return [0, 45, 90, 135, 180, 225, 270, 315].map((rotation) => globe.render([rotation, 8]));
}

function buildLogoSignals(): LogoSignal[] {
  return [
    {
      label: "HIGGSFIELD MCP",
      tone: "higgsfield",
      frames: [
        frame([
          "   HIGGSFIELD TURN   ",
          "      /\\  HF  /\\     ",
          "  ___/  \\____/  \\___ ",
          "     credits awake   ",
        ]),
        frame([
          "   HIGGSFIELD TURN   ",
          "     <\\   HF   />    ",
          "  ____\\______/____   ",
          "    prism rotated    ",
        ]),
        frame([
          "   HIGGSFIELD TURN   ",
          "       /  HF  \\      ",
          "  ___ /________\\ ___ ",
          "   trust separated   ",
        ]),
        frame([
          "   HIGGSFIELD TURN   ",
          "      \\  HF  /       ",
          "  _____\\____/_____   ",
          "   video ledger hot  ",
        ]),
      ],
    },
    {
      label: "CODEX CLI trace",
      tone: "codex",
      frames: [
        frame([
          "     CODEX TRACE     ",
          "      {  C0  }       ",
          "   /dev/agent/log    ",
          "   proof side rail   ",
        ]),
        frame([
          "     CODEX TRACE     ",
          "     <{ C0 }/>       ",
          "   commits scanned   ",
          "   usage untouched   ",
        ]),
        frame([
          "     CODEX TRACE     ",
          "    [git][run][cc]   ",
          "   token day import  ",
          "   builder context   ",
        ]),
      ],
    },
    {
      label: "C0VIBE profile",
      tone: "c0vibe",
      frames: [
        frame([
          "     VIBERS UNITE    ",
          "   c0vibe.app pulse  ",
          "  creator coder lab  ",
          "   local proof first ",
        ]),
        frame([
          "     VIBERS UNITE    ",
          "    share card sync  ",
          "   trust rings lock  ",
          "   usage feed warms  ",
        ]),
        frame([
          "     VIBERS UNITE    ",
          "   public page ready ",
          "   not-usage labels  ",
          "   clean profile arc ",
        ]),
      ],
    },
  ];
}

function buildSurpriseFrames(providerCount: number): SurpriseScene[] {
  return [
    {
      label: "Higgsfield prism",
      tone: "higgsfield",
      log: "Higgsfield MCP authenticated; video credits become a labelled usage source",
      frames: [
        frame([
          "+----------------------+",
          "|   HIGGSFIELD PRISM   |",
          "|      /\\  HF  /\\      |",
          "|  ___/  \\____/  \\___  |",
          "| video credits: scan  |",
          "+----------------------+",
        ]),
        frame([
          "+----------------------+",
          "|   HIGGSFIELD PRISM   |",
          "|     <\\  HF  />       |",
          "|  ____\\______/____    |",
          "| credits ledger live  |",
          "+----------------------+",
        ]),
        frame([
          "+----------------------+",
          "|   HIGGSFIELD PRISM   |",
          "|       /  HF  \\       |",
          "|  ___ /________\\ ___  |",
          "| trust: separate tag  |",
          "+----------------------+",
        ]),
        frame([
          "+----------------------+",
          "|   HIGGSFIELD PRISM   |",
          "|      \\  HF  /        |",
          "|  _____\\____/_____    |",
          "| MCP proof stays side |",
          "+----------------------+",
        ]),
      ],
    },
    {
      label: "Codex builder glyph",
      tone: "codex",
      log: "CODEX CLI trace detected; builder evidence stays outside spend totals",
      frames: [
        frame([
          "+----------------------+",
          "|    CODEX BUILDER     |",
          "|    <  { }  /dev >    |",
          "|  commits != usage    |",
          "| builder proof: side  |",
          "+----------------------+",
        ]),
        frame([
          "+----------------------+",
          "|    CODEX BUILDER     |",
          "|   /dev/{agent}/log   |",
          "|  token days: import  |",
          "| proof rail: not use  |",
          "+----------------------+",
        ]),
        frame([
          "+----------------------+",
          "|    CODEX BUILDER     |",
          "|  [git] [cc] [audit]  |",
          "|  heatgrid animates   |",
          "| status: source side  |",
          "+----------------------+",
        ]),
      ],
    },
    {
      label: "Replicate run meter",
      tone: "replicate",
      log: "Replicate-style runs queue as image/video generations, with spend and proof separated",
      frames: [
        frame([
          "+----------------------+",
          "|   REPLICATE METER    |",
          "|  model/run/version   |",
          "|  prediction logs --> |",
          "|  media cost channel  |",
          "+----------------------+",
        ]),
        frame([
          "+----------------------+",
          "|   REPLICATE METER    |",
          "|  webhook/import/API  |",
          "|  usage records tick  |",
          "|  outputs not stored  |",
          "+----------------------+",
        ]),
      ],
    },
    {
      label: "Antigravity trace",
      tone: "antigravity",
      log: "Antigravity-style IDE and agent traces become builder context, not spend",
      frames: [
        frame([
          "+----------------------+",
          "| ANTIGRAVITY TRACE    |",
          "|     .----.           |",
          "|  --/ code \\--        |",
          "| builder proof orbit  |",
          "+----------------------+",
        ]),
        frame([
          "+----------------------+",
          "| ANTIGRAVITY TRACE    |",
          "|        .----.        |",
          "|  agent / plan \\ run  |",
          "| trust signal only    |",
          "+----------------------+",
        ]),
      ],
    },
    {
      label: "Local model sonar",
      tone: "local",
      log: "Ollama, LM Studio, ComfyUI, and vLLM scan as local-first sources",
      frames: [
        frame([
          "+----------------------+",
          "|  LOCAL MODEL SONAR   |",
          "|  ollama   LM Studio  |",
          "|  comfyui  vLLM       |",
          "| ports: 11434/1234    |",
          "+----------------------+",
        ]),
        frame([
          "+----------------------+",
          "|  LOCAL MODEL SONAR   |",
          "|  127.0.0.1 .. ping   |",
          "|  openai-compatible   |",
          "| proxy path prepared  |",
          "+----------------------+",
        ]),
      ],
    },
    {
      label: "ComfyUI node bloom",
      tone: "comfyui",
      log: "ComfyUI workflows light up as local graph activity, with manual opt-in import",
      frames: [
        frame([
          "+----------------------+",
          "|   COMFYUI NODE MAP   |",
          "| [txt]--[ksampler]    |",
          "|    \\--[vae]--[png]  |",
          "| workflow seen local  |",
          "+----------------------+",
        ]),
        frame([
          "+----------------------+",
          "|   COMFYUI NODE MAP   |",
          "| [lora]--[controlnet] |",
          "|       \\__[save]      |",
          "| import waits on you  |",
          "+----------------------+",
        ]),
      ],
    },
    {
      label: "Creator studio sweep",
      tone: "creator",
      log: "Creator tools enter through ledgers, subscriptions, imports, or manual proof",
      frames: [
        frame([
          "+----------------------+",
          "| CREATOR STUDIO SWEEP |",
          "| video image voice 3d |",
          "| canva runway luma    |",
          "| manual ledgers ready |",
          "+----------------------+",
        ]),
        frame([
          "+----------------------+",
          "| CREATOR STUDIO SWEEP |",
          "| music audio assets   |",
          "| subscriptions split  |",
          "| ROI notes attached   |",
          "+----------------------+",
        ]),
      ],
    },
    {
      label: "China / EU pass",
      tone: "global",
      log: "Chinese, European, and regional providers are scanned with branded adapter boundaries",
      frames: [
        frame([
          "+----------------------+",
          "|  GLOBAL ADAPTER PASS |",
          "| qwen kimi doubao EU  |",
          "| mistral lighton aleph|",
          "| regional labels set  |",
          "+----------------------+",
        ]),
        frame([
          "+----------------------+",
          "|  GLOBAL ADAPTER PASS |",
          "| auth/import/proxy    |",
          "| source mix remains   |",
          "| honest per provider  |",
          "+----------------------+",
        ]),
      ],
    },
    {
      label: "Vibers Unite",
      tone: "c0vibe",
      log: "Vibers Unite banner raised for c0vibe.app profile sharing",
      frames: [
        frame([
          "+----------------------+",
          "|     VIBERS UNITE     |",
          "|  c0vibe.app online   |",
          "|  creator + coder +   |",
          "|  researcher signals  |",
          "+----------------------+",
        ]),
        frame([
          "+----------------------+",
          "|     VIBERS UNITE     |",
          "|  share card warming  |",
          "|  profile feed ready  |",
          "|  local proof first   |",
          "+----------------------+",
        ]),
      ],
    },
    {
      label: "Provider matrix",
      tone: "matrix",
      log: `${providerCount} providers mapped; API, local, proxy, manual, and trust signals stay labelled`,
      frames: [
        frame([
          "+----------------------+",
          `| ${String(providerCount).padStart(3, "0")} PROVIDERS MAPPED  |`,
          "|  api local manual    |",
          "|  trust labels locked |",
          "|  totals stay honest  |",
          "+----------------------+",
        ]),
        frame([
          "+----------------------+",
          `| ${String(providerCount).padStart(3, "0")} PROVIDERS MAPPED  |`,
          "|  built proxy import  |",
          "|  source mix audited  |",
          "|  upload dry-run safe |",
          "+----------------------+",
        ]),
      ],
    },
  ];
}

function providerState(p: ProviderDescriptor, plan: SetupPlan, tracked: Set<string>): string {
  if (tracked.has(p.id)) return "tracked";
  if (plan.autoLocal.includes(p.id)) return "detected";
  if (plan.autoEnv.includes(p.id)) return "env";
  if (plan.needsKey.some((k) => k.id === p.id)) return "key";
  if (plan.proxy.includes(p.id)) return "proxy";
  if (plan.manual.includes(p.id) || p.tier === "manual") return "manual";
  return p.status;
}

function connectHint(p: ProviderDescriptor, state: string): string {
  if (state === "tracked") return "Already has usage records";
  if (state === "detected" || state === "env") return `Run: vibetracker sync --provider ${p.id}`;
  if (state === "key") return `Run: vibetracker connect ${p.id}`;
  if (state === "proxy") return `Run: vibetracker proxy --provider ${p.id} --target <base-url>`;
  if (state === "manual") return `Run: vibetracker add ${p.id} --usd <amount>`;
  return "Mapped in catalog; adapter still planned";
}

function githubHeatgrid(signal: TrustSignal): string {
  if (signal.kind !== "github_activity" || !signal.days?.length) return "";
  const pad = new Date(`${signal.days[0].date}T00:00:00Z`).getUTCDay();
  const blanks = Array.from({ length: pad }, (_, i) => `<span class="ghcell blank" style="--i:${i}"></span>`).join("");
  const cells = signal.days.map((d, i) =>
    `<span class="ghcell l${d.level}" style="--i:${i + pad}" title="${esc(`${d.date}: ${d.count} contribution${d.count === 1 ? "" : "s"}`)}"></span>`).join("");
  return `<div class="github-panel">
    <div class="github-panel__top"><strong>GitHub activity</strong><span>NOT USAGE</span></div>
    <div class="github-panel__meta"><span>@${esc(signal.handle)}</span><span>${signal.totalContributions.toLocaleString("en-US")} contributions/${signal.windowDays}d</span></div>
    <div class="ghgrid" aria-label="GitHub contribution heatgrid">${blanks}${cells}</div>
    <p>Official GitHub contribution colors. This is evidence context only and never changes usage totals.</p>
  </div>`;
}

function shortHash(hash: string): string {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

function renderAuditProofConsole(audit: UsageAudit): string {
  const sourceRows = audit.sourceMix.length
    ? audit.sourceMix.slice(0, 4).map((source, index) => `<div class="proof-source" style="--i:${index};--w:${source.pct}">
        <span>${esc(source.label)}</span><b>${source.pct}%</b><i></i>
      </div>`).join("")
    : `<div class="proof-empty">No usage records yet. The proof rail will fill after sync.</div>`;
  const fresh = audit.freshness.filter((row) => row.status === "fresh").length;
  const warm = audit.freshness.filter((row) => row.status === "warm").length;
  const stale = audit.freshness.filter((row) => row.status === "stale").length;
  return `<section class="proof-console" aria-label="Inline audit proof console">
    <div class="proof-console__head">
      <span>VTK://AUDIT-CORE//INLINE-GUI</span>
      <b>LOCAL PROOF</b>
    </div>
    <div class="proof-grid">
      <div class="proof-node">
        <span>Usage counted</span>
        <b>${audit.totals.records.toLocaleString("en-US")}</b>
        <small>${audit.totals.providers} provider${audit.totals.providers === 1 ? "" : "s"}${audit.totals.usd != null ? ` / ${esc(`$${audit.totals.usd.toFixed(2)}`)} est.` : ""}</small>
      </div>
      <div class="proof-node">
        <span>Trust lane</span>
        <b>${audit.trustSignals.length}</b>
        <small>NOT USAGE / separate evidence</small>
      </div>
      <div class="proof-node">
        <span>Freshness</span>
        <b>${fresh}/${audit.freshness.length}</b>
        <small>fresh ${fresh} / warm ${warm} / stale ${stale}</small>
      </div>
      <div class="proof-node">
        <span>Integrity</span>
        <b>${esc(shortHash(audit.integrity.bundleFingerprint))}</b>
        <small>bundle hash / local ledger</small>
      </div>
    </div>
    <div class="proof-source-stack">${sourceRows}</div>
  </section>`;
}

function renderProviderCheckpoints(audit: UsageAudit, providers: ProviderDescriptor[]): string {
  const labels = new Map(providers.map((provider) => [provider.id, provider.label]));
  const rows = audit.freshness.length
    ? audit.freshness.slice(0, 5).map((row, index) => {
      const brand = providerBrand(row.provider, labels.get(row.provider));
      return `<div class="checkpoint" data-status="${esc(row.status)}" style="${providerStyle(row.provider, labels.get(row.provider))};--i:${index}">
        <span class="checkpoint__mark">${esc(brand.mark)}</span>
        <div><b>${esc(labels.get(row.provider) ?? row.provider)}</b><small>${esc(row.status)} / ${row.ageDays}d / ${esc(row.lastEvent.slice(0, 10))}</small></div>
        <em>${row.status === "fresh" ? "LOCK" : row.status === "warm" ? "WATCH" : "RECHECK"}</em>
      </div>`;
    }).join("")
    : `<div class="checkpoint checkpoint--empty"><span class="checkpoint__mark">--</span><div><b>No provider checkpoints yet</b><small>Run sync to light up this rail.</small></div><em>READY</em></div>`;
  return `<section class="checkpoint-rail" aria-label="Provider collection checkpoints">
    <div class="proof-console__head"><span>VTK://COLLECT-CHECKPOINTS//INLINE-GUI</span><b>PROVIDER RAIL</b></div>
    ${rows}
  </section>`;
}

function renderSignalTheatre(state: WizardGuiState): string {
  const providerIds = new Set(state.providers.map((provider) => provider.id));
  const localIds = ["ollama", "lmstudio", "comfyui", "vllm", "localai"];
  const localMapped = localIds.filter((id) => providerIds.has(id)).length;
  const hasHiggsfield = providerIds.has("higgsfield");
  const codingMapped = state.providers.filter((provider) => provider.categories.includes("coding")).length;
  const brailleMark = buildBrailleSignalField(`wizard:${state.providers.length}:${state.audit.coverage.tracked}`);
  const cells = [
    {
      tone: "higgsfield",
      label: "Higgsfield prism turntable",
      mark: ["  .-HF-.  ", " /  |  \\ ", "| prism |"].join("\n"),
      value: hasHiggsfield ? "mapped" : "catalog",
      note: "Usage source only after consented MCP or ledger sync.",
    },
    {
      tone: "codex",
      label: "Codex trust trace",
      mark: [" +----+  ", "| CX |   ", "| git|   "].join("\n"),
      value: `${state.audit.trustSignals.length} trust`,
      note: "Builder activity stays NOT USAGE and never spend.",
    },
    {
      tone: "local",
      label: "Local loopback sonar",
      mark: [" ((LM))  ", " [ CU ]  ", " 127.0.0 "].join("\n"),
      value: `${localMapped}/${localIds.length}`,
      note: "Ollama, LM Studio, ComfyUI, llama.cpp, Jan, GPT4All, and vLLM stay on-machine.",
    },
    {
      tone: "c0vibe",
      label: "C0VIBE relay",
      mark: [" C0\\ /   ", " VIBE    ", " UNITE   "].join("\n"),
      value: `${state.audit.coverage.tracked}/${state.audit.coverage.available}`,
      note: "Vibers Unite. Share at c0vibe.app only after review.",
    },
    {
      tone: "drawille",
      label: "Drawille braille field",
      mark: brailleMark,
      value: "unicode",
      note: "Open-source braille pixels make scan state visible without a heavy TUI.",
    },
  ];
  const rows = cells.map((cell, index) => `<article class="signal-theatre__cell" data-tone="${esc(cell.tone)}" style="--i:${index}">
    <pre>${esc(cell.mark)}</pre>
    <div><b>${esc(cell.label)}</b><span>${esc(cell.value)}</span><small>${esc(cell.note)}</small></div>
  </article>`).join("");
  return `<section class="signal-theatre" aria-label="Nerdy scan signal theatre">
    <div class="proof-console__head"><span>VTK://SIGNAL-THEATRE//SURPRISE-RAIL</span><b>SCAN MOMENTS</b></div>
    <div class="signal-theatre__grid">${rows}</div>
    <p>Every flash is feedback from provider metadata, local audit state, or trust evidence. Usage totals change only after validated records land.</p>
  </section>`;
}

function renderTerminalDock(state: WizardGuiState): string {
  const localIds = ["ollama", "lmstudio", "comfyui", "vllm", "localai"];
  const providerIds = new Set(state.providers.map((provider) => provider.id));
  const localMapped = localIds.filter((id) => providerIds.has(id)).length;
  const steps = [
    {
      tone: "catalog",
      code: "01",
      label: "Catalog sweep",
      meter: 28,
      detail: `${state.providers.length} provider cards staged with branded boundaries`,
      log: `catalog sweep staged ${state.providers.length} provider cards`,
    },
    {
      tone: "local",
      code: "02",
      label: "Local probes",
      meter: 52,
      detail: `${localMapped}/${localIds.length} local surfaces mapped; keys masked in terminal`,
      log: `local probes mapped ${localMapped}/${localIds.length} machine-first surfaces`,
    },
    {
      tone: "trust",
      code: "03",
      label: "Trust split",
      meter: 76,
      detail: `${state.audit.trustSignals.length} trust signal${state.audit.trustSignals.length === 1 ? "" : "s"} separated from usage totals`,
      log: `trust split confirmed; usage totals only move after validated records`,
    },
    {
      tone: "publish",
      code: "04",
      label: "C0VIBE guard",
      meter: 100,
      detail: "dry-run before c0vibe.app publish; Vibers Unite only after review",
      log: "publish guard armed; dry-run before c0vibe.app profile sync",
    },
  ];
  const rows = steps.map((step, index) => `<button type="button" class="dock-step${index === 0 ? " active" : ""}" data-dock-step="${index}" data-log="${esc(step.log)}" data-tone="${esc(step.tone)}" style="--i:${index};--meter:${step.meter}%">
    <span>${esc(step.code)}</span>
    <b>${esc(step.label)}</b>
    <small>${esc(step.detail)}</small>
    <i></i>
  </button>`).join("");
  return `<section class="terminal-dock" aria-label="Inline terminal relay dock">
    <div class="proof-console__head"><span>VTK://GUI-TERMINAL-DOCK//VIBERS-UNITE</span><b>SOURCE TERMINAL</b></div>
    <div class="dock-grid">${rows}</div>
    <p>Dock stage rotates with scan, surprise, and provider collection feedback. The GUI mirrors the shell; it never hides what leaves the machine.</p>
  </section>`;
}

function buildWizardLineageLanes(state: WizardGuiState): WizardLineageLane[] {
  const localCount = state.plan.autoLocal.length + state.plan.proxy.length;
  const keyCount = state.plan.needsKey.length;
  const manualCount = state.plan.manual.length;
  const detectedCount = state.plan.autoEnv.length + state.plan.autoLocal.length;
  const records = state.audit.totals.records.toLocaleString("en-US");
  const tracked = state.audit.coverage.tracked.toLocaleString("en-US");
  const trust = state.audit.trustSignals.length.toLocaleString("en-US");
  const bundle = shortHash(state.audit.integrity.bundleFingerprint);
  return [
    {
      id: "catalog",
      label: "Catalog to setup",
      mark: "01",
      tone: "catalog",
      value: `${state.providers.length} providers`,
      route: "provider registry -> setup plan",
      impact: "privacy",
      meter: Math.min(100, Math.max(22, state.providers.length)),
      note: "Cards are staged before any collection starts.",
      guardrail: "Provider presence is setup context, not usage.",
      terminal: `lineage catalog staged ${state.providers.length} providers; no records collected`,
    },
    {
      id: "credentials",
      label: "Credential split",
      mark: "02",
      tone: "privacy",
      value: `${detectedCount}/${keyCount}/${localCount}/${manualCount}`,
      route: "env + local + key + manual",
      impact: "privacy",
      meter: Math.min(100, 18 + detectedCount * 14 + localCount * 10),
      note: "Detected local/env rails, pasted keys, proxies, and manual ledgers stay separated.",
      guardrail: "Keys stay masked in the terminal; browser only shows commands.",
      terminal: `lineage credential split detected ${detectedCount}, key ${keyCount}, local ${localCount}, manual ${manualCount}`,
    },
    {
      id: "collect",
      label: "Collect records",
      mark: "03",
      tone: "usage",
      value: `${records} rows`,
      route: "sync -> local ledger",
      impact: "usage",
      meter: state.audit.totals.records ? 100 : 22,
      note: "Only validated provider records move usage, spend, credits, score, and leaderboard totals.",
      guardrail: "Animations never promote planned providers into usage.",
      terminal: `lineage collect ${records} validated rows; usage waits for ledger truth`,
    },
    {
      id: "validate",
      label: "Validate bundle",
      mark: "04",
      tone: "ledger",
      value: bundle,
      route: "audit -> redaction -> dry run",
      impact: "usage",
      meter: state.audit.integrity.recordCount ? 100 : 34,
      note: "Integrity, freshness, anomalies, and source mix are checked before upload.",
      guardrail: "No prompts, outputs, or secrets leave the machine in the aggregate stream.",
      terminal: `lineage validate bundle ${bundle}; dry-run review required`,
    },
    {
      id: "trust",
      label: "Trust side rail",
      mark: "NO",
      tone: "trust",
      value: `${trust} signals`,
      route: "github/creator -> side rail",
      impact: "not_usage",
      meter: state.audit.trustSignals.length ? Math.min(100, 36 + state.audit.trustSignals.length * 18) : 20,
      note: "GitHub, creator cadence, and profile context explain the operator without becoming spend.",
      guardrail: "NOT USAGE. Cannot change spend, credits, operations, rank, or verified status.",
      terminal: `lineage trust ${trust} signals routed to NOT USAGE side rail`,
    },
    {
      id: "publish",
      label: "C0VIBE relay",
      mark: "C0",
      tone: "publish",
      value: "c0vibe.app",
      route: "review -> profile datastream",
      impact: "publish",
      meter: state.audit.coverage.tracked ? 94 : 42,
      note: "Profile, heatgrid, score, and badges feed from the reviewed aggregate stream.",
      guardrail: "Vibers Unite only after explicit aggregate review.",
      terminal: `lineage relay ${tracked} tracked sources toward c0vibe.app after review`,
    },
  ];
}

function renderWizardLineageDeck(state: WizardGuiState): string {
  const lanes = buildWizardLineageLanes(state);
  const rows = lanes.map((lane, index) => `<button type="button" class="lineage-step${index === 0 ? " active" : ""}" data-lineage-step="${index}" data-lineage-id="${esc(lane.id)}" data-tone="${esc(lane.tone)}" data-impact="${esc(lane.impact)}" data-log="${esc(lane.terminal)}" data-guardrail="${esc(lane.guardrail)}" style="--i:${index};--meter:${lane.meter}%">
    <span>${esc(lane.mark)}</span>
    <div><em>${esc(lane.impact === "not_usage" ? "NOT USAGE" : lane.impact.toUpperCase())}</em><b>${esc(lane.label)}</b><small>${esc(lane.note)}</small></div>
    <strong>${esc(lane.value)}</strong>
    <code>${esc(lane.route)}</code>
    <i></i>
  </button>`).join("");
  return `<section class="lineage-deck" aria-label="First-run source-to-score lineage">
    <div class="proof-console__head"><span>VTK://WIZARD-LINEAGE//SOURCE-TO-SCORE//NO-RAW-PROMPTS</span><b>DATASTREAM PATH</b></div>
    <div class="lineage-track">${rows}</div>
    <p>First-run lineage: setup -> collect -> validate -> trust side rail -> c0vibe.app. The profile, heatgrid, score, and badges read reviewed aggregates only.</p>
  </section>`;
}

function buildSurpriseRelayPulses(state: WizardGuiState): SurpriseRelayPulse[] {
  const providerIds = new Set(state.providers.map((provider) => provider.id));
  const localIds = ["ollama", "lmstudio", "comfyui", "vllm", "localai"];
  const localMapped = localIds.filter((id) => providerIds.has(id)).length;
  const hasHiggsfield = providerIds.has("higgsfield");
  const records = state.audit.totals.records.toLocaleString("en-US");
  return [
    {
      id: "pre_scan_higgsfield",
      phase: "pre-scan",
      label: "Higgsfield prism queued",
      tone: "higgsfield",
      mark: "HF",
      value: hasHiggsfield ? "MCP mapped" : "catalog",
      detail: "First reveal appears before collection starts; usage waits for consented readout.",
      terminal: "pre-scan HF prism turns; no provider row collected yet",
      meter: hasHiggsfield ? 84 : 32,
    },
    {
      id: "trust_codex",
      phase: "scan",
      label: "Codex glyph sidecar",
      tone: "codex",
      mark: "CX",
      value: `${state.audit.trustSignals.length} trust`,
      detail: "Builder and GitHub context animates on a separate NOT USAGE rail.",
      terminal: "Codex builder glyph routed to trust lane, not spend",
      meter: state.audit.trustSignals.length ? 74 : 38,
    },
    {
      id: "local_loopback",
      phase: "collect",
      label: "Local loopback ping",
      tone: "local",
      mark: "LM",
      value: `${localMapped}/${localIds.length}`,
      detail: "Ollama, LM Studio, ComfyUI, and vLLM pings stay on the machine.",
      terminal: "local AI sonar swept loopback surfaces only",
      meter: Math.round((localMapped / localIds.length) * 100),
    },
    {
      id: "ledger_seal",
      phase: "validate",
      label: "Ledger seal",
      tone: "ledger",
      mark: "OK",
      value: `${records} rows`,
      detail: "Only validated records move usage, spend, credits, score, and leaderboard totals.",
      terminal: "validation seal checked; animation cannot promote unverified source rows",
      meter: state.audit.totals.records ? 100 : 28,
    },
    {
      id: "c0vibe_relay",
      phase: "relay",
      label: "Vibers Unite relay",
      tone: "c0vibe",
      mark: "C0",
      value: "c0vibe.app",
      detail: "The profile beacon waits for dry-run review before anything is published.",
      terminal: "Vibers Unite relay armed for c0vibe.app after review",
      meter: 92,
    },
  ];
}

function renderSurpriseEncoreRelay(state: WizardGuiState): string {
  const pulses = buildSurpriseRelayPulses(state);
  const rows = pulses.map((pulse, index) => `<button type="button" class="surprise-encore__pulse${index === 0 ? " active" : ""}" data-relay-pulse="${index}" data-tone="${esc(pulse.tone)}" data-log="${esc(pulse.terminal)}" style="--i:${index};--meter:${pulse.meter}%">
    <span>${esc(pulse.mark)}</span>
    <div><em>${esc(pulse.phase)}</em><b>${esc(pulse.label)}</b><small>${esc(pulse.detail)}</small></div>
    <strong>${esc(pulse.value)}</strong>
    <i></i>
  </button>`).join("");
  return `<section class="surprise-encore" aria-label="Surprise timing relay">
    <div class="proof-console__head"><span>VTK://SURPRISE-ENCORE//QUEUE-SCAN-VALIDATE-RELAY</span><b>JOY WITH PROOF</b></div>
    <div class="surprise-encore__track">${rows}</div>
    <p>Surprise cadence: queue -> scan -> collect -> validate -> relay. Art follows source truth; ledger rows decide totals.</p>
  </section>`;
}

function buildTerminalRecorderEvents(state: WizardGuiState): TerminalRecorderEvent[] {
  const providerIds = new Set(state.providers.map((provider) => provider.id));
  const localIds = ["ollama", "lmstudio", "comfyui", "vllm", "localai"];
  const localMapped = localIds.filter((id) => providerIds.has(id)).length;
  const records = state.audit.totals.records.toLocaleString("en-US");
  const bundle = shortHash(state.audit.integrity.bundleFingerprint);
  const hasHiggsfield = providerIds.has("higgsfield");
  return [
    {
      id: "shell_source",
      phase: "00 boot",
      label: "Shell mirrors into GUI",
      mark: "VT",
      tone: "privacy",
      impact: "privacy",
      transcript: "$ vibetracker init --gui // terminal remains source of truth",
      detail: "The browser shows a local cockpit; keys and shutdown stay in the shell.",
      meter: 34,
    },
    {
      id: "queue_prism",
      phase: "01 queue",
      label: "Higgsfield prism wakes",
      mark: "HF",
      tone: "higgsfield",
      impact: "usage",
      transcript: hasHiggsfield ? "[queue] HF MCP mapped; waiting for consented usage readout" : "[queue] HF catalog mark ready; no usage row exists",
      detail: "ASCII can turn before collection, but only accepted rows become usage.",
      meter: hasHiggsfield ? 82 : 32,
    },
    {
      id: "scan_trust",
      phase: "02 scan",
      label: "Codex trust cube turns",
      mark: "CX",
      tone: "codex",
      impact: "not_usage",
      transcript: "[scan] Codex/GitHub evidence routed to NOT USAGE side rail",
      detail: "Builder context can improve trust presentation without moving spend totals.",
      meter: state.audit.trustSignals.length ? 76 : 38,
    },
    {
      id: "local_probe",
      phase: "03 collect",
      label: "Local sonar stays local",
      mark: "LM",
      tone: "local",
      impact: "local",
      transcript: `[collect] loopback surfaces mapped ${localMapped}/${localIds.length}; no cloud upload`,
      detail: "Ollama, LM Studio, ComfyUI, llama.cpp, Jan, GPT4All, vLLM, and local proxies stay on-machine.",
      meter: Math.max(22, Math.round((localMapped / localIds.length) * 100)),
    },
    {
      id: "ledger_lock",
      phase: "04 validate",
      label: "Ledger rows decide truth",
      mark: "OK",
      tone: "ledger",
      impact: "usage",
      transcript: `[validate] ${records} accepted row(s); bundle ${bundle}; dry-run next`,
      detail: "Animations never promote planned providers, rejected rows, or trust signals.",
      meter: state.audit.totals.records ? 100 : 28,
    },
    {
      id: "publish_gate",
      phase: "05 relay",
      label: "C0VIBE relay waits",
      mark: "C0",
      tone: "c0vibe",
      impact: "publish",
      transcript: "[relay] c0vibe.app profile waits for upload --dry-run review",
      detail: "Profile, heatgrid, score, and badges use reviewed aggregate datastreams.",
      meter: state.audit.coverage.tracked ? 94 : 42,
    },
  ];
}

function renderTerminalRecorder(state: WizardGuiState): string {
  const events = buildTerminalRecorderEvents(state);
  const rows = events.map((event, index) => `<button type="button" class="terminal-recorder__event${index === 0 ? " active" : ""}" data-recorder-event="${index}" data-tone="${esc(event.tone)}" data-impact="${esc(event.impact)}" data-log="${esc(event.transcript)}" style="--i:${index};--meter:${event.meter}%">
    <span>${esc(event.mark)}</span>
    <div><em>${esc(event.phase)} / ${esc(event.impact === "not_usage" ? "NOT USAGE" : event.impact.toUpperCase())}</em><b>${esc(event.label)}</b><small>${esc(event.detail)}</small><code>${esc(event.transcript)}</code></div>
    <strong>${esc(String(event.meter).padStart(2, "0"))}%</strong>
  </button>`).join("");
  return `<section class="terminal-recorder" aria-label="Embedded terminal black box recorder">
    <div class="proof-console__head"><span>VTK://GUI-BLACK-BOX//TERMINAL-RECORDER//NO-SECRETS</span><b>BLACK BOX</b></div>
    <pre class="terminal-recorder__screen">+-- VibeTRACKER local recorder --+
| queue -> scan -> validate -> relay |
| NO RAW PROMPTS  NO OUTPUTS  NO SECRETS |
| trust side rail: NOT USAGE / no rank impact |
+-- replay metadata only --+</pre>
    <div class="terminal-recorder__events">${rows}</div>
    <p>Embedded terminal recorder: replayable scan feedback, provider marks, and aggregate checkpoints only. It stores no prompts, model outputs, pasted keys, or hidden usage.</p>
  </section>`;
}

export function renderGuiLaunchHandoff(state: WizardGuiState, url: string): string {
  const localCount = state.plan.autoLocal.length + state.plan.proxy.length;
  const tracked = state.audit.coverage.tracked;
  const trustSignals = state.audit.trustSignals.length;
  const providerCount = state.providers.length;
  return [
    "+------------------------------------------------------+",
    "| VTK://TERMINAL-TO-GUI//LOCAL-WIZARD//VIBERS-UNITE    |",
    "|------------------------------------------------------|",
    "| shell stays source of truth; browser becomes cockpit |",
    `| providers ${String(providerCount).padStart(3)} // tracked ${String(tracked).padStart(3)} // local ${String(localCount).padStart(3)}              |`,
    `| trust signals ${String(trustSignals).padStart(3)} // NOT USAGE // c0vibe.app review       |`,
    "| keys stay masked in terminal; localhost token below  |",
    `| open ${url.slice(0, 46).padEnd(46)} |`,
    "+------------------------------------------------------+",
  ].join("\n");
}

function renderLaunchHandoffPanel(state: WizardGuiState): string {
  const localCount = state.plan.autoLocal.length + state.plan.proxy.length;
  const trustSignals = state.audit.trustSignals.length;
  return `<section class="launch-handoff" aria-label="Terminal to GUI launch handoff">
    <div class="launch-handoff__head"><span>VTK://TERMINAL-TO-GUI//INLINE-HANDOFF</span><b>JUMP READY</b></div>
    <div class="launch-handoff__body">
      <pre>shell proof
   |
   v
GUI cockpit</pre>
      <div class="launch-handoff__copy">
        <strong>Terminal charm jumps into the GUI.</strong>
        <p>The browser is the control room; this shell remains the local source of truth for masked keys, sync output, and shutdown.</p>
        <div class="launch-handoff__meters" aria-label="Launch handoff meters">
          <span><b>${state.providers.length}</b><small>providers staged</small></span>
          <span><b>${localCount}</b><small>local rails</small></span>
          <span><b>${trustSignals}</b><small>trust / NOT USAGE</small></span>
          <span><b>${state.audit.coverage.tracked}</b><small>tracked sources</small></span>
        </div>
      </div>
    </div>
  </section>`;
}

function buildWizardLaunchRunway(state: WizardGuiState): WizardLaunchRunwayStep[] {
  const providerIds = new Set(state.providers.map((provider) => provider.id));
  const hasHiggsfield = providerIds.has("higgsfield");
  const localCount = state.plan.autoLocal.length + state.plan.proxy.length;
  const trustSignals = state.audit.trustSignals.length;
  const tracked = state.audit.coverage.tracked.toLocaleString("en-US");
  return [
    {
      id: "boot",
      phase: "00 boot",
      label: "Terminal boot",
      mark: "VT",
      tone: "privacy",
      rail: "privacy",
      command: "vibetracker init --gui",
      detail: "Shell stays source of truth; browser gets a local token and a better cockpit.",
      terminal: "runway boot: shell source locked, GUI cockpit armed",
      meter: 38,
    },
    {
      id: "catalog",
      phase: "01 catalog",
      label: "Provider scanline",
      mark: String(state.providers.length).padStart(2, "0"),
      tone: "catalog",
      rail: "privacy",
      command: "provider registry -> setup plan",
      detail: `${state.providers.length} branded provider cards staged before any usage row exists.`,
      terminal: `runway catalog: ${state.providers.length} providers staged with branded boundaries`,
      meter: Math.min(96, Math.max(30, state.providers.length)),
    },
    {
      id: "higgsfield",
      phase: "02 creator",
      label: "Higgsfield prism",
      mark: "HF",
      tone: "higgsfield",
      rail: "usage",
      command: "vibetracker sync --provider higgsfield",
      detail: hasHiggsfield
        ? "Higgsfield MCP/ledger rail is mapped; animation can turn while usage waits for accepted rows."
        : "Higgsfield creator rail is ready in the catalog; no usage row is invented.",
      terminal: hasHiggsfield
        ? "runway Higgsfield: prism turn queued for consented usage readout"
        : "runway Higgsfield: catalog mark ready, usage still empty",
      meter: hasHiggsfield ? 86 : 34,
    },
    {
      id: "local",
      phase: "03 local",
      label: "Local lab sonar",
      mark: "LM",
      tone: "local",
      rail: "local",
      command: "vibetracker detect --local",
      detail: `${localCount} local/proxy rail${localCount === 1 ? "" : "s"} prepared for Ollama, LM Studio, ComfyUI, and loopback tools.`,
      terminal: `runway local: ${localCount} local/proxy rails prepared; no cloud upload`,
      meter: Math.min(100, Math.max(26, 28 + localCount * 16)),
    },
    {
      id: "trust",
      phase: "04 side rail",
      label: "Trust split",
      mark: "NO",
      tone: "trust",
      rail: "not_usage",
      command: "vibetracker trust signals",
      detail: `${trustSignals} trust signal${trustSignals === 1 ? "" : "s"} can animate profile context but cannot change usage totals.`,
      terminal: `runway trust: ${trustSignals} NOT USAGE signals routed outside spend`,
      meter: trustSignals ? Math.min(100, 42 + trustSignals * 16) : 30,
    },
    {
      id: "relay",
      phase: "05 relay",
      label: "C0VIBE relay",
      mark: "C0",
      tone: "c0vibe",
      rail: "publish",
      command: "vibetracker upload --dry-run",
      detail: `${tracked} tracked source${state.audit.coverage.tracked === 1 ? "" : "s"} can feed c0vibe.app only after aggregate review. Vibers Unite.`,
      terminal: `runway relay: ${tracked} tracked sources wait for c0vibe.app dry-run review`,
      meter: state.audit.coverage.tracked ? 94 : 42,
    },
  ];
}

function renderWizardLaunchRunway(state: WizardGuiState): string {
  const steps = buildWizardLaunchRunway(state);
  const rows = steps.map((step, index) => `<button type="button" class="launch-runway__step${index === 0 ? " active" : ""}" data-runway-step="${index}" data-tone="${esc(step.tone)}" data-rail="${esc(step.rail)}" data-log="${esc(step.terminal)}" style="--i:${index};--meter:${step.meter}%">
    <span>${esc(step.mark)}</span>
    <div><em>${esc(step.phase)} / ${esc(step.rail === "not_usage" ? "NOT USAGE" : step.rail.toUpperCase())}</em><b>${esc(step.label)}</b><small>${esc(step.detail)}</small><code>${esc(step.command)}</code></div>
    <strong>${esc(String(step.meter).padStart(2, "0"))}%</strong>
  </button>`).join("");
  return `<section class="launch-runway" aria-label="First-run launch runway">
    <div class="proof-console__head"><span>VTK://WIZARD-LAUNCH-RUNWAY//BOOT-SCAN-RELAY</span><b>FIRST RUN</b></div>
    <div class="launch-runway__track">${rows}</div>
    <p>Runway order: terminal boot -> provider scan -> Higgsfield creator rail -> local sonar -> trust split -> c0vibe.app relay. Motion is feedback; validated records decide usage.</p>
  </section>`;
}

export function renderWizardGuiHtml(state: WizardGuiState): string {
  const tracked = new Set(state.audit.freshness.map((f) => f.provider));
  const roadmap = roadmapSummary();
  const worldScanFrames = buildWorldScanFrames();
  const scanSpinnerFrames = cliSpinners.binary.frames;
  const pulseFrames = cliSpinners.aesthetic.frames;
  const surpriseFrames = buildSurpriseFrames(state.providers.length);
  const logoSignals = buildLogoSignals();
  const asciiLogo = [
    " __      __ _____  ____   ______   _______  _____            _____ _  __ ______ _____",
    " \\ \\    / /|_   _||  _ \\ |  ____| |__   __||  __ \\     /\\   / ____| |/ /|  ____|  __ \\",
    "  \\ \\  / /   | |  | |_) || |__       | |   | |__) |   /  \\ | |    | ' / | |__  | |__) |",
    "   \\ \\/ /    | |  |  _ < |  __|      | |   |  _  /   / /\\ \\| |    |  <  |  __| |  _  /",
    "    \\  /    _| |_ | |_) || |____     | |   | | \\ \\  / ____ \\ |____| . \\ | |____| | \\ \\",
    "     \\/    |_____||____/ |______|    |_|   |_|  \\_\\/_/    \\_\\_____|_|\\_\\|______|_|  \\_\\",
    "",
    "                 VIBERS UNITE  //  c0vibe.app",
  ].join("\n");
  const hudTiles = [
    ["SCAN", `${state.providers.length}`, "providers mapped"],
    ["SYNC", `${state.audit.coverage.tracked}`, "tracked now"],
    ["PROOF", `${state.audit.coverage.available}`, "ready sources"],
    ["LOCAL", "ON", "keys stay masked"],
  ].map(([k, v, l], i) => `<div class="hudtile" style="--i:${i}"><span>${esc(k)}</span><b>${esc(v)}</b><small>${esc(l)}</small></div>`).join("");
  const logoDeck = logoSignals.map((signal, i) => `<div class="logo-signal" data-logo-tone="${esc(signal.tone)}" style="--i:${i}">
    <pre id="logoSignal${i}">${esc(signal.frames[0])}</pre>
    <span>${esc(signal.label)}</span>
  </div>`).join("");
  const groups = [
    { id: "image", title: "Image / Design" },
    { id: "video", title: "Video" },
    { id: "music", title: "Music" },
    { id: "audio", title: "Voice / Audio" },
    { id: "llm", title: "Writing / Research / LLM" },
    { id: "3d", title: "3D / Avatar" },
    { id: "coding", title: "Coding / Builder" },
    { id: "other", title: "Dev / Automation" },
  ];
  const rows = state.providers.map((p) => {
    const st = providerState(p, state.plan, tracked);
    const b = providerBrand(p.id, p.label);
    const hint = connectHint(p, st);
    const command = hint.startsWith("Run: ") ? hint.slice(5) : "";
    return `<article class="provider" style="${providerStyle(p.id, p.label)}" data-cats="${esc(p.categories.join(" "))}" data-state="${esc(st)}">
      <div class="provider__shine"></div>
      <div class="provider__top"><span class="provider__mark">${esc(b.mark)}</span><div><strong>${esc(p.label)}</strong><small>${esc(p.domain)} / ${esc(p.tier)} / ${esc(p.auth)}</small></div><span class="provider__state"><i></i>${esc(st)}</span></div>
      <p>${esc(p.method)}</p>
      <div class="provider__cats">${p.categories.map((c) => `<i>${esc(c)}</i>`).join("")}</div>
      <div class="provider__cmd"><code>${esc(hint)}</code>${command ? `<button type="button" data-copy="${esc(command)}">Copy</button>` : ""}</div>
    </article>`;
  }).join("");
  const githubPanel = state.audit.trustSignals.map(githubHeatgrid).join("");
  const auditProofConsole = renderAuditProofConsole(state.audit);
  const launchHandoffPanel = renderLaunchHandoffPanel(state);
  const launchRunway = renderWizardLaunchRunway(state);
  const terminalDock = renderTerminalDock(state);
  const lineageDeck = renderWizardLineageDeck(state);
  const providerCheckpoints = renderProviderCheckpoints(state.audit, state.providers);
  const surpriseEncoreRelay = renderSurpriseEncoreRelay(state);
  const terminalRecorder = renderTerminalRecorder(state);
  const roadmapCards = roadmapHighlights(6).map((item) =>
    `<div class="roaditem"><b>#${item.number} ${esc(item.title)}</b><span>${esc(item.stage)} · ${esc(item.note)}</span></div>`,
  ).join("");
  const terminalLines = [
    "$ vibetracker init --gui",
    "[motto] Vibers Unite // c0vibe.app",
    `[scan] ${state.providers.length} providers across creator, coding, local, and dev AI`,
    `[roadmap] ${roadmap.total} selected improvements (${roadmap.live} live / ${roadmap.accepted} accepted / ${roadmap.planned} planned)`,
    `[coverage] tracked ${state.audit.coverage.tracked} / available ${state.audit.coverage.available} / planned ${state.audit.coverage.planned} / manual ${state.audit.coverage.manual}`,
    `[mix] ${state.audit.sourceMix.map((s) => `${s.label} ${s.pct}%`).join(" | ") || "no records yet"}`,
    `[hash] bundle ${state.audit.integrity.bundleFingerprint.slice(0, 16)}...${state.audit.integrity.bundleFingerprint.slice(-8)}`,
    githubPanel ? "[proof] GitHub heatgrid ready; evidence remains separate from usage totals" : "[proof] trust signals remain separate from usage totals",
  ].map((l, i) => `<div class="termline" style="--i:${i}"><span class="prompt">&gt;</span> ${esc(l)}</div>`).join("");
  const sourceBars = state.audit.sourceMix.map((s) =>
    `<div class="mix"><span>${esc(s.label)}</span><b>${s.pct}%</b><i style="width:${s.pct}%"></i></div>`).join("") || `<p class="muted">No usage records yet. Connect providers, then sync.</p>`;
  const tabs = groups.map((g, i) => `<button type="button" class="${i === 0 ? "active" : ""}" data-filter="${esc(g.id)}">${esc(g.title)}</button>`).join("");
  const surpriseQueue = surpriseFrames.map((item, i) => `<button type="button" data-scene="${i}" class="${i === 0 ? "active" : ""}" style="--i:${i}">
    <span>${String(i + 1).padStart(2, "0")}</span><b>${esc(item.label)}</b><small>${esc(item.tone)}</small>
  </button>`).join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>VibeTRACKER Wizard</title>
<style>
:root{--bg:#080b0e;--panel:#0e1419;--panel2:#121b22;--ink:#edf4f2;--muted:#83919b;--line:#24313a;--green:#36e39b;--cyan:#2ee8d6;--gold:#ffc64d;--red:#ff7768}
*{box-sizing:border-box}body{margin:0;background:#030506;color:var(--ink);font-family:ui-sans-serif,system-ui,"Segoe UI",sans-serif;line-height:1.45;overflow-x:hidden}button{font:inherit}
body::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:3;background:linear-gradient(rgba(255,255,255,.028) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(180deg,transparent 0 48%,rgba(46,232,214,.05) 50%,transparent 52%);background-size:100% 3px,38px 38px,100% 9px;mix-blend-mode:screen;opacity:.5}
body::after{content:"";position:fixed;inset:-20%;pointer-events:none;z-index:1;background:conic-gradient(from 140deg at 18% 24%,rgba(46,232,214,.16),transparent 18%,rgba(255,79,216,.11) 32%,transparent 52%,rgba(255,198,77,.12) 70%,transparent 86%,rgba(54,227,155,.12));filter:saturate(1.25);animation:bgturn 18s cubic-bezier(.22,.68,.12,1) infinite alternate}
.shell{position:relative;z-index:2;min-height:100vh;display:grid;grid-template-columns:minmax(360px,.92fr) 1.35fr;background:linear-gradient(90deg,rgba(5,7,8,.92),rgba(7,10,12,.78))}
.shell::before{content:"VTK://LOCAL-FIRST//ASCII-GUI//PROVIDER-SCAN//TRUST-IS-SEPARATE";position:fixed;left:0;right:0;top:0;z-index:4;height:22px;padding:4px 12px;border-bottom:1px solid rgba(46,232,214,.28);background:#040607;color:#8fffe1;font:700 10px/1 ui-monospace,Menlo,monospace;letter-spacing:.14em;white-space:nowrap;overflow:hidden}
.left{position:relative;padding:42px 22px 22px;border-right:1px solid color-mix(in srgb,var(--cyan) 24%,var(--line));background:linear-gradient(180deg,rgba(8,15,18,.98),rgba(5,8,10,.94));box-shadow:inset -1px 0 0 rgba(255,255,255,.04)}.right{position:relative;padding:42px 22px 22px;overflow:auto}
.brand{display:flex;align-items:flex-end;gap:12px;margin-bottom:12px}.brand h1{margin:0;font-family:ui-monospace,Menlo,monospace;font-size:29px;color:var(--green);letter-spacing:.03em;text-shadow:0 0 24px rgba(54,227,155,.34)}.brand span{color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.16em}
.ascii-frame{position:relative;margin:0 0 12px;border:1px solid color-mix(in srgb,var(--green) 36%,var(--line));border-radius:10px;background:linear-gradient(180deg,rgba(54,227,155,.07),rgba(46,232,214,.03));padding:12px;overflow:hidden;box-shadow:0 24px 70px -54px var(--green),inset 0 1px 0 rgba(255,255,255,.08)}
.ascii-frame::after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 0 42%,rgba(255,255,255,.12) 48%,transparent 56%);transform:translateX(-90%);animation:sweep 3.8s cubic-bezier(.22,.68,.12,1) infinite}
.ascii-logo{position:relative;z-index:1;margin:0;color:#d9fff2;font:800 9px/1.05 ui-monospace,Menlo,monospace;letter-spacing:0;white-space:pre;overflow:auto;text-shadow:0 0 20px rgba(46,232,214,.3)}
.ascii-frame span{position:relative;z-index:1;display:block;margin-top:9px;color:#ffc64d;font:700 10px/1 ui-monospace,Menlo,monospace;letter-spacing:.16em;text-transform:uppercase}
.hud{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:0 0 12px}.hudtile{position:relative;min-width:0;border:1px solid color-mix(in srgb,var(--cyan) 28%,var(--line));background:#071014;border-radius:9px;padding:9px;overflow:hidden;animation:rise .55s cubic-bezier(.22,.68,.12,1) both;animation-delay:calc(var(--i) * 65ms)}.hudtile::before{content:"";position:absolute;inset:0 100% 0 0;background:linear-gradient(90deg,rgba(46,232,214,.2),rgba(255,198,77,.05));animation:loadbar 1.4s cubic-bezier(.22,.68,.12,1) forwards;animation-delay:calc(var(--i) * 95ms)}.hudtile span,.hudtile b,.hudtile small{position:relative}.hudtile span{display:block;color:var(--muted);font:700 9px/1 ui-monospace,Menlo,monospace;letter-spacing:.14em}.hudtile b{display:block;color:#d9fff2;font:900 22px/1.05 ui-monospace,Menlo,monospace;margin-top:5px}.hudtile small{display:block;color:var(--cyan);font-size:10px;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.launch-handoff{position:relative;margin:0 0 12px;border:1px solid color-mix(in srgb,var(--gold) 30%,var(--line));border-radius:10px;background:linear-gradient(180deg,rgba(23,18,10,.96),rgba(5,8,10,.97));overflow:hidden;box-shadow:0 24px 80px -62px var(--gold),inset 0 1px 0 rgba(255,255,255,.07)}.launch-handoff::before{content:"";position:absolute;left:0;right:38%;top:0;height:1px;background:linear-gradient(90deg,var(--gold),var(--green),var(--cyan),transparent)}.launch-handoff__head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border-bottom:1px solid rgba(255,255,255,.07);font:900 10px/1 ui-monospace,Menlo,monospace;color:#fff2c4;text-transform:uppercase;letter-spacing:.1em}.launch-handoff__head span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.launch-handoff__head b{color:var(--green);white-space:nowrap}.launch-handoff__body{display:grid;grid-template-columns:118px minmax(0,1fr);gap:10px;padding:10px}.launch-handoff pre{margin:0;border:1px solid color-mix(in srgb,var(--gold) 24%,var(--line));border-radius:8px;background:#05080a;color:#d9fff2;padding:9px;font:900 10px/1.22 ui-monospace,Menlo,monospace;text-shadow:0 0 18px rgba(255,198,77,.2);white-space:pre}.launch-handoff__copy strong{display:block;color:#f7fff9;font:900 13px/1.15 ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:.04em}.launch-handoff__copy p{margin:6px 0 9px;color:var(--muted);font-size:11px;line-height:1.34}.launch-handoff__meters{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}.launch-handoff__meters span{display:block;min-width:0;border:1px solid color-mix(in srgb,var(--cyan) 18%,var(--line));border-radius:7px;background:rgba(0,0,0,.18);padding:7px}.launch-handoff__meters b{display:block;color:var(--green);font:900 16px/1 ui-monospace,Menlo,monospace}.launch-handoff__meters small{display:block;margin-top:4px;color:var(--muted);font-size:9px;line-height:1.15;overflow-wrap:anywhere}
.launch-runway{position:relative;margin:0 0 12px;border:1px solid color-mix(in srgb,var(--cyan) 26%,var(--line));border-radius:10px;background:linear-gradient(180deg,rgba(8,17,19,.97),rgba(5,8,10,.98));overflow:hidden;box-shadow:0 24px 82px -62px var(--cyan),inset 0 1px 0 rgba(255,255,255,.07)}.launch-runway::before{content:"";position:absolute;left:0;right:30%;top:0;height:1px;background:linear-gradient(90deg,var(--cyan),var(--gold),var(--green),transparent)}.launch-runway__track{display:grid;gap:7px;padding:9px}.launch-runway__step{--runway-tone:#2ee8d6;position:relative;display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:8px;align-items:center;min-width:0;border:1px solid color-mix(in srgb,var(--runway-tone) 30%,var(--line));border-radius:8px;background:linear-gradient(135deg,color-mix(in srgb,var(--runway-tone) 10%,#071014),#05080a);color:#dffdf3;padding:8px;text-align:left;cursor:pointer;overflow:hidden;animation:rise .45s cubic-bezier(.22,.68,.12,1) both;animation-delay:calc(var(--i) * 54ms);transition:transform .38s cubic-bezier(.22,.68,.12,1),border-color .38s cubic-bezier(.22,.68,.12,1),box-shadow .38s cubic-bezier(.22,.68,.12,1)}.launch-runway__step[data-tone="privacy"]{--runway-tone:#ff4fd8}.launch-runway__step[data-tone="catalog"]{--runway-tone:#2ee8d6}.launch-runway__step[data-tone="higgsfield"]{--runway-tone:#ff4fd8}.launch-runway__step[data-tone="local"]{--runway-tone:#7c9cff}.launch-runway__step[data-tone="trust"]{--runway-tone:#ffc64d}.launch-runway__step[data-tone="c0vibe"]{--runway-tone:#36e39b}.launch-runway__step[data-rail="not_usage"]{border-style:dashed}.launch-runway__step::before{content:"";position:absolute;left:0;top:0;bottom:0;width:var(--meter);background:linear-gradient(90deg,color-mix(in srgb,var(--runway-tone) 18%,transparent),transparent 84%);opacity:.58;transform:translateX(-84%);animation:encorefill 1.2s cubic-bezier(.22,.68,.12,1) forwards;animation-delay:calc(var(--i) * 72ms)}.launch-runway__step::after{content:"";position:absolute;left:34px;right:48px;bottom:0;height:2px;background:linear-gradient(90deg,var(--runway-tone) var(--meter),rgba(255,255,255,.08) 0)}.launch-runway__step:hover,.launch-runway__step.active{transform:translateY(-1px);border-color:color-mix(in srgb,var(--runway-tone) 64%,white);box-shadow:0 18px 54px -44px var(--runway-tone)}.launch-runway__step span,.launch-runway__step div,.launch-runway__step strong,.launch-runway__step code{position:relative;z-index:1}.launch-runway__step span{display:grid;place-items:center;width:34px;height:34px;border-radius:8px;background:color-mix(in srgb,var(--runway-tone) 26%,#05080a);color:#f7fff9;font:900 10px/1 ui-monospace,Menlo,monospace;box-shadow:0 0 20px -10px var(--runway-tone)}.launch-runway__step em{display:block;color:var(--gold);font:900 9px/1 ui-monospace,Menlo,monospace;font-style:normal;text-transform:uppercase;letter-spacing:.12em}.launch-runway__step b{display:block;margin-top:3px;color:#f4fff8;font:900 11px/1.15 ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:.06em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.launch-runway__step small{display:block;margin-top:4px;color:var(--muted);font-size:10px;line-height:1.25}.launch-runway__step code{display:block;margin-top:6px;border:1px solid color-mix(in srgb,var(--runway-tone) 22%,var(--line));border-radius:6px;background:rgba(0,0,0,.2);color:#d9fff2;padding:5px;font-size:10px;overflow-wrap:anywhere}.launch-runway__step strong{color:color-mix(in srgb,var(--runway-tone) 78%,white);font:900 10px/1 ui-monospace,Menlo,monospace;white-space:nowrap}.launch-runway p{margin:0;padding:0 10px 10px;color:var(--muted);font-size:10.5px}
.terminal-shell{border:1px solid color-mix(in srgb,var(--green) 24%,var(--line));border-radius:10px;background:#030607;box-shadow:0 28px 90px -58px var(--cyan),inset 0 0 0 1px rgba(54,227,155,.05);overflow:hidden}
.terminal-top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border-bottom:1px solid rgba(255,255,255,.08);background:linear-gradient(90deg,rgba(54,227,155,.13),rgba(46,232,214,.06),rgba(255,79,216,.08));font:700 10px/1 ui-monospace,Menlo,monospace;color:#bafde8;text-transform:uppercase;letter-spacing:.12em}.terminal-top i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;background:#36e39b;box-shadow:12px 0 0 #ffc64d,24px 0 0 #ff7768,0 0 18px #36e39b}
.terminal{position:relative;height:330px;overflow:auto;background:radial-gradient(circle at 20% 0,rgba(54,227,155,.06),transparent 28%),#050708;padding:14px;font-family:ui-monospace,Menlo,monospace;color:#c9f7e2}
.terminal::after{content:"";position:absolute;left:0;right:0;top:0;height:42px;background:linear-gradient(180deg,rgba(46,232,214,.18),transparent);mix-blend-mode:screen;animation:scan 3.2s cubic-bezier(.22,.68,.12,1) infinite}.terminal div{min-height:22px}.termline{opacity:0;transform:translateY(8px);animation:termline .42s cubic-bezier(.22,.68,.12,1) forwards;animation-delay:calc(var(--i) * 82ms)}.prompt{color:var(--gold)}
.proof-console,.checkpoint-rail,.terminal-dock,.lineage-deck{position:relative;margin:10px 0 0;border:1px solid color-mix(in srgb,var(--cyan) 25%,var(--line));border-radius:10px;background:linear-gradient(180deg,rgba(12,19,23,.96),rgba(5,8,10,.97));overflow:hidden;box-shadow:0 22px 74px -62px var(--cyan),inset 0 1px 0 rgba(255,255,255,.07)}
.proof-console::before,.checkpoint-rail::before,.terminal-dock::before,.lineage-deck::before{content:"";position:absolute;left:0;right:50%;top:0;height:1px;background:linear-gradient(90deg,var(--green),var(--cyan),transparent)}
.proof-console__head{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border-bottom:1px solid rgba(255,255,255,.07);font:800 10px/1 ui-monospace,Menlo,monospace;color:#bafde8;text-transform:uppercase;letter-spacing:.1em}.proof-console__head span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.proof-console__head b{color:var(--gold);font-size:9px;white-space:nowrap}
.terminal-dock{border-color:color-mix(in srgb,var(--gold) 28%,var(--line));background:linear-gradient(180deg,rgba(20,16,10,.96),rgba(5,8,10,.97));box-shadow:0 22px 74px -62px var(--gold),inset 0 1px 0 rgba(255,255,255,.07)}.terminal-dock::before{right:42%;background:linear-gradient(90deg,var(--gold),var(--green),transparent)}.dock-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:9px}.dock-step{position:relative;display:grid;grid-template-columns:30px minmax(0,1fr);gap:6px;align-items:start;min-width:0;border:1px solid color-mix(in srgb,var(--dock-tone,var(--cyan)) 25%,var(--line));border-radius:8px;background:linear-gradient(135deg,color-mix(in srgb,var(--dock-tone,var(--cyan)) 10%,#071014),#05080a);color:#dffdf3;padding:8px;text-align:left;cursor:pointer;overflow:hidden;animation:rise .48s cubic-bezier(.22,.68,.12,1) both;animation-delay:calc(var(--i) * 58ms);transition:transform .38s cubic-bezier(.22,.68,.12,1),border-color .38s cubic-bezier(.22,.68,.12,1),box-shadow .38s cubic-bezier(.22,.68,.12,1)}.dock-step[data-tone="catalog"]{--dock-tone:#2ee8d6}.dock-step[data-tone="local"]{--dock-tone:#7c9cff}.dock-step[data-tone="trust"]{--dock-tone:#ffc64d}.dock-step[data-tone="publish"]{--dock-tone:#36e39b}.dock-step:hover,.dock-step.active{transform:translateY(-1px);border-color:color-mix(in srgb,var(--dock-tone) 62%,white);box-shadow:0 18px 54px -46px var(--dock-tone)}.dock-step::after{content:"";position:absolute;left:0;width:var(--meter);bottom:0;height:2px;background:linear-gradient(90deg,var(--dock-tone),transparent);transition:width .42s cubic-bezier(.22,.68,.12,1)}.dock-step span,.dock-step b,.dock-step small,.dock-step i{position:relative;z-index:1}.dock-step span{display:grid;place-items:center;width:30px;height:30px;border-radius:7px;background:color-mix(in srgb,var(--dock-tone) 24%,#05080a);color:#f4fff8;font:900 10px/1 ui-monospace,Menlo,monospace}.dock-step b{display:block;color:#f4fff8;font:900 11px/1.15 ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:.06em}.dock-step small{grid-column:2;display:block;color:var(--muted);font-size:10px;line-height:1.25}.dock-step i{grid-column:1/-1;height:3px;border-radius:999px;background:linear-gradient(90deg,var(--dock-tone) var(--meter),rgba(255,255,255,.08) 0);box-shadow:0 0 18px -8px var(--dock-tone)}.terminal-dock p{margin:0;padding:0 10px 10px;color:var(--muted);font-size:10.5px}
.lineage-deck{border-color:color-mix(in srgb,var(--green) 28%,var(--line));background:linear-gradient(180deg,rgba(9,20,17,.96),rgba(5,8,10,.97));box-shadow:0 22px 74px -62px var(--green),inset 0 1px 0 rgba(255,255,255,.07)}.lineage-deck::before{right:34%;background:linear-gradient(90deg,var(--green),var(--cyan),var(--gold),transparent)}.lineage-track{display:grid;gap:7px;padding:9px}.lineage-step{--lineage-tone:#2ee8d6;position:relative;display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:8px;align-items:center;min-width:0;border:1px solid color-mix(in srgb,var(--lineage-tone) 28%,var(--line));border-radius:8px;background:linear-gradient(135deg,color-mix(in srgb,var(--lineage-tone) 10%,#071014),#05080a);color:#dffdf3;padding:8px;text-align:left;cursor:pointer;overflow:hidden;animation:rise .45s cubic-bezier(.22,.68,.12,1) both;animation-delay:calc(var(--i) * 48ms);transition:transform .38s cubic-bezier(.22,.68,.12,1),border-color .38s cubic-bezier(.22,.68,.12,1),box-shadow .38s cubic-bezier(.22,.68,.12,1)}.lineage-step[data-tone="catalog"]{--lineage-tone:#2ee8d6}.lineage-step[data-tone="privacy"]{--lineage-tone:#ff4fd8}.lineage-step[data-tone="usage"]{--lineage-tone:#36e39b}.lineage-step[data-tone="ledger"]{--lineage-tone:#ffc64d}.lineage-step[data-tone="trust"]{--lineage-tone:#ffc64d}.lineage-step[data-tone="publish"]{--lineage-tone:#36e39b}.lineage-step[data-impact="not_usage"]{border-style:dashed}.lineage-step::before{content:"";position:absolute;left:0;top:0;bottom:0;width:var(--meter);background:linear-gradient(90deg,color-mix(in srgb,var(--lineage-tone) 18%,transparent),transparent 82%);opacity:.58;transform:translateX(-82%);animation:encorefill 1.2s cubic-bezier(.22,.68,.12,1) forwards;animation-delay:calc(var(--i) * 76ms)}.lineage-step::after{content:"";position:absolute;left:34px;right:44px;bottom:0;height:2px;background:linear-gradient(90deg,var(--lineage-tone) var(--meter),rgba(255,255,255,.08) 0)}.lineage-step:hover,.lineage-step.active{transform:translateY(-1px);border-color:color-mix(in srgb,var(--lineage-tone) 64%,white);box-shadow:0 18px 54px -44px var(--lineage-tone)}.lineage-step span,.lineage-step div,.lineage-step strong,.lineage-step code,.lineage-step i{position:relative;z-index:1}.lineage-step span{display:grid;place-items:center;width:34px;height:34px;border-radius:8px;background:color-mix(in srgb,var(--lineage-tone) 26%,#05080a);color:#f7fff9;font:900 10px/1 ui-monospace,Menlo,monospace;box-shadow:0 0 20px -10px var(--lineage-tone)}.lineage-step em{display:block;color:var(--gold);font:900 9px/1 ui-monospace,Menlo,monospace;font-style:normal;text-transform:uppercase;letter-spacing:.12em}.lineage-step b{display:block;margin-top:3px;color:#f4fff8;font:900 11px/1.15 ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:.06em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.lineage-step small{display:block;margin-top:4px;color:var(--muted);font-size:10px;line-height:1.25}.lineage-step strong{color:color-mix(in srgb,var(--lineage-tone) 78%,white);font:900 10px/1 ui-monospace,Menlo,monospace;white-space:nowrap}.lineage-step code{grid-column:2/-1;color:#d9fff2;border-color:color-mix(in srgb,var(--lineage-tone) 28%,var(--line));background:rgba(0,0,0,.18);font-size:10px;overflow-wrap:anywhere}.lineage-deck p{margin:0;padding:0 10px 10px;color:var(--muted);font-size:10.5px}
.proof-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;padding:9px}.proof-node{position:relative;min-width:0;border:1px solid rgba(46,232,214,.16);border-radius:8px;background:rgba(7,14,17,.75);padding:8px;overflow:hidden;animation:rise .5s cubic-bezier(.22,.68,.12,1) both;animation-delay:calc(var(--i,0) * 70ms)}.proof-node::after{content:"";position:absolute;inset:0;background:linear-gradient(120deg,transparent 0 45%,rgba(54,227,155,.1) 52%,transparent 60%);transform:translateX(-92%);animation:sweep 5s cubic-bezier(.22,.68,.12,1) infinite}.proof-node span,.proof-node b,.proof-node small{position:relative;z-index:1}.proof-node span{display:block;color:var(--muted);font:800 9px/1 ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:.1em}.proof-node b{display:block;margin-top:5px;color:#e7fff6;font:900 17px/1 ui-monospace,Menlo,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.proof-node small{display:block;margin-top:5px;color:var(--cyan);font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.proof-source-stack{padding:0 9px 9px}.proof-source,.proof-empty{position:relative;border:1px solid var(--line);border-radius:7px;background:#081014;padding:8px 10px;margin-top:7px;overflow:hidden;font:700 11px/1.2 ui-monospace,Menlo,monospace;animation:rise .45s cubic-bezier(.22,.68,.12,1) both;animation-delay:calc(var(--i) * 50ms)}.proof-source i{position:absolute;left:0;top:0;bottom:0;width:calc(var(--w) * 1%);background:linear-gradient(90deg,rgba(54,227,155,.22),rgba(46,232,214,.12));animation:loadbar 1.35s cubic-bezier(.22,.68,.12,1) both}.proof-source span,.proof-source b,.proof-empty{position:relative;z-index:1}.proof-source b{float:right;color:var(--gold)}
	.checkpoint-rail{padding-bottom:8px}.checkpoint{position:relative;display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:9px;margin:8px 9px 0;padding:8px;border:1px solid color-mix(in srgb,var(--brand-from) 30%,var(--line));border-radius:8px;background:linear-gradient(135deg,color-mix(in srgb,var(--brand-from) 10%,#081014),#05090c);box-shadow:0 20px 60px -54px var(--brand-from);animation:rise .42s cubic-bezier(.22,.68,.12,1) both;animation-delay:calc(var(--i) * 52ms)}.checkpoint[data-status="fresh"]{border-color:rgba(54,227,155,.38)}.checkpoint[data-status="warm"]{border-color:rgba(255,198,77,.38)}.checkpoint[data-status="stale"]{border-color:rgba(255,119,104,.38)}.checkpoint__mark{display:grid;place-items:center;width:34px;height:34px;border-radius:8px;background:linear-gradient(135deg,var(--brand-from),var(--brand-to));color:var(--brand-ink);font:900 11px/1 ui-monospace,Menlo,monospace}.checkpoint b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px}.checkpoint small{display:block;margin-top:3px;color:var(--muted);font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.checkpoint em{font-style:normal;color:var(--gold);font:900 9px/1 ui-monospace,Menlo,monospace;letter-spacing:.1em}.checkpoint--empty{--brand-from:var(--cyan);--brand-to:var(--green);--brand-ink:#06100d}
	.signal-theatre{position:relative;margin:10px 0 0;border:1px solid color-mix(in srgb,var(--gold) 24%,var(--line));border-radius:10px;background:linear-gradient(180deg,rgba(19,17,10,.94),rgba(5,8,10,.98));overflow:hidden;box-shadow:0 24px 78px -62px var(--gold),inset 0 1px 0 rgba(255,255,255,.07)}.signal-theatre::before{content:"";position:absolute;left:0;right:45%;top:0;height:1px;background:linear-gradient(90deg,var(--gold),var(--green),transparent)}.signal-theatre__grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:9px}.signal-theatre__cell{position:relative;display:grid;grid-template-columns:74px minmax(0,1fr);gap:8px;align-items:center;min-width:0;border:1px solid color-mix(in srgb,var(--tone) 30%,var(--line));border-radius:8px;background:linear-gradient(135deg,color-mix(in srgb,var(--tone) 10%,#071014),#05080a);padding:8px;overflow:hidden;animation:rise .5s cubic-bezier(.22,.68,.12,1) both;animation-delay:calc(var(--i) * 70ms)}.signal-theatre__cell::after{content:"";position:absolute;inset:0;background:linear-gradient(120deg,transparent 0 44%,color-mix(in srgb,var(--tone) 18%,transparent) 51%,transparent 60%);transform:translateX(-90%);animation:sweep 4.4s cubic-bezier(.22,.68,.12,1) infinite;animation-delay:calc(var(--i) * 220ms)}.signal-theatre__cell[data-tone="higgsfield"]{--tone:#ff4fd8}.signal-theatre__cell[data-tone="codex"]{--tone:#2ee8d6}.signal-theatre__cell[data-tone="local"]{--tone:#7c9cff}.signal-theatre__cell[data-tone="c0vibe"]{--tone:#36e39b}.signal-theatre__cell[data-tone="drawille"]{--tone:#30d6ff}.signal-theatre__cell pre,.signal-theatre__cell div{position:relative;z-index:1}.signal-theatre__cell pre{margin:0;color:#effff9;font:900 9px/1.05 ui-monospace,Menlo,monospace;white-space:pre;text-shadow:0 0 15px color-mix(in srgb,var(--tone) 38%,transparent)}.signal-theatre__cell[data-tone="drawille"] pre{font-size:12px;line-height:1.08}.signal-theatre__cell b{display:block;color:#f4fff8;font:900 11px/1.15 ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:.06em}.signal-theatre__cell span{display:inline-block;margin-top:5px;color:var(--gold);font:900 10px/1 ui-monospace,Menlo,monospace}.signal-theatre__cell small{display:block;margin-top:4px;color:var(--muted);font-size:10px;line-height:1.25}.signal-theatre p{margin:0;padding:0 10px 10px;color:var(--muted);font-size:10.5px}
	.logo-deck{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0 12px}.logo-signal{--logo-a:var(--cyan);--logo-b:var(--green);position:relative;min-width:0;border:1px solid color-mix(in srgb,var(--logo-a) 34%,var(--line));border-radius:9px;background:linear-gradient(180deg,color-mix(in srgb,var(--logo-a) 10%,#081015),#05080a);padding:8px;overflow:hidden;box-shadow:0 20px 62px -52px var(--logo-a);animation:rise .5s cubic-bezier(.22,.68,.12,1) both;animation-delay:calc(var(--i) * 90ms)}.logo-signal::before{content:"";position:absolute;inset:0;background:linear-gradient(120deg,transparent 0 43%,color-mix(in srgb,var(--logo-b) 18%,transparent) 50%,transparent 57%);transform:translateX(-90%);animation:sweep 4.2s cubic-bezier(.22,.68,.12,1) infinite;animation-delay:calc(var(--i) * 260ms)}.logo-signal[data-logo-tone="higgsfield"]{--logo-a:#ff4fd8;--logo-b:#ffc4f1}.logo-signal[data-logo-tone="codex"]{--logo-a:#2ee8d6;--logo-b:#7c9cff}.logo-signal[data-logo-tone="c0vibe"]{--logo-a:#36e39b;--logo-b:#ffc64d}.logo-signal pre{position:relative;z-index:1;margin:0;min-height:54px;color:#effff9;font:800 8px/1.05 ui-monospace,Menlo,monospace;white-space:pre;overflow:auto;text-shadow:0 0 16px color-mix(in srgb,var(--logo-a) 36%,transparent)}.logo-signal span{position:relative;z-index:1;display:block;margin-top:6px;color:color-mix(in srgb,var(--logo-b) 78%,white);font:800 9px/1 ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:.1em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.scan-stage{display:grid;grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr);gap:10px;margin:12px 0 14px}.globe-card,.surprise-card{position:relative;min-width:0;border:1px solid color-mix(in srgb,var(--cyan) 24%,var(--line));background:linear-gradient(180deg,rgba(13,20,25,.94),rgba(5,8,10,.96));border-radius:10px;padding:10px;overflow:hidden;box-shadow:0 24px 70px -58px var(--cyan),inset 0 1px 0 rgba(255,255,255,.07)}.globe-card::before,.surprise-card::before{content:"";position:absolute;left:0;right:55%;top:0;height:1px;background:linear-gradient(90deg,var(--green),transparent)}.surprise-card::after{content:"";position:absolute;inset:0;background:linear-gradient(118deg,transparent 0 42%,rgba(255,255,255,.1) 50%,transparent 58%);transform:translateX(-92%);animation:sweep 4.6s cubic-bezier(.22,.68,.12,1) infinite}.surprise-card[data-tone="higgsfield"]{border-color:rgba(255,79,216,.36);box-shadow:0 24px 70px -58px #ff4fd8}.surprise-card[data-tone="codex"]{border-color:rgba(46,232,214,.42);box-shadow:0 24px 70px -58px var(--cyan)}.surprise-card[data-tone="local"]{border-color:rgba(124,156,255,.42);box-shadow:0 24px 70px -58px #7c9cff}.surprise-card[data-tone="creator"]{border-color:rgba(255,198,77,.42);box-shadow:0 24px 70px -58px var(--gold)}.surprise-card[data-tone="c0vibe"]{border-color:rgba(54,227,155,.42);box-shadow:0 24px 70px -58px var(--green)}.surprise-card[data-tone="matrix"]{border-color:rgba(255,198,77,.42);box-shadow:0 24px 70px -58px var(--gold)}.stage-top{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;color:#bafde8;font:800 10px/1 ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:.1em}.stage-top b{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.stage-top span{color:var(--gold)}.stage-top em{font-style:normal;color:var(--green);min-width:54px;text-align:right}.globe-card pre,.surprise-card pre{position:relative;z-index:1;margin:0;min-height:96px;color:#d9fff2;font:800 10px/1.02 ui-monospace,Menlo,monospace;white-space:pre;overflow:auto;text-shadow:0 0 18px rgba(46,232,214,.25)}.surprise-card pre{color:#f2fff9}.globe-card small{position:relative;z-index:1;display:block;margin-top:8px;color:var(--muted);font-size:10px;overflow-wrap:anywhere}.live{animation-delay:0ms!important;color:#e8fff7}
.surprise-card[data-tone="replicate"]{border-color:rgba(255,117,117,.42);box-shadow:0 24px 70px -58px #ff7575}.surprise-card[data-tone="antigravity"]{border-color:rgba(194,153,255,.42);box-shadow:0 24px 70px -58px #c299ff}.surprise-card[data-tone="comfyui"]{border-color:rgba(255,152,80,.42);box-shadow:0 24px 70px -58px #ff9850}.surprise-card[data-tone="global"]{border-color:rgba(48,214,255,.42);box-shadow:0 24px 70px -58px #30d6ff}
	.surprise-queue{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:-2px 0 14px}.surprise-queue button{position:relative;min-width:0;border:1px solid color-mix(in srgb,var(--cyan) 18%,var(--line));border-radius:8px;background:linear-gradient(180deg,#0b1217,#06090c);color:var(--muted);padding:7px 8px;text-align:left;cursor:pointer;overflow:hidden;animation:rise .45s cubic-bezier(.22,.68,.12,1) both;animation-delay:calc(var(--i) * 35ms);transition:transform .38s cubic-bezier(.22,.68,.12,1),border-color .38s cubic-bezier(.22,.68,.12,1),color .38s cubic-bezier(.22,.68,.12,1)}.surprise-queue button::before{content:"";position:absolute;left:0;top:0;bottom:0;width:2px;background:var(--cyan);opacity:.28}.surprise-queue button:hover{transform:translateY(-1px);border-color:rgba(46,232,214,.45);color:var(--ink)}.surprise-queue button.active{color:#eafff6;border-color:rgba(54,227,155,.55);box-shadow:0 18px 54px -44px var(--green)}.surprise-queue button.active::before{width:100%;background:linear-gradient(90deg,rgba(54,227,155,.18),transparent 72%);opacity:1}.surprise-queue span,.surprise-queue b,.surprise-queue small{position:relative;z-index:1}.surprise-queue span{display:inline-block;color:var(--gold);font:900 9px/1 ui-monospace,Menlo,monospace;margin-right:7px}.surprise-queue b{font:800 10px/1 ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:.08em}.surprise-queue small{display:block;margin-top:4px;color:var(--muted);font-size:9px;text-transform:uppercase;letter-spacing:.12em}
	.surprise-encore{position:relative;margin:-4px 0 14px;border:1px solid color-mix(in srgb,var(--gold) 28%,var(--line));border-radius:10px;background:linear-gradient(180deg,rgba(18,15,9,.96),rgba(5,8,10,.98));overflow:hidden;box-shadow:0 24px 78px -62px var(--gold),inset 0 1px 0 rgba(255,255,255,.07)}.surprise-encore::before{content:"";position:absolute;left:0;right:36%;top:0;height:1px;background:linear-gradient(90deg,var(--gold),var(--green),transparent)}.surprise-encore__track{display:grid;gap:7px;padding:9px}.surprise-encore__pulse{--tone:#2ee8d6;position:relative;display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:8px;min-width:0;border:1px solid color-mix(in srgb,var(--tone) 28%,var(--line));border-radius:8px;background:linear-gradient(135deg,color-mix(in srgb,var(--tone) 10%,#071014),#05080a);color:#dffdf3;padding:8px;text-align:left;cursor:pointer;overflow:hidden;animation:rise .45s cubic-bezier(.22,.68,.12,1) both;animation-delay:calc(var(--i) * 48ms);transition:transform .38s cubic-bezier(.22,.68,.12,1),border-color .38s cubic-bezier(.22,.68,.12,1),box-shadow .38s cubic-bezier(.22,.68,.12,1)}.surprise-encore__pulse::before{content:"";position:absolute;left:0;top:0;bottom:0;width:var(--meter);background:linear-gradient(90deg,color-mix(in srgb,var(--tone) 18%,transparent),transparent 82%);opacity:.58;transform:translateX(-82%);animation:encorefill 1.25s cubic-bezier(.22,.68,.12,1) forwards;animation-delay:calc(var(--i) * 80ms)}.surprise-encore__pulse::after{content:"";position:absolute;left:34px;right:44px;bottom:0;height:2px;background:linear-gradient(90deg,var(--tone) var(--meter),rgba(255,255,255,.08) 0)}.surprise-encore__pulse[data-tone="higgsfield"]{--tone:#ff4fd8}.surprise-encore__pulse[data-tone="codex"]{--tone:#2ee8d6}.surprise-encore__pulse[data-tone="local"]{--tone:#7c9cff}.surprise-encore__pulse[data-tone="ledger"]{--tone:#ffc64d}.surprise-encore__pulse[data-tone="c0vibe"]{--tone:#36e39b}.surprise-encore__pulse:hover,.surprise-encore__pulse.active{transform:translateY(-1px);border-color:color-mix(in srgb,var(--tone) 64%,white);box-shadow:0 18px 54px -44px var(--tone)}.surprise-encore__pulse span,.surprise-encore__pulse div,.surprise-encore__pulse strong,.surprise-encore__pulse i{position:relative;z-index:1}.surprise-encore__pulse span{display:grid;place-items:center;width:34px;height:34px;border-radius:8px;background:color-mix(in srgb,var(--tone) 26%,#05080a);color:#f7fff9;font:900 10px/1 ui-monospace,Menlo,monospace;box-shadow:0 0 20px -10px var(--tone)}.surprise-encore__pulse em{display:block;color:var(--gold);font:900 9px/1 ui-monospace,Menlo,monospace;font-style:normal;text-transform:uppercase;letter-spacing:.12em}.surprise-encore__pulse b{display:block;margin-top:3px;color:#f4fff8;font:900 11px/1.15 ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:.06em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.surprise-encore__pulse small{display:block;margin-top:4px;color:var(--muted);font-size:10px;line-height:1.25}.surprise-encore__pulse strong{color:color-mix(in srgb,var(--tone) 78%,white);font:900 10px/1 ui-monospace,Menlo,monospace;white-space:nowrap}.surprise-encore p{margin:0;padding:0 10px 10px;color:var(--muted);font-size:10.5px}
	.terminal-recorder{position:relative;margin:-4px 0 14px;border:1px solid color-mix(in srgb,var(--green) 30%,var(--line));border-radius:10px;background:linear-gradient(180deg,rgba(4,9,9,.98),rgba(5,8,10,.99));overflow:hidden;box-shadow:0 24px 82px -64px var(--green),inset 0 1px 0 rgba(255,255,255,.07)}.terminal-recorder::before{content:"";position:absolute;left:0;right:28%;top:0;height:1px;background:linear-gradient(90deg,var(--green),var(--cyan),var(--gold),transparent)}.terminal-recorder__screen{position:relative;margin:9px 9px 0;border:1px solid color-mix(in srgb,var(--green) 25%,var(--line));border-radius:8px;background:radial-gradient(circle at 12% 0,rgba(54,227,155,.12),transparent 34%),#020405;color:#d9fff2;padding:9px;font:900 10px/1.22 ui-monospace,Menlo,monospace;white-space:pre;overflow:auto;text-shadow:0 0 18px rgba(54,227,155,.24)}.terminal-recorder__events{display:grid;gap:7px;padding:9px}.terminal-recorder__event{--tone:#2ee8d6;position:relative;display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:8px;min-width:0;border:1px solid color-mix(in srgb,var(--tone) 28%,var(--line));border-radius:8px;background:linear-gradient(135deg,color-mix(in srgb,var(--tone) 9%,#071014),#05080a);color:#dffdf3;padding:8px;text-align:left;cursor:pointer;overflow:hidden;animation:rise .45s cubic-bezier(.22,.68,.12,1) both;animation-delay:calc(var(--i) * 48ms);transition:transform .38s cubic-bezier(.22,.68,.12,1),border-color .38s cubic-bezier(.22,.68,.12,1),box-shadow .38s cubic-bezier(.22,.68,.12,1)}.terminal-recorder__event::before{content:"";position:absolute;left:0;top:0;bottom:0;width:var(--meter);background:linear-gradient(90deg,color-mix(in srgb,var(--tone) 16%,transparent),transparent 84%);opacity:.55;transform:translateX(-84%);animation:encorefill 1.18s cubic-bezier(.22,.68,.12,1) forwards;animation-delay:calc(var(--i) * 70ms)}.terminal-recorder__event::after{content:"";position:absolute;left:34px;right:46px;bottom:0;height:2px;background:linear-gradient(90deg,var(--tone) var(--meter),rgba(255,255,255,.08) 0)}.terminal-recorder__event[data-tone="privacy"]{--tone:#ff4fd8}.terminal-recorder__event[data-tone="higgsfield"]{--tone:#ff4fd8}.terminal-recorder__event[data-tone="codex"]{--tone:#2ee8d6}.terminal-recorder__event[data-tone="local"]{--tone:#7c9cff}.terminal-recorder__event[data-tone="ledger"]{--tone:#ffc64d}.terminal-recorder__event[data-tone="c0vibe"]{--tone:#36e39b}.terminal-recorder__event[data-impact="not_usage"]{border-style:dashed}.terminal-recorder__event:hover,.terminal-recorder__event.active{transform:translateY(-1px);border-color:color-mix(in srgb,var(--tone) 64%,white);box-shadow:0 18px 54px -44px var(--tone)}.terminal-recorder__event span,.terminal-recorder__event div,.terminal-recorder__event strong,.terminal-recorder__event code{position:relative;z-index:1}.terminal-recorder__event span{display:grid;place-items:center;width:34px;height:34px;border-radius:8px;background:color-mix(in srgb,var(--tone) 25%,#05080a);color:#f7fff9;font:900 10px/1 ui-monospace,Menlo,monospace;box-shadow:0 0 20px -10px var(--tone)}.terminal-recorder__event em{display:block;color:var(--gold);font:900 9px/1 ui-monospace,Menlo,monospace;font-style:normal;text-transform:uppercase;letter-spacing:.12em}.terminal-recorder__event b{display:block;margin-top:3px;color:#f4fff8;font:900 11px/1.15 ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:.06em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.terminal-recorder__event small{display:block;margin-top:4px;color:var(--muted);font-size:10px;line-height:1.25}.terminal-recorder__event code{display:block;margin-top:6px;border:1px solid color-mix(in srgb,var(--tone) 22%,var(--line));border-radius:6px;background:rgba(0,0,0,.23);color:#d9fff2;padding:5px;font-size:10px;overflow-wrap:anywhere}.terminal-recorder__event strong{color:color-mix(in srgb,var(--tone) 78%,white);font:900 10px/1 ui-monospace,Menlo,monospace;white-space:nowrap}.terminal-recorder p{margin:0;padding:0 10px 10px;color:var(--muted);font-size:10.5px}
	.summary{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:14px 0}.metric{position:relative;border:1px solid color-mix(in srgb,var(--cyan) 20%,var(--line));background:linear-gradient(180deg,rgba(20,31,38,.92),rgba(8,13,16,.94));border-radius:8px;padding:12px;overflow:hidden}.metric::before{content:"";position:absolute;left:0;right:0;top:0;height:1px;background:linear-gradient(90deg,var(--green),var(--cyan),var(--gold))}.metric span{display:block;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.1em}.metric b{font-size:24px;color:var(--cyan);text-shadow:0 0 18px rgba(46,232,214,.25)}
.mix{position:relative;border:1px solid var(--line);border-radius:7px;background:var(--panel);padding:9px 10px;margin-top:8px;overflow:hidden}.mix span,.mix b{position:relative;z-index:1}.mix b{float:right;color:var(--gold)}.mix i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,rgba(54,227,155,.22),rgba(46,232,214,.12))}
.roadmap{border:1px solid color-mix(in srgb,var(--cyan) 25%,var(--line));background:linear-gradient(180deg,rgba(46,232,214,.08),rgba(54,227,155,.035));border-radius:8px;padding:12px;margin-top:12px}.roadmap h2{font-size:13px;text-transform:uppercase;letter-spacing:.13em;margin:0 0 9px;color:var(--cyan)}.roaditem{border-top:1px solid rgba(255,255,255,.07);padding:8px 0}.roaditem:first-of-type{border-top:0}.roaditem b{display:block;font-size:12px}.roaditem span{display:block;color:var(--muted);font-size:11px;margin-top:2px}
.tabs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}.tabs button{border:1px solid color-mix(in srgb,var(--cyan) 18%,var(--line));background:#0a1116;color:var(--muted);border-radius:999px;padding:8px 12px;cursor:pointer;transition:transform .42s cubic-bezier(.22,.68,.12,1),border-color .42s cubic-bezier(.22,.68,.12,1),color .42s cubic-bezier(.22,.68,.12,1)}.tabs button:hover{transform:translateY(-1px);color:var(--ink);border-color:var(--cyan)}.tabs button.active{color:#06100d;background:linear-gradient(135deg,var(--green),var(--cyan));border-color:transparent;box-shadow:0 0 28px -12px var(--cyan)}
.providers{display:grid;grid-template-columns:repeat(auto-fill,minmax(265px,1fr));gap:12px}.provider{--brand-from:var(--cyan);--brand-to:var(--green);--brand-ink:#071013;position:relative;border:1px solid color-mix(in srgb,var(--brand-from) 34%,var(--line));background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.012)),linear-gradient(135deg,color-mix(in srgb,var(--brand-from) 9%,#0e1419),#091014 62%);border-radius:9px;padding:13px;min-height:178px;overflow:hidden;box-shadow:0 24px 68px -48px var(--brand-from),inset 0 1px 0 rgba(255,255,255,.08);transition:transform .55s cubic-bezier(.22,.68,.12,1),border-color .55s cubic-bezier(.22,.68,.12,1),box-shadow .55s cubic-bezier(.22,.68,.12,1)}.provider::before,.provider::after{content:"";position:absolute;width:18px;height:18px;border-color:color-mix(in srgb,var(--brand-to) 55%,transparent);border-style:solid;opacity:.78}.provider::before{left:8px;top:8px;border-width:1px 0 0 1px}.provider::after{right:8px;bottom:8px;border-width:0 1px 1px 0}.provider:hover{transform:translateY(-3px);border-color:color-mix(in srgb,var(--brand-from) 70%,var(--brand-to));box-shadow:0 30px 90px -52px var(--brand-from),inset 0 1px 0 rgba(255,255,255,.12)}.provider__shine{position:absolute;inset:0;background:linear-gradient(130deg,transparent 0 42%,color-mix(in srgb,var(--brand-from) 16%,transparent) 50%,transparent 58%);transform:translateX(-88%);animation:shine 1.7s cubic-bezier(.22,.68,.12,1) forwards}.provider__top{display:grid;grid-template-columns:36px 1fr auto;align-items:center;gap:10px;position:relative}.provider__top strong{display:block}.provider__top small{display:block;color:var(--muted);font-size:10px;margin-top:2px}.provider__state{display:inline-flex;align-items:center;gap:5px;font-family:ui-monospace,Menlo,monospace;font-size:10px;color:var(--gold);text-transform:uppercase;border:1px solid color-mix(in srgb,var(--brand-to) 35%,var(--line));border-radius:999px;padding:3px 7px;background:rgba(0,0,0,.2)}.provider__state i{display:block;width:6px;height:6px;border-radius:50%;background:var(--brand-to);box-shadow:0 0 14px var(--brand-to)}.provider[data-state="tracked"] .provider__state{color:#d9fff2}.provider[data-state="planned"] .provider__state,.provider[data-state="manual"] .provider__state{color:var(--muted)}.provider__mark{display:grid;place-items:center;width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,var(--brand-from),var(--brand-to));color:var(--brand-ink);font-family:ui-monospace,Menlo,monospace;font-weight:900;font-size:12px;box-shadow:0 0 24px -9px var(--brand-from)}.provider p{color:var(--muted);font-size:12px;min-height:36px;position:relative}.provider__cats{display:flex;flex-wrap:wrap;gap:5px;margin:8px 0}.provider__cats i{font-style:normal;font-size:10px;color:color-mix(in srgb,var(--brand-to) 80%,white);border:1px solid color-mix(in srgb,var(--brand-to) 32%,var(--line));border-radius:999px;padding:2px 6px;background:rgba(0,0,0,.15)}.provider__cmd{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;position:relative}.provider code{display:block;color:var(--cyan);font-family:ui-monospace,Menlo,monospace;font-size:11px;overflow-wrap:anywhere}.provider__cmd button{border:1px solid color-mix(in srgb,var(--brand-to) 38%,var(--line));background:rgba(0,0,0,.22);color:var(--ink);border-radius:7px;padding:6px 8px;font-size:11px;cursor:pointer;transition:transform .38s cubic-bezier(.22,.68,.12,1),background .38s cubic-bezier(.22,.68,.12,1)}.provider__cmd button:hover{transform:translateY(-1px);background:color-mix(in srgb,var(--brand-from) 18%,rgba(0,0,0,.18))}
.github-panel{border:1px solid #30363d;background:#0d1117;border-radius:8px;padding:12px;margin-top:12px}.github-panel__top,.github-panel__meta{display:flex;justify-content:space-between;gap:10px}.github-panel__top strong{color:#f0f6fc}.github-panel__top span{color:var(--gold);font-family:ui-monospace,Menlo,monospace;font-size:10px;border:1px solid rgba(255,198,77,.32);border-radius:999px;padding:2px 7px}.github-panel__meta{color:#8b949e;font-size:11px;margin:7px 0 10px}.github-panel p{color:#8b949e;font-size:11px;margin:9px 0 0}.ghgrid{display:grid;grid-auto-flow:column;grid-template-rows:repeat(7,10px);gap:3px;overflow-x:auto}.ghcell{width:10px;height:10px;border-radius:2px;background:#161b22;box-shadow:inset 0 0 0 1px rgba(240,246,252,.06);opacity:0;transform:scale(.35);animation:ghfill .34s cubic-bezier(.2,.8,.2,1) forwards;animation-delay:calc(var(--i) * 7ms)}.ghcell.blank{visibility:hidden}.ghcell.l0{background:#161b22}.ghcell.l1{background:#0e4429}.ghcell.l2{background:#006d32}.ghcell.l3{background:#26a641}.ghcell.l4{background:#39d353}
.muted{color:var(--muted)}.credits{color:var(--muted);font-size:11px;margin:12px 0 0}.credits a{color:#d9fff2;text-decoration:none;border-bottom:1px solid color-mix(in srgb,var(--cyan) 42%,transparent)}.note{border:1px solid rgba(255,198,77,.35);background:rgba(255,198,77,.08);border-radius:8px;padding:12px;margin-top:14px;color:#f7dfa1}
@keyframes bgturn{to{transform:translate3d(2%,-1%,0) rotate(4deg)}}@keyframes sweep{50%,100%{transform:translateX(95%)}}@keyframes scan{from{transform:translateY(-44px)}to{transform:translateY(330px)}}@keyframes loadbar{to{right:0}}@keyframes encorefill{to{transform:none}}@keyframes rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}@keyframes termline{to{opacity:1;transform:none}}@keyframes shine{to{transform:translateX(90%)}}@keyframes ghfill{to{opacity:1;transform:scale(1)}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}.ghcell,.termline,.hudtile{opacity:1;transform:none}body::after{display:none}}
@media(max-width:1120px){.hud{grid-template-columns:repeat(2,1fr)}}
	@media(max-width:900px){.shell{grid-template-columns:1fr}.left{border-right:0;border-bottom:1px solid var(--line)}.right{padding-top:22px}.shell::before{position:sticky}.ascii-logo{font-size:7px}.terminal{height:290px}}
		@media(max-width:640px){.scan-stage,.logo-deck,.signal-theatre__grid,.dock-grid,.launch-handoff__body,.launch-handoff__meters{grid-template-columns:1fr}.globe-card pre,.surprise-card pre{min-height:auto}.logo-signal pre{min-height:auto}.surprise-queue{grid-template-columns:1fr}.launch-runway__step,.lineage-step,.surprise-encore__pulse,.terminal-recorder__event{grid-template-columns:34px minmax(0,1fr)}.launch-runway__step strong,.lineage-step strong,.surprise-encore__pulse strong,.terminal-recorder__event strong{grid-column:2;justify-self:start}.launch-runway__step code,.lineage-step code,.terminal-recorder__event code{grid-column:2}.launch-runway__step::after,.lineage-step::after,.surprise-encore__pulse::after,.terminal-recorder__event::after{right:8px}.terminal-recorder__screen{font-size:9px}}
@media(max-width:520px){.left,.right{padding-left:14px;padding-right:14px}.summary{grid-template-columns:1fr}.hud{grid-template-columns:1fr}.brand{align-items:flex-start;flex-direction:column}.provider__top{grid-template-columns:36px 1fr}.provider__state{grid-column:2;width:max-content}}
</style>
</head>
<body>
<main class="shell">
  <section class="left">
    <div class="brand"><h1>VIBE USAGE</h1><span>terminal wizard</span></div>
    <div class="ascii-frame"><pre class="ascii-logo" aria-label="VibeTRACKER ASCII logo">${esc(asciiLogo)}</pre><span>operator-grade local usage console</span></div>
    <div class="hud">${hudTiles}</div>
    ${launchHandoffPanel}
    ${launchRunway}
    <div class="terminal-shell">
      <div class="terminal-top"><span><i></i>local session</span><b>ASCII GUI live</b></div>
      <div class="terminal" id="terminal">${terminalLines}</div>
    </div>
	    ${terminalDock}
	    ${lineageDeck}
	    ${auditProofConsole}
	    ${providerCheckpoints}
	    ${renderSignalTheatre(state)}
	    <div class="logo-deck" aria-label="Rotating source marks">${logoDeck}</div>
    <div class="scan-stage" aria-label="Animated provider scan surprises">
      <div class="globe-card">
        <div class="stage-top"><span id="scanSpinner">${esc(scanSpinnerFrames[0])}</span><b>worldwide scan</b><em id="pulse">${esc(pulseFrames[0])}</em></div>
        <pre id="globeFrame">${esc(worldScanFrames[0])}</pre>
        <small>C=coders E=EU creators A=Asia AI L=local labs</small>
      </div>
      <div class="surprise-card" data-tone="${esc(surpriseFrames[0].tone)}">
        <div class="stage-top"><span>surprise</span><b id="surpriseLabel">${esc(surpriseFrames[0].label)}</b></div>
        <pre id="surpriseFrame">${esc(surpriseFrames[0].frames[0])}</pre>
      </div>
    </div>
    <div class="surprise-queue" id="surpriseQueue">${surpriseQueue}</div>
    ${surpriseEncoreRelay}
    ${terminalRecorder}
    <div class="summary">
      <div class="metric"><span>Tracked</span><b>${state.audit.coverage.tracked}</b></div>
      <div class="metric"><span>Available</span><b>${state.audit.coverage.available}</b></div>
      <div class="metric"><span>Planned</span><b>${state.audit.coverage.planned}</b></div>
      <div class="metric"><span>Manual</span><b>${state.audit.coverage.manual}</b></div>
    </div>
    ${sourceBars}
    ${githubPanel}
    <div class="roadmap"><h2>Accepted roadmap</h2>${roadmapCards}<p class="muted">Run <code>vibetracker roadmap</code> for all ${roadmap.total} selected items.</p></div>
    <p class="credits">ASCII motion credits: <a href="https://github.com/jcubic/ascii-globe">ascii-globe</a> by Jakub T. Jankiewicz (MIT), <a href="https://github.com/sindresorhus/cli-spinners">cli-spinners</a> by Sindre Sorhus (MIT), and <a href="https://github.com/madbence/node-drawille">drawille</a> by Bence Dányi (MIT). Rendered locally; no CDN.</p>
    <p class="note">This GUI keeps the terminal as the source of truth. Use the copied commands in your shell so keys stay masked and local.</p>
  </section>
  <section class="right">
    <div class="tabs">${tabs}</div>
    <div class="providers" id="providers">${rows}</div>
  </section>
</main>
<script>
const buttons=[...document.querySelectorAll("[data-filter]")];
const providers=[...document.querySelectorAll(".provider")];
const globeFrames=${jsonForScript(worldScanFrames)};
const spinnerFrames=${jsonForScript(scanSpinnerFrames)};
const pulseFrames=${jsonForScript(pulseFrames)};
const surpriseFrames=${jsonForScript(surpriseFrames)};
const logoSignals=${jsonForScript(logoSignals)};
const terminal=document.querySelector("#terminal");
const globeFrame=document.querySelector("#globeFrame");
const scanSpinner=document.querySelector("#scanSpinner");
const pulse=document.querySelector("#pulse");
const surpriseCard=document.querySelector(".surprise-card");
const surpriseLabel=document.querySelector("#surpriseLabel");
const surpriseFrame=document.querySelector("#surpriseFrame");
const logoSignalEls=logoSignals.map((_,index)=>document.querySelector("#logoSignal"+index));
const surpriseButtons=[...document.querySelectorAll("[data-scene]")];
const runwaySteps=[...document.querySelectorAll("[data-runway-step]")];
const dockSteps=[...document.querySelectorAll("[data-dock-step]")];
const lineageSteps=[...document.querySelectorAll("[data-lineage-step]")];
const relayPulses=[...document.querySelectorAll("[data-relay-pulse]")];
const recorderEvents=[...document.querySelectorAll("[data-recorder-event]")];
let scanTick=0;
let surpriseSceneIndex=-1;
let runwayStepIndex=-1;
let dockStepIndex=-1;
let lineageStepIndex=-1;
let relayPulseIndex=-1;
let recorderEventIndex=-1;
function apply(filter){buttons.forEach(b=>b.classList.toggle("active",b.dataset.filter===filter));providers.forEach(p=>{p.style.display=p.dataset.cats.split(" ").includes(filter)?"block":"none";});}
buttons.forEach(b=>b.addEventListener("click",()=>apply(b.dataset.filter)));
apply("image");
function appendTerminal(line){
  if(!terminal)return;
  const row=document.createElement("div");
  row.className="termline live";
  row.innerHTML='<span class="prompt">&gt;</span> '+line.replace(/[&<>"]/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  terminal.appendChild(row);
  terminal.scrollTop=terminal.scrollHeight;
}
function selectSurprise(sceneIndex, forceLog=false){
  const item=surpriseFrames[sceneIndex];
  if(!item)return;
  if(surpriseCard)surpriseCard.dataset.tone=item.tone;
  if(surpriseLabel)surpriseLabel.textContent=item.label;
  if(surpriseFrame)surpriseFrame.textContent=item.frames[scanTick%item.frames.length];
  surpriseButtons.forEach((button,index)=>button.classList.toggle("active",index===sceneIndex));
  if(sceneIndex!==surpriseSceneIndex||forceLog){
    surpriseSceneIndex=sceneIndex;
    appendTerminal("[surprise] "+item.log+" // Vibers Unite");
  }
}
function selectRunwayStep(stepIndex, forceLog=false){
  const step=runwaySteps[stepIndex];
  if(!step)return;
  runwaySteps.forEach((button,index)=>button.classList.toggle("active",index===stepIndex));
  if(stepIndex!==runwayStepIndex||forceLog){
    runwayStepIndex=stepIndex;
    const rail=step.dataset.rail?(" // "+step.dataset.rail.toUpperCase().replace("_"," ")):"";
    appendTerminal("[runway] "+(step.dataset.log||"launch runway advanced")+rail+" // first-run rail labelled");
  }
}
function selectDockStep(stepIndex, forceLog=false){
  const step=dockSteps[stepIndex];
  if(!step)return;
  dockSteps.forEach((button,index)=>button.classList.toggle("active",index===stepIndex));
  if(stepIndex!==dockStepIndex||forceLog){
    dockStepIndex=stepIndex;
    appendTerminal("[dock] "+(step.dataset.log||"terminal dock advanced")+" // source terminal");
  }
}
function selectLineageStep(stepIndex, forceLog=false){
  const step=lineageSteps[stepIndex];
  if(!step)return;
  lineageSteps.forEach((button,index)=>button.classList.toggle("active",index===stepIndex));
  if(stepIndex!==lineageStepIndex||forceLog){
    lineageStepIndex=stepIndex;
    const guardrail=step.dataset.guardrail?(" // "+step.dataset.guardrail):"";
    appendTerminal("[lineage] "+(step.dataset.log||"source-to-score lineage advanced")+guardrail+" // profile feeds reviewed datastream");
  }
}
function selectRelayPulse(pulseIndex, forceLog=false){
  const pulse=relayPulses[pulseIndex];
  if(!pulse)return;
  relayPulses.forEach((button,index)=>button.classList.toggle("active",index===pulseIndex));
  if(pulseIndex!==relayPulseIndex||forceLog){
    relayPulseIndex=pulseIndex;
    appendTerminal("[encore] "+(pulse.dataset.log||"surprise relay advanced")+" // art follows source truth");
  }
}
function selectRecorderEvent(eventIndex, forceLog=false){
  const event=recorderEvents[eventIndex];
  if(!event)return;
  recorderEvents.forEach((button,index)=>button.classList.toggle("active",index===eventIndex));
  if(eventIndex!==recorderEventIndex||forceLog){
    recorderEventIndex=eventIndex;
    appendTerminal("[blackbox] "+(event.dataset.log||"recorder event advanced")+" // replay metadata only");
  }
}
dockSteps.forEach((button)=>button.addEventListener("click",()=>{
  const stepIndex=Number(button.dataset.dockStep||0);
  selectDockStep(stepIndex,true);
}));
lineageSteps.forEach((button)=>button.addEventListener("click",()=>{
  const stepIndex=Number(button.dataset.lineageStep||0);
  selectLineageStep(stepIndex,true);
}));
relayPulses.forEach((button)=>button.addEventListener("click",()=>{
  const pulseIndex=Number(button.dataset.relayPulse||0);
  scanTick=pulseIndex*7;
  selectRelayPulse(pulseIndex,true);
}));
recorderEvents.forEach((button)=>button.addEventListener("click",()=>{
  const eventIndex=Number(button.dataset.recorderEvent||0);
  scanTick=eventIndex*10;
  selectRecorderEvent(eventIndex,true);
}));
surpriseButtons.forEach((button)=>button.addEventListener("click",()=>{
  const sceneIndex=Number(button.dataset.scene||0);
  scanTick=sceneIndex*12;
  selectSurprise(sceneIndex,true);
}));
runwaySteps.forEach((button)=>button.addEventListener("click",()=>{
  const stepIndex=Number(button.dataset.runwayStep||0);
  scanTick=stepIndex*6;
  selectRunwayStep(stepIndex,true);
}));
setInterval(()=>{
  scanTick+=1;
  if(globeFrame)globeFrame.textContent=globeFrames[scanTick%globeFrames.length];
  if(scanSpinner)scanSpinner.textContent=spinnerFrames[scanTick%spinnerFrames.length];
  if(pulse)pulse.textContent=pulseFrames[scanTick%pulseFrames.length];
  logoSignalEls.forEach((el,index)=>{
    const signal=logoSignals[index];
    if(el&&signal)el.textContent=signal.frames[(scanTick+index)%signal.frames.length];
  });
  if(surpriseFrames.length){
    const sceneIndex=Math.floor(scanTick/12)%surpriseFrames.length;
    selectSurprise(sceneIndex);
  }
  if(runwaySteps.length){
    const stepIndex=Math.floor(scanTick/6)%runwaySteps.length;
    selectRunwayStep(stepIndex);
  }
  if(dockSteps.length){
    const stepIndex=Math.floor(scanTick/9)%dockSteps.length;
    selectDockStep(stepIndex);
  }
  if(lineageSteps.length){
    const stepIndex=Math.floor(scanTick/8)%lineageSteps.length;
    selectLineageStep(stepIndex);
  }
  if(relayPulses.length){
    const pulseIndex=Math.floor(scanTick/7)%relayPulses.length;
    selectRelayPulse(pulseIndex);
  }
  if(recorderEvents.length){
    const eventIndex=Math.floor(scanTick/10)%recorderEvents.length;
    selectRecorderEvent(eventIndex);
  }
},180);
document.addEventListener("click",async(event)=>{
  const btn=event.target.closest("[data-copy]");
  if(!btn)return;
  try{await navigator.clipboard.writeText(btn.dataset.copy);btn.textContent="Copied";setTimeout(()=>btn.textContent="Copy",1200);}
  catch{btn.textContent="Select";setTimeout(()=>btn.textContent="Copy",1200);}
});
</script>
</body>
</html>`;
}

export function runWizardGui(state: WizardGuiState, deps: WizardGuiDeps): Promise<void> {
  const token = randomBytes(18).toString("hex");
  const html = renderWizardGuiHtml(state);
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    if (url.searchParams.get("token") !== token) {
      res.writeHead(403, { "content-type": "text/plain" });
      res.end("forbidden");
      return;
    }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(html);
  });
  return new Promise((resolve, reject) => {
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      const url = `http://127.0.0.1:${port}/?token=${token}`;
      deps.log(renderGuiLaunchHandoff(state, url));
      deps.log("GUI wizard listening on 127.0.0.1. Keep this terminal open; Ctrl-C stops the local wizard.");
      deps.open(url);
    });
    server.on("close", resolve);
  });
}
