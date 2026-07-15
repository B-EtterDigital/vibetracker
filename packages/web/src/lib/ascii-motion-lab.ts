import { PROVIDERS } from "../../../adapters/src/registry.ts";
import { ASCII_MOTION_REFERENCES, type AsciiMotionReference } from "./ascii-motion-references.ts";
import { providerBrand } from "./provider-brand.ts";

export type { AsciiMotionReference } from "./ascii-motion-references.ts";

export interface AsciiMotionRig {
  id: string;
  label: string;
  library: string;
  author: string;
  license: string;
  url: string;
  stage: string;
  command: string;
  note: string;
  guardrail: string;
  meter: number;
  from: string;
  to: string;
  ink: string;
  mark: string;
  frames: string[];
  glyphs: string[];
}

export interface AsciiMotionSideEffects {
  providerCalls: number;
  hiddenUploads: number;
  usageWrites: number;
  trustWrites: number;
  promptReads: number;
  outputReads: number;
  publishWrites: number;
}

export interface AsciiMotionTheatreBeat {
  id: string;
  label: string;
  providerId: string;
  rail: "boot" | "creator" | "local" | "regional" | "proof" | "relay";
  second: number;
  command: string;
  signal: string;
  boundary: string;
  surprise: string;
  metricLabel: string;
  metricValue: string;
  meter: number;
  from: string;
  to: string;
  ink: string;
  mark: string;
  frames: string[];
  checks: string[];
  sideEffects: AsciiMotionSideEffects;
}

export interface AsciiMotionLab {
  headline: string;
  terminalLines: string[];
  rigs: AsciiMotionRig[];
  theatreBeats: AsciiMotionTheatreBeat[];
  references: AsciiMotionReference[];
  credits: string[];
}

function fit(value: string | number, width: number): string {
  return String(value).padEnd(width).slice(0, width);
}

function terminalLine(value: string): string {
  return `| ${fit(value, 62)} |`;
}

function rigBrand(providerId: string) {
  const brand = providerBrand(providerId);
  return { from: brand.from, to: brand.to, ink: brand.ink, mark: brand.mark };
}

function zeroSideEffects(): AsciiMotionSideEffects {
  return {
    providerCalls: 0,
    hiddenUploads: 0,
    usageWrites: 0,
    trustWrites: 0,
    promptReads: 0,
    outputReads: 0,
    publishWrites: 0,
  };
}

