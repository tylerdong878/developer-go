// Pidgey (#16). Shape checked against art-16, home-16, GO icon pm16 and the Showdown front/back sprites.
// 1 tall (crest tip to soles), feet at y 0, facing +z, +x = Pidgey's own left (the viewer's right).
// Notes: notes/research/model-wild-1.md (Pidgey) and notes/research/species-1.md (Pidgey).

const BROWN = "#b07a3c"; // back, crown, nape, tail
const WING = "#9a6232"; // folded wings, a shade darker
const CREAM = "#f3e6a8"; // face, breast, belly, wing fringe
const BROW = "#f4ecb4"; // brow band and its spikes
const MASK = "#2a2228";
const BEAK = "#d8a8b6";
const FEET = "#c98f9e";
const CLAW = "#f4f4f6";
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
// Side-plane frame: an outline (a, b) with a = forward (+z), b = up (+y), thickness along x.
const SIDE = ["y", -Math.PI / 2];
// Flat frame: an outline (a, b) with a = across (+x), b = backward (-z), thickness along y.
const FLAT = ["x", -Math.PI / 2];

// Crest feather: a spiky brown tuft leaning back, (a, b) from its base on the crown.
const CREST = [[0.06, -0.03], [0.055, 0.04], [0.085, 0.1], [0.025, 0.075], [0.005, 0.14], [-0.035, 0.08], [-0.09, 0.115], [-0.08, 0.04], [-0.13, 0.045], [-0.1, -0.03]];
// Brow feather: a band from above the eye back along the head, ending in two spikes past the back of the head.
const BROW_OUT = [[0.07, -0.012], [0.05, 0.026], [-0.05, 0.03], [-0.12, 0.05], [-0.16, 0.07], [-0.14, 0.03], [-0.2, 0.025], [-0.13, -0.008], [-0.04, -0.02]];
// Tail feather: a long blade with a squared, slightly notched end ([across, along]).
const FEATHER = [[-0.036, 0], [-0.052, 0.2], [-0.05, 0.31], [-0.014, 0.335], [0.0, 0.312], [0.016, 0.335], [0.052, 0.31], [0.054, 0.2], [0.036, 0]];
// Wing fringe: the cream lower part of the folded wing with a jagged top edge (side plane, model z and y).
const FRINGE = [[0.16, 0.24], [0.1, 0.3], [0.07, 0.235], [0.02, 0.29], [-0.02, 0.22], [-0.07, 0.28], [-0.1, 0.205], [-0.16, 0.26], [-0.18, 0.18], [-0.26, 0.22], [-0.42, 0.1], [-0.42, -0.1], [0.16, -0.1]];

const TOE = 0.02;
const foot = (s) => {
  const x = s * 0.085;
  const ankle = [x, 0.03, 0.045];
  const tips = [[x, 0.017, 0.16], [x + s * 0.06, 0.017, 0.14], [x - s * 0.045, 0.017, 0.14], [x - s * 0.005, 0.017, -0.035]];
  return tips.map((t, i) => ({ name: `toe${i}`, kind: "cone", a: ankle, b: t, ra: TOE, rb: 0.014, color: FEET, bone: s > 0 ? "legL" : "legR", blend: 0.012 }));
};

