import { PROVIDERS, type ProviderDescriptor } from "../../../adapters/src/registry.ts";
import { cliCommand } from "./cli-command.ts";
import { providerBrand } from "./provider-brand.ts";

export type CollectionSurpriseImpact = "usage" | "local_only" | "trust" | "privacy" | "publish";

export interface CollectionSurpriseMark {
  id: string;
  label: string;
  mark: string;
  from: string;
  to: string;
  ink: string;
}

export interface CollectionSurpriseBeat {
  label: string;
  detail: string;
  surprise: boolean;
}

export interface CollectionChoreographyStep {
  id: "wake" | "auth" | "fetch" | "validate" | "review";
  stage: string;
  label: string;
  detail: string;
  command: string;
  tone: CollectionSurpriseImpact;
  meter: number;
  marks: CollectionSurpriseMark[];
  guardrail: string;
}

export interface CollectionSurpriseWindow {
  id: "queue" | "scan-beat" | "checkpoint" | "relay";
  stage: string;
  label: string;
  trigger: string;
  cue: string;
  replay: string;
  impact: CollectionSurpriseImpact;
  meter: number;
  marks: CollectionSurpriseMark[];
}

export interface CollectionSurpriseMoment {
  id: string;
  stage: string;
  call: string;
  label: string;
  command: string;
  impact: CollectionSurpriseImpact;
  status: string;
  meter: number;
  providerIds: string[];
  marks: CollectionSurpriseMark[];
  ascii: string[];
  motion: string[];
  beats: CollectionSurpriseBeat[];
  note: string;
  guardrail: string;
  source: string;
}

export interface CollectionSurpriseEncore {
  id: "higgsfield-logo-turn" | "codex-cube-flip" | "local-sonar-bloom" | "c0vibe-unite-flash";
  stage: string;
  gate: CollectionSurpriseWindow["id"];
  label: string;
  trigger: string;
  command: string;
  impact: CollectionSurpriseImpact;
  status: string;
  meter: number;
  delayMs: number;
  providerIds: string[];
  marks: CollectionSurpriseMark[];
  frames: string[];
  caption: string;
  guardrail: string;
  source: string;
}

export interface CollectionTransmissionStep {
  id: CollectionSurpriseEncore["id"];
  gate: CollectionSurpriseEncore["gate"];
  stage: string;
  label: string;
  cue: string;
  command: string;
  impact: CollectionSurpriseImpact;
  status: string;
  meter: number;
  delayMs: number;
  marks: CollectionSurpriseMark[];
  frames: string[];
  caption: string;
  guardrail: string;
}

export interface CollectionTransmissionRibbon {
  headline: string;
  subline: string;
  terminalLines: string[];
  steps: CollectionTransmissionStep[];
}

export interface CollectionHeroScanStage {
  id: CollectionSurpriseEncore["id"];
  gate: CollectionSurpriseEncore["gate"];
  stage: string;
  label: string;
  command: string;
  impact: CollectionSurpriseImpact;
  railLabel: string;
  status: string;
  meter: number;
  delayMs: number;
  marks: CollectionSurpriseMark[];
  frames: string[];
  terminalLines: string[];
  cue: string;
  guardrail: string;
}

export interface CollectionHeroScanBridge {
  headline: string;
  subline: string;
  motto: string;
  terminalLines: string[];
  totals: {
    stages: number;
    surprises: number;
    usage: number;
    notUsage: number;
    publish: number;
    visualOnly: number;
    usageWrites: number;
  };
  stages: CollectionHeroScanStage[];
}

export interface CollectionCommandRunwayStep {
  id: string;
  stage: string;
  label: string;
  command: string;
  impact: CollectionSurpriseImpact;
  railLabel: string;
  status: string;
  meter: number;
  mark: string;
  from: string;
  to: string;
  ink: string;
  frames: string[];
  transcript: string[];
  note: string;
  guardrail: string;
  visualOnly: true;
  usageWrites: false;
}

export interface CollectionCommandRunway {
  headline: string;
  subline: string;
  terminalLines: string[];
  totals: {
    steps: number;
    usage: number;
    notUsage: number;
    privacy: number;
    publish: number;
    visualOnly: number;
    usageWrites: number;
  };
  steps: CollectionCommandRunwayStep[];
}

export interface CollectionReplayLane {
  id: CollectionSurpriseEncore["id"];
  stage: string;
  gate: CollectionSurpriseEncore["gate"];
  label: string;
  command: string;
  impact: CollectionSurpriseImpact;
  status: string;
  meter: number;
  delayMs: number;
  marks: CollectionSurpriseMark[];
  frames: string[];
  terminalLines: string[];
  caption: string;
  guardrail: string;
}

export interface CollectionReplayDeck {
  headline: string;
  subline: string;
  terminalLines: string[];
  lanes: CollectionReplayLane[];
}

export interface CollectionSignalStackStage {
  id: CollectionSurpriseWindow["id"];
  stage: string;
  label: string;
  command: string;
  status: string;
  impact: CollectionSurpriseImpact;
  meter: number;
  marks: CollectionSurpriseMark[];
  frames: string[];
  signalLines: string[];
  caption: string;
  guardrail: string;
}

export interface CollectionSignalStack {
  headline: string;
  subline: string;
  terminalLines: string[];
  stages: CollectionSignalStackStage[];
}

export interface CollectionSurpriseSequencerStep {
  id: CollectionSurpriseEncore["id"];
  gate: CollectionSurpriseEncore["gate"];
  stage: string;
  label: string;
  command: string;
  impact: CollectionSurpriseImpact;
  status: string;
  meter: number;
  delayMs: number;
  marks: CollectionSurpriseMark[];
  frames: string[];
  beats: string[];
  terminalLines: string[];
  caption: string;
  guardrail: string;
}

export interface CollectionSurpriseSequencer {
  headline: string;
  subline: string;
  terminalLines: string[];
  steps: CollectionSurpriseSequencerStep[];
}

export interface CollectionBlackBoxCell {
  id: CollectionChoreographyStep["id"];
  stage: string;
  label: string;
  command: string;
  impact: CollectionSurpriseImpact;
  status: string;
  meter: number;
  marks: CollectionSurpriseMark[];
  frames: string[];
  transcript: string[];
  checksum: string;
  guardrail: string;
}

export interface CollectionBlackBoxDeck {
  headline: string;
  subline: string;
  terminalLines: string[];
  cells: CollectionBlackBoxCell[];
}

export interface CollectionEncoreRecapRail {
  id: CollectionSurpriseEncore["id"];
  stage: string;
  gate: CollectionSurpriseEncore["gate"];
  label: string;
  command: string;
  impact: CollectionSurpriseImpact;
  railLabel: string;
  status: string;
  meter: number;
  delayMs: number;
  marks: CollectionSurpriseMark[];
  frames: string[];
  recapLines: string[];
  checksum: string;
  caption: string;
  guardrail: string;
}

export interface CollectionEncoreRecapDeck {
  headline: string;
  subline: string;
  terminalLines: string[];
  totals: {
    rails: number;
    usage: number;
    notUsage: number;
    publish: number;
    replayFrames: number;
    checksums: number;
  };
  rails: CollectionEncoreRecapRail[];
}

export interface CollectionSurpriseDirectorCue {
  id: CollectionSurpriseEncore["id"];
  gate: CollectionSurpriseEncore["gate"];
  stage: string;
  label: string;
  command: string;
  impact: CollectionSurpriseImpact;
  railLabel: string;
  status: string;
  timing: string;
  meter: number;
  delayMs: number;
  marks: CollectionSurpriseMark[];
  frames: string[];
  trigger: string;
  operatorLine: string;
  caption: string;
  guardrail: string;
  source: string;
}

export interface CollectionSurpriseDirector {
  headline: string;
  subline: string;
  motto: string;
  terminalLines: string[];
  totals: {
    cues: number;
    usage: number;
    notUsage: number;
    publish: number;
    providers: number;
  };
  cues: CollectionSurpriseDirectorCue[];
}

export interface CollectionSurpriseCascadeBeat {
  id: string;
  sourceEncoreId: CollectionSurpriseEncore["id"];
  gate: CollectionSurpriseEncore["gate"];
  stage: string;
  label: string;
  reveal: "blink" | "turn" | "lock" | "unite";
  command: string;
  impact: CollectionSurpriseImpact;
  railLabel: string;
  status: string;
  timing: string;
  delayMs: number;
  meter: number;
  marks: CollectionSurpriseMark[];
  frame: string;
  operatorLines: string[];
  caption: string;
  guardrail: string;
  surprise: boolean;
}

