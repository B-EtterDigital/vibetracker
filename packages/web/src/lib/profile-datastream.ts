import type { ProfileView } from "./data.ts";
import { providerBrand } from "./provider-brand.ts";
import type { VibeScoreReceipt } from "./vibe-score.ts";

export type ProfileDatastreamImpact = "usage" | "score" | "not_usage" | "publish";
export type ProfileDatastreamLaneId = "upload" | "providers" | "daily" | "score" | "trust" | "publish";

export interface ProfileDatastreamLane {
  id: ProfileDatastreamLaneId;
  label: string;
  value: string;
  route: string;
  impact: ProfileDatastreamImpact;
  status: string;
  meter: number;
  mark: string;
  from: string;
  to: string;
  ink: string;
  note: string;
  guardrail: string;
  terminalLines: string[];
}

export interface ProfileDatastreamReceipt {
  headline: string;
  subline: string;
  terminalLines: string[];
  seal: string;
  totals: {
    records: number;
    providers: number;
    activeDays: number;
    trustSignals: number;
    score: number;
  };
  lanes: ProfileDatastreamLane[];
  guardrails: string[];
}

function int(value: number | null | undefined): string {
  return Number(value ?? 0).toLocaleString("en-US");
}

function money(value: number | null | undefined): string {
  return `$${Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function meter(value: number, max: number, floor = 8): number {
  if (max <= 0 || value <= 0) return floor;
  return clamp(Math.max(floor, (value / max) * 100));
}

function line(text: string, width = 52): string {
  const clipped = text.length > width ? text.slice(0, width) : text;
  return `| ${clipped.padEnd(width)} |`;
}

function seal(parts: Array<string | number | null | undefined>): string {
  let hash = 2166136261;
  for (const char of parts.map((part) => String(part ?? "")).join("//")) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, "0").slice(0, 8).toUpperCase();
}

function activeDays(profile: ProfileView): number {
  return profile.usageDays.filter((day) => day.ops > 0).length || (profile.latest ? 1 : 0);
}

function topProvider(profile: ProfileView): ProfileView["providers"][number] | undefined {
  return profile.providers.slice().sort((a, b) => b.usd - a.usd || b.ops - a.ops || a.provider.localeCompare(b.provider))[0];
}

function laneLines(lane: Pick<ProfileDatastreamLane, "id" | "route" | "status" | "impact" | "value" | "guardrail">): string[] {
  return [
    line(`${lane.id.toUpperCase()} // ${lane.route}`),
    line(`status ${lane.status} // ${lane.value}`),
    line(`impact ${lane.impact === "not_usage" ? "NOT USAGE" : lane.impact.toUpperCase()}`),
    line(lane.guardrail),
  ];
}

