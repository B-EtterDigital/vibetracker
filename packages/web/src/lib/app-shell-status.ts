import { providerBrand } from "./provider-brand.ts";

export type AppShellSignalImpact = "usage" | "trust" | "local" | "privacy" | "publish";

export interface AppShellSignal {
  id: "usage-stream" | "trust-sidecar" | "local-loop" | "privacy-gate" | "c0vibe-relay";
  mark: string;
  label: string;
  impact: AppShellSignalImpact;
  command: string;
  value: string;
  note: string;
  guardrail: string;
  meter: number;
  from: string;
  to: string;
  ink: string;
  frames: string[];
  preview: {
    providerCalls: number;
    ledgerWrites: number;
    hiddenUploads: number;
  };
}

export interface AppShellBeacon {
  id: "higgsfield-prism" | "codex-cube" | "local-sonar" | "c0vibe-flash";
  label: string;
  impact: AppShellSignalImpact;
  mark: string;
  command: string;
  value: string;
  guardrail: string;
  from: string;
  to: string;
  ink: string;
  frames: string[];
}

export interface AppShellCommand {
  id:
    | "wizard-bootstrap"
    | "scan-room"
    | "proof-center"
    | "score-lab"
    | "insights-radar"
    | "motion-lab"
    | "public-profile";
  label: string;
  href: string;
  impact: AppShellSignalImpact;
  mark: string;
  command: string;
  value: string;
  note: string;
  guardrail: string;
  meter: number;
  from: string;
  to: string;
  ink: string;
  frames: string[];
}

export interface AppShellRelayHop {
  id: "cli-ignite" | "scan-theatre" | "proof-gate" | "score-reactor" | "public-unite";
  label: string;
  href: string;
  impact: AppShellSignalImpact;
  mark: string;
  command: string;
  value: string;
  note: string;
  guardrail: string;
  meter: number;
  from: string;
  to: string;
  ink: string;
  frames: string[];
  preview: {
    providerCalls: number;
    ledgerWrites: number;
    hiddenUploads: number;
    usageMutations: number;
    promptReads: number;
    outputReads: number;
  };
}

export interface AppShellConstellationNode {
  id:
    | "terminal-seed"
    | "provider-theatre"
    | "privacy-airlock"
    | "score-reactor"
    | "budget-radar"
    | "public-signal";
  label: string;
  href: string;
  impact: AppShellSignalImpact;
  mark: string;
  value: string;
  route: string;
  detail: string;
  guardrail: string;
  meter: number;
  from: string;
  to: string;
  ink: string;
  frames: string[];
  preview: {
    providerCalls: number;
    hiddenUploads: number;
    usageMutations: number;
  };
}

export interface AppShellMarqueeStep {
  id:
    | "usage-live"
    | "trust-side"
    | "local-lab"
    | "privacy-dry-run"
    | "score-feed"
    | "c0vibe-unite";
  label: string;
  impact: AppShellSignalImpact;
  mark: string;
  value: string;
  guardrail: string;
  meter: number;
  from: string;
  to: string;
  ink: string;
  preview: {
    providerCalls: number;
    ledgerWrites: number;
    hiddenUploads: number;
    promptReads: number;
    outputReads: number;
    usageMutations: number;
  };
}

export interface AppShellMarquee {
  headline: string;
  steps: AppShellMarqueeStep[];
  counters: {
    providerCalls: number;
    ledgerWrites: number;
    hiddenUploads: number;
    promptReads: number;
    outputReads: number;
    usageMutations: number;
    sideEffects: number;
  };
}

export interface AppShellConstellation {
  headline: string;
  subline: string;
  terminalLines: string[];
  nodes: AppShellConstellationNode[];
  counters: {
    providerCalls: number;
    hiddenUploads: number;
    usageMutations: number;
  };
}

export interface AppShellSpectrumRail {
  id: AppShellSignal["id"];
  label: string;
  impact: AppShellSignalImpact;
  mark: string;
  value: string;
  command: string;
  guardrail: string;
  meter: number;
  from: string;
  to: string;
  ink: string;
  bars: number[];
  preview: AppShellSignal["preview"];
}

export interface AppShellSpectrum {
  headline: string;
  subline: string;
  terminalLines: string[];
  rails: AppShellSpectrumRail[];
  counters: {
    providerCalls: number;
    ledgerWrites: number;
    hiddenUploads: number;
  };
}

