import { providerBrand } from "./provider-brand.ts";

export interface HomeCommandDeckCell {
  id: "start" | "scan" | "trust" | "share";
  command: string;
  label: string;
  note: string;
  status: string;
}

export type HomeCommandPaletteImpact = "setup" | "usage" | "not_usage" | "local_only" | "privacy" | "publish";

export interface HomeCommandPaletteAction {
  id: "wizard" | "surprises" | "detect" | "trust" | "sync" | "dry_run";
  command: string;
  label: string;
  chord: string;
  cue: string;
  guardrail: string;
  impact: HomeCommandPaletteImpact;
  meter: number;
  mark: string;
  from: string;
  to: string;
  ink: string;
  terminalLine: string;
  frames: string[];
}

export interface HomeCommandPalette {
  headline: string;
  subline: string;
  terminalLines: string[];
  actions: HomeCommandPaletteAction[];
  totals: {
    actions: number;
    localFirst: number;
    notUsage: number;
    previewProviderCalls: number;
    previewLedgerWrites: number;
    hiddenUploads: number;
  };
}

export type HomeScanConductorImpact = "setup" | "usage" | "trust" | "local_only" | "privacy" | "publish";

export interface HomeScanConductorBeat {
  id: "queue" | "detect" | "collect" | "verify" | "redact" | "relay";
  label: string;
  command: string;
  railLabel: string;
  cue: string;
  guardrail: string;
  impact: HomeScanConductorImpact;
  meter: number;
  mark: string;
  from: string;
  to: string;
  ink: string;
  pulse: string[];
  transcript: string[];
  preview: {
    providerCalls: number;
    ledgerWrites: number;
    uploads: number;
  };
}

export interface HomeScanConductor {
  headline: string;
  subline: string;
  terminalLines: string[];
  beats: HomeScanConductorBeat[];
  totals: {
    beats: number;
    surprises: number;
    previewProviderCalls: number;
    previewLedgerWrites: number;
    hiddenUploads: number;
    usageCommands: number;
    notUsageRails: number;
  };
}

export type HomeProofHudImpact = "usage" | "trust" | "local_only" | "privacy" | "score" | "publish";

export interface HomeProofHudChannel {
  id: "usage_rows" | "trust_sidecar" | "local_shadow" | "privacy_gate" | "score_engine" | "public_relay";
  label: string;
  command: string;
  status: string;
  note: string;
  impact: HomeProofHudImpact;
  meter: number;
  mark: string;
  from: string;
  to: string;
  ink: string;
  readout: string[];
  feeds: {
    score: boolean;
    profile: boolean;
    leaderboard: boolean;
    publicRelay: boolean;
  };
}

export interface HomeProofHud {
  headline: string;
  subline: string;
  terminalLines: string[];
  channels: HomeProofHudChannel[];
  totals: {
    channels: number;
    scoreFeeds: number;
    profileFeeds: number;
    leaderboardFeeds: number;
    publicRelayFeeds: number;
    notUsageChannels: number;
    hiddenUploads: number;
  };
}

export type HomeMissionSpineImpact = "usage" | "trust" | "local_only" | "privacy" | "score" | "publish";

export interface HomeMissionSpineCell {
  id: "usage_datastream" | "trust_sidecar" | "local_capture" | "privacy_gate" | "score_feed" | "c0vibe_profile";
  label: string;
  command: string;
  status: string;
  note: string;
  impact: HomeMissionSpineImpact;
  meter: number;
  mark: string;
  from: string;
  to: string;
  ink: string;
  frames: string[];
  feeds: {
    score: boolean;
    profile: boolean;
    leaderboard: boolean;
    publicRelay: boolean;
  };
}

export interface HomeMissionSpine {
  headline: string;
  subline: string;
  terminalLines: string[];
  cells: HomeMissionSpineCell[];
  totals: {
    cells: number;
    scoreFeeds: number;
    profileFeeds: number;
    leaderboardFeeds: number;
    publicRelayFeeds: number;
    notUsageCells: number;
    localOnlyCells: number;
    hiddenUploads: number;
  };
}

export type HomeDatastreamReactorImpact = "usage" | "privacy" | "score" | "profile" | "heatgrid" | "publish" | "trust";

export interface HomeDatastreamReactorNode {
  id: "accepted_usage" | "receipt_normalizer" | "score_reactor" | "profile_surface" | "heatgrid_replay" | "c0vibe_relay" | "trust_quarantine";
  label: string;
  railLabel: string;
  command: string;
  status: string;
  note: string;
  impact: HomeDatastreamReactorImpact;
  meter: number;
  mark: string;
  from: string;
  to: string;
  ink: string;
  frames: string[];
  feeds: {
    score: boolean;
    profile: boolean;
    heatgrid: boolean;
    leaderboard: boolean;
    publicRelay: boolean;
  };
  sideEffects: {
    hiddenUploads: number;
    rankMutations: number;
    trustBoosts: number;
    promptReads: number;
    outputReads: number;
  };
}

