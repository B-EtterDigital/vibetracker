import type { ProfileView } from "./data";
import { providerBrand } from "./provider-brand.ts";

export type ProfileTransmissionImpact = "usage" | "not_usage" | "publish";
export type ProfileTransmissionTone = "ingest" | "daily" | "provider" | "trust" | "publish";

export interface ProfileTransmissionStage {
  id: "ingest" | "daily" | "provider" | "trust" | "publish";
  label: string;
  value: string;
  status: string;
  note: string;
  impact: ProfileTransmissionImpact;
  tone: ProfileTransmissionTone;
  meter: number;
  mark: string;
  from: string;
  to: string;
  ink: string;
  route: string;
}

export interface ProfileTransmissionDeck {
  headline: string;
  subline: string;
  terminalLines: string[];
  stages: ProfileTransmissionStage[];
}

function int(value: number | null | undefined): string {
  return Number(value ?? 0).toLocaleString("en-US");
}

function usd(value: number | null | undefined): string {
  return `$${Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function meter(value: number, max: number, floor = 10): number {
  if (max <= 0 || value <= 0) return floor;
  return Math.max(floor, Math.min(100, Math.round((value / max) * 100)));
}

function tierLabel(tier: string | null | undefined): string {
  return (tier ?? "not_synced").replace(/_/g, " ").toUpperCase();
}

function topProvider(profile: ProfileView): ProfileView["providers"][number] | undefined {
  return profile.providers.slice().sort((a, b) => b.usd - a.usd || b.ops - a.ops || a.provider.localeCompare(b.provider))[0];
}

export function buildProfileTransmissionDeck(profile: ProfileView): ProfileTransmissionDeck {
  const latest = profile.latest;
  const top = topProvider(profile);
  const topBrand = top ? providerBrand(top.provider) : providerBrand("c0vibe");
  const c0vibe = providerBrand("c0vibe");
  const activeDays = profile.usageDays.filter((day) => day.ops > 0).length || (latest ? 1 : 0);
  const dailyRows = profile.usageDays.length;
  const providerCount = profile.providers.length;
  const trustCount = profile.trustSignals.length;
  const maxOps = Math.max(latest?.record_count ?? 0, 1_000);
  const maxProviders = Math.max(providerCount, 6);

  const stages: ProfileTransmissionStage[] = [
    {
      id: "ingest",
      label: "Bundle ingest",
      value: latest ? `${int(latest.record_count)} ops` : "waiting",
      status: latest ? "accepted" : "empty",
      note: latest ? `${usd(latest.total_usd)} estimated spend from reviewed usage records.` : "No reviewed usage upload yet.",
      impact: "usage",
      tone: "ingest",
      meter: latest ? meter(latest.record_count, maxOps, 18) : 8,
      mark: "VT",
      from: "#2ee8d6",
      to: "#36e39b",
      ink: "#071013",
      route: "upload -> sanitize",
    },
    {
      id: "daily",
      label: "Daily aggregate",
      value: `${int(activeDays)} active day${activeDays === 1 ? "" : "s"}`,
      status: dailyRows ? "by-day" : latest ? "fallback" : "empty",
      note: dailyRows ? `${int(dailyRows)} daily rows feed the public rhythm.` : "Upload-day fallback until daily rows exist.",
      impact: "usage",
      tone: "daily",
      meter: meter(activeDays, Math.max(activeDays, 14), latest ? 18 : 8),
      mark: "GH",
      from: "#0e4429",
      to: "#39d353",
      ink: "#f0fff4",
      route: "bucket -> heatgrid",
    },
    {
      id: "provider",
      label: "Provider fanout",
      value: `${int(providerCount)} source${providerCount === 1 ? "" : "s"}`,
      status: top ? top.provider : "empty",
      note: top ? `${top.provider} leads with ${usd(top.usd)} and ${int(top.ops)} ops.` : "No provider breakdown yet.",
      impact: "usage",
      tone: "provider",
      meter: meter(providerCount, maxProviders, latest ? 18 : 8),
      mark: topBrand.mark,
      from: topBrand.from,
      to: topBrand.to,
      ink: topBrand.ink,
      route: "normalize -> mix",
    },
    {
      id: "trust",
      label: "Trust side rail",
      value: `${int(trustCount)} signal${trustCount === 1 ? "" : "s"}`,
      status: trustCount ? "context" : "empty",
      note: "NOT USAGE. Trust context never changes spend, credits, operations, rank, or verified status.",
      impact: "not_usage",
      tone: "trust",
      meter: trustCount ? Math.min(100, 24 + trustCount * 16) : 8,
      mark: "NO",
      from: "#ffc64d",
      to: "#ff4fd8",
      ink: "#071013",
      route: "label -> side rail",
    },
    {
      id: "publish",
      label: "Public receipt",
      value: tierLabel(latest?.tier),
      status: latest ? "live" : "draft",
      note: "C0VIBE relay shows the proof receipt only after local review and upload.",
      impact: "publish",
      tone: "publish",
      meter: latest ? 100 : 12,
      mark: c0vibe.mark,
      from: c0vibe.from,
      to: c0vibe.to,
      ink: c0vibe.ink,
      route: "review -> c0vibe.app",
    },
  ];

  return {
    headline: latest ? "Profile datastream is live" : "Profile datastream is waiting",
    subline: latest
      ? "Usage, daily rhythm, provider mix, trust context, and the public receipt are shown as separate proof steps."
      : "Run the local wizard and publish a reviewed aggregate bundle to light up the transmission.",
    terminalLines: [
      `VTK://PROFILE-TRANSMISSION//@${profile.handle}//C0VIBE.APP`,
      latest ? `ingest ${int(latest.record_count)} ops // ${usd(latest.total_usd)} // ${tierLabel(latest.tier)}` : "ingest waiting // no reviewed bundle",
      `daily ${int(activeDays)} active // providers ${int(providerCount)} // top ${top?.provider ?? "none"}`,
      `trust ${int(trustCount)} NOT USAGE // publish ${latest ? "live" : "draft"} // Vibers Unite`,
    ],
    stages,
  };
}
