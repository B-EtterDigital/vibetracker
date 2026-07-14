import type { UsageAudit } from "./audit.ts";
import type { SecretFinding } from "../../core/src/security/secrets.ts";
import { money } from "./format.ts";
import type { OrchestrationTrace } from "./orchestration-hours.ts";

export interface UploadResponseProof {
  profileUrl?: string;
  tier?: string;
  accepted?: number;
  rejected?: number;
  trustSignals?: number;
  trustSignalsPersisted?: number;
  trustSignalWarning?: string;
}

export interface UploadRenderInput {
  handle: string;
  endpoint: string;
  accepted: number;
  tier: "attested" | "self_reported";
  audit: UsageAudit;
  findings: SecretFinding[];
  site: string;
  coding?: {
    totalTokens: number;
    agents: { crossProviderDays: number; activeDays: number; agents: Array<{ agent: string }> };
  } | null;
  orchestration?: OrchestrationTrace | null;
}

export const DIRECT_INGEST_URL = "https://tnsaqsqajpjbvlpasojt.supabase.co/functions/v1/vibetracker-ingest";
export const SINGLE_DOMAIN_UPLOAD_LIMIT = 5_500_000;

export function resolveUploadEndpoint(url: string, defaultUrl: string, payloadBytes: number): string {
  return url === defaultUrl && payloadBytes > SINGLE_DOMAIN_UPLOAD_LIMIT ? DIRECT_INGEST_URL : url;
}

const frameWidth = 66;
const contentWidth = frameWidth - 4;

function fit(text: string, width = contentWidth): string {
  return text.length > width ? `${text.slice(0, Math.max(0, width - 1))}...` : text.padEnd(width);
}

function frameLine(text: string): string {
  return `| ${fit(text)} |`;
}

function bar(value: number, max: number, width = 18): string {
  if (value <= 0 || max <= 0) return ".".repeat(width);
  const filled = Math.max(1, Math.round((value / max) * width));
  return "#".repeat(Math.min(width, filled)) + ".".repeat(Math.max(0, width - filled));
}

function shortHash(value: string): string {
  return `${value.slice(0, 16)}...${value.slice(-8)}`;
}

export function renderSecretScan(findings: SecretFinding[]): string {
  if (!findings.length) return "secret scan clean";
  return [
    `secret scan BLOCK ${findings.length} potential secret(s)`,
    ...findings.slice(0, 12).map((finding) => `  - ${finding.path} ${finding.kind} ${finding.preview}`),
  ].join("\n");
}

function sourceSignal(audit: UsageAudit): string {
  if (!audit.sourceMix.length) return "source mix none";
  const max = Math.max(...audit.sourceMix.map((row) => row.count));
  return audit.sourceMix.slice(0, 4)
    .map((row) => `${row.label}:${bar(row.count, max, 6)} ${row.pct}%`)
    .join("  ");
}

function tierLabel(tier: UploadRenderInput["tier"]): string {
  return tier === "attested" ? "attested C0VIBE login" : "self-reported local upload";
}

function integritySeal(audit: UsageAudit): string {
  return `seal chain ${shortHash(audit.integrity.chainHead)} // bundle ${shortHash(audit.integrity.bundleFingerprint)}`;
}

function trustSidecar(audit: UsageAudit): string {
  const count = audit.trustSignals.length;
  return count ? `trust sidecar ${count} evidence item(s) // NOT USAGE` : "trust sidecar none // usage only";
}

function codingSnapshot(input: UploadRenderInput): string {
  if (!input.coding) return "coding snapshot none // no measured cc.json aggregate attached";
  const agents = input.coding.agents.agents.length;
  return `coding snapshot ${input.coding.totalTokens.toLocaleString("en-US")} tokens // ${agents} active CLI${agents === 1 ? "" : "s"}`;
}

function orchestrationSnapshot(input: UploadRenderInput): string[] {
  const trace = input.orchestration;
  if (!trace) return [frameLine("local orchestration trace none")];
  return [
    frameLine(`local trace ${trace.activityHours.toFixed(1)}h span // ${trace.overlapRatio.toFixed(1)}x overlap`),
    frameLine(`coverage ${trace.filesScanned}/${trace.filesAvailable} files // ${trace.sampledFiles} sampled // ${trace.limited ? "budget-limited" : "complete"}`),
  ];
}

function commandHandle(handle: string): string {
  const cleaned = handle.replace(/^@/, "");
  return /^[a-zA-Z0-9._-]+$/.test(cleaned) ? cleaned : encodeURIComponent(cleaned);
}

function profileUrl(input: UploadRenderInput, proof?: UploadResponseProof): string {
  if (proof?.profileUrl?.startsWith("http")) return proof.profileUrl;
  return `${input.site}${proof?.profileUrl ?? `/u/${input.handle}`}`;
}

function transmissionSequencer(state: "dry-run" | "blocked" | "published"): string[] {
  const stage =
    state === "blocked"
      ? "04 publish  HELD LOCAL       blocked by secret gate"
      : state === "published"
        ? "04 publish  C0VIBE LIVE      reviewed aggregate sent"
        : "04 publish  WAITING         dry-run; nothing uploaded";
  return [
    frameLine("VTK://TRANSMISSION-SEQUENCER//LOCAL-REVIEW//NO-SECRETS"),
    frameLine("transmission stages: scan -> redact -> review -> publish"),
    frameLine(state === "blocked" ? "stage lock BLOCKED // payload stays local" : state === "published" ? "stage lock SENT // aggregate-only profile update" : "stage lock DRY-RUN // waiting for consent"),
    frameLine("01 scan     secret sweep      local only"),
    frameLine("02 redact   prompts/keys/files zero exported"),
    frameLine("03 review   aggregate manifest user consent gate"),
    frameLine(stage),
    frameLine("redaction manifest: prompts no // keys no // raw files no"),
    frameLine("trust sidecar travels labelled NOT USAGE"),
  ];
}

