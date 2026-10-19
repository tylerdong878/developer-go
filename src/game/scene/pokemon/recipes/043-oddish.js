// Oddish (#43). Shape from the GO icon (go256-43), HOME, art and the Showdown 3DS front/back; colors from species-1.md.
// 1 tall (center leaf tip to soles), feet at y 0, facing +z, +x = Oddish's own left (the viewer's right).
// GO pose: standing on two short stubby legs with flat feet (not the art's dangling mid-hop legs), five leaves in a
// rosette: from the front a symmetric fan (0, +-32, +-64 deg), and every leaf also sweeps back.

const BLUE = "#5f9fc8";
const FEET = "#4f86ad";
const LEAF = "#4fb33c";
const TIP = "#a8e878";
const RIB = "#2f7a2a";
const IRIS = "#f06a78";
const DARK = "#1c1620";

// ---- small vector helpers (euler XYZ, three.js order, same as the tool)
const nrm = (v) => { const l = Math.hypot(...v); return v.map((c) => c / l); };
const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const rot = ([x = 0, y = 0, z = 0], [vx, vy, vz]) => {
  const a = Math.cos(x), b = Math.sin(x), c = Math.cos(y), d = Math.sin(y), e = Math.cos(z), f = Math.sin(z);
  const m = [c * e, -c * f, d, a * f + b * e * d, a * e - b * f * d, -b * c, b * f - a * e * d, b * e + a * f * d, a * c];
  return [m[0] * vx + m[1] * vy + m[2] * vz, m[3] * vx + m[4] * vy + m[5] * vz, m[6] * vx + m[7] * vy + m[8] * vz];
};
const place = (at, turn, v) => rot(turn, v).map((c, i) => c + at[i]);
/** Turn (euler XYZ) whose local +y points along d and whose face (local +z) turns as far toward n0 as it can, then twists by tw. */
const aim = (d, tw = 0, n0 = [0, 0.35, 1]) => {
  const Y = nrm(d);
  const k = n0[0] * Y[0] + n0[1] * Y[1] + n0[2] * Y[2];
  let Z = nrm(n0.map((c, i) => c - k * Y[i]));
  let X = crs(Y, Z);
  const c = Math.cos(tw), s = Math.sin(tw);
  [X, Z] = [X.map((v, i) => v * c + Z[i] * s), Z.map((v, i) => -X[i] * s + v * c)];
  // columns X, Y, Z -> euler XYZ
  const m11 = X[0], m12 = Y[0], m13 = Z[0], m22 = Y[1], m23 = Z[1], m32 = Y[2], m33 = Z[2];
  const y = Math.asin(Math.max(-1, Math.min(1, m13)));
  return Math.abs(m13) < 0.9999 ? [Math.atan2(-m23, m33), y, Math.atan2(-m12, m11)] : [Math.atan2(m32, m22), y, 0];
};
/** Direction from tilt off vertical (th) and azimuth (ph, 0 = straight back, + toward +x). */
const dir = (th, ph) => [Math.sin(th) * Math.sin(ph), Math.cos(th), -Math.sin(th) * Math.cos(ph)];
const D = Math.PI / 180;

// Leaf: a long pointed blade, widest about a third up, base sunk into the crown. +v runs base to tip.
const leafOutline = (L, W) => {
  const side = [[0.35, 0], [0.8, 0.1], [1, 0.3], [1, 0.45], [0.9, 0.6], [0.7, 0.75], [0.42, 0.88], [0.12, 0.98], [0, 1]].map(([u, v]) => [u * W, v * L]);
  return [[0, -0.04], ...side, ...side.slice(0, -1).reverse().map(([u, v]) => [-u, v])];
};
// The lime tip with a ragged lower edge (GO and the art both have the jagged boundary).
const tipOutline = (L, W) => [
  [-W * 1.4, L * 1.2], [W * 1.4, L * 1.2], [W * 1.4, L * 0.74], [W * 0.55, L * 0.78], [W * 0.3, L * 0.71], [0, L * 0.79],
  [-W * 0.3, L * 0.72], [-W * 0.55, L * 0.79], [-W * 1.4, L * 0.75],
];
const ribOutline = (L) => [[-0.008, -0.02], [0.008, -0.02], [0.003, L * 0.9], [-0.003, L * 0.9]];

