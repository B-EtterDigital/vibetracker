import { notFound } from "next/navigation";
import { cache, type CSSProperties, type ReactNode } from "react";
import { getProfile } from "../../../lib/data";
import { buildDemoProfile, DEMO_HANDLE } from "../../../lib/demo-profile";
import { formatInt, formatUsd, type Tier } from "../../../lib/leaderboard";
import { providerBrand } from "../../../lib/provider-brand";
import { readComplexity } from "../../../lib/profile-complexity";
import { trustSignalMark, trustSignalMetric, trustSignalTitle, trustSignalWindow } from "../../../lib/profile-trust";
import { PROVIDERS } from "../../../../../adapters/src/index";
import { vibeCategoryFor, vibeColor, vibeLabel } from "../../../../../core/src/vibe-categories";
import {
  CategoryMix,
  DemoBanner,
  LockedPanels,
  MixRow,
  SignalProgress,
  StatCards,
  TrustRow,
  UsagePanel,
  type KeyValueRow,
  type MixBar,
} from "./panels";
import { ProfileHero, type HeroDiscipline } from "./profile-hero";
import { C0vibeBand } from "./profile-cta";
import { SyncRhythm, GitHubContributions } from "./profile-heatmap";
import { UsageTelemetry } from "./profile-telemetry";
import "./profile.css";
import "./profile-hero.css";
import "./profile-heatmap.css";
import "./profile-telemetry.css";

// The two C0VIBE doors on every profile: a free account, and the device-auth flow that
// migrates a CLI-uploaded (self-reported) board onto that account as attested.
const C0VIBE_JOIN_HREF = "https://c0vibe.app";
const C0VIBE_MIGRATE_HREF = "/cli-login";

export const revalidate = 60;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Distinguishable colours for the stacked / 3D "all together" chart series (user-specified):
// Codex blue, Claude orange, Suno a second distinct orange, OpenClaw red, fal.ai a second distinct
// red, Higgsfield yellow. Sources not listed here fall back to their brand colour.
const CHART_SERIES_COLOR: Record<string, string> = {
  codex: "#3b82f6",          // blue
  "claude-code": "#ea7317",  // orange
  suno: "#ff9e64",           // lighter, distinct orange
  falai: "#d1345b",          // red, distinct from OpenClaw
  openclaw: "#ef4444",       // red
  higgsfield: "#f5d020",     // yellow
};

// One profile fetch per request, shared by generateMetadata and the page.
// The bundled demo profile renders the full dashboard without touching the DB.
const loadProfile = cache(async (handle: string) => {
  if (handle === DEMO_HANDLE) return buildDemoProfile();
  const profile = await getProfile(handle);
  return profile;
});

function fmtDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return "unknown";
  return `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}`;
}

function shareLabel(usd: number, total: number): string {
  if (total <= 0 || usd <= 0) return "0";
  const share = (usd / total) * 100;
  return share < 1 ? "<1" : String(Math.round(share));
}

function providerLabel(id: string): string {
  return PROVIDERS.find((d) => d.id === id)?.label ?? id;
}

// Model ids carry a build date suffix (claude-haiku-4-5-20251001); the rail wants the model.
function prettyModel(model: string): string {
  return model.replace(/-\d{8}$/, "");
}

function primaryCategory(id: string): string {
  return PROVIDERS.find((d) => d.id === id)?.categories[0] ?? "other";
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  if (handle === DEMO_HANDLE) {
    return {
      title: "demo — sample profile · VibeUsage",
      description: "Bundled sample profile showing a fully unlocked board. Not real tracked usage: run npx vibetrack init to build your own.",
    };
  }
  const profile = await loadProfile(handle);
  if (!profile) return {};
  const read = readComplexity(profile, PROVIDERS);
  return {
    title: `${profile.handle} — ${read.identity.label} · VibeUsage`,
    description: `${read.identity.label}, ${read.tier} signal. ${read.facts.providers} sources across ${read.facts.categories} categories on VibeUsage.`,
  };
}

