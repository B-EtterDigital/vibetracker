"use client";

interface AccountC0vibeSignInProps {
  /** The Supabase WorkOS provider availability signal — the single render seam. */
  available: boolean;
  disabled: boolean;
  onClick: () => void;
}

// The C0VIBE (WorkOS) sign-in option for the account console entry surface. It renders ONLY
// when the WorkOS provider is actually available, because the account bridge is link-only
// today (a cold sign-in needs the Supabase-native WorkOS provider enabled server-side). It
// carries the exact .vflip-btn gradient border via .account-console__c0vibe; equal height,
// font, and padding to the GitHub button — only the border treatment differs.
export function AccountC0vibeSignIn({ available, disabled, onClick }: AccountC0vibeSignInProps) {
  if (!available) return null;
  return (
    <button className="account-console__c0vibe" type="button" onClick={onClick} disabled={disabled}>
      sign in with C0VIBE
    </button>
  );
}
