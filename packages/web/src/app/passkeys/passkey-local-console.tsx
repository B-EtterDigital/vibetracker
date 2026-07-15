"use client";

import { useEffect, useState } from "react";
import { buildPasskeyBoundarySnapshot } from "../../lib/passkey-local-boundary";
import type { PasskeyProofState } from "../../lib/passkey-proof-console";
import { PasskeyTechnicalReference } from "./passkey-technical-reference";

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

export function PasskeyLocalConsole() {
  const [state, setState] = useState<PasskeyProofState>("idle");
  const [message, setMessage] = useState("No local credential reference is stored in this browser.");
  const [credentialId, setCredentialId] = useState("");
  const [supported, setSupported] = useState(false);
  const hasCredential = Boolean(credentialId);
  const boundary = buildPasskeyBoundarySnapshot({ state, supported, hasCredential });
  const credentialPreview = credentialId ? `${credentialId.slice(0, 16)}...${credentialId.slice(-8)}` : "none stored";

  useEffect(() => {
    setSupported("PublicKeyCredential" in window && window.isSecureContext);
    try {
      const stored = localStorage.getItem(STORE_KEY);
      if (!stored) return;
      setCredentialId(stored);
      setState("ready");
      setMessage("A local credential reference exists. It is not an account login.");
    } catch {
      setState("error");
      setMessage("This browser did not allow access to the local credential reference.");
    }
  }, []);

  async function createLocalKey() {
    setState("working");
    setMessage("Waiting for the browser authenticator.");
    try {
      if (!supported) throw new Error("A secure browser context with WebAuthn support is required.");
      const credential = await window.navigator.credentials.create({
        publicKey: {
          challenge: challenge(),
          rp: { name: "VibeUsage local key lab" },
          user: {
            id: challenge(),
            name: "vibeusage-local-lab",
            displayName: "VibeUsage local key",
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },
            { type: "public-key", alg: -257 },
          ],
          authenticatorSelection: { residentKey: "preferred", userVerification: "preferred" },
          timeout: 60_000,
          attestation: "none",
        },
      });
      if (!(credential instanceof PublicKeyCredential)) throw new Error("The browser did not return a local credential.");
      const id = toB64Url(credential.rawId);
      localStorage.setItem(STORE_KEY, id);
      setCredentialId(id);
      setState("ready");
      setMessage("Local credential reference stored. It is not a GitHub login or server-verified account proof.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function checkLocalKey() {
    setState("working");
    setMessage("Requesting a local authenticator response.");
    try {
      if (!supported) throw new Error("A secure browser context with WebAuthn support is required.");
      const stored = localStorage.getItem(STORE_KEY);
      if (!stored) throw new Error("Create a local key reference in this browser before checking it.");
      const assertion = await window.navigator.credentials.get({
        publicKey: {
          challenge: challenge(),
          allowCredentials: [{ type: "public-key", id: fromB64Url(stored) }],
          userVerification: "preferred",
          timeout: 60_000,
        },
      });
      if (!(assertion instanceof PublicKeyCredential)) throw new Error("The browser did not return an authenticator assertion.");
      setCredentialId(toB64Url(assertion.rawId));
      setState("asserted");
      setMessage("Authenticator responded locally. No server verified this assertion.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  function clearLocalReference() {
    try {
      localStorage.removeItem(STORE_KEY);
      setCredentialId("");
      setState("idle");
      setMessage("Local credential reference cleared from this browser. The authenticator may still retain its credential.");
    } catch {
      setState("error");
      setMessage("This browser did not allow the local credential reference to be cleared.");
    }
  }

  return (
    <div className="passkey-local-route">
      <section className="passkey-local" aria-labelledby="passkey-local-title">
        <header className="passkey-local__mast">
          <div>
            <p>VTK://IDENTITY-BOUNDARY//GITHUB-FIRST//LOCAL-KEY-OPTIONAL</p>
            <h1 id="passkey-local-title">GitHub proves the account. This key stays local.</h1>
            <span>Use GitHub for the blue identity check and CLI account link. This optional WebAuthn lab only asks whether a browser authenticator can create or answer with a local credential.</span>
            <div className="passkey-local__actions">
              <a href="/account?returnTo=%2Fpasskeys">SIGN IN WITH GITHUB <span aria-hidden="true">↗</span></a>
              <a href="#local-key-console">OPEN LOCAL KEY LAB <span aria-hidden="true">↓</span></a>
            </div>
          </div>
          <aside data-state={state} aria-label="Local key boundary receipt">
            <span><i aria-hidden="true" /> {state.toUpperCase()}</span>
            <strong>{boundary.serverVerified ? "SERVER VERIFIED" : "LOCAL ONLY"}</strong>
            <b>{boundary.stateLabel}</b>
            <small>server verification: none // account authority: GitHub</small>
          </aside>
        </header>

        <div className="passkey-local__warning" role="note">
          <b>NOT AN ACCOUNT LOGIN</b>
          <span>The challenge is generated in this browser and no assertion is sent to a server. A successful response proves only that the local authenticator answered.</span>
        </div>

        <div className="passkey-local__counters" aria-label="Passkey boundary counters">
          <div><span>SERVER VERIFICATIONS</span><strong>0</strong><small>this local lab</small></div>
          <div><span>USAGE MUTATIONS</span><strong>{boundary.usageMutations}</strong><small>ledger untouched</small></div>
          <div><span>RANK DELTA</span><strong>{boundary.rankDelta}</strong><small>identity is not usage</small></div>
          <div><span>LOCAL REFERENCE</span><strong>{hasCredential ? "YES" : "NO"}</strong><small>{boundary.localReferenceLabel}</small></div>
        </div>

        <section className="passkey-local__rails" aria-labelledby="identity-order-title">
          <header><span>01</span><div><h2 id="identity-order-title">Three proofs. Three different jobs.</h2><p>Do not promote a browser ceremony into account or usage verification.</p></div></header>
          <div>
            {boundary.rails.map((rail, index) => (
              <a href={rail.href} key={rail.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><b>{rail.label}</b><strong>{rail.value}</strong><p>{rail.note}</p></div>
                <i aria-hidden="true">↗</i>
              </a>
            ))}
          </div>
        </section>

        <section className="passkey-local__console" id="local-key-console" aria-labelledby="local-key-title">
          <header><span>02</span><div><h2 id="local-key-title">Optional local key lab</h2><p>Create, check, or clear the browser-held credential reference without moving account or usage state.</p></div></header>
          <div className="passkey-local__console-grid">
            <aside>
              <span>BROWSER BOUNDARY</span>
              <dl>
                <div><dt>context</dt><dd>{boundary.browserLabel}</dd></div>
                <div><dt>account authority</dt><dd>{boundary.accountAuthority}</dd></div>
                <div><dt>stored reference</dt><dd><code>{credentialPreview}</code></dd></div>
                <div><dt>server challenge</dt><dd>none</dd></div>
                <div><dt>server signature check</dt><dd>none</dd></div>
              </dl>
            </aside>
            <div className="passkey-local__status" data-state={state}>
              <span>{state.toUpperCase()}</span>
              <h3>{message}</h3>
              <code>{credentialPreview}</code>
              <div>
                <button disabled={!supported || state === "working"} onClick={createLocalKey} type="button">CREATE LOCAL KEY</button>
                <button disabled={!supported || !hasCredential || state === "working"} onClick={checkLocalKey} type="button">CHECK LOCAL KEY</button>
                <button disabled={!hasCredential || state === "working"} onClick={clearLocalReference} type="button">CLEAR REFERENCE</button>
              </div>
              {!supported && <p role="status">WebAuthn is unavailable in this browser context. GitHub account identity remains available.</p>}
            </div>
          </div>
        </section>
      </section>

      <details className="passkey-technical">
        <summary><span>TECHNICAL REFERENCE</span><b>Open the ceremony, recovery, and proof diagrams</b><small>Browser stages, local credential custody, zero-mutation rails, and recovery drills.</small></summary>
        <div className="passkey-technical__content">
          <PasskeyTechnicalReference input={{ state, supported, hasCredential }} />
        </div>
      </details>
    </div>
  );
}
