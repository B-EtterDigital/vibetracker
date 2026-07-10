import { providerBrand } from "./provider-brand.ts";

export type DeviceAuthState = "idle" | "working" | "done" | "error";

export interface DeviceAuthBridgeStep {
  id: "terminal" | "browser" | "token" | "ledger";
  call: string;
  label: string;
  detail: string;
  status: "match-code" | "session" | "attested" | "local-first";
}

export type DeviceAuthLaunchImpact = "identity" | "not_usage" | "local_only" | "publish";

export interface DeviceAuthLaunchStep {
  id: "terminal-match" | "browser-session" | "token-issue" | "local-ledger" | "c0vibe-relay";
  phase: string;
  call: string;
  label: string;
  impact: DeviceAuthLaunchImpact;
  command: string;
  note: string;
  guardrail: string;
  meter: number;
  frames: string[];
  transcript: string[];
}

export interface DeviceAuthLaunchTheatre {
  headline: string;
  terminalLines: string[];
  steps: DeviceAuthLaunchStep[];
  totals: Record<DeviceAuthLaunchImpact, number>;
}

export type DeviceApprovalRunwayImpact = "identity" | "not_usage" | "privacy" | "local_only" | "publish";

export interface DeviceApprovalRunwayRail {
  id: "code-mirror" | "session-proof" | "zero-upload" | "privacy-dry-run" | "local-scan" | "public-relay";
  phase: string;
  label: string;
  impact: DeviceApprovalRunwayImpact;
  status: string;
  command: string;
  note: string;
  guardrail: string;
  meter: number;
  frames: string[];
  transcript: string[];
  mark: string;
  from: string;
  to: string;
  ink: string;
}

export interface DeviceApprovalRunwaySurprise {
  id: "higgsfield-prism" | "codex-cube" | "c0vibe-relay";
  label: string;
  status: string;
  frames: string[];
  mark: string;
  from: string;
  to: string;
  ink: string;
}

export interface DeviceApprovalFlightTapeStep {
  id: "terminal-code" | "browser-session" | "zero-movement" | "local-ledger" | "public-relay";
  label: string;
  impact: DeviceApprovalRunwayImpact;
  status: string;
  command: string;
  readout: string;
  guardrail: string;
  terminalLine: string;
  meter: number;
  frames: string[];
  mark: string;
  from: string;
  to: string;
  ink: string;
}

export interface DeviceApprovalRunway {
  headline: string;
  subline: string;
  codeLabel: string;
  terminalLines: string[];
  counters: {
    providerCalls: number;
    hiddenUploads: number;
    usageUploads: number;
    ledgerWrites: number;
  };
  totals: Record<DeviceApprovalRunwayImpact, number>;
  rails: DeviceApprovalRunwayRail[];
  flightTape: DeviceApprovalFlightTapeStep[];
  surprises: DeviceApprovalRunwaySurprise[];
}

export type DeviceAuthControlImpact = "identity" | "not_usage" | "local_only" | "privacy" | "publish";

export interface DeviceAuthControlSignal {
  id: "terminal-code" | "browser-session" | "token-poll" | "local-ledger" | "dry-run" | "public-relay";
  label: string;
  impact: DeviceAuthControlImpact;
  value: string;
  status: string;
  command: string;
  source: string;
  target: string;
  guardrail: string;
  meter: number;
  terminal: string[];
  mark: string;
  from: string;
  to: string;
  ink: string;
}

export interface DeviceAuthControlRoom {
  headline: string;
  subline: string;
  codeLabel: string;
  terminalLines: string[];
  signals: DeviceAuthControlSignal[];
  counters: {
    providerCalls: number;
    promptReads: number;
    outputReads: number;
    usageUploads: number;
    ledgerWrites: number;
  };
  totals: Record<DeviceAuthControlImpact, number>;
  invariants: string[];
}

export interface DeviceApprovalChamberStage {
  id: "code-lock" | "session-check" | "token-slot" | "terminal-return";
  label: string;
  impact: DeviceAuthControlImpact;
  status: string;
  value: string;
  command: string;
  note: string;
  guardrail: string;
  meter: number;
  frames: string[];
  transcript: string[];
  mark: string;
  from: string;
  to: string;
  ink: string;
}

