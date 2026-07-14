export type UsageTier = "verified" | "attested" | "self_reported";

const USAGE_TIER: Record<UsageTier, { label: string; blurb: string }> = {
  verified: {
    label: "Verified usage",
    blurb: "A backend connector fetched this usage directly from the provider.",
  },
  attested: {
    label: "Identity attested",
    blurb: "GitHub or C0VIBE proves the operator. The reviewed CLI upload is attested, not provider-verified.",
  },
  self_reported: {
    label: "Self-reported",
    blurb: "This CLI upload has no verified operator identity attached.",
  },
};

export function TrustBadge({ tier }: { tier: UsageTier }) {
  const copy = USAGE_TIER[tier];
  const identityProven = tier !== "self_reported";
  return (
    <span className={`badge badge-${identityProven ? "verified" : "self_reported"}`} title={copy.blurb}>
      {identityProven ? "✓ " : ""}{copy.label}
    </span>
  );
}
