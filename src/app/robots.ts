import type { MetadataRoute } from "next";

/** Everything's open to crawlers, and here's the map of it. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://developer-go.vercel.app/sitemap.xml",
  };
}
