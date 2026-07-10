import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildSurpriseFlightRecorder,
  defaultSyncSurpriseDirectorProviders,
  renderCollectionCascade,
  planSyncSurprises,
  renderCollectionEncoreRecap,
  renderCollectionCheckpoint,
  renderProviderScanBeat,
  renderSurpriseFlightRecorder,
  renderSurpriseFlightRecorderHtml,
  renderSyncIgnitionBanner,
  renderSyncSurpriseDirectorHtml,
  renderSyncSurpriseDirectorPreview,
  renderSignatureReveal,
  renderSyncSurpriseItinerary,
  renderSyncSurpriseQueue,
  shouldShowSyncSurprises,
  showCollectionCascade,
  showCollectionEncoreRecap,
  showProviderScanBeat,
  showSyncSurpriseQueue,
} from "../sync-surprises.ts";

test("sync surprise queue selects provider-specific moments and C0VIBE relay", () => {
  const panels = renderSyncSurpriseQueue(["higgsfield", "claude-code", "ollama", "replicate"]).join("\n");

  assert.match(panels, /VTK:\/\/SCAN-IGNITION\/\/TERMINAL\/\/VIBERS-UNITE/);
  assert.match(panels, /first impression: live scanner, then GUI handoff/);
  assert.match(panels, /wake: terminal -> adapters -> ledger -> C0/);
  assert.match(panels, /provider marks HF CX OL C0/);
  assert.match(panels, /rails USAGE:1 NOT USAGE:1 LOCAL:1 PUBLISH:1/);
  assert.match(panels, /USAGE ONLY cells light from accepted records/);
  assert.match(panels, /trust side rails stay NOT USAGE/);
  assert.match(panels, /promptExport=0 outputExport=0 secretValuesRecorded=0/);
  assert.match(panels, /hiddenUpload=0; publish waits for review/);
  assert.match(panels, /animation is visual-only; records decide totals/);
  assert.match(panels, /VTK:\/\/SURPRISE-ITINERARY\/\/QUEUE-SCAN-CHECK-RECAP/);
  assert.match(panels, /4 hooks fire: queue -> scan -> checkpoint -> recap/);
  assert.match(panels, /01 queue: branded ASCII mark wakes before collection/);
  assert.match(panels, /02 scan: turntable rotates during provider fetch/);
  assert.match(panels, /03 checkpoint: receipt appears after validation only/);
  assert.match(panels, /04 recap: marks replay with no extra ledger writes/);
  assert.match(panels, /signals: USAGE \/ NOT USAGE \/ LOCAL \/ PUBLISH/);
  assert.match(panels, /no raw prompts, outputs, secrets, or fake spend/);
  assert.match(panels, /VTRK:\/\/SYNC-SURPRISE/);
  assert.match(panels, /HIGGSFIELD TURN/);
  assert.match(panels, /HF MCP/);
  assert.match(panels, /CODEX TRACE/);
  assert.match(panels, /surprise cadence 1\/3 queue, 2\/3 scan, 3\/3 check/);
  assert.match(panels, /queue surprise opens before data collection starts/);
  assert.match(panels, /logo turntable: provider ASCII mark rotates/);
  assert.match(panels, /motion strip: rotating ASCII signal/);
  assert.match(panels, /VTK:\/\/SIGNATURE-REVEAL\/\/01\/03 QUEUE\/\/HF/);
  assert.match(panels, /surprise stack: blink -> turn -> sparkle -> unite/);
  assert.match(panels, /hidden motto flash: Vibers Unite · C0VIBE\.APP/);
  assert.match(panels, /Higgsfield visual only; accepted rows decide usage/);
  assert.match(panels, /micro-surprises: wake -> turn -> spark -> seal/);
  assert.match(panels, /micro 1\/4 wake/);
  assert.match(panels, /micro 4\/4 seal/);
  assert.match(panels, /drawille braille signal field/);
  assert.match(panels, /\.HF\./);
  assert.match(panels, /prism/);
  assert.match(panels, /\+----\+/);
  assert.match(panels, /--HF--/);
  assert.match(panels, /<diff>/);
  assert.match(panels, /LOCAL MODEL SONAR/);
  assert.match(panels, /C0VIBE RELAY/);
  assert.match(panels, /Vibers Unite/);
  assert.match(panels, /c0vibe\.app/);
  assert.match(panels, /cli-spinners \+ ascii-globe \+ drawille/);
  assert.match(panels, /braille .*[⠀-⣿]/u);
});

