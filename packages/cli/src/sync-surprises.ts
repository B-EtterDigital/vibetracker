import Globe from "ascii-globe";
import spinners from "cli-spinners";
import DrawilleCanvas from "drawille";
import { providerBrand } from "./provider-brand.ts";

type StreamLike = {
  isTTY?: boolean;
  write: (chunk: string) => void;
};

interface SyncSurprise {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  guardrail: string;
  triggers: string[];
  frames: string[];
  logo: string[][];
  motion: string[][];
}

type SurprisePhase = "queue" | "scan" | "checkpoint";

interface SignatureReveal {
  title: string;
  frames: string[][];
  labels: string[];
  guardrail: string;
}

export interface SyncSurpriseOptions {
  env?: NodeJS.ProcessEnv;
  isTTY?: boolean;
  json?: boolean;
  plain?: boolean;
}

export interface CollectionCheckpoint {
  providerId: string;
  label?: string;
  status: "new" | "up_to_date" | "error";
  received: number;
  accepted: number;
  fresh: number;
  duplicate: number;
  usd?: number;
  sourceMix?: { source: string; count: number }[];
  error?: string;
  hint?: string;
}

export interface ProviderScanBeat {
  providerId: string;
  label?: string;
  index: number;
  total: number;
}

export interface CollectionEncoreRecapInput {
  providerIds?: string[];
  checkpoints: CollectionCheckpoint[];
  label?: string;
}

export interface CollectionCascadeInput {
  providerIds: string[];
  label?: string;
}

type SurpriseFlightPhase = "queue" | "scan" | "checkpoint" | "recap";

export interface SurpriseFlightRecorderInput {
  providerIds: string[];
  label?: string;
}

export interface SurpriseFlightRecorderEvent {
  sequence: number;
  phase: SurpriseFlightPhase;
  providerId: string;
  mark: string;
  rail: string;
  title: string;
  cue: string;
  frame: string;
  guardrail: string;
  visualOnly: true;
  usageWrites: false;
  promptExport: false;
  outputExport: false;
  secretRead: false;
}

const defaultDirectorProviders = [
  "higgsfield",
  "codex-cli",
  "ollama",
  "replicate",
  "qwen",
  "c0vibe",
];

const globeFallback = [
  "   ..::::..   ",
  " .::://\\\\::. ",
  ".::: VTRK :::.",
  " '::\\\\//::' ",
  "   ''::::''   ",
];

const brailleFallback = [
  "⠁ ⠂ ⠄ ⡀ ⢀",
  " ⠈ ⠐ ⠠ ⢠ ",
  "⡁ ⢂ ⠤ ⠒ ⠉",
];

const surprises: SyncSurprise[] = [
  {
    id: "higgsfield-turn",
    badge: "HF MCP",
    title: "HIGGSFIELD TURN",
    subtitle: "authenticated Higgsfield usage prism folds into the local ledger",
    guardrail: "usage source · consented local adapter · no upload yet",
    triggers: ["higgsfield", "higgsfield-mcp"],
    frames: ["HF ◜", "HF ◝", "HF ◞", "HF ◟"],
    logo: [
      [" .-HF-.  ", "/  |  \\ ", "| prism |"],
      ["  .HF.   ", " < | >  ", " prism  "],
      ["  .-HF-. ", " /  | / ", "| prism |"],
      ["   HF    ", " --|--  ", " fold   "],
    ],
    motion: [
      ["   /\\   ", " --HF-- ", "   \\/   "],
      ["  /||\\  ", "  <HF>  ", "  \\||/  "],
      ["  <==>  ", " ==HF== ", "  <==>  "],
      ["  \\||/  ", "  <HF>  ", "  /||\\  "],
    ],
  },
  {
    id: "codex-trace",
    badge: "CX CLI",
    title: "CODEX TRACE",
    subtitle: "coding-agent evidence stays labelled as trust signal, never spend",
    guardrail: "trust signal · NOT USAGE · never spend",
    triggers: ["codex", "codex-cli", "claude-code", "antigravity", "augment", "roo-code", "gemini-cli", "github", "github-cli", "gh"],
    frames: ["CX /", "CX -", "CX \\", "CX |"],
    logo: [
      [" +----+  ", "/ CX /| ", "+----+ |"],
      [" +----+  ", "| CX |  ", "| run|  "],
      [" +----+  ", "|\\ CX \\", "| +----+"],
      ["  /\\    ", " <CX>   ", "  \\/    "],
    ],
    motion: [
      ["  /CX\\  ", " {run}  ", "  \\__/  "],
      ["  -CX-  ", "<diff>  ", "  /__\\  "],
      ["  \\CX/  ", " {git}  ", "  /  \\  "],
      ["  |CX|  ", "<ship> ", "  \\__/  "],
    ],
  },
  {
    id: "local-sonar",
    badge: "LOCAL",
    title: "LOCAL MODEL SONAR",
    subtitle: "Ollama, LM Studio, ComfyUI, llama.cpp, Jan, GPT4All, vLLM, and local proxies stay on-machine",
    guardrail: "local-first · LAN/loopback check · no cloud upload",
    triggers: ["ollama", "lmstudio", "comfyui", "vllm", "localai"],
    frames: ["OL ░", "LM ▒", "CU ▓", "VL █"],
    logo: [
      [" . OL .  ", "( ping ) ", " '---'   "],
      [" ((LM))  ", " models  ", "  /\\ /\\  "],
      [" [ CU ]  ", " graph   ", " == ==   "],
      [" < VL >  ", " local   ", " ####    "],
    ],
    motion: [
      [" . OL . ", "  ping  ", " .. ..  "],
      [" ((LM)) ", " models ", "  <> <> "],
      [" [ CU ] ", " graph  ", "  ////  "],
      [" < VL > ", " local  ", "  ####  "],
    ],
  },
  {
    id: "creator-sweep",
    badge: "MEDIA",
    title: "CREATOR STUDIO SWEEP",
    subtitle: "Replicate, fal, Runway, Luma, ElevenLabs, Suno, and Udio get creator-grade scan feedback",
    guardrail: "provider-branded · source-labelled · estimates marked",
    triggers: ["replicate", "falai", "runway", "luma", "elevenlabs", "suno", "udio", "midjourney"],
    frames: ["RP ◈", "FA ⬡", "RW ◆", "EL ✦"],
    logo: [
      [" [RP]   ", " pixels ", "  <>    "],
      [" [FA]   ", " frames ", "  []    "],
      [" [RW]   ", " motion ", "  >>    "],
      [" [11]   ", " voice  ", "  ))    "],
    ],
    motion: [
      [" [RP]   ", " render ", "  ◈ ◈  "],
      [" [FA]   ", " frames ", "  ⬡ ⬡  "],
      [" [RW]   ", " video  ", "  ◆ ◆  "],
      [" [EL]   ", " audio  ", "  ✦ ✦  "],
    ],
  },
  {
    id: "c0vibe-relay",
    badge: "UNITE",
    title: "C0VIBE RELAY",
    subtitle: "Vibers Unite · c0vibe.app · local-first usage totals before sharing",
    guardrail: "review before sharing · trust stays separate",
    triggers: [],
    frames: ["C0 ◢", "VIBE ◣", "APP ◤", "UNITE ◥"],
    logo: [
      [" C0\\ /  ", " unite  ", " local  "],
      [" C0-|-  ", " proof  ", " trust  "],
      [" C0/ \\  ", " share  ", " c0app  "],
      [" VIBE   ", " unite  ", " review "],
    ],
    motion: [
      [" C0\\ /  ", " local  ", " proof  "],
      [" C0-|-  ", " totals ", " trust  "],
      [" C0/ \\  ", " c0app  ", " unite  "],
      [" C0-|-  ", " share? ", " review "],
    ],
  },
];

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function providerBeatPreset(providerId: string, label?: string): {
  title: string;
  mode: string;
  note: string;
  guardrail: string;
  frames: string[][];
} {
  const id = providerId.toLowerCase();
  if (id === "higgsfield" || id === "higgsfield-mcp") {
    return {
      title: "HIGGSFIELD MCP PRISM",
      mode: "creator credits / image video audio 3d",
      note: "surprise: the Higgsfield ASCII logo turns before transactions fold into the ledger",
      guardrail: "provider usage only after consented MCP/local config",
      frames: [
        ["   /\\   ", " --HF-- ", "   \\/   "],
        ["  /||\\  ", "  <HF>  ", "  \\||/  "],
        ["  <==>  ", " ==HF== ", "  <==>  "],
        ["  \\||/  ", "  <HF>  ", "  /||\\  "],
      ],
    };
  }
  if (["codex", "codex-cli", "claude-code", "github", "github-cli", "gh", "antigravity", "augment", "roo-code", "gemini-cli"].includes(id)) {
    return {
      title: "CODEX BUILDER TRACE",
      mode: "coding agent / git / local logs",
      note: "surprise: the Codex ASCII logo turns on the trust side rail, never fake spend",
      guardrail: "trust/build context stays labelled when it is not provider usage",
      frames: [
        ["  /CX\\  ", " {run}  ", "  \\__/  "],
        ["  -CX-  ", "<diff>  ", "  /__\\  "],
        ["  \\CX/  ", " {git}  ", "  /  \\  "],
        ["  |CX|  ", "<ship> ", "  \\__/  "],
      ],
    };
  }
  if (["ollama", "lmstudio", "comfyui", "vllm", "localai", "jan", "llama-cpp", "automatic1111", "forge", "invokeai"].includes(id)) {
    return {
      title: "LOCAL LAB SONAR",
      mode: "loopback / LAN / local workflow",
      note: "surprise: the local scan pings ports and keeps the machine private",
      guardrail: "local-first source; upload only after explicit review",
      frames: [
        [" . OL . ", "  ping  ", " .. ..  "],
        [" ((LM)) ", " models ", "  <> <> "],
        [" [ CU ] ", " graph  ", "  ////  "],
        [" < VL > ", " local  ", "  ####  "],
      ],
    };
  }
  if (["replicate", "falai", "runway", "luma", "elevenlabs", "suno", "udio", "kling"].includes(id)) {
    return {
      title: "CREATOR RUN METER",
      mode: "image / video / voice / music",
      note: "surprise: creator runs light the meter without storing outputs",
      guardrail: "spend and media proof stay source-labelled",
      frames: [
        [" [RP]   ", " render ", "  <> <> "],
        [" [FA]   ", " frames ", "  [] [] "],
        [" [RW]   ", " motion ", "  >> >> "],
        [" [11]   ", " voice  ", "  )) )) "],
      ],
    };
  }
  if (["qwen", "doubao", "kimi", "deepseek", "mistral", "aleph-alpha", "lighton", "perplexity"].includes(id)) {
    return {
      title: "GLOBAL PROVIDER PASS",
      mode: "regional adapter / proxy / manual fallback",
      note: "surprise: regional providers get their own labelled rail",
      guardrail: "endpoint proof and confidence stay explicit",
      frames: [
        [" [CN]   ", " qwen   ", " dash   "],
        [" [EU]   ", " mistral", " usage  "],
        [" [AA]   ", " lighton", " proof  "],
        [" [PX]   ", " balance", " check  "],
      ],
    };
  }
  const brand = providerBrand(providerId, label);
  return {
    title: `${brand.label.toUpperCase()} SCAN BEAT`,
    mode: "provider adapter / source labelled",
    note: "surprise: each provider gets a branded local proof beat",
    guardrail: "validated records only; no silent source promotion",
    frames: [
      [` [${brand.mark}] `.padEnd(8), " wake   ", "  .. .. "],
      [` <${brand.mark}> `.padEnd(8), " auth   ", "  <> <> "],
      [` /${brand.mark}\\ `.padEnd(8), " fetch  ", "  ////  "],
      [` \\${brand.mark}/ `.padEnd(8), " verify ", "  ####  "],
    ],
  };
}

