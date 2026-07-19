import type { CSSProperties, ReactNode } from "react";
import { formatInt } from "../../../lib/leaderboard";
import type { ProfileView } from "../../../lib/data";
import { nativeUsageLine } from "../../../lib/native-usage-metrics";
import { providerBrand } from "../../../lib/provider-brand";
import { logoPath } from "../../../lib/provider-logos";
import type { ComplexityFacts } from "../../../lib/profile-complexity";
import { PROVIDERS } from "../../../../../adapters/src/index";
import { INFO_RAMP, type StackMonth, type TraitPie } from "./profile-infographic";
import type { BoardSpec } from "./profile-board";
import type { ProviderSeries } from "./profile-chart";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CHART_SERIES_COLOR: Record<string, string> = {
  codex: "#3b82f6",
  "claude-code": "#ea7317",
  suno: "#ff9e64",
  falai: "#d1345b",
  openclaw: "#ef4444",
  higgsfield: "#f5d020",
};

export const AGENT_NAME: Readonly<Record<string, string>> = {
  codex: "Codex",
  claude: "Claude",
  "claude-code": "Claude",
  hermes: "Hermes",
  openclaw: "OpenClaw",
  gemini: "Gemini",
  "gemini-cli": "Antigravity",
  opencode: "OpenCode",
};

export function canonicalProvider(id: string): string {
  return id.endsWith("-web") ? id.slice(0, -4) : id;
}

function providerLabel(id: string): string {
  const canonical = canonicalProvider(id);
  return AGENT_NAME[canonical] ?? PROVIDERS.find((provider) => provider.id === canonical)?.label ?? canonical;
}

function primaryCategory(id: string): string {
  const canonical = canonicalProvider(id);
  return PROVIDERS.find((provider) => provider.id === canonical)?.categories[0] ?? "other";
}

function prettyModel(model: string): string {
  return model.replace(/-\d{8}$/, "");
}

