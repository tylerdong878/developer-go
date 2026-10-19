// Charmander (#4). Checked against art-4, home-4, the GO icon (refs/go-4.png) and the Showdown 3D front/back
// (ani-charmander, ani-back-charmander: the back one is nearly a side profile).
// Numbers: notes/research/species-1.md (Charmander) plus the corrections in notes/research/model-starters.md.
// 1 tall (head top to soles), feet at y 0, facing +z, +x = Charmander's own left (the viewer's right).
// GO pose: standing, arms out and down, the tail sweeping back and round to its left, the flame beside the body.
// The flame is its own pieces on a bone named "flame" (child of the tail), joined hard to the tail tip, so the game
// can draw it unlit and flicker it.

const ORANGE = "#f4883a";
const BELLY = "#f9de8e";
const CLAW = "#f4f4f6";
const FLAME_Y = "#ffd23a";
const FLAME_O = "#ff8a1a";
const FLAME_R = "#ff4a1a";
const IRIS = "#1a7f9a";
const DARK = "#1c1620";

// tail center line from the hips back, round to the left and up to the flame: [x, y, z, r]
const TAIL = [
  [0.03, 0.2, -0.1, 0.085],
  [0.08, 0.15, -0.22, 0.072],
  [0.17, 0.15, -0.31, 0.062],
  [0.26, 0.2, -0.33, 0.053],
  [0.31, 0.29, -0.3, 0.045],
  [0.33, 0.38, -0.26, 0.04],
];
const TIP = TAIL[TAIL.length - 1];
// the flame's base, a little above the tail tip (the bulb swallows the tip)
const FB = [TIP[0] + 0.005, TIP[1] + 0.03, TIP[2] + 0.01];
const F = (dx, dy, dz) => [FB[0] + dx, FB[1] + dy, FB[2] + dz];

// three claws along a foot's toe edge (+x foot; mirror makes the other)
const FOOT_AT = [0.165, 0.038, 0.075];
const FOOT_YAW = 0.3;
const footClaws = () =>
  [-0.034, 0, 0.034].map((dx, i) => {
    const c = Math.cos(FOOT_YAW), s = Math.sin(FOOT_YAW);
    const lx = dx, lz = 0.09;
    const base = [FOOT_AT[0] + lx * c + lz * s, 0.03, FOOT_AT[2] - lx * s + lz * c];
    const tz = 0.13;
    const tip = [FOOT_AT[0] + lx * 1.1 * c + tz * s, 0.012, FOOT_AT[2] - lx * 1.1 * s + tz * c];
    return { name: `claw${i}`, kind: "cone", a: base, b: tip, ra: 0.016, rb: 0.005, color: CLAW, bone: "footL", mirror: true };
  });

// arm: shoulder to hand, out and down to the side, with three short fingers and a thumb
const SHOULDER = [0.125, 0.53, 0.03];
const HAND = [0.27, 0.415, 0.08];
const fingers = () => {
  const out = [];
  const d = [HAND[0] - SHOULDER[0], HAND[1] - SHOULDER[1], HAND[2] - SHOULDER[2]];
  const l = Math.hypot(...d);
  const n = d.map((c) => c / l);
  for (let k = -1; k <= 1; k++) {
    const a = [HAND[0] + n[0] * 0.025, HAND[1] + n[1] * 0.025 + k * 0.014, HAND[2] + n[2] * 0.025 + k * 0.012];
    const b = [a[0] + n[0] * 0.035 + 0.004, a[1] + n[1] * 0.035 + k * 0.01 - 0.008, a[2] + n[2] * 0.035 + k * 0.014];
    out.push({ name: `finger${k + 1}`, kind: "cone", a, b, ra: 0.02, rb: 0.014, color: ORANGE, bone: "armL", blend: 0.014, mirror: true });
  }
  out.push({ name: "thumb", kind: "cone", a: [HAND[0] - 0.005, HAND[1] + 0.008, HAND[2] + 0.02], b: [HAND[0] + 0.005, HAND[1] + 0.004, HAND[2] + 0.055], ra: 0.019, rb: 0.013, color: ORANGE, bone: "armL", blend: 0.014, mirror: true });
  return out;
};