function smallGlobe(): string[] {
  try {
    const out = new Globe({ size: 0.28, land: "#", water: ".", background: " ", margin: 0 }).render();
    const lines = String(out).split("\n").filter((line) => line.trim()).slice(0, 5);
    return lines.length ? lines : globeFallback;
  } catch {
    return globeFallback;
  }
}

function signalSeed(input: string): number {
  return Array.from(input).reduce((hash, char) => ((hash * 33) ^ char.charCodeAt(0)) >>> 0, 5381);
}

function brailleSignalField(input: string, width = 26, height = 12): string[] {
  try {
    const canvas = new DrawilleCanvas(width, height);
    let seed = signalSeed(input);
    const next = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed;
    };
    for (let i = 0; i < 48; i += 1) {
      const x = next() % width;
      const y = next() % height;
      canvas.set(x, y);
      if (i % 5 === 0) canvas.set(Math.min(width - 1, x + 1), y);
      if (i % 7 === 0) canvas.set(x, Math.min(height - 1, y + 1));
    }
    const rows = canvas.frame().split("\n").filter((line) => line.trim()).slice(0, 4);
    return rows.length ? rows : brailleFallback;
  } catch {
    return brailleFallback;
  }
}

function spinnerFrames(): string[] {
  const frames = spinners.dots?.frames ?? ["|", "/", "-", "\\"];
  return frames.slice(0, 4);
}

function fit(text: string, width: number): string {
  return text.length > width ? `${text.slice(0, Math.max(0, width - 1))}…` : text.padEnd(width);
}

function frameLine(text: string): string {
  return `| ${fit(text, 52)} |`;
}

function countBar(count: number, max: number, width = 12): string {
  const filled = max > 0 ? Math.max(1, Math.min(width, Math.round((count / max) * width))) : 0;
  return `${"█".repeat(filled)}${"░".repeat(width - filled)}`;
}

function controlTapeBar(count: number, max: number, width = 8): string {
  const safeCount = Math.max(0, count);
  const safeMax = Math.max(1, max);
  const filled = safeCount > 0 ? Math.max(1, Math.min(width, Math.round((safeCount / safeMax) * width))) : 0;
  return `${"█".repeat(filled)}${"░".repeat(width - filled)}`;
}

function railLabel(providerId: string, status?: CollectionCheckpoint["status"]): string {
  const id = providerId.toLowerCase();
  if (status === "error") return "HOLD";
  if (["codex", "codex-cli", "claude-code", "github", "github-cli", "gh", "antigravity", "augment", "roo-code", "gemini-cli"].includes(id)) {
    return "NOT USAGE";
  }
  if (["ollama", "lmstudio", "comfyui", "vllm", "localai", "jan", "llama-cpp", "automatic1111", "forge", "invokeai"].includes(id)) {
    return "LOCAL";
  }
  if (id === "c0vibe") return "PUBLISH";
  return "USAGE";
}

function checkpointControlTape(input: CollectionCheckpoint): string[] {
  const brand = providerBrand(input.providerId, input.label);
  const rail = railLabel(input.providerId, input.status);
  const received = Math.max(0, input.received);
  const accepted = Math.max(0, input.accepted);
  const duplicate = Math.max(0, input.duplicate);
  const fresh = Math.max(0, input.fresh);
  const rejected = Math.max(0, received - accepted);
  const status = input.status === "error" ? "HOLD" : input.status === "new" ? "LOCK" : "CLEAR";
  const validateTotal = Math.max(1, received);
  const freshTotal = Math.max(1, accepted);
  const stages = [
    {
      id: "scan",
      value: `${brand.mark} ${rail}`,
      bar: controlTapeBar(1, 1),
      note: "branded",
    },
    {
      id: "fetch",
      value: `seen ${received}`,
      bar: controlTapeBar(received, Math.max(1, received)),
      note: "local",
    },
    {
      id: "validate",
      value: `accepted ${accepted}/${received}`,
      bar: controlTapeBar(accepted, validateTotal),
      note: `rejected ${rejected}`,
    },
    {
      id: "seal",
      value: input.status === "error" ? "hold" : `fresh ${fresh}`,
      bar: controlTapeBar(fresh, freshTotal),
      note: `dup ${duplicate}`,
    },
  ];
  return [
    frameLine("control tape: scan -> fetch -> validate -> seal"),
    frameLine(`rail ${rail} · ${status} · visual-only, no totals boost`),
    ...stages.map((stage) =>
      frameLine(`${stage.id.padEnd(8)} ${fit(stage.value, 14)} ${stage.bar} ${stage.note}`),
    ),
    frameLine("no prompts, outputs, secrets, or unvalidated rows"),
    frameLine("surprise tape is feedback; accepted rows decide"),
  ];
}

function motionRows(surprise: SyncSurprise): string[] {
  return frameGridRows(surprise.motion, 8);
}

function logoRows(surprise: SyncSurprise): string[] {
  return frameGridRows(surprise.logo, 10);
}

function frameGridRows(frames: string[][], frameWidth: number): string[] {
  const frameHeight = Math.max(...frames.map((frame) => frame.length));
  return Array.from({ length: frameHeight }, (_, row) =>
    frames.map((frame) => (frame[row] ?? "").padEnd(frameWidth)).join("  "),
  );
}

function compactFrame(frame: string[]): string {
  return frame.map((line) => line.trim()).filter(Boolean).join(" / ");
}

