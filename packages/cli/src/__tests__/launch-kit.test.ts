import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLaunchKitFiles, launchKitManifest } from "../launch-kit.ts";

function run(args: string[]) {
  return spawnSync(process.execPath, ["bin/vibetracker.mjs", ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, VT_NO_SURPRISES: "1", VT_NO_ANIM: "1" },
  });
}

test("launch kit builds an offline end-to-end demo folder", () => {
  const files = buildLaunchKitFiles({
    providerIds: ["higgsfield", "codex-cli", "ollama"],
    generatedAt: "2026-07-06T00:00:00.000Z",
  });
  const paths = files.map((file) => file.path);

  assert.deepEqual(paths, [
    "index.html",
    "operator-show.html",
    "studio/index.html",
    "studio/boot-panorama.html",
    "studio/vibers-unite-room.html",
    "studio/showcase.html",
    "studio/surprise-reel.html",
    "studio/ascii-motion-lab.html",
    "studio/github-trust-heatgrid.html",
    "studio/vibe-score-reactor.html",
    "studio/oss-motion-receipt.html",
    "studio/flight-recorder.html",
    "studio/wizard-runway.html",
    "studio/local-ai-radar.html",
    "studio/command-cockpit.html",
    "studio/manifest.json",
    "receipt/sync-receipt.html",
    "receipt/sync-receipt.json",
    "receipts/index.html",
    "receipts/manifest.json",
    "share/vibetracker-badge.svg",
    "share/badge.md",
    "share/vibetracker-poster.svg",
    "share/poster.md",
    "README.md",
    "manifest.json",
  ]);
  for (const file of files.filter((item) => item.path.endsWith(".html"))) {
    assert.doesNotMatch(file.content, /<script/i, file.path);
    assert.doesNotMatch(file.content, /\bInter\b/, file.path);
  }
});

test("launch kit manifest is explicit about demo-only safety", () => {
  const files = buildLaunchKitFiles({ generatedAt: "2026-07-06T00:00:00.000Z" });
  const manifest = launchKitManifest(files, "2026-07-06T00:00:00.000Z");
  const builtManifest = JSON.parse(files.find((file) => file.path === "manifest.json")?.content ?? "{}");

  assert.equal(manifest.schema, "vibetracker.launch-kit/0.1");
  assert.equal(manifest.motto, "Vibers Unite // c0vibe.app");
  assert.equal(manifest.demoData, true);
  assert.equal(manifest.safety.providerCalls, false);
  assert.equal(manifest.safety.usageWrites, false);
  assert.equal(manifest.safety.uploads, false);
  assert.equal(manifest.safety.secretsRead, false);
  assert.equal(manifest.safety.promptsExported, false);
  assert.equal(manifest.safety.outputsExported, false);
  assert.equal(manifest.files.some((file) => file.path === "operator-show.html"), true);
  assert.equal(manifest.files.some((file) => file.path === "receipt/sync-receipt.json"), true);
  assert.equal(manifest.files.some((file) => file.path === "studio/boot-panorama.html"), true);
  assert.equal(manifest.files.some((file) => file.path === "studio/vibers-unite-room.html"), true);
  assert.equal(manifest.files.some((file) => file.path === "studio/ascii-motion-lab.html"), true);
  assert.equal(manifest.files.some((file) => file.path === "studio/github-trust-heatgrid.html"), true);
  assert.equal(manifest.files.some((file) => file.path === "studio/vibe-score-reactor.html"), true);
  assert.equal(manifest.files.some((file) => file.path === "studio/oss-motion-receipt.html"), true);
  assert.equal(manifest.files.some((file) => file.path === "studio/flight-recorder.html"), true);
  assert.equal(manifest.files.some((file) => file.path === "studio/wizard-runway.html"), true);
  assert.equal(manifest.files.some((file) => file.path === "studio/local-ai-radar.html"), true);
  assert.equal(manifest.files.some((file) => file.path === "share/vibetracker-badge.svg"), true);
  assert.equal(manifest.files.some((file) => file.path === "share/badge.md"), true);
  assert.equal(manifest.files.some((file) => file.path === "share/vibetracker-poster.svg"), true);
  assert.equal(manifest.files.some((file) => file.path === "share/poster.md"), true);
  assert.equal(builtManifest.demoReceipt.path, "receipt/sync-receipt.json");
  assert.equal(builtManifest.demoReceipt.fingerprint.algorithm, "sha256");
  assert.match(builtManifest.demoReceipt.fingerprint.value, /^[a-f0-9]{64}$/);
  assert.equal(builtManifest.demoReceipt.safety.uploads, false);
});

