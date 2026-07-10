import type { ProfileView } from "./data.ts";
import { providerBrand } from "./provider-brand.ts";
import type { VibeScoreReceipt } from "./vibe-score.ts";

export type ProfilePocketMetricId = "score" | "usage" | "trust" | "privacy" | "relay";
export type ProfilePocketImpact = "score" | "usage" | "not_usage" | "privacy" | "publish";

export interface ProfilePocketMetric {
  id: ProfilePocketMetricId;
  label: string;
  value: string;
  note: string;
  guardrail: string;
  route: string;
  impact: ProfilePocketImpact;
  meter: number;
  mark: string;
  from: string;
  to: string;
  ink: string;
  frames: string[];
}

export interface ProfilePocketTotals {
  score: number;
  ops: number;
  usd: number;
  activeDays: number;
  providers: number;
  trustSignals: number;
  usageWrites: 0;
  hiddenUploads: 0;
  promptReads: 0;
  outputReads: 0;
  trustBoost: 0;
}

export interface ProfileWalletPassChip {
  id: "handle" | "score" | "usage" | "trust" | "relay";
  label: string;
  value: string;
  impact: ProfilePocketImpact;
}

export interface ProfileWalletPass {
  title: string;
  subtitle: string;
  passId: string;
  status: "published" | "waiting";
  matrixRows: string[];
  terminalLines: string[];
  chips: ProfileWalletPassChip[];
  seals: string[];
}

export interface ProfilePocketCard {
  headline: string;
  subline: string;
  seal: string;
  shareUrl: string;
  terminalLines: string[];
  metrics: ProfilePocketMetric[];
  walletPass: ProfileWalletPass;
  totals: ProfilePocketTotals;
}

function int(value: number): string {
  return value.toLocaleString("en-US");
}

function money(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function line(text: string, width = 62): string {
  const clipped = text.length > width ? text.slice(0, width) : text;
  return `| ${clipped.padEnd(width)} |`;
}

function short(text: string, width = 14): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > width ? normalized.slice(0, width) : normalized;
}

function stableSeal(parts: Array<string | number>): string {
  let hash = 2166136261;
  for (const char of parts.join("//")) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, "0").slice(0, 8).toUpperCase();
}

function walletMatrix(seedText: string): string[] {
  let seed = parseInt(stableSeal([seedText, "wallet-pass"]), 16) >>> 0;
  const next = () => {
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
    return seed;
  };
  return Array.from({ length: 9 }, (_, row) =>
    Array.from({ length: 23 }, (_, col) => {
      if (row === 0 || row === 8 || col === 0 || col === 22) return "#";
      if ((row < 3 && col < 5) || (row > 5 && col > 17) || (row < 3 && col > 17)) return (row + col) % 2 ? "#" : " ";
      const value = (next() + row * 17 + col * 29) % 11;
      if (value > 7) return "#";
      if (value > 5) return "+";
      if (value > 3) return ".";
      return " ";
    }).join("")
  );
}

function activeDays(profile: ProfileView): number {
  return profile.usageDays.filter((day) => day.ops > 0).length || (profile.latest ? 1 : 0);
}

function topProvider(profile: ProfileView): ProfileView["providers"][number] | null {
  return profile.providers.slice().sort((a, b) => (b.usd - a.usd) || (b.ops - a.ops))[0] ?? null;
}

function trustProviderId(profile: ProfileView): string {
  const signal = profile.trustSignals[0];
  if (!signal) return "github";
  if (signal.kind === "higgsfield_mcp") return signal.provider;
  if (signal.kind === "github_activity") return "github";
  return signal.platform;
}

function trustSourceLabel(profile: ProfileView): string {
  const names = profile.trustSignals.map((signal) => {
    if (signal.kind === "higgsfield_mcp") return "Higgsfield MCP";
    if (signal.kind === "github_activity") return "GitHub";
    return signal.platform.toUpperCase();
  });
  return names.length ? Array.from(new Set(names)).slice(0, 3).join(" + ") : "no trust signal";
}

function brand(provider: string): Pick<ProfilePocketMetric, "mark" | "from" | "to" | "ink"> {
  const b = providerBrand(provider);
  return { mark: b.mark, from: b.from, to: b.to, ink: b.ink };
}

function impactLabel(impact: ProfilePocketImpact): string {
  if (impact === "not_usage") return "NOT USAGE";
  if (impact === "publish") return "PUBLISH";
  return impact.toUpperCase();
}

function frames(mark: string, id: string, value: string, route: string, impact: ProfilePocketImpact, meter: number): string[] {
  return [
    `${mark}\n${short(id.toUpperCase(), 10)}\n${impactLabel(impact)}`,
    `${short(value, 12)}\n${short(route, 12)}\n${meter}%`,
    `${mark}${mark}\nVIBERS\nUNITE`,
  ];
}

function metric(config: Omit<ProfilePocketMetric, "frames">): ProfilePocketMetric {
  return {
    ...config,
    frames: frames(config.mark, config.id, config.value, config.route, config.impact, config.meter),
  };
}

