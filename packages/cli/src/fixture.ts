import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { redactSecrets, scanSecrets } from "../../core/src/security/secrets.ts";

export interface FixtureRedactionResult {
  path: string;
  out?: string;
  findings: ReturnType<typeof scanSecrets>;
  payload: unknown;
}

export function redactFixture(path: string, out?: string): FixtureRedactionResult {
  const payload = JSON.parse(readFileSync(path, "utf8")) as unknown;
  const findings = scanSecrets(payload);
  const redacted = redactSecrets(payload);
  if (out) {
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify(redacted, null, 2) + "\n", "utf8");
  }
  return { path, out, findings, payload: redacted };
}

export function renderFixtureRedaction(result: FixtureRedactionResult): string {
  return [
    "FIXTURE REDACTION",
    `source: ${result.path}`,
    result.out ? `output: ${result.out}` : "output: stdout",
    `secrets redacted: ${result.findings.length}`,
  ].join("\n");
}