export interface CollectionSurpriseCascade {
  headline: string;
  subline: string;
  motto: string;
  terminalLines: string[];
  totals: {
    beats: number;
    surprises: number;
    usage: number;
    notUsage: number;
    publish: number;
    maxDelayMs: number;
  };
  beats: CollectionSurpriseCascadeBeat[];
}

export type CollectionFlightRecorderPhase = "queue" | "scan" | "checkpoint" | "recap";

export interface CollectionFlightRecorderEvent {
  id: string;
  sequence: number;
  stage: string;
  phase: CollectionFlightRecorderPhase;
  gate: CollectionSurpriseEncore["gate"];
  providerId: string;
  mark: string;
  label: string;
  command: string;
  impact: CollectionSurpriseImpact;
  railLabel: string;
  status: string;
  timing: string;
  delayMs: number;
  meter: number;
  marks: CollectionSurpriseMark[];
  frame: string;
  cue: string;
  transcript: string[];
  checksum: string;
  guardrail: string;
  visualOnly: true;
  usageWrites: false;
  promptExport: false;
  outputExport: false;
  secretRead: false;
}

export interface CollectionControlTapeStep {
  id: "scan" | "fetch" | "validate" | "seal";
  label: string;
  command: string;
  value: string;
  detail: string;
  impact: CollectionSurpriseImpact;
  railLabel: string;
  meter: number;
  from: string;
  to: string;
  ink: string;
  frames: string[];
  terminalLines: string[];
  visualOnly: true;
  usageWrites: false;
}

export interface CollectionFlightRecorderDeck {
  headline: string;
  subline: string;
  motto: string;
  terminalLines: string[];
  totals: {
    events: number;
    usage: number;
    notUsage: number;
    localOnly: number;
    publish: number;
    visualOnly: number;
    writes: number;
    checksums: number;
  };
  controlTape: CollectionControlTapeStep[];
  events: CollectionFlightRecorderEvent[];
}

export interface CollectionEventTapeRow {
  id: string;
  sequence: number;
  stage: string;
  phase: CollectionFlightRecorderPhase;
  providerId: string;
  mark: string;
  label: string;
  command: string;
  railLabel: string;
  timing: string;
  meter: number;
  checksum: string;
  line: string;
  from: string;
  to: string;
  ink: string;
  visualOnly: true;
  usageWrites: false;
}

export interface CollectionEventTape {
  headline: string;
  subline: string;
  terminalLines: string[];
  totals: {
    rows: number;
    visualOnly: number;
    usageWrites: number;
    hiddenUploads: number;
    promptExports: number;
    outputExports: number;
  };
  rows: CollectionEventTapeRow[];
}

export interface CollectionSurpriseRun {
  headline: string;
  terminalLines: string[];
  choreography: CollectionChoreographyStep[];
  itinerary: CollectionSurpriseWindow[];
  encores: CollectionSurpriseEncore[];
  moments: CollectionSurpriseMoment[];
  credits: string[];
}

interface MomentDef {
  id: string;
  call: string;
  label: string;
  command: string;
  impact: CollectionSurpriseImpact;
  providerIds: string[];
  ascii: string[];
  motion: string[];
  note: string;
  guardrail: string;
  source: string;
}

const MOMENTS: MomentDef[] = [
  {
    id: "higgsfield-mcp-prism",
    call: "HF TURN",
    label: "Higgsfield MCP prism",
    command: cliCommand("connect higgsfield"),
    impact: "usage",
    providerIds: ["higgsfield"],
    ascii: [
      "   /\\ HF /\\   ",
      "  /__\\__/__\\  ",
      "  \\  /  \\  /  ",
      "   \\/_<>_\\/   ",
    ],
    motion: ["  /\\  ", "- HF -", "  \\/  ", " <==> "],
    note: "Authenticated Higgsfield usage gets a creator-first reveal before records fold into the local ledger.",
    guardrail: "Counts usage only when a consented provider/MCP source returns validated records.",
    source: "cli-spinners / drawille pulse",
  },
  {
    id: "codex-builder-trace",
    call: "CX LOOP",
    label: "Codex builder trace",
    command: cliCommand("trust list"),
    impact: "trust",
    providerIds: ["codex-cli", "claude-code", "github"],
    ascii: [
      "  +---CX---+  ",
      " / diff git \\ ",
      "| run -> log |",
      " \\ proof GH / ",
    ],
    motion: [" /CX\\ ", "<diff>", " \\__/ ", "{git} "],
    note: "Builder activity can strengthen the public profile, but it is visibly separate from spend.",
    guardrail: "Trust signal only. It never changes usage totals or leaderboard spend.",
    source: "cli-spinners / git side rail",
  },
  {
    id: "local-lab-sonar",
    call: "LAN PING",
    label: "Local lab sonar",
    command: cliCommand("detect"),
    impact: "local_only",
    providerIds: ["ollama", "lmstudio", "comfyui", "vllm"],
    ascii: [
      " [OL]--127.0.0.1",
      "   |\\  /v1/models",
      " [LM]--[CU] graph",
      "   |/  local log ",
    ],
    motion: [" .OL. ", "((LM))", "[ CU]", "<LAN>"],
    note: "Ollama, LM Studio, ComfyUI, vLLM, and loopback tools get scan feedback without leaving the machine.",
    guardrail: "Local-only until the user reviews and chooses an aggregate upload.",
    source: "loopback detector / ascii-globe",
  },
  {
    id: "creator-studio-meter",
    call: "MEDIA",
    label: "Creator studio meter",
    command: cliCommand("sync --receipt"),
    impact: "usage",
    providerIds: ["replicate", "falai", "runway", "elevenlabs", "suno", "udio"],
    ascii: [
      " [RP] pixels  [FA]",
      " [RW] frames  [11]",
      " [SU] music   [UD]",
      " source-labelled ",
    ],
    motion: ["[RP] ", "[FA] ", "[RW] ", "[11] "],
    note: "Image, video, voice, and music runs light the same serious collection UI as coding tools.",
    guardrail: "Stores usage metadata and estimates, not generated outputs.",
    source: "provider brand rail",
  },
  {
    id: "regional-provider-pass",
    call: "GLOBAL",
    label: "Regional provider pass",
    command: cliCommand("providers --all"),
    impact: "usage",
    providerIds: ["qwen", "doubao", "kimi", "mistral", "aleph-alpha", "lighton", "perplexity"],
    ascii: [
      " [QW] [DB] [KM] ",
      " [MI] [AA] [LO] ",
      " [PX] endpoint  ",
      " confidence rail",
    ],
    motion: ["[CN] ", "[EU] ", "[PX] ", "[AI] "],
    note: "Chinese, European, and adjacent global providers keep their own labelled rail instead of being an afterthought.",
    guardrail: "Endpoint proof, proxy proof, and manual fallback confidence stay explicit.",
    source: "regional adapter rail",
  },
  {
    id: "c0vibe-review-relay",
    call: "UNITE",
    label: "C0VIBE review relay",
    command: cliCommand("upload --dry-run"),
    impact: "publish",
    providerIds: ["c0vibe"],
    ascii: [
      " VIBERS UNITE ",
      " c0vibe.app   ",
      " review -> yes",
      " publish proof",
    ],
    motion: [" C0V ", "VIBE ", "APP  ", "YES? "],
    note: "The scan resolves into c0vibe.app only after the local review screen shows what leaves the machine.",
    guardrail: "Upload is explicit; trust labels stay separate from usage labels.",
    source: "C0VIBE relay",
  },
];

