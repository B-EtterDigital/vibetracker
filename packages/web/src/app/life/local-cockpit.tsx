"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { buildCockpitSnapshot, parseLocalInsights, parseLocalStats, type CockpitSnapshot } from "./local-cockpit-data";

type ConnectionState = "idle" | "connecting" | "connected" | "offline" | "permission" | "unauthorized" | "invalid";
type CopyState = "idle" | "copied" | "blocked";

const COMMAND = "npx vibetrack api serve --port 8765";

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

async function loadSnapshot(token: string, port: number): Promise<CockpitSnapshot> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 6000);
  const headers = { authorization: `Bearer ${token}` };
  try {
    try {
      const permission = await navigator.permissions.query({ name: "local-network-access" as PermissionName });
      if (permission.state === "denied") throw new Error("permission");
    } catch (error) {
      if (error instanceof Error && error.message === "permission") throw error;
    }
    const [statsResponse, insightsResponse] = await Promise.all([
      fetch(`http://127.0.0.1:${port}/stats`, { headers, cache: "no-store", signal: controller.signal }),
      fetch(`http://127.0.0.1:${port}/insights`, { headers, cache: "no-store", signal: controller.signal }),
    ]);
    if (statsResponse.status === 401 || insightsResponse.status === 401) throw new Error("unauthorized");
    if (!statsResponse.ok || !insightsResponse.ok) throw new Error("offline");
    const stats = parseLocalStats(await statsResponse.json());
    const insights = parseLocalInsights(await insightsResponse.json());
    return buildCockpitSnapshot(stats, insights);
  } catch (error) {
    try {
      const permission = await navigator.permissions.query({ name: "local-network-access" as PermissionName });
      if (permission.state === "denied") throw new Error("permission");
    } catch (permissionError) {
      if (permissionError instanceof Error && permissionError.message === "permission") throw permissionError;
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function LocalCockpit() {
  const [connection, setConnection] = useState<ConnectionState>("idle");
  const [token, setToken] = useState("");
  const [port, setPort] = useState(8765);
  const [snapshot, setSnapshot] = useState<CockpitSnapshot | null>(null);
  const [copyState, setCopyState] = useState<CopyState>("idle");

  const connect = useCallback(async (sessionToken: string, sessionPort: number) => {
    if (!sessionToken || sessionPort < 1 || sessionPort > 65535) {
      setConnection("invalid");
      return;
    }
    setConnection("connecting");
    try {
      const next = await loadSnapshot(sessionToken, sessionPort);
      setSnapshot(next);
      setConnection("connected");
    } catch (error) {
      setSnapshot(null);
      const message = error instanceof Error ? error.message : "offline";
      setConnection(message === "unauthorized" ? "unauthorized" : message === "permission" ? "permission" : "offline");
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const fragmentToken = params.get("local") ?? "";
    const fragmentPort = Number(params.get("port") ?? 8765);
    if (!fragmentToken) return;
    const safePort = Number.isInteger(fragmentPort) && fragmentPort > 0 && fragmentPort <= 65535 ? fragmentPort : 8765;
    setToken(fragmentToken);
    setPort(safePort);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    void connect(fragmentToken, safePort);
  }, [connect]);

  const statusCopy = useMemo(() => {
    if (connection === "connected") return "LOOPBACK CONNECTED";
    if (connection === "connecting") return "NEGOTIATING LOCAL LINK";
    if (connection === "unauthorized") return "SESSION TOKEN REJECTED";
    if (connection === "permission") return "LOCAL NETWORK PERMISSION REQUIRED";
    if (connection === "offline") return "LOCAL API NOT REACHABLE";
    if (connection === "invalid") return "CHECK TOKEN AND PORT";
    return "LOCAL LINK DORMANT";
  }, [connection]);

  function submit(event: FormEvent) {
    event.preventDefault();
    void connect(token.trim(), port);
  }

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(COMMAND);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("blocked");
    }
  }

  function disconnect() {
    setToken("");
    setSnapshot(null);
    setConnection("idle");
  }

  return (
    <section className="vlife" aria-labelledby="vlife-title">
      <header className="vlife-head">
        <div>
          <p>VTK://LOCAL-COCKPIT // READ-ONLY // ZERO-UPLOAD</p>
          <h1 id="vlife-title">Your AI spend. Live from this machine.</h1>
          <span>Aggregate cost, rhythm, providers, and decisions from the ledger already on your computer.</span>
        </div>
        <div className="vlife-status" data-state={connection} role="status" aria-live="polite">
          <i aria-hidden="true" />
          <b>{statusCopy}</b>
          <code>127.0.0.1:{port}</code>
        </div>
      </header>

      {connection === "connected" && snapshot ? (
        <ConnectedCockpit snapshot={snapshot} onRefresh={() => void connect(token, port)} onDisconnect={disconnect} />
      ) : (
        <section className="vlife-linker" aria-labelledby="vlife-link-title">
          <div className="vlife-linker-copy">
            <p>PRIVATE SESSION HANDSHAKE</p>
            <h2 id="vlife-link-title">Open the local relay.</h2>
            <span>Run the command, then open its private dashboard link. The session token lives in the URL fragment and is removed after connection.</span>
          </div>

          <div className="vlife-command">
            <span>TERMINAL</span>
            <code>{COMMAND}</code>
            <button type="button" data-state={copyState} onClick={copyCommand}>
              <span aria-hidden="true">[+]</span>
              {copyState === "copied" ? "COPIED" : copyState === "blocked" ? "COPY BLOCKED" : "COPY"}
            </button>
          </div>

          <form className="vlife-session-form" onSubmit={submit}>
            <label>
              <span>SESSION TOKEN</span>
              <input type="password" autoComplete="off" value={token} onChange={(event) => setToken(event.target.value)} placeholder="paste token from terminal" />
            </label>
            <label className="vlife-port">
              <span>PORT</span>
              <input type="number" min="1" max="65535" value={port} onChange={(event) => setPort(Number(event.target.value))} />
            </label>
            <button type="submit" disabled={connection === "connecting" || !token.trim() || port < 1 || port > 65535}>
              <span aria-hidden="true">[&gt;]</span>
              {connection === "connecting" ? "CONNECTING" : "CONNECT LOCAL"}
            </button>
          </form>

          {connection === "permission" ? (
            <p className="vlife-connection-note" data-tone="permission">Allow Local Network Access for this site in the browser, then connect again.</p>
          ) : connection === "unauthorized" ? (
            <p className="vlife-connection-note" data-tone="error">The session expired or does not match this API. Open the newest private dashboard link from the terminal.</p>
          ) : connection === "offline" ? (
            <p className="vlife-connection-note" data-tone="error">Keep the terminal command running and confirm the loopback port before retrying.</p>
          ) : connection === "invalid" ? (
            <p className="vlife-connection-note" data-tone="error">Enter the session token printed by the CLI and a port from 1 to 65535.</p>
          ) : null}

          <div className="vlife-custody">
            <span><b>READS</b> aggregate stats + insights</span>
            <span><b>NEVER READS</b> prompts + outputs</span>
            <span><b>NETWORK</b> loopback only</span>
            <span><b>UPLOAD</b> none</span>
          </div>
        </section>
      )}
    </section>
  );
}

function ConnectedCockpit({ snapshot, onRefresh, onDisconnect }: { snapshot: CockpitSnapshot; onRefresh: () => void; onDisconnect: () => void }) {
  const hasUsage = snapshot.totals.records > 0;
  return (
    <div className="vlife-connected">
      <div className="vlife-toolbar">
        <span>LAST LOCAL READ {new Date(snapshot.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        <span>{shortDate(snapshot.range.from)} - {shortDate(snapshot.range.to)}</span>
        <div>
          <button type="button" onClick={onRefresh}>[~] REFRESH</button>
          <button type="button" onClick={onDisconnect}>[X] DISCONNECT</button>
        </div>
      </div>

      <dl className="vlife-metrics">
        <div data-tone="spend"><dt>TRACKED SPEND</dt><dd>{money(snapshot.totals.usd)}</dd><span>{integer(snapshot.totals.records)} accepted rows</span></div>
        <div data-tone="forecast"><dt>30D FORECAST</dt><dd>{money(snapshot.totals.projected30dUsd)}</dd><span>trailing local pace</span></div>
        <div data-tone="ops"><dt>OPERATIONS</dt><dd title={`${integer(snapshot.totals.operations)} operations`}>{compact(snapshot.totals.operations)}</dd><span>{snapshot.totals.providers} providers</span></div>
        <div data-tone="local"><dt>LOCAL SHADOW</dt><dd>{money(snapshot.totals.localSavingsUsd)}</dd><span>kept off hosted APIs</span></div>
      </dl>

      {hasUsage ? (
        <div className="vlife-workbench">
          <section className="vlife-rhythm" aria-labelledby="vlife-rhythm-title">
            <div className="vlife-section-head"><div><p>LEDGER RHYTHM</p><h2 id="vlife-rhythm-title">Last {snapshot.daily.length} active days</h2></div><span>USD OR OPERATIONS</span></div>
            <div className="vlife-bars" role="img" aria-label={`Usage rhythm across ${snapshot.daily.length} active days`}>
              {snapshot.daily.map((day) => (
                <i key={day.key} style={{ "--level": `${day.level}%` } as CSSProperties} title={`${day.key}: ${money(day.usd)}, ${integer(day.ops)} operations`} />
              ))}
            </div>
            <div className="vlife-rhythm-axis"><span>{snapshot.daily[0]?.key ?? "-"}</span><span>{snapshot.daily.at(-1)?.key ?? "-"}</span></div>
          </section>

          <section className="vlife-providers" aria-labelledby="vlife-providers-title">
            <div className="vlife-section-head"><div><p>SOURCE PRESSURE</p><h2 id="vlife-providers-title">Provider mix</h2></div><span>SHARE OF SIGNAL</span></div>
            <ol>
              {snapshot.providers.map((provider, index) => (
                <li key={provider.key}>
                  <code>{String(index + 1).padStart(2, "0")}</code>
                  <div><b>{provider.key}</b><i><span style={{ width: `${provider.share}%` }} /></i></div>
                  <span>{provider.usd ? money(provider.usd) : `${integer(provider.ops)} ops`}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
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
          <article>
            <span>TOP WORKFLOW</span>
            <b>{snapshot.workflows[0]?.key ?? "Waiting for priced activity"}</b>
            <small>{snapshot.workflows[0] ? `${money(snapshot.workflows[0].usd)} across ${integer(snapshot.workflows[0].records)} rows` : "No synthetic recommendation is created."}</small>
          </article>
          <article>
            <span>OVERLAP</span>
            <b>{snapshot.overlaps[0] ? `${snapshot.overlaps[0].providers.length} providers in ${snapshot.overlaps[0].category}` : "No multi-provider overlap yet"}</b>
            <small>{snapshot.overlaps[0]?.providers.join(" // ") ?? "More than one provider in a category reveals comparison opportunities."}</small>
          </article>
        </div>
      </section>

      <p className="vlife-foot">This page reads aggregate JSON from 127.0.0.1. It does not request /records, store the session token, or upload your ledger.</p>
    </div>
  );
}
