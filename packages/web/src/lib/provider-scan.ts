import type { ProviderDescriptor, Tier } from "../../../adapters/src/registry";
import { providerBrand } from "./provider-brand.ts";

export interface ProviderScanChip {
  id: string;
  label: string;
  status: ProviderDescriptor["status"];
  tier: Tier;
  verified: boolean;
}

export interface ProviderScanLane {
  id: "verified-ledger" | "creator-studio" | "local-lab" | "regional-cloud" | "manual-ledger";
  call: string;
  label: string;
  note: string;
  count: number;
  built: number;
  verified: number;
  providers: ProviderScanChip[];
}

export interface ProviderScanTheatreScene {
  id: "higgsfield-field" | "codex-orbit" | "local-lab-array" | "c0vibe-relay";
  providerIds: string[];
  label: string;
  call: string;
  badge: string;
  copy: string;
  meter: number;
  status: string;
  ascii: string[];
  foot: string[];
}

export type ProviderPassportTone = "verified" | "built" | "local" | "manual" | "planned";
export type ProviderPassportImpact = "usage" | "local_only" | "manual" | "planned";

export interface ProviderPassportCard {
  id: string;
  label: string;
  mark: string;
  domain: string;
  categories: string;
  status: string;
  auth: string;
  command: string;
  note: string;
  tone: ProviderPassportTone;
  impact: ProviderPassportImpact;
  meter: number;
  from: string;
  to: string;
  ink: string;
}

export interface ProviderPassportWall {
  headline: string;
  subline: string;
  terminalLines: string[];
  cards: ProviderPassportCard[];
  totals: {
    providers: number;
    verified: number;
    built: number;
    local: number;
    manual: number;
    planned: number;
  };
}

export type ProviderCollectionImpact = "usage" | "trust" | "local_only" | "manual" | "publish";

export interface ProviderCollectionMark {
  id: string;
  label: string;
  mark: string;
  from: string;
  to: string;
  ink: string;
}

export interface ProviderCollectionStep {
  id: string;
  phase: string;
  call: string;
  label: string;
  badge: string;
  command: string;
  surprise: string;
  note: string;
  guardrail: string;
  impact: ProviderCollectionImpact;
  providerIds: string[];
  marks: ProviderCollectionMark[];
  mapped: number;
  meter: number;
  from: string;
  to: string;
  ink: string;
  frames: string[];
  transcript: string[];
}

export interface ProviderCollectionConsole {
  headline: string;
  terminalLines: string[];
  steps: ProviderCollectionStep[];
  totals: Record<ProviderCollectionImpact, number>;
  mappedProviderIds: string[];
}

export interface ProviderBootSlot {
  id: string;
  sequence: number;
  phase: string;
  call: string;
  label: string;
  command: string;
  impact: ProviderCollectionImpact;
  railLabel: string;
  meter: number;
  mapped: number;
  providerRefs: number;
  marks: ProviderCollectionMark[];
  frames: string[];
  bootLines: string[];
  checksum: string;
  guardrail: string;
  visualOnly: true;
  providerCalls: false;
  ledgerWrites: false;
  hiddenUpload: false;
  secretExport: false;
}

export interface ProviderBootSequence {
  headline: string;
  subline: string;
  terminalLines: string[];
  totals: {
    slots: number;
    mappedProviderRefs: number;
    usage: number;
    notUsage: number;
    localOnly: number;
    manual: number;
    publish: number;
    providerCalls: number;
    ledgerWrites: number;
    hiddenUpload: number;
  };
  slots: ProviderBootSlot[];
}

export interface ProviderSignalMarqueeRail {
  id: "creator-signal" | "local-signal" | "regional-signal" | "builder-signal" | "manual-signal" | "c0vibe-signal";
  call: string;
  label: string;
  command: string;
  impact: ProviderCollectionImpact;
  railLabel: string;
  guardrail: string;
  providerIds: string[];
  mapped: number;
  built: number;
  verified: number;
  meter: number;
  marks: ProviderCollectionMark[];
  frames: string[];
  tickerLines: string[];
  checksum: string;
  from: string;
  to: string;
  ink: string;
  visualOnly: true;
  usageWrites: false;
}

export interface ProviderSignalMarquee {
  headline: string;
  subline: string;
  terminalLines: string[];
  totals: {
    rails: number;
    mappedProviderRefs: number;
    usageRails: number;
    notUsageRails: number;
    manualRails: number;
    publishRails: number;
    visualOnly: number;
    usageWrites: number;
  };
  rails: ProviderSignalMarqueeRail[];
}

export interface ProviderCollectionCommandChannel {
  id:
    | "auto-provider-usage"
    | "local-review-loop"
    | "trust-sidecar"
    | "regional-usage-mesh"
    | "manual-creator-ledger"
    | "c0vibe-publish-review";
  call: string;
  label: string;
  readPath: string;
  command: string;
  impact: ProviderCollectionImpact;
  railLabel: string;
  guardrail: string;
  surprise: string;
  providerIds: string[];
  mapped: number;
  built: number;
  verified: number;
  meter: number;
  marks: ProviderCollectionMark[];
  frames: string[];
  terminalLines: string[];
  checksum: string;
  from: string;
  to: string;
  ink: string;
  autoReadable: boolean;
  localOnly: boolean;
  trustOnly: boolean;
  manualOnly: boolean;
  publishOnly: boolean;
  visualOnly: true;
  usageWrites: false;
  providerCalls: false;
  ledgerWrites: false;
  hiddenUpload: false;
}

export interface ProviderCollectionCommandWall {
  headline: string;
  subline: string;
  terminalLines: string[];
  channels: ProviderCollectionCommandChannel[];
  totals: {
    channels: number;
    mappedProviderRefs: number;
    autoReadable: number;
    usageEligible: number;
    notUsage: number;
    localOnly: number;
    trustOnly: number;
    manualOnly: number;
    publishOnly: number;
    visualOnly: number;
    usageWrites: number;
    providerCalls: number;
    ledgerWrites: number;
    hiddenUpload: number;
  };
}

export type ProviderFreshnessImpact = "usage" | "trust" | "local_only" | "manual" | "planned" | "publish";

export interface ProviderFreshnessLane {
  id:
    | "verified-live"
    | "approx-built"
    | "local-proxy"
    | "trust-sidecar"
    | "manual-ledger"
    | "planned-next"
    | "publish-safe";
  call: string;
  label: string;
  command: string;
  impact: ProviderFreshnessImpact;
  railLabel: string;
  status: string;
  action: string;
  note: string;
  guardrail: string;
  providerIds: string[];
  mapped: number;
  providerRefs: number;
  built: number;
  verified: number;
  local: number;
  manual: number;
  planned: number;
  meter: number;
  marks: ProviderCollectionMark[];
  frames: string[];
  checkLines: string[];
  checksum: string;
  visualOnly: true;
  providerCalls: false;
  ledgerWrites: false;
  hiddenUpload: false;
}

export interface ProviderFreshnessRadar {
  headline: string;
  subline: string;
  terminalLines: string[];
  totals: {
    lanes: number;
    providers: number;
    providerRefs: number;
    built: number;
    verified: number;
    approximate: number;
    localProxy: number;
    manual: number;
    planned: number;
    usageRails: number;
    notUsageRails: number;
    manualRails: number;
    plannedRails: number;
    publishRails: number;
    providerCalls: number;
    ledgerWrites: number;
    hiddenUpload: number;
  };
  lanes: ProviderFreshnessLane[];
}

export interface ProviderSurpriseDirectorCue {
  id: string;
  gate: string;
  stage: string;
  label: string;
  command: string;
  impact: ProviderCollectionImpact;
  railLabel: string;
  timing: string;
  meter: number;
  delayMs: number;
  marks: ProviderCollectionMark[];
  frames: string[];
  trigger: string;
  operatorLine: string;
  caption: string;
  guardrail: string;
  profileEffect: string;
  visualOnly: true;
  providerCalls: false;
  ledgerWrites: false;
  hiddenUpload: false;
}

export interface ProviderSurpriseDirector {
  headline: string;
  subline: string;
  motto: string;
  terminalLines: string[];
  totals: {
    cues: number;
    usageEligible: number;
    notUsage: number;
    manual: number;
    publish: number;
    providers: number;
    visualOnly: number;
    providerCalls: number;
    ledgerWrites: number;
    hiddenUpload: number;
  };
  cues: ProviderSurpriseDirectorCue[];
}

export type ProviderWorldImpact = "usage" | "trust" | "local_only" | "manual" | "publish";

export type ProviderWorldMark = ProviderCollectionMark;

export interface ProviderWorldZone {
  id: "creator-world" | "china-cloud" | "europe-cloud" | "local-lab" | "builder-stack" | "c0vibe-relay";
  call: string;
  label: string;
  region: string;
  impact: ProviderWorldImpact;
  command: string;
  note: string;
  guardrail: string;
  providerIds: string[];
  mapped: number;
  built: number;
  verified: number;
  local: number;
  manual: number;
  planned: number;
  meter: number;
  marks: ProviderWorldMark[];
  frames: string[];
  terminalLines: string[];
}

export interface ProviderWorldCoverageMap {
  headline: string;
  subline: string;
  terminalLines: string[];
  zones: ProviderWorldZone[];
  totals: {
    zones: number;
    providerRefs: number;
    mapped: number;
    built: number;
    verified: number;
    local: number;
    manual: number;
    planned: number;
    trustRails: number;
    publishRails: number;
  };
}

interface LaneDef {
  id: ProviderScanLane["id"];
  call: string;
  label: string;
  note: string;
  preferred: string[];
  match(provider: ProviderDescriptor): boolean;
}

const CREATOR_CATEGORIES = new Set(["image", "video", "audio", "music", "3d"]);
const REGIONAL_IDS = new Set([
  "qwen",
  "doubao",
  "kimi",
  "deepseek",
  "mistral",
  "perplexity",
  "aleph-alpha",
  "lighton",
  "baidu-wenxin",
  "tencent-hunyuan",
  "iflytek-spark",
  "zhipu",
  "sarvam",
  "upstage",
  "naver-hyperclova",
  "sakana",
]);

