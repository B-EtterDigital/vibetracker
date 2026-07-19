import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
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
const largeDisplayStyles = readFileSync("packages/web/src/app/u/[handle]/profile-4k.css", "utf8");
const layout = readFileSync("packages/web/src/app/u/[handle]/layout.tsx", "utf8");
const nextConfig = readFileSync("packages/web/next.config.ts", "utf8");
const usefulData = readFileSync("packages/web/src/app/u/[handle]/profile-useful-data.tsx", "utf8");
const usefulDataStyles = readFileSync("packages/web/src/app/u/[handle]/profile-useful-data.css", "utf8");
const globalStyles = readFileSync("packages/web/src/app/globals.css", "utf8");
const toolbar = readFileSync("packages/web/src/app/u/[handle]/profile-toolbar.tsx", "utf8");
const dataLib = readFileSync("packages/web/src/lib/data.ts", "utf8");

function loadUsefulDataModule() {
  const projectRequire = createRequire(import.meta.url);
  const ts = projectRequire("typescript");
  const jsxRuntime = projectRequire("react/jsx-runtime");
  const source = ts.transpileModule(usefulData, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const loaded = { exports: {} as Record<string, unknown> };
  const stubRequire = (id: string) => {
    if (id === "react/jsx-runtime") return jsxRuntime;
    if (id === "../../../lib/leaderboard") return { formatInt: (value: number) => Math.round(value).toLocaleString("en-US") };
    if (id === "../../../lib/native-usage-metrics") return { nativeUsageLine: () => null };
    if (id === "../../../lib/provider-brand") return { providerBrand: (id: string) => ({ mark: id.slice(0, 2).toUpperCase(), from: "#2ee8d6", to: "#2ee8d6", ink: "#0d1419" }) };
    if (id === "../../../lib/provider-logos") return { logoPath: (id: string) => id === "suno" ? "/provider-logos/suno.svg" : null };
    if (id === "../../../../../adapters/src/index") return { PROVIDERS: [{ id: "suno", label: "Suno", categories: ["music"] }, { id: "openai", label: "OpenAI", categories: ["coding"] }] };
    if (id === "./profile-infographic") return { INFO_RAMP: ["#2ee8d6"] };
    throw new Error(`unexpected profile-useful-data import: ${id}`);
  };
  new Function("require", "exports", "module", source)(stubRequire, loaded.exports, loaded);
  return { exports: loaded.exports, jsxRuntime, renderToStaticMarkup: projectRequire("react-dom/server").renderToStaticMarkup as (node: unknown) => string };
}

function loadToolbarModule() {
  const projectRequire = createRequire(import.meta.url);
  const ts = projectRequire("typescript");
  const react = projectRequire("react");
  const jsxRuntime = projectRequire("react/jsx-runtime");
  const source = ts.transpileModule(toolbar, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const loaded = { exports: {} as Record<string, unknown> };
  const stubRequire = (id: string) => {
    if (id === "react") return react;
    if (id === "react/jsx-runtime") return jsxRuntime;
    throw new Error(`unexpected profile-toolbar import: ${id}`);
  };
  new Function("require", "exports", "module", source)(stubRequire, loaded.exports, loaded);
  return { exports: loaded.exports, jsxRuntime, renderToStaticMarkup: projectRequire("react-dom/server").renderToStaticMarkup as (node: unknown) => string };
}

// Loads the real data.ts against a stubbed supabase client so its loaders (e.g. toolStatementsFor)
// can be exercised for their actual returned shape, not asserted against source text.
function loadDataModule(supabaseServer: () => unknown) {
  const projectRequire = createRequire(import.meta.url);
  const ts = projectRequire("typescript");
  const source = ts.transpileModule(dataLib, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const loaded = { exports: {} as Record<string, unknown> };
  const stubRequire = (id: string) => {
    if (id === "./supabase") return { supabaseServer };
    if (id === "./leaderboard") return {};
    if (id === "./profile-trust") return { publicTrustSignals: (rows: unknown[]) => rows };
    if (id === "../../../core/src/telemetry") return { createConsoleTelemetry: () => ({ addBreadcrumb() {}, captureError() {} }) };
    if (id === "./profile-orchestration-data") return { normalizeOrchestration: () => undefined };
    throw new Error(`unexpected data import: ${id}`);
  };
  new Function("require", "exports", "module", source)(stubRequire, loaded.exports, loaded);
  return loaded.exports;
}

// A minimal supabase query builder whose terminal .limit() resolves to a fixed { data, error }.
function mockSupabaseReturning(result: { data: unknown; error: unknown }) {
  const client: Record<string, (...args: unknown[]) => unknown> = {
    from: () => client,
    select: () => client,
    eq: () => client,
    limit: () => Promise.resolve(result),
  };
  return () => client;
}

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
  assert.match(cta, /Powerup your VibeTools \(free\)/);
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
  assert.match(heroStyles, /@media \(max-width: 760px\) \{[\s\S]*min-height: 260px/);
  assert.match(heroStyles, /@media \(max-width: 620px\) \{[\s\S]*grid-template-columns: repeat\(2/);
});

test("profile headline counts days with operations, preserved spend, or credits", () => {
  assert.match(page, /const activeDays = profile\.usageDays\.filter\(\(day\) => day\.ops > 0 \|\| day\.usd > 0 \|\| day\.credits > 0\)\.length/);
  assert.match(page, /label: "days active",[\s\S]*?value: String\(activeDays\)/);
  assert.doesNotMatch(page, /value: String\(profile\.usageDays\.length\)/);
});

test("profile expands into a fixed-format 4K instrument without changing ordinary viewports", () => {
  assert.match(page, /import "\.\/profile-4k\.css"/);
  assert.match(largeDisplayStyles, /@media \(min-width: 2200px\) and \(min-height: 1200px\)/);
  assert.match(largeDisplayStyles, /\.wrap:has\(> \.vprofile\) \{[\s\S]*max-width: min\(2640px, calc\(100vw - 96px\)\)/);
  assert.match(largeDisplayStyles, /\.vprofile \{[\s\S]*max-width: 2592px/);
  assert.match(largeDisplayStyles, /\.vboard \{[\s\S]*minmax\(820px, 1fr\)/);
  assert.match(largeDisplayStyles, /\.vinfo-pie \{ width: 84px; \}/);
  assert.doesNotMatch(largeDisplayStyles, /@media \(max-width:/);
});

test("vibe state ranks by spend, lists top 5 models, and explains the signal tier", () => {
  // Op-count made cheap high-volume haiku read as top model and mis-ranked the top source; spend
  // is the honest headline and stays consistent with the money everywhere.
  assert.match(page, /const topSource = byUsd\[0\]/);
  assert.match(usefulData, /sort\(\(a, b\) => b\.usd - a\.usd \|\| b\.ops - a\.ops/);
  assert.match(usefulData, /rows\.slice\(0, 5\)/);
  assert.match(hero, /top 5 models/);
  assert.match(hero, /topModels\.map/);
  // signal tier is explained inline (answers "what is signal surge")
  assert.match(hero, /how deep your tracked profile is/);
  assert.match(hero, /SIGNAL_TIERS/);
});

test("sources are a labelled big-logo row with the brand on hover, and a bio can be added", () => {
  // every lane that proves a tool was used feeds the list (tools ∪ providers ∪ agents), complete
  assert.match(usefulData, /if \(provider\.usd > 0 \|\| provider\.ops > 0\) bump/);
  assert.match(usefulData, /profile\.agents \?\? \[\]/);
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
  assert.match(usefulData, /import \{ INFO_RAMP, type StackMonth, type TraitPie \} from "\.\/profile-infographic"/);
  assert.match(page, /import \{ InfographicBoard \} from "\.\/profile-board"/);
  assert.match(page, /import "\.\/profile-identity\.css"/);
  assert.match(page, /<InfographicBoard traits=\{traits\} specs=\{specs\}/);
  assert.match(usefulData, /all: \{[\s\S]*spiral: cliSpiral/);
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
  assert.match(infographicStyles, /\.vboard \{ grid-template-columns: minmax\(0, 1fr\); min-width: 0; \}/);
  assert.match(infographicStyles, /\.vboard \{ width: auto; margin-inline: -14px; \}/);
  assert.match(infographicStyles, /\.vboard \.vboard-bio \{[\s\S]*min-width: 0;[\s\S]*max-width: 100%;[\s\S]*overflow-wrap: anywhere;/);
  assert.match(infographicStyles, /\.vboard \.vinfo-pies \{[\s\S]*overflow-x: auto; overflow-y: hidden;[\s\S]*overscroll-behavior-inline: contain;/);
  assert.match(infographicStyles, /\.vboard \.vboard-bars-mount \{[\s\S]*min-width: 0;[\s\S]*max-width: 100%;[\s\S]*box-sizing: border-box;/);
  assert.match(infographicStyles, /\.vboard \.vboard-bars-mount \{ justify-content: flex-start; overflow-x: auto;/);
  assert.match(infographicStyles, /\.vinfo-stack \{ min-width: 640px; max-width: none; \}/);
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
  // cache-served ratio extends the same sub line and each provider pill, no new classes
  assert.match(tokensSrc, /cache served \$\{cacheServed\}% of prompt tokens/);
  assert.match(tokensSrc, /\$\{cached\}% cached/);
  assert.match(page, /label: "global rank", value: `#\$\{profile\.rank\}`/);
});

// profile-tokens.tsx has no external imports, so TokenBreakdown can be rendered behaviorally
// (like the toolbar dock) to prove the cache-served ratio math and its guard conditions.
function loadTokensModule() {
  const projectRequire = createRequire(import.meta.url);
  const ts = projectRequire("typescript");
  const jsxRuntime = projectRequire("react/jsx-runtime");
  const source = ts.transpileModule(tokensSrc, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const loaded = { exports: {} as Record<string, unknown> };
  const stubRequire = (id: string) => {
    if (id === "react/jsx-runtime") return jsxRuntime;
    throw new Error(`unexpected profile-tokens import: ${id}`);
  };
  new Function("require", "exports", "module", source)(stubRequire, loaded.exports, loaded);
  return { exports: loaded.exports, jsxRuntime, renderToStaticMarkup: projectRequire("react-dom/server").renderToStaticMarkup as (node: unknown) => string };
}

test("token breakdown surfaces the cache-served ratio in the header sub and per provider", () => {
  const runtime = loadTokensModule();
  const TokenBreakdown = runtime.exports.TokenBreakdown as (props: unknown) => unknown;
  const render = (props: Record<string, unknown>) => runtime.renderToStaticMarkup(runtime.jsxRuntime.jsx(TokenBreakdown, props));

  const html = render({
    totalTokens: 12_000_000,
    breakdown: [
      { scope: "total", input: 300, output: 100, cacheRead: 700, cacheCreation: 50 },   // 700/1000 → 70%
      { scope: "codex", input: 100, output: 40, cacheRead: 900, cacheCreation: 10 },     // 900/1000 → 90%
      { scope: "openai", input: 500, output: 20, cacheRead: 0, cacheCreation: 0 },       // 0/500 → hidden
    ],
  });
  assert.match(html, /tokens total/);
  assert.match(html, /cache served 70% of prompt tokens/);
  assert.match(html, /· 90% cached/);
  assert.match(html, /OpenAI<b>520<\/b><\/span>/); // the 0%-cache provider pill carries no cached suffix

  // no prompt tokens at all → the header stays the bare total, no cache-served clause
  const noPrompt = render({
    totalTokens: 1000,
    breakdown: [{ scope: "total", input: 0, output: 100, cacheRead: 0, cacheCreation: 0 }],
  });
  assert.match(noPrompt, /tokens total/);
  assert.doesNotMatch(noPrompt, /cache served/);
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

test("models by cost renders ranked fixture data and disappears without model usage", () => {
  const runtime = loadUsefulDataModule();
  const module = runtime.exports as {
    buildModelUsage: (rows: Array<{ provider: string; model: string; category?: string; ops: number; credits: number; usd: number }>) => Array<{ model: string; ops: number; usd: number }>;
    ModelsByCost: (props: { rows: Array<{ model: string; ops: number; usd: number }> }) => unknown;
  };
  const fixture = [
    { provider: "openai-web", model: "gpt-5", category: "coding", ops: 40, credits: 0, usd: 75_600 },
    { provider: "openai", model: "gpt-5", category: "other", ops: 10, credits: 0, usd: 200 },
    ...Array.from({ length: 10 }, (_, index) => ({
      provider: index % 2 ? "openai" : "openai-web",
      model: `model-${index}`,
      category: index % 2 ? "coding" : "other",
      ops: index === 9 ? 500 : 20 - index,
      credits: 0,
      usd: 1_000 - index * 50,
    })),
  ];
  const rows = module.buildModelUsage(fixture);
  const html = runtime.renderToStaticMarkup(runtime.jsxRuntime.jsx(module.ModelsByCost, { rows }));
  assert.equal(rows[0].model, "gpt-5");
  assert.equal(rows[0].usd, 75_800);
  assert.equal(rows[0].ops, 50);
  assert.match(html, /Models by cost/);
  assert.match(html, /Most used/);
  assert.match(html, /\$75\.8K/);
  assert.match(html, /\+1 more models/);
  assert.match(html, /<th scope="col">/);
  assert.match(html, /<th scope="row"/);
  assert.match(html, /<td/);
  assert.match(html, /aria-hidden="true"/);
  assert.equal(runtime.renderToStaticMarkup(runtime.jsxRuntime.jsx(module.ModelsByCost, { rows: [] })), "");
  assert.match(page, /if \(modelUsage\.length > 0\) add\("usage", "full", <ModelsByCost/);
  assert.match(usefulDataStyles, /height: 28px/);
  assert.match(usefulDataStyles, /height: 2px/);
});

test("native output ledger groups fixture units by provider and disappears without outputs", () => {
  const runtime = loadUsefulDataModule();
  const module = runtime.exports as {
    buildNativeLedgerRows: (rows: Array<{ provider: string; category: string; outputUnit: string; outputs: number; durationSeconds: number }>) => Array<{ provider: string; label: string; logo: string | null; mark: string; counts: string }>;
    NativeOutputLedger: (props: { rows: Array<{ provider: string; label: string; logo: string | null; mark: string; counts: string }> }) => unknown;
  };
  const rows = module.buildNativeLedgerRows([
    { provider: "suno", category: "music", outputUnit: "track", outputs: 831, durationSeconds: 45 * 3_600 + 12 * 60 },
    { provider: "suno", category: "music", outputUnit: "variation", outputs: 8_917, durationSeconds: 0 },
  ]);
  const html = runtime.renderToStaticMarkup(runtime.jsxRuntime.jsx(module.NativeOutputLedger, { rows }));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].counts, "831 tracks · 8,917 variations · 45h 12m");
  assert.match(html, /Native output ledger/);
  assert.match(html, /created things, counted natively - not tokens/);
  assert.match(html, /\/provider-logos\/suno\.svg/);
  assert.match(html, /width="18" height="18"/);
  assert.match(html, /<th scope="col">/);
  assert.match(html, /<th scope="row">/);
  assert.match(html, /<td>831 tracks · 8,917 variations · 45h 12m<\/td>/);
  assert.doesNotMatch(rows[0].counts, /audio|video/);
  const empty = module.buildNativeLedgerRows([{ provider: "suno", category: "music", outputUnit: "track", outputs: 0, durationSeconds: 120 }]);
  assert.deepEqual(empty, []);
  assert.equal(runtime.renderToStaticMarkup(runtime.jsxRuntime.jsx(module.NativeOutputLedger, { rows: empty })), "");
  assert.match(page, /if \(nativeLedger\.length > 0\) add\("usage", "full", <NativeOutputLedger/);
});

test("usage facts use UTC day keys across extreme viewer offsets", () => {
  const runtime = loadUsefulDataModule();
  type Day = { date: string; ops: number; credits: number; usd: number };
  const dayKeyUTC = runtime.exports.dayKeyUTC as (date: Date) => string;
  const summarize = runtime.exports.summarizeUsageDays as (days: Day[], now: Date) => { currentStreak: number; lastActive: string | null; showLastActive: boolean };
  const active = (date: string): Day => ({ date, ops: 1, credits: 0, usd: 0 });
  assert.match(usefulData, /export function dayKeyUTC\(date: Date\)/);
  assert.match(usefulData, /const today = dayKeyUTC\(now\)/);
  assert.match(usefulData, /byDate\.get\(dayKeyUTC\(new Date\(cursor\)\)\)/);

  // UTC+14 has already crossed local midnight into Jul 21, but the usage calendar is still Jul 20 UTC.
  const plus14Now = new Date("2026-07-21T00:30:00+14:00");
  assert.equal(dayKeyUTC(plus14Now), "2026-07-20");
  assert.equal(summarize([active("2026-07-20")], plus14Now).showLastActive, false);
  assert.equal(summarize([active("2026-07-21")], plus14Now).showLastActive, true);

  // UTC-11 is still on local Jul 19, while the same canonical UTC calendar day is Jul 20.
  const minus11Now = new Date("2026-07-19T23:30:00-11:00");
  assert.equal(dayKeyUTC(minus11Now), "2026-07-20");
  assert.equal(summarize([active("2026-07-20")], minus11Now).showLastActive, false);
  assert.equal(summarize([active("2026-07-19")], minus11Now).showLastActive, true);
});

test("usage streak handles empty, single, inactive-gap, and duplicate-date windows", () => {
  const runtime = loadUsefulDataModule();
  type Day = { date: string; ops: number; credits: number; usd: number };
  const summarize = runtime.exports.summarizeUsageDays as (days: Day[], now: Date) => { currentStreak: number; lastActive: string | null; showLastActive: boolean };
  const now = new Date("2026-07-20T12:00:00Z");
  const active = (date: string): Day => ({ date, ops: 1, credits: 0, usd: 0 });
  const inactive = (date: string): Day => ({ date, ops: 0, credits: 0, usd: 0 });

  assert.deepEqual(summarize([], now), { currentStreak: 0, lastActive: null, showLastActive: false });
  assert.deepEqual(summarize([active("2026-07-20")], now), { currentStreak: 1, lastActive: "2026-07-20", showLastActive: false });
  assert.deepEqual(summarize([active("2026-07-17"), inactive("2026-07-18"), active("2026-07-19")], now), {
    currentStreak: 1,
    lastActive: "2026-07-19",
    showLastActive: true,
  });
  assert.deepEqual(summarize([active("2026-07-17"), active("2026-07-17"), active("2026-07-18")], now), {
    currentStreak: 2,
    lastActive: "2026-07-18",
    showLastActive: true,
  });
});

test("profile useful facts, model coverage, banner removal, and file budget stay exact", () => {
  const runtime = loadUsefulDataModule();
  const summarize = runtime.exports.summarizeUsageDays as (days: Array<{ date: string; ops: number; credits: number; usd: number }>, now?: Date) => { currentStreak: number; lastActive: string | null; showLastActive: boolean };
  assert.deepEqual(summarize([
    { date: "2026-07-16", ops: 1, credits: 0, usd: 0 },
    { date: "2026-07-17", ops: 0, credits: 1, usd: 0 },
    { date: "2026-07-18", ops: 0, credits: 0, usd: 2 },
  ], new Date("2026-07-20T12:00:00Z")), { currentStreak: 3, lastActive: "2026-07-18", showLastActive: true });
  assert.match(page, /label: "Current streak"/);
  assert.match(page, /summarizeUsageDays\(profile\.usageDays, new Date\(\)\)/);
  assert.match(page, /activity\.lastActive && activity\.showLastActive/);
  assert.match(page, /label: "Last active"/);
  assert.match(page, /label: "Credits burned"[\s\S]*value: formatInt\(totalCredits\)/);
  assert.match(usefulData, /const catProviderOps = new Map/);
  assert.match(usefulData, /const providerModelOps = new Map/);
  assert.match(usefulData, /const coverage = categoryOps > 0[\s\S]*Math\.max\(0, Math\.min\(100, Math\.round\(\(taggedOps \/ categoryOps\) \* 100\)\)\)/);
  assert.match(usefulData, /model tags on \$\{coverage\}% of ops/);
  assert.match(usefulData, /foot: categoryOps > 0/);
  assert.doesNotMatch(globalStyles, /VTK:\/\/PUBLIC-BOARD/);
  assert.match(globalStyles, /VTK:\/\/LANE/);
  assert.doesNotMatch(`${page}\n${usefulData}`, /Cynaps3[^\n]*(success|failure)|(success|failure)[^\n]*Cynaps3/i);
  assert.ok(page.split("\n").length <= 600, `page.tsx is ${page.split("\n").length} lines`);
  assert.doesNotMatch(usefulDataStyles, /--vuse/);
  assert.doesNotMatch(usefulDataStyles, /@keyframes|animation:/);
});

test("My Tools dock renders a statement + @handle byline, the add-a-statement hint, and escapes HTML", () => {
  const runtime = loadToolbarModule();
  const ToolbarDock = runtime.exports.ToolbarDock as (props: unknown) => unknown;
  const render = (props: Record<string, unknown>) => runtime.renderToStaticMarkup(runtime.jsxRuntime.jsx(ToolbarDock, props));
  const brand = (over: Record<string, unknown> = {}) => ({ id: "codex", label: "Codex", mark: "CX", from: "#000000", blurb: "OpenAI's Codex agent.", ...over });

  // Folds away entirely without brands; folded (no defaultActiveId) shows the rail but no panel card —
  // proving defaultActiveId changes nothing when omitted.
  assert.equal(render({ brands: [] }), "");
  const folded = render({ handle: "cyrill-etter", brands: [brand({ statement: "codex writes my boring migrations" })] });
  assert.match(folded, /My Tools/);
  assert.match(folded, /vtoolbar-item/);
  assert.doesNotMatch(folded, /codex writes my boring migrations/);

  // (1) active brand WITH a statement + handle: the viber's own words, and the em-dash @handle byline.
  const withStatement = render({
    handle: "cyrill-etter",
    defaultActiveId: "codex",
    brands: [brand({ statement: "codex writes my boring migrations" })],
  });
  assert.match(withStatement, /codex writes my boring migrations/);
  assert.match(withStatement, /class="vtooldock-byline">— @cyrill-etter/);

  // (2) active brand with NO statement: the exact add-a-statement hint, and no byline element.
  const noStatement = render({ handle: "cyrill-etter", defaultActiveId: "codex", brands: [brand()] });
  assert.match(noStatement, /no personal statement yet — the profile owner can add one: vibetracker statement &lt;tool-id&gt;/);
  assert.doesNotMatch(noStatement, /vtooldock-byline/);

  // (3) a statement carrying markup is escaped by React — the raw <script> tag never reaches the HTML.
  const xss = render({ handle: "cyrill-etter", defaultActiveId: "codex", brands: [brand({ statement: "<script>alert(1)</script>" })] });
  assert.doesNotMatch(xss, /<script>/);
  assert.match(xss, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);

  // The byline mirrors the dim .vtooldock-hint caption (same mono stack + 0.42 dim), offset 6px below.
  assert.match(infographicStyles, /\.vtooldock-byline \{[\s\S]*margin-top: 6px/);
  assert.match(infographicStyles, /\.vtooldock-byline \{[\s\S]*var\(--vmono, ui-monospace, monospace\)/);
});

test("toolStatementsFor loads identity tool statements from a mocked supabase client", async () => {
  const rows = [
    { tool_id: "codex", statement: "codex writes my boring migrations" },
    { tool_id: "suno", statement: "" },   // dropped: empty statement
    { tool_id: "", statement: "orphan" }, // dropped: empty tool id
  ];
  const ok = loadDataModule(mockSupabaseReturning({ data: rows, error: null }));
  const toolStatementsFor = ok.toolStatementsFor as (identityId: string) => Promise<Array<{ toolId: string; statement: string }>>;
  assert.deepEqual(await toolStatementsFor("identity-123"), [
    { toolId: "codex", statement: "codex writes my boring migrations" },
  ]);

  // Additive table absent → graceful empty array, never throwing the public profile.
  const missing = loadDataModule(mockSupabaseReturning({ data: null, error: { message: "relation does not exist", code: "42P01" } }));
  const toolStatementsForMissing = missing.toolStatementsFor as (identityId: string) => Promise<unknown[]>;
  assert.deepEqual(await toolStatementsForMissing("identity-123"), []);
});

test("per-tool statement folding is deterministic when raw ids collide on one brand", () => {
  const runtime = loadUsefulDataModule();
  const canonicalToolBrandId = runtime.exports.canonicalToolBrandId as (id: string) => string;

  // FIX A: the single shared fold — tool alias first, then the -web browser-capture strip.
  assert.equal(canonicalToolBrandId("codex-web"), "codex");
  assert.equal(canonicalToolBrandId("content"), "cynaps3");
  assert.equal(canonicalToolBrandId("musicmation"), "cynaps3");
  assert.equal(canonicalToolBrandId("suno"), "suno");

  // Mirror page.tsx's fold exactly: shared helper + sort by tool_id + overwrite only on an exact-id row.
  const fold = (statements: Array<{ toolId: string; statement: string }>) => {
    const map = new Map<string, string>();
    for (const s of statements.slice().sort((a, b) => a.toolId.localeCompare(b.toolId))) {
      const brandId = canonicalToolBrandId(s.toolId);
      if (!map.has(brandId) || s.toolId === brandId) map.set(brandId, s.statement);
    }
    return map;
  };

  // Rule 1: a raw id exactly equal to the brand id wins, regardless of input order.
  assert.equal(fold([
    { toolId: "musicmation", statement: "from musicmation" },
    { toolId: "cynaps3", statement: "from cynaps3" },
    { toolId: "content", statement: "from content" },
  ]).get("cynaps3"), "from cynaps3");

  // Rule 2: with no exact-id row, the lexicographically-first raw id wins (content < musicmation).
  assert.equal(fold([
    { toolId: "musicmation", statement: "from musicmation" },
    { toolId: "content", statement: "from content" },
  ]).get("cynaps3"), "from content");

  // The winning statement is what actually renders on the folded brand's chip.
  const toolbarRuntime = loadToolbarModule();
  const ToolbarDock = toolbarRuntime.exports.ToolbarDock as (props: unknown) => unknown;
  const winner = fold([
    { toolId: "content", statement: "from content" },
    { toolId: "cynaps3", statement: "from cynaps3" },
  ]).get("cynaps3");
  const html = toolbarRuntime.renderToStaticMarkup(toolbarRuntime.jsxRuntime.jsx(ToolbarDock, {
    defaultActiveId: "cynaps3",
    brands: [{ id: "cynaps3", label: "Cynaps3", mark: "CY", from: "#000", blurb: "Cynaps3 Musicmation.", statement: winner }],
  }));
  assert.match(html, /from cynaps3/);
});

test("page folds statements through the shared canonicalToolBrandId helper, not a mirrored alias map", () => {
  assert.doesNotMatch(page, /TOOL_STATEMENT_ALIAS/);       // the mirrored alias map is gone (FIX A dedup)
  assert.match(page, /canonicalToolBrandId\(s\.toolId\)/); // statements fold through the shared helper
  assert.match(page, /<ToolbarDock brands=\{brands\} handle=\{profile\.handle\}/);
  // data.ts still loads statements off the resolved identity, guarded for the additive table.
  assert.match(dataLib, /const toolStatements = identity\?\.id \? await toolStatementsFor\(identity\.id\) : \[\]/);
  assert.match(dataLib, /reportOptionalFallback\("profile\.tool-statements\.fallback", error\)/);
});
