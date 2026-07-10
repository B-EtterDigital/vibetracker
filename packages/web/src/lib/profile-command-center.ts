import type { ProfileView } from "./data.ts";
import { providerBrand } from "./provider-brand.ts";
import { buildVibeScoreReceipt } from "./vibe-score.ts";

export type ProfileCommandTone = "score" | "usage" | "provider" | "rhythm" | "trust" | "publish";
export type ProfileCommandImpact = "score" | "usage" | "not_usage" | "publish";

export interface ProfileCommandRing {
  id: "score" | "usage" | "source" | "rhythm" | "trust" | "relay";
  label: string;
  value: string;
  note: string;
  tone: ProfileCommandTone;
  impact: ProfileCommandImpact;
  meter: number;
  mark: string;
  from: string;
  to: string;
  ink: string;
}

export interface ProfileCommandSource {
  id: string;
  label: string;
  value: string;
  note: string;
  mark: string;
  from: string;
  to: string;
  ink: string;
  meter: number;
}

export interface ProfileCommandStreamStage {
  id: "upload" | "usage" | "score" | "trust" | "relay";
  label: string;
  value: string;
  note: string;
  impact: ProfileCommandImpact;
  meter: number;
  mark: string;
  from: string;
  to: string;
  ink: string;
}

export interface ProfileCommandWavePoint {
  id: string;
  label: string;
  value: string;
  detail: string;
  impact: ProfileCommandImpact;
  meter: number;
  mark: string;
  from: string;
  to: string;
  ink: string;
}

export interface ProfileCommandRelayTick {
  id: "receipt" | "usage" | "trust" | "publish";
  label: string;
  command: string;
  status: string;
  note: string;
  impact: ProfileCommandImpact;
  meter: number;
  mark: string;
  from: string;
  to: string;
  ink: string;
}

export interface ProfileCommandCenter {
  headline: string;
  subline: string;
  callsign: string;
  terminalLines: string[];
  heroScope: ProfileCommandRelayTick[];
  rings: ProfileCommandRing[];
  sources: ProfileCommandSource[];
  streamSpine: ProfileCommandStreamStage[];
  waveform: ProfileCommandWavePoint[];
  relayTicks: ProfileCommandRelayTick[];
  shareLine: string;
}

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

function callsignFor(handle: string): string {
  const clean = handle.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return clean ? clean.slice(0, 4).padEnd(4, "X") : "VIBE";
}

function topSources(profile: ProfileView): ProfileCommandSource[] {
  const totalUsd = profile.latest?.total_usd ?? 0;
  const totalOps = profile.latest?.record_count ?? 0;
  return profile.providers
    .slice()
    .sort((a, b) => b.usd - a.usd || b.ops - a.ops || a.provider.localeCompare(b.provider))
    .slice(0, 4)
    .map((provider) => {
      const brand = providerBrand(provider.provider);
      const base = totalUsd > 0 ? (provider.usd / totalUsd) * 100 : totalOps > 0 ? (provider.ops / totalOps) * 100 : 0;
      return {
        id: provider.provider,
        label: provider.provider,
        value: provider.usd > 0 ? usd(provider.usd) : `${int(provider.ops)} ops`,
        note: `${int(provider.ops)} ops / ${int(provider.credits)} credits`,
        mark: brand.mark,
        from: brand.from,
        to: brand.to,
        ink: brand.ink,
        meter: clamp(base, provider.ops > 0 ? 12 : 0),
      };
    });
}

function buildWaveform(profile: ProfileView, sources: ProfileCommandSource[], trustCount: number): ProfileCommandWavePoint[] {
  const c0vibe = providerBrand("c0vibe");
  const usageDays = profile.usageDays.slice(-6);
  const maxOps = Math.max(1, ...usageDays.map((day) => day.ops));
  const usagePoints: ProfileCommandWavePoint[] = usageDays.length
    ? usageDays.map((day, index) => {
      const source = sources[index % Math.max(sources.length, 1)];
      const brand = providerBrand(source?.id ?? "c0vibe");
      return {
        id: `usage-${day.date}`,
        label: day.date.slice(5),
        value: `${int(day.ops)} ops`,
        detail: `${usd(day.usd)} / ${int(day.credits)} credits`,
        impact: "usage",
        meter: clamp((day.ops / maxOps) * 100, day.ops > 0 ? 12 : 4),
        mark: source?.mark ?? brand.mark,
        from: brand.from,
        to: brand.to,
        ink: brand.ink,
      };
    })
    : [{
      id: "usage-waiting",
      label: "waiting",
      value: profile.latest ? `${int(profile.latest.record_count)} ops` : "0 ops",
      detail: profile.latest ? "upload-day aggregate" : "run local wizard",
      impact: "usage",
      meter: profile.latest ? 58 : 6,
      mark: "US",
      from: "#ff4fd8",
      to: "#ffc64d",
      ink: "#140812",
    }];

  return [
    ...usagePoints,
    {
      id: "trust-side-rail",
      label: "trust",
      value: `${int(trustCount)} signal${trustCount === 1 ? "" : "s"}`,
      detail: "NOT USAGE side rail",
      impact: "not_usage",
      meter: trustCount ? clamp(24 + trustCount * 16) : 8,
      mark: "NO",
      from: "#24292f",
      to: "#ffc64d",
      ink: "#ffffff",
    },
    {
      id: "relay-c0vibe",
      label: "relay",
      value: profile.latest ? "live" : "waiting",
      detail: "Vibers Unite // c0vibe.app",
      impact: "publish",
      meter: profile.latest ? 92 : 18,
      mark: c0vibe.mark,
      from: c0vibe.from,
      to: c0vibe.to,
      ink: c0vibe.ink,
    },
  ];
}

