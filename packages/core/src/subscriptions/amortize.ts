import type { Category, NormalizedRecord } from "../schema/record.ts";

export interface SubscriptionAmortizeInput {
  provider: string;
  category: Category;
  usd: number;
  from: string;
  to: string;
  accountId?: string;
  profileId?: string;
  teamId?: string;
  note?: string;
}

function utcDay(date: string): Date {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) throw new Error(`invalid date: ${date}`);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function amortizeSubscription(input: SubscriptionAmortizeInput): NormalizedRecord[] {
  if (!Number.isFinite(input.usd) || input.usd <= 0) throw new Error("--usd must be a positive number");
  const from = utcDay(input.from);
  const to = utcDay(input.to);
  if (to < from) throw new Error("--to must be on or after --from");
  const days = Math.floor((to.getTime() - from.getTime()) / 86400000) + 1;
  const dailyUsd = Number((input.usd / days).toFixed(4));
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(from.getTime() + i * 86400000);
    return {
      ts: d.toISOString(),
      provider: input.provider,
      category: input.category,
      operation: input.note ?? "subscription-amortized",
      quantity: 1,
      unit: "request",
      rawAmount: dailyUsd,
      rawUnit: "usd",
      usdEst: dailyUsd,
      source: "manual",
      confidence: "low",
      verified: false,
      ...(input.accountId ? { accountId: input.accountId } : {}),
      ...(input.profileId ? { profileId: input.profileId } : {}),
      ...(input.teamId ? { teamId: input.teamId } : {}),
    } satisfies NormalizedRecord;
  });
}
