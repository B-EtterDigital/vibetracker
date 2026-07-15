// `vibetracker init` — onboarding. Auto-connects zero-key sources (local logs, env vars),
// prompts only for BYOK API keys, and routes local LLMs → proxy, subscriptions → add.
// planSetup is pure/tested; runWizard is the interactive shell (injected prompt/log/save).

import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import type { ProviderDescriptor } from "../../adapters/src/index.ts";
import { storeProviderCreds, type VtConfig } from "./config.ts";
import { icon, dim } from "./banner.ts";

const LOG_DIRS: Record<string, string> = {
  "claude-code": join(homedir(), ".claude", "projects"),
  antigravity: join(homedir(), ".antigravity", "sessions"),
  augment: join(homedir(), ".augment", "logs"),
  "roo-code": join(homedir(), ".roo-code", "tasks"),
};

function commandSucceeds(command: string, args: string[]): boolean {
  const r = spawnSync(command, args, { stdio: "ignore", timeout: 5000 });
  return r.status === 0;
}

export function localLogsPresent(id: string): boolean {
  if (id === "higgsfield") return commandSucceeds("higgsfield", ["account", "status", "--json"]);
  const dir = LOG_DIRS[id];
  return dir ? existsSync(dir) : false;
}

export interface SetupPlan {
  autoEnv: string[];      // built + has env creds → connect now
  autoLocal: string[];    // local/log source detected → connect now (no key)
  needsKey: Array<{ id: string; label: string; fields: string[] }>; // prompt for these
  proxy: string[];        // local/OpenAI-compat LLMs → use `proxy`
  manual: string[];       // dev/creative/no-api → use `add`
}

