import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

// Single-domain upload: vibeusage.c0vibe.app/api/ingest -> the Supabase ingest edge
// function. Set INGEST_EDGE_URL in the deploy env (e.g. https://<ref>.functions.supabase.co/ingest).
const EDGE = process.env.INGEST_EDGE_URL;
const projectRoot = fileURLToPath(new URL("../..", import.meta.url));

const nextConfig: NextConfig = {
  // Keep titles and descriptions in the initial <head> for audits, link unfurlers, and
  // clients that do not execute Next's streamed metadata scripts.
  htmlLimitedBots: /.*/,
  turbopack: {
    root: projectRoot,
  },
  async rewrites() {
    return EDGE ? [{ source: "/api/ingest", destination: EDGE }] : [];
  },
  // Framing: only C0VIBE surfaces may embed (the /u/ "Vibe Usage" tab).
  // Set here, not netlify.toml — the Next runtime serves SSR/ISR responses
  // itself, so netlify [[headers]] never reach them.
  async headers() {
    return [{
      source: "/:path*",
      headers: [{
        key: "Content-Security-Policy",
        value: "frame-ancestors 'self' https://c0vibe.app https://*.c0vibe.app https://c0x-web.netlify.app",
      }],
    }];
  },
};

export default nextConfig;
