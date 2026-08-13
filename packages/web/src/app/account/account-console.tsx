"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { authProviderAvailability, supabaseBrowser, supabaseBrowserConfigured } from "../../lib/supabase-browser";
import { c0vibeBridgeMessage } from "../../lib/c0vibe-account-bridge";
import { cliCommand } from "../../lib/cli-command.ts";
import { accountIdentityFromSession, accountRedirectUrl, safeAccountOrigin, safeNextPath } from "./account-session";
import { AccountC0vibeSignIn } from "./account-c0vibe-signin";
import { createConsoleTelemetry } from "../../../../core/src/telemetry";

type ProviderState = "checking" | "available" | "disabled" | "unavailable";
type LinkState = "signed-out" | "checking" | "linked" | "unlinked" | "error";
type BridgeState = "idle" | "starting" | "linked";
type ProofChannel = "browser" | "terminal";

interface LinkedIdentity {
  handle: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  verifiedAt?: string | null;
}

const CLI_COMMAND = cliCommand("login");
const telemetry = createConsoleTelemetry();

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
  if (value === "success") return "GitHub verification complete. This browser now has a VibeUsage identity session.";
  if (value === "denied") return "GitHub verification was cancelled before any identity was linked.";
  if (value === "error") return "GitHub verification could not be completed. Please try again.";
  return "";
}

