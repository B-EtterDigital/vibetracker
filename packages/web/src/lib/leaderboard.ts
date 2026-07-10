// Pure leaderboard display logic — no React, no I/O, so it's unit-testable. The site's
// components render these shapes; the trust split (verified vs self-reported) is enforced
// upstream in the DB views, and surfaced here as distinct tabs (never mixed rankings).

import { GITHUB_LEVEL_COLORS } from "./profile-trust.ts";

export interface LeaderRow {
  handle: string;
  total_usd: number;
  total_credits: number;
  record_count: number;
  created_at?: string;
}

export interface RankedRow extends LeaderRow {
  rank: number;
  medal: string;
}

export type Tier = "verified" | "self_reported";

export interface LeaderboardArena {
  tier: Tier;
  label: string;
  blurb: string;
  rows: RankedRow[];
  podium: RankedRow[];
  totalUsd: number;
  totalCredits: number;
  totalOps: number;
  leader: RankedRow | null;
  terminalLines: string[];
}

export type LeaderboardRaceTone = "leader" | "gap" | "ops" | "efficiency" | "field";

export interface LeaderboardRaceCard {
  id: "leader" | "gap" | "ops_crown" | "efficiency" | "field_density";
  label: string;
  value: string;
  status: string;
  note: string;
  tone: LeaderboardRaceTone;
  meter: number;
}

export type LeaderboardRaceStreamTone = "ingest" | "tier" | "rank" | "relay";

export interface LeaderboardRaceStreamStage {
  id: "ingest" | "tier_split" | "rank_solve" | "public_relay";
  label: string;
  value: string;
  note: string;
  tone: LeaderboardRaceStreamTone;
  meter: number;
}

export type LeaderboardRacePipelineImpact = "ranked_usage" | "tier_boundary" | "publish" | "waiting";

export interface LeaderboardRacePipelineStep {
  id: "ingest_usage" | "tier_guard" | "rank_solver" | "c0vibe_relay";
  label: string;
  command: string;
  value: string;
  note: string;
  impact: LeaderboardRacePipelineImpact;
  meter: number;
  mark: string;
  from: string;
  to: string;
  ink: string;
  frames: string[];
  terminalLine: string;
}

export interface LeaderboardRaceControl {
  headline: string;
  subline: string;
  terminalLines: string[];
  stream: LeaderboardRaceStreamStage[];
  pipeline: LeaderboardRacePipelineStep[];
  cards: LeaderboardRaceCard[];
}

export type LeaderboardBroadcastTone = "champion" | "runner" | "operator" | "waiting";
export type LeaderboardBroadcastImpact = "ranked_usage" | "waiting";

export interface LeaderboardBroadcastCard {
  id: string;
  rank: string;
  handle: string;
  spend: string;
  ops: string;
  gap: string;
  note: string;
  tone: LeaderboardBroadcastTone;
  impact: LeaderboardBroadcastImpact;
  meter: number;
}

export type LeaderboardSignalImpact = "ranked_usage" | "tier_boundary" | "publish" | "waiting";

export interface LeaderboardSignalTapeItem {
  id: "leader" | "spread" | "usage" | "tier" | "relay";
  label: string;
  command: string;
  value: string;
  note: string;
  impact: LeaderboardSignalImpact;
  meter: number;
  mark: string;
  from: string;
  to: string;
  ink: string;
}

export interface LeaderboardBroadcastWall {
  headline: string;
  subline: string;
  terminalLines: string[];
  cards: LeaderboardBroadcastCard[];
  signalTape: LeaderboardSignalTapeItem[];
  ticker: string;
}

export type LeaderboardProofImpact = "ranked_usage" | "tier_boundary" | "publish" | "waiting";

export interface LeaderboardProofBeam {
  id: string;
  rank: string;
  handle: string;
  spend: string;
  ops: string;
  railLabel: string;
  note: string;
  impact: LeaderboardProofImpact;
  meter: number;
  checksum: string;
  from: string;
  to: string;
  ink: string;
  frames: string[];
}

export interface LeaderboardProofGuard {
  id: "tier" | "source" | "rank" | "relay";
  label: string;
  value: string;
  note: string;
  impact: LeaderboardProofImpact;
  meter: number;
  mark: string;
  from: string;
  to: string;
  ink: string;
}

export interface LeaderboardProofTower {
  headline: string;
  subline: string;
  terminalLines: string[];
  beams: LeaderboardProofBeam[];
  guards: LeaderboardProofGuard[];
  totals: {
    rankedOperators: number;
    podiumOperators: number;
    podiumUsd: number;
    hiddenTrustBoost: 0;
    mixedRanks: 0;
  };
}

export type LeaderboardPodiumWaveImpact = "ranked_usage" | "tier_boundary" | "publish" | "waiting";

