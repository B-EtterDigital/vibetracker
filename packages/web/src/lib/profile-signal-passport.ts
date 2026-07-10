import type { ProfileView } from "./data.ts";
import { providerBrand } from "./provider-brand.ts";
import { buildVibeScoreReceipt } from "./vibe-score.ts";

export type ProfileSignalPassportImpact = "usage" | "source" | "local_only" | "not_usage" | "publish";

export interface ProfileSignalPassportStamp {
  id: "usage" | "source" | "rhythm" | "trust" | "relay";
  label: string;
  value: string;
  route: string;
  note: string;
  impact: ProfileSignalPassportImpact;
  mark: string;
  from: string;
  to: string;
  ink: string;
  meter: number;
}

export interface ProfileSignalPassport {
  headline: string;
  subline: string;
  profileUrl: string;
  passportId: string;
  terminalLines: string[];
  signalRows: string[];
  stamps: ProfileSignalPassportStamp[];
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

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function fit(value: string | number, width: number): string {
  return String(value).padEnd(width).slice(0, width);
}

function frame(value: string): string {
  return `| ${fit(value, 60)} |`;
}

function brandFor(id: string) {
  const brand = providerBrand(id);
  return { mark: brand.mark, from: brand.from, to: brand.to, ink: brand.ink };
}

function topProvider(profile: ProfileView): ProfileView["providers"][number] | undefined {
  return profile.providers.slice().sort((a, b) => b.usd - a.usd || b.ops - a.ops || a.provider.localeCompare(b.provider))[0];
}

function localOps(profile: ProfileView): number {
  return profile.providers
    .filter((provider) => LOCAL_PROVIDERS.has(provider.provider.toLowerCase()))
    .reduce((sum, provider) => sum + provider.ops, 0);
}

function activeDays(profile: ProfileView): number {
  return profile.usageDays.filter((day) => day.ops > 0 || day.usd > 0 || day.credits > 0).length || (profile.latest ? 1 : 0);
}

function hashText(input: string): string {
  let hash = 2166136261;
  for (const char of input) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, "0").slice(0, 8).toUpperCase();
}

function seedFor(profile: ProfileView, passportId: string): number {
  return parseInt(hashText([
    passportId,
    profile.handle,
    profile.latest?.created_at ?? "waiting",
    profile.providers.map((provider) => `${provider.provider}:${provider.ops}:${provider.usd}`).join("|"),
    profile.trustSignals.length,
  ].join("//")), 16) >>> 0;
}

function signalRows(profile: ProfileView, passportId: string): string[] {
  let seed = seedFor(profile, passportId);
  const glyphs = [".", ":", "+", "*", "#", "%", "=", "-", "@", "/"];
  const next = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed;
  };
  return Array.from({ length: 5 }, (_, row) =>
    Array.from({ length: 34 }, (_, col) => glyphs[(next() + row * 17 + col * 31) % glyphs.length]).join("")
  );
}

export function buildProfileSignalPassport(profile: ProfileView): ProfileSignalPassport {
  const receipt = buildVibeScoreReceipt(profile);
  const latest = profile.latest;
  const top = topProvider(profile);
  const totalOps = latest?.record_count ?? 0;
  const totalUsd = latest?.total_usd ?? 0;
  const trustCount = profile.trustSignals.length;
  const days = activeDays(profile);
  const local = localOps(profile);
  const topBrand = top ? brandFor(top.provider) : brandFor("c0vibe");
  const passportId = `VTK-${hashText([
    profile.handle,
    latest?.created_at ?? "waiting",
    totalOps,
    totalUsd,
    top?.provider ?? "none",
    trustCount,
  ].join("//"))}`;
  const profileUrl = `https://c0vibe.app/u/${profile.handle}`;

  const stamps: ProfileSignalPassportStamp[] = [
    {
      id: "usage",
      label: "Usage seal",
      value: latest ? `${int(totalOps)} ops` : "waiting",
      route: "usage://reviewed-aggregate",
      note: latest ? `${usd(totalUsd)} estimated public spend from reviewed aggregate rows.` : "No reviewed aggregate has been published yet.",
      impact: "usage",
      ...brandFor("openai"),
      meter: latest ? clamp(28 + Math.log10(Math.max(1, totalOps)) * 18) : 8,
    },
    {
      id: "source",
      label: "Lead source",
      value: top?.provider ?? "no source",
      route: top ? `provider://${top.provider}` : "provider://waiting",
      note: top ? `${top.provider} leads the public source mix.` : "Provider stamps appear after sync and review.",
      impact: "source",
      ...topBrand,
      meter: top && totalUsd > 0 ? clamp((top.usd / totalUsd) * 100, 16) : top ? 24 : 8,
    },
    {
      id: "rhythm",
      label: "Usage rhythm",
      value: latest ? `${int(days)} day${days === 1 ? "" : "s"}` : "offline",
      route: "rhythm://daily-aggregate",
      note: "Rhythm is aggregated by day; no prompts, outputs, or secret values are shown.",
      impact: "usage",
      ...brandFor("higgsfield"),
      meter: latest ? clamp(20 + days * 8) : 8,
    },
    {
      id: "trust",
      label: "Trust side rail",
      value: `${int(trustCount)} signal${trustCount === 1 ? "" : "s"}`,
      route: "trust://not-usage",
      note: "NOT USAGE. Trust context never changes spend, credits, operations, score, or rank.",
      impact: "not_usage",
      ...brandFor("github"),
      meter: trustCount ? clamp(24 + trustCount * 18) : 8,
    },
    {
      id: "relay",
      label: "C0VIBE relay",
      value: latest ? receipt.tier : "not synced",
      route: profileUrl,
      note: local ? `${int(local)} local ops stay source-labelled; share only reviewed aggregates.` : "Vibers Unite after local review and dry-run publish.",
      impact: "publish",
      ...brandFor("c0vibe"),
      meter: latest ? 100 : 16,
    },
  ];
  const rows = signalRows(profile, passportId);

  return {
    headline: latest ? `@${profile.handle} signal passport` : `@${profile.handle} passport waiting room`,
    subline: latest
      ? "A compact share artifact that proves what the public profile is, what it is not, and where each signal rail belongs."
      : "The passport shell is ready before upload and fills only after reviewed aggregate usage exists.",
    profileUrl,
    passportId,
    signalRows: rows,
    stamps,
    terminalLines: [
      "+--------------------------------------------------------------+",
      frame(`VTK://SIGNAL-PASSPORT//@${profile.handle}//C0VIBE.APP`),
      "|--------------------------------------------------------------|",
      frame(`passport ${passportId} // ${receipt.score}/100`),
      frame(`usage ${latest ? `${int(totalOps)} ops / ${usd(totalUsd)}` : "waiting for reviewed aggregate"}`),
      frame(`source ${top?.provider ?? "waiting"} // rhythm ${latest ? `${int(days)}d` : "offline"}`),
      frame(`trust ${int(trustCount)} signals // NOT USAGE`),
      frame("no prompts // no outputs // no secrets // aggregate only"),
      frame("Vibers Unite // c0vibe.app"),
      "+--------------------------------------------------------------+",
    ],
  };
}
