"use client";

import { useState } from "react";
import { cliCommand } from "../../lib/cli-command.ts";

const LOGIN_COMMAND = cliCommand("login");

export function CliLoginEntry({ checking = false }: { checking?: boolean }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "select">("idle");

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(LOGIN_COMMAND);
      setCopyState("copied");
    } catch {
      setCopyState("select");
    }
  }

  return (
    <div className="cli-entry">
      <header className="cli-entry__header">
        <div className="cli-entry__copy">
          <p className="cli-entry__eyebrow">CLI identity gateway</p>
          <h1>Connect your terminal.</h1>
          <p className="cli-entry__lede">
            Start one command locally. VibeTRACKER reuses your existing GitHub CLI identity when available and opens this page only when browser approval is needed.
          </p>
          <div className="cli-entry__flags" aria-label="Connection guarantees">
            <span>GitHub first</span>
            <span>zero usage moved</span>
            <span>one-time token</span>
          </div>
        </div>

        <section className="cli-entry__command" aria-label="Start the VibeTRACKER login">
          <div className="cli-entry__command-head">
            <span>terminal@local</span>
            <b>{checking ? "CHECKING LINK" : "START HERE"}</b>
          </div>
          <code>{checking ? "checking device link..." : LOGIN_COMMAND}</code>
          <p>Run this in the terminal that owns your local usage ledger.</p>
          <button type="button" onClick={copyCommand} disabled={checking}>
            {copyState === "copied" ? "Copied" : copyState === "select" ? "Select command" : "Copy command"}
          </button>
          <span className="cli-entry__copy-status" aria-live="polite">
            {copyState === "copied" ? "Command copied to clipboard." : copyState === "select" ? "Clipboard unavailable. Select the command above." : ""}
          </span>
        </section>
      </header>

      {!checking ? (
        <>
          <section className="cli-entry__paths" aria-label="Choose an identity path">
            <article>
              <span className="cli-entry__path-index">01 / terminal</span>
              <h2>GitHub CLI already signed in?</h2>
              <p>The command verifies the immutable GitHub subject through your existing <code>gh auth</code> session and returns the CLI token locally.</p>
              <strong>Fast path: no browser approval page.</strong>
            </article>
            <article>
              <span className="cli-entry__path-index">02 / browser</span>
              <h2>Need a browser session?</h2>
              <p>Sign in with GitHub first, then reopen the exact device link printed by the terminal. The code binds the browser identity to that CLI only.</p>
              <a className="cli-entry__action" href="/account?returnTo=%2Fcli-login">Sign in with GitHub</a>
            </article>
          </section>

          <section className="cli-entry__sequence" aria-label="CLI identity sequence">
            <div className="cli-entry__sequence-head">
              <span>VTK://IDENTITY-SEQUENCE</span>
              <b>3 STEPS / 0 USAGE UPLOADS</b>
            </div>
            <ol>
              <li><b>01</b><span><strong>Run locally</strong>Launch the login command beside your usage ledger.</span></li>
              <li><b>02</b><span><strong>Prove GitHub</strong>Reuse <code>gh auth</code> or approve the printed code in a signed-in browser.</span></li>
              <li><b>03</b><span><strong>Return to terminal</strong>The CLI receives a one-time account token. Usage stays local until explicit upload.</span></li>
            </ol>
          </section>

          <footer className="cli-entry__receipt">
            <div>
              <span>identity receipt</span>
              <strong>GitHub proof is not usage proof.</strong>
            </div>
            <dl>
              <div><dt>prompt reads</dt><dd>0</dd></div>
              <div><dt>provider calls</dt><dd>0</dd></div>
              <div><dt>hidden uploads</dt><dd>0</dd></div>
              <div><dt>ledger writes</dt><dd>0</dd></div>
            </dl>
            <a href="/how-to">Open install guide</a>
          </footer>
        </>
      ) : null}
    </div>
  );
}
