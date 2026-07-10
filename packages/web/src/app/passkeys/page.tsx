"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import {
  buildPasskeyCeremonyControl,
  buildPasskeyProofConsole,
  buildPasskeyRecoveryRelay,
  type PasskeyCeremonyControl,
  type PasskeyRecoveryRelay,
} from "../../lib/passkey-proof-console";

type PasskeyState = "idle" | "working" | "ready" | "verified" | "error";

const STORE_KEY = "vibeusage.passkey.rawId";

function toB64Url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromB64Url(value: string): ArrayBuffer {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function challenge(): ArrayBuffer {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function PasskeyCeremonyControlPanel({ ceremony }: { ceremony: PasskeyCeremonyControl }) {
  return (
    <section className="passkey-ceremony-control" aria-label="Passkey ceremony identity control room">
      <div className="passkey-ceremony-control__head">
        <div>
          <span>VTK://PASSKEY-CEREMONY//IDENTITY-ONLY//ZERO-USAGE-MUTATION</span>
          <b>{ceremony.headline}</b>
        </div>
        <p>{ceremony.subline}</p>
      </div>
      <div className="passkey-ceremony-control__body">
        <aside className="passkey-ceremony-terminal" aria-label="Passkey ceremony terminal">
          <div className="console-top"><span>ceremony@passkey</span><b>ZERO MUTATION</b></div>
          <pre>{ceremony.terminalLines.join("\n")}</pre>
          <div className="passkey-ceremony-counters" aria-label="Passkey ceremony zero mutation counters">
            <span>{ceremony.counters.providerCalls} provider calls</span>
            <span>{ceremony.counters.promptReads} prompt reads</span>
            <span>{ceremony.counters.outputReads} output reads</span>
            <span>{ceremony.counters.usageMutations} usage mutations</span>
            <span>{ceremony.counters.publishWrites} publish writes</span>
          </div>
        </aside>
        <div className="passkey-ceremony-stages" aria-label="Passkey ceremony stages">
          {ceremony.stages.map((stage, index) => (
            <article
              className={`passkey-ceremony-stage passkey-ceremony-stage--${stage.impact}`}
              data-impact={stage.impact}
              style={{ "--i": index, "--meter": `${stage.meter}%` } as CSSProperties}
              key={stage.id}
            >
              <div className="passkey-ceremony-stage__top">
                <span>{stage.impact === "not_usage" ? "NOT USAGE" : stage.call}</span>
                <b>{stage.label}</b>
                <em>{stage.status}</em>
              </div>
              <strong>{stage.value}</strong>
              <code>{stage.command}</code>
              <pre>{stage.terminal.join("\n")}</pre>
              <p>{stage.source} {"->"} {stage.target}</p>
              <div className="passkey-ceremony-stage__meter" aria-label={`${stage.label} ceremony meter ${stage.meter} percent`}>
                <i />
              </div>
              <small>{stage.guardrail}</small>
            </article>
          ))}
        </div>
      </div>
      <div className="passkey-ceremony-invariants" aria-label="Passkey ceremony invariants">
        {ceremony.invariants.map((invariant) => <span key={invariant}>{invariant}</span>)}
      </div>
    </section>
  );
}

function PasskeyRecoveryRelayPanel({ relay }: { relay: PasskeyRecoveryRelay }) {
  return (
    <section className="passkey-recovery-relay" aria-label="Passkey recovery relay">
      <div className="passkey-recovery-relay__head">
        <div>
          <span>VTK://PASSKEY-RECOVERY-RELAY//IDENTITY-ONLY//NOT-USAGE</span>
          <b>{relay.headline}</b>
        </div>
        <p>{relay.subline}</p>
      </div>
      <div className="passkey-recovery-relay__body">
        <aside className="passkey-recovery-relay__terminal" aria-label="Passkey recovery relay terminal">
          <div className="console-top"><span>recovery@passkey</span><b>{relay.totals.steps} STEPS</b></div>
          <pre>{relay.terminalLines.join("\n")}</pre>
          <div className="passkey-recovery-relay__counters" aria-label="Passkey recovery zero movement counters">
            <span>{relay.totals.providerCalls} provider calls</span>
            <span>{relay.totals.usageMutations} usage mutations</span>
            <span>{relay.totals.publicWrites} public writes</span>
            <span>{relay.totals.notUsage} not usage</span>
            <span>{relay.totals.averageMeter}% proof</span>
          </div>
        </aside>
        <div className="passkey-recovery-steps" aria-label="Passkey recovery drill steps">
          {relay.steps.map((step, index) => (
            <article
              className={`passkey-recovery-step passkey-recovery-step--${step.impact}`}
              data-impact={step.impact}
              style={{ "--i": index, "--meter": `${step.meter}%` } as CSSProperties}
              key={step.id}
            >
              <div className="passkey-recovery-step__top">
                <span>{step.impact === "not_usage" ? "NOT USAGE" : step.call}</span>
                <div>
                  <b>{step.label}</b>
                  <em>{step.status}</em>
                </div>
              </div>
              <div className="passkey-recovery-step__screen" aria-label={`${step.label} recovery frames`}>
                {step.frames.map((frame, frameIndex) => (
                  <pre style={{ "--frame": frameIndex } as CSSProperties} key={`${step.id}-${frame}`}>{frame}</pre>
                ))}
              </div>
              <strong>{step.value}</strong>
              <p>{step.note}</p>
              <code>{step.command}</code>
              <ul className="passkey-recovery-step__checklist" aria-label={`${step.label} checklist`}>
                {step.checklist.map((item) => <li key={`${step.id}-${item}`}>{item}</li>)}
              </ul>
              <footer>
                <span>{step.impact.replace("_", " ")}</span>
                <em aria-label={`${step.label} proof meter ${step.meter} percent`} />
              </footer>
              <small>{step.guardrail}</small>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function PasskeysPage() {
  const [state, setState] = useState<PasskeyState>("idle");
  const [message, setMessage] = useState("No passkey proof saved in this browser.");
  const [credentialId, setCredentialId] = useState("");
  const [supported, setSupported] = useState(false);
  const credentialPreview = credentialId ? `${credentialId.slice(0, 18)}...${credentialId.slice(-8)}` : "no-local-proof";
  const supportLabel = supported ? "secure browser ready" : "secure context needed";
  const proofInput = { state, supported, hasCredential: Boolean(credentialId) };
  const proofConsole = buildPasskeyProofConsole(proofInput);
  const ceremonyControl = buildPasskeyCeremonyControl(proofInput);
  const recoveryRelay = buildPasskeyRecoveryRelay(proofInput);
  const terminalDeck = [
    "+------------------------------------------------------+",
    "| VTK://PASSKEY-IDENTITY//C0VIBE-ACCOUNT               |",
    "|------------------------------------------------------|",
    `| browser       ${supportLabel.padEnd(34, " ")} |`,
    `| local state   ${state.padEnd(34, " ")} |`,
    `| credential    ${credentialPreview.padEnd(34, " ")} |`,
    "|------------------------------------------------------|",
    "| authenticator keeps the secret. usage records stay   |",
    "| local until upload. trust and spend remain separate. |",
    "+------------------------------------------------------+",
  ].join("\n");
  const proofRails = [
    { label: "Authenticator", value: supported ? "ready" : "blocked", note: "WebAuthn runs through the browser security boundary." },
    { label: "Local proof", value: credentialId ? "stored" : "empty", note: "The browser stores only the credential id preview for this page." },
    { label: "Usage ledger", value: "separate", note: "Passkeys never change spend, credits, records, or trust signals." },
  ];

  useEffect(() => {
    setSupported("PublicKeyCredential" in window && window.isSecureContext);
    try {
      const stored = localStorage.getItem(STORE_KEY);
      if (!stored) return;
      setCredentialId(stored);
      setState("ready");
      setMessage("Passkey proof found locally in this browser.");
    } catch {
      setState("error");
      setMessage("Could not read local passkey proof from this browser.");
    }
  }, []);

  async function createPasskey() {
    setState("working");
    setMessage("Waiting for browser authenticator.");
    try {
      if (!supported) throw new Error("Passkeys require a secure browser context with WebAuthn support.");
      const c = challenge();
      const userId = challenge();
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: c,
          rp: { name: "VibeUsage" },
          user: { id: userId, name: "vibeusage-local", displayName: "VibeUsage local account" },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },
            { type: "public-key", alg: -257 },
          ],
          authenticatorSelection: { residentKey: "preferred", userVerification: "preferred" },
          timeout: 60_000,
          attestation: "none",
        },
      });
      if (!(credential instanceof PublicKeyCredential)) throw new Error("Browser did not return a passkey credential.");
      const id = toB64Url(credential.rawId);
      localStorage.setItem(STORE_KEY, id);
      setCredentialId(id);
      setState("ready");
      setMessage("Passkey proof saved locally. Server-side enforcement still belongs to the deployed C0VIBE auth backend.");
    } catch (err) {
      setState("error");
      setMessage((err as Error).message);
    }
  }

  async function verifyPasskey() {
    setState("working");
    setMessage("Requesting passkey assertion.");
    try {
      if (!supported) throw new Error("Passkeys require a secure browser context with WebAuthn support.");
      const stored = localStorage.getItem(STORE_KEY);
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: challenge(),
          allowCredentials: stored ? [{ type: "public-key", id: fromB64Url(stored) }] : [],
          userVerification: "preferred",
          timeout: 60_000,
        },
      });
      if (!(assertion instanceof PublicKeyCredential)) throw new Error("No passkey assertion returned.");
      const id = toB64Url(assertion.rawId);
      setCredentialId(id);
      setState("verified");
      setMessage("Browser passkey proof verified for this session.");
    } catch (err) {
      setState("error");
      setMessage((err as Error).message);
    }
  }

  return (
    <>
      <section className="passkey-identity-hero" aria-label="Passkey identity console">
        <div className="passkey-copy">
          <p className="eyebrow">C0VIBE identity console</p>
          <h1>Passkey account</h1>
          <p>Local-first identity proof for VibeUsage publishing, uploads, and CLI approval. It proves account control without pretending to verify usage.</p>
          <div className="motto-rail" aria-label="C0VIBE motto">
            <span>Vibers Unite</span>
            <a href="https://c0vibe.app">c0vibe.app</a>
          </div>
        </div>
        <div className="passkey-terminal" aria-label="Passkey terminal status">
          <div className="console-top"><span>passkey@browser</span><b>{state}</b></div>
          <pre>{terminalDeck}</pre>
          <div className="passkey-terminal-feed">
            <span>&gt; check secure context</span>
            <span>&gt; bind authenticator proof</span>
            <span>&gt; keep usage ledger untouched</span>
          </div>
        </div>
      </section>

      <section className="passkey-shell" aria-label="Passkey account controls">
        <div className="passkey-scanner">
          <div className="terminal-row"><span>$</span><b>vibetracker login</b></div>
          <div className="terminal-row"><span>auth</span><p>C0VIBE session plus passkey proof keeps leaderboard identity separate from self-reported usage.</p></div>
          <div className="terminal-row"><span>ctx</span><p>Credentials stay in your authenticator. Usage records are still local until upload.</p></div>
          <div className="terminal-row"><span>bound</span><p>{credentialPreview}</p></div>
        </div>

        <div className="passkey-console">
          <div className={`passkey-status status-${state}`}>
            <span>{state}</span>
            <b>{message}</b>
            {credentialId ? <code>{credentialPreview}</code> : <code>waiting-for-authenticator</code>}
          </div>
          <div className="passkey-actions">
            <button type="button" onClick={createPasskey} disabled={!supported || state === "working"}>Create <i>+</i></button>
            <button type="button" onClick={verifyPasskey} disabled={!supported || state === "working"}>Verify <i>&gt;</i></button>
          </div>
          {!supported ? <p className="err">Passkeys are unavailable in this browser context.</p> : null}
        </div>
      </section>

      <PasskeyCeremonyControlPanel ceremony={ceremonyControl} />

      <PasskeyRecoveryRelayPanel relay={recoveryRelay} />

      <section className="passkey-proof-console" aria-label="Passkey identity proof console">
        <div className="passkey-proof-console__head">
          <span>VTK://PASSKEY-PROOF//IDENTITY-ONLY//NO-USAGE-MUTATION</span>
          <b>{proofConsole.headline}</b>
        </div>
        <div className="passkey-proof-console__body">
          <aside className="passkey-proof-terminal" aria-label="Passkey proof terminal">
            <div className="console-top"><span>proof@passkey</span><b>{state}</b></div>
            <pre>{proofConsole.terminalLines.join("\n")}</pre>
            <div className="passkey-proof-terminal__totals" aria-label="Passkey proof totals">
              <span>{proofConsole.totals.identity} identity</span>
              <span>{proofConsole.totals.localOnly} local-only</span>
              <span>{proofConsole.totals.notUsage} not usage</span>
              <span>{proofConsole.totals.publish} publish</span>
            </div>
          </aside>
          <div className="passkey-proof-rails">
            {proofConsole.rails.map((rail, index) => (
              <article
                className={`passkey-proof-rail passkey-proof-rail--${rail.impact}`}
                data-impact={rail.impact}
                style={{ "--i": index, "--meter": `${rail.meter}%` } as CSSProperties}
                key={rail.id}
              >
                <div className="passkey-proof-rail__top">
                  <span>{rail.call}</span>
                  <b>{rail.label}</b>
                  <em>{rail.impact.replace("_", " ")}</em>
                </div>
                <strong>{rail.value}</strong>
                <pre>{rail.terminal.join("\n")}</pre>
                <p>{rail.note}</p>
                <code>{rail.command}</code>
                <div className="passkey-proof-rail__meter" aria-label={`${rail.label} proof meter ${rail.meter} percent`}>
                  <i />
                </div>
                <small>{rail.guardrail}</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="passkey-proof-grid" aria-label="Passkey proof boundaries">
        {proofRails.map((rail) => (
          <div key={rail.label}>
            <span>{rail.label}</span>
            <b>{rail.value}</b>
            <p>{rail.note}</p>
          </div>
        ))}
      </section>
    </>
  );
}
