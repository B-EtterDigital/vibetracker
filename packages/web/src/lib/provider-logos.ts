// Provider brand-logo resolver.
//
// The map below is exactly the set of logo assets in packages/web/public/provider-logos/.
// It is hardcoded — no filesystem access at runtime — so resolution is deterministic in every
// rendering environment (server, edge, client). Providers absent here fall back to the 2-letter
// gradient monogram (provider-brand.ts).
//
// Two asset kinds:
//   .svg — monochrome brand glyphs recoloured bone #eef7f4 (Simple Icons / svgrepo / svgl).
//   .png — brand apple-touch-icons in their original colour, for brands with no public SVG
//          (Higgsfield, fal.ai, OpenClaw). An <img> renders either kind identically.
const LOGO_FILES: Readonly<Record<string, string>> = {
  anthropic: "anthropic.svg",
  claude: "claude.svg",
  "claude-code": "claude-code.svg",
  codex: "codex.svg",
  "codex-cli": "codex-cli.svg",
  deepseek: "deepseek.svg",
  elevenlabs: "elevenlabs.svg",
  gemini: "gemini.svg",
  "gemini-cli": "gemini-cli.svg",
  grok: "grok.svg",
  huggingface: "huggingface.svg",
  lmstudio: "lmstudio.svg",
  mistral: "mistral.svg",
  ollama: "ollama.svg",
  openai: "openai.svg",
  openrouter: "openrouter.svg",
  perplexity: "perplexity.svg",
  qwen: "qwen.svg",
  replicate: "replicate.svg",
  runway: "runway.svg",
  suno: "suno.svg",
  xai: "xai.svg",
  higgsfield: "higgsfield.png",
  falai: "falai.png",
  fal: "fal.png",
  openclaw: "openclaw.png",
  midjourney: "midjourney.png",
  udio: "udio.png",
  leonardo: "leonardo.png",
  seaart: "seaart.png",
  tensorart: "tensorart.png",
  pixverse: "pixverse.png",
  vidu: "vidu.png",
  cynaps3: "cynaps3.png",
  browserbase: "browserbase.png",
};

/** True when a real brand logo asset exists for this provider id. */
export function hasLogo(id: string): boolean {
  return id.toLowerCase() in LOGO_FILES;
}

/**
 * Public path to the provider's brand logo, or null when none exists (caller then renders the
 * 2-letter monogram fallback). Never returns a path without a matching file on disk — the map
 * is the fetched-asset manifest.
 */
export function logoPath(id: string): string | null {
  const key = id.toLowerCase();
  return key in LOGO_FILES ? `/provider-logos/${LOGO_FILES[key]}` : null;
}

/** Sorted list of provider ids that have a brand logo asset (for coverage checks). */
export const PROVIDER_LOGO_IDS: readonly string[] = Object.keys(LOGO_FILES).sort();

/** The manifest's id -> filename map (coverage checks assert it matches disk). */
export const PROVIDER_LOGO_FILES: Readonly<Record<string, string>> = LOGO_FILES;
