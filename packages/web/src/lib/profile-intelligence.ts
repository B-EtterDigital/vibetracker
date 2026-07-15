import type { ProfileView } from "./data";
import { providerBrand } from "./provider-brand.ts";

type IntelligenceTone = "pace" | "forecast" | "cheap" | "expensive" | "spread" | "local";
type IntelligenceImpact = "estimate" | "not_spend";
type DecisionTone = "burn" | "optimize" | "shift" | "focus" | "publish";
type DecisionImpact = "estimate" | "not_spend" | "no_write";
type BudgetPulseTone = "pace" | "forecast" | "provider" | "risk" | "local" | "review";
type BudgetPulseImpact = "estimate" | "not_spend" | "no_write";
type RoiSwitchTone = "cap" | "swap" | "local" | "focus" | "publish";
type RoiSwitchImpact = "estimate" | "not_spend" | "no_write";
type PrivateScopeTone = "account" | "profile" | "team" | "publish";
type PrivateScopeImpact = "private" | "no_write";

export interface ProfileIntelligenceCard {
  id: "pace" | "forecast" | "cheapest" | "expensive" | "concentration" | "local_shadow";
  label: string;
  value: string;
  status: string;
  note: string;
  tone: IntelligenceTone;
  impact: IntelligenceImpact;
  meter: number;
}

export interface ProfileIntelligenceDeck {
  headline: string;
  subline: string;
  terminalLines: string[];
  cards: ProfileIntelligenceCard[];
}

export interface ProfileDecisionAction {
  id: "burn-alert" | "workflow-review" | "local-shift" | "focus-check" | "publish-review";
  label: string;
  value: string;
  status: string;
  command: string;
  note: string;
  proof: string;
  impact: DecisionImpact;
  tone: DecisionTone;
  meter: number;
  marks: string[];
}

export interface ProfileDecisionBoard {
  headline: string;
  subline: string;
  terminalLines: string[];
  actions: ProfileDecisionAction[];
  totals: {
    actions: number;
    estimate: number;
    notSpend: number;
    noWrite: number;
    averageMeter: number;
  };
}

export interface InsightsBudgetPulseLane {
  id: "daily-pace" | "forecast" | "provider-pressure" | "expensive-workflow" | "local-shadow" | "review-gate";
  label: string;
  value: string;
  status: string;
  route: string;
  note: string;
  guardrail: string;
  impact: BudgetPulseImpact;
  tone: BudgetPulseTone;
  meter: number;
  mark: string;
  from: string;
  to: string;
  ink: string;
  frames: string[];
  transcript: string[];
}

export interface InsightsBudgetPulse {
  headline: string;
  subline: string;
  terminalLines: string[];
  totals: {
    lanes: number;
    estimates: number;
    notSpend: number;
    noWrite: number;
    usageWrites: number;
    totalMutations: number;
  };
  lanes: InsightsBudgetPulseLane[];
}

export interface InsightsRoiSwitchLever {
  id: "budget-cap" | "rate-swap" | "local-repeat" | "provider-mix" | "publish-proof";
  label: string;
  value: string;
  status: string;
  command: string;
  note: string;
  guardrail: string;
  impact: RoiSwitchImpact;
  tone: RoiSwitchTone;
  meter: number;
  mark: string;
  from: string;
  to: string;
  ink: string;
  screen: string[];
  proof: string[];
}

export interface InsightsRoiSwitchboard {
  headline: string;
  subline: string;
  terminalLines: string[];
  totals: {
    levers: number;
    estimates: number;
    notSpend: number;
    noWrite: number;
    usageWrites: number;
    totalMutations: number;
    planningEstimateUsd: number;
    localShadowUsd: number;
  };
  levers: InsightsRoiSwitchLever[];
}

export interface InsightsPrivateScopeLane {
  id: "account" | "profile" | "team" | "publish";
  label: string;
  value: string;
  status: string;
  command: string;
  note: string;
  guardrail: string;
  impact: PrivateScopeImpact;
  tone: PrivateScopeTone;
  meter: number;
  mark: string;
  from: string;
  to: string;
  ink: string;
  frames: string[];
  proof: string[];
}

export interface InsightsPrivateScopeRadar {
  headline: string;
  subline: string;
  terminalLines: string[];
  totals: {
    lanes: number;
    privateRails: number;
    publicWrites: number;
    rankMutations: number;
    hiddenUploads: number;
  };
  lanes: InsightsPrivateScopeLane[];
}

const LOCAL_PROVIDERS = new Set([
  "ollama",
  "lmstudio",
  "comfyui",
  "vllm",
  "localai",
  "jan",
  "gpt4all",
  "llama-cpp",
  "automatic1111",
  "forge",
  "invokeai",
  "fooocus",
  "diffusers-local",
  "text-generation-webui",
]);

