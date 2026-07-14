"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import type { LiveProofSnapshot } from "./live-proof-snapshot";

interface LiveProofWorkbenchProps {
  requestedHandle: string;
  snapshot: LiveProofSnapshot | null;
  loadFailed: boolean;
}

type CopyState = "idle" | "copied" | "blocked";

export function LiveProofWorkbench({ requestedHandle, snapshot, loadFailed }: LiveProofWorkbenchProps) {
  const [selectedEvent, setSelectedEvent] = useState(0);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const event = snapshot?.events[selectedEvent] ?? snapshot?.events[0];

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  async function copyReceipt() {
    if (!snapshot) return;
    try {
      await navigator.clipboard.writeText(snapshot.receipt);
      setCopyState("copied");
    } catch {
      setCopyState("blocked");
    }
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopyState("idle"), 1800);
  }

  function moveTab(index: number, keyboardEvent: KeyboardEvent<HTMLButtonElement>) {
    if (!snapshot || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(keyboardEvent.key)) return;
    keyboardEvent.preventDefault();
    const last = snapshot.events.length - 1;
    const next = keyboardEvent.key === "Home"
      ? 0
      : keyboardEvent.key === "End"
        ? last
        : keyboardEvent.key === "ArrowLeft"
          ? index === 0 ? last : index - 1
          : index === last ? 0 : index + 1;
    setSelectedEvent(next);
    tabRefs.current[next]?.focus();
  }

  const copyLabel = copyState === "copied" ? "RECEIPT COPIED" : copyState === "blocked" ? "COPY BLOCKED" : "COPY RECEIPT";

  return (
    <section className="live-proof" data-state={snapshot?.status ?? (loadFailed ? "degraded" : "missing")} aria-labelledby="live-proof-title">
      <div className="live-proof__source">
        <div>
          <span>PUBLIC RECEIPT SOURCE</span>
          <strong>{snapshot ? `@${snapshot.handle}` : `@${requestedHandle}`}</strong>
          <small>{snapshot ? snapshot.identityLabel : loadFailed ? "PUBLIC DATA SOURCE UNAVAILABLE" : "NO PUBLIC PROFILE FOUND"}</small>
        </div>
        <form action="/proof" method="get">
          <label htmlFor="proof-handle">Inspect a public handle</label>
          <div>
            <span aria-hidden="true">@</span>
            <input
              autoComplete="off"
              defaultValue={requestedHandle}
              id="proof-handle"
              maxLength={64}
              name="handle"
              pattern="[a-zA-Z0-9-]{1,64}"
              placeholder="b-etterdigital"
              required
            />
            <button type="submit">INSPECT</button>
          </div>
        </form>
      </div>

      {!snapshot ? (
        <div className="live-proof__empty" role="status">
          <span>{loadFailed ? "DATA LINK DEGRADED" : "ZERO RECEIPT"}</span>
          <h2 id="live-proof-title">{loadFailed ? "The public ledger could not be reached." : "This handle has no public receipt."}</h2>
          <p>
            {loadFailed
              ? "No cached or fixture values were substituted. Retry the lookup when the public data link is available."
              : "No usage totals, provider rows, rank, or verification state will be invented. Check the handle or publish a reviewed aggregate first."}
          </p>
          <div><b>operations 0</b><b>providers 0</b><b>fabricated metrics 0</b></div>
        </div>
      ) : (
        <>
          <header className="live-proof__mast">
            <div>
              <p>VTK://PUBLIC-RECEIPT//@{snapshot.handle}//AGGREGATE-ONLY</p>
              <h2 id="live-proof-title">@{snapshot.handle} public receipt</h2>
              <span>Follow one published aggregate from counted operations through provider mix, score input, trust context, local review, and C0VIBE relay.</span>
            </div>
            <div className="live-proof__state">
              <i aria-hidden="true" />
              <strong>{snapshot.statusLabel}</strong>
              <span>{snapshot.rankLabel}</span>
            </div>
          </header>

          <div className="live-proof__metrics" aria-label="Public receipt metrics">
            {snapshot.metrics.map((metric) => (
              <article key={metric.id}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <small>{metric.detail}</small>
              </article>
            ))}
          </div>

          <div className="live-proof__workspace">
            <aside className="live-proof__terminal" aria-label="Public receipt terminal">
              <div><span>receipt@public</span><b>{snapshot.fingerprint}</b></div>
              <pre>{snapshot.terminalLines.join("\n")}</pre>
              <p>Fingerprint is a deterministic public snapshot ID. It is not a cryptographic signature or independent attestation.</p>
              <nav aria-label="Public receipt actions">
                <button onClick={copyReceipt} type="button">{copyLabel}</button>
                <a href={snapshot.profileHref}>OPEN PROFILE</a>
              </nav>
              <span className="live-proof__copy-status" aria-live="polite">
                {copyState === "copied" ? "Public receipt copied to clipboard." : copyState === "blocked" ? "Clipboard permission was denied." : ""}
              </span>
            </aside>

            <div className="live-proof__replay">
              <div className="live-proof__tabs" role="tablist" aria-label="Receipt replay stages">
                {snapshot.events.map((item, index) => (
                  <button
                    aria-controls={`proof-event-${item.id}`}
                    aria-selected={selectedEvent === index}
                    id={`proof-tab-${item.id}`}
                    key={item.id}
                    onClick={() => setSelectedEvent(index)}
                    onKeyDown={(keyboardEvent) => moveTab(index, keyboardEvent)}
                    ref={(node) => { tabRefs.current[index] = node; }}
                    role="tab"
                    tabIndex={selectedEvent === index ? 0 : -1}
                    type="button"
                  >
                    <i style={{ "--event-from": item.from, "--event-to": item.to, "--event-ink": item.ink } as CSSProperties}>{item.mark}</i>
                    <span><b>{String(index + 1).padStart(2, "0")}</b><small>{item.label}</small></span>
                  </button>
                ))}
              </div>

              {event ? (
                <article
                  aria-labelledby={`proof-tab-${event.id}`}
                  className="live-proof__event"
                  data-impact={event.impact}
                  id={`proof-event-${event.id}`}
                  role="tabpanel"
                  style={{ "--event-meter": `${event.meter}%`, "--event-from": event.from, "--event-to": event.to } as CSSProperties}
                >
                  <header>
                    <div><span>{event.impact.replace(/_/g, " ")}</span><h3>{event.label}</h3></div>
                    <b>{event.status}</b>
                  </header>
                  <div className="live-proof__event-value"><strong>{event.value}</strong><span>{event.route}</span></div>
                  <div className="live-proof__event-meter" role="progressbar" aria-label={`${event.label} public signal`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={event.meter}><i /></div>
                  <p>{event.note}</p>
                  <dl>
                    <div><dt>PUBLIC LINE</dt><dd><code>{event.terminalLine}</code></dd></div>
                    <div><dt>BOUNDARY</dt><dd>{event.guardrail}</dd></div>
                  </dl>
                </article>
              ) : null}
            </div>
          </div>

          <div className="live-proof__rails" aria-label="Public receipt boundaries">
            {snapshot.guardrails.map((guardrail) => {
              const [rail, ...rest] = guardrail.split(":");
              return <div key={rail}><b>{rail}</b><span>{rest.join(":").trim()}</span></div>;
            })}
          </div>
        </>
      )}
    </section>
  );
}