const LANES: LaneDef[] = [
  {
    id: "verified-ledger",
    call: "VERIFY",
    label: "Endpoint proof",
    note: "Live or endpoint-backed adapters get the first sweep; green still means evidence, not hype.",
    preferred: ["higgsfield", "replicate", "falai", "runway", "claude-code", "devin"],
    match: (provider) => provider.status === "built" && provider.verified,
  },
  {
    id: "creator-studio",
    call: "CREATE",
    label: "Creator studio",
    note: "Image, video, audio, music, and 3D tools sit beside coding instead of behind it.",
    preferred: ["higgsfield", "runway", "replicate", "falai", "suno", "udio", "comfyui", "midjourney"],
    match: (provider) => provider.categories.some((category) => CREATOR_CATEGORIES.has(category)),
  },
  {
    id: "local-lab",
    call: "LOCAL",
    label: "Local AI lab",
    note: "Ollama, LM Studio, ComfyUI, and local proxies are surfaced as local-first signals.",
    preferred: ["ollama", "lmstudio", "comfyui", "automatic1111", "invokeai", "vllm", "llama-cpp"],
    match: (provider) => provider.tier === "local" || provider.tier === "proxy" || provider.auth === "localLogs",
  },
  {
    id: "regional-cloud",
    call: "GLOBAL",
    label: "Regional cloud",
    note: "Chinese, European, Indian, Korean, and Japanese providers are mapped with their own rail.",
    preferred: ["qwen", "doubao", "kimi", "mistral", "aleph-alpha", "lighton", "deepseek", "sarvam"],
    match: (provider) => REGIONAL_IDS.has(provider.id),
  },
  {
    id: "manual-ledger",
    call: "LEDGER",
    label: "Manual/subscription",
    note: "Flat plans and closed products remain useful, but they stay labelled as manual evidence.",
    preferred: ["midjourney", "canva", "capcut", "adobe-cc", "poe", "notion-ai", "topaz"],
    match: (provider) => provider.tier === "manual" || provider.status === "manual-only",
  },
];

const THEATRE = [
  {
    id: "higgsfield-field",
    providerIds: ["higgsfield"],
    label: "Higgsfield field",
    call: "HF TURN",
    badge: "creator proof",
    copy: "A creator-first scan beat for image, video, audio, and 3D usage. When Higgsfield is authenticated, it reads as provider evidence, not decoration.",
    ascii: [
      "  .----HF----.  ",
      " /  /\\    /\\  \\ ",
      "|  /__\\  /__\\  |",
      "|  \\  /  \\  /  |",
      " \\  \\/    \\/  / ",
      "  '----<>----'  ",
    ],
  },
  {
    id: "codex-orbit",
    providerIds: ["codex-cli", "claude-code", "github"],
    label: "CLI orbit",
    call: "CX LOOP",
    badge: "coding evidence",
    copy: "Codex, Claude Code, GitHub CLI, and adjacent dev tools get a terminal-grade sweep while trust activity stays separate from usage totals.",
    ascii: [
      "   +---CX---+   ",
      "  /  commit  \\  ",
      " |  { }=>AI  | ",
      " |  log=>use | ",
      "  \\  proof  /  ",
      "   +---GH---+   ",
    ],
  },
  {
    id: "local-lab-array",
    providerIds: ["ollama", "lmstudio", "comfyui"],
    label: "Local lab array",
    call: "LAN PING",
    badge: "local-first",
    copy: "Ollama, LM Studio, ComfyUI, and local proxies stay on the machine first, then publish only aggregate usage when the user chooses.",
    ascii: [
      " [OL]--127.0.0.1",
      "   |\\           ",
      " [LM]--/v1/models",
      "   |/           ",
      " [CU]--workflow ",
      "  local ledger  ",
    ],
  },
  {
    id: "c0vibe-relay",
    providerIds: ["openai", "replicate", "qwen", "mistral"],
    label: "C0VIBE relay",
    call: "UNITE",
    badge: "publish rail",
    copy: "The scan resolves into a shareable C0VIBE profile only after redaction, trust-tier labelling, and explicit upload.",
    ascii: [
      " VIBERS UNITE   ",
      "   C0VIBE.APP   ",
      "  /usage/proof  ",
      " /trust/not-use ",
      " +--local--api+ ",
      "    publish?    ",
    ],
  },
] as const;

interface ProviderCollectionStepDef {
  id: string;
  phase: string;
  call: string;
  label: string;
  badge: string;
  command: string;
  surprise: string;
  note: string;
  guardrail: string;
  impact: ProviderCollectionImpact;
  providerIds: string[];
  frames: string[];
  transcript: string[];
}

const COLLECTION_SEQUENCE: ProviderCollectionStepDef[] = [
  {
    id: "higgsfield-prism",
    phase: "01/06 QUEUE",
    call: "HF TURN",
    label: "Higgsfield prism",
    badge: "creator usage",
    command: "npx vibetrack connect higgsfield",
    surprise: "The HF mark turns on the first MCP balance ping, then waits for validated ledger rows.",
    note: "MCP-ready creator usage for image, video, audio, and 3D.",
    guardrail: "Usage only after validated records.",
    impact: "usage",
    providerIds: ["higgsfield"],
    frames: [
      "  .--HF--.  \n / /\\  /\\ \\ \n| |  HF  | |\n \\ \\/  \\/ / \n  '--<>--'  ",
      "  .--HF--.  \n /  <>    \\ \n|  /HF\\   |\n \\  \\/   / \n  '--<>--'  ",
      "  .--HF--.  \n / \\/  \\/ \\ \n| |  HF  | |\n \\ /\\  /\\ / \n  '--<>--'  ",
      "  .--HF--.  \n /   /\\   \\ \n|   HF\\   |\n \\   <>  / \n  '--<>--'  ",
    ],
    transcript: [
      "mcp scope: credits + media",
      "status: provider evidence",
      "surprise: HF turntable",
    ],
  },
  {
    id: "codex-trust-cube",
    phase: "02/06 TRUST",
    call: "CX CUBE",
    label: "Codex/GitHub orbit",
    badge: "trust signal",
    command: "npx vibetrack trust list",
    surprise: "The Codex cube appears after local dev traces, but it is stamped NOT USAGE.",
    note: "Commit cadence, CLI sessions, and contributor proof help profile trust without changing spend.",
    guardrail: "Trust/social context is NOT USAGE.",
    impact: "trust",
    providerIds: ["codex-cli", "claude-code", "github"],
    frames: [
      " +---CX---+ \n | { } -> |\n | diff[] |\n +---GH---+ ",
      " /---CX---\\ \n | log=>AI|\n | commit |\n \\---GH---/ ",
      " <---CX---> \n | review |\n | trust  |\n <---GH---> ",
      " +---CX---+ \n | NOT USE|\n | GH/CODE|\n +---GH---+ ",
    ],
    transcript: [
      "scan: local CLI traces",
      "github: cadence signal",
      "label: NOT USAGE",
    ],
  },
  {
    id: "local-sonar",
    phase: "03/06 LOCAL",
    call: "LAN PING",
    label: "Local lab sonar",
    badge: "local only",
    command: "npx vibetrack detect",
    surprise: "Ollama, LM Studio, and ComfyUI pulse as a loopback sonar before anything can publish.",
    note: "Local runners stay on-machine first, with reviewed aggregate upload later.",
    guardrail: "Local-only until reviewed publish.",
    impact: "local_only",
    providerIds: ["ollama", "lmstudio", "comfyui"],
    frames: [
      " [OL]~~~~    \n    \\        \n [LM]~127.0.0\n    /        \n [CU]~~~~    ",
      "    ~~~~[OL] \n       \\     \n127.0.0~[LM] \n       /     \n    ~~~~[CU] ",
      " [OL]--+     \n       |     \n [LM]--+--VTK\n       |     \n [CU]--+     ",
      " LOCAL ONLY  \n [OL][LM][CU]\n  review gate\n aggregate?  \n  publish no ",
    ],
    transcript: [
      "ports: loopback probe",
      "logs: on-machine first",
      "upload: opt-in aggregate",
    ],
  },
  {
    id: "regional-mesh",
    phase: "04/06 GLOBAL",
    call: "MESH",
    label: "Regional mesh",
    badge: "global adapters",
    command: "npx vibetrack providers --all",
    surprise: "Chinese and European provider marks light as their own mesh instead of being hidden under generic LLM.",
    note: "Regional billing, balance, proxy, and manual paths keep their confidence labels.",
    guardrail: "Built approximate stays labelled.",
    impact: "usage",
    providerIds: ["qwen", "doubao", "mistral", "aleph-alpha"],
    frames: [
      " QW ---- DB  \n  \\      /   \n   \\ MI /    \n    \\  /     \n     AA      ",
      " QW ==== DB  \n  ||    ||   \n  MI == AA   \n  ||    ||   \n GLOBAL MESH ",
      " [QW][DB]    \n    [MI]     \n [AA][LO]    \n region lane \n confidence  ",
      " API BALANCE \n proxy/manual\n built approx\n labels stay \n visible     ",
    ],
    transcript: [
      "region: CN/EU/IN/KR/JP",
      "confidence: visible",
      "generic LLM: no",
    ],
  },
  {
    id: "creator-ledger",
    phase: "05/06 LEDGER",
    call: "MANUAL",
    label: "Creator ledger",
    badge: "manual evidence",
    command: "npx vibetrack import midjourney --images <lifetime-images> --usd <lifetime-spend>",
    surprise: "Closed creator tools get their own ledger flash so subscription context is useful without fake API proof.",
    note: "Manual and subscription evidence can enrich reports while staying separate from verified provider usage.",
    guardrail: "Manual is never fake API usage.",
    impact: "manual",
    providerIds: ["midjourney", "canva", "adobe-cc", "capcut"],
    frames: [
      " MJ | CA | AD\n ----LEDGER-\n CP | NOTE  \n manual in  \n fake api no ",
      " +SUBSCRIPT+\n | MJ  CA  |\n | AD  CP  |\n +MANUAL---+",
      " receipt -> \n project -> \n ledger  -> \n report  -> \n label      ",
      " MANUAL PATH\n confidence \n visible    \n no greenwash\n no fake API ",
    ],
    transcript: [
      "entry: subscription/receipt",
      "confidence: manual",
      "adapter: not claimed",
    ],
  },
  {
    id: "c0vibe-unite-relay",
    phase: "06/06 PUBLISH",
    call: "UNITE",
    label: "C0VIBE relay",
    badge: "publish rail",
    command: "npx vibetrack upload --dry-run && npx vibetrack upload",
    surprise: "The last flash is the motto: Vibers Unite. The profile updates only after redaction and consent.",
    note: "C0VIBE gets the reviewed aggregate stream, not raw local secrets.",
    guardrail: "Publish is opt-in and redacted.",
    impact: "publish",
    providerIds: ["c0vibe"],
    frames: [
      " VIBERS     \n   UNITE    \n C0VIBE.APP \n review gate\n publish?   ",
      " usage ---> \n trust -x-> \n local -?-> \n redact     \n C0 relay   ",
      " C0VIBE.APP \n public card\n score feed \n proof rail \n no secrets ",
      " VIBERS     \n WORLDWIDE  \n UNITE      \n c0vibe.app \n online     ",
    ],
    transcript: [
      "dry-run: redaction review",
      "stream: aggregate records",
      "motto: Vibers Unite",
    ],
  },
];

