// Proxy tier — extract usage from an OpenAI-compatible response body. This is the pure,
// tested heart of `vibetracker proxy`, which forwards traffic to Ollama / LM Studio / any
// OpenAI-compatible endpoint (x.ai, z.ai, GLM, Groq, Together, DeepSeek, …) and logs usage.

import type { NormalizedRecord, Category, Source } from "./schema/record.ts";

export interface ExtractOpts {
  provider: string;
  category?: Category;
  source?: Source;              // "proxy" (hosted) or "local" (Ollama/LM Studio)
  usdPerInputToken?: number;
  usdPerOutputToken?: number;
  ts?: string;
}

export function extractOpenAIUsage(body: unknown, opts: ExtractOpts): NormalizedRecord | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as { usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }; model?: string };
  const u = b.usage;
  if (!u) return null;
  const input = u.prompt_tokens ?? 0;
  const output = u.completion_tokens ?? 0;
  const total = u.total_tokens ?? input + output;
  if (total <= 0) return null;

  const rec: NormalizedRecord = {
    ts: opts.ts ?? new Date().toISOString(),
    provider: opts.provider,
    category: opts.category ?? "llm",
    operation: "chat",
    model: typeof b.model === "string" ? b.model : undefined,
    quantity: 1,
    unit: "token",
    rawAmount: total,
    rawUnit: "tokens",
    source: opts.source ?? "proxy",
    confidence: "high",
    verified: false,
  };
  if (opts.usdPerInputToken != null || opts.usdPerOutputToken != null) {
    rec.usdEst = Number((input * (opts.usdPerInputToken ?? 0) + output * (opts.usdPerOutputToken ?? 0)).toFixed(6));
  }
  return rec;
}
