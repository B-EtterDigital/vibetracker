// Antigravity (Google agentic IDE) — log-parse tier. ⚠ VERIFY the session-log path/shape.
import { homedir } from "node:os";
import { join } from "node:path";
import { createSessionLogAdapter, type ParseEntry } from "../_shared/session-log.ts";

export const parseAntigravity: ParseEntry = (raw) => {
  let o: any;
  try { o = JSON.parse(raw); } catch { return null; }
  const u = o?.usage ?? o?.tokenUsage;
  if (!u) return null;
  return {
    ts: o.timestamp ?? o.ts ?? o.createdAt ?? "",
    model: o.model ?? o.modelId,
    inputTokens: u.input_tokens ?? u.inputTokens ?? u.prompt_tokens,
    outputTokens: u.output_tokens ?? u.outputTokens ?? u.completion_tokens,
    cacheTokens: u.cache_read_input_tokens ?? u.cachedTokens,
  };
};

export function createAntigravityAdapter(opts: { dir?: string; maxFiles?: number } = {}) {
  const dir = opts.dir ?? join(homedir(), ".antigravity", "sessions"); // ⚠ VERIFY
  return createSessionLogAdapter({ id: "antigravity", dir, parse: parseAntigravity, maxFiles: opts.maxFiles });
}
