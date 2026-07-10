import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { IntegrityReport } from "./audit.ts";

export interface LedgerSeal {
  schema: "vibetracker.ledger-seal/0.1";
  sealedAt: string;
  recordCount: number;
  chainHead: string;
  bundleFingerprint: string;
}

export interface LedgerVerifyResult {
  ok: boolean;
  expected?: LedgerSeal;
  current: IntegrityReport;
  reason?: string;
}

export function createLedgerSeal(integrity: IntegrityReport, sealedAt = new Date().toISOString()): LedgerSeal {
  return {
    schema: "vibetracker.ledger-seal/0.1",
    sealedAt,
    recordCount: integrity.recordCount,
    chainHead: integrity.chainHead,
    bundleFingerprint: integrity.bundleFingerprint,
  };
}

export function writeLedgerSeal(path: string, seal: LedgerSeal): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(seal, null, 2));
}

export function readLedgerSeal(path: string): LedgerSeal | undefined {
  if (!existsSync(path)) return undefined;
  const seal = JSON.parse(readFileSync(path, "utf8")) as LedgerSeal;
  if (seal.schema !== "vibetracker.ledger-seal/0.1") throw new Error("unknown ledger seal schema");
  return seal;
}

export function verifyLedgerSeal(path: string, current: IntegrityReport): LedgerVerifyResult {
  const expected = readLedgerSeal(path);
  if (!expected) return { ok: false, current, reason: "no seal exists yet" };
  if (expected.recordCount !== current.recordCount) return { ok: false, expected, current, reason: "record count changed" };
  if (expected.chainHead !== current.chainHead) return { ok: false, expected, current, reason: "record chain changed" };
  if (expected.bundleFingerprint !== current.bundleFingerprint) return { ok: false, expected, current, reason: "bundle fingerprint changed" };
  return { ok: true, expected, current };
}

export function ledgerSealSummary(seal: LedgerSeal): string {
  return `${seal.recordCount} records · chain ${seal.chainHead.slice(0, 16)}...${seal.chainHead.slice(-8)} · sealed ${seal.sealedAt}`;
}

export function ledgerVerifySummary(result: LedgerVerifyResult): string {
  if (result.ok) return `ledger verified · ${ledgerSealSummary(result.expected!)}`;
  return `ledger changed · ${result.reason ?? "unknown"} · current ${result.current.recordCount} records · chain ${result.current.chainHead.slice(0, 16)}...${result.current.chainHead.slice(-8)}`;
}
