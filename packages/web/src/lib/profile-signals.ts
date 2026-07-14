// Skill signals — read a viber's STYLE and skill out of the data, so the profile isn't a
// dollar-measuring contest. Burning budget isn't the flex: the money is only the API-equivalent
// reference cost (what this usage would run at published API prices, without a subsidised
// subscription). The signals below say who is experienced and *how* they work.
//
// All derived from real data (token breakdown, agents, categories, git, per-provider spend). No
// per-user hardcoding — thresholds and subscription-capacity references are documented constants.

import type { ProfileView } from "./data";

// Monthly API-equivalent value one maxed $200 subscription realistically sustains — a rough,
// clearly-labelled reference used to turn spend volume into a "how many accounts" estimate.
// This planning estimate avoids equating sticker price with delivered API-equivalent throughput:
// generous resets mean one account can deliver far more than its subscription price. Vendors do
// not publish a fixed API-equivalent capacity, so this is not a literal account-count claim.
const SUB_MONTHLY_API_EQUIV: Record<string, { label: string; usd: number }> = {
  codex: { label: "ChatGPT Pro", usd: 30000 },
  "claude-code": { label: "Claude Max", usd: 30000 },
  openclaw: { label: "OpenClaw", usd: 10000 },
};
const MEDIA_PROVIDERS = new Set(["higgsfield", "suno", "falai", "replicate", "runway", "kling", "elevenlabs"]);
const CREATIVE_CATEGORIES = new Set(["image", "video", "music", "voice", "threed", "3d", "audio"]);

// Daily token throughput for one heavily used, cache-read-heavy coding agent. This turns the peak
// day into a directional workload equivalent; daily totals cannot prove simultaneous concurrency.
const SINGLE_AGENT_DAILY_TOKENS = 600_000_000;

export interface Footprint { label: string; count: number }
export interface ProfileSignals {
  apiCostUsd: number;
  humanRatio: number;        // conversation (input+output) / total tokens — hands-on vs agentic
  cacheReuse: number;        // cacheRead / (input + cacheRead) — context-reuse efficiency
  outputShare: number;       // output / total
  hasTokens: boolean;
  agentCount: number;
  peakAgentLoad: number;     // busiest day in heavy-agent workload equivalents
  crossProviderDays: number;
  mediaGenerations: number;
  commits: number;
  shipRate: number | null;   // commits per billion tokens
  archetypes: string[];
  archetypeLabel: string;
  archetypeBlurb: string;
  footprint: Footprint[];
}

function last30Spend(providerDays: ProfileView["providerDays"]): Map<string, number> {
  const out = new Map<string, number>();
  if (!providerDays.length) return out;
  const last = providerDays.reduce((m, d) => (d.date > m ? d.date : m), providerDays[0].date);
  const cutoff = new Date(Date.parse(`${last}T00:00:00Z`) - 29 * 86_400_000).toISOString().slice(0, 10);
  for (const d of providerDays) {
    if (d.date >= cutoff) out.set(d.provider, (out.get(d.provider) ?? 0) + d.usd);
  }
  return out;
}

const ARCHETYPE_BLURB: Record<string, string> = {
  "Swarm Orchestrator": "runs many agents in parallel across providers — automation does the typing",
  "Human-in-the-loop": "hands-on and conversational — high share of typed prompts and read replies",
  "Media Generator": "ships images, video and music at volume, not just code",
  "Solo Coder": "steady single-agent coding, low orchestration overhead",
  "AI Creator": "active across AI tools",
};

