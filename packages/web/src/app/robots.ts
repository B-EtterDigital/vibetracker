import type { MetadataRoute } from "next";

// Allow crawling everything public; keep the API surface out of the index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: "https://vibeusage.c0vibe.app/sitemap.xml",
  };
}
