import { notFound } from "next/navigation";
import { cache, type CSSProperties, type ReactNode } from "react";
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
import { ProfileHero, type HeroDiscipline } from "./profile-hero";
import { C0vibeBand } from "./profile-cta";
import { SyncRhythm, GitHubContributions } from "./profile-heatmap";
import { TokenBreakdown, Delegation } from "./profile-tokens";
import { SkillSignals } from "./profile-signals";
import { computeProfileSignals } from "../../../lib/profile-signals";
import { UsageTelemetry } from "./profile-telemetry";
import { buildTelemetryModel } from "./profile-telemetry-model";
import { ProfileReadout } from "./profile-readout";
import "./profile.css";
import "./profile-hero.css";
import "./profile-heatmap.css";
import "./profile-tokens.css";
import "./profile-signals.css";
import "./profile-telemetry.css";
import "./profile-accessibility.css";

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

  // Every source with real activity, ranked by spend — shown as the hero's labelled "Sources" row
  // so the question "where are the sources?" is answered at the top, with the full stack (spend +
  // ops per source) in the Usage → Your stack panel below.
  const brands = byUsd
    .filter((p) => p.usd > 0 || p.ops > 0)
    .map((p) => {
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

  // The headline stat cards carry NON-money values — money is not the flex (it lives in the Signal
  // read reference box and the token panels). These say what the viber has done and how broadly:
  // output, consistency, toolchain breadth, creative range. Each card is tinted its own accent.
  const commits = Number(
    (profile.trustSignals.find((s) => s.kind === "github_activity") as { totalContributions?: number } | undefined)?.totalContributions ?? 0,
  );
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
      value: String(facts.days),
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

  // Rank the state rail by SPEND, not op-count. Op-count made a cheap high-volume model (haiku)
  // read as the "top model" and a high-message source outrank the one that actually cost the most;
  // spend is the honest headline and it stays consistent with the money everywhere else.
  const topSource = byUsd[0] ? providerLabel(byUsd[0].provider) : "—";
  const compactUsd = (n: number) =>
    n >= 1000 ? `$${Math.round(n / 1000)}k` : n >= 1 ? `$${Math.round(n)}` : `$${n.toFixed(2)}`;
  const topModels = profile.providerModels
    .slice()
    .sort((a, b) => b.usd - a.usd || b.ops - a.ops)
    .slice(0, 5)
    .map((m) => ({ model: prettyModel(m.model), spend: compactUsd(m.usd) }));
  const heroState = [
    { label: "signal", value: read.tier },
    ...(profile.rank ? [{ label: "global rank", value: `#${profile.rank}` }] : [{ label: "operations", value: formatInt(facts.ops) }]),
    { label: "disciplines", value: String(facts.categories) },
    { label: "top source", value: topSource },
  ];

  const bio = `${formatInt(facts.ops)} operations across ${facts.providers} sources and ${facts.categories} disciplines. `
    + `${formatUsd(facts.usd)} tracked over ${facts.days} active days.`;
  // A viber's own bio (set with `vibetracker profile --bio`), shown below the sources. Empty for
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
  type Span = "full" | "half";
  interface Panel { key: string; group: string; span: Span; node: ReactNode; }
  const panels: Panel[] = [];
  const add = (group: string, span: Span, node: ReactNode) => {
    panels.push({ key: (node as { key?: string }).key ?? group, group, span, node });
  };

  if (isDemo) add("hero", "full", <DemoBanner key="demo" />);
  add("hero", "full",
    <ProfileHero
      handle={profile.handle}
      accent={heroAccent}
      eyebrow="viber profile"
      identity={read.identity.label}
      signalTier={read.tier}
      signalHint={read.hint}
      tierChip={tierRaw}
      bio={bio}
      userBio={userBio}
      since={fmtDate(profile.usageDays[0]?.date ?? profile.created_at)}
      disciplines={disciplines}
      state={heroState}
      topModels={topModels}
      brands={brands}
      joinHref={C0VIBE_JOIN_HREF}
      migrateHref={C0VIBE_MIGRATE_HREF}
      key="hero"
    />);
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
  // The Signal read leads: archetype + measured skill signals + the reframed API-equivalent cost.
  // Money is the reference, not the headline — skill is what you see first.
  const signals = computeProfileSignals(profile);
  add("overview", "full", <SkillSignals signals={signals} apiCost={formatUsd(facts.usd)} key="signals" />);
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
  if (reveal.rhythm) {
    add("activity", "full", <SyncRhythm days={profile.usageDays.map((d) => ({ date: d.date, ops: d.ops, usd: d.usd }))} key="rhythm" />);
  }
  if (githubSignal) {
    add("activity", "full",
      <GitHubContributions handle={githubSignal.handle} total={githubSignal.totalContributions} days={githubSignal.days ?? []} key="github" />);
  }
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

  // A lone half-panel has no partner to sit beside — promote it to full so it never leaves a gap.
  for (const group of new Set(panels.map((p) => p.group))) {
    const halves = panels.filter((p) => p.group === group && p.span === "half");
    if (halves.length === 1) halves[0].span = "full";
  }

  const GROUP_ORDER = climbing
    ? ["hero", "join", "overview", "usage", "activity", "who"]
    : ["hero", "overview", "usage", "activity", "who", "join"];
  const GROUP_LABEL: Record<string, string> = {
    overview: "Overview",
    usage: "Usage",
    activity: "Activity",
    who: "Identity & trust",
  };
  const ordered = panels.slice().sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group));

  // Walk the ordered panels, opening a movement (an eyebrow + a hairline rule) whenever a labelled
  // group begins. --panel-i keeps the staggered reveal animation continuous across the whole grid.
  const grid: ReactNode[] = [];
  let lastGroup = "";
  let i = 0;
  for (const panel of ordered) {
    if (panel.group !== lastGroup) {
      lastGroup = panel.group;
      const label = GROUP_LABEL[panel.group];
      if (label) {
        grid.push(
          <div className="vprofile-movement" style={{ "--panel-i": i } as CSSProperties} key={`mv-${panel.group}`}>
            <span>{label}</span>
          </div>,
        );
        i += 1;
      }
    }
    grid.push(
      <div className={`vprofile-slot vprofile-slot--${panel.span}`} style={{ "--panel-i": i } as CSSProperties} key={panel.key}>
        {panel.node}
      </div>,
    );
    i += 1;
  }

  return (
    <section className="vprofile">
      <a className="vprofile-back" href="/">
        <span aria-hidden="true">&#8592;</span> Leaderboard
      </a>
      <div className="vprofile-grid">{grid}</div>
    </section>
  );
}
