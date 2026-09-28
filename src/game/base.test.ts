import { describe, expect, it } from "vitest";
import { mapObjects } from "@/content";
import { RADIUS, START, areas, onLand, roads, slots, trees, walkable } from "./base";
import { distance, pointInPolygon, type Vec2 } from "./geometry";

const kindOf = new Map(mapObjects.map((o) => [o.slug, o.kind]));
const towers = mapObjects.filter((o) => o.kind === "gym" || o.kind === "raid").map((o) => o.slug);

function distanceToRoad(p: Vec2) {
  let best = Infinity;
  for (const r of roads) {
    const n = r.loop ? r.points.length : r.points.length - 1;
    for (let i = 0; i < n; i++) {
      const a = r.points[i];
      const b = r.points[(i + 1) % r.points.length];
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz)));
      best = Math.min(best, Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dz)) - r.width / 2);
    }
  }
  return best;
}

describe("home base", () => {
  it("has exactly one spot for every map object", () => {
    expect(Object.keys(slots).sort()).toEqual(mapObjects.map((o) => o.slug).sort());
  });

  it("keeps every spot on dry land inside the base", () => {
    for (const [slug, p] of Object.entries(slots)) {
      expect(onLand(p), slug).toBe(true);
      expect(Math.hypot(...p), slug).toBeLessThan(RADIUS - 20);
    }
  });

  it("spreads things out so nothing overlaps", () => {
    const entries = Object.entries(slots);
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const [a, p] = entries[i];
        const [b, q] = entries[j];
        const min = towers.includes(a) && towers.includes(b) ? 18 : 6;
        expect(distance(p, q), `${a} / ${b}`).toBeGreaterThanOrEqual(min);
      }
    }
  });

  it("keeps gyms, raids, and stops off the streets", () => {
    for (const [slug, p] of Object.entries(slots)) {
      const kind = kindOf.get(slug);
      if (kind === "gym" || kind === "raid" || kind === "stop") {
        expect(distanceToRoad(p), slug).toBeGreaterThan(1.5);
      }
    }
  });

  it("makes you walk around Snorlax", () => {
    expect(walkable(slots.snorlax)).toBe(false);
    expect(walkable([slots.snorlax[0], slots.snorlax[1] + 4])).toBe(true);
  });

  it("starts the trainer on open ground at home", () => {
    expect(walkable(START)).toBe(true);
    expect(distance(START, [0, 0])).toBeLessThan(10);
  });

  it("never plants a tree in the water", () => {
    const water = areas.filter((a) => a.kind === "water");
    for (const t of trees) expect(water.some((w) => pointInPolygon(t, w.points))).toBe(false);
    expect(trees.length).toBeGreaterThan(40);
  });
});
