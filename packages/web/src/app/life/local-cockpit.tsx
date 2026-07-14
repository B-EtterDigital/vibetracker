"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { buildCockpitSnapshot, parseLocalInsights, parseLocalStats, type CockpitSnapshot } from "./local-cockpit-data";
import { LocalCockpitGuide } from "./local-cockpit-guide";
import { LocalUsageObservatory } from "./local-usage-observatory";

type ConnectionState = "idle" | "connecting" | "connected" | "offline" | "permission" | "unauthorized" | "invalid";
type CopyState = "idle" | "copied" | "blocked";
type RefreshState = "idle" | "refreshing" | "failed";

const COMMAND = "npx vibetrack api serve --port 8765";

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
  const [refreshState, setRefreshState] = useState<RefreshState>("idle");

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
      setRefreshState("idle");
    } catch (error) {
      setSnapshot(null);
      const message = error instanceof Error ? error.message : "offline";
      setConnection(message === "unauthorized" ? "unauthorized" : message === "permission" ? "permission" : "offline");
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!token || connection !== "connected") return;
    setRefreshState("refreshing");
    try {
      setSnapshot(await loadSnapshot(token, port));
      setRefreshState("idle");
    } catch {
      setRefreshState("failed");
    }
  }, [connection, port, token]);

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
    setRefreshState("idle");
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
        <LocalUsageObservatory snapshot={snapshot} onRefresh={refresh} onDisconnect={disconnect} refreshState={refreshState} />
      ) : (
        <div className="vlife-disconnected">
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
          <LocalCockpitGuide />
        </div>
      )}
    </section>
  );
}
