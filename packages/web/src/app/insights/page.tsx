import { buildInsightsRunwaySource } from "../../lib/insights-runway.ts";
import { getProfile, type ProfileView } from "../../lib/data.ts";
import { buildDemoProfile, DEMO_HANDLE } from "../../lib/demo-profile.ts";
import { RunwayDecisionConsole } from "./runway-decision-console";
import { INSIGHTS_SAMPLE_PROFILE } from "./sample-profile";
import "./insights.css";
import "./insights-brief.css";
import "./insights-controls.css";
import "./insights-ledger.css";
import "./insights-responsive.css";

export const metadata = {
  title: "AI Cost Plan · VibeUsage",
  description: "Understand a 30-day AI spend forecast, test a monthly limit and local-work scenario, and see the calculation without changing usage data.",
};

type InsightsSourceMode = "public" | "demo" | "sample";

interface InsightsPageProps {
  searchParams: Promise<{ handle?: string | string[] }>;
}

const PUBLIC_HANDLE_RE = /^[a-zA-Z0-9_.-]{1,64}$/;

function requestedHandle(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

async function resolveProfile(handle: string): Promise<{
  profile: ProfileView;
  mode: InsightsSourceMode;
  notice: string | null;
}> {
  if (!handle) {
    return { profile: INSIGHTS_SAMPLE_PROFILE, mode: "sample", notice: null };
  }
  if (!PUBLIC_HANDLE_RE.test(handle)) {
    return {
      profile: INSIGHTS_SAMPLE_PROFILE,
      mode: "sample",
      notice: "That handle is not valid. Showing the bundled sample without using it as your data.",
    };
  }
  if (handle === DEMO_HANDLE) {
    return { profile: buildDemoProfile(), mode: "demo", notice: null };
  }
  const profile = await getProfile(handle);
  if (profile) {
    return { profile, mode: "public", notice: null };
  }
  return {
    profile: INSIGHTS_SAMPLE_PROFILE,
    mode: "sample",
    notice: `No published VibeUsage profile exists for @${handle}. Showing the bundled sample instead.`,
  };
}

export default async function InsightsPage({ searchParams }: InsightsPageProps) {
  const handle = requestedHandle((await searchParams).handle);
  const { profile, mode, notice } = await resolveProfile(handle);
  const source = buildInsightsRunwaySource(profile);
  return (
    <RunwayDecisionConsole
      activeDays={source.activeDays}
      handle={profile.handle}
      key={`${mode}:${profile.handle}:${handle}`}
      notice={notice}
      providerCount={profile.providers.length}
      recordCount={profile.latest?.record_count ?? 0}
      source={source}
      sourceMode={mode}
      requestedHandle={handle}
    />
  );
}
