// Pure normalizer: fal.ai usage ledger -> VibeTRACKER NormalizedRecord[].
// No I/O, no deps — this is the tested heart of the adapter.
//
// fal is a USD-native, pay-per-use platform. The /models/usage endpoint is a real
// per-endpoint ledger (source "ledger", confidence "high"). Each row carries a native
// metered unit (image/second/megapixel/token/request) and a USD `cost` the API returns
// directly, so usdEst is populated from the API rather than estimated from a rate.

import type { NormalizedRecord, Category, Unit } from "../../../core/src/schema/record.ts";
import type { FalUsagePage, FalUsageResult } from "./client.ts";

// Best-effort category inference from the endpoint id (e.g. "fal-ai/kling-video/.../image-to-video").
// Ordered: video before image, because video endpoints embed "image" ("image-to-video").
const CATEGORY_RULES: Array<{ re: RegExp; category: Category }> = [
  { re: /(video|veo|kling|wan|hunyuan-video|minimax|hailuo|seedance|runway|luma|pika|mochi|ltx|cogvideo|animate|framepack|\bt2v\b|\bi2v\b|to-video|img2vid)/i, category: "video" },
  { re: /(whisper|audio|music|speech|voice|\btts\b|\basr\b|\bstt\b|dubbing|elevenlabs|playai|kokoro|f5-tts|chatterbox|mmaudio|transcri|sound|sfx|to-speech)/i, category: "audio" },
  { re: /(hunyuan3d|trellis|triposr|\b3d\b|\bmesh\b|\bglb\b|to-3d)/i, category: "3d" },
  { re: /(any-llm|\bllm\b|\bvlm\b|llava|\bgpt\b|\bclaude\b|llama|qwen|mistral|gemma|deepseek|completion)/i, category: "llm" },
  { re: /(flux|sdxl|stable-diffusion|\bsd3\b|\bimage\b|sana|recraft|ideogram|imagen|kolors|pixart|omnigen|nano-banana|gpt-image|photo|upscale|inpaint|outpaint|background|to-image|img2img|\bt2i\b|\bi2i\b|lora)/i, category: "image" },
];

export function inferCategory(endpointId: string): Category {
  for (const rule of CATEGORY_RULES) if (rule.re.test(endpointId)) return rule.category;
  return "other";
}

// Derive a provider-native operation label from the endpoint path when it encodes one.
const OPERATION_RULES: Array<{ re: RegExp; op: string }> = [
  { re: /(image-to-video|img2vid|\bi2v\b)/i, op: "image-to-video" },
  { re: /(text-to-video|\bt2v\b)/i, op: "text-to-video" },
  { re: /(image-to-image|img2img|\bi2i\b)/i, op: "image-to-image" },
  { re: /(text-to-image|\bt2i\b)/i, op: "text-to-image" },
  { re: /(text-to-speech|\btts\b|to-speech)/i, op: "text-to-speech" },
  { re: /(whisper|transcri|speech-to-text|\bstt\b|\basr\b)/i, op: "transcribe" },
  { re: /(upscale|super-resolution)/i, op: "upscale" },
  { re: /(to-3d|hunyuan3d|trellis|triposr)/i, op: "image-to-3d" },
];

export function inferOperation(endpointId: string): string {
  for (const rule of OPERATION_RULES) if (rule.re.test(endpointId)) return rule.op;
  return "inference";
}

// Map fal's native billed unit onto the core Unit enum. Units without a slot
// (megapixel, compute, gpu-second, …) fall back to "request"; the native string is
// preserved verbatim in rawUnit so no fidelity is lost.
export function mapUnit(nativeUnit: string): Unit {
  switch (nativeUnit.toLowerCase()) {
    case "second": case "seconds": case "compute-second": return "second";
    case "image": case "images": return "image";
    case "token": case "tokens": return "token";
    case "character": case "characters": case "char": return "character";
    case "clip": case "clips": case "video": return "clip";
    case "credit": case "credits": return "credit";
    case "request": case "requests": case "call": case "calls": case "inference": return "request";
    default: return "request";
  }
}

function toRecord(bucketTs: string, r: FalUsageResult): NormalizedRecord {
  const record: NormalizedRecord = {
    ts: bucketTs,
    provider: "falai",
    category: inferCategory(r.endpoint_id),
    operation: inferOperation(r.endpoint_id),
    model: r.endpoint_id,
    quantity: r.quantity,
    unit: mapUnit(r.unit),
    rawAmount: r.quantity,          // native metered amount (e.g. 8 seconds, 4 images)
    rawUnit: r.unit,                // native unit verbatim: "second" | "image" | "megapixel" | ...
    source: "ledger",              // fal exposes a real per-endpoint usage ledger
    confidence: "high",
    verified: false,               // set true only when the backend fetches authoritatively
  };
  // usdEst comes straight from the API's USD cost — not an estimate from a rate.
  if (r.cost != null && (r.currency == null || r.currency.toUpperCase() === "USD")) {
    record.usdEst = Number(r.cost.toFixed(6));
  }
  return record;
}

/** Flatten a usage page (time_series) into normalized records. Pure. */
export function normalizeUsage(page: FalUsagePage): NormalizedRecord[] {
  const out: NormalizedRecord[] = [];
  for (const bucket of page.time_series ?? []) {
    for (const r of bucket.results) out.push(toRecord(bucket.bucket, r));
  }
  return out;
}
