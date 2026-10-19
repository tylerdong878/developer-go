// Torchic (#255). Checked against art-255, home-255, the GO icon (refs/go-255.png, species/go-255.png) and the
// Showdown 3D front/back (ani-torchic, ani-back-torchic).
// Numbers: notes/research/species-3.md (Torchic) plus the corrections in notes/research/model-starters.md.
// 1 tall (tip of the crest's middle feather to soles), feet at y 0, facing +z, +x = Torchic's own left (viewer's right).
// GO pose: standing upright, the crest standing straight up and fanned (HOME and the art lean it to one side).

const ORANGE = "#f5911f";
const YELLOW = "#f8d84a";
const BEAK = "#f6e48a";
const LEGS = "#f3e48c";
const IRIS = "#2d3152";
const DARK = "#1c1620";

// ---- small rotation helpers (three.js XYZ euler, same as the tool)
const rot = ([x = 0, y = 0, z = 0], [vx, vy, vz]) => {
  const a = Math.cos(x), b = Math.sin(x), c = Math.cos(y), d = Math.sin(y), e = Math.cos(z), f = Math.sin(z);
  const m = [c * e, -c * f, d, a * f + b * e * d, a * e - b * f * d, -b * c, b * f - a * e * d, b * e + a * f * d, a * c];
  return [m[0] * vx + m[1] * vy + m[2] * vz, m[3] * vx + m[4] * vy + m[5] * vz, m[6] * vx + m[7] * vy + m[8] * vz];
};
const place = (at, turn, v) => rot(turn, v).map((c, i) => c + at[i]);

// ---- crest: three flame-like leaf feathers fanned in the front plane, from one root on top of the head
const leaf = (L, W) => {
  const side = [[0.3, 0], [0.62, 0.12], [0.9, 0.3], [1, 0.48], [0.86, 0.66], [0.56, 0.82], [0.25, 0.93], [0, 1]].map(([u, v]) => [u * W, v * L]);
  return [[0, -0.05], ...side, ...side.slice(0, -1).reverse().map(([u, v]) => [-u, v])];
};
const CREST_AT = [0, 0.62, -0.01];
const FEATHERS = [
  // middle: tallest, nearly straight up, a touch to its left; sides fanned out ~40-45 degrees
  { name: "crestMid", L: 0.375, W: 0.072, tilt: -0.1 },
  { name: "crestL", L: 0.265, W: 0.052, tilt: -0.66, back: 0.05 },
  { name: "crestR", L: 0.26, W: 0.052, tilt: 0.64, back: 0.05 },
];

// ---- collar: a ring of spiky yellow feathers round the neck, longer tufts at the sides (the wings)
const collar = () => {
  const out = [];
  const N = 14;
  for (let i = 0; i < N; i++) {
    const t = (i / N) * 2 * Math.PI + 0.12;
    const s = Math.sin(t), c = Math.cos(t);
    const side = Math.abs(s) > 0.8; // the wing tufts get their own pieces
    if (side) continue;
    const base = [0.165 * s, 0.29, 0.03 + 0.145 * c];
    const tip = [0.235 * s, 0.215, 0.03 + 0.2 * c];
    out.push({ name: `collar${i}`, kind: "cone", a: base, b: tip, ra: 0.04, rb: 0.01, color: YELLOW, bone: "body", blend: 0.012 });
  }
  return out;
};
// wing tufts: three spikes fanned out and down at each side (+x side; mirror makes the other)
const WING_AT = [0.17, 0.27, 0.02];
const wing = () =>
  [[0.255, 0.245, 0.07], [0.27, 0.2, 0.02], [0.245, 0.165, -0.03]].map((tip, i) => ({
    name: `wing${i}`, kind: "cone", a: WING_AT, b: tip, ra: 0.042, rb: 0.01, color: YELLOW, bone: "wingL", blend: 0.012, mirror: true,
  }));