function int(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

function money(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function rate(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "$0.0000/op";
  return `$${value.toFixed(value < 0.01 ? 4 : 3)}/op`;
}

function pct(value: number): string {
  return `${Math.round(value)}%`;
}

function fit(value: string | number, width: number): string {
  return String(value).padEnd(width).slice(0, width);
}

function frameLine(value: string): string {
  return `| ${fit(value, 60)} |`;
}

function small(value: string | number, width = 7): string {
  return String(value).replace(/\s+/g, " ").trim().padEnd(width).slice(0, width);
}

function budgetFrame(mark: string, label: string, impact: string): string {
  return `${small(mark)}\n${small(label.toUpperCase())}\n${small(impact.toUpperCase())}`;
}

function clampMeter(value: number, max: number, floor = 8): number {
  if (!Number.isFinite(value) || value <= 0 || max <= 0) return floor;
  return Math.max(floor, Math.min(100, Math.round((value / max) * 100)));
}

function activeDays(profile: ProfileView): number {
  return profile.usageDays.filter((day) => day.ops > 0 || day.usd > 0).length || (profile.latest ? 1 : 0);
}

function averageDailyUsd(profile: ProfileView): number {
  const rows = profile.usageDays.filter((day) => day.usd > 0);
  if (rows.length) return rows.reduce((sum, day) => sum + day.usd, 0) / rows.length;
  return profile.latest?.total_usd ?? 0;
}

function providersWithRate(profile: ProfileView): Array<ProfileView["providers"][number] & { usdPerOp: number }> {
  return profile.providers
    .filter((provider) => provider.ops > 0 && provider.usd > 0)
    .map((provider) => ({ ...provider, usdPerOp: provider.usd / provider.ops }));
}

function topProvider(profile: ProfileView): ProfileView["providers"][number] | undefined {
  return profile.providers.slice().sort((a, b) => b.usd - a.usd || b.ops - a.ops || a.provider.localeCompare(b.provider))[0];
}

function brandParts(provider: string): Pick<InsightsBudgetPulseLane, "mark" | "from" | "to" | "ink"> {
  const brand = providerBrand(provider);
  return {
    mark: brand.mark,
    from: brand.from,
    to: brand.to,
    ink: brand.ink,
  };
}

export function buildProfileIntelligenceDeck(profile: ProfileView): ProfileIntelligenceDeck {
  const latest = profile.latest;
  const totalUsd = latest?.total_usd ?? 0;
  const totalOps = latest?.record_count ?? 0;
  const days = activeDays(profile);
  const dailyUsd = averageDailyUsd(profile);
  const projected30d = dailyUsd * 30;
  const rated = providersWithRate(profile);
  const cheapest = rated.slice().sort((a, b) => a.usdPerOp - b.usdPerOp || b.ops - a.ops)[0];
  const expensive = rated.slice().sort((a, b) => b.usdPerOp - a.usdPerOp || b.usd - a.usd)[0];
  const top = topProvider(profile);
  const concentration = top && totalUsd > 0 ? (top.usd / totalUsd) * 100 : 0;
  const localOps = profile.providers
    .filter((provider) => LOCAL_PROVIDERS.has(provider.provider.toLowerCase()))
    .reduce((sum, provider) => sum + provider.ops, 0);
  const nonLocalRated = rated.filter((provider) => !LOCAL_PROVIDERS.has(provider.provider.toLowerCase()));
  const nonLocalOps = nonLocalRated.reduce((sum, provider) => sum + provider.ops, 0);
  const nonLocalUsd = nonLocalRated.reduce((sum, provider) => sum + provider.usd, 0);
  const nonLocalRate = nonLocalOps ? nonLocalUsd / nonLocalOps : 0;
  const localShadow = localOps * nonLocalRate;
  const maxCardValue = Math.max(projected30d, totalUsd, localShadow, 1);

  const cards: ProfileIntelligenceCard[] = [
    {
      id: "pace",
      label: "Daily pace",
      value: latest ? `${money(dailyUsd)}/day` : "waiting",
      status: `${int(days)} active day${days === 1 ? "" : "s"}`,
      note: profile.usageDays.length ? "Average from public daily aggregate rows." : "Upload-day estimate until daily rows exist.",
      tone: "pace",
      impact: "estimate",
      meter: clampMeter(dailyUsd, maxCardValue),
    },
    {
      id: "forecast",
      label: "30d forecast",
      value: latest ? money(projected30d) : "$0.00",
      status: "pace projection",
      note: "Estimate only. This does not alter usage, spend, rank, or verified status.",
      tone: "forecast",
      impact: "estimate",
      meter: clampMeter(projected30d, maxCardValue),
    },
    {
      id: "cheapest",
      label: "Cheapest source",
      value: cheapest ? cheapest.provider : "n/a",
      status: cheapest ? rate(cheapest.usdPerOp) : "no rate",
      note: cheapest ? `${int(cheapest.ops)} ops observed at the lowest public USD/op.` : "Need provider rows with USD and operations.",
      tone: "cheap",
      impact: "estimate",
      meter: cheapest ? clampMeter(1 / cheapest.usdPerOp, rated.length ? Math.max(...rated.map((provider) => 1 / provider.usdPerOp)) : 1, 20) : 8,
    },
    {
      id: "expensive",
      label: "Most expensive",
      value: expensive ? expensive.provider : "n/a",
      status: expensive ? rate(expensive.usdPerOp) : "no rate",
      note: expensive ? "Useful for spotting workflows worth optimizing." : "Need provider rows with USD and operations.",
      tone: "expensive",
      impact: "estimate",
      meter: expensive ? clampMeter(expensive.usdPerOp, rated.length ? Math.max(...rated.map((provider) => provider.usdPerOp)) : 1, 20) : 8,
    },
    {
      id: "concentration",
      label: "Provider focus",
      value: top ? pct(concentration) : "0%",
      status: top?.provider ?? "none",
      note: top ? "Share of public estimated spend held by the top provider." : "No provider spread yet.",
      tone: "spread",
      impact: "estimate",
      meter: clampMeter(concentration, 100),
    },
    {
      id: "local_shadow",
      label: "Local shadow value",
      value: localOps ? money(localShadow) : "$0.00",
      status: localOps ? `${int(localOps)} local ops` : "no local ops",
      note: "NOT SPEND. Local equivalent value uses the non-local observed USD/op as context only.",
      tone: "local",
      impact: "not_spend",
      meter: localOps ? clampMeter(localShadow, maxCardValue, 14) : 8,
    },
  ];

  return {
    headline: latest ? `${money(projected30d)} projected 30d pace` : "Cost intelligence waiting for usage",
    subline: "Forecasts and rates are public aggregate estimates. They explain the profile; they do not change totals.",
    terminalLines: [
      `VTK://PROFILE-INTEL//@${profile.handle}//ESTIMATE-ONLY`,
      latest ? `pace ${money(dailyUsd)}/day // 30d ${money(projected30d)} // days ${int(days)}` : "pace waiting // no reviewed bundle",
      `cheap ${cheapest?.provider ?? "n/a"} ${cheapest ? rate(cheapest.usdPerOp) : "no-rate"} // expensive ${expensive?.provider ?? "n/a"}`,
      `focus ${top?.provider ?? "none"} ${pct(concentration)} // local shadow ${money(localShadow)} NOT SPEND`,
    ],
    cards,
  };
}

export function buildProfileDecisionBoard(profile: ProfileView): ProfileDecisionBoard {
  const latest = profile.latest;
  const totalUsd = latest?.total_usd ?? 0;
  const days = activeDays(profile);
  const dailyUsd = averageDailyUsd(profile);
  const projected30d = dailyUsd * 30;
  const rated = providersWithRate(profile);
  const cheapest = rated.slice().sort((a, b) => a.usdPerOp - b.usdPerOp || b.ops - a.ops)[0];
  const expensive = rated.slice().sort((a, b) => b.usdPerOp - a.usdPerOp || b.usd - a.usd)[0];
  const top = topProvider(profile);
  const concentration = top && totalUsd > 0 ? (top.usd / totalUsd) * 100 : 0;
  const localOps = profile.providers
    .filter((provider) => LOCAL_PROVIDERS.has(provider.provider.toLowerCase()))
    .reduce((sum, provider) => sum + provider.ops, 0);
  const nonLocalRated = rated.filter((provider) => !LOCAL_PROVIDERS.has(provider.provider.toLowerCase()));
  const nonLocalOps = nonLocalRated.reduce((sum, provider) => sum + provider.ops, 0);
  const nonLocalUsd = nonLocalRated.reduce((sum, provider) => sum + provider.usd, 0);
  const nonLocalRate = nonLocalOps ? nonLocalUsd / nonLocalOps : 0;
  const localShadow = localOps * nonLocalRate;
  const maxForecast = Math.max(projected30d, totalUsd, 1);
  const maxRate = rated.length ? Math.max(...rated.map((provider) => provider.usdPerOp)) : 1;
  const hasReviewedData = Boolean(latest && (profile.providers.length || profile.usageDays.length));
  const actions: ProfileDecisionAction[] = [
    {
      id: "burn-alert",
      label: "Inspect budget runway",
      value: latest ? `${money(projected30d)} / 30d` : "waiting",
      status: latest ? `${money(dailyUsd)}/day` : "no bundle",
      command: "npx vibetrack mission --budget 500",
      note: "Use the current daily pace to decide whether the next month needs a visible budget line.",
      proof: `${int(days)} active day${days === 1 ? "" : "s"} from reviewed daily aggregates.`,
      impact: "estimate",
      tone: "burn",
      meter: latest ? clampMeter(projected30d, Math.max(maxForecast, 1000), 18) : 8,
      marks: ["30D", "USD", "PACE"],
    },
    {
      id: "workflow-review",
      label: "Review expensive workflow",
      value: expensive ? expensive.provider : "n/a",
      status: expensive ? rate(expensive.usdPerOp) : "no rate",
      command: "npx vibetrack insights",
      note: expensive ? "Open the highest USD/op workflow before buying more capacity." : "Needs provider rows with operations and USD.",
      proof: expensive ? `${int(expensive.ops)} ops observed for this provider.` : "No rated provider evidence yet.",
      impact: "estimate",
      tone: "optimize",
      meter: expensive ? clampMeter(expensive.usdPerOp, maxRate, 20) : 8,
      marks: ["RATE", "OP", "FIX"],
    },
    {
      id: "local-shift",
      label: "Shift repeat work local",
      value: localOps ? money(localShadow) : "$0.00",
      status: localOps ? `${int(localOps)} local ops` : "no local ops",
      command: "npx vibetrack life",
      note: "Compare repeatable work against Ollama, LM Studio, ComfyUI, or other local rails.",
      proof: "NOT SPEND. This is equivalent value context, not a usage total.",
      impact: "not_spend",
      tone: "shift",
      meter: localOps ? clampMeter(localShadow, maxForecast, 16) : 8,
      marks: ["LAN", "CPU", "SAVE"],
    },
    {
      id: "focus-check",
      label: "Check provider focus",
      value: top ? pct(concentration) : "0%",
      status: top?.provider ?? "none",
      command: "npx vibetrack stats --by provider",
      note: top ? "High concentration can be intentional, or it can hide lock-in and surprise renewals." : "Needs provider spread data.",
      proof: top ? `${top.provider} is the largest public estimated spend rail.` : "No provider leader yet.",
      impact: "estimate",
      tone: "focus",
      meter: clampMeter(concentration, 100),
      marks: ["MIX", "TOP", "RISK"],
    },
    {
      id: "publish-review",
      label: "Publish after review",
      value: hasReviewedData ? "C0VIBE ready" : "waiting",
      status: "0 writes here",
      command: "npx vibetrack upload --dry-run",
      note: "Run a dry-run preview before profile, score, badges, or leaderboard data leaves the machine.",
      proof: "Decision cards never write usage records, trust rows, public profiles, or ranks.",
      impact: "no_write",
      tone: "publish",
      meter: hasReviewedData ? 86 : 18,
      marks: ["DRY", "C0", "PUB"],
    },
  ];
  const averageMeter = Math.round(actions.reduce((sum, action) => sum + action.meter, 0) / actions.length);

  return {
    headline: latest ? `${actions.length} recommended decisions` : "Decision board waiting for usage",
    subline: "Actionable analytics for budget, workflow, local shift, provider mix, and publish review. These cards explain choices; they never write usage.",
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine("VTK://INSIGHTS-DECISIONS//ESTIMATE-ONLY//NO-WRITES"),
      "|--------------------------------------------------------------|",
      latest ? frameLine(`burn ${money(projected30d)} / 30d from ${money(dailyUsd)}/day`) : frameLine("burn waiting // no reviewed usage bundle"),
      frameLine(`review ${expensive?.provider ?? "n/a"} ${expensive ? rate(expensive.usdPerOp) : "no-rate"} // cheap ${cheapest?.provider ?? "n/a"}`),
      frameLine(`local ${money(localShadow)} NOT SPEND // focus ${top?.provider ?? "none"} ${pct(concentration)}`),
      frameLine("Vibers Unite // c0vibe.app // decisions write 0 rows"),
      "+--------------------------------------------------------------+",
    ],
    actions,
    totals: {
      actions: actions.length,
      estimate: actions.filter((action) => action.impact === "estimate").length,
      notSpend: actions.filter((action) => action.impact === "not_spend").length,
      noWrite: actions.filter((action) => action.impact === "no_write").length,
      averageMeter,
    },
  };
}

export function buildInsightsBudgetPulse(profile: ProfileView): InsightsBudgetPulse {
  const latest = profile.latest;
  const totalUsd = latest?.total_usd ?? 0;
  const totalOps = latest?.record_count ?? 0;
  const days = activeDays(profile);
  const dailyUsd = averageDailyUsd(profile);
  const projected30d = dailyUsd * 30;
  const rated = providersWithRate(profile);
  const cheapest = rated.slice().sort((a, b) => a.usdPerOp - b.usdPerOp || b.ops - a.ops)[0];
  const expensive = rated.slice().sort((a, b) => b.usdPerOp - a.usdPerOp || b.usd - a.usd)[0];
  const top = topProvider(profile);
  const concentration = top && totalUsd > 0 ? (top.usd / totalUsd) * 100 : 0;
  const localOps = profile.providers
    .filter((provider) => LOCAL_PROVIDERS.has(provider.provider.toLowerCase()))
    .reduce((sum, provider) => sum + provider.ops, 0);
  const nonLocalRated = rated.filter((provider) => !LOCAL_PROVIDERS.has(provider.provider.toLowerCase()));
  const nonLocalOps = nonLocalRated.reduce((sum, provider) => sum + provider.ops, 0);
  const nonLocalUsd = nonLocalRated.reduce((sum, provider) => sum + provider.usd, 0);
  const nonLocalRate = nonLocalOps ? nonLocalUsd / nonLocalOps : 0;
  const localShadow = localOps * nonLocalRate;
  const maxMoney = Math.max(projected30d, totalUsd, localShadow, 1);
  const topBrand = brandParts(top?.provider ?? "c0vibe");
  const expensiveBrand = brandParts(expensive?.provider ?? "higgsfield");
  const localBrand = brandParts(localOps ? "ollama" : "lmstudio");
  const c0Brand = brandParts("c0vibe");

  const lane = (config: Omit<InsightsBudgetPulseLane, "frames" | "transcript"> & { lines: string[] }): InsightsBudgetPulseLane => ({
    ...config,
    frames: [
      budgetFrame(config.mark, config.id, config.impact === "not_spend" ? "not spend" : config.impact),
      budgetFrame(config.mark, config.value, config.status),
      budgetFrame(config.mark, "VIBERS", "UNITE"),
    ],
    transcript: config.lines.map((line) => line.slice(0, 56)),
  });

  const lanes: InsightsBudgetPulseLane[] = [
    lane({
      id: "daily-pace",
      label: "Daily burn",
      value: latest ? `${money(dailyUsd)}/day` : "waiting",
      status: `${int(days)} active day${days === 1 ? "" : "s"}`,
      route: "daily aggregates",
      note: profile.usageDays.length ? "Average from reviewed daily aggregate rows." : "Upload-day estimate until daily rows exist.",
      guardrail: "Estimate only; does not mutate usage, spend, rank, or verified status.",
      impact: "estimate",
      tone: "pace",
      meter: clampMeter(dailyUsd, maxMoney, 14),
      ...brandParts("openai"),
      lines: [
        `pace ${money(dailyUsd)}/day from ${int(days)} active day${days === 1 ? "" : "s"}`,
        `records ${int(totalOps)} // public aggregate rows`,
        "estimateOnly=true // totalMutations=0",
      ],
    }),
    lane({
      id: "forecast",
      label: "30d pulse",
      value: latest ? money(projected30d) : "$0.00",
      status: "forecast",
      route: "pace x 30",
      note: "Burn-rate projection for planning, not billing truth.",
      guardrail: "Forecast is a labelled estimate and never rewrites totals.",
      impact: "estimate",
      tone: "forecast",
      meter: clampMeter(projected30d, maxMoney, 14),
      ...brandParts("c0vibe"),
      lines: [
        `30d ${money(projected30d)} // pace ${money(dailyUsd)}/day`,
        "planning surface only // no rank change",
        "Vibers Unite // c0vibe.app review stays explicit",
      ],
    }),
    lane({
      id: "provider-pressure",
      label: "Provider pressure",
      value: top ? `${pct(concentration)} focus` : "0% focus",
      status: top?.provider ?? "none",
      route: "provider spend share",
      note: top ? `${top.provider} holds the largest public estimated spend share.` : "No provider rows yet.",
      guardrail: "Focus is context; it does not add or remove spend.",
      impact: "estimate",
      tone: "provider",
      meter: clampMeter(concentration, 100, 10),
      ...topBrand,
      lines: [
        `top ${top?.provider ?? "none"} // share ${pct(concentration)}`,
        `providers ${int(profile.providers.length)} // total ${money(totalUsd)}`,
        "pressure rail points to review, not mutation",
      ],
    }),
    lane({
      id: "expensive-workflow",
      label: "Expensive workflow",
      value: expensive ? expensive.provider : "n/a",
      status: expensive ? rate(expensive.usdPerOp) : "no rate",
      route: "usd_per_op",
      note: expensive ? "The highest observed USD/op gets a visible review rail." : "Need provider rows with USD and operations.",
      guardrail: cheapest ? `Compare against ${cheapest.provider}; estimates do not rewrite usage.` : "Comparison waits for rated provider rows.",
      impact: "estimate",
      tone: "risk",
      meter: expensive ? clampMeter(expensive.usdPerOp, rated.length ? Math.max(...rated.map((provider) => provider.usdPerOp)) : 1, 18) : 8,
      ...expensiveBrand,
      lines: [
        `expensive ${expensive?.provider ?? "n/a"} // ${expensive ? rate(expensive.usdPerOp) : "no rate"}`,
        `cheapest ${cheapest?.provider ?? "n/a"} // ${cheapest ? rate(cheapest.usdPerOp) : "no rate"}`,
        "review workflow; do not auto-shift spend",
      ],
    }),
    lane({
      id: "local-shadow",
      label: "Local shadow",
      value: localOps ? money(localShadow) : "$0.00",
      status: localOps ? `${int(localOps)} local ops` : "no local ops",
      route: "local equivalent",
      note: "NOT SPEND. Local value uses non-local observed USD/op only as planning context.",
      guardrail: "Local shadow never counts as billable spend, credits, rank, or verified usage.",
      impact: "not_spend",
      tone: "local",
      meter: localOps ? clampMeter(localShadow, maxMoney, 14) : 8,
      ...localBrand,
      lines: [
        `local ${int(localOps)} ops // shadow ${money(localShadow)}`,
        "NOT SPEND // context only // +0 usage total",
        "local-first savings stay visibly separate",
      ],
    }),
    lane({
      id: "review-gate",
      label: "Review gate",
      value: latest ? "ready" : "waiting",
      status: "0 writes",
      route: "c0vibe.app",
      note: "Publishing remains an explicit aggregate review, never a hidden upload.",
      guardrail: "NO WRITE. Budget pulse renders guidance and writes zero records.",
      impact: "no_write",
      tone: "review",
      meter: latest ? 100 : 18,
      ...c0Brand,
      lines: [
        "review before publish // hiddenUploads 0",
        "promptReads 0 // outputReads 0 // writes 0",
        "Vibers Unite // c0vibe.app",
      ],
    }),
  ];

  const estimates = lanes.filter((item) => item.impact === "estimate").length;
  const notSpend = lanes.filter((item) => item.impact === "not_spend").length;
  const noWrite = lanes.filter((item) => item.impact === "no_write").length;

  return {
    headline: latest ? `${money(projected30d)} budget pulse` : "Budget pulse waiting for usage",
    subline: "A no-write command bridge for burn rate, provider pressure, local shadow value, and explicit C0VIBE review.",
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine(`VTK://INSIGHTS-BUDGET-PULSE//@${profile.handle}//NO-WRITES`),
      frameLine(`pace ${money(dailyUsd)}/day // 30d ${money(projected30d)} // ops ${int(totalOps)}`),
      frameLine(`provider ${top?.provider ?? "none"} ${pct(concentration)} // expensive ${expensive?.provider ?? "n/a"}`),
      frameLine(`local shadow ${money(localShadow)} NOT SPEND // hiddenUploads 0`),
      frameLine(`estimate rails ${estimates} // notSpend ${notSpend} // noWrite ${noWrite}`),
      frameLine("promptReads 0 // outputReads 0 // totalMutations 0"),
      frameLine("Vibers Unite // c0vibe.app"),
      "+--------------------------------------------------------------+",
    ],
    totals: {
      lanes: lanes.length,
      estimates,
      notSpend,
      noWrite,
      usageWrites: 0,
      totalMutations: 0,
    },
    lanes,
  };
}

