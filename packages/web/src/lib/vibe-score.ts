import type { ProfileView } from "./data.ts";
import { profileOps } from "./profile-ops.ts";

export type VibeScoreTone = "usage" | "rhythm" | "coverage" | "freshness" | "trust";
export type VibeScoreImpact = "score" | "not_usage";

export interface VibeScoreFactor {
  id: "usage" | "rhythm" | "coverage" | "freshness" | "trust";
  label: string;
  value: string;
  note: string;
  points: number;
  max: number;
  tone: VibeScoreTone;
  impact: VibeScoreImpact;
}

export interface VibeScoreReceipt {
  score: number;
  tier: "offline" | "warming" | "active" | "heavy" | "legend";
  headline: string;
  subline: string;
  terminalLines: string[];
  factors: VibeScoreFactor[];
  shareLine: string;
}

export interface VibeScoreReactorRail {
  id: VibeScoreFactor["id"];
  label: string;
  value: string;
  code: string;
  tone: VibeScoreTone;
  impact: VibeScoreImpact;
  points: number;
  max: number;
  meter: number;
  signal: string;
  note: string;
  guardrail: string;
}

export interface VibeScoreReactor {
  headline: string;
  subline: string;
  terminalLines: string[];
  score: number;
  tier: VibeScoreReceipt["tier"];
  seal: string;
  shareLine: string;
  signalRows: string[];
  rails: VibeScoreReactorRail[];
  guardrails: string[];
}

export type VibeScoreMixerTone = VibeScoreTone | "publish";
export type VibeScoreMixerStatus = "scores" | "context" | "publishes";

export interface VibeScoreMixerLane {
  id: "accepted-records" | "daily-heatgrid" | "provider-map" | "freshness" | "trust-side-rail" | "public-surfaces";
  label: string;
  source: string;
  value: string;
  contribution: string;
  route: string;
  status: VibeScoreMixerStatus;
  statusLabel: string;
  tone: VibeScoreMixerTone;
  points: number;
  max: number;
  meter: number;
  terminalLines: string[];
  note: string;
}

export interface VibeScoreMixerOutput {
  label: string;
  value: string;
  route: string;
  note: string;
}

export interface VibeScoreMixerConsole {
  headline: string;
  subline: string;
  score: number;
  tier: VibeScoreReceipt["tier"];
  seal: string;
  terminalLines: string[];
  lanes: VibeScoreMixerLane[];
  outputs: VibeScoreMixerOutput[];
  invariants: string[];
}

export type VibeScoreCalibrationTone = VibeScoreMixerTone;
export type VibeScoreCalibrationImpact = VibeScoreImpact | "publish";

export interface VibeScoreCalibrationStep {
  id: "usage-mass" | "daily-rhythm" | "provider-breadth" | "freshness-decay" | "trust-quarantine" | "public-seal";
  call: string;
  label: string;
  tone: VibeScoreCalibrationTone;
  impact: VibeScoreCalibrationImpact;
  statusLabel: string;
  source: string;
  formula: string;
  value: string;
  delta: string;
  meter: number;
  frames: string[];
  checklist: string[];
  guardrail: string;
}

export interface VibeScoreCalibrationChamber {
  headline: string;
  subline: string;
  score: number;
  tier: VibeScoreReceipt["tier"];
  seal: string;
  terminalLines: string[];
  steps: VibeScoreCalibrationStep[];
  totals: {
    steps: number;
    scoreSteps: number;
    notUsage: number;
    publish: number;
    scoreDelta: number;
    trustDelta: number;
    usageWrites: number;
    publicWrites: number;
    averageMeter: number;
  };
}

function int(value: number): string {
  return value.toLocaleString("en-US");
}