export interface HomeDatastreamReactor {
  headline: string;
  subline: string;
  terminalLines: string[];
  nodes: HomeDatastreamReactorNode[];
  seals: string[];
  totals: {
    nodes: number;
    scoreFeeds: number;
    profileFeeds: number;
    heatgridFeeds: number;
    leaderboardFeeds: number;
    publicRelayFeeds: number;
    notUsageNodes: number;
    hiddenUploads: number;
    rankMutations: number;
    trustBoosts: number;
    promptReads: number;
    outputReads: number;
  };
}

export interface HomeSignalTapeRow {
  id: "higgsfield" | "codex" | "local" | "global" | "c0vibe";
  label: string;
  command: string;
  status: string;
  note: string;
  impact: "usage" | "trust" | "local_only" | "publish";
  meter: number;
  mark: string;
  from: string;
  to: string;
  ink: string;
}

export type HomeOperatorConstellationImpact = "usage" | "trust" | "local_only" | "privacy" | "publish";

export interface HomeOperatorConstellationNode {
  id: "provider_readout" | "trust_sidecar" | "local_loopback" | "privacy_gate" | "c0vibe_relay";
  label: string;
  command: string;
  status: string;
  note: string;
  impact: HomeOperatorConstellationImpact;
  meter: number;
  x: number;
  y: number;
  mark: string;
  from: string;
  to: string;
  ink: string;
}

export interface HomeOperatorConstellationRail {
  id: "source_truth" | "score_feed" | "public_profile";
  label: string;
  value: string;
  note: string;
}

export interface HomeOperatorConstellation {
  headline: string;
  subline: string;
  terminalLines: string[];
  nodes: HomeOperatorConstellationNode[];
  rails: HomeOperatorConstellationRail[];
}

function fit(text: string, width: number): string {
  return text.length > width ? text.slice(0, width) : text.padEnd(width);
}

function frameLine(text: string): string {
  return `| ${fit(text, 60)} |`;
}

export function buildHomeCommandDeck(): HomeCommandDeckCell[] {
  return [
    {
      id: "start",
      command: "npx vibetrack init --gui",
      label: "Open the local wizard",
      note: "Inline terminal, provider filters, masked secrets, and source-mix proof.",
      status: "LOCAL",
    },
    {
      id: "scan",
      command: "vibetracker sync --demo",
      label: "Watch providers light up",
      note: "Higgsfield, Codex, local AI, creator tools, and regional adapters get branded scan feedback.",
      status: "SCAN",
    },
    {
      id: "trust",
      command: "vibetracker trust add github --handle <you>",
      label: "Attach public cadence",
      note: "GitHub and creator signals are labelled NOT USAGE and never change spend totals.",
      status: "SIDE",
    },
    {
      id: "share",
      command: "vibetracker upload --dry-run",
      label: "Review before sharing",
      note: "Vibers Unite at c0vibe.app only after the local privacy cockpit is clean.",
      status: "DRY",
    },
  ];
}

function proofHudChannel(
  id: HomeProofHudChannel["id"],
  providerId: string,
  channel: Omit<HomeProofHudChannel, "id" | "mark" | "from" | "to" | "ink">,
): HomeProofHudChannel {
  const brand = providerBrand(providerId);
  return {
    id,
    ...channel,
    mark: brand.mark,
    from: brand.from,
    to: brand.to,
    ink: brand.ink,
  };
}

function paletteAction(
  id: HomeCommandPaletteAction["id"],
  providerId: string,
  action: Omit<HomeCommandPaletteAction, "id" | "mark" | "from" | "to" | "ink" | "terminalLine">,
): HomeCommandPaletteAction {
  const brand = providerBrand(providerId);
  const rail = action.impact === "not_usage" ? "NOT USAGE" : action.impact.replace("_", " ").toUpperCase();
  return {
    id,
    ...action,
    mark: brand.mark,
    from: brand.from,
    to: brand.to,
    ink: brand.ink,
    terminalLine: frameLine(`${action.chord} ${brand.mark} ${rail} :: ${action.command}`),
  };
}

function conductorBeat(
  id: HomeScanConductorBeat["id"],
  providerId: string,
  beat: Omit<HomeScanConductorBeat, "id" | "mark" | "from" | "to" | "ink" | "preview">,
): HomeScanConductorBeat {
  const brand = providerBrand(providerId);
  return {
    id,
    ...beat,
    mark: brand.mark,
    from: brand.from,
    to: brand.to,
    ink: brand.ink,
    preview: {
      providerCalls: 0,
      ledgerWrites: 0,
      uploads: 0,
    },
  };
}

function missionSpineCell(
  id: HomeMissionSpineCell["id"],
  providerId: string,
  cell: Omit<HomeMissionSpineCell, "id" | "mark" | "from" | "to" | "ink">,
): HomeMissionSpineCell {
  const brand = providerBrand(providerId);
  return {
    id,
    ...cell,
    mark: brand.mark,
    from: brand.from,
    to: brand.to,
    ink: brand.ink,
  };
}