test("sync ignition banner opens the terminal scanner without fake usage", () => {
  const text = renderSyncIgnitionBanner(["higgsfield", "codex-cli", "ollama", "replicate"]);

  assert.match(text, /VTK:\/\/SCAN-IGNITION\/\/TERMINAL\/\/VIBERS-UNITE/);
  assert.match(text, /provider marks HF CX OL C0/);
  assert.match(text, /rails USAGE:1 NOT USAGE:1 LOCAL:1 PUBLISH:1/);
  assert.match(text, /impact labels visible before collection starts/);
  assert.match(text, /USAGE ONLY cells light from accepted records/);
  assert.match(text, /trust side rails stay NOT USAGE/);
  assert.match(text, /promptExport=0 outputExport=0 secretValuesRecorded=0/);
  assert.match(text, /hiddenUpload=0; publish waits for review/);
  assert.match(text, /animation is visual-only; records decide totals/);
  assert.match(text, /Vibers Unite \/\/ c0vibe\.app/);
});

test("sync surprise itinerary previews staged encores and labelled rails", () => {
  const text = renderSyncSurpriseItinerary(["higgsfield", "github-cli", "ollama", "replicate"]);

  assert.match(text, /4 surprise panel\(s\) armed before collection/);
  assert.match(text, /\[HF\] HF MCP USAGE\s+HIGGSFIELD TURN/);
  assert.match(text, /\[CX\] CX CLI NOT USAGE CODEX TRACE/);
  assert.match(text, /\[OL\] LOCAL LOCAL\s+LOCAL MODEL SONAR/);
  assert.match(text, /\[C0\] UNITE PUBLISH\s+C0VIBE RELAY/);
  assert.match(text, /Vibers Unite \/\/ c0vibe\.app/);
});

test("sync surprise planning treats GitHub and provider CLI signals as Codex evidence", () => {
  const panels = renderSyncSurpriseQueue(["github-cli", "higgsfield-mcp"]).join("\n");

  assert.match(panels, /HIGGSFIELD TURN/);
  assert.match(panels, /CODEX TRACE/);
  assert.match(panels, /trust signal · NOT USAGE · never spend/);
  assert.match(panels, /coding-agent evidence stays labelled as trust signal/);
});

test("surprise director preview packages several safe scan moments", () => {
  const text = renderSyncSurpriseDirectorPreview(["higgsfield", "codex-cli", "ollama", "replicate"]);

  assert.match(text, /VTK:\/\/SURPRISE-DIRECTOR\/\/SAFE-PREVIEW\/\/VIBERS-UNITE/);
  assert.match(text, /safe preview: no provider calls, writes, or uploads/);
  assert.match(text, /no secret reads; no local records are changed/);
  assert.match(text, /moments: HF logo turn, CX cube, LAN sonar, C0 relay/);
  assert.match(text, /HIGGSFIELD TURN/);
  assert.match(text, /CODEX TRUST CUBE/);
  assert.match(text, /LOCAL LAB RADAR/);
  assert.match(text, /CREATOR RUN METER/);
  assert.match(text, /COLLECTION-ENCORE\/\/RECAP\/\/SAFE-PREVIEW/);
  assert.match(text, /COLLECTION-CASCADE\/\/SCAN-COLLECT\/\/SAFE-PREVIEW/);
  assert.match(text, /SURPRISE-FLIGHT-RECORDER\/\/SAFE-PREVIEW/);
  assert.match(text, /event log only; no usage writes/);
  assert.match(text, /visual feedback only; records decide usage totals/);
  assert.match(text, /Vibers Unite \/\/ c0vibe\.app/);
});

