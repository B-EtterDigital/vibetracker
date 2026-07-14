import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PROVIDERS } from "../../../../adapters/src/registry.ts";
import { EXPLICIT_PROVIDER_BRAND_IDS, hasProviderBrand, providerBrand } from "../provider-brand.ts";
import {
  buildProviderBootSequence,
  buildProviderCollectionCommandWall,
  buildProviderCollectionConsole,
  buildProviderFreshnessRadar,
  buildProviderPassportWall,
  buildProviderScanLanes,
  buildProviderSignalMarquee,
  buildProviderScanTheatre,
  buildProviderSurpriseDirector,
  buildProviderWorldCoverageMap,
} from "../provider-scan.ts";

test("provider scan lanes cover verified, creator, local, regional, and manual workflows", () => {
  const lanes = buildProviderScanLanes(PROVIDERS);

  assert.deepEqual(lanes.map((lane) => lane.id), [
    "verified-ledger",
    "creator-studio",
    "local-lab",
    "regional-cloud",
    "manual-ledger",
  ]);
  assert.equal(lanes.every((lane) => lane.providers.length > 0 && lane.providers.length <= 6), true);

  const verified = lanes.find((lane) => lane.id === "verified-ledger");
  assert.ok(verified);
  assert.equal(verified.providers.every((provider) => provider.status === "built" && provider.verified), true);
  assert.match(verified.note, /evidence/);

  const creator = lanes.find((lane) => lane.id === "creator-studio");
  assert.ok(creator);
  assert.ok(creator.providers.some((provider) => provider.id === "higgsfield"));
  assert.ok(creator.providers.some((provider) => provider.id === "suno" || provider.id === "udio"));

  const local = lanes.find((lane) => lane.id === "local-lab");
  assert.ok(local);
  assert.ok(local.providers.some((provider) => provider.id === "ollama"));
  assert.ok(local.providers.some((provider) => provider.id === "lmstudio"));
  assert.match(local.note, /local-first/);

  const regional = lanes.find((lane) => lane.id === "regional-cloud");
  assert.ok(regional);
  assert.ok(regional.providers.some((provider) => provider.id === "qwen"));
  assert.ok(regional.providers.some((provider) => provider.id === "doubao"));
  assert.ok(regional.providers.some((provider) => provider.id === "mistral"));

  const manual = lanes.find((lane) => lane.id === "manual-ledger");
  assert.ok(manual);
  assert.ok(manual.providers.some((provider) => provider.id === "midjourney"));
  assert.match(manual.note, /manual evidence/);
});

test("provider brand map has explicit colors for scanner headline providers", () => {
  assert.equal(providerBrand("openrouter").mark, "OR");
  assert.equal(providerBrand("antigravity").mark, "AG");
  assert.equal(providerBrand("canva").from, "#00c4cc");
  assert.equal(providerBrand("codex-cli").to, "#3b82f6");
});

test("provider brand map explicitly covers every registry provider", () => {
  const missing = PROVIDERS.map((provider) => provider.id).filter((id) => !hasProviderBrand(id));

  assert.deepEqual(missing, []);
  assert.ok(EXPLICIT_PROVIDER_BRAND_IDS.length >= PROVIDERS.length);
  assert.equal(providerBrand("tencent-hunyuan").mark, "TH");
  assert.equal(providerBrand("zhipu").mark, "ZP");
  assert.equal(providerBrand("baidu-wenxin").mark, "BW");
  assert.equal(providerBrand("luma").mark, "LU");
  assert.equal(providerBrand("kling").mark, "KL");
  assert.equal(providerBrand("minimax").mark, "MX");
  assert.equal(providerBrand("vllm").mark, "VL");
  assert.equal(providerBrand("vercel").mark, "VC");
  assert.equal(providerBrand("supabase").from, "#3ecf8e");
});

test("provider scan theatre carries branded surprises without counting them as usage", () => {
  const scenes = buildProviderScanTheatre(PROVIDERS);

  assert.deepEqual(scenes.map((scene) => scene.id), [
    "higgsfield-field",
    "codex-orbit",
    "local-lab-array",
    "c0vibe-relay",
  ]);
  assert.equal(scenes.every((scene) => scene.foot.includes("not usage")), true);
  assert.equal(scenes.every((scene) => scene.meter >= 18 && scene.meter <= 96), true);

  const higgsfield = scenes.find((scene) => scene.id === "higgsfield-field");
  assert.ok(higgsfield);
  assert.equal(higgsfield.providerIds.includes("higgsfield"), true);
  assert.match(higgsfield.ascii.join("\n"), /HF/);
  assert.equal(higgsfield.status, "verified evidence");

  const local = scenes.find((scene) => scene.id === "local-lab-array");
  assert.ok(local);
  assert.match(local.copy, /local/i);
  assert.match(local.ascii.join("\n"), /127\.0\.0\.1/);

  const relay = scenes.find((scene) => scene.id === "c0vibe-relay");
  assert.ok(relay);
  assert.equal(relay.foot.includes("Vibers Unite"), true);
  assert.match(relay.ascii.join("\n"), /C0VIBE\.APP/);
});