interface ProviderWorldZoneDef {
  id: ProviderWorldZone["id"];
  call: string;
  label: string;
  region: string;
  impact: ProviderWorldImpact;
  command: string;
  note: string;
  guardrail: string;
  providerIds: string[];
  frames: string[];
}

const WORLD_ZONES: ProviderWorldZoneDef[] = [
  {
    id: "creator-world",
    call: "CREATE",
    label: "Creator world",
    region: "media + studio",
    impact: "usage",
    command: "npx vibetrack providers --domain creative",
    note: "Image, video, voice, music, 3D, and subscription tools stay visible beside coding usage.",
    guardrail: "Creator usage is counted only from validated records or clearly labelled manual entries.",
    providerIds: ["higgsfield", "runway", "falai", "replicate", "elevenlabs", "suno", "udio", "midjourney", "canva", "adobe-firefly", "stability", "krea"],
    frames: [
      "IMG VID AUD\n HF RW FA \n 11 SU UD ",
      "3D VOICE FX\n MJ CA AD \n creator ",
      "ledger/API\n manual ok\n fake no ",
      "Vibers\nCreate\nUnite ",
    ],
  },
  {
    id: "china-cloud",
    call: "CN MESH",
    label: "Chinese AI mesh",
    region: "China + CN ecosystem",
    impact: "usage",
    command: "npx vibetrack providers --all",
    note: "Qwen, Doubao, Kimi, DeepSeek, GLM, and adjacent Chinese providers get their own visible rail.",
    guardrail: "Regional providers keep confidence labels; planned means mapped, not secretly built.",
    providerIds: ["qwen", "doubao", "kimi", "deepseek", "zai", "glm", "baidu-wenxin", "tencent-hunyuan", "iflytek-spark", "zhipu", "baichuan", "01ai", "stepfun", "siliconflow", "modelscope", "wan", "dreamina", "minimax", "vidu"],
    frames: [
      "QW--DB--KM\n \\  DS  / \n  CN MESH ",
      "GLM ZAI BA\n TC IF ZP \n regional",
      "WAN VIDU\nDREAMINA\n creator",
      "label API\nproxy man\n no blur",
    ],
  },
  {
    id: "europe-cloud",
    call: "EU RAIL",
    label: "European cloud",
    region: "Europe + EU labs",
    impact: "usage",
    command: "npx vibetrack providers --all",
    note: "European and nearby global labs get a distinct coverage rail instead of becoming generic LLM rows.",
    guardrail: "Built, approximate, manual, and planned states stay separate.",
    providerIds: ["mistral", "aleph-alpha", "lighton", "stability", "black-forest-labs", "recraft", "poolside", "elevenlabs"],
    frames: [
      "MI--AA--LO\n EU RAIL  \n labels   ",
      "ST BLK RC\n image lab\n creator ",
      "poolside\n code lab\n trust?  ",
      "built/pln\nvisible  \n no green",
    ],
  },
  {
    id: "local-lab",
    call: "127.0.0",
    label: "Local AI lab",
    region: "on-machine",
    impact: "local_only",
    command: "npx vibetrack detect",
    note: "Ollama, LM Studio, ComfyUI, web UIs, and local inference servers show up before upload exists.",
    guardrail: "Local-only until the user reviews and uploads aggregates.",
    providerIds: ["ollama", "lmstudio", "jan", "gpt4all", "llama-cpp", "vllm", "text-generation-webui", "comfyui", "automatic1111", "forge", "invokeai", "fooocus", "diffusers-local"],
    frames: [
      "OL LM JAN\n127.0.0.1\n local  ",
      "CU A1111\nforge inv\n image  ",
      "vLLM CPP\nwebui gpt\n local  ",
      "NO UPLOAD\nreview ->\n later  ",
    ],
  },
  {
    id: "builder-stack",
    call: "BUILD",
    label: "Builder stack",
    region: "coding agents",
    impact: "trust",
    command: "npx vibetrack trust list",
    note: "Codex, Claude Code, GitHub, IDE agents, and app builders strengthen trust without changing spend.",
    guardrail: "Builder and social evidence is NOT USAGE.",
    providerIds: ["claude-code", "devin", "cursor", "antigravity", "opencode", "gemini-cli", "codex-cli", "copilot", "windsurf", "continue", "aider", "sourcegraph-cody", "jetbrains-ai", "replit-agent", "v0", "bolt", "lovable", "augment", "roo-code", "cline", "github-actions"],
    frames: [
      "CX CC GH\n commit \n trust  ",
      "AG AU RC\n IDE AI \n build  ",
      "v0 bolt\nlovable\n apps  ",
      "NOT USE\nside rail\n proof ",
    ],
  },
  {
    id: "c0vibe-relay",
    call: "UNITE",
    label: "C0VIBE relay",
    region: "publish review",
    impact: "publish",
    command: "npx vibetrack upload --dry-run",
    note: "All lanes resolve into c0vibe.app only after dry-run review, redaction, and user approval.",
    guardrail: "Publish is opt-in aggregate data, never raw prompts, secrets, or generated output.",
    providerIds: ["c0vibe", "supabase", "github-actions"],
    frames: [
      "VIBERS\nUNITE \nC0VIBE",
      "dry-run\nreview \nredact ",
      "score ->\nprofile\npublic ",
      "c0vibe\n .app  \n live  ",
    ],
  },
];

interface ProviderSignalMarqueeRailDef {
  id: ProviderSignalMarqueeRail["id"];
  call: string;
  label: string;
  command: string;
  impact: ProviderCollectionImpact;
  guardrail: string;
  providerIds: string[];
  frames: string[];
}

const SIGNAL_MARQUEE_RAILS: ProviderSignalMarqueeRailDef[] = [
  {
    id: "creator-signal",
    call: "HF TURN",
    label: "Creator tools",
    command: "npx vibetrack providers --domain creative",
    impact: "usage",
    guardrail: "Usage only after validated provider or ledger records.",
    providerIds: ["higgsfield", "runway", "falai", "replicate", "suno", "udio"],
    frames: [
      " .--HF--. \n/<>    <>\\\n|  media |\n\\  sync /\n '--<>--' ",
      " [RW][FA]\n    ||   \n [RP][HF]\n  media  \n ledger  ",
      " SU -> UD\n audio in\n music in\n usage?  \n validate",
      "CREATORS\n  UNITE \n HF/RW/FA\n proof   \n no blur ",
    ],
  },
  {
    id: "local-signal",
    call: "127.0.0",
    label: "Local lab",
    command: "npx vibetrack detect",
    impact: "local_only",
    guardrail: "Local-only until reviewed aggregate publish.",
    providerIds: ["ollama", "lmstudio", "comfyui", "vllm", "llama-cpp", "automatic1111"],
    frames: [
      "OL ~~ LM \n   127   \nCU ~~ GPU\n local   \n review  ",
      "vLLM CPP\n  proxy  \n tokens  \n $0 cost \n loopback",
      "COMFY UI\n workflow\n history \n no cloud\n first   ",
      "NOT USE \n LOCAL   \n upload? \n later   \n consent ",
    ],
  },
  {
    id: "regional-signal",
    call: "CN/EU",
    label: "Regional mesh",
    command: "npx vibetrack providers --all",
    impact: "usage",
    guardrail: "Regional usage keeps confidence labels visible.",
    providerIds: ["qwen", "doubao", "kimi", "mistral", "aleph-alpha", "lighton"],
    frames: [
      "QW==DB==KM\n  CN MESH \n balances ",
      "MI--AA--LO\n  EU RAIL \n usage API",
      "CN / EU  \nnot generic\nLLM row   ",
      "labels   \nbuilt/pln \nmanual ok ",
    ],
  },
  {
    id: "builder-signal",
    call: "CX/GH",
    label: "Builder proof",
    command: "npx vibetrack trust list",
    impact: "trust",
    guardrail: "Coding and social proof is NOT USAGE.",
    providerIds: ["codex-cli", "claude-code", "github", "antigravity", "augment", "roo-code"],
    frames: [
      "+--CX--+\n| diff |\n| logs |\n+--GH--+",
      "CC -> GH\ncommit  \n cadence \n trust   ",
      "AG AU RC\nIDE AI  \n build   \n proof   ",
      "NOT USE \ntrust rail\nscore ctx\nno spend ",
    ],
  },
  {
    id: "manual-signal",
    call: "LEDGER",
    label: "Manual creator",
    command: "npx vibetrack import midjourney --images <lifetime-images> --usd <lifetime-spend>",
    impact: "manual",
    guardrail: "Manual entries are useful context, never fake API usage.",
    providerIds: ["midjourney", "canva", "adobe-cc", "poe", "notion-ai", "topaz"],
    frames: [
      "MJ CA AD\n receipts\n ledger ",
      "POE NOTE\n seats  \n monthly",
      "closed  \ntools   \nmanual  ",
      "NO FAKE\nAPI     \nlabels  ",
    ],
  },
  {
    id: "c0vibe-signal",
    call: "UNITE",
    label: "C0VIBE relay",
    command: "npx vibetrack upload --dry-run",
    impact: "publish",
    guardrail: "Publish is opt-in, redacted aggregate data.",
    providerIds: ["c0vibe", "supabase", "github-actions"],
    frames: [
      "VIBERS\nUNITE \nC0VIBE",
      "dry-run\nredact \nreview ",
      "score ->\nprofile\nfeed   ",
      "c0vibe\n .app  \npublic ",
    ],
  },
];

interface ProviderCollectionCommandChannelDef {
  id: ProviderCollectionCommandChannel["id"];
  call: string;
  label: string;
  readPath: string;
  command: string;
  impact: ProviderCollectionImpact;
  guardrail: string;
  surprise: string;
  providerIds: string[];
  frames: string[];
  autoReadable: boolean;
  localOnly?: boolean;
  trustOnly?: boolean;
  manualOnly?: boolean;
  publishOnly?: boolean;
}