function money(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function scoreTier(score: number): VibeScoreReceipt["tier"] {
  if (score <= 0) return "offline";
  if (score < 30) return "warming";
  if (score < 60) return "active";
  if (score < 85) return "heavy";
  return "legend";
}

function daysSince(iso: string | null | undefined): number | null {
  const parsed = Date.parse(iso ?? "");
  if (!Number.isFinite(parsed)) return null;
  const age = Date.now() - parsed;
  return Math.max(0, Math.floor(age / 86_400_000));
}

function usagePoints(ops: number, usd: number): number {
  if (ops <= 0 && usd <= 0) return 0;
  const opsScore = Math.min(28, Math.log10(ops + 1) * 9);
  const spendScore = Math.min(12, Math.log10(usd + 1) * 7);
  return Math.round(opsScore + spendScore);
}

function rhythmPoints(activeDays: number): number {
  if (activeDays <= 0) return 0;
  return Math.min(22, Math.round(Math.log2(activeDays + 1) * 6));
}

function coveragePoints(providers: number): number {
  if (providers <= 0) return 0;
  return Math.min(18, 4 + providers * 4);
}

function freshnessPoints(ageDays: number | null): number {
  if (ageDays == null) return 0;
  if (ageDays <= 1) return 12;
  if (ageDays <= 7) return 9;
  if (ageDays <= 30) return 5;
  return 1;
}

function trustContextPoints(trustSignals: number): number {
  return trustSignals ? Math.min(8, 2 + trustSignals * 2) : 0;
}

function line(text: string, width = 52): string {
  const clipped = text.length > width ? text.slice(0, width) : text;
  return `| ${clipped.padEnd(width)} |`;
}

function mixerLine(text: string, width = 62): string {
  const clipped = text.length > width ? text.slice(0, width) : text;
  return `| ${clipped.padEnd(width)} |`;
}

function calibrationLine(text: string, width = 66): string {
  const clipped = text.length > width ? text.slice(0, width) : text;
  return `| ${clipped.padEnd(width)} |`;
}

function calibrationFrames(lines: string[]): string[] {
  return lines.map((entry) => {
    const clipped = entry.length > 34 ? entry.slice(0, 34) : entry;
    return `> ${clipped.padEnd(34)} <`;
  });
}

function signalBar(meter: number, width = 14): string {
  const filled = Math.max(0, Math.min(width, Math.round((meter / 100) * width)));
  return `${"#".repeat(filled)}${".".repeat(width - filled)}`;
}

function factorMeter(factor: VibeScoreFactor): number {
  if (!factor.max) return 0;
  return clamp(Math.round((factor.points / factor.max) * 100));
}

function factorCode(factor: VibeScoreFactor): string {
  if (factor.id === "trust") return "trust.sideRail.notUsage";
  if (factor.id === "usage") return "usage.accepted.records";
  if (factor.id === "rhythm") return "usage.daily.rhythm";
  if (factor.id === "coverage") return "provider.coverage";
  return "upload.freshness";
}

function stableSeal(parts: string[]): string {
  let hash = 2166136261;
  for (const char of parts.join("//")) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, "0").slice(0, 8).toUpperCase();
}

