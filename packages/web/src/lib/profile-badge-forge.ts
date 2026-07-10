import type { ProfileView } from "./data.ts";
import { providerBrand } from "./provider-brand.ts";
import { buildVibeScoreReceipt } from "./vibe-score.ts";

export type ProfileBadgeTone = "score" | "source" | "terminal" | "trust" | "publish";
export type ProfileBadgeImpact = "score" | "usage" | "not_usage" | "publish";

export interface ProfileBadgeCard {
  id: "score_badge" | "source_badge" | "terminal_sig" | "trust_badge" | "publish_link";
  label: string;
  value: string;
  code: string;
  note: string;
  tone: ProfileBadgeTone;
  impact: ProfileBadgeImpact;
  meter: number;
  mark: string;
  from: string;
  to: string;
  ink: string;
}

export interface ProfileBadgeSnippet {
  id: "plain" | "markdown" | "html" | "svg_badge";
  label: string;
  value: string;
}

export interface ProfileBadgeForge {
  headline: string;
  subline: string;
  profileUrl: string;
  terminalLines: string[];
  cards: ProfileBadgeCard[];
  snippets: ProfileBadgeSnippet[];
}

function int(value: number | null | undefined): string {
  return Number(value ?? 0).toLocaleString("en-US");
}

function usd(value: number | null | undefined): string {
  return `$${Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function fit(value: string | number, width: number): string {
  return String(value).padEnd(width).slice(0, width);
}

function frameLine(value: string): string {
  return `| ${fit(value, 60)} |`;
}

function profilePath(handle: string): string {
  return `/u/${encodeURIComponent(handle)}`;
}

function profileUrl(handle: string): string {
  return `https://c0vibe.app${profilePath(handle)}`;
}

function commandHandle(handle: string): string {
  const cleaned = handle.replace(/^@/, "");
  return /^[a-zA-Z0-9._-]+$/.test(cleaned) ? cleaned : encodeURIComponent(cleaned);
}

function topProvider(profile: ProfileView): ProfileView["providers"][number] | undefined {
  return profile.providers.slice().sort((a, b) => b.usd - a.usd || b.ops - a.ops || a.provider.localeCompare(b.provider))[0];
}

function activeDays(profile: ProfileView): number {
  return profile.usageDays.filter((day) => day.ops > 0 || day.usd > 0).length || (profile.latest ? 1 : 0);
}

export function buildProfileBadgeForge(profile: ProfileView): ProfileBadgeForge {
  const receipt = buildVibeScoreReceipt(profile);
  const latest = profile.latest;
  const top = topProvider(profile);
  const topBrand = top ? providerBrand(top.provider) : providerBrand("c0vibe");
  const c0vibe = providerBrand("c0vibe");
  const trustCount = profile.trustSignals.length;
  const days = activeDays(profile);
  const url = profileUrl(profile.handle);
  const totalOps = latest?.record_count ?? 0;
  const totalUsd = latest?.total_usd ?? 0;
  const shareLine = latest
    ? `@${profile.handle} // ${receipt.score}/100 // ${int(totalOps)} ops // ${usd(totalUsd)} est. // Vibers Unite`
    : `@${profile.handle} // waiting for reviewed AI usage // Vibers Unite`;
  const markdown = `[${shareLine}](${url})`;
  const html = `<a href="${url}">${shareLine}</a>`;
  const badgeCommand = `npx vibetrack badge --out ./vibetracker-badge.svg --handle ${commandHandle(profile.handle)} --markdown`;

  const cards: ProfileBadgeCard[] = [
    {
      id: "score_badge",
      label: "Score badge",
      value: `${receipt.score}/100`,
      code: `C0VIBE SCORE ${receipt.score}/100`,
      note: latest ? `${receipt.tier} profile receipt from reviewed aggregates.` : "Lights up after the first reviewed usage upload.",
      tone: "score",
      impact: "score",
      meter: receipt.score,
      mark: "VS",
      from: "#2ee8d6",
      to: "#36e39b",
      ink: "#071013",
    },
    {
      id: "source_badge",
      label: "Source badge",
      value: top?.provider ?? "waiting",
      code: top ? `${top.provider.toUpperCase()} ${int(top.ops)} OPS ${usd(top.usd)}` : "NO PROVIDER ROWS YET",
      note: top ? `${top.provider} leads the public provider mix.` : "Provider badge waits for source rows.",
      tone: "source",
      impact: "usage",
      meter: top && totalUsd > 0 ? clamp((top.usd / totalUsd) * 100, 12) : top ? 18 : 8,
      mark: topBrand.mark,
      from: topBrand.from,
      to: topBrand.to,
      ink: topBrand.ink,
    },
    {
      id: "terminal_sig",
      label: "Terminal signature",
      value: `${int(totalOps)} ops`,
      code: shareLine,
      note: `${int(days)} active day${days === 1 ? "" : "s"} shown as public aggregate rhythm.`,
      tone: "terminal",
      impact: "usage",
      meter: latest ? clamp(18 + days * 7) : 8,
      mark: "VT",
      from: "#7c9cff",
      to: "#2ee8d6",
      ink: "#ffffff",
    },
    {
      id: "trust_badge",
      label: "Trust badge",
      value: `${int(trustCount)} signal${trustCount === 1 ? "" : "s"}`,
      code: `NOT USAGE // ${int(trustCount)} TRUST SIGNALS`,
      note: "Trust evidence is profile context only. It never changes spend, credits, ops, or rank.",
      tone: "trust",
      impact: "not_usage",
      meter: trustCount ? clamp(22 + trustCount * 18) : 8,
      mark: "NO",
      from: "#ffc64d",
      to: "#ff4fd8",
      ink: "#071013",
    },
    {
      id: "publish_link",
      label: "C0VIBE link",
      value: "c0vibe.app",
      code: url,
      note: latest ? "Share link points at the reviewed public profile." : "Draft profile link waits for a reviewed upload.",
      tone: "publish",
      impact: "publish",
      meter: latest ? 100 : 16,
      mark: c0vibe.mark,
      from: c0vibe.from,
      to: c0vibe.to,
      ink: c0vibe.ink,
    },
  ];

  return {
    headline: latest ? `Share @${profile.handle} without losing proof boundaries` : `Prepare @${profile.handle} for the first share`,
    subline: latest
      ? "Every badge is derived from the same public aggregate profile. Trust stays visibly separate from usage."
      : "The forge shows the final share shell now and fills usage badges after a reviewed upload.",
    profileUrl: url,
    terminalLines: [
      "+--------------------------------------------------------------+",
      frameLine(`VTK://BADGE-FORGE//@${profile.handle}//C0VIBE.APP`),
      "|--------------------------------------------------------------|",
      frameLine(`share ${shareLine}`),
      frameLine(`url   ${url}`),
      frameLine(`badge ${badgeCommand}`),
      frameLine(`trust ${int(trustCount)} NOT USAGE // separate context`),
      frameLine("motto Vibers Unite // c0vibe.app"),
      "+--------------------------------------------------------------+",
    ],
    cards,
    snippets: [
      { id: "plain", label: "Plain text", value: shareLine },
      { id: "markdown", label: "Markdown", value: markdown },
      { id: "html", label: "HTML", value: html },
      { id: "svg_badge", label: "SVG badge", value: badgeCommand },
    ],
  };
}