function fmtUsd(value: number): string {
  const magnitude = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (magnitude >= 1_000_000) return `${sign}$${(magnitude / 1_000_000).toFixed(1)}M`;
  if (magnitude >= 1_000) return `${sign}$${(magnitude / 1_000).toFixed(1)}K`;
  return `${sign}$${magnitude.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export interface ModelUsageRow {
  model: string;
  ops: number;
  usd: number;
}

export function buildModelUsage(rows: readonly ProfileView["providerModels"][number][]): ModelUsageRow[] {
  const totals = new Map<string, { ops: number; usd: number }>();
  for (const source of rows) {
    const row = { ...source, provider: canonicalProvider(source.provider) };
    if (row.ops <= 0 && row.usd <= 0) continue;
    const model = prettyModel(row.model);
    const current = totals.get(model) ?? { ops: 0, usd: 0 };
    current.ops += row.ops;
    current.usd += row.usd;
    totals.set(model, current);
  }
  return [...totals.entries()]
    .map(([model, totals]) => ({ model, ...totals }))
    .sort((a, b) => b.usd - a.usd || b.ops - a.ops || a.model.localeCompare(b.model));
}

export function heroTopModels(rows: readonly ModelUsageRow[]): Array<{ model: string; spend: string }> {
  return rows.slice(0, 5).map((row) => ({ model: row.model, spend: fmtUsd(row.usd) }));
}

export function dayKeyUTC(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function summarizeUsageDays(days: readonly ProfileView["usageDays"][number][], now = new Date()) {
  const byDate = new Map<string, boolean>();
  for (const day of days) byDate.set(day.date, (byDate.get(day.date) ?? false) || day.ops > 0 || day.usd > 0 || day.credits > 0);
  const activeDates = [...byDate.entries()].filter(([, active]) => active).map(([date]) => date).sort();
  const lastActive = activeDates.at(-1) ?? null;
  const today = dayKeyUTC(now);
  if (!lastActive) return { currentStreak: 0, lastActive: null, showLastActive: false };
  let currentStreak = 1;
  let cursor = Date.parse(`${lastActive}T00:00:00Z`);
  while (currentStreak < activeDates.length) {
    cursor -= 86_400_000;
    if (!byDate.get(dayKeyUTC(new Date(cursor)))) break;
    currentStreak += 1;
  }
  return { currentStreak, lastActive, showLastActive: lastActive !== today };
}

export function ModelsByCost({ rows }: { rows: readonly ModelUsageRow[] }) {
  if (!rows.length) return null;
  const top = rows.slice(0, 10);
  const mostUsed = rows.slice().sort((a, b) => b.ops - a.ops || b.usd - a.usd).slice(0, 5);
  const topUsd = Math.max(...top.map((row) => row.usd), 0);
  const totalUsd = rows.reduce((sum, row) => sum + row.usd, 0);
  return (
    <section className="vprofile-panel vuse-models" aria-labelledby="vuse-models-title">
      <header className="vprofile-panel-head vuse-models-head">
        <h2 className="vprofile-panel-title" id="vuse-models-title">Models by cost</h2>
        <h3 className="vprofile-panel-title">Most used</h3>
      </header>
      <div className="vuse-models-body">
        <div>
          <table className="vuse-models-table">
            <thead>
              <tr><th scope="col">#</th><th scope="col">model</th><th scope="col">relative</th><th scope="col">usd</th><th scope="col">share</th></tr>
            </thead>
            <tbody>
              {top.map((row, index) => {
                const share = totalUsd > 0 ? (row.usd / totalUsd) * 100 : 0;
                const relative = topUsd > 0 ? Math.max(2, (row.usd / topUsd) * 100) : 2;
                return (
                  <tr key={row.model}>
                    <td className="vuse-models-rank">{String(index + 1).padStart(2, "0")}</td>
                    <th scope="row" className="vuse-models-name">{row.model}</th>
                    <td><span className="vuse-models-track" aria-hidden="true"><i style={{ width: `${relative}%` }} /></span></td>
                    <td className="vuse-models-usd">{fmtUsd(row.usd)}</td>
                    <td className="vuse-models-share">{share < 1 && share > 0 ? "<1" : Math.round(share)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length > 10 ? <p className="vprofile-dim-note">+{rows.length - 10} more models</p> : null}
        </div>
        <ol className="vuse-most-used">
          {mostUsed.map((row) => <li key={row.model}><span>{row.model}</span><b>{formatInt(row.ops)} ops</b></li>)}
        </ol>
      </div>
    </section>
  );
}

export interface NativeLedgerRow {
  provider: string;
  label: string;
  logo: string | null;
  mark: string;
  counts: string;
}

function pluralUnit(unit: string, count: number): string {
  const normalized = unit.trim().toLowerCase();
  if (count === 1) return normalized || "output";
  if (normalized === "variation") return "variations";
  return `${normalized || "output"}s`;
}

// The native-counts formatter — pluralized units · middle-dot joined · neutral Nh Nm duration,
// in row-encounter order. Extracted so the native output ledger AND the My Tools dock's per-tool
// deep stats render the exact same line from ONE place, with no duplicated formatting that can drift.
export function formatNativeCounts(metrics: readonly NonNullable<ProfileView["nativeMetrics"]>[number][]): string {
  const units = new Map<string, number>();
  let durationSeconds = 0;
  for (const source of metrics) {
    if (Number.isFinite(source.outputs) && source.outputs > 0) units.set(source.outputUnit, (units.get(source.outputUnit) ?? 0) + source.outputs);
    if (Number.isFinite(source.durationSeconds) && source.durationSeconds > 0) durationSeconds += source.durationSeconds;
  }
  const parts = [...units.entries()].map(([unit, count]) => `${formatInt(count)} ${pluralUnit(unit, count)}`);
  if (durationSeconds > 0) {
    const minutes = Math.max(1, Math.round(durationSeconds / 60));
    parts.push(`${Math.floor(minutes / 60)}h ${minutes % 60}m`);
  }
  return parts.join(" · ");
}

export function buildNativeLedgerRows(metrics: readonly NonNullable<ProfileView["nativeMetrics"]>[number][]): NativeLedgerRow[] {
  const providers = new Map<string, NonNullable<ProfileView["nativeMetrics"]>[number][]>();
  for (const source of metrics) {
    const provider = canonicalProvider(source.provider);
    const list = providers.get(provider) ?? [];
    list.push(source);
    providers.set(provider, list);
  }
  return [...providers.entries()]
    .filter(([, rows]) => rows.some((row) => Number.isFinite(row.outputs) && row.outputs > 0))
    .map(([provider, rows]) => {
      const brand = providerBrand(provider);
      return { provider, label: providerLabel(provider), logo: logoPath(provider), mark: brand.mark, counts: formatNativeCounts(rows) };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function NativeOutputLedger({ rows }: { rows: readonly NativeLedgerRow[] }) {
  if (!rows.length) return null;
  return (
    <section className="vprofile-panel vuse-ledger" aria-labelledby="vuse-ledger-title">
      <header className="vprofile-panel-head">
        <h2 className="vprofile-panel-title" id="vuse-ledger-title">Native output ledger</h2>
        <span className="vprofile-panel-sub">created things, counted natively - not tokens</span>
      </header>
      <table className="vuse-ledger-table">
        <thead><tr><th scope="col">provider</th><th scope="col">native outputs</th></tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.provider}>
              <th scope="row"><span className="vuse-ledger-logo" aria-hidden="true">{row.logo ? <img src={row.logo} alt="" width={18} height={18} /> : row.mark}</span>{row.label}</th>
              <td>{row.counts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

const TOOL_ALIAS: Readonly<Record<string, string>> = { content: "cynaps3", musicmation: "cynaps3" };
// The one canonical fold from a raw tool/provider id to its dock brand id: apply the tool alias
// (content/musicmation → cynaps3), then strip the "-web" browser-capture suffix. buildToolBrands and
// the page's per-tool statement folding MUST call this same helper so a viber's statement lands on
// the exact brand its chip is keyed by (no mirrored alias map that can silently drift).
export function canonicalToolBrandId(id: string): string {
  return canonicalProvider(TOOL_ALIAS[id] ?? id);
}
const TOOL_BLURBS: Readonly<Record<string, string>> = {
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

export function buildToolBrands(profile: ProfileView, providersByUsd: ProfileView["providers"]) {
  const totals = new Map<string, number>();
  const bump = (rawId: string, ops: number) => {
    const id = canonicalToolBrandId(rawId);
    totals.set(id, (totals.get(id) ?? 0) + ops);
  };
  for (const row of profile.tools ?? []) bump(row.tool, row.ops);
  for (const provider of providersByUsd) if (provider.usd > 0 || provider.ops > 0) bump(provider.provider, totals.has(provider.provider) ? 0 : provider.ops);
  for (const agent of profile.agents ?? []) if (agent.activeDays > 0 && !totals.has(agent.agent)) bump(agent.agent, agent.activeDays);
  const providerTotals = new Map(profile.providers.map((provider) => [provider.provider, provider]));
  return [...totals.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([id]) => {
    const brand = providerBrand(id);
    const usage = providerTotals.get(id);
    return {
      id,
      label: providerLabel(id),
      mark: brand.mark,
      from: brand.from,
      to: brand.to,
      ink: brand.ink,
      logo: brand.logo,
      blurb: TOOL_BLURBS[id] ?? `${providerLabel(id)} — part of this viber's tracked AI stack.`,
      stats: usage ? { ops: usage.ops, credits: usage.credits, usd: usage.usd } : undefined,
    };
  });
}

