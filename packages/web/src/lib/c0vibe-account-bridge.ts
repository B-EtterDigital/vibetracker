const CLAIM_PATTERN = /^[0-9a-f]{64}$/;
const DEFAULT_C0VIBE_ORIGIN = "https://c0vibe.app";

export function c0vibeAuthorizationUrl(claimToken: string, origin = DEFAULT_C0VIBE_ORIGIN): string {
  if (!CLAIM_PATTERN.test(claimToken)) throw new Error("invalid C0VIBE bridge claim");
  const base = new URL(origin);
  if (base.protocol !== "https:" || (base.hostname !== "c0vibe.app" && !base.hostname.endsWith(".c0vibe.app"))) {
    throw new Error("invalid C0VIBE auth origin");
  }
  const url = new URL("/auth/workos/authkit", base);
  url.searchParams.set("via", "vibeusage");
  url.searchParams.set("bridge", claimToken);
  return url.toString();
}

export function c0vibeBridgeMessage(value: string | null): string {
  if (value === "linked") return "C0VIBE account linked. Your GitHub identity and existing usage history now carry over safely.";
  if (value === "expired") return "The C0VIBE link expired before sign-in completed. Start the link again.";
  if (value === "conflict") return "That GitHub or C0VIBE identity is already linked to another account. Nothing was moved.";
  if (value === "error") return "C0VIBE linking could not be completed. Nothing was moved; you can retry safely.";
  return "";
}