export interface DeviceApprovalChamber {
  headline: string;
  subline: string;
  codeLabel: string;
  terminalLines: string[];
  stages: DeviceApprovalChamberStage[];
  counters: {
    providerCalls: number;
    promptReads: number;
    outputReads: number;
    hiddenUploads: number;
    usageUploads: number;
    ledgerWrites: number;
  };
  totals: Record<DeviceAuthControlImpact, number>;
}

export function splitDeviceCode(code: string): string[] {
  const clean = code.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  if (!clean) return ["NO", "CODE"];
  return clean.match(/.{1,3}/g) ?? [clean];
}

export function deviceAuthStatusLabel(state: DeviceAuthState): string {
  if (state === "done") return "approved";
  if (state === "error") return "needs attention";
  if (state === "working") return "approving";
  return "waiting";
}

export function buildDeviceAuthBridge(state: DeviceAuthState, code: string): DeviceAuthBridgeStep[] {
  const hasCode = Boolean(code);
  return [
    {
      id: "terminal",
      call: hasCode ? splitDeviceCode(code).join(" ") : "NO CODE",
      label: "Terminal code",
      detail: hasCode ? "Match this code with the local CLI before approval." : "Open this page from vibetracker login.",
      status: "match-code",
    },
    {
      id: "browser",
      call: deviceAuthStatusLabel(state).toUpperCase(),
      label: "C0VIBE session",
      detail: "The browser session approves identity only, not usage totals.",
      status: "session",
    },
    {
      id: "token",
      call: state === "done" ? "ISSUED" : "PENDING",
      label: "CLI token",
      detail: "The server issues one attested token after approval.",
      status: "attested",
    },
    {
      id: "ledger",
      call: "LOCAL",
      label: "Usage ledger",
      detail: "Records stay on disk until an explicit upload command.",
      status: "local-first",
    },
  ];
}

function fit(value: string | number, width: number): string {
  return String(value).padEnd(width).slice(0, width);
}

function frameLine(value: string): string {
  return `| ${fit(value, 60)} |`;
}

function controlLine(value: string): string {
  return `| ${fit(value, 58)} |`;
}

function codeCall(code: string): string {
  return splitDeviceCode(code).join(" ");
}

function brandRail(
  rail: Omit<DeviceApprovalRunwayRail, "mark" | "from" | "to" | "ink">,
  brandId: string,
): DeviceApprovalRunwayRail {
  const brand = providerBrand(brandId);
  return { ...rail, mark: brand.mark, from: brand.from, to: brand.to, ink: brand.ink };
}

function brandSurprise(
  surprise: Omit<DeviceApprovalRunwaySurprise, "mark" | "from" | "to" | "ink">,
  brandId: string,
): DeviceApprovalRunwaySurprise {
  const brand = providerBrand(brandId);
  return { ...surprise, mark: brand.mark, from: brand.from, to: brand.to, ink: brand.ink };
}

function brandTapeStep(
  step: Omit<DeviceApprovalFlightTapeStep, "mark" | "from" | "to" | "ink" | "terminalLine">,
  brandId: string,
): DeviceApprovalFlightTapeStep {
  const brand = providerBrand(brandId);
  const impact = step.impact === "not_usage" ? "NOT USAGE" : step.impact.replace("_", " ").toUpperCase();

  return {
    ...step,
    mark: brand.mark,
    from: brand.from,
    to: brand.to,
    ink: brand.ink,
    terminalLine: frameLine(`${fit(step.id, 14)} ${fit(impact, 10)} ${fit(step.status, 12)} ${step.guardrail}`),
  };
}

function brandControlSignal(
  signal: Omit<DeviceAuthControlSignal, "mark" | "from" | "to" | "ink" | "terminal">,
  brandId: string,
): DeviceAuthControlSignal {
  const brand = providerBrand(brandId);
  return {
    ...signal,
    mark: brand.mark,
    from: brand.from,
    to: brand.to,
    ink: brand.ink,
    terminal: [
      controlLine(`${signal.id} // ${signal.impact === "not_usage" ? "NOT USAGE" : signal.impact.toUpperCase()}`),
      controlLine(`${signal.source} -> ${signal.target}`),
      controlLine(`${signal.status} // ${signal.command}`),
      controlLine(signal.guardrail),
    ],
  };
}