test("provider world coverage map highlights creator, Chinese, European, local, builder, and publish rails", () => {
  const map = buildProviderWorldCoverageMap(PROVIDERS);

  assert.equal(map.headline, "World coverage command map");
  assert.deepEqual(map.zones.map((zone) => zone.id), [
    "creator-world",
    "china-cloud",
    "europe-cloud",
    "local-lab",
    "builder-stack",
    "c0vibe-relay",
  ]);
  assert.equal(map.totals.zones, 6);
  assert.equal(map.totals.trustRails, 1);
  assert.equal(map.totals.publishRails, 1);
  assert.equal(map.terminalLines.every((line) => line.length === 64), true);
  assert.match(map.terminalLines.join("\n"), /CN-EU-LOCAL-CREATOR/);
  assert.match(map.terminalLines.join("\n"), /NOT USAGE/);
  assert.match(map.terminalLines.join("\n"), /Vibers Unite/);

  const creator = map.zones.find((zone) => zone.id === "creator-world");
  assert.ok(creator);
  assert.equal(creator.impact, "usage");
  assert.ok(creator.providerIds.includes("higgsfield"));
  assert.ok(creator.providerIds.includes("midjourney"));
  assert.match(creator.frames.join("\n"), /creator/i);

  const china = map.zones.find((zone) => zone.id === "china-cloud");
  assert.ok(china);
  assert.ok(china.providerIds.includes("qwen"));
  assert.ok(china.providerIds.includes("doubao"));
  assert.ok(china.providerIds.includes("kimi"));
  assert.ok(china.providerIds.includes("zhipu"));
  assert.match(china.region, /China/);

  const europe = map.zones.find((zone) => zone.id === "europe-cloud");
  assert.ok(europe);
  assert.ok(europe.providerIds.includes("mistral"));
  assert.ok(europe.providerIds.includes("aleph-alpha"));
  assert.ok(europe.providerIds.includes("lighton"));
  assert.match(europe.region, /Europe/);

  const local = map.zones.find((zone) => zone.id === "local-lab");
  assert.ok(local);
  assert.equal(local.impact, "local_only");
  assert.ok(local.providerIds.includes("ollama"));
  assert.ok(local.providerIds.includes("lmstudio"));
  assert.ok(local.providerIds.includes("comfyui"));
  assert.match(local.guardrail, /Local-only/);

  const builder = map.zones.find((zone) => zone.id === "builder-stack");
  assert.ok(builder);
  assert.equal(builder.impact, "trust");
  assert.ok(builder.providerIds.includes("codex-cli"));
  assert.ok(builder.providerIds.includes("antigravity"));
  assert.match(builder.guardrail, /NOT USAGE/);

  const relay = map.zones.find((zone) => zone.id === "c0vibe-relay");
  assert.ok(relay);
  assert.equal(relay.impact, "publish");
  assert.equal(relay.meter, 100);
  assert.ok(relay.marks.some((mark) => mark.mark === "C0"));
  assert.match(relay.frames.join("\n"), /c0vibe/i);
});

test("providers route opens with the provider directory before metric cards", () => {
  const page = readFileSync("packages/web/src/app/providers/page.tsx", "utf8");
  const styles = readFileSync("packages/web/src/app/globals.css", "utf8");

  assert.match(page, /ProvidersDirectory/);
  assert.match(page, /ProvidersDirectory providers=\{PROVIDERS\}[\s\S]+<section className="provider-metrics"/);
  assert.doesNotMatch(page, /ProviderWorldIgnitionPanel/);
  assert.match(page, /Vibers Unite/);
  assert.match(page, /c0vibe\.app/);

  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.match(styles, /@media \(max-width: 1040px\)/);
});

