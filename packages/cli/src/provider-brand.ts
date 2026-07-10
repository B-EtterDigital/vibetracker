import { PROVIDERS, type ProviderDescriptor } from "../../adapters/src/registry.ts";

export interface ProviderBrand {
  id: string;
  label: string;
  mark: string;
  from: string;
  to: string;
  ink: string;
}

const EXACT: Record<string, ProviderBrand> = {
  "github": { id: "github", label: "GitHub", mark: "GH", from: "#24292f", to: "#57606a", ink: "#ffffff" },
  "c0vibe": { id: "c0vibe", label: "C0VIBE", mark: "C0", from: "#2ee8d6", to: "#36e39b", ink: "#061312" },
  "higgsfield": { id: "higgsfield", label: "Higgsfield", mark: "HF", from: "#ff4fd8", to: "#7c5cff", ink: "#ffffff" },
  "claude-code": { id: "claude-code", label: "Claude Code", mark: "CC", from: "#d97757", to: "#f2b16b", ink: "#170f0b" },
  "anthropic": { id: "anthropic", label: "Anthropic", mark: "AN", from: "#d8c7b2", to: "#8c7b6a", ink: "#16120f" },
  "openai": { id: "openai", label: "OpenAI", mark: "OA", from: "#10a37f", to: "#6ee7c8", ink: "#06130f" },
  "replicate": { id: "replicate", label: "Replicate", mark: "RP", from: "#111111", to: "#8b8b8b", ink: "#ffffff" },
  "falai": { id: "falai", label: "fal.ai", mark: "FA", from: "#ff6b35", to: "#ffcf5a", ink: "#1e0d05" },
  "runway": { id: "runway", label: "Runway", mark: "RW", from: "#00d084", to: "#0a84ff", ink: "#04120c" },
  "suno": { id: "suno", label: "Suno", mark: "SU", from: "#ff7a1a", to: "#ffd36a", ink: "#1f0d00" },
  "udio": { id: "udio", label: "Udio", mark: "UD", from: "#7768ff", to: "#f062c0", ink: "#ffffff" },
  "elevenlabs": { id: "elevenlabs", label: "ElevenLabs", mark: "11", from: "#ffffff", to: "#9ca3af", ink: "#111827" },
  "openrouter": { id: "openrouter", label: "OpenRouter", mark: "OR", from: "#7c3aed", to: "#22d3ee", ink: "#ffffff" },
  "ollama": { id: "ollama", label: "Ollama", mark: "OL", from: "#f7f7f2", to: "#8dd3c7", ink: "#101312" },
  "lmstudio": { id: "lmstudio", label: "LM Studio", mark: "LM", from: "#1f6feb", to: "#7ee787", ink: "#ffffff" },
  "comfyui": { id: "comfyui", label: "ComfyUI", mark: "CU", from: "#ff9f1c", to: "#2ec4b6", ink: "#160d00" },
  "jan": { id: "jan", label: "Jan", mark: "JN", from: "#111827", to: "#c084fc", ink: "#ffffff" },
  "gpt4all": { id: "gpt4all", label: "GPT4All", mark: "G4", from: "#2f3136", to: "#76e4f7", ink: "#ffffff" },
  "llama-cpp": { id: "llama-cpp", label: "llama.cpp server", mark: "LC", from: "#f8fafc", to: "#14b8a6", ink: "#111827" },
  "vllm": { id: "vllm", label: "vLLM", mark: "VL", from: "#0f172a", to: "#a78bfa", ink: "#ffffff" },
  "text-generation-webui": { id: "text-generation-webui", label: "text-generation-webui", mark: "TG", from: "#1f2937", to: "#60a5fa", ink: "#ffffff" },
  "automatic1111": { id: "automatic1111", label: "AUTOMATIC1111", mark: "A1", from: "#0f172a", to: "#f472b6", ink: "#ffffff" },
  "forge": { id: "forge", label: "Stable Diffusion WebUI Forge", mark: "FG", from: "#111827", to: "#f97316", ink: "#ffffff" },
  "invokeai": { id: "invokeai", label: "InvokeAI", mark: "IN", from: "#4f46e5", to: "#22d3ee", ink: "#ffffff" },
  "fooocus": { id: "fooocus", label: "Fooocus", mark: "FO", from: "#18181b", to: "#facc15", ink: "#ffffff" },
  "diffusers-local": { id: "diffusers-local", label: "Diffusers local scripts", mark: "DF", from: "#f97316", to: "#22c55e", ink: "#111827" },
  "qwen": { id: "qwen", label: "Qwen", mark: "QW", from: "#1677ff", to: "#00c2ff", ink: "#ffffff" },
  "doubao": { id: "doubao", label: "Doubao", mark: "DB", from: "#2f7bff", to: "#ff4d8d", ink: "#ffffff" },
  "kimi": { id: "kimi", label: "Kimi", mark: "KM", from: "#1d4ed8", to: "#60a5fa", ink: "#ffffff" },
  "deepseek": { id: "deepseek", label: "DeepSeek", mark: "DS", from: "#4f46e5", to: "#38bdf8", ink: "#ffffff" },
  "mistral": { id: "mistral", label: "Mistral", mark: "MI", from: "#ff7000", to: "#ffd43b", ink: "#1b0b00" },
  "perplexity": { id: "perplexity", label: "Perplexity", mark: "PX", from: "#20b8cd", to: "#104e64", ink: "#ffffff" },
  "aleph-alpha": { id: "aleph-alpha", label: "Aleph Alpha", mark: "AA", from: "#111827", to: "#f5f0e8", ink: "#ffffff" },
  "lighton": { id: "lighton", label: "LightOn", mark: "LO", from: "#facc15", to: "#ef4444", ink: "#1a0d02" },
  "gemini": { id: "gemini", label: "Gemini", mark: "GE", from: "#4285f4", to: "#a142f4", ink: "#ffffff" },
  "gemini-cli": { id: "gemini-cli", label: "Gemini CLI", mark: "GC", from: "#4285f4", to: "#34a853", ink: "#ffffff" },
  "codex": { id: "codex", label: "Codex", mark: "CX", from: "#10a37f", to: "#3b82f6", ink: "#ffffff" },
  "codex-cli": { id: "codex-cli", label: "Codex CLI", mark: "CX", from: "#10a37f", to: "#3b82f6", ink: "#ffffff" },
  "antigravity": { id: "antigravity", label: "Antigravity", mark: "AG", from: "#8b5cf6", to: "#22d3ee", ink: "#ffffff" },
  "augment": { id: "augment", label: "Augment Code", mark: "AU", from: "#7c3aed", to: "#f97316", ink: "#ffffff" },
  "roo-code": { id: "roo-code", label: "Roo Code", mark: "RC", from: "#f97316", to: "#22d3ee", ink: "#180b03" },
  "runpod": { id: "runpod", label: "RunPod", mark: "RP", from: "#ec4899", to: "#8b5cf6", ink: "#ffffff" },
  "browserbase": { id: "browserbase", label: "Browserbase", mark: "BB", from: "#1d4ed8", to: "#06b6d4", ink: "#ffffff" },
};

