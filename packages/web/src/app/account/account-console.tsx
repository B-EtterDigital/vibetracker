"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { authProviderAvailability, supabaseBrowser, supabaseBrowserConfigured } from "../../lib/supabase-browser";
import { accountIdentityFromSession, accountRedirectUrl, safeNextPath } from "./account-session";

type ProviderState = "checking" | "available" | "disabled" | "unavailable";
type LinkState = "signed-out" | "checking" | "linked" | "unlinked" | "error";

interface LinkedIdentity {
  handle: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  verifiedAt?: string | null;
}

const CLI_COMMAND = "npx vibetracker login";

const BROWSER_STEPS = [
  ["GitHub consent", "You authenticate on github.com, never in a copied terminal command."],
  ["Server callback", "VibeUsage exchanges the one-time authorization code server-side."],
  ["Account session", "Supabase stores the browser session in secure cookies."],
  ["Identity link", "Your immutable GitHub user ID anchors existing and future usage."],
] as const;

const CLI_STEPS = [
  ["Existing GitHub session", "The CLI asks gh for the already-authenticated account only after you run login."],
  ["One-time verification", "The server validates the GitHub token and immutable user ID; VibeTRACKER never stores the raw token."],
  ["Identity token", "The issued VibeTRACKER token is stored in the OS keyring when available."],
  ["Blue identity check", "The check proves account ownership only. Usage and rank evidence remain separate."],
] as const;

function oauthMessage(value: string | null): string {
  if (value === "success") return "GitHub sign-in complete. This browser now has a real account session.";
  if (value === "denied") return "GitHub sign-in was cancelled before any account was linked.";
  if (value === "error") return "GitHub sign-in could not be completed. Please try again.";
  return "";
}

