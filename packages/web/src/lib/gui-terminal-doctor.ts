import { PROVIDERS } from "../../../adapters/src/registry.ts";
import { providerBrand } from "./provider-brand.ts";

export interface GuiDoctorCheck {
  id: string;
  label: string;
  status: "ready" | "check" | "local" | "not_usage";
  impact: "usage" | "privacy" | "local_only" | "publish" | "not_usage" | "ux";
  command: string;
  note: string;
  meter: number;
}

export interface GuiDoctorPulse {
  id: string;
  mark: string;
  label: string;
  from: string;
  to: string;
  ink: string;
  ascii: string[];
  note: string;
}

export interface GuiTerminalDoctor {
  headline: string;
  terminalLines: string[];
  checks: GuiDoctorCheck[];
  pulses: GuiDoctorPulse[];
}

function fit(value: string | number, width: number): string {
  return String(value).padEnd(width).slice(0, width);
}

function pulse(id: string, label: string, ascii: string[], note: string): GuiDoctorPulse {
  const brand = providerBrand(id);
  return {
    id,
    mark: brand.mark,
    label,
    from: brand.from,
    to: brand.to,
    ink: brand.ink,
    ascii,
    note,
  };
}

export function buildGuiTerminalDoctor(): GuiTerminalDoctor {
  const built = PROVIDERS.filter((provider) => provider.status === "built").length;
  const verified = PROVIDERS.filter((provider) => provider.status === "built" && provider.verified).length;
  const local = PROVIDERS.filter((provider) => provider.tier === "local" || provider.auth === "localLogs").length;
  const manual = PROVIDERS.filter((provider) => provider.tier === "manual" || provider.status === "manual-only").length;
  const proxy = PROVIDERS.filter((provider) => provider.tier === "proxy").length;

  return {
    headline: "GUI DOCTOR RACK",
    terminalLines: [
      "+------------------------------------------------------+",
      "| VTK://GUI-DOCTOR//INLINE-TERMINAL//VIBERS-UNITE     |",
      "|------------------------------------------------------|",
      `| mapped ${fit(PROVIDERS.length, 5)} built ${fit(built, 5)} verified ${fit(verified, 5)} |`,
      `| local  ${fit(local, 5)} proxy ${fit(proxy, 5)} manual   ${fit(manual, 5)} |`,
      "|------------------------------------------------------|",
      "| run: vibetracker doctor                              |",
      "| next commands stay visible before any upload         |",
      "| GitHub/Codex/profile proof = NOT USAGE               |",
      "+------------------------------------------------------+",
    ],
    checks: [
      {
        id: "doctor",
        label: "Local health",
        status: "ready",
        impact: "local_only",
        command: "vibetracker doctor",
        note: "Config, ledger, browser extension, provider catalog, local API, and publish state in one terminal rack.",
        meter: 94,
      },
      {
        id: "privacy",
        label: "Privacy lock",
        status: "check",
        impact: "privacy",
        command: "vibetracker upload --dry-run",
        note: "Dry-run review and secret scan happen before anything leaves the machine.",
        meter: 88,
      },
      {
        id: "local-api",
        label: "Inline capture",
        status: "local",
        impact: "usage",
        command: "vibetracker api serve --port 8765",
        note: "Browser and desktop capture post to localhost; the GUI shows that boundary instead of hiding it.",
        meter: 76,
      },
      {
        id: "trust",
        label: "Trust rail",
        status: "not_usage",
        impact: "not_usage",
        command: "vibetracker audit",
        note: "GitHub, Codex, creator cadence, and profile evidence stay labelled separately from usage spend.",
        meter: 100,
      },
    ],
    pulses: [
      pulse("higgsfield", "Higgsfield", ["  /\\  ", "- HF -", "  \\/  "], "Higgsfield MCP prism turns before creator credits fold into the ledger."),
      pulse("codex-cli", "Codex CLI", [" /CX\\ ", "<diff>", " \\__/ "], "Builder evidence rides a side rail and never becomes fake spend."),
      pulse("ollama", "Ollama", [" .OL. ", "(ping)", " local"], "Local AI checks keep Ollama, LM Studio, ComfyUI, and vLLM on-machine."),
      pulse("c0vibe", "C0VIBE", [" C0V ", "VIBE", "APP "], "Vibers Unite at c0vibe.app only after local review."),
    ],
  };
}