function brandApprovalStage(
  stage: Omit<DeviceApprovalChamberStage, "mark" | "from" | "to" | "ink">,
  brandId: string,
): DeviceApprovalChamberStage {
  const brand = providerBrand(brandId);
  return {
    ...stage,
    mark: brand.mark,
    from: brand.from,
    to: brand.to,
    ink: brand.ink,
  };
}

export function buildDeviceAuthControlRoom(state: DeviceAuthState, code: string): DeviceAuthControlRoom {
  const hasCode = Boolean(code);
  const issued = state === "done";
  const working = state === "working";
  const status = deviceAuthStatusLabel(state);
  const codeValue = hasCode ? codeCall(code) : "NO CODE";
  const counters = {
    providerCalls: 0,
    promptReads: 0,
    outputReads: 0,
    usageUploads: 0,
    ledgerWrites: 0,
  };
  const signals: DeviceAuthControlSignal[] = [
    brandControlSignal({
      id: "terminal-code",
      label: "Terminal code mirror",
      impact: "identity",
      value: codeValue,
      status: hasCode ? "matched" : "waiting",
      command: "vibetracker login",
      source: "local terminal",
      target: "browser approval page",
      guardrail: "Code match proves handoff only.",
      meter: hasCode ? 94 : 34,
    }, "codex-cli"),
    brandControlSignal({
      id: "browser-session",
      label: "C0VIBE session gate",
      impact: "identity",
      value: status,
      status: working ? "checking" : issued ? "approved" : state === "error" ? "retry" : "manual",
      command: "POST /api/cli/approve",
      source: "signed-in browser",
      target: "server token issuer",
      guardrail: "Browser identity is not usage.",
      meter: issued ? 100 : working ? 82 : state === "error" ? 42 : 58,
    }, "c0vibe"),
    brandControlSignal({
      id: "token-poll",
      label: "CLI token pickup",
      impact: "not_usage",
      value: issued ? "issued" : "pending",
      status: issued ? "return to terminal" : "polling",
      command: "vibetracker login",
      source: "server token slot",
      target: "local CLI",
      guardrail: "Token pickup uploads zero usage.",
      meter: issued ? 100 : working ? 72 : 48,
    }, "github"),
    brandControlSignal({
      id: "local-ledger",
      label: "Local usage ledger",
      impact: "local_only",
      value: "local-first",
      status: issued ? "armed" : "locked",
      command: "vibetracker sync",
      source: "configured providers",
      target: "~/.vibetracker",
      guardrail: "Collection is terminal-gated.",
      meter: issued ? 88 : 54,
    }, "ollama"),
    brandControlSignal({
      id: "dry-run",
      label: "Review before upload",
      impact: "privacy",
      value: "preview",
      status: issued ? "available" : "needs token",
      command: "vibetracker upload --dry-run",
      source: "local aggregate bundle",
      target: "redaction preview",
      guardrail: "Preview sends nothing.",
      meter: issued ? 86 : 52,
    }, "openai"),
    brandControlSignal({
      id: "public-relay",
      label: "C0VIBE public relay",
      impact: "publish",
      value: "Vibers Unite",
      status: issued ? "opt-in" : "locked",
      command: "vibetracker upload",
      source: "reviewed aggregates",
      target: "c0vibe.app profile",
      guardrail: "Publish requires explicit command.",
      meter: issued ? 92 : 46,
    }, "c0vibe"),
  ];
  const totals = signals.reduce<Record<DeviceAuthControlImpact, number>>((acc, signal) => {
    acc[signal.impact] += 1;
    return acc;
  }, { identity: 0, not_usage: 0, local_only: 0, privacy: 0, publish: 0 });

  return {
    headline: issued ? "Auth control room: identity approved" : "Auth control room",
    subline: "A zero-movement handoff map from terminal code to browser session, token pickup, local scan, dry-run review, and optional C0VIBE publish.",
    codeLabel: codeValue,
    terminalLines: [
      "+------------------------------------------------------------+",
      controlLine("VTK://CLI-AUTH-CONTROL//IDENTITY-ONLY//C0VIBE.APP"),
      controlLine(`state ${status} // code ${codeValue} // signals ${signals.length}`),
      controlLine(`calls ${counters.providerCalls} prompts ${counters.promptReads} outputs ${counters.outputReads}`),
      controlLine(`usage uploads ${counters.usageUploads} // ledger writes ${counters.ledgerWrites}`),
      controlLine("terminal controls scan, dry-run, and publish"),
      controlLine("Vibers Unite // approval is not usage"),
      "+------------------------------------------------------------+",
    ],
    signals,
    counters,
    totals,
    invariants: [
      "Approval calls zero AI providers.",
      "Approval reads zero prompts and zero outputs.",
      "Approval uploads zero usage records and writes zero ledger rows.",
      "Public profile updates require explicit dry-run review and upload.",
    ],
  };
}