export function AccountConsole() {
  const [provider, setProvider] = useState<ProviderState>(supabaseBrowserConfigured() ? "checking" : "disabled");
  const [session, setSession] = useState<Session | null>(null);
  const [linkState, setLinkState] = useState<LinkState>("signed-out");
  const [linked, setLinked] = useState<LinkedIdentity | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [returnPath, setReturnPath] = useState<string | null>(null);
  const identity = accountIdentityFromSession(session);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setReturnPath(safeNextPath(params.get("next")));
    setMessage(oauthMessage(params.get("oauth")));
    if (!supabaseBrowserConfigured()) {
      setMessage("GitHub browser sign-in is not configured in this environment.");
      return;
    }

    const client = supabaseBrowser();
    const controller = new AbortController();
    let active = true;

    async function synchronize(next: Session | null) {
      if (!active) return;
      setSession(next);
      setLinked(null);
      if (!next) {
        setLinkState("signed-out");
        return;
      }

      setLinkState("checking");
      try {
        const response = await fetch("/api/identity/github/status", {
          cache: "no-store",
          headers: { authorization: `Bearer ${next.access_token}` },
          signal: controller.signal,
        });
        const payload = await response.json() as { linked?: boolean; identity?: LinkedIdentity; error?: string };
        if (!active) return;
        if (!response.ok) throw new Error(payload.error || `Identity status failed (${response.status})`);
        setLinked(payload.linked ? payload.identity ?? null : null);
        setLinkState(payload.linked ? "linked" : "unlinked");
      } catch (error) {
        if (!active || controller.signal.aborted) return;
        setLinkState("error");
        setMessage(error instanceof Error ? error.message : "Identity status failed");
      }
    }

    void authProviderAvailability(controller.signal)
      .then((availability) => {
        if (!active) return;
        setProvider(availability.github ? "available" : "disabled");
        if (!availability.github) setMessage("Browser GitHub sign-in is not enabled yet. GitHub CLI verification is live now and does not require a C0VIBE account.");
      })
      .catch(() => {
        if (!active) return;
        setProvider("unavailable");
        setMessage("Browser provider status is unavailable. GitHub CLI verification is still live.");
      });
    void client.auth.getSession().then(({ data, error }) => {
      if (error) {
        setLinkState("error");
        setMessage(error.message);
        return;
      }
      void synchronize(data.session);
    });
    const { data } = client.auth.onAuthStateChange((_event, next) => {
      window.setTimeout(() => void synchronize(next), 0);
    });
    return () => {
      active = false;
      controller.abort();
      data.subscription.unsubscribe();
    };
  }, []);

  async function signIn() {
    if (provider !== "available") {
      setMessage("GitHub browser sign-in is currently unavailable.");
      return;
    }
    setBusy(true);
    setMessage("");
    const next = safeNextPath(new URLSearchParams(window.location.search).get("next"));
    const { error } = await supabaseBrowser().auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: accountRedirectUrl(window.location.origin, next),
        scopes: "read:user user:email",
      },
    });
    if (error) {
      setBusy(false);
      setMessage(error.message);
    }
  }

  async function signOut() {
    setBusy(true);
    const { error } = await supabaseBrowser().auth.signOut({ scope: "local" });
    setBusy(false);
    if (error) setMessage(error.message);
    else {
      setSession(null);
      setLinked(null);
      setLinkState("signed-out");
      setMessage("This browser session is signed out. Your public usage history remains intact.");
    }
  }

  async function copyCliCommand() {
    try {
      await navigator.clipboard.writeText(CLI_COMMAND);
      setMessage(`Copied ${CLI_COMMAND}. Run it in a terminal where gh auth status passes.`);
    } catch {
      setMessage(`Clipboard access failed. Run ${CLI_COMMAND} in your terminal.`);
    }
  }

  const browserReady = provider === "available";
  const browserChecking = provider === "checking";
  const providerCopy = browserReady ? "GitHub OAuth ready" : browserChecking ? "checking browser OAuth" : "GitHub CLI ready";
  const linkCopy = linkState === "linked" ? "identity linked" : linkState === "checking" ? "checking account link" : linkState === "unlinked" ? "session ready, link pending" : linkState === "error" ? "link needs attention" : "no browser session";
  const proofSteps = browserReady ? BROWSER_STEPS : CLI_STEPS;

  return (
    <section className="account-console" aria-labelledby="account-console-title">
      <div className="account-console__head">
        <div><p className="eyebrow">Live identity state</p><h2 id="account-console-title">GitHub sign-in console</h2></div>
        <div className="account-console__lights" aria-label="Authentication state">
          <span data-tone={provider === "available" ? "ready" : "waiting"}>{providerCopy}</span>
          <span data-tone={linkState === "linked" ? "verified" : "waiting"}>{linkCopy}</span>
        </div>
      </div>

      <div className="account-console__body">
        <div className="account-console__identity">
          {session && identity ? (
            <>
              <div className="account-identity__profile">
                {linked?.avatarUrl || identity.avatarUrl
                  ? <img src={linked?.avatarUrl || identity.avatarUrl || ""} alt="" width={64} height={64} />
                  : <span aria-hidden="true">GH</span>}
                <div><small>authenticated GitHub identity</small><h3>@{linked?.handle || identity.handle}</h3><p>{linked?.displayName || identity.displayName}</p></div>
                <b data-linked={linkState === "linked"}>{linkState === "linked" ? "✓ identity verified" : "session active"}</b>
              </div>
              <div className="account-identity__actions">
                {linkState === "unlinked" || linkState === "error" ? <button type="button" onClick={signIn} disabled={busy || provider !== "available"}>reconnect GitHub</button> : null}
                {returnPath ? <a href={returnPath}>continue</a> : null}
                <button type="button" onClick={signOut} disabled={busy}>sign out</button>
              </div>
            </>
          ) : (
            <>
              <div className="account-console__pitch">
                <span className="account-console__github" aria-hidden="true">GH</span>
                {browserReady || browserChecking
                  ? <div><h3>Sign in through GitHub itself.</h3><p>GitHub handles consent, Supabase exchanges the callback securely, and VibeUsage creates a browser session.</p></div>
                  : <div><h3>Verify the GitHub identity already on this machine.</h3><p>Reuse your authenticated GitHub CLI session now. No C0VIBE account, new password, or usage upload is required.</p></div>}
              </div>
              <button
                className="account-console__primary"
                type="button"
                data-channel={browserReady ? "browser" : "terminal"}
                onClick={browserReady ? signIn : copyCliCommand}
                disabled={busy || browserChecking}
              >
                {busy ? "opening GitHub" : browserChecking ? "checking GitHub sign-in" : browserReady ? "continue with GitHub" : "copy npx vibetracker login"}
              </button>
              <small className="account-console__path-note">
                {browserReady
                  ? "No copied token, terminal command, or separate password. GitHub redirects back to a secure VibeUsage session."
                  : "Run the copied command where gh auth status passes. The raw GitHub token is used once for identity verification and is never persisted by VibeTRACKER."}
              </small>
            </>
          )}
          <p className="account-console__message" aria-live="polite">{message || "Identity proof and usage proof remain separate at every step."}</p>
        </div>

        <div className="account-console__oauth" data-channel={browserReady ? "browser" : "terminal"} aria-label={browserReady ? "GitHub OAuth flow" : "GitHub CLI identity flow"}>
          <div className="console-top"><span>{browserReady ? "oauth@browser" : "proof@terminal"}</span><b>{browserReady ? "REAL SESSION" : "LIVE NOW"}</b></div>
          <h3>{browserReady ? "One browser flow." : "One terminal command."} Four verifiable steps.</h3>
          <ol>
            {proofSteps.map(([title, detail], index) => <li key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><b>{title}</b><small>{detail}</small></div></li>)}
          </ol>
        </div>
      </div>

      <div className="account-console__migration">
        <b>GitHub is the identity anchor.</b>
        <span>OAuth and GitHub CLI proof resolve to the same immutable subject. Existing submissions attach without changing usage evidence.</span>
        <a href="/proof">inspect proof labels</a>
      </div>
    </section>
  );
}
