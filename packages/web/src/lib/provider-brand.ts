import { logoPath } from "./provider-logos.ts";

export interface ProviderBrand {
  mark: string;
  from: string;
  to: string;
  ink: string;
  /** Public path to the real brand glyph when available; monogram is the fallback. */
  logo?: string;
}

const BRANDS: Record<string, ProviderBrand> = {
  "github": { mark: "GH", from: "#24292f", to: "#57606a", ink: "#ffffff" },
  "github-actions": { mark: "GA", from: "#2088ff", to: "#24292f", ink: "#ffffff" },
  "higgsfield": { mark: "HF", from: "#ff4fd8", to: "#7c5cff", ink: "#ffffff" },
  "claude-code": { mark: "CC", from: "#d97757", to: "#f2b16b", ink: "#170f0b" },
  "openai": { mark: "OA", from: "#10a37f", to: "#6ee7c8", ink: "#06130f" },
  "anthropic": { mark: "AN", from: "#d8c7b2", to: "#8c7b6a", ink: "#16120f" },
  "replicate": { mark: "RP", from: "#111111", to: "#8b8b8b", ink: "#ffffff" },
  "falai": { mark: "FA", from: "#ff6b35", to: "#ffcf5a", ink: "#1e0d05" },
  "runway": { mark: "RW", from: "#00d084", to: "#0a84ff", ink: "#04120c" },
  "luma": { mark: "LU", from: "#111827", to: "#f9fafb", ink: "#ffffff" },
  "kling": { mark: "KL", from: "#0f172a", to: "#38bdf8", ink: "#ffffff" },
  "suno": { mark: "SU", from: "#ff7a1a", to: "#ffd36a", ink: "#1f0d00" },
  "sunoapi": { mark: "SA", from: "#ff7a1a", to: "#f97316", ink: "#1f0d00" },
  "udio": { mark: "UD", from: "#7768ff", to: "#f062c0", ink: "#ffffff" },
  "elevenlabs": { mark: "11", from: "#ffffff", to: "#9ca3af", ink: "#111827" },
  "openrouter": { mark: "OR", from: "#7c3aed", to: "#22d3ee", ink: "#ffffff" },
  "xai": { mark: "XA", from: "#111111", to: "#d4d4d8", ink: "#ffffff" },
  "groq": { mark: "GQ", from: "#f55036", to: "#ffb199", ink: "#1c0703" },
  "together": { mark: "TG", from: "#111827", to: "#ff6b6b", ink: "#ffffff" },
  "cohere": { mark: "CO", from: "#39594d", to: "#d2f85d", ink: "#07110c" },
  "fireworks": { mark: "FW", from: "#ff5c35", to: "#7c3aed", ink: "#ffffff" },
  "hermes": { mark: "HE", from: "#7c2d12", to: "#facc15", ink: "#fff7ed" },
  "poe": { mark: "PO", from: "#5b21b6", to: "#ec4899", ink: "#ffffff" },
  "ollama": { mark: "OL", from: "#f7f7f2", to: "#8dd3c7", ink: "#101312" },
  "lmstudio": { mark: "LM", from: "#1f6feb", to: "#7ee787", ink: "#ffffff" },
  "comfyui": { mark: "CU", from: "#ff9f1c", to: "#2ec4b6", ink: "#160d00" },
  "jan": { mark: "JN", from: "#111827", to: "#c084fc", ink: "#ffffff" },
  "gpt4all": { mark: "G4", from: "#2f3136", to: "#76e4f7", ink: "#ffffff" },
  "llama-cpp": { mark: "LC", from: "#f8fafc", to: "#14b8a6", ink: "#111827" },
  "vllm": { mark: "VL", from: "#0f172a", to: "#a78bfa", ink: "#ffffff" },
  "text-generation-webui": { mark: "TG", from: "#1f2937", to: "#60a5fa", ink: "#ffffff" },
  "automatic1111": { mark: "A1", from: "#0f172a", to: "#f472b6", ink: "#ffffff" },
  "forge": { mark: "FG", from: "#111827", to: "#f97316", ink: "#ffffff" },
  "invokeai": { mark: "IN", from: "#4f46e5", to: "#22d3ee", ink: "#ffffff" },
  "fooocus": { mark: "FO", from: "#18181b", to: "#facc15", ink: "#ffffff" },
  "diffusers-local": { mark: "DF", from: "#f97316", to: "#22c55e", ink: "#111827" },
  "qwen": { mark: "QW", from: "#1677ff", to: "#00c2ff", ink: "#ffffff" },
  "doubao": { mark: "DB", from: "#2f7bff", to: "#ff4d8d", ink: "#ffffff" },
  "kimi": { mark: "KM", from: "#1d4ed8", to: "#60a5fa", ink: "#ffffff" },
  "deepseek": { mark: "DS", from: "#4f46e5", to: "#38bdf8", ink: "#ffffff" },
  "zai": { mark: "ZA", from: "#2563eb", to: "#22d3ee", ink: "#ffffff" },
  "glm": { mark: "GL", from: "#2563eb", to: "#a855f7", ink: "#ffffff" },
  "baidu-wenxin": { mark: "BW", from: "#2932e1", to: "#00a1ff", ink: "#ffffff" },
  "tencent-hunyuan": { mark: "TH", from: "#006eff", to: "#00d4ff", ink: "#ffffff" },
  "iflytek-spark": { mark: "IF", from: "#e60012", to: "#ff8a00", ink: "#ffffff" },
  "zhipu": { mark: "ZP", from: "#1d4ed8", to: "#8b5cf6", ink: "#ffffff" },
  "baichuan": { mark: "BC", from: "#0ea5e9", to: "#22c55e", ink: "#06130f" },
  "01ai": { mark: "01", from: "#111827", to: "#f9fafb", ink: "#ffffff" },
  "stepfun": { mark: "SF", from: "#f97316", to: "#ef4444", ink: "#ffffff" },
  "siliconflow": { mark: "SF", from: "#111827", to: "#2dd4bf", ink: "#ffffff" },
  "modelscope": { mark: "MS", from: "#ff6a00", to: "#1677ff", ink: "#ffffff" },
  "mistral": { mark: "MI", from: "#ff7000", to: "#ffd43b", ink: "#1b0b00" },
  "perplexity": { mark: "PX", from: "#20b8cd", to: "#104e64", ink: "#ffffff" },
  "aleph-alpha": { mark: "AA", from: "#111827", to: "#f5f0e8", ink: "#ffffff" },
  "lighton": { mark: "LO", from: "#facc15", to: "#ef4444", ink: "#1a0d02" },
  "poolside": { mark: "PS", from: "#0f172a", to: "#38bdf8", ink: "#ffffff" },
  "ai21": { mark: "21", from: "#111827", to: "#f97316", ink: "#ffffff" },
  "reka": { mark: "RK", from: "#312e81", to: "#f0abfc", ink: "#ffffff" },
  "sarvam": { mark: "SV", from: "#f97316", to: "#22c55e", ink: "#111827" },
  "upstage": { mark: "US", from: "#ef4444", to: "#facc15", ink: "#1a0d02" },
  "naver-hyperclova": { mark: "NH", from: "#03c75a", to: "#111827", ink: "#ffffff" },
  "sakana": { mark: "SK", from: "#2563eb", to: "#67e8f9", ink: "#ffffff" },
  "gemini": { mark: "GE", from: "#4285f4", to: "#a142f4", ink: "#ffffff" },
  "gemini-cli": { mark: "GC", from: "#4285f4", to: "#34a853", ink: "#ffffff" },
  "codex": { mark: "CX", from: "#10a37f", to: "#3b82f6", ink: "#ffffff" },
  "codex-cli": { mark: "CX", from: "#10a37f", to: "#3b82f6", ink: "#ffffff" },
  "antigravity": { mark: "AG", from: "#0ea5e9", to: "#a855f7", ink: "#ffffff" },
  "devin": { mark: "DV", from: "#111827", to: "#22c55e", ink: "#ffffff" },
  "cursor": { mark: "CR", from: "#111111", to: "#f4f4f5", ink: "#ffffff" },
  "opencode": { mark: "OC", from: "#111827", to: "#22d3ee", ink: "#ffffff" },
  "openclaw": { mark: "CL", from: "#0f172a", to: "#fb7185", ink: "#ffffff" },
  "copilot": { mark: "CP", from: "#24292f", to: "#a371f7", ink: "#ffffff" },
  "windsurf": { mark: "WS", from: "#06b6d4", to: "#6366f1", ink: "#ffffff" },
  "continue": { mark: "CT", from: "#111827", to: "#34d399", ink: "#ffffff" },
  "aider": { mark: "AI", from: "#7c3aed", to: "#22d3ee", ink: "#ffffff" },
  "sourcegraph-cody": { mark: "SG", from: "#ff5543", to: "#a112ff", ink: "#ffffff" },
  "jetbrains-ai": { mark: "JB", from: "#ff318c", to: "#ffea00", ink: "#111111" },
  "replit-agent": { mark: "RA", from: "#f26207", to: "#111827", ink: "#ffffff" },
  "v0": { mark: "V0", from: "#000000", to: "#fafafa", ink: "#ffffff" },
  "bolt": { mark: "BT", from: "#facc15", to: "#111827", ink: "#111111" },
  "lovable": { mark: "LV", from: "#ff5c8a", to: "#8b5cf6", ink: "#ffffff" },
  "augment": { mark: "AU", from: "#22c55e", to: "#14b8a6", ink: "#06130f" },
  "roo-code": { mark: "RC", from: "#f97316", to: "#facc15", ink: "#1b0b00" },
  "cline": { mark: "CL", from: "#1e293b", to: "#38bdf8", ink: "#ffffff" },
  "huggingface": { mark: "HF", from: "#ffcc4d", to: "#ff8a00", ink: "#201100" },
  "runpod": { mark: "RP", from: "#ec4899", to: "#8b5cf6", ink: "#ffffff" },
  "browserbase": { mark: "BB", from: "#1d4ed8", to: "#06b6d4", ink: "#ffffff" },
  "midjourney": { mark: "MJ", from: "#111827", to: "#a78bfa", ink: "#ffffff" },
  "stability": { mark: "ST", from: "#111827", to: "#f5f5f5", ink: "#ffffff" },
  "ideogram": { mark: "ID", from: "#111827", to: "#f472b6", ink: "#ffffff" },
  "leonardo": { mark: "LD", from: "#111827", to: "#14b8a6", ink: "#ffffff" },
  "cynaps3": { mark: "C3", from: "#ff6b00", to: "#00e5ff", ink: "#ffffff" },
  "recraft": { mark: "RF", from: "#111827", to: "#f97316", ink: "#ffffff" },
  "pika": { mark: "PK", from: "#ffeb3b", to: "#ff4fd8", ink: "#111111" },
  "minimax": { mark: "MX", from: "#ff4d4f", to: "#1677ff", ink: "#ffffff" },
  "black-forest-labs": { mark: "BF", from: "#111827", to: "#9ca3af", ink: "#ffffff" },
  "krea": { mark: "KR", from: "#111827", to: "#a3e635", ink: "#ffffff" },
  "freepik": { mark: "FP", from: "#0066ff", to: "#00d084", ink: "#ffffff" },
  "clipdrop": { mark: "CD", from: "#111827", to: "#60a5fa", ink: "#ffffff" },
  "getimg": { mark: "GI", from: "#7c3aed", to: "#f472b6", ink: "#ffffff" },
  "playground": { mark: "PG", from: "#111827", to: "#facc15", ink: "#ffffff" },
  "seaart": { mark: "SA", from: "#0ea5e9", to: "#f472b6", ink: "#ffffff" },
  "tensorart": { mark: "TA", from: "#7c3aed", to: "#22d3ee", ink: "#ffffff" },
  "civitai": { mark: "CV", from: "#2563eb", to: "#f97316", ink: "#ffffff" },
  "scenario": { mark: "SC", from: "#111827", to: "#22c55e", ink: "#ffffff" },
  "astria": { mark: "AS", from: "#111827", to: "#c084fc", ink: "#ffffff" },
  "magnific": { mark: "MG", from: "#111827", to: "#f59e0b", ink: "#ffffff" },
  "topaz": { mark: "TZ", from: "#111827", to: "#06b6d4", ink: "#ffffff" },
  "pixverse": { mark: "PV", from: "#7c3aed", to: "#f472b6", ink: "#ffffff" },
  "vidu": { mark: "VD", from: "#111827", to: "#f97316", ink: "#ffffff" },
  "haiper": { mark: "HP", from: "#111827", to: "#22d3ee", ink: "#ffffff" },
  "wan": { mark: "WN", from: "#ff6a00", to: "#1677ff", ink: "#ffffff" },
  "veo": { mark: "VO", from: "#4285f4", to: "#34a853", ink: "#ffffff" },
  "sora": { mark: "SO", from: "#10a37f", to: "#111827", ink: "#ffffff" },
  "dreamina": { mark: "DR", from: "#00f5ff", to: "#ff4fd8", ink: "#111827" },
  "heygen": { mark: "HG", from: "#7c3aed", to: "#22d3ee", ink: "#ffffff" },
  "synthesia": { mark: "SY", from: "#111827", to: "#8b5cf6", ink: "#ffffff" },
  "did": { mark: "DI", from: "#0ea5e9", to: "#a855f7", ink: "#ffffff" },
  "descript": { mark: "DE", from: "#111827", to: "#ffffff", ink: "#ffffff" },
  "deepgram": { mark: "DG", from: "#13ef93", to: "#0b0b0f", ink: "#071013" },
  "assemblyai": { mark: "AA", from: "#111827", to: "#22d3ee", ink: "#ffffff" },
  "playht": { mark: "PH", from: "#111827", to: "#f472b6", ink: "#ffffff" },
  "murf": { mark: "MF", from: "#7c3aed", to: "#facc15", ink: "#ffffff" },
  "resemble": { mark: "RS", from: "#111827", to: "#34d399", ink: "#ffffff" },
  "cartesia": { mark: "CT", from: "#111827", to: "#38bdf8", ink: "#ffffff" },
  "fish-audio": { mark: "FA", from: "#0ea5e9", to: "#22c55e", ink: "#ffffff" },
  "speechify": { mark: "SP", from: "#f97316", to: "#facc15", ink: "#111111" },
  "meshy": { mark: "ME", from: "#7c3aed", to: "#22d3ee", ink: "#ffffff" },
  "tripo": { mark: "TR", from: "#111827", to: "#f97316", ink: "#ffffff" },
  "kaedim": { mark: "KD", from: "#111827", to: "#a3e635", ink: "#ffffff" },
  "spline-ai": { mark: "SP", from: "#ff5c35", to: "#7c3aed", ink: "#ffffff" },
  "canva": { mark: "CA", from: "#00c4cc", to: "#7d2ae8", ink: "#ffffff" },
  "capcut": { mark: "CP", from: "#ffffff", to: "#0f172a", ink: "#111827" },
  "adobe-cc": { mark: "AD", from: "#ff0000", to: "#ff7a7a", ink: "#ffffff" },
  "adobe-firefly": { mark: "FF", from: "#ff0000", to: "#ffb000", ink: "#ffffff" },
  "photoshop": { mark: "PS", from: "#001e36", to: "#31a8ff", ink: "#ffffff" },
  "premiere": { mark: "PR", from: "#00005b", to: "#9999ff", ink: "#ffffff" },
  "artlist": { mark: "AL", from: "#111827", to: "#f5f5f4", ink: "#ffffff" },
  "martini": { mark: "MA", from: "#111827", to: "#f97316", ink: "#ffffff" },
  "notion-ai": { mark: "NO", from: "#f7f6f3", to: "#9b9a97", ink: "#111111" },
  "grammarly": { mark: "GR", from: "#15c39a", to: "#0f172a", ink: "#ffffff" },
  "jasper": { mark: "JA", from: "#ff4f64", to: "#7c3aed", ink: "#ffffff" },
  "copy-ai": { mark: "CA", from: "#111827", to: "#22c55e", ink: "#ffffff" },
  "gamma": { mark: "GM", from: "#7c3aed", to: "#f472b6", ink: "#ffffff" },
  "zapier-ai": { mark: "ZA", from: "#ff4a00", to: "#111827", ink: "#ffffff" },
  "make-ai": { mark: "MK", from: "#6d28d9", to: "#f472b6", ink: "#ffffff" },
  "airtable-ai": { mark: "AT", from: "#f82b60", to: "#18bfff", ink: "#ffffff" },
  "vercel": { mark: "VC", from: "#000000", to: "#ffffff", ink: "#ffffff" },
  "netlify": { mark: "NF", from: "#00c7b7", to: "#014847", ink: "#ffffff" },
  "cloudflare": { mark: "CF", from: "#f38020", to: "#faae40", ink: "#1f0d00" },
  "supabase": { mark: "SB", from: "#3ecf8e", to: "#1f2937", ink: "#071013" },
  "convex": { mark: "CV", from: "#facc15", to: "#ef4444", ink: "#111111" },
  "blacksmith": { mark: "BS", from: "#111827", to: "#f97316", ink: "#ffffff" },
  "depot": { mark: "DP", from: "#111827", to: "#60a5fa", ink: "#ffffff" },
  "hostinger": { mark: "HO", from: "#673de6", to: "#fc5185", ink: "#ffffff" },
  "domain": { mark: "DN", from: "#0f172a", to: "#94a3b8", ink: "#ffffff" },
  "server": { mark: "SV", from: "#111827", to: "#22c55e", ink: "#ffffff" },
  "c0vibe": { mark: "C0", from: "#2ee8d6", to: "#36e39b", ink: "#071013" },
};

export const EXPLICIT_PROVIDER_BRAND_IDS = Object.keys(BRANDS).sort();

const FALLBACKS = [["#2ee6d6", "#3b9dff"], ["#3ddc84", "#2ee6d6"], ["#ffcb45", "#ff8a6b"], ["#c084fc", "#60a5fa"]] as const;

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function providerBrand(id: string): ProviderBrand {
  const key = id.toLowerCase();
  const logo = logoPath(key) ?? undefined;
  const exact = BRANDS[key];
  // Spread when a logo exists so the shared BRANDS object is never mutated.
  if (exact) return logo ? { ...exact, logo } : exact;
  const colors = FALLBACKS[hash(key) % FALLBACKS.length];
  return { mark: key.slice(0, 2).toUpperCase() || "AI", from: colors[0], to: colors[1], ink: "#071013", logo };
}

export function hasProviderBrand(id: string): boolean {
  return Boolean(BRANDS[id.toLowerCase()]);
}

export function providerVars(id: string): Record<string, string> {
  const b = providerBrand(id);
  return { "--brand-from": b.from, "--brand-to": b.to, "--brand-ink": b.ink };
}