function escapeHtml(value: unknown): string {
  return String(value).replace(/[&<>"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  })[char]!);
}

function signatureRevealPreset(providerId: string, label?: string): SignatureReveal {
  const id = providerId.toLowerCase();
  if (id === "higgsfield" || id === "higgsfield-mcp") {
    return {
      title: "HIGGSFIELD LOGO TURN",
      labels: ["prism wakes", "mark turns", "credit spark", "ledger seal"],
      guardrail: "Higgsfield visual only; accepted rows decide usage.",
      frames: [
        ["   /\\   ", "  .HF.  ", "   \\/   "],
        ["  /||\\  ", " < HF > ", "  \\||/  "],
        [" --==-- ", " ==HF== ", " --==-- "],
        ["  \\||/  ", " [HF] ✓ ", "  /||\\  "],
      ],
    };
  }
  if (["codex", "codex-cli", "claude-code", "github", "github-cli", "gh", "antigravity", "augment", "roo-code", "gemini-cli"].includes(id)) {
    return {
      title: "CODEX TRUST CUBE",
      labels: ["trace wakes", "cube turns", "diff sparks", "trust seal"],
      guardrail: "Builder trust only; not provider spend.",
      frames: [
        [" +----+ ", "/ CX /| ", "+----+| "],
        ["  /CX\\  ", " <run> ", "  \\__/  "],
        ["  -CX-  ", "<diff> ", "  /__\\  "],
        ["  |CX|  ", " NOT $ ", "  \\__/  "],
      ],
    };
  }
  if (["ollama", "lmstudio", "comfyui", "vllm", "localai", "jan", "llama-cpp", "automatic1111", "forge", "invokeai"].includes(id)) {
    return {
      title: "LOCAL LAB RADAR",
      labels: ["port wakes", "loop turns", "model sparks", "local seal"],
      guardrail: "Local AI stays local until review.",
      frames: [
        ["  127   ", " .0.0.1 ", "  ping  "],
        [" ((LM)) ", " <LAN>  ", "  scan  "],
        [" [CU]   ", " graph  ", "  ////  "],
        [" <OK>   ", " LOCAL  ", "  ####  "],
      ],
    };
  }
  if (["replicate", "falai", "runway", "luma", "elevenlabs", "suno", "udio", "kling", "midjourney"].includes(id)) {
    return {
      title: "CREATOR STUDIO FLASH",
      labels: ["canvas wakes", "render turns", "media sparks", "source seal"],
      guardrail: "Creator usage is labelled by source; outputs are not stored.",
      frames: [
        [" [IMG]  ", " pixels ", "  <> <> "],
        [" [VID]  ", " frames ", "  >> >> "],
        [" [AUD]  ", " voice  ", "  )) )) "],
        [" [SRC]  ", " label  ", "  ####  "],
      ],
    };
  }
  if (["qwen", "doubao", "kimi", "deepseek", "mistral", "aleph-alpha", "lighton", "perplexity"].includes(id)) {
    return {
      title: "GLOBAL PROVIDER GLYPH",
      labels: ["region wakes", "glyph turns", "endpoint sparks", "proof seal"],
      guardrail: "Regional providers keep endpoint proof and confidence explicit.",
      frames: [
        [" [CN]  ", " qwen  ", "  dash "],
        [" [EU]  ", " mix   ", "  api  "],
        [" [AA]  ", " proof ", "  key  "],
        [" [OK]  ", " label ", "  seal "],
      ],
    };
  }
  const brand = providerBrand(providerId, label);
  return {
    title: `${brand.label.toUpperCase()} SIGNATURE REVEAL`,
    labels: ["source wakes", "mark turns", "fetch sparks", "proof seal"],
    guardrail: "Visual feedback never promotes unvalidated records.",
    frames: [
      [` [${brand.mark}] `.padEnd(8), " wake   ", "  .. .. "],
      [` <${brand.mark}> `.padEnd(8), " turn   ", "  <> <> "],
      [` /${brand.mark}\\ `.padEnd(8), " fetch  ", "  ////  "],
      [` \\${brand.mark}/ `.padEnd(8), " proof  ", "  ####  "],
    ],
  };
}

function phaseLabel(phase: SurprisePhase): string {
  if (phase === "queue") return "01/03 QUEUE";
  if (phase === "scan") return "02/03 SCAN";
  return "03/03 CHECKPOINT";
}

function revealProviderId(surprise: SyncSurprise): string {
  if (surprise.id === "c0vibe-relay") return "c0vibe";
  return surprise.triggers[0] ?? surprise.id;
}

function surpriseRail(surprise: SyncSurprise): string {
  const providerId = revealProviderId(surprise);
  const brand = providerBrand(providerId);
  return `[${brand.mark}] ${surprise.badge} ${railLabel(providerId).padEnd(9)} ${surprise.title}`;
}

function ignitionFrames(providerIds: string[]): string[][] {
  const planned = planSyncSurprises(providerIds);
  const marks = (planned.length ? planned : [surprises[surprises.length - 1]])
    .filter((surprise): surprise is SyncSurprise => Boolean(surprise))
    .map((surprise) => providerBrand(revealProviderId(surprise)).mark)
    .slice(0, 4);
  const line = marks.length ? marks.join(" -> ") : "VT -> C0";
  return [
    [" boot   ", ` ${line}`.slice(0, 28), " rails awake "],
    [" scan   ", " USAGE / NOT USAGE ", " local / publish "],
    [" seal   ", " promptExport=0 ", " outputExport=0 "],
    [" relay  ", " hiddenUpload=0 ", " Vibers Unite "],
  ];
}

export function renderSyncIgnitionBanner(providerIds: string[]): string {
  const planned = planSyncSurprises(providerIds);
  const marks = planned.map((surprise) => providerBrand(revealProviderId(surprise)).mark).join(" ");
  const railCounts = planned.reduce((counts, surprise) => {
    const rail = railLabel(revealProviderId(surprise));
    counts.set(rail, (counts.get(rail) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());
  const railLine = ["USAGE", "NOT USAGE", "LOCAL", "PUBLISH"]
    .map((rail) => `${rail}:${railCounts.get(rail) ?? 0}`)
    .join(" ");
  return [
    "+------------------------------------------------------+",
    frameLine("VTK://SCAN-IGNITION//TERMINAL//VIBERS-UNITE"),
    "|------------------------------------------------------|",
    frameLine("first impression: live scanner, then GUI handoff"),
    frameLine("wake: terminal -> adapters -> ledger -> C0"),
    frameLine(`provider marks ${marks || "waiting for connected sources"}`),
    frameLine(`rails ${railLine}`),
    frameLine("impact labels visible before collection starts"),
    frameLine("USAGE ONLY cells light from accepted records"),
    frameLine("trust side rails stay NOT USAGE"),
    frameLine("promptExport=0 outputExport=0 secretValuesRecorded=0"),
    frameLine("hiddenUpload=0; publish waits for review"),
    frameLine("animation is visual-only; records decide totals"),
    frameLine("Vibers Unite // c0vibe.app"),
    "+------------------------------------------------------+",
  ].join("\n");
}

export function renderSignatureReveal(providerId: string, label?: string, phase: SurprisePhase = "scan"): string[] {
  const brand = providerBrand(providerId, label);
  const reveal = signatureRevealPreset(providerId, label);
  return [
    frameLine(`VTK://SIGNATURE-REVEAL//${phaseLabel(phase)}//${brand.mark}`),
    frameLine(`${reveal.title} · ${brand.label}`),
    frameLine("surprise stack: blink -> turn -> sparkle -> unite"),
    ...reveal.frames.slice(0, 4).map((frame, index) =>
      frameLine(`surprise ${index + 1}/4 ${reveal.labels[index] ?? "beat"} ${compactFrame(frame)}`),
    ),
    frameLine("hidden motto flash: Vibers Unite · C0VIBE.APP"),
    frameLine(reveal.guardrail),
  ];
}

function microRevealRows(frames: string[][], labels = ["wake", "turn", "spark", "seal"]): string[] {
  return [
    frameLine("micro-surprises: wake -> turn -> spark -> seal"),
    ...frames.slice(0, 4).map((frame, index) =>
      frameLine(`micro ${index + 1}/4 ${labels[index] ?? "beat"} ${compactFrame(frame)}`),
    ),
  ];
}

function liveTurntableRows(title: string, frame: string[], index: number, total: number): string[] {
  const labels = ["wake", "turn", "spark", "seal"];
  return [
    "+------------------------------------------------------+",
    frameLine(`LIVE TURN ${String(index + 1).padStart(2, "0")}/${String(total).padStart(2, "0")} ${title}`),
    "|------------------------------------------------------|",
    frameLine(`surprise flash ${index + 1}/${total}: ${labels[index] ?? "beat"}`),
    ...frame.slice(0, 4).map((line) => frameLine(line)),
    frameLine("Vibers Unite // c0vibe.app"),
    frameLine("terminal charm // visual feedback only"),
    "+------------------------------------------------------+",
  ];
}

async function writeLiveTurntable(
  title: string,
  frames: string[][],
  stream: StreamLike,
  delayMs?: number,
): Promise<void> {
  const reel = frames.slice(0, 4);
  if (!reel.length) return;

  let lastHeight = 0;
  stream.write("\n");
  for (let index = 0; index < reel.length; index += 1) {
    const rows = liveTurntableRows(title, reel[index], index, reel.length);
    if (lastHeight) stream.write(`\x1b[${lastHeight}A`);
    for (const row of rows) stream.write(`  \x1b[2K${row}\n`);
    lastHeight = rows.length;
    await sleep(delayMs ?? 18);
  }
}

function hit(providerIds: Set<string>, surprise: SyncSurprise): boolean {
  return surprise.triggers.length === 0 || surprise.triggers.some((id) => providerIds.has(id));
}

function checkpointEncoreRows(input: CollectionCheckpoint): string[] {
  const preset = providerBeatPreset(input.providerId, input.label);
  const frames = frameGridRows(preset.frames.slice(0, 4), 8).slice(0, 3);
  const status = input.status === "error" ? "hold" : input.status === "new" ? "lock" : "clear";
  return [
    frameLine(`surprise encore ${status}: ${preset.title.toLowerCase()}`),
    frameLine("surprise 3/3: checkpoint reveal after validation"),
    ...frames.map((line) => frameLine(`turntable ${line.slice(0, 42)}`)),
    ...microRevealRows(preset.frames, ["receipt", "replay", "proof", "seal"]).slice(0, 3),
    ...renderSignatureReveal(input.providerId, input.label, "checkpoint"),
    frameLine("reveal cadence wake -> fetch -> validate -> relay"),
    frameLine("Vibers Unite // c0vibe.app"),
    frameLine("art is feedback; ledger rows decide truth"),
  ];
}

function recapRows(input: CollectionEncoreRecapInput): CollectionCheckpoint[] {
  if (input.checkpoints.length) return input.checkpoints;
  return (input.providerIds ?? []).map((providerId) => ({
    providerId,
    label: providerBrand(providerId).label,
    status: "up_to_date",
    received: 0,
    accepted: 0,
    fresh: 0,
    duplicate: 0,
    sourceMix: [],
    hint: "planned provider mark; no records collected in this run",
  }));
}

function recapStatus(row: CollectionCheckpoint): string {
  if (row.status === "error") return "HOLD";
  if (row.fresh > 0) return "LOCK";
  return "CLEAR";
}

function recapProviderLine(row: CollectionCheckpoint, maxFresh: number): string {
  const brand = providerBrand(row.providerId, row.label);
  const usd = row.usd != null ? ` $${row.usd.toFixed(2)}` : "";
  return frameLine(
    `[${brand.mark}] ${recapStatus(row)} ${railLabel(row.providerId, row.status)} ` +
    `fresh ${row.fresh}/${row.accepted}${usd} ${countBar(row.fresh, maxFresh, 8)}`,
  );
}

function recapReplayLines(rows: CollectionCheckpoint[]): string[] {
  const providerRows = rows.length ? rows : [{ providerId: "c0vibe", status: "up_to_date", received: 0, accepted: 0, fresh: 0, duplicate: 0 } as CollectionCheckpoint];
  return providerRows.slice(0, 4).map((row, index) => {
    const brand = providerBrand(row.providerId, row.label);
    const preset = providerBeatPreset(row.providerId, row.label);
    const frame = preset.frames[index % preset.frames.length] ?? preset.frames[0] ?? [brand.mark];
    return frameLine(`recap ${index + 1}/4 ${brand.mark} ${compactFrame(frame).slice(0, 34)}`);
  });
}

function cascadeBeatLines(providerIds: string[]): string[] {
  const planned = planSyncSurprises(providerIds);
  const beats = planned.flatMap((surprise, surpriseIndex) =>
    surprise.motion.slice(0, 4).map((frame, frameIndex) => {
      const providerId = revealProviderId(surprise);
      const rail = railLabel(providerId);
      const brand = providerBrand(providerId, surprise.title);
      const sequence = surpriseIndex * 4 + frameIndex + 1;
      const reveal = ["wake", "turn", "spark", "seal"][frameIndex] ?? "beat";
      return frameLine(
        `cascade ${String(sequence).padStart(2, "0")}/${String(planned.length * 4).padStart(2, "0")} ` +
        `${brand.mark} ${surprise.badge} ${rail.padEnd(9)} ${reveal} ${compactFrame(frame).slice(0, 18)}`,
      );
    }),
  );
  return beats.length ? beats : [frameLine("cascade waiting for provider targets")];
}

export function renderCollectionCascade(input: CollectionCascadeInput): string {
  const planned = planSyncSurprises(input.providerIds);
  const totalBeats = planned.length * 4;
  const notUsage = planned.filter((surprise) => ["NOT USAGE", "LOCAL"].includes(railLabel(revealProviderId(surprise)))).length * 4;
  const publish = planned.filter((surprise) => railLabel(revealProviderId(surprise)) === "PUBLISH").length * 4;
  return [
    "+------------------------------------------------------+",
    frameLine(`VTK://COLLECTION-CASCADE//SCAN-COLLECT//${input.label ?? "SYNC"}`),
    "|------------------------------------------------------|",
    frameLine("surprise the user several times during collection"),
    frameLine("HF logo turn -> Codex cube -> local sonar -> C0VIBE"),
    frameLine(`beats ${totalBeats} · panels ${planned.length} · not-usage/local ${notUsage} · publish ${publish}`),
    frameLine("each beat has rail label, provider mark, and guardrail"),
    frameLine("NO PROMPTS / NO OUTPUTS / NO SECRET VALUES RECORDED"),
    frameLine("visual feedback only; accepted rows decide truth"),
    "| cascade beats                                        |",
    ...cascadeBeatLines(input.providerIds),
    frameLine("Vibers Unite // c0vibe.app"),
    frameLine("terminal charm // local-first proof before upload"),
    "+------------------------------------------------------+",
  ].join("\n");
}

export function renderCollectionEncoreRecap(input: CollectionEncoreRecapInput): string {
  const rows = recapRows(input);
  const providerIds = rows.map((row) => row.providerId);
  const fresh = rows.reduce((sum, row) => sum + row.fresh, 0);
  const accepted = rows.reduce((sum, row) => sum + row.accepted, 0);
  const duplicate = rows.reduce((sum, row) => sum + row.duplicate, 0);
  const errors = rows.filter((row) => row.status === "error").length;
  const notUsage = rows.filter((row) => ["NOT USAGE", "LOCAL"].includes(railLabel(row.providerId, row.status))).length;
  const maxFresh = Math.max(1, ...rows.map((row) => row.fresh));
  const planned = planSyncSurprises(providerIds);
  return [
    "+------------------------------------------------------+",
    frameLine(`VTK://COLLECTION-ENCORE//RECAP//${input.label ?? "SYNC"}`),
    "|------------------------------------------------------|",
    frameLine(`providers ${rows.length} · accepted ${accepted} · fresh ${fresh} · duplicate ${duplicate}`),
    frameLine(`holds ${errors} · not-usage/local rails ${notUsage}`),
    frameLine("surprises fired: queue -> scan -> check -> recap"),
    frameLine("Higgsfield/Codex/local marks replay without writes"),
    "| provider recap                                       |",
    ...rows.slice(0, 5).map((row) => recapProviderLine(row, maxFresh)),
    "| encore replay                                        |",
    ...recapReplayLines(rows),
    frameLine(`planned panels ${planned.map((surprise) => surprise.badge).join(" + ") || "none"}`),
    frameLine("final relay waits for upload --dry-run review"),
    frameLine("visual feedback only; no extra ledger rows"),
    frameLine("Vibers Unite // c0vibe.app"),
    "+------------------------------------------------------+",
  ].join("\n");
}

const flightPhases: Array<{
  phase: SurpriseFlightPhase;
  cue: string;
}> = [
  { phase: "queue", cue: "mark armed before collection starts" },
  { phase: "scan", cue: "ASCII turntable runs while fetch is in flight" },
  { phase: "checkpoint", cue: "seal appears only after validation" },
  { phase: "recap", cue: "replay closes without extra ledger rows" },
];

function flightFrame(surprise: SyncSurprise, index: number): string {
  const frame = surprise.motion[index % surprise.motion.length] ?? surprise.motion[0] ?? [surprise.badge];
  return compactFrame(frame).slice(0, 34);
}

function flightRecorderId(events: SurpriseFlightRecorderEvent[]): string {
  const body = events
    .map((event) => `${event.sequence}:${event.phase}:${event.mark}:${event.rail}:${event.title}`)
    .join("|");
  return signalSeed(body || "vibetracker-flight-recorder").toString(16).padStart(8, "0");
}

function flightRailSummary(events: SurpriseFlightRecorderEvent[]): string {
  const counts = new Map<string, number>();
  for (const event of events) counts.set(event.rail, (counts.get(event.rail) ?? 0) + 1);
  return Array.from(counts.entries())
    .map(([rail, count]) => `${rail} ${count}`)
    .join(" / ") || "none";
}

function flightRailCount(events: SurpriseFlightRecorderEvent[], rail: string): number {
  return events.filter((event) => event.rail === rail).length;
}

export function buildSurpriseFlightRecorder(input: SurpriseFlightRecorderInput): SurpriseFlightRecorderEvent[] {
  let sequence = 0;
  return planSyncSurprises(input.providerIds).flatMap((surprise) => {
    const providerId = revealProviderId(surprise);
    const brand = providerBrand(providerId, surprise.title);
    const rail = railLabel(providerId);
    return flightPhases.map((phase, index) => ({
      sequence: sequence += 1,
      phase: phase.phase,
      providerId,
      mark: brand.mark,
      rail,
      title: surprise.title,
      cue: phase.cue,
      frame: flightFrame(surprise, index),
      guardrail: surprise.guardrail,
      visualOnly: true,
      usageWrites: false,
      promptExport: false,
      outputExport: false,
      secretRead: false,
    }));
  });
}

export function renderSurpriseFlightRecorder(input: SurpriseFlightRecorderInput): string {
  const events = buildSurpriseFlightRecorder(input);
  const id = flightRecorderId(events);
  const usage = flightRailCount(events, "USAGE");
  const trust = flightRailCount(events, "NOT USAGE");
  const local = flightRailCount(events, "LOCAL");
  const publish = flightRailCount(events, "PUBLISH");
  const rows = events.length
    ? events.flatMap((event) => [
        frameLine(
          `evt ${String(event.sequence).padStart(2, "0")} ${event.phase.toUpperCase().padEnd(10)} ` +
          `${event.mark} ${event.rail.padEnd(9)} ${event.title.slice(0, 20)}`,
        ),
        frameLine(`    ${event.cue.slice(0, 31)} :: ${event.frame}`),
      ])
    : [frameLine("no surprise events armed; connect providers first")];
  return [
    "+------------------------------------------------------+",
    frameLine(`VTK://SURPRISE-FLIGHT-RECORDER//${input.label ?? "SAFE-PREVIEW"}`),
    "|------------------------------------------------------|",
    frameLine(`recorder ${id} · events ${events.length}`),
    frameLine(`rail counts USAGE ${usage} · NOT USAGE ${trust}`),
    frameLine(`rail counts LOCAL ${local} · PUBLISH ${publish}`),
    frameLine("captures show cues only; usage records stay separate"),
    frameLine("event log only; no usage writes"),
    frameLine("NO PROVIDER CALLS / NO WRITES"),
    frameLine("NO PROMPTS / NO OUTPUTS"),
    frameLine("NO SECRET VALUES / NO RANK INFLATION"),
    frameLine("NO HIDDEN UPLOAD"),
    frameLine("HF logo turn -> Codex cube -> local sonar -> C0VIBE"),
    "| event tape                                           |",
    ...rows,
    frameLine("each event is visualOnly=true and usageWrites=false"),
    frameLine("Vibers Unite // c0vibe.app"),
    "+------------------------------------------------------+",
  ].join("\n");
}

export function planSyncSurprises(providerIds: string[]): SyncSurprise[] {
  if (!providerIds.length) return [];
  const providers = new Set(providerIds.map((id) => id.toLowerCase()));
  const matched = surprises.filter((surprise) => hit(providers, surprise));
  const relay = matched.find((surprise) => surprise.id === "c0vibe-relay");
  const topical = matched.filter((surprise) => surprise.id !== "c0vibe-relay").slice(0, 3);
  return relay ? [...topical, relay] : topical;
}

export function renderSyncSurprisePanel(surprise: SyncSurprise, index: number, total: number): string {
  const spin = spinnerFrames();
  const globe = smallGlobe();
  const signal = surprise.frames.map((frame, i) => `${spin[i % spin.length]} ${frame}`).join("  ");
  const globeRows = globe.map((line) => `| ${line.padEnd(20)} | ${" ".repeat(22)} |`);
  const logo = logoRows(surprise).map((line) => `| ${line.slice(0, 52).padEnd(52)} |`);
  const motion = motionRows(surprise).map((line) => `| ${line.slice(0, 52).padEnd(52)} |`);
  const signalField = brailleSignalField(surprise.id).map((line) => frameLine(`braille ${line}`));
  return [
    "+------------------------------------------------------+",
    `| VTRK://SYNC-SURPRISE//${String(index + 1).padStart(2, "0")}/${String(total).padStart(2, "0")}                 |`,
    "|------------------------------------------------------|",
    `| ${surprise.badge.padEnd(9)} ${surprise.title.padEnd(34)} |`,
    `| ${signal.slice(0, 52).padEnd(52)} |`,
    frameLine("surprise cadence 1/3 queue, 2/3 scan, 3/3 check"),
    frameLine("queue surprise opens before data collection starts"),
    "| logo turntable: provider ASCII mark rotates          |",
    ...logo,
    "| motion strip: rotating ASCII signal                  |",
    ...motion,
    ...renderSignatureReveal(revealProviderId(surprise), surprise.title, "queue"),
    ...microRevealRows(surprise.motion),
    "| drawille braille signal field                         |",
    ...signalField,
    ...globeRows,
    `| ${surprise.guardrail.slice(0, 52).padEnd(52)} |`,
    `| ${surprise.subtitle.slice(0, 52).padEnd(52)} |`,
    "| source: cli-spinners + ascii-globe + drawille        |",
    "+------------------------------------------------------+",
  ].join("\n");
}

export function renderSyncSurpriseItinerary(providerIds: string[]): string {
  const planned = planSyncSurprises(providerIds);
  if (!planned.length) return "";
  return [
    "+------------------------------------------------------+",
    frameLine("VTK://SURPRISE-ITINERARY//QUEUE-SCAN-CHECK-RECAP"),
    "|------------------------------------------------------|",
    frameLine(`${planned.length} surprise panel(s) armed before collection`),
    frameLine("4 hooks fire: queue -> scan -> checkpoint -> recap"),
    frameLine("01 queue: branded ASCII mark wakes before collection"),
    frameLine("02 scan: turntable rotates during provider fetch"),
    frameLine("03 checkpoint: receipt appears after validation only"),
    frameLine("04 recap: marks replay with no extra ledger writes"),
    "| provider rails                                       |",
    ...planned.slice(0, 4).map((surprise, index) =>
      frameLine(`${String(index + 1).padStart(2, "0")} ${surpriseRail(surprise).slice(0, 47)}`),
    ),
    frameLine("signals: USAGE / NOT USAGE / LOCAL / PUBLISH"),
    frameLine("no raw prompts, outputs, secrets, or fake spend"),
    frameLine("Vibers Unite // c0vibe.app"),
    "+------------------------------------------------------+",
  ].join("\n");
}

export function renderSyncSurpriseQueue(providerIds: string[]): string[] {
  const planned = planSyncSurprises(providerIds);
  if (!planned.length) return [];
  return [
    renderSyncIgnitionBanner(providerIds),
    renderSyncSurpriseItinerary(providerIds),
    ...planned.map((surprise, index) => renderSyncSurprisePanel(surprise, index, planned.length)),
  ];
}

export function renderCollectionCheckpoint(input: CollectionCheckpoint): string {
  const brand = providerBrand(input.providerId, input.label);
  const sourceTotal = Math.max(1, input.sourceMix?.reduce((sum, row) => sum + row.count, 0) ?? 0);
  const sourceRows = input.sourceMix?.length
    ? input.sourceMix.slice(0, 3).map((row) => frameLine(`${fit(row.source, 14)} ${String(row.count).padStart(5)} ${countBar(row.count, sourceTotal)}`))
    : [frameLine(input.status === "error" ? "no records collected from this provider" : "no new source rows in this checkpoint")];
  const status = input.status === "error"
    ? `HOLD ${input.error ?? "provider error"}`
    : input.status === "new"
      ? `LOCK ${input.fresh.toLocaleString("en-US")} new record(s)`
      : "CLEAR up to date";
  return [
    "+------------------------------------------------------+",
    frameLine(`VTK://COLLECT-CHECKPOINT//${brand.mark}//${input.providerId}`),
    "|------------------------------------------------------|",
    frameLine(`${status}`),
    frameLine(`brand ${brand.from}->${brand.to} · Vibers Unite`),
    frameLine("surprise hook 3/4: checkpoint after validation"),
    frameLine(`received ${input.received} · accepted ${input.accepted} · duplicate ${input.duplicate}`),
    frameLine(`fresh ${input.fresh}${input.usd != null ? ` · ${input.usd.toFixed(2)} USD est.` : ""}`),
    "| collection control tape                              |",
    ...checkpointControlTape(input),
    "| source mix                                           |",
    ...sourceRows,
    "| surprise checkpoint encore                           |",
    ...checkpointEncoreRows(input),
    frameLine(input.hint ?? "local ledger updated only after validation"),
    "+------------------------------------------------------+",
  ].join("\n");
}

export function defaultSyncSurpriseDirectorProviders(): string[] {
  return [...defaultDirectorProviders];
}

function normalizeDirectorProviders(providerIds?: string[]): string[] {
  const seen = new Set<string>();
  const ids = (providerIds?.length ? providerIds : defaultDirectorProviders)
    .map((id) => id.trim().toLowerCase())
    .filter(Boolean)
    .filter((id) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  return ids.length ? ids : [...defaultDirectorProviders];
}

export function renderSyncSurpriseDirectorPreview(providerIds?: string[]): string {
  const ids = normalizeDirectorProviders(providerIds);
  const queue = renderSyncSurpriseQueue(ids).join("\n");
  const beats = ids.slice(0, 4).map((providerId, index) =>
    renderProviderScanBeat({
      providerId,
      label: providerBrand(providerId).label,
      index,
      total: Math.min(4, ids.length),
    }),
  );
  return [
    "+------------------------------------------------------+",
    frameLine("VTK://SURPRISE-DIRECTOR//SAFE-PREVIEW//VIBERS-UNITE"),
    "|------------------------------------------------------|",
    frameLine("safe preview: no provider calls, writes, or uploads"),
    frameLine("no secret reads; no local records are changed"),
    frameLine("moments: HF logo turn, CX cube, LAN sonar, C0 relay"),
    frameLine(`providers ${ids.slice(0, 8).join(" + ").slice(0, 40)}`),
    frameLine("use during demos, docs, and first-run confidence checks"),
    frameLine("visual feedback only; records decide usage totals"),
    "+------------------------------------------------------+",
    queue,
    ...beats,
    renderCollectionCascade({
      providerIds: ids,
      label: "SAFE-PREVIEW",
    }),
    renderCollectionEncoreRecap({
      providerIds: ids,
      checkpoints: [],
      label: "SAFE-PREVIEW",
    }),
    renderSurpriseFlightRecorder({
      providerIds: ids,
      label: "SAFE-PREVIEW",
    }),
  ].filter(Boolean).join("\n");
}

export function renderSyncSurpriseDirectorHtml(providerIds?: string[]): string {
  const ids = normalizeDirectorProviders(providerIds);
  const preview = renderSyncSurpriseDirectorPreview(ids);
  const cards = ids.slice(0, 6).map((providerId, index) => {
    const brand = providerBrand(providerId);
    const preset = providerBeatPreset(providerId, brand.label);
    const reveal = renderSignatureReveal(providerId, brand.label, "scan").join("\n");
    const frames = preset.frames.slice(0, 4).map((frame, frameIndex) =>
      `<pre style="--frame:${frameIndex}">${escapeHtml(frame.join("\n"))}</pre>`,
    ).join("");
    return `<article class="provider-card" style="--i:${index};--from:${escapeHtml(brand.from)};--to:${escapeHtml(brand.to)}">
      <div class="provider-card__top"><span>${escapeHtml(brand.mark)}</span><b>${escapeHtml(brand.label)}</b><em>${railLabel(providerId)}</em></div>
      <div class="provider-card__screen">${frames}</div>
      <p>${escapeHtml(preset.note)}</p>
      <code>${escapeHtml(preset.guardrail)}</code>
      <details><summary>terminal reveal</summary><pre>${escapeHtml(reveal)}</pre></details>
    </article>`;
  }).join("");
  const stageLines = [
    "wake provider marks",
    "turn HF/CX/local glyphs",
    "validate before ledger writes",
    "recap with no extra usage",
    "Vibers Unite // c0vibe.app",
  ];
  const stage = stageLines.map((line, index) => `<span style="--i:${index}">${escapeHtml(line)}</span>`).join("");
  const directorActs = [
    {
      hook: "01 queue",
      title: "Wake The Marks",
      rail: "USAGE / TRUST / LOCAL / PUBLISH labels visible before collection",
      copy: "Higgsfield prism turn, Codex diff cube, local sonar bloom, and C0VIBE unite flash arm as visual feedback.",
    },
    {
      hook: "02 scan",
      title: "Turn During Fetch",
      rail: "provider calls only happen in real sync, never in this preview",
      copy: "Provider marks rotate while the inline terminal explains that records, not animation, decide usage totals.",
    },
    {
      hook: "03 checkpoint",
      title: "Seal After Validation",
      rail: "checkpoint appears only after accepted rows are known",
      copy: "Fresh, duplicate, hold, and not-usage rails stay separate so trust signals cannot inflate spend.",
    },
    {
      hook: "04 recap",
      title: "Relay Without Extra Rows",
      rail: "recap replays proof with no additional ledger writes",
      copy: "The GUI closes with Vibers Unite // c0vibe.app while publish remains an explicit review step.",
    },
  ];
  const director = directorActs.map((act, index) => `<article class="director-act" style="--i:${index}">
      <span>${escapeHtml(act.hook)}</span>
      <b>${escapeHtml(act.title)}</b>
      <em>${escapeHtml(act.rail)}</em>
      <p>${escapeHtml(act.copy)}</p>
    </article>`).join("");
  const pulseRail = ids.slice(0, 8).map((providerId, index) => {
    const brand = providerBrand(providerId);
    return `<span style="--i:${index};--from:${escapeHtml(brand.from)};--to:${escapeHtml(brand.to)}">${escapeHtml(brand.mark)}</span>`;
  }).join("");
  const runwayRows = ids.slice(0, 8).map((providerId, index) => {
    const brand = providerBrand(providerId);
    const preset = providerBeatPreset(providerId, brand.label);
    const frame = preset.frames[index % preset.frames.length] ?? [brand.mark];
    return `${String(index + 1).padStart(2, "0")} ${brand.mark.padEnd(3)} ${railLabel(providerId).padEnd(9)} ${fit(brand.label, 14)} ${compactFrame(frame).slice(0, 26)}`;
  });
  const runwayCells = ids.slice(0, 8).map((providerId, index) => {
    const brand = providerBrand(providerId);
    const preset = providerBeatPreset(providerId, brand.label);
    const frame = preset.frames[index % preset.frames.length] ?? [brand.mark];
    return `<article class="runway-cell" style="--i:${index};--from:${escapeHtml(brand.from)};--to:${escapeHtml(brand.to)}">
      <span>${escapeHtml(String(index + 1).padStart(2, "0"))}</span>
      <b>${escapeHtml(brand.mark)} ${escapeHtml(brand.label)}</b>
      <em>${escapeHtml(railLabel(providerId))}</em>
      <p>${escapeHtml(compactFrame(frame))}</p>
    </article>`;
  }).join("");
  const recorder = renderSurpriseFlightRecorder({ providerIds: ids, label: "STATIC-GUI" });
  const recorderEvents = buildSurpriseFlightRecorder({ providerIds: ids });
  const recorderCells = recorderEvents.slice(0, 16).map((event, index) => {
    const brand = providerBrand(event.providerId, event.title);
    return `<article class="flight-event flight-event--${escapeHtml(event.rail.toLowerCase().replace(/\s+/g, "-"))}" style="--i:${index};--from:${escapeHtml(brand.from)};--to:${escapeHtml(brand.to)}">
      <span>${escapeHtml(String(event.sequence).padStart(2, "0"))}</span>
      <b>${escapeHtml(event.phase)} / ${escapeHtml(event.mark)} / ${escapeHtml(event.rail)}</b>
      <p>${escapeHtml(event.cue)}</p>
      <code>${escapeHtml(event.frame)}</code>
    </article>`;
  }).join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>VibeTRACKER Surprise Reel</title>
<style>
  :root{color-scheme:dark;--bg:#040607;--panel:#071014;--line:rgba(219,255,246,.14);--ink:#ebfff9;--muted:#8aa79f;--cyan:#2ee8d6;--green:#36e39b;--pink:#ff4fd8;--gold:#ffc64d;--blue:#7c9cff;--motion:cubic-bezier(.22,.68,.12,1)}
  *{box-sizing:border-box}body{margin:0;min-height:100vh;color:var(--ink);background:radial-gradient(circle at 18% 18%,rgba(255,79,216,.14),transparent 28%),radial-gradient(circle at 76% 12%,rgba(46,232,214,.13),transparent 26%),linear-gradient(135deg,#040607,#071014 54%,#050708);font:13px/1.45 ui-sans-serif,system-ui,sans-serif;overflow-x:hidden}
  body::before{content:"";position:fixed;inset:0;pointer-events:none;background:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px);background-size:34px 34px;mask-image:linear-gradient(180deg,#000,transparent 88%)}
  main{width:min(1180px,calc(100vw - 28px));margin:0 auto;padding:28px 0 40px}.hero{display:grid;grid-template-columns:minmax(0,.9fr) minmax(320px,1.1fr);gap:14px;align-items:stretch;min-height:520px}.hero-copy,.terminal,.provider-card,.stage,.director,.runway{position:relative;border:1px solid var(--line);background:linear-gradient(180deg,rgba(8,16,20,.92),rgba(4,7,9,.96));box-shadow:0 30px 90px -68px var(--cyan),inset 0 1px 0 rgba(255,255,255,.07);overflow:hidden}
  .hero-copy{display:flex;flex-direction:column;justify-content:space-between;padding:22px;border-radius:12px}.hero-copy::after,.terminal::after,.provider-card::after,.director::after,.runway::after,.runway-cell::after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 0 44%,rgba(255,255,255,.1) 50%,transparent 58%);transform:translateX(-95%);animation:sweep 5.2s var(--motion) infinite;pointer-events:none}.eyebrow{color:var(--green);font:900 11px/1 ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:.1em}.hero h1{margin:0;color:#f5fff9;font:950 clamp(42px,8vw,92px)/.86 ui-monospace,Menlo,monospace;letter-spacing:0;text-transform:uppercase;text-shadow:0 0 40px rgba(46,232,214,.22)}.hero p{max-width:58ch;color:#c4ddd6;font-size:15px}.guard{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.guard span{border:1px solid rgba(54,227,155,.2);background:rgba(4,11,12,.72);padding:9px;color:#bff8e5;font:850 10px/1.2 ui-monospace,Menlo,monospace;text-transform:uppercase}
  .terminal{border-radius:12px;padding:10px}.terminal-top{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 8px 10px;color:var(--muted);font:800 10px/1 ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:.08em}.terminal-top b{color:var(--gold)}pre{margin:0;white-space:pre-wrap;word-break:break-word}.terminal pre{position:relative;min-height:450px;max-height:68vh;overflow:auto;padding:12px;border:1px solid rgba(46,232,214,.12);background:#030708;color:#dffef6;font:800 10px/1.22 ui-monospace,Menlo,monospace;text-shadow:0 0 16px rgba(46,232,214,.14)}.terminal pre::before{content:"";position:absolute;left:0;right:0;top:0;height:38px;background:linear-gradient(180deg,rgba(46,232,214,.18),transparent);animation:scan 3.4s var(--motion) infinite;pointer-events:none}
  .stage{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:1px;margin:14px 0;border-radius:10px}.stage span{position:relative;min-height:70px;padding:12px;background:rgba(5,10,12,.8);color:#c7fff0;font:850 11px/1.25 ui-monospace,Menlo,monospace;text-transform:uppercase;overflow:hidden;animation:rise .48s var(--motion) both;animation-delay:calc(var(--i) * 70ms)}.stage span::after{content:"";position:absolute;left:12px;right:12px;bottom:12px;height:4px;background:linear-gradient(90deg,var(--pink),var(--cyan),var(--green));transform-origin:left;animation:fill 1.2s var(--motion) both;animation-delay:calc(var(--i) * 160ms)}
  .runway{display:grid;grid-template-columns:minmax(260px,.72fr) minmax(0,1.28fr);gap:1px;margin:14px 0;border-radius:10px}.runway-head{position:relative;z-index:1;display:grid;align-content:space-between;gap:14px;padding:14px;background:rgba(5,10,12,.84)}.runway-head span{color:var(--green);font:950 10px/1 ui-monospace,Menlo,monospace;text-transform:uppercase}.runway-head b{color:#f5fff9;font:950 26px/.94 ui-monospace,Menlo,monospace;text-transform:uppercase}.runway-head p{margin:0;color:#bdd8d1;font-size:12px}.runway-terminal{position:relative;z-index:1;margin:0;padding:10px;border:1px solid rgba(46,232,214,.12);background:#030708;color:#dffef6;font:850 10px/1.3 ui-monospace,Menlo,monospace;text-shadow:0 0 16px rgba(46,232,214,.14);overflow:auto}.runway-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px}.runway-cell{position:relative;min-height:152px;padding:12px;background:linear-gradient(160deg,color-mix(in srgb,var(--from) 12%,rgba(9,18,22,.94)),rgba(3,7,9,.98));overflow:hidden;animation:rise .48s var(--motion) both;animation-delay:calc(var(--i) * 78ms)}.runway-cell::before{content:"";position:absolute;left:12px;right:12px;bottom:12px;height:3px;background:linear-gradient(90deg,var(--from),var(--to));transform-origin:left;animation:fill 1.1s var(--motion) both;animation-delay:calc(var(--i) * 150ms)}.runway-cell span{display:grid;place-items:center;width:34px;height:28px;border:1px solid color-mix(in srgb,var(--from) 42%,var(--line));background:linear-gradient(135deg,var(--from),var(--to));color:#061012;font:950 11px/1 ui-monospace,Menlo,monospace}.runway-cell b{display:block;margin-top:10px;color:#f8fff9;font:950 12px/1.05 ui-monospace,Menlo,monospace;text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.runway-cell em{display:block;margin-top:8px;color:var(--gold);font:900 10px/1 ui-monospace,Menlo,monospace;font-style:normal;text-transform:uppercase}.runway-cell p{margin:9px 0 0;color:#bdd8d1;font:850 10px/1.25 ui-monospace,Menlo,monospace;overflow-wrap:anywhere}
  .director{display:grid;grid-template-columns:260px minmax(0,1fr);gap:1px;margin:14px 0;border-radius:10px}.director-head{position:relative;z-index:1;display:grid;align-content:space-between;gap:14px;padding:14px;background:rgba(5,10,12,.84)}.director-head em{color:var(--gold);font:900 10px/1 ui-monospace,Menlo,monospace;font-style:normal;text-transform:uppercase}.director-head b{color:#f5fff9;font:950 24px/.94 ui-monospace,Menlo,monospace;text-transform:uppercase}.director-head p{margin:0;color:#bdd8d1;font-size:12px}.pulse-rail{display:flex;flex-wrap:wrap;gap:6px}.pulse-rail span{display:grid;place-items:center;width:34px;height:30px;border:1px solid color-mix(in srgb,var(--from) 42%,var(--line));background:linear-gradient(135deg,var(--from),var(--to));color:#061012;font:950 11px/1 ui-monospace,Menlo,monospace;box-shadow:0 0 20px -9px var(--from);animation:pulse 2.8s var(--motion) infinite;animation-delay:calc(var(--i) * 110ms)}.director-track{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px}.director-act{position:relative;min-width:0;min-height:206px;padding:13px;background:linear-gradient(160deg,rgba(13,20,25,.94),rgba(3,7,9,.98));overflow:hidden;animation:rise .48s var(--motion) both;animation-delay:calc(var(--i) * 80ms)}.director-act::before{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;background:linear-gradient(90deg,var(--pink),var(--cyan),var(--green));transform-origin:left;animation:fill 1.1s var(--motion) both;animation-delay:calc(var(--i) * 170ms)}.director-act span{display:block;color:var(--green);font:950 10px/1 ui-monospace,Menlo,monospace;text-transform:uppercase}.director-act b{display:block;margin-top:8px;color:#f5fff9;font:950 15px/1.05 ui-monospace,Menlo,monospace;text-transform:uppercase}.director-act em{display:block;margin-top:10px;color:var(--gold);font:850 10px/1.25 ui-monospace,Menlo,monospace;font-style:normal;text-transform:uppercase}.director-act p{margin:10px 0 0;color:#bdd8d1;font-size:12px;line-height:1.35}
  .flight{display:grid;grid-template-columns:minmax(320px,.95fr) minmax(0,1.05fr);gap:1px;margin:14px 0;border:1px solid var(--line);border-radius:10px;background:linear-gradient(180deg,rgba(8,16,20,.92),rgba(4,7,9,.98));overflow:hidden;box-shadow:0 30px 90px -68px var(--pink),inset 0 1px 0 rgba(255,255,255,.07)}.flight-head{position:relative;z-index:1;padding:14px;background:rgba(5,10,12,.84)}.flight-head span{color:var(--pink);font:950 10px/1 ui-monospace,Menlo,monospace;text-transform:uppercase}.flight-head b{display:block;margin-top:8px;color:#f5fff9;font:950 24px/.94 ui-monospace,Menlo,monospace;text-transform:uppercase}.flight-head p{margin:10px 0 0;color:#bdd8d1;font-size:12px}.flight-terminal{margin-top:12px;max-height:340px;overflow:auto;padding:10px;border:1px solid rgba(255,79,216,.15);background:#030708;color:#f4fff9;font:850 9px/1.22 ui-monospace,Menlo,monospace}.flight-track{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px}.flight-event{position:relative;min-height:132px;padding:12px;background:linear-gradient(160deg,color-mix(in srgb,var(--from) 12%,rgba(9,18,22,.94)),rgba(3,7,9,.98));overflow:hidden;animation:rise .48s var(--motion) both;animation-delay:calc(var(--i) * 45ms)}.flight-event::before{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;background:linear-gradient(90deg,var(--from),var(--to));transform-origin:left;animation:fill 1.1s var(--motion) both;animation-delay:calc(var(--i) * 72ms)}.flight-event span{display:grid;place-items:center;width:34px;height:26px;border:1px solid color-mix(in srgb,var(--from) 42%,var(--line));background:linear-gradient(135deg,var(--from),var(--to));color:#061012;font:950 11px/1 ui-monospace,Menlo,monospace}.flight-event b{display:block;margin-top:9px;color:#f5fff9;font:950 11px/1.05 ui-monospace,Menlo,monospace;text-transform:uppercase}.flight-event p{margin:8px 0;color:#bdd8d1;font-size:11px}.flight-event code{display:block;color:#ffe7a3;font:800 9px/1.25 ui-monospace,Menlo,monospace;overflow-wrap:anywhere}
  .provider-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.provider-card{border-radius:10px;padding:12px;min-height:300px;box-shadow:0 24px 82px -62px var(--from),inset 0 1px 0 rgba(255,255,255,.07);animation:rise .5s var(--motion) both;animation-delay:calc(var(--i) * 80ms)}.provider-card::before{content:"";position:absolute;left:0;right:42%;top:0;height:1px;background:linear-gradient(90deg,var(--from),var(--to),transparent)}.provider-card__top{position:relative;z-index:1;display:grid;grid-template-columns:42px minmax(0,1fr) auto;gap:8px;align-items:center}.provider-card__top span{display:grid;place-items:center;height:36px;border:1px solid color-mix(in srgb,var(--from) 42%,var(--line));background:linear-gradient(135deg,var(--from),var(--to));color:#071014;font:950 13px/1 ui-monospace,Menlo,monospace}.provider-card__top b{min-width:0;color:#f4fff9;font:900 12px/1.1 ui-monospace,Menlo,monospace;text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.provider-card__top em{font-style:normal;color:var(--gold);font:900 9px/1 ui-monospace,Menlo,monospace;text-transform:uppercase}.provider-card__screen{position:relative;z-index:1;height:82px;margin:12px 0;border:1px solid rgba(255,255,255,.09);background:#030708;overflow:hidden}.provider-card__screen pre{position:absolute;inset:10px;color:#eafff8;font:900 15px/1.05 ui-monospace,Menlo,monospace;text-align:center;text-shadow:0 0 18px color-mix(in srgb,var(--from) 38%,transparent);opacity:0;transform:translateY(8px) scale(.98);animation:frame 5.6s steps(1,end) infinite;animation-delay:calc(var(--frame) * 1.4s)}.provider-card p{position:relative;z-index:1;margin:0 0 10px;color:#bad7d0;font-size:12px}.provider-card code{position:relative;z-index:1;display:block;padding:8px;border:1px solid rgba(255,198,77,.18);color:#ffe7a3;background:rgba(255,198,77,.06);font:800 10px/1.25 ui-monospace,Menlo,monospace}.provider-card details{position:relative;z-index:1;margin-top:10px;color:var(--muted)}.provider-card summary{cursor:pointer;color:var(--cyan);font:850 10px/1 ui-monospace,Menlo,monospace;text-transform:uppercase}.provider-card details pre{margin-top:8px;max-height:190px;overflow:auto;padding:8px;background:#020506;border:1px solid rgba(255,255,255,.08);font:800 8px/1.18 ui-monospace,Menlo,monospace;color:#dffef6}
  footer{margin-top:16px;color:var(--muted);font:800 11px/1.4 ui-monospace,Menlo,monospace}.accent{color:var(--green)}@keyframes sweep{to{transform:translateX(95%)}}@keyframes scan{0%,100%{transform:translateY(0)}50%{transform:translateY(400px)}}@keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}@keyframes fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}@keyframes frame{0%,24%{opacity:1;transform:none}25%,100%{opacity:0;transform:translateY(-8px) scale(.98)}}@keyframes pulse{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-2px) scale(1.04)}}
  @media (max-width:1040px){.director,.runway,.flight{grid-template-columns:1fr}.director-track,.runway-strip{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media (max-width:900px){.hero{grid-template-columns:1fr}.provider-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.stage{grid-template-columns:1fr 1fr}.hero h1{font-size:44px}.terminal pre{min-height:360px}}
  @media (max-width:560px){main{width:min(100vw - 18px,1180px);padding-top:12px}.provider-grid,.guard,.stage,.director-track,.runway-strip,.flight-track{grid-template-columns:1fr}.provider-card__top{grid-template-columns:36px minmax(0,1fr)}.provider-card__top em{grid-column:2}.terminal pre{font-size:8px}.hero-copy{padding:16px}.director-act{min-height:164px}.runway-cell,.flight-event{min-height:128px}}
  @media (prefers-reduced-motion:reduce){*{animation-duration:.001ms!important;animation-iteration-count:1!important;transition:none!important}.provider-card__screen pre:first-child{opacity:1}}
</style>
</head>
<body>
  <main aria-label="VibeTRACKER surprise reel">
    <section class="hero">
      <div class="hero-copy">
        <div class="eyebrow">VTK://SURPRISE-REEL//STATIC-GUI//SAFE-PREVIEW</div>
        <h1>Vibers<br>Unite</h1>
        <p>Higgsfield turns, Codex cubes, local sonar, creator meters, and the C0VIBE relay in one static GUI. No provider calls, writes, uploads, scripts, CDNs, prompts, outputs, or secrets.</p>
        <div class="guard" aria-label="Safety guarantees">
          <span>records decide usage totals</span>
          <span>trust stays NOT USAGE</span>
          <span>local first review gate</span>
          <span>c0vibe.app after consent</span>
        </div>
      </div>
      <section class="terminal" aria-label="Inline terminal surprise preview">
        <div class="terminal-top"><span>surprise@vibetracker</span><b>SAFE PREVIEW</b></div>
        <pre>${escapeHtml(preview)}</pre>
      </section>
    </section>
    <section class="stage" aria-label="Scan stage">${stage}</section>
    <section class="runway" aria-label="Provider arrival runway">
      <div class="runway-head">
        <span>VTK://SCAN-RUNWAY//PROVIDER-ARRIVALS//NO-FAKE-SPEND</span>
        <b>Provider Arrival Runway</b>
        <p>Every connected source gets a branded landing pulse before proof. The runway is visual feedback only; accepted records, trust labels, and review gates decide what counts.</p>
        <pre class="runway-terminal">${escapeHtml(runwayRows.join("\n"))}</pre>
      </div>
      <div class="runway-strip">${runwayCells}</div>
    </section>
    <section class="director" aria-label="Scan surprise director">
      <div class="director-head">
        <em>VTK://SCAN-DIRECTOR//SCRIPT-FREE</em>
        <b>Scan Director</b>
        <p>Queue -> scan -> checkpoint -> recap. Provider marks animate without scripts; usage, trust, local, and publish rails stay labelled.</p>
        <div class="pulse-rail" aria-label="Provider pulse marks">${pulseRail}</div>
      </div>
      <div class="director-track">${director}</div>
    </section>
    <section class="flight" aria-label="Surprise flight recorder">
      <div class="flight-head">
        <span>VTK://SURPRISE-FLIGHT-RECORDER//STATIC-GUI</span>
        <b>Flight Recorder</b>
        <p>Replay the visual show as evidence. Every event is marked visual-only with no hidden usage write, prompt export, output export, secret read, or upload.</p>
        <pre class="flight-terminal">${escapeHtml(recorder)}</pre>
      </div>
      <div class="flight-track">${recorderCells}</div>
    </section>
    <section class="provider-grid" aria-label="Provider surprise cards">${cards}</section>
    <footer><span class="accent">Visual credits:</span> cli-spinners, ascii-globe, drawille. Reference bench: VHS, Durdraw, termdot, Asciimatics. Static file; no JavaScript.</footer>
  </main>
</body>
</html>`;
}

export function renderSurpriseFlightRecorderHtml(providerIds?: string[]): string {
  const ids = normalizeDirectorProviders(providerIds);
  const recorder = renderSurpriseFlightRecorder({ providerIds: ids, label: "STATIC-GUI" });
  const events = buildSurpriseFlightRecorder({ providerIds: ids });
  const cells = events.slice(0, 24).map((event, index) => {
    const brand = providerBrand(event.providerId, event.title);
    return `<article class="event event--${escapeHtml(event.rail.toLowerCase().replace(/\s+/g, "-"))}" style="--i:${index};--from:${escapeHtml(brand.from)};--to:${escapeHtml(brand.to)}">
      <div><span>${escapeHtml(String(event.sequence).padStart(2, "0"))}</span><b>${escapeHtml(event.phase)}</b><em>${escapeHtml(event.rail)}</em></div>
      <strong>${escapeHtml(event.mark)} ${escapeHtml(event.title)}</strong>
      <p>${escapeHtml(event.cue)}</p>
      <code>${escapeHtml(event.frame)}</code>
    </article>`;
  }).join("");
  const railSummary = flightRailSummary(events).split(" / ").map((item, index) =>
    `<span style="--i:${index}">${escapeHtml(item)}</span>`,
  ).join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>VibeTRACKER Surprise Flight Recorder</title>
<style>
  :root{color-scheme:dark;--bg:#040607;--panel:#0d1419;--ink:#f2fff9;--muted:#91aaa4;--line:rgba(223,255,248,.16);--cyan:#2ee8d6;--green:#36e39b;--gold:#ffc64d;--pink:#ff4fd8;--violet:#9f7cff;--red:#ff7768;--motion:cubic-bezier(.22,.68,.12,1)}
  *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:var(--bg)}body{color:var(--ink);font:13px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overflow-x:hidden}body::before{content:"";position:fixed;inset:0;pointer-events:none;background:linear-gradient(rgba(255,255,255,.026) 50%,transparent 50%) 0 0/100% 4px,linear-gradient(90deg,rgba(255,79,216,.08),transparent 24%,rgba(46,232,214,.06) 54%,transparent 78%,rgba(54,227,155,.06));mix-blend-mode:screen}
  main{width:min(1240px,calc(100vw - 28px));margin:0 auto;padding:26px 0 44px}.hero{display:grid;grid-template-columns:minmax(320px,.8fr) minmax(0,1.2fr);gap:12px;min-height:540px}.panel,.terminal,.event,.rail{position:relative;border:1px solid var(--line);border-radius:10px;background:linear-gradient(180deg,rgba(11,20,24,.95),rgba(4,7,9,.99));box-shadow:0 30px 96px -72px var(--pink),inset 0 1px 0 rgba(255,255,255,.07);overflow:hidden}.panel::after,.terminal::after,.event::after,.rail::after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 0 44%,rgba(255,255,255,.1) 50%,transparent 58%);transform:translateX(-98%);animation:sweep 5.6s var(--motion) infinite;pointer-events:none}.panel{display:grid;align-content:space-between;gap:22px;padding:20px}.eyebrow{color:var(--pink);font-weight:950;font-size:10px;text-transform:uppercase}.panel h1{margin:8px 0;color:#f8fff9;font:950 clamp(38px,7vw,82px)/.9 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;text-shadow:0 0 44px rgba(255,79,216,.22)}.panel p{margin:0;color:#c6ded7;font-family:ui-sans-serif,system-ui,sans-serif;font-size:15px}.rails{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.rails span{padding:10px;border:1px solid rgba(54,227,155,.2);background:rgba(4,10,12,.75);color:#c9fff0;font-size:10px;font-weight:950;text-transform:uppercase;animation:rise .5s var(--motion) both;animation-delay:calc(var(--i) * 80ms)}
  .terminal{padding:10px}.terminal-top{display:flex;justify-content:space-between;gap:8px;padding:8px 8px 10px;color:var(--muted);font-size:10px;font-weight:950;text-transform:uppercase}.terminal-top b{color:var(--gold)}pre{margin:0;white-space:pre-wrap}.terminal pre{min-height:468px;padding:14px;border:1px solid rgba(255,79,216,.13);background:#030708;color:#f4fff9;font:950 10px/1.22 ui-monospace,SFMono-Regular,Menlo,monospace;text-shadow:0 0 16px rgba(255,79,216,.14);overflow:auto}
  .events{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:12px}.event{--tone:var(--cyan);display:grid;align-content:start;gap:8px;min-height:190px;padding:12px;animation:rise .48s var(--motion) both;animation-delay:calc(var(--i) * 42ms)}.event--usage{--tone:var(--green)}.event--not-usage{--tone:var(--gold);border-style:dashed}.event--local{--tone:var(--violet)}.event--publish{--tone:var(--pink)}.event::before{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;background:linear-gradient(90deg,var(--from),var(--to));transform-origin:left;animation:fill 1.1s var(--motion) both;animation-delay:calc(var(--i) * 64ms)}.event div,.event strong,.event p,.event code{position:relative;z-index:1}.event div{display:flex;align-items:center;gap:8px}.event span{display:grid;place-items:center;width:34px;height:26px;background:linear-gradient(135deg,var(--from),var(--to));color:#061012;font-weight:950}.event b{color:var(--tone);font-size:10px;text-transform:uppercase}.event em{margin-left:auto;color:var(--gold);font-size:9px;font-style:normal;text-transform:uppercase}.event strong{color:#f8fff9;font-size:13px;line-height:1.1;text-transform:uppercase}.event p{margin:0;color:#bdd8d1;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px;line-height:1.35}.event code{display:block;margin-top:auto;color:#ffe7a3;font-size:10px;overflow-wrap:anywhere}
  footer{margin-top:12px;color:var(--muted);font-size:11px}.accent{color:var(--green)}@keyframes sweep{to{transform:translateX(98%)}}@keyframes rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}@keyframes fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}@media(max-width:1120px){.events{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:920px){.hero{grid-template-columns:1fr}.terminal pre{min-height:320px}.events{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){main{width:min(100vw - 18px,1240px);padding-top:12px}.panel{padding:16px}.panel h1{font-size:38px}.rails,.events{grid-template-columns:1fr}.terminal pre{font-size:8px}.event{min-height:156px}}@media(prefers-reduced-motion:reduce){*{animation-duration:.001ms!important;animation-iteration-count:1!important;transition:none!important}}
</style>
</head>
<body>
  <main aria-label="VibeTRACKER surprise flight recorder">
    <section class="hero">
      <div class="panel">
        <div>
          <div class="eyebrow">VTK://SURPRISE-FLIGHT-RECORDER//STATIC-GUI//VIBERS-UNITE</div>
          <h1>Flight<br>Recorder</h1>
          <p>A replayable audit tape for the scan show: each surprise is labelled by phase, provider mark, rail, and safety boundary.</p>
        </div>
        <div class="rails" aria-label="Recorded rail counts">${railSummary}</div>
      </div>
      <section class="terminal" aria-label="Flight recorder terminal">
        <div class="terminal-top"><span>recorder@vibetracker</span><b>VISUAL ONLY</b></div>
        <pre>${escapeHtml(recorder)}</pre>
      </section>
    </section>
    <section class="events" aria-label="Recorded surprise events">${cells}</section>
    <footer><span class="accent">Recorder boundary:</span> static preview only. No provider calls, no usage writes, no prompts, no outputs, no secret values, no hidden upload.</footer>
  </main>
</body>
</html>`;
}

export function renderProviderScanBeat(input: ProviderScanBeat): string {
  const brand = providerBrand(input.providerId, input.label);
  const preset = providerBeatPreset(input.providerId, input.label);
  const spin = spinnerFrames();
  const steps = ["wake", "auth", "fetch", "validate"].map((step, index) => `${spin[index % spin.length]} ${step}`).join("  ");
  const logo = frameGridRows(preset.frames, 8).map((line) => frameLine(line.slice(0, 52)));
  const signalField = brailleSignalField(`${input.providerId}:${input.index}`).map((line) => frameLine(`drawille ${line}`));
  return [
    "+------------------------------------------------------+",
    frameLine(`VTK://SCAN-BEAT//${String(input.index + 1).padStart(2, "0")}/${String(input.total).padStart(2, "0")}//${brand.mark}`),
    "|------------------------------------------------------|",
    frameLine(`${brand.mark} ${preset.title}`),
    frameLine(`${brand.label} · brand ${brand.from}->${brand.to}`),
    frameLine("surprise hook 2/4: scan turn before fetch result"),
    frameLine("surprise cadence 2/3 scan beat: ASCII logo turntable"),
    frameLine(steps),
    ...logo,
    ...microRevealRows(preset.frames, ["wake", "auth", "fetch", "validate"]),
    ...renderSignatureReveal(input.providerId, input.label, "scan"),
    frameLine("unicode braille signal field"),
    ...signalField,
    frameLine(preset.mode),
    frameLine(preset.guardrail),
    frameLine("never fake spend // no silent source promotion"),
    frameLine("Vibers Unite // c0vibe.app"),
    frameLine(`${preset.note} · Vibers Unite`),
    "+------------------------------------------------------+",
  ].join("\n");
}

export function shouldShowSyncSurprises(opts: SyncSurpriseOptions = {}): boolean {
  const env = opts.env ?? process.env;
  const isTTY = opts.isTTY ?? process.stdout.isTTY;
  return Boolean(isTTY)
    && !opts.json
    && !opts.plain
    && !env.CI
    && !env.VT_NO_ANIM
    && !env.VT_NO_SURPRISES;
}

export async function showProviderScanBeat(
  input: ProviderScanBeat,
  opts: SyncSurpriseOptions & { stream?: StreamLike; delayMs?: number } = {},
): Promise<void> {
  const stream = opts.stream ?? process.stdout;
  if (!shouldShowSyncSurprises({ ...opts, isTTY: opts.isTTY ?? stream.isTTY })) return;
  const preset = providerBeatPreset(input.providerId, input.label);
  for (const line of renderProviderScanBeat(input).split("\n")) {
    stream.write(`  ${line}\n`);
    await sleep(opts.delayMs ?? 4);
  }
  await writeLiveTurntable(preset.title, preset.frames, stream, opts.delayMs);
}

export async function showSyncSurpriseQueue(
  providerIds: string[],
  opts: SyncSurpriseOptions & { stream?: StreamLike; delayMs?: number } = {},
): Promise<void> {
  const stream = opts.stream ?? process.stdout;
  if (!shouldShowSyncSurprises({ ...opts, isTTY: opts.isTTY ?? stream.isTTY })) return;
  const planned = planSyncSurprises(providerIds);
  if (!planned.length) return;
  for (const line of renderSyncIgnitionBanner(providerIds).split("\n")) {
    stream.write(`  ${line}\n`);
    await sleep(opts.delayMs ?? 4);
  }
  await writeLiveTurntable("SCAN IGNITION", ignitionFrames(providerIds), stream, opts.delayMs);
  for (const line of renderSyncSurpriseItinerary(providerIds).split("\n")) {
    stream.write(`  ${line}\n`);
    await sleep(opts.delayMs ?? 5);
  }
  for (const [index, surprise] of planned.entries()) {
    const panel = renderSyncSurprisePanel(surprise, index, planned.length);
    for (const line of panel.split("\n")) {
      stream.write(`  ${line}\n`);
      await sleep(opts.delayMs ?? 6);
    }
    await writeLiveTurntable(surprise.title, surprise.motion, stream, opts.delayMs);
    await sleep(opts.delayMs ?? 38);
  }
}

export async function showCollectionCascade(
  input: CollectionCascadeInput,
  opts: SyncSurpriseOptions & { stream?: StreamLike; delayMs?: number } = {},
): Promise<void> {
  const stream = opts.stream ?? process.stdout;
  if (!shouldShowSyncSurprises({ ...opts, isTTY: opts.isTTY ?? stream.isTTY })) return;
  for (const line of renderCollectionCascade(input).split("\n")) {
    stream.write(`  ${line}\n`);
    await sleep(opts.delayMs ?? 4);
  }
  const replay = planSyncSurprises(input.providerIds)
    .flatMap((surprise) => surprise.motion.slice(0, 1))
    .slice(0, 4);
  await writeLiveTurntable("COLLECTION CASCADE", replay, stream, opts.delayMs);
}

export async function showCollectionCheckpoint(
  input: CollectionCheckpoint,
  opts: SyncSurpriseOptions & { stream?: StreamLike; delayMs?: number } = {},
): Promise<void> {
  const stream = opts.stream ?? process.stdout;
  if (!shouldShowSyncSurprises({ ...opts, isTTY: opts.isTTY ?? stream.isTTY })) return;
  for (const line of renderCollectionCheckpoint(input).split("\n")) {
    stream.write(`  ${line}\n`);
    await sleep(opts.delayMs ?? 5);
  }
  const preset = providerBeatPreset(input.providerId, input.label);
  await writeLiveTurntable(`${preset.title} CHECKPOINT`, preset.frames, stream, opts.delayMs);
}

export async function showCollectionEncoreRecap(
  input: CollectionEncoreRecapInput,
  opts: SyncSurpriseOptions & { stream?: StreamLike; delayMs?: number } = {},
): Promise<void> {
  const stream = opts.stream ?? process.stdout;
  if (!shouldShowSyncSurprises({ ...opts, isTTY: opts.isTTY ?? stream.isTTY })) return;
  for (const line of renderCollectionEncoreRecap(input).split("\n")) {
    stream.write(`  ${line}\n`);
    await sleep(opts.delayMs ?? 5);
  }
  const rows = recapRows(input);
  const replay: string[][] = [];
  for (const row of rows.slice(0, 4)) {
    const frame = providerBeatPreset(row.providerId, row.label).frames[0];
    if (frame) replay.push(frame);
  }
  await writeLiveTurntable("COLLECTION ENCORE RECAP", replay, stream, opts.delayMs);
}