test("surprise director html is static, branded, and script-free", () => {
  const html = renderSyncSurpriseDirectorHtml(["higgsfield", "codex-cli", "ollama"]);

  assert.match(html, /<!doctype html>/);
  assert.match(html, /VibeTRACKER Surprise Reel/);
  assert.match(html, /VTK:\/\/SURPRISE-REEL\/\/STATIC-GUI\/\/SAFE-PREVIEW/);
  assert.match(html, /Vibers<br>Unite/);
  assert.match(html, /HIGGSFIELD TURN/);
  assert.match(html, /CODEX TRUST CUBE/);
  assert.match(html, /LOCAL LAB RADAR/);
  assert.match(html, /VTK:\/\/SCAN-RUNWAY\/\/PROVIDER-ARRIVALS\/\/NO-FAKE-SPEND/);
  assert.match(html, /Provider Arrival Runway/);
  assert.match(html, /branded landing pulse before proof/);
  assert.match(html, /visual feedback only; accepted records, trust labels, and review gates decide what counts/);
  assert.match(html, /01 HF\s+USAGE\s+Higgsfield/);
  assert.match(html, /02 CX\s+NOT USAGE\s+Codex CLI/);
  assert.match(html, /03 OL\s+LOCAL\s+Ollama/);
  assert.match(html, /VTK:\/\/SCAN-DIRECTOR\/\/SCRIPT-FREE/);
  assert.match(html, /Scan Director/);
  assert.match(html, /Queue -> scan -> checkpoint -> recap/);
  assert.match(html, /usage, trust, local, and publish rails stay labelled/);
  assert.match(html, /Wake The Marks/);
  assert.match(html, /Turn During Fetch/);
  assert.match(html, /Seal After Validation/);
  assert.match(html, /Relay Without Extra Rows/);
  assert.match(html, /recap replays proof with no additional ledger writes/);
  assert.match(html, /trust stays NOT USAGE/);
  assert.match(html, /Flight Recorder/);
  assert.match(html, /SURPRISE-FLIGHT-RECORDER\/\/STATIC-GUI/);
  assert.match(html, /Every event is marked visual-only/);
  assert.match(html, /usageWrites=false/);
  assert.match(html, /Static file; no JavaScript/);
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /https?:\/\//i);
});

test("surprise director defaults cover creator, builder, local, regional, and relay rails", () => {
  assert.deepEqual(defaultSyncSurpriseDirectorProviders(), [
    "higgsfield",
    "codex-cli",
    "ollama",
    "replicate",
    "qwen",
    "c0vibe",
  ]);
});

