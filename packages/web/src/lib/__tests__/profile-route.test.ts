import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("packages/web/src/app/u/[handle]/page.tsx", "utf8");
const panels = readFileSync("packages/web/src/app/u/[handle]/panels.tsx", "utf8");
const chart = readFileSync("packages/web/src/app/u/[handle]/profile-chart.tsx", "utf8");
const styles = readFileSync("packages/web/src/app/u/[handle]/profile.css", "utf8");

test("public profile route reveals panels from deterministic signal depth", () => {
  assert.match(page, /import \{ PROVIDERS \} from "\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/adapters\/src\/index"/);
  assert.doesNotMatch(page, /adapters\/src\/registry/);
  assert.match(page, /const loadProfile = cache/);
  assert.match(page, /export async function generateMetadata/);
  assert.match(page, /read\.identity\.label/);
  assert.match(page, /readComplexity\(profile, PROVIDERS\)/);
  assert.match(page, /const \{ facts, reveal \} = read/);
  assert.match(page, /signalTier=\{read\.tier\}/);
  assert.match(page, /signalHint=\{read\.hint\}/);
  assert.match(page, /identity=\{read\.identity\}/);
  assert.match(page, /<SignalProgress tier=\{read\.tier\} progress=\{read\.progress\}/);
  assert.match(page, /if \(reveal\.chart\)/);
  assert.match(page, /const showProviderMix = reveal\.providerMix && mix\.rows\.length > 0/);
  assert.match(page, /if \(showProviderMix \|\| reveal\.insights\)/);
  assert.match(page, /if \(reveal\.categoryMix\)/);
  assert.match(page, /if \(reveal\.rhythm\)/);
  assert.match(page, /if \(reveal\.trust\)/);
  assert.match(page, /if \(read\.tier === "fresh"\)/);
  assert.match(page, /more panels unlock as your data deepens/);
  assert.match(page, /<section className="vprofile">[\s\S]*<\/section>/);
  assert.doesNotMatch(page, /<main className="vprofile">/);
});

test("profile panels keep public aggregates, trust, and local-first onboarding explicit", () => {
  assert.match(panels, /ProfileHeader/);
  assert.match(panels, /signal read/);
  assert.match(panels, /export function SignalProgress/);
  assert.match(panels, /usage builds your profile/);
  assert.match(panels, /role="img" aria-label=\{`signal progress/);
  assert.match(panels, /progress\.unlocksNext\.join/);
  assert.match(panels, /progress\.grow\.join/);
  assert.match(panels, /CATEGORY_COLORS/);
  assert.match(panels, /title="Specialization"/);
  assert.match(panels, /Usage over time/);
  assert.match(panels, /Provider mix/);
  assert.match(panels, /Usage insights/);
  assert.match(panels, /Where the usage lives/);
  assert.match(panels, /Sync rhythm/);
  assert.match(panels, /Trust signals/);
  assert.match(panels, /labelled evidence, never usage/);
  assert.match(panels, /Track yours, locally first\. Upload only when you choose\./);
  assert.match(panels, /copyState === "blocked"/);
  assert.match(panels, /aria-live="polite"/);
  assert.match(panels, /browse \{providerCount\} providers/);
});

test("profile chart supports range controls, pointer inspection, and keyboard inspection", () => {
  assert.match(chart, /const RANGES: Range\[\] = \["30d", "90d", "all"\]/);
  assert.match(chart, /role="group" aria-label="Chart range"/);
  assert.match(chart, /aria-pressed=\{range === r\}/);
  assert.match(chart, /aria-label="Usage over time chart"/);
  assert.match(chart, /tabIndex=\{0\}/);
  assert.match(chart, /event\.key === "ArrowLeft"/);
  assert.match(chart, /event\.key === "ArrowRight"/);
  assert.match(chart, /event\.key === "Home"/);
  assert.match(chart, /event\.key === "End"/);
  assert.match(chart, /event\.key === "Escape"/);
  assert.match(chart, /aria-live="polite"/);
  assert.match(chart, /showing credits \(no usd recorded\)/);
});

test("profile route-local styling stays responsive and motion-safe", () => {
  assert.match(styles, /\.vprofile/);
  assert.match(styles, /\.vprofile-chart/);
  assert.match(styles, /\.vprofile :is\(a, button, \[tabindex\]\):focus-visible/);
  assert.match(styles, /\.vprofile-trust-row/);
  assert.match(styles, /\.vprofile-locked/);
  assert.match(styles, /\.vprofile-ghost/);
  assert.match(styles, /\.vprofile-progress__track/);
  assert.match(styles, /\.vprofile-progress__fill/);
  assert.match(styles, /@keyframes vprofile-fill/);
  assert.match(styles, /\.vprofile-progress__tiers/);
  assert.match(styles, /\.wrap:has\(> \.vprofile\)::before/);
  assert.match(styles, /white-space: normal/);
  assert.match(styles, /@media \(max-width: 1020px\)/);
  assert.match(styles, /@media \(max-width: 900px\)/);
  assert.match(styles, /@media \(max-width: 640px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});
