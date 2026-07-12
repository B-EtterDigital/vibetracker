// Provider brand-logo resolver.
//
// The known-asset set below is exactly the list of SVGs actually fetched into
// packages/web/public/provider-logos/ from Simple Icons (bone #eef7f4, monochrome
// original brand glyphs). It is hardcoded — no filesystem access at runtime — so
// resolution is deterministic in every rendering environment (server, edge, client).
// Providers absent here fall back to the 2-letter gradient monogram (provider-brand.ts).
//
// Resolved 2026-07-12 against cdn.simpleicons.org (each returned a real <svg>):
//   anthropic, claude, claude-code, deepseek, elevenlabs, gemini, gemini-cli,
//   grok, huggingface, lmstudio, mistral, ollama, openrouter, perplexity, qwen,
//   replicate, suno, xai
// Fell back (no icon on Simple Icons — genuine 404): openai, codex, codex-cli,
//   adobe-firefly, runway, higgsfield, comfyui, runpod, fal, falai, plus the
//   never-sourced kling, udio, luma, browserbase, devin, openclaw, hermes,
//   opencode, viberank-history.
const LOGO_IDS: ReadonlySet<string> = new Set([
  "anthropic",
  "claude",
  "claude-code",
  "deepseek",
  "elevenlabs",
  "gemini",
  "gemini-cli",
  "grok",
  "huggingface",
  "lmstudio",
  "mistral",
  "ollama",
  "openrouter",
  "perplexity",
  "qwen",
  "replicate",
  "suno",
  "xai",
]);

/** True when a real brand logo asset exists for this provider id. */
export function hasLogo(id: string): boolean {
  return LOGO_IDS.has(id.toLowerCase());
}

/**
 * Public path to the provider's brand logo, or null when none exists (caller
 * then renders the 2-letter monogram fallback). Never returns a path without a
 * matching file on disk — the set is the fetched-asset manifest.
 */
export function logoPath(id: string): string | null {
  const key = id.toLowerCase();
  return LOGO_IDS.has(key) ? `/provider-logos/${key}.svg` : null;
}

/** Sorted list of provider ids that have a brand logo asset (for coverage checks). */
export const PROVIDER_LOGO_IDS: readonly string[] = [...LOGO_IDS].sort();
