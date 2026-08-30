"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
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

type ControlState = "loading" | "signed-out" | "session" | "linked" | "workos" | "unavailable";
const telemetry = createConsoleTelemetry();

export function AccountControl() {
  const { user: workosUser, loading: workosLoading } = useAuth();
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

  const displayState: ControlState = workosUser && (state === "signed-out" || state === "unavailable")
    ? "workos"
    : state === "signed-out" && workosLoading
      ? "loading"
      : state;
  const label = displayState === "loading"
    ? "Checking session"
    : displayState === "signed-out"
      ? "Sign in with GitHub"
      : displayState === "session"
        ? "Continue setup"
        : displayState === "workos"
          ? "C0VIBE account"
        : `@${handle}`;
  const shortLabel = displayState === "loading"
    ? "Checking"
    : displayState === "signed-out"
      ? "Sign in"
      : displayState === "session"
        ? "Continue"
        : displayState === "workos"
          ? "C0VIBE"
        : `@${handle}`;
  const title = displayState === "linked"
    ? `GitHub identity verified as @${handle}`
    : displayState === "workos"
      ? `C0VIBE signed in as ${workosUser?.email}; connect GitHub once to attach usage identity`
    : displayState === "unavailable"
      ? `Signed in as @${handle}; identity status is unavailable`
    : displayState === "session"
      ? `Signed in as @${handle}; finish GitHub linking`
      : displayState === "loading"
        ? "Checking GitHub session status"
        : "GitHub or your C0VIBE account — migrated vibers can use either.";
  const accountHref = pathname === "/account"
    ? displayState === "session" ? "#c0vibe-connection" : "#account-console-title"
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

  const directSignIn = displayState === "signed-out" && supabaseBrowserConfigured()
    ? startDirectSignIn
    : undefined;

  // The public profile remains reachable after auth expires; only the handle is retained locally.
  const profileHandle = handle.toLowerCase() || lastHandle;
  const profileHref = profileHandle ? `/u/${profileHandle}` : null;
  const profileState = displayState === "signed-out" ? "signed-out" : "active";

  return (
    <>
      {profileHref ? (
        <a className={styles.profileLink} data-state={profileState} href={profileHref} title={`Your public board profile — /u/${profileHandle}`}>
          Profile
        </a>
      ) : null}
      <a className={styles.control} data-state={displayState} href={accountHref} onClick={directSignIn} title={title} aria-label={title} aria-busy={displayState === "loading"}>
        <span className={styles.mark} aria-hidden="true">
          {avatarUrl && displayState !== "signed-out" && displayState !== "loading"
            ? <img src={avatarUrl} alt="" width={22} height={22} />
            : displayState === "linked" ? "✓" : displayState === "session" ? "·" : displayState === "workos" ? "W" : displayState === "unavailable" ? "!" : "GH"}
          {displayState === "linked" && avatarUrl ? <i>✓</i> : null}
        </span>
        <span className={styles.label} data-short-label={shortLabel}>{label}</span>
      </a>
    </>
  );
}