export interface LeaderboardPodiumWaveOperator {
  id: string;
  rank: string;
  handle: string;
  spend: string;
  ops: string;
  credits: string;
  share: string;
  delta: string;
  note: string;
  impact: LeaderboardPodiumWaveImpact;
  meter: number;
  checksum: string;
  from: string;
  to: string;
  ink: string;
  bars: number[];
  terminalLine: string;
}

export interface LeaderboardPodiumWaveGuard {
  id: "source" | "tier" | "math" | "relay";
  label: string;
  value: string;
  note: string;
  impact: LeaderboardPodiumWaveImpact;
  meter: number;
}

export interface LeaderboardPodiumWave {
  headline: string;
  subline: string;
  terminalLines: string[];
  operators: LeaderboardPodiumWaveOperator[];
  guards: LeaderboardPodiumWaveGuard[];
  totals: {
    rankedOperators: number;
    podiumOperators: number;
    waveformBars: number;
    totalUsd: number;
    hiddenTrustBoost: 0;
    mixedRanks: 0;
  };
}

export const BOARD_HEATGRID_COLORS = GITHUB_LEVEL_COLORS;

export interface LeaderboardHeatgridCell {
  id: string;
  row: number;
  col: number;
  level: 0 | 1 | 2 | 3 | 4;
  color: (typeof BOARD_HEATGRID_COLORS)[number];
  label: string;
  value: string;
  meter: number;
  checksum: string;
}

export interface LeaderboardHeatgridLane {
  id: "ranked_usage" | "tier_boundary" | "trust_zero" | "relay";
  label: string;
  value: string;
  note: string;
  impact: LeaderboardSignalImpact;
  meter: number;
  mark: string;
  from: string;
  to: string;
  ink: string;
}

export interface LeaderboardHeatgrid {
  headline: string;
  subline: string;
  terminalLines: string[];
  cells: LeaderboardHeatgridCell[];
  lanes: LeaderboardHeatgridLane[];
  totals: {
    cells: number;
    activeCells: number;
    maxLevel: 4;
    hiddenTrustBoost: 0;
    mixedRanks: 0;
    providerCalls: 0;
    ledgerWrites: 0;
  };
}

export const TIER_LABEL: Record<Tier, string> = {
  verified: "Verified",
  self_reported: "Self-reported",
};

export const TIER_BLURB: Record<Tier, string> = {
  verified: "Fetched from the provider by our backend — not user-supplied.",
  self_reported: "Uploaded from the CLI, unverified. Shown separately, never ranked against Verified.",
};

export const TIER_SIGNAL: Record<Tier, string> = {
  verified: "provider fetched",
  self_reported: "cli uploaded",
};

export function medalFor(rank: number): string {
  return rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
}

export function rankByUsd(rows: LeaderRow[]): RankedRow[] {
  return [...rows]
    .sort((a, b) => (b.total_usd - a.total_usd) || (b.total_credits - a.total_credits))
    .map((r, i) => ({ ...r, rank: i + 1, medal: medalFor(i + 1) }));
}