export function buildDeviceApprovalChamber(state: DeviceAuthState, code: string): DeviceApprovalChamber {
  const hasCode = Boolean(code);
  const issued = state === "done";
  const working = state === "working";
  const error = state === "error";
  const codeValue = hasCode ? codeCall(code) : "NO CODE";
  const status = deviceAuthStatusLabel(state);
  const counters = {
    providerCalls: 0,
    promptReads: 0,
    outputReads: 0,
    hiddenUploads: 0,
    usageUploads: 0,
    ledgerWrites: 0,
  };
  const stages: DeviceApprovalChamberStage[] = [
    brandApprovalStage({
      id: "code-lock",
      label: "Code lock",
      impact: "identity",
      status: hasCode ? "mirrored" : "waiting",
      value: codeValue,
      command: "vibetracker login",
      note: hasCode ? "The browser mirrors the exact terminal code before approval." : "Open this page from the terminal link so the code can prefill.",
      guardrail: "Code mirror is identity context only.",
      meter: hasCode ? 94 : 34,
      frames: [
        "CLI CODE\n  ||   \nBROWSER ",
        hasCode ? `${fit(codeValue, 8)}\nLOCKED  \nMANUAL  ` : "NO CODE \nWAITING \nTERMINAL",
        "0 CALLS \n0 READS \n0 UPLOAD",
      ],
      transcript: [
        "terminal code visible",
        "browser mirror only",
        "manual approval still required",
      ],
    }, "codex-cli"),
    brandApprovalStage({
      id: "session-check",
      label: "Session check",
      impact: "identity",
      status: working ? "checking" : issued ? "approved" : error ? "retry" : "manual",
      value: status,
      command: "POST /api/cli/approve",
      note: "The signed-in C0VIBE browser session approves identity, not usage totals.",
      guardrail: "Browser identity never becomes spend, credits, or rank.",
      meter: issued ? 100 : working ? 82 : error ? 42 : 58,
      frames: [
        "C0VIBE \nSESSION\nGATE   ",
        working ? "CHECK  \nTOKEN  \nSLOT   " : issued ? "APPROVE\nTOKEN  \nREADY  " : error ? "RETRY  \nSESSION\nLINK   " : "WAIT   \nCLICK  \nAPPROVE",
        "NOT    \nUSAGE  \nMATH   ",
      ],
      transcript: [
        "session bearer required",
        "approval binds user id",
        "usage movement remains zero",
      ],
    }, "c0vibe"),
    brandApprovalStage({
      id: "token-slot",
      label: "Token slot",
      impact: "not_usage",
      status: issued ? "issued" : working ? "pending" : error ? "blocked" : "armed",
      value: issued ? "return" : "pending",
      command: "POST /api/cli/poll",
      note: "The CLI receives an attested token once; token pickup is not an AI usage event.",
      guardrail: "Token polling reads zero prompts and uploads zero usage.",
      meter: issued ? 100 : working ? 72 : error ? 38 : 52,
      frames: [
        "TOKEN  \nSLOT   \nONCE   ",
        issued ? "CLAIMED\nRETURN \nCLI    " : working ? "POLL   \nPENDING\nNO UP  " : "WAIT   \nNO ROW \nNO UP  ",
        "PROMPTS\n0 READ \n0 OUT  ",
      ],
      transcript: [
        "token is claimed once",
        "prompt reads zero",
        "usage uploads zero",
      ],
    }, "github"),
    brandApprovalStage({
      id: "terminal-return",
      label: "Terminal return",
      impact: "local_only",
      status: issued ? "ready" : "locked",
      value: issued ? "sync next" : "after auth",
      command: "vibetracker sync",
      note: "After approval, collection still starts from the terminal and writes the local ledger first.",
      guardrail: "Local scan and public publish remain explicit later commands.",
      meter: issued ? 88 : working ? 62 : error ? 36 : 48,
      frames: [
        "RETURN \nTO CLI \nLOCAL  ",
        issued ? "SYNC   \nDRYRUN \nUPLOAD " : "LOCKED \nUNTIL  \nAUTH   ",
        "VIBERS \nUNITE  \nC0.APP ",
      ],
      transcript: [
        "terminal regains control",
        "local ledger first",
        "publish requires dry-run review",
      ],
    }, "ollama"),
  ];
  const totals = stages.reduce<Record<DeviceAuthControlImpact, number>>((acc, stage) => {
    acc[stage.impact] += 1;
    return acc;
  }, { identity: 0, not_usage: 0, local_only: 0, privacy: 0, publish: 0 });

  return {
    headline: issued ? "Approval chamber: return to terminal" : working ? "Approval chamber: checking session" : error ? "Approval chamber: needs attention" : "Approval chamber: waiting for code",
    subline: "A live-feeling state machine for the CLI device flow. It mirrors the code, checks identity, reserves the token slot, and sends the user back to terminal control without moving usage.",
    codeLabel: codeValue,
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine("VTK://APPROVAL-CHAMBER//CLI-AUTH//ZERO-USAGE-MOVE"),
      frameLine(`state ${fit(status, 12)} // code ${fit(codeValue, 12)} // stages ${stages.length}`),
      frameLine(`providerCalls ${counters.providerCalls} // promptReads ${counters.promptReads} // outputReads ${counters.outputReads}`),
      frameLine(`hiddenUploads ${counters.hiddenUploads} // usageUploads ${counters.usageUploads} // ledgerWrites ${counters.ledgerWrites}`),
      frameLine("code lock -> session check -> token slot -> terminal return"),
      frameLine("Vibers Unite // c0vibe.app // approval is identity-only"),
      "+--------------------------------------------------------------+",
    ],
    stages,
    counters,
    totals,
  };
}

