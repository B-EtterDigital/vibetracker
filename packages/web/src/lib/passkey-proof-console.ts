export type PasskeyProofState = "idle" | "working" | "ready" | "verified" | "error";
export type PasskeyProofImpact = "identity" | "local_only" | "not_usage" | "privacy" | "publish";

export interface PasskeyProofInput {
  state: PasskeyProofState;
  supported: boolean;
  hasCredential: boolean;
}

export interface PasskeyProofRail {
  id: "browser-boundary" | "credential-vault" | "usage-firewall" | "cli-approval" | "c0vibe-publish";
  call: string;
  label: string;
  impact: PasskeyProofImpact;
  value: string;
  command: string;
  note: string;
  guardrail: string;
  meter: number;
  terminal: string[];
}

export interface PasskeyProofConsole {
  headline: string;
  terminalLines: string[];
  rails: PasskeyProofRail[];
  totals: {
    identity: number;
    localOnly: number;
    notUsage: number;
    publish: number;
  };
}

export interface PasskeyCeremonyStage {
  id: "secure-context" | "authenticator-prompt" | "credential-preview" | "usage-firewall" | "cli-link" | "public-publish";
  call: string;
  label: string;
  impact: PasskeyProofImpact;
  value: string;
  status: string;
  command: string;
  source: string;
  target: string;
  guardrail: string;
  meter: number;
  terminal: string[];
}

export interface PasskeyCeremonyControl {
  headline: string;
  subline: string;
  terminalLines: string[];
  stages: PasskeyCeremonyStage[];
  counters: {
    providerCalls: number;
    promptReads: number;
    outputReads: number;
    usageMutations: number;
    publishWrites: number;
  };
  totals: Record<PasskeyProofImpact, number>;
  invariants: string[];
}

export interface PasskeyRecoveryStep {
  id: "secure-context-check" | "credential-receipt" | "backup-authenticator" | "cli-refresh" | "usage-freeze" | "public-dry-run";
  call: string;
  label: string;
  impact: PasskeyProofImpact;
  value: string;
  status: string;
  command: string;
  note: string;
  guardrail: string;
  meter: number;
  frames: string[];
  checklist: string[];
}

export interface PasskeyRecoveryRelay {
  headline: string;
  subline: string;
  terminalLines: string[];
  steps: PasskeyRecoveryStep[];
  totals: {
    steps: number;
    identity: number;
    localOnly: number;
    notUsage: number;
    privacy: number;
    publish: number;
    providerCalls: number;
    usageMutations: number;
    publicWrites: number;
    averageMeter: number;
  };
}

function fit(value: string | number, width: number): string {
  return String(value).padEnd(width).slice(0, width);
}

function frameLine(value: string): string {
  return `| ${fit(value, 60)} |`;
}

function ceremonyLine(value: string): string {
  return `| ${fit(value, 62)} |`;
}

function terminal(lines: string[]): string[] {
  return lines.map((line) => fit(line, 28));
}

function recoveryFrames(lines: string[]): string[] {
  return lines.map((line) => fit(line, 30));
}

function ceremonyTerminal(stage: Omit<PasskeyCeremonyStage, "terminal">): string[] {
  const impact = stage.impact === "not_usage" ? "NOT USAGE" : stage.impact.replace("_", " ").toUpperCase();
  return [
    ceremonyLine(`${stage.call} // ${impact}`),
    ceremonyLine(`${stage.source} -> ${stage.target}`),
    ceremonyLine(`${stage.status} // ${stage.command}`),
    ceremonyLine(stage.guardrail),
  ];
}

