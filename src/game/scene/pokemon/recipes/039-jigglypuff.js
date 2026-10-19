// Jigglypuff (#39). Checked against art-39, home-39, the GO icon (refs/go256-39.png, species/go-39.png) and the
// Showdown 3D front/back (ani-jigglypuff, ani-back-jigglypuff).
// Numbers: notes/research/species-2.md (Jigglypuff) plus the corrections in notes/research/model-starters.md.
// 1 tall (top of the curl to the soles), feet at y 0, facing +z, +x = Jigglypuff's own left (the viewer's right).
// GO pose: upright ball, arms out at the sides low down, feet tucked half under.
// What matters most: the curl (a thick lock rolling forward over the brow into a spiral, counterclockwise from the
// front) and the huge painted eyes (white, a thin dark rim, a big teal iris, no pupil).

const PINK = "#f4c4cf";
const INNER = "#2f343e";
const IRIS = "#00788a";
const SCLERA = "#f6f4f4";
const RIM = "#4a3a44";
const MOUTH = "#433337";

const C = [0, 0.51, 0]; // ball center
const R = 0.42;

// ---- small rotation helpers (three.js XYZ euler, same as the tool)
const rot = ([x = 0, y = 0, z = 0], [vx, vy, vz]) => {
  const a = Math.cos(x), b = Math.sin(x), c = Math.cos(y), d = Math.sin(y), e = Math.cos(z), f = Math.sin(z);
  const m = [c * e, -c * f, d, a * f + b * e * d, a * e - b * f * d, -b * c, b * f - a * e * d, b * e + a * f * d, a * c];
  return [m[0] * vx + m[1] * vy + m[2] * vz, m[3] * vx + m[4] * vy + m[5] * vz, m[6] * vx + m[7] * vy + m[8] * vz];
};
const place = (at, turn, v) => rot(turn, v).map((c, i) => c + at[i]);

// ---- the curl: a path drawn in the front view (x, y), each point pushed out onto the ball (plus lift * r),
// radius tapering from the thick root on top to the spiral's center. Counterclockwise from the front:
// up top, left over the brow, down, right along the bottom, up and in.
const CURL_2D = [
  // [x, y, r, lift]
  [0.1, 0.85, 0.095, -0.6],
  [0.06, 0.885, 0.115, -0.15],
  [-0.02, 0.885, 0.11, 0.1],
  [-0.09, 0.845, 0.095, 0.25],
  [-0.12, 0.78, 0.082, 0.32],
  [-0.1, 0.715, 0.07, 0.4],
  [-0.045, 0.678, 0.06, 0.45],
  [0.015, 0.685, 0.054, 0.5],
  [0.055, 0.722, 0.048, 0.6],
  [0.055, 0.768, 0.043, 0.75],
  [0.025, 0.785, 0.038, 0.9],
  [0.0, 0.768, 0.033, 1.05],
];
const onBall = (x, y, lift) => {
  const zz = R * R - x * x - (y - C[1]) * (y - C[1]);
  const n = [x, y - C[1], Math.sqrt(Math.max(0, zz))];
  const l = Math.hypot(...n);
  return [C[0] + (n[0] / l) * (R + lift), C[1] + (n[1] / l) * (R + lift), C[2] + (n[2] / l) * (R + lift)];
};
// Catmull-Rom through the path (4 samples per span) so the lock is one smooth tube, not a string of beads
const resample = (pts, sub = 4) => {
  const out = [];
  const g = (i) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  for (let i = 0; i < pts.length - 1; i++)
    for (let s = 0; s < sub; s++) {
      const t = s / sub, t2 = t * t, t3 = t2 * t;
      const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
      out.push(p1.map((_, k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  out.push(pts[pts.length - 1].slice());
  return out;
};
const CURL = resample(CURL_2D).map(([x, y, r, lift]) => [...onBall(x, y, lift * r), r]);

// ---- ears: big rounded triangles in the side plane of the head, tilted out ~43 degrees, faces forward
const EAR = [[-0.145, -0.04], [0.145, -0.04], [0.066, 0.15], [0.013, 0.27], [-0.013, 0.27], [-0.066, 0.15]];
const INNER_EAR = [[-0.095, 0.045], [0.095, 0.045], [0.044, 0.16], [0.009, 0.24], [-0.009, 0.24], [-0.044, 0.16]];
const EAR_AT = [0.29, 0.775, 0.0];
const EAR_TURN = [0, 0.15, -0.75];

const recipe = {
  name: "Jigglypuff",
  dex: 39,
  height: 1,
  bones: {
    root: [0, 0, 0],
    // the ball is the head: it turns and tilts as a whole, arms, ears and curl with it
    head: { at: [0, 0.2, 0], parent: "root" },
    earL: { at: EAR_AT, parent: "head" },
    earR: { at: [-EAR_AT[0], EAR_AT[1], EAR_AT[2]], parent: "head" },
    curl: { at: [0.02, 0.9, 0.1], parent: "head" },
    armL: { at: [0.33, 0.31, 0.12], parent: "head" },
    armR: { at: [-0.33, 0.31, 0.12], parent: "head" },
    footL: { at: [0.17, 0.08, 0.1], parent: "root" },
    footR: { at: [-0.17, 0.08, 0.1], parent: "root" },
  },
  pieces: [
    // a near-perfect ball
    { name: "ball", kind: "ellipsoid", at: C, r: [R, R, 0.4], color: PINK, bone: "head" },
    // the curl, a smooth chain hugging the brow, merged softly at its root
    { name: "curl", kind: "chain", points: CURL, smooth: 0.008, color: PINK, bone: "curl", blend: 0.02 },
    // ears
    { name: "ear", kind: "slab", outline: EAR, smooth: true, depth: 0.05, round: 0.02, at: EAR_AT, turn: EAR_TURN, color: PINK, bone: "earL", blend: 0.03, mirror: true },
    // short nub arms low on the sides, pointing out, a little forward and down
    { name: "arm", kind: "ellipsoid", at: [0.36, 0.3, 0.16], r: [0.085, 0.058, 0.06], turn: [0, -0.5, -0.3], color: PINK, bone: "armL", blend: 0.04, mirror: true },
    // chunky oval feet tucked half under the ball, toes out a little
    { name: "foot", kind: "ellipsoid", at: [0.165, 0.062, 0.16], r: [0.078, 0.062, 0.145], turn: [0, 0.2, 0], color: PINK, bone: "footL", blend: 0.035, mirror: true },
    { name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true },
  ],
  paint: [
    // the dark insides of the ears, front face only, set toward the tip
    { name: "innerEar", color: INNER, shape: { kind: "slab", outline: INNER_EAR, smooth: true, depth: 0.05, at: place(EAR_AT, EAR_TURN, [0, 0, 0.027]), turn: EAR_TURN }, bones: ["earL"], mirror: true },
  ],
  face: {
    // the two eyes are written out (no mirror): the glint sits in the upper right of both, like GO and HOME
    eyes: [-1, 1].map((s) => ({
      name: s < 0 ? "eyeR" : "eyeL",
      at: [s * 0.2, 0.53, 0.37],
      w: 0.24,
      h: 0.255,
      sclera: SCLERA,
      edge: { color: RIM, w: 0.07 },
      iris: IRIS,
      irisAt: [0, 0.13],
      irisSize: [0.75, 0.7],
      glints: [[0.3, 0.42, 0.24]],
    })),
    mouth: { kind: "smile", at: [0, 0.395, 0.4], w: 0.13, h: 0.025, thick: 0.007, color: MOUTH },
  },
};

export default recipe;