test("provider collection console sequences scan surprises across clear signal boundaries", () => {
  const console = buildProviderCollectionConsole(PROVIDERS);

  assert.equal(console.headline, "Collection surprise console");
  assert.deepEqual(console.steps.map((step) => step.id), [
    "higgsfield-prism",
    "codex-trust-cube",
    "local-sonar",
    "regional-mesh",
    "creator-ledger",
    "c0vibe-unite-relay",
  ]);
  assert.deepEqual(console.totals, {
    usage: 2,
    trust: 1,
    local_only: 1,
    manual: 1,
    publish: 1,
  });
  assert.equal(console.terminalLines.every((line) => line.length === 64), true);
  assert.match(console.terminalLines.join("\n"), /NOT USAGE/);
  assert.match(console.terminalLines.join("\n"), /Vibers Unite/);
  assert.equal(console.steps.every((step) => step.frames.length === 4), true);
  assert.equal(console.steps.every((step) => step.meter >= 18 && step.meter <= 100), true);

  const higgsfield = console.steps.find((step) => step.id === "higgsfield-prism");
  assert.ok(higgsfield);
  assert.equal(higgsfield.impact, "usage");
  assert.equal(higgsfield.marks[0]?.mark, "HF");
  assert.match(higgsfield.frames.join("\n"), /HF/);
  assert.match(higgsfield.guardrail, /Usage only/);

  const codex = console.steps.find((step) => step.id === "codex-trust-cube");
  assert.ok(codex);
  assert.equal(codex.impact, "trust");
  assert.ok(codex.providerIds.includes("github"));
  assert.match(codex.guardrail, /NOT USAGE/);

  const local = console.steps.find((step) => step.id === "local-sonar");
  assert.ok(local);
  assert.equal(local.impact, "local_only");
  assert.ok(local.providerIds.includes("ollama"));
  assert.ok(local.providerIds.includes("lmstudio"));
  assert.ok(local.providerIds.includes("comfyui"));
  assert.match(local.frames.join("\n"), /127\.0\.0/);

  const relay = console.steps.find((step) => step.id === "c0vibe-unite-relay");
  assert.ok(relay);
  assert.equal(relay.impact, "publish");
  assert.equal(relay.meter, 100);
  assert.equal(relay.marks[0]?.mark, "C0");
  assert.match(relay.frames.join("\n"), /C0VIBE\.APP/);
  assert.match(relay.frames.join("\n"), /VIBERS/);
});

test("provider collection command wall labels auto, local, trust, manual, and publish paths without side effects", () => {
  const wall = buildProviderCollectionCommandWall(PROVIDERS);

  assert.equal(wall.headline, "Collection command wall");
  assert.match(wall.subline, /read automatically/);
  assert.match(wall.terminalLines.join("\n"), /COLLECTION-COMMAND-WALL/);
  assert.match(wall.terminalLines.join("\n"), /VISUAL-ONLY/);
  assert.match(wall.terminalLines.join("\n"), /NO-FAKE-USAGE/);
  assert.match(wall.terminalLines.join("\n"), /providerCalls=0 \/\/ ledgerWrites=0 \/\/ hiddenUpload=0/);
  assert.match(wall.terminalLines.join("\n"), /Higgsfield MCP/);
  assert.match(wall.terminalLines.join("\n"), /Vibers Unite/);
  assert.match(wall.terminalLines.join("\n"), /C0vibe\.app/);
  assert.equal(wall.terminalLines.every((line) => line.length === 64), true);
  assert.deepEqual(wall.channels.map((channel) => channel.id), [
    "auto-provider-usage",
    "local-review-loop",
    "trust-sidecar",
    "regional-usage-mesh",
    "manual-creator-ledger",
    "c0vibe-publish-review",
  ]);
  assert.deepEqual(wall.channels.map((channel) => channel.railLabel), ["USAGE", "NOT USAGE", "NOT USAGE", "USAGE", "MANUAL", "PUBLISH"]);
  assert.deepEqual(wall.totals, {
    channels: 6,
    mappedProviderRefs: wall.channels.reduce((sum, channel) => sum + channel.mapped, 0),
    autoReadable: 2,
    usageEligible: 2,
    notUsage: 2,
    localOnly: 1,
    trustOnly: 1,
    manualOnly: 1,
    publishOnly: 1,
    visualOnly: 6,
    usageWrites: 0,
    providerCalls: 0,
    ledgerWrites: 0,
    hiddenUpload: 0,
  });
  assert.equal(wall.channels.every((channel) => channel.visualOnly), true);
  assert.equal(wall.channels.every((channel) => channel.usageWrites === false), true);
  assert.equal(wall.channels.every((channel) => channel.providerCalls === false), true);
  assert.equal(wall.channels.every((channel) => channel.ledgerWrites === false), true);
  assert.equal(wall.channels.every((channel) => channel.hiddenUpload === false), true);
  assert.equal(wall.channels.every((channel) => channel.frames.length === 4), true);
  assert.equal(wall.channels.every((channel) => channel.terminalLines.length === 4), true);
  assert.equal(wall.channels.every((channel) => channel.terminalLines.every((line) => line.length === 64)), true);
  assert.equal(wall.channels.every((channel) => /^[0-9A-F]{8}$/.test(channel.checksum)), true);

  const auto = wall.channels.find((channel) => channel.id === "auto-provider-usage");
  assert.ok(auto);
  assert.equal(auto.autoReadable, true);
  assert.equal(auto.impact, "usage");
  assert.ok(auto.providerIds.includes("higgsfield"));
  assert.ok(auto.providerIds.includes("replicate"));
  assert.match(auto.readPath, /MCP\/API/);
  assert.match(auto.frames.join("\n"), /HF MCP/);
  assert.match(auto.guardrail, /validated rows/);

  const local = wall.channels.find((channel) => channel.id === "local-review-loop");
  assert.ok(local);
  assert.equal(local.railLabel, "NOT USAGE");
  assert.equal(local.localOnly, true);
  assert.equal(local.autoReadable, false);
  assert.ok(local.providerIds.includes("ollama"));
  assert.ok(local.providerIds.includes("lmstudio"));
  assert.ok(local.providerIds.includes("comfyui"));
  assert.match(local.guardrail, /on-machine/);

  const trust = wall.channels.find((channel) => channel.id === "trust-sidecar");
  assert.ok(trust);
  assert.equal(trust.railLabel, "NOT USAGE");
  assert.equal(trust.trustOnly, true);
  assert.equal(trust.autoReadable, false);
  assert.ok(trust.providerIds.includes("codex-cli"));
  assert.ok(trust.providerIds.includes("github"));
  assert.ok(trust.providerIds.includes("antigravity"));
  assert.match(trust.guardrail, /NOT USAGE/);

  const regional = wall.channels.find((channel) => channel.id === "regional-usage-mesh");
  assert.ok(regional);
  assert.equal(regional.autoReadable, true);
  assert.ok(regional.providerIds.includes("qwen"));
  assert.ok(regional.providerIds.includes("doubao"));
  assert.ok(regional.providerIds.includes("mistral"));
  assert.match(regional.surprise, /Chinese and European/);

  const manual = wall.channels.find((channel) => channel.id === "manual-creator-ledger");
  assert.ok(manual);
  assert.equal(manual.manualOnly, true);
  assert.equal(manual.railLabel, "MANUAL");
  assert.ok(manual.providerIds.includes("midjourney"));
  assert.ok(manual.providerIds.includes("canva"));
  assert.match(manual.guardrail, /never fake API usage/);

  const relay = wall.channels.find((channel) => channel.id === "c0vibe-publish-review");
  assert.ok(relay);
  assert.equal(relay.publishOnly, true);
  assert.equal(relay.railLabel, "PUBLISH");
  assert.equal(relay.meter, 100);
  assert.ok(relay.marks.some((mark) => mark.mark === "C0"));
  assert.match(relay.frames.join("\n"), /VIBERS/);
});

