// Trust tiers — injection/spoof defense for the upload path (PLAN §7). The CLI can
// NEVER mint "verified": only the backend, having fetched data authoritatively (OAuth /
// read-only key), may set it. Everything a user could fabricate is self-reported.

import type { NormalizedRecord } from "../schema/record.ts";

export type TrustLevel = "verified" | "attested" | "self_reported";

/**
 * verified      — backend fetched it from the provider itself (not user-supplied).
 * attested      — produced by a device-signed CLI over local logs (tamper-evident-ish).
 * self_reported — unverified upload / manual entry / feed reconstruction. Spoofable.
 */
export function trustLevel(rec: Pick<NormalizedRecord, "verified" | "source">): TrustLevel {
  if (rec.verified === true) return "verified";
  if (rec.source === "log") return "attested"; // requires a device signature to be meaningful
  return "self_reported";
}

// Ranked leaderboards default to verified-only — this is what fixes viberank's core flaw.
export const RANKABLE: readonly TrustLevel[] = ["verified"];

export function isRankable(rec: Pick<NormalizedRecord, "verified" | "source">): boolean {
  return RANKABLE.includes(trustLevel(rec));
}
