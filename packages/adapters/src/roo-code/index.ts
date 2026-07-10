// Roo Code (VS Code plugin, BYOK) — log-parse tier. Roo records per-message token counts
// AND a computed cost, so usdEst is available. ⚠ VERIFY the task-history path/shape.
import { homedir } from "node:os";
import { join } from "node:path";
import { createSessionLogAdapter, type ParseEntry } from "../_shared/session-log.ts";

export const parseRooCode: ParseEntry = (raw) => {
  let o: any;
  try { o = JSON.parse(raw); } catch { return null; }
  const inTok = o.tokensIn ?? o.tokens_in ?? o.usage?.input_tokens;
  const outTok = o.tokensOut ?? o.tokens_out ?? o.usage?.output_tokens;
  if (inTok == null && outTok == null) return null;
  const ts = typeof o.ts === "number" ? new Date(o.ts).toISOString() : (o.timestamp ?? o.ts ?? "");
  return {
    ts,
    model: o.model ?? o.apiModelId,
    inputTokens: inTok,
    outputTokens: outTok,
    cacheTokens: (o.cacheReads ?? 0) + (o.cacheWrites ?? 0),
    usd: o.cost ?? o.totalCost,
  };
};

export function createRooCodeAdapter(opts: { dir?: string; maxFiles?: number } = {}) {
  const dir = opts.dir ?? join(homedir(), ".roo-code", "tasks"); // ⚠ VERIFY
  return createSessionLogAdapter({ id: "roo-code", dir, parse: parseRooCode, maxFiles: opts.maxFiles });
}
