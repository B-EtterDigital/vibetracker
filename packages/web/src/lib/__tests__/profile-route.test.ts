import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("packages/web/src/app/u/[handle]/page.tsx", "utf8");
const panels = readFileSync("packages/web/src/app/u/[handle]/panels.tsx", "utf8");
const chart = readFileSync("packages/web/src/app/u/[handle]/profile-chart.tsx", "utf8");
const styles = readFileSync("packages/web/src/app/u/[handle]/profile.css", "utf8");
const readoutStyles = readFileSync("packages/web/src/app/u/[handle]/profile-readout.css", "utf8");
const hero = readFileSync("packages/web/src/app/u/[handle]/profile-hero.tsx", "utf8");
const heroStyles = readFileSync("packages/web/src/app/u/[handle]/profile-hero.css", "utf8");
const cta = readFileSync("packages/web/src/app/u/[handle]/profile-cta.tsx", "utf8");
const heat = readFileSync("packages/web/src/app/u/[handle]/profile-heatmap.tsx", "utf8");
const heatStyles = readFileSync("packages/web/src/app/u/[handle]/profile-heatmap.css", "utf8");
const telemetry = readFileSync("packages/web/src/app/u/[handle]/profile-telemetry.tsx", "utf8");
const telemetryModel = readFileSync("packages/web/src/app/u/[handle]/profile-telemetry-model.ts", "utf8");
const telemetryStyles = readFileSync("packages/web/src/app/u/[handle]/profile-telemetry.css", "utf8");
const readout = readFileSync("packages/web/src/app/u/[handle]/profile-readout.tsx", "utf8");
const orchestration = readFileSync("packages/web/src/app/u/[handle]/profile-orchestration.tsx", "utf8");
const orchestrationStyles = readFileSync("packages/web/src/app/u/[handle]/profile-orchestration.css", "utf8");
const identity = readFileSync("packages/web/src/app/u/[handle]/profile-identity.tsx", "utf8");
const identityStyles = readFileSync("packages/web/src/app/u/[handle]/profile-identity.css", "utf8");
const infographic = readFileSync("packages/web/src/app/u/[handle]/profile-infographic.tsx", "utf8");
const infographicStyles = readFileSync("packages/web/src/app/u/[handle]/profile-infographic.css", "utf8");
const accessibilityStyles = readFileSync("packages/web/src/app/u/[handle]/profile-accessibility.css", "utf8");
const layout = readFileSync("packages/web/src/app/u/[handle]/layout.tsx", "utf8");
const nextConfig = readFileSync("packages/web/next.config.ts", "utf8");

