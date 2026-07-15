export type WizardModeId = "guided" | "terminal" | "demo";
export type WizardSourceId = "hosted" | "creator" | "coding" | "local";

export interface WizardMode {
  id: WizardModeId;
  label: string;
  detail: string;
  command: string;
  mark: string;
}

export interface WizardSource {
  id: WizardSourceId;
  label: string;
  detail: string;
  command: string;
  rail: "usage" | "local";
  mark: string;
}

export interface WizardOptions {
  mode: WizardModeId;
  sources: WizardSourceId[];
  receipt: boolean;
  publishPreview: boolean;
}

export interface WizardRunbook {
  primary: string;
  commands: string[];
  selectedSources: WizardSource[];
  status: string;
}

export const WIZARD_MODES: readonly WizardMode[] = [
  {
    id: "guided",
    label: "Guided GUI",
    detail: "Terminal truth with a local visual setup surface.",
    command: "npx vibetrack init --gui",
    mark: "GUI",
  },
  {
    id: "terminal",
    label: "Terminal only",
    detail: "Stay inside the interactive CLI from first scan to sync.",
    command: "npx vibetrack init",
    mark: "TTY",
  },
  {
    id: "demo",
    label: "Demo ledger",
    detail: "Load labelled sample usage before connecting private accounts.",
    command: "npx vibetrack sync --demo",
    mark: "LAB",
  },
];

export const WIZARD_SOURCES: readonly WizardSource[] = [
  {
    id: "hosted",
    label: "Hosted APIs",
    detail: "Usage and spend from authenticated AI providers.",
    command: "npx vibetrack providers --domain ai",
    rail: "usage",
    mark: "API",
  },
  {
    id: "creator",
    label: "Creator tools",
    detail: "Image, video, music, audio, and 3D workflows.",
    command: "npx vibetrack providers --domain creative",
    rail: "usage",
    mark: "ART",
  },
  {
    id: "coding",
    label: "Coding CLIs",
    detail: "Developer tools with source-labelled local evidence.",
    command: "npx vibetrack providers --domain dev",
    rail: "usage",
    mark: "DEV",
  },
  {
    id: "local",
    label: "Local stack",
    detail: "Discover Ollama, LM Studio, ComfyUI, and loopback tools.",
    command: "npx vibetrack detect --json",
    rail: "local",
    mark: "127",
  },
];

export const DEFAULT_WIZARD_OPTIONS: WizardOptions = {
  mode: "guided",
  sources: ["hosted", "creator", "coding", "local"],
  receipt: true,
  publishPreview: true,
};

function uniqueCommands(commands: string[]): string[] {
  return commands.filter((command, index) => commands.indexOf(command) === index);
}

export function buildWizardRunbook(options: WizardOptions): WizardRunbook {
  const mode = WIZARD_MODES.find((candidate) => candidate.id === options.mode) ?? WIZARD_MODES[0];
  const selectedSources = WIZARD_SOURCES.filter((source) => options.sources.includes(source.id));
  const commands = uniqueCommands([
    mode.command,
    ...selectedSources.map((source) => source.command),
    ...(options.receipt ? ["npx vibetrack sync --receipt --out ~/.vibetracker/receipts"] : []),
    "npx vibetrack audit",
    ...(options.publishPreview ? ["npx vibetrack upload --dry-run"] : []),
  ]);

  const sourceLabel = selectedSources.length === 1 ? "1 source rail" : `${selectedSources.length} source rails`;
  const relayLabel = options.publishPreview ? "publish preview locked" : "local only";

  return {
    primary: mode.command,
    commands,
    selectedSources,
    status: `${sourceLabel} / ${relayLabel}`,
  };
}