export function buildVibeScoreReceipt(profile: ProfileView): VibeScoreReceipt {
  const ops = profileOps(profile);
  const usd = profile.latest?.total_usd ?? 0;
  const providerCount = profile.providers.length;
  const activeDays = profile.usageDays.filter((day) => day.ops > 0).length || (profile.latest ? 1 : 0);
  const age = daysSince(profile.latest?.created_at);
  const trustSignals = profile.trustSignals.length;

  const usage = usagePoints(ops, usd);
  const rhythm = rhythmPoints(activeDays);
  const coverage = coveragePoints(providerCount);
  const freshness = freshnessPoints(age);
  const trust = trustContextPoints(trustSignals);
  const score = profile.latest ? clamp(usage + rhythm + coverage + freshness) : 0;
  const tier = scoreTier(score);

  const factors: VibeScoreFactor[] = [
    {
      id: "usage",
      label: "Usage mass",
      value: `${int(ops)} ops`,
      note: `${money(usd)} estimated spend from accepted usage records.`,
      points: usage,
      max: 40,
      tone: "usage",
      impact: "score",
    },
    {
      id: "rhythm",
      label: "Daily rhythm",
      value: `${int(activeDays)} active day${activeDays === 1 ? "" : "s"}`,
      note: profile.usageDays.length ? "Fed by daily aggregate rows." : "Upload-day fallback until daily rows exist.",
      points: rhythm,
      max: 22,
      tone: "rhythm",
      impact: "score",
    },
    {
      id: "coverage",
      label: "Source breadth",
      value: `${int(providerCount)} provider${providerCount === 1 ? "" : "s"}`,
      note: "Provider spread from the public usage datastream.",
      points: coverage,
      max: 18,
      tone: "coverage",
      impact: "score",
    },
    {
      id: "freshness",
      label: "Freshness",
      value: age == null ? "not synced" : `${int(age)}d old`,
      note: "Recent reviewed uploads score higher than stale profiles.",
      points: freshness,
      max: 12,
      tone: "freshness",
      impact: "score",
    },
    {
      id: "trust",
      label: "Trust side rail",
      value: `${int(trustSignals)} signal${trustSignals === 1 ? "" : "s"}`,
      note: "NOT USAGE. Context only; adds +0 score and never changes spend, credits, ops, rank, or verified status.",
      points: trust,
      max: 8,
      tone: "trust",
      impact: "not_usage",
    },
  ];

  const headline = profile.latest
    ? `${score}/100 ${tier.toUpperCase()} Vibe Score`
    : "Vibe Score waiting for first reviewed upload";
  const subline = profile.latest
    ? "A public proof receipt from usage mass, daily rhythm, source breadth, freshness, and a clearly labelled trust side rail."
    : "Run the local wizard, review the upload, and this receipt will light up from the real datastream.";

  return {
    score,
    tier,
    headline,
    subline,
    terminalLines: [
      `VTK://VIBE-SCORE//${tier.toUpperCase()}//C0VIBE.APP`,
      `score ${String(score).padStart(3, "0")}/100 // usage ${usage}/40 // rhythm ${rhythm}/22`,
      `sources ${coverage}/18 // fresh ${freshness}/12 // trust ${trust}/8 +0 SCORE`,
      "Vibers Unite // profile proof receipt // no fake spend",
    ],
    factors,
    shareLine: profile.latest
      ? `@${profile.handle} has a ${score}/100 Vibe Score on c0vibe.app`
      : `@${profile.handle} has not published a Vibe Score yet`,
  };
}

