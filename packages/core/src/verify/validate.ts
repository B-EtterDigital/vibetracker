// The untrusted-data ingest boundary. EVERY record from an adapter API response or an
// uploaded payload passes through here before it can enter the store or a leaderboard.
// Core rule: field content is DATA, never instructions. We rebuild a clean record from
// only whitelisted fields — unknown/dangerous keys and control sequences never survive.

import type {
  NormalizedRecord,
  Category,
  Source,
  Confidence,
  Unit,
  NativeOutputUnit,
} from "../schema/record.ts";

const CATEGORIES = new Set<Category>(["llm", "coding", "image", "video", "music", "audio", "3d", "other"]);
const SOURCES = new Set<Source>(["ledger", "balance_delta", "log", "feed_recon", "proxy", "local", "manual"]);
const CONFIDENCES = new Set<Confidence>(["high", "medium", "low"]);
const UNITS = new Set<Unit>(["token", "image", "clip", "second", "character", "credit", "request"]);
const NATIVE_OUTPUT_UNITS = new Set<NativeOutputUnit>(["track", "image", "clip", "file"]);
const DANGEROUS_KEYS = ["__proto__", "constructor", "prototype"];
const MAX_AMOUNT = 1e13;   // beyond any real usage — anything larger is hostile/garbage
const MAX_TEXT = 200;

// Regexes use \x escapes on purpose — never embed raw control bytes in source.
// Stripping ESC (\x1b) is what makes a malicious `display_name` inert in the CLI table.
const ANSI_CSI = /\x1b\[[0-9;?]*[a-zA-Z]/g;   // CSI escape sequences (color/cursor)
const CONTROL = /[\x00-\x1f\x7f-\x9f]/g;      // C0 + DEL + C1 (incl. bare ESC, newlines, tabs)

export function sanitizeText(input: unknown, maxLen = MAX_TEXT): string {
  let s = typeof input === "string" ? input : input == null ? "" : String(input);
  s = s.replace(ANSI_CSI, "").replace(CONTROL, "");
  if (s.length > maxLen) s = s.slice(0, maxLen);
  return s.trim();
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  sanitized?: NormalizedRecord;
}

export interface IngestOpts {
  /** True for anything a user could control (adapter API content, uploads). Forces
   *  verified:false — the client can never self-certify data as verified. */
  untrustedSource?: boolean;
}

function finiteAmount(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > MAX_AMOUNT) return null;
  return v;
}

export function validateRecord(input: unknown, opts: IngestOpts = {}): ValidationResult {
  const errors: string[] = [];
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, errors: ["record is not an object"] };
  }
  const rec = input as Record<string, unknown>;

  for (const k of DANGEROUS_KEYS) {
    if (Object.prototype.hasOwnProperty.call(rec, k)) errors.push(`dangerous key: ${k}`);
  }

  const ts = typeof rec.ts === "string" ? rec.ts : "";
  const t = Date.parse(ts);
  if (!ts || Number.isNaN(t)) errors.push("invalid ts");
  else {
    const y = new Date(t).getUTCFullYear();
    if (y < 2000 || y > 2200) errors.push("ts out of plausible range");
  }

  const quantity = finiteAmount(rec.quantity);
  if (quantity === null) errors.push("quantity not a valid non-negative finite number");
  const rawAmount = finiteAmount(rec.rawAmount);
  if (rawAmount === null) errors.push("rawAmount not a valid non-negative finite number");

  const hasOutputQuantity = rec.outputQuantity != null;
  const hasOutputUnit = rec.outputUnit != null;
  const hasDurationSeconds = rec.durationSeconds != null;
  const outputQuantity = hasOutputQuantity ? finiteAmount(rec.outputQuantity) : undefined;
  const durationSeconds = hasDurationSeconds ? finiteAmount(rec.durationSeconds) : undefined;
  if (hasOutputQuantity && outputQuantity === null) {
    errors.push("outputQuantity not a valid non-negative finite number");
  }
  if (hasDurationSeconds && durationSeconds === null) {
    errors.push("durationSeconds not a valid non-negative finite number");
  }
  if (hasOutputUnit && !NATIVE_OUTPUT_UNITS.has(rec.outputUnit as NativeOutputUnit)) {
    errors.push("outputUnit is not supported");
  }
  if (hasOutputUnit !== hasOutputQuantity) {
    errors.push("outputQuantity and outputUnit must be provided together");
  }
  if (hasDurationSeconds && !hasOutputUnit) {
    errors.push("durationSeconds requires an outputQuantity and outputUnit");
  }

  if (errors.length) return { ok: false, errors };

  // usdEst is a derived convenience field: drop it if malformed rather than reject.
  const usdEst = rec.usdEst != null ? finiteAmount(rec.usdEst) ?? undefined : undefined;

  const sanitized: NormalizedRecord = {
    ts,
    provider: sanitizeText(rec.provider, 64) || "unknown",
    category: CATEGORIES.has(rec.category as Category) ? (rec.category as Category) : "other",
    operation: sanitizeText(rec.operation, 64) || "unknown",
    quantity: quantity as number,
    unit: UNITS.has(rec.unit as Unit) ? (rec.unit as Unit) : "request",
    rawAmount: rawAmount as number,
    rawUnit: sanitizeText(rec.rawUnit, 32) || "unit",
    source: SOURCES.has(rec.source as Source) ? (rec.source as Source) : "manual",
    confidence: CONFIDENCES.has(rec.confidence as Confidence) ? (rec.confidence as Confidence) : "low",
    // A user/untrusted source can never assert verified. Only backend attestation sets it.
    verified: opts.untrustedSource ? false : rec.verified === true,
  };
  if (rec.model != null) sanitized.model = sanitizeText(rec.model, 128);
  if (outputQuantity != null && hasOutputUnit) {
    sanitized.outputQuantity = outputQuantity;
    sanitized.outputUnit = rec.outputUnit as NativeOutputUnit;
  }
  if (durationSeconds != null) sanitized.durationSeconds = durationSeconds;
  if (usdEst != null) sanitized.usdEst = usdEst;
  if (rec.accountId != null) sanitized.accountId = sanitizeText(rec.accountId, 128);
  if (rec.profileId != null) sanitized.profileId = sanitizeText(rec.profileId, 128);
  if (rec.teamId != null) sanitized.teamId = sanitizeText(rec.teamId, 128);
  if (rec.sessionId != null) sanitized.sessionId = sanitizeText(rec.sessionId, 128);

  return { ok: true, errors: [], sanitized };
}

export interface IngestResult {
  accepted: NormalizedRecord[];
  rejected: Array<{ index: number; errors: string[] }>;
}

/** Validate + sanitize a batch. Rejected records are reported, never silently dropped. */
export function ingestRecords(records: unknown[], opts: IngestOpts = {}): IngestResult {
  const accepted: NormalizedRecord[] = [];
  const rejected: Array<{ index: number; errors: string[] }> = [];
  records.forEach((r, index) => {
    const res = validateRecord(r, opts);
    if (res.ok && res.sanitized) accepted.push(res.sanitized);
    else rejected.push({ index, errors: res.errors });
  });
  return { accepted, rejected };
}
