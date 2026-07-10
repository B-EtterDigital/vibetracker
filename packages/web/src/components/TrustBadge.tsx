import { TIER_LABEL, TIER_BLURB, type Tier } from "../lib/leaderboard";

export function TrustBadge({ tier }: { tier: Tier }) {
  return (
    <span className={`badge badge-${tier}`} title={TIER_BLURB[tier]}>
      {tier === "verified" ? "✓ " : ""}{TIER_LABEL[tier]}
    </span>
  );
}
