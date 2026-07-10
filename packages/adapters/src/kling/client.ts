// Kling (Kuaishou) data-source seam. Kling's API authenticates with a JWT (HS256)
// signed from an access-key/secret-key pair. There is no per-op credit ledger exposed;
// the task list is the closest thing → feed reconstruction. ⚠ VERIFY endpoints/shapes.

import { createHmac } from "node:crypto";

export interface KlingTask {
  task_id: string;
  created_at: number;      // unix ms
  task_status?: string;    // "succeed" | "processing" | "failed" | ...
  model_name?: string;
  type?: string;           // e.g. "text2video" | "image2video"
}
export interface KlingTaskPage { data: KlingTask[]; has_more?: boolean }

export interface KlingClient {
  tasks(args: { pageNum?: number; pageSize?: number }): Promise<KlingTaskPage>;
}

export function createFixtureClient(page: KlingTaskPage): KlingClient {
  return { async tasks() { return { ...page, has_more: false }; } };
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

// Minimal HS256 JWT for Kling (iss=accessKey, short exp). Real crypto, no deps.
function signJwt(accessKey: string, secretKey: string, nowSec: number): string {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(JSON.stringify({ iss: accessKey, exp: nowSec + 1800, nbf: nowSec - 5 }));
  const sig = b64url(createHmac("sha256", secretKey).update(`${header}.${payload}`).digest());
  return `${header}.${payload}.${sig}`;
}

export function createHttpClient(cfg: { accessKey: string; secretKey: string; baseUrl?: string }): KlingClient {
  const base = cfg.baseUrl ?? "https://api.klingai.com"; // ⚠ VERIFY
  return {
    async tasks({ pageNum = 1, pageSize = 100 }) {
      const token = signJwt(cfg.accessKey, cfg.secretKey, Math.floor(Date.now() / 1000));
      const u = new URL(`${base}/v1/videos/text2video`); // ⚠ VERIFY listing path
      u.searchParams.set("pageNum", String(pageNum));
      u.searchParams.set("pageSize", String(pageSize));
      const res = await fetch(u, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Kling tasks ${res.status}: ${await res.text()}`);
      const body = (await res.json()) as { data?: KlingTask[] };
      return { data: body.data ?? [], has_more: (body.data?.length ?? 0) === pageSize };
    },
  };
}