export function buildDeviceApprovalRunway(state: DeviceAuthState, code: string): DeviceApprovalRunway {
  const hasCode = Boolean(code);
  const issued = state === "done";
  const working = state === "working";
  const codeValue = hasCode ? codeCall(code) : "NO CODE";
  const status = deviceAuthStatusLabel(state).toUpperCase();
  const counters = {
    providerCalls: 0,
    hiddenUploads: 0,
    usageUploads: 0,
    ledgerWrites: 0,
  };
  const rails: DeviceApprovalRunwayRail[] = [
    brandRail({
      id: "code-mirror",
      phase: "01 CODE",
      label: "Terminal mirror",
      impact: "identity",
      status: hasCode ? "matched" : "waiting",
      command: "vibetracker login",
      note: hasCode ? `Browser mirrors ${codeValue}; the user still approves manually.` : "Open this page from the terminal link so the code can prefill.",
      guardrail: "Code proof only.",
      meter: hasCode ? 94 : 38,
      frames: [
        "TERM CODE \n  ||     \nBROWSER  ",
        hasCode ? `${fit(codeValue, 10)}\n mirror  \n approve ` : "NO CODE  \n waiting \n terminal",
        "NO SCAN  \nNO READ  \nNO SYNC  ",
      ],
      transcript: ["terminal prints code", "browser mirrors code", "manual approval gate"],
    }, "codex-cli"),
    brandRail({
      id: "session-proof",
      phase: "02 C0",
      label: "C0VIBE identity",
      impact: "identity",
      status,
      command: "c0vibe.app/session",
      note: "The signed-in browser proves who is approving the CLI token.",
      guardrail: "Identity rail, not usage rail.",
      meter: issued ? 100 : working ? 82 : state === "error" ? 44 : 62,
      frames: [
        "C0VIBE   \nSESSION  \nIDENTITY ",
        working ? "AUTH GATE\nCHECKING \nNO USAGE " : "BROWSER  \nSIGNED IN\nTOKEN?   ",
        issued ? "APPROVED \nRETURN   \nCLI      " : "WAITING  \nUSER     \nCLICK    ",
      ],
      transcript: ["browser session checked", "identity proof only", "CLI token waits"],
    }, "c0vibe"),
    brandRail({
      id: "zero-upload",
      phase: "03 ZERO",
      label: "No hidden upload",
      impact: "not_usage",
      status: "0 calls",
      command: "approval counters",
      note: "Approval does not call AI providers, read prompts, read outputs, or upload usage.",
      guardrail: "Public not usage label.",
      meter: 100,
      frames: [
        "PROVIDERS\nCALLS 000\nUPLOAD 00",
        "PROMPTS  \nLOCKED   \nOUTPUTS  ",
        "HIDDEN   \nUPLOADS  \n000      ",
      ],
      transcript: ["provider calls zero", "hidden uploads zero", "usage uploads zero"],
    }, "higgsfield"),
    brandRail({
      id: "privacy-dry-run",
      phase: "04 DRY",
      label: "Redaction preview",
      impact: "privacy",
      status: issued ? "ready next" : "locked",
      command: "vibetracker upload --dry-run",
      note: "After local collection, the user previews aggregate payloads before publish.",
      guardrail: "Review before network.",
      meter: issued ? 86 : 54,
      frames: [
        "DRY RUN  \nBUNDLE   \nPREVIEW  ",
        "PROMPTS X\nOUTPUTS X\nSECRETS X",
        "AGG ONLY \nCHECKSUM \nREADY?   ",
      ],
      transcript: ["redaction visible", "aggregate preview", "no send on dry run"],
    }, "openai"),
    brandRail({
      id: "local-scan",
      phase: "05 LOCAL",
      label: "Local scanner",
      impact: "local_only",
      status: issued ? "armed" : "after login",
      command: "vibetracker sync",
      note: "The scan writes local records only after the user starts it in the terminal.",
      guardrail: "Local ledger only.",
      meter: issued ? 88 : 56,
      frames: [
        "~/.vtrk  \nLEDGER   \nLOCAL    ",
        "AI TOOLS \nSCAN     \nUSER RUN ",
        "WRITE?   \nLOCAL    \nONLY     ",
      ],
      transcript: ["terminal starts scan", "ledger stays local", "approval writes zero"],
    }, "ollama"),
    brandRail({
      id: "public-relay",
      phase: "06 PUB",
      label: "Profile relay",
      impact: "publish",
      status: issued ? "opt-in" : "locked",
      command: "vibetracker upload",
      note: "Reviewed aggregates can feed the public profile, trust rails, and vibe score.",
      guardrail: "Publish command required.",
      meter: issued ? 92 : 46,
      frames: [
        "C0VIBE   \nPROFILE  \nSCORE    ",
        "VIBERS   \nUNITE    \nAPP      ",
        "PUBLIC   \nAFTER    \nCONSENT  ",
      ],
      transcript: ["profile feed after upload", "vibe score uses aggregates", "Vibers Unite"],
    }, "c0vibe"),
  ];
  const flightTape: DeviceApprovalFlightTapeStep[] = [
    brandTapeStep({
      id: "terminal-code",
      label: "Terminal code",
      impact: "identity",
      status: hasCode ? "matched" : "waiting",
      command: "vibetracker login",
      readout: codeValue,
      guardrail: "Identity proof only.",
      meter: hasCode ? 94 : 38,
      frames: ["CLI", codeValue, "GUI", "OK"],
    }, "codex-cli"),
    brandTapeStep({
      id: "browser-session",
      label: "Browser session",
      impact: "identity",
      status,
      command: "c0vibe.app/session",
      readout: issued ? "approved" : working ? "checking" : state === "error" ? "retry" : "manual click",
      guardrail: "Account proof, not usage.",
      meter: issued ? 100 : working ? 82 : state === "error" ? 44 : 62,
      frames: ["C0", "AUTH", "ID", issued ? "OK" : "WAIT"],
    }, "c0vibe"),
    brandTapeStep({
      id: "zero-movement",
      label: "Zero movement",
      impact: "not_usage",
      status: "0/0/0/0",
      command: "approval counters",
      readout: "calls 0 / uploads 0 / writes 0",
      guardrail: "No provider calls or uploads.",
      meter: 100,
      frames: ["000", "NO$", "NOUP", "SAFE"],
    }, "higgsfield"),
    brandTapeStep({
      id: "local-ledger",
      label: "Local ledger",
      impact: "local_only",
      status: issued ? "armed" : "locked",
      command: "vibetracker sync",
      readout: issued ? "terminal gated" : "after approval",
      guardrail: "Local until explicit command.",
      meter: issued ? 88 : 56,
      frames: ["127", "DISK", "DRY", "OK"],
    }, "ollama"),
    brandTapeStep({
      id: "public-relay",
      label: "Public relay",
      impact: "publish",
      status: issued ? "opt-in" : "locked",
      command: "vibetracker upload",
      readout: "Vibers Unite",
      guardrail: "Publish command required.",
      meter: issued ? 92 : 46,
      frames: ["C0", "VIBE", "UNITE", "APP"],
    }, "c0vibe"),
  ];
  const totals = rails.reduce<Record<DeviceApprovalRunwayImpact, number>>((acc, rail) => {
    acc[rail.impact] += 1;
    return acc;
  }, { identity: 0, not_usage: 0, privacy: 0, local_only: 0, publish: 0 });

  return {
    headline: issued ? "Identity approved. Collection is still terminal-gated." : "Approval runway",
    subline: "The GUI makes the auth handoff feel alive while the counters prove no usage moves during approval.",
    codeLabel: codeValue,
    counters,
    totals,
    rails,
    flightTape,
    surprises: [
      brandSurprise({
        id: "higgsfield-prism",
        label: "Higgsfield prism",
        status: "safe preview",
        frames: [
          "  /HF\\   \n < :: >  \n  \\__/   ",
          "  __     \n /HF\\>>  \n \\__/    ",
          "   __    \n <<HF\\   \n   --    ",
        ],
      }, "higgsfield"),
      brandSurprise({
        id: "codex-cube",
        label: "Codex cube",
        status: "CLI relay",
        frames: [
          "+----+   \n| CX |   \n+----+   ",
          "  +----+ \n / CX /| \n+----+ | ",
          " +----+  \n |/CX/|  \n +----+  ",
        ],
      }, "codex-cli"),
      brandSurprise({
        id: "c0vibe-relay",
        label: "Vibers Unite",
        status: "c0vibe.app",
        frames: [
          "C0 ----> \n  VIBE   \n UNITE   ",
          "C0VIBE   \n .APP    \n SIGNAL  ",
          "VIBERS   \n UNITE   \n PUBLIC  ",
        ],
      }, "c0vibe"),
    ],
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine("VTK://DEVICE-APPROVAL-RUNWAY//C0VIBE.APP"),
      "|--------------------------------------------------------------|",
      frameLine(`state ${fit(deviceAuthStatusLabel(state), 12)} code ${fit(codeValue, 12)} rails ${rails.length}`),
      frameLine(`provider calls ${counters.providerCalls} // hidden uploads ${counters.hiddenUploads} // usage uploads ${counters.usageUploads}`),
      frameLine(`ledger writes ${counters.ledgerWrites} during approval // publish requires command`),
      frameLine("Higgsfield prism // Codex cube // C0VIBE relay"),
      frameLine("Vibers Unite // identity is not usage // c0vibe.app"),
      "+--------------------------------------------------------------+",
    ],
  };
}