const BASE = [0, 0.425, -0.03];
// th: lean off vertical, ph: azimuth from straight back toward +x, tw: twist about the blade axis
const LEAVES = [
  { name: "leafMid", th: 20 * D, ph: 0, tw: 0, L: 0.6, W: 0.1 },
  { name: "leafInL", th: 40 * D, ph: 58 * D, tw: 0, L: 0.58, W: 0.105 },
  { name: "leafOutL", th: 66 * D, ph: 76 * D, tw: 0, L: 0.54, W: 0.1 },
];
const turnOf = (l) => aim(dir(l.th, l.ph), l.tw);
const atOf = (l) => place(BASE, turnOf(l), [0, -0.02, 0]);

const recipe = {
  name: "Oddish",
  dex: 43,
  height: 1,
  bones: {
    root: [0, 0, 0],
    body: { at: [0, 0.12, 0], parent: "root" },
    leafMid: { at: BASE, parent: "body" },
    leafInL: { at: BASE, parent: "body" },
    leafInR: { at: BASE, parent: "body" },
    leafOutL: { at: BASE, parent: "body" },
    leafOutR: { at: BASE, parent: "body" },
    legL: { at: [0.085, 0.14, 0], parent: "root" },
    legR: { at: [-0.085, 0.14, 0], parent: "root" },
  },
  pieces: [
    // body: a squat ball, a little wider than tall, narrowing at the crown where the leaves come out
    { name: "body", kind: "ellipsoid", at: [0, 0.275, 0], r: [0.24, 0.185, 0.22], color: BLUE, bone: "body" },
    { name: "crown", kind: "ellipsoid", at: [0, 0.41, -0.015], r: [0.125, 0.075, 0.115], color: BLUE, bone: "body", blend: 0.08 },
    // short stubby legs and flat feet, toes out a little
    { name: "leg", kind: "cone", a: [0.085, 0.15, 0.0], b: [0.11, 0.05, 0.03], ra: 0.05, rb: 0.042, color: BLUE, bone: "legL", blend: 0.03, mirror: true },
    { name: "foot", kind: "ellipsoid", at: [0.125, 0.035, 0.05], r: [0.068, 0.036, 0.1], turn: [0, 0.4, 0], color: FEET, bone: "legL", blend: 0.025, mirror: true },
    // five leaves (mirror: the inner and outer pairs)
    ...LEAVES.map((l) => ({
      name: l.name, kind: "slab", outline: leafOutline(l.L, l.W), smooth: true, depth: 0.05, round: 0.014, taper: 0.05,
      at: atOf(l), turn: turnOf(l), color: LEAF, bone: l.name, blend: 0.018, mirror: l.ph !== 0,
    })),
    { name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true },
  ],
  paint: [
    ...LEAVES.map((l) => ({
      name: `${l.name}Tip`, color: TIP, shape: { kind: "slab", outline: tipOutline(l.L, l.W), depth: 0.2, at: atOf(l), turn: turnOf(l) },
      bones: [l.name], mirror: l.ph !== 0,
    })),
    ...LEAVES.map((l) => ({
      name: `${l.name}Rib`, color: RIB, shape: { kind: "slab", outline: ribOutline(l.L), depth: 0.2, at: atOf(l), turn: turnOf(l) },
      bones: [l.name], mirror: l.ph !== 0,
    })),
  ],
  face: {
    eyes: [
      // tiny: a dark rim round a pink-red iris, one white glint up and toward the nose
      { at: [-0.09, 0.375, 0.18], w: 0.046, h: 0.052, sclera: DARK, iris: IRIS, irisAt: [0, 0], irisSize: [0.74, 0.76], glint: [0.3, 0.35, 0.32], mirror: true },
    ],
    mouth: { kind: "smile", at: [0, 0.322, 0.21], w: 0.05, h: 0.016, thick: 0.007, color: DARK },
  },
};

export default recipe;
