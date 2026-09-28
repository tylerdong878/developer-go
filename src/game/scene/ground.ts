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
 * so curves stay smooth, and round caps on dead ends. `grow` widens every line
 * on both sides, for the darker edge drawn underneath.
 */
export function ribbonGeometry(lines: readonly Line[], grow = 0): BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const cap = ([cx, cz]: Vec2, r: number) => {
    const base = positions.length / 3;
    const steps = 32;
    positions.push(cx, 0, cz);
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      positions.push(cx + r * Math.cos(a), 0, cz + r * Math.sin(a));
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
    for (let i = 0; i < n; i++) {
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
    }
    const segments = loop ? n : n - 1;
    for (let i = 0; i < segments; i++) {
      const a = base + 2 * i;
      const b = base + 2 * ((i + 1) % n);
      indices.push(a, a + 1, b + 1, a, b + 1, b);
    }
    if (!loop) {
      cap(pts[0], r);
      cap(pts[n - 1], r);
    }
  }
  return build(positions, indices);
}

/** Outline ribbons that follow a polygon's edge (the foam line along the water). */
export function outlineGeometry(polygons: readonly (readonly Vec2[])[], width: number): BufferGeometry {
  return ribbonGeometry(polygons.map((points) => ({ points, width, loop: true })));
}

function build(positions: number[], indices: number[]) {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}