const COLLECTION_COMMAND_WALL_CHANNELS: ProviderCollectionCommandChannelDef[] = [
  {
    id: "auto-provider-usage",
    call: "AUTO",
    label: "Authenticated usage readers",
    readPath: "MCP/API after user auth",
    command: "npx vibetrack providers check",
    impact: "usage",
    guardrail: "Auto-readable means source path exists; usage counts only after validated rows.",
    surprise: "Higgsfield can enter through MCP, while Replicate, fal.ai, and OpenAI sit on API-backed usage rails.",
    providerIds: ["higgsfield", "replicate", "falai", "openai"],
    frames: [
      "HF MCP  \nRP API  \nFA API  \nOA COST \n dry-run",
      "auth ok \nusage?  \nvalidate\nledger  \n no fake",
      "HF turns\nAPI hums\nrows wait\nproof id\n sealed ",
      "AUTO PATH\nnot write\nuntil sync\nVibers\nUnite",
    ],
    autoReadable: true,
  },
  {
    id: "local-review-loop",
    call: "LOCAL",
    label: "Local review loop",
    readPath: "loopback/log probe",
    command: "npx vibetrack detect",
    impact: "local_only",
    guardrail: "Local probes stay on-machine until reviewed aggregate publish.",
    surprise: "Ollama, LM Studio, and ComfyUI blink as a LAN console before any upload path is available.",
    providerIds: ["ollama", "lmstudio", "comfyui", "automatic1111", "vllm", "llama-cpp"],
    frames: [
      "OL 127  \nLM /v1  \nCU hist \nGPU $0 \n local ",
      "probe   \nreview  \nredact? \nno cloud\n first ",
      "LOCAL   \nNOT USE \nno feed \nno raw  \nfiles  ",
      "loopback\nmeters  \nprivacy \nuser ok \nlater  ",
    ],
    autoReadable: false,
    localOnly: true,
  },
  {
    id: "trust-sidecar",
    call: "TRUST",
    label: "Builder trust sidecar",
    readPath: "local CLI and GitHub cadence",
    command: "npx vibetrack trust list",
    impact: "trust",
    guardrail: "Builder proof helps credibility but is stamped NOT USAGE.",
    surprise: "Codex, Claude Code, GitHub, and Antigravity light the trust lane without touching usage totals.",
    providerIds: ["codex-cli", "claude-code", "github", "antigravity", "augment", "roo-code"],
    frames: [
      "CX cube \nCC logs \nGH heat \nAG IDE  \n trust ",
      "commit  \nreview  \nlocal   \nNOT USE \nscore  ",
      "sidecar \nproof   \nno cost \nno spend\nlabel  ",
      "TRUST   \nseparate\nusage=0\nwrites=0\nclear  ",
    ],
    autoReadable: false,
    trustOnly: true,
  },
  {
    id: "regional-usage-mesh",
    call: "CN/EU",
    label: "Regional usage mesh",
    readPath: "API/proxy/manual confidence",
    command: "npx vibetrack providers --all",
    impact: "usage",
    guardrail: "Regional provider confidence labels stay visible; planned never looks built.",
    surprise: "Chinese and European providers get their own mesh instead of disappearing into a generic LLM bucket.",
    providerIds: ["qwen", "doubao", "kimi", "mistral", "aleph-alpha", "lighton"],
    frames: [
      "QW==DB \nKM  DS \nMI--AA \nLO rail\nregion",
      "CN/EU  \nusage  \nproxy?  \nmanual? \nlabels ",
      "not gen\nLLM row \nprovider\ncolors \nkept   ",
      "mesh on \nrows wait\nproof   \nno fake \nusage  ",
    ],
    autoReadable: true,
  },
  {
    id: "manual-creator-ledger",
    call: "MANUAL",
    label: "Creator subscription ledger",
    readPath: "receipt/subscription entry",
    command: "npx vibetrack import midjourney --images <lifetime-images> --usd <lifetime-spend>",
    impact: "manual",
    guardrail: "Manual entries are useful spend context, never fake API usage.",
    surprise: "Midjourney, Canva, Adobe, Poe, and closed creator tools get a beautiful lane without greenwashing.",
    providerIds: ["midjourney", "canva", "adobe-cc", "poe", "notion-ai", "topaz"],
    frames: [
      "MJ CA AD\nPOE TOP \nreceipt\nledger \nmanual",
      "sub cost\nproject \nmonth   \nlabel   \nvisible",
      "no API  \nno fake \nmanual  \ncontext \nonly   ",
      "creator \nspend   \nhelps   \nprofile \nclear  ",
    ],
    autoReadable: false,
    manualOnly: true,
  },
  {
    id: "c0vibe-publish-review",
    call: "RELAY",
    label: "C0VIBE publish review",
    readPath: "redacted aggregate upload",
    command: "npx vibetrack upload --dry-run && npx vibetrack upload",
    impact: "publish",
    guardrail: "Publish is opt-in aggregate data; raw prompts, secrets, and outputs stay out.",
    surprise: "The wall resolves into Vibers Unite only after the dry-run review says what leaves the machine.",
    providerIds: ["c0vibe", "supabase", "github-actions"],
    frames: [
      "dry-run\nreview \nredact \nC0VIBE\n .app  ",
      "usage ->\nprofile\nscore  \nfeed   \nopt-in",
      "secrets\nraw out\nblocked\npublic \nclean ",
      "VIBERS \nUNITE  \nC0vibe \n.app   \nrelay ",
    ],
    autoReadable: false,
    publishOnly: true,
  },
];

interface ProviderFreshnessLaneDef {
  id: ProviderFreshnessLane["id"];
  call: string;
  label: string;
  command: string;
  impact: ProviderFreshnessImpact;
  note: string;
  action: string;
  guardrail: string;
  preferred: string[];
  providerIds?: string[];
  frames: string[];
  match(provider: ProviderDescriptor): boolean;
}

const TRUST_PROVIDER_IDS = new Set([
  "codex-cli",
  "claude-code",
  "github-actions",
  "antigravity",
  "augment",
  "roo-code",
  "devin",
  "copilot",
]);

const FRESHNESS_RADAR_LANES: ProviderFreshnessLaneDef[] = [
  {
    id: "verified-live",
    call: "LIVE",
    label: "Verified live adapters",
    command: "npx vibetrack providers check",
    impact: "usage",
    note: "Endpoint-backed or live-log adapters that are allowed to feed usage after validation.",
    action: "Keep smoke fixtures current before expanding public proof.",
    guardrail: "USAGE only after validated records. This radar itself makes no calls.",
    preferred: ["higgsfield", "replicate", "falai", "runway", "claude-code"],
    frames: [
      "HF RP FA\nRW CC   \nverified",
      "endpoint\nfixture \ncurrent ",
      "dry-run \n0 writes\nusage ok",
      "LIVE    \nproof   \nlabelled",
    ],
    match: (provider) => provider.status === "built" && provider.verified,
  },
  {
    id: "approx-built",
    call: "CHECK",
    label: "Built approximate",
    command: "npx vibetrack providers check",
    impact: "usage",
    note: "Built adapters that need fixture refresh, endpoint confirmation, or confidence review.",
    action: "Refresh fixture and capability notes before marketing as verified.",
    guardrail: "Built approximate stays labelled; no fake verified badge.",
    preferred: ["openai", "anthropic", "qwen", "doubao", "kimi", "mistral", "higgsfield"],
    frames: [
      "OA AN QW\nDB KM MI\nbuilt   ",
      "fixture?\nusage api\nfresh?  ",
      "approx  \nlabel   \nno green",
      "CHECK   \nno calls\nregistry",
    ],
    match: (provider) =>
      provider.status === "built"
      && !provider.verified
      && provider.tier !== "local"
      && provider.tier !== "proxy"
      && provider.auth !== "localLogs",
  },
  {
    id: "local-proxy",
    call: "LOCAL",
    label: "Local/proxy readiness",
    command: "npx vibetrack detect",
    impact: "local_only",
    note: "Loopback, local logs, proxy, and on-machine runners show readiness without leaving the machine.",
    action: "Probe loopback and show review controls before any aggregate publish.",
    guardrail: "NOT USAGE until reviewed upload. Local value stays separate from billable spend.",
    preferred: ["ollama", "lmstudio", "comfyui", "vllm", "llama-cpp", "automatic1111"],
    frames: [
      "OL LM CU\n127.0.0\nlocal  ",
      "proxy   \n/v1     \nmodels  ",
      "logs    \nreview  \nno cloud",
      "LOCAL   \nNOT USE \n0 upload",
    ],
    match: (provider) => provider.tier === "local" || provider.tier === "proxy" || provider.auth === "localLogs",
  },
  {
    id: "trust-sidecar",
    call: "TRUST",
    label: "Builder trust sidecar",
    command: "npx vibetrack trust list",
    impact: "trust",
    note: "Coding agents and GitHub-like contribution surfaces can support trust without adding spend.",
    action: "Collect as labelled evidence, not usage or provider cost.",
    guardrail: "NOT USAGE. Builder/social activity never changes usage totals.",
    preferred: ["codex-cli", "claude-code", "github-actions", "antigravity", "augment", "roo-code"],
    providerIds: ["codex-cli", "claude-code", "github-actions", "antigravity", "augment", "roo-code"],
    frames: [
      "CX CC GH\nAG AU RC\ntrust  ",
      "commit  \nlogs    \nsidecar ",
      "NOT USE \nscore ctx\n0 spend ",
      "TRUST   \nseparate\nclear   ",
    ],
    match: (provider) => TRUST_PROVIDER_IDS.has(provider.id),
  },
  {
    id: "manual-ledger",
    call: "MANUAL",
    label: "Manual ledger queue",
    command: "npx vibetrack add <provider> --usd <amount>",
    impact: "manual",
    note: "Closed creator tools, subscriptions, and seats remain useful when clearly marked.",
    action: "Ask for receipt or subscription amount; never pretend an API exists.",
    guardrail: "Manual evidence is context, never fake API usage.",
    preferred: ["midjourney", "canva", "adobe-cc", "poe", "notion-ai", "topaz"],
    frames: [
      "MJ CA AD\nPOE TOP \nmanual ",
      "receipt \nseat    \nmonthly ",
      "ledger  \nlabel   \ncontext ",
      "NO FAKE \nAPI     \nvisible ",
    ],
    match: (provider) => provider.tier === "manual" || provider.status === "manual-only",
  },
  {
    id: "planned-next",
    call: "NEXT",
    label: "Contributor-ready planned",
    command: "npx vibetrack adapter scaffold <provider>",
    impact: "planned",
    note: "Mapped providers become good-first-adapter tasks while remaining visually separate from built paths.",
    action: "Generate fixture, docs, and golden test before changing status.",
    guardrail: "Planned means mapped, not secretly built.",
    preferred: ["gemini", "deepseek", "stability", "cursor", "copilot", "veo", "sora"],
    frames: [
      "GM DS ST\nCU CP VE\nplanned",
      "scaffold\nfixture \ngolden  ",
      "docs    \nstatus  \nstays   ",
      "NEXT    \nnot built\nhonest  ",
    ],
    match: (provider) =>
      provider.status === "planned"
      && provider.tier !== "proxy"
      && provider.tier !== "local"
      && provider.tier !== "manual"
      && provider.auth !== "localLogs",
  },
  {
    id: "publish-safe",
    call: "RELAY",
    label: "C0VIBE publish safety",
    command: "npx vibetrack upload --dry-run",
    impact: "publish",
    note: "Provider readiness resolves into c0vibe.app only after redaction and explicit review.",
    action: "Show what leaves the machine before public score/profile sync.",
    guardrail: "PUBLISH rail only. Raw prompts, secrets, and outputs stay out.",
    preferred: ["c0vibe", "supabase", "github-actions"],
    providerIds: ["c0vibe", "supabase", "github-actions"],
    frames: [
      "C0VIBE\nUNITE \nreview ",
      "dry-run\nredact \nexplain",
      "score ->\nprofile\npublic ",
      "PUBLISH\n0 hidden\nupload ",
    ],
    match: (provider) => provider.id === "supabase" || provider.id === "github-actions",
  },
];

