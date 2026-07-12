import { buildInsightsRunwaySource } from "../../lib/insights-runway.ts";
import { RunwayDecisionConsole } from "./runway-decision-console";
import { INSIGHTS_SAMPLE_PROFILE } from "./sample-profile";
import "./insights.css";
import "./insights-controls.css";
import "./insights-ledger.css";
import "./insights-responsive.css";

export const metadata = {
  title: "AI Runway Console · VibeUsage",
  description: "Tune a dry-run AI usage budget, inspect local-shift value, and see every planning delta without changing usage data.",
};

export default function InsightsPage() {
  const source = buildInsightsRunwaySource(INSIGHTS_SAMPLE_PROFILE);
  return (
    <RunwayDecisionConsole
      activeDays={INSIGHTS_SAMPLE_PROFILE.usageDays.length}
      providerCount={INSIGHTS_SAMPLE_PROFILE.providers.length}
      recordCount={INSIGHTS_SAMPLE_PROFILE.latest?.record_count ?? 0}
      source={source}
    />
  );
}
