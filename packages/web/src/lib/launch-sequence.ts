import { cliCommand } from "./cli-command.ts";

export interface LaunchSequenceStep {
  id: "gui" | "connect" | "collect" | "share";
  call: string;
  title: string;
  command: string;
  note: string;
  terminal: string[];
  status: "local" | "consent" | "audit" | "dry-run";
}

export type LaunchCapsuleImpact = "usage" | "local_only" | "trust" | "privacy" | "publish";

export interface LaunchCapsuleLane {
  id: "wizard" | "capture" | "trust" | "privacy" | "relay";
  label: string;
  value: string;
  command: string;
  note: string;
  impact: LaunchCapsuleImpact;
  meter: number;
  mark: string;
  from: string;
  to: string;
  ink: string;
  ascii: string[];
}

export interface LaunchCapsule {
  headline: string;
  subline: string;
  terminalLines: string[];
  lanes: LaunchCapsuleLane[];
}

export interface ScanCommandRunwayStep {
  id: "detect" | "higgsfield" | "local" | "creator" | "trust" | "privacy" | "relay";
  phase: string;
  railLabel: string;
  label: string;
  command: string;
  cue: string;
  guardrail: string;
  impact: LaunchCapsuleImpact;
  meter: number;
  mark: string;
  from: string;
  to: string;
  ink: string;
  frames: string[];
  transcript: string[];
  visualOnly: true;
  providerCalls: false;
  ledgerWrites: false;
  hiddenUpload: false;
}

export interface ScanCommandRunway {
  headline: string;
  subline: string;
  terminalLines: string[];
  steps: ScanCommandRunwayStep[];
  totals: {
    steps: number;
    visualOnly: number;
    providerCalls: number;
    ledgerWrites: number;
    hiddenUpload: number;
  };
}

export interface WizardFlightRecorderEvent {
  id: "terminal-boot" | "consent-lock" | "scan-preview" | "proof-review" | "public-relay";
  second: string;
  label: string;
  command: string;
  value: string;
  note: string;
  guardrail: string;
  impact: LaunchCapsuleImpact;
  meter: number;
  from: string;
  to: string;
  ink: string;
  frames: string[];
  checks: string[];
  counters: {
    providerCalls: number;
    ledgerWrites: number;
    hiddenUpload: number;
    promptReads: number;
    outputReads: number;
    publishWrites: number;
  };
}

export interface WizardFlightRecorder {
  headline: string;
  subline: string;
  terminalLines: string[];
  events: WizardFlightRecorderEvent[];
  counters: WizardFlightRecorderEvent["counters"];
  totals: {
    events: number;
    localOnly: number;
    usage: number;
    privacy: number;
    publish: number;
    sideEffects: number;
  };
}

function runwayLine(value: string): string {
  const inner = value.length > 60 ? value.slice(0, 60) : value.padEnd(60, " ");
  return `| ${inner} |`;
}

export function buildLaunchSequence(): LaunchSequenceStep[] {
  return [
    {
      id: "gui",
      call: "00",
      title: "Terminal opens the GUI",
      command: cliCommand("init --gui"),
      note: "The ASCII CLI remains visible inside the local wizard so users never lose command-line confidence.",
      terminal: ["boot local gui", "mount inline terminal", "load provider brand deck"],
      status: "local",
    },
    {
      id: "connect",
      call: "01",
      title: "Connect only what you trust",
      command: cliCommand("connect higgsfield"),
      note: "OAuth, MCP, API keys, local logs, and manual ledgers are labelled by source before any scan runs.",
      terminal: ["mask secrets", "label source as consented", "show not-usage rails"],
      status: "consent",
    },
    {
      id: "collect",
      call: "02",
      title: "Watch the scan prove itself",
      command: cliCommand("sync --demo"),
      note: "Provider cards fill with branded feedback while audit rails separate usage, estimates, and trust signals.",
      terminal: ["animate provider turntables", "write local records", "run source-mix audit"],
      status: "audit",
    },
    {
      id: "share",
      call: "03",
      title: "Review before C0VIBE",
      command: cliCommand("upload --dry-run"),
      note: "Vibers Unite at c0vibe.app only after the dry-run confirms what leaves the machine.",
      terminal: ["redact secrets", "preview aggregate bundle", "publish only on approval"],
      status: "dry-run",
    },
  ];
}

