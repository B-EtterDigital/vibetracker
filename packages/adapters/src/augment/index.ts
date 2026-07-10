// Augment Code (VS Code plugin) — log-parse tier. ⚠ VERIFY the extension-log path/shape.
import { homedir } from "node:os";
import { join } from "node:path";
import { createSessionLogAdapter, type ParseEntry } from "../_shared/session-log.ts";

export const parseAugment: ParseEntry = (raw) => {
  let o: any;
  try { o = JSON.parse(raw); } catch { return null; }
  const u = o?.usage ?? o?.tokens;
  if (!u) return null;
  return {
    ts: o.timestamp ?? o.time ?? o.ts ?? "",
    model: o.model,
    inputTokens: u.input ?? u.prompt ?? u.input_tokens,
    outputTokens: u.output ?? u.completion ?? u.output_tokens,
  };
};

export function createAugmentAdapter(opts: { dir?: string; maxFiles?: number } = {}) {
  const dir = opts.dir ?? join(homedir(), ".augment", "logs"); // ⚠ VERIFY
  return createSessionLogAdapter({ id: "augment", dir, parse: parseAugment, maxFiles: opts.maxFiles });
}
