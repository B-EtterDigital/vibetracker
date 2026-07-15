export type EvidenceImpact = "usage" | "local_only" | "not_usage";

export interface EvidenceCockpitStage {
  id: "collect" | "validate" | "redact" | "trust" | "publish";
  label: string;
  status: string;
  command: string;
  note: string;
  impact: EvidenceImpact;
  meter: number;
  ascii: string[];
}

export interface EvidenceCockpitGuard {
  id: "content" | "trust" | "tiers" | "recovery";
  label: string;
  note: string;
}

export interface EvidenceCustodyLink {
  id: "capture" | "privacy" | "trust" | "publish";
  rail: "USAGE" | "LOCAL FIRST" | "TRUST" | "PUBLISH";
  label: string;
  title: string;
  command: string;
  note: string;
  meter: number;
  frames: string[];
  checks: string[];
}

export type EvidenceReplayRail = "CAPTURE" | "VERIFY" | "REDACT" | "SIDECAR" | "RELAY";

export interface EvidenceReplayEvent {
  id: "receipt" | "schema" | "redaction" | "trust-sidecar" | "c0vibe-relay";
  rail: EvidenceReplayRail;
  label: string;
  status: "SEALED" | "LOCAL" | "NOT USAGE" | "READY";
  command: string;
  checkpoint: string;
  hash: string;
  note: string;
  invariant: string;
  meter: number;
  frames: string[];
  marks: string[];
}

export interface EvidenceReplayDeck {
  headline: string;
  subline: string;
  terminalLines: string[];
  events: EvidenceReplayEvent[];
  totals: {
    events: number;
    sealed: number;
    localOnly: number;
    notUsage: number;
    publish: number;
    averageMeter: number;
  };
}

export type EvidenceVerificationRail = "USAGE" | "LOCAL FIRST" | "NOT USAGE" | "PUBLISH";

export interface EvidenceVerificationGate {
  id: "usage-seal" | "machine-boundary" | "trust-split" | "c0vibe-relay";
  rail: EvidenceVerificationRail;
  label: string;
  question: string;
  answer: string;
  command: string;
  writes: string;
  invariant: string;
  meter: number;
  frames: string[];
  checks: string[];
}

export interface EvidenceVerificationBridge {
  headline: string;
  subline: string;
  terminalLines: string[];
  gates: EvidenceVerificationGate[];
  totals: {
    gates: number;
    usageGates: number;
    localOnly: number;
    notUsage: number;
    publish: number;
    zeroHiddenUploads: number;
    trustUsageWrites: number;
    averageMeter: number;
  };
}

export interface EvidenceCockpit {
  headline: string;
  terminalLines: string[];
  stages: EvidenceCockpitStage[];
  guards: EvidenceCockpitGuard[];
  custody: EvidenceCustodyLink[];
  replay: EvidenceReplayDeck;
  bridge: EvidenceVerificationBridge;
}

function fit(value: string | number, width: number): string {
  return String(value).padEnd(width).slice(0, width);
}

function replayFrameLine(value: string): string {
  return `| ${fit(value, 60)} |`;
}

