import { test } from "node:test";
import assert from "node:assert/strict";
import { renderGuiLaunchHandoff, renderWizardGuiHtml } from "../gui-wizard.ts";
import type { UsageAudit } from "../audit.ts";

const audit: UsageAudit = {
  generatedAt: "2026-07-05T00:00:00Z",
  totals: { records: 1, providers: 1, usd: 0.1 },
  sourceMix: [{ source: "ledger", label: "Provider ledger", count: 1, pct: 100, usd: 0.1 }],
  freshness: [{ provider: "higgsfield", lastEvent: "2026-07-05T00:00:00Z", ageDays: 0, status: "fresh" }],
  coverage: { tracked: 1, connected: 0, available: 1, planned: 1, manual: 1, gaps: [] },
  integrity: { recordCount: 1, chainHead: "a".repeat(64), bundleFingerprint: "b".repeat(64) },
  anomalies: [],
  trustSignals: [{
    kind: "github_activity",
    source: "github_cli",
    label: "GitHub activity evidence (not AI usage)",
    handle: "B-EtterDigital",
    fetchedAt: "2026-07-05T00:00:00Z",
    from: "2026-07-01T00:00:00Z",
    to: "2026-07-05T00:00:00Z",
    windowDays: 5,
    totalContributions: 33,
    commitContributions: 20,
    issueContributions: 1,
    pullRequestContributions: 7,
    pullRequestReviewContributions: 5,
    repositoryContributions: 0,
    days: [
      { date: "2026-07-01", count: 0, level: 0 },
      { date: "2026-07-02", count: 2, level: 1 },
      { date: "2026-07-03", count: 6, level: 2 },
      { date: "2026-07-04", count: 25, level: 4 },
    ],
    confidence: "activity_evidence",
    affectsTotals: false,
    usageVerified: false,
    note: "Activity evidence only. Not counted as usage, spend, credits, or verified provider data.",
  }],
};

const providers: any[] = [
  { id: "higgsfield", label: "Higgsfield", domain: "ai", categories: ["video", "image"], tier: "ledger", auth: "mcp", status: "built", verified: true, method: "ledger" },
  { id: "ollama", label: "Ollama", domain: "ai", categories: ["llm"], tier: "proxy", auth: "localLogs", status: "planned", verified: false, method: "proxy" },
];

