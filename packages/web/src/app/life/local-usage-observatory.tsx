"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { CockpitSnapshot } from "./local-cockpit-data";

type SignalLens = "spend" | "records";
type RefreshState = "idle" | "refreshing" | "failed";

interface LocalUsageObservatoryProps {
  snapshot: CockpitSnapshot;
  onRefresh: () => Promise<void>;
  onDisconnect: () => void;
  refreshState: RefreshState;
}

const LIVE_REFRESH_MS = 30_000;

function money(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: value >= 100 ? 0 : 2 }).format(value);
}

function integer(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function compact(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function shortDate(value?: string): string {
  if (!value) return "no usage yet";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(value));
}

export function LocalUsageObservatory({ snapshot, onRefresh, onDisconnect, refreshState }: LocalUsageObservatoryProps) {
  const [lens, setLens] = useState<SignalLens>("spend");
  const [liveRefresh, setLiveRefresh] = useState(false);
  const hasUsage = snapshot.totals.records > 0;
  const isRefreshing = refreshState === "refreshing";
  const providerRows = useMemo(() => snapshot.providers
    .map((provider) => ({
      ...provider,
      lensShare: lens === "spend" ? provider.spendShare : provider.recordsShare,
    }))
    .sort((a, b) => lens === "spend" ? b.usd - a.usd : b.count - a.count)
    .slice(0, 7), [lens, snapshot.providers]);
  const densityPeak = useMemo(() => [...snapshot.providers]
    .filter((provider) => provider.costPerRecord !== null)
    .sort((a, b) => (b.costPerRecord ?? 0) - (a.costPerRecord ?? 0))[0], [snapshot.providers]);

  useEffect(() => {
    if (!liveRefresh) return;
    const interval = window.setInterval(() => void onRefresh(), LIVE_REFRESH_MS);
    return () => window.clearInterval(interval);
  }, [liveRefresh, onRefresh]);

  return (
    <div className="vlife-connected">
      <div className="vlife-toolbar">
        <span>LOCAL OBSERVATORY // {shortDate(snapshot.range.from)} - {shortDate(snapshot.range.to)}</span>
        <div className="vlife-toolbar__status" data-state={refreshState} role="status" aria-live="polite">
          {refreshState === "refreshing" ? "READING AGGREGATES" : refreshState === "failed" ? "LAST REFRESH FAILED" : `READ ${new Date(snapshot.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
        </div>
        <div className="vlife-toolbar__actions">
          <button type="button" aria-pressed={liveRefresh} onClick={() => setLiveRefresh((value) => !value)}>{liveRefresh ? "LIVE 30S" : "MANUAL"}</button>
          <button type="button" disabled={isRefreshing} onClick={() => void onRefresh()} aria-label="Refresh local aggregates">[~] REFRESH</button>
          <button type="button" onClick={onDisconnect}>[X] DISCONNECT</button>
        </div>
      </div>

      <dl className="vlife-metrics">
        <div data-tone="spend"><dt>TRACKED SPEND</dt><dd>{money(snapshot.totals.usd)}</dd><span>{integer(snapshot.totals.records)} accepted rows</span></div>
        <div data-tone="forecast"><dt>30D FORECAST</dt><dd>{money(snapshot.totals.projected30dUsd)}</dd><span>trailing local pace</span></div>
        <div data-tone="ops"><dt>OPERATIONS</dt><dd title={`${integer(snapshot.totals.operations)} operations`}>{compact(snapshot.totals.operations)}</dd><span>{snapshot.totals.providers} providers</span></div>
        <div data-tone="local"><dt>LOCAL SHADOW</dt><dd>{money(snapshot.totals.localSavingsUsd)}</dd><span>{snapshot.totals.credits ? `${integer(snapshot.totals.credits)} credits measured` : "kept off hosted APIs"}</span></div>
      </dl>

      {hasUsage ? (
        <>
          <div className="vlife-lensbar">
            <div><span>SIGNAL LENS</span><b>Reframe the same aggregate ledger.</b></div>
            <div className="vlife-lens" role="group" aria-label="Usage signal lens">
              <button type="button" aria-pressed={lens === "spend"} onClick={() => setLens("spend")}>Spend</button>
              <button type="button" aria-pressed={lens === "records"} onClick={() => setLens("records")}>Records</button>
            </div>
            <p>{lens === "spend" ? "USD exposes budget pressure." : "Accepted records expose activity rhythm without mixing native provider units."}</p>
          </div>

          <div className="vlife-workbench">
            <section className="vlife-rhythm" aria-labelledby="vlife-rhythm-title">
              <div className="vlife-section-head"><div><p>LEDGER RHYTHM</p><h2 id="vlife-rhythm-title">Last {snapshot.daily.length} active days</h2></div><span>{lens === "spend" ? "USD" : "ACCEPTED RECORDS"}</span></div>
              <div className="vlife-bars" role="img" aria-label={`${lens === "spend" ? "Spend" : "Accepted record"} rhythm across ${snapshot.daily.length} active days`}>
                {snapshot.daily.map((day) => (
                  <i
                    key={day.key}
                    style={{ "--level": `${lens === "spend" ? day.spendLevel : day.recordsLevel}%` } as CSSProperties}
                    title={`${day.key}: ${money(day.usd)}, ${integer(day.ops)} operations`}
                  />
                ))}
              </div>
              <div className="vlife-rhythm-axis"><span>{snapshot.daily[0]?.key ?? "-"}</span><span>{snapshot.daily.at(-1)?.key ?? "-"}</span></div>
            </section>

            <section className="vlife-providers" aria-labelledby="vlife-providers-title">
              <div className="vlife-section-head"><div><p>PROVIDER EFFICIENCY</p><h2 id="vlife-providers-title">Source pressure</h2></div><span>SHARE // USD PER RECORD</span></div>
              <ol>
                {providerRows.map((provider, index) => (
                  <li key={provider.key}>
                    <code>{String(index + 1).padStart(2, "0")}</code>
                    <div><b>{provider.key}</b><i><span style={{ width: `${provider.lensShare}%` }} /></i></div>
                    <span>{lens === "spend" ? money(provider.usd) : `${integer(provider.count)} rows`}</span>
                    <small>{provider.costPerRecord === null ? "density n/a" : `${money(provider.costPerRecord)}/row`}</small>
                  </li>
                ))}
              </ol>
              <p className="vlife-density">
                <span>HIGHEST OBSERVED COST DENSITY</span>
                <b>{densityPeak ? `${densityPeak.key} · ${money(densityPeak.costPerRecord ?? 0)}/accepted row` : "Not enough priced records"}</b>
                <small>Compare like-for-like jobs before changing providers. Density is not a quality score.</small>
              </p>
            </section>
          </div>
        </>
      ) : (
        <section className="vlife-empty" role="status">
          <p>LEDGER ONLINE // NO ACCEPTED USAGE</p>
          <h2>The relay works. The ledger is empty.</h2>
          <code>npx vibetrack sync</code>
        </section>
      )}

      <section className="vlife-intel" aria-labelledby="vlife-intel-title">
        <div className="vlife-section-head"><div><p>DECISION TAPE</p><h2 id="vlife-intel-title">What deserves attention</h2></div><span>DERIVED LOCALLY</span></div>
        <div className="vlife-intel-grid">
          <article data-tone={snapshot.alerts.length ? "alert" : "clear"}>
            <span>{snapshot.alerts.length ? "ALERTS" : "CLEAR"}</span>
            <b>{snapshot.alerts[0] ?? "No cost anomaly crossed the current threshold."}</b>
            <small>{snapshot.alerts.slice(1).join(" // ") || "Forecast and workflow concentration remain reviewable in the local CLI."}</small>
          </article>
          <article><span>TOP WORKFLOW</span><b>{snapshot.workflows[0]?.key ?? "Waiting for priced activity"}</b><small>{snapshot.workflows[0] ? `${money(snapshot.workflows[0].usd)} across ${integer(snapshot.workflows[0].records)} rows` : "No synthetic recommendation is created."}</small></article>
          <article><span>OVERLAP</span><b>{snapshot.overlaps[0] ? `${snapshot.overlaps[0].providers.length} providers in ${snapshot.overlaps[0].category}` : "No multi-provider overlap yet"}</b><small>{snapshot.overlaps[0]?.providers.join(" // ") ?? "More than one provider in a category reveals comparison opportunities."}</small></article>
        </div>
      </section>

      <div className="vlife-contract">
        <span><b>2</b> aggregate endpoints</span><span><b>0</b> raw-record reads</span><span><b>0</b> uploads</span><span><b>{liveRefresh ? "30s" : "manual"}</b> refresh</span>
      </div>
      <p className="vlife-foot">This page reads aggregate JSON from 127.0.0.1. It does not request /records, store the session token, or upload your ledger.</p>
    </div>
  );
}