const CHOREOGRAPHY: Array<Omit<CollectionChoreographyStep, "stage" | "meter" | "marks"> & { providerIds: string[] }> = [
  {
    id: "wake",
    label: "Wake marks",
    detail: "Higgsfield, Codex, local, creator, global, and C0VIBE marks get a visible hello.",
    command: "scan:init()",
    tone: "usage",
    providerIds: ["higgsfield", "codex-cli", "ollama", "replicate", "qwen", "c0vibe"],
    guardrail: "Brand motion is feedback before proof, never counted usage.",
  },
  {
    id: "auth",
    label: "Auth classify",
    detail: "OAuth, API keys, local loopback, and manual rails split before any fetch.",
    command: "auth:classify()",
    tone: "privacy",
    providerIds: ["higgsfield", "replicate", "ollama", "lmstudio", "github"],
    guardrail: "Secrets stay local; missing auth becomes setup guidance.",
  },
  {
    id: "fetch",
    label: "Fetch signal",
    detail: "Usage-capable sources collect records while creator outputs stay off the wire.",
    command: "records:pull()",
    tone: "usage",
    providerIds: ["higgsfield", "runway", "falai", "suno", "perplexity"],
    guardrail: "Stores usage metadata and estimates, not generated media.",
  },
  {
    id: "validate",
    label: "Split truth",
    detail: "Usage, trust, local-only, privacy, and publish rails are separated before score.",
    command: "rails:validate()",
    tone: "trust",
    providerIds: ["codex-cli", "github", "c0vibe"],
    guardrail: "Trust signals strengthen context but never alter spend totals.",
  },
  {
    id: "review",
    label: "Review relay",
    detail: "The final checkpoint shows the aggregate that can publish to c0vibe.app.",
    command: "upload:dry-run()",
    tone: "publish",
    providerIds: ["c0vibe"],
    guardrail: "Vibers Unite only after explicit aggregate review.",
  },
];

const SURPRISE_WINDOWS: Array<Omit<CollectionSurpriseWindow, "stage" | "meter" | "marks"> & { providerIds: string[] }> = [
  {
    id: "queue",
    label: "Queue hello",
    trigger: "before data collection starts",
    cue: "Higgsfield prism and Codex cube turn once when matched.",
    replay: "Opens only for providers in the selected sync target list.",
    impact: "privacy",
    providerIds: ["higgsfield", "codex-cli", "c0vibe"],
  },
  {
    id: "scan-beat",
    label: "Scan beat",
    trigger: "before each provider fetch",
    cue: "The active provider mark spins while usage is still pending.",
    replay: "HF, CX, local lab, creator, and global rails keep distinct marks.",
    impact: "usage",
    providerIds: ["higgsfield", "codex-cli", "ollama", "replicate", "qwen"],
  },
  {
    id: "checkpoint",
    label: "Checkpoint encore",
    trigger: "after validation or provider error",
    cue: "The same mark returns as LOCK, CLEAR, or HOLD.",
    replay: "Accepted, duplicate, and failed rows all get honest feedback.",
    impact: "trust",
    providerIds: ["higgsfield", "ollama", "github", "replicate"],
  },
  {
    id: "relay",
    label: "C0VIBE relay",
    trigger: "after local review",
    cue: "Vibers Unite and c0vibe.app appear only at the review gate.",
    replay: "Upload stays explicit; trust and usage labels remain split.",
    impact: "publish",
    providerIds: ["c0vibe"],
  },
];

const ENCORES: Array<Omit<CollectionSurpriseEncore, "stage" | "status" | "meter" | "marks">> = [
  {
    id: "higgsfield-logo-turn",
    gate: "queue",
    label: "Higgsfield prism turn",
    trigger: "after authenticated Higgsfield MCP is detected",
    command: "encore:higgsfield()",
    impact: "usage",
    delayMs: 220,
    providerIds: ["higgsfield"],
    frames: [
      " /\\ \n<HF>\n \\/ ",
      " -- \n HF \n -- ",
      " \\/ \n<HF>\n /\\ ",
      "<><>\n HF \n<><>",
    ],
    caption: "A small HF mark turns once before validated records enter the ledger.",
    guardrail: "Visual hello only; records decide usage.",
    source: "custom ASCII logo turntable",
  },
  {
    id: "codex-cube-flip",
    gate: "scan-beat",
    label: "Codex diff cube",
    trigger: "while builder trust evidence is being classified",
    command: "encore:codex_trust()",
    impact: "trust",
    delayMs: 520,
    providerIds: ["codex-cli", "github"],
    frames: [
      "+CX+\n|{}|\n+--+",
      "/CX\\\n|git|\n\\__/",
      "<CX>\ndiff\ngit ",
      "+--+\n|CX|\n+GH+",
    ],
    caption: "The cube flips into a GitHub side rail so coding activity never looks like spend.",
    guardrail: "Trust signal only. NOT USAGE.",
    source: "custom ASCII diff cube",
  },
  {
    id: "local-sonar-bloom",
    gate: "checkpoint",
    label: "Local sonar bloom",
    trigger: "after Ollama, LM Studio, or ComfyUI loopback checks",
    command: "encore:loopback_sonar()",
    impact: "local_only",
    delayMs: 860,
    providerIds: ["ollama", "lmstudio", "comfyui"],
    frames: [
      " .-. \n(OL)\n `-' ",
      "(( ))\n LM \n(( ))",
      "[CU]\n LAN\n[AI]",
      "127.\n0.0.\n 1 ",
    ],
    caption: "Local sources get a radar bloom that makes local-only collection obvious.",
    guardrail: "No upload until aggregate review.",
    source: "loopback sonar ASCII",
  },
  {
    id: "c0vibe-unite-flash",
    gate: "relay",
    label: "C0VIBE unite flash",
    trigger: "only when the dry-run review is ready",
    command: "encore:c0vibe_review()",
    impact: "publish",
    delayMs: 1240,
    providerIds: ["c0vibe"],
    frames: [
      "C0\nVI\nBE",
      "VIBERS\nUNITE \nAPP   ",
      "c0vibe\n .app \nREADY ",
      "YES?\nONLY\nAFTER",
    ],
    caption: "Vibers Unite and C0vibe.app appear at the explicit review gate.",
    guardrail: "Publish remains a user-approved aggregate step.",
    source: "C0VIBE review flash",
  },
];

function providerFor(id: string): ProviderDescriptor | undefined {
  return PROVIDERS.find((provider) => provider.id === id);
}

