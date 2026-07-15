import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import type { LeonardoGeneration } from "./client.ts";

export function normalizeGenerations(generations: LeonardoGeneration[]): NormalizedRecord[] {
  const records: NormalizedRecord[] = [];
  for (const generation of generations) {
    if (generation.status !== "COMPLETE" || !generation.createdAt) continue;
    const imageCount = generation.generated_images?.length ?? 0;
    if (imageCount === 0 || Number.isNaN(Date.parse(generation.createdAt))) continue;

    records.push({
      ts: new Date(generation.createdAt).toISOString(),
      provider: "leonardo",
      category: "image",
      operation: "generate_image",
      model: generation.modelId ?? undefined,
      quantity: imageCount,
      unit: "image",
      rawAmount: imageCount,
      rawUnit: "images",
      outputQuantity: imageCount,
      outputUnit: "image",
      source: "feed_recon",
      confidence: "high",
      verified: false,
    });
  }
  return records;
}