function scoreProvider(provider: ProviderDescriptor, preferred: string[]): number {
  const preferredIndex = preferred.indexOf(provider.id);
  if (preferredIndex >= 0) return preferredIndex;
  if (provider.status === "built" && provider.verified) return 100;
  if (provider.status === "built") return 200;
  if (provider.tier === "proxy" || provider.tier === "local") return 300;
  if (provider.tier === "manual" || provider.status === "manual-only") return 400;
  return 500;
}

function toChip(provider: ProviderDescriptor): ProviderScanChip {
  return {
    id: provider.id,
    label: provider.label,
    status: provider.status,
    tier: provider.tier,
    verified: provider.verified,
  };
}

function meterFor(providers: ProviderDescriptor[]): number {
  if (!providers.length) return 18;
  if (providers.some((provider) => provider.status === "built" && provider.verified)) return 96;
  if (providers.some((provider) => provider.status === "built")) return 78;
  if (providers.some((provider) => provider.tier === "local" || provider.tier === "proxy")) return 62;
  return 42;
}

function collectionMeter(providers: ProviderDescriptor[], impact: ProviderCollectionImpact): number {
  if (impact === "publish") return 100;
  return meterFor(providers);
}

function statusFor(providers: ProviderDescriptor[]): string {
  if (!providers.length) return "mapped next";
  if (providers.some((provider) => provider.status === "built" && provider.verified)) return "verified evidence";
  if (providers.some((provider) => provider.status === "built")) return "built approximate";
  if (providers.some((provider) => provider.tier === "local" || provider.tier === "proxy")) return "local/proxy ready";
  return "mapped not built";
}

function fit(value: string | number, width: number): string {
  return String(value).padEnd(width).slice(0, width);
}

function frameLine(value: string): string {
  return `| ${fit(value, 60)} |`;
}

function checksum(value: string): string {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, "0").slice(0, 8).toUpperCase();
}

function impactLabel(value: string): string {
  return value.replace(/_/g, "-").toUpperCase();
}

function railLabel(impact: ProviderCollectionImpact): string {
  if (impact === "trust" || impact === "local_only") return "NOT USAGE";
  return impactLabel(impact);
}

function freshnessRailLabel(impact: ProviderFreshnessImpact): string {
  if (impact === "trust" || impact === "local_only") return "NOT USAGE";
  return impactLabel(impact);
}

function freshnessMeter(impact: ProviderFreshnessImpact, matched: ProviderDescriptor[], refs: number): number {
  if (impact === "publish") return 100;
  if (!matched.length) return 18;
  const verified = matched.filter((provider) => provider.status === "built" && provider.verified).length;
  const built = matched.filter((provider) => provider.status === "built").length;
  const local = matched.filter((provider) => provider.tier === "local" || provider.tier === "proxy" || provider.auth === "localLogs").length;
  const manual = matched.filter((provider) => provider.tier === "manual" || provider.status === "manual-only").length;
  const planned = matched.filter((provider) => provider.status === "planned").length;
  const coverage = matched.length / Math.max(1, refs);
  const base = impact === "planned" ? 28 : impact === "manual" ? 42 : impact === "trust" ? 52 : impact === "local_only" ? 58 : 60;
  return Math.min(100, Math.max(18, Math.round(base + coverage * 18 + verified * 5 + built * 2 + local * 1.5 + manual + planned * .6)));
}

function freshnessStatus(definition: ProviderFreshnessLaneDef, matched: ProviderDescriptor[]): string {
  if (definition.impact === "publish") return "dry-run review";
  if (definition.id === "verified-live") return `${matched.filter((provider) => provider.verified).length} verified`;
  if (definition.id === "approx-built") return `${matched.length} built checks`;
  if (definition.id === "local-proxy") return `${matched.length} local/proxy`;
  if (definition.id === "trust-sidecar") return `${matched.length} trust refs`;
  if (definition.id === "manual-ledger") return `${matched.length} manual refs`;
  return `${matched.length} planned refs`;
}

function freshnessCheckLines(lane: ProviderFreshnessLane): string[] {
  return [
    frameLine(`${lane.call} ${lane.railLabel} ${lane.status}`),
    frameLine(`refs ${fit(lane.providerRefs, 3)} mapped ${fit(lane.mapped, 3)} built ${fit(lane.built, 3)} verified ${fit(lane.verified, 3)}`),
    frameLine(`local ${fit(lane.local, 3)} manual ${fit(lane.manual, 3)} planned ${fit(lane.planned, 3)} hash ${lane.checksum}`),
    frameLine(`action ${lane.action}`),
  ];
}

function providerCueGate(impact: ProviderCollectionImpact, index: number): string {
  if (impact === "trust") return "trust-sidecar";
  if (impact === "local_only") return "local-review";
  if (impact === "manual") return "manual-ledger";
  if (impact === "publish") return "redact-relay";
  return index === 0 ? "provider-auth" : "usage-mesh";
}

function providerCueTiming(index: number): string {
  return `T+${(0.42 + index * 0.67).toFixed(2)}s`;
}

function providerCueProfileEffect(impact: ProviderCollectionImpact): string {
  if (impact === "trust") return "trust profile only; NOT USAGE";
  if (impact === "local_only") return "local preview only; no public feed";
  if (impact === "manual") return "manual context; clearly labelled";
  if (impact === "publish") return "public relay only after redaction";
  return "usage/profile feed after validated rows";
}

function providerLabel(id: string, providers: ProviderDescriptor[]): string {
  const provider = providers.find((candidate) => candidate.id === id);
  if (provider) return provider.label;
  if (id === "github") return "GitHub";
  if (id === "c0vibe") return "C0VIBE";
  return id;
}

function collectionMarks(ids: string[], providers: ProviderDescriptor[]): ProviderCollectionMark[] {
  return ids.map((id) => {
    const brand = providerBrand(id);
    return {
      id,
      label: providerLabel(id, providers),
      mark: brand.mark,
      from: brand.from,
      to: brand.to,
      ink: brand.ink,
    };
  });
}

function worldMeter(definition: ProviderWorldZoneDef, matchedProviders: ProviderDescriptor[], mapped: number): number {
  if (definition.impact === "publish") return 100;
  const coverage = mapped / Math.max(1, definition.providerIds.length);
  const verified = matchedProviders.filter((provider) => provider.status === "built" && provider.verified).length;
  const built = matchedProviders.filter((provider) => provider.status === "built").length;
  const local = matchedProviders.filter((provider) => provider.tier === "local" || provider.tier === "proxy" || provider.auth === "localLogs").length;
  const manual = matchedProviders.filter((provider) => provider.tier === "manual" || provider.status === "manual-only").length;
  const base = definition.impact === "trust" ? 54 : definition.impact === "local_only" ? 60 : 48;
  return Math.min(100, Math.max(28, Math.round(base + coverage * 20 + verified * 4 + built * 2.5 + local * 1.5 + manual)));
}

function worldTerminalLines(zone: ProviderWorldZone): string[] {
  return [
    frameLine(`${zone.call} ${zone.label}`),
    frameLine(`${zone.mapped}/${zone.providerIds.length} mapped // built ${zone.built} // verified ${zone.verified}`),
    frameLine(`local ${zone.local} // manual ${zone.manual} // planned ${zone.planned}`),
    frameLine(`${impactLabel(zone.impact)} // ${zone.guardrail}`),
  ];
}

function passportTone(provider: ProviderDescriptor): ProviderPassportTone {
  if (provider.status === "built" && provider.verified) return "verified";
  if (provider.status === "built") return "built";
  if (provider.tier === "local" || provider.tier === "proxy" || provider.auth === "localLogs") return "local";
  if (provider.tier === "manual" || provider.status === "manual-only") return "manual";
  return "planned";
}

function passportImpact(provider: ProviderDescriptor): ProviderPassportImpact {
  if (provider.tier === "local" || provider.tier === "proxy" || provider.auth === "localLogs") return "local_only";
  if (provider.tier === "manual" || provider.status === "manual-only") return "manual";
  if (provider.status === "planned") return "planned";
  return "usage";
}

function passportStatus(provider: ProviderDescriptor): string {
  if (provider.status === "built" && provider.verified) return "verified usage";
  if (provider.status === "built") return "built estimate";
  if (provider.tier === "proxy") return "proxy-ready";
  if (provider.tier === "local") return "local-only";
  if (provider.tier === "manual" || provider.status === "manual-only") return "manual ledger";
  return "mapped planned";
}

