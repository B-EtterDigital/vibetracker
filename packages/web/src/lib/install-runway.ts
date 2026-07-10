export type InstallRunwayImpact = "install" | "usage" | "local" | "creator" | "privacy" | "publish";

export interface InstallRunwayTrack {
  id: "terminal-gui" | "source-detect" | "safe-sync" | "creator-ledger" | "privacy-publish";
  call: string;
  label: string;
  impact: InstallRunwayImpact;
  command: string;
  note: string;
  guardrail: string;
  meter: number;
  frames: string[];
  terminal: string[];
}

export interface InstallRunwayHandoff {
  id: "tty" | "gui" | "scan" | "review";
  label: string;
  key: string;
  command: string;
  status: string;
  impact: InstallRunwayImpact;
  meter: number;
  frames: string[];
  terminal: string[];
  visualOnly: true;
  usageWrites: false;
  providerCalls: false;
}

export interface InstallRunway {
  headline: string;
  terminalLines: string[];
  tracks: InstallRunwayTrack[];
  handoff: InstallRunwayHandoff[];
  totals: {
    tracks: number;
    handoffSteps: number;
    localFirst: number;
    notUsage: number;
    publishGates: number;
    visualOnly: number;
    usageWrites: number;
  };
}

function fit(value: string | number, width: number): string {
  return String(value).padEnd(width).slice(0, width);
}

function frameLine(value: string): string {
  return `| ${fit(value, 60)} |`;
}

function trackTerminal(lines: string[]): string[] {
  return lines.map((line) => fit(line, 30));
}

function handoffTerminal(lines: string[]): string[] {
  return lines.map((line) => fit(line, 36));
}

export function buildInstallRunway(): InstallRunway {
  const tracks: InstallRunwayTrack[] = [
    {
      id: "terminal-gui",
      call: "BOOT",
      label: "ASCII terminal to GUI wizard",
      impact: "install",
      command: "npx vibetracker init --gui",
      note: "Start in a nerdy terminal, then jump into the richer guided GUI without losing command clarity.",
      guardrail: "GUI is a wizard, not a landing page.",
      meter: 96,
      frames: ["TTY", "GUI", "VTK"],
      terminal: trackTerminal(["npx package resolves", "ascii panel opens", "browser wizard launches", "commands stay visible"]),
    },
    {
      id: "source-detect",
      call: "SCAN",
      label: "Hosted and local source scan",
      impact: "local",
      command: "vibetracker detect && vibetracker providers --all",
      note: "Find Ollama, LM Studio, ComfyUI, OpenAI-compatible endpoints, hosted APIs, and manual provider paths.",
      guardrail: "Detected is not counted until records exist.",
      meter: 90,
      frames: ["OLL", "LMS", "API"],
      terminal: trackTerminal(["probe localhost", "show provider matrix", "label manual paths", "no fake connected state"]),
    },
    {
      id: "safe-sync",
      call: "SYNC",
      label: "Safe demo and audit proof",
      impact: "usage",
      command: "vibetracker sync --demo -> vibetracker audit",
      note: "Let new users see real totals, source mix, coverage gaps, and warnings before connecting private accounts.",
      guardrail: "Only usage records feed totals.",
      meter: 88,
      frames: ["SUM", "AUD", "OK"],
      terminal: trackTerminal(["demo bundle loads", "records normalize", "audit labels gaps", "totals stay clean"]),
    },
    {
      id: "creator-ledger",
      call: "MAKE",
      label: "Creator AI ledger",
      impact: "creator",
      command: "vibetracker add elevenlabs --characters 12000 --category audio",
      note: "Manual ledgers cover creator workflows where providers have no stable usage API yet.",
      guardrail: "Manual entries stay self-reported.",
      meter: 82,
      frames: ["IMG", "AUD", "3D"],
      terminal: trackTerminal(["voice characters", "music generations", "image/video credits", "roi note sidecar"]),
    },
    {
      id: "privacy-publish",
      call: "SHIP",
      label: "Dry-run then C0VIBE publish",
      impact: "publish",
      command: "vibetracker upload --dry-run -> vibetracker upload --handle you",
      note: "Preview what leaves the machine, then publish a labelled profile to c0vibe.app when the user opts in.",
      guardrail: "Trust is NOT USAGE.",
      meter: 94,
      frames: ["DRY", "SIG", "CV"],
      terminal: trackTerminal(["secret scan first", "signed aggregate bundle", "profile labels rails", "Vibers Unite"]),
    },
  ];
  const handoff: InstallRunwayHandoff[] = [
    {
      id: "tty",
      label: "Terminal boots",
      key: "TTY",
      command: "npx vibetracker init",
      status: "ascii ready",
      impact: "install",
      meter: 90,
      frames: ["$ vt", "TTY", "BOOT"],
      terminal: handoffTerminal(["ascii terminal opens first", "shows every command", "no browser required"]),
      visualOnly: true,
      usageWrites: false,
      providerCalls: false,
    },
    {
      id: "gui",
      label: "GUI takes over",
      key: "GUI",
      command: "vibetracker init --gui",
      status: "wizard open",
      impact: "install",
      meter: 96,
      frames: ["GUI", "CARD", "FLOW"],
      terminal: handoffTerminal(["same command rail", "branded provider cards", "terminal remains inline"]),
      visualOnly: true,
      usageWrites: false,
      providerCalls: false,
    },
    {
      id: "scan",
      label: "Local scan arms",
      key: "LAN",
      command: "vibetracker detect --local",
      status: "local only",
      impact: "local",
      meter: 88,
      frames: ["LAN", "OLL", "LMS"],
      terminal: handoffTerminal(["loopback and config probes", "detected is not counted", "no provider calls yet"]),
      visualOnly: true,
      usageWrites: false,
      providerCalls: false,
    },
    {
      id: "review",
      label: "Dry-run review",
      key: "DRY",
      command: "vibetracker upload --dry-run",
      status: "publish locked",
      impact: "privacy",
      meter: 94,
      frames: ["DRY", "LOCK", "C0"],
      terminal: handoffTerminal(["preview what leaves", "trust stays NOT USAGE", "user chooses publish"]),
      visualOnly: true,
      usageWrites: false,
      providerCalls: false,
    },
  ];

  return {
    headline: "First-run install runway",
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine("VTK://INSTALL-RUNWAY//TERMINAL-TO-GUI//VIBERS-UNITE"),
      "|--------------------------------------------------------------|",
      frameLine("boot the CLI, launch the GUI, scan sources, then dry-run publish"),
      frameLine("coders, creators, local AI users, and teams get one cockpit"),
      frameLine("usage, trust, local, manual, privacy, and publish stay labelled"),
      frameLine("Vibers Unite // c0vibe.app // no upload before preview"),
      "+--------------------------------------------------------------+",
    ],
    tracks,
    handoff,
    totals: {
      tracks: tracks.length,
      handoffSteps: handoff.length,
      localFirst: tracks.filter((track) => /local|localhost|dry-run|GUI/i.test(`${track.note} ${track.command} ${track.guardrail}`)).length,
      notUsage: tracks.filter((track) => /NOT USAGE|self-reported|not counted/i.test(track.guardrail)).length,
      publishGates: tracks.filter((track) => /dry-run|upload|publish/i.test(`${track.command} ${track.note}`)).length,
      visualOnly: handoff.filter((step) => step.visualOnly).length,
      usageWrites: handoff.filter((step) => step.usageWrites).length,
    },
  };
}