function shareKit(input: UploadRenderInput, url = profileUrl(input)): string[] {
  return [
    frameLine("share kit: profile -> SVG badge -> README"),
    frameLine(`profile ${url}`),
    frameLine("badge npx vibetrack badge --out ./vibetracker-badge.svg"),
    frameLine(`handle --handle ${commandHandle(input.handle)} --markdown`),
    frameLine("badge is local SVG; trust rail remains NOT USAGE"),
  ];
}

export function renderUploadPreview(input: UploadRenderInput): string {
  const a = input.audit;
  return [
    "+----------------------------------------------------------------+",
    frameLine("VTK://UPLOAD-COCKPIT//WHAT-LEAVES-MY-MACHINE"),
    "|----------------------------------------------------------------|",
    frameLine("VIBERS UNITE // c0vibe.app // dry-run by default"),
    frameLine(`handle @${input.handle} // ${tierLabel(input.tier)}`),
    frameLine(`endpoint ${input.endpoint}`),
    frameLine(`records ${input.accepted.toLocaleString("en-US")} // providers ${a.totals.providers} // est ${money(a.totals.usd)}`),
    frameLine(`trust signals ${a.trustSignals.length} // labelled NOT USAGE`),
    frameLine(trustSidecar(a)),
    frameLine(codingSnapshot(input)),
    ...orchestrationSnapshot(input),
    frameLine(`bundle ${shortHash(a.integrity.bundleFingerprint)}`),
    frameLine(integritySeal(a)),
    frameLine(sourceSignal(a)),
    frameLine(input.findings.length ? "secret gate BLOCKED - payload stays local" : "secret gate clean - no key-shaped values found"),
    ...transmissionSequencer(input.findings.length > 0 ? "blocked" : "dry-run"),
    ...shareKit(input),
    "+----------------------------------------------------------------+",
    "",
    "Leaves machine on upload:",
    "  - accepted normalized usage records",
    "  - aggregate metadata, provider rollups, measured coding totals, local derived activity trace",
    "  - trust signals and integrity hashes",
    "  - no API keys, prompts, screenshots, raw provider payloads, or local files",
    "",
    renderSecretScan(input.findings),
    "nothing uploaded",
  ].join("\n");
}

export function renderUploadBlocked(input: UploadRenderInput): string {
  return [
    "+----------------------------------------------------------------+",
    frameLine("VTK://UPLOAD-BLOCKED//LOCAL-PROTECTION-ACTIVE"),
    "|----------------------------------------------------------------|",
    frameLine(`handle @${input.handle} // ${input.accepted.toLocaleString("en-US")} records held local`),
    frameLine(`endpoint ${input.endpoint}`),
    frameLine("secret gate blocked the transmission"),
    ...transmissionSequencer("blocked"),
    frameLine("run vibetracker upload --dry-run to inspect before retry"),
    "+----------------------------------------------------------------+",
    "",
    renderSecretScan(input.findings),
  ].join("\n");
}

export function renderUploadSuccess(input: UploadRenderInput, proof: UploadResponseProof = {}): string {
  const publishedProfileUrl = profileUrl(input, proof);
  const persisted = proof.trustSignalsPersisted ?? 0;
  const trustLine = input.audit.trustSignals.length
    ? `trust side rail ${persisted}/${input.audit.trustSignals.length} persisted // NOT USAGE`
    : "trust side rail no trust signals attached";
  return [
    "+----------------------------------------------------------------+",
    frameLine("VTK://UPLOAD-COMPLETE//C0VIBE-PROFILE-FEED-LIVE"),
    "|----------------------------------------------------------------|",
    frameLine("VIBERS UNITE // c0vibe.app"),
    frameLine(`uploaded ${(proof.accepted ?? input.accepted).toLocaleString("en-US")} records as @${input.handle}`),
    frameLine(`tier ${proof.tier ?? input.tier} // ${tierLabel(input.tier)}`),
    frameLine(trustLine),
    frameLine(`bundle ${shortHash(input.audit.integrity.bundleFingerprint)}`),
    frameLine(`profile ${publishedProfileUrl}`),
    ...transmissionSequencer("published"),
    ...shareKit(input, publishedProfileUrl),
    ...(proof.trustSignalWarning ? [frameLine(`warning ${proof.trustSignalWarning}`)] : []),
    "+----------------------------------------------------------------+",
  ].join("\n");
}

export function renderUploadFailure(input: UploadRenderInput, reason: string, localPath: string): string {
  const safeReason = reason.replace(/[\u0000-\u001f\u007f]+/g, " ").trim().slice(0, 2_000);
  const frame = [
    "+----------------------------------------------------------------+",
    frameLine("VTK://UPLOAD-DEFERRED//LOCAL-BUNDLE-SAVED"),
    "|----------------------------------------------------------------|",
    frameLine(`endpoint ${input.endpoint}`),
    frameLine(`reason ${safeReason}`),
    frameLine(`saved ${localPath}`),
    frameLine("retry later: vibetracker upload"),
    "+----------------------------------------------------------------+",
  ].join("\n");
  return safeReason.length > contentWidth ? `${frame}\n\nfull reason: ${safeReason}` : frame;
}
