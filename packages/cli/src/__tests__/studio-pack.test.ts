import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";
import { GITHUB_TRUST_LEVEL_COLORS, renderGitHubTrustHeatgridHtml } from "../github-trust-heatgrid.ts";
import { buildOssMotionReceipt, renderOssMotionReceiptHtml } from "../oss-motion-receipt.ts";
import { buildStudioPackFiles, renderStudioBootPanoramaHtml, renderStudioPackIndex, studioPackManifest } from "../studio-pack.ts";
import { renderVibersUniteRoomHtml } from "../vibers-unite-room.ts";

function run(args: string[]) {
  return spawnSync(process.execPath, ["bin/vibetracker.mjs", ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, VT_NO_SURPRISES: "1", VT_NO_ANIM: "1" },
  });
}

test("studio pack builds the expected static files", () => {
  const files = buildStudioPackFiles({ providerIds: ["higgsfield", "codex-cli"] });

  assert.deepEqual(files.map((file) => file.path), [
    "index.html",
    "boot-panorama.html",
    "vibers-unite-room.html",
    "showcase.html",
    "surprise-reel.html",
    "ascii-motion-lab.html",
    "github-trust-heatgrid.html",
    "vibe-score-reactor.html",
    "oss-motion-receipt.html",
    "flight-recorder.html",
    "wizard-runway.html",
    "local-ai-radar.html",
    "command-cockpit.html",
    "manifest.json",
  ]);
  assert.ok(files.every((file) => file.content.length > 200));
  for (const file of files.filter((item) => item.path.endsWith(".html"))) {
    assert.doesNotMatch(file.content, /<script/i, file.path);
  }
});

test("studio pack index is branded, linked, and script-free", () => {
  const files = buildStudioPackFiles({ providerIds: ["higgsfield", "codex-cli"] });
  const html = files.find((file) => file.path === "index.html")?.content ?? "";

  assert.match(html, /VibeTRACKER Studio Pack/);
  assert.match(html, /VTK:\/\/STUDIO-PACK\/\/OFFLINE-GUI\/\/LOCAL-FIRST/);
  assert.match(html, /Vibers Unite/);
  assert.match(html, /href="boot-panorama\.html"/);
  assert.match(html, /Boot Panorama/);
  assert.match(html, /first-open command room/);
  assert.match(html, /href="vibers-unite-room\.html"/);
  assert.match(html, /Vibers Unite Room/);
  assert.match(html, /provider orbit, trust heatgrid, score datastream, and C0VIBE publish hold/i);
  assert.match(html, /href="showcase\.html"/);
  assert.match(html, /href="surprise-reel\.html"/);
  assert.match(html, /href="ascii-motion-lab\.html"/);
  assert.match(html, /ASCII Motion Lab/);
  assert.match(html, /research-backed motion lab/i);
  assert.match(html, /href="github-trust-heatgrid\.html"/);
  assert.match(html, /GitHub Trust Heatgrid/);
  assert.match(html, /official GitHub color contribution replay/i);
  assert.match(html, /href="vibe-score-reactor\.html"/);
  assert.match(html, /Vibe Score Reactor/);
  assert.match(html, /usage datastream factors, profile lineage, heatgrid outputs, and trust quarantine/i);
  assert.match(html, /href="oss-motion-receipt\.html"/);
  assert.match(html, /OSS Motion Receipt/);
  assert.match(html, /generated cli-spinners, ascii-globe, and drawille frame receipt/i);
  assert.match(html, /href="flight-recorder\.html"/);
  assert.match(html, /Flight Recorder/);
  assert.match(html, /Replayable scan surprise tape/);
  assert.match(html, /href="wizard-runway\.html"/);
  assert.match(html, /Wizard Runway/);
  assert.match(html, /Script-free first-run terminal-to-GUI scan room/);
  assert.match(html, /href="local-ai-radar\.html"/);
  assert.match(html, /Local AI Radar/);
  assert.match(html, /detect --html/);
  assert.match(html, /href="command-cockpit\.html"/);
  assert.match(html, /href="manifest\.json"/);
  assert.match(html, /VTK:\/\/STUDIO-COMMAND-MAP\/\/ROUTE-TO-PROOF\/\/NO-SIDE-EFFECTS/);
  assert.match(html, /Studio<br>Command Map/);
  assert.match(html, /Every page in the pack has a job/);
  assert.match(html, /providerCalls/);
  assert.match(html, /preview never phones adapters/);
  assert.match(html, /ledgerWrites/);
  assert.match(html, /no local records are mutated/);
  assert.match(html, /fakeUsage/);
  assert.match(html, /sample theatre stays labelled/);
  assert.match(html, /00 BOOT/);
  assert.match(html, /01 UNITE/);
  assert.match(html, /12 PROOF/);
  assert.match(html, /No provider calls/);
  assert.match(html, /No usage writes/);
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /https?:\/\//i);
});

