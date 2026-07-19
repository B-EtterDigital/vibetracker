// Zero-dependency local store: append-only JSONL. Works today without any native
// deps; a SQLite-backed store (node:sqlite / better-sqlite3) can implement the same
// two functions later. Records live under ~/.vibetracker (git-ignored).

import {
  appendFileSync,
  closeSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { dirname } from "node:path";
import type { NormalizedRecord } from "../schema/record.ts";

const ENC_SCHEMA = "vibetracker.encrypted-store/0.1";

function passphrase(): string {
  const pass = process.env.VT_STORE_PASSPHRASE;
  if (!pass) throw new Error("VT_STORE_PASSPHRASE is required for encrypted store access");
  return pass;
}

function keyFrom(pass: string, salt: Buffer): Buffer {
  return scryptSync(pass, salt, 32);
}

function encryptText(plain: string): string {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyFrom(passphrase(), salt), iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return JSON.stringify({
    schema: ENC_SCHEMA,
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  });
}

function decryptText(payload: string): string {
  const parsed = JSON.parse(payload) as { schema?: string; salt: string; iv: string; tag: string; ciphertext: string };
  if (parsed.schema !== ENC_SCHEMA) throw new Error("unknown encrypted store schema");
  const decipher = createDecipheriv("aes-256-gcm", keyFrom(passphrase(), Buffer.from(parsed.salt, "base64")), Buffer.from(parsed.iv, "base64"));
  decipher.setAuthTag(Buffer.from(parsed.tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(parsed.ciphertext, "base64")), decipher.final()]).toString("utf8");
}

function isEncrypted(path: string): boolean {
  return path.endsWith(".enc");
}

export function appendRecords(path: string, records: NormalizedRecord[]): void {
  if (records.length === 0) return;
  mkdirSync(dirname(path), { recursive: true });
  if (isEncrypted(path)) {
    writeRecords(path, [...readRecords(path), ...records]);
    return;
  }
  const payload = records.map((r) => JSON.stringify(r)).join("\n") + "\n";
  appendFileSync(path, payload, "utf8");
}

export interface AtomicWriteOptions {
  /** Fault-injection/coordination hook after the durable temp write and before rename. */
  beforeRename?: (tempPath: string, destinationPath: string) => void;
}

/** Atomically replace the whole store without ever truncating the live ledger in place. */
export function writeRecords(path: string, records: NormalizedRecord[], options: AtomicWriteOptions = {}): void {
  const directory = dirname(path);
  mkdirSync(directory, { recursive: true });
  const payload = records.length ? records.map((r) => JSON.stringify(r)).join("\n") + "\n" : "";
  const persisted = isEncrypted(path) ? encryptText(payload) : payload;
  const tempPath = `${path}.${process.pid}.${randomBytes(8).toString("hex")}.tmp`;
  let descriptor: number | undefined;
  try {
    descriptor = openSync(tempPath, "wx", 0o600);
    writeFileSync(descriptor, persisted, "utf8");
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    options.beforeRename?.(tempPath, path);
    renameSync(tempPath, path);
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
    if (existsSync(tempPath)) unlinkSync(tempPath);
  }
}

export function readRecords(path: string): NormalizedRecord[] {
  if (!existsSync(path)) return [];
  const raw = readFileSync(path, "utf8");
  const text = isEncrypted(path) ? decryptText(raw) : raw;
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const out: NormalizedRecord[] = [];
  lines.forEach((line, i) => {
    try {
      out.push(JSON.parse(line) as NormalizedRecord);
    } catch (err) {
      // VTRS: a corrupt store line is a real error — fail loudly with context.
      throw new Error(`corrupt record at ${path}:${i + 1}: ${(err as Error).message}`);
    }
  });
  return out;
}
