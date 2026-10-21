import type { MetadataRoute } from "next";
import { gyms, raids, stops } from "@/content";

const SITE = "https://developer-go.vercel.app";

/** The pages worth finding: the game, the plain version, the resume, and a page for each job, project and hackathon. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/text`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE}/resume`, changeFrequency: "monthly", priority: 0.9 },
    ...[...gyms, ...stops, ...raids].map((o) => ({ url: `${SITE}/w/${o.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