export interface AppShellUniteRelay {
  headline: string;
  subline: string;
  terminalLines: string[];
  hops: AppShellRelayHop[];
  counters: {
    providerCalls: number;
    ledgerWrites: number;
    hiddenUploads: number;
    usageMutations: number;
    promptReads: number;
    outputReads: number;
  };
}

export interface AppShellStatus {
  terminalLines: string[];
  signals: AppShellSignal[];
  beacons: AppShellBeacon[];
  commands: AppShellCommand[];
  relay: AppShellUniteRelay;
  constellation: AppShellConstellation;
  spectrum: AppShellSpectrum;
  marquee: AppShellMarquee;
  ticker: string;
  totals: {
    signals: number;
    beacons: number;
    commands: number;
    relayHops: number;
    spectrumRails: number;
    brandedSignals: number;
    previewProviderCalls: number;
    previewLedgerWrites: number;
    hiddenUploads: number;
    relaySideEffects: number;
    constellationNodes: number;
    constellationSideEffects: number;
    spectrumSideEffects: number;
    marqueeSteps: number;
    marqueeSideEffects: number;
    notUsageRails: number;
  };
}

function fit(value: string | number, width: number): string {
  return String(value).padEnd(width).slice(0, width);
}

function frameLine(value: string): string {
  return `| ${fit(value, 60)} |`;
}

function shellSignal(
  id: AppShellSignal["id"],
  providerId: string,
  signal: Omit<AppShellSignal, "id" | "mark" | "from" | "to" | "ink" | "preview">,
): AppShellSignal {
  const brand = providerBrand(providerId);
  return {
    id,
    ...signal,
    mark: brand.mark,
    from: brand.from,
    to: brand.to,
    ink: brand.ink,
    preview: {
      providerCalls: 0,
      ledgerWrites: 0,
      hiddenUploads: 0,
    },
  };
}

function shellBeacon(
  id: AppShellBeacon["id"],
  providerId: string,
  beacon: Omit<AppShellBeacon, "id" | "mark" | "from" | "to" | "ink">,
): AppShellBeacon {
  const brand = providerBrand(providerId);
  return {
    id,
    ...beacon,
    mark: brand.mark,
    from: brand.from,
    to: brand.to,
    ink: brand.ink,
  };
}

function shellCommand(
  id: AppShellCommand["id"],
  providerId: string,
  command: Omit<AppShellCommand, "id" | "mark" | "from" | "to" | "ink">,
): AppShellCommand {
  const brand = providerBrand(providerId);
  return {
    id,
    ...command,
    mark: brand.mark,
    from: brand.from,
    to: brand.to,
    ink: brand.ink,
  };
}

function shellRelayHop(
  id: AppShellRelayHop["id"],
  providerId: string,
  hop: Omit<AppShellRelayHop, "id" | "mark" | "from" | "to" | "ink" | "preview">,
): AppShellRelayHop {
  const brand = providerBrand(providerId);
  return {
    id,
    ...hop,
    mark: brand.mark,
    from: brand.from,
    to: brand.to,
    ink: brand.ink,
    preview: {
      providerCalls: 0,
      ledgerWrites: 0,
      hiddenUploads: 0,
      usageMutations: 0,
      promptReads: 0,
      outputReads: 0,
    },
  };
}

function shellConstellationNode(
  id: AppShellConstellationNode["id"],
  providerId: string,
  node: Omit<AppShellConstellationNode, "id" | "mark" | "from" | "to" | "ink" | "preview">,
): AppShellConstellationNode {
  const brand = providerBrand(providerId);
  return {
    id,
    ...node,
    mark: brand.mark,
    from: brand.from,
    to: brand.to,
    ink: brand.ink,
    preview: {
      providerCalls: 0,
      hiddenUploads: 0,
      usageMutations: 0,
    },
  };
}

function shellMarqueeStep(
  id: AppShellMarqueeStep["id"],
  providerId: string,
  step: Omit<AppShellMarqueeStep, "id" | "mark" | "from" | "to" | "ink" | "preview">,
): AppShellMarqueeStep {
  const brand = providerBrand(providerId);
  return {
    id,
    ...step,
    mark: brand.mark,
    from: brand.from,
    to: brand.to,
    ink: brand.ink,
    preview: {
      providerCalls: 0,
      ledgerWrites: 0,
      hiddenUploads: 0,
      promptReads: 0,
      outputReads: 0,
      usageMutations: 0,
    },
  };
}

