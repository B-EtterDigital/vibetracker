import type { ProviderDescriptor } from "../../adapters/src/registry.ts";
import { formatTable } from "./format.ts";

export interface CapabilityCheck {
  id: string;
  label: string;
  state: "verified" | "built_needs_verification" | "proxy_ready" | "manual" | "planned";
  action: string;
}

export function providerCapabilityChecks(providers: ProviderDescriptor[]): CapabilityCheck[] {
  return providers.map((provider) => {
    if (provider.status === "built" && provider.verified) {
      return { id: provider.id, label: provider.label, state: "verified", action: "adapter endpoint is verified" };
    }
    if (provider.status === "built") {
      return { id: provider.id, label: provider.label, state: "built_needs_verification", action: "refresh endpoint/auth proof and fixtures" };
    }
    if (provider.tier === "proxy") {
      return { id: provider.id, label: provider.label, state: "proxy_ready", action: `run vibetracker detect --target <${provider.id}-base-url>` };
    }
    if (provider.tier === "manual" || provider.status === "manual-only") {
      return { id: provider.id, label: provider.label, state: "manual", action: `run vibetracker add ${provider.id} --usd <amount>` };
    }
    return { id: provider.id, label: provider.label, state: "planned", action: `run vibetracker adapter scaffold ${provider.id} --dry-run` };
  });
}

export function renderCapabilityChecks(checks: CapabilityCheck[]): string {
  const counts = checks.reduce<Record<string, number>>((acc, check) => {
    acc[check.state] = (acc[check.state] ?? 0) + 1;
    return acc;
  }, {});
  const rows = checks
    .filter((check) => check.state !== "verified")
    .slice(0, 40)
    .map((check) => [check.id, check.state, check.action]);
  return [
    "PROVIDER CAPABILITY FRESHNESS",
    `verified ${counts.verified ?? 0} · needs proof ${counts.built_needs_verification ?? 0} · proxy ${counts.proxy_ready ?? 0} · manual ${counts.manual ?? 0} · planned ${counts.planned ?? 0}`,
    "",
    formatTable(["PROVIDER", "STATE", "NEXT ACTION"], rows),
    "",
    "This is a freshness checklist. It does not mark planned providers as built.",
  ].join("\n");
}