function labelFor(id: string): string {
  const provider = providerFor(id);
  if (provider) return provider.label;
  if (id === "c0vibe") return "C0VIBE";
  return id
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function markFor(id: string): CollectionSurpriseMark {
  const brand = providerBrand(id);
  return {
    id,
    label: labelFor(id),
    mark: brand.mark,
    from: brand.from,
    to: brand.to,
    ink: brand.ink,
  };
}

function meterFor(ids: string[], impact: CollectionSurpriseImpact): number {
  if (impact === "publish") return 100;
  const found = ids.map(providerFor).filter(Boolean) as ProviderDescriptor[];
  const built = found.filter((provider) => provider.status === "built").length;
  const verified = found.filter((provider) => provider.status === "built" && provider.verified).length;
  const local = found.filter((provider) => provider.tier === "local" || provider.auth === "localLogs").length;
  const score = 36 + found.length * 6 + built * 10 + verified * 14 + local * 5;
  return Math.max(42, Math.min(98, score));
}

function statusFor(ids: string[], impact: CollectionSurpriseImpact): string {
  if (impact === "publish") return "review gate";
  if (impact === "trust") return "not usage";
  const found = ids.map(providerFor).filter(Boolean) as ProviderDescriptor[];
  if (found.some((provider) => provider.status === "built" && provider.verified)) return "verified evidence";
  if (found.some((provider) => provider.status === "built")) return "built collector";
  if (impact === "local_only") return "local-only";
  return "mapped rail";
}

function railLabelFor(impact: CollectionSurpriseImpact): string {
  if (impact === "trust" || impact === "local_only") return "NOT USAGE";
  if (impact === "privacy") return "PRIVACY";
  if (impact === "publish") return "PUBLISH";
  return "USAGE";
}

function beatsFor(moment: MomentDef): CollectionSurpriseBeat[] {
  const authDetail = moment.id === "local-lab-sonar" ? "loopback" : moment.id === "c0vibe-review-relay" ? "review" : "auth";
  const fetchDetail = moment.impact === "trust" ? "activity" : moment.impact === "local_only" ? "local logs" : "records";
  const reviewDetail = moment.impact === "publish" ? "publish?" : moment.impact === "trust" ? "side rail" : "redact";

  return [
    { label: "wake", detail: moment.call.toLowerCase(), surprise: true },
    { label: authDetail, detail: moment.providerIds.slice(0, 2).join("+") || "local", surprise: false },
    { label: "fetch", detail: fetchDetail, surprise: true },
    { label: "validate", detail: moment.impact.replace("_", "-"), surprise: false },
    { label: "review", detail: reviewDetail, surprise: moment.id === "c0vibe-review-relay" },
  ];
}

function buildChoreography(): CollectionChoreographyStep[] {
  return CHOREOGRAPHY.map((step, index) => ({
    ...step,
    stage: String(index + 1).padStart(2, "0"),
    meter: meterFor(step.providerIds, step.tone),
    marks: step.providerIds.map(markFor),
  }));
}

function buildItinerary(): CollectionSurpriseWindow[] {
  return SURPRISE_WINDOWS.map((window, index) => ({
    ...window,
    stage: String(index + 1).padStart(2, "0"),
    meter: meterFor(window.providerIds, window.impact),
    marks: window.providerIds.map(markFor),
  }));
}

function buildEncores(): CollectionSurpriseEncore[] {
  return ENCORES.map((encore, index) => ({
    ...encore,
    stage: String(index + 1).padStart(2, "0"),
    status: statusFor(encore.providerIds, encore.impact),
    meter: meterFor(encore.providerIds, encore.impact),
    marks: encore.providerIds.map(markFor),
  }));
}

export function buildCollectionSurpriseRun(): CollectionSurpriseRun {
  const moments = MOMENTS.map<CollectionSurpriseMoment>((moment, index) => ({
    ...moment,
    stage: String(index + 1).padStart(2, "0"),
    status: statusFor(moment.providerIds, moment.impact),
    meter: meterFor(moment.providerIds, moment.impact),
    marks: moment.providerIds.map(markFor),
    beats: beatsFor(moment),
  }));

  return {
    headline: "COLLECTION SURPRISE RUN",
    terminalLines: [
      "+------------------------------------------------------+",
      "| VTK://COLLECTION-RUN//SURPRISE-QUEUE//LOCAL-FIRST    |",
      "|------------------------------------------------------|",
      "| wake -> auth -> fetch -> validate -> review          |",
      "| choreography rail lights each checkpoint             |",
      "| surprise itinerary: queue -> scan -> check -> relay  |",
      "| surprise beats repeat before and after each source   |",
      "| encore reel: HF logo, CX cube, LAN bloom, C0 flash   |",
      "| surprise encores fire at queue, fetch, check, relay  |",
      "| checkpoints replay a branded encore after validate   |",
      "| HF / CX / LOCAL / MEDIA / GLOBAL / C0VIBE beats      |",
      "| usage, local_only, trust, publish labels stay clear  |",
      "| source: cli-spinners + ascii-globe + drawille        |",
      "| Vibers Unite // c0vibe.app                           |",
      "+------------------------------------------------------+",
    ],
    choreography: buildChoreography(),
    itinerary: buildItinerary(),
    encores: buildEncores(),
    moments,
    credits: [
      "ASCII/Unicode terminal style is used as feedback, not proof.",
      "Open-source inspiration: cli-spinners, ascii-globe, drawille.",
      "Encore reel: Higgsfield logo turn, Codex diff cube, local sonar bloom, and C0VIBE unite flash.",
      "Higgsfield, Codex, local, creator, and C0VIBE marks can replay as checkpoint encores.",
      "Every surprise has a guardrail label before any upload.",
    ],
  };
}

export function buildCollectionTransmissionRibbon(run: CollectionSurpriseRun = buildCollectionSurpriseRun()): CollectionTransmissionRibbon {
  const steps = run.encores.map<CollectionTransmissionStep>((encore) => {
    const window = run.itinerary.find((item) => item.id === encore.gate);
    return {
      id: encore.id,
      gate: encore.gate,
      stage: window?.stage ?? encore.stage,
      label: encore.label,
      cue: window?.cue ?? encore.trigger,
      command: encore.command,
      impact: encore.impact,
      status: encore.status,
      meter: encore.meter,
      delayMs: encore.delayMs,
      marks: encore.marks,
      frames: encore.frames,
      caption: encore.caption,
      guardrail: encore.guardrail,
    };
  });

  return {
    headline: "SURPRISE TRANSMISSION RIBBON",
    subline: "A first-screen scan bridge: queue, fetch, checkpoint, and C0VIBE relay moments preview before the long-form collection room.",
    terminalLines: [
      "+------------------------------------------------------+",
      "| VTK://SURPRISE-RIBBON//FIRST-SCREEN//VIBERS-UNITE    |",
      "| queue -> scan -> checkpoint -> relay                 |",
      "| HF prism / CX cube / LAN bloom / C0VIBE flash        |",
      "| visual feedback only; records decide usage totals    |",
      "| trust and local-only rails stay labelled NOT USAGE   |",
      "+------------------------------------------------------+",
    ],
    steps,
  };
}

export function buildCollectionHeroScanBridge(run: CollectionSurpriseRun = buildCollectionSurpriseRun()): CollectionHeroScanBridge {
  const stages = run.encores.map<CollectionHeroScanStage>((encore) => {
    const window = run.itinerary.find((item) => item.id === encore.gate);
    const railLabel = railLabelFor(encore.impact);
    return {
      id: encore.id,
      gate: encore.gate,
      stage: window?.stage ?? encore.stage,
      label: encore.label,
      command: encore.command,
      impact: encore.impact,
      railLabel,
      status: encore.status,
      meter: encore.meter,
      delayMs: encore.delayMs,
      marks: encore.marks,
      frames: encore.frames,
      terminalLines: [
        liveFrameLine(`HERO ${window?.stage ?? encore.stage}/04 ${encore.label}`),
        liveFrameLine(`gate ${encore.gate} // ${railLabel} // ${encore.status}`),
        liveFrameLine(`cue ${window?.cue ?? encore.trigger}`),
        liveFrameLine(`frame ${encore.frames[0]?.replace(/\n/g, " / ") ?? encore.label}`),
        liveFrameLine(encore.guardrail),
      ],
      cue: window?.cue ?? encore.trigger,
      guardrail: encore.guardrail,
    };
  });

  const notUsage = stages.filter((stage) => stage.railLabel === "NOT USAGE").length;
  const publish = stages.filter((stage) => stage.impact === "publish").length;

  return {
    headline: "HERO SCAN BRIDGE",
    subline: "The first viewport now previews the exact surprise moments users see during scan and collection: Higgsfield turn, Codex cube, local sonar, and C0VIBE relay.",
    motto: "Vibers Unite // C0vibe.app",
    terminalLines: [
      "+------------------------------------------------------+",
      liveFrameLine("VTK://HERO-SCAN-BRIDGE//FIRST-VIEW//VIBERS-UNITE"),
      liveFrameLine("queue -> scan -> checkpoint -> c0vibe review relay"),
      liveFrameLine(`stages ${stages.length} // surprises ${stages.length} // usageWrites 0`),
      liveFrameLine(`usage ${stages.filter((stage) => stage.impact === "usage").length} // not_usage ${notUsage} // publish ${publish}`),
      liveFrameLine("HF prism, Codex cube, local sonar, C0VIBE flash"),
      liveFrameLine("visual only; validated ledger rows decide usage"),
      liveFrameLine("Vibers Unite // c0vibe.app"),
      "+------------------------------------------------------+",
    ],
    totals: {
      stages: stages.length,
      surprises: stages.length,
      usage: stages.filter((stage) => stage.impact === "usage").length,
      notUsage,
      publish,
      visualOnly: stages.length,
      usageWrites: 0,
    },
    stages,
  };
}

export function buildCollectionSignalStack(run: CollectionSurpriseRun = buildCollectionSurpriseRun()): CollectionSignalStack {
  const stages = run.itinerary.map<CollectionSignalStackStage>((window) => {
    const encore = run.encores.find((item) => item.gate === window.id);
    const marks = window.marks.length ? window.marks : (encore?.marks ?? []);
    const frames = encore?.frames ?? marks.slice(0, 4).map((mark) => `${mark.mark}\n${window.id}\n${window.stage}`);
    const label = encore ? encore.label : window.label;
    const status = window.impact === "trust" ? "not usage"
      : window.impact === "local_only" ? "local only"
      : window.impact === "publish" ? "review gate"
      : statusFor(marks.map((mark) => mark.id), window.impact);
    return {
      id: window.id,
      stage: window.stage,
      label,
      command: encore?.command ?? `surprise:${window.id}()`,
      status,
      impact: window.impact,
      meter: Math.max(window.meter, encore?.meter ?? 0),
      marks,
      frames,
      signalLines: [
        `trigger ${window.trigger}`,
        `cue ${window.cue}`,
        `replay ${window.replay}`,
        `rail ${window.impact.replace("_", "-")} // ${status}`,
      ],
      caption: encore?.caption ?? window.cue,
      guardrail: encore?.guardrail ?? window.replay,
    };
  });

  return {
    headline: "SIGNAL STACK CONTROL ROOM",
    subline: "A dense GUI terminal instrument for the exact surprise moments that run while VibeTRACKER scans and collects.",
    terminalLines: [
      "+------------------------------------------------------+",
      "| VTK://SIGNAL-STACK//GUI-TERMINAL//VIBERS-UNITE       |",
      "|------------------------------------------------------|",
      "| stack 01 queue hello       HF prism + CX cube        |",
      "| stack 02 scan beat         active provider turntable |",
      "| stack 03 checkpoint        LOCK / CLEAR / HOLD truth |",
      "| stack 04 relay             c0vibe.app review gate   |",
      "| terminal charm is feedback; ledger rows decide truth |",
      "| trust/local rails remain labelled NOT USAGE          |",
      "+------------------------------------------------------+",
    ],
    stages,
  };
}

const LIVE_FRAME_WIDTH = 52;

function liveFrameLine(text: string): string {
  const clipped = text.length > LIVE_FRAME_WIDTH ? text.slice(0, LIVE_FRAME_WIDTH) : text;
  return `| ${clipped.padEnd(LIVE_FRAME_WIDTH)} |`;
}

function mini(text: string, width = 7): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > width ? normalized.slice(0, width) : normalized.padEnd(width);
}