function passportCommand(provider: ProviderDescriptor): string {
  if (provider.status === "built" || provider.verified) return `npx vibetrack connect ${provider.id}`;
  if (provider.tier === "proxy") return `npx vibetrack proxy --provider ${provider.id}`;
  if (provider.id === "midjourney") return "npx vibetrack import midjourney --images <lifetime-images> --usd <lifetime-spend>";
  if (provider.tier === "manual" || provider.status === "manual-only") return `npx vibetrack add ${provider.id} --usd <amount>`;
  if (provider.auth === "localLogs") return `npx vibetrack detect`;
  return `npx vibetrack connect ${provider.id}`;
}

function passportNote(provider: ProviderDescriptor): string {
  if (provider.status === "built" && provider.verified) return "Endpoint-backed usage path. Counts only after validated records land.";
  if (provider.status === "built") return "Built path with explicit confidence label; estimates stay visible.";
  if (provider.tier === "proxy" || provider.tier === "local" || provider.auth === "localLogs") return "Local/proxy path stays on-machine until reviewed aggregate upload.";
  if (provider.tier === "manual" || provider.status === "manual-only") return "Manual/subscription evidence. Useful context, never fake API proof.";
  return "Mapped contributor target. Planned means not secretly built.";
}

function passportMeter(provider: ProviderDescriptor): number {
  if (provider.status === "built" && provider.verified) return 100;
  if (provider.status === "built") return 78;
  if (provider.tier === "proxy" || provider.tier === "local" || provider.auth === "localLogs") return 62;
  if (provider.tier === "manual" || provider.status === "manual-only") return 46;
  return 24;
}

function passportSort(a: ProviderDescriptor, b: ProviderDescriptor): number {
  const toneOrder: Record<ProviderPassportTone, number> = { verified: 0, built: 1, local: 2, manual: 3, planned: 4 };
  return toneOrder[passportTone(a)] - toneOrder[passportTone(b)] || a.domain.localeCompare(b.domain) || a.label.localeCompare(b.label);
}

export function buildProviderScanLanes(providers: ProviderDescriptor[]): ProviderScanLane[] {
  return LANES.map((lane) => {
    const matches = providers
      .filter(lane.match)
      .sort((a, b) => scoreProvider(a, lane.preferred) - scoreProvider(b, lane.preferred) || a.label.localeCompare(b.label));

    return {
      id: lane.id,
      call: lane.call,
      label: lane.label,
      note: lane.note,
      count: matches.length,
      built: matches.filter((provider) => provider.status === "built").length,
      verified: matches.filter((provider) => provider.status === "built" && provider.verified).length,
      providers: matches.slice(0, 6).map(toChip),
    };
  });
}

export function buildProviderScanTheatre(providers: ProviderDescriptor[]): ProviderScanTheatreScene[] {
  return THEATRE.map((scene) => {
    const sceneProviders = scene.providerIds
      .map((id) => providers.find((provider) => provider.id === id))
      .filter(Boolean) as ProviderDescriptor[];

    return {
      ...scene,
      providerIds: [...scene.providerIds],
      ascii: [...scene.ascii],
      meter: meterFor(sceneProviders),
      status: statusFor(sceneProviders),
      foot: [
        `${sceneProviders.length}/${scene.providerIds.length} mapped`,
        "not usage",
        scene.id === "c0vibe-relay" ? "Vibers Unite" : "scan surprise",
      ],
    };
  });
}

export function buildProviderCollectionConsole(providers: ProviderDescriptor[]): ProviderCollectionConsole {
  const steps = COLLECTION_SEQUENCE.map<ProviderCollectionStep>((definition) => {
    const firstBrand = providerBrand(definition.providerIds[0] ?? definition.id);
    const matchedProviders = definition.providerIds
      .map((id) => providers.find((provider) => provider.id === id))
      .filter(Boolean) as ProviderDescriptor[];

    return {
      ...definition,
      providerIds: [...definition.providerIds],
      frames: [...definition.frames],
      transcript: [...definition.transcript],
      marks: collectionMarks(definition.providerIds, providers),
      mapped: matchedProviders.length,
      meter: collectionMeter(matchedProviders, definition.impact),
      from: firstBrand.from,
      to: firstBrand.to,
      ink: firstBrand.ink,
    };
  });
  const totals = steps.reduce<Record<ProviderCollectionImpact, number>>((acc, step) => {
    acc[step.impact] += 1;
    return acc;
  }, { usage: 0, trust: 0, local_only: 0, manual: 0, publish: 0 });
  const mappedProviderIds = [...new Set(steps.flatMap((step) =>
    step.providerIds.filter((id) => providers.some((provider) => provider.id === id))
  ))];

  return {
    headline: "Collection surprise console",
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine("VTK://COLLECTION-CONSOLE//SURPRISES//C0VIBE.APP"),
      "|--------------------------------------------------------------|",
      frameLine(`surprises ${fit(steps.length, 4)} usage ${fit(totals.usage, 3)} trust ${fit(totals.trust, 3)} local ${fit(totals.local_only, 3)}`),
      frameLine(`manual ${fit(totals.manual, 3)} publish ${fit(totals.publish, 3)} mapped ${fit(mappedProviderIds.length, 4)} providers`),
      frameLine("HF turn // CX cube // local sonar // C0 relay"),
      frameLine("trust and social rails stay labelled NOT USAGE"),
      frameLine("Vibers Unite // reviewed aggregate // c0vibe.app"),
      "+--------------------------------------------------------------+",
    ],
    steps,
    totals,
    mappedProviderIds,
  };
}

export function buildProviderBootSequence(providers: ProviderDescriptor[]): ProviderBootSequence {
  const collection = buildProviderCollectionConsole(providers);
  const slots = collection.steps.map<ProviderBootSlot>((step, index) => {
    const sequence = index + 1;
    const rail = railLabel(step.impact);
    const hash = checksum([
      sequence,
      step.id,
      step.phase,
      step.command,
      step.providerIds.join(","),
      step.guardrail,
      step.frames.join("|"),
    ].join("//"));

    return {
      id: `${step.id}-boot`,
      sequence,
      phase: step.phase,
      call: step.call,
      label: step.label,
      command: step.command,
      impact: step.impact,
      railLabel: rail,
      meter: step.meter,
      mapped: step.mapped,
      providerRefs: step.providerIds.length,
      marks: step.marks,
      frames: step.frames,
      bootLines: [
        frameLine(`BOOT ${fit(`${sequence}/6`, 5)} ${fit(step.call, 8)} ${fit(rail, 10)} ${step.label}`),
        frameLine(`refs ${fit(step.providerIds.length, 3)} mapped ${fit(step.mapped, 3)} meter ${fit(`${step.meter}%`, 5)} hash ${hash}`),
        frameLine(`cmd ${step.command}`),
        frameLine(step.guardrail),
      ],
      checksum: hash,
      guardrail: step.guardrail,
      visualOnly: true,
      providerCalls: false,
      ledgerWrites: false,
      hiddenUpload: false,
      secretExport: false,
    };
  });
  const totals = slots.reduce<ProviderBootSequence["totals"]>((acc, slot) => {
    acc.mappedProviderRefs += slot.mapped;
    if (slot.impact === "usage") acc.usage += 1;
    if (slot.impact === "trust") acc.notUsage += 1;
    if (slot.impact === "local_only") {
      acc.localOnly += 1;
      acc.notUsage += 1;
    }
    if (slot.impact === "manual") acc.manual += 1;
    if (slot.impact === "publish") acc.publish += 1;
    return acc;
  }, {
    slots: slots.length,
    mappedProviderRefs: 0,
    usage: 0,
    notUsage: 0,
    localOnly: 0,
    manual: 0,
    publish: 0,
    providerCalls: 0,
    ledgerWrites: 0,
    hiddenUpload: 0,
  });

  return {
    headline: "Provider boot sequence",
    subline: "A registry-driven preflight rail for the provider cockpit: logo turns, auth hints, local sonar, manual ledgers, and C0VIBE publish stay clearly labelled before any real sync.",
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine("VTK://PROVIDER-BOOT-SEQUENCE//VISUAL-ONLY//C0VIBE.APP"),
      "|--------------------------------------------------------------|",
      frameLine(`slots ${fit(totals.slots, 3)} mapped refs ${fit(totals.mappedProviderRefs, 4)} usage ${fit(totals.usage, 3)} not-usage ${fit(totals.notUsage, 3)}`),
      frameLine(`manual ${fit(totals.manual, 3)} local ${fit(totals.localOnly, 3)} publish ${fit(totals.publish, 3)} writes ${fit(totals.ledgerWrites, 3)}`),
      frameLine("preflight draws provider marks only; no provider calls"),
      frameLine("providerCalls=0 // ledgerWrites=0 // hiddenUpload=0"),
      frameLine("HF prism -> CX cube -> local sonar -> C0VIBE relay"),
      frameLine("Vibers Unite // c0vibe.app // review before sync"),
      "+--------------------------------------------------------------+",
    ],
    totals,
    slots,
  };
}