export function formatUsd(n: number | null | undefined): string {
  if (n == null) return "—";
  return `$${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export function formatInt(n: number | null | undefined): string {
  if (n == null) return "—";
  return Number(n).toLocaleString("en-US");
}

function fit(value: string | number, width: number): string {
  return String(value).padEnd(width).slice(0, width);
}

function frameLine(value: string): string {
  return `| ${fit(value, 60)} |`;
}

function racePipelineLine(command: string, value: string): string {
  return frameLine(`${command} -> ${value}`);
}

function proofChecksum(value: string): string {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  }
  return hash.toString(36).toUpperCase().padStart(6, "0").slice(-6);
}

function signalMeter(value: number, active: boolean): number {
  if (!active) return 8;
  return clampMeter(value, 12, 100);
}

function clampMeter(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function usdPerOp(row: RankedRow | null | undefined): number | null {
  if (!row || row.record_count <= 0 || row.total_usd <= 0) return null;
  return row.total_usd / row.record_count;
}

function waveformBars(row: RankedRow, arena: LeaderboardArena, index: number): number[] {
  const leaderUsd = Math.max(arena.leader?.total_usd ?? row.total_usd, 1);
  const maxOps = Math.max(...arena.rows.map((entry) => entry.record_count), row.record_count, 1);
  const maxCredits = Math.max(...arena.rows.map((entry) => entry.total_credits), row.total_credits, 1);
  const spendPower = clampMeter((row.total_usd / leaderUsd) * 100, row.total_usd > 0 ? 12 : 8);
  const opPower = clampMeter((row.record_count / maxOps) * 100, row.record_count > 0 ? 12 : 8);
  const creditPower = clampMeter((row.total_credits / maxCredits) * 100, row.total_credits > 0 ? 12 : 8);
  const fieldShare = arena.totalUsd > 0 ? clampMeter((row.total_usd / arena.totalUsd) * 100, 8) : 8;
  const rankPulse = clampMeter(100 - index * 18, 38);
  return [
    clampMeter(spendPower * 0.42 + rankPulse * 0.28),
    spendPower,
    clampMeter((spendPower + opPower) / 2, 10),
    opPower,
    clampMeter((opPower + creditPower) / 2, 10),
    creditPower,
    clampMeter((fieldShare + rankPulse) / 2, 10),
    fieldShare,
    clampMeter(rankPulse * 0.72 + fieldShare * 0.2, 12),
  ];
}

export function buildLeaderboardArena(tier: Tier, rows: LeaderRow[]): LeaderboardArena {
  const ranked = rankByUsd(rows);
  const totalUsd = ranked.reduce((sum, row) => sum + Number(row.total_usd || 0), 0);
  const totalCredits = ranked.reduce((sum, row) => sum + Number(row.total_credits || 0), 0);
  const totalOps = ranked.reduce((sum, row) => sum + Number(row.record_count || 0), 0);
  const leader = ranked[0] ?? null;
  const mode = TIER_SIGNAL[tier];
  const terminalLines = [
    `tier    ${fit(TIER_LABEL[tier], 18)}`,
    `mode    ${fit(mode, 18)}`,
    `rows    ${fit(ranked.length, 18)}`,
    `leader  ${fit(leader ? `@${leader.handle}` : "none", 18)}`,
    `total   ${fit(formatUsd(totalUsd), 18)}`,
  ];

  return {
    tier,
    label: TIER_LABEL[tier],
    blurb: TIER_BLURB[tier],
    rows: ranked,
    podium: ranked.slice(0, 3),
    totalUsd,
    totalCredits,
    totalOps,
    leader,
    terminalLines,
  };
}

export function buildLeaderboardRaceControl(arena: LeaderboardArena): LeaderboardRaceControl {
  const leader = arena.leader;
  const runnerUp = arena.rows[1] ?? null;
  const gapUsd = leader ? Math.max(0, leader.total_usd - (runnerUp?.total_usd ?? 0)) : 0;
  const gapPct = leader
    ? runnerUp && runnerUp.total_usd > 0
      ? (gapUsd / runnerUp.total_usd) * 100
      : 100
    : 0;
  const opsCrown = [...arena.rows].sort((a, b) =>
    (b.record_count - a.record_count) || (b.total_usd - a.total_usd) || a.handle.localeCompare(b.handle)
  )[0] ?? null;
  const efficient = [...arena.rows]
    .filter((row) => usdPerOp(row) != null)
    .sort((a, b) =>
      (usdPerOp(a)! - usdPerOp(b)!) || (b.record_count - a.record_count) || (b.total_usd - a.total_usd)
    )[0] ?? null;
  const efficientRate = usdPerOp(efficient);
  const podiumUsd = arena.podium.reduce((sum, row) => sum + Number(row.total_usd || 0), 0);
  const fieldShare = arena.totalUsd > 0 ? (podiumUsd / arena.totalUsd) * 100 : 0;
  const tierToken = arena.tier.toUpperCase();
  const otherTier = arena.tier === "verified" ? "Self-reported" : "Verified";
  const stream: LeaderboardRaceStreamStage[] = [
    {
      id: "ingest",
      label: "Rows ingested",
      value: `${formatInt(arena.rows.length)} rows`,
      note: `${formatUsd(arena.totalUsd)} ranked usage in this board`,
      tone: "ingest",
      meter: clampMeter(20 + arena.rows.length * 14, arena.rows.length ? 28 : 10, 100),
    },
    {
      id: "tier_split",
      label: "Trust tier split",
      value: arena.label,
      note: `isolated from ${otherTier}; no mixed ranks`,
      tone: "tier",
      meter: 100,
    },
    {
      id: "rank_solve",
      label: "Rank solve",
      value: leader ? `@${leader.handle}` : "waiting",
      note: "USD sorted; credits break ties",
      tone: "rank",
      meter: leader ? 100 : 12,
    },
    {
      id: "public_relay",
      label: "Public relay",
      value: "c0vibe.app",
      note: arena.rows.length ? "Vibers Unite board is live" : "relay waits for rows",
      tone: "relay",
      meter: arena.rows.length ? 88 : 18,
    },
  ];
  const pipeline: LeaderboardRacePipelineStep[] = [
    {
      id: "ingest_usage",
      label: "Usage ingest",
      command: "records:accepted()",
      value: `${formatInt(arena.rows.length)} rows`,
      note: `${formatUsd(arena.totalUsd)} ranked usage; trust-only signals excluded.`,
      impact: arena.rows.length ? "ranked_usage" : "waiting",
      meter: signalMeter(20 + arena.rows.length * 14, arena.rows.length > 0),
      mark: "IN",
      from: "#36e39b",
      to: "#2ee8d6",
      ink: "#071013",
      frames: ["ROWS", "USD", "OPS", arena.rows.length ? "OK" : "WAIT"],
      terminalLine: racePipelineLine("records:accepted()", `${formatInt(arena.rows.length)} rows`),
    },
    {
      id: "tier_guard",
      label: "Tier guard",
      command: "tier:separate()",
      value: arena.label,
      note: `${arena.label} isolated from ${otherTier}; no mixed ranks.`,
      impact: "tier_boundary",
      meter: 100,
      mark: "NO",
      from: "#24292f",
      to: "#ffc64d",
      ink: "#ffffff",
      frames: ["TIER", "NO", "MIX", "OK"],
      terminalLine: racePipelineLine("tier:separate()", arena.label),
    },
    {
      id: "rank_solver",
      label: "Rank solver",
      command: "rank:usd_desc()",
      value: leader ? `@${leader.handle}` : "waiting",
      note: "USD sorted; credits break ties; trust never boosts rank.",
      impact: leader ? "ranked_usage" : "waiting",
      meter: signalMeter(100, Boolean(leader)),
      mark: "R1",
      from: "#ff4fd8",
      to: "#ffc64d",
      ink: "#140812",
      frames: ["USD", "SORT", "RANK", leader ? "#1" : "WAIT"],
      terminalLine: racePipelineLine("rank:usd_desc()", leader ? `@${leader.handle}` : "waiting"),
    },
    {
      id: "c0vibe_relay",
      label: "C0VIBE relay",
      command: "relay:public_board()",
      value: arena.rows.length ? "c0vibe.app" : "waiting",
      note: arena.rows.length ? "Vibers Unite public board ready." : "Relay waits for ranked usage rows.",
      impact: arena.rows.length ? "publish" : "waiting",
      meter: signalMeter(94, arena.rows.length > 0),
      mark: "C0",
      from: "#2ee8d6",
      to: "#9f7cff",
      ink: "#071013",
      frames: ["C0", "VIBE", "UNITE", arena.rows.length ? "APP" : "WAIT"],
      terminalLine: racePipelineLine("relay:public_board()", arena.rows.length ? "c0vibe.app" : "waiting"),
    },
  ];

  return {
    headline: `${arena.label} race control`,
    subline: leader
      ? `Live public board telemetry for @${leader.handle}; ${arena.label} rankings never mix with other trust tiers.`
      : `${arena.label} race waiting for the first ranked operator.`,
    terminalLines: [
      `VTK://RACE-CONTROL//${tierToken}//NO-MIXED-RANKS`,
      `leader      ${fit(leader ? `@${leader.handle}` : "none", 16)}`,
      `gap         ${fit(formatUsd(gapUsd), 16)}`,
      `ops crown   ${fit(opsCrown ? `@${opsCrown.handle}` : "none", 16)}`,
      `efficiency  ${fit(efficient ? `@${efficient.handle}` : "none", 16)}`,
      `podium      ${fit(`${Math.round(fieldShare)}% field share`, 16)}`,
      `stream      ${fit(`${arena.rows.length} rows -> ${arena.label} -> c0vibe.app`, 16)}`,
    ],
    stream,
    pipeline,
    cards: [
      {
        id: "leader",
        label: "Current leader",
        value: leader ? `@${leader.handle}` : "waiting",
        status: leader ? `rank #${leader.rank}` : "no rows",
        note: leader ? `${formatUsd(leader.total_usd)} estimated public spend` : "No public rows in this trust tier yet.",
        tone: "leader",
        meter: leader ? 100 : 12,
      },
      {
        id: "gap",
        label: "Lead gap",
        value: formatUsd(gapUsd),
        status: runnerUp ? "#1 over #2" : leader ? "solo lead" : "waiting",
        note: runnerUp ? `${formatUsd(gapUsd)} separates @${leader?.handle} from @${runnerUp.handle}.` : "Need a runner-up before the gap becomes meaningful.",
        tone: "gap",
        meter: clampMeter(22 + gapPct, leader ? 28 : 10, 100),
      },
      {
        id: "ops_crown",
        label: "Ops crown",
        value: opsCrown ? `@${opsCrown.handle}` : "waiting",
        status: opsCrown ? `${formatInt(opsCrown.record_count)} ops` : "no ops",
        note: opsCrown ? "Most recorded operations in this separated trust tier." : "Operations appear after validated usage records land.",
        tone: "ops",
        meter: opsCrown && arena.totalOps > 0 ? clampMeter((opsCrown.record_count / arena.totalOps) * 100, 18) : 10,
      },
      {
        id: "efficiency",
        label: "Efficiency watch",
        value: efficient ? `@${efficient.handle}` : "waiting",
        status: efficientRate != null ? `${formatUsd(efficientRate)}/op` : "no rate",
        note: efficient ? "Lowest USD/op among ranked rows with spend and ops." : "Needs both spend and operations to calculate honestly.",
        tone: "efficiency",
        meter: efficientRate != null ? clampMeter(96 - Math.min(70, efficientRate * 5), 18, 96) : 10,
      },
      {
        id: "field_density",
        label: "Field density",
        value: `${Math.round(fieldShare)}%`,
        status: "top 3 share",
        note: arena.totalUsd > 0 ? "How much of this board's spend sits on the podium." : "No spend signal has reached this tier yet.",
        tone: "field",
        meter: clampMeter(fieldShare, arena.totalUsd > 0 ? 18 : 10, 100),
      },
    ],
  };
}

