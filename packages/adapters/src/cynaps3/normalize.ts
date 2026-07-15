import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import type { Cynaps3UsageEvent } from "./client.ts";

export function normalizeEvents(events: Cynaps3UsageEvent[], accountId: string): NormalizedRecord[] {
  return events.map((event) => {
    const billedProvider = event.billingOwner === "upstream-provider" ? event.providerId : "cynaps3";
    return {
      ts: new Date(event.occurredAt).toISOString(),
      provider: billedProvider,
      toolId: "cynaps3",
      sourceEventId: event.upstreamEventId ?? event.id,
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
      verified: false,
      accountId,
    };
  });
}
