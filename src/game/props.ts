import { buildings, roads, slots, START, trees, walkable } from "./base";
import type { Vec2 } from "./geometry";
import { distanceToBuilding } from "./lots";

/**
 * Street furniture: lampposts down both sides of the avenues and streets,
 * and benches facing the paths in the park and on the quad. Placed once from
 * the layout, clear of buildings, trees, and map objects.
 */
export type Prop = { at: Vec2; turn: number };

const roomy = (p: Vec2, gap: number) =>
  walkable(p) &&
  Math.hypot(p[0] - START[0], p[1] - START[1]) > 8 &&
  Object.values(slots).every(([x, z]) => Math.hypot(p[0] - x, p[1] - z) > gap) &&
  trees.every(([x, z]) => Math.hypot(p[0] - x, p[1] - z) > 2) &&
  buildings.every((b) => distanceToBuilding(p, b) > 0.8);

/** Points every `step` along a road's center line, with the direction it runs. */
function along(points: readonly Vec2[], loop: boolean | undefined, step: number) {
  const out: { at: Vec2; dir: Vec2 }[] = [];
  const n = loop ? points.length : points.length - 1;
  let carry = step / 2;
  for (let i = 0; i < n; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const dir: Vec2 = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
    for (let d = carry; d < len; d += step) out.push({ at: [a[0] + dir[0] * d, a[1] + dir[1] * d], dir });
    carry = (carry - len) % step;
    if (carry < 0) carry += step;
  }
  return out;
}

export const lamps: Prop[] = (() => {
  const out: Prop[] = [];
  for (const r of roads) {
    if (r.kind !== "avenue" && r.kind !== "street") continue;
    for (const { at, dir } of along(r.points, r.loop, 16)) {
      for (const side of [-1, 1]) {
        const off = r.width / 2 + 1;
        const p: Vec2 = [at[0] - dir[1] * off * side, at[1] + dir[0] * off * side];
        if (roomy(p, 3.5) && out.every((q) => Math.hypot(p[0] - q.at[0], p[1] - q.at[1]) > 9)) {
          out.push({ at: p, turn: Math.atan2(dir[1] * side, -dir[0] * side) });
        }
      }
    }
  }
  return out;
})();

export const benches: Prop[] = (() => {
  const out: Prop[] = [];
  for (const r of roads) {
    if (r.kind !== "path") continue;
    for (const { at, dir } of along(r.points, r.loop, 13)) {
      const off = r.width / 2 + 1.1;
      const p: Vec2 = [at[0] - dir[1] * off, at[1] + dir[0] * off];
      if (roomy(p, 4) && lamps.every((l) => Math.hypot(p[0] - l.at[0], p[1] - l.at[1]) > 3)) {
        out.push({ at: p, turn: Math.atan2(dir[1], -dir[0]) }); // facing the path
      }
    }
  }
  return out;
})();