function datastreamReactorNode(
  id: HomeDatastreamReactorNode["id"],
  providerId: string,
  node: Omit<HomeDatastreamReactorNode, "id" | "mark" | "from" | "to" | "ink" | "sideEffects">,
): HomeDatastreamReactorNode {
  const brand = providerBrand(providerId);
  return {
    id,
    ...node,
    mark: brand.mark,
    from: brand.from,
    to: brand.to,
    ink: brand.ink,
    sideEffects: {
      hiddenUploads: 0,
      rankMutations: 0,
      trustBoosts: 0,
      promptReads: 0,
      outputReads: 0,
    },
  };
}

export function buildHomeMissionSpine(): HomeMissionSpine {
  const cells: HomeMissionSpineCell[] = [
    missionSpineCell("usage_datastream", "higgsfield", {
      label: "Usage datastream",
      command: "sync --receipt",
      status: "COUNTS",
      note: "Accepted provider rows feed spend, credits, heatgrid, score, profile, and board.",
      impact: "usage",
      meter: 96,
      frames: ["HF", "$", "row", "ok"],
      feeds: { score: true, profile: true, leaderboard: true, publicRelay: true },
    }),
    missionSpineCell("trust_sidecar", "codex-cli", {
      label: "Trust sidecar",
      command: "trust list",
      status: "NOT USAGE",
      note: "GitHub, Codex, creator cadence, and MCP connection proof stay labelled context.",
      impact: "trust",
      meter: 86,
      frames: ["CX", "git", "mcp", "not"],
      feeds: { score: false, profile: true, leaderboard: false, publicRelay: true },
    }),
    missionSpineCell("local_capture", "ollama", {
      label: "Local capture",
      command: "detect --local",
      status: "LOCAL",
      note: "Ollama, LM Studio, ComfyUI, vLLM, desktop, and browser activity stay on-machine.",
      impact: "local_only",
      meter: 88,
      frames: ["127", "LM", "CU", "ok"],
      feeds: { score: false, profile: true, leaderboard: false, publicRelay: false },
    }),
    missionSpineCell("privacy_gate", "privacy", {
      label: "Privacy gate",
      command: "upload --dry-run",
      status: "0 UPLOAD",
      note: "Dry-run preview, secret scan, redaction, and bundle hash run before public publish.",
      impact: "privacy",
      meter: 98,
      frames: ["dry", "mask", "hash", "0up"],
      feeds: { score: false, profile: false, leaderboard: false, publicRelay: false },
    }),
    missionSpineCell("score_feed", "openrouter", {
      label: "Score feed",
      command: "score --explain",
      status: "DERIVED",
      note: "Vibe score reads reviewed usage factors and labels side context without rank boost.",
      impact: "score",
      meter: 90,
      frames: ["mix", "src", "age", "ok"],
      feeds: { score: true, profile: true, leaderboard: false, publicRelay: true },
    }),
    missionSpineCell("c0vibe_profile", "c0vibe", {
      label: "C0VIBE profile",
      command: "upload --profile",
      status: "VIBERS UNITE",
      note: "c0vibe.app receives reviewed aggregate proof only after the local gate is clean.",
      impact: "publish",
      meter: 100,
      frames: ["C0", "app", ">>>", "ok"],
      feeds: { score: false, profile: true, leaderboard: true, publicRelay: true },
    }),
  ];

  return {
    headline: "MISSION SPINE",
    subline: "A first-screen map of what is live, what is local, what is public, and what is clearly not usage before the larger showpieces begin.",
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine("VTK://MISSION-SPINE//FIRST-SCREEN//C0VIBE.APP"),
      frameLine("usage rows feed score/profile/leaderboard"),
      frameLine("trust sidecar stays NOT USAGE and never boosts rank"),
      frameLine("local capture stays on-machine until reviewed"),
      frameLine("upload --dry-run keeps hiddenUpload 0 before publish"),
      frameLine("Vibers Unite only after reviewed aggregate proof"),
      "+--------------------------------------------------------------+",
    ],
    cells,
    totals: {
      cells: cells.length,
      scoreFeeds: cells.filter((cell) => cell.feeds.score).length,
      profileFeeds: cells.filter((cell) => cell.feeds.profile).length,
      leaderboardFeeds: cells.filter((cell) => cell.feeds.leaderboard).length,
      publicRelayFeeds: cells.filter((cell) => cell.feeds.publicRelay).length,
      notUsageCells: cells.filter((cell) => cell.status === "NOT USAGE" || cell.impact === "trust").length,
      localOnlyCells: cells.filter((cell) => cell.impact === "local_only").length,
      hiddenUploads: 0,
    },
  };
}

