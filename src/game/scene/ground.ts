import { BufferGeometry, Float32BufferAttribute, ShapeUtils, Vector2 } from "three";
import type { Vec2 } from "../geometry";

/** Flat triangles for polygons lying on the ground. */
export function polygonGeometry(polygons: readonly (readonly Vec2[])[]): BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  for (const points of polygons) {
    const base = positions.length / 3;
    const triangles = ShapeUtils.triangulateShape(
      points.map(([x, z]) => new Vector2(x, z)),
      [],
    );
    for (const [x, z] of points) positions.push(x, 0, z);
    for (const [a, b, c] of triangles) indices.push(base + a, base + b, base + c);
  }
  return build(positions, indices);
}

type Line = { points: readonly Vec2[]; width: number; loop?: boolean };

/**
 * Flat ribbons for roads and paths: one strip per line with mitered corners,
 * so curves stay smooth, and round caps on dead ends (`caps: false` for
 * ribbons whose ends run under something else). `grow` widens every line on
 * both sides, for the curb and sidewalk drawn underneath.
 *
 * Each vertex also gets `along` (meters from the line's start) and `across`
 * (-1 on the left edge, 1 on the right, 0 in the middle; 0 to 1 out from a
 * cap's center), so shaders can draw gutters, joints, planks and soft edges.
 */
export function ribbonGeometry(lines: readonly Line[], grow = 0, caps = true): BufferGeometry {
  const positions: number[] = [];
  const along: number[] = [];
  const across: number[] = [];
  const indices: number[] = [];
  const cap = ([cx, cz]: Vec2, r: number, at: number) => {
    const base = positions.length / 3;
    const steps = 32;
    positions.push(cx, 0, cz);
    along.push(at);
    across.push(0);
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      positions.push(cx + r * Math.cos(a), 0, cz + r * Math.sin(a));
      along.push(at);
      across.push(1);
      if (i > 0) indices.push(base, base + i, base + i + 1);
    }
  };
  const unit = (a: Vec2, b: Vec2): Vec2 => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
  };

  for (const line of lines) {
    const r = line.width / 2 + grow;
    const pts = line.points;
    const n = pts.length;
    const loop = !!line.loop;
    const base = positions.length / 3;
    let dist = 0;
    for (let i = 0; i < n; i++) {
      if (i > 0) dist += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      const prev = loop ? pts[(i - 1 + n) % n] : pts[Math.max(i - 1, 0)];
      const next = loop ? pts[(i + 1) % n] : pts[Math.min(i + 1, n - 1)];
      const into = i === 0 && !loop ? unit(pts[0], next) : unit(prev, pts[i]);
      const out = i === n - 1 && !loop ? into : unit(pts[i], next);
      // The miter points halfway between the two segments' normals, stretched
      // so the edges stay parallel (capped for sharp corners).
      let mx = -into[1] - out[1];
      let mz = into[0] + out[0];
      const ml = Math.hypot(mx, mz) || 1;
      mx /= ml;
      mz /= ml;
      const stretch = r / Math.max(0.5, mx * -out[1] + mz * out[0]);
      const [x, z] = pts[i];
      positions.push(x + mx * stretch, 0, z + mz * stretch, x - mx * stretch, 0, z - mz * stretch);
      along.push(dist, dist);
      across.push(-1, 1);
    }
    const segments = loop ? n : n - 1;
    for (let i = 0; i < segments; i++) {
      const a = base + 2 * i;
      const b = base + 2 * ((i + 1) % n);
      indices.push(a, a + 1, b + 1, a, b + 1, b);
    }
    if (!loop && caps) {
      cap(pts[0], r, 0);
      cap(pts[n - 1], r, dist);
    }
  }
  const geometry = build(positions, indices);
  geometry.setAttribute("along", new Float32BufferAttribute(along, 1));
  geometry.setAttribute("across", new Float32BufferAttribute(across, 1));
  return geometry;
}

/** Outline ribbons that follow a polygon's edge (the foam line along the water). */
export function outlineGeometry(polygons: readonly (readonly Vec2[])[], width: number): BufferGeometry {
  return ribbonGeometry(polygons.map((points) => ({ points, width, loop: true })));
}

/** Flat quads on the ground: each a center, a direction it runs (radians), its length along that and width across. */
export function quadsGeometry(quads: readonly { at: Vec2; turn: number; length: number; width: number }[]): BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  for (const { at, turn, length, width } of quads) {
    const base = positions.length / 3;
    const dx = Math.cos(turn);
    const dz = Math.sin(turn);
    const l = length / 2;
    const w = width / 2;
    for (const [a, c] of [
      [-l, -w],
      [l, -w],
      [l, w],
      [-l, w],
    ])
      positions.push(at[0] + dx * a - dz * c, 0, at[1] + dz * a + dx * c);
    indices.push(base, base + 2, base + 1, base, base + 3, base + 2);
  }
  return build(positions, indices);
}

function build(positions: number[], indices: number[]) {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}
