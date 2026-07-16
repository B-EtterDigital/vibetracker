"use client";

// The Browser Bridge install card — how end users discover the one-click extension that pulls
// cookie-only and page-only AI sources (Suno, Udio, Midjourney, Higgsfield, ChatGPT, …). Three
// steps, one copyable command, honest local-only framing. Locked palette, no confetti.

import { useState } from "react";

const CONNECT_SOURCES = ["Suno", "Udio", "SeaArt", "Tensor.Art", "PixVerse", "Vidu", "Haiper"];
const READ_SOURCES = ["Midjourney", "Higgsfield", "ChatGPT", "ElevenLabs"];

export function BrowserBridgeCard({ startCommand }: { startCommand: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(startCommand);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="bridge-card" aria-label="Browser Bridge extension">
      <header className="bridge-head">
        <span className="bridge-eyebrow">browser bridge · one click</span>
        <h2>Connect the sources that have no API</h2>
        <p>
          Suno, Midjourney, Higgsfield and more expose usage only in your logged-in browser. The Bridge reads
          just the session cookie or the one usage number — locally, never the internet — and hands it to your
          own machine.
        </p>
      </header>

      <ol className="bridge-steps">
        <li>
          <b>1 · Start the bridge</b>
          <button type="button" className="bridge-cmd" onClick={copy} title="Copy the command">
            <code>{startCommand}</code>
            <i aria-hidden="true">{copied ? "✓ copied" : "⧉ copy"}</i>
          </button>
          <span>Prints the load-unpacked path, opens chrome://extensions, and serves the local bridge.</span>
        </li>
        <li>
          <b>2 · Load it once</b>
          <span>chrome://extensions → Developer mode → Load unpacked → the printed folder.</span>
        </li>
        <li>
          <b>3 · Open a source &amp; click</b>
          <span>Log in to the site, click the extension, hit <em>Connect</em> or <em>Read usage</em>. Then <code>vibetracker sync</code>.</span>
        </li>
      </ol>

      <div className="bridge-sources">
        <div>
          <span className="bridge-sources-head">One-click connect</span>
          <div className="bridge-chips">{CONNECT_SOURCES.map((s) => <em key={s}>{s}</em>)}</div>
        </div>
        <div>
          <span className="bridge-sources-head">Read the number</span>
          <div className="bridge-chips">{READ_SOURCES.map((s) => <em key={s}>{s}</em>)}</div>
        </div>
      </div>

      <p className="bridge-foot">
        Local only: the extension talks to 127.0.0.1 and nowhere else · cookies go straight to your OS keyring,
        never shown or logged · it reads one declared number, never prompts or content.
      </p>
    </section>
  );
}