function buildRelayTicks(
  profile: ProfileView,
  receipt: ReturnType<typeof buildVibeScoreReceipt>,
  callsign: string,
  trustCount: number,
  totalOps: number,
  totalUsd: number
): ProfileCommandRelayTick[] {
  const latest = profile.latest;
  const c0vibe = providerBrand("c0vibe");

  return [
    {
      id: "receipt",
      label: "Score receipt",
      command: "receipt:score()",
      status: `${receipt.score}/100`,
      note: latest ? receipt.tier : "waiting for upload",
      impact: "score",
      meter: receipt.score,
      mark: callsign.slice(0, 2),
      from: "#2ee8d6",
      to: "#36e39b",
      ink: "#071013",
    },
    {
      id: "usage",
      label: "Usage packet",
      command: "usage:aggregate()",
      status: latest ? `${int(totalOps)} ops` : "0 ops",
      note: latest ? `${usd(totalUsd)} public estimate` : "no usage bundle yet",
      impact: "usage",
      meter: latest ? clamp(32 + Math.log10(Math.max(1, totalOps)) * 18) : 6,
      mark: "US",
      from: "#ff4fd8",
      to: "#ffc64d",
      ink: "#140812",
    },
    {
      id: "trust",
      label: "Side rail",
      command: "trust:label_only()",
      status: "NOT USAGE",
      note: `${int(trustCount)} context signal${trustCount === 1 ? "" : "s"}, never spend`,
      impact: "not_usage",
      meter: trustCount ? clamp(24 + trustCount * 16) : 8,
      mark: "NO",
      from: "#24292f",
      to: "#ffc64d",
      ink: "#ffffff",
    },
    {
      id: "publish",
      label: "C0VIBE relay",
      command: "relay:publish()",
      status: latest ? "c0vibe.app" : "waiting",
      note: latest ? "Vibers Unite after review" : "reviewed aggregate required",
      impact: "publish",
      meter: latest ? 96 : 18,
      mark: c0vibe.mark,
      from: c0vibe.from,
      to: c0vibe.to,
      ink: c0vibe.ink,
    },
  ];
}

