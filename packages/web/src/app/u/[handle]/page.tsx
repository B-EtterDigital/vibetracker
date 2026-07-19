import { notFound } from "next/navigation";
import { cache, type ReactNode } from "react";
import { getProfile } from "../../../lib/data";
import { buildDemoProfile, DEMO_HANDLE } from "../../../lib/demo-profile";
import { formatInt, formatUsd } from "../../../lib/leaderboard";
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
import {
  ProfileHero,
  ProfileHeroEvidence,
  type HeroDiscipline,
  type HeroMetric,
  type HeroState,
} from "./profile-hero";
import { C0vibeBand } from "./profile-cta";
import { SyncRhythm, GitHubContributions } from "./profile-heatmap";
import { TokenBreakdown, Delegation } from "./profile-tokens";
import { OrchestrationHours } from "./profile-orchestration";
import { ViberIdentity } from "./profile-identity";
import { InfographicBoard } from "./profile-board";
import { ToolbarDock } from "./profile-toolbar";
import { SkillSignals } from "./profile-signals";
import { computeProfileSignals } from "../../../lib/profile-signals";
import { levelFor, fmtMeasure } from "../../../lib/viber-levels";
import { FlipToC0vibe } from "./profile-flip";
import { UsageTelemetry } from "./profile-telemetry";
import { buildTelemetryModel } from "./profile-telemetry-model";
import { ProfileReadout } from "./profile-readout";
import {
  ModelsByCost,
  NativeOutputLedger,
  ProfilePanelGrid,
  buildModelUsage,
  buildNativeLedgerRows,
  buildProfileBoardData,
  buildProfileChartSeries,
  buildToolBrands,
  canonicalProvider,
  heroTopModels,
  summarizeUsageDays,
  type ProfilePanel,
} from "./profile-useful-data";
import "./profile.css";
import "./profile-readout.css";
import "./profile-hero.css";
import "./profile-heatmap.css";
import "./profile-tokens.css";
import "./profile-signals.css";
import "./profile-identity.css";
import "./profile-infographic.css";
import "./profile-orchestration.css";
import "./profile-telemetry.css";
import "./profile-useful-data.css";
import "./profile-accessibility.css";
import "./profile-4k.css";

// The two C0VIBE doors on every profile: a free account, and the device-auth flow that
// migrates a CLI-uploaded (self-reported) board onto that account as attested.
const C0VIBE_JOIN_HREF = "https://c0vibe.app";
const C0VIBE_MIGRATE_HREF = "/cli-login";

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

function compactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function primaryCategory(id: string): string {
  return PROVIDERS.find((d) => d.id === canonicalProvider(id) || d.id === id)?.categories[0] ?? "other";
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  if (handle === DEMO_HANDLE) {
    return {
      title: "demo — sample profile · VibeUsage",
    };
  }
  const profile = await loadProfile(handle);
  if (!profile) return {};
  const read = readComplexity(profile, PROVIDERS);
  return {
    title: `${profile.handle} — ${read.identity.label} · VibeUsage`,
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
  const usageTier = tierRaw === "verified" || tierRaw === "attested" ? tierRaw : "self_reported";
  const byUsd = profile.providers.slice().sort((a, b) => b.usd - a.usd);

  const brands = buildToolBrands(profile, byUsd);
  const chartSeries = buildProfileChartSeries(profile);
  const modelUsage = buildModelUsage(profile.providerModels);
  const nativeLedger = buildNativeLedgerRows(profile.nativeMetrics ?? []);

  // The headline stat cards carry NON-money values — money is not the flex (it lives in the Signal
  // read reference box and the token panels). These say what the viber has done and how broadly:
  // output, consistency, toolchain breadth, creative range. Each card is tinted its own accent.
  const commits = Number(
    (profile.trustSignals.find((s) => s.kind === "github_activity") as { totalContributions?: number } | undefined)?.totalContributions ?? 0,
  );
  const activeDays = profile.usageDays.filter((day) => day.ops > 0 || day.usd > 0 || day.credits > 0).length;
  const cards = [
    commits > 0
      ? {
          label: "commits shipped",
          mark: "commits" as const,
          value: formatInt(commits),
          sub: "git, last year",
          accent: "#36e39b",
        }
      : {
          label: "operations",
          mark: "ops" as const,
          value: formatInt(facts.ops),
          sub: `across ${facts.providers} sources`,
          accent: "#2ee8d6",
        },
    {
      label: "days active",
      mark: "days" as const,
      value: String(activeDays),
      sub: `since ${fmtDate(profile.usageDays[0]?.date ?? profile.created_at)}`,
      accent: "#9f7cff",
    },
    {
      label: "sources",
      mark: "sources" as const,
      value: String(facts.providers),
      sub: "AI tools tracked",
      accent: "#ff9e64",
    },
    {
      label: "disciplines",
      mark: "disciplines" as const,
      value: String(facts.categories),
      sub: read.identity.label.toLowerCase(),
      accent: vibeColor(read.identity.topCategory),
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
    { label: "Active days", value: String(facts.days) },
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
    ? profile.categories.map((c) => ({ id: c.category, ops: c.ops, credits: c.credits, usd: c.usd }))
    : (() => {
        const ops = new Map<string, number>();
        const credits = new Map<string, number>();
        const usd = new Map<string, number>();
        for (const p of profile.providers) {
          const category = primaryCategory(p.provider);
          ops.set(category, (ops.get(category) ?? 0) + p.ops);
          credits.set(category, (credits.get(category) ?? 0) + p.credits);
          usd.set(category, (usd.get(category) ?? 0) + p.usd);
        }
        return [...ops.entries()].map(([id, o]) => ({
          id,
          ops: o,
          credits: credits.get(id) ?? 0,
          usd: usd.get(id) ?? 0,
        }));
      })();
  const opsTotal = categorySource.reduce((sum, c) => sum + c.ops, 0);
  const categories = categorySource
    .filter((c) => c.ops > 0)
    .sort((a, b) => b.ops - a.ops)
    .map((c): MixBar => ({
      id: c.id,
      label: vibeLabel(c.id),
      amount: `${formatInt(c.ops)} ops · ${formatInt(c.credits)} cr · ${formatUsd(c.usd)} · ${shareLabel(c.ops, opsTotal)}%`,
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

  // Rank the state rail by SPEND, not op-count. Op-count made a cheap high-volume model (haiku)
  // read as the "top model" and a high-message source outrank the one that actually cost the most;
  // spend is the honest headline and it stays consistent with the money everywhere else.
  const topSource = byUsd[0] ? providerLabel(byUsd[0].provider) : "—";
  const compactUsd = (n: number) => {
    const magnitude = Math.abs(n);
    const sign = n < 0 ? "-" : "";
    if (magnitude >= 1_000_000) return `${sign}$${(magnitude / 1_000_000).toFixed(1)}m`;
    if (magnitude >= 1_000) return `${sign}$${(magnitude / 1_000).toFixed(1)}k`;
    return formatUsd(n);
  };
  const topModels = heroTopModels(modelUsage);
  const exactOps = Math.round(facts.ops).toLocaleString("en-US");
  const heroState: HeroState[] = [
    { label: "signal", value: read.tier },
    ...(profile.rank
      ? [{ label: "global rank", value: `#${profile.rank}` }]
      : [{ label: "estimated ops", value: compactNumber(facts.ops), title: `${exactOps} reconstructed operations` }]),
    { label: "disciplines", value: String(facts.categories) },
    { label: "top source", value: topSource },
  ];
  // Hero metric order is user-specified (2026-07-15): days first, then tokens (billions), then
  // disciplines/sources, then the API-equivalent cost estimate last — money is never the lead.
  const tokensB = (profile.totalTokens ?? 0) / 1e9;
  const heroMetrics: HeroMetric[] = [
    {
      label: "Active days",
      value: formatInt(facts.days),
      note: "days with tracked usage",
      title: `${formatInt(facts.days)} days with at least one tracked AI operation`,
    },
    tokensB >= 0.1
      ? {
          label: "Tokens processed",
          value: tokensB >= 100 ? `${Math.round(tokensB)}B` : `${tokensB.toFixed(1)}B`,
          note: "measured coding tokens, all types",
          title: `${formatInt(Math.round(profile.totalTokens ?? 0))} tokens — input, output, cache read and cache creation, measured at source`,
        }
      : {
          label: "Estimated operations",
          value: compactNumber(facts.ops),
          note: "reconstructed from usage records",
          title: `${exactOps} reconstructed operations`,
        },
    {
      label: "Disciplines / sources",
      value: `${facts.categories} / ${facts.providers}`,
      note: "creative range × toolset breadth",
      title: `${facts.categories} disciplines (coding, image, video, …) across ${facts.providers} tracked sources`,
    },
    {
      label: "API-equivalent cost",
      value: compactUsd(facts.usd),
      note: `${formatUsd(facts.usd)} reference value, not a bill`,
      title: "What this usage would cost at published API list prices without a subscription — an estimate for scale, not money spent",
    },
  ];
  const activity = summarizeUsageDays(profile.usageDays, new Date());
  const totalCredits = profile.latest?.total_credits ?? profile.providers.reduce((sum, provider) => sum + provider.credits, 0);
  if (activity.currentStreak > 0) {
    heroMetrics.push({
      label: "Current streak",
      value: formatInt(activity.currentStreak),
      note: "consecutive active days",
      title: `${formatInt(activity.currentStreak)} consecutive days ending on the most recent tracked usage day`,
    });
  }
  if (activity.lastActive && activity.showLastActive) {
    heroMetrics.push({
      label: "Last active",
      value: fmtDate(activity.lastActive),
      note: "most recent tracked usage",
      title: `Last tracked usage was ${fmtDate(activity.lastActive)}`,
    });
  }
  if (totalCredits > 0) {
    heroMetrics.push({
      label: "Credits burned",
      value: formatInt(totalCredits),
      note: "native provider credits",
      title: `${formatInt(totalCredits)} provider credits burned`,
    });
  }
  // A viber's own bio (set with `npx vibetrack profile --bio`), shown below the sources. Empty for
  // most profiles today, which surfaces the "add a bio" affordance instead.
  const userBio = (profile.bio ?? "").trim();


  const showProviderMix = reveal.providerMix && mix.rows.length > 0;
  // The real GitHub contribution graph, whenever the viber's CLI captured it. Always shown when
  // present (not tier-gated) — it is the viber's own git, and it reads as activity evidence, kept
  // deliberately distinct from AI spend. Never affects spend, ops, credits, or the signal score.
  const githubSignal = profile.trustSignals.find(
    (s): s is Extract<typeof s, { kind: "github_activity" }> =>
      s.kind === "github_activity" && Array.isArray(s.days) && s.days.length > 0,
  );
  const latestRead = buildTelemetryModel(profile.usageDays, chartSeries, 30, "usd");
  const readoutCategory = categories[0]
    ? { label: categories[0].label, share: categories[0].share }
    : null;
  const locked: Array<{ name: string; unlock: string }> = [];
  if (!reveal.chart) locked.push({ name: "usage over time", unlock: "unlocks after a week of history" });
  if (!reveal.insights) locked.push({ name: "usage insights", unlock: "unlocks at spark" });
  if (!reveal.categoryMix) locked.push({ name: "specialization", unlock: "unlocks at current" });
  if (!reveal.rhythm) locked.push({ name: "sync rhythm", unlock: "unlocks at surge" });
  // Lower tiers lead with the CTA and a teaser of what deepens next; Surge/Supernova lead with data.
  const climbing = read.tier === "ember" || read.tier === "spark" || read.tier === "current";

  // ---- Layout as designed movements, not a flat wall ---------------------------------------
  // The profile reads as scannable chapters (Overview / Usage / Activity / Identity & trust /
  // Join) in a 12-column bento grid, instead of a monotone stack of equal full-width boxes. Every
  // panel keeps ALL its data — this only regroups and reweights. Panels built with viewport media
  // queries (the chart, the delta rail, the heatmaps) stay full-width; the two that read cleanly at
  // half (specialization, trust) pair 2-up. Movement order is fixed, so a panel's push position no
  // longer dictates where it lands.
  const panels: ProfilePanel[] = [];
  const add = (group: string, span: ProfilePanel["span"], node: ReactNode) => {
    panels.push({ key: (node as { key?: string }).key ?? group, group, span, node });
  };

  const { traits, opsCompact, specs } = buildProfileBoardData({
    profile,
    categories,
    categorySource,
    facts,
    userBio,
  });

  if (isDemo) add("hero", "full", <DemoBanner key="demo" />);
  add("hero", "full",
    <ProfileHero
      handle={profile.handle}
      accent={heroAccent}
      eyebrow="viber profile"
      identity={read.identity.label}
      identityVerified={Boolean(profile.identityVerified)}
      identityProvider={profile.identityProvider}
      signalTier={read.tier}
      signalHint={read.hint}
      tierChip={tierRaw}
      metrics={heroMetrics}
      key="hero"
    />);
  // Directly under the hero: the flat logo toolbar, then the composed infographic board
  // (pies=traits · bio · spiral=CLI distribution · columns=monthly spend) — the reference, 1:1.
  add("hero", "full", <ToolbarDock brands={brands} key="toolbar" />);
  add("hero", "full", <InfographicBoard traits={traits} specs={specs} key="board" />);
  // User-ordered flow (2026-07-15): identity plate (archetype + badges) directly under the board,
  // then the two activity heatmaps — the poster's "who is this + how steady" chapter, up top.
  const signals = computeProfileSignals(profile);
  // Trait LEVELS — ten per discipline, L1 easy, L10 earned over years (lib/viber-levels.ts).
  // Creative traits level on credits burned, coding on operations; the medal artwork shares the
  // C0VIBE achievement design language (pure-energy pucks, no animation).
  const traitLevels = profile.categories
    .filter((c) => c.ops > 0 || c.credits > 0)
    .map((c) => {
      const read = levelFor(c.category, c.credits, c.ops);
      return {
        id: c.category,
        label: vibeLabel(c.category).replace(/^AI\s+/i, ""),
        level: read.level,
        progress: read.progress,
        detail: read.next === null
          ? `MAX — ${fmtMeasure(read.value, read.measure)} banked`
          : `${fmtMeasure(read.value, read.measure)} · next level at ${fmtMeasure(read.next, read.measure)}`,
      };
    })
    .sort((a, b) => b.level - a.level || b.progress - a.progress);
  add("hero", "full",
    <ViberIdentity signals={signals} opsValue={opsCompact} traitLevels={traitLevels} key="identity" />);
  // A migrated (account-linked) profile carries the door to its C0VIBE face: the cube flip.
  if (profile.accountLinked) {
    add("hero", "full", <FlipToC0vibe handle={profile.handle} key="flip" />);
  }
  if (reveal.rhythm) {
    add("hero", "full", <SyncRhythm days={profile.usageDays.map((d) => ({ date: d.date, ops: d.ops, usd: d.usd }))} key="rhythm" />);
  }
  if (githubSignal) {
    add("hero", "full",
      <GitHubContributions handle={githubSignal.handle} total={githubSignal.totalContributions} days={githubSignal.days ?? []} key="github" />);
  }
  add("hero", "full",
    <ProfileReadout
      handle={profile.handle}
      model={latestRead}
      category={readoutCategory}
      trust={tierRaw}
      hasGitHubEvidence={Boolean(githubSignal)}
      through={fmtDate(latestRead?.current.at(-1)?.date ?? profile.latest?.created_at ?? profile.created_at)}
      key="readout"
    />);
  add("hero", "full",
    <ProfileHeroEvidence
      accent={heroAccent}
      signalTier={read.tier}
      signalHint={read.hint}
      since={fmtDate(profile.usageDays[0]?.date ?? profile.created_at)}
      state={heroState}
      topModels={topModels}
      brands={brands}
      disciplines={disciplines}
      userBio={userBio}
      key="hero-evidence"
    />);
  // The Signal read: measured skill signals + the reframed API-equivalent cost.
  add("overview", "full", <SkillSignals signals={signals} apiCost={formatUsd(facts.usd)} key="signals" />);
  // Local derived orchestration evidence, shown only when the upload carried a usable trace.
  if (profile.orchestration && profile.orchestration.activityHours > 0) {
    add("overview", "full", <OrchestrationHours orch={profile.orchestration} key="orchestration" />);
  }
  add("overview", "full", <SignalProgress tier={read.tier} progress={read.progress} key="progress" />);
  add("overview", "full", <StatCards cards={cards} key="stats" />);
  if (reveal.chart) {
    add("usage", "full", <UsagePanel days={profile.usageDays} providers={chartSeries} key="usage" />);
    if (showProviderMix || reveal.insights) {
      add("usage", "full", <MixRow mix={showProviderMix ? mix : null} insights={reveal.insights ? insights : null} key="mix" />);
    }
    add("usage", "full", <UsageTelemetry days={profile.usageDays} providers={chartSeries} key="telemetry" />);
  } else if (showProviderMix || reveal.insights) {
    add("usage", "full", <MixRow mix={showProviderMix ? mix : null} insights={reveal.insights ? insights : null} key="mix" />);
  }
  if (modelUsage.length > 0) add("usage", "full", <ModelsByCost rows={modelUsage} key="models-by-cost" />);
  if (nativeLedger.length > 0) add("usage", "full", <NativeOutputLedger rows={nativeLedger} key="native-output-ledger" />);
  // Token breakdown (input/output/cache) + cross-provider delegation — the SMOA orchestration
  // surface. Both are additive aggregates; shown only when the upload carried them.
  const tokenBreakdown = profile.tokenBreakdown ?? [];
  if (tokenBreakdown.some((t) => t.scope === "total")) {
    add("usage", "half", <TokenBreakdown breakdown={tokenBreakdown} totalTokens={profile.totalTokens ?? 0} key="tokens" />);
  }
  const agents = profile.agents ?? [];
  if (agents.length > 0) {
    add("usage", "half", <Delegation agents={agents} crossProviderDays={profile.crossProviderDays ?? 0} activeDays={facts.days} key="delegation" />);
  }
  // (Sync rhythm + GitHub contributions moved to the top chapter, directly under the identity
  // plate — user order 2026-07-15.)
  // Specialization ranks by operations, which are reconstructed from token volume (logs are pruned)
  // — flag it so the ops numbers read as estimates, not exact counts.
  if (reveal.categoryMix) add("who", "half", <CategoryMix rows={categories} sub={`${read.identity.label} · ops est.`} key="categories" />);
  if (reveal.trust) add("who", "half", <TrustRow tier={usageTier} signals={trustChips} key="trust" />);
  add("join", "full",
    <C0vibeBand
      handle={profile.handle}
      accountLinked={Boolean(profile.accountLinked)}
      identityVerified={Boolean(profile.identityVerified)}
      identityProvider={profile.identityProvider}
      joinHref={C0VIBE_JOIN_HREF}
      migrateHref={C0VIBE_MIGRATE_HREF}
      providerCount={PROVIDERS.length}
      key="cta"
    />);
  if (climbing && locked.length) {
    add("join", "full", <LockedPanels note="more panels unlock as your data deepens" items={locked} key="locked" />);
  }

  return (
    <section className="vprofile">
      <a className="vprofile-back" href="/">
        <span aria-hidden="true">&#8592;</span> Leaderboard
      </a>
      <ProfilePanelGrid panels={panels} climbing={climbing} />
    </section>
  );
}
