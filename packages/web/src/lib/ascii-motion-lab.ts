import { PROVIDERS } from "../../../adapters/src/registry.ts";
import { providerBrand } from "./provider-brand.ts";

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

export interface AsciiMotionReference {
  id: string;
  label: string;
  project: string;
  author: string;
  license: string;
  url: string;
  cue: string;
  note: string;
  guardrail: string;
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
    command: "vibetracker motion --preflight",
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
    command: "vibetracker trust higgsfield --mcp",
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
    command: "vibetracker scan local-ai --dry-run",
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
    command: "vibetracker scan regional --capabilities",
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
    command: "vibetracker upload --dry-run",
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
    command: "vibetracker profile --relay c0vibe.app",
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

const references: AsciiMotionReference[] = [
  {
    id: "ascii-motion",
    label: "Layered ASCII studio",
    project: "ASCII Motion",
    author: "Cameron Foxly",
    license: "MIT repo",
    url: "https://github.com/CameronFoxly/Ascii-Motion",
    cue: "motion editor",
    note: "ASCII Motion inspired the state-machine frame direction for authored provider reveals.",
    guardrail: "Reference only; VibeTRACKER owns its tiny runtime frames and does not bundle the editor.",
  },
  {
    id: "rune",
    label: "React ASCII animation",
    project: "Rune",
    author: "Zeke John",
    license: "MIT",
    url: "https://github.com/zeke-john/rune",
    cue: "browser frames",
    note: "Rune reinforced the browser-native ASCII animation path for GUI surfaces.",
    guardrail: "Reference only; no generated video frames are treated as usage evidence.",
  },
  {
    id: "ascii-morph",
    label: "Morphing ASCII frames",
    project: "AsciiMorph",
    author: "Tim Holman",
    license: "MIT",
    url: "https://github.com/tholman/ascii-morph",
    cue: "morph frames",
    note: "AsciiMorph informed the compact transition language for small logo turns.",
    guardrail: "Reference only; morph effects are feedback, not source records.",
  },
  {
    id: "xterm",
    label: "Browser terminal core",
    project: "xterm.js",
    author: "xterm.js maintainers",
    license: "MIT",
    url: "https://github.com/xtermjs/xterm.js",
    cue: "terminal core",
    note: "xterm.js remains the heavier option for future real terminal embedding.",
    guardrail: "Reference only in this UI slice; no pseudo-shell is pretending to run commands.",
  },
  {
    id: "asciinema-player",
    label: "Replayable terminal casts",
    project: "asciinema-player",
    author: "Marcin Kulik",
    license: "Apache-2.0",
    url: "https://github.com/asciinema/asciinema-player",
    cue: "session replay",
    note: "asciinema-player informed the idea of replayable scan transcripts.",
    guardrail: "Reference only; VibeTRACKER dry-run review remains local and explicit.",
  },
  {
    id: "vhs",
    label: "Scripted demo rail",
    project: "Charm VHS",
    author: "Charmbracelet",
    license: "MIT",
    url: "https://github.com/charmbracelet/vhs",
    cue: "demo as code",
    note: "VHS inspired the repeatable terminal-tour discipline for demos and docs.",
    guardrail: "Reference only; VibeTRACKER does not bundle a recorder or upload videos.",
  },
  {
    id: "durdraw",
    label: "Linux ANSI studio",
    project: "Durdraw",
    author: "cmang",
    license: "BSD-3-Clause",
    url: "https://github.com/cmang/durdraw",
    cue: "frame editor",
    note: "Durdraw inspired the frame-based ANSI/Unicode art bench for provider reels.",
    guardrail: "Reference only; no terminal art file is treated as usage proof.",
  },
  {
    id: "termdot",
    label: "Braille dot canvas",
    project: "termdot",
    author: "Ahmad Awais",
    license: "Apache-2.0",
    url: "https://github.com/ahmadawais/termdot",
    cue: "2x4 dot grid",
    note: "termdot reinforces the dense braille-field direction for scan textures.",
    guardrail: "Reference only; scan texture is decorative and never moves totals.",
  },
  {
    id: "asciimatics",
    label: "Full-screen TUI motion",
    project: "Asciimatics",
    author: "Peter Brittain",
    license: "Apache-2.0",
    url: "https://github.com/peterbrittain/asciimatics",
    cue: "TUI scenes",
    note: "Asciimatics informs the idea of full-screen terminal scenes and states.",
    guardrail: "Reference only; no Python runtime is required for the web app.",
  },
  {
    id: "terminaltexteffects",
    label: "Terminal text effects engine",
    project: "TerminalTextEffects",
    author: "ChrisBuilds",
    license: "MIT",
    url: "https://github.com/ChrisBuilds/terminaltexteffects",
    cue: "text effects",
    note: "TerminalTextEffects is a modern terminal visual-effects engine; its decrypt, beam, and VHS-style effects are strong inspiration for future scan text reveals.",
    guardrail: "Reference only; the web app ships authored CSS/ASCII frames and does not require a Python effects runtime.",
  },
  {
    id: "notcurses",
    label: "Blingful Unicode TUI graphics",
    project: "Notcurses",
    author: "Nick Black and contributors",
    license: "Apache-2.0",
    url: "https://github.com/dankamongmen/notcurses",
    cue: "native TUI graphics",
    note: "Notcurses shows how far modern terminals can push Unicode, 24-bit color, multimedia, and high-performance TUI scenes.",
    guardrail: "Reference only; native TUI libraries are not bundled into the web app and cannot create usage evidence.",
  },
  {
    id: "chafa",
    label: "ANSI/Unicode media previews",
    project: "Chafa",
    author: "H.P. Jansson and contributors",
    license: "LGPL-3.0-or-later",
    url: "https://github.com/hpjansson/chafa",
    cue: "image to terminal",
    note: "Chafa converts images and animated GIFs into ANSI/Unicode terminal graphics, useful inspiration for future local media preview rails.",
    guardrail: "Reference only; LGPL terminal graphics tooling is not bundled, and media previews never become usage proof.",
  },
  {
    id: "cmatrix",
    label: "Matrix rain discipline",
    project: "CMatrix",
    author: "Chris Allegretta, Abishek V. Ashok, and contributors",
    license: "GPL-3.0",
    url: "https://github.com/abishekvashok/cmatrix",
    cue: "terminal rain",
    note: "CMatrix is the classic Linux terminal rain reference; VibeTRACKER borrows the dense scan-read feeling, not code.",
    guardrail: "Reference only; GPL motion inspiration is not bundled and never implies usage proof.",
  },
  {
    id: "unimatrix",
    label: "Unicode rain charset",
    project: "UniMatrix",
    author: "will8211",
    license: "GPL-3.0-or-later",
    url: "https://github.com/will8211/unimatrix",
    cue: "katakana rain",
    note: "UniMatrix showed how custom Unicode character sets can make terminal motion feel specific instead of generic.",
    guardrail: "Reference only; character rain stays visual and is not copied into the bundled runtime.",
  },
  {
    id: "pipes-sh",
    label: "Linux pipe screensaver",
    project: "pipes.sh",
    author: "Pipeseroni collective",
    license: "MIT",
    url: "https://github.com/pipeseroni/pipes.sh",
    cue: "pipe paths",
    note: "pipes.sh directly inspired the provider path scanner rig and its corner-turn motion.",
    guardrail: "Reference only; VibeTRACKER ships tiny authored frames rather than shelling out to screensavers.",
  },
  {
    id: "mapscii",
    label: "Console source map",
    project: "MapSCII",
    author: "Rastapasta",
    license: "MIT",
    url: "https://github.com/rastapasta/mapscii",
    cue: "braille map",
    note: "MapSCII informed the regional source atlas: dense braille texture, console map language, and offline-friendly framing.",
    guardrail: "Reference only; VibeTRACKER does not fetch maps or store location data for this panel.",
  },
  {
    id: "cbonsai",
    label: "Terminal growth curve",
    project: "cbonsai",
    author: "John Allbritten",
    license: "GPL-3.0-or-later",
    url: "https://gitlab.com/jallbrit/cbonsai",
    cue: "live growth",
    note: "cbonsai is useful inspiration for future cumulative usage growth visuals that feel earned over time.",
    guardrail: "Reference only; GPL terminal growth code is not bundled, and usage growth remains data-derived.",
  },
  {
    id: "rbonsai",
    label: "Rust terminal growth",
    project: "rbonsai",
    author: "Robert E.",
    license: "GPL-3.0",
    url: "https://github.com/roberte777/rbonsai",
    cue: "crossterm growth",
    note: "rbonsai shows a small Rust/crossterm path for live terminal growth and screensaver-style pacing.",
    guardrail: "Reference only; future native widgets must keep data provenance separate from animation.",
  },
];

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
