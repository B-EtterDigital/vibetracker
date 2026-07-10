// Device-flow crypto for the /api/cli/* route handlers (Node runtime). Mirror of
// @vibetracker/backend cli-auth.ts (kept in sync); raw secrets/tokens are never persisted.
import { randomBytes, createHash } from "node:crypto";

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function generateDeviceCodes(): { deviceCode: string; userCode: string; deviceCodeHash: string } {
  const deviceCode = randomBytes(32).toString("base64url");
  const raw = randomBytes(4).toString("hex").toUpperCase();
  return { deviceCode, userCode: `${raw.slice(0, 4)}-${raw.slice(4, 8)}`, deviceCodeHash: sha256Hex(deviceCode) };
}

export function issueCliToken(): { token: string; tokenHash: string } {
  const token = "vt_" + randomBytes(32).toString("base64url");
  return { token, tokenHash: sha256Hex(token) };
}
