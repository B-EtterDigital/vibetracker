// Reuse an existing GitHub CLI session for identity proof. The credential is read only during an
// explicit `vibetracker login`, passed to the verifier once, and never written to VibeTRACKER's
// config, keyring, logs, receipts, or telemetry. GitHub CLI remains the credential owner.

import { spawnSync, type SpawnSyncReturns } from "node:child_process";

type RunCommand = (
  command: string,
  args: readonly string[],
) => Pick<SpawnSyncReturns<string>, "status" | "stdout">;

const runCommand: RunCommand = (command, args) => spawnSync(command, args, {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "ignore"],
  timeout: 5_000,
});

export function readGitHubCliToken(run: RunCommand = runCommand): string | null {
  const result = run("gh", ["auth", "token"]);
  if (result.status !== 0 || typeof result.stdout !== "string") return null;
  const token = result.stdout.trim();
  if (!token || token.length > 1024 || /\s/.test(token)) return null;
  return token;
}