test("launch kit index links the studio, receipt, vault, notes, and manifest", () => {
  const files = buildLaunchKitFiles({ generatedAt: "2026-07-06T00:00:00.000Z" });
  const index = files.find((file) => file.path === "index.html")?.content ?? "";

  assert.match(index, /VibeTRACKER Launch Kit/);
  assert.match(index, /VTK:\/\/LAUNCH-KIT\/\/OFFLINE-DEMO\/\/LOCAL-FIRST/);
  assert.match(index, /Vibers Unite/);
  assert.match(index, /href="operator-show\.html"/);
  assert.match(index, /Operator Show/);
  assert.match(index, /guided first-click show/);
  assert.match(index, /open operator-show\.html/);
  assert.match(index, /vibetracker impress --open\s+open Vibers Unite Room/);
  assert.match(index, /vibetracker vibe --json\s+print launch manifest/);
  assert.match(index, /href="studio\/index\.html"/);
  assert.match(index, /href="studio\/boot-panorama\.html"/);
  assert.match(index, /Boot Panorama/);
  assert.match(index, /first-open command room/);
  assert.match(index, /href="studio\/vibers-unite-room\.html"/);
  assert.match(index, /Vibers Unite Room/);
  assert.match(index, /terminal GUI wow room with provider orbit, trust heatgrid, score datastream, and C0VIBE publish hold/);
  assert.match(index, /href="studio\/oss-motion-receipt\.html"/);
  assert.match(index, /OSS Motion Receipt/);
  assert.match(index, /real cli-spinners, ascii-globe, and drawille frames with attribution/);
  assert.match(index, /open studio\/oss-motion\s+real OSS frame receipt/);
  assert.match(index, /open studio\/vibers-unite-room terminal GUI wow room/);
  assert.match(index, /href="studio\/flight-recorder\.html"/);
  assert.match(index, /Flight Recorder/);
  assert.match(index, /replayable surprise tape/);
  assert.match(index, /href="studio\/ascii-motion-lab\.html"/);
  assert.match(index, /ASCII Motion Lab/);
  assert.match(index, /research-backed terminal motion bench/);
  assert.match(index, /open studio\/ascii-motion-lab\s+credited motion bench/);
  assert.match(index, /href="studio\/github-trust-heatgrid\.html"/);
  assert.match(index, /GitHub Trust Heatgrid/);
  assert.match(index, /official GitHub color contribution replay/);
  assert.match(index, /open studio\/github-heatgrid\s+trust replay NOT USAGE/);
  assert.match(index, /href="studio\/vibe-score-reactor\.html"/);
  assert.match(index, /Vibe Score Reactor/);
  assert.match(index, /score, profile, heatgrid, and trust quarantine from one reviewed stream/);
  assert.match(index, /open studio\/score-reactor\s+score stream reactor/);
  assert.match(index, /href="studio\/wizard-runway\.html"/);
  assert.match(index, /Wizard Runway/);
  assert.match(index, /script-free first-run terminal-to-GUI scan room/);
  assert.match(index, /href="studio\/local-ai-radar\.html"/);
  assert.match(index, /Local AI Radar/);
  assert.match(index, /detect --html/);
  assert.match(index, /href="share\/vibetracker-badge\.svg"/);
  assert.match(index, /Demo Share Badge/);
  assert.match(index, /usage, trust heatgrid, and C0VIBE relay/);
  assert.match(index, /href="share\/badge\.md"/);
  assert.match(index, /Badge Markdown/);
  assert.match(index, /open share\/vibetracker-badge\s+demo share badge/);
  assert.match(index, /href="share\/vibetracker-poster\.svg"/);
  assert.match(index, /Vibers Unite Poster/);
  assert.match(index, /href="share\/poster\.md"/);
  assert.match(index, /Poster Markdown/);
  assert.match(index, /open share\/vibetracker-poster\s+release\/share poster/);
  assert.match(index, /href="receipt\/sync-receipt\.html"/);
  assert.match(index, /href="receipts\/index\.html"/);
  assert.match(index, /href="README\.md"/);
  assert.match(index, /href="manifest\.json"/);
  assert.match(index, /No provider calls/);
  assert.match(index, /VTK:\/\/OPERATOR-DOSSIER\/\/DEMO-SAFE/);
  assert.match(index, /Proof First/);
  assert.match(index, /VTK:\/\/FIRST-MINUTE-FLIGHT\/\/DEMO-TO-REAL/);
  assert.match(index, /First Minute Flight/);
  assert.match(index, /VTK:\/\/DEMO-RECEIPT-SEAL\/\/SHA256\/\/NO-UPLOAD/);
  assert.match(index, /demo fingerprint is visible before real sync/);
  assert.match(index, /vibetracker sync --receipt/);
  assert.match(index, /uploads NO \/\/ prompts NO \/\/ outputs NO \/\/ secrets NO/);
  assert.match(index, /VTK:\/\/SIGNAL-THEATRE\/\/CSS-ONLY\/\/NO-CALLS/);
  assert.match(index, /Signal<br>Theatre/);
  assert.match(index, /CSS-only provider orbit/);
  assert.match(index, /VTK:\/\/BOOT-SIGNAL\/\/VIBERS-UNITE\/\/C0VIBE\.APP/);
  assert.match(index, /SIGNAL THEATRE/);
  assert.match(index, /providerCalls\s+0/);
  assert.match(index, /ledgerWrites\s+0/);
  assert.match(index, /review before publish/);
  assert.match(index, /not usage, not score inflation/);
  assert.match(index, /provider calls <b>NO<\/b>/);
  assert.match(index, /usage writes <b>NO<\/b>/);
  assert.match(index, /prompt export <b>NO<\/b>/);
  assert.match(index, /00 WATCH/);
  assert.match(index, /01 OPEN/);
  assert.match(index, /02 VERIFY/);
  assert.match(index, /03 INSPECT/);
  assert.match(index, /04 RUN REAL/);
  assert.match(index, /demoData=true and every network\/write flag is false/);
  assert.doesNotMatch(index, /<script/i);
  assert.doesNotMatch(index, /https?:\/\//i);
});

test("launch kit operator show is branded, labelled, and script-free", () => {
  const files = buildLaunchKitFiles({
    providerIds: ["higgsfield", "codex-cli", "ollama", "qwen"],
    generatedAt: "2026-07-06T00:00:00.000Z",
  });
  const show = files.find((file) => file.path === "operator-show.html")?.content ?? "";

  assert.match(show, /VibeTRACKER Operator Show/);
  assert.match(show, /VTK:\/\/OPERATOR-SHOW\/\/OFFLINE\/\/NO-SIDE-EFFECTS/);
  assert.match(show, /Operator<br>Show/);
  assert.match(show, /Vibers Unite/);
  assert.match(show, /C0VIBE\.APP/);
  assert.match(show, /providerCalls=0 ledgerWrites=0 uploads=0 secretsRead=0/);
  assert.match(show, /promptReads=0 outputReads=0 hiddenNetwork=0 confetti=0/);
  assert.match(show, /VTK:\/\/OPERATOR-FLIGHT-DECK\/\/CSS-ONLY\/\/ZERO-SIDE-EFFECTS/);
  assert.match(show, /Operator<br>Flight Deck/);
  assert.match(show, /CSS-only provider flywheel/);
  assert.match(show, /OPERATOR FLIGHT DECK/);
  assert.match(show, /providerCalls 0\s+ledgerWrites 0\s+uploads 0/);
  assert.match(show, /no provider calls, no usage writes, no uploads/);
  assert.match(show, /C0VIBE relay only after review/);
  assert.match(show, /VTK:\/\/SURPRISE-ENCORE-TAPE\/\/ASCII\/\/ZERO-SIDEFX/);
  assert.match(show, /Encore<br>Tape/);
  assert.match(show, /SURPRISE ENCORE TAPE/);
  assert.match(show, /Codex cube tilt/);
  assert.match(show, /Higgsfield prism turn/);
  assert.match(show, /Local AI sonar bloom/);
  assert.match(show, /World source map snap/);
  assert.match(show, /Receipt lock/);
  assert.match(show, /Vibers Unite relay flash/);
  assert.match(show, /vibetracker trust higgsfield --mcp/);
  assert.match(show, /vibetracker scan local-ai --dry-run/);
  assert.match(show, /vibetracker profile --relay c0vibe\.app/);
  assert.match(show, /provider calls=0/);
  assert.match(show, /hidden uploads=0/);
  assert.match(show, /sidefx=0/);
  assert.match(show, /USAGE ONLY/);
  assert.match(show, /NOT USAGE/);
  assert.match(show, /Usage Datastream/);
  assert.match(show, /Trust Side Rail/);
  assert.match(show, /Local AI Proof/);
  assert.match(show, /Receipt Boundary/);
  assert.match(show, /C0VIBE Relay/);
  assert.match(show, /HF/);
  assert.match(show, /CX/);
  assert.match(show, /OL/);
  assert.match(show, /QW/);
  assert.match(show, /Static, script-free, offline/);
  assert.doesNotMatch(show, /<script/i);
  assert.doesNotMatch(show, /https?:\/\//i);
});

test("launch kit wizard runway is a script-free labelled surprise control room", () => {
  const files = buildLaunchKitFiles({
    providerIds: ["higgsfield", "codex-cli", "ollama"],
    generatedAt: "2026-07-06T00:00:00.000Z",
  });
  const runway = files.find((file) => file.path === "studio/wizard-runway.html")?.content ?? "";

  assert.match(runway, /VTK:\/\/WIZARD-RUNWAY\/\/TERMINAL-GUI\/\/VIBERS-UNITE/);
  assert.match(runway, /VTK:\/\/WIZARD-RUNWAY\/\/OFFLINE\/\/NO-PROVIDER-CALLS/);
  assert.match(runway, /Wizard<br>Runway/);
  assert.match(runway, /CSS-only scan surprise relay/);
  assert.match(runway, /surprise-deck/);
  assert.match(runway, /surprise relay: providerCalls=0 ledgerWrites=0 hiddenUploads=0/);
  assert.match(runway, /Higgsfield logo turn/);
  assert.match(runway, /Codex cube sidecar/);
  assert.match(runway, /Local model sonar/);
  assert.match(runway, /C0VIBE relay flash/);
  assert.match(runway, /visual feedback only; providerCalls=0/);
  assert.match(runway, /NOT USAGE; ledgerWrites=0/);
  assert.match(runway, /hiddenUploads=0; review before relay/);
  assert.match(runway, /Vibers Unite appears after dry-run review and redaction/);
  assert.match(runway, /@keyframes reel/);
  assert.match(runway, /Higgsfield prism/);
  assert.match(runway, /Codex trust cube/);
  assert.match(runway, /Local AI sonar/);
  assert.match(runway, /Creator API sweep/);
  assert.match(runway, /Regional adapter pass/);
  assert.match(runway, /C0VIBE relay/);
  assert.match(runway, /NOT USAGE, no spend, no rank inflation/);
  assert.match(runway, /dry-run before c0vibe\.app <b>YES<\/b>/);
  assert.match(runway, /provider calls <b>NO<\/b>/);
  assert.match(runway, /demo usage writes <b>NO<\/b>/);
  assert.match(runway, /trust affects spend <b>NO<\/b>/);
  assert.match(runway, /npx vibetrack init --gui/);
  assert.match(runway, /vibetracker upload --dry-run/);
  assert.doesNotMatch(runway, /<script/i);
  assert.doesNotMatch(runway, /https?:\/\//i);
});

test("launch-kit command writes all offline files", () => {
  const dir = mkdtempSync(join(tmpdir(), "vibetracker-launch-kit-"));
  const result = run(["launch-kit", "--provider", "higgsfield,codex-cli,ollama", "--out", dir]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /launch kit/);
  assert.match(result.stdout, /offline demo pack/);
  assert.doesNotMatch(result.stdout, /VTK:\/\/IMPRESS/);
  assert.match(result.stdout, /open:/);
  assert.match(result.stdout, /index\.html/);
  assert.match(result.stdout, /open target:/);
  assert.match(result.stdout, /vibetracker-launch-kit-[^\\s]+\/index\.html/);
  assert.match(result.stdout, /show:/);
  assert.match(result.stdout, /operator-show\.html/);
  assert.match(result.stdout, /unite room:/);
  assert.match(result.stdout, /studio\/vibers-unite-room\.html/);
  assert.match(result.stdout, /motion lab:/);
  assert.match(result.stdout, /studio\/ascii-motion-lab\.html/);
  assert.match(result.stdout, /trust heatgrid:/);
  assert.match(result.stdout, /studio\/github-trust-heatgrid\.html/);
  assert.match(result.stdout, /score reactor:/);
  assert.match(result.stdout, /studio\/vibe-score-reactor\.html/);
  assert.match(result.stdout, /oss frames:/);
  assert.match(result.stdout, /studio\/oss-motion-receipt\.html/);
  assert.match(result.stdout, /local radar:/);
  assert.match(result.stdout, /studio\/local-ai-radar\.html/);
  assert.match(result.stdout, /share badge:/);
  assert.match(result.stdout, /share\/vibetracker-badge\.svg/);
  assert.match(result.stdout, /badge markdown:/);
  assert.match(result.stdout, /share\/badge\.md/);
  assert.match(result.stdout, /share poster:/);
  assert.match(result.stdout, /share\/vibetracker-poster\.svg/);
  assert.match(result.stdout, /poster markdown:/);
  assert.match(result.stdout, /share\/poster\.md/);
  assert.match(result.stdout, /receipt:/);
  assert.match(result.stdout, /receipt\/sync-receipt\.html/);
  assert.match(result.stdout, /manifest:/);
  assert.match(result.stdout, /manifest\.json/);
  assert.match(result.stdout, /real path:/);
  assert.match(result.stdout, /vibetracker sync --receipt --out ~\/\.vibetracker\/receipts\/<run>/);
  for (const file of [
    "index.html",
    "operator-show.html",
    "studio/index.html",
    "studio/boot-panorama.html",
    "studio/vibers-unite-room.html",
    "studio/ascii-motion-lab.html",
    "studio/github-trust-heatgrid.html",
    "studio/vibe-score-reactor.html",
    "studio/oss-motion-receipt.html",
    "studio/flight-recorder.html",
    "studio/wizard-runway.html",
    "studio/local-ai-radar.html",
    "share/vibetracker-badge.svg",
    "share/badge.md",
    "share/vibetracker-poster.svg",
    "share/poster.md",
    "receipt/sync-receipt.html",
    "receipt/sync-receipt.json",
    "receipts/index.html",
    "manifest.json",
    "README.md",
  ]) {
    assert.equal(existsSync(join(dir, file)), true, file);
  }
  const index = readFileSync(join(dir, "index.html"), "utf8");
  assert.match(index, /Launch<br>Kit/);
  assert.match(index, /vibetracker impress --open/);
  assert.match(index, /vibetracker vibe --json/);
  assert.match(index, /operator-show\.html/);
  assert.match(index, /studio\/boot-panorama/);
  assert.match(index, /studio\/vibers-unite-room/);
  assert.match(index, /studio\/ascii-motion-lab/);
  assert.match(index, /studio\/github-trust-heatgrid/);
  assert.match(index, /studio\/vibe-score-reactor/);
  assert.match(index, /studio\/oss-motion/);
  assert.match(index, /studio\/local-ai-radar/);
  assert.match(index, /share\/vibetracker-badge/);
  assert.match(index, /share\/vibetracker-poster/);
  assert.match(index, /VTK:\/\/OPERATOR-DOSSIER\/\/DEMO-SAFE/);
  assert.doesNotMatch(index, /<script/i);
  const show = readFileSync(join(dir, "operator-show.html"), "utf8");
  assert.match(show, /Operator<br>Show/);
  assert.match(show, /Encore<br>Tape/);
  assert.match(show, /SURPRISE ENCORE TAPE/);
  assert.match(show, /Higgsfield prism turn/);
  assert.match(show, /Vibers Unite relay flash/);
  assert.match(show, /providerCalls=0/);
  assert.match(show, /USAGE ONLY/);
  assert.match(show, /NOT USAGE/);
  assert.doesNotMatch(show, /<script/i);
  const boot = readFileSync(join(dir, "studio", "boot-panorama.html"), "utf8");
  assert.match(boot, /Boot<br>Panorama/);
  assert.match(boot, /providerCalls 0/);
  assert.match(boot, /NOT USAGE/);
  assert.doesNotMatch(boot, /<script/i);
  const unite = readFileSync(join(dir, "studio", "vibers-unite-room.html"), "utf8");
  assert.match(unite, /Vibers<br>Unite<br>Room/);
  assert.match(unite, /Higgsfield prism/);
  assert.match(unite, /Codex cube/);
  assert.match(unite, /Official GitHub colors: #161b22 #0e4429 #006d32 #26a641 #39d353/);
  assert.match(unite, /trust delta \+0 score/);
  assert.match(unite, /providerCalls=0 usageWrites=0 uploads=0 secretsRead=0/);
  assert.doesNotMatch(unite, /<script/i);
  assert.doesNotMatch(unite, /https?:\/\//i);
  const oss = readFileSync(join(dir, "studio", "oss-motion-receipt.html"), "utf8");
  assert.match(oss, /OSS<br>Motion<br>Receipt/);
  assert.match(oss, /cli-spinners · Sindre Sorhus/);
  assert.match(oss, /ascii-globe · Jakub T\. Jankiewicz/);
  assert.match(oss, /drawille · Bence Danyi/);
  assert.match(oss, /providerCalls <b>NO<\/b>/);
  assert.doesNotMatch(oss, /<script/i);
  const motion = readFileSync(join(dir, "studio", "ascii-motion-lab.html"), "utf8");
  assert.match(motion, /ASCII<br>Motion<br>Lab/);
  assert.match(motion, /Codex diff cube/);
  assert.match(motion, /Higgsfield prism/);
  assert.match(motion, /TerminalTextEffects \/ Notcurses \/ Chafa/);
  assert.match(motion, /GPL references are not bundled/);
  assert.doesNotMatch(motion, /<script/i);
  assert.doesNotMatch(motion, /https?:\/\//i);
  const trustHeatgrid = readFileSync(join(dir, "studio", "github-trust-heatgrid.html"), "utf8");
  assert.match(trustHeatgrid, /GitHub<br>Trust<br>Heatgrid/);
  assert.match(trustHeatgrid, /Official GitHub Contribution Scale Replay/);
  assert.match(trustHeatgrid, /NOT USAGE/);
  assert.match(trustHeatgrid, /#161b22 #0e4429 #006d32 #26a641 #39d353/);
  assert.match(trustHeatgrid, /This cannot change spend, credits, rank, usage heatgrid, or vibe score/);
  assert.doesNotMatch(trustHeatgrid, /<script/i);
  assert.doesNotMatch(trustHeatgrid, /https?:\/\//i);
  const scoreReactor = readFileSync(join(dir, "studio", "vibe-score-reactor.html"), "utf8");
  assert.match(scoreReactor, /Vibe<br>Score<br>Reactor/);
  assert.match(scoreReactor, /Datastream<br>Lineage/);
  assert.match(scoreReactor, /Score<br>Mixer/);
  assert.match(scoreReactor, /Calibration<br>Chamber/);
  assert.match(scoreReactor, /trust delta: \+0 score/i);
  assert.match(scoreReactor, /usageWrites 0/);
  assert.match(scoreReactor, /publicWrites 0/);
  assert.doesNotMatch(scoreReactor, /<script/i);
  assert.doesNotMatch(scoreReactor, /https?:\/\//i);
  const runway = readFileSync(join(dir, "studio", "wizard-runway.html"), "utf8");
  assert.match(runway, /Wizard<br>Runway/);
  assert.match(runway, /Vibers Unite/);
  assert.doesNotMatch(runway, /<script/i);
  const radar = readFileSync(join(dir, "studio", "local-ai-radar.html"), "utf8");
  assert.match(radar, /Local radar preview/);
  assert.match(radar, /detect --html/);
  assert.doesNotMatch(radar, /<script/i);
  const recorder = readFileSync(join(dir, "studio", "flight-recorder.html"), "utf8");
  assert.match(recorder, /Flight<br>Recorder/);
  assert.match(recorder, /SURPRISE-FLIGHT-RECORDER/);
  assert.doesNotMatch(recorder, /<script/i);
  const receipt = JSON.parse(readFileSync(join(dir, "receipt", "sync-receipt.json"), "utf8"));
  assert.equal(receipt.demo, true);
  assert.equal(receipt.safety.uploads, false);
  const badge = readFileSync(join(dir, "share", "vibetracker-badge.svg"), "utf8");
  assert.match(badge, /^<svg /);
  assert.match(badge, /VTK:\/\/SHARE-BADGE\/\/LOCAL-FIRST\/\/VIBERS-UNITE/);
  assert.match(badge, /@demo-viber/);
  assert.match(badge, /Provider brand rail/);
  assert.match(badge, /Trust rail · NOT USAGE/);
  assert.match(badge, /GitHub trust heatgrid - NOT USAGE/);
  assert.match(badge, /Official GitHub contribution color legend/);
  assert.match(badge, /VTK:\/\/BADGE-RECEIPT\/\/NO-PROMPTS\/\/NO-OUTPUTS\/\/TRUST-NOT-USAGE\/\/VIBERS-UNITE/);
  assert.match(badge, /c0vibe\.app/);
  assert.doesNotMatch(badge, /<script/i);
  const badgeMarkdown = readFileSync(join(dir, "share", "badge.md"), "utf8");
  assert.equal(badgeMarkdown, "[![VibeTRACKER local AI usage badge](./vibetracker-badge.svg)](https://c0vibe.app/u/demo-viber)\n");
  const poster = readFileSync(join(dir, "share", "vibetracker-poster.svg"), "utf8");
  assert.match(poster, /^<svg /);
  assert.match(poster, /VTK:\/\/SHARE-POSTER\/\/VIBERS-UNITE\/\/C0VIBE\.APP\/\/LOCAL-FIRST/);
  assert.match(poster, /Provider brand rail/);
  assert.match(poster, /Official GitHub contribution color legend/);
  assert.match(poster, /Trust is quarantined/);
  assert.match(poster, /VTK:\/\/POSTER-RECEIPT\/\/NO-PROMPTS\/\/NO-OUTPUTS\/\/NO-SECRETS\/\/TRUST-NOT-USAGE/);
  assert.match(poster, /Vibers Unite/);
  assert.doesNotMatch(poster, /<script/i);
  const posterExternalUrls = Array.from(poster.matchAll(/https?:\/\/[^"'\s<>]+/gi), (match) => match[0])
    .filter((url) => url !== "http://www.w3.org/2000/svg");
  assert.deepEqual(posterExternalUrls, []);
  const posterMarkdown = readFileSync(join(dir, "share", "poster.md"), "utf8");
  assert.equal(posterMarkdown, "[![VibeTRACKER Vibers Unite poster](./vibetracker-poster.svg)](https://c0vibe.app/u/demo-viber)\n");
  const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
  assert.equal(manifest.demoReceipt.id, receipt.id);
  assert.equal(manifest.demoReceipt.fingerprint.value, receipt.fingerprint.value);
  const notes = readFileSync(join(dir, "README.md"), "utf8");
  assert.match(notes, /Impress commands/);
  assert.match(notes, /vibetracker impress --open/);
  assert.match(notes, /vibetracker vibe --json/);
  assert.match(notes, /impress --open` opens the Vibers Unite Room first/);
  assert.match(notes, /Demo share badge/);
  assert.match(notes, /share\/vibetracker-badge\.svg/);
  assert.match(notes, /trust heatgrid cells stay labelled not usage/);
  assert.match(notes, /Demo share poster/);
  assert.match(notes, /share\/vibetracker-poster\.svg/);
  assert.match(notes, /larger release\/social card/);
});

test("wow, impress, and vibe open targets prefer the Vibers Unite Room", () => {
  for (const alias of ["wow", "impress", "vibe"]) {
    const dir = mkdtempSync(join(tmpdir(), `vibetracker-${alias}-`));
    const result = run([alias, "--provider", "higgsfield,codex-cli,ollama", "--out", dir]);

    assert.equal(result.status, 0, `${alias}: ${result.stderr}`);
    assert.match(result.stdout, /VTK:\/\/IMPRESS\/\/VIBERS-UNITE\/\/C0VIBE\.APP\/\/ZERO-SIDEFX/, alias);
    assert.match(result.stdout, /VIBERS UNITE ROOM/, alias);
    assert.match(result.stdout, /HF.*prism/, alias);
    assert.match(result.stdout, /CX.*cube/, alias);
    assert.match(result.stdout, /GH.*official heatgrid/, alias);
    assert.match(result.stdout, /C0.*relay hold/, alias);
    assert.match(result.stdout, /providerCalls=0\s+usageWrites=0\s+uploads=0\s+secretsRead=0/, alias);
    assert.match(result.stdout, /trust stays NOT USAGE \/\/ score delta \+0 \/\/ no hidden network/, alias);
    assert.match(result.stdout, /launch kit ->/, alias);
    assert.match(result.stdout, /open:/, alias);
    assert.match(result.stdout, /open target:/, alias);
    assert.match(result.stdout, /studio\/vibers-unite-room\.html/, alias);
    assert.equal(existsSync(join(dir, "studio", "vibers-unite-room.html")), true, alias);
  }
});

test("plain impress output skips the terminal launch receipt", () => {
  const dir = mkdtempSync(join(tmpdir(), "vibetracker-impress-plain-"));
  const result = run(["impress", "--plain", "--out", dir]);

  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stdout, /VTK:\/\/IMPRESS/);
  assert.match(result.stdout, /open target:/);
  assert.match(result.stdout, /studio\/vibers-unite-room\.html/);
});

test("wow, impress, and vibe aliases expose machine-readable launch kit metadata", () => {
  const help = run(["help"]);

  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /launch-kit \| kit \| wow \| impress \| vibe/);

  for (const alias of ["wow", "impress", "vibe"]) {
    const result = run([alias, "--json"]);

    assert.equal(result.status, 0, `${alias}: ${result.stderr}`);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.schema, "vibetracker.launch-kit/0.1", alias);
    assert.equal(payload.demoData, true, alias);
    assert.equal(payload.safety.providerCalls, false, alias);
    assert.equal(payload.demoReceipt.path, "receipt/sync-receipt.json", alias);
    assert.match(payload.demoReceipt.fingerprint.value, /^[a-f0-9]{64}$/, alias);
    assert.equal(payload.files.some((file: { path: string }) => file.path === "operator-show.html"), true, alias);
    assert.equal(payload.files.some((file: { path: string }) => file.path === "studio/boot-panorama.html"), true, alias);
    assert.equal(payload.files.some((file: { path: string }) => file.path === "studio/vibers-unite-room.html"), true, alias);
    assert.equal(payload.files.some((file: { path: string }) => file.path === "studio/ascii-motion-lab.html"), true, alias);
    assert.equal(payload.files.some((file: { path: string }) => file.path === "studio/github-trust-heatgrid.html"), true, alias);
    assert.equal(payload.files.some((file: { path: string }) => file.path === "studio/vibe-score-reactor.html"), true, alias);
    assert.equal(payload.files.some((file: { path: string }) => file.path === "studio/oss-motion-receipt.html"), true, alias);
    assert.equal(payload.files.some((file: { path: string }) => file.path === "studio/flight-recorder.html"), true, alias);
    assert.equal(payload.files.some((file: { path: string }) => file.path === "studio/wizard-runway.html"), true, alias);
    assert.equal(payload.files.some((file: { path: string }) => file.path === "studio/local-ai-radar.html"), true, alias);
    assert.equal(payload.files.some((file: { path: string }) => file.path === "share/vibetracker-badge.svg"), true, alias);
    assert.equal(payload.files.some((file: { path: string }) => file.path === "share/badge.md"), true, alias);
    assert.equal(payload.files.some((file: { path: string }) => file.path === "share/vibetracker-poster.svg"), true, alias);
    assert.equal(payload.files.some((file: { path: string }) => file.path === "share/poster.md"), true, alias);
    assert.equal(payload.files.some((file: { path: string }) => file.path === "receipts/index.html"), true, alias);
  }
});
