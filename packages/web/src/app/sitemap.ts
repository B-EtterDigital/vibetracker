import type { MetadataRoute } from "next";

const BASE = "https://vibeusage.c0vibe.app";

// Every path below is a verified route directory in app/ (see the u/[handle]
// route for /u/demo). changeFrequency/priority are tuned by surface weight.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const weekly: Array<{ path: string; priority: number }> = [
    { path: "/providers", priority: 0.8 },
    { path: "/scan", priority: 0.8 },
    { path: "/life", priority: 0.8 },
    { path: "/insights", priority: 0.5 },
    { path: "/how-to", priority: 0.5 },
    { path: "/roadmap", priority: 0.5 },
    { path: "/contributors", priority: 0.5 },
    { path: "/sources", priority: 0.5 },
    { path: "/u/demo", priority: 0.5 },
  ];
  return [
    { url: BASE, lastModified, changeFrequency: "daily", priority: 1.0 },
    ...weekly.map((r) => ({
      url: `${BASE}${r.path}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: r.priority,
    })),
  ];
}
