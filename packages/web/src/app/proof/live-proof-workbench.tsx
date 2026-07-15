"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import type { LiveProofMetric, LiveProofSnapshot } from "./live-proof-snapshot";

interface LiveProofWorkbenchProps {
  requestedHandle: string;
  snapshot: LiveProofSnapshot | null;
  loadFailed: boolean;
}

type CopyState = "idle" | "copied" | "blocked";

interface ProofClaim {
  id: string;
  label: string;
  question: string;
  metricId: LiveProofMetric["id"];
  source: string;
  tone: "usage" | "provider" | "trust" | "freshness";
  proves: (value: string) => string;
  doesNotProve: string;
}

const PROOF_CLAIMS: ProofClaim[] = [
  {
    id: "counted-usage",
    label: "Counted usage",
    question: "Were operations counted?",
    metricId: "records",
    source: "reviewed public aggregate / record_count",
    tone: "usage",
    proves: (value) => `${value} accepted aggregate operations are present in the reviewed public payload.`,
    doesNotProve: "Prompts, files, token-level billing, effort, quality, or business outcome.",
  },
  {
    id: "provider-mix",
    label: "Provider mix",
    question: "Which rails contributed?",
    metricId: "providers",
    source: "public provider rollups / providers[]",
    tone: "provider",
    proves: (value) => `${value} provider sources contributed public rollups to this receipt.`,
    doesNotProve: "That every provider account is linked, billed, or owned by this profile.",
  },
  {
    id: "trust-context",
    label: "Trust context",
    question: "What context is attached?",
    metricId: "trust",
    source: "published sidecars / trustSignals[]",
    tone: "trust",
    proves: (value) => `${value} published trust signals are attached as separately labelled context.`,
    doesNotProve: "Usage volume, spend, rank input, or automatic account verification.",
  },
  {
    id: "snapshot-freshness",
    label: "Freshness",
    question: "When was this published?",
    metricId: "updated",
    source: "reviewed publish date + deterministic snapshot ID",
    tone: "freshness",
    proves: (value) => `The latest reviewed public publish is dated ${value}; the fingerprint identifies the same payload.`,
    doesNotProve: "An independent signature, timestamp authority, or the current state of a local ledger.",
  },
];

export function LiveProofWorkbench({ requestedHandle, snapshot, loadFailed }: LiveProofWorkbenchProps) {
  const [selectedEvent, setSelectedEvent] = useState(0);
  const [selectedClaim, setSelectedClaim] = useState(0);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const event = snapshot?.events[selectedEvent] ?? snapshot?.events[0];
  const claim = PROOF_CLAIMS[selectedClaim] ?? PROOF_CLAIMS[0];
  const claimMetric = snapshot?.metrics.find((metric) => metric.id === claim.metricId);

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

          <section className="live-proof__decoder" aria-labelledby="proof-claim-decoder-title">
            <header>
              <div><span>VERIFIER MATRIX</span><h3 id="proof-claim-decoder-title">Decode what this receipt can actually claim.</h3></div>
              <b>CLAIM {String(selectedClaim + 1).padStart(2, "0")} / {String(PROOF_CLAIMS.length).padStart(2, "0")}</b>
            </header>
            <div className="live-proof__decoder-body">
              <div className="live-proof__claim-switch" role="group" aria-label="Public receipt claims">
                {PROOF_CLAIMS.map((item, index) => (
                  <button
                    aria-pressed={selectedClaim === index}
                    data-tone={item.tone}
                    key={item.id}
                    onClick={() => setSelectedClaim(index)}
                    type="button"
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <b>{item.label}</b>
                    <small>{item.question}</small>
                  </button>
                ))}
              </div>
              <article className="live-proof__claim-readout" data-tone={claim.tone} aria-live="polite">
                <header><span>PUBLIC VALUE</span><strong>{claimMetric?.value ?? "unavailable"}</strong><small>{claimMetric?.detail ?? "No public metric supplied."}</small></header>
                <dl>
                  <div><dt>PROVES</dt><dd>{claim.proves(claimMetric?.value ?? "No")}</dd></div>
                  <div><dt>READ FROM</dt><dd><code>{claim.source}</code></dd></div>
                  <div><dt>DOES NOT PROVE</dt><dd>{claim.doesNotProve}</dd></div>
                </dl>
                <footer><b>AGGREGATE ONLY</b><span>0 hidden reads</span><span>0 writes</span></footer>
              </article>
            </div>
          </section>

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