export function buildPasskeyCeremonyControl(input: PasskeyProofInput): PasskeyCeremonyControl {
  const browserValue = input.supported ? "secure ready" : "secure context needed";
  const credentialValue = input.hasCredential ? "credential id preview" : "no local proof";
  const stateValue = input.state === "verified" ? "asserted" : input.state;
  const counters = {
    providerCalls: 0,
    promptReads: 0,
    outputReads: 0,
    usageMutations: 0,
    publishWrites: 0,
  };
  const stage = (value: Omit<PasskeyCeremonyStage, "terminal">): PasskeyCeremonyStage => ({
    ...value,
    terminal: ceremonyTerminal(value),
  });
  const stages: PasskeyCeremonyStage[] = [
    stage({
      id: "secure-context",
      call: "SECURE",
      label: "Secure browser context",
      impact: "identity",
      value: browserValue,
      status: input.supported ? "ready" : "blocked",
      command: "window.isSecureContext",
      source: "browser boundary",
      target: "WebAuthn ceremony",
      guardrail: "No AI usage is touched.",
      meter: input.supported ? 94 : 38,
    }),
    stage({
      id: "authenticator-prompt",
      call: "PROMPT",
      label: "Platform authenticator",
      impact: "identity",
      value: input.state === "verified" ? "asserted" : input.state === "working" ? "prompting" : "user mediated",
      status: input.state === "error" ? "attention" : input.state === "working" ? "waiting" : "manual",
      command: "navigator.credentials.create/get",
      source: "browser API",
      target: "device authenticator",
      guardrail: "Authenticator proves account control only.",
      meter: input.state === "verified" ? 100 : input.state === "working" ? 82 : input.state === "error" ? 42 : 64,
    }),
    stage({
      id: "credential-preview",
      call: "VAULT",
      label: "Credential id preview",
      impact: "local_only",
      value: credentialValue,
      status: input.hasCredential ? "stored" : "empty",
      command: "localStorage:vibeusage.passkey.rawId",
      source: "browser local state",
      target: "credential id preview",
      guardrail: "Private key stays in authenticator.",
      meter: input.hasCredential ? 88 : 50,
    }),
    stage({
      id: "usage-firewall",
      call: "FIREWALL",
      label: "Usage mutation firewall",
      impact: "not_usage",
      value: "NOT USAGE",
      status: "0 mutations",
      command: "vibetracker audit",
      source: "identity proof",
      target: "usage ledger",
      guardrail: "Spend, credits, rank, and records unchanged.",
      meter: 100,
    }),
    stage({
      id: "cli-link",
      call: "CLI",
      label: "CLI approval bridge",
      impact: "privacy",
      value: stateValue,
      status: input.state === "verified" ? "ready" : "after proof",
      command: "vibetracker login",
      source: "C0VIBE account",
      target: "local CLI token",
      guardrail: "Upload still requires preview.",
      meter: input.state === "verified" ? 92 : input.state === "ready" ? 78 : 58,
    }),
    stage({
      id: "public-publish",
      call: "PUBLISH",
      label: "Public profile relay",
      impact: "publish",
      value: "Vibers Unite",
      status: input.state === "verified" ? "opt-in" : "locked",
      command: "vibetracker upload --dry-run",
      source: "reviewed aggregates",
      target: "c0vibe.app profile",
      guardrail: "Dry-run before public profile.",
      meter: input.state === "verified" ? 90 : 54,
    }),
  ];
  const totals = stages.reduce<Record<PasskeyProofImpact, number>>((acc, current) => {
    acc[current.impact] += 1;
    return acc;
  }, { identity: 0, local_only: 0, not_usage: 0, privacy: 0, publish: 0 });

  return {
    headline: "Passkey ceremony control",
    subline: "A WebAuthn handoff map that keeps account identity, browser-local credential state, usage records, CLI approval, and public publishing on separate rails.",
    terminalLines: [
      "+----------------------------------------------------------------+",
      ceremonyLine("VTK://PASSKEY-CEREMONY//IDENTITY-ONLY//C0VIBE.APP"),
      ceremonyLine(`browser ${browserValue} // credential ${credentialValue}`),
      ceremonyLine(`state ${stateValue} // stages ${stages.length}`),
      ceremonyLine(`calls ${counters.providerCalls} prompts ${counters.promptReads} outputs ${counters.outputReads}`),
      ceremonyLine(`usage mutations ${counters.usageMutations} // publish writes ${counters.publishWrites}`),
      ceremonyLine("Vibers Unite // passkey proof is not usage"),
      "+----------------------------------------------------------------+",
    ],
    stages,
    counters,
    totals,
    invariants: [
      "Passkeys prove account control, not usage truth.",
      "No provider calls, prompt reads, or output reads occur during the ceremony.",
      "Usage totals, credits, spend, records, and rank remain unchanged.",
      "Public profile publishing still requires dry-run review and explicit upload.",
    ],
  };
}