export function buildEvidenceCockpit(): EvidenceCockpit {
  const replayEvents: EvidenceReplayEvent[] = [
    {
      id: "receipt",
      rail: "CAPTURE",
      label: "Provider receipt packet",
      status: "SEALED",
      command: "npx vibetrack sync --receipt",
      checkpoint: "usage ledger intake",
      hash: "sha256:8f3a-vtk-capture",
      note: "Provider records enter as timestamped receipts with adapter, unit, model, and confidence labels.",
      invariant: "Receipts can count only after adapter validation.",
      meter: 94,
      frames: ["HF/CX\nRCPT \nSEALED", "TOKENS\nCOSTS \nMODELS", "SRC OK\nTIME  \nUNIT  "],
      marks: ["HF", "CX", "LM"],
    },
    {
      id: "schema",
      rail: "VERIFY",
      label: "Schema seal",
      status: "SEALED",
      command: "npx vibetrack ledger verify",
      checkpoint: "normalizer + secret scanner",
      hash: "sha256:2c91-schema-ok",
      note: "Records are normalized, bounded, and rejected when hostile keys, secret-shaped values, or fake tiers appear.",
      invariant: "Invalid records are dropped before public totals.",
      meter: 91,
      frames: ["SCHEMA\n PASS \nSEAL  ", "SECRET\nSCAN  \nCLEAN ", "BADKEY\nDROP  \nSAFE  "],
      marks: ["OK", "NO", "DROP"],
    },
    {
      id: "redaction",
      rail: "REDACT",
      label: "Dry-run payload preview",
      status: "LOCAL",
      command: "npx vibetrack upload --dry-run",
      checkpoint: "local-only review vault",
      hash: "sha256:77bd-local-mask",
      note: "The user sees the outbound aggregate first; prompts, files, secrets, and private paths stay on-machine.",
      invariant: "No raw content leaves without explicit review.",
      meter: 88,
      frames: ["LOCAL \nONLY  \nMASK  ", "0 RAW \nPROMPT\nSHIP  ", "DRYRUN\nBEFORE\nRELAY "],
      marks: ["DRY", "0RAW", "MASK"],
    },
    {
      id: "trust-sidecar",
      rail: "SIDECAR",
      label: "Trust sidecar attach",
      status: "NOT USAGE",
      command: "npx vibetrack trust list",
      checkpoint: "github + creator + mcp context",
      hash: "sha256:5aa0-sidecar-nu",
      note: "GitHub cadence, Higgsfield MCP, creator posting, package signals, and profile links stay separate from spend.",
      invariant: "Trust can explain context; it cannot mutate usage rank.",
      meter: 84,
      frames: ["TRUST \nSIDE  \nCAR   ", "HIGGS \nMCP   \nLABEL ", "NOT   \nUSAGE \nRANK  "],
      marks: ["GH", "HF", "YT"],
    },
    {
      id: "c0vibe-relay",
      rail: "RELAY",
      label: "C0VIBE profile feed",
      status: "READY",
      command: "npx vibetrack upload",
      checkpoint: "reviewed aggregate datastream",
      hash: "sha256:c0vibe-profile-feed",
      note: "The vibe score, public profile, badges, and leaderboard consume reviewed aggregates plus labelled trust context.",
      invariant: "Publish is explicit and profile tiers remain visible.",
      meter: 86,
      frames: ["C0VIBE\n .APP \nFEED  ", "VIBERS\nUNITE \nLIVE  ", "PUBLIC\nTIERS \nCLEAR "],
      marks: ["C0", "VS", "PUB"],
    },
  ];
  const replayAverage = Math.round(replayEvents.reduce((sum, event) => sum + event.meter, 0) / replayEvents.length);
  const bridgeGates: EvidenceVerificationGate[] = [
    {
      id: "usage-seal",
      rail: "USAGE",
      label: "Usage seal",
      question: "What counts?",
      answer: "Only validated provider receipts become usage totals.",
      command: "npx vibetrack ledger verify",
      writes: "accepted aggregates only",
      invariant: "Rejected, hostile, empty, or self-certified records never enter public usage.",
      meter: 93,
      frames: ["USAGE \nSEAL  \nOK    ", "SCHEMA\nPASS  \nCOUNT ", "BAD   \nDROP  \nSAFE  "],
      checks: ["schema pass", "adapter source", "rankable aggregate"],
    },
    {
      id: "machine-boundary",
      rail: "LOCAL FIRST",
      label: "Machine boundary",
      question: "What leaves?",
      answer: "The dry-run preview shows the aggregate payload before upload.",
      command: "npx vibetrack upload --dry-run",
      writes: "0 hidden uploads",
      invariant: "Prompts, files, secrets, and private paths stay blocked unless the user explicitly exports them.",
      meter: 90,
      frames: ["LOCAL \nFIRST \nGATE  ", "DRYRUN\nVIEW  \nONLY  ", "0 HIDE\nUPLOAD\nFOUND "],
      checks: ["redaction preview", "secret scan", "review before relay"],
    },
    {
      id: "trust-split",
      rail: "NOT USAGE",
      label: "Trust split",
      question: "What is proof context?",
      answer: "GitHub, Higgsfield MCP, creator, package, and social signals stay in a sidecar.",
      command: "npx vibetrack trust list",
      writes: "0 usage writes",
      invariant: "Trust sidecars explain credibility, but mutate 0 spend, 0 credits, 0 ops, and 0 rank.",
      meter: 87,
      frames: ["TRUST \nSIDE  \nCAR   ", "HIGGS \nMCP   \n+0USE ", "GITHUB\nHEAT  \n+0RANK"],
      checks: ["NOT USAGE", "+0 score", "separate public label"],
    },
    {
      id: "c0vibe-relay",
      rail: "PUBLISH",
      label: "C0VIBE relay",
      question: "When public?",
      answer: "Only explicit reviewed upload feeds the profile, score, badges, and board.",
      command: "npx vibetrack upload",
      writes: "reviewed publish only",
      invariant: "Public surfaces read the same reviewed aggregate receipt and keep tier labels visible.",
      meter: 86,
      frames: ["C0VIBE\nRELAY \nREADY ", "PROFILE\nSCORE \nBOARD ", "VIBERS\nUNITE \nLIVE  "],
      checks: ["explicit publish", "tier visible", "same receipt"],
    },
  ];
  const bridgeAverage = Math.round(bridgeGates.reduce((sum, gate) => sum + gate.meter, 0) / bridgeGates.length);

  return {
    headline: "FAST / HONEST / TRACEABLE",
    terminalLines: [
      "$ npx vibetrack sync --demo",
      "[scan] Higgsfield prism -> local ledger",
      "[scan] Codex builder trace -> local ledger",
      "[gate] schema ok / secrets rejected",
      "[trust] GitHub cadence == NOT USAGE",
      "[relay] Vibers Unite // c0vibe.app",
    ],
    stages: [
      {
        id: "collect",
        label: "Provider scan",
        status: "SCAN",
        command: "npx vibetrack sync",
        note: "Adapters read usage receipts into the local ledger; provider failures show recovery instead of silence.",
        impact: "usage",
        meter: 91,
        ascii: [" HF  CX ", "<=SCAN=>", " LM  UI "],
      },
      {
        id: "validate",
        label: "Ingest gate",
        status: "CHECK",
        command: "schema + secret scan",
        note: "Records are normalized, schema checked, and secret-shaped fields are rejected before upload.",
        impact: "usage",
        meter: 86,
        ascii: [" [OK]  ", "  ||   ", "[DROP] "],
      },
      {
        id: "redact",
        label: "Privacy preview",
        status: "LOCAL",
        command: "npx vibetrack upload --dry-run",
        note: "The dry-run preview shows what would leave the machine and keeps prompts, files, and secrets out.",
        impact: "local_only",
        meter: 78,
        ascii: ["MASK **", "LOCAL  ", "DRYRUN "],
      },
      {
        id: "trust",
        label: "Trust rail",
        status: "SIDE",
        command: "npx vibetrack trust list",
        note: "GitHub, Higgsfield MCP, YouTube, packages, and creator cadence are labelled NOT USAGE and never change spend.",
        impact: "not_usage",
        meter: 64,
        ascii: ["GIT YT ", "!= $$$ ", "SIGNAL "],
      },
      {
        id: "publish",
        label: "C0VIBE relay",
        status: "RELAY",
        command: "npx vibetrack upload",
        note: "Only reviewed aggregate usage and explicit trust signals can feed c0vibe.app.",
        impact: "usage",
        meter: 72,
        ascii: ["C0VIBE", "APP >>", "UNITE "],
      },
    ],
    guards: [
      {
        id: "content",
        label: "No prompt/content upload",
        note: "Usage records stay about provider, cost, tokens, ops, and source proof.",
      },
      {
        id: "trust",
        label: "Trust never changes spend",
        note: "GitHub and creator cadence are public context, not usage totals.",
      },
      {
        id: "tiers",
        label: "Verified and self-reported stay split",
        note: "Leaderboards do not blend backend-fetched and user-entered evidence.",
      },
      {
        id: "recovery",
        label: "Provider errors are visible",
        note: "Broken OAuth, missing CLIs, and stale tokens get fix paths, not fake data.",
      },
    ],
    custody: [
      {
        id: "capture",
        rail: "USAGE",
        label: "Provider receipts",
        title: "Usage enters as receipts, never vibes",
        command: "npx vibetrack sync --receipt",
        note: "Tokens, credits, generations, model IDs, and cost evidence can count only after adapter validation.",
        meter: 94,
        frames: ["  HF  \n H  F \n  HF  ", " CODEX\n >_ OK\n TRACE", " LM/O \n LOCAL\n READY"],
        checks: ["adapter source", "schema pass", "timestamped"],
      },
      {
        id: "privacy",
        rail: "LOCAL FIRST",
        label: "Review vault",
        title: "The machine shows the payload first",
        command: "npx vibetrack upload --dry-run",
        note: "The dry run labels raw prompts, files, secrets, and private paths as blocked before C0VIBE relay.",
        meter: 88,
        frames: ["DRYRUN\nONLY  \nLOCAL ", "NO RAW\nPROMPT\nUPLOAD", "0 HIDE\nUPLOAD\nFOUND "],
        checks: ["NO RAW PROMPTS", "0 hidden uploads", "redaction preview"],
      },
      {
        id: "trust",
        rail: "TRUST",
        label: "Signal sidecar",
        title: "Public proof stays separate from usage",
        command: "npx vibetrack trust list",
        note: "GitHub heatgrids, Higgsfield MCP, YouTube cadence, and package publishing are useful trust signals, not spend.",
        meter: 81,
        frames: ["TRUST \n!=USE \nSIDE  ", " GIT  \n HEAT \n GRID ", "HIGGS \n MCP  \nSIGNAL"],
        checks: ["NOT USAGE", "separate rail", "score labelled"],
      },
      {
        id: "publish",
        rail: "PUBLISH",
        label: "C0VIBE datastream",
        title: "Reviewed aggregate proof can go public",
        command: "npx vibetrack upload",
        note: "The user profile, vibe score, and public badges read from reviewed aggregates plus clearly labelled trust signals.",
        meter: 86,
        frames: ["C0VIBE\n .APP \nRELAY ", "VIBERS\nUNITE \nREADY ", "PUBLIC\nPROOF \nTIERS "],
        checks: ["explicit publish", "tier split", "profile feed"],
      },
    ],
    bridge: {
      headline: "Verification bridge",
      subline: "The operator-facing handoff between local proof and public profile: every gate answers what counts, what leaves, what is not usage, and when C0VIBE updates.",
      terminalLines: [
        "+--------------------------------------------------------------+",
        replayFrameLine("VTK://PROOF-BRIDGE//OPERATOR-QUESTIONS//ZERO-HIDDEN"),
        "|--------------------------------------------------------------|",
        replayFrameLine("what counts -> validated provider usage only"),
        replayFrameLine("what leaves -> dry-run aggregate after review"),
        replayFrameLine("trust proof -> NOT USAGE sidecar with 0 usage writes"),
        replayFrameLine("Vibers Unite // c0vibe.app // explicit publish"),
        "+--------------------------------------------------------------+",
      ],
      gates: bridgeGates,
      totals: {
        gates: bridgeGates.length,
        usageGates: bridgeGates.filter((gate) => gate.rail === "USAGE").length,
        localOnly: bridgeGates.filter((gate) => gate.rail === "LOCAL FIRST").length,
        notUsage: bridgeGates.filter((gate) => gate.rail === "NOT USAGE").length,
        publish: bridgeGates.filter((gate) => gate.rail === "PUBLISH").length,
        zeroHiddenUploads: 0,
        trustUsageWrites: 0,
        averageMeter: bridgeAverage,
      },
    },
    replay: {
      headline: "Tamper-evident replay",
      subline: "A compact proof recorder that shows every scan-to-profile handoff, what was sealed, and which rails are usage, local-only, trust sidecar, or public relay.",
      terminalLines: [
        "+--------------------------------------------------------------+",
        replayFrameLine("VTK://PROOF-REPLAY//TAMPER-EVIDENT//LOCAL-FIRST"),
        "|--------------------------------------------------------------|",
        replayFrameLine(`events ${fit(replayEvents.length, 4)} sealed ${fit(replayEvents.filter((event) => event.status === "SEALED").length, 4)} avg proof ${fit(`${replayAverage}%`, 6)}`),
        replayFrameLine("capture verify redact sidecar relay"),
        replayFrameLine("trust sidecars are NOT USAGE and never mutate rank"),
        replayFrameLine("Vibers Unite // c0vibe.app // reviewed aggregates"),
        "+--------------------------------------------------------------+",
      ],
      events: replayEvents,
      totals: {
        events: replayEvents.length,
        sealed: replayEvents.filter((event) => event.status === "SEALED").length,
        localOnly: replayEvents.filter((event) => event.status === "LOCAL").length,
        notUsage: replayEvents.filter((event) => event.status === "NOT USAGE").length,
        publish: replayEvents.filter((event) => event.rail === "RELAY").length,
        averageMeter: replayAverage,
      },
    },
  };
}
