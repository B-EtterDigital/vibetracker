"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { usePathname } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { accountIdentityFromSession, accountRedirectUrl } from "../app/account/account-session";
import { supabaseBrowser, supabaseBrowserConfigured } from "../lib/supabase-browser";
import { createConsoleTelemetry } from "../../../core/src/telemetry";
import styles from "./account-control.module.css";

type ControlState = "loading" | "signed-out" | "session" | "linked" | "unavailable";
const telemetry = createConsoleTelemetry();

export function AccountControl() {
  const [state, setState] = useState<ControlState>(supabaseBrowserConfigured() ? "loading" : "signed-out");
  const [handle, setHandle] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    if (!supabaseBrowserConfigured()) return;
    const client = supabaseBrowser();
    let active = true;

    async function synchronize(session: Session | null) {
      if (!active) return;
      const identity = accountIdentityFromSession(session);
      if (!session || !identity) {
        setHandle("");
        setAvatarUrl("");
        setState("signed-out");
        return;
      }
      setHandle(identity.handle);
      setAvatarUrl(identity.avatarUrl || "");
      setState("session");
      try {
        const response = await fetch("/api/identity/github/status", {
          cache: "no-store",
          headers: { authorization: `Bearer ${session.access_token}` },
        });
        if (!active) return;
        const payload = await response.json() as { linked?: boolean; identity?: { handle?: string; avatarUrl?: string | null } };
        if (response.ok && payload.linked) {
          setHandle(payload.identity?.handle || identity.handle);
          setAvatarUrl(payload.identity?.avatarUrl || identity.avatarUrl || "");
          setState("linked");
        }
      } catch {
        if (active) setState("unavailable");
      }
    }

    void client.auth.getSession().then(({ data }) => synchronize(data.session));
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => void synchronize(session), 0);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const label = state === "loading"
    ? "Checking session"
    : state === "signed-out"
      ? "Sign in with GitHub"
      : state === "session"
        ? "Finish setup"
        : `@${handle}`;
  const shortLabel = state === "loading"
    ? "Checking"
    : state === "signed-out"
      ? "Sign in"
      : state === "session"
        ? "Finish"
        : `@${handle}`;
  const title = state === "linked"
    ? `GitHub identity verified as @${handle}`
    : state === "unavailable"
      ? `Signed in as @${handle}; identity status is unavailable`
    : state === "session"
      ? `Signed in as @${handle}; finish GitHub linking`
      : state === "loading"
        ? "Checking GitHub session status"
        : "Sign in with GitHub; no C0VIBE account required";
  const accountHref = pathname === "/account"
    ? "/account"
    : `/account?next=${encodeURIComponent(pathname || "/")}`;

  // One click, straight to GitHub (user order 2026-07-15): a signed-out click starts the OAuth
  // dance immediately instead of detouring through /account. The OAuth callback returns to the
  // page the viber was on. Signed-in states keep linking to the account console.
  async function startDirectSignIn(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    try {
      const { error } = await supabaseBrowser().auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: accountRedirectUrl(window.location.origin, pathname || "/"),
          scopes: "read:user user:email",
        },
      });
      if (error) throw error;
    } catch (error) {
      telemetry.captureError(error, { area: "web.auth.header-oauth", severity: "warn" });
      setState("unavailable");
    }
  }

  const directSignIn = state === "signed-out" && supabaseBrowserConfigured()
    ? startDirectSignIn
    : undefined;

  // Once signed in, the viber's own board profile is one click away in the header.
  const profileHref = state === "linked" || state === "session"
    ? `/u/${handle.toLowerCase()}`
    : null;

  return (
    <>
      {profileHref ? (
        <a className={styles.profileLink} href={profileHref} title={`Your board profile — /u/${handle.toLowerCase()}`}>
          Profile
        </a>
      ) : null}
      <a className={styles.control} data-state={state} href={accountHref} onClick={directSignIn} title={title} aria-label={title} aria-busy={state === "loading"}>
        <span className={styles.mark} aria-hidden="true">
          {avatarUrl && state !== "signed-out" && state !== "loading"
            ? <img src={avatarUrl} alt="" width={22} height={22} />
            : state === "linked" ? "✓" : state === "session" ? "·" : state === "unavailable" ? "!" : "GH"}
          {state === "linked" && avatarUrl ? <i>✓</i> : null}
        </span>
        <span className={styles.label} data-short-label={shortLabel}>{label}</span>
      </a>
    </>
  );
}