export function setupPlanSurpriseTargets(plan: SetupPlan): string[] {
  const ids = [
    ...plan.autoLocal,
    ...plan.autoEnv,
    ...plan.proxy,
    ...plan.needsKey.map((item) => item.id),
    ...plan.manual,
  ].map((id) => id.toLowerCase());
  const seen = new Set<string>();
  const unique = ids.filter((id) => {
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  const priority = [
    "higgsfield",
    "higgsfield-mcp",
    "claude-code",
    "codex-cli",
    "github-cli",
    "ollama",
    "lmstudio",
    "comfyui",
    "vllm",
    "replicate",
    "falai",
    "runway",
    "luma",
    "leonardo",
    "cynaps3",
    "elevenlabs",
    "suno",
    "udio",
    "qwen",
    "doubao",
    "kimi",
    "mistral",
    "aleph-alpha",
    "lighton",
  ];
  return [
    ...priority.filter((id) => seen.has(id)),
    ...unique.filter((id) => !priority.includes(id)),
  ].slice(0, 18);
}

export function planSetup(opts: {
  providers: ProviderDescriptor[];
  hasEnvCreds: (id: string) => boolean;
  localLogsPresent: (id: string) => boolean;
  credFields: (id: string) => string[];
}): SetupPlan {
  const plan: SetupPlan = { autoEnv: [], autoLocal: [], needsKey: [], proxy: [], manual: [] };
  for (const p of opts.providers) {
    const needsCreds = (opts.credFields(p.id) ?? []).length > 0;
    if (p.status === "built" && needsCreds && opts.hasEnvCreds(p.id)) { plan.autoEnv.push(p.id); continue; }
    if (p.status === "built" && !needsCreds && opts.localLogsPresent(p.id)) { plan.autoLocal.push(p.id); continue; }
    if (p.tier === "local") {
      if (p.id === "comfyui" || opts.localLogsPresent(p.id)) plan.autoLocal.push(p.id);
      else plan.proxy.push(p.id);
      continue;
    }
    if (p.tier === "log") {
      if (opts.localLogsPresent(p.id)) plan.autoLocal.push(p.id);
      continue; // installed only if logs exist
    }
    if (p.tier === "proxy") { plan.proxy.push(p.id); continue; }
    if (p.tier === "manual" || p.status === "manual-only" || p.domain !== "ai") { plan.manual.push(p.id); continue; }
    if (p.status === "built" && needsCreds) { plan.needsKey.push({ id: p.id, label: p.label, fields: opts.credFields(p.id) }); }
  }
  return plan;
}

function clean(o: Record<string, string | undefined>): Record<string, string> {
  const r: Record<string, string> = {};
  for (const [k, v] of Object.entries(o)) if (v) r[k] = v;
  return r;
}

export const FIELD_LABEL: Record<string, string> = {
  adminKey: "Admin key", apiKey: "API key", token: "token", key: "key",
  accessKey: "access key", secretKey: "secret key", sessionCookie: "session cookie", sessionToken: "session token",
};
export const fieldLabel = (f: string): string => FIELD_LABEL[f] ?? f;
export const maskKey = (k: string): string => { const t = k.trim(); return t.length <= 8 ? "••••" : `${t.slice(0, 4)}…${t.slice(-3)}`; };

export const DISCLAIMER = [
  "◈ privacy — keys are stored locally in ~/.vibetracker/config.json (chmod 600) and used",
  "  ONLY to read your usage & spend. Vibe Usage never uploads, logs, or shares your keys;",
  "  only aggregate totals ever leave your machine, and only when you run `vibetracker upload`.",
];

// Where / why / how to obtain each credential — the guidance a bare prompt was missing.
export const GUIDE: Record<string, { cred: string; url?: string; fmt?: string; why?: string; steps?: string[] }> = {
  openai: { cred: "Admin key", url: "https://platform.openai.com/settings/organization/admin-keys", fmt: "sk-admin-…",
    why: "OpenAI's Usage & Costs API is organization-admin-only — a normal sk-… project key returns 401. (OpenAI's rule, not ours.)" },
  anthropic: { cred: "Admin key", url: "https://console.anthropic.com/settings/admin-keys", fmt: "sk-ant-admin…",
    why: "Anthropic's Usage & Cost API also requires an Admin key (Owner/Admin role) — a normal key can't read org spend." },
  openrouter: { cred: "API key", url: "https://openrouter.ai/keys", fmt: "sk-or-…" },
  replicate: { cred: "API token", url: "https://replicate.com/account/api-tokens", fmt: "r8_…" },
  falai: { cred: "ADMIN-scoped API key", url: "https://fal.ai/dashboard/keys", fmt: "key_id:secret",
    why: "fal's usage/billing Platform APIs require scope ADMIN — a normal API-scope key returns 403. If you use a team, pick the team (top-left) before creating the key.",
    steps: [
      "Open https://fal.ai/dashboard/keys (pick your team top-left if applicable)",
      "Add key → scope: ADMIN → name it e.g. vibetracker-usage",
      "Copy the full key_id:secret and paste below — hidden as you type",
    ] },
  elevenlabs: { cred: "API key", url: "https://elevenlabs.io/app/settings/api-keys", fmt: "sk_…" },
  huggingface: { cred: "access token", url: "https://huggingface.co/settings/tokens", fmt: "hf_…" },
  runpod: { cred: "API key", url: "https://www.runpod.io/console/user/settings", fmt: "rpa_…" },
  xai: { cred: "API key", url: "https://console.x.ai", fmt: "xai-…" },
  qwen: { cred: "API key", url: "https://dashscope.console.aliyun.com/apiKey", fmt: "sk-…" },
  doubao: { cred: "API key", url: "https://console.volcengine.com/ark", fmt: "Ark/Volcengine bearer token" },
  kimi: { cred: "API key", url: "https://platform.moonshot.cn/console/api-keys", fmt: "sk-…" },
  mistral: { cred: "API key", url: "https://console.mistral.ai/api-keys", fmt: "key…" },
  perplexity: { cred: "API key", url: "https://www.perplexity.ai/settings/api", fmt: "pplx-…" },
  "aleph-alpha": { cred: "API key", url: "https://app.aleph-alpha.com", fmt: "European provider token" },
  lighton: { cred: "API key", url: "https://platform.lighton.ai", fmt: "LightOn provider token" },
  runway: { cred: "API key", url: "https://dev.runwayml.com", fmt: "key_…" },
  luma: { cred: "API key", url: "https://lumalabs.ai/dream-machine/api/keys" },
  leonardo: { cred: "Production API key", url: "https://app.leonardo.ai/api-access",
    why: "Leonardo's official API key lets VibeTRACKER resolve your user ID, count completed images from the generation feed, and read the API-token balance. API access may be billed separately from the web subscription.",
    steps: [
      "Open Leonardo.ai API Access and create a Production API key",
      "Paste the key below - it is hidden and stored in your OS keyring",
      "Run `vibetracker sync`; no cookie or user ID is needed",
    ] },
  cynaps3: { cred: "OAuth access token", url: "https://cynaps3.app",
    why: "Cynaps3 exposes a first-party, read-only Musicmation usage ledger. The usage:read token can read your operation totals, generated tracks, audio duration, and native credits, but not prompts, lyrics, or media.",
    steps: [
      "Open Cynaps3 and authorize VibeUsage with the usage:read scope",
      "Paste the returned access token below - it is hidden and stored in your OS keyring",
      "Run `vibetracker sync`; no browser cookie or service-role key is accepted",
    ] },
  higgsfield: { cred: "API key", url: "https://higgsfield.ai/account" },
  suno: { cred: "session cookie", url: "https://suno.com",
    why: "Suno has no public usage API, so we read your credit balance/history from your own logged-in browser session. The cookie stays on your machine.",
    steps: [
      "Open https://suno.com and log in",
      "Press F12 → Application → Cookies → https://suno.com",
      "Copy the value of the `__session` cookie (a long token)",
      "Paste it below — it's hidden as you type",
    ] },
  udio: { cred: "session cookie", url: "https://www.udio.com",
    why: "Udio has no public usage API — usage is read from your logged-in session cookie, stored locally.",
    steps: [
      "Open https://www.udio.com and log in",
      "F12 → Application → Cookies → https://www.udio.com",
      "Copy the `sb-…-auth-token` (session) cookie value",
      "Paste it below — hidden as you type",
    ] },
  midjourney: { cred: "no credential", url: "https://docs.midjourney.com/hc/en-us/articles/32084927086861-Info-Command",
    why: "Midjourney does not provide a public usage API and prohibits third-party automation. Import the official /info lifetime total locally instead.",
    steps: [
      "In Discord, run the Midjourney /info command",
      "Copy the Lifetime Usage image count",
      "Run `vibetracker import midjourney --images <count>`",
      "Re-run later with the new total; the previous lifetime snapshot is replaced",
    ] },
};

// Parse a selection like "1,4 openai all" against the catalog of hosted providers.
function selectProviders(sel: string, list: SetupPlan["needsKey"]): SetupPlan["needsKey"] {
  if (!sel.trim()) return [];
  if (/^all$/i.test(sel.trim())) return list;
  const out: SetupPlan["needsKey"] = [];
  for (const tk of sel.split(/[\s,]+/).filter(Boolean)) {
    const n = Number.parseInt(tk, 10);
    const hit = Number.isInteger(n) && n >= 1 && n <= list.length
      ? list[n - 1]
      : list.find((it) => it.id === tk.toLowerCase() || it.label.toLowerCase() === tk.toLowerCase());
    if (hit && !out.includes(hit)) out.push(hit);
  }
  return out;
}

export interface WizardDeps {
  plan: SetupPlan;
  resolveEnv: (id: string) => Record<string, string | undefined>;
  prompt: (q: string) => Promise<string>;
  log: (s: string) => void;
  save: (cfg: VtConfig) => void;
}

export async function runWizard(cfg: VtConfig, deps: WizardDeps): Promise<VtConfig> {
  const { plan } = deps;
  const enabled = new Set(cfg.enabled);
  cfg.creds = cfg.creds ?? {};

  for (const id of plan.autoEnv) {
    storeProviderCreds(cfg, id, clean(deps.resolveEnv(id))); // env keys land in the keyring, not on disk
    enabled.add(id);
    deps.log(`  ${icon(id)} ${id.padEnd(14)} connected (env key)`);
  }
  for (const id of plan.autoLocal) {
    enabled.add(id);
    deps.log(`  ${icon(id)} ${id.padEnd(14)} detected locally`);
  }
  if (!plan.autoEnv.length && !plan.autoLocal.length) deps.log(`  (no local tools or env keys found yet — add one below)`);

  if (plan.needsKey.length) {
    for (const line of DISCLAIMER) deps.log(`  ${dim(line)}`);
    deps.log(`\n  ${dim("hosted providers you can connect (a key/cookie lets us read your spend):")}`);
    plan.needsKey.forEach((it, i) => {
      const cred = GUIDE[it.id]?.cred ?? fieldLabel(it.fields[0]);
      deps.log(`    ${icon(it.id)} ${String(i + 1).padStart(2)}. ${it.label.padEnd(16)} ${dim(cred)}`);
    });
    const sel = await deps.prompt(`\n  connect which?  ${dim("numbers/names comma-separated · 'all' · Enter to skip: ")}`);
    for (const item of selectProviders(sel, plan.needsKey)) {
      const g = GUIDE[item.id];
      const cred = g?.cred ?? fieldLabel(item.fields[0]);
      deps.log(`\n  ${icon(item.id)} ${item.label} ${dim("— " + cred)}`);
      if (g?.why) deps.log(`     ${dim("why:  " + g.why)}`);
      if (g?.url) deps.log(`     get:  ${g.url}`);
      if (g?.fmt) deps.log(`     ${dim("format: " + g.fmt)}`);
      if (g?.steps) g.steps.forEach((s, i) => deps.log(`       ${dim(`${i + 1}) ${s}`)}`));
      const ans = (await deps.prompt(`     paste ${cred} ${dim("(hidden · Enter to skip)")}: `)).trim();
      if (ans) {
        storeProviderCreds(cfg, item.id, { [item.fields[0]]: ans });
        enabled.add(item.id);
        deps.log(`     ✓ ${item.label} connected  ${dim(maskKey(ans))}`);
      } else {
        deps.log(`     ${dim("· skipped")}`);
      }
    }
  }

  cfg.enabled = [...enabled];
  deps.save(cfg);

  if (plan.proxy.length) deps.log(`\n  ${dim(`local LLMs (${plan.proxy.slice(0, 5).join(", ")}…)? capture with  vibetracker proxy --target <url> --provider <id>`)}`);
  deps.log(`  ${dim("subscriptions & dev costs?  vibetracker add <service> --usd <amount>")}`);
  return cfg;
}