test("studio pack manifest keeps safety rails explicit", () => {
  const files = buildStudioPackFiles({ providerIds: ["higgsfield"] });
  const manifest = studioPackManifest(files);

  assert.equal(manifest.schema, "vibetracker.studio-pack/0.1");
  assert.equal(manifest.motto, "Vibers Unite // c0vibe.app");
  assert.equal(manifest.safePreview, true);
  assert.equal(manifest.writes, false);
  assert.equal(manifest.uploads, false);
  assert.equal(manifest.providerCalls, false);
  assert.equal(manifest.secretsRead, false);
  assert.deepEqual(manifest.files.map((file) => file.path), [
    "index.html",
    "boot-panorama.html",
    "vibers-unite-room.html",
    "showcase.html",
    "surprise-reel.html",
    "ascii-motion-lab.html",
    "github-trust-heatgrid.html",
    "vibe-score-reactor.html",
    "oss-motion-receipt.html",
    "flight-recorder.html",
    "wizard-runway.html",
    "local-ai-radar.html",
    "command-cockpit.html",
    "manifest.json",
  ]);
});

test("studio pack index can render from manifest entries", () => {
  const html = renderStudioPackIndex([
    { path: "index.html", label: "Studio Index", description: "Entry point" },
    { path: "boot-panorama.html", label: "Boot Panorama", description: "Boot" },
    { path: "vibers-unite-room.html", label: "Vibers Unite Room", description: "Unite" },
    { path: "showcase.html", label: "Offline Showcase", description: "Overview" },
    { path: "surprise-reel.html", label: "Surprise Reel", description: "Theatre" },
    { path: "ascii-motion-lab.html", label: "ASCII Motion Lab", description: "Motion" },
    { path: "github-trust-heatgrid.html", label: "GitHub Trust Heatgrid", description: "Trust" },
    { path: "vibe-score-reactor.html", label: "Vibe Score Reactor", description: "Score" },
    { path: "oss-motion-receipt.html", label: "OSS Motion Receipt", description: "Credits" },
    { path: "flight-recorder.html", label: "Flight Recorder", description: "Recorder" },
    { path: "wizard-runway.html", label: "Wizard Runway", description: "Runway" },
    { path: "local-ai-radar.html", label: "Local AI Radar", description: "Local" },
    { path: "command-cockpit.html", label: "Command Cockpit", description: "Control" },
    { path: "manifest.json", label: "Manifest", description: "Proof" },
  ]);

  assert.match(html, /Boot Panorama/);
  assert.match(html, /Vibers Unite Room/);
  assert.match(html, /Offline Showcase/);
  assert.match(html, /Surprise Reel/);
  assert.match(html, /ASCII Motion Lab/);
  assert.match(html, /GitHub Trust Heatgrid/);
  assert.match(html, /Vibe Score Reactor/);
  assert.match(html, /OSS Motion Receipt/);
  assert.match(html, /Flight Recorder/);
  assert.match(html, /Wizard Runway/);
  assert.match(html, /Local AI Radar/);
  assert.match(html, /Command Cockpit/);
  assert.match(html, /Manifest/);
  assert.doesNotMatch(html, /<script/i);
});