const REGISTRY = new Map(PROVIDERS.map((provider) => [provider.id, provider]));
const CHINESE_REGIONAL = new Set([
  "qwen",
  "doubao",
  "kimi",
  "deepseek",
  "zai",
  "glm",
  "baidu-wenxin",
  "tencent-hunyuan",
  "iflytek-spark",
  "zhipu",
  "baichuan",
  "01ai",
  "stepfun",
  "siliconflow",
  "modelscope",
  "minimax",
  "wan",
  "dreamina",
]);
const EUROPEAN_REGIONAL = new Set(["mistral", "aleph-alpha", "lighton", "poolside"]);

export const EXPLICIT_PROVIDER_BRAND_IDS = Array.from(new Set([...Object.keys(EXACT), ...PROVIDERS.map((provider) => provider.id)])).sort();

const FALLBACKS = [
  ["#2ee6d6", "#3b9dff"],
  ["#3ddc84", "#2ee6d6"],
  ["#ffcb45", "#ff8a6b"],
  ["#c084fc", "#60a5fa"],
  ["#f97316", "#fde047"],
] as const;

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function mark(id: string, label?: string): string {
  const src = (label || id).replace(/[^a-zA-Z0-9 ]/g, " ").trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase() || "AI";
}

function registryTone(provider: ProviderDescriptor): Pick<ProviderBrand, "from" | "to" | "ink"> {
  if (CHINESE_REGIONAL.has(provider.id)) return { from: "#1677ff", to: "#ff4d8d", ink: "#ffffff" };
  if (EUROPEAN_REGIONAL.has(provider.id)) return { from: "#ff7000", to: "#ffd43b", ink: "#1b0b00" };
  if (provider.tier === "local" || provider.tier === "proxy") return { from: "#f7f7f2", to: "#8dd3c7", ink: "#101312" };
  if (provider.domain === "dev") return { from: "#0ea5e9", to: "#22c55e", ink: "#06130f" };
  if (provider.domain === "creative" || provider.tier === "manual" || provider.status === "manual-only") return { from: "#111827", to: "#f5f5f4", ink: "#ffffff" };
  if (provider.categories.includes("coding")) return { from: "#10a37f", to: "#3b82f6", ink: "#ffffff" };
  if (provider.categories.includes("video")) return { from: "#00d084", to: "#0a84ff", ink: "#04120c" };
  if (provider.categories.includes("audio") || provider.categories.includes("music")) return { from: "#7768ff", to: "#f062c0", ink: "#ffffff" };
  if (provider.categories.includes("image")) return { from: "#7c3aed", to: "#f472b6", ink: "#ffffff" };
  return { from: "#1677ff", to: "#00c2ff", ink: "#ffffff" };
}

export function hasProviderBrand(id: string): boolean {
  const key = id.toLowerCase();
  return Boolean(EXACT[key] || REGISTRY.has(key));
}

export function providerBrand(id: string, label?: string): ProviderBrand {
  const key = id.toLowerCase();
  const exact = EXACT[key];
  if (exact) return { ...exact, label: label || exact.label };
  const provider = REGISTRY.get(key);
  if (provider) {
    return {
      id: provider.id,
      label: label || provider.label,
      mark: mark(provider.id, label || provider.label),
      ...registryTone(provider),
    };
  }
  const colors = FALLBACKS[hash(key) % FALLBACKS.length];
  return { id, label: label || id, mark: mark(id, label), from: colors[0], to: colors[1], ink: "#071013" };
}

export function providerStyle(id: string, label?: string): string {
  const b = providerBrand(id, label);
  return `--brand-from:${b.from};--brand-to:${b.to};--brand-ink:${b.ink}`;
}
