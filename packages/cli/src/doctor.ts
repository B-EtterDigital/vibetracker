import { renderProviderScanBeat, renderSyncSurpriseQueue } from "./sync-surprises.ts";

export type DoctorStatus = "ready" | "warn" | "missing";
export type DoctorImpact = "usage" | "local_only" | "not_usage" | "privacy" | "publish" | "ux";

export interface DoctorProvider {
  id: string;
  label: string;
  domain: string;
  tier: string;
  auth: string;
  status: string;
  verified: boolean;
}

export interface DoctorInput {
  configPath: string;
  configExists: boolean;
  configValid: boolean;
  configError?: string;
  enabledProviders: string[];
  hasC0VibeToken: boolean;
  hasUploadUrl: boolean;
  storePath: string;
  storeExists: boolean;
  encryptedStoreExists: boolean;
  storeEncrypted: boolean;
  recordCount?: number;
  recordReadError?: string;
  browserExtensionPath: string;
  browserExtensionExists: boolean;
  pluginsPath: string;
  pluginsDirExists: boolean;
  providers: DoctorProvider[];
  localEndpointCount: number;
  localApiPort: number;
  includeSurprisePreview?: boolean;
}

export interface DoctorCheck {
  id: string;
  label: string;
  status: DoctorStatus;
  impact: DoctorImpact;
  detail: string;
  command?: string;
}

export interface DoctorReport {
  checks: DoctorCheck[];
  stats: {
    providers: number;
    built: number;
    verified: number;
    proxy: number;
    manual: number;
    local: number;
    enabled: number;
    records: number;
  };
}

const WIDTH = 66;
const BODY = WIDTH - 4;

function fit(text: string, width = BODY): string {
  return text.length > width ? `${text.slice(0, Math.max(0, width - 1))}…` : text.padEnd(width);
}

function line(text: string): string {
  return `| ${fit(text)} |`;
}

function border(char = "-"): string {
  return `+${char.repeat(WIDTH - 2)}+`;
}

function statusGlyph(status: DoctorStatus): string {
  if (status === "ready") return "OK";
  if (status === "warn") return "??";
  return "NO";
}

function statusLabel(status: DoctorStatus): string {
  if (status === "ready") return "READY";
  if (status === "warn") return "CHECK";
  return "MISSING";
}

function providerStats(providers: DoctorProvider[]): DoctorReport["stats"] {
  const built = providers.filter((provider) => provider.status === "built").length;
  const verified = providers.filter((provider) => provider.status === "built" && provider.verified).length;
  const proxy = providers.filter((provider) => provider.tier === "proxy").length;
  const manual = providers.filter((provider) => provider.tier === "manual" || provider.status === "manual-only").length;
  const local = providers.filter((provider) => provider.tier === "local" || provider.auth === "localLogs").length;
  return {
    providers: providers.length,
    built,
    verified,
    proxy,
    manual,
    local,
    enabled: 0,
    records: 0,
  };
}

function countBar(value: number, total: number, width = 18): string {
  const filled = total > 0 ? Math.max(0, Math.min(width, Math.round((value / total) * width))) : 0;
  return `${"#".repeat(filled)}${".".repeat(width - filled)}`;
}