export function buildHomeDatastreamReactor(spine: HomeMissionSpine): HomeDatastreamReactor {
  const nodes: HomeDatastreamReactorNode[] = [
    datastreamReactorNode("accepted_usage", "higgsfield", {
      label: "Accepted usage rows",
      railLabel: "USAGE SOURCE",
      command: "sync --receipt",
      status: "LEDGER",
      note: "Only reviewed provider rows can move spend, operations, score, heatgrid, profile, and public ranking.",
      impact: "usage",
      meter: 96,
      frames: ["ROW\nOK\nUSE", "$\nCRED\nOPS", "HASH\nSEAL\nLOCAL"],
      feeds: { score: true, profile: true, heatgrid: true, leaderboard: true, publicRelay: true },
    }),
    datastreamReactorNode("receipt_normalizer", "privacy", {
      label: "Receipt normalizer",
      railLabel: "PRIVACY GATE",
      command: "upload --dry-run",
      status: "REVIEW",
      note: "Secret scan, redaction preview, and bundle hash run before any public surface receives data.",
      impact: "privacy",
      meter: 100,
      frames: ["MASK\nHASH\nDRY", "RAW\nREADS\n0", "HIDDEN\nUPLOAD\n0"],
      feeds: { score: false, profile: false, heatgrid: false, leaderboard: false, publicRelay: false },
    }),
    datastreamReactorNode("score_reactor", "openrouter", {
      label: "Vibe score reactor",
      railLabel: "SCORE FEED",
      command: "score --explain",
      status: "DERIVED",
      note: "The score reads reviewed usage factors and shows trust context without adding spend or rank boost.",
      impact: "score",
      meter: 92,
      frames: ["MIX\nSRC\nAGE", "SCORE\nFEED\nOK", "TRUST\n+0\nOK"],
      feeds: { score: true, profile: true, heatgrid: false, leaderboard: false, publicRelay: true },
    }),
    datastreamReactorNode("profile_surface", "c0vibe", {
      label: "Profile surface",
      railLabel: "PROFILE FEED",
      command: "profile --render",
      status: "AGGREGATE",
      note: "Profile panels can show usage, local labels, and trust sidecars, but not raw prompts or outputs.",
      impact: "profile",
      meter: 94,
      frames: ["USER\nCARD\nLIVE", "LOCAL\nLABEL\nOK", "RAW\nPROMPTS\n0"],
      feeds: { score: false, profile: true, heatgrid: false, leaderboard: false, publicRelay: true },
    }),
    datastreamReactorNode("heatgrid_replay", "github-actions", {
      label: "Heatgrid replay",
      railLabel: "OFFICIAL GH COLORS",
      command: "stats --daily --heatgrid",
      status: "USAGE ONLY",
      note: "The heatgrid animates accepted daily usage totals with official GitHub contribution levels.",
      impact: "heatgrid",
      meter: 90,
      frames: ["GH\nL0-L4\nUSE", "DAY\nCELL\nFILL", "TRUST\nBOOST\n0"],
      feeds: { score: false, profile: true, heatgrid: true, leaderboard: true, publicRelay: true },
    }),
    datastreamReactorNode("c0vibe_relay", "c0vibe", {
      label: "C0VIBE relay",
      railLabel: "PUBLISH",
      command: "upload --reviewed --to c0vibe.app",
      status: "VIBERS UNITE",
      note: "c0vibe.app receives reviewed aggregate proof only after the user approves the public publish.",
      impact: "publish",
      meter: 100,
      frames: ["C0VIBE\nAPP", "PROFILE\nSCORE\nGRID", "VIBERS\nUNITE\nGO"],
      feeds: { score: false, profile: true, heatgrid: true, leaderboard: true, publicRelay: true },
    }),
    datastreamReactorNode("trust_quarantine", "codex-cli", {
      label: "Trust quarantine",
      railLabel: "NOT USAGE",
      command: "trust list --sidecar",
      status: "SIDE RAIL",
      note: "GitHub cadence, Codex traces, Higgsfield MCP, and creator posting evidence stay context-only.",
      impact: "trust",
      meter: 100,
      frames: ["TRUST\nSIDE\nRAIL", "SCORE\nMATH\n+0", "RANK\nMUTATE\n0"],
      feeds: { score: false, profile: true, heatgrid: false, leaderboard: false, publicRelay: true },
    }),
  ];
  const totals = nodes.reduce<HomeDatastreamReactor["totals"]>(
    (sum, node) => ({
      nodes: sum.nodes + 1,
      scoreFeeds: sum.scoreFeeds + (node.feeds.score ? 1 : 0),
      profileFeeds: sum.profileFeeds + (node.feeds.profile ? 1 : 0),
      heatgridFeeds: sum.heatgridFeeds + (node.feeds.heatgrid ? 1 : 0),
      leaderboardFeeds: sum.leaderboardFeeds + (node.feeds.leaderboard ? 1 : 0),
      publicRelayFeeds: sum.publicRelayFeeds + (node.feeds.publicRelay ? 1 : 0),
      notUsageNodes: sum.notUsageNodes + (node.impact === "trust" || node.railLabel === "NOT USAGE" ? 1 : 0),
      hiddenUploads: sum.hiddenUploads + node.sideEffects.hiddenUploads,
      rankMutations: sum.rankMutations + node.sideEffects.rankMutations,
      trustBoosts: sum.trustBoosts + node.sideEffects.trustBoosts,
      promptReads: sum.promptReads + node.sideEffects.promptReads,
      outputReads: sum.outputReads + node.sideEffects.outputReads,
    }),
    {
      nodes: 0,
      scoreFeeds: 0,
      profileFeeds: 0,
      heatgridFeeds: 0,
      leaderboardFeeds: 0,
      publicRelayFeeds: 0,
      notUsageNodes: 0,
      hiddenUploads: spine.totals.hiddenUploads,
      rankMutations: 0,
      trustBoosts: 0,
      promptReads: 0,
      outputReads: 0,
    },
  );

  return {
    headline: "DATASTREAM REACTOR",
    subline: "The front-page proof strip for the new VibeTRACKER stream: accepted usage rows feed score, profile, heatgrid, board, and C0VIBE while trust stays quarantined.",
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine("VTK://DATASTREAM-REACTOR//SCORE-PROFILE-HEATGRID//C0VIBE"),
      frameLine(`mission scoreFeeds ${spine.totals.scoreFeeds} profileFeeds ${spine.totals.profileFeeds}`),
      frameLine(`mission boardFeeds ${spine.totals.leaderboardFeeds} relayFeeds ${spine.totals.publicRelayFeeds}`),
      frameLine("accepted usage -> score -> profile -> heatgrid -> c0vibe"),
      frameLine("trust sidecar -> profile context only // NOT USAGE"),
      frameLine("hiddenUpload 0 rankMutations 0 trustBoosts 0"),
      frameLine("Vibers Unite // c0vibe.app after reviewed publish"),
      "+--------------------------------------------------------------+",
    ],
    nodes,
    seals: [
      "hiddenUpload=0",
      "rankMutations=0",
      "trustBoosts=0",
      "promptReads=0",
      "outputReads=0",
      "rawContent=0",
    ],
    totals,
  };
}

