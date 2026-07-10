import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

// Single-domain upload: vibeusage.c0vibe.app/api/ingest -> the Supabase ingest edge
// function. Set INGEST_EDGE_URL in the deploy env (e.g. https://<ref>.functions.supabase.co/ingest).
const EDGE = process.env.INGEST_EDGE_URL;
const projectRoot = fileURLToPath(new URL("../..", import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  async rewrites() {
    return EDGE ? [{ source: "/api/ingest", destination: EDGE }] : [];
  },
};

export default nextConfig;
