import type { ProfileView } from "../../lib/data";
import {
  buildProfileBlackBoxReplay,
  buildProfileProofSpine,
  type ProfileBlackBoxEvent,
  type ProfileProofCell,
} from "../../lib/profile-proof.ts";

export const DEFAULT_PROOF_HANDLE = "b-etterdigital";

export interface LiveProofMetric {
  id: "fingerprint" | "tier" | "records" | "providers" | "trust" | "updated";
  label: string;
  value: string;
  detail: string;
}

export interface LiveProofSnapshot {
  handle: string;
  profileHref: string;
  status: "live" | "waiting";
  statusLabel: "LIVE PUBLIC AGGREGATE" | "WAITING FOR FIRST UPLOAD";
  identityLabel: string;
  tierLabel: string;
  rankLabel: string;
  fingerprint: string;
  updatedLabel: string;
  metrics: LiveProofMetric[];
  cells: ProfileProofCell[];
  terminalLines: string[];
  events: ProfileBlackBoxEvent[];
  guardrails: string[];
  receipt: string;
}

function int(value: number | null | undefined): string {
  return Number(value ?? 0).toLocaleString("en-US");
}

function label(value: string | null | undefined, fallback: string): string {
  const normalized = value?.trim();
  return normalized ? normalized.replace(/_/g, " ").toUpperCase() : fallback;
}

function dateLabel(value: string | null | undefined): string {
  if (!value) return "NOT PUBLISHED";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "DATE UNAVAILABLE";
  return date.toISOString().slice(0, 10);
}

function identityLabel(profile: ProfileView): string {
  const provider = label(profile.identityProvider, "IDENTITY");
  if (profile.identityVerified) return `${provider} VERIFIED`;
  if (profile.accountLinked) return "C0VIBE ACCOUNT LINKED";
  return "PUBLIC HANDLE";
}

export function sanitizeProofHandle(value: unknown): string {
  const candidate = (Array.isArray(value) ? value[0] : value);
  if (typeof candidate !== "string") return DEFAULT_PROOF_HANDLE;
  const normalized = candidate.trim().replace(/^@+/, "").toLowerCase();
  return /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(normalized)
    ? normalized
    : DEFAULT_PROOF_HANDLE;
}

export function buildLiveProofSnapshot(profile: ProfileView): LiveProofSnapshot {
  const replay = buildProfileBlackBoxReplay(profile);
  const cells = buildProfileProofSpine(profile);
  const latest = profile.latest;
  const status = latest ? "live" : "waiting";
  const tierLabel = label(latest?.tier, "NOT SYNCED");
  const updatedLabel = dateLabel(latest?.created_at);
  const rankLabel = profile.rank && profile.rank > 0 ? `#${int(profile.rank)} PUBLIC RANK` : "UNRANKED";
  const metrics: LiveProofMetric[] = [
    {
      id: "fingerprint",
      label: "Snapshot fingerprint",
      value: replay.seal,
      detail: "Deterministic ID, not a cryptographic signature",
    },
    {
      id: "tier",
      label: "Evidence tier",
      value: tierLabel,
      detail: latest ? "Declared by the latest public upload" : "No public upload exists",
    },
    {
      id: "records",
      label: "Counted operations",
      value: int(latest?.record_count),
      detail: "Aggregate rows only",
    },
    {
      id: "providers",
      label: "Provider sources",
      value: int(profile.providers.length),
      detail: "Public provider rollup",
    },
    {
      id: "trust",
      label: "Trust signals",
      value: int(profile.trustSignals.length),
      detail: "Context only, never usage",
    },
    {
      id: "updated",
      label: "Latest publish",
      value: updatedLabel,
      detail: latest ? "UTC calendar date" : "Waiting for review",
    },
  ];
  const receipt = [
    `VibeUsage public receipt @${profile.handle}`,
    `snapshot ${replay.seal}`,
    `state ${status}`,
    `tier ${tierLabel}`,
    `operations ${latest?.record_count ?? 0}`,
    `providers ${profile.providers.length}`,
    `trust_signals ${profile.trustSignals.length} (NOT USAGE)`,
    `published ${updatedLabel}`,
    `https://vibeusage.c0vibe.app/u/${encodeURIComponent(profile.handle)}`,
  ].join("\n");

  return {
    handle: profile.handle,
    profileHref: `/u/${encodeURIComponent(profile.handle)}`,
    status,
    statusLabel: latest ? "LIVE PUBLIC AGGREGATE" : "WAITING FOR FIRST UPLOAD",
    identityLabel: identityLabel(profile),
    tierLabel,
    rankLabel,
    fingerprint: replay.seal,
    updatedLabel,
    metrics,
    cells,
    terminalLines: replay.terminalLines,
    events: replay.events,
    guardrails: replay.guardrails,
    receipt,
  };
}