export function buildPasskeyRecoveryRelay(input: PasskeyProofInput): PasskeyRecoveryRelay {
  const browserValue = input.supported ? "secure ready" : "secure context needed";
  const credentialValue = input.hasCredential ? "local proof present" : "no local proof";
  const stateValue = input.state === "verified" ? "asserted" : input.state;
  const steps: PasskeyRecoveryStep[] = [
    {
      id: "secure-context-check",
      call: "CHECK",
      label: "Secure context drill",
      impact: "identity",
      value: browserValue,
      status: input.supported ? "ready" : "blocked",
      command: "window.isSecureContext",
      note: "Recovery starts by checking whether this browser can run a WebAuthn ceremony at all.",
      guardrail: "A blocked browser never becomes usage proof.",
      meter: input.supported ? 94 : 36,
      frames: recoveryFrames(["https context", "webauthn available", "identity rail armed"]),
      checklist: ["secure origin", "webauthn API", "manual user action", "no provider calls"],
    },
    {
      id: "credential-receipt",
      call: "LOCAL",
      label: "Local credential receipt",
      impact: "local_only",
      value: credentialValue,
      status: input.hasCredential ? "stored" : "empty",
      command: "localStorage:vibeusage.passkey.rawId",
      note: "The page can show a credential id preview, but it never exports the private key or raw usage ledger.",
      guardrail: "Private key stays in the authenticator.",
      meter: input.hasCredential ? 88 : 48,
      frames: recoveryFrames(["rawId preview", "secret unavailable", "local receipt only"]),
      checklist: ["id preview", "secret absent", "browser local", "clearable state"],
    },
    {
      id: "backup-authenticator",
      call: "BACKUP",
      label: "Second authenticator path",
      impact: "identity",
      value: input.supported ? "add another passkey" : "wait for secure context",
      status: input.supported ? "available" : "blocked",
      command: "navigator.credentials.create",
      note: "A second passkey is treated as another identity ceremony, not as stronger usage evidence.",
      guardrail: "More authenticators do not raise usage rank.",
      meter: input.supported ? 84 : 38,
      frames: recoveryFrames(["second key slot", "user mediated", "identity only"]),
      checklist: ["user present", "attestation none", "account bound", "rank unchanged"],
    },
    {
      id: "cli-refresh",
      call: "TOKEN",
      label: "CLI token refresh",
      impact: "privacy",
      value: stateValue,
      status: input.state === "verified" ? "ready" : "after proof",
      command: "vibetracker login --refresh",
      note: "Refreshing a local uploader token stays separate from collecting records or publishing a profile.",
      guardrail: "Token refresh does not read prompts, outputs, files, or spend.",
      meter: input.state === "verified" ? 92 : input.state === "ready" ? 78 : 58,
      frames: recoveryFrames(["device code loop", "scoped token", "ledger untouched"]),
      checklist: ["account approval", "scoped token", "local store", "no usage read"],
    },
    {
      id: "usage-freeze",
      call: "FREEZE",
      label: "Usage mutation freeze",
      impact: "not_usage",
      value: "rankImpact 0",
      status: "0 mutations",
      command: "vibetracker audit",
      note: "Recovery drills are visible trust context only; score, spend, credits, and provider totals stay frozen.",
      guardrail: "Recovery is NOT USAGE.",
      meter: 100,
      frames: recoveryFrames(["score frozen", "spend frozen", "rank frozen"]),
      checklist: ["0 records", "0 spend", "0 rank delta", "not usage label"],
    },
    {
      id: "public-dry-run",
      call: "DRYRUN",
      label: "Public profile dry-run",
      impact: "publish",
      value: "Vibers Unite",
      status: input.state === "verified" ? "preview" : "locked",
      command: "vibetracker upload --dry-run",
      note: "The public relay stays opt-in and preview-first, even after account recovery succeeds.",
      guardrail: "No c0vibe.app write before dry-run review.",
      meter: input.state === "verified" ? 90 : 54,
      frames: recoveryFrames(["preview bundle", "c0vibe.app rail", "explicit publish"]),
      checklist: ["aggregate only", "review screen", "signed bundle", "manual publish"],
    },
  ];

  const totals = steps.reduce((acc, step) => {
    if (step.impact === "identity") acc.identity += 1;
    if (step.impact === "local_only") acc.localOnly += 1;
    if (step.impact === "not_usage") acc.notUsage += 1;
    if (step.impact === "privacy") acc.privacy += 1;
    if (step.impact === "publish") acc.publish += 1;
    acc.averageMeter += step.meter;
    return acc;
  }, {
    steps: steps.length,
    identity: 0,
    localOnly: 0,
    notUsage: 0,
    privacy: 0,
    publish: 0,
    providerCalls: 0,
    usageMutations: 0,
    publicWrites: 0,
    averageMeter: 0,
  });
  totals.averageMeter = Math.round(totals.averageMeter / steps.length);

  return {
    headline: "Recovery relay",
    subline: "A passkey recovery drill for secure context checks, backup authenticators, CLI token refresh, dry-run review, and zero usage movement.",
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine("VTK://PASSKEY-RECOVERY-RELAY//IDENTITY-ONLY//NOT-USAGE"),
      "|--------------------------------------------------------------|",
      frameLine(`browser ${fit(browserValue, 18)} credential ${fit(credentialValue, 20)}`),
      frameLine("secure check -> local receipt -> backup key -> token"),
      frameLine("usage mutations 0 // public writes 0 // rankImpact 0"),
      frameLine("Vibers Unite // c0vibe.app // recovery is not usage"),
      "+--------------------------------------------------------------+",
    ],
    steps,
    totals,
  };
}

