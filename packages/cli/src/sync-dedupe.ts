import type { NormalizedRecord } from "../../core/src/schema/record.ts";

type SyncIdentity = Pick<
  NormalizedRecord,
  "provider" | "ts" | "operation" | "model" | "rawAmount" | "sourceEventId" | "toolId"
>;

export function syncRecordKey(record: SyncIdentity): string {
  return record.sourceEventId
    ? `${record.provider}|event:${record.sourceEventId}`
    : `${record.provider}|${record.ts}|${record.operation}|${record.model ?? ""}|${record.rawAmount}`;
}

export function shouldReplaceSyncRecord(prior: SyncIdentity, incoming: SyncIdentity): boolean {
  return syncRecordKey(prior) === syncRecordKey(incoming)
    && Boolean(incoming.toolId)
    && !prior.toolId;
}

type ImportDayIdentity = Pick<NormalizedRecord, "provider" | "category" | "ts" | "operation" | "source">;

function providerDayKey(record: Pick<ImportDayIdentity, "provider" | "ts">): string {
  return `${record.provider}|${record.ts.slice(0, 10)}`;
}

export interface ImportDayReconciliation<T> {
  kept: T[];
  superseded: T[];
  coveredDays: string[];
}

export interface FullScanProviderReconciliation<T> {
  kept: T[];
  superseded: T[];
  providers: string[];
}

/**
 * Drop aggregate import rows only for provider-days covered by current full-log records.
 * The caller writes `kept + fresh` once, so replacement never exposes a mixed ledger.
 */
export function reconcileImportDayRows<T extends ImportDayIdentity>(
  existing: readonly T[],
  incoming: readonly ImportDayIdentity[],
): ImportDayReconciliation<T> {
  const coveredDays = new Set(
    incoming
      .filter((record) => record.source === "log" && record.operation !== "import-day")
      .map(providerDayKey),
  );
  const kept: T[] = [];
  const superseded: T[] = [];
  for (const record of existing) {
    if (record.operation === "import-day" && coveredDays.has(providerDayKey(record))) {
      superseded.push(record);
    } else {
      kept.push(record);
    }
  }
  return { kept, superseded, coveredDays: [...coveredDays].sort() };
}

/** Replace complete provider histories only when their full-log parser returned records. */
export function reconcileFullScanProviders<T extends ImportDayIdentity>(
  existing: readonly T[],
  incoming: readonly ImportDayIdentity[],
): FullScanProviderReconciliation<T> {
  const fullScanRecords = incoming
    .filter((record) => record.source === "log" && record.operation !== "import-day");
  const sliceKeys = new Set(fullScanRecords.map((record) => `${record.provider}|${record.category}`));
  const providers = new Set(fullScanRecords.map((record) => record.provider));
  const kept: T[] = [];
  const superseded: T[] = [];
  for (const record of existing) {
    if (sliceKeys.has(`${record.provider}|${record.category}`)) {
      superseded.push(record);
    } else {
      kept.push(record);
    }
  }
  return { kept, superseded, providers: [...providers].sort() };
}