export function buildLaunchCapsule(): LaunchCapsule {
  return {
    headline: "LAUNCH CAPSULE",
    subline: "A compact proof artifact for the first minute: terminal charm, GUI clarity, source labels, and C0VIBE relay without mixing trust into spend.",
    terminalLines: [
      "+------------------------------------------------------+",
      "| VTK://LAUNCH-CAPSULE//ASCII-GUI//VIBERS-UNITE       |",
      "|------------------------------------------------------|",
      "| open terminal -> inline GUI -> branded scan feedback |",
      "| collect usage -> validate source -> privacy preview  |",
      "| trust rails stay NOT USAGE and never mutate spend    |",
      "| publish only after dry-run review at c0vibe.app      |",
      "+------------------------------------------------------+",
    ],
    lanes: [
      {
        id: "wizard",
        label: "Wizard feel",
        value: "terminal + GUI",
        command: cliCommand("init --gui"),
        note: "The first screen stays useful: commands, provider status, and animated ASCII feedback are visible together.",
        impact: "local_only",
        meter: 94,
        mark: "VT",
        from: "#2ee8d6",
        to: "#36e39b",
        ink: "#071013",
        ascii: ["┌VTK┐", "│GUI│", "└CLI┘"],
      },
      {
        id: "capture",
        label: "Usage capture",
        value: "providers",
        command: cliCommand("sync"),
        note: "Higgsfield, creator tools, coding CLIs, local AI, and regional providers light up with source-labelled scan beats.",
        impact: "usage",
        meter: 88,
        mark: "HF",
        from: "#ff4fd8",
        to: "#7c5cff",
        ink: "#ffffff",
        ascii: [" /\\  ", "-HF- ", " \\/  "],
      },
      {
        id: "trust",
        label: "Trust side rail",
        value: "not usage",
        command: cliCommand("trust list"),
        note: "GitHub, Codex, creator cadence, and package proof can enrich the profile but never inflate usage totals.",
        impact: "trust",
        meter: 100,
        mark: "GH",
        from: "#24292f",
        to: "#39d353",
        ink: "#ffffff",
        ascii: ["GH░░", "CX▒▒", "≠$$ "],
      },
      {
        id: "privacy",
        label: "Review gate",
        value: "local first",
        command: cliCommand("upload --dry-run"),
        note: "Secret scans, redaction preview, differential privacy, and local-only labels are shown before upload.",
        impact: "privacy",
        meter: 91,
        mark: "PR",
        from: "#ffc64d",
        to: "#ff7768",
        ink: "#1b0b00",
        ascii: ["MASK", "DRY ", "RUN "],
      },
      {
        id: "relay",
        label: "C0VIBE relay",
        value: "publish",
        command: cliCommand("upload"),
        note: "Vibers Unite at c0vibe.app only after the aggregate bundle is reviewed and labelled.",
        impact: "publish",
        meter: 96,
        mark: "C0",
        from: "#2ee8d6",
        to: "#36e39b",
        ink: "#071013",
        ascii: ["C0V ", "VIBE", "APP "],
      },
    ],
  };
}