function runwayFrame(mark: string, label: string, railLabel: string): string {
  return `${mini(mark, 7)}\n${mini(label.toUpperCase(), 7)}\n${mini(railLabel.replace("NOT ", "NO "), 7)}`;
}

function runwayTranscriptLine(text: string, width = 44): string {
  const clipped = text.length > width ? text.slice(0, width) : text;
  return clipped;
}

export function buildCollectionCommandRunway(run: CollectionSurpriseRun = buildCollectionSurpriseRun()): CollectionCommandRunway {
  const wake = run.choreography.find((step) => step.id === "wake") ?? run.choreography[0];
  const wakeMark = markFor("c0vibe");
  const wakeStep: CollectionCommandRunwayStep = {
    id: "wake-auth-preview",
    stage: "00",
    label: "Wake auth preview",
    command: wake?.command ?? "scan:init()",
    impact: "privacy",
    railLabel: "PRIVACY",
    status: "visual preflight",
    meter: 100,
    mark: "VTK",
    from: wakeMark.from,
    to: wakeMark.to,
    ink: wakeMark.ink,
    frames: [
      runwayFrame("VTK", "wake", "PRIVACY"),
      "HF CX\nLOCAL\nC0VIB",
      "VIBERS\nUNITE \nAPP   ",
    ],
    transcript: [
      "wake marks before provider collection",
      "auth, keys, loopback, and review rails split",
      "providerCalls 0 // uploads 0 // promptReads 0",
      "visualOnly=true // usageWrites=false",
    ],
    note: "The GUI says hello before collection starts so users know what will be scanned.",
    guardrail: wake?.guardrail ?? "Brand motion is feedback before proof, never counted usage.",
    visualOnly: true,
    usageWrites: false,
  };

  const momentSteps = run.moments.map<CollectionCommandRunwayStep>((moment, index) => {
    const mark = moment.marks[0] ?? markFor(moment.providerIds[0] ?? "c0vibe");
    const railLabel = railLabelFor(moment.impact);
    const status = moment.status;
    return {
      id: moment.id,
      stage: String(index + 1).padStart(2, "0"),
      label: moment.label,
      command: moment.command,
      impact: moment.impact,
      railLabel,
      status,
      meter: moment.meter,
      mark: mark.mark,
      from: mark.from,
      to: mark.to,
      ink: mark.ink,
      frames: [
        runwayFrame(mark.mark, moment.call, railLabel),
        runwayFrame(moment.motion[0] ?? mark.mark, status, railLabel),
        runwayFrame(moment.motion[1] ?? mark.mark, moment.providerIds[0] ?? moment.id, railLabel),
      ],
      transcript: [
        runwayTranscriptLine(`cmd ${moment.command}`),
        runwayTranscriptLine(`rail ${railLabel} // ${status}`),
        runwayTranscriptLine(`source ${moment.source}`),
        runwayTranscriptLine(moment.guardrail),
      ],
      note: moment.note,
      guardrail: moment.guardrail,
      visualOnly: true,
      usageWrites: false,
    };
  });

  const steps = [wakeStep, ...momentSteps];
  const notUsage = steps.filter((step) => step.railLabel === "NOT USAGE").length;
  const usage = steps.filter((step) => step.impact === "usage").length;
  const privacy = steps.filter((step) => step.impact === "privacy").length;
  const publish = steps.filter((step) => step.impact === "publish").length;

  return {
    headline: "LIVE SCAN COMMAND RUNWAY",
    subline: "A first-run cockpit for the exact order users see: preflight, usage collectors, trust side rails, local-only scans, creator tools, regional providers, and the C0VIBE relay.",
    terminalLines: [
      "+------------------------------------------------------+",
      liveFrameLine("VTK://SCAN-COMMAND-RUNWAY//LIVE-GUI//VIBERS-UNITE"),
      liveFrameLine("preflight -> higgsfield -> codex -> local -> creator"),
      liveFrameLine("regional -> c0vibe relay // visualOnly=true"),
      liveFrameLine(`steps ${steps.length} // usage ${usage} // not_usage ${notUsage}`),
      liveFrameLine(`privacy ${privacy} // publish ${publish} // usageWrites 0`),
      liveFrameLine("providerCalls 0 // uploads 0 // promptReads 0"),
      liveFrameLine("Vibers Unite // c0vibe.app"),
      "+------------------------------------------------------+",
    ],
    totals: {
      steps: steps.length,
      usage,
      notUsage,
      privacy,
      publish,
      visualOnly: steps.length,
      usageWrites: 0,
    },
    steps,
  };
}

function cascadeRevealFor(frameIndex: number): CollectionSurpriseCascadeBeat["reveal"] {
  return (["blink", "turn", "lock", "unite"] as const)[frameIndex] ?? "blink";
}

function cascadeCaption(encore: CollectionSurpriseEncore, reveal: CollectionSurpriseCascadeBeat["reveal"]): string {
  if (encore.id === "higgsfield-logo-turn") return `Higgsfield ${reveal} reveals authenticated collection without bypassing validation.`;
  if (encore.id === "codex-cube-flip") return `Codex ${reveal} keeps GitHub and builder traces on the trust side rail.`;
  if (encore.id === "local-sonar-bloom") return `Local ${reveal} makes loopback scans feel alive while staying on the machine.`;
  return `C0VIBE ${reveal} waits for the reviewed aggregate before the motto appears.`;
}

function cascadeOperatorLines(
  encore: CollectionSurpriseEncore,
  frame: string,
  stage: string,
  reveal: CollectionSurpriseCascadeBeat["reveal"],
  railLabel: string,
): string[] {
  return [
    liveFrameLine(`CASCADE ${stage}/16 ${encore.label}`),
    liveFrameLine(`${reveal} ${frame.replace(/\n/g, " / ")}`),
    liveFrameLine(`gate ${encore.gate} // ${railLabel} // ${encore.status}`),
    liveFrameLine(encore.guardrail),
  ];
}

