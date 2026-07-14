import type { Metadata } from "next";
import badges from "../../../../contributors/badges.json";
import { buildContributorForge, buildContributorLaunchpad } from "../../lib/contributor-forge";
import { ContributorBlueprint } from "./contributor-blueprint";
import { ContributorIntake } from "./contributor-intake";
import "./contributor-intake.css";
import { getContributorPulse } from "./contributor-pulse";

export const metadata: Metadata = {
  title: "Contribute | VibeUsage",
  description: "Live repository state and proof-first contribution lanes for VibeTRACKER.",
};

export default async function ContributorsPage() {
  const launchpad = buildContributorLaunchpad(buildContributorForge(badges.badges));
  const pulse = await getContributorPulse();

  return (
    <div className="contributor-route">
      <ContributorIntake launchpad={launchpad} pulse={pulse} />
      <details className="contributor-blueprint">
        <summary>
          <span>CONTRIBUTOR PROOF CONTRACT</span>
          <b>Open the complete forge specification</b>
          <small>Badges, missions, adapter foundry, trust rails, and publication rules.</small>
        </summary>
        <div className="contributor-blueprint__content"><ContributorBlueprint /></div>
      </details>
    </div>
  );
}
