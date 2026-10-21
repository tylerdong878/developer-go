import { existsSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { media, raids, stops } from ".";

describe("project pictures", () => {
  it("belong to a real project or hackathon", () => {
    const slugs = new Set([...stops, ...raids].map((o) => o.slug));
    for (const slug of Object.keys(media)) expect(slugs.has(slug), slug).toBe(true);
  });

  it("are all there, small enough for a phone, and described", () => {
    for (const [slug, m] of Object.entries(media)) {
      for (const f of [m.src, m.disc, m.still].filter(Boolean) as string[]) {
        const path = `public${f}`;
        expect(existsSync(path), path).toBe(true);
        expect(statSync(path).size, path).toBeLessThan(1_200_000);
      }
      expect(m.alt.length, slug).toBeGreaterThan(20);
    }
  });
});
