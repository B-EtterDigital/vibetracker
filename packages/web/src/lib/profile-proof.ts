import type { ProfileView } from "./data";
import { providerBrand } from "./provider-brand.ts";

export interface ProfileProofCell {
  id: "usage" | "providers" | "trust" | "publish";
  label: string;
  value: string;
  note: string;
  tone: string;
}

export type ProfileBlackBoxImpact = "usage" | "score" | "not_usage" | "local_only" | "publish";
export type ProfileBlackBoxEventId = "capture" | "provider" | "heatgrid" | "score" | "trust" | "review" | "publish";

export interface ProfileBlackBoxEvent {
  id: ProfileBlackBoxEventId;
  label: string;
  value: string;
  route: string;
  impact: ProfileBlackBoxImpact;
  status: string;
  mark: string;
  from: string;
  to: string;
  ink: string;
  meter: number;
  note: string;
  guardrail: string;
  terminalLine: string;
}

export interface ProfileBlackBoxReplay {
  headline: string;
  subline: string;
  seal: string;
  terminalLines: string[];
  events: ProfileBlackBoxEvent[];
  guardrails: string[];
}

function int(n: number | null | undefined): string {
  return n == null ? "0" : Number(n).toLocaleString("en-US");
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function meter(value: number, max: number, floor = 8): number {
  if (max <= 0 || value <= 0) return floor;
  return clamp(Math.max(floor, (value / max) * 100));
}

function topProvider(profile: ProfileView): ProfileView["providers"][number] | undefined {
  return profile.providers.slice().sort((a, b) => b.usd - a.usd || b.ops - a.ops || a.provider.localeCompare(b.provider))[0];
}

function activeDays(profile: ProfileView): number {
  return profile.usageDays.filter((day) => day.ops > 0).length || (profile.latest ? 1 : 0);
}

function seal(parts: Array<string | number | null | undefined>): string {
  let hash = 2166136261;
  for (const char of parts.map((part) => String(part ?? "")).join("//")) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, "0").slice(0, 8).toUpperCase();
}

function rule(width = 58): string {
  return `+${"-".repeat(width + 2)}+`;
}

function line(text: string, width = 58): string {
  const clipped = text.length > width ? text.slice(0, width) : text;
  return `| ${clipped.padEnd(width)} |`;
}

function tierLabel(tier: string | null | undefined): string {
  return (tier ?? "not_synced").replace(/_/g, " ").toUpperCase();
}

export function buildProfileProofSpine(profile: ProfileView): ProfileProofCell[] {
  const latest = profile.latest;
  const topProvider = profile.providers.slice().sort((a, b) => b.usd - a.usd)[0];
  return [
    {
      id: "usage",
      label: "Usage counted",
      value: latest ? int(latest.record_count) : "0",
      note: latest ? "Latest uploaded usage bundle feeds spend, credits, and operations." : "No usage upload yet.",
      tone: "usage",
    },
    {
      id: "providers",
      label: "Provider spread",
      value: int(profile.providers.length),
      note: topProvider ? `Top source: ${topProvider.provider}.` : "No provider breakdown yet.",
      tone: "providers",
    },
    {
      id: "trust",
      label: "Trust lane",
      value: int(profile.trustSignals.length),
      note: "NOT USAGE. Public activity context never changes rank or spend.",
      tone: "trust",
    },
    {
      id: "publish",
      label: "C0VIBE relay",
      value: tierLabel(latest?.tier),
      note: "Vibers Unite at c0vibe.app. Review locally before sharing.",
      tone: "publish",
    },
  ];
}