export function buildCollectionSurpriseCascade(run: CollectionSurpriseRun = buildCollectionSurpriseRun()): CollectionSurpriseCascade {
  const beats = run.encores.flatMap<CollectionSurpriseCascadeBeat>((encore, encoreIndex) => {
    const railLabel = railLabelFor(encore.impact);
    return encore.frames.map((frame, frameIndex) => {
      const sequenceIndex = encoreIndex * 4 + frameIndex + 1;
      const reveal = cascadeRevealFor(frameIndex);
      const delayMs = encore.delayMs + encoreIndex * 120 + frameIndex * 180;
      const stage = String(sequenceIndex).padStart(2, "0");
      return {
        id: `${encore.id}-${reveal}`,
        sourceEncoreId: encore.id,
        gate: encore.gate,
        stage,
        label: `${encore.label} ${reveal}`,
        reveal,
        command: `${encore.command}:${reveal}`,
        impact: encore.impact,
        railLabel,
        status: encore.status,
        timing: timingFor(sequenceIndex - 1, delayMs),
        delayMs,
        meter: Math.min(100, Math.max(42, encore.meter - 6 + frameIndex * 3)),
        marks: encore.marks,
        frame,
        operatorLines: cascadeOperatorLines(encore, frame, stage, reveal, railLabel),
        caption: cascadeCaption(encore, reveal),
        guardrail: encore.guardrail,
        surprise: frameIndex !== 1,
      };
    });
  });

  return {
    headline: "SURPRISE CASCADE",
    subline: "Sixteen tiny GUI-terminal reveals can fire across the scan: a Higgsfield turn, Codex cube, local sonar, and C0VIBE motto beat repeat at honest collection gates.",
    motto: "Vibers Unite // C0vibe.app // surprise feedback never writes rows",
    terminalLines: [
      "+------------------------------------------------------+",
      liveFrameLine("VTK://SURPRISE-CASCADE//SCAN-COLLECT//LOCAL-FIRST"),
      liveFrameLine("surprise the user several times during collection"),
      liveFrameLine("HF logo turn -> Codex cube -> local sonar -> C0VIBE"),
      liveFrameLine("each beat has timing, rail label, meter, and guardrail"),
      liveFrameLine("NO PROMPTS / NO OUTPUTS / NO SECRET VALUES RECORDED"),
      liveFrameLine("visual surprise is feedback; validated rows are truth"),
      liveFrameLine("Vibers Unite // c0vibe.app"),
      "+------------------------------------------------------+",
    ],
    totals: {
      beats: beats.length,
      surprises: beats.filter((beat) => beat.surprise).length,
      usage: beats.filter((beat) => beat.impact === "usage").length,
      notUsage: beats.filter((beat) => beat.railLabel === "NOT USAGE").length,
      publish: beats.filter((beat) => beat.impact === "publish").length,
      maxDelayMs: Math.max(...beats.map((beat) => beat.delayMs), 0),
    },
    beats,
  };
}

function liveTurnLines(encore: CollectionSurpriseEncore): string[] {
  return encore.frames.flatMap((frame, frameIndex) => [
    liveFrameLine(`LIVE TURN ${String(frameIndex + 1).padStart(2, "0")}/${String(encore.frames.length).padStart(2, "0")} ${encore.label.toUpperCase()}`),
    ...frame.split("\n").map((line) => liveFrameLine(`  ${line}`)),
    liveFrameLine(`${encore.impact === "trust" || encore.impact === "local_only" ? "NOT USAGE" : encore.impact.toUpperCase()} // ${encore.status}`),
  ]);
}

function sequencerLines(encore: CollectionSurpriseEncore): string[] {
  const beats = ["blink", "turn", "sparkle", "unite"];
  return [
    liveFrameLine(`SIGNATURE ${encore.stage}/04 ${encore.label}`),
    ...beats.map((beat, index) => liveFrameLine(`${beat.padEnd(7)} ${encore.frames[index]?.replace(/\n/g, " / ") ?? encore.label}`)),
    liveFrameLine(`${encore.impact === "trust" || encore.impact === "local_only" ? "NOT USAGE" : encore.impact.toUpperCase()} // ${encore.status}`),
  ];
}

function hashText(input: string): string {
  let hash = 2166136261;
  for (const char of input) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, "0").slice(0, 8).toUpperCase();
}

function blackBoxFrames(step: CollectionChoreographyStep, index: number, run: CollectionSurpriseRun): string[] {
  const encore = run.encores[index] ?? run.encores[run.encores.length - 1];
  const fallback = step.marks.slice(0, 4).map((mark) => `${mark.mark}\n${step.id}\n${step.stage}`);
  return (encore?.frames.length ? encore.frames : fallback).slice(0, 4);
}

function blackBoxTranscript(step: CollectionChoreographyStep, frames: string[], checksum: string): string[] {
  const rail = step.tone === "trust" || step.tone === "local_only" ? "NOT USAGE" : step.tone.toUpperCase();
  return [
    liveFrameLine(`BLACK BOX ${step.stage}/05 ${step.label}`),
    liveFrameLine(`cmd ${step.command}`),
    liveFrameLine(`rail ${rail} // ${statusFor(step.marks.map((mark) => mark.id), step.tone)}`),
    liveFrameLine(`frame ${frames[0]?.replace(/\n/g, " / ") ?? step.label}`),
    liveFrameLine(`hash ${checksum} // replayable local proof`),
  ];
}

function recapLines(encore: CollectionSurpriseEncore, checksum: string): string[] {
  const rail = railLabelFor(encore.impact);
  return [
    liveFrameLine(`RECAP ${encore.stage}/04 ${encore.label}`),
    liveFrameLine(`gate ${encore.gate} // ${encore.status}`),
    liveFrameLine(`rail ${rail} // no extra ledger rows`),
    liveFrameLine(`frame ${encore.frames[0]?.replace(/\n/g, " / ") ?? encore.label}`),
    liveFrameLine(`hash ${checksum} // visual replay only`),
  ];
}

function timingFor(index: number, delayMs: number): string {
  return `T+${((delayMs + index * 140) / 1000).toFixed(2)}s`;
}

const FLIGHT_RECORDER_PHASES: Array<{
  phase: CollectionFlightRecorderPhase;
  cue: string;
}> = [
  { phase: "queue", cue: "mark armed before collection starts" },
  { phase: "scan", cue: "ASCII turntable runs while fetch is pending" },
  { phase: "checkpoint", cue: "seal appears only after validation" },
  { phase: "recap", cue: "replay closes without extra ledger rows" },
];

function recorderId(events: CollectionFlightRecorderEvent[]): string {
  return hashText(events.map((event) => `${event.sequence}:${event.phase}:${event.mark}:${event.railLabel}:${event.label}`).join("|"));
}

function recorderTranscript(event: {
  stage: string;
  label: string;
  phase: CollectionFlightRecorderPhase;
  mark: string;
  railLabel: string;
  cue: string;
  frame: string;
  checksum: string;
}): string[] {
  return [
    liveFrameLine(`FLIGHT ${event.stage}/16 ${event.phase.toUpperCase()} ${event.mark} ${event.railLabel}`),
    liveFrameLine(event.label),
    liveFrameLine(`${event.cue} :: ${event.frame.replace(/\n/g, " / ")}`),
    liveFrameLine(`hash ${event.checksum} // visualOnly=true`),
  ];
}

function phaseEvents(events: CollectionFlightRecorderEvent[], phase: CollectionFlightRecorderPhase): CollectionFlightRecorderEvent[] {
  return events.filter((event) => event.phase === phase);
}

function tapeMeter(count: number, total: number): number {
  if (count <= 0) return 12;
  return Math.min(100, Math.max(24, Math.round((count / Math.max(1, total)) * 100)));
}

function tapeColor(events: CollectionFlightRecorderEvent[], fallback: CollectionSurpriseMark): CollectionSurpriseMark {
  return events[0]?.marks[0] ?? fallback;
}

function buildCollectionControlTape(events: CollectionFlightRecorderEvent[]): CollectionControlTapeStep[] {
  const queue = phaseEvents(events, "queue");
  const scan = phaseEvents(events, "scan");
  const checkpoint = phaseEvents(events, "checkpoint");
  const recap = phaseEvents(events, "recap");
  const visualOnly = events.filter((event) => event.visualOnly).length;
  const writes = events.filter((event) => event.usageWrites).length;
  const usage = events.filter((event) => event.impact === "usage").length;
  const notUsage = events.filter((event) => event.railLabel === "NOT USAGE").length;
  const localOnly = events.filter((event) => event.impact === "local_only").length;
  const publish = events.filter((event) => event.impact === "publish").length;
  const fallback: CollectionSurpriseMark = { id: "c0vibe", mark: "C0", label: "C0VIBE", from: "#2ee8d6", to: "#9f7cff", ink: "#071013" };
  const total = Math.max(1, events.length);
  const makeStep = (
    id: CollectionControlTapeStep["id"],
    label: string,
    command: string,
    value: string,
    detail: string,
    impact: CollectionSurpriseImpact,
    railLabel: string,
    eventGroup: CollectionFlightRecorderEvent[],
    frames: string[],
  ): CollectionControlTapeStep => {
    const color = tapeColor(eventGroup, fallback);
    return {
      id,
      label,
      command,
      value,
      detail,
      impact,
      railLabel,
      meter: tapeMeter(eventGroup.length, total),
      from: color.from,
      to: color.to,
      ink: color.ink,
      frames,
      terminalLines: [
        liveFrameLine(`CONTROL ${id.toUpperCase()} ${railLabel}`),
        liveFrameLine(`${command} -> ${value}`),
        liveFrameLine(detail),
        liveFrameLine(`visualOnly=${visualOnly} // usageWrites=${writes}`),
      ],
      visualOnly: true,
      usageWrites: false,
    };
  };

  return [
    makeStep(
      "scan",
      "Scan marks",
      "scan:marks()",
      `${queue.length} queued`,
      "HF/CX/local/C0 marks arm before collection.",
      "privacy",
      "VISUAL ONLY",
      queue,
      ["SCAN", "HF CX", "LOCAL", "C0"],
    ),
    makeStep(
      "fetch",
      "Fetch beats",
      "fetch:beats()",
      `${scan.length} beats`,
      `${usage} usage events, ${localOnly} local-only events.`,
      usage ? "usage" : "privacy",
      "USAGE/LOCAL",
      scan,
      ["FETCH", "USAGE", "LOCAL", "NO RAW"],
    ),
    makeStep(
      "validate",
      "Validate rail",
      "validate:rails()",
      `${checkpoint.length} checks`,
      `${notUsage} not-usage events; trust never boosts spend.`,
      "trust",
      "NO BOOST",
      checkpoint,
      ["LOCK", "CLEAR", "HOLD", "TRUST"],
    ),
    makeStep(
      "seal",
      "Seal recap",
      "seal:recap()",
      `${recap.length} seals`,
      `${publish} publish events wait for reviewed aggregates.`,
      "publish",
      "PUBLISH",
      recap,
      ["HASH", "RECAP", "0 WRITE", "UNITE"],
    ),
  ];
}