export function buildProfileChartSeries(profile: ProfileView): ProviderSeries[] {
  const days = new Map<string, ProviderSeries["days"]>();
  for (const row of profile.providerDays) {
    const provider = canonicalProvider(row.provider);
    const list = days.get(provider) ?? [];
    list.push({ date: row.date, ops: row.ops, credits: row.credits, usd: row.usd });
    days.set(provider, list);
  }
  const models = new Map<string, NonNullable<ProviderSeries["models"]>>();
  for (const row of profile.providerModels) {
    const provider = canonicalProvider(row.provider);
    const list = models.get(provider) ?? [];
    list.push({ model: row.model, ops: row.ops, usd: row.usd });
    models.set(provider, list);
  }
  for (const list of models.values()) list.sort((a, b) => b.usd - a.usd || b.ops - a.ops);
  return profile.providers.slice().sort((a, b) => b.ops - a.ops).filter((provider) => days.has(provider.provider)).slice(0, 7).map((provider) => ({
    id: provider.provider,
    label: providerLabel(provider.provider),
    color: CHART_SERIES_COLOR[provider.provider] ?? providerBrand(provider.provider).from,
    days: days.get(provider.provider) ?? [],
    models: models.get(provider.provider) ?? [],
  }));
}

interface BoardCategory {
  id: string;
  label: string;
  share: number;
}

