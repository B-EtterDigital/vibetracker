// Per-token USD pricing for Claude models (log-parse tier computes cost locally).
// ⚠ VERIFY against current Anthropic pricing — in production this comes from the
// backend pricing surface, not a bundled constant. USD is always an ESTIMATE.

export interface ModelPrice {
  input: number; output: number; cacheWrite: number; cacheRead: number; // USD per token
}

// Rates expressed per million tokens, then divided to per-token below. ⚠ VERIFY.
// Specific matches must precede generic family matches — first hit wins.
const PER_MTOK: Array<{ match: RegExp; price: ModelPrice }> = [
  { match: /fable/i,        price: { input: 10,   output: 50,  cacheWrite: 12.5,  cacheRead: 1.0 } },
  { match: /opus-4-[5-9]/i, price: { input: 5,    output: 25,  cacheWrite: 6.25,  cacheRead: 0.5 } },
  { match: /opus/i,         price: { input: 15,   output: 75,  cacheWrite: 18.75, cacheRead: 1.5 } },
  { match: /sonnet/i,       price: { input: 3,    output: 15,  cacheWrite: 3.75,  cacheRead: 0.3 } },
  { match: /haiku-4-5/i,    price: { input: 1,    output: 5,   cacheWrite: 1.25,  cacheRead: 0.1 } },
  { match: /haiku/i,        price: { input: 0.8,  output: 4,   cacheWrite: 1.0,   cacheRead: 0.08 } },
];

export function priceFor(model: string): ModelPrice | undefined {
  for (const { match, price } of PER_MTOK) {
    if (match.test(model)) {
      return {
        input: price.input / 1e6, output: price.output / 1e6,
        cacheWrite: price.cacheWrite / 1e6, cacheRead: price.cacheRead / 1e6,
      };
    }
  }
  return undefined; // synthetic/unknown models -> no USD estimate
}