test("studio pack includes a script-free ASCII motion lab with visible attribution", () => {
  const files = buildStudioPackFiles({ providerIds: ["higgsfield", "codex-cli"] });
  const html = files.find((file) => file.path === "ascii-motion-lab.html")?.content ?? "";

  assert.match(html, /VibeTRACKER ASCII Motion Lab/);
  assert.match(html, /VTK:\/\/ASCII-MOTION-LAB\/\/OFFLINE-GUI\/\/NO-SIDEFX/);
  assert.match(html, /ASCII<br>Motion<br>Lab/);
  assert.match(html, /Surprise<br>Director/);
  assert.match(html, /Codex diff cube/);
  assert.match(html, /Higgsfield prism/);
  assert.match(html, /Local AI sonar/);
  assert.match(html, /Vibers Unite relay/);
  assert.match(html, /cli-spinners by Sindre Sorhus/);
  assert.match(html, /ascii-globe by Jakub T\. Jankiewicz/);
  assert.match(html, /MapSCII/);
  assert.match(html, /TerminalTextEffects \/ Notcurses \/ Chafa/);
  assert.match(html, /GPL references are not bundled/);
  assert.match(html, /providerCalls=0/);
  assert.match(html, /usageWrites=0/);
  assert.match(html, /hiddenUploads 0/);
  assert.match(html, /trust remains NOT USAGE/);
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /https?:\/\//i);
});

test("studio pack includes a script-free Vibe Score Reactor from the real score helpers", () => {
  const files = buildStudioPackFiles({ providerIds: ["higgsfield", "codex-cli"] });
  const html = files.find((file) => file.path === "vibe-score-reactor.html")?.content ?? "";

  assert.match(html, /VibeTRACKER Vibe Score Reactor/);
  assert.match(html, /VTK:\/\/VIBE-SCORE-REACTOR\/\/DATASTREAM\/\/TRUST-QUARANTINE/);
  assert.match(html, /Vibe<br>Score<br>Reactor/);
  assert.match(html, /Datastream<br>Lineage/);
  assert.match(html, /Score<br>Mixer/);
  assert.match(html, /Calibration<br>Chamber/);
  assert.match(html, /usage mass/i);
  assert.match(html, /daily rhythm/i);
  assert.match(html, /source breadth/i);
  assert.match(html, /freshness/i);
  assert.match(html, /trust side rail/i);
  assert.match(html, /trust delta: \+0 score/i);
  assert.match(html, /trustDelta 0/);
  assert.match(html, /usageWrites 0/);
  assert.match(html, /publicWrites 0/);
  assert.match(html, /profile, heatgrid, and score share this stream/);
  assert.match(html, /Trust signals are labelled NOT USAGE/);
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /https?:\/\//i);
});