test("collection checkpoints show real provider collection state", () => {
  const text = renderCollectionCheckpoint({
    providerId: "higgsfield",
    label: "Higgsfield",
    status: "new",
    received: 5,
    accepted: 4,
    fresh: 3,
    duplicate: 1,
    usd: 0.42,
    sourceMix: [
      { source: "ledger", count: 2 },
      { source: "feed_recon", count: 1 },
    ],
    hint: "validated records appended to the local ledger",
  });

  assert.match(text, /VTK:\/\/COLLECT-CHECKPOINT\/\/HF\/\/higgsfield/);
  assert.match(text, /LOCK 3 new record\(s\)/);
  assert.match(text, /brand #ff4fd8->#7c5cff/);
  assert.match(text, /surprise hook 3\/4: checkpoint after validation/);
  assert.match(text, /received 5 · accepted 4 · duplicate 1/);
  assert.match(text, /fresh 3 · 0\.42 USD est\./);
  assert.match(text, /collection control tape/);
  assert.match(text, /control tape: scan -> fetch -> validate -> seal/);
  assert.match(text, /rail USAGE · LOCK · visual-only, no totals boost/);
  assert.match(text, /scan\s+HF USAGE/);
  assert.match(text, /fetch\s+seen 5/);
  assert.match(text, /validate\s+accepted 4\/5/);
  assert.match(text, /rejected 1/);
  assert.match(text, /seal\s+fresh 3/);
  assert.match(text, /dup 1/);
  assert.match(text, /no prompts, outputs, secrets, or unvalidated rows/);
  assert.match(text, /surprise tape is feedback; accepted rows decide/);
  assert.match(text, /ledger.+2.+█/);
  assert.match(text, /surprise checkpoint encore/);
  assert.match(text, /surprise encore lock: higgsfield mcp prism/);
  assert.match(text, /surprise 3\/3: checkpoint reveal after validation/);
  assert.match(text, /turntable.+--HF--/);
  assert.match(text, /micro 1\/4 receipt/);
  assert.match(text, /micro 2\/4 replay/);
  assert.match(text, /VTK:\/\/SIGNATURE-REVEAL\/\/03\/03 CHECKPOINT\/\/HF/);
  assert.match(text, /surprise 4\/4 ledger seal/);
  assert.match(text, /hidden motto flash: Vibers Unite · C0VIBE\.APP/);
  assert.match(text, /Vibers Unite \/\/ c0vibe\.app/);
  assert.match(text, /ledger rows decide truth/);
  assert.match(text, /validated records appended to the local ledger/);
});

test("collection encore recap closes the scan with replayed marks and no extra usage", () => {
  const text = renderCollectionEncoreRecap({
    label: "SYNC",
    checkpoints: [
      {
        providerId: "higgsfield",
        label: "Higgsfield",
        status: "new",
        received: 5,
        accepted: 4,
        fresh: 3,
        duplicate: 1,
        usd: 0.42,
        sourceMix: [{ source: "ledger", count: 3 }],
      },
      {
        providerId: "codex-cli",
        label: "Codex CLI",
        status: "up_to_date",
        received: 2,
        accepted: 2,
        fresh: 0,
        duplicate: 2,
        sourceMix: [{ source: "log", count: 2 }],
      },
      {
        providerId: "ollama",
        label: "Ollama",
        status: "new",
        received: 1,
        accepted: 1,
        fresh: 1,
        duplicate: 0,
        sourceMix: [{ source: "local", count: 1 }],
      },
      {
        providerId: "replicate",
        label: "Replicate",
        status: "error",
        received: 0,
        accepted: 0,
        fresh: 0,
        duplicate: 0,
        error: "needs a key",
      },
    ],
  });

  assert.match(text, /VTK:\/\/COLLECTION-ENCORE\/\/RECAP\/\/SYNC/);
  assert.match(text, /providers 4 · accepted 7 · fresh 4 · duplicate 3/);
  assert.match(text, /holds 1 · not-usage\/local rails 2/);
  assert.match(text, /surprises fired: queue -> scan -> check -> recap/);
  assert.match(text, /\[HF\] LOCK USAGE fresh 3\/4 \$0\.42/);
  assert.match(text, /\[CX\] CLEAR NOT USAGE fresh 0\/2/);
  assert.match(text, /\[OL\] LOCK LOCAL fresh 1\/1/);
  assert.match(text, /\[RP\] HOLD HOLD fresh 0\/0/);
  assert.match(text, /recap 1\/4 HF/);
  assert.match(text, /recap 2\/4 CX/);
  assert.match(text, /recap 3\/4 OL/);
  assert.match(text, /planned panels HF MCP \+ CX CLI \+ LOCAL \+ UNITE/);
  assert.match(text, /final relay waits for upload --dry-run review/);
  assert.match(text, /visual feedback only; no extra ledger rows/);
  assert.match(text, /Vibers Unite \/\/ c0vibe\.app/);
});

test("collection cascade renders repeated scan surprises without changing proof boundaries", () => {
  const text = renderCollectionCascade({
    providerIds: ["higgsfield", "codex-cli", "ollama", "replicate"],
    label: "SYNC",
  });

  assert.match(text, /VTK:\/\/COLLECTION-CASCADE\/\/SCAN-COLLECT\/\/SYNC/);
  assert.match(text, /surprise the user several times during collection/);
  assert.match(text, /HF logo turn -> Codex cube -> local sonar -> C0VIBE/);
  assert.match(text, /beats 16 · panels 4 · not-usage\/local 8 · publish 4/);
  assert.match(text, /NO PROMPTS \/ NO OUTPUTS \/ NO SECRET VALUES RECORDED/);
  assert.match(text, /visual feedback only; accepted rows decide truth/);
  assert.match(text, /cascade 01\/16 HF HF MCP USAGE/);
  assert.match(text, /cascade 05\/16 CX CX CLI NOT USAGE/);
  assert.match(text, /cascade 09\/16 OL LOCAL LOCAL/);
  assert.match(text, /cascade 16\/16 C0 UNITE PUBLISH/);
  assert.match(text, /Vibers Unite \/\/ c0vibe\.app/);
  assert.match(text, /terminal charm \/\/ local-first proof before upload/);
});

test("surprise flight recorder exposes replayable visual-only evidence", () => {
  const events = buildSurpriseFlightRecorder({
    providerIds: ["higgsfield", "codex-cli", "ollama", "replicate"],
    label: "SYNC",
  });

  assert.equal(events.length, 16);
  assert.deepEqual(events.slice(0, 4).map((event) => event.phase), ["queue", "scan", "checkpoint", "recap"]);
  assert.deepEqual(events.slice(0, 4).map((event) => event.mark), ["HF", "HF", "HF", "HF"]);
  assert.equal(events.every((event) => event.visualOnly), true);
  assert.equal(events.every((event) => event.usageWrites === false), true);
  assert.equal(events.every((event) => event.promptExport === false), true);
  assert.equal(events.every((event) => event.outputExport === false), true);
  assert.equal(events.every((event) => event.secretRead === false), true);

  const text = renderSurpriseFlightRecorder({
    providerIds: ["higgsfield", "codex-cli", "ollama", "replicate"],
    label: "SYNC",
  });

  assert.match(text, /VTK:\/\/SURPRISE-FLIGHT-RECORDER\/\/SYNC/);
  assert.match(text, /recorder [0-9a-f]+ · events 16/);
  assert.match(text, /rail counts USAGE 4 · NOT USAGE 4/);
  assert.match(text, /rail counts LOCAL 4 · PUBLISH 4/);
  assert.match(text, /captures show cues only; usage records stay separate/);
  assert.match(text, /event log only; no usage writes/);
  assert.match(text, /NO PROVIDER CALLS \/ NO WRITES/);
  assert.match(text, /NO PROMPTS \/ NO OUTPUTS/);
  assert.match(text, /NO SECRET VALUES \/ NO RANK INFLATION/);
  assert.match(text, /NO HIDDEN UPLOAD/);
  assert.match(text, /evt 01 QUEUE\s+HF USAGE\s+HIGGSFIELD TURN/);
  assert.match(text, /evt 05 QUEUE\s+CX NOT USAGE CODEX TRACE/);
  assert.match(text, /evt 09 QUEUE\s+OL LOCAL\s+LOCAL MODEL SONAR/);
  assert.match(text, /evt 16 RECAP\s+C0 PUBLISH\s+C0VIBE RELAY/);
  assert.match(text, /each event is visualOnly=true and usageWrites=false/);
  assert.match(text, /Vibers Unite \/\/ c0vibe\.app/);
});

test("surprise flight recorder html is static and script-free", () => {
  const html = renderSurpriseFlightRecorderHtml(["higgsfield", "codex-cli", "ollama"]);

  assert.match(html, /<!doctype html>/);
  assert.match(html, /VibeTRACKER Surprise Flight Recorder/);
  assert.match(html, /VTK:\/\/SURPRISE-FLIGHT-RECORDER\/\/STATIC-GUI\/\/VIBERS-UNITE/);
  assert.match(html, /Flight<br>Recorder/);
  assert.match(html, /VISUAL ONLY/);
  assert.match(html, /USAGE 4/);
  assert.match(html, /NOT USAGE 4/);
  assert.match(html, /LOCAL 4/);
  assert.match(html, /PUBLISH 4/);
  assert.match(html, /No provider calls, no usage writes, no prompts, no outputs/);
  assert.match(html, /event--not-usage/);
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /https?:\/\//i);
});

test("provider scan beats turn Higgsfield and Codex marks during collection", () => {
  const higgsfield = renderProviderScanBeat({
    providerId: "higgsfield",
    label: "Higgsfield",
    index: 0,
    total: 4,
  });
  assert.match(higgsfield, /VTK:\/\/SCAN-BEAT\/\/01\/04\/\/HF/);
  assert.match(higgsfield, /HIGGSFIELD MCP PRISM/);
  assert.match(higgsfield, /surprise hook 2\/4: scan turn before fetch result/);
  assert.match(higgsfield, /surprise cadence 2\/3 scan beat: ASCII logo turntable/);
  assert.match(higgsfield, /--HF--/);
  assert.match(higgsfield, /<HF>/);
  assert.match(higgsfield, /micro-surprises: wake -> turn -> spark -> seal/);
  assert.match(higgsfield, /micro 2\/4 auth/);
  assert.match(higgsfield, /micro 4\/4 validate/);
  assert.match(higgsfield, /VTK:\/\/SIGNATURE-REVEAL\/\/02\/03 SCAN\/\/HF/);
  assert.match(higgsfield, /HIGGSFIELD LOGO TURN/);
  assert.match(higgsfield, /surprise 2\/4 mark turns/);
  assert.match(higgsfield, /unicode braille signal field/);
  assert.match(higgsfield, /drawille .*[⠀-⣿]/u);
  assert.match(higgsfield, /provider usage only after consented MCP\/local config/);
  assert.match(higgsfield, /Higgsfield ASCII logo turns/);
  assert.match(higgsfield, /Vibers Unite/);

  const codex = renderProviderScanBeat({
    providerId: "codex-cli",
    label: "Codex CLI",
    index: 1,
    total: 4,
  });
  assert.match(codex, /VTK:\/\/SCAN-BEAT\/\/02\/04\/\/CX/);
  assert.match(codex, /CODEX BUILDER TRACE/);
  assert.match(codex, /CODEX TRUST CUBE/);
  assert.match(codex, /surprise 4\/4 trust seal/);
  assert.match(codex, /<diff>/);
  assert.match(codex, /trust\/build context stays labelled/);
  assert.match(codex, /Codex ASCII logo turns/);
  assert.match(codex, /never fake spend/);
});

test("signature reveals are provider-specific and guardrailed", () => {
  const higgsfield = renderSignatureReveal("higgsfield", "Higgsfield", "queue").join("\n");
  assert.match(higgsfield, /VTK:\/\/SIGNATURE-REVEAL\/\/01\/03 QUEUE\/\/HF/);
  assert.match(higgsfield, /HIGGSFIELD LOGO TURN/);
  assert.match(higgsfield, /surprise 1\/4 prism wakes/);
  assert.match(higgsfield, /surprise 4\/4 ledger seal/);
  assert.match(higgsfield, /accepted rows decide usage/);

  const codex = renderSignatureReveal("codex-cli", "Codex CLI", "scan").join("\n");
  assert.match(codex, /VTK:\/\/SIGNATURE-REVEAL\/\/02\/03 SCAN\/\/CX/);
  assert.match(codex, /CODEX TRUST CUBE/);
  assert.match(codex, /NOT \$/);
  assert.match(codex, /Builder trust only; not provider spend/);

  const local = renderSignatureReveal("ollama", "Ollama", "checkpoint").join("\n");
  assert.match(local, /VTK:\/\/SIGNATURE-REVEAL\/\/03\/03 CHECKPOINT\/\/OL/);
  assert.match(local, /LOCAL LAB RADAR/);
  assert.match(local, /Local AI stays local until review/);
});

test("provider scan beats stay silent outside interactive output", async () => {
  const chunks: string[] = [];
  await showProviderScanBeat({
    providerId: "higgsfield",
    index: 0,
    total: 1,
  }, {
    delayMs: 0,
    env: {},
    isTTY: false,
    stream: { isTTY: false, write: (chunk) => chunks.push(chunk) },
  });

  assert.equal(chunks.join(""), "");
});

test("provider scan beats emit a compact live turntable when interactive", async () => {
  const chunks: string[] = [];
  await showProviderScanBeat({
    providerId: "higgsfield",
    index: 0,
    total: 1,
  }, {
    delayMs: 0,
    env: {},
    isTTY: true,
    stream: { isTTY: true, write: (chunk) => chunks.push(chunk) },
  });

  const output = chunks.join("");
  assert.match(output, /\x1b\[2K/);
  assert.match(output, /LIVE TURN 01\/04 HIGGSFIELD MCP PRISM/);
  assert.match(output, /surprise flash 1\/4: wake/);
  assert.match(output, /Vibers Unite \/\/ c0vibe\.app/);
  assert.match(output, /terminal charm \/\/ visual feedback only/);
});

test("collection checkpoints expose provider errors without fake success", () => {
  const text = renderCollectionCheckpoint({
    providerId: "ollama",
    label: "Ollama",
    status: "error",
    received: 0,
    accepted: 0,
    fresh: 0,
    duplicate: 0,
    error: "not running / unreachable",
    hint: "fix: vibetracker detect",
  });

  assert.match(text, /HOLD not running \/ unreachable/);
  assert.match(text, /no records collected from this provider/);
  assert.match(text, /surprise encore hold: local lab sonar/);
  assert.match(text, /fix: vibetracker detect/);
});

test("manual collection checkpoints make local ledger writes feel intentional", () => {
  const text = renderCollectionCheckpoint({
    providerId: "midjourney",
    label: "Midjourney",
    status: "new",
    received: 1,
    accepted: 1,
    fresh: 1,
    duplicate: 0,
    usd: 30,
    sourceMix: [{ source: "manual", count: 1 }],
    hint: "manual creator or subscription cost written to the local ledger",
  });

  assert.match(text, /VTK:\/\/COLLECT-CHECKPOINT\/\/MI\/\/midjourney/);
  assert.match(text, /LOCK 1 new record\(s\)/);
  assert.match(text, /manual\s+1\s+█/);
  assert.match(text, /surprise checkpoint encore/);
  assert.match(text, /Art is feedback|art is feedback/i);
  assert.match(text, /manual creator or subscription cost written to the/);
});

test("sync surprise planning is deterministic and capped", () => {
  const planned = planSyncSurprises(["higgsfield", "replicate", "runway", "ollama", "claude-code"]);

  assert.deepEqual(planned.map((item) => item.id), [
    "higgsfield-turn",
    "codex-trace",
    "local-sonar",
    "c0vibe-relay",
  ]);
});

test("sync surprises stay off for machine-readable or non-interactive output", () => {
  assert.equal(shouldShowSyncSurprises({ isTTY: false, env: {} }), false);
  assert.equal(shouldShowSyncSurprises({ isTTY: true, json: true, env: {} }), false);
  assert.equal(shouldShowSyncSurprises({ isTTY: true, plain: true, env: {} }), false);
  assert.equal(shouldShowSyncSurprises({ isTTY: true, env: { CI: "1" } }), false);
  assert.equal(shouldShowSyncSurprises({ isTTY: true, env: { VT_NO_ANIM: "1" } }), false);
  assert.equal(shouldShowSyncSurprises({ isTTY: true, env: { VT_NO_SURPRISES: "1" } }), false);
  assert.equal(shouldShowSyncSurprises({ isTTY: true, env: { NO_COLOR: "1" } }), true);
  assert.equal(shouldShowSyncSurprises({ isTTY: true, env: {} }), true);
});

test("showSyncSurpriseQueue writes multiple terminal panels when enabled", async () => {
  const chunks: string[] = [];
  await showSyncSurpriseQueue(["higgsfield", "claude-code"], {
    delayMs: 0,
    env: {},
    isTTY: true,
    stream: { isTTY: true, write: (chunk) => chunks.push(chunk) },
  });

  const output = chunks.join("");
  assert.match(output, /SCAN-IGNITION/);
  assert.match(output, /HIGGSFIELD TURN/);
  assert.match(output, /CODEX TRACE/);
  assert.match(output, /C0VIBE RELAY/);
  assert.match(output, /SURPRISE-ITINERARY/);
  assert.match(output, /4 hooks fire/);
  assert.match(output, /\x1b\[2K/);
  assert.match(output, /LIVE TURN 01\/04 SCAN IGNITION/);
  assert.match(output, /LIVE TURN 01\/04 HIGGSFIELD TURN/);
  assert.match(output, /surprise flash 1\/4: wake/);
});

test("collection cascade stays silent for non-interactive output and animates in TTY", async () => {
  const silent: string[] = [];
  const input = { providerIds: ["higgsfield", "codex-cli", "ollama", "replicate"], label: "SYNC" };

  await showCollectionCascade(input, {
    delayMs: 0,
    env: {},
    isTTY: false,
    stream: { isTTY: false, write: (chunk) => silent.push(chunk) },
  });
  assert.equal(silent.join(""), "");

  const chunks: string[] = [];
  await showCollectionCascade(input, {
    delayMs: 0,
    env: {},
    isTTY: true,
    stream: { isTTY: true, write: (chunk) => chunks.push(chunk) },
  });

  const output = chunks.join("");
  assert.match(output, /COLLECTION-CASCADE/);
  assert.match(output, /cascade 16\/16 C0 UNITE PUBLISH/);
  assert.match(output, /\x1b\[2K/);
  assert.match(output, /LIVE TURN 01\/04 COLLECTION CASCADE/);
  assert.match(output, /terminal charm \/\/ visual feedback only/);
});

test("collection encore recap stays silent for non-interactive output and animates in TTY", async () => {
  const silent: string[] = [];
  const input = {
    checkpoints: [
      {
        providerId: "higgsfield",
        label: "Higgsfield",
        status: "new" as const,
        received: 1,
        accepted: 1,
        fresh: 1,
        duplicate: 0,
      },
    ],
  };

  await showCollectionEncoreRecap(input, {
    delayMs: 0,
    env: {},
    isTTY: false,
    stream: { isTTY: false, write: (chunk) => silent.push(chunk) },
  });
  assert.equal(silent.join(""), "");

  const chunks: string[] = [];
  await showCollectionEncoreRecap(input, {
    delayMs: 0,
    env: {},
    isTTY: true,
    stream: { isTTY: true, write: (chunk) => chunks.push(chunk) },
  });

  const output = chunks.join("");
  assert.match(output, /COLLECTION-ENCORE/);
  assert.match(output, /\x1b\[2K/);
  assert.match(output, /LIVE TURN 01\/01 COLLECTION ENCORE RECAP/);
  assert.match(output, /visual feedback only; no extra ledger rows/);
});
