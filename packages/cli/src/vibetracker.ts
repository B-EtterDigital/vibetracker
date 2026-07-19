#!/usr/bin/env node
// VibeTRACKER CLI. Local-first: nothing leaves the machine unless you run `upload`.
//   vibetracker providers          list every adapter + its tier/auth/status
//   vibetracker sync               pull usage from providers enabled in ~/.vibetracker/config.json
//   vibetracker sync --demo        run several adapters (claude-code live + fixtures) through one pipeline
//   vibetracker total [--by ...]   render merged usage from the local store
//
// Deep relative imports become `@vibetracker/*` once `pnpm install` links the workspace.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

import type { GroupBy } from "../../core/src/aggregate.ts";
import { createConsoleTelemetry } from "../../core/src/telemetry/index.ts";
import { appendRecords, readRecords, writeRecords } from "../../core/src/store/jsonl.ts";
import { ingestRecords } from "../../core/src/verify/validate.ts";
import { PROVIDERS, createAdapterFromConfig, providersInDomain, getProvider, type Domain } from "../../adapters/src/index.ts";
import { runSync, type SyncTarget } from "./sync.ts";
import {
  reconcileFullScanProviders,
  reconcileImportDayRows,
  shouldReplaceSyncRecord,
  syncRecordKey,
} from "./sync-dedupe.ts";
import { runProxy } from "./proxy.ts";
import { planSetup, runWizard, localLogsPresent, GUIDE, fieldLabel, maskKey, setupPlanSurpriseTargets } from "./wizard.ts";
import { showBanner, showWelcome, withSpinner, typeLine, rule, icon, bar, dim, paint, ok, bad, gold, human } from "./banner.ts";
import { createInterface } from "node:readline/promises";
import { loadConfig, saveConfig, resolveCreds, storeProviderCreds, clearProviderCreds, storeToken, clearToken, CRED_FIELDS, CONFIG_PATH } from "./config.ts";
import { renderTotal } from "./commands/total.ts";
import { renderStats } from "./commands/stats.ts";
import { renderProfileHtml } from "./profile.ts";
import { collectTrustSignals, createCreatorActivityTrustSignal, loadManualTrustSignals, saveManualTrustSignal, trustSignalSummary } from "./trust-signals.ts";
import { buildUsageAudit, renderUsageAudit } from "./audit.ts";
import { runWizardGui } from "./gui-wizard.ts";
import { renderAcceptedRoadmap, roadmapJson } from "./roadmap.ts";
import { parseExportFormat, renderUsageExport, writeParquetExport, writeUsageExport } from "./export.ts";
import { renderPrivacyScreen } from "./privacy.ts";
import { LOCAL_ENDPOINTS, detectLocalEndpoints, detectOpenAICompatible, localDetectionSnapshot, renderLocalDetection, renderLocalDetectionHtml, renderOpenAICompatibleDetection } from "./detect.ts";
import { renderInsights } from "./insights.ts";
import { adapterScaffold } from "./scaffold-adapter.ts";
import { createLedgerSeal, ledgerSealSummary, ledgerVerifySummary, verifyLedgerSeal, writeLedgerSeal } from "./ledger.ts";
import { loadOrCreateSigningKey, readSignedBundle, signBundle, verifySignedBundle, writeSignedBundle } from "./signing.ts";
import { providerCapabilityChecks, renderCapabilityChecks } from "./capability-check.ts";
import { redactFixture, renderFixtureRedaction } from "./fixture.ts";
import { createRoiNote, loadRoiNotes, renderRoiNotes, saveRoiNotes } from "./roi-notes.ts";
import { startLocalApiServer, BRIDGE_PORTS, DEFAULT_DASHBOARD_ORIGIN, type LocalApiDeps, type LocalApiSession } from "./api-server.ts";
import { buildBrowserExtension } from "./browser-extension-build.ts";
import { desktopActivitiesToRecords, renderDesktopActivity, scanDesktopActivity } from "./desktop-activity.ts";
import {
  buildOAuthUrl,
  exchangeOAuthCode,
  oauthCredentialsFromTokenResponse,
  oauthProviderPreset,
  redeemCynaps3WithClerkToken,
  refreshOAuthCredentials,
  validateOAuthCredentialsForPreset,
  waitForOAuthCallback,
  type OAuthProviderPreset,
  type StoredOAuthCredentials,
} from "./oauth.ts";
import { ccusageToRecords, findCcJson, CCUSAGE_PROVIDERS } from "./import-ccusage.ts";
import { collectCodingTelemetry } from "./coding-telemetry.ts";
import { collectOrchestrationHours } from "./orchestration-hours.ts";
import { fetchViberankProfile, decomposeViberank, VIBERANK_PROVIDER } from "./import-viberank.ts";
import { buildMidjourneyLifetimeRecord, isMidjourneyLifetimeImport, parseMidjourneyInfo } from "./import-midjourney.ts";
import { commandCockpitPayload, renderCommandCockpit, renderCommandCockpitHtml } from "./command-cockpit.ts";
import {
  defaultSyncSurpriseDirectorProviders,
  renderSyncSurpriseDirectorHtml,
  renderSyncSurpriseDirectorPreview,
  showCollectionCascade,
  showCollectionCheckpoint,
  showCollectionEncoreRecap,
  showProviderScanBeat,
  showSyncSurpriseQueue,
  shouldShowSyncSurprises,
  type CollectionCheckpoint,
} from "./sync-surprises.ts";
import { renderShowcase, renderShowcaseHtml } from "./showcase.ts";
import { buildStudioPackFiles, studioPackManifest } from "./studio-pack.ts";
import { buildSyncReceiptFiles } from "./sync-receipt.ts";
import { loadReceiptVault, receiptVaultPayload, renderReceiptVault, renderReceiptVaultHtml } from "./receipt-vault.ts";
import { buildLaunchKitFiles } from "./launch-kit.ts";
import { renderShareBadgeMarkdown, renderShareBadgeSvg } from "./badge.ts";
import { renderDoctorReport } from "./doctor.ts";
import { lifeDemoInput, renderLifeCommand } from "./life.ts";
import { resolveMissionCommand } from "./mission/mission-command.ts";
import { buildLiveConsoleFrame, parseLiveConsoleOptions } from "./live-console.ts";
import { resolveUsageCompareCommand } from "./compare/usage-compare-command.ts";
import { formatTable, money } from "./format.ts";
import { renderUploadBlocked, renderUploadFailure, renderUploadPreview, renderUploadSuccess, resolveUploadEndpoint, type UploadResponseProof } from "./upload.ts";
import { runLogin, createHttpAuthTransport } from "./login.ts";
import { readGitHubCliToken } from "./github-identity.ts";
import { filterRecords, parseSince, type RecordFilter } from "../../core/src/filter.ts";
import { computeStats } from "../../core/src/stats.ts";
import { computeUsageInsights } from "../../core/src/analytics/insights.ts";
import { scanSecrets, redactSecrets } from "../../core/src/security/secrets.ts";
import { amortizeSubscription } from "../../core/src/subscriptions/amortize.ts";
import { privateAggregate } from "../../core/src/privacy/differential.ts";
import type { Category, Source } from "../../core/src/schema/record.ts";
import type { CreatorPlatform } from "../../core/src/schema/trust-signal.ts";

// fixture-backed adapters used only by `sync --demo`
import { createClaudeCodeAdapter } from "../../adapters/src/claude-code/index.ts";
import { createCodexAdapter } from "../../adapters/src/codex/index.ts";
import { createHiggsfieldAdapter, createFixtureClient as hgFixture } from "../../adapters/src/higgsfield/index.ts";
import { createOpenAIAdapter, createFixtureClient as oaFixture } from "../../adapters/src/openai/index.ts";
import { createSunoAdapter, createFixtureClient as sunoFixture } from "../../adapters/src/suno/index.ts";
import hgFix from "../../adapters/src/higgsfield/__fixtures__/transactions.sample.json" with { type: "json" };
import oaFix from "../../adapters/src/openai/__fixtures__/costs.sample.json" with { type: "json" };
import suFix from "../../adapters/src/suno/__fixtures__/feed.sample.json" with { type: "json" };

const STORE = process.env.VT_STORE_PASSPHRASE
  ? join(homedir(), ".vibetracker", "records.jsonl.enc")
  : join(homedir(), ".vibetracker", "records.jsonl");
const LEDGER_SEAL = join(homedir(), ".vibetracker", "ledger-seal.json");
const SIGNING_KEY = join(homedir(), ".vibetracker", "signing-key.json");
const ROI_NOTES = join(homedir(), ".vibetracker", "roi-notes.json");
function browserExtensionDir(): string {
  // this module lives at <repo>/packages/cli/src — three levels up to the repo root, so the
  // command works from ANY cwd (real incident 2026-07-19: `vibetracker start` from ~ resolved
  // <cwd>/packages/browser-extension and died; the old relative candidates climbed too few levels)
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(here, "..", "..", "..", "packages", "browser-extension"),
    join(here, "..", "..", "packages", "browser-extension"),
    join(process.cwd(), "packages", "browser-extension"),
  ];
  return candidates.find((candidate) => existsSync(join(candidate, "manifest.json"))) ?? candidates[0];
}

// The Chrome-loadable extension directory: a clean, rebuilt-each-time copy of the source that holds
// ONLY runtime files. Chrome rejects the source package directly because it contains `__tests__/`
// (reserved "_" name). Built under ~/.vibetracker (always writable, even when the package lives in a
// read-only npx cache). This is the path `start` copies to the clipboard and tells users to load.
function buildLoadableExtension(): string {
  return buildBrowserExtension(browserExtensionDir(), join(homedir(), ".vibetracker", "extension"));
}
function pluginsDir(): string {
  const candidates = [
    join(process.cwd(), "packages", "plugins"),
    join(dirname(fileURLToPath(import.meta.url)), "..", "packages", "plugins"),
    join(dirname(fileURLToPath(import.meta.url)), "..", "..", "packages", "plugins"),
  ];
  return candidates.find((candidate) => existsSync(join(candidate, "manifest.schema.json"))) ?? candidates[0];
}
const SITE = "https://vibeusage.c0vibe.app";
const DEFAULT_UPLOAD_URL = `${SITE}/api/ingest`;
const RANGE = { from: "2000-01-01T00:00:00Z", to: "2100-01-01T00:00:00Z" };
const USAGE = [
  "usage: vibetracker <command>",
  "",
  "  init [--gui] | gui | wizard-gui",
  "  login | logout                 reuse `gh auth` for a verified identity; C0VIBE is the fallback",
  "  oauth start <provider> --auth-url u --token-url u --client-id id [--scope s]",
  "  providers [--all] [--domain ai|dev|creative] [--category c]",
  "  providers check [--json]",
  "  connect <provider> | disconnect <provider> | keys",
  "  demo | showcase | tour [--compact] [--html --out path]",
  "  badge | poster [--out path] [--handle h] [--stdout] [--markdown]",
  "  doctor | health | status [--compact]",
  "  surprises [--provider a,b] [--static] [--html --out path]   safe scan-reel preview",
  "  cockpit | commands [--html --out path]   static local command cockpit",
  "  studio [--provider a,b] [--out dir] [--open]   static offline GUI studio pack",
  "  launch-kit | kit | wow | impress | vibe [--provider a,b] [--out dir] [--open]   offline demo launch pack",
  "  sync [--demo] [--receipt --out dir]",
  "  reconcile --coding [--dry-run]   replace coding log histories with current parser truth",
  "  receipts [--dir path] [--json] [--html --out path] [--open]   local sync receipt vault",
  "  mission | pulse | now [--budget N] [--json] [--html --out path] [--open] [--no-trust]   read-only operating picture",
  "  live | watch [--once] [--interval N] [--budget N] [--no-trust]   auto-refresh local usage console",
  "  compare | delta | trend [--days N] [--as-of ISO] [--json] [--html --out path] [--open]   adjacent usage windows",
  "  total | stats | audit | trust | insights | profile | life | roadmap | privacy | detect [--target url] [--json] [--html --out path]",
  "    [--by provider|category|model|day] [--since 30d]",
  "    [--domain ai|dev|creative] [--provider a,b] [--category c]",
  "    [--model m] [--source s] [--account a] [--profile p] [--team t] [--min-usd N] [--json]",
  "  export [--format json|csv|markdown|parquet] [--out path] [--private --epsilon N]",
  "  ledger seal | ledger verify",
  "  bundle sign [--out path] | bundle verify <path>",
  "  release sign [--file dist/vibetracker.js] | release verify <signed-release.json>",
  "  fixture redact <in.json> [--out path]",
  "  telemetry status | telemetry opt-in | telemetry opt-out | telemetry preview",
  "  roi add --from YYYY-MM-DD --to YYYY-MM-DD --note text [--value-usd N] | roi list",
  "  start                          ASCII splash + copy load-unpacked path + open chrome://extensions + serve the bridge",
  "  api serve [--port N] | desktop scan [--record] | browser-extension path",
  "  plugins path",
  "  adapter scaffold <id> [--dir path] [--dry-run] [--force]",
  "  subscription add <provider> --usd N --from YYYY-MM-DD --to YYYY-MM-DD",
  "  import midjourney --images N [--info path|-] [--as-of YYYY-MM-DD] [--usd N]",
  "  add <provider> --usd N [--credits N] [--minutes N] [--characters N] [--category c] [--operation op]",
  "  proxy --target <url> --provider <id> [--port 8899]",
  "  trust list | trust add youtube|x|linkedin|huggingface|npm|pypi --handle h --metric uploads --count N",
  "    auto trust: GitHub CLI + Higgsfield MCP are separate NOT USAGE side rails when available",
  "  upload",
].join("\n");

function parseGroupBy(argv: string[]): GroupBy {
  const v = argv[argv.indexOf("--by") + 1];
  return (["provider", "category", "model", "day"] as const).includes(v as GroupBy) ? (v as GroupBy) : "provider";
}

