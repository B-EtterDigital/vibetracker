// Coverage ledger — every service VibeTRACKER tracks or plans to, across three domains:
//   ai       — metered AI usage (per-op/token/credit)
//   dev      — dev/infra costs (hosting, CI, GPU, databases)
//   creative — flat creative subscriptions (mostly manual entry)
// `status`: built = adapter exists; planned = mapped; manual-only / untrackable as noted.
// `verified` = a built adapter's endpoints are confirmed. Source of truth for coverage.

import type { Category } from "../../core/src/schema/record.js";
import type { AuthKind } from "../../core/src/adapter.js";

export type Tier = "ledger" | "balance" | "log" | "feed_recon" | "proxy" | "local" | "manual";
export type Status = "built" | "planned" | "manual-only" | "untrackable";
export type Domain = "ai" | "dev" | "creative";

export interface ProviderDescriptor {
  id: string;
  label: string;
  domain: Domain;
  categories: Category[];
  tier: Tier;
  auth: AuthKind;
  status: Status;
  verified: boolean;
  method: string;
}

const ai = (o: Omit<ProviderDescriptor, "domain">): ProviderDescriptor => ({ domain: "ai", ...o });
const dev = (o: Omit<ProviderDescriptor, "domain">): ProviderDescriptor => ({ domain: "dev", ...o });
const creative = (o: Omit<ProviderDescriptor, "domain">): ProviderDescriptor => ({ domain: "creative", ...o });

