// Magikarp (#129). Upright side-on fish (the art and HOME pose; GO flops it from this rest pose): a plump red-orange
// oval, the gaping pink O mouth, blank white eyes, a yellow crown dorsal fin, white tail fan and pectorals with
// red-orange frames, yellow spiky belly fins, and two long whiskers drooping to the ground in an S.
// Verified against art-129, home-129, the GO icon (go256-129) and the Showdown sprites ani-magikarp / aniback-magikarp.
// Numbers: notes/research/species-1.md (Magikarp) plus the corrections in notes/research/model-wild-1.md.
// 1 tall (dorsal tip to whisker tips), whiskers and belly fins at y 0, facing +z, +x = its own left (viewer's right).

const BODY = "#f2603a";
const LIPS = "#ee8a9a";
const WHISKER = "#f2d478";
const YELLOW = "#f6d36a";
const WHITE = "#f4f2f2";
const RAY = "#c9c4c4";
const MOUTH = "#5a1e26";
const DARK = "#1c1620";

// turn([axis, angle], ...): rotations about the model axes, applied in the order given, as an XYZ euler.
const turn = (...ops) => {
  let m = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  for (const [ax, t] of ops) {
    const c = Math.cos(t), s = Math.sin(t);
    const r = ax === "x" ? [1, 0, 0, 0, c, -s, 0, s, c] : ax === "y" ? [c, 0, s, 0, 1, 0, -s, 0, c] : [c, -s, 0, s, c, 0, 0, 0, 1];
    const o = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) o.push(r[i * 3] * m[j] + r[i * 3 + 1] * m[3 + j] + r[i * 3 + 2] * m[6 + j]);
    m = o;
  }
  const y = Math.asin(Math.max(-1, Math.min(1, m[2])));
  return Math.abs(m[2]) < 0.9999999 ? [Math.atan2(-m[5], m[8]), y, Math.atan2(-m[1], m[0])] : [Math.atan2(m[7], m[4]), y, 0];
};
function rot([x = 0, y = 0, z = 0], [vx, vy, vz]) {
  const a = Math.cos(x), b = Math.sin(x), c = Math.cos(y), d = Math.sin(y), e = Math.cos(z), f = Math.sin(z);
  const m = [c * e, -c * f, d, a * f + b * e * d, a * e - b * f * d, -b * c, b * f - a * e * d, b * e + a * f * d, a * c];
  return [m[0] * vx + m[1] * vy + m[2] * vz, m[3] * vx + m[4] * vy + m[5] * vz, m[6] * vx + m[7] * vy + m[8] * vz];
}
const place = (at, t, v) => {
  const r = rot(t, v);
  return [at[0] + r[0], at[1] + r[1], at[2] + r[2]];
};
// Side-plane frame: an outline (a, b) with a = forward (+z), b = up (+y), thickness along x.
const SIDE = ["y", -Math.PI / 2];
const SIDE_TURN = turn(SIDE);

// ---- outlines in the side plane, as (z, y) in model space
// Dorsal crown: three points, the tallest in the middle, its base sunk into the back.
const DORSAL = [[0.1, 0.7], [0.08, 0.76], [0.035, 0.915], [-0.02, 0.81], [-0.07, 0.86], [-0.17, 1.0], [-0.19, 0.84], [-0.235, 0.86], [-0.28, 0.8], [-0.27, 0.7]];
// Tail fan: a notched fan, the upper lobe longer, joined to the body at z -0.29.
const TAIL = [[-0.25, 0.62], [-0.38, 0.66], [-0.5, 0.67], [-0.6, 0.63], [-0.54, 0.53], [-0.5, 0.43], [-0.48, 0.34], [-0.43, 0.21], [-0.38, 0.14], [-0.35, 0.27], [-0.3, 0.39], [-0.25, 0.44]];
// Pectoral fin: a triangle pointing back, in its own side-plane frame (a forward, b up) from its root.
const PEC = [[0.035, 0.015], [-0.06, 0.03], [-0.2, 0.0], [-0.31, -0.04], [-0.25, -0.1], [-0.19, -0.17], [-0.08, -0.12], [0.02, -0.06]];
const PEC_AT = [0.163, 0.49, 0.055];
const PEC_TURN = turn(SIDE, ["x", 0.08], ["y", -0.28]);
// Belly fin: spiky, three points dropping toward the ground, in its own frame from its root.
const BELLY = [[0.11, 0.0], [0.07, -0.13], [0.03, -0.06], [-0.02, -0.2], [-0.07, -0.08], [-0.14, -0.17], [-0.17, -0.03], [-0.14, 0.02]];
const BELLY_AT = [0.05, 0.31, 0.0];
const BELLY_TURN = turn(SIDE, ["z", 0.3]);

// whisker: from the upper lip's side, out and down in a loose S to the ground (x, y, z, r)
const WHISK = [[0.075, 0.54, 0.27, 0.022], [0.12, 0.48, 0.3, 0.02], [0.15, 0.36, 0.3, 0.019], [0.15, 0.24, 0.255, 0.019], [0.165, 0.12, 0.27, 0.019], [0.18, 0.025, 0.31, 0.019]];

const P = (at, t) => (u, v, r) => [...place(at, t, [u, v, 0]), r];