export function buildWizardFlightRecorder(): WizardFlightRecorder {
  const zeroCounters: WizardFlightRecorderEvent["counters"] = {
    providerCalls: 0,
    ledgerWrites: 0,
    hiddenUpload: 0,
    promptReads: 0,
    outputReads: 0,
    publishWrites: 0,
  };
  const event = (value: Omit<WizardFlightRecorderEvent, "counters">): WizardFlightRecorderEvent => ({
    ...value,
    counters: { ...zeroCounters },
  });
  const events: WizardFlightRecorderEvent[] = [
    event({
      id: "terminal-boot",
      second: "00s",
      label: "Terminal boot",
      command: cliCommand("init --gui"),
      value: "CLI -> GUI",
      note: "ASCII boots first so the user sees the exact command before the visual wizard opens.",
      guardrail: "Local-only launch; no provider calls.",
      impact: "local_only",
      meter: 94,
      from: "#2ee8d6",
      to: "#36e39b",
      ink: "#071013",
      frames: ["$ vt\ninit\n--gui", "TERM\n ->\n GUI", "LOCAL\nONLY\nBOOT"],
      checks: ["terminal visible", "GUI takes over", "provider calls 0"],
    }),
    event({
      id: "consent-lock",
      second: "12s",
      label: "Consent lock",
      command: cliCommand("connect"),
      value: "source labels",
      note: "OAuth, MCP, API keys, local logs, and manual ledgers are labelled before scan.",
      guardrail: "Credentials are masked and trust signals stay NOT USAGE.",
      impact: "privacy",
      meter: 88,
      from: "#ffc64d",
      to: "#ff7768",
      ink: "#1b0b00",
      frames: ["KEYS\nMASK\nOK", "MCP\nOAUTH\nLABEL", "TRUST\nNOT\nUSE"],
      checks: ["secret mask", "source labels", "trust split"],
    }),
    event({
      id: "scan-preview",
      second: "28s",
      label: "Scan preview",
      command: cliCommand("providers check"),
      value: "surprise reel",
      note: "Higgsfield prism, Codex cube, local sonar, and creator decks animate as preview-only cues.",
      guardrail: "Visual-only scan rehearsal; accepted rows decide usage.",
      impact: "usage",
      meter: 91,
      from: "#ff4fd8",
      to: "#7c5cff",
      ink: "#ffffff",
      frames: ["HF\nCX\n127", "IMG\nVID\n3D ", "SCAN\nREEL\nOK"],
      checks: ["branded cards", "visualOnly=true", "no hidden upload"],
    }),
    event({
      id: "proof-review",
      second: "44s",
      label: "Proof review",
      command: cliCommand("upload --dry-run"),
      value: "dry run",
      note: "The GUI shows aggregate shape, redaction status, trust labels, and publish boundaries.",
      guardrail: "Dry-run keeps hiddenUpload=0 and publishWrites=0.",
      impact: "privacy",
      meter: 96,
      from: "#ffc64d",
      to: "#ff7768",
      ink: "#1b0b00",
      frames: ["MASK\nDRY \nRUN ", "HASH\nBUND\nLE  ", "0UP\n0WR\nOK"],
      checks: ["secret scan", "aggregate only", "publish writes 0"],
    }),
    event({
      id: "public-relay",
      second: "60s",
      label: "Public relay",
      command: cliCommand("upload"),
      value: "Vibers Unite",
      note: "c0vibe.app receives reviewed aggregates only after the user chooses publish.",
      guardrail: "No prompts, outputs, secrets, or raw rows publish.",
      impact: "publish",
      meter: 94,
      from: "#2ee8d6",
      to: "#36e39b",
      ink: "#071013",
      frames: ["C0V\nIBE\nAPP", "VIB\nERS\nUNI", "C0\nGO\nOK"],
      checks: ["reviewed aggregate", "profile labels", "Vibers Unite"],
    }),
  ];
  const counters = events.reduce<WizardFlightRecorderEvent["counters"]>((acc, current) => {
    acc.providerCalls += current.counters.providerCalls;
    acc.ledgerWrites += current.counters.ledgerWrites;
    acc.hiddenUpload += current.counters.hiddenUpload;
    acc.promptReads += current.counters.promptReads;
    acc.outputReads += current.counters.outputReads;
    acc.publishWrites += current.counters.publishWrites;
    return acc;
  }, { ...zeroCounters });
  const sideEffects = Object.values(counters).reduce((sum, value) => sum + value, 0);

  return {
    headline: "FIRST-MINUTE FLIGHT RECORDER",
    subline: "A compact cockpit log for the moment the ASCII CLI hands off to the GUI: every surprise is labelled before collection, proof, or publish.",
    terminalLines: [
      "+--------------------------------------------------------------+",
      runwayLine("VTK://WIZARD-FLIGHT-RECORDER//CLI->GUI//C0VIBE.APP"),
      runwayLine("00s terminal boot -> 12s consent lock -> 28s scan preview"),
      runwayLine("44s proof review -> 60s public relay -> Vibers Unite"),
      runwayLine(`providerCalls=${counters.providerCalls} // promptReads=${counters.promptReads} // outputs=${counters.outputReads}`),
      runwayLine(`ledgerWrites=${counters.ledgerWrites} // hiddenUpload=${counters.hiddenUpload} // publishWrites=${counters.publishWrites}`),
      runwayLine("visual-only until the user runs a real command"),
      "+--------------------------------------------------------------+",
    ],
    events,
    counters,
    totals: {
      events: events.length,
      localOnly: events.filter((item) => item.impact === "local_only").length,
      usage: events.filter((item) => item.impact === "usage").length,
      privacy: events.filter((item) => item.impact === "privacy").length,
      publish: events.filter((item) => item.impact === "publish").length,
      sideEffects,
    },
  };
}