export const PROVIDERS: ProviderDescriptor[] = [
  // ===== AI — BUILT =====
  ai({ id: "higgsfield", label: "Higgsfield", categories: ["image", "video", "audio", "3d"], tier: "ledger", auth: "mcp", status: "built", verified: true, method: "MCP transactions/balance (live)" }),
  ai({ id: "claude-code", label: "Claude Code", categories: ["coding", "llm"], tier: "log", auth: "localLogs", status: "built", verified: true, method: "~/.claude/**/*.jsonl (live)" }),
  ai({ id: "replicate", label: "Replicate", categories: ["video", "image", "audio", "llm"], tier: "ledger", auth: "apiKey", status: "built", verified: true, method: "/v1/predictions, per-GPU-sec" }),
  ai({ id: "falai", label: "fal.ai", categories: ["image", "video", "audio", "3d", "llm"], tier: "ledger", auth: "apiKey", status: "built", verified: true, method: "/v1/models/usage (USD)" }),
  ai({ id: "runway", label: "Runway", categories: ["video", "image", "audio", "llm"], tier: "ledger", auth: "apiKey", status: "built", verified: true, method: "/v1/organization/usage" }),
  ai({ id: "openai", label: "OpenAI", categories: ["llm", "image", "audio"], tier: "ledger", auth: "apiKey", status: "built", verified: false, method: "Costs API (admin) ⚠" }),
  ai({ id: "anthropic", label: "Anthropic API", categories: ["llm"], tier: "ledger", auth: "apiKey", status: "built", verified: false, method: "Cost Report Admin API ⚠" }),
  ai({ id: "elevenlabs", label: "ElevenLabs", categories: ["audio"], tier: "ledger", auth: "apiKey", status: "built", verified: false, method: "character-stats ⚠" }),
  ai({ id: "luma", label: "Luma", categories: ["video", "image"], tier: "feed_recon", auth: "apiKey", status: "built", verified: false, method: "generations feed ⚠" }),
  ai({ id: "kling", label: "Kling", categories: ["video"], tier: "feed_recon", auth: "apiKey", status: "built", verified: false, method: "task list (JWT) ⚠" }),
  ai({ id: "suno", label: "Suno", categories: ["music"], tier: "feed_recon", auth: "cookie", status: "built", verified: false, method: "clip feed × credits ⚠" }),
  ai({ id: "udio", label: "Udio", categories: ["music"], tier: "feed_recon", auth: "cookie", status: "built", verified: false, method: "feed × credits ⚠" }),
  ai({ id: "openrouter", label: "OpenRouter", categories: ["llm"], tier: "balance", auth: "apiKey", status: "built", verified: false, method: "/api/v1/credits (BYOK) ⚠" }),
  ai({ id: "comfyui", label: "ComfyUI", categories: ["image", "video"], tier: "local", auth: "localLogs", status: "built", verified: false, method: "local /history; $0 (GPU-time)" }),

  // ===== AI — PLANNED (BYOK LLM / OpenAI-compatible → proxy or usage API) =====
  ai({ id: "xai", label: "x.ai (Grok)", categories: ["llm"], tier: "ledger", auth: "apiKey", status: "built", verified: false, method: "usage API ⚠ (+ proxy live)" }),
  ai({ id: "zai", label: "z.ai", categories: ["llm"], tier: "ledger", auth: "apiKey", status: "built", verified: false, method: "usage API ⚠ (+ proxy live)" }),
  ai({ id: "glm", label: "GLM / Zhipu", categories: ["llm"], tier: "ledger", auth: "apiKey", status: "built", verified: false, method: "BigModel usage ⚠ (+ proxy live)" }),
  ai({ id: "gemini", label: "Google Gemini", categories: ["llm", "image", "video"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "Google AI / Cloud billing" }),
  ai({ id: "groq", label: "Groq", categories: ["llm"], tier: "proxy", auth: "apiKey", status: "planned", verified: false, method: "proxy (OpenAI-compat)" }),
  ai({ id: "together", label: "Together AI", categories: ["llm", "image"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "usage/billing" }),
  ai({ id: "deepseek", label: "DeepSeek", categories: ["llm"], tier: "balance", auth: "apiKey", status: "planned", verified: false, method: "balance API" }),
  ai({ id: "mistral", label: "Mistral", categories: ["llm"], tier: "ledger", auth: "apiKey", status: "built", verified: false, method: "usage API ⚠ (+ proxy/manual import)" }),
  ai({ id: "perplexity", label: "Perplexity", categories: ["llm"], tier: "balance", auth: "apiKey", status: "built", verified: false, method: "usage/balance API ⚠ (+ manual subscription)" }),
  ai({ id: "poe", label: "Poe", categories: ["llm", "image"], tier: "manual", auth: "none", status: "manual-only", verified: false, method: "manual credits/subscription import; no stable public usage API" }),
  ai({ id: "cohere", label: "Cohere", categories: ["llm"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "billing" }),
  ai({ id: "fireworks", label: "Fireworks", categories: ["llm", "image"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "usage" }),
  ai({ id: "hermes", label: "Hermes (Nous)", categories: ["llm"], tier: "proxy", auth: "apiKey", status: "planned", verified: false, method: "proxy (OpenAI-compat) ⚠" }),
  ai({ id: "openclaw", label: "OpenClaw", categories: ["coding", "llm"], tier: "log", auth: "localLogs", status: "planned", verified: false, method: "local logs ⚠ verify" }),
  ai({ id: "qwen", label: "Qwen / DashScope", categories: ["llm", "image", "audio"], tier: "ledger", auth: "apiKey", status: "built", verified: false, method: "DashScope billing usage ⚠ (+ proxy/manual import)" }),
  ai({ id: "doubao", label: "Doubao / Volcengine Ark", categories: ["llm", "image", "video", "audio"], tier: "ledger", auth: "apiKey", status: "built", verified: false, method: "Volcengine Ark usage ⚠ (+ proxy/manual import)" }),
  ai({ id: "kimi", label: "Kimi / Moonshot AI", categories: ["llm"], tier: "ledger", auth: "apiKey", status: "built", verified: false, method: "Moonshot usage/billing ⚠ (+ proxy/manual import)" }),
  ai({ id: "baidu-wenxin", label: "Baidu Wenxin / ERNIE", categories: ["llm", "image"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "Baidu Qianfan billing" }),
  ai({ id: "tencent-hunyuan", label: "Tencent Hunyuan", categories: ["llm", "image", "video"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "Tencent Cloud usage" }),
  ai({ id: "iflytek-spark", label: "iFlytek SparkDesk", categories: ["llm", "audio"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "SparkDesk usage/billing" }),
  ai({ id: "zhipu", label: "Zhipu BigModel", categories: ["llm", "image"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "BigModel usage/billing" }),
  ai({ id: "baichuan", label: "Baichuan AI", categories: ["llm"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "usage/billing" }),
  ai({ id: "01ai", label: "01.AI Yi", categories: ["llm"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "usage/billing" }),
  ai({ id: "stepfun", label: "StepFun", categories: ["llm", "image"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "usage/billing" }),
  ai({ id: "siliconflow", label: "SiliconFlow", categories: ["llm", "image", "audio"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "billing / model usage" }),
  ai({ id: "modelscope", label: "ModelScope", categories: ["llm", "image", "video", "audio"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "Alibaba ModelScope usage" }),
  ai({ id: "aleph-alpha", label: "Aleph Alpha", categories: ["llm"], tier: "ledger", auth: "apiKey", status: "built", verified: false, method: "European usage API ⚠ (+ manual import)" }),
  ai({ id: "lighton", label: "LightOn", categories: ["llm"], tier: "ledger", auth: "apiKey", status: "built", verified: false, method: "European usage API ⚠ (+ manual import)" }),
  ai({ id: "poolside", label: "Poolside", categories: ["coding", "llm"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "enterprise usage" }),
  ai({ id: "ai21", label: "AI21 Labs", categories: ["llm"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "usage/billing" }),
  ai({ id: "reka", label: "Reka AI", categories: ["llm", "image"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "usage/billing" }),
  ai({ id: "sarvam", label: "Sarvam AI", categories: ["llm", "audio"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "usage/billing" }),
  ai({ id: "upstage", label: "Upstage", categories: ["llm"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "usage/billing" }),
  ai({ id: "naver-hyperclova", label: "NAVER HyperCLOVA X", categories: ["llm"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "Naver Cloud usage" }),
  ai({ id: "sakana", label: "Sakana AI", categories: ["llm"], tier: "manual", auth: "none", status: "planned", verified: false, method: "manual until public billing API" }),

  // ===== AI — PLANNED (media / audio) =====
  ai({ id: "sunoapi", label: "sunoapi.org", categories: ["music"], tier: "balance", auth: "apiKey", status: "built", verified: true, method: "/api/v1/generate/credit balance (USD via creditUsd)" }),
  ai({ id: "stability", label: "Stability AI", categories: ["image", "video"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "balance/credits" }),
  ai({ id: "ideogram", label: "Ideogram", categories: ["image"], tier: "feed_recon", auth: "apiKey", status: "planned", verified: false, method: "feed" }),
  ai({ id: "leonardo", label: "Leonardo.ai", categories: ["image"], tier: "feed_recon", auth: "apiKey", status: "built", verified: false, method: "official generation feed + API token balance" }),
  ai({ id: "recraft", label: "Recraft", categories: ["image"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "usage" }),
  ai({ id: "pika", label: "Pika", categories: ["video"], tier: "feed_recon", auth: "apiKey", status: "planned", verified: false, method: "feed" }),
  ai({ id: "minimax", label: "Hailuo / MiniMax", categories: ["video", "audio"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "billing" }),
  ai({ id: "deepgram", label: "Deepgram", categories: ["audio"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "usage" }),
  ai({ id: "assemblyai", label: "AssemblyAI", categories: ["audio"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "usage" }),
  ai({ id: "adobe-firefly", label: "Adobe Firefly / Photoshop gen", categories: ["image"], tier: "ledger", auth: "apiKey", status: "built", verified: false, method: "Firefly generative credits ⚠" }),
  ai({ id: "black-forest-labs", label: "Black Forest Labs / FLUX", categories: ["image"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "direct API billing; also via Replicate/fal" }),
  ai({ id: "krea", label: "Krea", categories: ["image", "video"], tier: "manual", auth: "none", status: "planned", verified: false, method: "manual subscription / feed until API" }),
  ai({ id: "freepik", label: "Freepik AI", categories: ["image", "video"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "API usage / subscription" }),
  ai({ id: "clipdrop", label: "Clipdrop", categories: ["image"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "Stability/Clipdrop API credits" }),
  ai({ id: "getimg", label: "getimg.ai", categories: ["image"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "API credits" }),
  ai({ id: "playground", label: "Playground AI", categories: ["image"], tier: "manual", auth: "none", status: "planned", verified: false, method: "manual subscription/feed" }),
  ai({ id: "seaart", label: "SeaArt", categories: ["image", "video"], tier: "feed_recon", auth: "cookie", status: "planned", verified: false, method: "feed × credits ⚠" }),
  ai({ id: "tensorart", label: "Tensor.Art", categories: ["image", "video"], tier: "feed_recon", auth: "cookie", status: "planned", verified: false, method: "feed × credits ⚠" }),
  ai({ id: "civitai", label: "Civitai", categories: ["image", "video"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "creator/generation credits" }),
  ai({ id: "scenario", label: "Scenario", categories: ["image", "3d"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "API usage" }),
  ai({ id: "astria", label: "Astria", categories: ["image"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "API usage" }),
  ai({ id: "magnific", label: "Magnific", categories: ["image"], tier: "manual", auth: "none", status: "planned", verified: false, method: "manual subscription/upscale count" }),
  ai({ id: "topaz", label: "Topaz Labs AI", categories: ["image", "video"], tier: "manual", auth: "none", status: "planned", verified: false, method: "manual desktop subscription/local exports" }),
  ai({ id: "pixverse", label: "PixVerse", categories: ["video"], tier: "feed_recon", auth: "cookie", status: "planned", verified: false, method: "feed × credits ⚠" }),
  ai({ id: "vidu", label: "Vidu", categories: ["video"], tier: "feed_recon", auth: "cookie", status: "planned", verified: false, method: "feed × credits ⚠" }),
  ai({ id: "haiper", label: "Haiper", categories: ["video"], tier: "feed_recon", auth: "cookie", status: "planned", verified: false, method: "feed × credits ⚠" }),
  ai({ id: "wan", label: "Wan / Alibaba video", categories: ["video"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "DashScope video usage" }),
  ai({ id: "veo", label: "Google Veo / Flow", categories: ["video"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "Google billing / Vertex usage" }),
  ai({ id: "sora", label: "OpenAI Sora", categories: ["video"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "OpenAI org usage when exposed" }),
  ai({ id: "dreamina", label: "Dreamina / CapCut AI", categories: ["image", "video"], tier: "manual", auth: "none", status: "planned", verified: false, method: "manual subscription / export evidence" }),
  ai({ id: "heygen", label: "HeyGen", categories: ["video", "audio"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "API credits / avatar minutes" }),
  ai({ id: "synthesia", label: "Synthesia", categories: ["video", "audio"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "video minutes / seats" }),
  ai({ id: "did", label: "D-ID", categories: ["video", "audio"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "API credits / generated minutes" }),
  ai({ id: "descript", label: "Descript", categories: ["audio", "video"], tier: "manual", auth: "none", status: "planned", verified: false, method: "manual subscription / export evidence" }),
  ai({ id: "playht", label: "PlayHT", categories: ["audio"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "voice characters / minutes" }),
  ai({ id: "murf", label: "Murf AI", categories: ["audio"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "voice minutes / subscription" }),
  ai({ id: "resemble", label: "Resemble AI", categories: ["audio"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "voice seconds / API billing" }),
  ai({ id: "cartesia", label: "Cartesia", categories: ["audio", "llm"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "voice/API usage" }),
  ai({ id: "fish-audio", label: "Fish Audio", categories: ["audio"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "voice/API credits" }),
  ai({ id: "speechify", label: "Speechify", categories: ["audio"], tier: "manual", auth: "none", status: "planned", verified: false, method: "manual subscription / audio export evidence" }),
  ai({ id: "meshy", label: "Meshy", categories: ["3d", "image"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "API credits / 3D generations" }),
  ai({ id: "tripo", label: "Tripo AI", categories: ["3d", "image"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "API credits / 3D generations" }),
  ai({ id: "kaedim", label: "Kaedim", categories: ["3d"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "model generation credits" }),
  ai({ id: "spline-ai", label: "Spline AI", categories: ["3d", "image"], tier: "manual", auth: "none", status: "planned", verified: false, method: "manual subscription / project evidence" }),

  // ===== AI — PLANNED (infra-as-agent / GPU) =====
  ai({ id: "huggingface", label: "Hugging Face", categories: ["llm", "image", "other"], tier: "ledger", auth: "apiKey", status: "built", verified: false, method: "Inference + billing ⚠" }),
  ai({ id: "runpod", label: "RunPod", categories: ["other"], tier: "ledger", auth: "apiKey", status: "built", verified: false, method: "GraphQL billing / pod-sec ⚠" }),
  ai({ id: "browserbase", label: "Browserbase", categories: ["other"], tier: "ledger", auth: "apiKey", status: "built", verified: false, method: "sessions/usage ⚠" }),
  ai({ id: "devin", label: "Devin (Cognition)", categories: ["coding"], tier: "ledger", auth: "apiKey", status: "built", verified: false, method: "ACU consumption ⚠" }),

  // ===== AI — PLANNED (coding agents / CLIs — log-parse) =====
  ai({ id: "cursor", label: "Cursor", categories: ["coding"], tier: "log", auth: "apiKey", status: "planned", verified: false, method: "Admin usage API or logs" }),
  ai({ id: "antigravity", label: "Antigravity", categories: ["coding"], tier: "log", auth: "localLogs", status: "built", verified: false, method: "local session logs ⚠ verify path" }),
  ai({ id: "opencode", label: "OpenCode", categories: ["coding"], tier: "log", auth: "localLogs", status: "planned", verified: false, method: "local session store ⚠" }),
  ai({ id: "gemini-cli", label: "Gemini CLI", categories: ["coding"], tier: "log", auth: "localLogs", status: "planned", verified: false, method: "local logs" }),
  ai({ id: "codex", label: "Codex", categories: ["coding", "llm"], tier: "log", auth: "localLogs", status: "built", verified: false, method: "~/.codex/sessions/**/*.jsonl (live)" }),
  ai({ id: "codex-cli", label: "Codex CLI", categories: ["coding"], tier: "log", auth: "localLogs", status: "planned", verified: false, method: "local logs" }),
  ai({ id: "copilot", label: "GitHub Copilot", categories: ["coding"], tier: "log", auth: "apiKey", status: "planned", verified: false, method: "org metrics API / logs" }),
  ai({ id: "windsurf", label: "Windsurf", categories: ["coding", "llm"], tier: "log", auth: "apiKey", status: "planned", verified: false, method: "admin usage API or local logs" }),
  ai({ id: "continue", label: "Continue", categories: ["coding", "llm"], tier: "log", auth: "localLogs", status: "planned", verified: false, method: "local logs / proxy" }),
  ai({ id: "aider", label: "Aider", categories: ["coding", "llm"], tier: "log", auth: "localLogs", status: "planned", verified: false, method: "local logs / token reports" }),
  ai({ id: "sourcegraph-cody", label: "Sourcegraph Cody", categories: ["coding", "llm"], tier: "log", auth: "apiKey", status: "planned", verified: false, method: "enterprise usage API / logs" }),
  ai({ id: "jetbrains-ai", label: "JetBrains AI", categories: ["coding", "llm"], tier: "manual", auth: "none", status: "planned", verified: false, method: "manual subscription / IDE evidence" }),
  ai({ id: "replit-agent", label: "Replit Agent", categories: ["coding", "llm"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "Replit usage/billing" }),
  ai({ id: "v0", label: "Vercel v0", categories: ["coding", "llm", "image"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "Vercel usage/billing" }),
  ai({ id: "bolt", label: "Bolt.new", categories: ["coding", "llm"], tier: "manual", auth: "none", status: "planned", verified: false, method: "manual subscription / project evidence" }),
  ai({ id: "lovable", label: "Lovable", categories: ["coding", "llm"], tier: "manual", auth: "none", status: "planned", verified: false, method: "manual subscription / project evidence" }),

  // ===== AI — PLANNED (VS Code plugins — BYOK) =====
  ai({ id: "augment", label: "Augment Code", categories: ["coding"], tier: "log", auth: "localLogs", status: "built", verified: false, method: "extension logs ⚠ verify path" }),
  ai({ id: "roo-code", label: "Roo Code", categories: ["coding"], tier: "log", auth: "localLogs", status: "built", verified: false, method: "extension task logs ⚠ verify path" }),
  ai({ id: "cline", label: "Cline", categories: ["coding"], tier: "log", auth: "localLogs", status: "planned", verified: false, method: "extension task logs ⚠" }),

  // ===== AI — PLANNED (local runners — proxy tier) =====
  ai({ id: "ollama", label: "Ollama", categories: ["llm"], tier: "proxy", auth: "localLogs", status: "planned", verified: false, method: "vibetracker proxy; tokens; $0" }),
  ai({ id: "lmstudio", label: "LM Studio", categories: ["llm"], tier: "proxy", auth: "localLogs", status: "planned", verified: false, method: "vibetracker proxy; tokens; $0" }),
  ai({ id: "jan", label: "Jan", categories: ["llm"], tier: "proxy", auth: "localLogs", status: "planned", verified: false, method: "OpenAI-compatible local proxy; $0" }),
  ai({ id: "gpt4all", label: "GPT4All", categories: ["llm"], tier: "local", auth: "localLogs", status: "planned", verified: false, method: "local logs / $0" }),
  ai({ id: "llama-cpp", label: "llama.cpp server", categories: ["llm"], tier: "proxy", auth: "localLogs", status: "planned", verified: false, method: "OpenAI-compatible local proxy; $0" }),
  ai({ id: "vllm", label: "vLLM", categories: ["llm"], tier: "proxy", auth: "localLogs", status: "planned", verified: false, method: "OpenAI-compatible local proxy / GPU-time" }),
  ai({ id: "text-generation-webui", label: "text-generation-webui", categories: ["llm"], tier: "proxy", auth: "localLogs", status: "planned", verified: false, method: "OpenAI-compatible local proxy; $0" }),
  ai({ id: "automatic1111", label: "AUTOMATIC1111", categories: ["image"], tier: "local", auth: "localLogs", status: "planned", verified: false, method: "local image history / $0" }),
  ai({ id: "forge", label: "Stable Diffusion WebUI Forge", categories: ["image"], tier: "local", auth: "localLogs", status: "planned", verified: false, method: "local image history / $0" }),
  ai({ id: "invokeai", label: "InvokeAI", categories: ["image", "video"], tier: "local", auth: "localLogs", status: "planned", verified: false, method: "local DB/history / $0" }),
  ai({ id: "fooocus", label: "Fooocus", categories: ["image"], tier: "local", auth: "localLogs", status: "planned", verified: false, method: "local output metadata / $0" }),
  ai({ id: "diffusers-local", label: "Diffusers local scripts", categories: ["image", "audio", "video"], tier: "local", auth: "localLogs", status: "planned", verified: false, method: "local manifest/proxy / $0" }),

  // ===== AI — NO API =====
  ai({ id: "midjourney", label: "Midjourney", categories: ["image"], tier: "manual", auth: "none", status: "manual-only", verified: false, method: "Discord-only → manual entry" }),

  // ===== DEV COSTS (hosting / CI / GPU / DB) =====
  dev({ id: "vercel", label: "Vercel", categories: ["other"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "usage/billing API" }),
  dev({ id: "netlify", label: "Netlify", categories: ["other"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "billing API" }),
  dev({ id: "cloudflare", label: "Cloudflare", categories: ["other"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "billing API" }),
  dev({ id: "github-actions", label: "GitHub Actions", categories: ["other"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "billing/usage API" }),
  dev({ id: "supabase", label: "Supabase", categories: ["other"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "billing API" }),
  dev({ id: "convex", label: "Convex", categories: ["other"], tier: "manual", auth: "none", status: "planned", verified: false, method: "plan cost (manual)" }),
  dev({ id: "blacksmith", label: "Blacksmith", categories: ["other"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "runner usage" }),
  dev({ id: "depot", label: "Depot", categories: ["other"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "build-minutes usage" }),
  dev({ id: "hostinger", label: "Hostinger VPS", categories: ["other"], tier: "manual", auth: "none", status: "planned", verified: false, method: "plan cost (manual)" }),
  dev({ id: "domain", label: "Domain(s)", categories: ["other"], tier: "manual", auth: "none", status: "planned", verified: false, method: "annual/monthly (manual)" }),
  dev({ id: "server", label: "Server / VPS (other)", categories: ["other"], tier: "manual", auth: "none", status: "planned", verified: false, method: "plan cost (manual)" }),

  // ===== CREATIVE SUBSCRIPTIONS (flat monthly — manual entry) =====
  creative({ id: "adobe-cc", label: "Adobe Creative Cloud", categories: ["other"], tier: "manual", auth: "none", status: "planned", verified: false, method: "monthly sub (manual)" }),
  creative({ id: "photoshop", label: "Photoshop", categories: ["image"], tier: "manual", auth: "none", status: "planned", verified: false, method: "monthly sub (manual)" }),
  creative({ id: "premiere", label: "Premiere Pro", categories: ["video"], tier: "manual", auth: "none", status: "planned", verified: false, method: "monthly sub (manual)" }),
  creative({ id: "capcut", label: "CapCut Pro", categories: ["video"], tier: "manual", auth: "none", status: "planned", verified: false, method: "monthly sub (manual)" }),
  creative({ id: "canva", label: "Canva Pro", categories: ["image"], tier: "manual", auth: "none", status: "planned", verified: false, method: "monthly sub (manual)" }),
  creative({ id: "artlist", label: "Artlist", categories: ["audio"], tier: "manual", auth: "none", status: "planned", verified: false, method: "monthly sub (manual)" }),
  creative({ id: "martini", label: "Martini AI", categories: ["audio", "video"], tier: "manual", auth: "none", status: "planned", verified: false, method: "monthly sub (manual)" }),
  creative({ id: "notion-ai", label: "Notion AI", categories: ["llm"], tier: "manual", auth: "none", status: "planned", verified: false, method: "seat/subscription (manual)" }),
  creative({ id: "grammarly", label: "Grammarly AI", categories: ["llm"], tier: "manual", auth: "none", status: "planned", verified: false, method: "seat/subscription (manual)" }),
  creative({ id: "jasper", label: "Jasper", categories: ["llm", "image"], tier: "manual", auth: "none", status: "planned", verified: false, method: "subscription/manual campaign evidence" }),
  creative({ id: "copy-ai", label: "Copy.ai", categories: ["llm"], tier: "manual", auth: "none", status: "planned", verified: false, method: "subscription/manual campaign evidence" }),
  creative({ id: "gamma", label: "Gamma", categories: ["llm", "image"], tier: "manual", auth: "none", status: "planned", verified: false, method: "subscription/manual deck evidence" }),
  creative({ id: "zapier-ai", label: "Zapier AI", categories: ["llm", "other"], tier: "ledger", auth: "apiKey", status: "planned", verified: false, method: "task/AI action usage" }),
  creative({ id: "make-ai", label: "Make AI", categories: ["llm", "other"], tier: "manual", auth: "none", status: "planned", verified: false, method: "operations/subscription (manual)" }),
  creative({ id: "airtable-ai", label: "Airtable AI", categories: ["llm", "other"], tier: "manual", auth: "none", status: "planned", verified: false, method: "seat/subscription (manual)" }),
];

export function getProvider(id: string): ProviderDescriptor | undefined {
  return PROVIDERS.find((p) => p.id === id);
}
export function providersByStatus(status: Status): ProviderDescriptor[] {
  return PROVIDERS.filter((p) => p.status === status);
}
export function providersInDomain(domain: Domain): string[] {
  return PROVIDERS.filter((p) => p.domain === domain).map((p) => p.id);
}