export function buildVibeScoreCalibrationChamber(
  profile: ProfileView,
  receipt: VibeScoreReceipt = buildVibeScoreReceipt(profile),
  reactor: VibeScoreReactor = buildVibeScoreReactor(profile, receipt),
): VibeScoreCalibrationChamber {
  const factorById = new Map(receipt.factors.map((factor) => [factor.id, factor]));
  const usage = factorById.get("usage");
  const rhythm = factorById.get("rhythm");
  const coverage = factorById.get("coverage");
  const freshness = factorById.get("freshness");
  const trust = factorById.get("trust");
  const ops = profileOps(profile);
  const usd = profile.latest?.total_usd ?? 0;
  const providerRows = profile.providers.length;
  const dailyRows = profile.usageDays.length;
  const activeDays = profile.usageDays.filter((day) => day.ops > 0).length || (profile.latest ? 1 : 0);
  const trustSignals = profile.trustSignals.length;
  const reviewedAge = daysSince(profile.latest?.created_at);
  const border = `+${"-".repeat(68)}+`;

  const steps: VibeScoreCalibrationStep[] = [
    {
      id: "usage-mass",
      call: "01",
      label: "Usage mass",
      tone: "usage",
      impact: "score",
      statusLabel: "SCORE",
      source: "accepted usage rows",
      formula: "min(28, log10(ops+1)*9) + min(12, log10(usd+1)*7)",
      value: `${int(ops)} ops // ${money(usd)}`,
      delta: `+${usage?.points ?? 0} score`,
      meter: usage ? factorMeter(usage) : 0,
      frames: calibrationFrames([
        `rows ${int(ops)} // spend ${money(usd)}`,
        `mass ${signalBar(usage ? factorMeter(usage) : 0)}`,
        `delta +${usage?.points ?? 0}/${usage?.max ?? 40}`,
      ]),
      checklist: ["reviewed aggregate", "pricing table applied", "prompt bodies excluded", "score rail"],
      guardrail: "Only accepted aggregate usage can increase this rail.",
    },
    {
      id: "daily-rhythm",
      call: "02",
      label: "Daily rhythm",
      tone: "rhythm",
      impact: "score",
      statusLabel: "SCORE",
      source: "daily aggregate rows",
      formula: "min(22, round(log2(activeDays+1)*6))",
      value: `${int(activeDays)} active day${activeDays === 1 ? "" : "s"}`,
      delta: `+${rhythm?.points ?? 0} score`,
      meter: rhythm ? factorMeter(rhythm) : 0,
      frames: calibrationFrames([
        `days ${int(dailyRows)} // active ${int(activeDays)}`,
        `beat ${signalBar(rhythm ? factorMeter(rhythm) : 0)}`,
        `delta +${rhythm?.points ?? 0}/${rhythm?.max ?? 22}`,
      ]),
      checklist: ["daily aggregates", "heatgrid source", "upload fallback labelled", "score rail"],
      guardrail: "The rhythm rail fades when daily rows are missing instead of inventing cadence.",
    },
    {
      id: "provider-breadth",
      call: "03",
      label: "Provider breadth",
      tone: "coverage",
      impact: "score",
      statusLabel: "SCORE",
      source: "provider usage rows",
      formula: "min(18, 4 + providers*4)",
      value: `${int(providerRows)} provider${providerRows === 1 ? "" : "s"}`,
      delta: `+${coverage?.points ?? 0} score`,
      meter: coverage ? factorMeter(coverage) : 0,
      frames: calibrationFrames([
        `providers ${profile.providers.map((provider) => provider.provider).slice(0, 2).join("+") || "none"}`,
        `map ${signalBar(coverage ? factorMeter(coverage) : 0)}`,
        `delta +${coverage?.points ?? 0}/${coverage?.max ?? 18}`,
      ]),
      checklist: ["provider rows", "branded panels", "no duplicate padding", "score rail"],
      guardrail: "Provider breadth rewards real connected sources, not visual badges.",
    },
    {
      id: "freshness-decay",
      call: "04",
      label: "Freshness decay",
      tone: "freshness",
      impact: "score",
      statusLabel: "SCORE",
      source: "latest reviewed upload",
      formula: "age bucket: <=1d 12, <=7d 9, <=30d 5, stale 1",
      value: reviewedAge == null ? "not synced" : `${int(reviewedAge)}d since review`,
      delta: `+${freshness?.points ?? 0} score`,
      meter: freshness ? factorMeter(freshness) : 0,
      frames: calibrationFrames([
        `review age ${reviewedAge == null ? "none" : `${int(reviewedAge)}d`}`,
        `fresh ${signalBar(freshness ? factorMeter(freshness) : 0)}`,
        `delta +${freshness?.points ?? 0}/${freshness?.max ?? 12}`,
      ]),
      checklist: ["review timestamp", "stale fade", "offline safe", "score rail"],
      guardrail: "Old profiles dim gracefully; they do not receive synthetic activity.",
    },
    {
      id: "trust-quarantine",
      call: "05",
      label: "Trust quarantine",
      tone: "trust",
      impact: "not_usage",
      statusLabel: "NOT USAGE",
      source: "trust side rail",
      formula: "display context only; score delta fixed to 0",
      value: `${int(trustSignals)} trust signal${trustSignals === 1 ? "" : "s"}`,
      delta: "+0 score",
      meter: trust ? factorMeter(trust) : 0,
      frames: calibrationFrames([
        `signals ${int(trustSignals)} // side rail`,
        `trust ${signalBar(trust ? factorMeter(trust) : 0)}`,
        "delta +0 // locked",
      ]),
      checklist: ["visible context", "separate label", "0 usage writes", "0 rank writes"],
      guardrail: "Trust cannot mutate score, spend, credits, ops, rank, or verified status.",
    },
    {
      id: "public-seal",
      call: "06",
      label: "Public seal",
      tone: "publish",
      impact: "publish",
      statusLabel: "OUTPUT",
      source: "stable score receipt",
      formula: "receipt -> profile, score lab, heatgrid, trust labels",
      value: `seal ${reactor.seal}`,
      delta: "0 writes",
      meter: receipt.score,
      frames: calibrationFrames([
        `score ${String(receipt.score).padStart(3, "0")}/100 // ${receipt.tier}`,
        `seal ${reactor.seal}`,
        "publish dry-run only",
      ]),
      checklist: ["same receipt", "profile ready", "heatgrid ready", "dry-run before upload"],
      guardrail: "This visual chamber writes no public data; upload still requires reviewed dry-run.",
    },
  ];
  const scoreDelta = (usage?.points ?? 0) + (rhythm?.points ?? 0) + (coverage?.points ?? 0) + (freshness?.points ?? 0);
  const averageMeter = steps.length
    ? Math.round(steps.reduce((total, step) => total + step.meter, 0) / steps.length)
    : 0;

  return {
    headline: "Score calibration chamber",
    subline: "Every score mutation is stepped in public: four usage-derived score rails, one quarantined trust rail, and one dry-run public seal.",
    score: receipt.score,
    tier: receipt.tier,
    seal: reactor.seal,
    terminalLines: [
      border,
      calibrationLine("VTK://SCORE-CALIBRATION//FORMULA-CHAMBER//NOT-USAGE"),
      calibrationLine(`score ${String(receipt.score).padStart(3, "0")}/100 // tier ${receipt.tier} // seal ${reactor.seal}`),
      calibrationLine("usage + rhythm + coverage + freshness -> score"),
      calibrationLine("trust quarantine -> +0 score // public writes 0"),
      calibrationLine("calibration writes 0 usage rows and 0 public rows"),
      calibrationLine("Vibers Unite // c0vibe.app // inspectable formula"),
      border,
    ],
    steps,
    totals: {
      steps: steps.length,
      scoreSteps: steps.filter((step) => step.impact === "score").length,
      notUsage: steps.filter((step) => step.impact === "not_usage").length,
      publish: steps.filter((step) => step.impact === "publish").length,
      scoreDelta,
      trustDelta: 0,
      usageWrites: 0,
      publicWrites: 0,
      averageMeter,
    },
  };
}

