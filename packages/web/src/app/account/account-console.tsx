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
        if (!availability.github) setMessage("GitHub browser sign-in is not enabled for this deployment.");
      })
      .catch(() => {
        if (!active) return;
        setProvider("unavailable");
        setMessage("GitHub provider status is temporarily unavailable.");
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

  const providerCopy = provider === "available" ? "GitHub OAuth ready" : provider === "checking" ? "checking GitHub OAuth" : "GitHub OAuth unavailable";
  const linkCopy = linkState === "linked" ? "identity linked" : linkState === "checking" ? "checking account link" : linkState === "unlinked" ? "session ready, link pending" : linkState === "error" ? "link needs attention" : "no browser session";

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
                <div><h3>Sign in through GitHub itself.</h3><p>GitHub handles consent, Supabase exchanges the callback securely, and VibeUsage creates a browser session.</p></div>
              </div>
              <button
                className="account-console__primary"
                type="button"
                onClick={signIn}
                disabled={busy || provider !== "available"}
              >
                {busy ? "opening GitHub" : provider === "checking" ? "checking GitHub sign-in" : provider === "available" ? "continue with GitHub" : "GitHub sign-in unavailable"}
              </button>
              <small className="account-console__path-note">No copied token, terminal command, or separate password. GitHub redirects back to a secure VibeUsage session.</small>
            </>
          )}
          <p className="account-console__message" aria-live="polite">{message || "Identity proof and usage proof remain separate at every step."}</p>
        </div>

        <div className="account-console__oauth" aria-label="GitHub OAuth flow">
          <div className="console-top"><span>oauth@browser</span><b>REAL SESSION</b></div>
          <h3>One browser flow. Four verifiable steps.</h3>
          <ol>
            <li><span>01</span><div><b>GitHub consent</b><small>You authenticate on github.com, never in a copied terminal command.</small></div></li>
            <li><span>02</span><div><b>Server callback</b><small>VibeUsage exchanges the one-time authorization code server-side.</small></div></li>
            <li><span>03</span><div><b>Account session</b><small>Supabase stores the browser session in secure cookies.</small></div></li>
            <li><span>04</span><div><b>Identity link</b><small>Your immutable GitHub user ID anchors existing and future usage.</small></div></li>
          </ol>
        </div>
      </div>

      <div className="account-console__migration">
        <b>GitHub is the account gate.</b>
        <span>Your GitHub subject stays the identity anchor. Existing CLI submissions attach to the same identity without becoming the login mechanism.</span>
        <a href="/proof">inspect proof labels</a>
      </div>
    </section>
  );
}
