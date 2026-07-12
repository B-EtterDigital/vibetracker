// Per-token USD pricing for Codex (OpenAI gpt-5-class) models — log-parse tier
// computes cost locally. ⚠ VERIFY against current pricing; USD is an ESTIMATE.
// In production this comes from the backend pricing surface, not a bundled constant.

export interface ModelPrice {
  input: number; cachedInput: number; output: number; // USD per token
}

// Rates expressed per million tokens, then divided to per-token below. ⚠ VERIFY.
// Specific matches must precede generic family matches — first hit wins.
const PER_MTOK: Array<{ match: RegExp; price: ModelPrice }> = [
  // Lighter variants first: "mini"/"spark" are the cheaper tier and can also match
  // the codex/gpt-5 family rules below, so they must win before them.
  { match: /mini|spark/i,                          price: { input: 0.25, cachedInput: 0.025, output: 2 } },
  { match: /5\.?6.*sol|5\.5|5\.4/i,                price: { input: 1.25, cachedInput: 0.125, output: 10 } },
  { match: /5-codex|5\.3-codex|5\.2/i,             price: { input: 1.25, cachedInput: 0.125, output: 10 } },
  { match: /gpt-?5/i,                              price: { input: 1.25, cachedInput: 0.125, output: 10 } },
];

export function priceFor(model: string): ModelPrice | undefined {
  for (const { match, price } of PER_MTOK) {
    if (match.test(model)) {
      return {
        input: price.input / 1e6,
        cachedInput: price.cachedInput / 1e6,
        output: price.output / 1e6,
      };
    }
  }
  return undefined; // non-Codex / unknown models -> no USD estimate
}
