const CLAIM_PATTERN = /^[0-9a-f]{64}$/;

export type WorkosLinkResult = "linked" | "expired" | "conflict" | "error";

export interface WorkosLinkState {
  bridge: string;
}

export function validWorkosBridgeClaim(value: unknown): value is string {
  return typeof value === "string" && CLAIM_PATTERN.test(value);
}

export function parseWorkosLinkState(value: string | undefined): WorkosLinkState | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as { bridge?: unknown };
    return validWorkosBridgeClaim(parsed.bridge) ? { bridge: parsed.bridge } : null;
  } catch {
    return null;
  }
}

export function workosAuthorizationPath(claimToken: string): string {
  if (!validWorkosBridgeClaim(claimToken)) throw new Error("invalid WorkOS bridge claim");
  const params = new URLSearchParams({
    bridge: claimToken,
    returnTo: "/account?c0vibe=linked",
  });
  return `/auth/workos/login?${params.toString()}`;
}

export function workosLinkResultFromError(message: string): WorkosLinkResult {
  if (/claim_expired/.test(message)) return "expired";
  if (/claim_already_consumed|source_account_changed|account_link_conflict/.test(message)) return "conflict";
  return "error";
}

export function c0vibeBridgeMessage(value: string | null): string {
  if (value === "linked") return "C0VIBE account linked. Your GitHub identity and existing usage history now carry over safely.";
  if (value === "expired") return "The C0VIBE link expired before sign-in completed. Start the link again.";
  if (value === "conflict") return "That GitHub or C0VIBE identity is already linked to another account. Nothing was moved.";
  if (value === "error") return "C0VIBE linking could not be completed. Nothing was moved; you can retry safely.";
  return "";
}
