// Pure normalizer: Replicate prediction ledger -> VibeTRACKER NormalizedRecord[].
// No I/O, no deps — this is the tested heart of the adapter.
//
// Replicate bills per GPU-second of compute. Each prediction carries its billed
// time in metrics.predict_time (seconds), so we treat the predictions list as a
// per-operation ledger: one record per prediction, native unit = seconds.

import type { NormalizedRecord, Category } from "../../../core/src/schema/record.ts";
import type { ReplicatePrediction } from "./client.ts";

// Best-effort category inference from the model slug ("{owner}/{name}").
// Ordered: check the more specific media types before the generic "image".
const CATEGORY_RULES: Array<{ re: RegExp; category: Category }> = [
  { re: /(video|svd|animate|wan|kling|hunyuan|mochi|ltx|cogvideo|zeroscope|veo|seedance|motion|i2v|t2v)/i, category: "video" },
  { re: /(whisper|tts|speech|voice|music|audio|bark|musicgen|xtts|rvc|tortoise|dia|sound)/i, category: "audio" },
  { re: /(llama|mistral|mixtral|qwen|gpt|deepseek|phi|gemma|vicuna|falcon|command-r|granite|yi-|glm|llm|chat|instruct)/i, category: "llm" },
  { re: /(flux|sdxl|stable-diffusion|sd3|image|photo|img|kandinsky|dalle|imagen|ideogram|recraft|photomaker|controlnet|inpaint|upscale|esrgan|face)/i, category: "image" },
];

export function inferCategory(model: string): Category {
  for (const rule of CATEGORY_RULES) if (rule.re.test(model)) return rule.category;
  return "other";
}

export interface NormalizeOpts {
  /** USD per GPU-second, if known. When set, usdEst is populated as a labelled ESTIMATE. */
  usdPerSecond?: number;
}

export function normalizePredictions(
  items: ReplicatePrediction[],
  opts: NormalizeOpts = {},
): NormalizedRecord[] {
  const out: NormalizedRecord[] = [];
  for (const p of items) {
    // No billed compute time => nothing was charged (e.g. still starting/processing,
    // or a job that never ran). Skip so we don't emit a zero-cost phantom record.
    const seconds = p.metrics?.predict_time;
    if (seconds == null || seconds <= 0) continue;

    const record: NormalizedRecord = {
      ts: p.created_at,
      provider: "replicate",
      category: inferCategory(p.model),
      operation: "predict",
      model: p.model,
      quantity: 1,
      unit: "second",
      rawAmount: seconds,
      rawUnit: "seconds",
      source: "ledger",
      confidence: "high",
      verified: false,
    };
    if (p.id) record.sessionId = p.id;
    if (opts.usdPerSecond != null) {
      record.usdEst = Number((seconds * opts.usdPerSecond).toFixed(6));
    }
    out.push(record);
  }
  return out;
}