export function buildLeaderboardPodiumWave(arena: LeaderboardArena): LeaderboardPodiumWave {
  const tierToken = arena.tier.toUpperCase();
  const leader = arena.leader;
  const colors = [
    ["#36e39b", "#2ee8d6", "#071013"],
    ["#ffc64d", "#ff4fd8", "#1b0b00"],
    ["#9f7cff", "#2ee8d6", "#ffffff"],
  ] as const;
  const operators = arena.podium.map<LeaderboardPodiumWaveOperator>((row, index) => {
    const previous = index === 0 ? null : arena.podium[index - 1];
    const deltaUsd = previous ? Math.max(0, previous.total_usd - row.total_usd) : 0;
    const sharePct = arena.totalUsd > 0 ? (row.total_usd / arena.totalUsd) * 100 : 0;
    const [from, to, ink] = colors[index] ?? colors[2];
    const checksum = proofChecksum(`wave:${arena.tier}:${row.rank}:${row.handle}:${row.total_usd}:${row.total_credits}:${row.record_count}`);
    const bars = waveformBars(row, arena, index);
    return {
      id: `${arena.tier}-wave-${row.rank}-${row.handle}`,
      rank: row.medal,
      handle: `@${row.handle}`,
      spend: formatUsd(row.total_usd),
      ops: `${formatInt(row.record_count)} ops`,
      credits: `${formatInt(row.total_credits)} credits`,
      share: `${Math.round(sharePct)}% field`,
      delta: previous ? `${formatUsd(deltaUsd)} behind #${previous.rank}` : "leader signal",
      note: previous
        ? `${arena.label} #${row.rank}; waveform compares ranked usage only against #${previous.rank}.`
        : `${arena.label} #1; waveform is visual-only and cannot add trust boosts.`,
      impact: "ranked_usage",
      meter: clampMeter(bars.reduce((sum, bar) => sum + bar, 0) / bars.length, 12, 100),
      checksum,
      from,
      to,
      ink,
      bars,
      terminalLine: frameLine(`wave #${row.rank} @${row.handle} ${formatUsd(row.total_usd)} ${formatInt(row.record_count)} ops ${Math.round(sharePct)}%`),
    };
  });
  const guards: LeaderboardPodiumWaveGuard[] = [
    {
      id: "source",
      label: "Source",
      value: TIER_SIGNAL[arena.tier],
      note: "The waveform reads the same separated board rows as the table.",
      impact: "tier_boundary",
      meter: 100,
    },
    {
      id: "tier",
      label: "Tier",
      value: arena.label,
      note: "Verified and self-reported operators never share a waveform.",
      impact: "tier_boundary",
      meter: 100,
    },
    {
      id: "math",
      label: "Rank math",
      value: "USD desc",
      note: "Credits only break ties; trust sidecars never boost podium shape.",
      impact: operators.length ? "ranked_usage" : "waiting",
      meter: operators.length ? 96 : 12,
    },
    {
      id: "relay",
      label: "Relay",
      value: operators.length ? "c0vibe.app" : "waiting",
      note: operators.length ? "Vibers Unite public signal is ready." : "Relay waits for ranked usage rows.",
      impact: operators.length ? "publish" : "waiting",
      meter: operators.length ? 94 : 12,
    },
  ];

  return {
    headline: `${arena.label} podium waveform`,
    subline: operators.length
      ? `A compact waveform comparing the top ${operators.length} ranked operators by spend, ops, credits, and field share.`
      : `${arena.label} podium waveform is waiting for ranked usage rows.`,
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine(`VTK://PODIUM-WAVEFORM//${tierToken}//VISUAL-ONLY`),
      "|--------------------------------------------------------------|",
      frameLine(`podium ${operators.length} // ranked ${arena.rows.length} // total ${formatUsd(arena.totalUsd)}`),
      frameLine(`leader ${leader ? `@${leader.handle}` : "waiting"} // hidden trust boost 0`),
      frameLine(`bars ${operators.reduce((sum, operator) => sum + operator.bars.length, 0)} // mixed ranks 0 // ${TIER_SIGNAL[arena.tier]}`),
      frameLine("waveform is presentation; table rows remain source of truth"),
      frameLine("motto Vibers Unite // c0vibe.app"),
      "+--------------------------------------------------------------+",
    ],
    operators,
    guards,
    totals: {
      rankedOperators: arena.rows.length,
      podiumOperators: operators.length,
      waveformBars: operators.reduce((sum, operator) => sum + operator.bars.length, 0),
      totalUsd: arena.totalUsd,
      hiddenTrustBoost: 0,
      mixedRanks: 0,
    },
  };
}

