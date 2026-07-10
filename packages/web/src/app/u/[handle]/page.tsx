import { notFound } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { getProfile } from "../../../lib/data";
import { formatInt, formatUsd, type Tier } from "../../../lib/leaderboard";
import { providerBrand } from "../../../lib/provider-brand";
import { readComplexity } from "../../../lib/profile-complexity";
import { trustSignalMark, trustSignalMetric, trustSignalTitle, trustSignalWindow } from "../../../lib/profile-trust";
import { PROVIDERS } from "../../../../../adapters/src/registry";
import {
  CategoryMix,
  MixRow,
  ProfileHeader,
  RhythmStrip,
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

// Every metric on the page is labelled; categories carry fixed honest colors.
const CATEGORY_COLORS: Record<string, string> = {
  coding: "#2ee8d6",
  llm: "#36e39b",
  image: "#ff4fd8",
  video: "#9f7cff",
  music: "#ffc64d",
  audio: "#ffc64d",
  "3d": "#ff7768",
  local: "#36e39b",
  other: "#7a8a93",
};

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

export default async function Profile({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const profile = await getProfile(handle);
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
      value: formatUsd(facts.usd),
      sub: `avg ${formatUsd(facts.usd / Math.max(facts.days, 1))}/day`,
    },
    {
      label: "total credits",
      value: formatInt(profile.latest?.total_credits ?? creditsSum),
      sub: `${formatInt(facts.ops)} records`,
    },
    {
      label: "days active",
      value: String(facts.days),
      sub: `since ${fmtDate(profile.usageDays[0]?.date ?? profile.created_at)}`,
    },
    {
      label: "sources",
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
        amount: `${formatUsd(p.usd)} · ${shareLabel(p.usd, usdTotal)}%`,
        share: usdTotal > 0 ? (p.usd / usdTotal) * 100 : 0,
        mark: brand.mark,
        from: brand.from,
        to: brand.to,
        ink: brand.ink,
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

  const categoryTotals = new Map<string, number>();
  for (const p of profile.providers) {
    const category = PROVIDERS.find((d) => d.id === p.provider)?.categories[0] ?? "other";
    categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + p.usd);
  }
  const categoryUsd = [...categoryTotals.values()].reduce((sum, usd) => sum + usd, 0);
  const categories = [...categoryTotals.entries()]
    .filter(([, usd]) => usd > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([category, usd]): MixBar => ({
      id: category,
      label: category,
      amount: `${formatUsd(usd)} · ${shareLabel(usd, categoryUsd)}%`,
      share: categoryUsd > 0 ? (usd / categoryUsd) * 100 : 0,
      color: CATEGORY_COLORS[category] ?? "#7a8a93",
    }));

  const trustChips = profile.trustSignals.map((signal) => ({
    mark: trustSignalMark(signal),
    title: trustSignalTitle(signal),
    metric: trustSignalMetric(signal),
    window: trustSignalWindow(signal),
    note: signal.note,
  }));

  const sections: ReactNode[] = [
    <ProfileHeader
      handle={profile.handle}
      joined={fmtDate(profile.created_at)}
      tierChip={tierRaw}
      signalTier={read.tier}
      signalHint={read.hint}
      brands={brands}
      key="header"
    />,
    <StatCards cards={cards} key="stats" />,
  ];
  const revealed: ReactNode[] = [];
  if (reveal.chart) revealed.push(<UsagePanel days={profile.usageDays} key="usage" />);
  const showProviderMix = reveal.providerMix && mix.rows.length > 0;
  if (showProviderMix || reveal.insights) {
    revealed.push(<MixRow mix={showProviderMix ? mix : null} insights={reveal.insights ? insights : null} key="mix" />);
  }
  if (reveal.categoryMix) revealed.push(<CategoryMix rows={categories} key="categories" />);
  if (reveal.rhythm) {
    revealed.push(<RhythmStrip days={profile.usageDays.map((d) => ({ date: d.date, ops: d.ops }))} key="rhythm" />);
  }
  if (reveal.trust) revealed.push(<TrustRow tier={tier} signals={trustChips} key="trust" />);
  const cta = <TrackYours providerCount={PROVIDERS.length} key="cta" />;
  if (read.tier === "fresh") {
    sections.push(cta, ...revealed, (
      <p className="vprofile-unlock-note" key="unlock">more panels unlock as your data deepens</p>
    ));
  } else {
    sections.push(...revealed, cta);
  }

  return (
    <section className="vprofile">
      {sections.map((node, index) => (
        <div className="vprofile-slot" style={{ "--panel-i": index } as CSSProperties} key={index}>
          {node}
        </div>
      ))}
    </section>
  );
}
