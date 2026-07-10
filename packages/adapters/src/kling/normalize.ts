// Pure normalizer: Kling task list -> NormalizedRecord[] via feed reconstruction.
// Kling returns no per-task cost, so default to counting tasks (unit "request"); an
// optional per-model credit map upgrades records to reconstructed credit spend.

import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import type { KlingTask } from "./client.ts";

function isConsuming(task: KlingTask): boolean {
  const s = (task.task_status ?? "succeed").toLowerCase();
  return s === "succeed" || s === "success" || s === "completed";
}

export interface KlingNormalizeOpts {
  creditsByModel?: Record<string, number>; // ⚠ VERIFY real per-model credit costs
  creditUsd?: number;
}

export function normalizeTasks(tasks: KlingTask[], opts: KlingNormalizeOpts = {}): NormalizedRecord[] {
  const out: NormalizedRecord[] = [];
  for (const task of tasks) {
    if (!isConsuming(task)) continue;
    const credits = opts.creditsByModel?.[task.model_name ?? ""];
    const rec: NormalizedRecord = {
      ts: new Date(task.created_at).toISOString(),
      provider: "kling",
      category: "video",
      operation: task.type ?? "generate",
      model: task.model_name,
      quantity: 1,
      unit: credits != null ? "credit" : "request",
      rawAmount: credits ?? 1,
      rawUnit: credits != null ? "credits" : "request",
      source: "feed_recon",
      confidence: "medium",
      verified: false,
    };
    if (credits != null && opts.creditUsd != null) rec.usdEst = Number((credits * opts.creditUsd).toFixed(6));
    out.push(rec);
  }
  return out;
}
