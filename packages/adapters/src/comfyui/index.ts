// ComfyUI adapter — local tier. Reads the local /history API; cost $0 (GPU-time optional).

import type { Adapter, AdapterCtx, DateRange } from "../../../core/src/adapter.ts";
import type { NormalizedRecord } from "../../../core/src/schema/record.ts";
import type { ComfyUIClient } from "./client.ts";
import { normalizeHistory } from "./normalize.ts";

export function createComfyUIAdapter(client: ComfyUIClient): Adapter {
  return {
    id: "comfyui",
    categories: ["image", "video"],
    auth: { kind: "localLogs", hint: "local ComfyUI /history", serverVerifiable: false },
    capabilities: { ledger: false, balance: false, feed: true },

    async getUsage(range: DateRange, ctx: AdapterCtx): Promise<NormalizedRecord[]> {
      let h;
      try {
        h = await client.history();
      } catch (err) {
        ctx.telemetry.captureError(err, { area: "adapter.comfyui.history", severity: "error" });
        throw err;
      }
      const fromT = Date.parse(range.from);
      const toT = Date.parse(range.to);
      const recs = normalizeHistory(h).filter((r) => {
        const t = Date.parse(r.ts);
        return t >= fromT && t <= toT;
      });
      ctx.telemetry.addBreadcrumb("adapter.comfyui.history", { entries: Object.keys(h).length, kept: recs.length });
      return recs;
    },
  };
}

export { createFixtureClient, createHttpClient } from "./client.ts";
export { normalizeHistory } from "./normalize.ts";
export type { ComfyUIClient, ComfyHistory } from "./client.ts";
