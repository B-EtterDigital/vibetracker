import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import type { Cynaps3UsageEvent } from "./client.ts";

export function normalizeEvents(events: Cynaps3UsageEvent[], accountId: string): NormalizedRecord[] {
  return events.map((event) => ({
    ts: new Date(event.occurredAt).toISOString(),
    provider: "cynaps3",
    category: "music",
    operation: event.operation,
    ...(event.model ? { model: event.model } : {}),
    quantity: 1,
    unit: "request",
    rawAmount: event.creditsConsumed,
    rawUnit: "credits",
    outputQuantity: event.tracksCreated,
    outputUnit: "track",
    durationSeconds: event.audioSeconds,
    source: "ledger",
    confidence: "high",
    verified: true,
    accountId,
  }));
}
