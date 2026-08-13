"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { usePathname } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import {
  accountIdentityFromSession,
  accountRedirectUrl,
  persistLastSignedInHandle,
  readLastSignedInHandle,
} from "../app/account/account-session";
import { supabaseBrowser, supabaseBrowserConfigured } from "../lib/supabase-browser";
import { createConsoleTelemetry } from "../../../core/src/telemetry";
import styles from "./account-control.module.css";

type ControlState = "loading" | "signed-out" | "session" | "linked" | "unavailable";
const telemetry = createConsoleTelemetry();

export function AccountControl() {
  const [state, setState] = useState<ControlState>(supabaseBrowserConfigured() ? "loading" : "signed-out");
  const [handle, setHandle] = useState("");
  const [lastHandle, setLastHandle] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    try {
      setLastHandle(readLastSignedInHandle(window.localStorage));
    } catch (error) {
      telemetry.captureError(error, { area: "web.auth.last-handle.read", severity: "warn" });
    }
    if (!supabaseBrowserConfigured()) return;
    const client = supabaseBrowser();
    let active = true;

    function rememberHandle(nextHandle: string) {
      try {
        const persisted = persistLastSignedInHandle(window.localStorage, nextHandle);
        if (active && persisted) setLastHandle(persisted);
      } catch (error) {
        telemetry.captureError(error, { area: "web.auth.last-handle.write", severity: "warn" });
      }
    }

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
      rememberHandle(identity.handle);
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
          const linkedHandle = payload.identity?.handle || identity.handle;
          setHandle(linkedHandle);
          rememberHandle(linkedHandle);
          setAvatarUrl(payload.identity?.avatarUrl || identity.avatarUrl || "");
          setState("linked");
        }
      } catch (error) {
        telemetry.captureError(error, { area: "web.auth.header-status", severity: "warn" });
        if (active) setState("unavailable");
      }
    }

    void client.auth.getSession().then(({ data, error }) => {
      if (error) {
        telemetry.captureError(error, { area: "web.auth.session-read", severity: "warn" });
        if (active) setState("signed-out");
        return;
      }
      return synchronize(data.session);
    }).catch((error: unknown) => {
      telemetry.captureError(error, { area: "web.auth.session-read", severity: "warn" });
      if (active) setState("unavailable");
    });
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
        ? "Continue setup"
        : `@${handle}`;
  const shortLabel = state === "loading"
    ? "Checking"
    : state === "signed-out"
      ? "Sign in"
      : state === "session"
        ? "Continue"
        : `@${handle}`;
  const title = state === "linked"
    ? `GitHub identity verified as @${handle}`
    : state === "unavailable"
      ? `Signed in as @${handle}; identity status is unavailable`
    : state === "session"
      ? `Signed in as @${handle}; finish GitHub linking`
      : state === "loading"
        ? "Checking GitHub session status"
        : "GitHub or your C0VIBE account — migrated vibers can use either.";
  const accountHref = pathname === "/account"
    ? state === "session" ? "#c0vibe-connection" : "#account-console-title"
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

  // The public profile remains reachable after auth expires; only the handle is retained locally.
  const profileHandle = handle.toLowerCase() || lastHandle;
  const profileHref = profileHandle ? `/u/${profileHandle}` : null;
  const profileState = state === "signed-out" ? "signed-out" : "active";

  return (
    <>
      {profileHref ? (
        <a className={styles.profileLink} data-state={profileState} href={profileHref} title={`Your public board profile — /u/${profileHandle}`}>
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