export function buildDeviceAuthLaunchTheatre(state: DeviceAuthState, code: string): DeviceAuthLaunchTheatre {
  const hasCode = Boolean(code);
  const status = deviceAuthStatusLabel(state).toUpperCase();
  const issued = state === "done";
  const working = state === "working";
  const steps: DeviceAuthLaunchStep[] = [
    {
      id: "terminal-match",
      phase: "01/05 MATCH",
      call: hasCode ? codeCall(code) : "NO CODE",
      label: "Terminal match",
      impact: "identity",
      command: "vibetracker login",
      note: hasCode ? "The browser repeats the terminal code before approval." : "Open this page from the CLI so the code can prefill.",
      guardrail: "Code match only.",
      meter: hasCode ? 92 : 36,
      frames: [
        " CLI ---- GUI \n code visible \n match first  ",
        " [TERM]      \n    ||       \n [BROWSER]   ",
        hasCode ? `${fit(codeCall(code), 12)}\n terminal ok \n approve?    ` : " NO CODE    \n waiting    \n terminal   ",
      ],
      transcript: ["terminal prints code", "browser mirrors code", "no usage touched"],
    },
    {
      id: "browser-session",
      phase: "02/05 SESSION",
      call: status,
      label: "C0VIBE session",
      impact: "not_usage",
      command: "c0vibe.app session check",
      note: "The browser proves account identity without reading local usage records.",
      guardrail: "Identity is NOT USAGE.",
      meter: issued ? 100 : working ? 78 : state === "error" ? 42 : 58,
      frames: [
        " C0 SESSION \n identity   \n usage: no  ",
        " browser -> \n auth gate  \n not usage  ",
        state === "error" ? " attention  \n sign in    \n retry      " : " approved?  \n session ok \n token next ",
      ],
      transcript: ["session is browser-side", "account proof only", "usage stays local"],
    },
    {
      id: "token-issue",
      phase: "03/05 TOKEN",
      call: issued ? "ISSUED" : "PENDING",
      label: "Attested token",
      impact: "identity",
      command: "POST /api/cli/approve",
      note: "The server issues a one-time CLI token after approval.",
      guardrail: "Token proves uploader identity.",
      meter: issued ? 100 : working ? 76 : 48,
      frames: [
        " TOKEN SLOT \n one time   \n claimed?   ",
        " server --> \n cli token  \n attested   ",
        issued ? " ISSUED    \n return CLI \n continue   " : " PENDING   \n poll loop  \n wait       ",
      ],
      transcript: ["token is one-time", "server marks claimed", "CLI resumes"],
    },
    {
      id: "local-ledger",
      phase: "04/05 LOCAL",
      call: "LOCAL",
      label: "Usage ledger",
      impact: "local_only",
      command: "vibetracker sync --dry-run",
      note: "Records stay on disk until the user chooses an upload command.",
      guardrail: "Local-only until publish.",
      meter: 74,
      frames: [
        " ~/.vtrk    \n jsonl/db   \n local only ",
        " records -> \n dry run    \n redact     ",
        " upload?    \n explicit   \n user gate  ",
      ],
      transcript: ["local files remain local", "dry-run previews redaction", "approval uploads nothing"],
    },
    {
      id: "c0vibe-relay",
      phase: "05/05 RELAY",
      call: "UNITE",
      label: "C0VIBE relay",
      impact: "publish",
      command: "vibetracker upload",
      note: "After review, aggregate usage can feed the public profile and vibe score.",
      guardrail: "Publish is opt-in.",
      meter: issued ? 96 : 54,
      frames: [
        " VIBERS    \n UNITE     \n C0VIBE.APP",
        " profile <-\n aggregate \n redacted  ",
        " score feed\n trust rail\n public ok ",
      ],
      transcript: ["review aggregate", "feed profile/vibe score", "Vibers Unite"],
    },
  ];
  const totals = steps.reduce<Record<DeviceAuthLaunchImpact, number>>((acc, step) => {
    acc[step.impact] += 1;
    return acc;
  }, { identity: 0, not_usage: 0, local_only: 0, publish: 0 });

  return {
    headline: "Terminal to GUI launch",
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine("VTK://CLI-GUI-LAUNCH//DEVICE-AUTH//C0VIBE.APP"),
      "|--------------------------------------------------------------|",
      frameLine(`state ${fit(deviceAuthStatusLabel(state), 12)} code ${fit(hasCode ? codeCall(code) : "missing", 12)} beats ${steps.length}`),
      frameLine(`identity ${totals.identity} // not usage ${totals.not_usage} // local ${totals.local_only} // publish ${totals.publish}`),
      frameLine("terminal charm jumps into GUI without collecting usage"),
      frameLine("Vibers Unite // upload only after review and consent"),
      "+--------------------------------------------------------------+",
    ],
    steps,
    totals,
  };
}