export function buildLeaderboardHeatgrid(arena: LeaderboardArena): LeaderboardHeatgrid {
  const tierToken = arena.tier.toUpperCase();
  const leader = arena.leader;
  const maxUsd = Math.max(...arena.rows.map((row) => row.total_usd), 1);
  const maxOps = Math.max(...arena.rows.map((row) => row.record_count), 1);
  const cellCount = 35;
  const cells = Array.from({ length: cellCount }, (_, index): LeaderboardHeatgridCell => {
    const ranked = arena.rows.length ? arena.rows[index % arena.rows.length] : null;
    const intensity = ranked
      ? clampMeter((ranked.total_usd / maxUsd) * 70 + (ranked.record_count / maxOps) * 30, 0, 100)
      : 0;
    const level: LeaderboardHeatgridCell["level"] = intensity >= 82
      ? 4
      : intensity >= 58
        ? 3
        : intensity >= 30
          ? 2
          : intensity > 0
            ? 1
            : 0;
    return {
      id: `${arena.tier}-heat-${index}`,
      row: index % 5,
      col: Math.floor(index / 5),
      level,
      color: BOARD_HEATGRID_COLORS[level],
      label: ranked ? `#${ranked.rank} @${ranked.handle}` : "waiting",
      value: ranked ? `${formatUsd(ranked.total_usd)} / ${formatInt(ranked.record_count)} ops` : "no row",
      meter: intensity,
      checksum: proofChecksum(`heat:${arena.tier}:${index}:${ranked?.handle ?? "waiting"}:${ranked?.total_usd ?? 0}:${ranked?.record_count ?? 0}`),
    };
  });
  const activeCells = cells.filter((cell) => cell.level > 0).length;
  const lanes: LeaderboardHeatgridLane[] = [
    {
      id: "ranked_usage",
      label: "Ranked usage",
      value: `${formatInt(arena.rows.length)} rows`,
      note: `${formatUsd(arena.totalUsd)} usage signal drives heat intensity only.`,
      impact: arena.rows.length ? "ranked_usage" : "waiting",
      meter: signalMeter(24 + arena.rows.length * 12, arena.rows.length > 0),
      mark: "GH",
      from: "#0e4429",
      to: "#39d353",
      ink: "#f0fff4",
    },
    {
      id: "tier_boundary",
      label: "Tier boundary",
      value: arena.label,
      note: "Verified and self-reported boards never share heatgrid ranks.",
      impact: "tier_boundary",
      meter: 100,
      mark: "NO",
      from: "#24292f",
      to: "#ffc64d",
      ink: "#ffffff",
    },
    {
      id: "trust_zero",
      label: "Trust side rail",
      value: "0 boost",
      note: "GitHub trust sidecars remain NOT USAGE and cannot change this heatgrid.",
      impact: "tier_boundary",
      meter: 100,
      mark: "+0",
      from: "#ffc64d",
      to: "#ff4fd8",
      ink: "#1b0b00",
    },
    {
      id: "relay",
      label: "C0VIBE relay",
      value: arena.rows.length ? "c0vibe.app" : "waiting",
      note: arena.rows.length ? "Vibers Unite public board can replay the fill." : "Relay waits for ranked usage rows.",
      impact: arena.rows.length ? "publish" : "waiting",
      meter: arena.rows.length ? 94 : 12,
      mark: "C0",
      from: "#2ee8d6",
      to: "#9f7cff",
      ink: "#071013",
    },
  ];

  return {
    headline: `${arena.label} board heatgrid`,
    subline: activeCells
      ? `Official GitHub contribution colors replay ranked usage rhythm for ${arena.label}; visual-only, no trust boosts.`
      : `${arena.label} board heatgrid is waiting for ranked usage rows.`,
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine(`VTK://BOARD-HEATGRID//${tierToken}//OFFICIAL-GH-COLORS`),
      "|--------------------------------------------------------------|",
      frameLine(`cells ${cells.length} // active ${activeCells} // level scale 0-4`),
      frameLine(`ranked rows ${arena.rows.length} // total ${formatUsd(arena.totalUsd)} // ops ${formatInt(arena.totalOps)}`),
      frameLine("hidden trust boost 0 // mixed ranks 0 // providerCalls 0"),
      frameLine("fill replay visual-only // official GitHub colors"),
      frameLine(`motto Vibers Unite // ${leader ? `@${leader.handle}` : "waiting"} // c0vibe.app`),
      "+--------------------------------------------------------------+",
    ],
    cells,
    lanes,
    totals: {
      cells: cells.length,
      activeCells,
      maxLevel: 4,
      hiddenTrustBoost: 0,
      mixedRanks: 0,
      providerCalls: 0,
      ledgerWrites: 0,
    },
  };
}