test("wizard GUI preserves terminal aesthetic and provider commands", () => {
  const html = renderWizardGuiHtml({
    providers,
    audit,
    plan: { autoEnv: [], autoLocal: [], needsKey: [], proxy: ["ollama"], manual: [] },
  });
  assert.match(html, /VIBE USAGE/);
  assert.match(html, /terminal wizard/);
  assert.match(html, /ascii-logo/);
  assert.match(html, /ASCII GUI live/);
  assert.match(html, /operator-grade local usage console/);
  assert.match(html, /hudtile/);
  assert.match(html, /launch-handoff/);
  assert.match(html, /VTK:\/\/TERMINAL-TO-GUI\/\/INLINE-HANDOFF/);
  assert.match(html, /JUMP READY/);
  assert.match(html, /Terminal charm jumps into the GUI/);
  assert.match(html, /shell remains the local source of truth/);
  assert.match(html, /providers staged/);
  assert.match(html, /trust \/ NOT USAGE/);
  assert.match(html, /launch-runway/);
  assert.match(html, /VTK:\/\/WIZARD-LAUNCH-RUNWAY\/\/BOOT-SCAN-RELAY/);
  assert.match(html, /FIRST RUN/);
  assert.match(html, /Terminal boot/);
  assert.match(html, /Provider scanline/);
  assert.match(html, /Higgsfield prism/);
  assert.match(html, /Local lab sonar/);
  assert.match(html, /Trust split/);
  assert.match(html, /C0VIBE relay/);
  assert.match(html, /vibetracker detect --local/);
  assert.match(html, /vibetracker upload --dry-run/);
  assert.match(html, /Runway order: terminal boot -> provider scan -> Higgsfield creator rail -> local sonar -> trust split -> c0vibe\.app relay/);
  assert.match(html, /Motion is feedback; validated records decide usage/);
  assert.match(html, /data-runway-step/);
  assert.match(html, /data-rail="not_usage"/);
  assert.match(html, /runwaySteps/);
  assert.match(html, /runwayStepIndex/);
  assert.match(html, /selectRunwayStep/);
  assert.match(html, /\[runway\]/);
  assert.match(html, /first-run rail labelled/);
  assert.match(html, /terminal-dock/);
  assert.match(html, /VTK:\/\/GUI-TERMINAL-DOCK\/\/VIBERS-UNITE/);
  assert.match(html, /SOURCE TERMINAL/);
  assert.match(html, /Catalog sweep/);
  assert.match(html, /Local probes/);
  assert.match(html, /Trust split/);
  assert.match(html, /C0VIBE guard/);
  assert.match(html, /data-dock-step/);
  assert.match(html, /dockSteps/);
  assert.match(html, /dockStepIndex/);
  assert.match(html, /selectDockStep/);
  assert.match(html, /keys masked in terminal/);
  assert.match(html, /usage totals only move after validated records/);
  assert.match(html, /dry-run before c0vibe\.app/);
  assert.match(html, /Dock stage rotates with scan/);
  assert.match(html, /lineage-deck/);
  assert.match(html, /VTK:\/\/WIZARD-LINEAGE\/\/SOURCE-TO-SCORE\/\/NO-RAW-PROMPTS/);
  assert.match(html, /DATASTREAM PATH/);
  assert.match(html, /Catalog to setup/);
  assert.match(html, /Credential split/);
  assert.match(html, /Collect records/);
  assert.match(html, /Validate bundle/);
  assert.match(html, /Trust side rail/);
  assert.match(html, /C0VIBE relay/);
  assert.match(html, /setup -> collect -> validate -> trust side rail -> c0vibe\.app/);
  assert.match(html, /profile, heatgrid, score, and badges read reviewed aggregates only/i);
  assert.match(html, /data-lineage-step/);
  assert.match(html, /lineageSteps/);
  assert.match(html, /lineageStepIndex/);
  assert.match(html, /selectLineageStep/);
  assert.match(html, /profile feeds reviewed datastream/);
  assert.match(html, /No prompts, outputs, or secrets leave the machine/);
  assert.match(html, /NOT USAGE\. Cannot change spend/);
  assert.match(html, /proof-console/);
  assert.match(html, /VTK:\/\/AUDIT-CORE\/\/INLINE-GUI/);
  assert.match(html, /LOCAL PROOF/);
  assert.match(html, /Usage counted/);
  assert.match(html, /Trust lane/);
  assert.match(html, /NOT USAGE \/ separate evidence/);
  assert.match(html, /bundle hash \/ local ledger/);
  assert.match(html, /checkpoint-rail/);
  assert.match(html, /VTK:\/\/COLLECT-CHECKPOINTS\/\/INLINE-GUI/);
  assert.match(html, /PROVIDER RAIL/);
  assert.match(html, /LOCK/);
  assert.match(html, /signal-theatre/);
  assert.match(html, /VTK:\/\/SIGNAL-THEATRE\/\/SURPRISE-RAIL/);
  assert.match(html, /SCAN MOMENTS/);
  assert.match(html, /Higgsfield prism turntable/);
  assert.match(html, /Codex trust trace/);
  assert.match(html, /Local loopback sonar/);
  assert.match(html, /C0VIBE relay/);
  assert.match(html, /Drawille braille field/);
  assert.match(html, /data-tone="drawille"/);
  assert.match(html, /[\u2800-\u28ff]/u);
  assert.match(html, /Open-source braille pixels/);
  assert.match(html, /Builder activity stays NOT USAGE/);
  assert.match(html, /Every flash is feedback from provider metadata/);
  assert.match(html, /higgsfield/);
  assert.match(html, /VTK:\/\/LOCAL-FIRST\/\/ASCII-GUI/);
  assert.match(html, /VIBERS UNITE/);
  assert.match(html, /c0vibe\.app/);
  assert.match(html, /worldwide scan/);
  assert.match(html, /logo-deck/);
  assert.match(html, /Rotating source marks/);
  assert.match(html, /HIGGSFIELD TURN/);
  assert.match(html, /CODEX TRACE/);
  assert.match(html, /C0VIBE profile/);
  assert.match(html, /HIGGSFIELD MCP/);
  assert.match(html, /CODEX CLI/);
  assert.match(html, /HIGGSFIELD PRISM/);
  assert.match(html, /CODEX BUILDER/);
  assert.match(html, /REPLICATE METER/);
  assert.match(html, /ANTIGRAVITY TRACE/);
  assert.match(html, /LOCAL MODEL SONAR/);
  assert.match(html, /COMFYUI NODE MAP/);
  assert.match(html, /CREATOR STUDIO SWEEP/);
  assert.match(html, /GLOBAL ADAPTER PASS/);
  assert.match(html, /surprise-queue/);
  assert.match(html, /surprise-encore/);
  assert.match(html, /VTK:\/\/SURPRISE-ENCORE\/\/QUEUE-SCAN-VALIDATE-RELAY/);
  assert.match(html, /JOY WITH PROOF/);
  assert.match(html, /Higgsfield prism queued/);
  assert.match(html, /Codex glyph sidecar/);
  assert.match(html, /Local loopback ping/);
  assert.match(html, /Ledger seal/);
  assert.match(html, /Vibers Unite relay/);
  assert.match(html, /queue -> scan -> collect -> validate -> relay/);
  assert.match(html, /Art follows source truth/);
  assert.match(html, /data-relay-pulse/);
  assert.match(html, /relayPulses/);
  assert.match(html, /relayPulseIndex/);
  assert.match(html, /selectRelayPulse/);
  assert.match(html, /art follows source truth/);
  assert.match(html, /terminal-recorder/);
  assert.match(html, /VTK:\/\/GUI-BLACK-BOX\/\/TERMINAL-RECORDER\/\/NO-SECRETS/);
  assert.match(html, /BLACK BOX/);
  assert.match(html, /VibeTRACKER local recorder/);
  assert.match(html, /NO RAW PROMPTS  NO OUTPUTS  NO SECRETS/);
  assert.match(html, /trust side rail: NOT USAGE \/ no rank impact/);
  assert.match(html, /Shell mirrors into GUI/);
  assert.match(html, /Higgsfield prism wakes/);
  assert.match(html, /Codex trust cube turns/);
  assert.match(html, /Local sonar stays local/);
  assert.match(html, /Ledger rows decide truth/);
  assert.match(html, /C0VIBE relay waits/);
  assert.match(html, /data-recorder-event/);
  assert.match(html, /terminalRecorderEvents|recorderEvents/);
  assert.match(html, /recorderEventIndex/);
  assert.match(html, /selectRecorderEvent/);
  assert.match(html, /\[blackbox\]/);
  assert.match(html, /replay metadata only/);
  assert.match(html, /stores no prompts, model outputs, pasted keys, or hidden usage/);
  assert.match(html, /surpriseSceneIndex/);
  assert.match(html, /logoSignals/);
  assert.match(html, /logoSignalEls/);
  assert.match(html, /selectSurprise/);
  assert.match(html, /data-scene/);
  assert.match(html, /item\.frames/);
  assert.match(html, /Higgsfield MCP authenticated/);
  assert.match(html, /Replicate-style runs queue/);
  assert.match(html, /Antigravity-style IDE/);
  assert.match(html, /ComfyUI workflows light up/);
  assert.match(html, /Chinese, European, and regional providers/);
  assert.match(html, /Ollama, LM Studio, ComfyUI, and vLLM/);
  assert.match(html, /ascii-globe/);
  assert.match(html, /cli-spinners/);
  assert.match(html, /drawille/);
  assert.match(html, /vibetracker init --gui/);
  assert.match(html, /vibetracker proxy --provider ollama/);
  assert.match(html, /GitHub heatgrid ready/i);
  assert.match(html, /#39d353/);
  assert.match(html, /provider__mark/);
  assert.match(html, /--brand-from:#ff4fd8/);
  assert.match(html, /Accepted roadmap/);
  assert.match(html, /73 selected improvements/);
});

test("wizard GUI launch handoff frames the terminal to browser jump", () => {
  const text = renderGuiLaunchHandoff({
    providers,
    audit,
    plan: { autoEnv: [], autoLocal: ["claude-code"], needsKey: [], proxy: ["ollama"], manual: [] },
  }, "http://127.0.0.1:4321/?token=abc123");

  assert.match(text, /VTK:\/\/TERMINAL-TO-GUI\/\/LOCAL-WIZARD\/\/VIBERS-UNITE/);
  assert.match(text, /shell stays source of truth; browser becomes cockpit/);
  assert.match(text, /providers\s+2 \/\/ tracked\s+1 \/\/ local\s+2/);
  assert.match(text, /trust signals\s+1 \/\/ NOT USAGE/);
  assert.match(text, /keys stay masked in terminal/);
  assert.match(text, /open http:\/\/127\.0\.0\.1:4321\/\?token=abc123/);
});
