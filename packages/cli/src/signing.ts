import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { generateKeyPairSync, createPublicKey, sign, verify } from "node:crypto";

export interface SigningKeyPair {
  schema: "vibetracker.signing-key/0.1";
  createdAt: string;
  publicKeyPem: string;
  privateKeyPem: string;
}

export interface SignedBundle {
  schema: "vibetracker.signed-bundle/0.1";
  signedAt: string;
  alg: "Ed25519";
  publicKeyPem: string;
  payload: unknown;
  signature: string;
}

export function canonicalJson(value: unknown): string {
  if (value == null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(obj[key])}`).join(",")}}`;
}

export function loadOrCreateSigningKey(path: string, now = new Date().toISOString()): SigningKeyPair {
  if (existsSync(path)) {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as SigningKeyPair;
    if (parsed.schema !== "vibetracker.signing-key/0.1") throw new Error("unknown signing key schema");
    return parsed;
  }
  const pair = generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  const key: SigningKeyPair = {
    schema: "vibetracker.signing-key/0.1",
    createdAt: now,
    publicKeyPem: pair.publicKey,
    privateKeyPem: pair.privateKey,
  };
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(key, null, 2), { encoding: "utf8", mode: 0o600 });
  return key;
}

export function signBundle(payload: unknown, key: SigningKeyPair, signedAt = new Date().toISOString()): SignedBundle {
  const bytes = Buffer.from(canonicalJson(payload));
  const signature = sign(null, bytes, key.privateKeyPem).toString("base64");
  return {
    schema: "vibetracker.signed-bundle/0.1",
    signedAt,
    alg: "Ed25519",
    publicKeyPem: key.publicKeyPem,
    payload,
    signature,
  };
}

export function verifySignedBundle(bundle: SignedBundle): boolean {
  if (bundle.schema !== "vibetracker.signed-bundle/0.1" || bundle.alg !== "Ed25519") return false;
  const publicKey = createPublicKey(bundle.publicKeyPem);
  return verify(null, Buffer.from(canonicalJson(bundle.payload)), publicKey, Buffer.from(bundle.signature, "base64"));
}

export function readSignedBundle(path: string): SignedBundle {
  return JSON.parse(readFileSync(path, "utf8")) as SignedBundle;
}

export function writeSignedBundle(path: string, bundle: SignedBundle): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(bundle, null, 2), "utf8");
}