export function buildProviderSignalMarquee(providers: ProviderDescriptor[]): ProviderSignalMarquee {
  const rails = SIGNAL_MARQUEE_RAILS.map<ProviderSignalMarqueeRail>((definition) => {
    const matchedProviders = definition.providerIds
      .map((id) => providers.find((provider) => provider.id === id))
      .filter(Boolean) as ProviderDescriptor[];
    const virtualMapped = definition.providerIds.filter((id) =>
      id === "c0vibe" && !providers.some((provider) => provider.id === id)
    ).length;
    const mapped = matchedProviders.length + virtualMapped;
    const firstBrand = providerBrand(definition.providerIds[0] ?? definition.id);
    const rail = railLabel(definition.impact);
    const marks = collectionMarks(definition.providerIds, providers);
    const hash = checksum([
      definition.id,
      definition.call,
      definition.command,
      definition.impact,
      definition.providerIds.join(","),
      definition.guardrail,
    ].join("//"));

    return {
      id: definition.id,
      call: definition.call,
      label: definition.label,
      command: definition.command,
      impact: definition.impact,
      railLabel: rail,
      guardrail: definition.guardrail,
      providerIds: [...definition.providerIds],
      mapped,
      built: matchedProviders.filter((provider) => provider.status === "built").length,
      verified: matchedProviders.filter((provider) => provider.status === "built" && provider.verified).length,
      meter: collectionMeter(matchedProviders, definition.impact),
      marks,
      frames: [...definition.frames],
      tickerLines: [
        frameLine(`SIGNAL ${fit(definition.call, 8)} ${fit(rail, 10)} ${definition.label}`),
        frameLine(`refs ${fit(definition.providerIds.length, 3)} mapped ${fit(mapped, 3)} built ${fit(matchedProviders.filter((provider) => provider.status === "built").length, 3)} hash ${hash}`),
        frameLine(`cmd ${definition.command}`),
        frameLine(`${rail} // ${definition.guardrail}`),
      ],
      checksum: hash,
      from: firstBrand.from,
      to: firstBrand.to,
      ink: firstBrand.ink,
      visualOnly: true,
      usageWrites: false,
    };
  });
  const totals = rails.reduce<ProviderSignalMarquee["totals"]>((acc, rail) => {
    acc.mappedProviderRefs += rail.mapped;
    if (rail.impact === "usage") acc.usageRails += 1;
    if (rail.impact === "trust" || rail.impact === "local_only") acc.notUsageRails += 1;
    if (rail.impact === "manual") acc.manualRails += 1;
    if (rail.impact === "publish") acc.publishRails += 1;
    if (rail.visualOnly) acc.visualOnly += 1;
    if (rail.usageWrites) acc.usageWrites += 1;
    return acc;
  }, {
    rails: rails.length,
    mappedProviderRefs: 0,
    usageRails: 0,
    notUsageRails: 0,
    manualRails: 0,
    publishRails: 0,
    visualOnly: 0,
    usageWrites: 0,
  });

  return {
    headline: "Provider signal marquee",
    subline: "A branded preflight strip for creator, local, regional, builder, manual, and C0VIBE publish signals. Visual-only until the user starts a real sync.",
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine("VTK://PROVIDER-SIGNAL-MARQUEE//SURPRISES//NO-FAKE-USAGE"),
      "|--------------------------------------------------------------|",
      frameLine(`rails ${fit(totals.rails, 3)} usage ${fit(totals.usageRails, 3)} NOT USAGE ${fit(totals.notUsageRails, 3)} manual ${fit(totals.manualRails, 3)}`),
      frameLine(`publish ${fit(totals.publishRails, 3)} mapped refs ${fit(totals.mappedProviderRefs, 4)} usageWrites ${fit(totals.usageWrites, 3)}`),
      frameLine("HF logo turns // Codex cube pulses // local sonar sweeps"),
      frameLine("creator/local/regional/builder/manual/publish separated"),
      frameLine("Vibers Unite // c0vibe.app // visualOnly=6"),
      "+--------------------------------------------------------------+",
    ],
    totals,
    rails,
  };
}

export function buildProviderCollectionCommandWall(providers: ProviderDescriptor[]): ProviderCollectionCommandWall {
  const channels = COLLECTION_COMMAND_WALL_CHANNELS.map<ProviderCollectionCommandChannel>((definition) => {
    const matchedProviders = definition.providerIds
      .map((id) => providers.find((provider) => provider.id === id))
      .filter(Boolean) as ProviderDescriptor[];
    const virtualMapped = definition.providerIds.filter((id) =>
      (id === "c0vibe" || id === "github-actions") && !providers.some((provider) => provider.id === id)
    ).length;
    const mapped = matchedProviders.length + virtualMapped;
    const firstBrand = providerBrand(definition.providerIds[0] ?? definition.id);
    const rail = railLabel(definition.impact);
    const hash = checksum([
      definition.id,
      definition.call,
      definition.readPath,
      definition.command,
      definition.impact,
      definition.providerIds.join(","),
      definition.guardrail,
    ].join("//"));

    return {
      id: definition.id,
      call: definition.call,
      label: definition.label,
      readPath: definition.readPath,
      command: definition.command,
      impact: definition.impact,
      railLabel: rail,
      guardrail: definition.guardrail,
      surprise: definition.surprise,
      providerIds: [...definition.providerIds],
      mapped,
      built: matchedProviders.filter((provider) => provider.status === "built").length,
      verified: matchedProviders.filter((provider) => provider.status === "built" && provider.verified).length,
      meter: collectionMeter(matchedProviders, definition.impact),
      marks: collectionMarks(definition.providerIds, providers),
      frames: [...definition.frames],
      terminalLines: [
        frameLine(`COLLECT ${fit(definition.call, 7)} ${fit(rail, 10)} ${definition.label}`),
        frameLine(`read ${definition.readPath} // mapped ${mapped}/${definition.providerIds.length} // hash ${hash}`),
        frameLine(`cmd ${definition.command}`),
        frameLine(`${rail} // ${definition.guardrail}`),
      ],
      checksum: hash,
      from: firstBrand.from,
      to: firstBrand.to,
      ink: firstBrand.ink,
      autoReadable: definition.autoReadable,
      localOnly: definition.localOnly === true,
      trustOnly: definition.trustOnly === true,
      manualOnly: definition.manualOnly === true,
      publishOnly: definition.publishOnly === true,
      visualOnly: true,
      usageWrites: false,
      providerCalls: false,
      ledgerWrites: false,
      hiddenUpload: false,
    };
  });
  const totals = channels.reduce<ProviderCollectionCommandWall["totals"]>((acc, channel) => {
    acc.mappedProviderRefs += channel.mapped;
    if (channel.autoReadable) acc.autoReadable += 1;
    if (channel.impact === "usage") acc.usageEligible += 1;
    if (channel.impact === "trust" || channel.impact === "local_only") acc.notUsage += 1;
    if (channel.localOnly) acc.localOnly += 1;
    if (channel.trustOnly) acc.trustOnly += 1;
    if (channel.manualOnly) acc.manualOnly += 1;
    if (channel.publishOnly) acc.publishOnly += 1;
    if (channel.visualOnly) acc.visualOnly += 1;
    if (channel.usageWrites) acc.usageWrites += 1;
    if (channel.providerCalls) acc.providerCalls += 1;
    if (channel.ledgerWrites) acc.ledgerWrites += 1;
    if (channel.hiddenUpload) acc.hiddenUpload += 1;
    return acc;
  }, {
    channels: channels.length,
    mappedProviderRefs: 0,
    autoReadable: 0,
    usageEligible: 0,
    notUsage: 0,
    localOnly: 0,
    trustOnly: 0,
    manualOnly: 0,
    publishOnly: 0,
    visualOnly: 0,
    usageWrites: 0,
    providerCalls: 0,
    ledgerWrites: 0,
    hiddenUpload: 0,
  });

  return {
    headline: "Collection command wall",
    subline: "A labelled operator wall for what can be read automatically, what stays manual, what is only trust, what remains local, and what can publish to C0VIBE after review.",
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine("VTK://COLLECTION-COMMAND-WALL//VISUAL-ONLY//NO-FAKE-USAGE"),
      "|--------------------------------------------------------------|",
      frameLine(`channels ${fit(totals.channels, 3)} auto ${fit(totals.autoReadable, 3)} usage ${fit(totals.usageEligible, 3)} NOT USAGE ${fit(totals.notUsage, 3)}`),
      frameLine(`manual ${fit(totals.manualOnly, 3)} local ${fit(totals.localOnly, 3)} publish ${fit(totals.publishOnly, 3)} writes ${fit(totals.usageWrites, 3)}`),
      frameLine("providerCalls=0 // ledgerWrites=0 // hiddenUpload=0"),
      frameLine("Higgsfield MCP // local LM Studio/Ollama // manual ledgers"),
      frameLine("Vibers Unite // C0vibe.app // dry-run before upload"),
      "+--------------------------------------------------------------+",
    ],
    channels,
    totals,
  };
}

export function buildProviderFreshnessRadar(providers: ProviderDescriptor[]): ProviderFreshnessRadar {
  const lanes = FRESHNESS_RADAR_LANES.map<ProviderFreshnessLane>((definition) => {
    const matchedProviders = definition.providerIds
      ? definition.providerIds.map((id) => providers.find((provider) => provider.id === id)).filter(Boolean) as ProviderDescriptor[]
      : providers
        .filter(definition.match)
        .sort((a, b) => scoreProvider(a, definition.preferred) - scoreProvider(b, definition.preferred) || a.label.localeCompare(b.label));
    const providerIds = definition.providerIds ?? matchedProviders.map((provider) => provider.id);
    const virtualMapped = providerIds.filter((id) => id === "c0vibe" && !providers.some((provider) => provider.id === id)).length;
    const mapped = matchedProviders.length + virtualMapped;
    const marks = collectionMarks(providerIds.slice(0, 8), providers);
    const rail = freshnessRailLabel(definition.impact);
    const hash = checksum([
      definition.id,
      definition.call,
      definition.command,
      definition.impact,
      providerIds.join(","),
      definition.guardrail,
    ].join("//"));
    const lane: ProviderFreshnessLane = {
      id: definition.id,
      call: definition.call,
      label: definition.label,
      command: definition.command,
      impact: definition.impact,
      railLabel: rail,
      status: freshnessStatus(definition, matchedProviders),
      action: definition.action,
      note: definition.note,
      guardrail: definition.guardrail,
      providerIds,
      mapped,
      providerRefs: providerIds.length,
      built: matchedProviders.filter((provider) => provider.status === "built").length,
      verified: matchedProviders.filter((provider) => provider.status === "built" && provider.verified).length,
      local: matchedProviders.filter((provider) => provider.tier === "local" || provider.tier === "proxy" || provider.auth === "localLogs").length,
      manual: matchedProviders.filter((provider) => provider.tier === "manual" || provider.status === "manual-only").length,
      planned: matchedProviders.filter((provider) => provider.status === "planned").length,
      meter: freshnessMeter(definition.impact, matchedProviders, providerIds.length),
      marks,
      frames: [...definition.frames],
      checkLines: [],
      checksum: hash,
      visualOnly: true,
      providerCalls: false,
      ledgerWrites: false,
      hiddenUpload: false,
    };
    lane.checkLines = freshnessCheckLines(lane);
    return lane;
  });
  const totals = lanes.reduce<ProviderFreshnessRadar["totals"]>((acc, lane) => {
    acc.providerRefs += lane.mapped;
    if (lane.impact === "usage") acc.usageRails += 1;
    if (lane.impact === "trust" || lane.impact === "local_only") acc.notUsageRails += 1;
    if (lane.impact === "manual") acc.manualRails += 1;
    if (lane.impact === "planned") acc.plannedRails += 1;
    if (lane.impact === "publish") acc.publishRails += 1;
    if (lane.providerCalls) acc.providerCalls += 1;
    if (lane.ledgerWrites) acc.ledgerWrites += 1;
    if (lane.hiddenUpload) acc.hiddenUpload += 1;
    return acc;
  }, {
    lanes: lanes.length,
    providers: providers.length,
    providerRefs: 0,
    built: providers.filter((provider) => provider.status === "built").length,
    verified: providers.filter((provider) => provider.status === "built" && provider.verified).length,
    approximate: providers.filter((provider) => provider.status === "built" && !provider.verified).length,
    localProxy: providers.filter((provider) => provider.tier === "local" || provider.tier === "proxy" || provider.auth === "localLogs").length,
    manual: providers.filter((provider) => provider.tier === "manual" || provider.status === "manual-only").length,
    planned: providers.filter((provider) => provider.status === "planned").length,
    usageRails: 0,
    notUsageRails: 0,
    manualRails: 0,
    plannedRails: 0,
    publishRails: 0,
    providerCalls: 0,
    ledgerWrites: 0,
    hiddenUpload: 0,
  });

  return {
    headline: "Provider freshness radar",
    subline: "A registry-derived readiness console for verified adapters, approximate built paths, local/proxy probes, trust sidecars, manual ledgers, planned adapters, and publish safety.",
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine("VTK://PROVIDER-FRESHNESS-RADAR//REGISTRY-ONLY//NO-CALLS"),
      "|--------------------------------------------------------------|",
      frameLine(`providers ${fit(totals.providers, 4)} built ${fit(totals.built, 3)} verified ${fit(totals.verified, 3)} approximate ${fit(totals.approximate, 3)}`),
      frameLine(`local/proxy ${fit(totals.localProxy, 3)} manual ${fit(totals.manual, 3)} planned ${fit(totals.planned, 3)} refs ${fit(totals.providerRefs, 4)}`),
      frameLine(`usage rails ${fit(totals.usageRails, 3)} NOT USAGE ${fit(totals.notUsageRails, 3)} manual ${fit(totals.manualRails, 3)} publish ${fit(totals.publishRails, 3)}`),
      frameLine("providerCalls=0 // ledgerWrites=0 // hiddenUpload=0"),
      frameLine("Vibers Unite // c0vibe.app // freshness is labelled"),
      "+--------------------------------------------------------------+",
    ],
    totals,
    lanes,
  };
}

