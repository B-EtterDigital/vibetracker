import { PROVIDERS } from "../../../adapters/src/registry.ts";
import { providerBrand } from "./provider-brand.ts";
import { buildProviderScanTheatre, type ProviderScanTheatreScene } from "./provider-scan.ts";

export interface HomeScanRoomMark {
  id: string;
  mark: string;
  from: string;
  to: string;
  ink: string;
}

export interface HomeScanRoomMetric {
  label: string;
  value: string;
  note: string;
}

export interface HomeScanRoomScene extends ProviderScanTheatreScene {
  primaryMark: string;
  brandFrom: string;
  brandTo: string;
  brandInk: string;
  marks: HomeScanRoomMark[];
}

export interface HomeScanRoom {
  headline: string;
  terminalLines: string[];
  metrics: HomeScanRoomMetric[];
  scenes: HomeScanRoomScene[];
}

function fit(value: string | number, width: number): string {
  return String(value).padEnd(width).slice(0, width);
}

function markFor(providerId: string): HomeScanRoomMark {
  const brand = providerBrand(providerId);
  return {
    id: providerId,
    mark: brand.mark,
    from: brand.from,
    to: brand.to,
    ink: brand.ink,
  };
}

export function buildHomeScanRoom(): HomeScanRoom {
  const built = PROVIDERS.filter((provider) => provider.status === "built").length;
  const verified = PROVIDERS.filter((provider) => provider.status === "built" && provider.verified).length;
  const local = PROVIDERS.filter((provider) => provider.tier === "local" || provider.auth === "localLogs").length;
  const creator = PROVIDERS.filter((provider) =>
    provider.categories.some((category) => ["image", "video", "audio", "music", "3d"].includes(category))
  ).length;
  const scenes = buildProviderScanTheatre(PROVIDERS).map<HomeScanRoomScene>((scene) => {
    const primary = markFor(scene.providerIds[0] ?? scene.id);
    return {
      ...scene,
      primaryMark: primary.mark,
      brandFrom: primary.from,
      brandTo: primary.to,
      brandInk: primary.ink,
      marks: scene.providerIds.map(markFor),
    };
  });

  return {
    headline: "BRANDED SCAN ROOM",
    terminalLines: [
      "+------------------------------------------------------+",
      "| VTK://HOME-SCAN-ROOM//ASCII-GUI//VIBERS-UNITE       |",
      "|------------------------------------------------------|",
      `| providers ${fit(PROVIDERS.length, 6)} built ${fit(built, 6)} verified ${fit(verified, 5)} |`,
      `| local     ${fit(local, 6)} creator ${fit(creator, 4)} scenes   ${fit(scenes.length, 5)} |`,
      "|------------------------------------------------------|",
      "| scan beats: Higgsfield / Codex / local lab / C0VIBE  |",
      "| every footer says usage, local_only, or not_usage    |",
      "+------------------------------------------------------+",
    ],
    metrics: [
      { label: "mapped sources", value: String(PROVIDERS.length), note: "Registry-backed coverage, not a fake adapter claim." },
      { label: "verified adapters", value: String(verified), note: "Endpoint or local-log evidence gets the green lane." },
      { label: "local runners", value: String(local), note: "Ollama, LM Studio, ComfyUI, logs, and loopback flows." },
      { label: "scan scenes", value: String(scenes.length), note: "Provider theatre moments, all labelled not usage." },
    ],
    scenes,
  };
}