export function buildLeaderboardBroadcastWall(arena: LeaderboardArena): LeaderboardBroadcastWall {
  const leader = arena.leader;
  const leaderUsd = Math.max(leader?.total_usd ?? 0, 1);
  const runner = arena.rows[1] ?? null;
  const spread = leader && runner ? Math.max(0, leader.total_usd - runner.total_usd) : 0;
  const cards = arena.rows.slice(0, 6).map<LeaderboardBroadcastCard>((row, index) => {
    const previous = index === 0 ? null : arena.rows[index - 1];
    const gap = previous ? Math.max(0, previous.total_usd - row.total_usd) : 0;
    const tone: LeaderboardBroadcastTone = index === 0 ? "champion" : index < 3 ? "runner" : "operator";
    return {
      id: `${arena.tier}-${row.rank}-${row.handle}`,
      rank: row.medal,
      handle: `@${row.handle}`,
      spend: formatUsd(row.total_usd),
      ops: `${formatInt(row.record_count)} ops`,
      gap: previous ? `${formatUsd(gap)} behind #${previous.rank}` : "leader signal",
      note: previous
        ? `${formatUsd(gap)} separates ${row.handle} from ${previous.handle} inside ${arena.label}.`
        : `${arena.label} #1. This rank is never mixed with the other trust tier.`,
      tone,
      impact: "ranked_usage",
      meter: clampMeter((row.total_usd / leaderUsd) * 100, row.total_usd > 0 ? 12 : 8, 100),
    };
  });
  const tierToken = arena.tier.toUpperCase();
  const signalTape: LeaderboardSignalTapeItem[] = [
    {
      id: "leader",
      label: "Leader",
      command: "rank:leader()",
      value: leader ? `@${leader.handle}` : "waiting",
      note: leader ? `${arena.label} #1, rank scoped to this tier.` : "No ranked usage row yet.",
      impact: leader ? "ranked_usage" : "waiting",
      meter: signalMeter(100, Boolean(leader)),
      mark: "1",
      from: "#36e39b",
      to: "#2ee8d6",
      ink: "#071013",
    },
    {
      id: "spread",
      label: "Rank spread",
      command: "rank:gap()",
      value: leader && runner ? formatUsd(spread) : "waiting",
      note: leader && runner ? `Distance between #1 and #2 inside ${arena.label}.` : "Needs a runner-up before spread is useful.",
      impact: leader && runner ? "ranked_usage" : "waiting",
      meter: signalMeter((spread / leaderUsd) * 100, Boolean(leader && runner)),
      mark: "G",
      from: "#ffc64d",
      to: "#36e39b",
      ink: "#071013",
    },
    {
      id: "usage",
      label: "Usage mass",
      command: "usage:sum()",
      value: `${formatInt(arena.totalOps)} ops`,
      note: `${formatUsd(arena.totalUsd)} / ${formatInt(arena.totalCredits)} credits.`,
      impact: arena.rows.length ? "ranked_usage" : "waiting",
      meter: signalMeter(Math.log10(Math.max(1, arena.totalOps)) * 28, arena.totalOps > 0),
      mark: "US",
      from: "#ff4fd8",
      to: "#ffc64d",
      ink: "#140812",
    },
    {
      id: "tier",
      label: "Tier split",
      command: "tier:guard()",
      value: TIER_SIGNAL[arena.tier],
      note: `${arena.label} rows stay isolated; no mixed ranks.`,
      impact: "tier_boundary",
      meter: 100,
      mark: "NO",
      from: "#24292f",
      to: "#ffc64d",
      ink: "#ffffff",
    },
    {
      id: "relay",
      label: "C0VIBE relay",
      command: "relay:board()",
      value: arena.rows.length ? "c0vibe.app" : "waiting",
      note: arena.rows.length ? "Vibers Unite public board ready." : "Relay waits for ranked usage rows.",
      impact: arena.rows.length ? "publish" : "waiting",
      meter: arena.rows.length ? 94 : 12,
      mark: "C0",
      from: "#2ee8d6",
      to: "#9f7cff",
      ink: "#071013",
    },
  ];

  return {
    headline: `${arena.label} broadcast wall`,
    subline: cards.length
      ? `Top ${cards.length} operators rendered as a live-looking public signal wall. ${arena.label} rows stay isolated.`
      : `${arena.label} broadcast wall is waiting for the first ranked operator.`,
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine(`VTK://BROADCAST-WALL//${tierToken}//NO-MIXED-RANKS`),
      "|--------------------------------------------------------------|",
      frameLine(`leader ${leader ? `@${leader.handle}` : "waiting"} // ${formatUsd(leader?.total_usd)}`),
      frameLine(`field  ${formatInt(arena.rows.length)} operators // ${formatUsd(arena.totalUsd)} signal`),
      frameLine(`ops    ${formatInt(arena.totalOps)} // tier ${TIER_SIGNAL[arena.tier]}`),
      frameLine(`tape   ${signalTape.map((item) => item.value).join(" / ")}`),
      frameLine("motto  Vibers Unite // c0vibe.app"),
      "+--------------------------------------------------------------+",
    ],
    cards,
    signalTape,
    ticker: cards.length
      ? cards.map((card) => `${card.rank} ${card.handle} ${card.spend}`).join("  //  ")
      : `${arena.label} board waiting // Vibers Unite // c0vibe.app`,
  };
}