const recipe = {
  name: "Charmander",
  dex: 4,
  height: 1,
  bones: {
    root: [0, 0, 0],
    body: { at: [0, 0.2, 0], parent: "root" },
    head: { at: [0, 0.6, 0.04], parent: "body" },
    armL: { at: SHOULDER, parent: "body" },
    armR: { at: [-SHOULDER[0], SHOULDER[1], SHOULDER[2]], parent: "body" },
    legL: { at: [0.13, 0.2, 0], parent: "root" },
    legR: { at: [-0.13, 0.2, 0], parent: "root" },
    footL: { at: [0.165, 0.05, 0.05], parent: "legL" },
    footR: { at: [-0.165, 0.05, 0.05], parent: "legR" },
    tail: { at: TAIL[0].slice(0, 3), parent: "body" },
    tail2: { at: TAIL[3].slice(0, 3), parent: "tail" },
    flame: { at: FB, parent: "tail2" },
  },
  pieces: [
    // pear torso: wide hips, a narrower chest, the belly bulging forward
    { name: "hips", kind: "ellipsoid", at: [0, 0.255, -0.01], r: [0.195, 0.185, 0.172], color: ORANGE, bone: "body" },
    { name: "chest", kind: "ellipsoid", at: [0, 0.44, 0.005], r: [0.148, 0.15, 0.14], color: ORANGE, bone: "body", blend: 0.09 },
    { name: "belly", kind: "ellipsoid", at: [0, 0.33, 0.05], r: [0.158, 0.2, 0.132], color: ORANGE, bone: "body", blend: 0.05 },
    // a real neck, narrower than the head
    { name: "neck", kind: "ellipsoid", at: [0, 0.575, 0.03], r: [0.135, 0.09, 0.125], color: ORANGE, bone: "head", blend: 0.09 },
    // the nape: from behind the head runs down into the shoulders (Showdown back), not a bulb on a stalk
    { name: "nape", kind: "ellipsoid", at: [0, 0.6, -0.035], r: [0.13, 0.11, 0.1], color: ORANGE, bone: "head", blend: 0.08 },
    // egg head, taller than wide, and the muzzle pushing forward low on the face
    { name: "head", kind: "ellipsoid", at: [0, 0.8, 0.05], r: [0.172, 0.2, 0.16], color: ORANGE, bone: "head", blend: 0.06 },
    { name: "muzzle", kind: "ellipsoid", at: [0, 0.685, 0.14], r: [0.16, 0.09, 0.125], turn: [0.1, 0, 0], color: ORANGE, bone: "head", blend: 0.05 },
    // arms from the shoulders, right under the jaw, reaching out and down
    { name: "arm", kind: "cone", a: SHOULDER, b: HAND, ra: 0.054, rb: 0.043, color: ORANGE, bone: "armL", blend: 0.03, mirror: true },
    ...fingers(),
    // chunky thighs, short feet toed out, three white claws each
    { name: "thigh", kind: "ellipsoid", at: [0.135, 0.165, 0.0], r: [0.092, 0.115, 0.108], turn: [0, 0, 0.15], color: ORANGE, bone: "legL", blend: 0.04, mirror: true },
    { name: "foot", kind: "ellipsoid", at: FOOT_AT, r: [0.068, 0.04, 0.105], turn: [0, FOOT_YAW, 0], color: ORANGE, bone: "footL", blend: 0.03, mirror: true },
    ...footClaws(),
    // the thick tail: back from the hips, round to its left and up
    { name: "tail", kind: "chain", points: TAIL.slice(0, 4), smooth: 0.02, color: ORANGE, bone: "tail", blend: 0.05 },
    { name: "tailEnd", kind: "chain", points: TAIL.slice(3), smooth: 0.02, color: ORANGE, bone: "tail2", blend: 0.02 },
    // the flame: a big yellow bulb, a body tapering up to the main point, two side licks. Hard join to the tail.
    { name: "flameBulb", kind: "ellipsoid", at: F(0, 0.075, 0), r: [0.097, 0.09, 0.092], color: FLAME_Y, bone: "flame" },
    { name: "flameBody", kind: "cone", a: F(0, 0.11, 0), b: F(-0.025, 0.385, -0.01), ra: 0.086, rb: 0.013, color: FLAME_Y, bone: "flame", blend: 0.03 },
    { name: "lickL", kind: "cone", a: F(0.045, 0.15, 0), b: F(0.1, 0.255, -0.01), ra: 0.038, rb: 0.011, color: FLAME_Y, bone: "flame", blend: 0.025 },
    { name: "lickR", kind: "cone", a: F(-0.045, 0.14, 0.01), b: F(-0.08, 0.215, 0.01), ra: 0.032, rb: 0.01, color: FLAME_Y, bone: "flame", blend: 0.025 },
    { name: "lickB", kind: "cone", a: F(0.01, 0.15, -0.04), b: F(0.02, 0.24, -0.09), ra: 0.032, rb: 0.01, color: FLAME_Y, bone: "flame", blend: 0.025 },
    // flat soles
    { name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true },
  ],
  paint: [
    // cream belly from under the jaw to the crotch
    { name: "belly", color: BELLY, shape: { kind: "ellipsoid", at: [0, 0.355, 0.13], r: [0.152, 0.215, 0.12] }, bones: ["body", "head"] },
    // cream stripe along the underside and outer curve of the tail (Showdown back sprite, HOME)
    { name: "tailUnder", color: BELLY, shape: { kind: "chain", points: [[0.06, 0.11, -0.2, 0.04], [0.16, 0.095, -0.32, 0.04], [0.28, 0.14, -0.37, 0.035], [0.36, 0.26, -0.33, 0.03], [0.38, 0.36, -0.28, 0.025]] }, bones: ["tail", "tail2"] },
    // flame bands: yellow bulb, orange middle, red points
    { name: "flameOrange", color: FLAME_O, soft: 0.02, shape: { kind: "half", at: F(0, 0.135, 0), dir: [0, 1, 0] }, bones: ["flame"] },
    { name: "flameRed", color: FLAME_R, soft: 0.02, shape: { kind: "half", at: F(0, 0.215, 0), dir: [0, 1, 0] }, bones: ["flame"] },
  ],
  face: {
    eyes: [
      // tall dark ovals (w/h 0.5) about 44 degrees round the head, teal in the bottom 40%, a tall glint up and in
      { at: [-0.118, 0.8, 0.18], w: 0.075, h: 0.145, sclera: DARK, iris: IRIS, band: -0.2, glints: [[0.26, 0.22, 0.24], [0.26, 0.5, 0.24]], mirror: true },
      // two little white fangs hanging from the upper lip at the mouth's corners
      { name: "fang", at: [-0.062, 0.64, 0.24], w: 0.02, h: 0.032, cut: [0, 0], sclera: "#ffffff", mirror: true },
    ],
    mouth: [
      // upper lip: a wide gentle smile cheek to cheek; under its middle the mouth hangs a little open (pink tongue)
      { kind: "open", at: [0, 0.632, 0.255], w: 0.13, h: 0.036, thick: 0.006, color: DARK, inner: "#8a3a3a", tongue: "#f08a80" },
      { kind: "smile", at: [0, 0.662, 0.255], w: 0.23, h: 0.04, thick: 0.007, color: DARK },
      // the short crease over each eye's inner top corner (HOME, art; faint in GO)
      { kind: "frown", at: [-0.1, 0.885, 0.172], w: 0.028, h: 0.007, thick: 0.004, turn: 0.5, color: DARK, mirror: true },
    ],
    spots: [
      { name: "nostril", at: [-0.038, 0.72, 0.24], r: [0.009, 0.005], color: DARK, lit: false, mirror: true },
    ],
  },
};

export default recipe;
