import { notFound } from "next/navigation";
import { cache, type CSSProperties, type ReactNode } from "react";
import { getProfile } from "../../../lib/data";
import { buildDemoProfile, DEMO_HANDLE } from "../../../lib/demo-profile";
import { formatInt, formatUsd, type Tier } from "../../../lib/leaderboard";
import { providerBrand } from "../../../lib/provider-brand";
import { readComplexity } from "../../../lib/profile-complexity";
import { trustSignalMark, trustSignalMetric, trustSignalTitle, trustSignalWindow } from "../../../lib/profile-trust";
import { PROVIDERS } from "../../../../../adapters/src/index";
import { vibeCategoryFor, vibeLabel } from "../../../../../core/src/vibe-categories";
import {
  CategoryMix,
  DemoBanner,
  LockedPanels,
  MixRow,
  ProfileHeader,
  RhythmStrip,
  SignalProgress,
  StatCards,
  TrackYours,
  TrustRow,
  UsagePanel,
  type KeyValueRow,
  type MixBar,
} from "./panels";
import "./profile.css";

export const revalidate = 60;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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
    return { id: p.provider, label: providerLabel(p.provider), mark: brand.mark, from: brand.from, to: brand.to, ink: brand.ink };
  });

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
      sub: `${formatInt(facts.ops)} records`,
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
  const rest = byUsd.slice(8);
  const restUsd = rest.reduce((sum, p) => sum + p.usd, 0);
  const mix = {
    rows: byUsd.slice(0, 8).map((p): MixBar => {
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
        tag: vibeCategoryFor(primaryCategory(p.provider)).short,
      };
    }),
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
  // creator's real work surfaces: a thousand image gens on a flat media
  // subscription would vanish under dollar-ranking, yet it is exactly what the
  // viber makes. This matches the ops-weighted identity read. usd rides along as
  // context in the label.
  const categoryOps = new Map<string, number>();
  const categoryUsd = new Map<string, number>();
  for (const p of profile.providers) {
    const category = primaryCategory(p.provider);
    categoryOps.set(category, (categoryOps.get(category) ?? 0) + p.ops);
    categoryUsd.set(category, (categoryUsd.get(category) ?? 0) + p.usd);
  }
  const opsTotal = [...categoryOps.values()].reduce((sum, ops) => sum + ops, 0);
  const categories = [...categoryOps.entries()]
    .filter(([, ops]) => ops > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([category, ops]): MixBar => ({
      id: category,
      label: vibeLabel(category),
      amount: `${formatInt(ops)} ops · ${formatUsd(categoryUsd.get(category) ?? 0)} · ${shareLabel(ops, opsTotal)}%`,
      share: opsTotal > 0 ? (ops / opsTotal) * 100 : 0,
    }));

  const trustChips = profile.trustSignals.map((signal) => ({
    mark: trustSignalMark(signal),
    title: trustSignalTitle(signal),
    metric: trustSignalMetric(signal),
    window: trustSignalWindow(signal),
    note: signal.note,
  }));

  const sections: ReactNode[] = [];
  if (isDemo) sections.push(<DemoBanner key="demo" />);
  sections.push(
    <ProfileHeader
      handle={profile.handle}
      since={fmtDate(profile.created_at)}
      tierChip={tierRaw}
      signalTier={read.tier}
      signalHint={read.hint}
      identity={read.identity}
      brands={brands}
      key="header"
    />,
    <SignalProgress tier={read.tier} progress={read.progress} key="progress" />,
    <StatCards cards={cards} key="stats" />,
  );
  const revealed: ReactNode[] = [];
  if (reveal.chart) revealed.push(<UsagePanel days={profile.usageDays} key="usage" />);
  const showProviderMix = reveal.providerMix && mix.rows.length > 0;
  if (showProviderMix || reveal.insights) {
    revealed.push(<MixRow mix={showProviderMix ? mix : null} insights={reveal.insights ? insights : null} key="mix" />);
  }
  if (reveal.categoryMix) revealed.push(<CategoryMix rows={categories} sub={read.identity.label} key="categories" />);
  if (reveal.rhythm) {
    revealed.push(<RhythmStrip days={profile.usageDays.map((d) => ({ date: d.date, ops: d.ops }))} key="rhythm" />);
  }
  if (reveal.trust) revealed.push(<TrustRow tier={tier} signals={trustChips} key="trust" />);
  const cta = <TrackYours providerCount={PROVIDERS.length} key="cta" />;
  if (read.tier === "fresh") {
    const locked: Array<{ name: string; unlock: string }> = [];
    if (!reveal.chart) locked.push({ name: "usage over time", unlock: "unlocks after a week of history" });
    if (!reveal.insights) locked.push({ name: "usage insights", unlock: "unlocks at operator" });
    if (!reveal.categoryMix) locked.push({ name: "specialization", unlock: "unlocks at operator" });
    if (!(reveal.rhythm && reveal.trust)) locked.push({ name: "sync rhythm + trust", unlock: "unlocks at supernova" });
    sections.push(cta, ...revealed);
    if (locked.length) {
      sections.push(<LockedPanels note="more panels unlock as your data deepens" items={locked} key="locked" />);
    }
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
