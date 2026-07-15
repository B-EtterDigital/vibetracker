"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  formatCompareExactNumber,
  formatCompareOperations,
  type CompareParticipant,
  type PublicComparisonSnapshot,
} from "./compare-model";

export interface CompareProfileState {
  requestedHandle: string;
  participant: CompareParticipant | null;
  state: "ready" | "missing" | "error";
}

interface CompareLabProps {
  leftState: CompareProfileState;
  rightState: CompareProfileState;
  snapshot: PublicComparisonSnapshot | null;
}

type CompareView = "overview" | "providers" | "evidence";
type ProviderFilter = "all" | "shared" | "unique";
type CopyState = "idle" | "copied" | "blocked";

const VIEWS: Array<{ id: CompareView; label: string; detail: string }> = [
  { id: "overview", label: "Signal delta", detail: "six comparable aggregates" },
  { id: "providers", label: "Provider matrix", detail: "shared and unique rails" },
  { id: "evidence", label: "Evidence boundary", detail: "tier, rank, identity, privacy" },
];

function ParticipantCard({ side, profileState }: { side: "L" | "R"; profileState: CompareProfileState }) {
  const profile = profileState.participant;
  return (
    <article className="compare-participant" data-load-state={profileState.state}>
      <div className="compare-participant__mark" aria-hidden="true">{side}</div>
      {profile ? (
        <>
          <div className="compare-participant__identity">
            <span>{profile.identityLabel}</span>
            <strong>@{profile.handle}</strong>
            <small>{profile.evidenceTier} // {profile.publishedLabel}</small>
          </div>
          <dl>
            <div>
              <dt>OPS</dt>
              <dd
                aria-label={`${formatCompareExactNumber(profile.operations)} operations`}
                title={`Exact: ${formatCompareExactNumber(profile.operations)} operations`}
              >
                {formatCompareOperations(profile.operations)}
              </dd>
            </div>
            <div><dt>SCORE</dt><dd>{profile.score}/100</dd></div>
            <div><dt>PROVIDERS</dt><dd>{profile.providers}</dd></div>
          </dl>
          <a href={profile.profileHref}>OPEN PROFILE</a>
        </>
      ) : (
        <div className="compare-participant__empty">
          <span>{profileState.state === "error" ? "DATA LINK ERROR" : "NO PUBLIC RECEIPT"}</span>
          <strong>@{profileState.requestedHandle}</strong>
          <small>{profileState.state === "error" ? "No cached values substituted." : "Check the handle or publish a reviewed aggregate."}</small>
        </div>
      )}
    </article>
  );
}

