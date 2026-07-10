// ComfyUI — local image/video generation. Retroactive usage from the local history API.
//   GET {baseUrl}/history -> { "<prompt_id>": { outputs, status{messages[]} } }
// Local, no auth, cost $0 (optionally GPU-time). baseUrl default http://127.0.0.1:8188.

export interface ComfyOutputs {
  images?: unknown[];
  gifs?: unknown[];
  videos?: unknown[];
}
export interface ComfyHistoryEntry {
  outputs?: Record<string, ComfyOutputs>;
  status?: { status_str?: string; completed?: boolean; messages?: Array<[string, { timestamp?: number }]> };
}
export type ComfyHistory = Record<string, ComfyHistoryEntry>;

export interface ComfyUIClient { history(): Promise<ComfyHistory> }

export function createFixtureClient(h: ComfyHistory): ComfyUIClient {
  return { async history() { return h; } };
}

export function createHttpClient(cfg: { baseUrl?: string } = {}): ComfyUIClient {
  const base = cfg.baseUrl ?? "http://127.0.0.1:8188";
  return {
    async history() {
      const res = await fetch(`${base}/history`);
      if (!res.ok) throw new Error(`ComfyUI history ${res.status}: ${await res.text()}`);
      return (await res.json()) as ComfyHistory;
    },
  };
}
