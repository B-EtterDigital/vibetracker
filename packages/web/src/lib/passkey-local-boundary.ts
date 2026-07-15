import type { PasskeyProofState } from "./passkey-proof-console.ts";

export interface PasskeyBoundaryInput {
  state: PasskeyProofState;
  supported: boolean;
  hasCredential: boolean;
}

export interface PasskeyBoundarySnapshot {
  state: PasskeyProofState;
  stateLabel: string;
  browserLabel: string;
  localReferenceLabel: string;
  accountAuthority: "GitHub / C0VIBE server";
  serverVerified: false;
  usageMutations: 0;
  rankDelta: 0;
  rails: Array<{
    id: "account" | "authenticator" | "usage";
    label: string;
    value: string;
    note: string;
    href: string;
  }>;
}

export function buildPasskeyBoundarySnapshot(input: PasskeyBoundaryInput): PasskeyBoundarySnapshot {
  const stateLabels: Record<PasskeyProofState, string> = {
    idle: "no local key reference",
    working: "waiting for authenticator",
    ready: "local key reference stored",
    asserted: "authenticator responded locally",
    error: "local ceremony failed",
  };

  return {
    state: input.state,
    stateLabel: stateLabels[input.state],
    browserLabel: input.supported ? "secure WebAuthn context" : "WebAuthn unavailable",
    localReferenceLabel: input.hasCredential ? "stored in this browser" : "none stored",
    accountAuthority: "GitHub / C0VIBE server",
    serverVerified: false,
    usageMutations: 0,
    rankDelta: 0,
    rails: [
      {
        id: "account",
        label: "Account identity",
        value: "GitHub first",
        note: "The server verifies the immutable GitHub subject used for account linking and the blue identity check.",
        href: "/account?returnTo=%2Fpasskeys",
      },
      {
        id: "authenticator",
        label: "Local authenticator",
        value: "Optional browser check",
        note: "This page can create or request a local credential. It does not send the assertion to a verification server.",
        href: "#local-key-console",
      },
      {
        id: "usage",
        label: "Usage evidence",
        value: "Separate ledger proof",
        note: "Passkeys do not validate provider usage, move spend, publish records, or change leaderboard rank.",
        href: "/proof",
      },
    ],
  };
}