export function buildProviderSurpriseDirector(providers: ProviderDescriptor[]): ProviderSurpriseDirector {
  const cues = buildProviderCollectionConsole(providers).steps.map<ProviderSurpriseDirectorCue>((step, index) => {
    const timing = providerCueTiming(index);
    const rail = railLabel(step.impact);
    return {
      id: step.id,
      gate: providerCueGate(step.impact, index),
      stage: step.phase,
      label: step.label,
      command: step.command,
      impact: step.impact,
      railLabel: rail,
      timing,
      meter: step.meter,
      delayMs: 140 + index * 190,
      marks: step.marks,
      frames: step.frames,
      trigger: step.transcript[0] ?? step.note,
      operatorLine: `${timing} ${step.call} // ${rail}`,
      caption: step.surprise,
      guardrail: step.guardrail,
      profileEffect: providerCueProfileEffect(step.impact),
      visualOnly: true,
      providerCalls: false,
      ledgerWrites: false,
      hiddenUpload: false,
    };
  });
  const providerIds = new Set(cues.flatMap((cue) => cue.marks.map((mark) => mark.id)));
  const totals = cues.reduce<ProviderSurpriseDirector["totals"]>((acc, cue) => {
    if (cue.impact === "usage") acc.usageEligible += 1;
    if (cue.impact === "trust" || cue.impact === "local_only") acc.notUsage += 1;
    if (cue.impact === "manual") acc.manual += 1;
    if (cue.impact === "publish") acc.publish += 1;
    if (cue.visualOnly) acc.visualOnly += 1;
    return acc;
  }, {
    cues: cues.length,
    usageEligible: 0,
    notUsage: 0,
    manual: 0,
    publish: 0,
    providers: providerIds.size,
    visualOnly: 0,
    providerCalls: 0,
    ledgerWrites: 0,
    hiddenUpload: 0,
  });

  return {
    headline: "Provider surprise director",
    subline: "A registry-authored showrun for the scan: Higgsfield turns, Codex flips, local sonar blooms, regional meshes light up, and C0VIBE gets the final review flash.",
    motto: "Vibers Unite // C0vibe.app",
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine("VTK://PROVIDER-SURPRISE-DIRECTOR//NO-HIDDEN-UPLOAD"),
      "|--------------------------------------------------------------|",
      frameLine(`cues ${fit(totals.cues, 3)} usageEligible ${fit(totals.usageEligible, 3)} NOT USAGE ${fit(totals.notUsage, 3)}`),
      frameLine(`manual ${fit(totals.manual, 3)} publish ${fit(totals.publish, 3)} visualOnly ${fit(totals.visualOnly, 3)}`),
      frameLine("HF turn -> Codex cube -> local sonar -> C0 flash"),
      frameLine("providerCalls=0 // ledgerWrites=0 // hiddenUploads=0"),
      frameLine("Vibers Unite // C0vibe.app // validated rows decide"),
      "+--------------------------------------------------------------+",
    ],
    totals,
    cues,
  };
}

export function buildProviderWorldCoverageMap(providers: ProviderDescriptor[]): ProviderWorldCoverageMap {
  const zones = WORLD_ZONES.map<ProviderWorldZone>((definition) => {
    const matchedProviders = definition.providerIds
      .map((id) => providers.find((provider) => provider.id === id))
      .filter(Boolean) as ProviderDescriptor[];
    const virtualMapped = definition.providerIds.includes("c0vibe") ? 1 : 0;
    const mapped = matchedProviders.length + virtualMapped;
    const zone: ProviderWorldZone = {
      id: definition.id,
      call: definition.call,
      label: definition.label,
      region: definition.region,
      impact: definition.impact,
      command: definition.command,
      note: definition.note,
      guardrail: definition.guardrail,
      providerIds: [...definition.providerIds],
      mapped,
      built: matchedProviders.filter((provider) => provider.status === "built").length,
      verified: matchedProviders.filter((provider) => provider.status === "built" && provider.verified).length,
      local: matchedProviders.filter((provider) => provider.tier === "local" || provider.tier === "proxy" || provider.auth === "localLogs").length,
      manual: matchedProviders.filter((provider) => provider.tier === "manual" || provider.status === "manual-only").length,
      planned: matchedProviders.filter((provider) => provider.status === "planned").length,
      meter: worldMeter(definition, matchedProviders, mapped),
      marks: collectionMarks(definition.providerIds.slice(0, 10), providers),
      frames: [...definition.frames],
      terminalLines: [],
    };
    return { ...zone, terminalLines: worldTerminalLines(zone) };
  });
  const totals = zones.reduce<ProviderWorldCoverageMap["totals"]>((acc, zone) => {
    acc.providerRefs += zone.providerIds.length;
    acc.mapped += zone.mapped;
    acc.built += zone.built;
    acc.verified += zone.verified;
    acc.local += zone.local;
    acc.manual += zone.manual;
    acc.planned += zone.planned;
    if (zone.impact === "trust") acc.trustRails += 1;
    if (zone.impact === "publish") acc.publishRails += 1;
    return acc;
  }, {
    zones: zones.length,
    providerRefs: 0,
    mapped: 0,
    built: 0,
    verified: 0,
    local: 0,
    manual: 0,
    planned: 0,
    trustRails: 0,
    publishRails: 0,
  });

  return {
    headline: "World coverage command map",
    subline: "A fast registry read for creators, Chinese AI, European AI, local labs, coding agents, and the C0VIBE publish relay.",
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine("VTK://WORLD-COVERAGE//CN-EU-LOCAL-CREATOR//C0VIBE.APP"),
      "|--------------------------------------------------------------|",
      frameLine(`zones ${totals.zones} // refs ${totals.providerRefs} // mapped ${totals.mapped} // verified ${totals.verified}`),
      frameLine(`built ${totals.built} // local ${totals.local} // manual ${totals.manual} // planned ${totals.planned}`),
      frameLine("creator / China / Europe / local / builder / publish rails"),
      frameLine("builder and public proof rails stay labelled NOT USAGE"),
      frameLine("Vibers Unite // c0vibe.app // local-first review"),
      "+--------------------------------------------------------------+",
    ],
    zones,
    totals,
  };
}

export function buildProviderPassportWall(providers: ProviderDescriptor[]): ProviderPassportWall {
  const sorted = providers.slice().sort(passportSort);
  const cards = sorted.map<ProviderPassportCard>((provider) => {
    const brand = providerBrand(provider.id);
    return {
      id: provider.id,
      label: provider.label,
      mark: brand.mark,
      domain: provider.domain,
      categories: provider.categories.join(" / "),
      status: passportStatus(provider),
      auth: `${provider.tier} / ${provider.auth}`,
      command: passportCommand(provider),
      note: passportNote(provider),
      tone: passportTone(provider),
      impact: passportImpact(provider),
      meter: passportMeter(provider),
      from: brand.from,
      to: brand.to,
      ink: brand.ink,
    };
  });
  const totals = {
    providers: providers.length,
    verified: providers.filter((provider) => provider.status === "built" && provider.verified).length,
    built: providers.filter((provider) => provider.status === "built").length,
    local: providers.filter((provider) => provider.tier === "local" || provider.tier === "proxy" || provider.auth === "localLogs").length,
    manual: providers.filter((provider) => provider.tier === "manual" || provider.status === "manual-only").length,
    planned: providers.filter((provider) => provider.status === "planned").length,
  };

  return {
    headline: "Provider passport wall",
    subline: "Every registry source gets a branded passport with auth path, confidence, and next action. Planned stays planned.",
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine("VTK://PROVIDER-PASSPORTS//FULL-REGISTRY//NO-FAKE-GREEN"),
      "|--------------------------------------------------------------|",
      frameLine(`mapped ${totals.providers} // built ${totals.built} // verified ${totals.verified} // local ${totals.local}`),
      frameLine(`manual ${totals.manual} // planned ${totals.planned} // Vibers Unite`),
      frameLine("each card shows source path, confidence, and next command"),
      frameLine("c0vibe.app // local-first // trust labels stay visible"),
      "+--------------------------------------------------------------+",
    ],
    cards,
    totals,
  };
}
