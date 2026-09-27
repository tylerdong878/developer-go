import { describe, expect, it } from "vitest";
import { mapObjects } from "@/content";
import { placeObjects } from "./objects";

const WORLD = 10_000;

describe("placeObjects", () => {
  const { onMap, signposts } = placeObjects(WORLD);

  it("places every object exactly once, on the map or on a signpost", () => {
    const placed = [...onMap.map((p) => p.object), ...signposts.flatMap((s) => s.objects)];
    expect(placed).toHaveLength(mapObjects.length);
    expect(new Set(placed).size).toBe(mapObjects.length);
  });

  it("puts southern markers last so they draw in front", () => {
    for (let i = 1; i < onMap.length; i++) {
      expect(onMap[i].y).toBeGreaterThanOrEqual(onMap[i - 1].y);
    }
  });

  it("points signposts the real way, out at the edge of the world", () => {
    const nyc = signposts.find((s) => s.id === "nyc")!;
    expect(nyc.x).toBeLessThan(0); // west
    expect(nyc.y).toBeGreaterThan(0); // south
    for (const s of signposts) {
      const r = Math.hypot(s.x, s.y);
      expect(r).toBeGreaterThan(WORLD * 0.85);
      expect(r).toBeLessThan(WORLD);
    }
  });

  it("keeps everything on the map inside the clear part of the world", () => {
    // squash(30 km) is about 10,850 map units; the fog starts at 88% of it.
    for (const p of placeObjects(10_850).onMap) {
      expect(Math.hypot(p.x, p.y), p.object.slug).toBeLessThan(10_850 * 0.88);
    }
  });
});