export function CompareLab({ leftState, rightState, snapshot }: CompareLabProps) {
  const router = useRouter();
  const [leftHandle, setLeftHandle] = useState(leftState.requestedHandle);
  const [rightHandle, setRightHandle] = useState(rightState.requestedHandle);
  const [view, setView] = useState<CompareView>("overview");
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>("all");
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  function swapProfiles() {
    const nextLeft = rightHandle;
    const nextRight = leftHandle;
    setLeftHandle(nextLeft);
    setRightHandle(nextRight);
    router.push(`/compare?left=${encodeURIComponent(nextLeft)}&right=${encodeURIComponent(nextRight)}`);
  }

  function moveTab(index: number, event: KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const last = VIEWS.length - 1;
    const next = event.key === "Home"
      ? 0
      : event.key === "End"
        ? last
        : event.key === "ArrowLeft"
          ? index === 0 ? last : index - 1
          : index === last ? 0 : index + 1;
    setView(VIEWS[next].id);
    tabRefs.current[next]?.focus();
  }

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

  const providerRows = snapshot?.providerRows.filter((provider) => {
    if (providerFilter === "shared") return provider.presence === "shared";
    if (providerFilter === "unique") return provider.presence !== "shared";
    return true;
  }) ?? [];
  const copyLabel = copyState === "copied" ? "COMPARISON COPIED" : copyState === "blocked" ? "COPY BLOCKED" : "COPY COMPARISON";

  return (
    <section className="compare-lab" data-ready={Boolean(snapshot)} aria-labelledby="compare-title">
      <header className="compare-lab__mast">
        <div>
          <p>VTK://PUBLIC-COMPARISON//TWO-RECEIPTS//ZERO-MUTATIONS</p>
          <h1 id="compare-title">Put two public usage signals on the scope.</h1>
          <span>Compare accepted aggregates, provider overlap, and the same public score formula. Evidence tiers stay visible, trust adds +0, and cross-tier ranks never become a fake winner.</span>
        </div>
        <aside aria-label="Comparison contract">
          <strong>{snapshot ? snapshot.fingerprint : "--------"}</strong>
          <span>COMPARISON FINGERPRINT</span>
          <small>deterministic ID // not a signature</small>
        </aside>
      </header>

      <form className="compare-picker" action="/compare" method="get">
        <label>
          <span>LEFT PUBLIC HANDLE</span>
          <div><b aria-hidden="true">@</b><input aria-label="Left public handle" maxLength={64} name="left" pattern="[a-zA-Z0-9_.-]{1,64}" required value={leftHandle} onChange={(event) => setLeftHandle(event.target.value)} /></div>
        </label>
        <button className="compare-picker__swap" aria-label="Swap public profiles" onClick={swapProfiles} type="button">L/R</button>
        <label>
          <span>RIGHT PUBLIC HANDLE</span>
          <div><b aria-hidden="true">@</b><input aria-label="Right public handle" maxLength={64} name="right" pattern="[a-zA-Z0-9_.-]{1,64}" required value={rightHandle} onChange={(event) => setRightHandle(event.target.value)} /></div>
        </label>
        <button className="compare-picker__run" type="submit">RUN COMPARISON</button>
      </form>

      <div className="compare-participants" aria-label="Compared public profiles">
        <ParticipantCard side="L" profileState={leftState} />
        <div className="compare-participants__link" aria-hidden="true"><i /><b>VS</b><i /></div>
        <ParticipantCard side="R" profileState={rightState} />
      </div>

      {!snapshot ? (
        <div className="compare-lab__empty" role="status">
          <span>COMPARISON HELD</span>
          <h2>Two public receipts are required.</h2>
          <p>The lab will not replace a missing or failed profile with demo data. Correct the handles above, then run the comparison again.</p>
          <div><b>fabricated operations 0</b><b>fabricated rank winners 0</b><b>hidden writes 0</b></div>
        </div>
      ) : (
        <>
          <div className="compare-status" data-cross-tier={snapshot.crossTier}>
            <i aria-hidden="true" />
            <strong>{snapshot.comparisonStatus}</strong>
            <span>{snapshot.metricRows.length} metrics // {snapshot.providerRows.length} provider rails // 0 writes</span>
            <button onClick={copyReceipt} type="button">{copyLabel}</button>
            <small aria-live="polite">{copyState === "copied" ? "Public comparison copied to clipboard." : copyState === "blocked" ? "Clipboard permission was denied." : ""}</small>
          </div>

          <section className="compare-brief" aria-labelledby="compare-brief-title">
            <header>
              <div>
                <span>OPERATOR BRIEF / READ THIS FIRST</span>
                <h2 id="compare-brief-title">{snapshot.brief.headline}</h2>
              </div>
              <b>{snapshot.brief.scopeLabel}</b>
            </header>
            <div className="compare-brief__grid">
              <article data-tone="vector">
                <small>SIGNAL VECTOR</small>
                <strong>{snapshot.brief.vectorLabel}</strong>
                <p>{snapshot.brief.summary}</p>
              </article>
              <article data-tone="providers">
                <small>PROVIDER TOPOLOGY</small>
                <strong>{snapshot.brief.providerLabel}</strong>
                <p>{snapshot.commonProviders} common rail{snapshot.commonProviders === 1 ? "" : "s"}; {snapshot.leftOnlyProviders} left-only and {snapshot.rightOnlyProviders} right-only.</p>
              </article>
              <article data-tone="decisive">
                <small>STRONGEST DIFFERENTIATOR</small>
                <strong>{snapshot.brief.decisiveLabel}</strong>
                <p>{snapshot.brief.decisiveDetail}</p>
              </article>
            </div>
            <footer>
              <div><b>NEXT INSPECTION</b><span>{snapshot.brief.nextAction}</span></div>
              <button aria-controls={`compare-panel-${snapshot.brief.nextView}`} onClick={() => setView(snapshot.brief.nextView)} type="button">
                OPEN {snapshot.brief.nextView === "providers" ? "PROVIDER MATRIX" : "EVIDENCE BOUNDARY"}
              </button>
            </footer>
          </section>

          <nav className="compare-views" role="tablist" aria-label="Comparison views">
            {VIEWS.map((item, index) => (
              <button
                aria-controls={`compare-panel-${item.id}`}
                aria-selected={view === item.id}
                id={`compare-tab-${item.id}`}
                key={item.id}
                onClick={() => setView(item.id)}
                onKeyDown={(event) => moveTab(index, event)}
                ref={(node) => { tabRefs.current[index] = node; }}
                role="tab"
                tabIndex={view === item.id ? 0 : -1}
                type="button"
              >
                <b>{String(index + 1).padStart(2, "0")}</b><span>{item.label}<small>{item.detail}</small></span>
              </button>
            ))}
          </nav>

          {view === "overview" ? (
            <div className="compare-panel compare-overview" id="compare-panel-overview" role="tabpanel" aria-labelledby="compare-tab-overview">
              <header><span>LEFT // @{snapshot.left.handle}</span><b>PUBLIC SIGNAL DELTA</b><span>RIGHT // @{snapshot.right.handle}</span></header>
              {snapshot.metricRows.map((metric) => (
                <article data-leader={metric.leader} key={metric.id}>
                  <div className="compare-metric__value compare-metric__value--left">
                    <strong aria-label={`${metric.label}: ${metric.leftExactLabel}`} title={`Exact: ${metric.leftExactLabel}`}>{metric.leftLabel}</strong>
                    <i style={{ "--meter": `${metric.leftMeter}%` } as CSSProperties} />
                  </div>
                  <div className="compare-metric__center">
                    <span>{metric.label}</span>
                    <b aria-label={metric.deltaExactLabel} title={metric.deltaExactLabel === metric.deltaLabel ? undefined : `Exact: ${metric.deltaExactLabel}`}>{metric.deltaLabel}</b>
                    <small>{metric.note}</small>
                  </div>
                  <div className="compare-metric__value compare-metric__value--right">
                    <strong aria-label={`${metric.label}: ${metric.rightExactLabel}`} title={`Exact: ${metric.rightExactLabel}`}>{metric.rightLabel}</strong>
                    <i style={{ "--meter": `${metric.rightMeter}%` } as CSSProperties} />
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          {view === "providers" ? (
            <div className="compare-panel compare-providers" id="compare-panel-providers" role="tabpanel" aria-labelledby="compare-tab-providers">
              <header>
                <div><span>PROVIDER OVERLAP MATRIX</span><strong>{snapshot.commonProviders} shared // {snapshot.leftOnlyProviders} left-only // {snapshot.rightOnlyProviders} right-only</strong></div>
                <div className="compare-provider-filter" aria-label="Filter provider rows">
                  {(["all", "shared", "unique"] as ProviderFilter[]).map((filter) => <button aria-pressed={providerFilter === filter} key={filter} onClick={() => setProviderFilter(filter)} type="button">{filter}</button>)}
                </div>
              </header>
              <div className="compare-provider-table" role="table" aria-label="Provider operation comparison">
                <div className="compare-provider-row compare-provider-row--head" role="row"><span role="columnheader">LEFT OPS</span><b role="columnheader">PROVIDER</b><span role="columnheader">RIGHT OPS</span></div>
                {providerRows.map((provider) => (
                  <div className="compare-provider-row" data-presence={provider.presence} role="row" key={provider.provider}>
                    <div role="cell"><strong>{provider.leftLabel}</strong><i style={{ "--meter": `${provider.leftMeter}%` } as CSSProperties} /></div>
                    <b role="cell"><span>{provider.provider}</span><small>{provider.presence.replace(/_/g, " ")}</small></b>
                    <div role="cell"><strong>{provider.rightLabel}</strong><i style={{ "--meter": `${provider.rightMeter}%` } as CSSProperties} /></div>
                  </div>
                ))}
                {providerRows.length === 0 ? <p>No provider rows match this filter.</p> : null}
              </div>
            </div>
          ) : null}

          {view === "evidence" ? (
            <div className="compare-panel compare-evidence" id="compare-panel-evidence" role="tabpanel" aria-labelledby="compare-tab-evidence">
              <div className="compare-evidence__profiles">
                {[snapshot.left, snapshot.right].map((participant, index) => (
                  <article key={participant.handle}>
                    <span>{index === 0 ? "LEFT RECEIPT" : "RIGHT RECEIPT"}</span>
                    <h2>@{participant.handle}</h2>
                    <dl>
                      <div><dt>IDENTITY</dt><dd>{participant.identityLabel}</dd></div>
                      <div><dt>EVIDENCE TIER</dt><dd>{participant.evidenceTier}</dd></div>
                      <div><dt>BOARD POSITION</dt><dd>{participant.rankLabel}</dd></div>
                      <div><dt>SNAPSHOT</dt><dd>{participant.fingerprint}</dd></div>
                      <div><dt>TRUST SIDECAR</dt><dd>{participant.trustSignals} signals // +0 score</dd></div>
                    </dl>
                  </article>
                ))}
              </div>
              <div className="compare-guardrails">
                {snapshot.guardrails.map((guardrail) => {
                  const [label, ...rest] = guardrail.split(":");
                  return <div key={label}><b>{label}</b><span>{rest.join(":").trim()}</span></div>;
                })}
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
