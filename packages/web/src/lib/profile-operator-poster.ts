import type { ProfileView } from "./data.ts";
import { providerBrand } from "./provider-brand.ts";

export type ProfilePosterImpact = "usage" | "not_usage" | "publish";

export interface ProfilePosterPanel {
  id: "usage" | "source" | "rhythm" | "trust" | "relay";
  label: string;
  value: string;
  note: string;
  impact: ProfilePosterImpact;
  mark: string;
  from: string;
  to: string;
  ink: string;
  meter: number;
}

export interface ProfilePosterMarqueeRail {
  id: "usage-feed" | "source-field" | "trust-sidecar" | "c0vibe-relay";
  label: string;
  value: string;
  impact: ProfilePosterImpact;
  mark: string;
  from: string;
  to: string;
  ink: string;
  meter: number;
  frames: string[];
  terminalLine: string;
  guardrail: string;
}

export interface ProfileOperatorPoster {
  headline: string;
  subline: string;
  callsign: string;
  shareLine: string;
  proofStamp: string[];
  terminalLines: string[];
  signalRows: string[];
  panels: ProfilePosterPanel[];
  proofMarquee: ProfilePosterMarqueeRail[];
}

type ProfilePosterMarqueeRailDraft = Omit<ProfilePosterMarqueeRail, "terminalLine">;

function int(value: number | null | undefined): string {
  return Number(value ?? 0).toLocaleString("en-US");
}