export function buildHomeProofHud(): HomeProofHud {
  const channels: HomeProofHudChannel[] = [
    proofHudChannel("usage_rows", "higgsfield", {
      label: "Usage rows",
      command: "sync --receipt",
      status: "COUNTS USAGE",
      note: "Validated provider rows are the only stream that can move spend, credits, operations, and rank.",
      impact: "usage",
      meter: 94,
      readout: ["score:yes", "profile:yes", "leaderboard:yes"],
      feeds: { score: true, profile: true, leaderboard: true, publicRelay: true },
    }),
    proofHudChannel("trust_sidecar", "codex-cli", {
      label: "Trust sidecar",
      command: "trust list",
      status: "NOT USAGE",
      note: "GitHub, Codex, creator cadence, and Higgsfield MCP proof explain context without changing totals.",
      impact: "trust",
      meter: 86,
      readout: ["score:no", "profile:context", "leaderboard:no"],
      feeds: { score: false, profile: true, leaderboard: false, publicRelay: true },
    }),
    proofHudChannel("local_shadow", "ollama", {
      label: "Local shadow",
      command: "detect --local",
      status: "LOCAL ONLY",
      note: "Ollama, LM Studio, ComfyUI, and LAN activity stay private until a reviewed ledger row exists.",
      impact: "local_only",
      meter: 82,
      readout: ["score:optional", "profile:private", "leaderboard:no"],
      feeds: { score: false, profile: true, leaderboard: false, publicRelay: false },
    }),
    proofHudChannel("privacy_gate", "privacy", {
      label: "Privacy gate",
      command: "upload --dry-run",
      status: "REDACT FIRST",
      note: "Secret scan, bundle hash, and dry-run review decide what is safe to publish.",
      impact: "privacy",
      meter: 98,
      readout: ["hiddenUpload:0", "rawRecords:local", "review:required"],
      feeds: { score: false, profile: false, leaderboard: false, publicRelay: false },
    }),
    proofHudChannel("score_engine", "openai", {
      label: "Score engine",
      command: "profile datastream",
      status: "DERIVED",
      note: "Vibe score, profile panels, and heatgrid read from the same reviewed aggregate datastream.",
      impact: "score",
      meter: 90,
      readout: ["usage factors", "source mix", "freshness"],
      feeds: { score: true, profile: true, leaderboard: false, publicRelay: true },
    }),
    proofHudChannel("public_relay", "c0vibe", {
      label: "Public relay",
      command: "upload --reviewed",
      status: "C0VIBE.APP",
      note: "Vibers Unite only after reviewed aggregate proof is ready for the public profile.",
      impact: "publish",
      meter: 100,
      readout: ["profile:public", "leaderboard:aggregate", "rawPrompts:no"],
      feeds: { score: false, profile: true, leaderboard: true, publicRelay: true },
    }),
  ];

  return {
    headline: "PROOF HUD",
    subline: "A compact truth table for the whole product: what feeds score, profile, leaderboard, and C0VIBE, and what stays labelled side evidence.",
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine("VTK://PROOF-HUD//DATASTREAM-TRUTH//VIBERS-UNITE"),
      frameLine("usage rows feed score/profile/leaderboard"),
      frameLine("trust sidecar stays NOT USAGE"),
      frameLine("local shadow stays private until reviewed ledger row"),
      frameLine("privacy gate keeps hiddenUpload 0 before publish"),
      frameLine("C0vibe.app relay receives reviewed aggregates only"),
      "+--------------------------------------------------------------+",
    ],
    channels,
    totals: {
      channels: channels.length,
      scoreFeeds: channels.filter((channel) => channel.feeds.score).length,
      profileFeeds: channels.filter((channel) => channel.feeds.profile).length,
      leaderboardFeeds: channels.filter((channel) => channel.feeds.leaderboard).length,
      publicRelayFeeds: channels.filter((channel) => channel.feeds.publicRelay).length,
      notUsageChannels: channels.filter((channel) => channel.status === "NOT USAGE" || channel.impact === "trust").length,
      hiddenUploads: 0,
    },
  };
}

