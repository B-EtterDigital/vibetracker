import type { ProfileView } from "./data.ts";
import { providerBrand } from "./provider-brand.ts";

export type ProfileBroadcastImpact = "usage" | "local_only" | "not_usage" | "publish";

export interface ProfileBroadcastRail {
  id: "usage" | "source" | "local" | "trust" | "relay";
  label: string;
  value: string;
  route: string;
  note: string;
  impact: ProfileBroadcastImpact;
  mark: string;
  from: string;
  to: string;
  ink: string;
  meter: number;
}

export interface ProfileBroadcastPulse {
  id: ProfileBroadcastRail["id"];
  label: string;
  railLabel: string;
  command: string;
  value: string;
  detail: string;
  impact: ProfileBroadcastImpact;
  mark: string;
  from: string;
  to: string;
  ink: string;
  meter: number;
  frames: string[];
  terminalLines: string[];
  visualOnly: true;
  usageWrites: false;
}

export interface ProfileBroadcastStrip {
  headline: string;
  subline: string;
  profileUrl: string;
  terminalLines: string[];
  ticker: string[];
  signalRows: string[];
  rails: ProfileBroadcastRail[];
  pulses: ProfileBroadcastPulse[];
}

const LOCAL_PROVIDERS = new Set([
  "ollama",
  "lmstudio",
  "comfyui",
  "vllm",
  "localai",
  "jan",
  "llama-cpp",
  "automatic1111",
  "forge",
  "invokeai",
]);

function int(value: number | null | undefined): string {
  return Number(value ?? 0).toLocaleString("en-US");
}

