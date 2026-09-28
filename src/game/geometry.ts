/** A point on the ground: x is east, z is south (three.js style, so north is -z). */
export type Vec2 = readonly [x: number, z: number];

export function distance(a: Vec2, b: Vec2) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

/** Even-odd ray cast. */
export function pointInPolygon(p: Vec2, polygon: readonly Vec2[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, zi] = polygon[i];
    const [xj, zj] = polygon[j];
    if (zi > p[1] !== zj > p[1] && p[0] < ((xj - xi) * (p[1] - zi)) / (zj - zi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** Deterministic PRNG (mulberry32), so the layout is the same on every load. */
export function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function circle(cx: number, cz: number, r: number, n = 32): Vec2[] {
  return ellipse(cx, cz, r, r, n);
}

export function ellipse(cx: number, cz: number, rx: number, rz: number, n = 32): Vec2[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [cx + rx * Math.cos(a), cz + rz * Math.sin(a)] as const;
  });
}

/** An organic blob: a circle with a smooth, seeded wobble on its radius. */
export function blob(cx: number, cz: number, r: number, wobble: number, seed: number, n = 28): Vec2[] {
  const rand = random(seed);
  const phase = [rand() * 6.28, rand() * 6.28, rand() * 6.28];
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const k =
      1 +
      wobble *
        (0.5 * Math.sin(2 * a + phase[0]) + 0.3 * Math.sin(3 * a + phase[1]) + 0.2 * Math.sin(5 * a + phase[2]));
    return [cx + r * k * Math.cos(a), cz + r * k * Math.sin(a)] as const;
  });
}

export function rect(cx: number, cz: number, w: number, h: number): Vec2[] {
  return [
    [cx - w / 2, cz - h / 2],
    [cx + w / 2, cz - h / 2],
    [cx + w / 2, cz + h / 2],
    [cx - w / 2, cz + h / 2],
  ];
}