export function buildProfileBlackBoxReplay(profile: ProfileView): ProfileBlackBoxReplay {
  const latest = profile.latest;
  const records = latest?.record_count ?? 0;
  const providers = profile.providers.length;
  const days = activeDays(profile);
  const trustSignals = profile.trustSignals.length;
  const top = topProvider(profile);
  const c0 = providerBrand("c0vibe");
  const topBrand = providerBrand(top?.provider ?? "c0vibe");
  const scoreBrand = providerBrand("openai");
  const github = providerBrand("github");
  const review = providerBrand("higgsfield");
  const streamSeal = seal([
    profile.handle,
    latest?.created_at,
    latest?.tier,
    records,
    providers,
    days,
    trustSignals,
  ]);

  return {
    headline: latest ? `@${profile.handle} public black box replay` : `@${profile.handle} public black box waiting`,
    subline: "A public replay recorder for the profile, heatgrid, score, trust side rail, and C0VIBE relay. It shows the aggregate stream while proving what never leaves the machine.",
    seal: streamSeal,
    terminalLines: [
      rule(),
      line(`VTK://PUBLIC-BLACK-BOX//@${profile.handle}//C0VIBE.APP`),
      line(`seal ${streamSeal} // ${latest ? "reviewed aggregate live" : "waiting for review"}`),
      line(`records ${int(records)} // providers ${int(providers)} // active days ${int(days)}`),
      line(`trust ${int(trustSignals)} NOT USAGE // rank impact 0`),
      line("prompts 0 // outputs 0 // secrets 0 // raw files 0"),
      line("profile, heatgrid, score, and C0VIBE relay share stream"),
      line("Vibers Unite // public replay is aggregate-only"),
      rule(),
    ],
    events: [
      {
        id: "capture",
        label: "Aggregate capture",
        value: latest ? `${int(records)} ops` : "waiting",
        route: "local ledger -> reviewed upload",
        impact: "usage",
        status: latest ? "usage counted" : "empty",
        mark: c0.mark,
        from: c0.from,
        to: c0.to,
        ink: c0.ink,
        meter: latest ? meter(records, Math.max(records, 1_000), 18) : 8,
        note: latest ? "Feeds profile totals, score mass, and public spend estimate." : "No reviewed aggregate has been published yet.",
        guardrail: "Only aggregate rows are replayed publicly.",
        terminalLine: `usage.records=${records}; prompts=0; outputs=0`,
      },
      {
        id: "provider",
        label: "Provider mix",
        value: `${int(providers)} source${providers === 1 ? "" : "s"}`,
        route: "provider totals -> mix",
        impact: "usage",
        status: top?.provider ?? "empty",
        mark: topBrand.mark,
        from: topBrand.from,
        to: topBrand.to,
        ink: topBrand.ink,
        meter: latest ? meter(providers, Math.max(providers, 6), 18) : 8,
        note: top ? `${top.provider} leads this profile with ${int(top.ops)} public ops.` : "Provider rows appear after a reviewed upload.",
        guardrail: "Provider mix cannot expose individual requests.",
        terminalLine: `providers.count=${providers}; top=${top?.provider ?? "none"}`,
      },
      {
        id: "heatgrid",
        label: "Heatgrid rhythm",
        value: `${int(days)} day${days === 1 ? "" : "s"}`,
        route: "daily aggregates -> heatgrid",
        impact: "usage",
        status: profile.usageDays.length ? "daily rows" : latest ? "upload-day fallback" : "empty",
        mark: "GH",
        from: "#0e4429",
        to: "#39d353",
        ink: "#f0fff4",
        meter: latest ? meter(days, Math.max(days, 14), 18) : 8,
        note: "Uses the official GitHub heat palette for daily aggregate rhythm.",
        guardrail: "Heatgrid cells are totals only, never raw event history.",
        terminalLine: `heatgrid.days=${days}; cells=aggregate-only`,
      },
      {
        id: "score",
        label: "Score feed",
        value: latest ? "linked" : "waiting",
        route: "accepted usage -> score receipt",
        impact: "score",
        status: latest ? "score input ready" : "offline",
        mark: scoreBrand.mark,
        from: scoreBrand.from,
        to: scoreBrand.to,
        ink: scoreBrand.ink,
        meter: latest ? clamp(34 + Math.min(46, records / 25) + Math.min(20, providers * 5)) : 8,
        note: "The Vibe Score reads the same aggregate stream that powers the profile.",
        guardrail: "Offline profiles stay quiet instead of inventing momentum.",
        terminalLine: `score.feed=${latest ? "aggregate-linked" : "waiting"}; fake=0`,
      },
      {
        id: "trust",
        label: "Trust side rail",
        value: `${int(trustSignals)} signal${trustSignals === 1 ? "" : "s"}`,
        route: "GitHub/creator context -> trust rail",
        impact: "not_usage",
        status: trustSignals ? "context only" : "empty",
        mark: github.mark,
        from: "#ffc64d",
        to: "#ff4fd8",
        ink: "#071013",
        meter: trustSignals ? clamp(24 + trustSignals * 16) : 8,
        note: "Separate trust signals explain public activity without becoming spend.",
        guardrail: "Cannot change spend, credits, operations, rank, or verified status.",
        terminalLine: `trust.signals=${trustSignals}; usage=false; rank_delta=0`,
      },
      {
        id: "review",
        label: "Local review gate",
        value: "required",
        route: "scanner -> review screen",
        impact: "local_only",
        status: latest ? "approved" : "pending",
        mark: review.mark,
        from: review.from,
        to: review.to,
        ink: review.ink,
        meter: latest ? 100 : 18,
        note: "The user reviews the aggregate before anything becomes public.",
        guardrail: "Nothing leaves the machine until the reviewed aggregate is approved.",
        terminalLine: "local.review=true; secrets.redacted=true",
      },
      {
        id: "publish",
        label: "C0VIBE relay",
        value: latest ? "live" : "draft",
        route: "approved aggregate -> c0vibe.app",
        impact: "publish",
        status: tierLabel(latest?.tier),
        mark: c0.mark,
        from: c0.from,
        to: c0.to,
        ink: c0.ink,
        meter: latest ? 100 : 12,
        note: "C0VIBE receives reviewed aggregate data after the user approves it.",
        guardrail: "Local-only values never render on the public profile.",
        terminalLine: `publish.state=${latest ? "live" : "draft"}; c0vibe=true`,
      },
    ],
    guardrails: [
      "USAGE: accepted aggregate rows can feed totals, score, provider mix, heatgrid, and spend estimates.",
      "NOT USAGE: GitHub and creator context is labelled separately and cannot change rank, spend, credits, or operations.",
      "LOCAL ONLY: prompts, outputs, secrets, pasted keys, and raw files stay off the public replay.",
      "PUBLISH: c0vibe.app receives only the reviewed aggregate stream after local approval.",
    ],
  };
}