export function buildVibeScoreMixerConsole(
  profile: ProfileView,
  receipt: VibeScoreReceipt = buildVibeScoreReceipt(profile),
  reactor: VibeScoreReactor = buildVibeScoreReactor(profile, receipt),
): VibeScoreMixerConsole {
  const factorById = new Map(receipt.factors.map((factor) => [factor.id, factor]));
  const usage = factorById.get("usage");
  const rhythm = factorById.get("rhythm");
  const coverage = factorById.get("coverage");
  const freshness = factorById.get("freshness");
  const trust = factorById.get("trust");
  const dailyRows = profile.usageDays.length;
  const providerRows = profile.providers.length;
  const trustSignals = profile.trustSignals.length;
  const latestTier = profile.latest?.tier ?? "none";

  const lane = (
    config: Omit<VibeScoreMixerLane, "terminalLines"> & { lines: string[] },
  ): VibeScoreMixerLane => ({
    ...config,
    terminalLines: [
      mixerLine(config.label),
      mixerLine(config.route),
      ...config.lines.map((entry) => mixerLine(entry)),
    ],
  });

  const lanes: VibeScoreMixerLane[] = [
    lane({
      id: "accepted-records",
      label: "Accepted usage rows",
      source: "vibetracker_submissions",
      value: usage?.value ?? "0 ops",
      contribution: `${usage?.points ?? 0}/${usage?.max ?? 40} score`,
      route: "submission totals -> usage mass",
      status: "scores",
      statusLabel: "SCORES",
      tone: "usage",
      points: usage?.points ?? 0,
      max: usage?.max ?? 40,
      meter: usage ? factorMeter(usage) : 0,
      lines: [
        `${money(profile.latest?.total_usd ?? 0)} estimate // ${int(profile.latest?.total_credits ?? 0)} credits`,
        "accepted records only; no prompt/output bodies",
      ],
      note: "This is the main score rail: reviewed aggregate usage, never raw content.",
    }),
    lane({
      id: "daily-heatgrid",
      label: "Daily heatgrid rhythm",
      source: "vibetracker_submission_daily_usage",
      value: rhythm?.value ?? "0 active days",
      contribution: `${rhythm?.points ?? 0}/${rhythm?.max ?? 22} score`,
      route: "daily rows -> heatgrid -> rhythm",
      status: "scores",
      statusLabel: "SCORES",
      tone: "rhythm",
      points: rhythm?.points ?? 0,
      max: rhythm?.max ?? 22,
      meter: rhythm ? factorMeter(rhythm) : 0,
      lines: [
        `${int(dailyRows)} aggregate day row${dailyRows === 1 ? "" : "s"}`,
        dailyRows ? "same rows power the public heatgrid" : "upload-day fallback until rows exist",
      ],
      note: "The GitHub-style heatgrid and rhythm score read the same daily aggregate stream.",
    }),
    lane({
      id: "provider-map",
      label: "Provider breadth map",
      source: "vibetracker_submission_providers",
      value: coverage?.value ?? "0 providers",
      contribution: `${coverage?.points ?? 0}/${coverage?.max ?? 18} score`,
      route: "provider rows -> source breadth",
      status: "scores",
      statusLabel: "SCORES",
      tone: "coverage",
      points: coverage?.points ?? 0,
      max: coverage?.max ?? 18,
      meter: coverage ? factorMeter(coverage) : 0,
      lines: [
        `${int(providerRows)} provider row${providerRows === 1 ? "" : "s"} // tier ${latestTier}`,
        "brand panels and profile chips reuse this source",
      ],
      note: "Coverage rewards real provider diversity while keeping every provider label inspectable.",
    }),
    lane({
      id: "freshness",
      label: "Reviewed upload freshness",
      source: "latest.created_at",
      value: freshness?.value ?? "not synced",
      contribution: `${freshness?.points ?? 0}/${freshness?.max ?? 12} score`,
      route: "latest reviewed upload -> freshness",
      status: "scores",
      statusLabel: "SCORES",
      tone: "freshness",
      points: freshness?.points ?? 0,
      max: freshness?.max ?? 12,
      meter: freshness ? factorMeter(freshness) : 0,
      lines: [
        `public receipt tier ${latestTier}`,
        "stale profiles fade instead of inventing activity",
      ],
      note: "Freshness is scoreable because it is derived from a reviewed upload timestamp.",
    }),
    lane({
      id: "trust-side-rail",
      label: "Trust side rail",
      source: "vibetracker_submission_trust_signals",
      value: trust?.value ?? "0 signals",
      contribution: "+0 score",
      route: "trust signals -> labelled context",
      status: "context",
      statusLabel: "NOT USAGE",
      tone: "trust",
      points: trust?.points ?? 0,
      max: trust?.max ?? 8,
      meter: trust ? factorMeter(trust) : 0,
      lines: [
        `${int(trustSignals)} evidence signal${trustSignals === 1 ? "" : "s"} // display only`,
        "changes 0 spend, 0 credits, 0 ops, 0 rank",
      ],
      note: "GitHub, Higgsfield MCP, package, and social proof signals explain context beside the score without changing it.",
    }),
    lane({
      id: "public-surfaces",
      label: "Public surface fanout",
      source: "buildVibeScoreReceipt",
      value: `${receipt.score}/100`,
      contribution: "profile + score + heatgrid",
      route: "one receipt -> all public surfaces",
      status: "publishes",
      statusLabel: "OUTPUT",
      tone: "publish",
      points: receipt.score,
      max: 100,
      meter: receipt.score,
      lines: [
        `seal ${reactor.seal} // ${receipt.tier}`,
        "Vibers Unite // C0vibe.app after review",
      ],
      note: "The public profile, score lab, and heatgrid should explain the same reviewed aggregate receipt.",
    }),
  ];

  return {
    headline: "Score mixer console",
    subline: "A source-to-surface view of the Vibe Score pipeline: four scoring rails, one trust context rail, and one public fanout rail.",
    score: receipt.score,
    tier: receipt.tier,
    seal: reactor.seal,
    terminalLines: [
      "+----------------------------------------------------------------+",
      mixerLine(`VTK://SCORE-MIXER//${receipt.tier.toUpperCase()}//C0VIBE.APP`),
      mixerLine(`score ${String(receipt.score).padStart(3, "0")}/100 // seal ${reactor.seal} // @${profile.handle}`),
      mixerLine("usage + rhythm + coverage + freshness -> score"),
      mixerLine("trust side rail -> context only -> +0 score"),
      mixerLine("profile, score lab, heatgrid read one reviewed receipt"),
      mixerLine("Vibers Unite // no fake spend // no prompt bodies"),
      "+----------------------------------------------------------------+",
    ],
    lanes,
    outputs: [
      {
        label: "Public profile",
        value: `@${profile.handle}`,
        route: "/u/[handle]",
        note: "Profile cards consume the same reviewed aggregate receipt.",
      },
      {
        label: "Vibe Score",
        value: `${receipt.score}/100`,
        route: "/score",
        note: "The score lab shows formula rails and guardrails.",
      },
      {
        label: "Heatgrid",
        value: `${int(dailyRows)} daily rows`,
        route: "daily://heatgrid",
        note: "Daily aggregates animate the GitHub-style heatgrid and rhythm rail.",
      },
      {
        label: "Trust rail",
        value: `${int(trustSignals)} signals`,
        route: "trust://side-rail",
        note: "Trust proof is shown beside usage and remains labelled NOT USAGE.",
      },
    ],
    invariants: [
      "Trust signals add +0 score and +0 usage totals.",
      "All score inputs are reviewed aggregates; prompts and outputs never enter public pages.",
      "Offline profiles render a zero score instead of synthetic usage.",
      "One datastream receipt feeds profile, score, heatgrid, and public context labels.",
    ],
  };
}