interface CategorySourceRow {
  id: string;
  ops: number;
  credits: number;
  usd: number;
}

export function buildProfileBoardData({
  profile,
  categories,
  categorySource,
  facts,
  userBio,
}: {
  profile: ProfileView;
  categories: readonly BoardCategory[];
  categorySource: readonly CategorySourceRow[];
  facts: ComplexityFacts;
  userBio: string;
}): { traits: TraitPie[]; opsCompact: string; specs: Record<string, BoardSpec> } {
  const traits = categories.map((category, index) => ({
    id: category.id,
    label: category.label.replace(/^AI\s+/i, ""),
    color: INFO_RAMP[index % INFO_RAMP.length],
    pct: category.share,
  }));
  const opsCompact = facts.ops >= 1e9 ? `${(facts.ops / 1e9).toFixed(1)}B`
    : facts.ops >= 1e6 ? `${Math.round(facts.ops / 1e6)}M`
      : formatInt(Math.round(facts.ops));
  const agentRows = (profile.agents ?? []).filter((agent) => agent.activeDays > 0);
  const agentDaysTotal = agentRows.reduce((sum, agent) => sum + agent.activeDays, 0);
  const cliSpiral = agentRows.slice().sort((a, b) => b.activeDays - a.activeDays).slice(0, 10).map((agent, index) => {
    const share = agentDaysTotal > 0 ? (agent.activeDays / agentDaysTotal) * 100 : 0;
    return { label: AGENT_NAME[agent.agent] ?? agent.agent, pct: share >= 1 ? `${Math.round(share)}%` : "<1%", color: INFO_RAMP[index % INFO_RAMP.length] };
  });
  const monthAgg = new Map<string, Map<string, number>>();
  const monthAggByCat = new Map<string, Map<string, Map<string, number>>>();
  let hasCategoryDays = false;
  for (const source of profile.providerDays) {
    const row = { ...source, provider: canonicalProvider(source.provider) };
    const month = row.date.slice(0, 7);
    const providers = monthAgg.get(month) ?? new Map<string, number>();
    providers.set(row.provider, (providers.get(row.provider) ?? 0) + row.usd);
    monthAgg.set(month, providers);
    if (row.category) {
      hasCategoryDays = true;
      const categoryMonths = monthAggByCat.get(row.category) ?? new Map<string, Map<string, number>>();
      const categoryProviders = categoryMonths.get(month) ?? new Map<string, number>();
      categoryProviders.set(row.provider, (categoryProviders.get(row.provider) ?? 0) + row.usd);
      categoryMonths.set(month, categoryProviders);
      monthAggByCat.set(row.category, categoryMonths);
    }
  }
  const monthsFrom = (aggregate: Map<string, Map<string, number>>, allowed?: Set<string>): StackMonth[] => {
    const months = [...aggregate.keys()].sort().slice(-12);
    const rowsOf = (month: string) => [...aggregate.get(month)!.entries()].filter(([provider, value]) => value > 0 && (!allowed || allowed.has(provider)));
    const totals = months.map((month) => rowsOf(month).reduce((sum, [, value]) => sum + value, 0));
    const windowSum = totals.reduce((sum, value) => sum + value, 0);
    const providerWindow = new Map<string, number>();
    for (const month of months) for (const [provider, value] of rowsOf(month)) providerWindow.set(provider, (providerWindow.get(provider) ?? 0) + value);
    const topProviders = [...providerWindow.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([provider]) => provider);
    return months.map((month, index) => {
      const rows = rowsOf(month);
      const segments = topProviders.filter((provider) => rows.some(([candidate]) => candidate === provider)).map((provider) => ({
        id: provider,
        label: providerLabel(provider),
        value: rows.find(([candidate]) => candidate === provider)![1],
        color: INFO_RAMP[topProviders.indexOf(provider) % INFO_RAMP.length],
      }));
      const other = rows.filter(([provider]) => !topProviders.includes(provider)).reduce((sum, [, value]) => sum + value, 0);
      if (other > 0) segments.push({ id: "other", label: "Other sources", value: other, color: "rgba(217,255,242,0.25)" });
      return { label: MONTHS[Number(month.slice(5)) - 1] ?? month, sharePct: windowSum > 0 ? (totals[index] / windowSum) * 100 : 0, segments };
    });
  };
  const monthsForCategory = (category: string, providers?: Set<string>): StackMonth[] => {
    const aggregate = monthAggByCat.get(category);
    if (aggregate) return monthsFrom(aggregate);
    if (hasCategoryDays) return [];
    return providers?.size ? monthsFrom(monthAgg, providers) : [];
  };
  const providersByCategory = new Map<string, Set<string>>();
  for (const provider of profile.providers) {
    const category = primaryCategory(provider.provider);
    const providers = providersByCategory.get(category) ?? new Set<string>();
    providers.add(canonicalProvider(provider.provider));
    providersByCategory.set(category, providers);
  }
  const modelTraitHints: Array<[RegExp, string]> = [
    [/kling|veo|sora|runway|hailuo|minimax.?video|video-0\d|luma|pixverse|wan[-_ ]?2|hunyuan.?video|ltx|mochi|seedance|dream.?machine|video/i, "video"],
    [/hunyuan.?3d|trellis|tripo|meshy|rodin|3d/i, "3d"],
    [/suno|\budio\b|lyria|riffusion|music/i, "music"],
    [/eleven|tts|voice|speech|chatterbox|dubbing|whisper|audio/i, "audio"],
    [/flux|banana|imagen|dall|gpt-image|seedream|ideogram|recraft|sdxl|stable.?diff|photon|midjourney|image|upscal|aura-sr|sam-?\d|sam2|florence|vector/i, "image"],
  ];
  const traitOfModel = (provider: string, model: string): string => modelTraitHints.find(([pattern]) => pattern.test(model))?.[1] ?? primaryCategory(provider);
  const modelsByTrait = new Map<string, Map<string, { ops: number; usd: number }>>();
  const providersByTrait = new Map<string, Set<string>>();
  const providerOpsByTrait = new Map<string, Map<string, number>>();
  const providerModelOps = new Map<string, Map<string, number>>();
  const providerModelUsd = new Map<string, Map<string, number>>();
  for (const source of profile.providerModels) {
    const row = { ...source, provider: canonicalProvider(source.provider) };
    const trait = row.category ?? traitOfModel(row.provider, row.model);
    const models = modelsByTrait.get(trait) ?? new Map<string, { ops: number; usd: number }>();
    const model = prettyModel(row.model);
    const total = models.get(model) ?? { ops: 0, usd: 0 };
    total.ops += row.ops;
    total.usd += row.usd;
    models.set(model, total);
    modelsByTrait.set(trait, models);
    const providers = providersByTrait.get(trait) ?? new Set<string>();
    providers.add(row.provider);
    providersByTrait.set(trait, providers);
    for (const target of [providerOpsByTrait, providerModelOps]) {
      const totals = target.get(trait) ?? new Map<string, number>();
      totals.set(row.provider, (totals.get(row.provider) ?? 0) + row.ops);
      target.set(trait, totals);
    }
    const usdTotals = providerModelUsd.get(trait) ?? new Map<string, number>();
    usdTotals.set(row.provider, (usdTotals.get(row.provider) ?? 0) + row.usd);
    providerModelUsd.set(trait, usdTotals);
  }
  const catProviderOps = new Map<string, Map<string, { ops: number; usd: number }>>();
  for (const source of profile.providerDays) {
    if (!source.category || (source.ops <= 0 && source.usd <= 0)) continue;
    const provider = canonicalProvider(source.provider);
    const providers = catProviderOps.get(source.category) ?? new Map<string, { ops: number; usd: number }>();
    const total = providers.get(provider) ?? { ops: 0, usd: 0 };
    total.ops += source.ops;
    total.usd += source.usd;
    providers.set(provider, total);
    catProviderOps.set(source.category, providers);
  }
  for (const [category, providers] of catProviderOps) {
    const models = modelsByTrait.get(category) ?? new Map<string, { ops: number; usd: number }>();
    for (const [provider, total] of providers) {
      const untaggedOps = total.ops - (providerModelOps.get(category)?.get(provider) ?? 0);
      const untaggedUsd = total.usd - (providerModelUsd.get(category)?.get(provider) ?? 0);
      if (untaggedOps <= 0 && untaggedUsd <= 0) continue;
      const label = providerLabel(provider);
      const current = models.get(label) ?? { ops: 0, usd: 0 };
      current.ops += Math.max(untaggedOps, 0);
      current.usd += Math.max(untaggedUsd, 0);
      models.set(label, current);
    }
    modelsByTrait.set(category, models);
  }
  const providerDistribution = (category: string) => {
    const exact = new Map<string, number>();
    for (const row of profile.providerDays) if (row.category === category && row.ops > 0) {
      const provider = canonicalProvider(row.provider);
      exact.set(provider, (exact.get(provider) ?? 0) + row.ops);
    }
    const totals = exact.size ? exact : new Map(providerOpsByTrait.get(category) ?? []);
    for (const provider of profile.providers) {
      const id = canonicalProvider(provider.provider);
      if (!totals.has(id) && primaryCategory(id) === category && provider.ops > 0) totals.set(id, provider.ops);
    }
    const total = [...totals.values()].reduce((sum, value) => sum + value, 0);
    return [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([provider, ops], index) => ({
      label: providerLabel(provider),
      pct: total > 0 && (ops / total) * 100 >= 1 ? `${Math.round((ops / total) * 100)}%` : "<1%",
      color: INFO_RAMP[index % INFO_RAMP.length],
    }));
  };
  const weighsByCost = (category: string): boolean => [...(modelsByTrait.get(category)?.values() ?? [])].reduce((sum, value) => sum + value.usd, 0) >= 1;
  const modelsForCategory = (category: string) => {
    const models = modelsByTrait.get(category);
    if (!models) return [];
    const byCost = weighsByCost(category);
    const weight = (value: { ops: number; usd: number }) => byCost ? value.usd : value.ops;
    const ranked = [...models.entries()].sort((a, b) => weight(b[1]) - weight(a[1]));
    const modelTotal = ranked.reduce((sum, [, value]) => sum + weight(value), 0);
    const categoryOps = categorySource.find((row) => row.id === category)?.ops ?? 0;
    const denominator = byCost ? modelTotal : Math.max(modelTotal, categoryOps);
    const tail = ranked.slice(9).reduce((sum, [, value]) => sum + weight(value), 0);
    const unattributed = byCost ? 0 : Math.max(categoryOps - modelTotal, 0);
    const coils = ranked.slice(0, 9).map(([model, value], index) => ({
      label: model.length > 18 ? `…${model.slice(-17)}` : model,
      pct: denominator > 0 && (weight(value) / denominator) * 100 >= 1 ? `${Math.round((weight(value) / denominator) * 100)}%` : "<1%",
      color: INFO_RAMP[index % INFO_RAMP.length],
    }));
    if (tail + unattributed > 0 && denominator > 0) coils.push({
      label: unattributed > 0 && tail === 0 ? "unlisted (no model tag)" : "other models",
      pct: ((tail + unattributed) / denominator) * 100 >= 1 ? `${Math.round(((tail + unattributed) / denominator) * 100)}%` : "<1%",
      color: "rgba(217,255,242,0.3)",
    });
    return coils;
  };
  const specs: Record<string, BoardSpec> = {
    all: {
      id: "all",
      label: "Overview",
      spiralTitle: "CLI distribution, share of active days",
      spiral: cliSpiral,
      months: monthsFrom(monthAgg),
      story: {
        title: "the whole practice",
        intro: userBio || undefined,
        bullets: [
          `${facts.categories} disciplines across ${facts.providers} sources`,
          `${opsCompact} operations · ${fmtUsd(facts.usd)} API-equivalent`,
          `${formatInt(facts.days)} active days`,
        ],
        foot: "click a circle to open that specialization — click again for its sources, once more to come back",
      },
    },
  };
  for (const category of categories) {
    const providers = providersByTrait.get(category.id) ?? providersByCategory.get(category.id);
    const spiral = modelsForCategory(category.id);
    const sourceNames = providers ? [...providers].map(providerLabel) : [];
    const raw = categorySource.find((row) => row.id === category.id);
    const categoryOps = raw?.ops ?? 0;
    const taggedOps = [...(providerModelOps.get(category.id)?.values() ?? [])].reduce((sum, value) => sum + value, 0);
    const coverage = categoryOps > 0
      ? Math.max(0, Math.min(100, Math.round((taggedOps / categoryOps) * 100)))
      : 0;
    const baseCaption = spiral.length >= 2
      ? "the hexagon and bars are filtered to this specialization"
      : spiral.length === 1
        ? "one model recorded here so far — the single coil is that model"
        : "no per-model split recorded for this trait yet — the bars are still filtered to its sources";
    const nativeLine = nativeUsageLine(profile.nativeMetrics, category.id);
    specs[category.id] = {
      id: category.id,
      label: category.label,
      spiralTitle: `${category.label} — model distribution by ${weighsByCost(category.id) ? "cost" : "operations"}`,
      spiral,
      providerDist: providerDistribution(category.id),
      months: monthsForCategory(category.id, providers),
      story: {
        title: category.label.toLowerCase(),
        bullets: [
          `${category.share >= 1 ? Math.round(category.share) : "<1"}% of all operations — ${formatInt(Math.round(categoryOps))} ops · ${formatInt(raw?.credits ?? 0)} credits · ${fmtUsd(raw?.usd ?? 0)} API-equivalent`,
          ...(nativeLine ? [nativeLine] : []),
          ...(spiral.length ? [`top models: ${spiral.slice(0, 3).map((item) => item.label).join(" · ")}`] : []),
          ...(sourceNames.length ? [`sources: ${sourceNames.join(" · ")}`] : []),
        ],
        foot: categoryOps > 0 ? `${baseCaption} · model tags on ${coverage}% of ops` : baseCaption,
      },
    };
  }
  return { traits, opsCompact, specs };
}

