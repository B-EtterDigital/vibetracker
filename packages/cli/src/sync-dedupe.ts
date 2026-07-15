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
