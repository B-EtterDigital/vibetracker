import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDoctorReport, renderDoctorReport, type DoctorProvider } from "../doctor.ts";

const providers: DoctorProvider[] = [
  { id: "higgsfield", label: "Higgsfield", domain: "ai", tier: "ledger", auth: "mcp", status: "built", verified: true },
  { id: "codex-cli", label: "Codex CLI", domain: "ai", tier: "log", auth: "localLogs", status: "planned", verified: false },
  { id: "ollama", label: "Ollama", domain: "ai", tier: "proxy", auth: "localLogs", status: "planned", verified: false },
  { id: "midjourney", label: "Midjourney", domain: "ai", tier: "manual", auth: "none", status: "manual-only", verified: false },
];

const baseInput = {
  configPath: "/home/me/.vibetracker/config.json",
  configExists: true,
  configValid: true,
  enabledProviders: ["higgsfield", "codex-cli"],
  hasC0VibeToken: false,
  hasUploadUrl: false,
  storePath: "/home/me/.vibetracker/records.jsonl",
  storeExists: true,
  encryptedStoreExists: false,
  storeEncrypted: false,
  recordCount: 12,
  browserExtensionPath: "/repo/packages/browser-extension",
  browserExtensionExists: true,
  pluginsPath: "/repo/packages/plugins",
  pluginsDirExists: true,
  providers,
  localEndpointCount: 5,
  localApiPort: 8765,
};

test("doctor report classifies local setup, provider coverage, and trust boundary", () => {
  const report = buildDoctorReport(baseInput);

  assert.equal(report.stats.providers, 4);
  assert.equal(report.stats.built, 1);
  assert.equal(report.stats.verified, 1);
  assert.equal(report.stats.enabled, 2);
  assert.equal(report.stats.records, 12);
  assert.equal(report.checks.find((check) => check.id === "browser-extension")?.status, "ready");
  assert.equal(report.checks.find((check) => check.id === "trust-boundary")?.impact, "not_usage");
  assert.match(report.checks.find((check) => check.id === "trust-boundary")?.detail ?? "", /NOT USAGE/);
});

test("doctor report gives setup commands when config or store are missing", () => {
  const report = buildDoctorReport({
    ...baseInput,
    configExists: false,
    enabledProviders: [],
    storeExists: false,
    recordCount: 0,
    browserExtensionExists: false,
    pluginsDirExists: false,
  });

  assert.equal(report.checks.find((check) => check.id === "config")?.command, "vibetracker init --gui");
  assert.equal(report.checks.find((check) => check.id === "store")?.command, "vibetracker sync --demo");
  assert.equal(report.checks.find((check) => check.id === "browser-extension")?.status, "missing");
  assert.equal(report.checks.find((check) => check.id === "plugins")?.status, "warn");
});

test("doctor rendering includes credits, C0VIBE motto, and compact width", () => {
  const text = renderDoctorReport({ ...baseInput, includeSurprisePreview: false });

  assert.match(text, /VTK:\/\/DOCTOR\/\/LOCAL-FIRST\/\/VIBETRACKER/);
  assert.match(text, /Vibers Unite \/\/ c0vibe\.app/);
  assert.match(text, /ascii-globe MIT/);
  assert.match(text, /cli-spinners MIT/);
  assert.match(text, /drawille MIT/);
  assert.match(text, /GitHub, Codex, creator cadence/);
  assert.match(text, /vibetracker upload --dry-run|vibetracker login/);
  for (const line of text.split("\n")) assert.ok(line.length <= 66, `line too wide: ${line}`);
});

test("doctor surprise preview renders Higgsfield and Codex terminal moments", () => {
  const text = renderDoctorReport(baseInput);

  assert.match(text, /SURPRISE-PREVIEW/);
  assert.match(text, /HIGGSFIELD MCP PRISM/);
  assert.match(text, /CODEX BUILDER TRACE/);
  assert.match(text, /SCAN-IGNITION/);
  assert.match(text, /USAGE ONLY cells light from accepted records/);
  assert.match(text, /hiddenUpload=0; publish waits for review/);
  assert.match(text, /--HF--/);
  assert.match(text, /<diff>/);
  assert.match(text, /VISUAL CREDITS ascii-globe MIT · cli-spinners MIT/);
  assert.match(text, /VISUAL CREDITS drawille MIT · local fallbacks/);
});