export type ProfilePanel = { key: string; group: string; span: "full" | "half"; node: ReactNode };

export function ProfilePanelGrid({ panels, climbing }: { panels: readonly ProfilePanel[]; climbing: boolean }) {
  const normalized = panels.map((panel) => ({ ...panel }));
  for (const group of new Set(normalized.map((panel) => panel.group))) {
    const halves = normalized.filter((panel) => panel.group === group && panel.span === "half");
    if (halves.length === 1) halves[0].span = "full";
  }
  const order = climbing ? ["hero", "join", "overview", "usage", "activity", "who"] : ["hero", "overview", "usage", "activity", "who", "join"];
  const labels: Readonly<Record<string, string>> = { overview: "Overview", usage: "Usage", activity: "Activity", who: "Identity & trust" };
  const grid: ReactNode[] = [];
  let lastGroup = "";
  let index = 0;
  for (const panel of normalized.slice().sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group))) {
    if (panel.group !== lastGroup) {
      lastGroup = panel.group;
      if (labels[panel.group]) {
        grid.push(<div className="vprofile-movement" style={{ "--panel-i": index } as CSSProperties} key={`mv-${panel.group}`}><span>{labels[panel.group]}</span></div>);
        index += 1;
      }
    }
    grid.push(<div className={`vprofile-slot vprofile-slot--${panel.span}`} style={{ "--panel-i": index } as CSSProperties} key={panel.key}>{panel.node}</div>);
    index += 1;
  }
  return <div className="vprofile-grid">{grid}</div>;
}