const rigs: AsciiMotionRig[] = [
  {
    id: "cli-spinners",
    label: "Spinner timing rail",
    library: "cli-spinners",
    author: "Sindre Sorhus",
    license: "MIT",
    url: "https://github.com/sindresorhus/cli-spinners",
    stage: "queue",
    command: "showSyncSurpriseQueue()",
    note: "Provider scans get readable motion without hiding the command that is running.",
    guardrail: "Spinners are feedback only; accepted records decide usage.",
    meter: 96,
    ...rigBrand("codex-cli"),
    frames: ["⠋ HF queue", "⠙ CX trace", "⠹ OL local", "⠸ C0 relay"],
    glyphs: ["⠋", "⠙", "⠹", "⠸"],
  },
  {
    id: "ascii-globe",
    label: "Worldwide source field",
    library: "ascii-globe",
    author: "Jakub T. Jankiewicz",
    license: "MIT",
    url: "https://github.com/jcubic/ascii-globe",
    stage: "world",
    command: "renderSyncSurpriseQueue()",
    note: "The globe cue says global coverage without implying global upload.",
    guardrail: "Local-first scan, no network publish until dry-run review.",
    meter: 92,
    ...rigBrand("qwen"),
    frames: ["  ..::::..  ", ".::://\\\\::.", ":: VTK ::  ", "'::\\\\//::'"],
    glyphs: ["#", ".", ":", "\\"],
  },
  {
    id: "mapscii",
    label: "Braille route atlas",
    library: "MapSCII",
    author: "Rastapasta",
    license: "MIT",
    url: "https://github.com/rastapasta/mapscii",
    stage: "regional",
    command: "renderRegionalSourceField()",
    note: "Braille map motion turns Chinese, European, local, and creator rails into a navigable source atlas.",
    guardrail: "Route art is attribution-backed UI inspiration; it never sends location or provider data.",
    meter: 91,
    ...rigBrand("mistral"),
    frames: ["⣀⣀ CN  EU", "⠉⠉╭─AI─╮", "⡇  │VTK│", "⠿⠿╰─C0─╯"],
    glyphs: ["⣀", "⠉", "╭", "╰"],
  },
  {
    id: "drawille",
    label: "Braille signal field",
    library: "drawille",
    author: "Bence Danyi",
    license: "MIT",
    url: "https://github.com/madbence/node-drawille",
    stage: "signal",
    command: "brailleSignalField()",
    note: "Unicode braille gives dense scan texture in terminals and GUI panes.",
    guardrail: "Signal texture is decorative telemetry, not a usage source.",
    meter: 94,
    ...rigBrand("higgsfield"),
    frames: ["⡇⠐⡀⢀⠄", "⠠⡆⢀⠐⠂", "⡀⠄⢠⠐⡁", "⢀⡁⠂⠤⠐"],
    glyphs: ["⡇", "⢠", "⠤", "⠐"],
  },
  {
    id: "pipes-sh",
    label: "Pipe path scanner",
    library: "pipes.sh",
    author: "Pipeseroni collective",
    license: "MIT",
    url: "https://github.com/pipeseroni/pipes.sh",
    stage: "collect",
    command: "renderCollectionSurpriseCascade()",
    note: "Pipe screensaver motion becomes a provider path tracer for the scan and checkpoint rails.",
    guardrail: "Path animation is visual feedback only; accepted records and checksums decide truth.",
    meter: 93,
    ...rigBrand("ollama"),
    frames: ["╭─HF─╮", "│ CX │", "╰─OL─╯", "C0══▶"],
    glyphs: ["╭", "─", "╰", "▶"],
  },
  {
    id: "turntable",
    label: "Provider logo turntable",
    library: "VibeTRACKER custom",
    author: "B-EtterDigital",
    license: "MIT",
    url: "https://github.com/B-EtterDigital/vibetracker",
    stage: "encore",
    command: "renderProviderScanBeat()",
    note: "Higgsfield, Codex, local AI, and C0VIBE marks rotate in branded colors.",
    guardrail: "Logo motion repeats the trust boundary instead of dressing it up.",
    meter: 98,
    ...rigBrand("c0vibe"),
    frames: [" /HF\\  <CX>", " -HF-  {git}", " \\HF/  C0V", " <==>  APP"],
    glyphs: ["HF", "CX", "OL", "C0"],
  },
];