export function buildHomeCommandPalette(): HomeCommandPalette {
  const actions: HomeCommandPaletteAction[] = [
    paletteAction("wizard", "c0vibe", {
      command: "npx vibetrack init --gui",
      label: "Open GUI wizard",
      chord: "CTRL+1",
      cue: "Terminal charm jumps into the GUI with masked setup and provider filters.",
      guardrail: "Local wizard launch; no hidden upload, no provider calls until the user connects a source.",
      impact: "setup",
      meter: 96,
      frames: [" C0  ", " GUI ", " |>  ", " OK  "],
    }),
    paletteAction("surprises", "higgsfield", {
      command: "vibetracker surprises --provider higgsfield,codex-cli,ollama --static",
      label: "Preview scan reel",
      chord: "CTRL+2",
      cue: "Higgsfield prism, Codex cube, local sonar, and C0VIBE relay replay safely.",
      guardrail: "Static preview only: providerCalls=0, ledgerWrites=0, hiddenUpload=0.",
      impact: "setup",
      meter: 100,
      frames: [" /\\  ", "-HF- ", "<CX>", " C0  "],
    }),
    paletteAction("detect", "ollama", {
      command: "vibetracker detect",
      label: "Scan local AI",
      chord: "CTRL+3",
      cue: "Ollama, LM Studio, ComfyUI, vLLM, and loopback-compatible tools get a local rail.",
      guardrail: "Local/LAN discovery stays on-machine and does not upload prompts, outputs, or secrets.",
      impact: "local_only",
      meter: 88,
      frames: ["127  ", "0.0.1", " ping", " LAN "],
    }),
    paletteAction("trust", "codex-cli", {
      command: "vibetracker trust list",
      label: "Inspect trust side rail",
      chord: "CTRL+4",
      cue: "GitHub, Codex, creator cadence, and Higgsfield MCP connection proof stay visible.",
      guardrail: "NOT USAGE. Trust never changes spend, credits, operations, rank, or verified status.",
      impact: "not_usage",
      meter: 82,
      frames: [" +--+", "/CX/", "git ", "NOT$"],
    }),
    paletteAction("sync", "openai", {
      command: "vibetracker sync --receipt",
      label: "Collect reviewed usage",
      chord: "CTRL+5",
      cue: "Real provider collection writes only accepted local ledger rows and emits a receipt.",
      guardrail: "This command can write local usage rows; animations never decide truth.",
      impact: "usage",
      meter: 92,
      frames: [" api ", "fetch", "check", "lock "],
    }),
    paletteAction("dry_run", "c0vibe", {
      command: "vibetracker upload --dry-run",
      label: "Review C0VIBE relay",
      chord: "CTRL+6",
      cue: "Preview exactly what would feed c0vibe.app before any public publish step.",
      guardrail: "Dry run only; hiddenUpload=0 and secrets are scanned before sharing.",
      impact: "privacy",
      meter: 98,
      frames: ["scan", "hash", "redact", "C0? "],
    }),
  ];

  const localFirst = actions.filter((action) => ["setup", "local_only", "privacy"].includes(action.impact)).length;
  const notUsage = actions.filter((action) => action.impact === "not_usage").length;

  return {
    headline: "COMMAND PALETTE",
    subline: "A first-screen operator palette that turns the beautiful terminal panels into concrete next commands with honest side-effect labels.",
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine("VTK://COMMAND-PALETTE//FIRST-SCREEN//VIBERS-UNITE"),
      frameLine("preview providerCalls 0 ledgerWrites 0 hiddenUpload 0"),
      frameLine("commands disclose when they can write local usage rows"),
      frameLine("trust and creator cadence stay NOT USAGE"),
      ...actions.slice(0, 4).map((action) => action.terminalLine),
      frameLine("C0vibe.app relay waits for upload --dry-run review"),
      "+--------------------------------------------------------------+",
    ],
    actions,
    totals: {
      actions: actions.length,
      localFirst,
      notUsage,
      previewProviderCalls: 0,
      previewLedgerWrites: 0,
      hiddenUploads: 0,
    },
  };
}

