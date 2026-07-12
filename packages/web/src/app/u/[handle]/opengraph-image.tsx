// Dynamic OpenGraph share image for public profiles: a calm dark card carrying the
// handle, maker identity, signal tier, and headline stats. Mirrors page.tsx data
// loading — the demo handle renders the bundled sample profile, honestly labelled.
// Satori constraints apply: inline styles, flexbox only, no external fonts.
import { ImageResponse } from "next/og";
import { getProfile } from "../../../lib/data";
import { buildDemoProfile, DEMO_HANDLE } from "../../../lib/demo-profile";
import { formatInt, formatUsd } from "../../../lib/leaderboard";
import { readComplexity, type ComplexityRead } from "../../../lib/profile-complexity";
import { PROVIDERS } from "../../../../../adapters/src/index";

export const runtime = "nodejs";
export const alt = "VibeUsage profile card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Inlined from ./panels.tsx CATEGORY_COLORS — that module is "use client" and an OG
// route must stay server-only, so the hexes are copied verbatim. Keep in lockstep.
const CATEGORY_COLORS: Record<string, string> = {
  coding: "#2ee8d6",
  llm: "#36e39b",
  image: "#ff4fd8",
  video: "#9f7cff",
  music: "#ffc64d",
  audio: "#ffc64d",
  "3d": "#ff7768",
  local: "#36e39b",
  other: "#7a8a93",
};

const INK = "#eef7f4";
const DIM = "rgba(238,247,244,0.55)";
const FAINT = "rgba(238,247,244,0.45)";

// Mirrors panels.tsx identityColor(): the activity identity picks the headline color.
function identityColor(identity: ComplexityRead["identity"]): string {
  if (identity.kind === "allrounder") return "#2ee8d6";
  if (identity.kind === "forming") return "#ffc64d";
  return CATEGORY_COLORS[identity.topCategory ?? "other"] ?? "#7a8a93";
}

export default async function Image({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const isDemo = handle === DEMO_HANDLE;
  const profile = isDemo ? buildDemoProfile() : await getProfile(handle);
  const read = profile ? readComplexity(profile, PROVIDERS) : null;
  const creditsSum = profile ? profile.providers.reduce((sum, p) => sum + p.credits, 0) : 0;
  const stats = profile && read
    ? [
        { label: "TOTAL SPENT", value: formatUsd(read.facts.usd) },
        { label: "CREDITS", value: formatInt(profile.latest?.total_credits ?? creditsSum) },
        { label: "DAYS", value: String(read.facts.days) },
        { label: "SOURCES", value: String(read.facts.providers) },
      ]
    : null;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", backgroundColor: "#040607", fontFamily: "sans-serif" }}>
        <div
          style={{
            flex: 1,
            margin: 48,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#0d1419",
            border: "1px solid rgba(46,232,214,0.24)",
            borderRadius: 20,
            padding: 56,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: "#2ee8d6" }}>VibeUsage</div>
            <div style={{ display: "flex", fontSize: 22, letterSpacing: 2, color: DIM }}>vibeusage.c0vibe.app</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{ display: "flex", fontSize: 72, fontWeight: 700, color: INK }}>{`@${handle}`}</div>
              {isDemo ? (
                <div
                  style={{
                    display: "flex",
                    border: "1px solid rgba(255,198,77,0.5)",
                    color: "#ffc64d",
                    borderRadius: 999,
                    padding: "6px 14px",
                    fontSize: 20,
                    letterSpacing: 2,
                  }}
                >
                  SAMPLE
                </div>
              ) : null}
            </div>
            {read ? (
              <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 20 }}>
                <div
                  style={{
                    display: "flex",
                    fontSize: 30,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    color: identityColor(read.identity),
                  }}
                >
                  {read.identity.label}
                </div>
                <div style={{ display: "flex", fontSize: 30, letterSpacing: 2, color: FAINT }}>{`·  ${read.tier} signal`}</div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  fontSize: 30,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: FAINT,
                  marginTop: 20,
                }}
              >
                no signal yet
              </div>
            )}
          </div>

          {stats ? (
            <div style={{ display: "flex", gap: 48 }}>
              {stats.map((stat) => (
                <div key={stat.label} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", fontSize: 20, letterSpacing: 2, color: DIM }}>{stat.label}</div>
                  <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: INK }}>{stat.value}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", fontSize: 24, letterSpacing: 1, color: DIM }}>
              track locally · upload when you choose
            </div>
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}