// ---- feet: three long front toes splayed, one back toe (+x foot)
const FOOT = [0.065, 0.016, 0.03];
const toes = () =>
  [[0.04, 0.0, 0.085], [0.0, 0.0, 0.095], [-0.035, 0.0, 0.08], [0.0, 0.0, -0.05]].map(([dx, , dz], i) => ({
    name: `toe${i}`, kind: "cone", a: FOOT, b: [FOOT[0] + dx, 0.012, FOOT[2] + dz], ra: 0.017, rb: 0.013, color: LEGS, bone: "legL", blend: 0.01, mirror: true,
  }));

const recipe = {
  name: "Torchic",
  dex: 255,
  height: 1,
  bones: {
    root: [0, 0, 0],
    body: { at: [0, 0.12, 0], parent: "root" },
    head: { at: [0, 0.3, 0.02], parent: "body" },
    crest: { at: CREST_AT, parent: "head" },
    wingL: { at: WING_AT, parent: "body" },
    wingR: { at: [-WING_AT[0], WING_AT[1], WING_AT[2]], parent: "body" },
    legL: { at: [0.06, 0.08, 0.01], parent: "root" },
    legR: { at: [-0.06, 0.08, 0.01], parent: "root" },
  },
  pieces: [
    // a small orange egg of a body under a much bigger head; the collar hides the join
    { name: "body", kind: "ellipsoid", at: [0, 0.165, 0.0], r: [0.15, 0.125, 0.135], color: ORANGE, bone: "body" },
    { name: "head", kind: "ellipsoid", at: [0, 0.47, 0.02], r: [0.245, 0.185, 0.215], color: ORANGE, bone: "head", blend: 0.06 },
    // the beak: a small flat pale bill, upper part broader, between and below the eyes
    { name: "beakTop", kind: "ellipsoid", at: [0, 0.386, 0.222], r: [0.062, 0.024, 0.054], turn: [0.25, 0, 0], color: BEAK, bone: "head", blend: 0.012 },
    { name: "beakLow", kind: "ellipsoid", at: [0, 0.366, 0.212], r: [0.04, 0.016, 0.036], turn: [0.15, 0, 0], color: BEAK, bone: "head", blend: 0.01 },
    // crest feathers and the little orange tuft at their root
    ...FEATHERS.map((f) => {
      const turn = [-0.12 - (f.back ?? 0), 0, f.tilt];
      return { name: f.name, kind: "slab", outline: leaf(f.L, f.W), smooth: true, depth: 0.045, round: 0.02, at: place(CREST_AT, turn, [0, 0.0, 0]), turn, color: YELLOW, bone: "crest", blend: 0.02 };
    }),
    { name: "tuftMid", kind: "cone", a: [0, 0.6, 0.07], b: [0.005, 0.73, 0.075], ra: 0.042, rb: 0.009, color: ORANGE, bone: "crest", blend: 0.02 },
    { name: "tuft", kind: "cone", a: [0.03, 0.6, 0.05], b: [0.065, 0.68, 0.06], ra: 0.026, rb: 0.007, color: ORANGE, bone: "crest", blend: 0.02, mirror: true },
    // the yellow collar and the wing tufts (near-hard joins keep the yellow edge crisp)
    { name: "collarRing", kind: "torus", R: 0.15, r: 0.038, at: [0, 0.29, 0.02], turn: [Math.PI / 2, 0, 0], scale: [1, 0.95, 1], color: YELLOW, bone: "body", blend: 0.012 },
    ...collar(),
    ...wing(),
    // short thin legs and splayed toes
    { name: "leg", kind: "cone", a: [0.06, 0.08, 0.01], b: FOOT, ra: 0.02, rb: 0.017, color: LEGS, bone: "legL", blend: 0.012, mirror: true },
    ...toes(),
    { name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true },
  ],
  face: {
    eyes: [
      // big glossy dark eyes set wide on the sides of the face, a blue-purple sheen low, a big glint up and out
      { at: [-0.126, 0.41, 0.2], w: 0.07, h: 0.09, sclera: DARK, iris: IRIS, irisAt: [0, -0.18], irisSize: [0.72, 0.6], glints: [[-0.2, 0.38, 0.4], [0.3, -0.5, 0.16]], mirror: true },
    ],
  },
};

export default recipe;
