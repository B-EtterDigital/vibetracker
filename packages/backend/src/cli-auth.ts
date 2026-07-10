// Device-flow crypto helpers for `vibetracker login`. Raw secrets/tokens are shown to the
// CLI once; only their sha256 is persisted (vibetracker_cli_auth / vibetracker_cli_tokens).

import { randomBytes, createHash } from "node:crypto";

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/** Device code = CLI-held secret; user code = short code the human confirms in the browser. */
export function generateDeviceCodes(): { deviceCode: string; userCode: string; deviceCodeHash: string } {
  const deviceCode = randomBytes(32).toString("base64url");
  const raw = randomBytes(4).toString("hex").toUpperCase();
  const userCode = `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
  return { deviceCode, userCode, deviceCodeHash: sha256Hex(deviceCode) };
}

/** Bearer token issued on approval. Store only tokenHash; hand the raw token to the CLI once. */
export function issueCliToken(): { token: string; tokenHash: string } {
  const token = "vt_" + randomBytes(32).toString("base64url");
  return { token, tokenHash: sha256Hex(token) };
}
