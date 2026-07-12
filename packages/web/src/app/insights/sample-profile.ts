import type { ProfileView } from "../../lib/data.ts";

export const INSIGHTS_SAMPLE_PROFILE: ProfileView = {
  handle: "insights-lab",
  created_at: "2026-07-05T00:00:00Z",
  isPremium: false,
  latest: {
    total_usd: 64.5,
    total_credits: 1200,
    record_count: 2400,
    created_at: "2026-07-05T00:00:00Z",
    tier: "attested",
  },
  providers: [
    { provider: "higgsfield", ops: 200, credits: 800, usd: 44 },
    { provider: "claude-code", ops: 1800, credits: 300, usd: 14 },
    { provider: "ollama", ops: 400, credits: 100, usd: 6.5 },
  ],
  usageDays: [
    { date: "2026-07-03", ops: 600, credits: 250, usd: 14.5 },
    { date: "2026-07-04", ops: 800, credits: 400, usd: 20 },
    { date: "2026-07-05", ops: 1000, credits: 550, usd: 30 },
  ],
  categories: [], providerDays: [], providerModels: [], trustSignals: [],
};
