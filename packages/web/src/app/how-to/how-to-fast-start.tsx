"use client";

import { useState } from "react";

export type HowToFastCommand = {
  id: string;
  title: string;
  command: string;
};

export function HowToFastStart({ commands }: { commands: HowToFastCommand[] }) {
  const [copyState, setCopyState] = useState<string>("");

  async function copyCommand(item: HowToFastCommand) {
    try {
      await navigator.clipboard.writeText(item.command);
      setCopyState(item.id);
    } catch {
      setCopyState("select");
    }
  }

  return (
    <div className="howto-fast">
      <header className="howto-fast__hero">
        <div className="howto-fast__intro">
          <p>VibeTRACKER launch bay</p>
          <h1>Boot your usage cockpit.</h1>
          <span>One local-first CLI for coding agents, creator tools, local models, subscriptions, and public usage proof.</span>
          <div className="howto-fast__flags" aria-label="Installation guarantees">
            <b>local ledger</b>
            <b>zero hidden uploads</b>
            <b>37 advanced commands</b>
          </div>
        </div>
        <div className="howto-fast__primary" aria-label="Primary installation command">
          <div><span>01 / install</span><b>START HERE</b></div>
          <code>{commands[0]?.command}</code>
          <p>Launches the visual setup wizard. Nothing is published during installation.</p>
          <button type="button" onClick={() => commands[0] && copyCommand(commands[0])}>
            {copyState === commands[0]?.id ? "Copied" : "Copy install command"}
          </button>
        </div>
      </header>

      <section className="howto-fast__commands" aria-label="Five-command fast start">
        <div className="howto-fast__commands-head">
          <span>VTK://FAST-START</span>
          <b>INSTALL / DEMO / PROOF / PREVIEW</b>
        </div>
        <ol>
          {commands.map((item) => (
            <li key={item.id}>
              <span>{item.id}</span>
              <div><b>{item.title}</b><code>{item.command}</code></div>
              <button type="button" onClick={() => copyCommand(item)} aria-label={`Copy ${item.title} command`}>
                {copyState === item.id ? "Copied" : "Copy"}
              </button>
            </li>
          ))}
        </ol>
        <p className="howto-fast__copy-status" aria-live="polite">
          {copyState === "select" ? "Clipboard unavailable. Select the command directly." : copyState ? "Command copied to clipboard." : ""}
        </p>
      </section>

      <section className="howto-fast__handoff" aria-label="Next operator actions">
        <div>
          <span>identity</span>
          <b>Connect GitHub after install</b>
          <p>Reuse an existing <code>gh auth</code> session or approve one browser device code.</p>
          <a href="/cli-login">Open identity gateway</a>
        </div>
        <div>
          <span>sources</span>
          <b>See what can be measured</b>
          <p>Inspect hosted, creator, local, regional, and manual collection paths.</p>
          <a href="/providers">Browse provider coverage</a>
        </div>
        <dl>
          <div><dt>prompt reads</dt><dd>0</dd></div>
          <div><dt>provider calls</dt><dd>0</dd></div>
          <div><dt>hidden uploads</dt><dd>0</dd></div>
          <div><dt>publish actions</dt><dd>0</dd></div>
        </dl>
      </section>
    </div>
  );
}
