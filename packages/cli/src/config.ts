// CLI config + credential resolution. Config lives at ~/.vibetracker/config.json (mode
// 0600). Credentials may come from the config file OR env vars (VT_*). OS-keychain
// storage is the planned upgrade; for now the file is chmod-600 and git-ignored.

import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import type { ProviderCreds } from "../../adapters/src/index.ts";

export interface VtConfig {
  enabled: string[];
  creds?: Record<string, ProviderCreds>;
  uploadUrl?: string;
  handle?: string;
  token?: string;   // C0VIBE session token from `vibetracker login` → attested uploads
  anonymousTelemetry?: boolean;
}

export const CONFIG_PATH = join(homedir(), ".vibetracker", "config.json");

export function loadConfig(): VtConfig {
  if (!existsSync(CONFIG_PATH)) return { enabled: ["claude-code"] }; // works with zero setup
  try {
    const cfg = JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as VtConfig;
    if (!Array.isArray(cfg.enabled)) cfg.enabled = ["claude-code"];
    return cfg;
  } catch (err) {
    throw new Error(`invalid config at ${CONFIG_PATH}: ${(err as Error).message}`);
  }
}

export function saveConfig(cfg: VtConfig): void {
  mkdirSync(dirname(CONFIG_PATH), { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), { encoding: "utf8", mode: 0o600 });
}

// Provider → env var mapping. Read-only keys/tokens preferred.
const ENV_MAP: Record<string, (e: Record<string, string | undefined>) => ProviderCreds> = {
  openai:     (e) => ({ adminKey: e.VT_OPENAI_ADMIN_KEY }),
  anthropic:  (e) => ({ adminKey: e.VT_ANTHROPIC_ADMIN_KEY }),
  elevenlabs: (e) => ({ apiKey: e.VT_ELEVENLABS_API_KEY }),
  replicate:  (e) => ({ token: e.VT_REPLICATE_TOKEN }),
  falai:      (e) => ({ key: e.VT_FAL_KEY }),
  runway:     (e) => ({ apiKey: e.VT_RUNWAY_API_KEY }),
  luma:       (e) => ({ apiKey: e.VT_LUMA_API_KEY }),
  kling:      (e) => ({ accessKey: e.VT_KLING_ACCESS_KEY, secretKey: e.VT_KLING_SECRET_KEY }),
  suno:       (e) => ({ sessionCookie: e.VT_SUNO_COOKIE }),
  udio:       (e) => ({ sessionToken: e.VT_UDIO_TOKEN }),
  openrouter: (e) => ({ apiKey: e.VT_OPENROUTER_API_KEY }),
  huggingface:(e) => ({ apiKey: e.VT_HF_API_KEY }),
  runpod:     (e) => ({ apiKey: e.VT_RUNPOD_API_KEY }),
  browserbase:(e) => ({ apiKey: e.VT_BROWSERBASE_API_KEY }),
  devin:      (e) => ({ apiKey: e.VT_DEVIN_API_KEY }),
  xai:        (e) => ({ apiKey: e.VT_XAI_API_KEY }),
  zai:        (e) => ({ apiKey: e.VT_ZAI_API_KEY }),
  glm:        (e) => ({ apiKey: e.VT_GLM_API_KEY }),
  qwen:       (e) => ({ apiKey: e.VT_QWEN_API_KEY }),
  doubao:     (e) => ({ apiKey: e.VT_DOUBAO_API_KEY }),
  kimi:       (e) => ({ apiKey: e.VT_KIMI_API_KEY }),
  mistral:    (e) => ({ apiKey: e.VT_MISTRAL_API_KEY }),
  perplexity: (e) => ({ apiKey: e.VT_PERPLEXITY_API_KEY }),
  "aleph-alpha": (e) => ({ apiKey: e.VT_ALEPH_ALPHA_API_KEY }),
  lighton:    (e) => ({ apiKey: e.VT_LIGHTON_API_KEY }),
  "adobe-firefly": (e) => ({ apiKey: e.VT_ADOBE_FIREFLY_API_KEY, token: e.VT_ADOBE_FIREFLY_TOKEN }),
};

// Cred fields each provider expects — used by `connect` and to report what's missing.
export const CRED_FIELDS: Record<string, string[]> = {
  openai: ["adminKey"], anthropic: ["adminKey"], elevenlabs: ["apiKey"],
  replicate: ["token"], falai: ["key"], runway: ["apiKey"], luma: ["apiKey"],
  kling: ["accessKey", "secretKey"], suno: ["sessionCookie"], udio: ["sessionToken"],
  openrouter: ["apiKey"], comfyui: [], "claude-code": [], higgsfield: [],
  huggingface: ["apiKey"], runpod: ["apiKey"], browserbase: ["apiKey"], devin: ["apiKey"],
  xai: ["apiKey"], zai: ["apiKey"], glm: ["apiKey"], "adobe-firefly": ["apiKey"],
  qwen: ["apiKey"], doubao: ["apiKey"], kimi: ["apiKey"], mistral: ["apiKey"],
  perplexity: ["apiKey"], "aleph-alpha": ["apiKey"], lighton: ["apiKey"],
  antigravity: [], augment: [], "roo-code": [],
};

/** Merge creds: config file first, env vars fill any gaps. Undefined fields dropped. */
export function resolveCreds(id: string, cfg?: VtConfig): ProviderCreds {
  const fromEnv = ENV_MAP[id] ? ENV_MAP[id](process.env) : {};
  const fromCfg = cfg?.creds?.[id] ?? {};
  const merged: Record<string, string> = {};
  for (const src of [fromEnv, fromCfg]) {
    for (const [k, v] of Object.entries(src)) if (v != null && v !== "") merged[k] = v as string;
  }
  return merged as ProviderCreds;
}