export function buildHomeScanConductor(): HomeScanConductor {
  const beats: HomeScanConductorBeat[] = [
    conductorBeat("queue", "higgsfield", {
      label: "Queue surprise reel",
      command: "vibetracker surprises --static",
      railLabel: "VISUAL ONLY",
      cue: "The Higgsfield prism and provider marks spin up before any collector runs.",
      guardrail: "Animated preview only: no provider call, no ledger write, no upload.",
      impact: "setup",
      meter: 100,
      pulse: ["  /\\  ", " <HF> ", " /__\\ ", " turn "],
      transcript: ["queue:scan-reel", "higgsfield prism armed", "codex cube queued"],
    }),
    conductorBeat("detect", "ollama", {
      label: "Detect local lab",
      command: "vibetracker detect --local",
      railLabel: "LOCAL ONLY",
      cue: "Loopback and LAN AI tools get sonar feedback without leaving the machine.",
      guardrail: "Detects local services only; prompts, outputs, and secrets are never read.",
      impact: "local_only",
      meter: 88,
      pulse: ["127.0", " ping", " LM  ", " OK  "],
      transcript: ["ollama:127.0.0.1", "lmstudio:probe", "comfyui:optional"],
    }),
    conductorBeat("collect", "openai", {
      label: "Collect usage receipt",
      command: "vibetracker sync --receipt",
      railLabel: "USAGE",
      cue: "When the user runs collection, real usage rows get a local receipt first.",
      guardrail: "This preview writes nothing; the real command clearly enters local usage mode.",
      impact: "usage",
      meter: 92,
      pulse: [" api ", "read ", "row+ ", "seal "],
      transcript: ["adapter:validated", "local ledger:manual run", "receipt:required"],
    }),
    conductorBeat("verify", "codex-cli", {
      label: "Verify trust sidecar",
      command: "vibetracker trust list",
      railLabel: "NOT USAGE",
      cue: "GitHub, Codex, creator cadence, and Higgsfield MCP show up as proof context.",
      guardrail: "Trust context never changes spend, credits, operations, rank, or score math.",
      impact: "trust",
      meter: 84,
      pulse: [" +--+", " CX  ", " git ", "NOT$"],
      transcript: ["github cadence:sidecar", "higgsfield mcp:connection", "usage total:unchanged"],
    }),
    conductorBeat("redact", "privacy", {
      label: "Redact bundle",
      command: "vibetracker upload --dry-run",
      railLabel: "PRIVACY",
      cue: "Secret scan, bundle hash, and local review run before anything public exists.",
      guardrail: "Dry-run preview has hiddenUpload=0 and keeps raw records local.",
      impact: "privacy",
      meter: 98,
      pulse: ["scan", "hash", "mask", "hold"],
      transcript: ["secret scan:required", "bundle hash:ready", "public rows:review"],
    }),
    conductorBeat("relay", "c0vibe", {
      label: "Relay reviewed profile",
      command: "vibetracker upload --reviewed",
      railLabel: "PUBLISH",
      cue: "Vibers Unite at c0vibe.app after the reviewed aggregate datastream is clean.",
      guardrail: "Public relay is explicit and reviewed; this conductor still uploads nothing.",
      impact: "publish",
      meter: 100,
      pulse: [" C0 ", "vibe", "app ", ">>> "],
      transcript: ["profile:aggregate only", "score:datastream fed", "c0vibe.app:ready"],
    }),
  ];

  return {
    headline: "SCAN CONDUCTOR",
    subline: "A live-feeling first-run rail that choreographs the surprises across scanning and collection while proving the preview itself has zero side effects.",
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine("VTK://SCAN-CONDUCTOR//SURPRISES//VIBERS-UNITE"),
      frameLine("preview providerCalls 0 ledgerWrites 0 hiddenUpload 0"),
      frameLine("queue -> detect -> collect -> verify -> redact -> relay"),
      frameLine("usage commands are labelled before they can write rows"),
      frameLine("trust rails stay NOT USAGE and never alter score math"),
      frameLine("C0vibe.app relay waits for reviewed aggregate upload"),
      "+--------------------------------------------------------------+",
    ],
    beats,
    totals: {
      beats: beats.length,
      surprises: beats.filter((beat) => beat.pulse.length >= 4).length,
      previewProviderCalls: beats.reduce((sum, beat) => sum + beat.preview.providerCalls, 0),
      previewLedgerWrites: beats.reduce((sum, beat) => sum + beat.preview.ledgerWrites, 0),
      hiddenUploads: beats.reduce((sum, beat) => sum + beat.preview.uploads, 0),
      usageCommands: beats.filter((beat) => beat.impact === "usage").length,
      notUsageRails: beats.filter((beat) => beat.railLabel === "NOT USAGE").length,
    },
  };
}

