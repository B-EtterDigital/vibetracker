// Midjourney does not provide a public usage API and prohibits third-party automation.
// This importer records the lifetime image total the user reads from Midjourney's official
// `/info` panel. It never accepts, reads, or stores a Midjourney session credential.

import type { NormalizedRecord } from "../../core/src/schema/record.ts";

export const MIDJOURNEY_LIFETIME_OPERATION = "lifetime_images";

export interface MidjourneyLifetimeInput {
  images: number;
  asOf: string;
  usdEst?: number;
  accountId?: string;
  profileId?: string;
  teamId?: string;
}

function boundedImageCount(value: number): number {
  if (!Number.isSafeInteger(value) || value <= 0 || value > 1_000_000_000) {
    throw new Error("Midjourney lifetime images must be a whole number between 1 and 1,000,000,000");
  }
  return value;
}

function importTimestamp(value: string): string {
  const candidate = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T12:00:00.000Z`
    : value;
  const timestamp = new Date(candidate);
  if (Number.isNaN(timestamp.getTime())) throw new Error("Midjourney import --as-of must be a valid date");
  return timestamp.toISOString();
}

/** Extract the official Lifetime Usage image count from copied `/info` text. */
export function parseMidjourneyInfo(text: string): number | null {
  const normalized = String(text ?? "").replace(/\u00a0/g, " ");
  const patterns = [
    /lifetime\s+usage[\s\S]{0,160}?([0-9][0-9,]*)\s*(?:images?|generations?)\b/i,
    /([0-9][0-9,]*)\s*(?:images?|generations?)[\s\S]{0,80}?lifetime\s+usage\b/i,
  ];
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match) continue;
    const images = Number(match[1].replace(/,/g, ""));
    if (Number.isSafeInteger(images) && images > 0 && images <= 1_000_000_000) return images;
  }
  return null;
}

export function buildMidjourneyLifetimeRecord(input: MidjourneyLifetimeInput): NormalizedRecord {
  const images = boundedImageCount(input.images);
  if (input.usdEst != null && (!Number.isFinite(input.usdEst) || input.usdEst < 0)) {
    throw new Error("Midjourney import --usd must be a non-negative number");
  }
  return {
    ts: importTimestamp(input.asOf),
    provider: "midjourney",
    category: "image",
    operation: MIDJOURNEY_LIFETIME_OPERATION,
    quantity: images,
    unit: "image",
    rawAmount: images,
    rawUnit: "images",
    outputQuantity: images,
    outputUnit: "image",
    ...(input.usdEst != null ? { usdEst: input.usdEst } : {}),
    source: "manual",
    confidence: "low",
    verified: false,
    ...(input.accountId ? { accountId: input.accountId } : {}),
    ...(input.profileId ? { profileId: input.profileId } : {}),
    ...(input.teamId ? { teamId: input.teamId } : {}),
  };
}

/** Re-import owns only its cumulative snapshot; separate subscription/spend rows survive. */
export function isMidjourneyLifetimeImport(record: NormalizedRecord): boolean {
  return record.provider === "midjourney"
    && record.operation === MIDJOURNEY_LIFETIME_OPERATION
    && record.source === "manual";
}