export function buildCollectionFlightRecorder(run: CollectionSurpriseRun = buildCollectionSurpriseRun()): CollectionFlightRecorderDeck {
  const events = run.encores.flatMap<CollectionFlightRecorderEvent>((encore, encoreIndex) => {
    const railLabel = railLabelFor(encore.impact);
    return FLIGHT_RECORDER_PHASES.map((phase, phaseIndex) => {
      const sequence = encoreIndex * FLIGHT_RECORDER_PHASES.length + phaseIndex + 1;
      const stage = String(sequence).padStart(2, "0");
      const mark = encore.marks[0];
      const providerId = mark?.id ?? encore.providerIds[0] ?? encore.id;
      const frame = encore.frames[phaseIndex] ?? encore.frames[0] ?? encore.label;
      const delayMs = encore.delayMs + encoreIndex * 120 + phaseIndex * 160;
      const checksum = hashText([
        stage,
        phase.phase,
        encore.id,
        providerId,
        railLabel,
        phase.cue,
        frame,
        encore.guardrail,
      ].join("//"));
      const event = {
        id: `${encore.id}-${phase.phase}`,
        sequence,
        stage,
        phase: phase.phase,
        gate: encore.gate,
        providerId,
        mark: mark?.mark ?? providerId.slice(0, 2).toUpperCase(),
        label: encore.label,
        command: `${encore.command}:${phase.phase}`,
        impact: encore.impact,
        railLabel,
        status: encore.status,
        timing: timingFor(sequence - 1, delayMs),
        delayMs,
        meter: Math.min(100, Math.max(42, encore.meter - 8 + phaseIndex * 4)),
        marks: encore.marks,
        frame,
        cue: phase.cue,
        transcript: [],
        checksum,
        guardrail: encore.guardrail,
        visualOnly: true,
        usageWrites: false,
        promptExport: false,
        outputExport: false,
        secretRead: false,
      } satisfies Omit<CollectionFlightRecorderEvent, "transcript"> & { transcript: string[] };
      return {
        ...event,
        transcript: recorderTranscript(event),
      };
    });
  });
  const checksums = new Set(events.map((event) => event.checksum));
  const id = recorderId(events);
  const controlTape = buildCollectionControlTape(events);

  return {
    headline: "SURPRISE FLIGHT RECORDER",
    subline: "A GUI flight tape for the scan show: every Higgsfield, Codex, local, and C0VIBE surprise is replayable, labelled, and stamped as visual-only.",
    motto: "Vibers Unite // C0vibe.app // visual surprise never writes usage",
    terminalLines: [
      "+------------------------------------------------------+",
      liveFrameLine("VTK://SURPRISE-FLIGHT-RECORDER//GUI//VIBERS-UNITE"),
      liveFrameLine(`recorder ${id} // events ${events.length}`),
      liveFrameLine(`rail counts USAGE ${events.filter((event) => event.impact === "usage").length} // NOT USAGE ${events.filter((event) => event.railLabel === "NOT USAGE").length}`),
      liveFrameLine(`rail counts LOCAL-ONLY ${events.filter((event) => event.impact === "local_only").length} // PUBLISH ${events.filter((event) => event.impact === "publish").length}`),
      liveFrameLine("NO PROVIDER CALLS / NO USAGE WRITES"),
      liveFrameLine("NO PROMPTS / NO OUTPUTS / NO SECRET VALUES"),
      liveFrameLine("each event is visualOnly=true and usageWrites=false"),
      liveFrameLine("HF logo turn -> Codex cube -> local sonar -> C0VIBE"),
      liveFrameLine("Vibers Unite // c0vibe.app"),
      "+------------------------------------------------------+",
    ],
    totals: {
      events: events.length,
      usage: events.filter((event) => event.impact === "usage").length,
      notUsage: events.filter((event) => event.railLabel === "NOT USAGE").length,
      localOnly: events.filter((event) => event.impact === "local_only").length,
      publish: events.filter((event) => event.impact === "publish").length,
      visualOnly: events.filter((event) => event.visualOnly).length,
      writes: events.filter((event) => event.usageWrites).length,
      checksums: checksums.size,
    },
    controlTape,
    events,
  };
}

export function buildCollectionEventTape(run: CollectionSurpriseRun = buildCollectionSurpriseRun()): CollectionEventTape {
  const recorder = buildCollectionFlightRecorder(run);
  const rows = recorder.events.map<CollectionEventTapeRow>((event) => {
    const mark = event.marks[0];
    const line = [
      event.timing,
      event.stage,
      event.phase.toUpperCase(),
      event.mark,
      event.railLabel,
      event.label,
      event.checksum,
    ].join(" // ");
    return {
      id: event.id,
      sequence: event.sequence,
      stage: event.stage,
      phase: event.phase,
      providerId: event.providerId,
      mark: event.mark,
      label: event.label,
      command: event.command,
      railLabel: event.railLabel,
      timing: event.timing,
      meter: event.meter,
      checksum: event.checksum,
      line,
      from: mark?.from ?? "#9f7cff",
      to: mark?.to ?? "#2ee8d6",
      ink: mark?.ink ?? "#071013",
      visualOnly: true,
      usageWrites: false,
    };
  });

  return {
    headline: "LIVE EVENT TAPE",
    subline: "A compact operator log for the same visual-only scan events shown in the flight recorder cards.",
    terminalLines: [
      "+------------------------------------------------------+",
      liveFrameLine("VTK://COLLECTION-EVENT-TAPE//GUI//NO-HIDDEN-UPLOAD"),
      liveFrameLine(`rows ${rows.length} // visualOnly ${rows.filter((row) => row.visualOnly).length} // writes ${rows.filter((row) => row.usageWrites).length}`),
      liveFrameLine("queue -> scan -> checkpoint -> recap, same recorder id"),
      liveFrameLine("NO PROMPTS / NO OUTPUTS / NO SECRET VALUES"),
      liveFrameLine("Vibers Unite // c0vibe.app"),
      "+------------------------------------------------------+",
    ],
    totals: {
      rows: rows.length,
      visualOnly: rows.filter((row) => row.visualOnly).length,
      usageWrites: rows.filter((row) => row.usageWrites).length,
      hiddenUploads: 0,
      promptExports: 0,
      outputExports: 0,
    },
    rows,
  };
}