test("provider freshness radar turns registry state into no-call readiness lanes", () => {
  const radar = buildProviderFreshnessRadar(PROVIDERS);

  assert.equal(radar.headline, "Provider freshness radar");
  assert.match(radar.subline, /registry-derived readiness console/);
  assert.match(radar.terminalLines.join("\n"), /PROVIDER-FRESHNESS-RADAR/);
  assert.match(radar.terminalLines.join("\n"), /REGISTRY-ONLY/);
  assert.match(radar.terminalLines.join("\n"), /NO-CALLS/);
  assert.match(radar.terminalLines.join("\n"), /NOT USAGE/);
  assert.match(radar.terminalLines.join("\n"), /providerCalls=0 \/\/ ledgerWrites=0 \/\/ hiddenUpload=0/);
  assert.match(radar.terminalLines.join("\n"), /Vibers Unite/);
  assert.equal(radar.terminalLines.every((line) => line.length === 64), true);
  assert.deepEqual(radar.lanes.map((lane) => lane.id), [
    "verified-live",
    "approx-built",
    "local-proxy",
    "trust-sidecar",
    "manual-ledger",
    "planned-next",
    "publish-safe",
  ]);
  assert.deepEqual(radar.lanes.map((lane) => lane.railLabel), ["USAGE", "USAGE", "NOT USAGE", "NOT USAGE", "MANUAL", "PLANNED", "PUBLISH"]);
  assert.deepEqual(radar.totals, {
    lanes: 7,
    providers: PROVIDERS.length,
    providerRefs: radar.lanes.reduce((sum, lane) => sum + lane.mapped, 0),
    built: PROVIDERS.filter((provider) => provider.status === "built").length,
    verified: PROVIDERS.filter((provider) => provider.status === "built" && provider.verified).length,
    approximate: PROVIDERS.filter((provider) => provider.status === "built" && !provider.verified).length,
    localProxy: PROVIDERS.filter((provider) => provider.tier === "local" || provider.tier === "proxy" || provider.auth === "localLogs").length,
    manual: PROVIDERS.filter((provider) => provider.tier === "manual" || provider.status === "manual-only").length,
    planned: PROVIDERS.filter((provider) => provider.status === "planned").length,
    usageRails: 2,
    notUsageRails: 2,
    manualRails: 1,
    plannedRails: 1,
    publishRails: 1,
    providerCalls: 0,
    ledgerWrites: 0,
    hiddenUpload: 0,
  });
  assert.equal(radar.lanes.every((lane) => lane.visualOnly), true);
  assert.equal(radar.lanes.every((lane) => lane.providerCalls === false), true);
  assert.equal(radar.lanes.every((lane) => lane.ledgerWrites === false), true);
  assert.equal(radar.lanes.every((lane) => lane.hiddenUpload === false), true);
  assert.equal(radar.lanes.every((lane) => lane.frames.length === 4), true);
  assert.equal(radar.lanes.every((lane) => lane.checkLines.length === 4), true);
  assert.equal(radar.lanes.every((lane) => lane.checkLines.every((line) => line.length === 64)), true);
  assert.equal(radar.lanes.every((lane) => /^[0-9A-F]{8}$/.test(lane.checksum)), true);

  const verified = radar.lanes.find((lane) => lane.id === "verified-live");
  assert.ok(verified);
  assert.equal(verified.impact, "usage");
  assert.ok(verified.providerIds.includes("higgsfield"));
  assert.ok(verified.providerIds.includes("replicate"));
  assert.match(verified.guardrail, /validated records/);

  const approximate = radar.lanes.find((lane) => lane.id === "approx-built");
  assert.ok(approximate);
  assert.ok(approximate.providerIds.includes("qwen"));
  assert.ok(approximate.providerIds.includes("mistral"));
  assert.match(approximate.guardrail, /no fake verified badge/);

  const local = radar.lanes.find((lane) => lane.id === "local-proxy");
  assert.ok(local);
  assert.equal(local.railLabel, "NOT USAGE");
  assert.ok(local.providerIds.includes("ollama"));
  assert.ok(local.providerIds.includes("lmstudio"));
  assert.ok(local.providerIds.includes("comfyui"));
  assert.match(local.guardrail, /NOT USAGE/);

  const trust = radar.lanes.find((lane) => lane.id === "trust-sidecar");
  assert.ok(trust);
  assert.equal(trust.impact, "trust");
  assert.ok(trust.providerIds.includes("codex-cli"));
  assert.ok(trust.providerIds.includes("antigravity"));
  assert.match(trust.guardrail, /NOT USAGE/);

  const planned = radar.lanes.find((lane) => lane.id === "planned-next");
  assert.ok(planned);
  assert.equal(planned.impact, "planned");
  assert.ok(planned.providerIds.includes("gemini"));
  assert.match(planned.guardrail, /Planned means mapped/);

  const publish = radar.lanes.find((lane) => lane.id === "publish-safe");
  assert.ok(publish);
  assert.equal(publish.impact, "publish");
  assert.equal(publish.meter, 100);
  assert.ok(publish.providerIds.includes("c0vibe"));
  assert.match(publish.guardrail, /PUBLISH rail only/);
});

