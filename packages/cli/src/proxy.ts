// `vibetracker proxy` — a local forwarding proxy that logs OpenAI-compatible usage. Point
// any tool's base URL at it (Ollama/LM Studio/x.ai/z.ai/GLM/Groq/…). v0: buffers responses,
// so it captures non-streaming usage; streaming SSE usage-parsing is a roadmap item.

import { createServer, request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { extractOpenAIUsage } from "../../core/src/proxy.ts";
import type { NormalizedRecord, Source } from "../../core/src/schema/record.ts";

export interface ProxyOpts {
  target: string;
  provider: string;
  port: number;
  source?: Source;
  onRecord: (r: NormalizedRecord) => void;
  log?: (s: string) => void;
}

export function runProxy(opts: ProxyOpts): { close: () => void } {
  const target = new URL(opts.target);
  const forward = target.protocol === "https:" ? httpsRequest : httpRequest;

  const server = createServer((cReq, cRes) => {
    const reqChunks: Buffer[] = [];
    cReq.on("data", (c) => reqChunks.push(c as Buffer));
    cReq.on("end", () => {
      const pReq = forward(
        {
          hostname: target.hostname,
          port: target.port || (target.protocol === "https:" ? 443 : 80),
          path: cReq.url,
          method: cReq.method,
          headers: { ...cReq.headers, host: target.host },
        },
        (pRes) => {
          const resChunks: Buffer[] = [];
          pRes.on("data", (c) => resChunks.push(c as Buffer));
          pRes.on("end", () => {
            const body = Buffer.concat(resChunks);
            cRes.writeHead(pRes.statusCode ?? 200, pRes.headers);
            cRes.end(body);
            try {
              const rec = extractOpenAIUsage(JSON.parse(body.toString("utf8")), { provider: opts.provider, source: opts.source ?? "proxy" });
              if (rec) { opts.onRecord(rec); opts.log?.(`  logged ${rec.model ?? "?"} · ${rec.rawAmount} tok`); }
            } catch {
              opts.log?.(`  (streaming/non-JSON — no usage captured for ${cReq.method} ${cReq.url})`);
            }
          });
        },
      );
      pReq.on("error", (err) => { cRes.writeHead(502); cRes.end(`proxy error: ${err.message}`); });
      pReq.end(Buffer.concat(reqChunks));
    });
  });

  server.listen(opts.port, () => opts.log?.(`vibetracker proxy → ${opts.target} · point your tool at http://localhost:${opts.port}`));
  return { close: () => server.close() };
}
