// Viber trait levels — ten levels per discipline, level 1 deliberately easy to reach, every
// step after it earning real bragging rights (user order 2026-07-15: "pretty easy for lvl 1,
// rewarding for every level, really isn't easy to achieve" — e.g. video gen L1 = 1,000 credits,
// L2 = 5,000, L3 = 10,000, escalating).
//
// Measures per trait family:
//   · creative traits (image/video/music/voice/3d) level on CREDITS burned in that trait — the
//     platform-native unit of media generation (Higgsfield/Suno credits).
//     When a trait has real generations but its sources bill in dollars, not credits (fal.ai),
//     credits are approximated as ops (one generation ≈ one credit-equivalent) so the trait
//     still levels; the UI labels the measure it used.
//   · coding levels on OPERATIONS (token-derived — the only coding volume held for full history).
//   · research/tooling level on OPERATIONS with a lighter curve.
// All thresholds are documented constants — no per-user tuning, ever.

export type LevelMeasure = "credits" | "ops";

export interface TraitLevel {
  level: number;          // 0..10 (0 = not yet level 1)
  measure: LevelMeasure;
  value: number;          // the measured amount that was levelled
  currentFloor: number;   // threshold of the current level (0 when level 0)
  next: number | null;    // threshold of the next level (null at level 10)
  progress: number;       // 0..1 toward the next level (1 at level 10)
}

// L1 easy → L10 genuinely hard. Creative credits: 1k / 5k / 10k / 25k / 50k / 100k / 250k /
// 500k / 1M / 2.5M — a maxed $200 media sub is ~50k credits/month, so L10 is years of heavy work.
export const CREATIVE_CREDIT_CURVE = [
  1_000, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000, 2_500_000,
] as const;

// Coding ops are token-derived and huge: 1M ops is a real first month, 25B is elite.
export const CODING_OPS_CURVE = [
  1_000_000, 10_000_000, 50_000_000, 100_000_000, 500_000_000,
  1_000_000_000, 2_500_000_000, 5_000_000_000, 10_000_000_000, 25_000_000_000,
] as const;

// Research/tooling are conversation-scale: 100 ops is an honest start, 1M is relentless.
export const SUPPORT_OPS_CURVE = [
  100, 500, 1_500, 5_000, 15_000, 40_000, 100_000, 250_000, 500_000, 1_000_000,
] as const;

const CREATIVE_TRAITS = new Set(["image", "video", "music", "voice", "threed"]);

export function curveFor(traitId: string): { curve: readonly number[]; measure: LevelMeasure } {
  if (traitId === "coding") return { curve: CODING_OPS_CURVE, measure: "ops" };
  if (CREATIVE_TRAITS.has(traitId)) return { curve: CREATIVE_CREDIT_CURVE, measure: "credits" };
  return { curve: SUPPORT_OPS_CURVE, measure: "ops" };
}

export function levelFor(traitId: string, credits: number, ops: number): TraitLevel {
  const { curve, measure } = curveFor(traitId);
  // fal.ai-style sources bill dollars, not credits: fall back to ops as credit-equivalents so
  // real creative work still levels (documented approximation, surfaced via `measure`)
  const usedMeasure: LevelMeasure = measure === "credits" && credits <= 0 && ops > 0 ? "ops" : measure;
  const value = usedMeasure === "credits" ? credits : ops;

  let level = 0;
  for (const threshold of curve) {
    if (value >= threshold) level += 1;
    else break;
  }
  const currentFloor = level > 0 ? curve[level - 1] : 0;
  const next = level < curve.length ? curve[level] : null;
  const progress = next === null
    ? 1
    : Math.max(0, Math.min(1, (value - currentFloor) / (next - currentFloor)));
  return { level, measure: usedMeasure, value, currentFloor, next, progress };
}

export function fmtMeasure(value: number, measure: LevelMeasure): string {
  const compact = value >= 1e9 ? `${(value / 1e9).toFixed(1)}B`
    : value >= 1e6 ? `${(value / 1e6).toFixed(1)}M`
      : value >= 1e3 ? `${Math.round(value / 1e3)}k`
        : String(Math.round(value));
  return `${compact} ${measure === "credits" ? "credits" : "ops"}`;
}
