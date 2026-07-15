import type { ProviderDescriptor } from "../../../../adapters/src/registry";

export type CollectionPath = "connect" | "detect" | "manual" | "planned";
export type SourceDomain = "all" | ProviderDescriptor["domain"];
export type PresetKey = "coding" | "creator" | "local" | "agent-team";
export type StackReadinessState = "empty" | "ready" | "review" | "partial" | "blocked";

export interface SourceCandidate {
  provider: ProviderDescriptor;
  path: CollectionPath;
  pathLabel: string;
  searchText: string;
}

export interface StackPreset {
  key: PresetKey;
  label: string;
  detail: string;
  ids: string[];
}

export interface Runbook {
  text: string;
  lines: string[];
  counts: Record<CollectionPath, number>;
  executableCount: number;
  diagnosis: StackDiagnosis;
}

export interface StackDiagnosis {
  state: StackReadinessState;
  label: string;
  headline: string;
  explanation: string;
  nextAction: string;
  selectedCount: number;
  trackableCount: number;
  automaticCount: number;
  verifiedCount: number;
  trackablePercent: number;
  automaticPercent: number;
  manualPercent: number;
  visibilityOnly: string[];
}

export const MAX_STACK_SIZE = 12;

export const STACK_PRESETS: StackPreset[] = [
  {
    key: "coding",
    label: "Coding rig",
    detail: "Claude Code, Codex, Antigravity, Cursor",
    ids: ["claude-code", "codex", "antigravity", "cursor"],
  },
  {
    key: "creator",
    label: "Creator studio",
    detail: "Higgsfield, Replicate, Runway, Suno, Midjourney",
    ids: ["higgsfield", "replicate", "runway", "suno", "midjourney"],
  },
  {
    key: "local",
    label: "Local lab",
    detail: "Ollama, LM Studio, ComfyUI, A1111, InvokeAI",
    ids: ["ollama", "lmstudio", "comfyui", "automatic1111", "invokeai"],
  },
  {
    key: "agent-team",
    label: "Agent team",
    detail: "Codex, Claude Code, OpenCode, Gemini CLI",
    ids: ["codex", "claude-code", "opencode", "gemini-cli"],
  },
];

const PATH_ORDER: Record<CollectionPath, number> = {
  connect: 0,
  detect: 1,
  manual: 2,
  planned: 3,
};

const PATH_LABEL: Record<CollectionPath, string> = {
  connect: "adapter",
  detect: "local detect",
  manual: "manual",
  planned: "planned",
};

export function sourceCollectionPath(provider: ProviderDescriptor): CollectionPath {
  if (provider.status === "built") return "connect";
  if (provider.tier === "proxy" || provider.tier === "local") return "detect";
  if (provider.tier === "manual" || provider.status === "manual-only") return "manual";
  return "planned";
}