export function buildPasskeyProofConsole(input: PasskeyProofInput): PasskeyProofConsole {
  const browserValue = input.supported ? "secure ready" : "secure context needed";
  const credentialValue = input.hasCredential ? "local id stored" : "no local proof";
  const stateValue = input.state === "verified" ? "asserted" : input.state;
  const rails: PasskeyProofRail[] = [
    {
      id: "browser-boundary",
      call: "BROWSER",
      label: "Authenticator boundary",
      impact: "identity",
      value: browserValue,
      command: "navigator.credentials.create",
      note: "WebAuthn asks the platform authenticator to prove account control inside the browser boundary.",
      guardrail: "Identity proof only.",
      meter: input.supported ? 92 : 38,
      terminal: terminal(["secure context check", "platform auth prompt", "rp: VibeUsage", "attestation none"]),
    },
    {
      id: "credential-vault",
      call: "VAULT",
      label: "Local credential vault",
      impact: "local_only",
      value: credentialValue,
      command: "localStorage:vibeusage.passkey.rawId",
      note: "The page keeps only a credential id preview locally; the authenticator keeps the real secret.",
      guardrail: "No usage records stored here.",
      meter: input.hasCredential ? 88 : 52,
      terminal: terminal(["rawId preview only", "secret stays in device", "browser-local state", "clearable by user"]),
    },
    {
      id: "usage-firewall",
      call: "FIREWALL",
      label: "Usage ledger firewall",
      impact: "not_usage",
      value: "NOT USAGE",
      command: "vibetracker audit",
      note: "Passkeys never change spend, credits, rank, provider totals, or trusted usage status.",
      guardrail: "Trust is not spend.",
      meter: 100,
      terminal: terminal(["rank mutation blocked", "spend totals untouched", "records stay separate", "trust label visible"]),
    },
    {
      id: "cli-approval",
      call: "CLI",
      label: "CLI approval handoff",
      impact: "privacy",
      value: stateValue,
      command: "vibetracker login",
      note: "The CLI can prove uploader identity without reading local usage until an explicit upload flow.",
      guardrail: "Upload still needs preview.",
      meter: input.state === "verified" ? 94 : input.state === "ready" ? 78 : 58,
      terminal: terminal(["device code opens", "account approves", "token is scoped", "usage stays local"]),
    },
    {
      id: "c0vibe-publish",
      call: "PUBLISH",
      label: "C0VIBE publish receipt",
      impact: "publish",
      value: "Vibers Unite",
      command: "vibetracker upload --dry-run",
      note: "Public profile publishing keeps identity, self-reported usage, and trust evidence visibly separated.",
      guardrail: "Dry-run before public profile.",
      meter: 86,
      terminal: terminal(["dry-run bundle", "signed aggregate", "profile labels rails", "c0vibe.app receipt"]),
    },
  ];
  const totals = rails.reduce((acc, rail) => {
    if (rail.impact === "identity") acc.identity += 1;
    if (rail.impact === "local_only") acc.localOnly += 1;
    if (rail.impact === "not_usage") acc.notUsage += 1;
    if (rail.impact === "publish") acc.publish += 1;
    return acc;
  }, { identity: 0, localOnly: 0, notUsage: 0, publish: 0 });

  return {
    headline: "Passkey proof console",
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine("VTK://PASSKEY-PROOF//IDENTITY-ONLY//C0VIBE.APP"),
      "|--------------------------------------------------------------|",
      frameLine(`browser ${fit(browserValue, 20)} credential ${fit(credentialValue, 18)}`),
      frameLine(`state ${fit(stateValue, 14)} identity ${totals.identity} local ${totals.localOnly} not usage ${totals.notUsage}`),
      frameLine("passkey proves account control; usage records stay separate"),
      frameLine("Vibers Unite // dry-run before public profile"),
      "+--------------------------------------------------------------+",
    ],
    rails,
    totals,
  };
}
