"use client";

import { useEffect } from "react";

// App-level error boundary. Next passes the caught error and a reset() to retry
// the segment. We report the failure (never swallow it, never surface a raw
// stack) and show a calm, honest recovery panel.
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report to the console; Next forwards this to any configured error
    // reporting. This is the telemetry breadcrumb — not an empty handler.
    console.error(error);
  }, [error]);

  return (
    <section className="vrel">
      <div className="vrel-panel">
        <p className="vrel-label">signal lost</p>
        <h1 className="vrel-title">Something broke on our side.</h1>
        <p className="vrel-text">The failure is recorded. Try again, or head back to the board.</p>
        <div className="vrel-actions">
          <button type="button" className="vrel-pill vrel-pill--primary" onClick={() => reset()}>
            try again
          </button>
          <a className="vrel-pill" href="/">back to the board</a>
        </div>
        {error.digest ? <p className="vrel-ref">ref {error.digest}</p> : null}
      </div>
    </section>
  );
}