const recipe = {
  name: "Pidgey",
  dex: 16,
  height: 1,
  bones: {
    root: [0, 0, 0],
    body: { at: [0, 0.16, 0], parent: "root" },
    head: { at: [0, 0.6, 0.03], parent: "body" },
    beak: { at: [0, 0.72, 0.22], parent: "head" },
    crest: { at: [0, 0.86, 0.0], parent: "head" },
    wingL: { at: [0.22, 0.56, 0.02], parent: "body" },
    wingR: { at: [-0.22, 0.56, 0.02], parent: "body" },
    tail: { at: [0, 0.3, -0.24], parent: "body" },
    legL: { at: [0.085, 0.16, 0.03], parent: "root" },
    legR: { at: [-0.085, 0.16, 0.03], parent: "root" },
  },
  pieces: [
    // one pear: a broad belly, the breast pushed forward, the head flowing into it with no neck
    { name: "body", kind: "ellipsoid", at: [0, 0.355, -0.03], r: [0.29, 0.24, 0.285], turn: [-0.15, 0, 0], color: BROWN, bone: "body" },
    { name: "breast", kind: "ellipsoid", at: [0, 0.45, 0.07], r: [0.24, 0.22, 0.2], color: BROWN, bone: "body", blend: 0.08 },
    { name: "head", kind: "ellipsoid", at: [0, 0.715, 0.05], r: [0.2, 0.18, 0.19], color: BROWN, bone: "head", blend: 0.14 },
    // beak: a round pink bill with a small hook, a short lower bill
    { name: "beak", kind: "ellipsoid", at: [0, 0.725, 0.235], r: [0.058, 0.05, 0.068], turn: [0.35, 0, 0], color: BEAK, bone: "beak", blend: 0.012 },
    { name: "hook", kind: "cone", a: [0, 0.715, 0.27], b: [0, 0.68, 0.296], ra: 0.033, rb: 0.016, color: BEAK, bone: "beak", blend: 0.012 },
    { name: "jaw", kind: "ellipsoid", at: [0, 0.69, 0.215], r: [0.042, 0.024, 0.05], turn: [0.2, 0, 0], color: BEAK, bone: "beak", blend: 0.01 },
    // crest: three spiky feathers fanned so the tuft has width from the front and from above
    { name: "crest", kind: "slab", outline: CREST, smooth: 3, depth: 0.045, round: 0.018, at: [0, 0.855, 0.0], turn: turn(SIDE), color: BROWN, bone: "crest", blend: 0.025 },
    { name: "crestSide", kind: "slab", outline: CREST, smooth: 3, depth: 0.04, round: 0.016, at: [0.035, 0.845, -0.01], turn: turn(SIDE, ["z", -0.35], ["y", -0.3]), scale: 0.85, color: BROWN, bone: "crest", blend: 0.025, mirror: true },
    // brow feathers: from above each eye back along the head, rolled onto its upper side, spikes past the back
    { name: "brow", kind: "slab", outline: BROW_OUT, smooth: 3, depth: 0.036, round: 0.016, at: [0.13, 0.835, 0.07], turn: turn(SIDE, ["x", -0.08], ["z", 0.5], ["y", -0.5]), color: BROW, bone: "head", blend: 0.012, mirror: true },
    // folded wings hugging the sides, tips reaching back past the rump
    { name: "wing", kind: "ellipsoid", at: [0.24, 0.4, -0.05], r: [0.075, 0.21, 0.235], turn: [0.45, 0.12, 0.08], color: WING, bone: "wingL", blend: 0.035, mirror: true },
    { name: "wingtip", kind: "cone", a: [0.235, 0.3, -0.15], b: [0.19, 0.17, -0.34], ra: 0.065, rb: 0.022, color: WING, bone: "wingL", blend: 0.04, mirror: true },
    // tail: three blades in a fan, the middle one flat, the sides raised and rolled
    { name: "tail1", kind: "slab", outline: FEATHER, depth: 0.034, round: 0.015, at: [0, 0.29, -0.22], turn: turn(FLAT, ["x", 0.3]), color: BROWN, bone: "tail", blend: 0.02 },
    { name: "tail2", kind: "slab", outline: FEATHER, depth: 0.034, round: 0.015, at: [0.02, 0.31, -0.22], turn: turn(FLAT, ["z", 0.6], ["y", -0.3], ["x", 0.55]), color: BROWN, bone: "tail", blend: 0.02, mirror: true },
    // legs and feet: short, the body sits low
    { name: "leg", kind: "cone", a: [0.085, 0.17, 0.02], b: [0.085, 0.035, 0.045], ra: 0.036, rb: 0.026, color: FEET, bone: "legL", blend: 0.02, mirror: true },
    ...foot(1),
    ...foot(-1),
    { name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true },
  ],
  paint: [
    // cream front: face below the brows, throat, breast, belly and the underside
    { name: "face", color: CREAM, shape: { kind: "ellipsoid", at: [0, 0.66, 0.19], r: [0.17, 0.14, 0.12] }, bones: ["head", "body"] },
    { name: "breast", color: CREAM, shape: { kind: "ellipsoid", at: [0, 0.38, 0.16], r: [0.235, 0.38, 0.22] }, bones: ["head", "body"] },
    { name: "under", color: CREAM, shape: { kind: "ellipsoid", at: [0, 0.12, -0.02], r: [0.33, 0.12, 0.34] }, bones: ["body"] },
    // brow band across the forehead, a V that dips toward the beak
    { name: "browband", color: BROW, shape: { kind: "box", size: [0.2, 0.032, 0.3], at: [0.085, 0.84, 0.12], turn: [0, 0, 0.42], round: 0.01 }, bones: ["head"], mirror: true },
    // black mask from the back corner of each eye, curving down the side of the head
    { name: "mask", color: MASK, shape: { kind: "chain", points: [[0.11, 0.795, 0.17, 0.036], [0.165, 0.775, 0.1, 0.045], [0.185, 0.72, 0.04, 0.038], [0.17, 0.655, 0.02, 0.024]] }, bones: ["head"], mirror: true },
    // cream lower edge on the folded wing, jagged
    { name: "fringe", color: CREAM, shape: { kind: "slab", outline: FRINGE, depth: 0.4, at: [0.25, 0.05, 0.0], turn: turn(SIDE) }, bones: ["wingL"], mirror: true },
    // white claws on the toe tips
    ...[[0.085, 0.16], [0.145, 0.14], [0.04, 0.14], [0.08, -0.035]].map(([x, z]) => ({ name: "claw", color: CLAW, shape: { kind: "sphere", r: 0.024, at: [x, 0.017, z] }, bones: ["legL"], mirror: true })),
  ],
  face: {
    eyes: [
      // narrow almond, white with the pupil toward the beak, the top cut by a lid slanting down to the front
      { at: [-0.095, 0.8, 0.19], w: 0.095, h: 0.064, sclera: "#ffffff", iris: DARK, irisAt: [0.36, -0.12], irisSize: [0.44, 0.82], cut: [0.32, -0.6], edge: { color: DARK, w: 0.16 }, glints: [[0.45, 0.12, 0.22]], mirror: true },
    ],
  },
};

export default recipe;
