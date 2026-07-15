export const CLI_PACKAGE = "vibetrack";
export const CLI_RUNNER = `npx ${CLI_PACKAGE}`;

export function cliCommand(subcommand: string): string {
  const value = subcommand.trim();
  return value ? `${CLI_RUNNER} ${value}` : CLI_RUNNER;
}

export function cliSequence(subcommands: readonly string[], separator = " -> "): string {
  return subcommands.map(cliCommand).join(separator);
}
