// Pawniard (#624). GO pose: standing on bowed legs, arms out low, the blades on its hands angled down and out.
// Checked against art-624, home-624 and the Showdown 3D front/back (ani-pawniard, ani-back-pawniard) in
// .cache/research/models/ref.
// 1 tall (feet to the tip of the head blade), feet at y 0, facing +z, +x = Pawniard's own left (the viewer's right).
// A big dark helmet of a head with a red top and one silver blade up its left side, angry yellow eyes, a little silver
// chest banded in black with white fins at its sides, thin red arms ending in long blades, thin red legs, white toes.

const RED = "#b8323a";
const HELM = "#5a5d66";
const FACE = "#3a3b42";
const SILVER = "#cfd3da";
const BLADE = "#eef1f4";
const BAND = "#2a2a30";
const EYE = "#f2b61e";
const DARK = "#1c1a20";

const HEAD = [0, 0.64, 0];

const recipe = {
  name: "Pawniard",
  dex: 624,
  height: 1,
  bones: {
    root: [0, 0, 0],
    body: { at: [0, 0.36, 0], parent: "root" },
    head: { at: [0, 0.5, 0], parent: "body" },
    armL: { at: [0.1, 0.45, 0], parent: "body" },
    armR: { at: [-0.1, 0.45, 0], parent: "body" },
    legL: { at: [0.06, 0.27, 0], parent: "root" },
    legR: { at: [-0.06, 0.27, 0], parent: "root" },
  },
  pieces: [
    // the little chest and its waist
    { name: "chest", kind: "ellipsoid", at: [0, 0.39, 0], r: [0.1, 0.115, 0.08], color: SILVER, bone: "body" },
    { name: "waist", kind: "ellipsoid", at: [0, 0.285, 0], r: [0.075, 0.05, 0.06], color: BAND, bone: "body", blend: 0.03 },
    // white fins at the sides of the chest, pointing down and out
    { name: "fin", kind: "cone", a: [0.08, 0.42, 0], b: [0.15, 0.33, -0.01], ra: 0.025, rb: 0.004, color: BLADE, bone: "body", blend: 0.01, squash: { axis: [0, 0, 1], k: 0.4 }, mirror: true },
    // the head: a big dark helmet, a darker face under its brim
    { name: "neck", kind: "cone", a: [0, 0.47, 0], b: [0, 0.53, 0], ra: 0.04, rb: 0.045, color: FACE, bone: "head", blend: 0.02 },
    { name: "helmet", kind: "ellipsoid", at: HEAD, r: [0.21, 0.195, 0.2], color: HELM, bone: "head", blend: 0.03 },
    // its sides come down past the face like a bell
    { name: "cheekGuard", kind: "ellipsoid", at: [0.145, 0.555, 0.03], r: [0.075, 0.105, 0.13], color: HELM, bone: "head", blend: 0.03, mirror: true },
    { name: "brow", kind: "ellipsoid", at: [0, 0.665, 0.07], r: [0.205, 0.05, 0.14], color: HELM, bone: "head", blend: 0.02 },
    // the silver blade standing up its left side, curving out
    { name: "headBlade", kind: "slab", outline: [[0, 0], [0.06, -0.01], [0.12, 0.08], [0.15, 0.2], [0.11, 0.32], [0.08, 0.2], [0.04, 0.11], [-0.01, 0.06]], smooth: 3, depth: 0.03, round: 0.008, at: [0.12, 0.64, 0.02], turn: [0, -0.35, -0.08], color: BLADE, bone: "head", blend: 0.012 },
    // thin red arms, out and down, and the long blades on the hands
    { name: "arm", kind: "chain", points: [[0.1, 0.445, 0, 0.032], [0.18, 0.41, 0.03, 0.028], [0.25, 0.37, 0.08, 0.026]], smooth: 0.015, color: RED, bone: "armL", blend: 0.01, mirror: true },
    { name: "hand", kind: "sphere", at: [0.255, 0.365, 0.085], r: 0.03, color: RED, bone: "armL", blend: 0.015, mirror: true },
    { name: "armBlade", kind: "chain", points: [[0.27, 0.36, 0.09, 0.024], [0.37, 0.305, 0.145, 0.019], [0.47, 0.25, 0.19, 0.004]], smooth: 0.01, color: BLADE, bone: "armL", blend: 0.008, squash: { axis: [0, 1, -0.5], k: 0.45 }, mirror: true },
    // bowed red legs, little feet with white toes
    { name: "leg", kind: "chain", points: [[0.05, 0.27, 0, 0.034], [0.1, 0.15, 0.02, 0.028], [0.085, 0.05, 0.01, 0.026]], smooth: 0.02, color: RED, bone: "legL", blend: 0.012, mirror: true },
    { name: "foot", kind: "ellipsoid", at: [0.09, 0.025, 0.04], r: [0.045, 0.025, 0.07], color: RED, bone: "legL", blend: 0.02, mirror: true },
    { name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true },
  ],
  paint: [
    // three black bands round the chest
    ...[0.345, 0.395, 0.445].map((y, i) => ({ name: `band${i}`, color: BAND, shape: { kind: "box", size: [0.4, 0.022, 0.4], at: [0, y, 0] }, bones: ["body"] })),
    // the red top of the helmet, back to the crown
    { name: "cap", color: RED, shape: { kind: "ellipsoid", at: [0, 0.8, 0.03], r: [0.24, 0.12, 0.23] }, bones: ["head"] },
    // the face, darker under the brim
    { name: "face", color: FACE, shape: { kind: "ellipsoid", at: [0, 0.58, 0.16], r: [0.15, 0.085, 0.1] }, bones: ["head"] },
    // white toe tips
    { name: "toes", color: BLADE, shape: { kind: "ellipsoid", at: [0.09, 0.02, 0.105], r: [0.05, 0.03, 0.025] }, bones: ["legL"], mirror: true },
  ],
  face: {
    eyes: [
      // angry yellow eyes under the brim, cut flat across the top and slanting down to the middle
      { at: [-0.07, 0.6, 0.175], w: 0.075, h: 0.06, sclera: EYE, iris: DARK, irisAt: [0.25, -0.1], irisSize: [0.35, 0.55], cut: [0.4, -0.45], glints: [[-0.2, 0.15, 0.18]], lit: false, mirror: true },
    ],
  },
};

export default recipe;