export function buildProfileCommandCenter(profile: ProfileView): ProfileCommandCenter {
  const receipt = buildVibeScoreReceipt(profile);
  const latest = profile.latest;
  const sources = topSources(profile);
  const primarySource = sources[0];
  const sourceBrand = primarySource ? providerBrand(primarySource.id) : providerBrand("c0vibe");
  const c0vibe = providerBrand("c0vibe");
  const activeDays = profile.usageDays.filter((day) => day.ops > 0 || day.usd > 0).length || (latest ? 1 : 0);
  const trustCount = profile.trustSignals.length;
  const tier = latest?.tier ?? "not_synced";
  const callsign = callsignFor(profile.handle);
  const totalOps = latest?.record_count ?? 0;
  const totalUsd = latest?.total_usd ?? 0;
  const providerCount = profile.providers.length;
  const usageFactor = receipt.factors.find((factor) => factor.id === "usage");
  const rhythmFactor = receipt.factors.find((factor) => factor.id === "rhythm");
  const waveform = buildWaveform(profile, sources, trustCount);
  const relayTicks = buildRelayTicks(profile, receipt, callsign, trustCount, totalOps, totalUsd);

  const rings: ProfileCommandRing[] = [
    {
      id: "score",
      label: "Vibe Score",
      value: `${receipt.score}/100`,
      note: receipt.tier,
      tone: "score",
      impact: "score",
      meter: receipt.score,
      mark: callsign.slice(0, 2),
      from: "#2ee8d6",
      to: "#36e39b",
      ink: "#071013",
    },
    {
      id: "usage",
      label: "Usage mass",
      value: int(totalOps),
      note: `${usd(totalUsd)} estimated spend`,
      tone: "usage",
      impact: "usage",
      meter: usageFactor?.points
        ? clamp((usageFactor.points / 40) * 100)
        : 0,
      mark: "US",
      from: "#ff4fd8",
      to: "#ffc64d",
      ink: "#140812",
    },
    {
      id: "source",
      label: "Top source",
      value: primarySource ? primarySource.label : "waiting",
      note: providerCount ? `${int(providerCount)} provider${providerCount === 1 ? "" : "s"}` : "no provider rows yet",
      tone: "provider",
      impact: "usage",
      meter: primarySource?.meter ?? 0,
      mark: sourceBrand.mark,
      from: sourceBrand.from,
      to: sourceBrand.to,
      ink: sourceBrand.ink,
    },
    {
      id: "rhythm",
      label: "Usage rhythm",
      value: `${int(activeDays)}d`,
      note: profile.usageDays.length ? "daily aggregate rows" : "upload-day fallback",
      tone: "rhythm",
      impact: "usage",
      meter: rhythmFactor?.points
        ? clamp((rhythmFactor.points / 22) * 100)
        : 0,
      mark: "RY",
      from: "#7c9cff",
      to: "#2ee8d6",
      ink: "#ffffff",
    },
    {
      id: "trust",
      label: "Trust rail",
      value: int(trustCount),
      note: "NOT USAGE. Context only.",
      tone: "trust",
      impact: "not_usage",
      meter: trustCount ? clamp(24 + trustCount * 16) : 8,
      mark: "NO",
      from: "#24292f",
      to: "#ffc64d",
      ink: "#ffffff",
    },
    {
      id: "relay",
      label: "C0VIBE relay",
      value: tier.replace(/_/g, " "),
      note: "reviewed aggregate profile",
      tone: "publish",
      impact: "publish",
      meter: latest ? 92 : 18,
      mark: c0vibe.mark,
      from: c0vibe.from,
      to: c0vibe.to,
      ink: c0vibe.ink,
    },
  ];
  const streamSpine: ProfileCommandStreamStage[] = [
    {
      id: "upload",
      label: "Reviewed upload",
      value: latest ? tier.replace(/_/g, " ") : "waiting",
      note: latest ? "aggregate bundle accepted" : "local wizard has not published",
      impact: "publish",
      meter: latest ? 82 : 12,
      mark: "UP",
      from: c0vibe.from,
      to: c0vibe.to,
      ink: c0vibe.ink,
    },
    {
      id: "usage",
      label: "Usage records",
      value: int(totalOps),
      note: providerCount ? `${int(providerCount)} provider${providerCount === 1 ? "" : "s"} feed profile math` : "no provider rows yet",
      impact: "usage",
      meter: usageFactor?.points ? clamp((usageFactor.points / 40) * 100) : 0,
      mark: "US",
      from: "#ff4fd8",
      to: "#ffc64d",
      ink: "#140812",
    },
    {
      id: "score",
      label: "Vibe Score",
      value: `${receipt.score}/100`,
      note: "computed from usage datastream factors",
      impact: "score",
      meter: receipt.score,
      mark: callsign.slice(0, 2),
      from: "#2ee8d6",
      to: "#36e39b",
      ink: "#071013",
    },
    {
      id: "trust",
      label: "Trust side rail",
      value: int(trustCount),
      note: "NOT USAGE. Never alters spend or score.",
      impact: "not_usage",
      meter: trustCount ? clamp(24 + trustCount * 16) : 8,
      mark: "NO",
      from: "#24292f",
      to: "#ffc64d",
      ink: "#ffffff",
    },
    {
      id: "relay",
      label: "Public relay",
      value: "c0vibe.app",
      note: latest ? "profile ready for Vibers Unite" : "relay waits for reviewed usage",
      impact: "publish",
      meter: latest ? 92 : 18,
      mark: c0vibe.mark,
      from: c0vibe.from,
      to: c0vibe.to,
      ink: c0vibe.ink,
    },
  ];

  return {
    headline: latest ? `@${profile.handle} command center` : `@${profile.handle} waiting for first upload`,
    subline: latest
      ? `${receipt.headline}. Top source ${primarySource?.label ?? "unknown"} feeds the public profile without mixing trust signals into spend.`
      : "The public command center lights up after the local wizard uploads reviewed aggregates.",
    callsign,
    terminalLines: [
      "+------------------------------------------------------+",
      `| VTK://PROFILE-COMMAND//${fit(callsign, 8)}//C0VIBE.APP          |`,
      "|------------------------------------------------------|",
      `| score ${fit(`${receipt.score}/100 ${receipt.tier}`, 46)} |`,
      `| usage ${fit(`${int(totalOps)} ops / ${usd(totalUsd)}`, 46)} |`,
      `| stream ${fit(`${int(totalOps)} records -> score -> c0vibe.app`, 45)} |`,
      `| pulse ${fit(`${waveform.length} beats / ${int(trustCount)} trust`, 46)} |`,
      `| source ${fit(primarySource ? `${primarySource.label} / ${primarySource.value}` : "waiting", 45)} |`,
      `| trust ${fit(`${int(trustCount)} NOT USAGE`, 46)} |`,
      `| relay tape ${fit(relayTicks.map((tick) => tick.status).join(" / "), 41)} |`,
      `| relay ${fit(`${tier.replace(/_/g, " ")} // Vibers Unite`, 46)} |`,
      "+------------------------------------------------------+",
    ],
    heroScope: relayTicks,
    rings,
    sources,
    streamSpine,
    waveform,
    relayTicks,
    shareLine: latest
      ? `@${profile.handle} // ${receipt.score}/100 // ${int(totalOps)} ops // Vibers Unite`
      : `@${profile.handle} // waiting for reviewed usage // Vibers Unite`,
  };
}