export function buildVibeScoreReactor(profile: ProfileView, receipt: VibeScoreReceipt = buildVibeScoreReceipt(profile)): VibeScoreReactor {
  const rails = receipt.factors.map<VibeScoreReactorRail>((factor) => {
    const meter = factorMeter(factor);
    return {
      id: factor.id,
      label: factor.label,
      value: factor.value,
      code: factorCode(factor),
      tone: factor.tone,
      impact: factor.impact,
      points: factor.points,
      max: factor.max,
      meter,
      signal: signalBar(meter),
      note: factor.note,
      guardrail: factor.impact === "not_usage"
        ? "Context rail only. It cannot change spend, credits, ops, rank, or verified status."
        : "Fed by reviewed usage aggregates from the public VibeTRACKER datastream.",
    };
  });
  const seal = stableSeal([
    profile.handle,
    String(receipt.score),
    receipt.tier,
    String(profileOps(profile)),
    String(profile.latest?.total_usd ?? 0),
    profile.providers.map((provider) => provider.provider).sort().join(","),
    String(profile.trustSignals.length),
  ]);
  const scoreBar = signalBar(receipt.score);
  const signalRows = [
    line(`score ${scoreBar} ${String(receipt.score).padStart(3, "0")}/100`),
    ...rails.map((rail) => line(`${rail.id.padEnd(9)} ${rail.signal} ${String(rail.points).padStart(2, "0")}/${String(rail.max).padStart(2, "0")} ${rail.impact === "not_usage" ? "NOT USAGE" : "SCORE"}`)),
  ];

  return {
    headline: profile.latest
      ? `${receipt.tier.toUpperCase()} score reactor`
      : "Score reactor waiting for first reviewed upload",
    subline: "An oscilloscope view of the exact score receipt: usage mass, rhythm, provider coverage, freshness, and a labelled trust side rail.",
    terminalLines: [
      "+------------------------------------------------------+",
      line(`VTK://SCORE-REACTOR//${receipt.tier.toUpperCase()}//C0VIBE.APP`),
      line(`seal ${seal} // handle @${profile.handle}`),
      line(`reactor ${String(receipt.score).padStart(3, "0")}/100 // ${receipt.tier}`),
      line(`rails usage rhythm coverage freshness trust`),
      line(`trust rail is NOT USAGE and cannot alter totals`),
      line("Vibers Unite // score fed by reviewed datastream"),
      "+------------------------------------------------------+",
    ],
    score: receipt.score,
    tier: receipt.tier,
    seal,
    shareLine: receipt.shareLine,
    signalRows,
    rails,
    guardrails: [
      "Score rails are derived from accepted aggregate usage rows.",
      "Trust appears as context only and never mutates spend, credits, ops, rank, or verified status.",
      "Offline profiles render a zero reactor instead of inventing activity.",
    ],
  };
}
