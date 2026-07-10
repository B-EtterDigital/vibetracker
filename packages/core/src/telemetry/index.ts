// VTRS — VibeTracker Reporting Surface.
// SMA Gen3 requires actionable telemetry, never silent failure. Every catch routes
// here: real failures via captureError, expected control-flow via addBreadcrumb.
// Banned: empty `catch {}`, `.catch(() => {})`, and the `vtrs-ignore` marker
// (enforced by scripts/telemetry-audit.mjs).

export type Severity = "info" | "warn" | "error" | "fatal";

export interface ErrorContext {
  area: string;            // "adapter.higgsfield.getUsage"
  severity: Severity;
  [key: string]: unknown;  // extra diagnostics
}

export interface Telemetry {
  captureError(err: unknown, ctx: ErrorContext): void;
  addBreadcrumb(event: string, data?: Record<string, unknown>, level?: Severity): void;
}

/** Default console-backed telemetry. Real deployments swap in a Supabase/OTel sink. */
export function createConsoleTelemetry(): Telemetry {
  return {
    captureError(err, ctx) {
      const message = err instanceof Error ? err.message : String(err);
      // Never swallow — surface area, severity, and the error.
      console.error(`[VTRS:${ctx.severity}] ${ctx.area}: ${message}`, ctx);
    },
    addBreadcrumb(event, data = {}, level = "info") {
      console.error(`[VTRS:breadcrumb:${level}] ${event}`, data);
    },
  };
}