function demoTargets(): SyncTarget[] {
  const su = suFix as { feed: any; credits: any };
  return [
    { id: "claude-code", adapter: createClaudeCodeAdapter({ maxFiles: 300 }) },
    { id: "higgsfield", adapter: createHiggsfieldAdapter(hgFixture(hgFix as any, { credits: 5848.5, subscription_plan_type: "ultra" }), { creditUsd: 0.01 }) },
    { id: "openai", adapter: createOpenAIAdapter(oaFixture(oaFix as any)) },
    { id: "suno", adapter: createSunoAdapter(sunoFixture(su.feed, su.credits), { creditUsd: 0.01 }) },
  ];
}

async function resolveFreshProviderCreds(
  id: string,
  cfg: ReturnType<typeof loadConfig>,
): Promise<Record<string, string>> {
  const resolved = resolveCreds(id, cfg) as Record<string, string>;
  const preset = oauthProviderPreset(id);
  if (!preset || !resolved.token) return resolved;

  const current: StoredOAuthCredentials = {
    token: resolved.token,
    ...(resolved.refreshToken ? { refreshToken: resolved.refreshToken } : {}),
    ...(resolved.expiresAt ? { expiresAt: resolved.expiresAt } : {}),
  };
  const fresh = await refreshOAuthCredentials({ preset, credentials: current });
  if (fresh !== current) {
    storeProviderCreds(cfg, id, fresh as unknown as Record<string, string>);
    saveConfig(cfg);
  }
  return { ...resolved, ...fresh };
}

async function configTargets(): Promise<SyncTarget[]> {
  const cfg = loadConfig();
  const targets: SyncTarget[] = [];
  for (const id of cfg.enabled) {
    try {
      targets.push({ id, adapter: createAdapterFromConfig(id, await resolveFreshProviderCreds(id, cfg)) });
    } catch (err) {
      console.error(`  skip ${id}: ${(err as Error).message}`);
    }
  }
  return targets;
}

// Turn a raw provider error into one short, friendly line (no giant JSON dumps).
function shortErr(msg: string): string {
  const m = msg.toLowerCase();
  if (/\b40[13]\b|forbidden|not permitted|unauthor/.test(m)) return "needs a key, or the key lacks usage permission";
  if (/\b416\b|within the last|created_after|out of range/.test(m)) return "no usage in the queried window";
  if (/fetch failed|econnrefused|enotfound|etimedout|network|socket/.test(m)) return "not running / unreachable";
  if (/\b429\b|rate.?limit/.test(m)) return "rate-limited — try again shortly";
  return msg.split("\n")[0].replace(/\s+/g, " ").slice(0, 64);
}

function recoveryHint(provider: string, msg: string): string | undefined {
  const m = msg.toLowerCase();
  const desc = getProvider(provider);
  if (/\b40[13]\b|forbidden|not permitted|unauthor/.test(m)) {
    return (CRED_FIELDS[provider] ?? []).length
      ? `fix: vibetracker connect ${provider}`
      : "fix: check the provider account permission or session.";
  }
  if (/fetch failed|econnrefused|enotfound|etimedout|network|socket|not running|unreachable/.test(m)) {
    if (desc?.tier === "proxy" || desc?.tier === "local") return "fix: vibetracker detect";
    return `fix: check network access, then run vibetracker connect ${provider}`;
  }
  if (/\b416\b|within the last|created_after|out of range/.test(m)) return "fix: no usage in that provider window; try again after new activity.";
  if (/\b429\b|rate.?limit/.test(m)) return "fix: wait for the provider rate limit, then re-run vibetracker sync.";
  if (provider === "midjourney") return "fix: vibetracker import midjourney --images <lifetime-images>";
  if (desc?.tier === "manual" || desc?.status === "manual-only") return `fix: vibetracker add ${provider} --usd <amount>`;
  return undefined;
}

function checkpointSourceMix(records: { source: Source }[]): { source: string; count: number }[] {
  const map = new Map<string, number>();
  for (const record of records) map.set(record.source, (map.get(record.source) ?? 0) + 1);
  return [...map.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count || a.source.localeCompare(b.source));
}

function dominantProvider(records: { provider: string; usdEst?: number }[]): { provider: string; count: number; usd?: number } | undefined {
  const map = new Map<string, { count: number; usd: number; hasUsd: boolean }>();
  for (const record of records) {
    const row = map.get(record.provider) ?? { count: 0, usd: 0, hasUsd: false };
    row.count += 1;
    if (record.usdEst != null) {
      row.usd += record.usdEst;
      row.hasUsd = true;
    }
    map.set(record.provider, row);
  }
  const [provider, row] = [...map.entries()]
    .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))[0] ?? [];
  return provider ? { provider, count: row.count, ...(row.hasUsd ? { usd: row.usd } : {}) } : undefined;
}

interface SyncRunSummary {
  id: string;
  generatedAt: string;
  storePath: string;
  providerIds: string[];
  totalFresh: number;
  checkpoints: CollectionCheckpoint[];
}

function syncRunId(generatedAt: string): string {
  return `sync-${generatedAt.replace(/[:.]/g, "-")}`;
}

async function syncTargets(targets: SyncTarget[], ctx: AdapterCtxLike): Promise<SyncRunSummary> {
  // Exact keys make re-running `sync` idempotent. Full-log rows replace ccusage aggregates
  // only on the exact provider-days they cover, preserving older import-only history.
  const generatedAt = new Date().toISOString();
  const existing = readRecords(STORE);
  const recordsByKey = new Map(existing.map((record) => [syncRecordKey(record), record]));

  let total = 0;
  const checkpoints: CollectionCheckpoint[] = [];
  for (const [index, t] of targets.entries()) {
    const ic = icon(t.id, t.adapter.categories?.[0]);
    let records;
    try {
      await showProviderScanBeat({
        providerId: t.id,
        label: getProvider(t.id)?.label,
        index,
        total: targets.length,
      });
      // spinner spins while this provider is fetched, then the line resolves to a result
      const label = t.id === "claude-code" ? `${ic} ${t.id} (reading local logs — can take a moment)` : `${ic} ${t.id}`;
      records = await withSpinner(label, () => t.adapter.getUsage(RANGE, ctx));
    } catch (err) {
      const message = (err as Error).message;
      const short = shortErr(message);
      const hint = recoveryHint(t.id, message);
      console.log(`  ${ic} ${t.id.padEnd(13)} ${dim("·")} ${dim(short)}${hint ? `\n    ${dim(hint)}` : ""}`);
      const checkpoint: CollectionCheckpoint = {
        providerId: t.id,
        label: getProvider(t.id)?.label,
        status: "error",
        received: 0,
        accepted: 0,
        fresh: 0,
        duplicate: 0,
        error: short,
        hint,
      };
      checkpoints.push(checkpoint);
      await showCollectionCheckpoint(checkpoint);
      continue;
    }
    const { accepted } = ingestRecords(records, { untrustedSource: true });
    const replacementKeys = new Set<string>();
    const fresh = accepted.filter((r) => {
      const k = syncRecordKey(r);
      const prior = recordsByKey.get(k);
      // Prefer the orchestrator-aware form of the same stable provider event. This upgrades an
      // older direct-provider row in place instead of adding a second operation.
      if (prior) {
        if (shouldReplaceSyncRecord(prior, r)) {
          replacementKeys.add(k);
          recordsByKey.set(k, r);
          return true;
        }
        return false;
      }
      recordsByKey.set(k, r);
      return true;
    });
    // Snapshot semantics: a lifetime-total record REPLACES this provider's previous
    // snapshot(s) (incl. legacy "usage" balance rows) rather than stacking on top.
    const snaps = new Set(fresh.filter((r) => r.operation === "snapshot").map((r) => r.provider));
    const current = readRecords(STORE);
    const importDays = reconcileImportDayRows(current, accepted);
    if (replacementKeys.size || snaps.size || importDays.superseded.length) {
      const kept = importDays.kept.filter((r) =>
        !replacementKeys.has(syncRecordKey(r))
        && !(snaps.has(r.provider) && (r.operation === "snapshot" || (r.operation === "usage" && r.source === "balance_delta"))));
      writeRecords(STORE, [...kept, ...fresh]);
    } else {
      appendRecords(STORE, fresh);
    }
    total += fresh.length;
    const n = fresh.length;
    const dup = accepted.length - n;
    const freshUsd = fresh.some((record) => record.usdEst != null)
      ? fresh.reduce((sum, record) => sum + (record.usdEst ?? 0), 0)
      : undefined;
    const star = n >= 1000 ? ` ${gold("★")}` : "";
    const dupNote = dup > 0 ? dim(`  (${human(dup)} already tracked)`) : "";
    console.log(`  ${ic} ${t.id.padEnd(13)} ${n ? `${ok("✓")} ${paint(human(n).padStart(6), 200)} new  ${bar(n)}${star}` : dim("· up to date")}${dupNote}`);
    const checkpoint: CollectionCheckpoint = {
      providerId: t.id,
      label: getProvider(t.id)?.label,
      status: n ? "new" : "up_to_date",
      received: records.length,
      accepted: accepted.length,
      fresh: n,
      duplicate: dup,
      usd: freshUsd,
      sourceMix: checkpointSourceMix(fresh),
      hint: n ? "validated records appended to the local ledger" : "no duplicate spend added to the local ledger",
    };
    checkpoints.push(checkpoint);
    await showCollectionCheckpoint(checkpoint);
  }
  await showCollectionEncoreRecap({
    providerIds: targets.map((target) => target.id),
    checkpoints,
    label: "SYNC",
  });
  return {
    id: syncRunId(generatedAt),
    generatedAt,
    storePath: STORE,
    providerIds: targets.map((target) => target.id),
    totalFresh: total,
    checkpoints,
  };
}

type AdapterCtxLike = { getSecret: (k: string) => Promise<string | undefined>; telemetry: { captureError: (e: unknown, c?: { area?: string }) => void; addBreadcrumb: (e: string, d?: Record<string, unknown>, l?: string) => void } };

// Masked key entry — echoes a • per character, never the key itself, and never keeps it in
// terminal scrollback. Falls back to a plain line read when stdin isn't a TTY (pipes/CI).
async function promptSecret(query: string): Promise<string> {
  const stdin = process.stdin;
  process.stdout.write(query);
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    const rl = createInterface({ input: stdin, output: process.stdout });
    const line = await rl.question("");
    rl.close();
    return line.trim();
  }
  return new Promise<string>((resolve) => {
    let buf = "";
    stdin.setRawMode(true);
    stdin.resume();
    const done = (newline: boolean) => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", onData);
      if (newline) process.stdout.write("\n");
      resolve(buf.trim());
    };
    const onData = (d: Buffer) => {
      for (const ch of d.toString("utf8")) {
        if (ch === "\n" || ch === "\r") return done(true);
        if (ch === "\u0003") { done(true); process.exit(130); }                       // Ctrl-C
        if (ch === "\u007f" || ch === "\b") { if (buf) { buf = buf.slice(0, -1); process.stdout.write("\b \b"); } continue; }
        if (ch < " ") continue;                                                        // ignore other control bytes
        buf += ch;
        process.stdout.write(dim("•"));
      }
    };
    stdin.on("data", onData);
  });
}

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : undefined;
}

function multi(argv: string[], name: string): string[] | undefined {
  const v = flag(argv, name);
  return v ? v.split(",").map((s) => s.trim()).filter(Boolean) : undefined;
}

function surpriseProviderIds(argv: string[]): string[] {
  const fromFlag = multi(argv, "--provider");
  const positional = argv[1] && !argv[1].startsWith("-")
    ? argv[1].split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;
  return (fromFlag?.length ? fromFlag : positional?.length ? positional : defaultSyncSurpriseDirectorProviders());
}

function secretReport(findings: ReturnType<typeof scanSecrets>): string {
  if (!findings.length) return "secret scan: clean";
  return [
    `secret scan: ${findings.length} potential secret(s) found`,
    ...findings.slice(0, 12).map((f) => `  - ${f.path} ${f.kind} ${f.preview}`),
  ].join("\n");
}

function emptyUsageState(title: string, detail: string): string {
  return [
    rule(title),
    `  ${dim(detail)}`,
    "",
    `  ${paint("vibetracker init --gui", 190)}     ${dim("guided setup with inline terminal")}`,
    `  ${paint("vibetracker sync --demo", 190)}    ${dim("see a working profile with safe sample data")}`,
    `  ${paint("vibetracker detect", 190)}         ${dim("find Ollama, LM Studio, llama.cpp, Jan, GPT4All")}`,
    `  ${paint("vibetracker import midjourney --images 12345", 190)} ${dim("official /info lifetime total")}`,
  ].join("\n");
}