export default async function Profile({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const isDemo = handle === DEMO_HANDLE;
  const profile = await loadProfile(handle);
  if (!profile) notFound();

  const read = readComplexity(profile, PROVIDERS);
  const { facts, reveal } = read;
  const tierRaw = profile.latest?.tier ?? "self_reported";
  const tier = (tierRaw === "verified" ? "verified" : "self_reported") as Tier;
  const byUsd = profile.providers.slice().sort((a, b) => b.usd - a.usd);

  const brands = byUsd.slice(0, 6).map((p) => {
    const brand = providerBrand(p.provider);
    return { id: p.provider, label: providerLabel(p.provider), mark: brand.mark, from: brand.from, to: brand.to, ink: brand.ink, logo: brand.logo };
  });

  // Per-provider daily series for the interactive chart. Ranked by ops (activity), not spend, so
  // the media powerhouse (Higgsfield, high ops / ~$0 spend) surfaces alongside the coding sources;
  // brand-coloured so each reads as its own curve when clicked into the big chart or stacked.
  const providerDaysById = new Map<string, Array<{ date: string; ops: number; credits: number; usd: number }>>();
  for (const row of profile.providerDays) {
    const list = providerDaysById.get(row.provider) ?? [];
    list.push({ date: row.date, ops: row.ops, credits: row.credits, usd: row.usd });
    providerDaysById.set(row.provider, list);
  }
  // Distinguishable series colours for the stacked / 3D "all together" view. Two oranges (Claude,
  // Suno) and two reds (OpenClaw, fal.ai) are kept clearly apart; unspecified sources fall back to
  // their brand colour.
  // Per-provider model breakdown for the "click a source, see its models" list, ops-ranked.
  const providerModelsById = new Map<string, Array<{ model: string; ops: number; usd: number }>>();
  for (const m of profile.providerModels) {
    const list = providerModelsById.get(m.provider) ?? [];
    list.push({ model: m.model, ops: m.ops, usd: m.usd });
    providerModelsById.set(m.provider, list);
  }
  for (const list of providerModelsById.values()) list.sort((a, b) => b.usd - a.usd || b.ops - a.ops);

  const chartSeries = profile.providers
    .slice()
    .sort((a, b) => b.ops - a.ops)
    .filter((p) => providerDaysById.has(p.provider))
    .slice(0, 7)
    .map((p) => ({
      id: p.provider,
      label: providerLabel(p.provider),
      color: CHART_SERIES_COLOR[p.provider] ?? providerBrand(p.provider).from,
      days: providerDaysById.get(p.provider) ?? [],
      models: providerModelsById.get(p.provider) ?? [],
    }));

  const creditsSum = profile.providers.reduce((sum, p) => sum + p.credits, 0);
  const cards = [
    {
      label: "total spent",
      mark: "spent" as const,
      value: formatUsd(facts.usd),
      sub: `avg ${formatUsd(facts.usd / Math.max(facts.days, 1))}/day`,
    },
    {
      label: "total credits",
      mark: "credits" as const,
      value: formatInt(profile.latest?.total_credits ?? creditsSum),
      sub: `${formatInt(facts.ops)} operations`,
    },
    {
      label: "days active",
      mark: "days" as const,
      value: String(facts.days),
      sub: `since ${fmtDate(profile.usageDays[0]?.date ?? profile.created_at)}`,
    },
    {
      label: "sources",
      mark: "sources" as const,
      value: String(facts.providers),
      sub: `${facts.categories} categories`,
    },
  ];

  const usdTotal = byUsd.reduce((sum, p) => sum + p.usd, 0);
  const toMixBar = (p: (typeof byUsd)[number]): MixBar => {
    const brand = providerBrand(p.provider);
    return {
      id: p.provider,
      label: providerLabel(p.provider),
      amount: `${formatUsd(p.usd)} · ${formatInt(p.credits)} cr · ${formatInt(p.ops)} ops`,
      share: usdTotal > 0 ? (p.usd / usdTotal) * 100 : 0,
      mark: brand.mark,
      from: brand.from,
      to: brand.to,
      ink: brand.ink,
      logo: brand.logo,
      tag: vibeCategoryFor(primaryCategory(p.provider)).short,
    };
  };
  const rest = byUsd.slice(8);
  const restUsd = rest.reduce((sum, p) => sum + p.usd, 0);
  const mix = {
    rows: byUsd.slice(0, 8).map(toMixBar),
    rest: rest.map(toMixBar),
    more: rest.length ? `+${rest.length} more · ${formatUsd(restUsd)}` : null,
  };

  const maxUsdDay = profile.usageDays.reduce(
    (best, day) => (best == null || day.usd > best.usd ? day : best),
    null as (typeof profile.usageDays)[number] | null,
  );
  const maxOpsDay = profile.usageDays.reduce(
    (best, day) => (best == null || day.ops > best.ops ? day : best),
    null as (typeof profile.usageDays)[number] | null,
  );
  const insights: KeyValueRow[] = [
    { label: "Most expensive day", value: maxUsdDay ? `${formatUsd(maxUsdDay.usd)} on ${fmtDate(maxUsdDay.date)}` : "—" },
    { label: "Average daily cost", value: formatUsd(facts.usd / Math.max(facts.days, 1)) },
    { label: "Busiest day", value: maxOpsDay ? `${formatInt(maxOpsDay.ops)} ops on ${fmtDate(maxOpsDay.date)}` : "—" },
    { label: "Days tracked", value: String(facts.days) },
    { label: "Last sync", value: profile.latest ? fmtDate(profile.latest.created_at) : "—" },
  ];

  // Specialization ranks by creation ACTIVITY (ops/generations), not spend, so a
  // creator's real work surfaces: a thousand image gens on a flat media subscription
  // would vanish under dollar-ranking, yet it is exactly what the viber makes. This
  // matches the ops-weighted identity read. usd rides along as context in the label.
  //
  // Categories come from each record's OWN category (profile.categories) so one provider
  // (Higgsfield) splits across AI Image / Video / 3D — a provider-primary rollup cannot.
  // Older submissions predate that aggregate: fall back to the provider-primary rollup so
  // their profiles still render.
  const categorySource = profile.categories.length > 0
    ? profile.categories.map((c) => ({ id: c.category, ops: c.ops, usd: c.usd }))
    : (() => {
        const ops = new Map<string, number>();
        const usd = new Map<string, number>();
        for (const p of profile.providers) {
          const category = primaryCategory(p.provider);
          ops.set(category, (ops.get(category) ?? 0) + p.ops);
          usd.set(category, (usd.get(category) ?? 0) + p.usd);
        }
        return [...ops.entries()].map(([id, o]) => ({ id, ops: o, usd: usd.get(id) ?? 0 }));
      })();
  const opsTotal = categorySource.reduce((sum, c) => sum + c.ops, 0);
  const categories = categorySource
    .filter((c) => c.ops > 0)
    .sort((a, b) => b.ops - a.ops)
    .map((c): MixBar => ({
      id: c.id,
      label: vibeLabel(c.id),
      amount: `${formatInt(c.ops)} ops · ${formatUsd(c.usd)} · ${shareLabel(c.ops, opsTotal)}%`,
      share: opsTotal > 0 ? (c.ops / opsTotal) * 100 : 0,
    }));

  const trustChips = profile.trustSignals.map((signal) => ({
    mark: trustSignalMark(signal),
    title: trustSignalTitle(signal),
    metric: trustSignalMetric(signal),
    window: trustSignalWindow(signal),
    note: signal.note,
  }));

  // Hero identity, C0LINK-style: the wash and sigil take the viber's OWN top-discipline
  // colour, every discipline gets a pill (an all-rounder is shown as the full set, never
  // collapsed), and the quick-state rail carries facts the stat cards don't: the headline
  // operation count, the busiest source, and the model they actually reach for.
  const heroAccent =
    read.identity.kind === "allrounder" ? "#2ee8d6"
      : read.identity.kind === "forming" ? "#ffc64d"
        : vibeColor(read.identity.topCategory);

  const disciplines: HeroDiscipline[] = categories.slice(0, 6).map((c) => ({
    id: c.id,
    label: c.label,
    color: vibeColor(c.id),
    share: c.share,
  }));

  const byOps = profile.providers.slice().sort((a, b) => b.ops - a.ops);
  const topModel = profile.providerModels.slice().sort((a, b) => b.ops - a.ops)[0];
  const heroState = [
    { label: "signal", value: read.tier },
    { label: "operations", value: formatInt(facts.ops) },
    { label: "top source", value: byOps[0] ? providerLabel(byOps[0].provider) : "—" },
    { label: "top model", value: topModel ? prettyModel(topModel.model) : "—" },
  ];

  const bio = `${formatInt(facts.ops)} operations across ${facts.providers} sources and ${facts.categories} disciplines. `
    + `${formatUsd(facts.usd)} tracked over ${facts.days} active days.`;

  const claimed = tierRaw !== "self_reported";

  const sections: ReactNode[] = [];
  if (isDemo) sections.push(<DemoBanner key="demo" />);
  sections.push(
    <ProfileHero
      handle={profile.handle}
      accent={heroAccent}
      eyebrow="viber profile"
      identity={read.identity.label}
      signalTier={read.tier}
      signalHint={read.hint}
      tierChip={tierRaw}
      bio={bio}
      since={fmtDate(profile.usageDays[0]?.date ?? profile.created_at)}
      disciplines={disciplines}
      state={heroState}
      brands={brands}
      joinHref={C0VIBE_JOIN_HREF}
      migrateHref={C0VIBE_MIGRATE_HREF}
      key="hero"
    />,
    <SignalProgress tier={read.tier} progress={read.progress} key="progress" />,
    <StatCards cards={cards} key="stats" />,
  );
  const revealed: ReactNode[] = [];
  if (reveal.chart) {
    revealed.push(
      <UsageTelemetry days={profile.usageDays} providers={chartSeries} key="telemetry" />,
      <UsagePanel days={profile.usageDays} providers={chartSeries} key="usage" />,
    );
  }
  const showProviderMix = reveal.providerMix && mix.rows.length > 0;
  if (showProviderMix || reveal.insights) {
    revealed.push(<MixRow mix={showProviderMix ? mix : null} insights={reveal.insights ? insights : null} key="mix" />);
  }
  if (reveal.categoryMix) revealed.push(<CategoryMix rows={categories} sub={read.identity.label} key="categories" />);
  if (reveal.rhythm) {
    revealed.push(
      <SyncRhythm days={profile.usageDays.map((d) => ({ date: d.date, ops: d.ops, usd: d.usd }))} key="rhythm" />,
    );
  }
  // The real GitHub contribution graph, whenever the viber's CLI captured it. Always shown when
  // present (not tier-gated) — it is the viber's own git, and it reads as activity evidence, kept
  // deliberately distinct from AI spend. Never affects spend, ops, credits, or the signal score.
  const githubSignal = profile.trustSignals.find(
    (s): s is Extract<typeof s, { kind: "github_activity" }> =>
      s.kind === "github_activity" && Array.isArray(s.days) && s.days.length > 0,
  );
  if (githubSignal) {
    revealed.push(
      <GitHubContributions
        handle={githubSignal.handle}
        total={githubSignal.totalContributions}
        days={githubSignal.days ?? []}
        key="github"
      />,
    );
  }
  if (reveal.trust) revealed.push(<TrustRow tier={tier} signals={trustChips} key="trust" />);
  const cta = (
    <C0vibeBand
      handle={profile.handle}
      claimed={claimed}
      joinHref={C0VIBE_JOIN_HREF}
      migrateHref={C0VIBE_MIGRATE_HREF}
      providerCount={PROVIDERS.length}
      key="cta"
    />
  );
  const locked: Array<{ name: string; unlock: string }> = [];
  if (!reveal.chart) locked.push({ name: "usage over time", unlock: "unlocks after a week of history" });
  if (!reveal.insights) locked.push({ name: "usage insights", unlock: "unlocks at spark" });
  if (!reveal.categoryMix) locked.push({ name: "specialization", unlock: "unlocks at current" });
  if (!reveal.rhythm) locked.push({ name: "sync rhythm", unlock: "unlocks at surge" });
  // Lower tiers lead with the CTA and a teaser of what deepens next; Surge/Supernova lead with data.
  const climbing = read.tier === "ember" || read.tier === "spark" || read.tier === "current";
  if (climbing && locked.length) {
    sections.push(cta, ...revealed, <LockedPanels note="more panels unlock as your data deepens" items={locked} key="locked" />);
  } else {
    sections.push(...revealed, cta);
  }

  return (
    <section className="vprofile">
      <a className="vprofile-back" href="/">
        <span aria-hidden="true">&#8592;</span> Leaderboard
      </a>
      {sections.map((node, index) => (
        <div className="vprofile-slot" style={{ "--panel-i": index } as CSSProperties} key={index}>
          {node}
        </div>
      ))}
    </section>
  );
}