function usd(value: number | null | undefined): string {
  return `$${Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fit(value: string | number, width: number): string {
  return String(value).padEnd(width).slice(0, width);
}

function frame(value: string | number): string {
  return `| ${fit(value, 60)} |`;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function callsignFor(handle: string): string {
  const clean = handle.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return clean ? clean.slice(0, 5).padEnd(5, "X") : "VIBEX";
}

function seedFor(profile: ProfileView): number {
  const latest = profile.latest;
  const source = [
    profile.handle,
    latest?.total_usd ?? 0,
    latest?.record_count ?? 0,
    latest?.total_credits ?? 0,
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
  const glyphs = ["░", "▒", "▓", "█", "◆", "◇", "╳", "·"];
  const next = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed;
  };
  return Array.from({ length: 5 }, (_, row) =>
    Array.from({ length: 24 }, (_, col) => {
      const v = next() + row * 17 + col * 31;
      return glyphs[v % glyphs.length];
    }).join("")
  );
}

function topProvider(profile: ProfileView): ProfileView["providers"][number] | undefined {
  return profile.providers.slice().sort((a, b) => b.usd - a.usd || b.ops - a.ops || a.provider.localeCompare(b.provider))[0];
}

function panelBrand(id: string) {
  const brand = providerBrand(id);
  return { mark: brand.mark, from: brand.from, to: brand.to, ink: brand.ink };
}

function marqueeTerminal(rail: Pick<ProfilePosterMarqueeRail, "id" | "value" | "impact" | "guardrail">): string {
  const label = rail.impact === "not_usage" ? "NOT USAGE" : rail.impact.toUpperCase();
  return frame(`${fit(rail.id, 14)} ${fit(rail.value, 16)} ${fit(label, 10)} ${rail.guardrail}`);
}

export function buildProfileOperatorPoster(profile: ProfileView): ProfileOperatorPoster {
  const latest = profile.latest;
  const callsign = callsignFor(profile.handle);
  const top = topProvider(profile);
  const activeDays = profile.usageDays.filter((day) => day.ops > 0 || day.usd > 0).length || (latest ? 1 : 0);
  const trustCount = profile.trustSignals.length;
  const totalUsd = latest?.total_usd ?? 0;
  const totalOps = latest?.record_count ?? 0;
  const tier = latest?.tier ?? "not_synced";
  const relay = panelBrand("c0vibe");
  const sourceBrand = top ? panelBrand(top.provider) : relay;

  const panels: ProfilePosterPanel[] = [
    {
      id: "usage",
      label: "Usage core",
      value: latest ? `${int(totalOps)} ops` : "waiting",
      note: latest ? `${usd(totalUsd)} estimated public aggregate.` : "No reviewed usage bundle published yet.",
      impact: "usage",
      ...panelBrand("openai"),
      meter: latest ? clamp(Math.log10(Math.max(1, totalOps)) * 25) : 0,
    },
    {
      id: "source",
      label: "Lead source",
      value: top?.provider ?? "none yet",
      note: top ? `${int(top.ops)} ops / ${usd(top.usd)}.` : "Provider rail appears after sync.",
      impact: "usage",
      ...sourceBrand,
      meter: top && totalUsd > 0 ? clamp((top.usd / totalUsd) * 100) : top ? 42 : 0,
    },
    {
      id: "rhythm",
      label: "Signal rhythm",
      value: `${int(activeDays)}d`,
      note: profile.usageDays.length ? "Daily usage aggregates." : "Upload-day fallback.",
      impact: "usage",
      ...panelBrand("github-actions"),
      meter: clamp(activeDays * 12),
    },
    {
      id: "trust",
      label: "Trust rail",
      value: `${int(trustCount)} signals`,
      note: "NOT USAGE. Context never mutates spend.",
      impact: "not_usage",
      ...panelBrand("github"),
      meter: trustCount ? clamp(28 + trustCount * 18) : 10,
    },
    {
      id: "relay",
      label: "C0VIBE relay",
      value: tier.replace(/_/g, " "),
      note: "Vibers Unite at c0vibe.app after review.",
      impact: "publish",
      ...relay,
      meter: latest ? 92 : 18,
    },
  ];

  const rows = signalRows(profile);
  const headline = latest ? `@${profile.handle} signal poster` : `@${profile.handle} waiting room`;
  const shareLine = latest
    ? `@${profile.handle} // ${int(totalOps)} ops // ${usd(totalUsd)} // Vibers Unite`
    : `@${profile.handle} // waiting for reviewed usage // Vibers Unite`;
  const proofStamp = [
    latest ? `receipt ${tier.replace(/_/g, " ")} // aggregate usage only` : "receipt draft // no reviewed usage bundle",
    "privacy prompts 0 // outputs 0 // secrets 0",
    `trust sidecar ${int(trustCount)} signal${trustCount === 1 ? "" : "s"} // NOT USAGE`,
  ];
  const proofMarquee = ([
    {
      id: "usage-feed",
      label: "Usage feed",
      value: latest ? `${int(totalOps)} ops` : "waiting",
      impact: "usage",
      ...panelBrand("openai"),
      meter: panels[0]?.meter ?? 0,
      guardrail: "aggregate rows only",
      frames: [
        `USAGE\n${fit(int(totalOps), 8)}\nROWS`,
        `USD\n${fit(usd(totalUsd), 8)}\nPUBLIC`,
        `SCORE\nFEEDS\nONLY`,
        `NO RAW\nPROMPTS\nOUTPUTS`,
      ],
    },
    {
      id: "source-field",
      label: "Lead source",
      value: top?.provider ?? "waiting",
      impact: "usage",
      ...sourceBrand,
      meter: panels[1]?.meter ?? 0,
      guardrail: "provider aggregate",
      frames: [
        `${sourceBrand.mark}\nSOURCE\nFIELD`,
        `${fit(top?.provider ?? "waiting", 10)}\n${fit(int(top?.ops ?? 0), 8)}\nOPS`,
        `BRAND\nCOLOR\nLOCK`,
        `CREDIT\nSPEND\nUSAGE`,
      ],
    },
    {
      id: "trust-sidecar",
      label: "Trust sidecar",
      value: `${int(trustCount)} signal${trustCount === 1 ? "" : "s"}`,
      impact: "not_usage",
      ...panelBrand("github"),
      meter: panels[3]?.meter ?? 0,
      guardrail: "cannot change spend",
      frames: [
        "TRUST\nSIDE\nRAIL",
        "GITHUB\nCODEX\nPROOF",
        "NOT\nUSAGE\nRANK",
        "SPEND\nLOCKED\n0",
      ],
    },
    {
      id: "c0vibe-relay",
      label: "C0VIBE relay",
      value: tier.replace(/_/g, " "),
      impact: "publish",
      ...relay,
      meter: panels[4]?.meter ?? 0,
      guardrail: "reviewed publish",
      frames: [
        "VIBERS\nUNITE\nC0",
        "C0VIBE\n.APP\nRELAY",
        "PROFILE\nHEATGRID\nSCORE",
        "PUBLIC\nAFTER\nREVIEW",
      ],
    },
  ] satisfies ProfilePosterMarqueeRailDraft[]).map((rail): ProfilePosterMarqueeRail => ({ ...rail, terminalLine: marqueeTerminal(rail) }));

  return {
    headline,
    subline: latest
      ? `A deterministic public poster from reviewed usage aggregates. Trust evidence stays on its own rail.`
      : "This poster lights up after the local wizard publishes reviewed aggregate usage.",
    callsign,
    shareLine,
    proofStamp,
    signalRows: rows,
    panels,
    proofMarquee,
    terminalLines: [
      "+--------------------------------------------------------------+",
      frame(`VTK://PROFILE-POSTER//${callsign}//VIBERS-UNITE`),
      frame("------------------------------------------------------------"),
      frame(`handle @${profile.handle}`),
      frame(`usage  ${latest ? `${int(totalOps)} ops / ${usd(totalUsd)}` : "no reviewed bundle"}`),
      frame(`source ${top?.provider ?? "waiting"}`),
      frame(`trust  ${int(trustCount)} signals // NOT USAGE`),
      frame(`relay  ${tier.replace(/_/g, " ")} // c0vibe.app`),
      frame("proof  aggregate-only // no prompts outputs secrets"),
      frame("rank   usage rows only // trust impact none"),
      frame("marquee usage/source/trust/relay proof rails"),
      frame("signal -----------------------------------------------------"),
      ...rows.map(frame),
      "+--------------------------------------------------------------+",
    ],
  };
}
