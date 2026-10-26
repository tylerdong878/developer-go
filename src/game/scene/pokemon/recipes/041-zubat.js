// Zubat (#41). GO pose: hovering, bat wings spread wide and raised in a shallow V, swept back a little, the two thin
// legs trailing back and down. No eyes: the wide open mouth with four white fangs is the whole face.
// Verified against art-41, home-41, the GO icon (go256-41) and the Showdown sprites ani-zubat / aniback-zubat.
// Numbers: notes/research/species-1.md (Zubat) plus the corrections in notes/research/model-wild-1.md.
// 1 tall (wrist tops to leg tips), a floater: lowest point at y 0. Facing +z, +x = Zubat's own left (the viewer's right).

const BLUE = "#3f8fc0";
const MEMBRANE = "#8f5c9e";
const EAR_IN = "#86549a";
const MOUTH = "#1c1620";
const FANG = "#ffffff";

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

// ---- the left wing (+x) in its own plane: u outward, v up, the shoulder at the origin
const WRIST = [0.3, 0.325];
const TIP = [0.68, 0.0];
const F1 = [0.5, -0.12]; // first finger's end on the trailing edge
const F2 = [0.3, -0.14]; // second finger's end
const ROOT = [0.05, -0.12]; // where the trailing edge meets the body
// a concave scallop from a to b, bowed toward the wrist by k
const scallop = (a, b, k, n = 4) => {
  const out = [];
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
  let nx = -dy / l, ny = dx / l;
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  if ((WRIST[0] - mx) * nx + (WRIST[1] - my) * ny < 0) [nx, ny] = [-nx, -ny];
  for (let i = 1; i < n; i++) {
    const t = i / n, bow = Math.sin(Math.PI * t) * k * l;
    out.push([a[0] + dx * t + nx * bow, a[1] + dy * t + ny * bow]);
  }
  return out;
};
const WING = [
  [-0.03, -0.12], [-0.03, 0.05], [0.12, 0.17], WRIST, [0.42, 0.22], [0.56, 0.11], TIP,
  ...scallop(TIP, F1, 0.16), F1, ...scallop(F1, F2, 0.2), F2, ...scallop(F2, ROOT, 0.18), ROOT,
];
const SHOULDER = [0.1, 0.555, -0.02];
const WING_TURN = turn(["z", 0.4], ["y", 0.3]);
const W = (u, v, w = 0) => place(SHOULDER, WING_TURN, [u, v, w]);

// Ear: a tall rounded triangle.
const EAR = [[-0.075, -0.05], [0.08, -0.05], [0.064, 0.065], [0.016, 0.17], [-0.005, 0.176], [-0.057, 0.078]];
const EAR_AT = [0.088, 0.65, 0.025];
const EAR_TURN = turn(["z", -0.55], ["y", 0.25]);

const recipe = {
  name: "Zubat",
  dex: 41,
  height: 1,
  bones: {
    root: [0, 0, 0],
    body: { at: [0, 0.485, 0], parent: "root" },
    earL: { at: EAR_AT, parent: "body" },
    earR: { at: [-EAR_AT[0], EAR_AT[1], EAR_AT[2]], parent: "body" },
    wingL: { at: SHOULDER, parent: "body" },
    wingR: { at: [-SHOULDER[0], SHOULDER[1], SHOULDER[2]], parent: "body" },
    legL: { at: [0.04, 0.355, -0.04], parent: "body" },
    legR: { at: [-0.04, 0.355, -0.04], parent: "body" },
  },
  pieces: [
    // a small round blue body
    { name: "body", kind: "ellipsoid", at: [0, 0.485, 0], r: [0.15, 0.155, 0.145], color: BLUE, bone: "body" },
    // big pointed ears on the top sides, pointing up and out
    { name: "ear", kind: "slab", outline: EAR, smooth: 3, depth: 0.05, round: 0.02, at: EAR_AT, turn: EAR_TURN, color: BLUE, bone: "earL", blend: 0.03, mirror: true },
    // wings: a purple membrane plate, its thick blue leading edge (arm to wrist, long finger to the tip)
    { name: "wing", kind: "slab", outline: WING, depth: 0.05, round: 0.022, at: SHOULDER, turn: WING_TURN, color: MEMBRANE, bone: "wingL", blend: 0.02, mirror: true },
    { name: "arm", kind: "chain", points: [[...W(0, 0.02), 0.04], [...W(WRIST[0], WRIST[1]), 0.03], [...W(0.49, 0.165), 0.026], [...W(TIP[0], TIP[1]), 0.018]], color: BLUE, bone: "wingL", blend: 0.012, mirror: true },
    // two thin legs trailing back and down together
    { name: "leg", kind: "cone", a: [0.045, 0.365, -0.03], b: [0.07, 0.008, -0.36], ra: 0.026, rb: 0.019, color: BLUE, bone: "legL", blend: 0.02, mirror: true },
  ],
  paint: [
    // blue finger bones from the wrist down to the trailing edge
    { name: "finger1", color: BLUE, shape: { kind: "chain", points: [[...W(WRIST[0], WRIST[1]), 0.034], [...W(F1[0], F1[1]), 0.031]] }, bones: ["wingL"], mirror: true },
    { name: "finger2", color: BLUE, shape: { kind: "chain", points: [[...W(WRIST[0], WRIST[1]), 0.034], [...W(F2[0], F2[1]), 0.031]] }, bones: ["wingL"], mirror: true },
    // the membrane gets a little blue at the body
    { name: "wingRoot", color: BLUE, soft: 0.02, shape: { kind: "sphere", at: SHOULDER, r: 0.07 }, bones: ["wingL"], mirror: true },
    // purple ear insides, front face only
    { name: "earIn", color: EAR_IN, shape: { kind: "slab", outline: EAR.map(([u, v]) => [u * 0.66, v * 0.72 + 0.012]), depth: 0.03, at: place(EAR_AT, EAR_TURN, [0, 0, 0.022]), turn: EAR_TURN }, bones: ["earL"], mirror: true },
  ],
  face: {
    // no eyes: the wide open mouth (flat top, round bottom) is the whole face, with four white fangs,
    // two hanging from its top corners and two smaller ones up from the bottom
    mouth: { kind: "open", at: [0, 0.452, 0.141], w: 0.2, h: 0.1, thick: 0.01, color: MOUTH, inner: "#2a2230", tongue: null },
    eyes: [
      { name: "fangTop", at: [-0.06, 0.5, 0.133], dir: [0.1, 0, 1], w: 0.036, h: 0.07, cut: [0, 0], sclera: FANG, mirror: true },
      { name: "fangLow", at: [-0.03, 0.418, 0.142], dir: [0.05, -0.1, 1], w: 0.028, h: 0.046, turn: Math.PI, cut: [0, 0], sclera: FANG, mirror: true },
    ],
  },
};

export default recipe;
