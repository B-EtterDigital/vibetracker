// CLI config + credential resolution.
//
// SECURITY MODEL: config.json (~/.vibetracker/config.json, mode 0600) holds NO secrets — only the
// enabled list, handle, upload url, and preferences. Credentials and the account token live in the
// OS keyring (libsecret). Any legacy plaintext creds in config.json are migrated into the keyring
// on first load and stripped from disk. Where no keyring exists, the chmod-600 file is the graceful
// fallback (kept only then). Credentials are resolved per-provider at point of use, never bulk-dumped.

import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import type { ProviderCreds } from "../../adapters/src/index.ts";
import { keyring } from "./keyring.ts";

export interface VtConfig {
  enabled: string[];
  creds?: Record<string, ProviderCreds>; // in-memory only after migration; never written to disk
  uploadUrl?: string;
  handle?: string;
  bio?: string;     // the viber's own profile bio, shown on the public profile; set with `profile --bio`
  parallelAgents?: number; // self-reported: how many agents run in parallel (data can't reveal this)
  subs?: string;    // self-reported subscription stack, e.g. "2× Claude Max, 1× ChatGPT Pro"
  token?: string;   // C0VIBE session token → attested uploads; stored in the keyring, not on disk
  anonymousTelemetry?: boolean;
}

export const CONFIG_PATH = join(homedir(), ".vibetracker", "config.json");
const ACCOUNT = "_account"; // keyring account for non-provider secrets (the C0VIBE token)

export function loadConfig(): VtConfig {
  if (!existsSync(CONFIG_PATH)) return { enabled: ["claude-code"] }; // works with zero setup
  let cfg: VtConfig;
  try {
    cfg = JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as VtConfig;
  } catch (err) {
    throw new Error(`invalid config at ${CONFIG_PATH}: ${(err as Error).message}`);
  }
  if (!Array.isArray(cfg.enabled)) cfg.enabled = ["claude-code"];
  migrateLegacySecrets(cfg);
  // Hydrate the account token from the keyring so upload/attest paths keep using cfg.token.
  const kr = keyring();
  if (kr.available() && !cfg.token) {
    const tok = kr.get(ACCOUNT, "token");
    if (tok) cfg.token = tok;
  }
  return cfg;
}

// Move any plaintext creds/token from config.json into the keyring, once, loudly, then strip disk.
// Skipped entirely when no keyring is available, so a fallback deployment never loses its creds.
function migrateLegacySecrets(cfg: VtConfig): void {
  const kr = keyring();
  if (!kr.available()) return;
  let moved = 0;
  if (cfg.creds) {
    for (const [provider, fields] of Object.entries(cfg.creds)) {
      for (const [field, value] of Object.entries(fields ?? {})) {
        if (value) { kr.set(provider, field, String(value)); moved++; }
      }
    }
  }
  if (cfg.token) { kr.set(ACCOUNT, "token", cfg.token); moved++; }
  if (moved > 0) {
    delete cfg.creds; // re-read per-provider from the keyring via resolveCreds
    saveConfig(cfg);  // strips secrets from disk (keyring is available here)
    process.stderr.write(`vibetracker: moved ${moved} credential${moved === 1 ? "" : "s"} from ${CONFIG_PATH} into the OS keyring — no plaintext keys remain on disk.\n`);
  }
}

export function saveConfig(cfg: VtConfig): void {
  mkdirSync(dirname(CONFIG_PATH), { recursive: true });
  const kr = keyring();
  // With a keyring, config.json is secret-free by construction. Without one, fall back to the
  // legacy chmod-600 file so a keyring-less system still works (the only place plaintext may live).
  const onDisk: VtConfig = kr.available() ? stripSecrets(cfg) : cfg;
  writeFileSync(CONFIG_PATH, JSON.stringify(onDisk, null, 2), { encoding: "utf8", mode: 0o600 });
}

function stripSecrets(cfg: VtConfig): VtConfig {
  const { creds: _creds, token: _token, ...safe } = cfg;
  return safe as VtConfig;
}

/** Persist a provider's credentials to the keyring (preferred) or leave them in cfg for the
 *  legacy file fallback. Returns true when they were stored in the keyring. */
export function storeProviderCreds(cfg: VtConfig, provider: string, creds: Record<string, string>): boolean {
  const kr = keyring();
  cfg.creds = cfg.creds ?? {};
  cfg.creds[provider] = { ...(cfg.creds[provider] ?? {}), ...creds } as ProviderCreds;
  if (!kr.available()) return false;
  for (const [field, value] of Object.entries(creds)) if (value) kr.set(provider, field, value);
  return true;
}

/** Remove a provider's credentials from the keyring and in-memory config. */
export function clearProviderCreds(cfg: VtConfig, provider: string): void {
  const kr = keyring();
  if (kr.available()) {
    for (const field of [...(CRED_FIELDS[provider] ?? []), "token"]) kr.clear(provider, field);
  }
  if (cfg.creds) delete cfg.creds[provider];
}

/** Store / clear the C0VIBE account token in the keyring. */
export function storeToken(cfg: VtConfig, token: string): void {
  cfg.token = token;
  const kr = keyring();
  if (kr.available()) kr.set(ACCOUNT, "token", token);
}
export function clearToken(cfg: VtConfig): void {
  delete cfg.token;
  const kr = keyring();
  if (kr.available()) kr.clear(ACCOUNT, "token");
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
  leonardo:   (e) => ({ apiKey: e.VT_LEONARDO_API_KEY }),
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
  replicate: ["token"], falai: ["key"], runway: ["apiKey"], luma: ["apiKey"], leonardo: ["apiKey"],
  kling: ["accessKey", "secretKey"], suno: ["sessionCookie"], udio: ["sessionToken"],
  openrouter: ["apiKey"], comfyui: [], "claude-code": [], higgsfield: [],
  huggingface: ["apiKey"], runpod: ["apiKey"], browserbase: ["apiKey"], devin: ["apiKey"],
  xai: ["apiKey"], zai: ["apiKey"], glm: ["apiKey"], "adobe-firefly": ["apiKey"],
  qwen: ["apiKey"], doubao: ["apiKey"], kimi: ["apiKey"], mistral: ["apiKey"],
  perplexity: ["apiKey"], "aleph-alpha": ["apiKey"], lighton: ["apiKey"],
  antigravity: [], augment: [], "roo-code": [],
};

/** Resolve a provider's creds at point of use. Precedence: keyring > env vars > legacy config file
 *  (the last only lingers on keyring-less systems). Undefined/empty fields are dropped. */
export function resolveCreds(id: string, cfg?: VtConfig): ProviderCreds {
  const kr = keyring();
  const fromKeyring: Record<string, string> = {};
  if (kr.available()) {
    for (const field of [...(CRED_FIELDS[id] ?? []), "token"]) {
      const v = kr.get(id, field);
      if (v) fromKeyring[field] = v;
    }
  }
  const fromEnv = ENV_MAP[id] ? ENV_MAP[id](process.env) : {};
  const fromLegacy = cfg?.creds?.[id] ?? {};
  const merged: Record<string, string> = {};
  for (const src of [fromLegacy, fromEnv, fromKeyring]) {
    for (const [k, v] of Object.entries(src)) if (v != null && v !== "") merged[k] = v as string;
  }
  return merged as ProviderCreds;
}
