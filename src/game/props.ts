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

/**
 * Signposts in the Let's Go style (notes/research/world-2.md), with our own
 * words in the games' two-line format: the town sign at home (a wide board
 * on two posts under an arched crest), route signs at the four roads out
 * (a white plate with a blue header on one post), and Trainer Tips.
 * `turn` is the way the sign faces (0 is +z).
 */
export type Signpost = { kind: "town" | "route" | "tips"; at: Vec2; turn: number; title: string; text: string };

export const signposts: Signpost[] = [
  { kind: "town", at: [0, -8.6], turn: 0, title: "DEVELOPER TOWN", text: "Where every gym is a job" },
  { kind: "route", at: [4.6, -21], turn: 0, title: "ROUTE 1", text: "HOME - DOWNTOWN" },
  { kind: "route", at: [22, 4.4], turn: -Math.PI / 2, title: "ROUTE 2", text: "HOME - HARBOR" },
  { kind: "route", at: [-22, -4.4], turn: Math.PI / 2, title: "ROUTE 3", text: "HOME - PARK" },
  { kind: "route", at: [-4.4, 20], turn: Math.PI, title: "ROUTE 4", text: "HOME - CAMPUS" },
  { kind: "tips", at: [6.5, 7.5], turn: 0, title: "TRAINER TIPS", text: "Walk up to anything and press E, or tap the prompt, to open it." },
  { kind: "tips", at: [-44.5, 4.5], turn: Math.PI / 2, title: "TRAINER TIPS", text: "Sparkly Pokémon know facts about Tyler. Catch one to find out!" },
  { kind: "tips", at: [44.5, -4.5], turn: -Math.PI / 2, title: "TRAINER TIPS", text: "PokéStops are Tyler's projects. Spin one for items!" },
];

/** Kanto's white post-and-rail fences, round the yards of the two Pallet houses at home. */
export const fences: [Vec2, Vec2][] = [
  [[-15.5, 18.6], [-15.5, 30.8]],
  [[-15.5, 30.8], [-5, 30.8]],
  [[15.5, 18.6], [15.5, 30.8]],
  [[15.5, 30.8], [5, 30.8]],
];