export function buildLeaderboardProofTower(arena: LeaderboardArena): LeaderboardProofTower {
  const tierToken = arena.tier.toUpperCase();
  const leaderUsd = Math.max(arena.leader?.total_usd ?? 0, 1);
  const podiumUsd = arena.podium.reduce((sum, row) => sum + Number(row.total_usd || 0), 0);
  const beamColors = [
    ["#36e39b", "#2ee8d6", "#071013"],
    ["#ffc64d", "#ff4fd8", "#1b0b00"],
    ["#9f7cff", "#2ee8d6", "#ffffff"],
  ] as const;
  const beams = arena.podium.map<LeaderboardProofBeam>((row, index) => {
    const [from, to, ink] = beamColors[index] ?? beamColors[2];
    const handleMark = fit(row.handle.replace(/^@/, ""), 6);
    const checksum = proofChecksum(`${arena.tier}:${row.rank}:${row.handle}:${row.total_usd}:${row.record_count}`);
    return {
      id: `${arena.tier}-${row.rank}-${row.handle}`,
      rank: row.medal,
      handle: `@${row.handle}`,
      spend: formatUsd(row.total_usd),
      ops: `${formatInt(row.record_count)} ops`,
      railLabel: "RANKED USAGE",
      note: `${arena.label} rank #${row.rank}; spend and operation totals only from this separated board.`,
      impact: "ranked_usage",
      meter: clampMeter((row.total_usd / leaderUsd) * 100, row.total_usd > 0 ? 14 : 8, 100),
      checksum,
      from,
      to,
      ink,
      frames: [
        ` ${fit(`#${row.rank}`, 4)} \n@${handleMark}\n ████ `,
        `╔${fit(row.rank, 2)}╗ \n${handleMark}\n▓▓▓▓ `,
        ` ${fit(row.medal, 4)}\n@${handleMark}\n████ `,
        ` ${fit(checksum, 4)}\n${handleMark}\n▓██▓ `,
      ],
    };
  });
  const guards: LeaderboardProofGuard[] = [
    {
      id: "tier",
      label: "Tier boundary",
      value: arena.label,
      note: arena.tier === "verified" ? "Verified rows never compete with CLI self-reports." : "Self-reported rows never compete with provider-fetched rows.",
      impact: "tier_boundary",
      meter: 100,
      mark: "NO",
      from: "#24292f",
      to: "#ffc64d",
      ink: "#ffffff",
    },
    {
      id: "source",
      label: "Source label",
      value: TIER_SIGNAL[arena.tier],
      note: "The board labels where the row came from before anyone reads the rank.",
      impact: "tier_boundary",
      meter: 100,
      mark: "SRC",
      from: "#2ee8d6",
      to: "#36e39b",
      ink: "#071013",
    },
    {
      id: "rank",
      label: "Rank solver",
      value: arena.leader ? `@${arena.leader.handle}` : "waiting",
      note: arena.leader ? "Sorted by USD, with credits only used as the tie breaker." : "Waiting for the first ranked usage row.",
      impact: arena.leader ? "ranked_usage" : "waiting",
      meter: arena.leader ? 96 : 12,
      mark: "R1",
      from: "#ff4fd8",
      to: "#ffc64d",
      ink: "#140812",
    },
    {
      id: "relay",
      label: "C0VIBE relay",
      value: arena.rows.length ? "c0vibe.app" : "waiting",
      note: arena.rows.length ? "Vibers Unite public board is ready for sharing." : "Relay opens after ranked rows exist.",
      impact: arena.rows.length ? "publish" : "waiting",
      meter: arena.rows.length ? 94 : 12,
      mark: "C0",
      from: "#2ee8d6",
      to: "#9f7cff",
      ink: "#071013",
    },
  ];

  return {
    headline: `${arena.label} proof tower`,
    subline: beams.length
      ? `A podium-grade proof relay for ${arena.label}: rank beams, source guards, and C0VIBE sharing without trust boosts or mixed tiers.`
      : `${arena.label} proof tower is armed, but waiting for ranked usage rows.`,
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine(`VTK://PROOF-TOWER//${tierToken}//NO-MIXED-RANKS`),
      "|--------------------------------------------------------------|",
      frameLine(`podium ${beams.length} operators // ranked rows ${arena.rows.length}`),
      frameLine(`leader ${arena.leader ? `@${arena.leader.handle}` : "waiting"} // ${formatUsd(arena.leader?.total_usd)}`),
      frameLine(`podium spend ${formatUsd(podiumUsd)} // hidden trust boost 0`),
      frameLine(`guards ${guards.map((guard) => guard.value).join(" / ")}`),
      frameLine("motto Vibers Unite // c0vibe.app // ranks stay scoped"),
      "+--------------------------------------------------------------+",
    ],
    beams,
    guards,
    totals: {
      rankedOperators: arena.rows.length,
      podiumOperators: beams.length,
      podiumUsd,
      hiddenTrustBoost: 0,
      mixedRanks: 0,
    },
  };
}
