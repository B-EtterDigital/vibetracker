import type { NormalizedRecord, TokenUsage } from "../schema/record.ts";

export interface ModelTokenRate {
  input: number;
  output: number;
  cacheWrite?: number;
  cacheRead?: number;
  cachedInput?: number;
  source?: string;
}

/**
 * Published USD-per-million-token rates copied verbatim from
 * ~/.claude/skills/sweetspot-moa/model-prices.json.
 */
export const MODEL_RATES = {
  "asOf": "2026-07-02",
  "note": "USD per million tokens. Verified against published pricing pages on asOf date. cacheWrite/cacheRead for Claude models derived from standard Anthropic multipliers (1.25x input / 0.1x input). Update this file when vendors reprice; the SMOA token summary refuses to price models missing from this table.",
  "sources": [
    "https://platform.claude.com/docs/en/about-claude/pricing",
    "https://www.anthropic.com/news/claude-fable-5-mythos-5",
    "https://developers.openai.com/api/docs/pricing"
  ],
  "perMTok": {
    "claude-fable-5": {
      "input": 10,
      "output": 50,
      "cacheWrite": 12.5,
      "cacheRead": 1.0
    },
    "claude-opus-4-8": {
      "input": 5,
      "output": 25,
      "cacheWrite": 6.25,
      "cacheRead": 0.5
    },
    "claude-haiku-4-5": {
      "input": 1,
      "output": 5,
      "cacheWrite": 1.25,
      "cacheRead": 0.1
    },
    "gpt-5.5": {
      "input": 5,
      "cachedInput": 0.5,
      "output": 30
    },
    "gpt-5.6-sol": {
      "input": 5.0,
      "cachedInput": 0.5,
      "output": 30.0,
      "source": "https://platform.openai.com/docs/pricing#text-tokens fetched 2026-07-14 (RD/research/optical-context-compression/lanes/lane-r3-economics.md)"
    },
    "gpt-5.4": {
      "input": 2.5,
      "cachedInput": 0.25,
      "output": 15.0,
      "source": "https://platform.openai.com/docs/pricing#text-tokens fetched 2026-07-14 (lane-r3-economics.md)"
    }
  }
} as const satisfies {
  asOf: string;
  note: string;
  sources: readonly string[];
  perMTok: Record<string, ModelTokenRate>;
};

type TokenPricedRecord = Pick<NormalizedRecord, "model" | "tokenUsage">;

/**
 * Canonicalize the model identifiers persisted by coding ledgers. The normalizer:
 * - removes ccusage-style bracketed providers (`[codex] gpt-5.5`),
 * - keeps the final segment of slash/colon provider prefixes (`anthropic/claude-...`), and
 * - removes Claude's terminal context-window tag (`claude-opus-4-8[1m]`), and
 * - removes a terminal compact or dashed ISO date (`-20250601`, `-2025-06-01`).
 *
 * It does not use fuzzy matching: the normalized id must exactly match the published table.
 */
export function normalizeModelId(model: string): string {
  const withoutBracketProvider = model.trim().toLowerCase().replace(/^\[[^\]]+\]\s*/, "");
  const withoutProviderPrefix = withoutBracketProvider.split(/[/:]/).at(-1) ?? withoutBracketProvider;
  const withoutContextWindow = withoutProviderPrefix.replace(/\[\d+(?:\.\d+)?[km]?\]$/, "");
  return withoutContextWindow.replace(/-(?:20\d{6}|20\d{2}-\d{2}-\d{2})$/, "");
}

function validTokenUsage(usage: TokenUsage): boolean {
  return [usage.input, usage.output, usage.cacheRead, usage.cacheCreate]
    .every((value) => Number.isFinite(value) && value >= 0);
}

/** Estimate API-equivalent USD from explicit token classes; unknown models stay unpriced. */
export function estimateTokenUsd(record: TokenPricedRecord): number | undefined {
  if (record.model == null || record.tokenUsage == null || !validTokenUsage(record.tokenUsage)) {
    return undefined;
  }

  const normalized = normalizeModelId(record.model);
  const rate = (MODEL_RATES.perMTok as Record<string, ModelTokenRate>)[normalized];
  if (rate == null) return undefined;

  const cacheReadRate = rate.cacheRead ?? rate.cachedInput;
  const cacheWriteRate = rate.cacheWrite ?? 0;
  if (cacheReadRate == null) return undefined;

  const usage = record.tokenUsage;
  const usd = (
    usage.input * rate.input
    + usage.output * rate.output
    + usage.cacheRead * cacheReadRate
    + usage.cacheCreate * cacheWriteRate
  ) / 1_000_000;
  return Number(usd.toFixed(6));
}

export interface UnpricedTokenModel {
  model: string;
  tokens: number;
}

/** Distinct fail-loud inventory for token-bearing records the registry cannot price. */
export function unpricedTokenModels(records: readonly NormalizedRecord[]): UnpricedTokenModel[] {
  const volumes = new Map<string, number>();
  for (const record of records) {
    if (record.usdEst !== undefined || record.tokenUsage == null || estimateTokenUsd(record) !== undefined) continue;
    const model = record.model?.trim() || "<missing-model>";
    const usage = record.tokenUsage;
    const tokens = usage.input + usage.output + usage.cacheRead + usage.cacheCreate;
    volumes.set(model, (volumes.get(model) ?? 0) + tokens);
  }
  return [...volumes.entries()]
    .map(([model, tokens]) => ({ model, tokens }))
    .sort((left, right) => right.tokens - left.tokens || left.model.localeCompare(right.model));
}