function brandedRow(
  id: HomeSignalTapeRow["id"],
  providerId: string,
  row: Omit<HomeSignalTapeRow, "id" | "mark" | "from" | "to" | "ink">,
): HomeSignalTapeRow {
  const brand = providerBrand(providerId);
  return {
    id,
    ...row,
    mark: brand.mark,
    from: brand.from,
    to: brand.to,
    ink: brand.ink,
  };
}

function brandedConstellationNode(
  providerId: string,
  node: Omit<HomeOperatorConstellationNode, "mark" | "from" | "to" | "ink">,
): HomeOperatorConstellationNode {
  const brand = providerBrand(providerId);
  return {
    ...node,
    mark: brand.mark,
    from: brand.from,
    to: brand.to,
    ink: brand.ink,
  };
}

export function buildHomeSignalTape(): HomeSignalTapeRow[] {
  return [
    brandedRow("higgsfield", "higgsfield", {
      label: "Higgsfield prism",
      command: "sync --provider higgsfield",
      status: "creator usage",
      note: "Authenticated MCP/provider records fold into the local ledger only after validation.",
      impact: "usage",
      meter: 94,
    }),
    brandedRow("codex", "codex-cli", {
      label: "Codex trace",
      command: "trust github codex",
      status: "NOT USAGE",
      note: "Builder cadence strengthens context while staying out of spend totals.",
      impact: "trust",
      meter: 88,
    }),
    brandedRow("local", "ollama", {
      label: "Local lab",
      command: "detect --local",
      status: "local-only",
      note: "Ollama, LM Studio, ComfyUI, and loopback tools stay on-machine until review.",
      impact: "local_only",
      meter: 82,
    }),
    brandedRow("global", "qwen", {
      label: "Global rail",
      command: "sync --regional",
      status: "adapter pass",
      note: "Chinese, European, and adjacent providers keep their own labelled source lane.",
      impact: "usage",
      meter: 76,
    }),
    brandedRow("c0vibe", "c0vibe", {
      label: "C0VIBE relay",
      command: "upload --dry-run",
      status: "review gate",
      note: "Vibers Unite at c0vibe.app only after the local review cockpit is clean.",
      impact: "publish",
      meter: 100,
    }),
  ];
}

export function buildHomeOperatorConstellation(): HomeOperatorConstellation {
  const nodes: HomeOperatorConstellationNode[] = [
    brandedConstellationNode("higgsfield", {
      id: "provider_readout",
      label: "Provider readout",
      command: "sync providers",
      status: "usage only",
      note: "Higgsfield, Replicate, creator tools, and APIs enter as labelled source rows.",
      impact: "usage",
      meter: 92,
      x: 16,
      y: 26,
    }),
    brandedConstellationNode("codex-cli", {
      id: "trust_sidecar",
      label: "Builder sidecar",
      command: "trust github",
      status: "NOT USAGE",
      note: "GitHub, Codex, and creator cadence travel beside usage; never spend.",
      impact: "trust",
      meter: 86,
      x: 40,
      y: 64,
    }),
    brandedConstellationNode("ollama", {
      id: "local_loopback",
      label: "Local loopback",
      command: "detect local",
      status: "on-machine",
      note: "Ollama, LM Studio, ComfyUI, vLLM, and LAN probes stay private by default.",
      impact: "local_only",
      meter: 80,
      x: 58,
      y: 22,
    }),
    brandedConstellationNode("privacy", {
      id: "privacy_gate",
      label: "Review gate",
      command: "upload --dry-run",
      status: "redact first",
      note: "Secret scan, bundle hash, and dry-run review happen before any public relay.",
      impact: "privacy",
      meter: 96,
      x: 72,
      y: 70,
    }),
    brandedConstellationNode("c0vibe", {
      id: "c0vibe_relay",
      label: "C0VIBE relay",
      command: "publish profile",
      status: "c0vibe.app",
      note: "Vibers Unite only after reviewed aggregates feed score, profile, and board.",
      impact: "publish",
      meter: 100,
      x: 86,
      y: 38,
    }),
  ];
  return {
    headline: "OPERATOR CONSTELLATION",
    subline: "A first-screen map of how usage, trust, local AI, privacy, and public profile signals stay separated while feeding one beautiful tracker.",
    terminalLines: [
      "VTK://OPERATOR-CONSTELLATION//VIBERS-UNITE",
      "source rows -> score/profile/leaderboard",
      "trust sidecar -> NOT USAGE",
      "local loopback -> private until review",
      "dry-run gate -> c0vibe.app relay",
    ],
    nodes,
    rails: [
      {
        id: "source_truth",
        label: "Source truth",
        value: "validated rows",
        note: "Provider records, local logs, and manual ledgers keep confidence labels.",
      },
      {
        id: "score_feed",
        label: "Score feed",
        value: "usage factors",
        note: "Vibe score and profile dashboards read from the reviewed datastream.",
      },
      {
        id: "public_profile",
        label: "Public profile",
        value: "reviewed only",
        note: "c0vibe.app gets aggregate proof after local redaction and dry-run.",
      },
    ],
  };
}
