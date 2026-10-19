// Voltorb (#100). A ball, rose-crimson over cool gray, with two angry white triangle eyes sitting right on the seam.
// Verified against art-100, home-100, the GO icon pm100, Serebii's GO render go-100 and the Showdown 3D front/back.
// Numbers: notes/research/species-3.md (Voltorb), corrections in notes/research/model-facts-1.md.
// 1 tall, resting on y 0, facing +z, +x = Voltorb's own left (the viewer's right).
// Everything but the ball is paint or face decals: the seam, the eyes and their rims are crisp paint edges
// (half spaces and flat polygons, which interpolate exactly), the slit pupils and frown creases are face decals.

const RED = "#e0284e";
const WHITE = "#e1e3ea";
const EYE = "#f6f6f6";
const DARK = "#1c1620";

const C = [0, 0.5, 0];
const R = 0.5;
const D = Math.PI / 180;

// ---- small vector helpers
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const nrm = (v) => {
  const l = Math.hypot(...v);
  return v.map((c) => c / l);
};
/** A point on the ball at longitude lon (deg, from +z toward +x) and latitude lat (deg), pushed out by `out`. */
const onBall = (lon, lat, out = 0) => [
  C[0] + (R + out) * Math.cos(lat * D) * Math.sin(lon * D),
  C[1] + (R + out) * Math.sin(lat * D),
  C[2] + (R + out) * Math.cos(lat * D) * Math.cos(lon * D),
];
/** Tangent frame at a ball point: u across (toward +x), v up, n out. */
const frameAt = (p) => {
  const n = nrm(sub(p, C));
  const u = nrm(crs([0, 1, 0], n));
  return { p, n, u, v: crs(n, u) };
};
/** Euler XYZ (three.js order) that turns local x, y, z onto X, Y, Z. */
const eulerOf = (X, Y, Z) => {
  const y = Math.asin(Math.max(-1, Math.min(1, Z[0])));
  return Math.abs(Z[0]) < 0.9999 ? [Math.atan2(-Z[1], Z[2]), y, Math.atan2(-Y[0], X[0])] : [Math.atan2(Y[2], Y[1]), y, 0];
};
/** Offset a convex polygon outward, edge i (pts[i] -> pts[i+1]) by offs[i]. */
const grow = (pts, offs) => {
  const n = pts.length;
  let area = 0;
  for (let i = 0; i < n; i++) area += pts[i][0] * pts[(i + 1) % n][1] - pts[(i + 1) % n][0] * pts[i][1];
  const s = area > 0 ? 1 : -1; // CCW: outward normal is (dy, -dx)
  const lines = pts.map((a, i) => {
    const b = pts[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
    const nx = (s * dy) / l, ny = (-s * dx) / l;
    return { p: [a[0] + nx * offs[i], a[1] + ny * offs[i]], d: [dx / l, dy / l] };
  });
  const out = [];
  pts.forEach((p, i) => {
    const j = (i - 1 + n) % n, A = lines[j], B = lines[i];
    const den = A.d[0] * B.d[1] - A.d[1] * B.d[0];
    const t = ((B.p[0] - A.p[0]) * B.d[1] - (B.p[1] - A.p[1]) * B.d[0]) / den;
    const q = [A.p[0] + A.d[0] * t, A.p[1] + A.d[1] * t];
    // sharp corners (the inner tip) get a bevel instead of a long miter spike
    if (Math.hypot(q[0] - p[0], q[1] - p[1]) > 2 * Math.max(offs[j], offs[i])) {
      const nA = [A.d[1] * s, -A.d[0] * s], nB = [B.d[1] * s, -B.d[0] * s];
      out.push([p[0] + nA[0] * offs[j] + A.d[0] * 0.004, p[1] + nA[1] * offs[j] + A.d[1] * 0.004]);
      out.push([p[0] + nB[0] * offs[i] - B.d[0] * 0.004, p[1] + nB[1] * offs[i] - B.d[1] * 0.004]);
    } else out.push(q);
  });
  return out;
};

// ---- the eye on the viewer's right (Voltorb's own left, +x); mirror: true makes the other one.
// Landmarks (lon, lat in degrees) from the GO render and HOME: a right triangle, short vertical outer edge,
// a bottom edge sloping gently down to the inner tip, and the long angry top edge.
const TIP = [10, 4], OUT_LO = [41, 9], OUT_HI = [41, 29];
const EYE_C = frameAt(onBall(28, 14));
const to2d = ([lon, lat]) => {
  const q = sub(onBall(lon, lat), EYE_C.p);
  return [dot(q, EYE_C.u), dot(q, EYE_C.v)];
};
const TRI = [TIP, OUT_LO, OUT_HI].map(to2d);
// dark rim: heaviest along the brow (edge OUT_HI -> TIP is index 2)
const RIM = grow(TRI, [0.007, 0.008, 0.017]);
const EYE_TURN = eulerOf(EYE_C.u, EYE_C.v, EYE_C.n);
const EYE_AT = onBall(28, 14, -0.02);

// pupil: a thin vertical slit hanging from the brow, 62% of the way from the outer edge to the tip
const slit = (() => {
  const [t, lo, hi] = TRI;
  const k = 0.62;
  const x = hi[0] + (t[0] - hi[0]) * k;
  const top = hi[1] + (t[1] - hi[1]) * k; // brow line at x
  const len = 0.05;
  const y = top - len / 2 + 0.004;
  const p = EYE_C.p.map((c, i) => c + EYE_C.u[i] * x + EYE_C.v[i] * y);
  return { at: p, len };
})();

// frown crease (viewer's right one): from just above the eye's inner tip up and in toward the middle
const CREASE = (() => {
  const a = onBall(8, 7), b = onBall(4.2, 16.5);
  const m = onBall(6.1, 11.75);
  const F = frameAt(m);
  const d = sub(b, a);
  const dx = dot(d, F.u), dy = dot(d, F.v);
  return { at: m, turn: Math.atan2(dy, dx), w: Math.hypot(dx, dy) };
})();

const recipe = {
  name: "Voltorb",
  dex: 100,
  height: 1,
  bones: {
    root: [0, 0, 0],
    body: { at: C, parent: "root" }, // roll and rock about the center
  },
  pieces: [
    { name: "ball", kind: "sphere", at: C, r: R, color: RED, bone: "body" },
    // a hidden core with a wide blend: it never reaches the surface (0.3 away, blend 0.2), but the mesher sizes its cells
    // by the widest blend, so this coarsens the grid ~10% and keeps the ball under 15k vertices. The ball has no fine
    // geometry; all its detail is paint and decals, which stay exact at any cell size.
    { name: "core", kind: "sphere", at: C, r: 0.2, color: RED, bone: "body", blend: 0.2 },
  ],
  paint: [
    // the seam: a hairline (1% of the diameter) between two half spaces, so both edges stay exact
    { name: "seam", color: DARK, shape: { kind: "half", at: [0, C[1] + 0.006, 0], dir: [0, -1, 0] } },
    { name: "white", color: WHITE, shape: { kind: "half", at: [0, C[1] - 0.005, 0], dir: [0, -1, 0] } },
    // eyes: a dark rim polygon, the white triangle inside it
    { name: "eyeRim", color: DARK, shape: { kind: "slab", outline: RIM, depth: 0.14, at: EYE_AT, turn: EYE_TURN }, mirror: true },
    { name: "eye", color: EYE, shape: { kind: "slab", outline: TRI, depth: 0.14, at: EYE_AT, turn: EYE_TURN }, mirror: true },
  ],
  face: {
    spots: [
      // vertical slit pupils
      { name: "pupil", at: slit.at, r: [0.0065, slit.len / 2], color: DARK, lit: false, mirror: true },
    ],
    mouths: [
      // two short frown creases rising from the inner tips, leaning in and bowed toward each other: ")(" (HOME close-up)
      { kind: "frown", ...CREASE, h: 0.008, thick: 0.0055, color: DARK, mirror: true },
    ],
  },
};

export default recipe;
