import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("packages/web/src/app/u/[handle]/page.tsx", "utf8");
const panels = readFileSync("packages/web/src/app/u/[handle]/panels.tsx", "utf8");
const chart = readFileSync("packages/web/src/app/u/[handle]/profile-chart.tsx", "utf8");
const styles = readFileSync("packages/web/src/app/u/[handle]/profile.css", "utf8");
const hero = readFileSync("packages/web/src/app/u/[handle]/profile-hero.tsx", "utf8");
const heroStyles = readFileSync("packages/web/src/app/u/[handle]/profile-hero.css", "utf8");
const cta = readFileSync("packages/web/src/app/u/[handle]/profile-cta.tsx", "utf8");

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
  assert.match(page, /identity=\{read\.identity\.label\}/);
  assert.match(page, /<SignalProgress tier=\{read\.tier\} progress=\{read\.progress\}/);
  assert.match(page, /if \(reveal\.chart\)/);
  assert.match(page, /const showProviderMix = reveal\.providerMix && mix\.rows\.length > 0/);
  assert.match(page, /if \(showProviderMix \|\| reveal\.insights\)/);
  assert.match(page, /if \(reveal\.categoryMix\)/);
  assert.match(page, /if \(reveal\.rhythm\)/);
  assert.match(page, /if \(reveal\.trust\)/);
  assert.match(page, /const climbing = read\.tier === "ember"/);
  assert.match(page, /more panels unlock as your data deepens/);
  assert.match(page, /<section className="vprofile">[\s\S]*<\/section>/);
  assert.doesNotMatch(page, /<main className="vprofile">/);
});

// The identity surface and the closing CTA moved out of panels.tsx into their own modules
// (profile-hero.tsx / profile-cta.tsx) when the profile took on the C0LINK hero language.
test("profile hero carries the identity surface, the full discipline set, and the C0VIBE doors", () => {
  assert.match(page, /<ProfileHero/);
  assert.match(page, /const C0VIBE_JOIN_HREF = "https:\/\/c0vibe\.app"/);
  assert.match(page, /const C0VIBE_MIGRATE_HREF = "\/cli-login"/);
  assert.match(hero, /export function ProfileHero/);
  assert.match(hero, /vhero-sigil/);
  assert.match(hero, /vhero-name/);
  assert.match(hero, /\{signalTier\} signal/);
  // Every discipline gets a pill: an all-rounder is shown as the FULL set, never collapsed.
  assert.match(hero, /disciplines\.map/);
  assert.match(hero, /Join C0VIBE/);
  assert.match(hero, /Migrate this profile/);
  // The hero wash takes the viber's own discipline colour — a signal, not decoration.
  assert.match(hero, /"--vhero-accent": accent/);
  assert.match(heroStyles, /--vhero-accent/);
  assert.match(heroStyles, /@media \(prefers-reduced-motion: reduce\)/);
});

test("C0VIBE band offers claim + migrate without overclaiming verification", () => {
  assert.match(cta, /export function C0vibeBand/);
  assert.match(cta, /Claim @\{handle\} on C0VIBE/);
  assert.match(cta, /self-reported → attested/);
  assert.match(cta, /free forever, no card/);
  // Attested = a real identity owns the handle. The user-facing lede must never promise
  // that linking an account verifies the NUMBERS — that is a separate tier.
  assert.match(cta, /uploaded from the CLI with no account behind it/);
  assert.doesNotMatch(cta, /uploads as verified|becomes verified/);
  assert.match(cta, /Track yours, locally first/);
});

test("profile panels keep public aggregates, trust, and local-first onboarding explicit", () => {
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
  assert.match(panels, /copyState === "blocked"/);
  assert.match(panels, /aria-live="polite"/);
  assert.match(cta, /browse \{providerCount\} sources/);
});

test("profile chart supports range controls, pointer inspection, and keyboard inspection", () => {
  assert.match(chart, /const RANGES: Range\[\] = \["30d", "90d", "all"\]/);
  assert.match(chart, /role="group" aria-label="Chart range"/);
  assert.match(chart, /aria-pressed=\{range === r\}/);
  assert.match(chart, /Usage over time\./);
  assert.match(chart, /All together/); // the stacked lens + Flat/3D depth toggle
  assert.match(chart, /tabIndex=\{0\}/);
  assert.match(chart, /event\.key === "ArrowLeft"/);
  assert.match(chart, /event\.key === "ArrowRight"/);
  assert.match(chart, /event\.key === "Home"/);
  assert.match(chart, /event\.key === "End"/);
  assert.match(chart, /event\.key === "Escape"/);
  assert.match(chart, /aria-live="polite"/);
  assert.match(chart, /vprofile-series-chip/); // per-source selector chips
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