test("providers route ships the theatre encore collapsed and drops the freshness radar", () => {
  const page = readFileSync("packages/web/src/app/providers/page.tsx", "utf8");
  const styles = readFileSync("packages/web/src/app/globals.css", "utf8");
  const providerScan = readFileSync("packages/web/src/lib/provider-scan.ts", "utf8");
  const providersCss = readFileSync("packages/web/src/app/providers/providers.css", "utf8");
  const directoryCss = readFileSync("packages/web/src/app/providers/directory.css", "utf8");
  const directoryTableCss = readFileSync("packages/web/src/app/providers/directory-table.css", "utf8");
  const directory = readFileSync("packages/web/src/app/providers/directory.tsx", "utf8");

  assert.doesNotMatch(page, /buildProviderFreshnessRadar|ProviderFreshnessRadarPanel/);
  assert.match(page, /<details className="providers-theatre">/);
  assert.match(page, /ProviderSurpriseDirectorPanel/);
  assert.match(page, /import "\.\/directory\.css"/);
  assert.match(page, /import "\.\/directory-table\.css"/);
  assert.match(directory, /<colgroup className="providers-columns"/);
  assert.match(directory, /pageProviderRows\(results, page\)/);
  assert.match(directoryCss, /providers-directory__brief/);
  assert.match(directoryTableCss, /table-layout: fixed/);
  assert.match(directoryTableCss, /providers-columns__action \{ width: 20%/);
  assert.match(providersCss, /\.providers-row td\.providers-row__cats \{/);
  assert.match(providersCss, /grid-area: cats/);
  assert.match(providersCss, /\.providers-hero \.registry-terminal \{ min-height: 210px; \}/);
  assert.match(providersCss, /@media \(max-width: 767px\)/);
  assert.match(providersCss, /prefers-reduced-motion: reduce/);
  assert.match(providerScan, /ProviderFreshnessRadar/);
  assert.match(providerScan, /Provider freshness radar/);
  assert.match(providerScan, /providerCalls=0/);
  assert.match(providerScan, /ledgerWrites=0/);
  assert.match(providerScan, /hiddenUpload=0/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
});

test("provider boot sequence makes registry preflight feel alive without calls or writes", () => {
  const boot = buildProviderBootSequence(PROVIDERS);

  assert.equal(boot.headline, "Provider boot sequence");
  assert.match(boot.subline, /registry-driven preflight rail/);
  assert.match(boot.terminalLines.join("\n"), /PROVIDER-BOOT-SEQUENCE/);
  assert.match(boot.terminalLines.join("\n"), /no provider calls/);
  assert.match(boot.terminalLines.join("\n"), /providerCalls=0 \/\/ ledgerWrites=0 \/\/ hiddenUpload=0/);
  assert.match(boot.terminalLines.join("\n"), /Vibers Unite/);
  assert.equal(boot.terminalLines.every((line) => line.length === 64), true);
  assert.deepEqual(boot.slots.map((slot) => slot.id), [
    "higgsfield-prism-boot",
    "codex-trust-cube-boot",
    "local-sonar-boot",
    "regional-mesh-boot",
    "creator-ledger-boot",
    "c0vibe-unite-relay-boot",
  ]);
  assert.deepEqual(boot.slots.map((slot) => slot.railLabel), ["USAGE", "NOT USAGE", "NOT USAGE", "USAGE", "MANUAL", "PUBLISH"]);
  assert.equal(boot.slots.every((slot) => slot.frames.length === 4), true);
  assert.equal(boot.slots.every((slot) => slot.bootLines.length === 4), true);
  assert.equal(boot.slots.every((slot) => slot.bootLines.every((line) => line.length === 64)), true);
  assert.equal(boot.slots.every((slot) => /^[0-9A-F]{8}$/.test(slot.checksum)), true);
  assert.equal(new Set(boot.slots.map((slot) => slot.checksum)).size, boot.slots.length);
  assert.equal(boot.slots.every((slot) => slot.visualOnly), true);
  assert.equal(boot.slots.every((slot) => slot.providerCalls === false), true);
  assert.equal(boot.slots.every((slot) => slot.ledgerWrites === false), true);
  assert.equal(boot.slots.every((slot) => slot.hiddenUpload === false), true);
  assert.equal(boot.slots.every((slot) => slot.secretExport === false), true);
  assert.match(boot.slots.find((slot) => slot.id === "higgsfield-prism-boot")?.frames.join("\n") ?? "", /HF/);
  assert.match(boot.slots.find((slot) => slot.id === "codex-trust-cube-boot")?.bootLines.join("\n") ?? "", /NOT USAGE/);
  assert.match(boot.slots.find((slot) => slot.id === "local-sonar-boot")?.guardrail ?? "", /Local-only/);
  assert.match(boot.slots.find((slot) => slot.id === "c0vibe-unite-relay-boot")?.frames.join("\n") ?? "", /VIBERS/);
  assert.deepEqual(boot.totals, {
    slots: 6,
    mappedProviderRefs: boot.slots.reduce((sum, slot) => sum + slot.mapped, 0),
    usage: 2,
    notUsage: 2,
    localOnly: 1,
    manual: 1,
    publish: 1,
    providerCalls: 0,
    ledgerWrites: 0,
    hiddenUpload: 0,
  });
});

test("provider signal marquee turns registry coverage into a branded no-fake-usage ticker", () => {
  const marquee = buildProviderSignalMarquee(PROVIDERS);

  assert.equal(marquee.headline, "Provider signal marquee");
  assert.match(marquee.subline, /Visual-only/);
  assert.match(marquee.terminalLines.join("\n"), /PROVIDER-SIGNAL-MARQUEE/);
  assert.match(marquee.terminalLines.join("\n"), /NO-FAKE-USAGE/);
  assert.match(marquee.terminalLines.join("\n"), /NOT USAGE/);
  assert.match(marquee.terminalLines.join("\n"), /Vibers Unite/);
  assert.match(marquee.terminalLines.join("\n"), /c0vibe\.app/);
  assert.equal(marquee.terminalLines.every((line) => line.length === 64), true);
  assert.deepEqual(marquee.rails.map((rail) => rail.id), [
    "creator-signal",
    "local-signal",
    "regional-signal",
    "builder-signal",
    "manual-signal",
    "c0vibe-signal",
  ]);
  assert.deepEqual(marquee.rails.map((rail) => rail.railLabel), ["USAGE", "NOT USAGE", "USAGE", "NOT USAGE", "MANUAL", "PUBLISH"]);
  assert.deepEqual(marquee.totals, {
    rails: 6,
    mappedProviderRefs: marquee.rails.reduce((sum, rail) => sum + rail.mapped, 0),
    usageRails: 2,
    notUsageRails: 2,
    manualRails: 1,
    publishRails: 1,
    visualOnly: 6,
    usageWrites: 0,
  });
  assert.equal(marquee.rails.every((rail) => rail.visualOnly), true);
  assert.equal(marquee.rails.every((rail) => rail.usageWrites === false), true);
  assert.equal(marquee.rails.every((rail) => rail.frames.length === 4), true);
  assert.equal(marquee.rails.every((rail) => rail.tickerLines.length === 4), true);
  assert.equal(marquee.rails.every((rail) => rail.tickerLines.every((line) => line.length === 64)), true);
  assert.equal(marquee.rails.every((rail) => /^[0-9A-F]{8}$/.test(rail.checksum)), true);

  const creator = marquee.rails.find((rail) => rail.id === "creator-signal");
  assert.ok(creator);
  assert.equal(creator.impact, "usage");
  assert.ok(creator.marks.some((mark) => mark.mark === "HF"));
  assert.ok(creator.marks.some((mark) => mark.mark === "RW"));
  assert.match(creator.frames.join("\n"), /HF/);

  const local = marquee.rails.find((rail) => rail.id === "local-signal");
  assert.ok(local);
  assert.equal(local.impact, "local_only");
  assert.equal(local.railLabel, "NOT USAGE");
  assert.ok(local.marks.some((mark) => mark.mark === "OL"));
  assert.ok(local.marks.some((mark) => mark.mark === "LM"));
  assert.match(local.guardrail, /Local-only/);

  const builder = marquee.rails.find((rail) => rail.id === "builder-signal");
  assert.ok(builder);
  assert.equal(builder.impact, "trust");
  assert.equal(builder.railLabel, "NOT USAGE");
  assert.ok(builder.providerIds.includes("codex-cli"));
  assert.ok(builder.providerIds.includes("github"));
  assert.ok(builder.providerIds.includes("antigravity"));
  assert.ok(builder.marks.some((mark) => mark.mark === "CX"));
  assert.ok(builder.marks.some((mark) => mark.mark === "AG"));
  assert.match(builder.guardrail, /NOT USAGE/);

  const regional = marquee.rails.find((rail) => rail.id === "regional-signal");
  assert.ok(regional);
  assert.ok(regional.providerIds.includes("qwen"));
  assert.ok(regional.providerIds.includes("doubao"));
  assert.ok(regional.providerIds.includes("mistral"));
  assert.equal(regional.railLabel, "USAGE");

  const manual = marquee.rails.find((rail) => rail.id === "manual-signal");
  assert.ok(manual);
  assert.equal(manual.impact, "manual");
  assert.equal(manual.railLabel, "MANUAL");
  assert.ok(manual.marks.some((mark) => mark.mark === "MJ"));
  assert.ok(manual.marks.some((mark) => mark.mark === "CA"));
  assert.match(manual.guardrail, /never fake API usage/);

  const relay = marquee.rails.find((rail) => rail.id === "c0vibe-signal");
  assert.ok(relay);
  assert.equal(relay.impact, "publish");
  assert.equal(relay.railLabel, "PUBLISH");
  assert.equal(relay.meter, 100);
  assert.ok(relay.marks.some((mark) => mark.mark === "C0"));
  assert.match(relay.frames.join("\n"), /C0VIBE/);
});

test("provider surprise director choreographs multiple scan reveals without side effects", () => {
  const director = buildProviderSurpriseDirector(PROVIDERS);

  assert.equal(director.headline, "Provider surprise director");
  assert.match(director.subline, /Higgsfield turns/);
  assert.match(director.motto, /Vibers Unite/);
  assert.match(director.motto, /C0vibe\.app/);
  assert.match(director.terminalLines.join("\n"), /PROVIDER-SURPRISE-DIRECTOR/);
  assert.match(director.terminalLines.join("\n"), /HF turn -> Codex cube -> local sonar -> C0 flash/);
  assert.match(director.terminalLines.join("\n"), /NOT USAGE/);
  assert.match(director.terminalLines.join("\n"), /hiddenUploads=0/);
  assert.equal(director.terminalLines.every((line) => line.length === 64), true);
  assert.deepEqual(director.cues.map((cue) => cue.id), [
    "higgsfield-prism",
    "codex-trust-cube",
    "local-sonar",
    "regional-mesh",
    "creator-ledger",
    "c0vibe-unite-relay",
  ]);
  assert.deepEqual(director.cues.map((cue) => cue.gate), [
    "provider-auth",
    "trust-sidecar",
    "local-review",
    "usage-mesh",
    "manual-ledger",
    "redact-relay",
  ]);
  assert.deepEqual(director.cues.map((cue) => cue.railLabel), ["USAGE", "NOT USAGE", "NOT USAGE", "USAGE", "MANUAL", "PUBLISH"]);
  assert.equal(director.cues.every((cue) => cue.frames.length === 4), true);
  assert.equal(director.cues.every((cue) => cue.marks.length > 0), true);
  assert.equal(director.cues.every((cue) => /^T\+\d+\.\d{2}s$/.test(cue.timing)), true);
  assert.equal(director.cues.every((cue) => cue.operatorLine.includes(cue.railLabel)), true);
  assert.equal(director.cues.every((cue) => cue.visualOnly), true);
  assert.equal(director.cues.every((cue) => cue.providerCalls === false), true);
  assert.equal(director.cues.every((cue) => cue.ledgerWrites === false), true);
  assert.equal(director.cues.every((cue) => cue.hiddenUpload === false), true);

  const higgsfield = director.cues.find((cue) => cue.id === "higgsfield-prism");
  assert.ok(higgsfield);
  assert.equal(higgsfield.marks[0]?.mark, "HF");
  assert.match(higgsfield.frames.join("\n"), /HF/);
  assert.match(higgsfield.profileEffect, /usage\/profile feed/);

  const codex = director.cues.find((cue) => cue.id === "codex-trust-cube");
  assert.ok(codex);
  assert.match(codex.guardrail, /NOT USAGE/);
  assert.match(codex.profileEffect, /trust profile only/);

  const local = director.cues.find((cue) => cue.id === "local-sonar");
  assert.ok(local);
  assert.match(local.guardrail, /Local-only/);
  assert.match(local.profileEffect, /no public feed/);

  const relay = director.cues.find((cue) => cue.id === "c0vibe-unite-relay");
  assert.ok(relay);
  assert.match(relay.caption, /Vibers Unite/);
  assert.match(relay.profileEffect, /redaction/);

  assert.deepEqual(director.totals, {
    cues: 6,
    usageEligible: 2,
    notUsage: 2,
    manual: 1,
    publish: 1,
    providers: 16,
    visualOnly: 6,
    providerCalls: 0,
    ledgerWrites: 0,
    hiddenUpload: 0,
  });
});

test("provider passport wall gives every registry source a branded action card", () => {
  const wall = buildProviderPassportWall(PROVIDERS);

  assert.equal(wall.headline, "Provider passport wall");
  assert.equal(wall.cards.length, PROVIDERS.length);
  assert.equal(wall.totals.providers, PROVIDERS.length);
  assert.equal(wall.totals.built, PROVIDERS.filter((provider) => provider.status === "built").length);
  assert.equal(wall.totals.verified, PROVIDERS.filter((provider) => provider.status === "built" && provider.verified).length);
  assert.match(wall.terminalLines.join("\n"), /PROVIDER-PASSPORTS/);
  assert.match(wall.terminalLines.join("\n"), /NO-FAKE-GREEN/);
  assert.match(wall.terminalLines.join("\n"), /Vibers Unite/);
  assert.equal(wall.terminalLines.every((line) => line.length === 64), true);

  const higgsfield = wall.cards.find((card) => card.id === "higgsfield");
  assert.ok(higgsfield);
  assert.equal(higgsfield.tone, "verified");
  assert.equal(higgsfield.impact, "usage");
  assert.equal(higgsfield.command, "vibetracker sync --provider higgsfield");
  assert.equal(higgsfield.mark, "HF");
  assert.equal(higgsfield.meter, 100);

  const ollama = wall.cards.find((card) => card.id === "ollama");
  assert.ok(ollama);
  assert.equal(ollama.impact, "local_only");
  assert.match(ollama.note, /on-machine/);
  assert.match(ollama.command, /proxy --provider ollama/);

  const midjourney = wall.cards.find((card) => card.id === "midjourney");
  assert.ok(midjourney);
  assert.equal(midjourney.impact, "manual");
  assert.match(midjourney.command, /vibetracker add midjourney/);

  const gemini = wall.cards.find((card) => card.id === "gemini");
  assert.ok(gemini);
  assert.equal(gemini.tone, "planned");
  assert.match(gemini.note, /Planned means/);
});