const recipe = {
  name: "Magikarp",
  dex: 129,
  height: 1,
  bones: {
    root: [0, 0, 0],
    body: { at: [0, 0.52, 0], parent: "root" },
    tail: { at: [0, 0.52, -0.2], parent: "body" },
    dorsal: { at: [0, 0.74, -0.08], parent: "body" },
    armL: { at: PEC_AT, parent: "body" },
    armR: { at: [-PEC_AT[0], PEC_AT[1], PEC_AT[2]], parent: "body" },
    whiskerL: { at: [0.075, 0.54, 0.27], parent: "body" },
    whiskerR: { at: [-0.075, 0.54, 0.27], parent: "body" },
  },
  pieces: [
    // the plump oval body; the rear third rides the tail bone so the tail can swish
    { name: "body", kind: "ellipsoid", at: [0, 0.52, 0.02], r: [0.17, 0.245, 0.29], color: BODY, bone: "body" },
    { name: "rear", kind: "ellipsoid", at: [0, 0.52, -0.17], r: [0.13, 0.17, 0.15], color: BODY, bone: "tail", blend: 0.08 },
    // the gaping O: a thick pink lip ring sticking out of the front, a deep dark mouth inside it
    { name: "lips", kind: "torus", R: 0.068, r: 0.032, scale: [1, 1.22, 1], at: [0, 0.47, 0.298], color: LIPS, bone: "body", blend: 0.03 },
    { name: "mouth", kind: "ellipsoid", at: [0, 0.47, 0.3], r: [0.04, 0.052, 0.09], color: MOUTH, bone: "body", blend: -0.015 },
    // fins as plates
    { name: "dorsal", kind: "slab", outline: DORSAL, depth: 0.04, round: 0.016, at: [0, 0, 0], turn: SIDE_TURN, color: YELLOW, bone: "dorsal", blend: 0.006 },
    { name: "tailfin", kind: "slab", outline: TAIL, depth: 0.04, round: 0.016, at: [0, 0, 0], turn: SIDE_TURN, color: WHITE, bone: "tail", blend: 0.01 },
    { name: "pec", kind: "slab", outline: PEC, depth: 0.036, round: 0.015, at: PEC_AT, turn: PEC_TURN, color: WHITE, bone: "armL", blend: 0.012, mirror: true },
    { name: "belly", kind: "slab", outline: BELLY, depth: 0.036, round: 0.015, at: BELLY_AT, turn: BELLY_TURN, color: YELLOW, bone: "body", blend: 0.006, mirror: true },
    // long whiskers drooping to the ground
    { name: "whisker", kind: "chain", points: WHISK, color: WHISKER, bone: "whiskerL", blend: 0.012, mirror: true },
    { name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true },
  ],
  paint: [
    // red-orange frames: the top and bottom edges of the tail fan, the top edge of each pectoral
    { name: "tailTop", color: BODY, shape: { kind: "chain", points: [[0, 0.62, -0.25, 0.034], [0, 0.66, -0.38, 0.032], [0, 0.67, -0.5, 0.03], [0, 0.63, -0.6, 0.03]] }, bones: ["tail"] },
    { name: "tailLow", color: BODY, shape: { kind: "chain", points: [[0, 0.44, -0.25, 0.034], [0, 0.39, -0.3, 0.032], [0, 0.27, -0.35, 0.03], [0, 0.14, -0.38, 0.03]] }, bones: ["tail"] },
    { name: "pecTop", color: BODY, shape: { kind: "chain", points: [P(PEC_AT, PEC_TURN)(0.035, 0.015, 0.03), P(PEC_AT, PEC_TURN)(-0.06, 0.03, 0.028), P(PEC_AT, PEC_TURN)(-0.2, 0.0, 0.026), P(PEC_AT, PEC_TURN)(-0.31, -0.04, 0.025)] }, bones: ["armL"], mirror: true },
    // gray rays on the white fins
    ...[[-0.5, 0.585], [-0.52, 0.47], [-0.45, 0.3]].map(([z, y], i) => ({ name: `tailRay${i}`, color: RAY, shape: { kind: "chain", points: [[0, 0.5, -0.27, 0.024], [0, y, z, 0.022]] }, bones: ["tail"] })),
    ...[[-0.24, -0.08], [-0.17, -0.13]].map(([u, v], i) => ({ name: `pecRay${i}`, color: RAY, shape: { kind: "chain", points: [P(PEC_AT, PEC_TURN)(0.0, -0.01, 0.022), P(PEC_AT, PEC_TURN)(u, v, 0.021)] }, bones: ["armL"], mirror: true })),
  ],
  face: {
    eyes: [
      // the blank stare: a big white disc with a thin dark rim and a pinprick pupil, no glint
      { at: [-0.145, 0.595, 0.125], w: 0.135, h: 0.135, sclera: "#ffffff", iris: DARK, irisAt: [0.05, 0.05], irisSize: [0.13, 0.13], edge: { color: DARK, w: 0.07 }, mirror: true },
    ],
    // gill line just behind the eye, and one scale line further back
    mouths: [
      { name: "gill", kind: "smile", at: [-0.15, 0.61, -0.025], w: 0.22, h: 0.04, thick: 0.008, turn: Math.PI / 2, color: "#7a2418", lit: true, mirror: true },
      { name: "scale", kind: "smile", at: [-0.13, 0.62, -0.15], w: 0.16, h: 0.03, thick: 0.007, turn: Math.PI / 2, color: "#9a3420", lit: true, mirror: true },
    ],
  },
};

export default recipe;
