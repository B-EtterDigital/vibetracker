import type { NormalizedRecord } from "../schema/record.ts";

export interface NativeRate {
  provider?: string;
  category?: string;
  unit: string;
  usdPerUnit: number;
  basis: "api" | "subscription";
  source: string;
  asOf: string;
}

export const NATIVE_RATES: NativeRate[] = [
  {
    category: "music",
    unit: "track",
    usdPerUnit: 0.02,
    basis: "subscription",
    source: "Suno Premier $10/2,500 credits, 5 credits per clip",
    asOf: "2026-07",
  },
  {
    category: "music",
    unit: "variation",
    usdPerUnit: 0.02,
    basis: "subscription",
    source: "Suno Premier $10/2,500 credits, 5 credits per clip",
    asOf: "2026-07",
  },
  {
    provider: "midjourney",
    unit: "image",
    usdPerUnit: 0.033,
    basis: "subscription",
    source: "Midjourney Standard $30/mo ~900 fast images",
    asOf: "2026-07",
  },
];

type NativePricedRecord = Pick<
  NormalizedRecord,
  "provider" | "category" | "outputQuantity" | "outputUnit" | "usdEst"
>;

function matchesRecord(rate: NativeRate, record: NativePricedRecord): boolean {
  if (rate.unit !== record.outputUnit) return false;
  if (rate.provider != null && rate.provider !== record.provider) return false;
  if (rate.category != null && rate.category !== record.category) return false;
  return true;
}

export function estimateNativeUsd(
  record: NativePricedRecord,
  rates: readonly NativeRate[] = NATIVE_RATES,
): number | undefined {
  if (record.usdEst !== undefined) return record.usdEst;

  const quantity = record.outputQuantity;
  if (quantity == null || !Number.isFinite(quantity) || quantity <= 0 || record.outputUnit == null) {
    return undefined;
  }

  const rate = rates.find((candidate) => (
    candidate.provider != null && matchesRecord(candidate, record)
  )) ?? rates.find((candidate) => (
    candidate.provider == null && candidate.category != null && matchesRecord(candidate, record)
  ));

  return rate == null
    ? undefined
    : Number((rate.usdPerUnit * quantity).toFixed(6));
}
