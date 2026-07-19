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
import { SourceToolbar, INFO_RAMP, type StackMonth } from "./profile-infographic";
import { InfographicBoard, type BoardSpec } from "./profile-board";
import { ToolbarDock } from "./profile-toolbar";
import { SkillSignals } from "./profile-signals";
import { computeProfileSignals } from "../../../lib/profile-signals";
import { levelFor, fmtMeasure } from "../../../lib/viber-levels";
import { nativeUsageLine } from "../../../lib/native-usage-metrics";
import { FlipToC0vibe } from "./profile-flip";
import { UsageTelemetry } from "./profile-telemetry";
import { buildTelemetryModel } from "./profile-telemetry-model";
import { ProfileReadout } from "./profile-readout";
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
import "./profile-accessibility.css";
import "./profile-4k.css";

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

function compactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
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

  // The toolbar is a toolchain, not a billing-provider list. New submissions carry an explicit
  // aggregate for orchestrators such as Cynaps3; older submissions safely fall back to providers.
  // "My Tools" is the UNION of every lane that proves a tool was used (user order 2026-07-19):
  // submission tool rows ∪ providers with any usage ∪ CLI agents with active days (Hermes etc.).
  // `content` is Cynaps3's content app — alias it to the Cynaps3 brand so the neuron shows.
  const TOOL_ALIAS: Record<string, string> = { content: "cynaps3", musicmation: "cynaps3" };
  const toolRowMap = new Map<string, number>();
  const bumpTool = (rawId: string, ops: number) => {
    // browser captures track as "<provider>-web" — the SAME tool as its base id; merge so a tool
    // never appears twice in the rail (real report 2026-07-19: OpenAI showed two chips)
    const aliased = TOOL_ALIAS[rawId] ?? rawId;
    const id = aliased.endsWith("-web") ? aliased.slice(0, -4) : aliased;
    toolRowMap.set(id, (toolRowMap.get(id) ?? 0) + ops);
  };
  for (const row of profile.tools ?? []) bumpTool(row.tool, row.ops);
  for (const p of byUsd) if (p.usd > 0 || p.ops > 0) bumpTool(p.provider, toolRowMap.has(p.provider) ? 0 : p.ops);
  for (const a of profile.agents ?? []) if (a.activeDays > 0 && !toolRowMap.has(a.agent)) bumpTool(a.agent, a.activeDays);
  // per-tool stats for the unfold panel — provider aggregates where they exist
  const provById = new Map(profile.providers.map((p) => [p.provider, p]));
  const TOOL_BLURBS: Record<string, string> = {
    "claude-code": "Anthropic's agentic coding CLI — this viber's heavy-lift pair programmer.",
    claude: "Anthropic's Claude — long-form reasoning and building.",
    codex: "OpenAI's Codex agent — autonomous implementation runs.",
    "gemini-cli": "Antigravity CLI — Google's agentic coding CLI (successor to Gemini CLI).",
    hermes: "Nous Research's Hermes agent — open-model agentic runs.",
    openclaw: "OpenClaw — autonomous browser-native agent work.",
    opencode: "OpenCode — open-source terminal coding agent.",
    higgsfield: "Cinematic AI image, video, audio & 3D studio — credits burned on real renders.",
    falai: "fal.ai — fast hosted inference for image, video and audio models.",
    openai: "OpenAI API — models metered by the Costs API.",
    openrouter: "OpenRouter — one key, every frontier model; balance-verified.",
    browserbase: "Browserbase — headless browsers for agent automation.",
    runpod: "RunPod — rented GPUs for heavy jobs.",
    comfyui: "ComfyUI — local node-graph diffusion; $0 API, GPU-time real.",
    suno: "Suno — AI music generation, tracked from the creator feed.",
    sunoapi: "SunoAPI — programmatic Suno music runs.",
    udio: "Udio — AI music generation.",
    cynaps3: "Cynaps3 Musicmation — this viber's own music automation platform; tracks, audio seconds and credits from its usage ledger.",
    elevenlabs: "ElevenLabs — AI voice and speech synthesis.",
    leonardo: "Leonardo.ai — production image generation.",
    runway: "Runway — pro AI video generation.",
    perplexity: "Perplexity — AI answer engine and research.",
    midjourney: "Midjourney — image generation; lifetime total imported from /info.",
    replicate: "Replicate — hosted open-model inference per GPU-second.",
    seaart: "SeaArt — AI image creation suite.",
    tensorart: "Tensor.Art — community model image generation.",
    pixverse: "PixVerse — AI video generation.",
    vidu: "Vidu — AI video generation.",
  };
  const brands = [...toolRowMap.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id]) => {
      const brand = providerBrand(id);
      const prov = provById.get(id);
      return {
        id,
        label: providerLabel(id),
        mark: brand.mark,
        from: brand.from,
        to: brand.to,
        ink: brand.ink,
        logo: brand.logo,
        blurb: TOOL_BLURBS[id] ?? `${providerLabel(id)} — part of this viber's tracked AI stack.`,
        stats: prov ? { ops: prov.ops, credits: prov.credits, usd: prov.usd } : undefined,
      };
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
  const topModels = profile.providerModels
    .slice()
    .sort((a, b) => b.usd - a.usd || b.ops - a.ops)
    .slice(0, 5)
    .map((m) => ({ model: prettyModel(m.model), spend: compactUsd(m.usd) }));
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
  type Span = "full" | "half";
  interface Panel { key: string; group: string; span: Span; node: ReactNode; }
  const panels: Panel[] = [];
  const add = (group: string, span: Span, node: ReactNode) => {
    panels.push({ key: (node as { key?: string }).key ?? group, group, span, node });
  };

  // ---- Infographic board data (user reference 2026-07-15: hero → logo toolbar → the composed
  // board). Traits = disciplines with real usage; spiral = CLI distribution by active days;
  // columns = monthly spend stacked by source. Reference palette via INFO_RAMP. ----------------
  const traits = categories.map((c, i) => ({
    id: c.id,
    label: c.label.replace(/^AI\s+/i, ""),
    color: INFO_RAMP[i % INFO_RAMP.length],
    pct: c.share,
  }));
  const opsCompact = facts.ops >= 1e9 ? `${(facts.ops / 1e9).toFixed(1)}B`
    : facts.ops >= 1e6 ? `${Math.round(facts.ops / 1e6)}M`
      : formatInt(Math.round(facts.ops));
  const AGENT_NAME: Record<string, string> = {
    codex: "Codex", claude: "Claude", "claude-code": "Claude", hermes: "Hermes",
    openclaw: "OpenClaw", gemini: "Gemini", "gemini-cli": "Antigravity", opencode: "OpenCode",
  };
  const agentRows = (profile.agents ?? []).filter((a) => a.activeDays > 0);
  const agentDaysTotal = agentRows.reduce((s, a) => s + a.activeDays, 0);
  const cliSpiral = agentRows
    .slice().sort((a, b) => b.activeDays - a.activeDays).slice(0, 10)
    .map((a, i) => {
      const share = agentDaysTotal > 0 ? (a.activeDays / agentDaysTotal) * 100 : 0;
      return {
        label: AGENT_NAME[a.agent] ?? a.agent,
        pct: share >= 1 ? `${Math.round(share)}%` : "<1%",
        color: INFO_RAMP[i % INFO_RAMP.length],
      };
    });
  // monthly spend stacked by source — last 12 months, filterable to one trait's sources
  const monthAgg = new Map<string, Map<string, number>>();
  for (const d of profile.providerDays) {
    const ym = d.date.slice(0, 7);
    const per = monthAgg.get(ym) ?? new Map<string, number>();
    per.set(d.provider, (per.get(d.provider) ?? 0) + d.usd);
    monthAgg.set(ym, per);
  }
  const monthsFor = (provs?: Set<string>): StackMonth[] => {
    const yms = [...monthAgg.keys()].sort().slice(-12);
    const rowsOf = (ym: string) => [...monthAgg.get(ym)!.entries()].filter(([p, v]) => v > 0 && (!provs || provs.has(p)));
    const totals = yms.map((ym) => rowsOf(ym).reduce((s, [, v]) => s + v, 0));
    const windowSum = totals.reduce((s, v) => s + v, 0);
    const provWindow = new Map<string, number>();
    for (const ym of yms) for (const [p, v] of rowsOf(ym)) provWindow.set(p, (provWindow.get(p) ?? 0) + v);
    const topProv = [...provWindow.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([p]) => p);
    return yms.map((ym, i) => {
      const rows = rowsOf(ym);
      const segments = topProv
        .filter((p) => rows.some(([q]) => q === p))
        .map((p) => ({ id: p, label: providerLabel(p), value: rows.find(([q]) => q === p)![1], color: INFO_RAMP[topProv.indexOf(p) % INFO_RAMP.length] }));
      const other = rows.filter(([p]) => !topProv.includes(p)).reduce((s, [, v]) => s + v, 0);
      if (other > 0) segments.push({ id: "other", label: "Other sources", value: other, color: "rgba(217,255,242,0.25)" });
      return {
        label: MONTHS[Number(ym.slice(5)) - 1] ?? ym,
        sharePct: windowSum > 0 ? (totals[i] / windowSum) * 100 : 0,
        segments,
      };
    });
  };
  // sources per trait (by each source's primary discipline — the fallback map)
  const provsByCat = new Map<string, Set<string>>();
  for (const p of profile.providers) {
    const cat = primaryCategory(p.provider);
    if (!provsByCat.has(cat)) provsByCat.set(cat, new Set());
    provsByCat.get(cat)!.add(p.provider);
  }
  // Per-MODEL trait classification: a multi-discipline source (Higgsfield spans image, video, 3D;
  // fal.ai image + video) carries models from several traits, so mapping by the source's primary
  // discipline put video/music/3D models under "image" and left those specs falling back to the
  // CLI hex. The model name decides its trait; unmatched models ride the source's primary.
  const MODEL_TRAIT_HINTS: Array<[RegExp, string]> = [
    // NOTE: bare "minimax" is their LLM family (m2.5 etc.) — only Hailuo/video-01 are video
    [/kling|veo|sora|runway|hailuo|minimax.?video|video-0\d|luma|pixverse|wan[-_ ]?2|hunyuan.?video|ltx|mochi|seedance|dream.?machine|video/i, "video"],
    [/hunyuan.?3d|trellis|tripo|meshy|rodin|3d/i, "threed"],
    [/suno|udio|lyria|riffusion|music/i, "music"],
    [/eleven|tts|voice|speech|chatterbox|dubbing|whisper|audio/i, "voice"],
    [/flux|banana|imagen|dall|gpt-image|seedream|ideogram|recraft|sdxl|stable.?diff|photon|midjourney|image|upscal|aura-sr|sam-?\d|sam2|florence|vector/i, "image"],
  ];
  const traitOfModel = (providerId: string, model: string): string => {
    for (const [re, trait] of MODEL_TRAIT_HINTS) if (re.test(model)) return trait;
    return primaryCategory(providerId);
  };
  const modelsByTrait = new Map<string, Map<string, number>>();
  const provsByTrait = new Map<string, Set<string>>();
  const provOpsByTrait = new Map<string, Map<string, number>>();
  for (const m of profile.providerModels) {
    const trait = traitOfModel(m.provider, m.model);
    const name = prettyModel(m.model);
    if (!modelsByTrait.has(trait)) modelsByTrait.set(trait, new Map());
    const bucket = modelsByTrait.get(trait)!;
    bucket.set(name, (bucket.get(name) ?? 0) + m.ops);
    if (!provsByTrait.has(trait)) provsByTrait.set(trait, new Set());
    provsByTrait.get(trait)!.add(m.provider);
    if (!provOpsByTrait.has(trait)) provOpsByTrait.set(trait, new Map());
    const pb = provOpsByTrait.get(trait)!;
    pb.set(m.provider, (pb.get(m.provider) ?? 0) + m.ops);
  }
  // Second click state (user order 2026-07-19): the provider distribution behind a trait —
  // "who powers my image gen" as coils, one per SOURCE. Per-model rows are the primary weight;
  // sources whose category records carry no model split fall back to their total ops so every
  // contributing platform still appears.
  const providerDistFor = (cat: string) => {
    const byProv = new Map<string, number>(provOpsByTrait.get(cat) ?? []);
    for (const p of profile.providers) {
      if (!byProv.has(p.provider) && primaryCategory(p.provider) === cat && p.ops > 0) {
        byProv.set(p.provider, p.ops);
      }
    }
    const total = [...byProv.values()].reduce((s, v) => s + v, 0);
    return [...byProv.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([prov, ops], i) => ({
      label: providerLabel(prov),
      pct: total > 0 && (ops / total) * 100 >= 1 ? `${Math.round((ops / total) * 100)}%` : "<1%",
      color: INFO_RAMP[i % INFO_RAMP.length],
    }));
  };
  const spiralForCat = (cat: string) => {
    const byModel = modelsByTrait.get(cat);
    if (!byModel) return [];
    const total = [...byModel.values()].reduce((s, v) => s + v, 0);
    return [...byModel.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([model, ops], i) => ({
      // keep the END of long model ids — "…nano-banana" and "…nano-banana-pro" must stay distinct
      label: model.length > 18 ? `…${model.slice(-17)}` : model,
      pct: total > 0 && (ops / total) * 100 >= 1 ? `${Math.round((ops / total) * 100)}%` : "<1%",
      color: INFO_RAMP[i % INFO_RAMP.length],
    }));
  };
  // one BoardSpec per trait + the overview — the hex, story and bars switch on circle click
  const specs: Record<string, BoardSpec> = {
    all: {
      id: "all",
      label: "Overview",
      spiralTitle: "CLI distribution, share of active days",
      spiral: cliSpiral,
      months: monthsFor(),
      story: {
        title: "the whole practice",
        intro: userBio || undefined,
        bullets: [
          `${facts.categories} disciplines across ${facts.providers} sources`,
          `${opsCompact} operations · ${formatUsd(facts.usd)} API-equivalent`,
          `${formatInt(facts.days)} active days`,
        ],
        foot: "click a circle to open that specialization — click again for its sources, once more to come back",
      },
    },
  };
  for (const c of categories) {
    const provs = provsByTrait.get(c.id) ?? provsByCat.get(c.id);
    const spiral = spiralForCat(c.id);
    const sourceNames = provs ? [...provs].map((p) => providerLabel(p)) : [];
    const topModelNames = spiral.slice(0, 3).map((s) => s.label);
    const raw = categorySource.find((s) => s.id === c.id);
    const nativeLine = nativeUsageLine(profile.nativeMetrics, c.id);
    specs[c.id] = {
      id: c.id,
      label: c.label,
      spiralTitle: `${c.label} — model distribution by operations`,
      // a thin trait NEVER borrows the CLI coils (that read as wrong content): one model = one
      // coil, zero models = no hexagon at all, and the story says so
      spiral,
      // second click: the SOURCE distribution behind this trait (who powers it)
      providerDist: providerDistFor(c.id),
      months: provs?.size ? monthsFor(provs) : monthsFor(),
      story: {
        title: c.label.toLowerCase(),
        bullets: [
          `${c.share >= 1 ? Math.round(c.share) : "<1"}% of all operations — ${formatInt(Math.round(raw?.ops ?? 0))} ops · ${formatInt(raw?.credits ?? 0)} credits · ${formatUsd(raw?.usd ?? 0)} API-equivalent`,
          ...(nativeLine ? [nativeLine] : []),
          ...(topModelNames.length ? [`top models: ${topModelNames.join(" · ")}`] : []),
          ...(sourceNames.length ? [`sources: ${sourceNames.join(" · ")}`] : []),
        ],
        foot: spiral.length >= 2
          ? "the hexagon and bars are filtered to this specialization"
          : spiral.length === 1
            ? "one model recorded here so far — the single coil is that model"
            : "no per-model split recorded for this trait yet — the bars are still filtered to its sources",
      },
    };
  }

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
