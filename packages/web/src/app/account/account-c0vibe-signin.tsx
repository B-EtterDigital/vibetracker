"use client";

interface AccountC0vibeSignInProps {
  signedIn: boolean;
  disabled: boolean;
  onClick: () => void;
}

// Dedicated AuthKit entry for VibeUsage. The button is always present because
// WorkOS is no longer gated by Supabase provider availability.
export function AccountC0vibeSignIn({ signedIn, disabled, onClick }: AccountC0vibeSignInProps) {
  return (
    <button className="account-console__c0vibe" type="button" onClick={onClick} disabled={disabled || signedIn}>
      {signedIn ? "✓ C0VIBE signed in" : "sign in with C0VIBE"}
    </button>
  );
}