test("public profile route reveals panels from deterministic signal depth", () => {
  assert.match(page, /import \{ PROVIDERS \} from "\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/adapters\/src\/index"/);
  assert.doesNotMatch(page, /adapters\/src\/registry/);
  assert.match(page, /const loadProfile = cache/);
  assert.match(page, /export async function generateMetadata/);
  assert.match(layout, /export const metadata: Metadata/);
  assert.match(layout, /recent momentum, work mix, source activity, signal depth/);
  assert.match(nextConfig, /htmlLimitedBots:\s*\/\.\*\//);
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
  // Oriented to the C0VIBE profile header: a big banner with a large square avatar, so migrating
  // to C0VIBE reads as the same profile.
  assert.match(hero, /vhero-banner/);
  assert.match(hero, /vhero-avatar/);
  assert.match(hero, /vhero-name/);
  assert.match(page, /identityVerified=\{Boolean\(profile\.identityVerified\)\}/);
  assert.match(page, /identityProvider=\{profile\.identityProvider\}/);
  assert.match(hero, /GitHub verified/);
  assert.match(hero, /CLI handle only/);
  assert.match(hero, /identity proof only, usage evidence remains separate/);
  assert.match(hero, /role="img"/);
  assert.match(heroStyles, /\.vhero-identity-proof\[data-state="cli"\]/);
  assert.match(heroStyles, /background: #58a6ff/);
  assert.match(heroStyles, /url\("\/brand\/c0vibe-starfield\.webp"\)/);  // the C0VIBE banner
  assert.match(heroStyles, /aspect-ratio: 1/);                            // the square avatar
  assert.match(hero, /\{signalTier\} signal/);
  // Every discipline gets a pill: an all-rounder is shown as the FULL set, never collapsed.
  assert.match(hero, /disciplines\.map/);
  assert.match(hero, /C0VIBE join\/migrate doors live ONLY in the band/);
  assert.match(cta, /Join C0VIBE/);
  assert.match(cta, /Migrate this profile/);
  // The hero wash takes the viber's own discipline colour — a signal, not decoration.
  assert.match(hero, /"--vhero-accent": accent/);
  assert.match(heroStyles, /--vhero-accent/);
  assert.match(heroStyles, /@media \(prefers-reduced-motion: reduce\)/);
});

test("profile first read compresses lifetime scale and puts current evidence before the deep inventory", () => {
  assert.match(page, /notation: "compact"/);
  assert.match(page, /label: "Estimated operations"/);
  assert.match(page, /reconstructed from usage records/);
  assert.match(hero, /Lifetime footprint/);
  assert.match(hero, /current 30-day read follows/);
  assert.match(hero, /export function ProfileHeroEvidence/);
  assert.match(hero, /What sits behind this profile/);
  assert.match(page, /<ProfileHero[\s\S]*<ProfileReadout[\s\S]*<ProfileHeroEvidence/);
  assert.match(heroStyles, /\.vhero-banner \{[\s\S]*min-height: clamp\(420px, 62vh, 780px\)/);
  assert.match(heroStyles, /\.vhero-metrics \{[\s\S]*repeat\(4/);
  assert.match(heroStyles, /@media \(max-width: 760px\) \{[\s\S]*min-height: 200px/);
  assert.match(heroStyles, /@media \(max-width: 620px\) \{[\s\S]*grid-template-columns: repeat\(2/);
});

test("vibe state ranks by spend, lists top 5 models, and explains the signal tier", () => {
  // Op-count made cheap high-volume haiku read as top model and mis-ranked the top source; spend
  // is the honest headline and stays consistent with the money everywhere.
  assert.match(page, /const topSource = byUsd\[0\]/);
  assert.match(page, /sort\(\(a, b\) => b\.usd - a\.usd \|\| b\.ops - a\.ops\)/);
  assert.match(page, /\.slice\(0, 5\)/);
  assert.match(hero, /top 5 models/);
  assert.match(hero, /topModels\.map/);
  // signal tier is explained inline (answers "what is signal surge")
  assert.match(hero, /how deep your tracked profile is/);
  assert.match(hero, /SIGNAL_TIERS/);
});

test("sources are a labelled big-logo row with the brand on hover, and a bio can be added", () => {
  // every source with real activity is shown (not a top-6 slice), so the list is complete
  assert.match(page, /\.filter\(\(p\) => p\.usd > 0 \|\| p\.ops > 0\)/);
  assert.match(hero, /vhero-sources/);
  assert.match(hero, /vhero-sources-head/);
  assert.match(hero, />\s*Tracked sources\s*<span>/);
  assert.match(hero, /function SourceTile/);
  assert.match(hero, /vhero-source-name/);               // brand name revealed on hover
  assert.match(heroStyles, /\.vhero-source:hover \.vhero-source-name/);
  assert.match(heroStyles, /\.vhero-source:focus \.vhero-source-name/);
  // bio: render the viber's own, else the "add a bio" affordance with the CLI command
  assert.match(hero, /userBio \?/);
  assert.match(hero, /Add a bio/);
  assert.match(hero, /vibetracker profile --bio/);
});

const tokensSrc = readFileSync("packages/web/src/app/u/[handle]/profile-tokens.tsx", "utf8");

const signalsSrc = readFileSync("packages/web/src/app/u/[handle]/profile-signals.tsx", "utf8");

test("skill signals lead the profile and reframe money as API-equivalent reference", () => {
  // the archetype/skill read is the headline (added to overview before the stat cards)
  assert.match(page, /const signals = computeProfileSignals\(profile\)/);
  assert.match(page, /<SkillSignals signals=\{signals\}/);
  assert.match(signalsSrc, /Signal read/);
  assert.match(identity, /signals\.archetypeLabel/);
  assert.match(page, /<ViberIdentity[\s\S]*<SkillSignals/);
  assert.match(signalsSrc, /Work style/);          // human-in-loop vs agentic
  assert.match(signalsSrc, /Orchestration/);
  assert.match(signalsSrc, /Ship rate/);           // git commits per billion tokens
  assert.match(signalsSrc, /maxed \$200 subscriptions/); // subscription footprint
  // money is reframed, not the flex
  assert.match(signalsSrc, /API-equivalent cost/);
  assert.match(signalsSrc, /Burning budget isn/);
  assert.match(page, /label: "commits shipped"/);
  assert.match(page, /label: "disciplines"/);
  assert.doesNotMatch(page, /label: "total spent"/);
});

test("profile infographic owns measured traits while identity owns honestly earned archetype badges", () => {
  assert.match(page, /import \{ ViberIdentity \} from "\.\/profile-identity"/);
  assert.match(page, /import \{ SourceToolbar, INFO_RAMP, type StackMonth \} from "\.\/profile-infographic"/);
  assert.match(page, /import \{ InfographicBoard, type BoardSpec \} from "\.\/profile-board"/);
  assert.match(page, /import "\.\/profile-identity\.css"/);
  assert.match(page, /<InfographicBoard traits=\{traits\} specs=\{specs\}/);
  assert.match(page, /all: \{[\s\S]*spiral: cliSpiral/);
  assert.match(page, /<ViberIdentity signals=\{signals\} opsValue=\{opsCompact\}/);
  assert.match(infographic, /export function TraitPies/);
  assert.match(infographic, /aria-label=\{`Trait mix:/);
  assert.match(infographic, /a pie only exists where usage exists/);
  assert.doesNotMatch(identity, /function DisciplineRings/);
  assert.match(identity, /signals\.archetypes/);
  assert.match(identity, /badges\.length >= 2/);
  assert.match(identity, /3\+ active CLIs · 8\+ cross-provider days · under 18% input \+ output share/);
  assert.match(identity, /22%\+ input \+ output share of all measured tokens/);
  assert.match(identity, /400\+ creative operations across image, video or music/);
  assert.doesNotMatch(identity, /typed and read by a human|images, videos and tracks generated/);
  assert.match(identity, /aria-label=\{`\$\{badges\.length\} badges earned`\}/);
  assert.match(identityStyles, /grid-template-columns: repeat\(auto-fit, minmax\(180px, 1fr\)\)/);
  assert.match(identityStyles, /@media \(max-width: 680px\)/);
  assert.match(infographicStyles, /grid-template-columns: minmax\(0, 1\.3fr\) minmax\(0, 1fr\)/);
  assert.match(infographicStyles, /\.vboard \{ grid-template-columns: 1fr; \}/);
  assert.match(infographicStyles, /\.vboard \{ width: auto; margin-inline: -14px; \}/);
  assert.doesNotMatch(infographicStyles, /\.vboard[^}]*100vw/);
});

test("token breakdown + measured multi-CLI activity render without inferred delegation", () => {
  // token breakdown: input/output/cache split, total + per provider
  assert.match(tokensSrc, /export function TokenBreakdown/);
  assert.match(tokensSrc, /Cache read/);
  assert.match(tokensSrc, /Cache creation/);
  assert.match(tokensSrc, /by provider/);
  assert.match(page, /<TokenBreakdown/);
  // CLI presence and provider overlap are measured, while concurrency/direction stay unclaimed.
  assert.match(tokensSrc, /export function Delegation/);
  assert.match(tokensSrc, /Multi-CLI activity/);
  assert.match(tokensSrc, /days used 2\+ model providers/);
  assert.match(tokensSrc, /no concurrency or per-CLI spend attribution inferred/);
  assert.doesNotMatch(tokensSrc, /plans → executes/);
  assert.doesNotMatch(tokensSrc, /days ran 2\+ agents together/);
  assert.match(page, /<Delegation/);
  assert.match(page, /crossProviderDays=\{profile\.crossProviderDays/);
  // total tokens is a stat headline in the breakdown panel; global rank rides the hero state rail
  assert.match(tokensSrc, /tokens total/);
  assert.match(page, /label: "global rank", value: `#\$\{profile\.rank\}`/);
});

test("orchestration trace explains its bounded local evidence without runtime or effort overclaims", () => {
  assert.match(page, /<OrchestrationHours orch=\{profile\.orchestration\}/);
  assert.match(orchestration, /local derived evidence/);
  assert.match(orchestration, /gaps capped at 30 minutes/);
  assert.match(orchestration, /not exact runtime, billing time, human effort, or server-verified concurrency/);
  assert.match(orchestration, /coverage \{orch\.filesScanned\.toLocaleString/);
  assert.doesNotMatch(orchestration, /your agents worked|hours reclaimed|while you slept|you did not sit through|measured, not estimated|actually running/i);
  assert.match(orchestrationStyles, /\.vorch \.vprofile-panel-head \{ flex-wrap: wrap; \}/);
  assert.match(orchestrationStyles, /\.vorch \.vprofile-panel-sub \{ white-space: normal; text-align: right; \}/);
});

test("C0VIBE band offers claim + migrate without overclaiming verification", () => {
  assert.match(cta, /export function C0vibeBand/);
  assert.match(cta, /Claim @\{handle\} on C0VIBE/);
  assert.match(cta, /@\{handle\} is verified through GitHub/);
  assert.match(cta, /same GitHub identity and usage history carry over/);
  assert.match(cta, /no GitHub credential stored/);
  assert.match(page, /accountLinked=\{Boolean\(profile\.accountLinked\)\}/);
  assert.match(page, /identityProvider=\{profile\.identityProvider\}/);
  assert.match(page, /tier=\{usageTier\}/);
  assert.match(cta, /self-reported → attested/);
  assert.match(cta, /free forever, no card/);
  // Attested = a real identity owns the handle. The user-facing lede must never promise
  // that linking an account verifies the NUMBERS — that is a separate tier.
  assert.match(cta, /uploaded from the CLI with no account behind it/);
  assert.doesNotMatch(cta, /uploads as verified|becomes verified/);
  assert.match(cta, /Track yours, locally first/);
});

test("sync rhythm is a real contribution calendar keyed on a signal we hold for every day", () => {
  assert.match(page, /<SyncRhythm/);
  assert.match(heat, /export function SyncRhythm/);
  assert.match(heat, /const WEEKS = 53/);                 // a GitHub year, not an arbitrary window
  assert.match(heat, /function quartiles/);               // levels cut at quartiles of ACTIVE days
  assert.doesNotMatch(heat, /ops \/ max/);                 // never a linear share of one outlier
  assert.match(heat, /d\.usd > q3 \? 4 : d\.usd > q2 \? 3 : d\.usd > q1 \? 2 : 1/);
  assert.match(heat, /longest streak/);
  assert.match(heat, /aria-live="polite"/);
  assert.match(heat, /<span[\s\S]*?className=\{`vheat-cell/);
  assert.doesNotMatch(heat, /<button[\s\S]*?vheat-cell/);
});

test("real GitHub contributions render as their own labelled calendar, never mixed into usage", () => {
  // Shown whenever the CLI captured the viber's github_activity signal (any user, not just this one).
  assert.match(page, /const githubSignal = profile\.trustSignals\.find/);
  assert.match(page, /s\.kind === "github_activity" && Array\.isArray\(s\.days\)/);
  assert.match(page, /<GitHubContributions/);
  assert.match(heat, /export function GitHubContributions/);
  // GitHub's own green ramp, and its own per-day levels — reads unmistakably as the git graph.
  assert.match(heatStyles, /\.vheat--github \.vheat-l4 \{ background: #39d353/);
  assert.match(heatStyles, /\.vheat \.vprofile-panel-sub[\s\S]*white-space: normal/);
  assert.match(heat, /activity evidence, not AI usage/);
  // Activity evidence never feeds spend/ops/score: the panel gets counts, not usd, and the
  // signal is loaded with affectsTotals:false upstream (profile-trust guard).
  assert.doesNotMatch(heat, /GitHubContributions[\s\S]*?usd/);
});

test("C0VIBE band carries real brand identity, not a bare link", () => {
  assert.match(cta, /brand\/c0vibe-logo\.png/);
  assert.match(cta, /vjoin-art/);                          // the brand starfield surface
  assert.match(cta, /vibers unite/);
  assert.match(cta, /vjoin-btn--brand/);
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

test("delta scope compares adjacent real usage windows without mixing trust signals", () => {
  assert.match(page, /<UsageTelemetry days=\{profile\.usageDays\} providers=\{chartSeries\}/);
  assert.match(telemetryModel, /export type TelemetryRange = 7 \| 30 \| 90/);
  assert.match(telemetryModel, /const previousEnd = currentStart - DAY_MS/);
  assert.match(telemetryModel, /const previousStart = previousEnd - \(range - 1\) \* DAY_MS/);
  assert.match(telemetry, /role="group" aria-label="Comparison window"/);
  assert.match(telemetry, /role="group" aria-label="Comparison metric"/);
  assert.match(telemetry, /USAGE DELTA \/ ADJACENT WINDOWS \/ ZERO TRUST MIXING/);
  assert.match(telemetry, /usage aggregates only/);
  assert.doesNotMatch(telemetry, /trustSignals|github|creator_activity/);
  assert.match(telemetryStyles, /\.vtelemetry-comb/);
  assert.match(telemetryStyles, /--vt-current: #2ee8d6/);
  assert.match(telemetryStyles, /--vt-previous: #ffc64d/);
  assert.match(telemetryStyles, /@media \(min-width: 2200px\)/);
  assert.match(telemetryStyles, /@media \(max-width: 640px\)/);
  assert.match(telemetryStyles, /@media \(prefers-reduced-motion: reduce\)/);
});

test("profile leads with a plain-language latest read derived from the telemetry model", () => {
  assert.match(page, /const latestRead = buildTelemetryModel\(profile\.usageDays, chartSeries, 30, "usd"\)/);
  assert.match(page, /<ProfileReadout/);
  assert.match(page, /hasGitHubEvidence=\{Boolean\(githubSignal\)\}/);
  assert.match(readout, /Latest 30-day read/);
  assert.match(readout, /What this tells you:/);
  assert.match(page, /import "\.\/profile-readout\.css"/);
  assert.match(readoutStyles, /\.vprofile-readout__facts/);
  assert.match(readout, /\/insights\?handle=/);
  assert.match(readout, /Open live cost scenario/);
  assert.match(readout, /API-equivalent usage/);
  assert.match(readout, /GitHub activity is separate work evidence, not verification of usage totals/);
  assert.match(readout, /vprofile-readout__note/);
  assert.doesNotMatch(readout, /<small>/);
  assert.doesNotMatch(readout, /verified usage|verifies usage/);
  assert.doesNotMatch(readout, /changed \+|ai coding dominating/);
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
  assert.match(styles, /\.vprofile-panel-head \{ flex-direction: column; align-items: flex-start; \}/);
  assert.match(styles, /\.vprofile-panel-sub \{[\s\S]*overflow-wrap: anywhere;/);
  assert.match(styles, /\.vprofile-bar-amount \{[\s\S]*flex: 1 1 0;[\s\S]*text-overflow: ellipsis;/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(accessibilityStyles, /Profile-only AA contrast corrections/);
});