test("studio pack includes a script-free GitHub trust heatgrid replay", () => {
  const html = renderGitHubTrustHeatgridHtml();

  assert.deepEqual([...GITHUB_TRUST_LEVEL_COLORS], ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"]);
  assert.match(html, /VibeTRACKER GitHub Trust Heatgrid/);
  assert.match(html, /VTK:\/\/GITHUB-TRUST-HEATGRID\/\/OFFICIAL-GH-COLORS\/\/NOT-USAGE/);
  assert.match(html, /GitHub<br>Trust<br>Heatgrid/);
  assert.match(html, /Official GitHub Contribution Scale Replay/);
  assert.match(html, /#161b22 #0e4429 #006d32 #26a641 #39d353/);
  assert.match(html, /affectsTotals=false/);
  assert.match(html, /usageVerified=false/);
  assert.match(html, /scoreDelta=0/);
  assert.match(html, /spendDelta=0/);
  assert.match(html, /rankDelta=0/);
  assert.match(html, /usageHeatgridDelta=0/);
  assert.match(html, /NOT USAGE/);
  assert.match(html, /This cannot change spend, credits, rank, usage heatgrid, or vibe score/);
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /https?:\/\//i);
});

test("studio pack includes a script-free local AI radar preview", () => {
  const files = buildStudioPackFiles({ providerIds: ["higgsfield", "codex-cli"] });
  const html = files.find((file) => file.path === "local-ai-radar.html")?.content ?? "";

  assert.match(html, /VibeTRACKER Local AI Radar/);
  assert.match(html, /Local radar preview/);
  assert.match(html, /VTK:\/\/LOCAL-SCAN\/\/PREVIEW-SHELL\/\/C0VIBE\.APP/);
  assert.match(html, /Run: vibetracker detect --html --out local\.html/);
  assert.match(html, /This studio page makes no loopback requests/);
  assert.match(html, /Ollama/);
  assert.match(html, /GPT4All/);
  assert.match(html, /Stable Diffusion WebUI Forge/);
  assert.match(html, /no usage writes/);
  assert.doesNotMatch(html, /<script/i);
});

test("studio boot panorama is a script-free offline first-open command room", () => {
  const html = renderStudioBootPanoramaHtml(["higgsfield", "codex-cli", "ollama", "qwen"]);

  assert.match(html, /VibeTRACKER Boot Panorama/);
  assert.match(html, /VTK:\/\/BOOT-PANORAMA\/\/OFFLINE-STUDIO\/\/NO-FAKE-USAGE/);
  assert.match(html, /VTK:\/\/BOOT-PANORAMA\/\/TERMINAL-GUI\/\/C0VIBE\.APP/);
  assert.match(html, /Boot<br>Panorama/);
  assert.match(html, /terminal handoff/);
  assert.match(html, /branded scan theatre/);
  assert.match(html, /proof boundary/);
  assert.match(html, /trust side rail/);
  assert.match(html, /C0VIBE relay/);
  assert.match(html, /providerCalls 0/);
  assert.match(html, /ledgerWrites 0/);
  assert.match(html, /hiddenUpload 0/);
  assert.match(html, /promptReads 0/);
  assert.match(html, /outputReads 0/);
  assert.match(html, /NOT USAGE/);
  assert.match(html, /Vibers Unite/);
  assert.match(html, /c0vibe\.app/);
  assert.match(html, /HF/);
  assert.match(html, /CX/);
  assert.match(html, /OL/);
  assert.match(html, /QW/);
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /https?:\/\//i);
});

test("studio pack includes a script-free Vibers Unite Room for the wow path", () => {
  const html = renderVibersUniteRoomHtml(["higgsfield", "codex-cli", "ollama", "qwen"]);

  assert.match(html, /VibeTRACKER Vibers Unite Room/);
  assert.match(html, /VTK:\/\/VIBERS-UNITE-ROOM\/\/OFFLINE-GUI\/\/ZERO-SIDEFX/);
  assert.match(html, /Vibers<br>Unite<br>Room/);
  assert.match(html, /terminal charm inside the GUI/);
  assert.match(html, /Higgsfield prism/);
  assert.match(html, /Codex cube/);
  assert.match(html, /Local AI sonar/);
  assert.match(html, /GitHub trust heatgrid/);
  assert.match(html, /Official GitHub colors: #161b22 #0e4429 #006d32 #26a641 #39d353/);
  assert.match(html, /profile, heatgrid, and score share the reviewed datastream/);
  assert.match(html, /trust delta \+0 score/);
  assert.match(html, /providerCalls=0 usageWrites=0 uploads=0 secretsRead=0/);
  assert.match(html, /promptReads=0 outputReads=0 hiddenNetwork=0/);
  assert.match(html, /NOT USAGE/);
  assert.match(html, /C0VIBE\.APP/);
  assert.match(html, /c0vibe\.app/);
  assert.match(html, /no confetti/);
  assert.match(html, /HF/);
  assert.match(html, /CX/);
  assert.match(html, /OL/);
  assert.match(html, /QW/);
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /https?:\/\//i);
});

test("OSS motion receipt renders actual integrated library frames with attribution", () => {
  const receipt = buildOssMotionReceipt();
  const html = renderOssMotionReceiptHtml();

  assert.equal(receipt.schema, "vibetracker.oss-motion-receipt/0.1");
  assert.equal(receipt.safePreview, true);
  assert.equal(receipt.providerCalls, false);
  assert.equal(receipt.usageWrites, false);
  assert.equal(receipt.uploads, false);
  assert.equal(receipt.scripts, false);
  assert.deepEqual(receipt.sources.map((source) => source.id), ["cli-spinners", "ascii-globe", "drawille"]);
  assert.ok(receipt.sources.find((source) => source.id === "cli-spinners")?.frames.some((frame) => /⠋|⠙|⠹/.test(frame)));
  assert.ok(receipt.sources.find((source) => source.id === "ascii-globe")?.frames.some((frame) => /[#.]/.test(frame)));
  assert.ok(receipt.sources.find((source) => source.id === "drawille")?.frames.some((frame) => /[⠀-⣿]/u.test(frame)));
  assert.match(receipt.terminalLines.join("\n"), /REAL-LIB-FRAMES/);
  assert.match(receipt.terminalLines.join("\n"), /providerCalls=0 usageWrites=0 uploads=0 scripts=0/);
  assert.match(html, /VibeTRACKER OSS Motion Receipt/);
  assert.match(html, /VTK:\/\/OSS-MOTION-RECEIPT\/\/LOCAL-LIBS\/\/NO-SIDEFX/);
  assert.match(html, /cli-spinners · Sindre Sorhus/);
  assert.match(html, /ascii-globe · Jakub T\. Jankiewicz/);
  assert.match(html, /drawille · Bence Danyi/);
  assert.match(html, /frames are generated at pack creation from installed OSS libraries/);
  assert.match(html, /providerCalls <b>NO<\/b>/);
  assert.match(html, /usageWrites <b>NO<\/b>/);
  assert.match(html, /scripts <b>NO<\/b>/);
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /https?:\/\//i);
});

test("studio pack wizard runway is included as a labelled surprise surface", () => {
  const files = buildStudioPackFiles({ providerIds: ["higgsfield", "codex-cli", "ollama"] });
  const runway = files.find((file) => file.path === "wizard-runway.html")?.content ?? "";

  assert.match(runway, /VTK:\/\/WIZARD-RUNWAY\/\/TERMINAL-GUI\/\/VIBERS-UNITE/);
  assert.match(runway, /VTK:\/\/WIZARD-RUNWAY\/\/OFFLINE\/\/NO-PROVIDER-CALLS/);
  assert.match(runway, /Higgsfield prism/);
  assert.match(runway, /Codex trust cube/);
  assert.match(runway, /Local AI sonar/);
  assert.match(runway, /Regional adapter pass/);
  assert.match(runway, /C0VIBE relay/);
  assert.match(runway, /NOT USAGE, no spend, no rank inflation/);
  assert.match(runway, /provider calls <b>NO<\/b>/);
  assert.match(runway, /trust affects spend <b>NO<\/b>/);
  assert.doesNotMatch(runway, /<script/i);
  assert.doesNotMatch(runway, /https?:\/\//i);
});

test("studio pack flight recorder is included as a replayable visual-only surface", () => {
  const files = buildStudioPackFiles({ providerIds: ["higgsfield", "codex-cli", "ollama"] });
  const recorder = files.find((file) => file.path === "flight-recorder.html")?.content ?? "";

  assert.match(recorder, /VibeTRACKER Surprise Flight Recorder/);
  assert.match(recorder, /VTK:\/\/SURPRISE-FLIGHT-RECORDER\/\/STATIC-GUI\/\/VIBERS-UNITE/);
  assert.match(recorder, /Flight<br>Recorder/);
  assert.match(recorder, /events 16/);
  assert.match(recorder, /USAGE 4/);
  assert.match(recorder, /NOT USAGE 4/);
  assert.match(recorder, /LOCAL 4/);
  assert.match(recorder, /PUBLISH 4/);
  assert.match(recorder, /visualOnly=true and usageWrites=false/);
  assert.match(recorder, /No provider calls, no usage writes, no prompts, no outputs/);
  assert.doesNotMatch(recorder, /<script/i);
  assert.doesNotMatch(recorder, /https?:\/\//i);
});

test("studio command writes the offline static pack", () => {
  const dir = mkdtempSync(join(tmpdir(), "vibetracker-studio-"));
  const result = run(["studio", "--provider", "higgsfield,codex-cli", "--out", dir]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /studio pack/);
  assert.match(result.stdout, /static HTML pack/);
  assert.match(result.stdout, /unite room:/);
  assert.match(result.stdout, /vibers-unite-room\.html/);
  assert.match(result.stdout, /motion lab:/);
  assert.match(result.stdout, /ascii-motion-lab\.html/);
  assert.match(result.stdout, /trust heatgrid:/);
  assert.match(result.stdout, /github-trust-heatgrid\.html/);
  assert.match(result.stdout, /score reactor:/);
  assert.match(result.stdout, /vibe-score-reactor\.html/);
  assert.match(result.stdout, /local radar:/);
  assert.match(result.stdout, /local-ai-radar\.html/);
  for (const file of ["index.html", "boot-panorama.html", "vibers-unite-room.html", "showcase.html", "surprise-reel.html", "ascii-motion-lab.html", "github-trust-heatgrid.html", "vibe-score-reactor.html", "oss-motion-receipt.html", "flight-recorder.html", "wizard-runway.html", "local-ai-radar.html", "command-cockpit.html", "manifest.json"]) {
    assert.equal(existsSync(join(dir, file)), true, file);
  }
  const index = readFileSync(join(dir, "index.html"), "utf8");
  assert.match(index, /VibeTRACKER Studio Pack/);
  assert.match(index, /href="boot-panorama\.html"/);
  assert.match(index, /href="vibers-unite-room\.html"/);
  assert.match(index, /href="surprise-reel\.html"/);
  assert.match(index, /href="ascii-motion-lab\.html"/);
  assert.match(index, /href="github-trust-heatgrid\.html"/);
  assert.match(index, /href="vibe-score-reactor\.html"/);
  assert.match(index, /href="oss-motion-receipt\.html"/);
  assert.match(index, /href="wizard-runway\.html"/);
  assert.match(index, /href="local-ai-radar\.html"/);
  assert.doesNotMatch(index, /<script/i);
  const boot = readFileSync(join(dir, "boot-panorama.html"), "utf8");
  assert.match(boot, /Boot<br>Panorama/);
  assert.match(boot, /providerCalls 0/);
  assert.doesNotMatch(boot, /<script/i);
  const unite = readFileSync(join(dir, "vibers-unite-room.html"), "utf8");
  assert.match(unite, /Vibers<br>Unite<br>Room/);
  assert.match(unite, /Official GitHub colors: #161b22 #0e4429 #006d32 #26a641 #39d353/);
  assert.match(unite, /trust delta \+0 score/);
  assert.doesNotMatch(unite, /<script/i);
  assert.doesNotMatch(unite, /https?:\/\//i);
  const oss = readFileSync(join(dir, "oss-motion-receipt.html"), "utf8");
  assert.match(oss, /OSS<br>Motion<br>Receipt/);
  assert.match(oss, /cli-spinners · Sindre Sorhus/);
  assert.match(oss, /ascii-globe · Jakub T\. Jankiewicz/);
  assert.match(oss, /drawille · Bence Danyi/);
  assert.doesNotMatch(oss, /<script/i);
  const motion = readFileSync(join(dir, "ascii-motion-lab.html"), "utf8");
  assert.match(motion, /ASCII<br>Motion<br>Lab/);
  assert.match(motion, /TerminalTextEffects \/ Notcurses \/ Chafa/);
  assert.doesNotMatch(motion, /<script/i);
  assert.doesNotMatch(motion, /https?:\/\//i);
  const trustHeatgrid = readFileSync(join(dir, "github-trust-heatgrid.html"), "utf8");
  assert.match(trustHeatgrid, /GitHub<br>Trust<br>Heatgrid/);
  assert.match(trustHeatgrid, /Official GitHub Contribution Scale Replay/);
  assert.match(trustHeatgrid, /NOT USAGE/);
  assert.match(trustHeatgrid, /#161b22 #0e4429 #006d32 #26a641 #39d353/);
  assert.doesNotMatch(trustHeatgrid, /<script/i);
  assert.doesNotMatch(trustHeatgrid, /https?:\/\//i);
  const scoreReactor = readFileSync(join(dir, "vibe-score-reactor.html"), "utf8");
  assert.match(scoreReactor, /Vibe<br>Score<br>Reactor/);
  assert.match(scoreReactor, /Datastream<br>Lineage/);
  assert.match(scoreReactor, /trust delta: \+0 score/i);
  assert.match(scoreReactor, /profile, heatgrid, and score share this stream/);
  assert.doesNotMatch(scoreReactor, /<script/i);
  assert.doesNotMatch(scoreReactor, /https?:\/\//i);
  const runway = readFileSync(join(dir, "wizard-runway.html"), "utf8");
  assert.match(runway, /Wizard<br>Runway/);
  assert.doesNotMatch(runway, /<script/i);
  const radar = readFileSync(join(dir, "local-ai-radar.html"), "utf8");
  assert.match(radar, /Local radar preview/);
  assert.match(radar, /detect --html/);
  assert.doesNotMatch(radar, /<script/i);
  const recorder = readFileSync(join(dir, "flight-recorder.html"), "utf8");
  assert.match(recorder, /Flight<br>Recorder/);
  assert.doesNotMatch(recorder, /<script/i);

  const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
  assert.equal(manifest.schema, "vibetracker.studio-pack/0.1");
  assert.equal(manifest.safePreview, true);
  assert.equal(manifest.files.length, 14);
});

test("studio command exposes machine-readable metadata without writing", () => {
  const result = run(["studio", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.schema, "vibetracker.studio-pack/0.1");
  assert.equal(payload.safePreview, true);
  assert.equal(payload.writes, false);
  assert.equal(payload.files.length, 14);
  assert.equal(payload.files.some((file: { path: string }) => file.path === "boot-panorama.html"), true);
  assert.equal(payload.files.some((file: { path: string }) => file.path === "vibers-unite-room.html"), true);
  assert.equal(payload.files.some((file: { path: string }) => file.path === "ascii-motion-lab.html"), true);
  assert.equal(payload.files.some((file: { path: string }) => file.path === "github-trust-heatgrid.html"), true);
  assert.equal(payload.files.some((file: { path: string }) => file.path === "vibe-score-reactor.html"), true);
  assert.equal(payload.files.some((file: { path: string }) => file.path === "oss-motion-receipt.html"), true);
  assert.equal(payload.files.some((file: { path: string }) => file.path === "flight-recorder.html"), true);
  assert.equal(payload.files.some((file: { path: string }) => file.path === "wizard-runway.html"), true);
  assert.equal(payload.files.some((file: { path: string }) => file.path === "local-ai-radar.html"), true);
});