export function buildProfilePocketCard(profile: ProfileView, receipt: VibeScoreReceipt): ProfilePocketCard {
  const ops = profile.latest?.record_count ?? 0;
  const usd = profile.latest?.total_usd ?? 0;
  const days = activeDays(profile);
  const top = topProvider(profile);
  const usageProvider = top?.provider ?? "openai";
  const trustProvider = trustProviderId(profile);
  const trustSignals = profile.trustSignals.length;
  const providerCount = profile.providers.length;
  const shareUrl = `https://c0vibe.app/u/${encodeURIComponent(profile.handle)}`;
  const scoreBrand = brand("c0vibe");
  const usageBrand = brand(usageProvider);
  const trustBrand = brand(trustProvider);
  const privacyBrand = brand("codex-cli");
  const relayBrand = brand("c0vibe");
  const seal = stableSeal([profile.handle, receipt.score, ops, usd.toFixed(2), providerCount, trustSignals]);
  const passId = `C0-${seal.slice(0, 4)}-${stableSeal([shareUrl, receipt.score, ops]).slice(0, 4)}`;
  const border = `+${"-".repeat(64)}+`;

  const metrics: ProfilePocketMetric[] = [
    metric({
      id: "score",
      label: "Vibe score",
      value: `${receipt.score}/100`,
      note: profile.latest ? `${receipt.tier} tier from reviewed public aggregates.` : "Waiting for the first reviewed upload.",
      guardrail: "Score uses usage, rhythm, coverage, and freshness only.",
      route: "score receipt",
      impact: "score",
      meter: receipt.score,
      ...scoreBrand,
    }),
    metric({
      id: "usage",
      label: "Usage mass",
      value: `${int(ops)} ops`,
      note: `${money(usd)} estimated spend across ${int(providerCount)} public provider row${providerCount === 1 ? "" : "s"}.`,
      guardrail: "Accepted usage rows only; no social or trust counts enter ops.",
      route: usageProvider,
      impact: "usage",
      meter: clamp(Math.round(Math.log10(ops + 1) * 24)),
      ...usageBrand,
    }),
    metric({
      id: "trust",
      label: "Trust side rail",
      value: `${int(trustSignals)} signal${trustSignals === 1 ? "" : "s"}`,
      note: `${trustSourceLabel(profile)} context only; +0 score and +0 spend.`,
      guardrail: "NOT USAGE. Never changes spend, credits, ops, rank, or verified provider totals.",
      route: trustProvider,
      impact: "not_usage",
      meter: trustSignals ? clamp(36 + trustSignals * 14) : 0,
      ...trustBrand,
    }),
    metric({
      id: "privacy",
      label: "Privacy rail",
      value: "0 raw reads",
      note: "Public card renders aggregates; raw prompts, outputs, files, and local ledger lines stay out.",
      guardrail: "0 hidden uploads // 0 prompt reads // 0 output reads.",
      route: "local review",
      impact: "privacy",
      meter: 100,
      ...privacyBrand,
    }),
    metric({
      id: "relay",
      label: "C0VIBE relay",
      value: profile.latest ? "published" : "draft",
      note: "The public profile carries the share signal without rewriting usage totals.",
      guardrail: "Publish is a display surface, not a data source.",
      route: "c0vibe.app",
      impact: "publish",
      meter: profile.latest ? 100 : 18,
      ...relayBrand,
    }),
  ];

  return {
    headline: profile.latest ? `@${profile.handle} pocket signal` : `@${profile.handle} pocket signal waiting`,
    subline: "Mobile-readable public receipt for score, usage, trust context, privacy guardrails, and the C0VIBE relay.",
    seal,
    shareUrl,
    terminalLines: [
      border,
      line(`VTK://PROFILE-POCKET-CARD//@${profile.handle}//C0VIBE.APP`),
      line(`score ${String(receipt.score).padStart(3, "0")}/100 // ops ${int(ops)} // spend ${money(usd)}`),
      line(`sources ${int(providerCount)} // activeDays ${int(days)} // tier ${receipt.tier}`),
      line(`trust ${int(trustSignals)} NOT USAGE // trustBoost 0 // usageWrites 0`),
      line("privacy hiddenUploads 0 // promptReads 0 // outputReads 0"),
      line(`Vibers Unite // ${shareUrl}`),
      border,
    ],
    metrics,
    walletPass: {
      title: profile.latest ? "C0VIBE wallet pass" : "C0VIBE pass waiting room",
      subtitle: "Pocket proof for sharing the reviewed aggregate profile without raw prompts, outputs, secrets, or trust/rank mixing.",
      passId,
      status: profile.latest ? "published" : "waiting",
      matrixRows: walletMatrix([profile.handle, seal, shareUrl, receipt.score, ops, trustSignals].join("//")),
      terminalLines: [
        "+------------------------------------------+",
        `| VTK://WALLET-PASS//@${short(profile.handle, 18).padEnd(18)} |`,
        `| pass ${passId.padEnd(16)} score ${String(receipt.score).padStart(3)} |`,
        `| usage ${int(ops).padEnd(11).slice(0, 11)} trust +0 rank +0 |`,
        "| raw prompts 0 // outputs 0 // hidden 0  |",
        "| Vibers Unite // c0vibe.app              |",
        "+------------------------------------------+",
      ],
      chips: [
        { id: "handle", label: "Handle", value: `@${profile.handle}`, impact: "publish" },
        { id: "score", label: "Score", value: `${receipt.score}/100`, impact: "score" },
        { id: "usage", label: "Usage", value: `${int(ops)} ops`, impact: "usage" },
        { id: "trust", label: "Trust", value: `${int(trustSignals)} not usage`, impact: "not_usage" },
        { id: "relay", label: "Relay", value: "c0vibe.app", impact: "publish" },
      ],
      seals: [
        "aggregate only",
        "trust +0",
        "rank +0",
        "hiddenUpload=0",
        "rawContent=0",
      ],
    },
    totals: {
      score: receipt.score,
      ops,
      usd,
      activeDays: days,
      providers: providerCount,
      trustSignals,
      usageWrites: 0,
      hiddenUploads: 0,
      promptReads: 0,
      outputReads: 0,
      trustBoost: 0,
    },
  };
}