function normalize(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function buildSourceCandidates(providers: ProviderDescriptor[]): SourceCandidate[] {
  return providers.map((provider) => {
    const path = sourceCollectionPath(provider);
    return {
      provider,
      path,
      pathLabel: PATH_LABEL[path],
      searchText: normalize([
        provider.id,
        provider.label,
        provider.domain,
        provider.categories.join(" "),
        provider.tier,
        provider.auth,
        provider.status,
        provider.method,
        PATH_LABEL[path],
      ].join(" ")),
    };
  });
}

export function searchSourceCandidates(
  candidates: SourceCandidate[],
  query: string,
  domain: SourceDomain,
  limit = 12,
): SourceCandidate[] {
  const normalized = normalize(query.trim());
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const safeLimit = Math.max(1, Math.trunc(limit) || 12);

  return candidates
    .filter((candidate) => {
      if (domain !== "all" && candidate.provider.domain !== domain) return false;
      return tokens.every((token) => candidate.searchText.includes(token));
    })
    .sort((a, b) => {
      const aExact = a.provider.id === normalized || normalize(a.provider.label) === normalized;
      const bExact = b.provider.id === normalized || normalize(b.provider.label) === normalized;
      if (aExact !== bExact) return aExact ? -1 : 1;
      return PATH_ORDER[a.path] - PATH_ORDER[b.path] || a.provider.label.localeCompare(b.provider.label);
    })
    .slice(0, safeLimit);
}

export function resolvePreset(candidates: SourceCandidate[], key: PresetKey): SourceCandidate[] {
  const preset = STACK_PRESETS.find((item) => item.key === key);
  if (!preset) return [];
  const byId = new Map(candidates.map((candidate) => [candidate.provider.id, candidate]));
  return preset.ids.map((id) => byId.get(id)).filter((candidate): candidate is SourceCandidate => Boolean(candidate));
}

export function buildStackDiagnosis(selected: SourceCandidate[]): StackDiagnosis {
  const selectedCount = selected.length;
  const automatic = selected.filter((candidate) => candidate.path === "connect" || candidate.path === "detect");
  const manual = selected.filter((candidate) => candidate.path === "manual");
  const planned = selected.filter((candidate) => candidate.path === "planned");
  const automaticCount = automatic.length;
  const trackableCount = automaticCount + manual.length;
  const verifiedCount = selected.filter(
    (candidate) => candidate.provider.status === "built" && candidate.provider.verified,
  ).length;
  const percent = (count: number) => selectedCount ? Math.round((count / selectedCount) * 100) : 0;
  const common = {
    selectedCount,
    trackableCount,
    automaticCount,
    verifiedCount,
    trackablePercent: percent(trackableCount),
    automaticPercent: percent(automaticCount),
    manualPercent: percent(manual.length),
    visibilityOnly: planned.map((candidate) => candidate.provider.label),
  };

  if (selectedCount === 0) {
    return {
      ...common,
      state: "empty",
      label: "NO STACK",
      headline: "Select sources to calculate a setup path.",
      explanation: "Nothing is counted until a registry-backed source is selected.",
      nextAction: `Load a preset or select up to ${MAX_STACK_SIZE} sources.`,
    };
  }

  if (planned.length === selectedCount) {
    return {
      ...common,
      state: "blocked",
      label: "NO CURRENT PATH",
      headline: "None of the selected sources can produce usage yet.",
      explanation: "Every selection is mapped for visibility, but no adapter, local detection, or manual path exists today.",
      nextAction: "Choose at least one source labeled adapter, local detect, or manual.",
    };
  }

  if (planned.length > 0) {
    const noun = planned.length === 1 ? "source remains" : "sources remain";
    return {
      ...common,
      state: "partial",
      label: "PARTIAL COVERAGE",
      headline: `${trackableCount} of ${selectedCount} selected sources can enter a dry-run today.`,
      explanation: `${automaticCount} automatic and ${manual.length} manual. ${planned.length} ${noun} visibility-only and never inflates coverage.`,
      nextAction: `Keep ${planned.map((candidate) => candidate.provider.label).join(", ")} as planned notes, or remove the gap for a clean runnable stack.`,
    };
  }

  if (manual.length > 0) {
    return {
      ...common,
      state: "review",
      label: "MANUAL REVIEW",
      headline: `${trackableCount} of ${selectedCount} selected sources can enter a dry-run today.`,
      explanation: `${automaticCount} automatic and ${manual.length} manual. Manual values remain explicit and are never upgraded to verified usage.`,
      nextAction: "Replace every <monthly-usd> placeholder before running the dry-run.",
    };
  }

  return {
    ...common,
    state: "ready",
    label: "RUNBOOK READY",
    headline: `All ${selectedCount} selected sources have an automatic collection path.`,
    explanation: `${verifiedCount} are endpoint-verified in the public registry. A local dry-run still precedes every publish step.`,
    nextAction: "Copy the runbook, run it locally, and inspect sync --dry-run before publishing.",
  };
}

export function buildRunbook(selected: SourceCandidate[]): Runbook {
  const ordered = [...selected].sort(
    (a, b) => PATH_ORDER[a.path] - PATH_ORDER[b.path] || a.provider.label.localeCompare(b.provider.label),
  );
  const counts: Record<CollectionPath, number> = { connect: 0, detect: 0, manual: 0, planned: 0 };
  for (const candidate of ordered) counts[candidate.path] += 1;
  const diagnosis = buildStackDiagnosis(ordered);

  const lines = [
    "# VibeUsage local setup — review before running",
    "npx vibetrack init",
  ];
  const connect = ordered.filter((candidate) => candidate.path === "connect");
  const detect = ordered.filter((candidate) => candidate.path === "detect");
  const manual = ordered.filter((candidate) => candidate.path === "manual");
  const planned = ordered.filter((candidate) => candidate.path === "planned");

  if (connect.length) {
    lines.push("", "# adapters");
    for (const candidate of connect) lines.push(`vibetracker connect ${candidate.provider.id}`);
  }
  if (detect.length) {
    lines.push("", `# local/proxy detection: ${detect.map((candidate) => candidate.provider.id).join(", ")}`);
    lines.push("vibetracker detect");
  }
  if (manual.length) {
    lines.push("", "# manual subscriptions — replace <monthly-usd>");
    for (const candidate of manual) {
      lines.push(`vibetracker add ${candidate.provider.id} --usd <monthly-usd> --note subscription`);
    }
  }
  if (planned.length) {
    lines.push("", "# mapped, not built — no automatic collection command exists yet");
    for (const candidate of planned) lines.push(`# planned: ${candidate.provider.id}`);
  }

  lines.push("", "vibetracker sync --dry-run", "# publish stays opt-in: vibetracker upload");
  return {
    lines,
    text: lines.join("\n"),
    counts,
    executableCount: 2 + connect.length + (detect.length ? 1 : 0) + manual.length,
    diagnosis,
  };
}