const SPECTRUM_BARS: Record<AppShellSignal["id"], number[]> = {
  "usage-stream": [38, 58, 86, 96, 78, 54, 34],
  "trust-sidecar": [24, 38, 62, 82, 64, 42, 28],
  "local-loop": [34, 56, 78, 90, 86, 60, 36],
  "privacy-gate": [46, 64, 88, 88, 62, 44, 30],
  "c0vibe-relay": [36, 58, 80, 94, 94, 78, 54],
};

export function buildAppShellStatus(): AppShellStatus {
  const signals: AppShellSignal[] = [
    shellSignal("usage-stream", "higgsfield", {
      label: "Usage stream",
      impact: "usage",
      command: "npx vibetrack sync",
      value: "Spend + credits",
      note: "Only normalized usage records feed totals.",
      guardrail: "Preview only. Running sync is explicit and writes a local receipt first.",
      meter: 96,
      frames: ["HF", "$$", "row", "ok"],
    }),
    shellSignal("trust-sidecar", "codex-cli", {
      label: "Trust sidecar",
      impact: "trust",
      command: "npx vibetrack trust list",
      value: "NOT USAGE",
      note: "GitHub, creator, and contribution context stays separate.",
      guardrail: "Trust context never changes spend, credits, rank, or score math.",
      meter: 82,
      frames: ["CX", "git", "mcp", "not"],
    }),
    shellSignal("local-loop", "ollama", {
      label: "Local loop",
      impact: "local",
      command: "npx vibetrack detect",
      value: "Local first",
      note: "Ollama, LM Studio, ComfyUI, desktop, and browser capture remain local.",
      guardrail: "Loopback probes do not upload prompts, outputs, files, or secrets.",
      meter: 90,
      frames: ["127", "LM", "CU", "ok"],
    }),
    shellSignal("privacy-gate", "privacy", {
      label: "Privacy gate",
      impact: "privacy",
      command: "npx vibetrack upload --dry-run",
      value: "Preview",
      note: "Secrets, prompts, files, and raw records are blocked from public upload.",
      guardrail: "Dry-run shell preview keeps providerCalls=0, ledgerWrites=0, hiddenUploads=0.",
      meter: 88,
      frames: ["sec", "hash", "mask", "0up"],
    }),
    shellSignal("c0vibe-relay", "c0vibe", {
      label: "C0VIBE relay",
      impact: "publish",
      command: "npx vibetrack upload",
      value: "Vibers Unite",
      note: "Public profile publishing keeps usage, trust, and local labels visible.",
      guardrail: "c0vibe.app receives reviewed aggregates only.",
      meter: 94,
      frames: ["C0", "app", ">>>", "ok"],
    }),
  ];
  const beacons: AppShellBeacon[] = [
    shellBeacon("higgsfield-prism", "higgsfield", {
      label: "Higgsfield prism",
      impact: "usage",
      command: "provider read after approval",
      value: "HF turn",
      guardrail: "Branded scan cue only; accepted provider rows decide usage.",
      frames: ["HF", "/\\", "<>", "\\/"],
    }),
    shellBeacon("codex-cube", "codex-cli", {
      label: "Codex cube",
      impact: "trust",
      command: "builder evidence sidecar",
      value: "CX cube",
      guardrail: "Contribution cadence is context and stays NOT USAGE.",
      frames: ["CX", "[]", "{}", "<>"],
    }),
    shellBeacon("local-sonar", "ollama", {
      label: "Local sonar",
      impact: "local",
      command: "loopback/local scan",
      value: "127 pulse",
      guardrail: "Local probes never upload prompts, outputs, files, or secrets.",
      frames: ["127", "( )", "(( ))", "ok"],
    }),
    shellBeacon("c0vibe-flash", "c0vibe", {
      label: "C0VIBE flash",
      impact: "publish",
      command: "reviewed public relay",
      value: "Vibers Unite",
      guardrail: "c0vibe.app receives reviewed aggregates only.",
      frames: ["C0", ">>>", "VIBE", "UNITE"],
    }),
  ];
  const spectrumRails: AppShellSpectrumRail[] = signals.map((signal) => ({
    id: signal.id,
    label: signal.label,
    impact: signal.impact,
    mark: signal.mark,
    value: signal.value,
    command: signal.command,
    guardrail: signal.guardrail,
    meter: signal.meter,
    from: signal.from,
    to: signal.to,
    ink: signal.ink,
    bars: SPECTRUM_BARS[signal.id],
    preview: signal.preview,
  }));
  const spectrumCounters = spectrumRails.reduce<AppShellSpectrum["counters"]>((acc, rail) => {
    acc.providerCalls += rail.preview.providerCalls;
    acc.ledgerWrites += rail.preview.ledgerWrites;
    acc.hiddenUploads += rail.preview.hiddenUploads;
    return acc;
  }, { providerCalls: 0, ledgerWrites: 0, hiddenUploads: 0 });
  const spectrum: AppShellSpectrum = {
    headline: "Signal spectrum",
    subline: "A visual-only equalizer for usage, trust, local, privacy, and C0VIBE publish rails. It is theatre, not evidence.",
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine("VTK://APP-SHELL-SPECTRUM//VISUAL-ONLY//NO-COLLECT"),
      frameLine(`rails ${spectrumRails.length} // calls ${spectrumCounters.providerCalls} // writes ${spectrumCounters.ledgerWrites} // uploads ${spectrumCounters.hiddenUploads}`),
      frameLine("usage/trust/local/privacy/publish labels remain attached"),
      frameLine("equalizer bars are presentation; records remain source"),
      frameLine("Vibers Unite // c0vibe.app // global shell spectrum"),
      "+--------------------------------------------------------------+",
    ],
    rails: spectrumRails,
    counters: spectrumCounters,
  };
  const spectrumSideEffects = Object.values(spectrumCounters).reduce((sum, value) => sum + value, 0);
  const commands: AppShellCommand[] = [
    shellCommand("wizard-bootstrap", "c0vibe", {
      label: "First-run wizard",
      href: "/wizard",
      impact: "local",
      command: "npx vibetrack init --gui",
      value: "CLI -> GUI",
      note: "ASCII terminal starts the trust contract; GUI takes over after consent.",
      guardrail: "Setup probes stay local until a reviewed upload step is chosen.",
      meter: 92,
      frames: ["CLI", "GUI", "KEY", "OK"],
    }),
    shellCommand("scan-room", "higgsfield", {
      label: "Scan room",
      href: "/scan",
      impact: "usage",
      command: "npx vibetrack providers check",
      value: "provider theatre",
      note: "Branded cards show connection state, proof state, and read source.",
      guardrail: "Accepted provider rows write a local receipt before sync.",
      meter: 96,
      frames: ["HF", "OA", "RP", "OK"],
    }),
    shellCommand("proof-center", "privacy", {
      label: "Proof center",
      href: "/proof",
      impact: "privacy",
      command: "npx vibetrack upload --dry-run",
      value: "review gate",
      note: "Black-box review shows exactly what would leave the machine.",
      guardrail: "Dry-run keeps providerCalls=0, ledgerWrites=0, hiddenUploads=0.",
      meter: 90,
      frames: ["dry", "mask", "hash", "0up"],
    }),
    shellCommand("score-lab", "openrouter", {
      label: "Score lab",
      href: "/score",
      impact: "usage",
      command: "npx vibetrack stats",
      value: "score inputs",
      note: "Usage mix, cost, local work, and verified records feed the score view.",
      guardrail: "Trust sidecars stay visible and cannot change spend rank.",
      meter: 88,
      frames: ["use", "mix", "rank", "ok"],
    }),
    shellCommand("insights-radar", "comfyui", {
      label: "Insights radar",
      href: "/insights",
      impact: "local",
      command: "npx vibetrack insights",
      value: "burn + save",
      note: "Forecasts, overlap, cheapest equivalents, and local savings stay readable.",
      guardrail: "No raw prompts, files, local outputs, or secrets become public.",
      meter: 86,
      frames: ["$", "burn", "save", "ok"],
    }),
    shellCommand("motion-lab", "runway", {
      label: "Motion lab",
      href: "/motion",
      impact: "publish",
      command: "npx vibetrack surprises --static",
      value: "ascii theatre",
      note: "Provider-colored motion makes scanning feel alive without hiding labels.",
      guardrail: "Animation is presentation only; it never acts as evidence.",
      meter: 84,
      frames: ["RW", ">>", ">>>", "OK"],
    }),
    shellCommand("public-profile", "c0vibe", {
      label: "Public profile",
      href: "/u/demo",
      impact: "publish",
      command: "npx vibetrack upload",
      value: "C0vibe.app",
      note: "Mobile-readable profile joins usage, trust, proof, and public labels.",
      guardrail: "Only reviewed aggregates publish. Vibers Unite stays the banner.",
      meter: 94,
      frames: ["C0", "VIBE", "UNITE", "OK"],
    }),
  ];
  const relayHops: AppShellRelayHop[] = [
    shellRelayHop("cli-ignite", "c0vibe", {
      label: "CLI ignite",
      href: "/wizard",
      impact: "local",
      command: "npx vibetrack init --gui",
      value: "terminal opens",
      note: "ASCII starts the session, then the GUI takes over with consent visible.",
      guardrail: "No provider calls before the user chooses a source.",
      meter: 92,
      frames: ["$ vt", "init", "GUI", "go"],
    }),
    shellRelayHop("scan-theatre", "higgsfield", {
      label: "Scan theatre",
      href: "/scan",
      impact: "usage",
      command: "npx vibetrack providers check",
      value: "branded read",
      note: "Provider color, logo marks, and source state animate in the same rail.",
      guardrail: "Only accepted records become usage.",
      meter: 95,
      frames: ["HF", "CX", "127", "ok"],
    }),
    shellRelayHop("proof-gate", "privacy", {
      label: "Proof gate",
      href: "/proof",
      impact: "privacy",
      command: "npx vibetrack upload --dry-run",
      value: "review first",
      note: "The public bundle preview shows exactly what would leave the machine.",
      guardrail: "Dry-run keeps hiddenUploads=0.",
      meter: 90,
      frames: ["mask", "hash", "dry", "0up"],
    }),
    shellRelayHop("score-reactor", "openrouter", {
      label: "Score reactor",
      href: "/score",
      impact: "usage",
      command: "npx vibetrack stats",
      value: "datastream",
      note: "Usage records feed score, profile, heatgrid, and public board surfaces.",
      guardrail: "Trust remains visible context, not usage math.",
      meter: 88,
      frames: ["mix", "grid", "rank", "ok"],
    }),
    shellRelayHop("public-unite", "c0vibe", {
      label: "Public unite",
      href: "/u/demo",
      impact: "publish",
      command: "npx vibetrack upload",
      value: "Vibers Unite",
      note: "C0vibe.app receives reviewed aggregates with labels still attached.",
      guardrail: "No prompts, outputs, secrets, or raw rows publish.",
      meter: 94,
      frames: ["C0", "VIBE", "UNITE", "ok"],
    }),
  ];
  const relayCounters = relayHops.reduce<AppShellUniteRelay["counters"]>((acc, hop) => {
    acc.providerCalls += hop.preview.providerCalls;
    acc.ledgerWrites += hop.preview.ledgerWrites;
    acc.hiddenUploads += hop.preview.hiddenUploads;
    acc.usageMutations += hop.preview.usageMutations;
    acc.promptReads += hop.preview.promptReads;
    acc.outputReads += hop.preview.outputReads;
    return acc;
  }, { providerCalls: 0, ledgerWrites: 0, hiddenUploads: 0, usageMutations: 0, promptReads: 0, outputReads: 0 });
  const relay: AppShellUniteRelay = {
    headline: "Vibers Unite relay",
    subline: "One always-visible route through setup, scan, proof, score, and public profile without hidden reads or background uploads.",
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine("VTK://UNITE-RELAY//CLI->GUI->C0VIBE.APP"),
      frameLine(`hops ${relayHops.length} // providerCalls ${relayCounters.providerCalls} // hiddenUploads ${relayCounters.hiddenUploads}`),
      frameLine(`promptReads ${relayCounters.promptReads} // outputReads ${relayCounters.outputReads}`),
      frameLine("CLI ignite -> scan theatre -> proof gate -> score reactor"),
      frameLine("public unite // Vibers Unite // c0vibe.app // labelled rails"),
      "+--------------------------------------------------------------+",
    ],
    hops: relayHops,
    counters: relayCounters,
  };
  const relaySideEffects = Object.values(relayCounters).reduce((sum, value) => sum + value, 0);
  const constellationNodes: AppShellConstellationNode[] = [
    shellConstellationNode("terminal-seed", "c0vibe", {
      label: "Terminal seed",
      href: "/wizard",
      impact: "local",
      value: "CLI -> GUI",
      route: "wizard",
      detail: "First-run terminal charm stays visible, then hands control to consented GUI steps.",
      guardrail: "Preview node only. It makes 0 provider calls and writes 0 usage rows.",
      meter: 92,
      frames: ["$ vt", "init", "GUI"],
    }),
    shellConstellationNode("provider-theatre", "higgsfield", {
      label: "Provider theatre",
      href: "/scan",
      impact: "usage",
      value: "branded scan",
      route: "scan room",
      detail: "Higgsfield, Codex, local, regional, and creator sources reveal with provider colors.",
      guardrail: "Theatre is presentation; accepted usage records decide totals.",
      meter: 96,
      frames: ["HF", "scan", "row"],
    }),
    shellConstellationNode("privacy-airlock", "privacy", {
      label: "Privacy airlock",
      href: "/proof",
      impact: "privacy",
      value: "dry-run",
      route: "proof center",
      detail: "The proof route shows what would leave the machine before any upload.",
      guardrail: "No prompts, outputs, files, secrets, or raw rows publish from this node.",
      meter: 90,
      frames: ["dry", "mask", "0up"],
    }),
    shellConstellationNode("score-reactor", "openrouter", {
      label: "Score reactor",
      href: "/score",
      impact: "usage",
      value: "datastream",
      route: "score lab",
      detail: "The same usage stream feeds heatgrid, score receipt, profile, and leaderboard surfaces.",
      guardrail: "Trust signals stay sidecar context and never mutate usage math.",
      meter: 88,
      frames: ["mix", "grid", "rank"],
    }),
    shellConstellationNode("budget-radar", "comfyui", {
      label: "Budget radar",
      href: "/insights",
      impact: "local",
      value: "burn + save",
      route: "insights",
      detail: "Forecasts, expensive workflows, and local shadow value stay labelled as estimates.",
      guardrail: "Local shadow is NOT SPEND and cannot become public spend.",
      meter: 86,
      frames: ["$", "save", "est"],
    }),
    shellConstellationNode("public-signal", "c0vibe", {
      label: "Public signal",
      href: "/u/demo",
      impact: "publish",
      value: "Vibers Unite",
      route: "c0vibe.app",
      detail: "Reviewed aggregates become a mobile-readable public profile with labels intact.",
      guardrail: "C0vibe.app receives reviewed aggregates only. Hidden uploads remain 0.",
      meter: 94,
      frames: ["C0", "VIBE", "GO"],
    }),
  ];
  const constellationCounters = constellationNodes.reduce<AppShellConstellation["counters"]>((acc, node) => {
    acc.providerCalls += node.preview.providerCalls;
    acc.hiddenUploads += node.preview.hiddenUploads;
    acc.usageMutations += node.preview.usageMutations;
    return acc;
  }, { providerCalls: 0, hiddenUploads: 0, usageMutations: 0 });
  const constellation: AppShellConstellation = {
    headline: "Usage constellation",
    subline: "A visible map of how terminal setup, provider scan, proof, score, insights, and public profile connect without background collection.",
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine("VTK://APP-SHELL-CONSTELLATION//NO-BACKGROUND-COLLECT"),
      frameLine(`nodes ${constellationNodes.length} // providerCalls ${constellationCounters.providerCalls} // uploads ${constellationCounters.hiddenUploads}`),
      frameLine(`usageMutations ${constellationCounters.usageMutations} // routes wizard scan proof score insights public`),
      frameLine("terminal seed -> provider theatre -> privacy airlock"),
      frameLine("score reactor -> budget radar -> public signal"),
      frameLine("Vibers Unite // c0vibe.app // preview-only shell map"),
      "+--------------------------------------------------------------+",
    ],
    nodes: constellationNodes,
    counters: constellationCounters,
  };
  const constellationSideEffects = Object.values(constellationCounters).reduce((sum, value) => sum + value, 0);
  const marqueeSteps: AppShellMarqueeStep[] = [
    shellMarqueeStep("usage-live", "higgsfield", {
      label: "Usage rows",
      impact: "usage",
      value: "accepted records",
      guardrail: "Visual pulse only; provider adapters decide usage after consent.",
      meter: 96,
    }),
    shellMarqueeStep("trust-side", "codex-cli", {
      label: "Trust side rail",
      impact: "trust",
      value: "NOT USAGE",
      guardrail: "GitHub, MCP, and creator cadence cannot move spend.",
      meter: 82,
    }),
    shellMarqueeStep("local-lab", "ollama", {
      label: "Local lab",
      impact: "local",
      value: "loopback first",
      guardrail: "Local model, ComfyUI, and desktop probes stay on-device.",
      meter: 90,
    }),
    shellMarqueeStep("privacy-dry-run", "privacy", {
      label: "Dry-run gate",
      impact: "privacy",
      value: "0 raw reads",
      guardrail: "No prompts, outputs, files, secrets, or hidden uploads.",
      meter: 88,
    }),
    shellMarqueeStep("score-feed", "openrouter", {
      label: "Score feed",
      impact: "usage",
      value: "same stream",
      guardrail: "Heatgrid, score, profile, and board share one datastream.",
      meter: 86,
    }),
    shellMarqueeStep("c0vibe-unite", "c0vibe", {
      label: "C0VIBE relay",
      impact: "publish",
      value: "Vibers Unite",
      guardrail: "c0vibe.app receives reviewed aggregates only.",
      meter: 94,
    }),
  ];
  const marqueeBaseCounters = marqueeSteps.reduce<Omit<AppShellMarquee["counters"], "sideEffects">>((acc, step) => {
    acc.providerCalls += step.preview.providerCalls;
    acc.ledgerWrites += step.preview.ledgerWrites;
    acc.hiddenUploads += step.preview.hiddenUploads;
    acc.promptReads += step.preview.promptReads;
    acc.outputReads += step.preview.outputReads;
    acc.usageMutations += step.preview.usageMutations;
    return acc;
  }, { providerCalls: 0, ledgerWrites: 0, hiddenUploads: 0, promptReads: 0, outputReads: 0, usageMutations: 0 });
  const marqueeSideEffects = Object.values(marqueeBaseCounters).reduce((sum, value) => sum + value, 0);
  const marquee: AppShellMarquee = {
    headline: "Global visual-only signal marquee",
    steps: marqueeSteps,
    counters: {
      ...marqueeBaseCounters,
      sideEffects: marqueeSideEffects,
    },
  };

  return {
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine("VTK://APP-SHELL//NERDY-COOL//C0VIBE.APP"),
      "|--------------------------------------------------------------|",
      frameLine("usage totals flow from records; trust stays a labelled sidecar"),
      frameLine("local capture stays local first; upload runs a dry-run gate"),
      frameLine("shell preview calls 0 writes 0 hiddenUploads 0"),
      frameLine("Vibers Unite // no confetti // no fake proof // fast scanner"),
      "+--------------------------------------------------------------+",
    ],
    signals,
    beacons,
    commands,
    relay,
    constellation,
    spectrum,
    marquee,
    ticker: "USAGE -> TRUST SIDECAR -> LOCAL LOOP -> PRIVACY GATE -> C0VIBE RELAY",
    totals: {
      signals: signals.length,
      beacons: beacons.length,
      commands: commands.length,
      relayHops: relayHops.length,
      spectrumRails: spectrumRails.length,
      brandedSignals: signals.filter((signal) => signal.from.startsWith("#") && signal.to.startsWith("#")).length,
      previewProviderCalls: signals.reduce((sum, signal) => sum + signal.preview.providerCalls, 0),
      previewLedgerWrites: signals.reduce((sum, signal) => sum + signal.preview.ledgerWrites, 0),
      hiddenUploads: signals.reduce((sum, signal) => sum + signal.preview.hiddenUploads, 0),
      relaySideEffects,
      constellationNodes: constellationNodes.length,
      constellationSideEffects,
      spectrumSideEffects,
      marqueeSteps: marqueeSteps.length,
      marqueeSideEffects,
      notUsageRails: signals.filter((signal) => signal.value === "NOT USAGE").length,
    },
  };
}