export function computeProfileSignals(profile: ProfileView): ProfileSignals {
  const total = (profile.tokenBreakdown ?? []).find((t) => t.scope === "total");
  const totalTokens = profile.totalTokens ?? 0;
  const conversation = total ? total.input + total.output : 0;
  const automation = total ? total.cacheRead + total.cacheCreation : 0;
  const hasTokens = Boolean(total) && totalTokens > 0;
  const humanRatio = hasTokens ? conversation / totalTokens : 0;
  const cacheReuse = total && total.input + total.cacheRead > 0 ? total.cacheRead / (total.input + total.cacheRead) : 0;
  const outputShare = hasTokens && total ? total.output / totalTokens : 0;

  const agents = (profile.agents ?? []).filter((a) => a.tokens > 1e6 || a.cost >= 1);
  const agentCount = agents.length;
  const crossProviderDays = profile.crossProviderDays ?? 0;

  // Estimate the busiest day's workload from peak API-equivalent cost and the profile's lifetime
  // average token/USD ratio. Model mix can vary, so this remains directional rather than observed
  // concurrency. Never report less than the number of distinct active CLIs.
  const apiCost = profile.latest?.total_usd ?? 0;
  const peakDayUsd = (profile.usageDays ?? []).reduce((m, d) => Math.max(m, d.usd), 0);
  const tokensPerUsd = apiCost > 0 ? totalTokens / apiCost : 0;
  const peakDayTokens = peakDayUsd * tokensPerUsd;
  const peakAgentLoad = peakDayTokens > 0
    ? Math.max(agentCount, Math.round(peakDayTokens / SINGLE_AGENT_DAILY_TOKENS))
    : agentCount;

  const mediaGenerations = (profile.categories ?? [])
    .filter((c) => CREATIVE_CATEGORIES.has(c.category))
    .reduce((sum, c) => sum + c.ops, 0);

  const gh = profile.trustSignals.find((s) => s.kind === "github_activity") as { totalContributions?: number } | undefined;
  const commits = Number(gh?.totalContributions ?? 0);
  const shipRate = totalTokens > 0 && commits > 0 ? commits / (totalTokens / 1e9) : null;

  // Archetypes — a viber can match several; two or more reads as "All-rounder".
  const archetypes: string[] = [];
  if (agentCount >= 3 && crossProviderDays >= 8 && humanRatio < 0.18) archetypes.push("Swarm Orchestrator");
  if (humanRatio >= 0.22) archetypes.push("Human-in-the-loop");
  if (mediaGenerations >= 400) archetypes.push("Media Generator");
  if (!archetypes.length) {
    archetypes.push(hasTokens && agentCount <= 2 ? "Solo Coder" : "AI Creator");
  }
  const archetypeLabel = archetypes.length >= 2 ? "All-rounder" : archetypes[0];
  const archetypeBlurb = archetypes.length >= 2
    ? archetypes.map((a) => a.toLowerCase()).join(" + ")
    : (ARCHETYPE_BLURB[archetypes[0]] ?? ARCHETYPE_BLURB["AI Creator"]);

  // Subscription footprint — last-30-day per-provider API-equivalent ÷ one maxed subscription.
  const spend30 = last30Spend(profile.providerDays);
  const footprint: Footprint[] = [];
  const seen = new Set<string>();
  for (const [provider, usd] of [...spend30.entries()].sort((a, b) => b[1] - a[1])) {
    const ref = SUB_MONTHLY_API_EQUIV[provider];
    if (ref && usd > 0) {
      const count = Math.max(1, Math.round(usd / ref.usd));
      if (!seen.has(ref.label)) { footprint.push({ label: ref.label, count }); seen.add(ref.label); }
    }
  }
  const media30 = [...spend30.entries()].filter(([p]) => MEDIA_PROVIDERS.has(p)).reduce((s, [, u]) => s + u, 0);
  if (media30 >= 20) footprint.push({ label: "Higgsfield", count: Math.max(1, Math.round(media30 / 200)) });

  return {
    apiCostUsd: profile.latest?.total_usd ?? 0,
    humanRatio, cacheReuse, outputShare, hasTokens,
    agentCount, peakAgentLoad, crossProviderDays, mediaGenerations,
    commits, shipRate, archetypes, archetypeLabel, archetypeBlurb, footprint,
  };
}