function localRecordSnapshot(path: string): { count?: number; error?: string } {
  try {
    return { count: readRecords(path).length };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

function writeAdapterScaffold(id: string, root: string, opts: { dryRun?: boolean; force?: boolean } = {}): string[] {
  const files = adapterScaffold(id);
  const written: string[] = [];
  for (const file of files) {
    const out = join(root, file.path);
    if (existsSync(out) && !opts.force) {
      throw new Error(`${file.path} already exists. Re-run with --force to overwrite.`);
    }
    if (!opts.dryRun) {
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, file.content);
    }
    written.push(file.path);
  }
  return written;
}

function anonymousTelemetryPreview(records: ReturnType<typeof readRecords>, cfg: ReturnType<typeof loadConfig>): unknown {
  const stats = computeStats(records);
  return {
    schema: "vibetracker.telemetry-preview/0.1",
    anonymous: true,
    optIn: cfg.anonymousTelemetry === true,
    generatedAt: new Date().toISOString(),
    totals: {
      records: stats.totals.count,
      providers: stats.totals.providers,
      categories: stats.byCategory.map((row) => row.key),
    },
    coverage: {
      mappedProviders: PROVIDERS.length,
      enabledProviders: cfg.enabled.length,
    },
    excludes: ["raw records", "prompts", "model names", "API keys", "handles", "trust signal identities"],
  };
}

// Deep filters shared by `stats` and `total`: --since 30d | --from | --to |
// --provider a,b | --category llm,image | --model gpt | --source local | --min-usd N
function parseFilters(argv: string[]): RecordFilter {
  const since = flag(argv, "--since");
  const minUsd = flag(argv, "--min-usd");
  const domain = flag(argv, "--domain"); // ai | dev | creative
  let providers = multi(argv, "--provider");
  if (domain) {
    const inDomain = providersInDomain(domain as Domain);
    providers = providers ? providers.filter((p) => inDomain.includes(p)) : inDomain;
  }
  return {
    from: since ? parseSince(since) : flag(argv, "--from"),
    to: flag(argv, "--to"),
    providers,
    categories: multi(argv, "--category") as Category[] | undefined,
    models: multi(argv, "--model"),
    sources: multi(argv, "--source") as Source[] | undefined,
    accounts: multi(argv, "--account"),
    profiles: multi(argv, "--profile"),
    teams: multi(argv, "--team"),
    minUsd: minUsd != null ? Number(minUsd) : undefined,
  };
}

function openBrowser(url: string): void {
  const cmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  try {
    const r = spawnSync(cmd, [url], { stdio: "ignore" });
    if (r.error) console.error(`(couldn't open a browser — open the URL above manually)`);
  } catch (err) {
    console.error(`(couldn't open a browser: ${(err as Error).message} — open the URL above)`);
  }
}

async function authorizeOAuthProvider(
  preset: OAuthProviderPreset,
  port: number,
  scope = preset.scope,
): Promise<StoredOAuthCredentials> {
  // A preset with a registered redirect URI wins verbatim (strict-allowlist servers match it
  // exactly); otherwise compose the loopback URI from the requested port.
  const redirectUri = preset.redirectUri ?? `http://127.0.0.1:${port}/callback`;
  const redirect = new URL(redirectUri);
  const callbackPort = Number(redirect.port || port);
  // `localhost` may resolve to ::1 in the browser — listen on all interfaces for that case only
  const callbackHost = redirect.hostname === "localhost" ? null : undefined;
  const bundle = buildOAuthUrl({ ...preset, scope, redirectUri });
  console.log(`OAuth URL for ${preset.provider}: ${bundle.url}`);
  // terminals make long URLs painful to select — put it on the clipboard too
  if (copyToClipboard(bundle.url)) console.log("(the URL is on your clipboard — paste it in any browser if no tab opened)");
  console.log(`listening on ${redirectUri}`);
  const pendingCallback = waitForOAuthCallback({ port: callbackPort, host: callbackHost, state: bundle.state });
  openBrowser(bundle.url);
  const callback = await pendingCallback;
  try {
    const response = await exchangeOAuthCode({
      tokenUrl: preset.tokenUrl,
      clientId: preset.clientId,
      redirectUri,
      code: callback.code,
      verifier: bundle.verifier,
    });
    return validateOAuthCredentialsForPreset(
      preset,
      oauthCredentialsFromTokenResponse(response),
    );
  } finally {
    callback.close();
  }
}

function isImpressAlias(cmd: string): boolean {
  return cmd === "wow" || cmd === "impress" || cmd === "vibe";
}

function fitReceiptValue(value: string, width = 51): string {
  if (value.length <= width) return value.padEnd(width);
  const keep = width - 3;
  const head = Math.max(12, Math.floor(keep * 0.42));
  const tail = keep - head;
  return `${value.slice(0, head)}...${value.slice(value.length - tail)}`;
}

function receiptRow(label: string, value: string): string {
  return `  ${paint("|", 180)} ${label.padEnd(12)} ${fitReceiptValue(value)}${paint("|", 180)}`;
}

function renderImpressLaunchReceipt(paths: { outDir: string }): string {
  const border = paint("+------------------------------------------------------------------+", 180);
  return [
    border,
    `  ${paint("| VTK://IMPRESS//VIBERS-UNITE//C0VIBE.APP//ZERO-SIDEFX       |", 180)}`,
    `  ${paint("|", 180)} ${gold("VIBERS UNITE ROOM")} ${dim("armed as the first-open target")}                    ${paint("|", 180)}`,
    `  ${paint("|", 180)} ${paint("HF", 180)} prism  ${paint("CX", 190)} cube  ${paint("GH", 150)} official heatgrid  ${paint("C0", 165)} relay hold             ${paint("|", 180)}`,
    `  ${paint("|", 180)} providerCalls=0  usageWrites=0  uploads=0  secretsRead=0         ${paint("|", 180)}`,
    `  ${paint("|", 180)} trust stays NOT USAGE // score delta +0 // no hidden network      ${paint("|", 180)}`,
    receiptRow("open file:", "studio/vibers-unite-room.html"),
    receiptRow("kit index:", "index.html"),
    receiptRow("folder:", paths.outDir),
    border,
  ].join("\n");
}

// Copy text to the OS clipboard, best-effort across platforms. Returns true only if a copier
// actually ran without error — so "Load unpacked" becomes a paste instead of typing a long path.
// Never throws: a missing clipboard tool must not stop the bridge from serving.
function copyToClipboard(text: string): boolean {
  const tries: Array<[string, string[]]> = process.platform === "darwin"
    ? [["pbcopy", []]]
    : process.platform === "win32"
      ? [["clip", []]]
      : [["wl-copy", []], ["xclip", ["-selection", "clipboard"]], ["xsel", ["--clipboard", "--input"]]];
  for (const [bin, cmdArgs] of tries) {
    try {
      const r = spawnSync(bin, cmdArgs, { input: text, stdio: ["pipe", "ignore", "ignore"], timeout: 2000 });
      if (!r.error && r.status === 0) return true;
    } catch { /* this copier isn't installed — try the next */ }
  }
  return false;
}

// The dependency wiring the bridge needs — identical for `start` and `api serve`. Reads/writes the
// local ledger, dedupes snapshots, and stores one-click cookie connects straight to the keyring
// (values never logged). Factored out so the two commands can't drift apart. `ctx` powers the
// extension's "Sync now" (same adapter pass as `vibetracker sync`).
function bridgeDeps(ctx: AdapterCtxLike): LocalApiDeps {
  // Lazily resolve the active user's public handle ONCE per server run: explicit config handle
  // first, then the gh CLI identity (matches where keyring-auth uploads actually land).
  let profileHandle: string | null | undefined;
  const resolveHandle = (): string | null => {
    if (profileHandle !== undefined) return profileHandle;
    try {
      const cfg = loadConfig();
      if (cfg.handle) return (profileHandle = cfg.handle);
    } catch { profileHandle = null; }
    try {
      const r = spawnSync("gh", ["api", "user", "-q", ".login"], { encoding: "utf8", timeout: 4000 });
      const login = r.status === 0 ? r.stdout.trim() : "";
      profileHandle = login ? login.toLowerCase() : null;
    } catch { profileHandle = null; }
    return profileHandle ?? null;
  };
  let syncBusy = false;
  return {
    // Extension "Sync now": one overlap-guarded adapter pass; concurrent presses coalesce.
    runSync: async () => {
      if (syncBusy) return { fresh: 0, targets: 0 };
      syncBusy = true;
      try {
        const targets = await configTargets();
        if (!targets.length) return { fresh: 0, targets: 0 };
        const summary = await syncTargets(targets, ctx);
        return { fresh: summary.totalFresh, targets: targets.length };
      } finally {
        syncBusy = false;
      }
    },
    // The active user's public VibeUsage profile for the extension's profile button.
    profile: () => {
      const handle = resolveHandle();
      return { handle, url: handle ? `${DEFAULT_DASHBOARD_ORIGIN}/u/${handle}` : DEFAULT_DASHBOARD_ORIGIN };
    },
    readRecords: () => readRecords(STORE),
    appendRecords: (records) => appendRecords(STORE, records),
    // Snapshot dedupe: a lifetime/balance read replaces the prior same provider+operation record.
    replaceSnapshot: (record) => {
      const kept = readRecords(STORE).filter((r) => !(r.source === "manual" && r.provider === record.provider && r.operation === record.operation));
      writeRecords(STORE, [...kept, record]);
    },
    log: (line) => console.log(line),
    // One-click connect from the browser extension: store the cookie in the keyring exactly as
    // `vibetracker connect` would. The value is written straight to the keyring and never logged.
    // cynaps3 is special (first-party headless connect): the handed-over Clerk session token is
    // redeemed IMMEDIATELY for rotating OAuth credentials — the token lives ~60s.
    connectProvider: async (provider, fields) => {
      const cfg = loadConfig();
      if (provider === "cynaps3" && fields.clerkToken) {
        const credentials = await redeemCynaps3WithClerkToken(fields.clerkToken);
        const keyring = storeProviderCreds(cfg, "cynaps3", credentials as unknown as Record<string, string>);
        if (!cfg.enabled.includes("cynaps3")) cfg.enabled.push("cynaps3");
        saveConfig(cfg);
        return { stored: Object.keys(credentials), keyring };
      }
      const keyring = storeProviderCreds(cfg, provider, fields);
      if (!cfg.enabled.includes(provider)) cfg.enabled.push(provider);
      saveConfig(cfg);
      return { stored: Object.keys(fields), keyring };
    },
    // Source-board state for the extension grid: which providers have local data / are connected.
    // Booleans + a timestamp only — usage counts and values never cross this endpoint.
    sourceStatus: () => {
      const status: Record<string, { hasData: boolean; connected: boolean; lastTs?: string }> = {};
      for (const record of readRecords(STORE)) {
        const cur = (status[record.provider] ??= { hasData: false, connected: false });
        cur.hasData = true;
        if (!cur.lastTs || record.ts > cur.lastTs) cur.lastTs = record.ts;
      }
      for (const id of loadConfig().enabled ?? []) {
        (status[id] ??= { hasData: false, connected: false }).connected = true;
      }
      return status;
    },
  };
}

// Bind the bridge on a free port. An explicit `--port` is honored exactly (fail loudly on
// collision). Otherwise walk BRIDGE_PORTS and take the first FREE one, so a busy 8765 (watchdog_bd
// and friends) self-heals to 8799/8787/8123 instead of dead-ending with EADDRINUSE. The extension
// probes the same list, so discovery stays consistent without any config.
async function serveBridgeOnFreePort(requestedPort: number | null, ctx: AdapterCtxLike): Promise<LocalApiSession> {
  const candidates = requestedPort ? [requestedPort] : BRIDGE_PORTS;
  let lastErr: unknown;
  for (const port of candidates) {
    try {
      return await startLocalApiServer({ port, deps: bridgeDeps(ctx) });
    } catch (err) {
      lastErr = err;
      if ((err as NodeJS.ErrnoException)?.code === "EADDRINUSE" && !requestedPort) {
        console.log(dim(`  port ${port} is busy — trying the next candidate…`));
        continue;
      }
      throw err;
    }
  }
  throw lastErr ?? new Error("no free bridge port among " + BRIDGE_PORTS.join(", "));
}

async function main() {
  const argv = process.argv.slice(2);
  // First run (no config yet) → onboarding wizard; otherwise → your totals.
  const cmd = argv[0] ?? (existsSync(CONFIG_PATH) ? "total" : "init");
  // Quiet telemetry for a clean UI: surface real errors, suppress info breadcrumbs.
  const ctx = {
    getSecret: async () => undefined,
    telemetry: {
      // Errors are surfaced cleanly, once, by syncTargets — keep telemetry quiet so we don't
      // also dump the raw provider error (giant JSON) to the screen.
      captureError: () => {},
      addBreadcrumb: () => {},
    },
  };

  if (cmd === "help" || cmd === "--help" || cmd === "-h") { console.log(USAGE); return; }

  if (cmd === "splash" || cmd === "banner") { await showBanner(); return; }

  if (cmd === "demo" || cmd === "showcase" || cmd === "tour") {
    if (argv.includes("--html")) {
      const out = flag(argv, "--out") ?? join(homedir(), ".vibetracker", "showcase.html");
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, renderShowcaseHtml({ compact: argv.includes("--compact") }));
      console.log(`  ${ok("✓")} wrote ${out}`);
      console.log(`  ${dim("offline static showcase; no provider calls, upload, scripts, or secret reads")}`);
      return;
    }
    console.log(renderShowcase({ compact: argv.includes("--compact") }));
    return;
  }

  if (cmd === "badge" || cmd === "poster") {
    const cfg = (() => {
      try { return loadConfig(); }
      catch { return { handle: undefined }; }
    })();
    const records = filterRecords(readRecords(STORE), parseFilters(argv));
    const trustSignals = collectTrustSignals();
    const handle = flag(argv, "--handle") || cfg.handle || "local";
    const out = flag(argv, "--out") ?? join(homedir(), ".vibetracker", "vibetracker-badge.svg");
    const svg = renderShareBadgeSvg(records, trustSignals, { handle });
    if (argv.includes("--stdout")) {
      console.log(svg);
    } else {
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, svg);
      console.log(`  ${ok("✓")} badge → ${dim(out)}`);
      console.log(`  ${dim("static SVG; no scripts, no provider calls, trust labels stay separate")}`);
    }
    if (argv.includes("--markdown")) console.log(renderShareBadgeMarkdown(argv.includes("--stdout") ? "vibetracker-badge.svg" : out, { handle }));
    return;
  }

  if (cmd === "doctor" || cmd === "health" || cmd === "status") {
    const cfgState = (() => {
      try {
        return { config: loadConfig(), valid: true };
      } catch (err) {
        return { config: { enabled: [] }, valid: false, error: (err as Error).message };
      }
    })();
    const records = localRecordSnapshot(STORE);
    const encryptedPath = join(homedir(), ".vibetracker", "records.jsonl.enc");
    console.log(renderDoctorReport({
      configPath: CONFIG_PATH,
      configExists: existsSync(CONFIG_PATH),
      configValid: cfgState.valid,
      ...(cfgState.error ? { configError: cfgState.error } : {}),
      enabledProviders: cfgState.config.enabled,
      hasC0VibeToken: Boolean(cfgState.config.token),
      hasUploadUrl: Boolean(cfgState.config.uploadUrl || process.env.VT_UPLOAD_URL),
      storePath: STORE,
      storeExists: existsSync(STORE),
      encryptedStoreExists: existsSync(encryptedPath),
      storeEncrypted: STORE.endsWith(".enc"),
      ...(records.count != null ? { recordCount: records.count } : {}),
      ...(records.error ? { recordReadError: records.error } : {}),
      browserExtensionPath: browserExtensionDir(),
      browserExtensionExists: existsSync(join(browserExtensionDir(), "manifest.json")),
      pluginsPath: pluginsDir(),
      pluginsDirExists: existsSync(join(pluginsDir(), "manifest.schema.json")),
      providers: PROVIDERS,
      localEndpointCount: LOCAL_ENDPOINTS.length,
      localApiPort: Number(flag(argv, "--port") || BRIDGE_PORTS[0]),
      includeSurprisePreview: !argv.includes("--compact"),
    }));
    return;
  }

  if (cmd === "surprises" || cmd === "surprise" || cmd === "motion") {
    const providerIds = surpriseProviderIds(argv);
    if (argv.includes("--html")) {
      const out = flag(argv, "--out") ?? join(homedir(), ".vibetracker", "surprise-reel.html");
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, renderSyncSurpriseDirectorHtml(providerIds));
      console.log(`  ${ok("✓")} surprise reel → ${dim(out)}`);
      console.log(`  ${dim("static HTML; no scripts, no provider calls, no writes, no uploads, no secret reads")}`);
      if (argv.includes("--open")) openBrowser(out);
      return;
    }
    if (argv.includes("--json")) {
      console.log(JSON.stringify({
        schema: "vibetracker.surprise-preview/0.1",
        safePreview: true,
        providerIds,
        writes: false,
        uploads: false,
        providerCalls: false,
        secretsRead: false,
      }, null, 2));
      return;
    }
    if (argv.includes("--static") || !shouldShowSyncSurprises({ plain: argv.includes("--plain") })) {
      console.log(renderSyncSurpriseDirectorPreview(providerIds));
      return;
    }
    console.log(renderSyncSurpriseDirectorPreview(providerIds).split("\n").slice(0, 8).join("\n"));
    await showSyncSurpriseQueue(providerIds);
    await showCollectionCascade({ providerIds, label: "SAFE-PREVIEW" });
    for (const [index, providerId] of providerIds.slice(0, 4).entries()) {
      await showProviderScanBeat({
        providerId,
        label: getProvider(providerId)?.label,
        index,
        total: Math.min(4, providerIds.length),
      });
    }
    await showCollectionEncoreRecap({ providerIds, checkpoints: [], label: "SAFE-PREVIEW" });
    return;
  }

  if (cmd === "cockpit" || cmd === "commands" || cmd === "command-center") {
    if (argv.includes("--json")) {
      console.log(JSON.stringify(commandCockpitPayload(), null, 2));
      return;
    }
    if (argv.includes("--html")) {
      const out = flag(argv, "--out") ?? join(homedir(), ".vibetracker", "command-cockpit.html");
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, renderCommandCockpitHtml());
      console.log(`  ${ok("✓")} command cockpit → ${dim(out)}`);
      console.log(`  ${dim("static HTML; no scripts, no provider calls, no writes, no uploads, no secret reads")}`);
      if (argv.includes("--open")) openBrowser(out);
      return;
    }
    console.log(renderCommandCockpit());
    return;
  }

  if (cmd === "studio" || cmd === "studio-pack" || cmd === "tour-pack") {
    const files = buildStudioPackFiles({ providerIds: surpriseProviderIds(argv) });
    if (argv.includes("--json")) {
      console.log(JSON.stringify(studioPackManifest(files), null, 2));
      return;
    }
    const outDir = flag(argv, "--out") ?? join(homedir(), ".vibetracker", "studio");
    for (const file of files) {
      const out = join(outDir, file.path);
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, file.content);
    }
    const index = join(outDir, "index.html");
    const uniteRoom = join(outDir, "vibers-unite-room.html");
    const motionLab = join(outDir, "ascii-motion-lab.html");
    const trustHeatgrid = join(outDir, "github-trust-heatgrid.html");
    const scoreReactor = join(outDir, "vibe-score-reactor.html");
    const localRadar = join(outDir, "local-ai-radar.html");
    console.log(`  ${ok("✓")} studio pack -> ${dim(outDir)}`);
    console.log(`  ${dim("static HTML pack; no scripts, no provider calls, no writes, no uploads, no secret reads")}`);
    console.log(`  ${dim("open:")} ${index}`);
    console.log(`  ${dim("unite room:")} ${uniteRoom}`);
    console.log(`  ${dim("motion lab:")} ${motionLab}`);
    console.log(`  ${dim("trust heatgrid:")} ${trustHeatgrid}`);
    console.log(`  ${dim("score reactor:")} ${scoreReactor}`);
    console.log(`  ${dim("local radar:")} ${localRadar}`);
    if (argv.includes("--open")) openBrowser(index);
    return;
  }

  if (cmd === "launch-kit" || cmd === "kit" || cmd === "wow" || cmd === "impress" || cmd === "vibe") {
    const generatedAt = new Date().toISOString();
    const files = buildLaunchKitFiles({ providerIds: surpriseProviderIds(argv), generatedAt });
    if (argv.includes("--json")) {
      const manifest = files.find((file) => file.path === "manifest.json");
      if (!manifest) throw new Error("launch kit manifest was not generated");
      process.stdout.write(manifest.content);
      return;
    }
    const outDir = flag(argv, "--out") ?? join(homedir(), ".vibetracker", "launch-kit");
    for (const file of files) {
      const out = join(outDir, file.path);
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, file.content);
    }
    const index = join(outDir, "index.html");
    const operatorShow = join(outDir, "operator-show.html");
    const uniteRoom = join(outDir, "studio", "vibers-unite-room.html");
    const motionLab = join(outDir, "studio", "ascii-motion-lab.html");
    const trustHeatgrid = join(outDir, "studio", "github-trust-heatgrid.html");
    const scoreReactor = join(outDir, "studio", "vibe-score-reactor.html");
    const ossMotion = join(outDir, "studio", "oss-motion-receipt.html");
    const localRadar = join(outDir, "studio", "local-ai-radar.html");
    const shareBadge = join(outDir, "share", "vibetracker-badge.svg");
    const badgeMarkdown = join(outDir, "share", "badge.md");
    const sharePoster = join(outDir, "share", "vibetracker-poster.svg");
    const posterMarkdown = join(outDir, "share", "poster.md");
    const receipt = join(outDir, "receipt", "sync-receipt.html");
    const manifest = join(outDir, "manifest.json");
    const openTarget = cmd === "launch-kit" || cmd === "kit" ? index : uniteRoom;
    if (isImpressAlias(cmd) && !argv.includes("--plain")) {
      console.log(renderImpressLaunchReceipt({ outDir }));
    }
    console.log(`  ${ok("✓")} launch kit -> ${dim(outDir)}`);
    console.log(`  ${dim("offline demo pack; no provider calls, no usage writes, no uploads, no secret reads")}`);
    console.log(`  ${dim("open:")} ${index}`);
    console.log(`  ${dim("open target:")} ${openTarget}`);
    console.log(`  ${dim("show:")} ${operatorShow}`);
    console.log(`  ${dim("unite room:")} ${uniteRoom}`);
    console.log(`  ${dim("motion lab:")} ${motionLab}`);
    console.log(`  ${dim("trust heatgrid:")} ${trustHeatgrid}`);
    console.log(`  ${dim("score reactor:")} ${scoreReactor}`);
    console.log(`  ${dim("oss frames:")} ${ossMotion}`);
    console.log(`  ${dim("local radar:")} ${localRadar}`);
    console.log(`  ${dim("share badge:")} ${shareBadge}`);
    console.log(`  ${dim("badge markdown:")} ${badgeMarkdown}`);
    console.log(`  ${dim("share poster:")} ${sharePoster}`);
    console.log(`  ${dim("poster markdown:")} ${posterMarkdown}`);
    console.log(`  ${dim("receipt:")} ${receipt}`);
    console.log(`  ${dim("manifest:")} ${manifest}`);
    console.log(`  ${dim("real path:")} vibetracker sync --receipt --out ~/.vibetracker/receipts/<run>`);
    if (argv.includes("--open")) openBrowser(openTarget);
    return;
  }

  if (cmd === "import" && argv[1] === "viberank") {
    const handle = argv[2];
    if (!handle) { console.log(`usage: vibetracker import viberank <github-handle>`); return; }
    await showSyncSurpriseQueue(["codex", "claude-code", "gemini-cli"]);
    await showProviderScanBeat({
      providerId: "codex-cli",
      label: "Viberank coding profile",
      index: 0,
      total: 1,
    });
    let prof;
    try {
      prof = await withSpinner(`fetching viberank.app/profile/${handle}`, () => fetchViberankProfile(handle));
    } catch (err) { console.error(`  ${bad("✗")} ${(err as Error).message}`); return; }

    // Decompose the viberank history into REAL provider records (codex / claude-code /
    // gemini-cli, all AI Coding) from the page's per-model cost breakdown — no fake
    // "viberank-history" provider. The end of the active range is injected HERE (never inside
    // the pure decomposer): the profile's last-updated date, else today.
    const endISO = (flag(argv, "--until") ?? prof.lastUpdated ?? new Date().toISOString()).slice(0, 10);
    const recs = decomposeViberank(
      { handle, total: prof.usd, joined: prof.joined, lastUpdated: prof.lastUpdated, models: prof.models },
      { end: endISO },
    );
    if (!recs.length) {
      console.error(`  ${bad("✗")} viberank returned no per-model spend for ${handle} — nothing to import.`);
      return;
    }

    // Purge prior imported rows so a re-run REPLACES rather than stacks:
    //  · legacy fake provider "viberank-history" (old importer), unconditionally, and
    //  · prior runs of THIS path — coding-category "feed_recon" rows.
    // Scoped to coding on purpose: "feed_recon" is shared with media adapters
    // (suno/udio/luma/kling → music/video/image), whose real rows must survive.
    const kept = readRecords(STORE).filter((r) =>
      r.provider !== VIBERANK_PROVIDER && !(r.source === "feed_recon" && r.category === "coding"));
    writeRecords(STORE, [...kept, ...recs]);

    const totalUsd = recs.reduce((a, r) => a + (r.usdEst || 0), 0);
    const nModels = new Set(recs.map((r) => r.model)).size;
    const nDays = new Set(recs.map((r) => r.ts)).size;
    const byProvider = [...new Set(recs.map((r) => r.provider))].sort();
    console.log(`imported ${handle}: $${Math.round(totalUsd).toLocaleString("en-US")} across ${nModels} models over ${nDays} days, as AI Coding (reconstructed from viberank, source feed_recon, low confidence)`);
    console.log(`  ${dim(`providers: ${byProvider.join(" · ")} · ${(prof.joined ?? endISO).slice(0, 10)} → ${endISO}`)}`);
    await showCollectionCheckpoint({
      providerId: "codex",
      label: "Viberank coding history",
      status: "new",
      received: recs.length,
      accepted: recs.length,
      fresh: recs.length,
      duplicate: 0,
      usd: totalUsd,
      sourceMix: checkpointSourceMix(recs),
      hint: "viberank coding history decomposed into real providers (feed_recon, low confidence)",
    });
    return;
  }

  if (cmd === "import" && argv[1] === "midjourney") {
    const imagesFlag = flag(argv, "--images");
    const infoPath = flag(argv, "--info");
    let images = imagesFlag != null ? Number(imagesFlag.replace(/,/g, "")) : undefined;
    if (infoPath) {
      let infoText: string;
      try {
        infoText = infoPath === "-" ? readFileSync(0, "utf8") : readFileSync(infoPath, "utf8");
      } catch (err) {
        console.error(`  ${bad("✗")} could not read Midjourney /info text: ${(err as Error).message}`);
        return;
      }
      const parsed = parseMidjourneyInfo(infoText);
      if (parsed == null) {
        console.error(`  ${bad("✗")} could not find "Lifetime Usage ... images" in ${infoPath === "-" ? "stdin" : infoPath}`);
        return;
      }
      if (images != null && images !== parsed) {
        console.error(`  ${bad("✗")} --images (${images}) does not match the /info total (${parsed})`);
        return;
      }
      images = parsed;
    }
    if (images == null) {
      console.log("usage: vibetracker import midjourney --images <lifetime-images> [--info path|-] [--as-of YYYY-MM-DD] [--usd <lifetime-spend>]");
      console.log("  In Discord, run Midjourney /info and copy the Lifetime Usage image count. No cookie is needed or accepted.");
      return;
    }
    const usdFlag = flag(argv, "--usd");
    let record;
    try {
      record = buildMidjourneyLifetimeRecord({
        images,
        asOf: flag(argv, "--as-of") ?? new Date().toISOString(),
        ...(usdFlag != null ? { usdEst: Number(usdFlag) } : {}),
        ...(flag(argv, "--account") ? { accountId: flag(argv, "--account") } : {}),
        ...(flag(argv, "--profile") ? { profileId: flag(argv, "--profile") } : {}),
        ...(flag(argv, "--team") ? { teamId: flag(argv, "--team") } : {}),
      });
    } catch (err) {
      console.error(`  ${bad("✗")} ${(err as Error).message}`);
      return;
    }
    const { accepted, rejected } = ingestRecords([record], { untrustedSource: true });
    if (!accepted.length) {
      console.error(`  ${bad("✗")} Midjourney lifetime total was rejected: ${rejected[0]?.errors.join(", ")}`);
      return;
    }
    const kept = readRecords(STORE).filter((item) => !isMidjourneyLifetimeImport(item));
    writeRecords(STORE, [...kept, ...accepted]);
    console.log(`  ${ok("✓")} Midjourney lifetime total: ${images.toLocaleString("en-US")} images counted`);
    console.log(`  ${dim("source: official /info total entered locally · manual · low confidence · re-import replaces this snapshot")}`);
    console.log(`  ${dim("next:")} ${paint("vibetracker total --provider midjourney", 190)}`);
    await showCollectionCheckpoint({
      providerId: "midjourney",
      label: "Midjourney lifetime images",
      status: "new",
      received: 1,
      accepted: 1,
      fresh: 1,
      duplicate: 0,
      usd: record.usdEst ?? 0,
      sourceMix: checkpointSourceMix(accepted),
      hint: `${images.toLocaleString("en-US")} lifetime images from the user-entered official /info total`,
    });
    return;
  }

  if (cmd === "import") {
    const arg = argv[1] && !argv[1].startsWith("-") ? argv[1] : undefined;
    const src = arg ?? findCcJson();
    if (!src || !existsSync(src)) {
      console.log(`cc.json not found. Export it with ccusage, then:  ${paint("vibetracker import <path/to/cc.json>", 190)}`);
      return;
    }
    let cc: unknown;
    try { cc = JSON.parse(readFileSync(src, "utf8")); }
    catch (err) { console.error(`  ${bad("✗")} could not read ${src}: ${(err as Error).message}`); return; }
    const recs = ccusageToRecords(cc as never);
    if (!recs.length) { console.log("  no usable records in that file."); return; }
    const providerIds = [...new Set(recs.map((record) => record.provider))];
    await showSyncSurpriseQueue(providerIds);
    await showCollectionCascade({ providerIds, label: "IMPORT" });
    const dominant = dominantProvider(recs);
    if (dominant) {
      await showProviderScanBeat({
        providerId: dominant.provider,
        label: getProvider(dominant.provider)?.label,
        index: 0,
        total: providerIds.length,
      });
    }
    // Replace the coding-agent history so we never double-count the live-log sync.
    const kept = readRecords(STORE).filter((r) => !CCUSAGE_PROVIDERS.includes(r.provider));
    const { accepted } = ingestRecords(recs, { untrustedSource: false });
    writeRecords(STORE, [...kept, ...accepted]);
    const tokens = accepted.reduce((a, r) => a + (r.rawAmount || 0), 0);
    const usd = accepted.reduce((a, r) => a + (r.usdEst || 0), 0);
    console.log(`  ${ok("✓")} imported ${human(accepted.length)} day·model records from ${dim(src)}`);
    console.log(`  ${paint(`${(tokens / 1e9).toFixed(1)}B tokens`, 190)} ${dim("·")} ${gold("$" + Math.round(usd).toLocaleString("en-US"))} ${dim("all-time · now run")} ${paint("vibetracker profile", 190)}`);
    await showCollectionCheckpoint({
      providerId: dominant?.provider ?? "claude-code",
      label: dominant?.provider ? getProvider(dominant.provider)?.label : "ccusage import",
      status: accepted.length ? "new" : "up_to_date",
      received: recs.length,
      accepted: accepted.length,
      fresh: accepted.length,
      duplicate: 0,
      usd,
      sourceMix: checkpointSourceMix(accepted),
      hint: "ccusage coding-agent history imported into the local ledger",
    });
    return;
  }

  if (cmd === "mission" || cmd === "pulse" || cmd === "now") {
    const result = resolveMissionCommand({
      argv,
      records: filterRecords(readRecords(STORE), parseFilters(argv)),
      trustSignals: argv.includes("--no-trust") ? [] : collectTrustSignals(),
      defaultHtmlPath: join(homedir(), ".vibetracker", "mission-control.html"),
    });
    if (result.kind === "stdout") {
      console.log(result.text);
      return;
    }
    mkdirSync(dirname(result.path), { recursive: true });
    writeFileSync(result.path, result.html);
    console.log(`  ${ok("✓")} mission control → ${dim(result.path)}`);
    console.log(`  ${dim("static HTML; ledger read-only, no usage writes, no uploads, no scripts")}`);
    if (result.open) openBrowser(result.path);
    return;
  }

  if (cmd === "live" || cmd === "watch") {
    const options = parseLiveConsoleOptions(argv, process.stdout.isTTY === true);
    const trustSignals = options.trustEnabled ? collectTrustSignals() : [];
    let frame = 0;
    const draw = () => {
      const output = buildLiveConsoleFrame({
        records: filterRecords(readRecords(STORE), parseFilters(argv)),
        trustSignals,
        budgetUsd: options.budgetUsd,
        frame: ++frame,
        intervalSeconds: options.intervalSeconds,
        mode: options.once ? "snapshot" : "watch",
      });
      if (options.once) console.log(output);
      else process.stdout.write(`\x1b[H\x1b[2J${output}\n`);
    };

    if (options.once) {
      draw();
      return;
    }

    process.stdout.write("\x1b[?1049h");
    try {
      draw();
      await new Promise<void>((resolve, reject) => {
        let settled = false;
        const tick = () => {
          try { draw(); }
          catch (error) { finish(error); }
        };
        const timer = setInterval(tick, options.intervalSeconds * 1_000);
        const cleanup = () => {
          clearInterval(timer);
          process.off("SIGINT", stop);
          process.off("SIGTERM", stop);
        };
        const finish = (error?: unknown) => {
          if (settled) return;
          settled = true;
          cleanup();
          if (error != null) reject(error);
          else resolve();
        };
        const stop = () => finish();
        process.once("SIGINT", stop);
        process.once("SIGTERM", stop);
      });
    } finally {
      process.stdout.write("\x1b[?1049l");
    }
    return;
  }

  if (cmd === "compare" || cmd === "delta" || cmd === "trend") {
    const result = resolveUsageCompareCommand({
      argv,
      records: filterRecords(readRecords(STORE), parseFilters(argv)),
      defaultHtmlPath: join(homedir(), ".vibetracker", "usage-compare.html"),
    });
    if (result.kind === "stdout") {
      console.log(result.text);
      return;
    }
    mkdirSync(dirname(result.path), { recursive: true });
    writeFileSync(result.path, result.html);
    console.log(`  ${ok("✓")} usage comparison → ${dim(result.path)}`);
    console.log(`  ${dim("static HTML; ledger read-only, no usage writes, no uploads, no scripts")}`);
    if (result.open) openBrowser(result.path);
    return;
  }

  if (cmd === "life") {
    if (argv.includes("--demo")) {
      console.log(renderLifeCommand({ ...lifeDemoInput(), providers: PROVIDERS }));
      return;
    }
    const records = readRecords(STORE);
    const trustSignals = collectTrustSignals();
    console.log(renderLifeCommand({ records, trustSignals, providers: PROVIDERS }));
    if (!records.length) return;
    const html = renderProfileHtml(records, trustSignals, loadRoiNotes(ROI_NOTES));
    const out = join(homedir(), ".vibetracker", "life.html");
    writeFileSync(out, html);
    console.log(`  ${ok("✓")} life dashboard → ${dim(out)}`);
    if (trustSignals.length) console.log(`  ${dim("trust signal:")} ${paint(trustSignalSummary(trustSignals), 190)}`);
    const opener = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
    spawnSync(opener, [out], { stdio: "ignore" });
    console.log(`  ${dim("opened in your browser · re-run anytime for fresh numbers")}`);
    return;
  }

  if (cmd === "profile") {
    // `profile --bio "..."` sets the bio; `--parallel-agents N` / `--subs "..."` self-report the
    // truths the usage data can't reveal. All upload on your next `vibetracker upload`.
    const bioFlag = flag(argv, "--bio");
    const agentsFlag = flag(argv, "--parallel-agents");
    const subsFlag = flag(argv, "--subs");
    const clears = argv.includes("--clear-bio") || argv.includes("--clear-agents") || argv.includes("--clear-subs");
    if (bioFlag !== undefined || agentsFlag !== undefined || subsFlag !== undefined || clears) {
      const cfg = loadConfig();
      if (bioFlag !== undefined || argv.includes("--clear-bio")) {
        cfg.bio = argv.includes("--clear-bio") ? undefined : bioFlag!.replace(/\s+/g, " ").trim().slice(0, 280) || undefined;
      }
      if (agentsFlag !== undefined || argv.includes("--clear-agents")) {
        const n = Math.floor(Number(agentsFlag));
        cfg.parallelAgents = argv.includes("--clear-agents") || !(Number.isFinite(n) && n > 0 && n <= 1000) ? undefined : n;
      }
      if (subsFlag !== undefined || argv.includes("--clear-subs")) {
        cfg.subs = argv.includes("--clear-subs") ? undefined : subsFlag!.replace(/\s+/g, " ").trim().slice(0, 200) || undefined;
      }
      saveConfig(cfg);
      console.log(`  ${ok("✓")} profile self-report saved — uploads on your next \`vibetracker upload\``);
      if (cfg.parallelAgents) console.log(`    ${dim("parallel agents:")} ${cfg.parallelAgents}`);
      if (cfg.subs) console.log(`    ${dim("subscription stack:")} ${cfg.subs}`);
      return;
    }
    const records = readRecords(STORE);
    if (!records.length) { console.log(emptyUsageState("PROFILE READY", "No usage records yet. Connect, import, proxy, or add one source first.")); return; }
    const trustSignals = collectTrustSignals();
    const html = renderProfileHtml(records, trustSignals, loadRoiNotes(ROI_NOTES));
    const out = join(homedir(), ".vibetracker", "profile.html");
    writeFileSync(out, html);
    console.log(`  ${ok("✓")} profile → ${dim(out)}`);
    if (trustSignals.length) console.log(`  ${dim("trust signal:")} ${paint(trustSignalSummary(trustSignals), 190)}`);
    const opener = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
    spawnSync(opener, [out], { stdio: "ignore" });
    console.log(`  ${dim("opened in your browser · re-run anytime for fresh numbers")}`);
    return;
  }

  if (cmd === "trust" && argv[1] === "add") {
    const platform = argv[2] as CreatorPlatform | undefined;
    const valid = new Set(["youtube", "x", "linkedin", "huggingface", "npm", "pypi"]);
    const handle = flag(argv, "--handle");
    const metric = flag(argv, "--metric") || "activity";
    const count = Number(flag(argv, "--count"));
    if (!platform || !valid.has(platform) || !handle || !Number.isFinite(count)) {
      console.error("usage: vibetracker trust add youtube|x|linkedin|huggingface|npm|pypi --handle <id> --metric <name> --count <n> [--url u] [--window days]");
      process.exit(2);
    }
    const signal = createCreatorActivityTrustSignal({
      platform,
      handle,
      metric,
      count,
      url: flag(argv, "--url"),
      windowDays: flag(argv, "--window") ? Number(flag(argv, "--window")) : undefined,
    });
    saveManualTrustSignal(signal);
    console.log(`  ${ok("✓")} saved ${platform} trust signal for @${handle} · NOT USAGE`);
    return;
  }

  if (cmd === "trust" && argv[1] === "list") {
    const signals = collectTrustSignals();
    if (argv.includes("--json")) { console.log(JSON.stringify(signals, null, 2)); return; }
    console.log(signals.length ? trustSignalSummary(signals) : "No trust signals available yet.");
    return;
  }

  if (cmd === "audit" || cmd === "trust") {
    const records = filterRecords(readRecords(STORE), parseFilters(argv));
    const trustSignals = collectTrustSignals();
    const audit = buildUsageAudit({ records, providers: PROVIDERS, config: loadConfig(), trustSignals });
    if (argv.includes("--json")) { console.log(JSON.stringify(audit, null, 2)); return; }
    console.log(renderUsageAudit(audit));
    return;
  }

  if (cmd === "roadmap" || cmd === "capabilities") {
    if (argv.includes("--json")) { console.log(JSON.stringify(roadmapJson(), null, 2)); return; }
    console.log(renderAcceptedRoadmap({ group: flag(argv, "--group") }));
    return;
  }

  if (cmd === "privacy") {
    console.log(renderPrivacyScreen());
    return;
  }

  if (cmd === "detect") {
    const target = flag(argv, "--target") || flag(argv, "--url");
    if (target) {
      await showSyncSurpriseQueue([flag(argv, "--provider") || "openai-compatible"], {
        json: argv.includes("--json"),
        plain: argv.includes("--plain"),
      });
      const status = await detectOpenAICompatible(target, { provider: flag(argv, "--provider") });
      if (argv.includes("--json")) { console.log(JSON.stringify(status, null, 2)); return; }
      console.log(renderOpenAICompatibleDetection(status));
      return;
    }
    await showSyncSurpriseQueue(LOCAL_ENDPOINTS.map((endpoint) => endpoint.id), {
      json: argv.includes("--json"),
      plain: argv.includes("--plain"),
    });
    const statuses = await detectLocalEndpoints();
    if (argv.includes("--json")) { console.log(JSON.stringify(localDetectionSnapshot(statuses), null, 2)); return; }
    if (argv.includes("--html")) {
      const out = flag(argv, "--out") ?? join(homedir(), ".vibetracker", "local-ai-radar.html");
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, renderLocalDetectionHtml(statuses));
      console.log(`  ${ok("✓")} local AI radar -> ${dim(out)}`);
      console.log(`  ${dim("static HTML; loopback probes only, no usage writes, no uploads, no secret reads")}`);
      if (argv.includes("--open")) openBrowser(out);
      return;
    }
    console.log(renderLocalDetection(statuses));
    return;
  }

  if (cmd === "insights") {
    const records = filterRecords(readRecords(STORE), parseFilters(argv));
    const budget = flag(argv, "--budget");
    const insights = computeUsageInsights(records, { budgetUsd: budget != null ? Number(budget) : undefined });
    if (argv.includes("--json")) { console.log(JSON.stringify(insights, null, 2)); return; }
    console.log(renderInsights(insights));
    return;
  }

  if (cmd === "telemetry") {
    const cfg = loadConfig();
    if (argv[1] === "opt-in") {
      cfg.anonymousTelemetry = true;
      saveConfig(cfg);
      console.log("anonymous telemetry opt-in enabled. Run `vibetracker telemetry preview` to inspect the aggregate payload.");
      return;
    }
    if (argv[1] === "opt-out") {
      cfg.anonymousTelemetry = false;
      saveConfig(cfg);
      console.log("anonymous telemetry opt-in disabled.");
      return;
    }
    if (argv[1] === "preview") {
      // redactSecrets (core deep-redactor) is defence-in-depth: this preview holds no creds, but any
      // dump that could ever include one is passed through the guard so a secret can't reach a terminal.
      console.log(JSON.stringify(redactSecrets(anonymousTelemetryPreview(readRecords(STORE), cfg)), null, 2));
      return;
    }
    console.log(`anonymous telemetry: ${cfg.anonymousTelemetry === true ? "enabled" : "disabled"}`);
    console.log("No telemetry is sent by default. Preview only: vibetracker telemetry preview");
    return;
  }

  if (cmd === "export") {
    const records = filterRecords(readRecords(STORE), parseFilters(argv));
    if (argv.includes("--private")) {
      const aggregate = privateAggregate(records, {
        epsilon: flag(argv, "--epsilon") ? Number(flag(argv, "--epsilon")) : undefined,
        groupBy: flag(argv, "--by") === "category" ? "category" : "provider",
      });
      const payload = JSON.stringify(aggregate, null, 2);
      const out = flag(argv, "--out");
      if (out) {
        writeUsageExport(out, payload);
        console.log(`exported differentially private aggregate -> ${out}`);
      } else {
        console.log(payload);
      }
      return;
    }
    const format = parseExportFormat(flag(argv, "--format"));
    const findings = scanSecrets(records);
    if (findings.length && !argv.includes("--allow-secrets")) {
      console.error(secretReport(findings));
      console.error("export blocked. Re-run with --allow-secrets only after reviewing the records.");
      process.exit(2);
    }
    if (format === "parquet") {
      const out = flag(argv, "--out");
      if (!out) { console.error("Parquet export requires --out <file.parquet>."); process.exit(2); }
      await writeParquetExport(out, redactSecrets(records) as typeof records);
      console.log(`exported ${records.length} records as parquet -> ${out}`);
      return;
    }
    const payload = renderUsageExport(redactSecrets(records), format);
    const out = flag(argv, "--out");
    if (out) {
      writeUsageExport(out, payload);
      console.log(`exported ${records.length} records as ${format} -> ${out}`);
    } else {
      console.log(payload);
    }
    return;
  }

  if (cmd === "bundle" && argv[1] === "sign") {
    const cfg = loadConfig();
    const records = readRecords(STORE);
    const { accepted } = ingestRecords(records, { untrustedSource: true });
    const handle = flag(argv, "--handle") || cfg.handle || "anonymous";
    const trustSignals = collectTrustSignals();
    const audit = buildUsageAudit({ records: accepted, providers: PROVIDERS, config: cfg, trustSignals });
    const bundle = {
      schema: "vibetracker.upload/0.1",
      handle,
      generatedAt: audit.generatedAt,
      tier: "self_reported",
      count: accepted.length,
      records: accepted,
      trustSignals,
      integrity: audit.integrity,
    };
    const signed = signBundle(bundle, loadOrCreateSigningKey(SIGNING_KEY));
    const out = flag(argv, "--out") || join(homedir(), ".vibetracker", "signed-upload-bundle.json");
    writeSignedBundle(out, signed);
    console.log(`signed bundle -> ${out}`);
    console.log(`public key: ${signed.publicKeyPem.split("\n")[1]?.slice(0, 24) ?? "ed25519"}...`);
    return;
  }

  if (cmd === "bundle" && argv[1] === "verify") {
    const path = argv[2];
    if (!path) { console.error("usage: vibetracker bundle verify <signed-bundle.json>"); process.exit(2); }
    const ok = verifySignedBundle(readSignedBundle(path));
    console.log(ok ? "signed bundle verified" : "signed bundle verification failed");
    if (!ok) process.exitCode = 1;
    return;
  }

  if (cmd === "release" && argv[1] === "sign") {
    const file = flag(argv, "--file") || join(process.cwd(), "dist", "vibetracker.js");
    if (!existsSync(file)) { console.error(`release file not found: ${file}`); process.exit(2); }
    const bytes = readFileSync(file);
    const payload = {
      schema: "vibetracker.release/0.1",
      file,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      size: bytes.length,
    };
    const signed = signBundle(payload, loadOrCreateSigningKey(SIGNING_KEY));
    const out = flag(argv, "--out") || `${file}.signed.json`;
    writeSignedBundle(out, signed);
    console.log(`signed release -> ${out}`);
    return;
  }

  if (cmd === "release" && argv[1] === "verify") {
    const path = argv[2];
    if (!path) { console.error("usage: vibetracker release verify <signed-release.json>"); process.exit(2); }
    const signed = readSignedBundle(path);
    const ok = verifySignedBundle(signed);
    const payload = signed.payload as { file?: string; sha256?: string };
    const fileOk = payload.file && payload.sha256 && existsSync(payload.file)
      ? createHash("sha256").update(readFileSync(payload.file)).digest("hex") === payload.sha256
      : false;
    console.log(ok && fileOk ? "signed release verified" : "signed release verification failed");
    if (!ok || !fileOk) process.exitCode = 1;
    return;
  }

  if (cmd === "fixture" && argv[1] === "redact") {
    const src = argv[2];
    if (!src) { console.error("usage: vibetracker fixture redact <in.json> [--out path]"); process.exit(2); }
    const result = redactFixture(src, flag(argv, "--out"));
    if (argv.includes("--json")) { console.log(JSON.stringify(result.payload, null, 2)); return; }
    console.log(renderFixtureRedaction(result));
    if (!result.out) console.log(JSON.stringify(result.payload, null, 2));
    return;
  }

  if (cmd === "roi" && argv[1] === "add") {
    const from = flag(argv, "--from");
    const to = flag(argv, "--to");
    const note = flag(argv, "--note");
    if (!from || !to || !note) {
      console.error("usage: vibetracker roi add --from YYYY-MM-DD --to YYYY-MM-DD --note <text> [--value-usd N] [--tags a,b]");
      process.exit(2);
    }
    const notes = loadRoiNotes(ROI_NOTES);
    const value = flag(argv, "--value-usd");
    const created = createRoiNote({
      from,
      to,
      note,
      valueUsd: value != null ? Number(value) : undefined,
      tags: multi(argv, "--tags") ?? [],
    });
    saveRoiNotes(ROI_NOTES, [...notes, created]);
    console.log(`saved ROI note · ${created.from.slice(0, 10)} -> ${created.to.slice(0, 10)}`);
    return;
  }

  if (cmd === "roi" && (argv[1] === "list" || !argv[1])) {
    const notes = loadRoiNotes(ROI_NOTES);
    if (argv.includes("--json")) { console.log(JSON.stringify(notes, null, 2)); return; }
    console.log(renderRoiNotes(notes));
    return;
  }

  if (cmd === "api" && argv[1] === "serve") {
    const portFlag = flag(argv, "--port");
    await serveBridgeOnFreePort(portFlag ? Number(portFlag) : null, ctx);
    return;
  }

  if (cmd === "desktop" && argv[1] === "scan") {
    const activities = scanDesktopActivity();
    if (argv.includes("--record") && activities.length) {
      appendRecords(STORE, desktopActivitiesToRecords(activities));
      console.log(`recorded ${activities.length} desktop activity snapshot(s)`);
    }
    if (argv.includes("--json")) { console.log(JSON.stringify(activities, null, 2)); return; }
    console.log(renderDesktopActivity(activities));
    return;
  }

  if (cmd === "browser-extension" && (argv[1] === "path" || !argv[1])) {
    // Print the clean, Chrome-loadable build path (not the source package, which Chrome rejects).
    console.log(buildLoadableExtension());
    console.log("Run `vibetracker start`, then load this folder as an unpacked extension.");
    return;
  }

  // `vibetracker start` — the one command the browser Bridge tells users to run. It shows the ASCII
  // splash, auto-binds a free bridge port, copies the load-unpacked path to the clipboard, opens
  // chrome://extensions, then serves the local API so the extension's Connect/Read buttons work.
  // This is the whole "easy install" story in one verb — as automated as Chrome's dev-mode allows.
  if (cmd === "start") {
    const portFlag = flag(argv, "--port");
    // Build a clean, Chrome-loadable copy (the source package can't be loaded — it holds __tests__).
    const extDir = buildLoadableExtension();
    // The ASCII splash — the same animated VIBE·USAGE logo the top-level banner shows (TTY only).
    await showBanner();
    // Bind FIRST so we can print the real port (and prove the bridge is live before the guide).
    const session = await serveBridgeOnFreePort(portFlag ? Number(portFlag) : null, ctx);
    const copied = copyToClipboard(extDir);
    console.log("");
    console.log(rule("VIBETRACKER START"));
    console.log(`  ${ok("1")} Load the extension (once):`);
    console.log(`     ${dim("chrome://extensions → Developer mode (top-right) → Load unpacked →")}`);
    console.log(`     ${paint(extDir, 190)}`);
    if (copied) {
      // The path is on the clipboard, but GTK/macOS file dialogs hide the path field and ~/.vibetracker
      // is a hidden folder, so "just paste" doesn't work — give the exact keystrokes for this OS.
      const pasteHint = process.platform === "darwin"
        ? "in the file dialog press Cmd+Shift+G, then Cmd+V, then Enter"
        : process.platform === "win32"
          ? "in the file dialog click the address bar, then Ctrl+V, then Enter"
          : "in the file dialog press Ctrl+L, then Ctrl+V, then Enter";
      console.log(`     ${gold("↑ path copied to your clipboard")} ${dim("— " + pasteHint)}`);
    }
    console.log(`  ${ok("2")} Then open Suno / Udio / Midjourney / Higgsfield, log in, and click the extension.`);
    console.log(`  ${dim("Leaving this window running keeps the local bridge on http://127.0.0.1:" + session.port)}`);
    console.log(`  ${dim("Auto-sync: configured sources refresh hourly while this runs (VibeTRACKER feeds your VibeUsage profile).")}`);
    // best-effort: open the extensions page so step 1 is one click (never blocks the server)
    try {
      const opener = process.platform === "darwin" ? "open" : process.platform === "win32" ? "explorer" : "xdg-open";
      spawnSync(opener, ["chrome://extensions"], { stdio: "ignore", timeout: 3000 });
    } catch { /* opener unavailable — the printed path is the fallback */ }
    // Hourly quiet auto-sync of the configured adapters while the bridge runs — one line per run,
    // overlap-guarded, and unref'd so it can never keep the process alive on its own. Resource
    // cost is one adapter pass per hour; failures degrade to a dim note, never a crash.
    let autoSyncBusy = false;
    const autoSync = setInterval(async () => {
      if (autoSyncBusy) return;
      autoSyncBusy = true;
      try {
        const targets = await configTargets();
        if (targets.length) {
          const summary = await syncTargets(targets, ctx);
          console.log(dim(`  auto-sync: ${targets.length} source(s) checked, ${summary.totalFresh} fresh record(s)`));
        }
      } catch (error) {
        console.log(dim(`  auto-sync skipped: ${shortErr(String((error as Error)?.message || error))}`));
      } finally {
        autoSyncBusy = false;
      }
    }, 60 * 60 * 1000);
    autoSync.unref?.();
    return;
  }

  if (cmd === "plugins" && (argv[1] === "path" || !argv[1])) {
    console.log(pluginsDir());
    console.log("Plugin manifests use packages/plugins/manifest.schema.json and graduate through adapter tests.");
    return;
  }

  if (cmd === "ledger" && (argv[1] === "seal" || argv[1] === "verify")) {
    const records = filterRecords(readRecords(STORE), parseFilters(argv));
    const integrity = buildUsageAudit({ records, providers: PROVIDERS, config: loadConfig(), trustSignals: [] }).integrity;
    if (argv[1] === "seal") {
      const seal = createLedgerSeal(integrity);
      writeLedgerSeal(flag(argv, "--out") || LEDGER_SEAL, seal);
      if (argv.includes("--json")) { console.log(JSON.stringify(seal, null, 2)); return; }
      console.log(`ledger sealed · ${ledgerSealSummary(seal)}`);
      return;
    }
    const result = verifyLedgerSeal(flag(argv, "--seal") || LEDGER_SEAL, integrity);
    if (argv.includes("--json")) { console.log(JSON.stringify(result, null, 2)); return; }
    console.log(ledgerVerifySummary(result));
    if (!result.ok) process.exitCode = 1;
    return;
  }

  if (cmd === "adapter" && argv[1] === "scaffold") {
    const id = argv[2];
    if (!id) {
      console.error("usage: vibetracker adapter scaffold <id> [--dir path] [--dry-run] [--force]");
      process.exit(2);
    }
    try {
      const files = writeAdapterScaffold(id, flag(argv, "--dir") || process.cwd(), {
        dryRun: argv.includes("--dry-run"),
        force: argv.includes("--force"),
      });
      console.log(`${argv.includes("--dry-run") ? "would create" : "created"} adapter scaffold for ${id}:`);
      for (const file of files) console.log(`  - ${file}`);
      console.log(`next: add it to packages/adapters/src/registry.ts after real endpoint/auth proof.`);
    } catch (err) {
      console.error(`adapter scaffold failed: ${(err as Error).message}`);
      process.exit(2);
    }
    return;
  }

  if (cmd === "subscription" && argv[1] === "add") {
    const provider = argv[2];
    const usd = Number(flag(argv, "--usd"));
    const from = flag(argv, "--from");
    const to = flag(argv, "--to");
    if (!provider || !from || !to || !Number.isFinite(usd)) {
      console.error("usage: vibetracker subscription add <provider> --usd <amount> --from YYYY-MM-DD --to YYYY-MM-DD [--category c] [--account id] [--profile id] [--team id]");
      process.exit(2);
    }
    const desc = getProvider(provider);
    const records = amortizeSubscription({
      provider,
      usd,
      from,
      to,
      category: (flag(argv, "--category") as Category) || (desc?.categories?.[0] as Category) || "other",
      accountId: flag(argv, "--account"),
      profileId: flag(argv, "--profile"),
      teamId: flag(argv, "--team"),
      note: flag(argv, "--note"),
    });
    const { accepted, rejected } = ingestRecords(records, {});
    await showProviderScanBeat({
      providerId: provider,
      label: desc?.label,
      index: 0,
      total: 1,
    });
    appendRecords(STORE, accepted);
    if (rejected.length) console.log(`  ${dim(`${rejected.length} rejected during validation`)}`);
    console.log(`  ${ok("✓")} amortized ${provider} ${money(usd)} over ${accepted.length} day(s)`);
    await showCollectionCheckpoint({
      providerId: provider,
      label: desc?.label,
      status: accepted.length ? "new" : "error",
      received: records.length,
      accepted: accepted.length,
      fresh: accepted.length,
      duplicate: 0,
      usd,
      sourceMix: checkpointSourceMix(accepted),
      error: rejected[0]?.errors.join(", ") || "no subscription rows accepted",
      hint: accepted.length
        ? "subscription rows amortized into the local ledger"
        : "no subscription rows were written",
    });
    return;
  }

  if (cmd === "init" || cmd === "wizard" || cmd === "gui" || cmd === "wizard-gui") {
    await showBanner();
    const cfg = loadConfig();
    const plan = await withSpinner("scanning your machine for AI tools", async () =>
      planSetup({
        providers: PROVIDERS,
        hasEnvCreds: (id) => Object.values(resolveCreds(id)).some(Boolean),
        localLogsPresent,
        credFields: (id) => CRED_FIELDS[id] ?? [],
      }));
    await showSyncSurpriseQueue(setupPlanSurpriseTargets(plan));
    if (argv.includes("--gui") || cmd === "gui" || cmd === "wizard-gui") {
      const records = readRecords(STORE);
      const trustSignals = collectTrustSignals();
      const audit = buildUsageAudit({ records, providers: PROVIDERS, config: cfg, trustSignals });
      await runWizardGui({ providers: PROVIDERS, plan, audit }, { open: openBrowser, log: (s) => console.log(s) });
      return;
    }
    console.log(rule("CONNECT"));
    console.log(`  ${dim("you only need keys for the hosted providers you actually use")}\n`);
    await runWizard(cfg, {
      plan,
      resolveEnv: (id) => resolveCreds(id) as Record<string, string | undefined>,
      prompt: promptSecret,   // keys are masked as you type — never echoed to screen/scrollback
      log: (s) => console.log(s),
      save: saveConfig,
    });
    // Immediately pull what got connected so you see results right away.
    const targets = await configTargets();
    if (targets.length) {
      console.log("\n" + rule("SYNC"));
      const sync = await syncTargets(targets, ctx);
      const records = readRecords(STORE);
      if (records.length) {
        console.log("\n" + rule("YOUR USAGE"));
        console.log(renderTotal(records, "provider"));
      }
      await showWelcome(`${human(records.length || sync.totalFresh)} operations tracked — you're all set`);
      if (records.length) {
        // Open the real, freshly generated dashboard — a link that actually works.
        const out = join(homedir(), ".vibetracker", "profile.html");
        const trustSignals = collectTrustSignals();
        writeFileSync(out, renderProfileHtml(records, trustSignals, loadRoiNotes(ROI_NOTES)));
        const opener = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
        spawnSync(opener, [out], { stdio: "ignore" });
        console.log(`  ${gold("▲")} your dashboard just opened ${dim("·")} ${paint(`file://${out}`, 190)}`);
        console.log(`  ${dim("re-open anytime:")} ${paint("vibetracker profile", 190)} ${dim("· global leaderboard live at vibeusage.c0vibe.app")}\n`);
      }
      console.log(`  ${dim("next:  vibetracker stats   ·   vibetracker connect <id>   ·   vibetracker keys")}\n`);
    }
    return;
  }

  if (cmd === "providers") {
    if (argv[1] === "check") {
      const checks = providerCapabilityChecks(PROVIDERS);
      if (argv.includes("--json")) { console.log(JSON.stringify(checks, null, 2)); return; }
      console.log(renderCapabilityChecks(checks));
      return;
    }
    const all = argv.includes("--all");
    const domain = flag(argv, "--domain");
    const category = flag(argv, "--category");
    // Effective coverage: a service is trackable today if it has a built adapter, OR is
    // OpenAI-compatible (works via `proxy`), OR is a flat cost (works via `add`).
    const coverage = (p: (typeof PROVIDERS)[number]) =>
      p.status === "built" ? (p.verified ? "built ✓" : "built ~")
      : p.tier === "proxy" ? "proxy ✓"
      : p.tier === "manual" || p.status === "manual-only" ? "manual ✓"
      : "planned";
    let list = all ? PROVIDERS : PROVIDERS.filter((p) => coverage(p) !== "planned");
    if (domain) list = list.filter((p) => p.domain === domain);
    if (category) list = list.filter((p) => p.categories.includes(category as Category));
    if (argv.includes("--json")) { console.log(JSON.stringify(list, null, 2)); return; }
    console.log(formatTable(
      ["PROVIDER", "DOMAIN", "COVERAGE", "TIER", "CATEGORIES"],
      list.map((p) => [p.id, p.domain, coverage(p), p.tier, p.categories.join("/")]),
    ));
    const built = PROVIDERS.filter((p) => p.status === "built").length;
    const proxied = PROVIDERS.filter((p) => p.status !== "built" && p.tier === "proxy").length;
    const manual = PROVIDERS.filter((p) => p.status !== "built" && (p.tier === "manual" || p.status === "manual-only")).length;
    const bespoke = PROVIDERS.length - built - proxied - manual;
    console.log(`\n${PROVIDERS.length} services · ${built} built adapters · ${proxied} via proxy (OpenAI-compat) · ${manual} via manual add · ${bespoke} bespoke adapters still to build`);
    return;
  }

  if (cmd === "sync") {
    const targets = argv.includes("--demo") ? demoTargets() : await configTargets();
    if (!targets.length) { console.log("No providers enabled — run `vibetracker init`."); return; }
    const providerIds = targets.map((target) => target.id);
    await showSyncSurpriseQueue(providerIds, {
      json: argv.includes("--json"),
      plain: argv.includes("--plain"),
    });
    await showCollectionCascade({ providerIds, label: argv.includes("--demo") ? "DEMO-SYNC" : "SYNC" }, {
      json: argv.includes("--json"),
      plain: argv.includes("--plain"),
    });
    const sync = await syncTargets(targets, ctx);
    if (argv.includes("--receipt") || argv.includes("--report")) {
      const outDir = flag(argv, "--out") ?? join(homedir(), ".vibetracker", "receipts", sync.id);
      const files = buildSyncReceiptFiles({ ...sync, demo: argv.includes("--demo") });
      for (const file of files) {
        const out = join(outDir, file.path);
        mkdirSync(dirname(out), { recursive: true });
        writeFileSync(out, file.content);
      }
      console.log(`  ${ok("✓")} sync receipt -> ${dim(outDir)}`);
      console.log(`  ${dim("local HTML + JSON; no upload, no prompt/output export, no secret export")}`);
    }
    console.log(`\nsynced ${sync.totalFresh} records → ${STORE}\nrun \`vibetracker total\` to view.`);
    return;
  }

  if (cmd === "reconcile" && argv.includes("--coding")) {
    const targets: SyncTarget[] = [
      { id: "claude-code", adapter: createClaudeCodeAdapter() },
      { id: "codex", adapter: createCodexAdapter() },
    ];
    const results = await runSync(targets, RANGE, ctx);
    for (const result of results) {
      if (result.error) console.error(`  ${bad("✗")} ${result.provider}: ${shortErr(result.error)}`);
    }
    const received = results.flatMap((result) => result.records);
    const { accepted, rejected } = ingestRecords(received, { untrustedSource: true });
    const current = readRecords(STORE);
    const reconciliation = reconcileFullScanProviders(current, accepted);
    const next = [...reconciliation.kept, ...accepted];
    for (const provider of reconciliation.providers) {
      const before = current
        .filter((record) => record.provider === provider)
        .reduce((sum, record) => sum + record.rawAmount, 0);
      const after = accepted
        .filter((record) => record.provider === provider)
        .reduce((sum, record) => sum + record.rawAmount, 0);
      console.log(`  ${provider.padEnd(13)} ${human(before)} → ${human(after)} tokens · parser truth`);
    }
    if (!reconciliation.providers.length) {
      console.error(`  ${bad("✗")} no coding parser returned usable records; ledger unchanged`);
      return;
    }
    if (argv.includes("--dry-run")) {
      console.log(`  ${dim(`dry run · would replace ${human(reconciliation.superseded.length)} rows with ${human(accepted.length)} parser records · ledger unchanged`)}`);
      return;
    }
    writeRecords(STORE, next);
    console.log(`  ${ok("✓")} reconciled ${reconciliation.providers.join(" · ")} in one ledger rewrite`);
    if (rejected.length) console.log(`  ${dim(`${human(rejected.length)} invalid parser records rejected`)}`);
    return;
  }

  if (cmd === "receipts" || cmd === "receipt-vault" || cmd === "runs") {
    const rootDir = flag(argv, "--dir") ?? join(homedir(), ".vibetracker", "receipts");
    const payload = receiptVaultPayload(loadReceiptVault(rootDir));
    if (argv.includes("--json")) {
      console.log(JSON.stringify(payload, null, 2));
      return;
    }
    if (argv.includes("--html")) {
      const out = flag(argv, "--out") ?? join(rootDir, "index.html");
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, renderReceiptVaultHtml(payload));
      console.log(`  ${ok("✓")} receipt vault -> ${dim(out)}`);
      console.log(`  ${dim("static HTML; reads receipt JSON only, no provider calls, no usage writes, no uploads")}`);
      if (argv.includes("--open")) openBrowser(out);
      return;
    }
    console.log(renderReceiptVault(payload));
    return;
  }

  if (cmd === "login") {
    const cfg = loadConfig();
    const site = flag(argv, "--site") || SITE;
    try {
      const login = await runLogin(createHttpAuthTransport(site), {
        open: openBrowser,
        sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
        log: (m) => console.log(m),
        githubToken: readGitHubCliToken,
      });
      storeToken(cfg, login.accessToken);
      if (login.identity) cfg.handle = login.identity.handle;
      saveConfig(cfg);
      console.log(`✓ identity verified${login.identity ? ` as @${login.identity.handle}` : ""} — VibeTRACKER token stored in the OS keyring when available. Uploads are now identity-attested.`);
    } catch (err) {
      console.error(`✗ login failed: ${(err as Error).message}`);
      process.exit(1);
    }
    return;
  }

  if (cmd === "oauth" && argv[1] === "start") {
    const provider = argv[2];
    // First-party providers (cynaps3) carry a built-in preset — flags only override it. Unknown
    // providers still require the full set of flags.
    const builtin = provider ? oauthProviderPreset(provider) : undefined;
    const authUrl = flag(argv, "--auth-url") || builtin?.authUrl;
    const tokenUrl = flag(argv, "--token-url") || builtin?.tokenUrl;
    const clientId = flag(argv, "--client-id") || builtin?.clientId;
    const scope = flag(argv, "--scope") || builtin?.scope || "";
    const port = Number(flag(argv, "--port") || 8787);
    if (!provider || !authUrl || !tokenUrl || !clientId) {
      console.error("usage: vibetracker oauth start <provider> [--auth-url <url> --token-url <url> --client-id <id>] [--scope s] [--port 8787]\n(cynaps3 needs no flags — its preset is built in)");
      process.exit(2);
    }
    try {
      const credentials = await authorizeOAuthProvider({
        ...(builtin ?? {}),
        provider,
        authUrl,
        tokenUrl,
        clientId,
        scope,
      }, port, scope);
      const cfg = loadConfig();
      const inKeyring = storeProviderCreds(cfg, provider, credentials as unknown as Record<string, string>);
      if (!cfg.enabled.includes(provider)) cfg.enabled.push(provider);
      saveConfig(cfg);
      console.log(`OAuth token stored for ${provider} ${inKeyring ? "in the OS keyring" : `in ${CONFIG_PATH} (mode 600)`}.`);
    } catch (err) {
      const message = (err as Error).message;
      if (message.includes("EADDRINUSE")) {
        console.error("OAuth failed: another `vibetracker oauth start` is already waiting on this port.");
        console.error("Press Ctrl+C in that other terminal first, then run this command again —");
        console.error("each run has its own one-time state, so only the NEWEST window can succeed.");
      } else {
        console.error(`OAuth failed: ${message}`);
      }
      process.exit(1);
    }
    return;
  }

  if (cmd === "logout") {
    const cfg = loadConfig();
    clearToken(cfg);
    saveConfig(cfg);
    console.log("logged out — token removed from the keyring.");
    return;
  }

  if (cmd === "keys") {
    const cfg = loadConfig();
    console.log(rule("YOUR KEYS"));
    if (!cfg.enabled.length) { console.log(`  ${dim("nothing connected yet — run")} ${paint("vibetracker connect <id>", 190)}`); return; }
    for (const id of cfg.enabled) {
      const c = resolveCreds(id, cfg) as Record<string, string>; // reads the keyring at point of use
      const visibleFields = [...new Set([...(CRED_FIELDS[id] ?? []), "token"])];
      const fields = visibleFields.filter((field) => c[field])
        .map((field) => `${dim(fieldLabel(field))} ${paint(maskKey(c[field]), 200)}`).join("  ");
      const rotation = c.refreshToken ? `  ${dim("OAuth refresh armed")}` : "";
      console.log(`  ${icon(id)} ${id.padEnd(14)} ${fields || dim("no key needed (local)")}${rotation}`);
    }
    console.log(`\n  ${dim("add:")} ${paint("vibetracker connect <id>", 190)}   ${dim("remove:")} ${paint("vibetracker disconnect <id>", 190)}   ${dim("catalog:")} ${paint("vibetracker providers", 190)}`);
    return;
  }

  if (cmd === "disconnect") {
    const cfg = loadConfig();
    const id = argv[1];
    if (!id || !cfg.enabled.includes(id)) { console.log(`usage: vibetracker disconnect <id> — connected: ${cfg.enabled.join(", ") || "(none)"}`); return; }
    cfg.enabled = cfg.enabled.filter((p) => p !== id);
    clearProviderCreds(cfg, id);
    saveConfig(cfg);
    console.log(`  ${ok("✓")} ${id} disconnected — its key was deleted from this machine`);
    return;
  }

  if (cmd === "connect") {
    const cfg = loadConfig();
    const provider = argv[1];
    if (!provider) {
      console.log(rule("CONNECT"));
      const hosted = PROVIDERS.filter((p) => (CRED_FIELDS[p.id] ?? []).length && p.status === "built");
      for (const p of hosted) {
        const on = cfg.enabled.includes(p.id);
        console.log(`  ${icon(p.id)} ${p.id.padEnd(14)} ${on ? ok("connected") : dim(GUIDE[p.id]?.cred ?? fieldLabel((CRED_FIELDS[p.id] ?? [])[0] ?? ""))}`);
      }
      console.log(`\n  ${dim("usage:")} ${paint("vibetracker connect <id>", 190)} ${dim("— guided, key hidden as you type")}`);
      return;
    }
    if (!PROVIDERS.some((p) => p.id === provider)) { console.error(`unknown provider: ${provider}`); process.exit(2); }
    const creds: Record<string, string> = { ...(resolveCreds(provider) as Record<string, string>) }; // env first
    const hasExplicitCreds = argv.includes("--set");
    for (let i = 2; i < argv.length; i++) {
      if (argv[i] === "--set" && argv[i + 1]) {
        const eq = argv[i + 1].indexOf("=");
        if (eq > 0) creds[argv[i + 1].slice(0, eq)] = argv[i + 1].slice(eq + 1);
        i++;
      }
    }
    // Guided mode: no --set given and fields are missing → show the how-to and prompt (masked).
    const fields = CRED_FIELDS[provider] ?? [];
    let missingNow = fields.filter((f) => !creds[f]);
    const preset = oauthProviderPreset(provider);
    if (preset && !hasExplicitCreds) {
      const g = GUIDE[provider];
      console.log(rule(provider.toUpperCase()));
      if (g?.why) console.log(`  ${dim("why:  " + g.why)}`);
      console.log(`  ${paint("scope:", 190)} ${preset.scope} ${dim("· browser authorization · loopback PKCE · no cookie paste")}`);
      try {
        Object.assign(creds, await authorizeOAuthProvider(
          preset,
          Number(flag(argv, "--port") || 8787),
        ));
        missingNow = fields.filter((f) => !creds[f]);
      } catch (err) {
        console.error(`  ${bad("✗")} ${provider} OAuth failed: ${(err as Error).message}`);
        process.exit(1);
      }
    }
    if (missingNow.length && process.stdin.isTTY) {
      const g = GUIDE[provider];
      console.log(rule(provider.toUpperCase()));
      if (g?.why) console.log(`  ${dim("why:  " + g.why)}`);
      if (g?.url) console.log(`  get:  ${g.url}`);
      if (g?.fmt) console.log(`  ${dim("format: " + g.fmt)}`);
      if (g?.steps) g.steps.forEach((s, i) => console.log(`    ${dim(`${i + 1}) ${s}`)}`));
      for (const f of missingNow) {
        const ans = (await promptSecret(`  paste ${g?.cred ?? fieldLabel(f)} ${dim("(hidden · Enter to skip)")}: `)).trim();
        if (ans) creds[f] = ans;
      }
    }
    const inKeyring = storeProviderCreds(cfg, provider, creds);
    if (!cfg.enabled.includes(provider)) cfg.enabled.push(provider);
    saveConfig(cfg);
    const have = fields.filter((field) => Boolean((cfg.creds?.[provider] as Record<string, string> | undefined)?.[field]));
    const missing = fields.filter((field) => !have.includes(field));
    const where = inKeyring ? dim("→ OS keyring") : dim("→ ~/.vibetracker/config.json (no keyring; mode 600)");
    console.log(`  ${ok("✓")} ${provider} connected ${where}${have.length ? `  ${dim(have.map((k) => `${fieldLabel(k)} ${maskKey(String(cfg.creds![provider]![k]))}`).join("  "))}` : ""}`);
    if (creds.refreshToken) console.log(`  ${dim("↻ rotating OAuth refresh token stored locally; access refreshes before sync")}`);
    if (missing.length) console.log(`  ${dim(`⚠ still missing: ${missing.join(", ")} — re-run or use env VT_* / --set`)}`);
    if (!missing.length) {
      // instant gratification: pull this provider right away
      try {
        const t = { id: provider, adapter: createAdapterFromConfig(provider, resolveCreds(provider, cfg)) };
        await showSyncSurpriseQueue([provider]);
        await showCollectionCascade({ providerIds: [provider], label: "CONNECT-SYNC" });
        await syncTargets([t], ctx);
      } catch (err) {
        const message = (err as Error).message;
        console.log(`  ${dim("·")} ${dim(shortErr(message))}`);
        const hint = recoveryHint(provider, message);
        if (hint) console.log(`  ${dim(hint)}`);
      }
    }
    console.log(`  ${dim(`saved → ${CONFIG_PATH} (mode 600)`)}`);
    return;
  }

  if (cmd === "upload") {
    const cfg = loadConfig();
    const records = readRecords(STORE);
    if (!records.length) { console.log("nothing to upload — run `vibetracker sync` first."); return; }
    // Trust boundary: uploads are self-reported by construction (verified forced false).
    const { accepted } = ingestRecords(records, { untrustedSource: true });
    const handle = flag(argv, "--handle") || cfg.handle || "anonymous";
    const url = flag(argv, "--url") || cfg.uploadUrl || process.env.VT_UPLOAD_URL || DEFAULT_UPLOAD_URL;
    const trustSignals = collectTrustSignals();
    const audit = buildUsageAudit({ records: accepted, providers: PROVIDERS, config: cfg, trustSignals });
    // Attach the newest local cc.json aggregate without launching ccusage or blocking upload.
    // Model tokens and per-day agent presence are measured; per-agent spend is not inferred.
    const coding = argv.includes("--no-ccusage")
      ? null
      : collectCodingTelemetry({ telemetry: createConsoleTelemetry() });
    // Recent, byte-budgeted local trace reconstructed from bounded session-event gaps.
    const orchestration = argv.includes("--no-orchestration")
      ? null
      : collectOrchestrationHours({ telemetry: createConsoleTelemetry() });
    const bundle = {
      schema: "vibetracker.upload/0.1",
      handle,
      generatedAt: audit.generatedAt,
      tier: "self_reported",
      count: accepted.length,
      records: accepted,
      trustSignals,
      ...(cfg.bio ? { bio: cfg.bio } : {}),
      ...(cfg.parallelAgents || cfg.subs ? { selfReported: { parallelAgents: cfg.parallelAgents, subs: cfg.subs } } : {}),
      ...(coding ? { tokenBreakdown: coding.tokenBreakdown, agents: coding.agents, totalTokens: coding.totalTokens } : {}),
      ...(orchestration ? { orchestration } : {}),
      integrity: audit.integrity,
    };
    const findings = scanSecrets(bundle);
    const uploadRender = {
      handle,
      endpoint: url,
      accepted: accepted.length,
      tier: cfg.token ? "attested" as const : "self_reported" as const,
      audit,
      findings,
      site: SITE,
      coding,
      orchestration,
    };
    if (argv.includes("--dry-run") || argv.includes("--preview")) {
      console.log(renderUploadPreview(uploadRender));
      return;
    }
    if (findings.length && !argv.includes("--allow-secrets")) {
      console.error(renderUploadBlocked(uploadRender));
      process.exit(2);
    }
    const saveLocal = () => {
      const out = join(homedir(), ".vibetracker", "upload-bundle.json");
      writeFileSync(out, JSON.stringify(bundle, null, 2));
      return out;
    };
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (cfg.token) headers.authorization = `Bearer ${cfg.token}`; // attested identity
    try {
      const body = JSON.stringify(bundle);
      const endpoint = resolveUploadEndpoint(url, DEFAULT_UPLOAD_URL, Buffer.byteLength(body));
      if (endpoint !== url) console.log(dim("large reviewed bundle: routing directly to the C0VIBE ingest edge"));
      const resultRender = endpoint === url ? uploadRender : { ...uploadRender, endpoint };
      const res = await fetch(endpoint, { method: "POST", headers, body });
      if (res.ok) {
        let proof: UploadResponseProof = {};
        try {
          proof = await res.json() as UploadResponseProof;
        } catch (err) {
          ctx.telemetry.addBreadcrumb("upload.response_json_parse_failed", { error: (err as Error).message }, "warn");
        }
        console.log(renderUploadSuccess(resultRender, proof));
        if (trustSignals.length) console.log(`  ${dim("trust signal attached:")} ${paint(trustSignalSummary(trustSignals), 190)}`);
        return;
      }
      console.error(renderUploadFailure(resultRender, `rejected ${res.status}: ${await res.text()}`, saveLocal()));
      return;
    } catch (err) {
      console.error(renderUploadFailure(uploadRender, `could not reach: ${(err as Error).message}`, saveLocal()));
      return;
    }
  }

  if (cmd === "add") {
    const provider = argv[1];
    const usdFlag = flag(argv, "--usd");
    const creditsFlag = flag(argv, "--credits");
    const minutesFlag = flag(argv, "--minutes");
    const charactersFlag = flag(argv, "--characters");
    const usd = usdFlag != null ? Number(usdFlag) : undefined;
    const credits = creditsFlag != null ? Number(creditsFlag) : undefined;
    const minutes = minutesFlag != null ? Number(minutesFlag) : undefined;
    const characters = charactersFlag != null ? Number(charactersFlag) : undefined;
    if (!provider || ((usd == null || Number.isNaN(usd)) && (credits == null || Number.isNaN(credits)) && (minutes == null || Number.isNaN(minutes)) && (characters == null || Number.isNaN(characters)))) {
      console.error("usage: vibetracker add <provider> --usd <amount> | --credits <n> | --minutes <n> | --characters <n> [--usd <est>] [--category c] [--operation op] [--note text] [--ts YYYY-MM-DD]");
      console.error("  e.g. vibetracker add higgsfield --credits 4270    (no public usage API yet — log it manually)");
      console.error("  e.g. vibetracker add elevenlabs --characters 12000 --operation voice_clone --category audio");
      process.exit(2);
    }
    const desc = getProvider(provider);
    const category = (flag(argv, "--category") as Category) || (desc?.categories?.[0] as Category) || "other";
    const tsFlag = flag(argv, "--ts");
    const rawAmount = characters ?? (minutes != null ? minutes * 60 : credits ?? usd ?? 0);
    const unit = characters != null ? "character" : minutes != null ? "second" : credits != null ? "credit" : "request";
    const rawUnit = characters != null ? "characters" : minutes != null ? "seconds" : credits != null ? "credits" : "usd";
    const rec = {
      ts: tsFlag ? new Date(tsFlag).toISOString() : new Date().toISOString(),
      provider,
      category,
      operation: flag(argv, "--operation") || flag(argv, "--note") || (characters != null ? "voice_characters" : minutes != null ? "voice_minutes" : credits != null ? "credits" : "subscription"),
      quantity: rawAmount,
      unit,
      rawAmount,
      rawUnit,
      ...(usd != null && !Number.isNaN(usd) ? { usdEst: usd } : {}),
      source: "manual", confidence: "low", verified: false,
      ...(flag(argv, "--account") ? { accountId: flag(argv, "--account") } : {}),
      ...(flag(argv, "--profile") ? { profileId: flag(argv, "--profile") } : {}),
      ...(flag(argv, "--team") ? { teamId: flag(argv, "--team") } : {}),
    };
    const { accepted, rejected } = ingestRecords([rec], {});
    await showProviderScanBeat({
      providerId: provider,
      label: desc?.label,
      index: 0,
      total: 1,
    });
    appendRecords(STORE, accepted);
    const recorded = characters != null ? `${characters} characters`
      : minutes != null ? `${minutes} min`
      : credits != null ? `${credits} credits`
      : usd != null ? `$${usd.toFixed(2)}` : "usage";
    console.log(accepted.length
      ? `  ${ok("✓")} added ${provider} ${recorded}${usd != null && (characters != null || minutes != null || credits != null) ? ` · $${usd.toFixed(2)}` : ""} · ${desc?.domain ?? "?"} domain${tsFlag ? ` @ ${tsFlag}` : ""}`
      : `  ${bad("✗")} rejected: ${rejected[0]?.errors.join(", ")}`);
    await showCollectionCheckpoint({
      providerId: provider,
      label: desc?.label,
      status: accepted.length ? "new" : "error",
      received: 1,
      accepted: accepted.length,
      fresh: accepted.length,
      duplicate: 0,
      usd,
      sourceMix: checkpointSourceMix(accepted),
      error: rejected[0]?.errors.join(", ") || "manual row rejected",
      hint: accepted.length
        ? "manual creator or subscription cost written to the local ledger"
        : "manual row was not written",
    });
    return;
  }

  if (cmd === "proxy") {
    const target = flag(argv, "--target");
    const provider = flag(argv, "--provider") || "proxy";
    const port = Number(flag(argv, "--port") || 8899);
    if (!target) { console.error("usage: vibetracker proxy --target <url> --provider <id> [--port 8899] [--source local]"); process.exit(2); }
    const source = (flag(argv, "--source") as Source) || (provider === "ollama" || provider === "lmstudio" ? "local" : "proxy");
    console.log(`proxy :${port} → ${target}  ·  point your tool's base URL at http://localhost:${port}  ·  Ctrl-C to stop`);
    runProxy({ target, provider, port, source, onRecord: (r) => appendRecords(STORE, [r]), log: (s) => console.log(s) });
    return;
  }

  if (cmd === "stats") {
    const records = filterRecords(readRecords(STORE), parseFilters(argv));
    if (argv.includes("--json")) { console.log(JSON.stringify(computeStats(records), null, 2)); return; }
    if (!records.length) { console.log(emptyUsageState("NO MATCHING USAGE", "No records match those filters. Widen the filters or create a first record.")); return; }
    console.log(renderStats(computeStats(records)));
    return;
  }

  if (cmd === "total") {
    const records = filterRecords(readRecords(STORE), parseFilters(argv));
    if (!records.length) { console.log(emptyUsageState("NO MATCHING USAGE", "No records match those filters. Widen the filters or create a first record.")); return; }
    console.log(renderTotal(records, parseGroupBy(argv)));
    return;
  }

  console.error(`unknown command: ${cmd}\n\n${USAGE}`);
  process.exit(2);
}

main().catch((err) => {
  console.error(`[vibetracker] fatal:`, err instanceof Error ? err.message : err);
  process.exit(1);
});