export function buildCollectionSurpriseDirector(run: CollectionSurpriseRun = buildCollectionSurpriseRun()): CollectionSurpriseDirector {
  const cues = run.encores.map<CollectionSurpriseDirectorCue>((encore, index) => {
    const window = run.itinerary.find((item) => item.id === encore.gate);
    const timing = timingFor(index, encore.delayMs);
    const railLabel = railLabelFor(encore.impact);
    return {
      id: encore.id,
      gate: encore.gate,
      stage: window?.stage ?? encore.stage,
      label: encore.label,
      command: encore.command,
      impact: encore.impact,
      railLabel,
      status: encore.status,
      timing,
      meter: encore.meter,
      delayMs: encore.delayMs,
      marks: encore.marks,
      frames: encore.frames,
      trigger: window ? `${window.label}: ${window.trigger}` : encore.trigger,
      operatorLine: `${timing} ${encore.label} // ${railLabel}`,
      caption: encore.caption,
      guardrail: encore.guardrail,
      source: encore.source,
    };
  });
  const providerIds = new Set(cues.flatMap((cue) => cue.marks.map((mark) => mark.id)));

  return {
    headline: "SCANNER SURPRISE DIRECTOR",
    subline: "The first-screen showrunner for scan feedback: logo turns, trust side rails, local radar, and the C0VIBE review flash fire in a visible order.",
    motto: "Vibers Unite // C0vibe.app",
    terminalLines: [
      "+------------------------------------------------------+",
      liveFrameLine("VTK://SURPRISE-DIRECTOR//SHOWRUN//VIBERS-UNITE"),
      liveFrameLine("logo turn -> cube flip -> sonar bloom -> C0 relay"),
      liveFrameLine("Higgsfield HF, Codex CX, local LAN, c0vibe.app"),
      liveFrameLine("animated feedback only; validated rows decide usage"),
      liveFrameLine("trust and local rails stay labelled NOT USAGE"),
      liveFrameLine("operator motto: Vibers Unite"),
      "+------------------------------------------------------+",
    ],
    totals: {
      cues: cues.length,
      usage: cues.filter((cue) => cue.impact === "usage").length,
      notUsage: cues.filter((cue) => cue.railLabel === "NOT USAGE").length,
      publish: cues.filter((cue) => cue.impact === "publish").length,
      providers: providerIds.size,
    },
    cues,
  };
}

export function buildCollectionSurpriseSequencer(run: CollectionSurpriseRun = buildCollectionSurpriseRun()): CollectionSurpriseSequencer {
  const steps = run.encores.map<CollectionSurpriseSequencerStep>((encore) => ({
    id: encore.id,
    gate: encore.gate,
    stage: encore.stage,
    label: encore.label,
    command: encore.command,
    impact: encore.impact,
    status: encore.status,
    meter: encore.meter,
    delayMs: encore.delayMs,
    marks: encore.marks,
    frames: encore.frames,
    beats: ["blink", "turn", "sparkle", "unite"],
    terminalLines: sequencerLines(encore),
    caption: encore.caption,
    guardrail: encore.guardrail,
  }));

  return {
    headline: "SIGNATURE SURPRISE SEQUENCER",
    subline: "A compact GUI timing rail for the exact authored reveals that fire while providers scan, validate, and relay.",
    terminalLines: [
      "+------------------------------------------------------+",
      "| VTK://SIGNATURE-SEQUENCER//GUI//VIBERS-UNITE         |",
      "|------------------------------------------------------|",
      "| blink -> turn -> sparkle -> unite                    |",
      "| HF logo / CX cube / LOCAL radar / C0VIBE relay       |",
      "| surprise art is feedback; records decide truth       |",
      "| trust and local-only rows remain labelled NOT USAGE  |",
      "+------------------------------------------------------+",
    ],
    steps,
  };
}

export function buildCollectionBlackBox(run: CollectionSurpriseRun = buildCollectionSurpriseRun()): CollectionBlackBoxDeck {
  const cells = run.choreography.map<CollectionBlackBoxCell>((step, index) => {
    const frames = blackBoxFrames(step, index, run);
    const status = statusFor(step.marks.map((mark) => mark.id), step.tone);
    const checksum = hashText([
      step.stage,
      step.id,
      step.command,
      step.detail,
      step.guardrail,
      frames.join("|"),
    ].join("//"));

    return {
      id: step.id,
      stage: step.stage,
      label: step.label,
      command: step.command,
      impact: step.tone,
      status,
      meter: step.meter,
      marks: step.marks,
      frames,
      transcript: blackBoxTranscript(step, frames, checksum),
      checksum,
      guardrail: step.guardrail,
    };
  });

  return {
    headline: "SCANNER BLACK BOX",
    subline: "A replayable GUI flight recorder for the scan: each stage shows command, rail, hash, and the exact trust boundary before data can publish.",
    terminalLines: [
      "+------------------------------------------------------+",
      "| VTK://SCANNER-BLACK-BOX//REPLAYABLE-PROOF//VIBERS    |",
      "|------------------------------------------------------|",
      "| wake -> auth -> fetch -> validate -> review          |",
      "| every stage has a deterministic local replay hash    |",
      "| NO PROMPTS / NO OUTPUTS / NO SECRET VALUES RECORDED  |",
      "| NOT USAGE rails cannot alter spend or score          |",
      "| Vibers Unite // c0vibe.app only after dry-run review |",
      "+------------------------------------------------------+",
    ],
    cells,
  };
}

export function buildCollectionEncoreRecap(run: CollectionSurpriseRun = buildCollectionSurpriseRun()): CollectionEncoreRecapDeck {
  const rails = run.encores.map<CollectionEncoreRecapRail>((encore) => {
    const railLabel = railLabelFor(encore.impact);
    const checksum = hashText([
      encore.id,
      encore.gate,
      encore.command,
      encore.guardrail,
      encore.frames.join("|"),
    ].join("//"));

    return {
      id: encore.id,
      gate: encore.gate,
      stage: encore.stage,
      label: encore.label,
      command: encore.command,
      impact: encore.impact,
      railLabel,
      status: encore.status,
      meter: encore.meter,
      delayMs: encore.delayMs,
      marks: encore.marks,
      frames: encore.frames,
      recapLines: recapLines(encore, checksum),
      checksum,
      caption: encore.caption,
      guardrail: encore.guardrail,
    };
  });
  const checksums = new Set(rails.map((rail) => rail.checksum));

  return {
    headline: "COLLECTION ENCORE RECAP",
    subline: "The GUI end-cap for a completed scan: queue, scan, checkpoint, and relay marks replay once without creating ledger rows.",
    terminalLines: [
      "+------------------------------------------------------+",
      liveFrameLine("VTK://COLLECTION-ENCORE//GUI-RECAP//NO-EXTRA-ROWS"),
      liveFrameLine("queue -> scan -> checkpoint -> recap is visible"),
      liveFrameLine("HF/CX/LAN/C0 marks replay after collection"),
      liveFrameLine("recap is visual only; no ledger rows are created"),
      liveFrameLine("trust/local rails remain labelled NOT USAGE"),
      liveFrameLine("Vibers Unite // c0vibe.app"),
      "+------------------------------------------------------+",
    ],
    totals: {
      rails: rails.length,
      usage: rails.filter((rail) => rail.impact === "usage").length,
      notUsage: rails.filter((rail) => rail.railLabel === "NOT USAGE").length,
      publish: rails.filter((rail) => rail.impact === "publish").length,
      replayFrames: rails.reduce((sum, rail) => sum + rail.frames.length, 0),
      checksums: checksums.size,
    },
    rails,
  };
}

export function buildCollectionReplayDeck(run: CollectionSurpriseRun = buildCollectionSurpriseRun()): CollectionReplayDeck {
  const lanes = run.encores.map<CollectionReplayLane>((encore) => ({
    id: encore.id,
    stage: encore.stage,
    gate: encore.gate,
    label: encore.label,
    command: encore.command,
    impact: encore.impact,
    status: encore.status,
    meter: encore.meter,
    delayMs: encore.delayMs,
    marks: encore.marks,
    frames: encore.frames,
    terminalLines: liveTurnLines(encore),
    caption: encore.caption,
    guardrail: encore.guardrail,
  }));

  return {
    headline: "LIVE SCAN REPLAY RECORDER",
    subline: "The GUI replays the same live-turn cadence as the terminal: HF prism, Codex cube, local sonar, then C0VIBE review.",
    terminalLines: [
      "+------------------------------------------------------+",
      "| VTK://SCAN-REPLAY//GUI-LIVE-TURN//LOCAL-FIRST        |",
      "|------------------------------------------------------|",
      "| replay source: sync queue, scan beat, checkpoint     |",
      "| every frame is visual feedback, never proof by itself|",
      "| trust and local-only rails remain labelled NOT USAGE |",
      "| Vibers Unite // c0vibe.app                           |",
      "+------------------------------------------------------+",
    ],
    lanes,
  };
}