export function buildInsightsRoiSwitchboard(profile: ProfileView): InsightsRoiSwitchboard {
  const latest = profile.latest;
  const totalUsd = latest?.total_usd ?? 0;
  const dailyUsd = averageDailyUsd(profile);
  const projected30d = dailyUsd * 30;
  const budgetCapUsd = 500;
  const budgetOverage = latest ? Math.max(0, projected30d - budgetCapUsd) : 0;
  const rated = providersWithRate(profile);
  const cheapest = rated.slice().sort((a, b) => a.usdPerOp - b.usdPerOp || b.ops - a.ops)[0];
  const expensive = rated.slice().sort((a, b) => b.usdPerOp - a.usdPerOp || b.usd - a.usd)[0];
  const top = topProvider(profile);
  const concentration = top && totalUsd > 0 ? (top.usd / totalUsd) * 100 : 0;
  const forecastShare = top && totalUsd > 0 ? projected30d * (top.usd / totalUsd) : 0;
  const observedSwapSavings = expensive && cheapest ? Math.max(0, expensive.usd - expensive.ops * cheapest.usdPerOp) : 0;
  const localOps = profile.providers
    .filter((provider) => LOCAL_PROVIDERS.has(provider.provider.toLowerCase()))
    .reduce((sum, provider) => sum + provider.ops, 0);
  const nonLocalRated = rated.filter((provider) => !LOCAL_PROVIDERS.has(provider.provider.toLowerCase()));
  const nonLocalOps = nonLocalRated.reduce((sum, provider) => sum + provider.ops, 0);
  const nonLocalUsd = nonLocalRated.reduce((sum, provider) => sum + provider.usd, 0);
  const nonLocalRate = nonLocalOps ? nonLocalUsd / nonLocalOps : 0;
  const localShadow = localOps * nonLocalRate;
  const planningEstimateUsd = Math.round((budgetOverage + observedSwapSavings) * 100) / 100;
  const localShadowUsd = Math.round(localShadow * 100) / 100;
  const maxLeverValue = Math.max(projected30d, budgetOverage, observedSwapSavings, localShadow, forecastShare, 1);
  const c0Brand = brandParts("c0vibe");
  const expensiveBrand = brandParts(expensive?.provider ?? "higgsfield");
  const localBrand = brandParts(localOps ? "ollama" : "lmstudio");
  const topBrand = brandParts(top?.provider ?? "openai");

  const lever = (config: Omit<InsightsRoiSwitchLever, "screen" | "proof"> & { proof: string[] }): InsightsRoiSwitchLever => ({
    ...config,
    screen: [
      budgetFrame(config.mark, config.tone, config.impact === "not_spend" ? "not spend" : config.impact),
      budgetFrame(config.mark, config.value, config.status),
      budgetFrame(config.mark, "NO WRITE", "0 ROWS"),
    ],
    proof: config.proof.map((line) => line.slice(0, 58)),
  });

  const levers: InsightsRoiSwitchLever[] = [
    lever({
      id: "budget-cap",
      label: "Budget cap check",
      value: latest ? `${money(budgetOverage)} over` : "waiting",
      status: `${money(budgetCapUsd)} cap`,
      command: "npx vibetrack mission --budget 500",
      note: "Compares the current 30-day pace against a visible cap before the next renewal cycle.",
      guardrail: "ESTIMATE ONLY. The alarm writes zero usage rows and changes zero ranks.",
      impact: "estimate",
      tone: "cap",
      meter: latest ? clampMeter(budgetOverage, maxLeverValue, 12) : 8,
      ...c0Brand,
      proof: [
        `30d forecast ${money(projected30d)} against ${money(budgetCapUsd)} cap`,
        `planning delta ${money(budgetOverage)} // totalMutations 0`,
        "Vibers Unite // c0vibe.app // explicit review",
      ],
    }),
    lever({
      id: "rate-swap",
      label: "Rate swap candidate",
      value: expensive && cheapest ? money(observedSwapSavings) : "$0.00",
      status: expensive && cheapest ? `${expensive.provider} -> ${cheapest.provider}` : "no rated pair",
      command: "npx vibetrack compare",
      note: expensive && cheapest ? "Shows the observed delta if the highest USD/op work were reviewed against the cheapest observed rail." : "Needs two rated providers before VibeTRACKER can suggest a comparison.",
      guardrail: "Review hint only. It never moves work, uploads prompts, or rewrites spend.",
      impact: "estimate",
      tone: "swap",
      meter: expensive ? clampMeter(observedSwapSavings, expensive.usd, 16) : 8,
      ...expensiveBrand,
      proof: [
        `expensive ${expensive?.provider ?? "n/a"} ${expensive ? rate(expensive.usdPerOp) : "no-rate"}`,
        `cheapest ${cheapest?.provider ?? "n/a"} ${cheapest ? rate(cheapest.usdPerOp) : "no-rate"}`,
        "dryRun=true // promptReads 0 // outputReads 0",
      ],
    }),
    lever({
      id: "local-repeat",
      label: "Local repeat lane",
      value: localOps ? money(localShadow) : "$0.00",
      status: localOps ? `${int(localOps)} local ops` : "no local ops",
      command: "npx vibetrack life",
      note: "Highlights repeatable Ollama, LM Studio, ComfyUI, or local model work without calling it spend.",
      guardrail: "NOT SPEND. Local shadow value stays separate from billable usage, credits, and score.",
      impact: "not_spend",
      tone: "local",
      meter: localOps ? clampMeter(localShadow, maxLeverValue, 14) : 8,
      ...localBrand,
      proof: [
        `local ops ${int(localOps)} // non-local context ${nonLocalRate ? rate(nonLocalRate) : "no-rate"}`,
        `shadow ${money(localShadow)} // NOT SPEND // +0 usage`,
        "local-only label stays visible on every surface",
      ],
    }),
    lever({
      id: "provider-mix",
      label: "Provider mix pressure",
      value: top ? `${money(forecastShare)}/30d` : "$0.00/30d",
      status: top ? `${pct(concentration)} ${top.provider}` : "no provider",
      command: "npx vibetrack stats --by provider",
      note: "Projects the current top-provider share onto the 30-day forecast so subscriptions and lock-in are visible.",
      guardrail: "Provider pressure is context. It does not add, remove, or reclassify usage.",
      impact: "estimate",
      tone: "focus",
      meter: clampMeter(concentration, 100, 10),
      ...topBrand,
      proof: [
        `top provider ${top?.provider ?? "none"} // share ${pct(concentration)}`,
        `forecast share ${money(forecastShare)} // total ${money(totalUsd)}`,
        "decision surface only // usageWrites 0",
      ],
    }),
    lever({
      id: "publish-proof",
      label: "Publish proof lock",
      value: latest ? "review ready" : "waiting",
      status: "0 writes",
      command: "npx vibetrack upload --dry-run",
      note: "Keeps score, public profile, badges, and leaderboard sync behind an explicit aggregate preview.",
      guardrail: "NO WRITE. This switchboard cannot publish, upload hidden data, or mutate totals.",
      impact: "no_write",
      tone: "publish",
      meter: latest ? 100 : 18,
      ...c0Brand,
      proof: [
        "hiddenUploads 0 // promptReads 0 // outputReads 0",
        "public profile changes require separate reviewed sync",
        "C0vibe.app stays downstream of explicit proof",
      ],
    }),
  ];
  const estimates = levers.filter((item) => item.impact === "estimate").length;
  const notSpend = levers.filter((item) => item.impact === "not_spend").length;
  const noWrite = levers.filter((item) => item.impact === "no_write").length;

  return {
    headline: latest ? `${money(planningEstimateUsd)} planning delta visible` : "ROI switchboard waiting for usage",
    subline: "Estimate-only decision levers for budget caps, provider swaps, local repeat work, mix pressure, and explicit C0VIBE publish review.",
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine(`VTK://INSIGHTS-ROI-SWITCHBOARD//@${profile.handle}//NO-WRITES`),
      frameLine(`budget cap ${money(budgetCapUsd)} // forecast ${money(projected30d)} // over ${money(budgetOverage)}`),
      frameLine(`rate swap ${expensive?.provider ?? "n/a"} -> ${cheapest?.provider ?? "n/a"} // ${money(observedSwapSavings)}`),
      frameLine(`local repeat ${money(localShadow)} NOT SPEND // provider mix ${pct(concentration)}`),
      frameLine(`planning delta ${money(planningEstimateUsd)} // local shadow ${money(localShadowUsd)}`),
      frameLine("hiddenUploads 0 // promptReads 0 // totalMutations 0"),
      frameLine("Vibers Unite // c0vibe.app // switchboard writes 0 rows"),
      "+--------------------------------------------------------------+",
    ],
    totals: {
      levers: levers.length,
      estimates,
      notSpend,
      noWrite,
      usageWrites: 0,
      totalMutations: 0,
      planningEstimateUsd,
      localShadowUsd,
    },
    levers,
  };
}

