import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import type { Cynaps3UsageEvent } from "./client.ts";

export function normalizeEvents(events: Cynaps3UsageEvent[], accountId: string): NormalizedRecord[] {
  return events.map((event) => {
    const billedProvider = event.billingOwner === "upstream-provider" ? event.providerId : "cynaps3";
    const isNativeOutput = event.operation === "track" || event.operation === "variation";
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
      // Only track/variation events are native audio outputs. Lyrics, imports, and future
      // operation strings remain requests without fabricated output or duration metadata.
      ...(isNativeOutput ? {
        outputQuantity: event.status === "completed" ? 1 : 0,
        outputUnit: event.operation === "variation" ? "variation" : "track",
        durationSeconds: event.audioSeconds,
      } : {}),
      source: "ledger",
      confidence: "high",
      verified: false,
      accountId,
    };
  });
}
