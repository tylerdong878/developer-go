import { describe, expect, it } from "vitest";
import { roads } from "./base";
import { distance } from "./geometry";
import { zebraCrossings } from "./streets";

describe("zebra crossings", () => {
  const stripes = zebraCrossings(roads);

  it("paints crossings on the four ways out of the roundabout", () => {
    for (const arm of [
      [0, -16],
      [16, 0],
      [-16, 0],
      [0, 16],
    ] as const) {
      expect(stripes.some((s) => distance(s.at, arm) < 8), `near ${arm}`).toBe(true);
    }
  });

  it("puts one at each arm of a downtown crossroads", () => {
    // the north avenue crosses the first downtown street at (0, -32)
    const near = stripes.filter((s) => distance(s.at, [0, -32]) < 10);
    const centers = new Set(near.map((s) => `${Math.round(s.at[0] / 4)},${Math.round(s.at[1] / 4)}`));
    expect(centers.size).toBeGreaterThanOrEqual(4);
  });

  it("keeps every stripe on a road", () => {
    for (const s of stripes) {
      const onRoad = roads.some((r) =>
        r.points.some((p, i) => {
          const q = r.points[i + 1];
          if (!q) return false;
          const ab = [q[0] - p[0], q[1] - p[1]];
          const t = Math.max(0, Math.min(1, ((s.at[0] - p[0]) * ab[0] + (s.at[1] - p[1]) * ab[1]) / (ab[0] ** 2 + ab[1] ** 2)));
          return distance(s.at, [p[0] + ab[0] * t, p[1] + ab[1] * t]) < r.width / 2;
        }),
      );
      expect(onRoad).toBe(true);
    }
  });
});