export function AccountConsole() {
  const [provider, setProvider] = useState<ProviderState>(supabaseBrowserConfigured() ? "checking" : "disabled");
  const [session, setSession] = useState<Session | null>(null);
  const [linkState, setLinkState] = useState<LinkState>("signed-out");
  const [linked, setLinked] = useState<LinkedIdentity | null>(null);
  const [bridgeState, setBridgeState] = useState<BridgeState>("idle");
  const [workosProvider, setWorkosProvider] = useState(false);
  const [proofChannel, setProofChannel] = useState<ProofChannel>("browser");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [returnPath, setReturnPath] = useState<string | null>(null);
  const [bridgeIntent, setBridgeIntent] = useState(false);
  const identity = accountIdentityFromSession(session);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setBridgeIntent(params.get("intent") === "c0vibe-link");
    setReturnPath(safeNextPath(params.get("next")));
    setMessage(c0vibeBridgeMessage(params.get("c0vibe")) || oauthMessage(params.get("oauth")));
    if (params.get("c0vibe") === "linked") setBridgeState("linked");
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
        const payload = await response.json() as { linked?: boolean; c0vibeLinked?: boolean; identity?: LinkedIdentity; error?: string };
        if (!active) return;
        if (!response.ok) throw new Error(payload.error || `Identity status failed (${response.status})`);
        setLinked(payload.linked ? payload.identity ?? null : null);
        setBridgeState(payload.c0vibeLinked ? "linked" : "idle");
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
        setWorkosProvider(availability.workos);
        if (!availability.github) {
          setProofChannel("terminal");
          setMessage("Browser GitHub sign-in is not enabled yet. GitHub CLI verification is live now and does not require a C0VIBE account.");
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        telemetry.captureError(error, { area: "web.auth.provider-availability", severity: "warn" });
        setProvider("unavailable");
        setProofChannel("terminal");
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
    setProofChannel("browser");
    if (provider !== "available") {
      setMessage("GitHub browser sign-in is currently unavailable.");
      return;
    }
    setBusy(true);
    setMessage("");
    const params = new URLSearchParams(window.location.search);
    const next = safeNextPath(params.get("next"));
    const { error } = await supabaseBrowser().auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: accountRedirectUrl(
          window.location.origin,
          next,
          params.get("intent") === "c0vibe-link" ? "c0vibe-link" : null,
        ),
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
      setBridgeState("idle");
      setMessage("This browser session is signed out. Your public usage history remains intact.");
    }
  }

  async function linkToC0VIBE() {
    if (!session || linkState !== "linked") return;
    setBusy(true);
    setBridgeState("starting");
    setMessage("Opening C0VIBE WorkOS sign-in. The one-time link expires in 10 minutes.");
    try {
      const response = await fetch("/api/account-bridge", {
        method: "POST",
        cache: "no-store",
        headers: { authorization: `Bearer ${session.access_token}` },
      });
      const payload = await response.json() as { linked?: boolean; authorizationUrl?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || `C0VIBE link failed (${response.status})`);
      if (payload.linked) {
        setBridgeState("linked");
        setBusy(false);
        setMessage("C0VIBE is already linked to this GitHub identity.");
        return;
      }
      if (!payload.authorizationUrl) throw new Error("C0VIBE authorization URL is missing");
      window.location.assign(payload.authorizationUrl);
    } catch (error) {
      setBridgeState("idle");
      setBusy(false);
      setMessage(error instanceof Error ? error.message : "C0VIBE link failed");
    }
  }

  // Migrated vibers may return with their C0VIBE (WorkOS) account instead of GitHub.
  // A returning viber whose browser session persists re-anchors through the existing
  // WorkOS bridge claim (POST /api/account-bridge builds the URL via c0vibeAuthorizationUrl).
  // A fully cold sign-in uses the Supabase-native WorkOS provider; this button is render-gated
  // on workosProvider so it only surfaces once that provider is actually enabled server-side.
  async function signInWithC0VIBE() {
    setProofChannel("browser");
    if (session) {
      await linkToC0VIBE();
      return;
    }
    if (!workosProvider) {
      setMessage("C0VIBE sign-in is not enabled in this environment yet. Sign in with GitHub to anchor your identity.");
      return;
    }
    setBusy(true);
    setMessage("");
    const next = safeNextPath(new URLSearchParams(window.location.search).get("next"));
    const origin = safeAccountOrigin(window.location.origin);
    const { error } = await supabaseBrowser().auth.signInWithOAuth({
      provider: "workos",
      options: { redirectTo: accountRedirectUrl(origin, next) },
    });
    if (error) {
      setBusy(false);
      setMessage(error.message);
    }
  }

  async function copyCliCommand() {
    setProofChannel("terminal");
    try {
      await navigator.clipboard.writeText(CLI_COMMAND);
      setMessage(`Copied ${CLI_COMMAND}. Run it in a terminal where gh auth status passes.`);
    } catch (error) {
      telemetry.captureError(error, { area: "web.auth.cli-copy", severity: "warn" });
      setMessage(`Clipboard access failed. Run ${CLI_COMMAND} in your terminal.`);
    }
  }

  const browserReady = provider === "available";
  const browserChecking = provider === "checking";
  const providerCopy = browserReady ? "GitHub sign-in ready" : browserChecking ? "checking GitHub" : "GitHub CLI ready";
  const linkCopy = linkState === "linked" ? "identity linked" : linkState === "checking" ? "checking account link" : linkState === "unlinked" ? "session ready, link pending" : linkState === "error" ? "link needs attention" : "no browser session";
  const proofSteps = proofChannel === "browser" ? BROWSER_STEPS : CLI_STEPS;
  const accountHandle = linked?.handle || identity?.handle || "";
  const connectionStep = !session
    ? 1
    : linkState !== "linked"
      ? 2
      : bridgeState !== "linked"
        ? 3
        : 4;
  const showConnectionGuide = bridgeIntent || (Boolean(session) && linkState !== "linked");

  return (
    <section className="account-console" aria-labelledby="account-console-title">
      <div className="account-console__head">
        <div><p className="eyebrow">Live identity state</p><h2 id="account-console-title">GitHub sign-in console</h2></div>
        <div className="account-console__lights" aria-label="Authentication state">
          <span data-tone={provider === "available" ? "ready" : "waiting"}>{providerCopy}</span>
          <span data-tone={linkState === "linked" ? "verified" : "waiting"}>{linkCopy}</span>
        </div>
      </div>

      {showConnectionGuide ? (
        <section className="account-c0vibe-guide" id="c0vibe-connection" aria-labelledby="c0vibe-connection-title">
          <div className="account-c0vibe-guide__intro">
            <p className="eyebrow">Opened from your C0VIBE profile card</p>
            <h3 id="c0vibe-connection-title">Connect VibeUsage in four clear steps.</h3>
            <p>Your current state is highlighted. Existing usage stays attached to the immutable GitHub identity; this flow only connects that identity to your C0VIBE card.</p>
          </div>
          <ol>
            <li data-state={connectionStep > 1 ? "done" : connectionStep === 1 ? "active" : "waiting"}><span>01</span><b>Sign in to VibeUsage</b><small>Use the GitHub identity that owns the existing usage.</small></li>
            <li data-state={connectionStep > 2 ? "done" : connectionStep === 2 ? "active" : "waiting"}><span>02</span><b>Verify the GitHub link</b><small>Your session is active, but this identity still needs the one-time GitHub proof.</small></li>
            <li data-state={connectionStep > 3 ? "done" : connectionStep === 3 ? "active" : "waiting"}><span>03</span><b>Link to C0VIBE</b><small>Approve the ten-minute WorkOS claim; no provider credentials move.</small></li>
            <li data-state={connectionStep === 4 ? "done" : "waiting"}><span>04</span><b>Return to the desktop app</b><small>Reopen your card to load tracked days and provider share.</small></li>
          </ol>
          <div className="account-c0vibe-guide__action">
            {connectionStep === 1 ? (
              <button type="button" onClick={signIn} disabled={busy || !browserReady}>Sign in with GitHub</button>
            ) : connectionStep === 2 ? (
              <button type="button" onClick={signIn} disabled={busy || !browserReady}>Verify this GitHub identity</button>
            ) : connectionStep === 3 ? (
              <button type="button" onClick={linkToC0VIBE} disabled={busy}>Link this identity to C0VIBE</button>
            ) : (
              <strong>Connection complete — return to C0VIBE and reopen your profile card.</strong>
            )}
            <small>Signed in as {accountHandle ? `@${accountHandle}` : "no GitHub identity yet"} · step {connectionStep} of 4</small>
          </div>
        </section>
      ) : null}

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
                <a className="account-identity__primary-link" href={`/u/${encodeURIComponent(accountHandle)}`}>view public profile</a>
                {linkState === "unlinked" || linkState === "error" ? <button type="button" onClick={signIn} disabled={busy || provider !== "available"}>reconnect GitHub</button> : null}
                {linkState === "linked" ? <button className="account-console__c0vibe" type="button" onClick={linkToC0VIBE} disabled={busy || bridgeState === "linked"}>{bridgeState === "linked" ? "✓ C0VIBE linked" : bridgeState === "starting" ? "opening C0VIBE" : "link to C0VIBE"}</button> : null}
                {returnPath ? <a href={returnPath}>return to previous view</a> : null}
                <button type="button" onClick={signOut} disabled={busy}>sign out</button>
              </div>
              <div className="account-identity__ledger" aria-label="Identity ledger">
                <span><small>GitHub subject</small><b>{linkState === "linked" ? "verified" : "session"}</b></span>
                <span><small>CLI history</small><b>retained</b></span>
                <span><small>Usage proof</small><b>separate</b></span>
                <span><small>C0VIBE</small><b>{bridgeState === "linked" ? "linked" : "optional"}</b></span>
              </div>
            </>
          ) : (
            <>
              <div className="account-console__pitch">
                <span className="account-console__github" aria-hidden="true">GH</span>
                <div><h3>Choose where GitHub should sign you in.</h3><p>The browser creates a site session. The CLI verifies this machine. Both attach to the same immutable GitHub identity.</p></div>
              </div>
              <div className="account-console__entry-actions">
                <div className="account-console__signins">
                  <button className="account-console__primary" type="button" onClick={signIn} disabled={busy || !browserReady}>
                    {busy && proofChannel === "browser" ? "opening GitHub" : browserChecking ? "checking GitHub" : browserReady ? "sign in with GitHub" : "browser sign-in unavailable"}
                  </button>
                  <AccountC0vibeSignIn available={workosProvider} disabled={busy} onClick={signInWithC0VIBE} />
                </div>
                <button className="account-console__secondary" type="button" onClick={copyCliCommand} disabled={busy}>
                  <span>verify this machine</span><code>{CLI_COMMAND}</code>
                </button>
              </div>
              <small className="account-console__c0vibe-note">GitHub or your C0VIBE account — migrated vibers can use either.</small>
              <div className="account-console__entry-map" aria-label="GitHub identity convergence">
                <span>Browser session<b>site controls</b></span><i aria-hidden="true">+</i>
                <span>CLI identity<b>existing history</b></span><i aria-hidden="true">-&gt;</i>
                <span>GitHub subject<b>one profile</b></span>
              </div>
              <small className="account-console__path-note">
                Browser sign-in gives this site a session. CLI verification gives this machine a keyring token. The raw GitHub token is used once and is never persisted by VibeTRACKER.
              </small>
            </>
          )}
          <p className="account-console__message" aria-live="polite">{message || "Identity proof and usage proof remain separate at every step."}</p>
        </div>

        <div className="account-console__oauth" data-channel={proofChannel} aria-label={proofChannel === "browser" ? "GitHub browser sign-in flow" : "GitHub CLI identity flow"}>
          <div className="console-top"><span>{proofChannel === "browser" ? "session@github" : "identity@terminal"}</span><b>{proofChannel === "browser" ? "SITE SESSION" : "MACHINE PROOF"}</b></div>
          <div className="account-console__proof-tabs" role="group" aria-label="Identity path explanation">
            <button type="button" aria-pressed={proofChannel === "browser"} onClick={() => setProofChannel("browser")}>Browser session</button>
            <button type="button" aria-pressed={proofChannel === "terminal"} onClick={() => setProofChannel("terminal")}>CLI identity</button>
          </div>
          <h3>{proofChannel === "browser" ? "One browser sign-in." : "One terminal verification."} Four inspectable steps.</h3>
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