export function buildInsightsPrivateScopeRadar(profile: ProfileView): InsightsPrivateScopeRadar {
  const latest = profile.latest;
  const totalOps = latest?.record_count ?? 0;
  const hasUsage = totalOps > 0;
  const accountBrand = brandParts("codex-cli");
  const profileBrand = brandParts("higgsfield");
  const teamBrand = brandParts("ollama");
  const publishBrand = brandParts("c0vibe");

  const lane = (config: Omit<InsightsPrivateScopeLane, "frames" | "proof"> & { proof: string[] }): InsightsPrivateScopeLane => ({
    ...config,
    frames: [
      budgetFrame(config.mark, config.tone, config.impact === "private" ? "private" : "no write"),
      budgetFrame(config.mark, config.value, config.status),
      budgetFrame(config.mark, "PUBLIC", config.id === "publish" ? "REVIEW" : "NO RANK"),
    ],
    proof: config.proof.map((line) => line.slice(0, 58)),
  });

  const lanes: InsightsPrivateScopeLane[] = [
    lane({
      id: "account",
      label: "Account rail",
      value: hasUsage ? "accountId" : "waiting",
      status: "local filter",
      command: "npx vibetrack stats --account <id>",
      note: "Separate personal, client, and vendor accounts without changing public usage totals.",
      guardrail: "PRIVATE. Account labels stay in local filters unless the user exports an aggregate.",
      impact: "private",
      tone: "account",
      meter: hasUsage ? 94 : 10,
      ...accountBrand,
      proof: [
        "accountId is a local usage partition",
        "public profile sees reviewed aggregate totals only",
        "trust sidecars stay NOT USAGE",
      ],
    }),
    lane({
      id: "profile",
      label: "Provider profile",
      value: hasUsage ? "profileId" : "waiting",
      status: "usage split",
      command: "npx vibetrack stats --profile <id>",
      note: "Track creator, coding, research, and local-lab profiles as separate private rails.",
      guardrail: "PRIVATE. Profile splits explain usage shape; they do not promote public rank.",
      impact: "private",
      tone: "profile",
      meter: hasUsage ? 90 : 10,
      ...profileBrand,
      proof: [
        "profileId filters usage rows before publish review",
        "raw prompts, outputs, files, and secrets remain blocked",
        "C0VIBE relay waits for explicit upload review",
      ],
    }),
    lane({
      id: "team",
      label: "Team / org split",
      value: hasUsage ? "teamId" : "waiting",
      status: "private scope",
      command: "npx vibetrack stats --team <id>",
      note: "Keep solo, studio, agency, research, and company usage separated for budget decisions.",
      guardrail: "PRIVATE. Team/org scope is usage-only context; it is not a trust badge.",
      impact: "private",
      tone: "team",
      meter: hasUsage ? 88 : 10,
      ...teamBrand,
      proof: [
        "teamId keeps org usage separate in local stats",
        "budget and burn-rate decisions can target one team",
        "rankMutations 0 // publicWrites 0",
      ],
    }),
    lane({
      id: "publish",
      label: "Public aggregate",
      value: hasUsage ? "review" : "waiting",
      status: "0 writes",
      command: "npx vibetrack upload --dry-run",
      note: "Only reviewed aggregate usage and explicit trust context leave the private scope radar.",
      guardrail: "NO WRITE. This radar cannot publish, upload hidden data, or change ranks.",
      impact: "no_write",
      tone: "publish",
      meter: hasUsage ? 100 : 18,
      ...publishBrand,
      proof: [
        "hiddenUploads 0 // publicWrites 0",
        "rankMutations 0 // promptReads 0 // outputReads 0",
        "Vibers Unite // c0vibe.app after review",
      ],
    }),
  ];
  const privateRails = lanes.filter((item) => item.impact === "private").length;

  return {
    headline: hasUsage ? "Private scope radar armed" : "Private scope radar waiting",
    subline: "A local-only command surface for account, profile, and team/org separation before any C0VIBE publish step.",
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine(`VTK://INSIGHTS-PRIVATE-SCOPE//@${profile.handle}//LOCAL-ONLY`),
      frameLine(`records ${int(totalOps)} // account profile team filters stay private`),
      frameLine(`scope rails ${privateRails} // publicWrites 0 // rankMutations 0`),
      frameLine("accountId -> profileId -> teamId -> dry-run review"),
      frameLine("trust sidecars stay NOT USAGE // hiddenUploads 0"),
      frameLine("promptReads 0 // outputReads 0 // no raw content export"),
      frameLine("Vibers Unite // c0vibe.app only after review"),
      "+--------------------------------------------------------------+",
    ],
    totals: {
      lanes: lanes.length,
      privateRails,
      publicWrites: 0,
      rankMutations: 0,
      hiddenUploads: 0,
    },
    lanes,
  };
}