export function buildProfileDatastreamReceipt(profile: ProfileView, receipt: VibeScoreReceipt): ProfileDatastreamReceipt {
  const latest = profile.latest;
  const top = topProvider(profile);
  const topBrand = top ? providerBrand(top.provider) : providerBrand("c0vibe");
  const c0 = providerBrand("c0vibe");
  const scoreBrand = providerBrand("openai");
  const trustBrand = providerBrand("github");
  const days = activeDays(profile);
  const records = latest?.record_count ?? 0;
  const providers = profile.providers.length;
  const dailyRows = profile.usageDays.length;
  const trustSignals = profile.trustSignals.length;
  const streamSeal = seal([
    profile.handle,
    latest?.created_at,
    latest?.tier,
    records,
    latest?.total_usd,
    providers,
    dailyRows,
    trustSignals,
    receipt.score,
  ]);

  const laneTemplates: Array<Omit<ProfileDatastreamLane, "terminalLines">> = [
    {
      id: "upload",
      label: "Reviewed upload",
      value: latest ? `${int(records)} ops` : "waiting",
      route: "local ledger -> ingest",
      impact: "usage",
      status: latest ? "accepted aggregate" : "empty",
      meter: latest ? meter(records, Math.max(records, 1_000), 18) : 8,
      mark: "VT",
      from: "#2ee8d6",
      to: "#36e39b",
      ink: "#071013",
      note: latest ? `${money(latest.total_usd)} estimated spend from accepted usage rows.` : "No reviewed aggregate has been published yet.",
      guardrail: "No prompts, outputs, or secrets are shown on the public profile.",
    },
    {
      id: "providers",
      label: "Provider fanout",
      value: `${int(providers)} source${providers === 1 ? "" : "s"}`,
      route: "provider rows -> mix",
      impact: "usage",
      status: top?.provider ?? "empty",
      meter: latest ? meter(providers, Math.max(providers, 6), 18) : 8,
      mark: topBrand.mark,
      from: topBrand.from,
      to: topBrand.to,
      ink: topBrand.ink,
      note: top ? `${top.provider} leads this profile with ${int(top.ops)} ops and ${money(top.usd)}.` : "Provider rows appear after a reviewed upload.",
      guardrail: "Provider mix is aggregate-only and cannot reveal individual requests.",
    },
    {
      id: "daily",
      label: "Daily rhythm",
      value: `${int(days)} active day${days === 1 ? "" : "s"}`,
      route: "daily aggregate -> heatgrid",
      impact: "usage",
      status: dailyRows ? `${int(dailyRows)} daily rows` : latest ? "upload-day fallback" : "empty",
      meter: latest ? meter(days, Math.max(days, 14), 18) : 8,
      mark: "GH",
      from: "#0e4429",
      to: "#39d353",
      ink: "#f0fff4",
      note: dailyRows ? "The public heatgrid reads daily aggregate rows." : "Fallback uses upload-day rhythm until daily rows exist.",
      guardrail: "Heatgrid cells are aggregate totals, not raw event history.",
    },
    {
      id: "score",
      label: "Score receipt",
      value: `${receipt.score}/100`,
      route: "usage factors -> score",
      impact: "score",
      status: receipt.tier,
      meter: receipt.score,
      mark: scoreBrand.mark,
      from: scoreBrand.from,
      to: scoreBrand.to,
      ink: scoreBrand.ink,
      note: "The Vibe Score is derived from usage mass, rhythm, provider breadth, freshness, and labelled trust context.",
      guardrail: "Offline profiles stay at zero instead of inventing activity.",
    },
    {
      id: "trust",
      label: "Trust side rail",
      value: `${int(trustSignals)} signal${trustSignals === 1 ? "" : "s"}`,
      route: "trust evidence -> side rail",
      impact: "not_usage",
      status: trustSignals ? "context only" : "empty",
      meter: trustSignals ? Math.min(100, 24 + trustSignals * 16) : 8,
      mark: trustBrand.mark,
      from: "#ffc64d",
      to: "#ff4fd8",
      ink: "#071013",
      note: "NOT USAGE. GitHub and creator evidence can explain context without becoming spend.",
      guardrail: "Trust cannot change spend, credits, operations, rank, or verified status.",
    },
    {
      id: "publish",
      label: "C0VIBE publish",
      value: latest ? "live" : "draft",
      route: "review -> c0vibe.app",
      impact: "publish",
      status: latest?.tier ?? "not synced",
      meter: latest ? 100 : 12,
      mark: c0.mark,
      from: c0.from,
      to: c0.to,
      ink: c0.ink,
      note: "The public profile lights up only after local review and upload.",
      guardrail: "Publishing is a reviewed aggregate step; local-only data stays local until approved.",
    },
  ];
  const lanes = laneTemplates.map<ProfileDatastreamLane>((lane) => ({
    ...lane,
    terminalLines: laneLines(lane),
  }));

  return {
    headline: latest ? `@${profile.handle} datastream lineage` : `@${profile.handle} datastream waiting`,
    subline: "A source-to-score receipt that shows exactly which reviewed aggregates feed the public profile, score, heatgrid, and trust side rail.",
    terminalLines: [
      "+------------------------------------------------------+",
      line(`VTK://PROFILE-DATASTREAM//@${profile.handle}//C0VIBE`),
      line(`seal ${streamSeal} // score ${String(receipt.score).padStart(3, "0")}/100`),
      line(`records ${int(records)} // providers ${int(providers)} // days ${int(days)}`),
      line(`trust ${int(trustSignals)} NOT USAGE // publish ${latest ? "live" : "draft"}`),
      line("profile, heatgrid, and score share this stream"),
      line("Vibers Unite // no prompts, outputs, or secrets"),
      "+------------------------------------------------------+",
    ],
    seal: streamSeal,
    totals: {
      records,
      providers,
      activeDays: days,
      trustSignals,
      score: receipt.score,
    },
    lanes,
    guardrails: [
      "Usage lanes come from accepted aggregate records only.",
      "Daily heatgrid rows are aggregate rhythm data, not raw event history.",
      "Trust signals are labelled NOT USAGE and cannot alter spend, credits, ops, rank, or verified status.",
      "The public profile never renders prompts, outputs, API keys, or secret values.",
    ],
  };
}
