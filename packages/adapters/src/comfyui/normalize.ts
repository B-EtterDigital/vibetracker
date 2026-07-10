// Pure: ComfyUI /history -> NormalizedRecord[]. Local tier (source "local", cost $0).

import type { NormalizedRecord, Category, Unit } from "../../../core/src/schema/record.ts";
import type { ComfyHistory, ComfyHistoryEntry } from "./client.ts";

function timestampOf(entry: ComfyHistoryEntry): string | null {
  const msgs = entry.status?.messages ?? [];
  const start = msgs.find((m) => m[0] === "execution_start" && m[1]?.timestamp);
  const any = msgs.find((m) => m[1]?.timestamp);
  const ts = start?.[1]?.timestamp ?? any?.[1]?.timestamp;
  return ts ? new Date(ts).toISOString() : null;
}

function classify(entry: ComfyHistoryEntry): { category: Category; unit: Unit; count: number } {
  let images = 0;
  let media = 0;
  for (const out of Object.values(entry.outputs ?? {})) {
    images += out.images?.length ?? 0;
    media += (out.gifs?.length ?? 0) + (out.videos?.length ?? 0);
  }
  if (media > 0) return { category: "video", unit: "clip", count: media };
  return { category: "image", unit: "image", count: images || 1 };
}

export function normalizeHistory(h: ComfyHistory): NormalizedRecord[] {
  const out: NormalizedRecord[] = [];
  for (const entry of Object.values(h)) {
    if (entry.status?.completed === false) continue;
    if (entry.status?.status_str && entry.status.status_str !== "success") continue;
    const ts = timestampOf(entry);
    if (!ts) continue;
    const { category, unit, count } = classify(entry);
    out.push({
      ts, provider: "comfyui", category, operation: "generate", model: "workflow",
      quantity: count, unit, rawAmount: count, rawUnit: unit,
      source: "local", confidence: "high", verified: false,
    });
  }
  return out;
}
