import type { Road } from "./base";
import type { Vec2 } from "./geometry";

/** A flat stripe on the ground: its center, the direction it runs (radians, from +x toward +z), length and width. */
export type Stripe = { at: Vec2; turn: number; length: number; width: number };

type Seg = { a: Vec2; b: Vec2; road: Road };

const sub = (a: Vec2, b: Vec2): Vec2 => [a[0] - b[0], a[1] - b[1]];
const len = (v: Vec2) => Math.hypot(v[0], v[1]);
const norm = (v: Vec2): Vec2 => {
  const l = len(v) || 1;
  return [v[0] / l, v[1] / l];
};

function segments(road: Road): Seg[] {
  const p = road.points;
  const out: Seg[] = [];
  const n = road.loop ? p.length : p.length - 1;
  for (let i = 0; i < n; i++) out.push({ a: p[i], b: p[(i + 1) % p.length], road });
  return out;
}

/** The closest point on a road to p, and how far it is. */
function closest(p: Vec2, road: Road) {
  let best = { d: Infinity, at: p as Vec2 };
  for (const { a, b } of segments(road)) {
    const ab = sub(b, a);
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1]) / (ab[0] ** 2 + ab[1] ** 2 || 1)));
    const at: Vec2 = [a[0] + ab[0] * t, a[1] + ab[1] * t];
    const d = len(sub(p, at));
    if (d < best.d) best = { d, at };
  }
  return best;
}

/** Where two segments cross (strictly inside both), if they do. */
function cross(s: Seg, t: Seg): Vec2 | null {
  const r = sub(s.b, s.a);
  const q = sub(t.b, t.a);
  const den = r[0] * q[1] - r[1] * q[0];
  if (Math.abs(den) < 1e-9) return null;
  const w = sub(t.a, s.a);
  const u = (w[0] * q[1] - w[1] * q[0]) / den;
  const v = (w[0] * r[1] - w[1] * r[0]) / den;
  if (u <= 0.01 || u >= 0.99 || v <= 0.01 || v >= 0.99) return null;
  return [s.a[0] + r[0] * u, s.a[1] + r[1] * u];
}

/** How far a road runs from a point on it in a direction (along the segment that holds the point). */
function reach(road: Road, at: Vec2, dir: Vec2) {
  for (const { a, b } of segments(road)) {
    const ab = sub(b, a);
    const l = len(ab);
    const t = ((at[0] - a[0]) * ab[0] + (at[1] - a[1]) * ab[1]) / (l * l || 1);
    const off = len(sub(at, [a[0] + ab[0] * t, a[1] + ab[1] * t]));
    if (t < -0.001 || t > 1.001 || off > 0.01) continue;
    const forward = (dir[0] * ab[0] + dir[1] * ab[1]) / l > 0;
    return forward ? (1 - t) * l : t * l;
  }
  return 0;
}

/**
 * Zebra crossings at every junction of the car roads (LGPE's big towns have
 * them; neither LGPE nor GO paints lane lines). Each arm leaving a junction
 * gets one, set back past the crossing road's edge: white stripes running
 * with the traffic, laid across the road. Not on the roundabout ring itself.
 */
export function zebraCrossings(roads: readonly Road[]): Stripe[] {
  const cars = roads.filter((r) => r.kind === "avenue" || r.kind === "street");
  const BAND = 2.4;
  const arms: { at: Vec2; dir: Vec2; road: Road; setback: number }[] = [];
  const arm = (road: Road, at: Vec2, dir: Vec2, other: Road) => {
    if (road.loop) return;
    const setback = other.width / 2 + 1.5 + BAND / 2;
    if (reach(road, at, dir) < setback + BAND / 2) return;
    arms.push({ at, dir, road, setback });
  };
  for (const a of cars) {
    // T-junctions: a road ending on another one
    if (!a.loop) {
      const ends: [Vec2, Vec2][] = [
        [a.points[0], a.points[1]],
        [a.points[a.points.length - 1], a.points[a.points.length - 2]],
      ];
      for (const [end, next] of ends) {
        for (const b of cars) {
          if (b === a) continue;
          const c = closest(end, b);
          if (c.d > b.width / 2 + 0.6) continue;
          arm(a, end, norm(sub(next, end)), b);
          const along = segments(b).find(({ a: p, b: q }) => {
            const t = closest(c.at, { ...b, points: [p, q], loop: false });
            return t.d < 0.01;
          });
          if (along) {
            const d = norm(sub(along.b, along.a));
            arm(b, c.at, d, a);
            arm(b, c.at, [-d[0], -d[1]], a);
          }
        }
      }
    }
    // crossroads: two roads crossing in the middle of both
    for (const b of cars) {
      if (b === a) continue;
      for (const s of segments(a))
        for (const t of segments(b)) {
          const at = cross(s, t);
          if (!at) continue;
          const d = norm(sub(s.b, s.a));
          arm(a, at, d, b);
          arm(a, at, [-d[0], -d[1]], b);
        }
    }
  }
  const out: Stripe[] = [];
  const centers: Vec2[] = [];
  for (const { at, dir, road, setback } of arms) {
    const c: Vec2 = [at[0] + dir[0] * setback, at[1] + dir[1] * setback];
    if (centers.some((o) => len(sub(o, c)) < 1)) continue;
    centers.push(c);
    const n: Vec2 = [-dir[1], dir[0]];
    const count = Math.floor((road.width - 0.6) / 1.0);
    for (let k = 0; k < count; k++) {
      const off = (k - (count - 1) / 2) * 1.0;
      out.push({ at: [c[0] + n[0] * off, c[1] + n[1] * off], turn: Math.atan2(dir[1], dir[0]), length: BAND, width: 0.5 });
    }
  }
  return out;
}
