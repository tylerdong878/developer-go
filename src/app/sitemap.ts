import type { MetadataRoute } from "next";

const SITE = "https://developer-go.vercel.app";

/** The three pages worth finding: the game, the plain version, and the resume. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/text`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE}/resume`, changeFrequency: "monthly", priority: 0.9 },
  ];
}
