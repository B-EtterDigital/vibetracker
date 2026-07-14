"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { accountIdentityFromSession } from "../app/account/account-session";
import { supabaseBrowser, supabaseBrowserConfigured } from "../lib/supabase-browser";
import styles from "./account-control.module.css";

type ControlState = "loading" | "signed-out" | "session" | "linked" | "unavailable";

export function AccountControl() {
  const [state, setState] = useState<ControlState>(supabaseBrowserConfigured() ? "loading" : "signed-out");
  const [handle, setHandle] = useState("");

  useEffect(() => {
    if (!supabaseBrowserConfigured()) return;
    const client = supabaseBrowser();
    let active = true;

    async function synchronize(session: Session | null) {
      if (!active) return;
      const identity = accountIdentityFromSession(session);
      if (!session || !identity) {
        setHandle("");
        setState("signed-out");
        return;
      }
      setHandle(identity.handle);
      setState("session");
      try {
        const response = await fetch("/api/identity/github/status", {
          cache: "no-store",
          headers: { authorization: `Bearer ${session.access_token}` },
        });
        if (!active) return;
        const payload = await response.json() as { linked?: boolean; identity?: { handle?: string } };
        if (response.ok && payload.linked) {
          setHandle(payload.identity?.handle || identity.handle);
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

  const label = state === "loading" || state === "signed-out" ? "sign in" : `@${handle}`;
  const title = state === "linked"
    ? `GitHub identity verified as @${handle}`
    : state === "unavailable"
      ? `Signed in as @${handle}; identity status is unavailable`
    : state === "session"
      ? `Signed in as @${handle}; finish GitHub linking`
      : "Sign in with GitHub or verify through your existing GitHub CLI session";

  return (
    <a className={styles.control} data-state={state} href="/account" title={title} aria-label={title} aria-busy={state === "loading"}>
      <span className={styles.mark} aria-hidden="true">{state === "linked" ? "✓" : state === "session" ? "·" : state === "unavailable" ? "!" : "GH"}</span>
      <span className={styles.label}>{label}</span>
    </a>
  );
}