const theatreBeats: AsciiMotionTheatreBeat[] = [
  {
    id: "codex-diff-cube",
    label: "Codex diff cube",
    providerId: "codex-cli",
    rail: "boot",
    second: 3,
    command: "npx vibetrack surprises --static",
    signal: "The terminal warms the GUI with a diff cube before any account scan starts.",
    boundary: "Local-only preflight; no prompt or output content is read.",
    surprise: "CX cube tilt",
    metricLabel: "side effects",
    metricValue: "0",
    meter: 96,
    ...rigBrand("codex-cli"),
    frames: ["┌CX┐", "╱CX╲", "└CX┘", "C0→GUI"],
    checks: ["local-only", "no usage write", "no prompt read"],
    sideEffects: zeroSideEffects(),
  },
  {
    id: "higgsfield-prism",
    label: "Higgsfield prism",
    providerId: "higgsfield",
    rail: "creator",
    second: 12,
    command: "npx vibetrack trust list",
    signal: "Authenticated Higgsfield MCP appears as creator trust context, not usage.",
    boundary: "Trust signal only, not usage, until a user approves usage records.",
    surprise: "HF prism turn",
    metricLabel: "usage writes",
    metricValue: "0",
    meter: 98,
    ...rigBrand("higgsfield"),
    frames: [" /HF\\ ", "< HF >", " \\HF/ ", " HF◆C0"],
    checks: ["trust rail", "not usage", "mcp labelled"],
    sideEffects: zeroSideEffects(),
  },
  {
    id: "local-sonar",
    label: "Local AI sonar",
    providerId: "ollama",
    rail: "local",
    second: 21,
    command: "npx vibetrack detect",
    signal: "Ollama, LM Studio, and ComfyUI pings stay inside the local scan room.",
    boundary: "Dry-run preview only; local ledgers do not leave the machine.",
    surprise: "OL sonar bloom",
    metricLabel: "hidden uploads",
    metricValue: "0",
    meter: 95,
    ...rigBrand("ollama"),
    frames: ["  OL  ", "((OL))", "⟪OL⟫", "OL::LM"],
    checks: ["local rail", "dry run", "no upload"],
    sideEffects: zeroSideEffects(),
  },
  {
    id: "regional-source-map",
    label: "Regional source map",
    providerId: "qwen",
    rail: "regional",
    second: 31,
    command: "npx vibetrack providers --all",
    signal: "Chinese, European, and open-compatible providers line up as a coverage map.",
    boundary: "Capability freshness is visual context, not an account call.",
    surprise: "world map snap",
    metricLabel: "provider calls",
    metricValue: "0",
    meter: 92,
    ...rigBrand("qwen"),
    frames: ["CN⟷EU", "QW MI", "深  EU", "AI MAP"],
    checks: ["capability only", "no account call", "regions labelled"],
    sideEffects: zeroSideEffects(),
  },
  {
    id: "proof-vault",
    label: "Proof vault",
    providerId: "github-actions",
    rail: "proof",
    second: 44,
    command: "npx vibetrack upload --dry-run",
    signal: "Receipts are rehearsed like a black-box replay before anything is published.",
    boundary: "Dry-run review exposes every field that could leave the device.",
    surprise: "receipt lock",
    metricLabel: "publish writes",
    metricValue: "0",
    meter: 97,
    ...rigBrand("github-actions"),
    frames: ["[GH]", "{SHA}", "LOCK", "0 WR"],
    checks: ["field review", "hash receipt", "no publish"],
    sideEffects: zeroSideEffects(),
  },
  {
    id: "vibers-unite-relay",
    label: "Vibers Unite relay",
    providerId: "c0vibe",
    rail: "relay",
    second: 58,
    command: "npx vibetrack profile",
    signal: "The public profile relay lights up only after the user approves a publish.",
    boundary: "C0vibe.app is the destination label, not a hidden sync.",
    surprise: "C0 unite flash",
    metricLabel: "prompt reads",
    metricValue: "0",
    meter: 99,
    ...rigBrand("c0vibe"),
    frames: ["C0", "VIBE", "UNITE", "APP"],
    checks: ["explicit publish", "profile only", "Vibers Unite"],
    sideEffects: zeroSideEffects(),
  },
];

const references = ASCII_MOTION_REFERENCES;

export function buildAsciiMotionLab(): AsciiMotionLab {
  const built = PROVIDERS.filter((provider) => provider.status === "built").length;
  const local = PROVIDERS.filter((provider) => provider.tier === "local" || provider.auth === "localLogs").length;
  const creator = PROVIDERS.filter((provider) =>
    provider.categories.some((category) => ["image", "video", "audio", "music", "3d"].includes(category))
  ).length;
  return {
    headline: "ASCII MOTION LAB",
    terminalLines: [
      "+----------------------------------------------------------------+",
      terminalLine("VTK://ASCII-MOTION-LAB//OSS-CREDITS//VIBERS-UNITE"),
      "|----------------------------------------------------------------|",
      terminalLine(`rigs ${fit(rigs.length, 4)} providers ${fit(PROVIDERS.length, 5)} built ${fit(built, 5)} local ${fit(local, 5)}`),
      terminalLine(`creator rails ${fit(creator, 5)} motto Vibers Unite // C0VIBE.APP`),
      terminalLine(`theatre beats ${fit(theatreBeats.length, 3)} CLI HF local map proof relay`),
      terminalLine("effects: spinner globe MapSCII drawille pipes turntable"),
      terminalLine(`reference bench ${references.length}: ASCII Motion Rune AsciiMorph xterm`),
      terminalLine("native bench: TerminalTextEffects Notcurses Chafa"),
      terminalLine("linux bench: pipes MapSCII cmatrix unimatrix cbonsai rbonsai"),
      terminalLine("replay bench: asciinema VHS Durdraw termdot Asciimatics"),
      terminalLine("trust/builder/social context remains labelled NOT USAGE"),
      "+----------------------------------------------------------------+",
    ],
    rigs,
    theatreBeats,
    references,
    credits: rigs.map((rig) => `${rig.library} by ${rig.author} (${rig.license}) - ${rig.url}`),
  };
}