export function buildDoctorReport(input: DoctorInput): DoctorReport {
  const stats = providerStats(input.providers);
  stats.enabled = input.enabledProviders.length;
  stats.records = input.recordCount ?? 0;

  const checks: DoctorCheck[] = [
    {
      id: "config",
      label: "Config",
      status: input.configExists && input.configValid ? "ready" : input.configValid ? "warn" : "missing",
      impact: "usage",
      detail: input.configExists
        ? input.configValid
          ? `${input.enabledProviders.length} provider(s) enabled`
          : `config error: ${input.configError ?? "invalid JSON"}`
        : "using zero-setup default; run the wizard to connect real sources",
      command: input.configExists && input.configValid ? "vibetracker keys" : "vibetracker init --gui",
    },
    {
      id: "store",
      label: "Local Ledger",
      status: input.recordReadError ? "missing" : input.storeExists ? "ready" : "warn",
      impact: "local_only",
      detail: input.recordReadError
        ? `cannot read local ledger: ${input.recordReadError}`
        : input.storeExists
          ? `${input.recordCount ?? 0} record(s) at ${input.storePath}`
          : "no records yet; first sync creates the local ledger",
      command: input.storeExists ? "vibetracker total" : "vibetracker sync --demo",
    },
    {
      id: "encryption",
      label: "Encrypted Store",
      status: input.storeEncrypted || input.encryptedStoreExists ? "ready" : "warn",
      impact: "privacy",
      detail: input.storeEncrypted
        ? "VT_STORE_PASSPHRASE active; records.jsonl.enc is the active store"
        : input.encryptedStoreExists
          ? "encrypted ledger exists; set VT_STORE_PASSPHRASE before reading it"
          : "plain JSONL is active; encryption is opt-in",
      command: "VT_STORE_PASSPHRASE='...' vibetracker sync",
    },
    {
      id: "local-api",
      label: "Local API",
      status: "warn",
      impact: "local_only",
      detail: `manual start on 127.0.0.1:${input.localApiPort}; browser/desktop tools post only to localhost`,
      command: `vibetracker api serve --port ${input.localApiPort}`,
    },
    {
      id: "browser-extension",
      label: "Browser Extension",
      status: input.browserExtensionExists ? "ready" : "missing",
      impact: "usage",
      detail: input.browserExtensionExists
        ? `unpacked extension ready at ${input.browserExtensionPath}`
        : "extension files are not present in this install",
      command: "vibetracker browser-extension path",
    },
    {
      id: "provider-catalog",
      label: "Provider Catalog",
      status: stats.built > 0 ? "ready" : "missing",
      impact: "usage",
      detail: `${stats.providers} mapped · ${stats.built} built · ${stats.verified} endpoint-verified · ${stats.proxy} proxy · ${stats.manual} manual`,
      command: "vibetracker providers --all",
    },
    {
      id: "local-ai",
      label: "Local AI Radar",
      status: input.localEndpointCount > 0 ? "ready" : "warn",
      impact: "local_only",
      detail: `${input.localEndpointCount} local endpoint probes wired for Ollama, LM Studio, ComfyUI, llama.cpp, Jan, GPT4All, vLLM and friends`,
      command: "vibetracker detect",
    },
    {
      id: "plugins",
      label: "Adapter SDK",
      status: input.pluginsDirExists ? "ready" : "warn",
      impact: "ux",
      detail: input.pluginsDirExists
        ? `plugin schema/templates ready at ${input.pluginsPath}`
        : "plugin schema/templates not found in this install",
      command: "vibetracker plugins path",
    },
    {
      id: "trust-boundary",
      label: "Trust Boundary",
      status: "ready",
      impact: "not_usage",
      detail: "GitHub, Codex, creator cadence, and profile proofs are labelled NOT USAGE when they are not spend",
      command: "vibetracker audit",
    },
    {
      id: "publish",
      label: "C0VIBE Publish",
      status: input.hasC0VibeToken ? "ready" : "warn",
      impact: "publish",
      detail: input.hasC0VibeToken
        ? "C0VIBE token present; uploads can be attested after dry-run review"
        : input.hasUploadUrl
          ? "custom upload URL configured; dry-run before sending"
          : "not logged in; local-first mode is fully usable",
      command: input.hasC0VibeToken ? "vibetracker upload --dry-run" : "vibetracker login",
    },
    {
      id: "surprises",
      label: "Surprise Engine",
      status: "ready",
      impact: "ux",
      detail: "provider scan beats use cli-spinners, ascii-globe, and drawille with local fallbacks",
      command: "vibetracker sync --demo",
    },
  ];

  return { checks, stats };
}

function summaryRows(report: DoctorReport): string[] {
  const stats = report.stats;
  return [
    line(`providers ${String(stats.providers).padStart(3)}  built ${String(stats.built).padStart(3)}  verified ${String(stats.verified).padStart(3)}  enabled ${String(stats.enabled).padStart(3)}`),
    line(`records   ${String(stats.records).padStart(3)}  local/proxy/manual mix ${countBar(stats.local + stats.proxy + stats.manual, Math.max(1, stats.providers))}`),
    line("motto     Vibers Unite // c0vibe.app"),
  ];
}

function checkRows(checks: DoctorCheck[]): string[] {
  return checks.map((check) => {
    const left = `${statusGlyph(check.status)} ${check.label}`.padEnd(22);
    const right = `${statusLabel(check.status).padEnd(7)} ${check.impact.padEnd(10)} ${check.detail}`;
    return line(`${left}${right}`);
  });
}

function commandRows(checks: DoctorCheck[]): string[] {
  const ordered = [
    ...checks.filter((check) => check.status !== "ready"),
    ...checks.filter((check) => check.status === "ready"),
  ];
  const commands = ordered
    .filter((check) => check.command)
    .slice(0, 8)
    .map((check) => line(`${check.label.padEnd(18)} ${check.command}`));
  return commands.length ? commands : [line("No next command required")];
}

function surprisePreview(input: DoctorInput): string[] {
  if (input.includeSurprisePreview === false) return [];
  const providers = input.enabledProviders.length ? input.enabledProviders : ["higgsfield", "codex-cli", "ollama", "replicate"];
  const topical = [
    renderProviderScanBeat({ providerId: "higgsfield", label: "Higgsfield", index: 0, total: 3 }),
    renderProviderScanBeat({ providerId: "codex-cli", label: "Codex CLI", index: 1, total: 3 }),
    ...renderSyncSurpriseQueue(providers).slice(0, 2),
  ];
  return [
    border("="),
    line("VTK://DOCTOR//SURPRISE-PREVIEW//SAFE-LOCAL-RENDER"),
    line("preview only; no provider call, no upload, no secret read"),
    border("-"),
    ...topical.flatMap((panel) => panel.split("\n")),
  ];
}

export function renderDoctorReport(input: DoctorInput): string {
  const report = buildDoctorReport(input);
  return [
    border("="),
    line("VTK://DOCTOR//LOCAL-FIRST//VIBETRACKER"),
    line("fast setup cockpit; usage, trust, privacy, and publish stay labelled"),
    border("-"),
    ...summaryRows(report),
    border("-"),
    ...checkRows(report.checks),
    line("BOUNDARY GitHub, Codex, creator cadence = NOT USAGE"),
    line("BOUNDARY usage spend comes from labelled sources only"),
    border("-"),
    line("NEXT COMMANDS"),
    ...commandRows(report.checks),
    border("-"),
    line("VISUAL CREDITS ascii-globe MIT · cli-spinners MIT"),
    line("VISUAL CREDITS drawille MIT · local fallbacks"),
    line("Vibers Unite // c0vibe.app"),
    border("="),
    ...surprisePreview(input),
  ].join("\n");
}