function usd(value: number | null | undefined): string {
  return `$${Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function clamp(value: number, min = 0): number {
  return Math.max(min, Math.min(100, Math.round(value)));
}

function frame(text: string): string {
  return `| ${text.padEnd(60).slice(0, 60)} |`;
}

function pulseFrame(text: string): string {
  return `> ${text.padEnd(44).slice(0, 44)}`;
}

function topProvider(profile: ProfileView): ProfileView["providers"][number] | undefined {
  return profile.providers.slice().sort((a, b) => b.usd - a.usd || b.ops - a.ops || a.provider.localeCompare(b.provider))[0];
}

function brandFor(id: string) {
  const brand = providerBrand(id);
  return { mark: brand.mark, from: brand.from, to: brand.to, ink: brand.ink };
}

function localProviders(profile: ProfileView): ProfileView["providers"] {
  return profile.providers.filter((provider) => LOCAL_PROVIDERS.has(provider.provider.toLowerCase()));
}

function seedFor(profile: ProfileView): number {
  const latest = profile.latest;
  const source = [
    profile.handle,
    latest?.created_at ?? "",
    latest?.record_count ?? 0,
    latest?.total_usd ?? 0,
    profile.providers.map((provider) => `${provider.provider}:${provider.ops}:${provider.usd}`).join("|"),
    profile.trustSignals.length,
  ].join(":");
  let hash = 2166136261;
  for (const char of source) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash >>> 0;
}

function signalRows(profile: ProfileView): string[] {
  let seed = seedFor(profile);
  const glyphs = [".", ":", "+", "*", "#", "%", "=", "-"];
  const next = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed;
  };
  return Array.from({ length: 4 }, (_, row) =>
    Array.from({ length: 32 }, (_, col) => glyphs[(next() + row * 13 + col * 29) % glyphs.length]).join("")
  );
}

function railLabel(impact: ProfileBroadcastImpact): string {
  if (impact === "not_usage") return "NOT USAGE";
  if (impact === "local_only") return "LOCAL ONLY";
  return impact.toUpperCase();
}

function pulseCommand(id: ProfileBroadcastRail["id"]): string {
  if (id === "usage") return "usage:aggregate.read";
  if (id === "source") return "source:brand.lock";
  if (id === "local") return "local:shadow.keep";
  if (id === "trust") return "trust:sidecar.lock";
  return "relay:review.share";
}

function pulseFrames(rail: ProfileBroadcastRail): string[] {
  if (rail.id === "usage") return ["USE", "OPS", "USD", "OK"];
  if (rail.id === "source") return [rail.mark, "TOP", "SRC", "MIX"];
  if (rail.id === "local") return ["LAN", "LOOP", "LOCAL", "HOLD"];
  if (rail.id === "trust") return ["LOCK", "NOT", "USAGE", "SIDE"];
  return ["C0", "VIBE", "UNITE", "LIVE"];
}

function pulseDetail(rail: ProfileBroadcastRail): string {
  if (rail.id === "usage") return "Reviewed aggregate powers score and public rhythm.";
  if (rail.id === "source") return "Provider color locks to the leading reviewed source.";
  if (rail.id === "local") return "Local rows stay labelled and never leak raw prompts.";
  if (rail.id === "trust") return "Trust sidecar is visible context, not usage.";
  return "C0VIBE relay waits for the reviewed public aggregate.";
}

function buildPulses(rails: ProfileBroadcastRail[]): ProfileBroadcastPulse[] {
  return rails.map((rail) => {
    const label = railLabel(rail.impact);
    const command = pulseCommand(rail.id);
    const detail = pulseDetail(rail);
    return {
      id: rail.id,
      label: rail.label,
      railLabel: label,
      command,
      value: rail.value,
      detail,
      impact: rail.impact,
      mark: rail.mark,
      from: rail.from,
      to: rail.to,
      ink: rail.ink,
      meter: rail.meter,
      frames: pulseFrames(rail),
      terminalLines: [
        pulseFrame(`${rail.id.toUpperCase()} ${label}`),
        pulseFrame(`${command} -> ${rail.value}`),
        pulseFrame(detail),
        pulseFrame("visualOnly=1 usageWrites=0"),
      ],
      visualOnly: true,
      usageWrites: false,
    };
  });
}

export function buildProfileBroadcastStrip(profile: ProfileView): ProfileBroadcastStrip {
  const latest = profile.latest;
  const totalOps = latest?.record_count ?? 0;
  const totalUsd = latest?.total_usd ?? 0;
  const totalCredits = latest?.total_credits ?? 0;
  const top = topProvider(profile);
  const local = localProviders(profile);
  const localOps = local.reduce((sum, provider) => sum + provider.ops, 0);
  const trustCount = profile.trustSignals.length;
  const c0vibe = brandFor("c0vibe");
  const topBrand = top ? brandFor(top.provider) : c0vibe;
  const profileUrl = `https://c0vibe.app/u/${profile.handle}`;
  const latestTier = latest?.tier ?? "not_synced";

  const rails: ProfileBroadcastRail[] = [
    {
      id: "usage",
      label: "Usage broadcast",
      value: latest ? `${int(totalOps)} ops` : "waiting",
      route: "usage://aggregate",
      note: latest ? `${usd(totalUsd)} estimated public spend / ${int(totalCredits)} credits.` : "No reviewed usage upload yet.",
      impact: "usage",
      ...brandFor("openai"),
      meter: latest ? clamp(30 + Math.log10(Math.max(1, totalOps)) * 18) : 6,
    },
    {
      id: "source",
      label: "Lead provider",
      value: top?.provider ?? "no source",
      route: top ? `provider://${top.provider}` : "provider://waiting",
      note: top ? `${int(top.ops)} ops from ${top.provider}.` : "Provider mix appears after sync.",
      impact: "usage",
      ...topBrand,
      meter: top && totalUsd > 0 ? clamp((top.usd / totalUsd) * 100, 14) : top ? 30 : 6,
    },
    {
      id: "local",
      label: "Local rail",
      value: local.length ? `${int(localOps)} ops` : "ready",
      route: "local://loopback",
      note: local.length ? "Local/provider rows stay labelled by source." : "Local-only sources stay private until reviewed upload.",
      impact: "local_only",
      ...brandFor(local[0]?.provider ?? "ollama"),
      meter: local.length ? clamp(18 + local.length * 18 + localOps / Math.max(totalOps, 1) * 42) : 12,
    },
    {
      id: "trust",
      label: "Trust rail",
      value: `${int(trustCount)} signal${trustCount === 1 ? "" : "s"}`,
      route: "trust://not-usage",
      note: "NOT USAGE. Context never changes spend, credits, ops, or rank.",
      impact: "not_usage",
      ...brandFor("github"),
      meter: trustCount ? clamp(24 + trustCount * 18) : 8,
    },
    {
      id: "relay",
      label: "C0VIBE relay",
      value: latestTier.replace(/_/g, " "),
      route: profileUrl,
      note: "Vibers Unite. Share only the reviewed public aggregate.",
      impact: "publish",
      ...c0vibe,
      meter: latest ? 96 : 18,
    },
  ];

  const ticker = [
    latest ? `@${profile.handle} ${int(totalOps)} ops ${usd(totalUsd)}` : `@${profile.handle} waiting for reviewed usage`,
    top ? `${top.provider} leads source mix` : "provider rail waiting",
    local.length ? `${local.length} local rail source${local.length === 1 ? "" : "s"}` : "local-only stays private",
    `${int(trustCount)} trust signal${trustCount === 1 ? "" : "s"} // NOT USAGE`,
    "Vibers Unite // c0vibe.app",
  ];
  const rows = signalRows(profile);
  const pulses = buildPulses(rails);

  return {
    headline: latest ? `@${profile.handle} public broadcast strip` : `@${profile.handle} broadcast waiting room`,
    subline: latest
      ? "A share-first public strip from reviewed aggregate usage. Trust and local rails stay visibly separate."
      : "The broadcast strip is ready now and fills with real aggregates after the first reviewed upload.",
    profileUrl,
    ticker,
    signalRows: rows,
    rails,
    pulses,
    terminalLines: [
      "+--------------------------------------------------------------+",
      frame(`VTK://PROFILE-BROADCAST//@${profile.handle}//VIBERS-UNITE`),
      "|--------------------------------------------------------------|",
      frame(`usage ${latest ? `${int(totalOps)} ops / ${usd(totalUsd)}` : "waiting for reviewed upload"}`),
      frame(`source ${top?.provider ?? "waiting"} // local ${local.length ? int(localOps) : "ready"}`),
      frame(`trust ${int(trustCount)} signals // NOT USAGE`),
      frame(`relay ${latestTier.replace(/_/g, " ")} // c0vibe.app`),
      frame("signal -----------------------------------------------------"),
      ...rows.map(frame),
      "+--------------------------------------------------------------+",
    ],
  };
}
