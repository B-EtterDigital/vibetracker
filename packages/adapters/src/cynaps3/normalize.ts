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
      // the derived producer emits one event per completed track OR variation (operation carries
      // which). Surface them SEPARATELY as native outputs so the profile can list both — a
      // variation is a real generation the track count alone would hide (user rule 2026-07-19).
      outputQuantity: 1,
      outputUnit: event.operation === "variation" ? "variation" : "track",
      durationSeconds: event.audioSeconds,
      source: "ledger",
      confidence: "high",
      verified: false,
      accountId,
    };
  });
}