export function buildScanCommandRunway(): ScanCommandRunway {
  const steps: ScanCommandRunwayStep[] = [
    {
      id: "detect",
      phase: "00",
      railLabel: "LOCAL-ONLY",
      label: "Terminal wakes the GUI",
      command: cliCommand("doctor"),
      cue: "A local preflight checks commands, MCP status, and display readiness before any provider scan.",
      guardrail: "Preview only: no provider calls, no ledger writes, no uploads.",
      impact: "local_only",
      meter: 92,
      mark: "VT",
      from: "#2ee8d6",
      to: "#36e39b",
      ink: "#071013",
      frames: ["┌VT┐\n│▒▒│\n└GUI┘", "┌VT┐\n│▓▒│\n└CLI┘", "┌VT┐\n│▓▓│\n└GUI┘", "┌VT┐\n│▒▓│\n└CLI┘"],
      transcript: ["boot inline terminal", "index local adapters", "arm scan surprise reel"],
      visualOnly: true,
      providerCalls: false,
      ledgerWrites: false,
      hiddenUpload: false,
    },
    {
      id: "higgsfield",
      phase: "01",
      railLabel: "USAGE",
      label: "Higgsfield prism turns",
      command: cliCommand("connect higgsfield"),
      cue: "If authenticated, Higgsfield gets a branded creator scan beat before validated usage rows appear.",
      guardrail: "Authentication evidence is labelled before usage is counted.",
      impact: "usage",
      meter: 88,
      mark: "HF",
      from: "#ff4fd8",
      to: "#7c5cff",
      ink: "#ffffff",
      frames: [" /\\ \n-HF-\n \\/ ", " ◢◣ \n HF \n ◥◤ ", " ◤◥ \n-HF-\n ◣◢ ", " \\/ \n HF \n /\\ "],
      transcript: ["read consent state", "turn creator prism", "wait for ledger rows"],
      visualOnly: true,
      providerCalls: false,
      ledgerWrites: false,
      hiddenUpload: false,
    },
    {
      id: "local",
      phase: "02",
      railLabel: "LOCAL-ONLY",
      label: "Local model sonar",
      command: cliCommand("detect"),
      cue: "Ollama, LM Studio, ComfyUI, InvokeAI, vLLM, and local proxy traces pulse without leaving the machine.",
      guardrail: "Local evidence stays local unless the user reviews and publishes aggregates.",
      impact: "local_only",
      meter: 95,
      mark: "LM",
      from: "#36e39b",
      to: "#2ee8d6",
      ink: "#071013",
      frames: [" .  \n.LM.\n .  ", " ·· \n<LM>\n ·· ", " :::\n<LM>\n :::", " ·· \n<LM>\n ·· "],
      transcript: ["probe loopback ports", "label local-only value", "estimate cloud savings"],
      visualOnly: true,
      providerCalls: false,
      ledgerWrites: false,
      hiddenUpload: false,
    },
    {
      id: "creator",
      phase: "03",
      railLabel: "USAGE",
      label: "Creator adapters light",
      command: cliCommand("sync --receipt"),
      cue: "Image, video, audio, music, 3D, research, and regional AI providers get branded collection cards.",
      guardrail: "Provider totals require source-labelled records, not decoration.",
      impact: "usage",
      meter: 86,
      mark: "CR",
      from: "#ffc64d",
      to: "#ff4fd8",
      ink: "#1b0b00",
      frames: ["IMG\nVID\n3D ", "AUD\nMUS\nVOX", "CN \nEU \nUS ", "IMG\nVID\n3D "],
      transcript: ["stage provider deck", "normalize categories", "separate estimates"],
      visualOnly: true,
      providerCalls: false,
      ledgerWrites: false,
      hiddenUpload: false,
    },
    {
      id: "trust",
      phase: "04",
      railLabel: "NOT USAGE",
      label: "Codex cube snaps in",
      command: cliCommand("trust list"),
      cue: "Codex, GitHub, packages, creator cadence, and social proof strengthen trust without changing spend.",
      guardrail: "Trust is always stamped NOT USAGE.",
      impact: "trust",
      meter: 100,
      mark: "CX",
      from: "#24292f",
      to: "#39d353",
      ink: "#ffffff",
      frames: ["CX░\nGH▒\n≠$$", "GH▒\nCX▓\n≠$$", "PKG\nGH▓\n≠$$", "CX▓\nGH▒\n≠$$"],
      transcript: ["collect trust evidence", "stamp not usage", "protect usage score"],
      visualOnly: true,
      providerCalls: false,
      ledgerWrites: false,
      hiddenUpload: false,
    },
    {
      id: "privacy",
      phase: "05",
      railLabel: "PRIVACY",
      label: "Redaction gate sweeps",
      command: cliCommand("upload --dry-run"),
      cue: "The dry run previews secrets, aggregate shape, trust labels, and exactly what leaves the machine.",
      guardrail: "Dry-run means zero upload and zero hidden export.",
      impact: "privacy",
      meter: 93,
      mark: "PR",
      from: "#ffc64d",
      to: "#ff7768",
      ink: "#1b0b00",
      frames: ["MASK\nDRY \nRUN ", "SCAN\nSECR\nETS ", "DIFF\nPRIV\nVIEW", "MASK\nOK  \nRUN "],
      transcript: ["scan secret fields", "preview aggregate only", "block hidden export"],
      visualOnly: true,
      providerCalls: false,
      ledgerWrites: false,
      hiddenUpload: false,
    },
    {
      id: "relay",
      phase: "06",
      railLabel: "PUBLISH",
      label: "C0VIBE relay opens",
      command: cliCommand("upload"),
      cue: "Vibers Unite at c0vibe.app only after the reviewed aggregate powers profile, vibe score, and heatgrid.",
      guardrail: "Publish stays manual and consent-gated.",
      impact: "publish",
      meter: 96,
      mark: "C0",
      from: "#2ee8d6",
      to: "#36e39b",
      ink: "#071013",
      frames: ["C0V\nIBE\nAPP", "VIB\nERS\nUNI", "C0 \nVIBE\nAPP", "VIB\nERS\n+++ "],
      transcript: ["review bundle", "feed profile score", "Vibers Unite"],
      visualOnly: true,
      providerCalls: false,
      ledgerWrites: false,
      hiddenUpload: false,
    },
  ];

  return {
    headline: "SCAN COMMAND RUNWAY",
    subline: "A GUI-native command strip for the first scan: the user sees each surprise, rail label, and safety boundary before collection starts.",
    terminalLines: [
      "+--------------------------------------------------------------+",
      runwayLine("VTK://SCAN-COMMAND-RUNWAY//VISUAL-ONLY//C0VIBE.APP"),
      runwayLine("detect -> HF prism -> local sonar -> creator deck"),
      runwayLine("Codex cube -> redaction gate -> Vibers Unite relay"),
      runwayLine("providerCalls=0 // ledgerWrites=0 // hiddenUpload=0"),
      runwayLine("usage rails separated from trust, privacy, local-only"),
      runwayLine("profile + vibe score update only after reviewed upload"),
      "+--------------------------------------------------------------+",
    ],
    steps,
    totals: {
      steps: steps.length,
      visualOnly: steps.filter((step) => step.visualOnly).length,
      providerCalls: 0,
      ledgerWrites: 0,
      hiddenUpload: 0,
    },
  };
}
