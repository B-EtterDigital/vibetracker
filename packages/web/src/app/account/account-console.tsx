"use client";

import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { authProviderAvailability, supabaseBrowser, supabaseBrowserConfigured } from "../../lib/supabase-browser";
import { accountIdentityFromSession, accountRedirectUrl, safeNextPath } from "./account-session";

type ProviderState = "checking" | "available" | "disabled" | "unavailable";
type LinkState = "signed-out" | "checking" | "linking" | "linked" | "unlinked" | "error";

interface LinkedIdentity {
  handle: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  verifiedAt?: string | null;
}

export function AccountConsole() {
  const [provider, setProvider] = useState<ProviderState>(supabaseBrowserConfigured() ? "checking" : "disabled");
  const [session, setSession] = useState<Session | null>(null);
  const [linkState, setLinkState] = useState<LinkState>("signed-out");
  const [linked, setLinked] = useState<LinkedIdentity | null>(null);
  const [migrated, setMigrated] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [returnPath, setReturnPath] = useState<string | null>(null);
  const consumedProviderToken = useRef("");
  const identity = accountIdentityFromSession(session);

  useEffect(() => {
    if (!supabaseBrowserConfigured()) {
      setMessage("Browser auth is not configured in this environment. The GitHub CLI path remains available.");
      return;
    }
    const client = supabaseBrowser();
    const controller = new AbortController();
    let active = true;
    setReturnPath(safeNextPath(new URLSearchParams(window.location.search).get("next")));

    async function readStatus(next: Session): Promise<boolean> {
      setLinkState("checking");
      const response = await fetch("/api/identity/github/status", {
        cache: "no-store",
        headers: { authorization: `Bearer ${next.access_token}` },
        signal: controller.signal,
      });
      const payload = await response.json() as { linked?: boolean; identity?: LinkedIdentity; error?: string };
      if (!active) return false;
      if (!response.ok) throw new Error(payload.error || `Identity status failed (${response.status})`);
      setLinked(payload.linked ? payload.identity ?? null : null);
      setLinkState(payload.linked ? "linked" : "unlinked");
      return Boolean(payload.linked);
    }

    async function linkWithProviderToken(next: Session, providerToken: string) {
      setLinkState("linking");
      const response = await fetch("/api/identity/github/link", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${next.access_token}` },
        body: JSON.stringify({ github_token: providerToken }),
        signal: controller.signal,
      });
      const payload = await response.json() as {
        error?: string;
        identity?: { handle?: string };
        migrated_submissions?: number;
      };
      if (!active) return;
      if (!response.ok) throw new Error(payload.error || `GitHub link failed (${response.status})`);
      setLinked({ handle: payload.identity?.handle || accountIdentityFromSession(next)?.handle || "github-user" });
      setMigrated(Number(payload.migrated_submissions ?? 0));
      setLinkState("linked");
      setMessage("GitHub identity linked. Existing CLI history now resolves through the same identity.");
    }

    async function synchronize(next: Session | null, providerToken?: string | null) {
      if (!active) return;
      setSession(next);
      setLinked(null);
      setMigrated(null);
      if (!next) {
        setLinkState("signed-out");
        return;
      }
      try {
        const alreadyLinked = await readStatus(next);
        if (!alreadyLinked && providerToken && consumedProviderToken.current !== providerToken) {
          consumedProviderToken.current = providerToken;
          await linkWithProviderToken(next, providerToken);
        }
      } catch (error) {
        if (!active || controller.signal.aborted) return;
        setLinkState("error");
        setMessage(error instanceof Error ? error.message : "Identity link failed");
      }
    }

    void authProviderAvailability(controller.signal)
      .then((availability) => {
        if (!active) return;
        setProvider(availability.github ? "available" : "disabled");
        if (!availability.github) {
          setMessage("Browser GitHub sign-in is not enabled yet. GitHub CLI verification is live now and does not require a C0VIBE account.");
        }
      })
      .catch(() => {
        if (!active) return;
        setProvider("unavailable");
        setMessage("Browser provider status is unavailable. GitHub CLI verification remains available.");
      });
    void client.auth.getSession().then(({ data, error }) => {
      if (error) {
        setLinkState("error");
        setMessage(error.message);
        return;
      }
      void synchronize(data.session, data.session?.provider_token);
    });
    const { data } = client.auth.onAuthStateChange((_event, next) => {
      window.setTimeout(() => void synchronize(next, next?.provider_token), 0);
    });
    return () => {
      active = false;
      controller.abort();
      data.subscription.unsubscribe();
    };
  }, []);

  async function signIn() {
    if (provider !== "available") {
      setMessage("GitHub browser OAuth is not enabled yet. Use the verified CLI path below.");
      return;
    }
    setBusy(true);
    setMessage("");
    const next = safeNextPath(new URLSearchParams(window.location.search).get("next"));
    const { error } = await supabaseBrowser().auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: accountRedirectUrl(window.location.origin, next), scopes: "read:user" },
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
      setMessage("This browser session is signed out. Your CLI identity and public history remain intact.");
    }
  }

  async function copyCliCommand() {
    try {
      await navigator.clipboard.writeText("npx vibetracker login");
      setMessage("CLI verification command copied.");
    } catch {
      setMessage("Clipboard blocked. Run: npx vibetracker login");
    }
  }

  const providerCopy = provider === "available" ? "browser sign-in ready" : provider === "checking" ? "checking browser sign-in" : "GitHub CLI ready";
  const linkCopy = linkState === "linked" ? "identity linked" : linkState === "linking" ? "attaching CLI history" : linkState === "checking" ? "checking account link" : linkState === "unlinked" ? "session ready, link pending" : linkState === "error" ? "link needs attention" : "no browser session";
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
                <b data-linked={linkState === "linked"}>{linkState === "linked" ? "✓ identity verified" : "session only"}</b>
              </div>
              <div className="account-identity__actions">
                {linkState === "unlinked" || linkState === "error" ? <button type="button" onClick={signIn} disabled={busy || provider !== "available"}>reconnect GitHub</button> : null}
                {returnPath ? <a href={returnPath}>return to authorization</a> : null}
                <button type="button" onClick={signOut} disabled={busy}>sign out here</button>
              </div>
            </>
          ) : (
            <>
              <div className="account-console__pitch">
                <span className="account-console__github" aria-hidden="true">GH</span>
                <div><h3>Sign in with the GitHub identity you already have.</h3><p>No new password, no billing profile, and no usage moves during identity proof.</p></div>
              </div>
              <button
                className="account-console__primary"
                data-path={provider === "available" ? "browser" : "cli"}
                type="button"
                onClick={provider === "available" ? signIn : copyCliCommand}
                disabled={busy || provider === "checking"}
              >
                {provider === "available" ? "sign in with GitHub" : provider === "checking" ? "checking GitHub sign-in" : "copy GitHub CLI sign-in"}
              </button>
              <small className="account-console__path-note">
                {provider === "available"
                  ? "Browser sign-in creates the account session; GitHub identity linking still happens as a separate proof step."
                  : "Run the copied command in a terminal with gh already authenticated. This verifies identity without creating a C0VIBE account."}
              </small>
            </>
          )}
          <p className="account-console__message" aria-live="polite">{message || "Identity proof and usage proof remain separate at every step."}</p>
        </div>

        <div className="account-console__cli" id="github-cli-verification">
          <div className="console-top"><span>fallback@terminal</span><b>LIVE NOW</b></div>
          <h3>Verify through your existing GitHub CLI session.</h3>
          <p>If <code>gh auth status</code> passes, VibeTRACKER verifies the immutable GitHub user ID and issues an identity-bound CLI token.</p>
          <div className="account-console__preflight"><span>preflight</span><code>gh auth status</code></div>
          <div className="account-console__command"><code>npx vibetracker login</code><button type="button" onClick={copyCliCommand} title="Copy CLI verification command">copy</button></div>
          <ul>
            <li><span>credential storage</span><b>raw token never persisted</b></li>
            <li><span>leaderboard badge</span><b>blue identity check</b></li>
            <li><span>usage tier</span><b>still labelled separately</b></li>
            <li><span>migrated rows</span><b>{migrated == null ? "shown after link" : migrated}</b></li>
          </ul>
        </div>
      </div>

      <div className="account-console__migration">
        <b>WorkOS is the upgrade, not the gate.</b>
        <span>Your GitHub subject stays the identity anchor. A later C0VIBE account can attach settings and prior CLI submissions to it without forking the profile.</span>
        <a href="/proof">inspect proof labels</a>
      </div>
    </section>
  );
}
