// Geodude (#74). GO pose: a floating boulder in a double flex, elbows low, forearms up, two huge fists at the sides.
// Checked against art-74, home-74, the GO icon (go-74, goS-74, grid-go256-74) and the Showdown 3D front/back (frames-geodude).
// Numbers: notes/research/species-2b.md (Geodude) plus the corrections in notes/research/model-wild-3.md.
// A floater: y 0 = the bottom of the rock, y 1 = the top of the fists. Facing +z, +x = Geodude's own left (the viewer's right).
// No legs. The game hovers it (species-2b: HOVER 0.6 map units) over a ground shadow.

const ROCK = "#a4a39a";
const CREASE = "#5e5a58";
const WHITE = "#f2f2ee";
const PUPIL = "#1e1a1a";

// frame helper (three.js XYZ euler, same math as the tool's place())
const rot = ([x = 0, y = 0, z = 0], [vx, vy, vz]) => {
  const a = Math.cos(x), b = Math.sin(x), c = Math.cos(y), d = Math.sin(y), e = Math.cos(z), f = Math.sin(z);
  const m = [c * e, -c * f, d, a * f + b * e * d, a * e - b * f * d, -b * c, b * f - a * e * d, b * e + a * f * d, a * c];
  return [m[0] * vx + m[1] * vy + m[2] * vz, m[3] * vx + m[4] * vy + m[5] * vz, m[6] * vx + m[7] * vy + m[8] * vz];
};
const place = (at, turn, v) => rot(turn, v).map((c, i) => c + at[i]);

const C = [0, 0.36, 0]; // rock center
// the +x arm: shoulder, elbow, wrist, and the fist (knuckles to the front, turned in a little toward the viewer)
const SHOULDER = [0.36, 0.3, 0.04];
const ELBOW = [0.59, 0.25, 0.11];
const WRIST = [0.69, 0.58, 0.13];
const FIST = [0.73, 0.79, 0.13];
const FIST_TURN = [0, -0.25, -0.08];

// four curled fingers across the front of the fist, a thumb over the inner side
const fingers = [-0.12, -0.04, 0.04, 0.12].map((u, i) => ({
  name: `finger${i}`, kind: "cone", a: place(FIST, FIST_TURN, [u, -0.09, 0.115]), b: place(FIST, FIST_TURN, [u * 1.03, 0.085, 0.11]),
  ra: 0.05, rb: 0.048, color: ROCK, bone: "forearmL", blend: 0.012, mirror: true,
}));

const recipe = {
  name: "Geodude",
  dex: 74,
  height: 1,
  bones: {
    root: [0, 0, 0],
    body: { at: C, parent: "root" },
    armL: { at: SHOULDER, parent: "body" },
    armR: { at: [-SHOULDER[0], SHOULDER[1], SHOULDER[2]], parent: "body" },
    forearmL: { at: ELBOW, parent: "armL" },
    forearmR: { at: [-ELBOW[0], ELBOW[1], ELBOW[2]], parent: "armR" },
  },
  pieces: [
    // the boulder: a squat ball with rocky lumps blended on (asymmetric on purpose)
    { name: "rock", kind: "ellipsoid", at: C, r: [0.405, 0.365, 0.375], color: ROCK, bone: "body" },
    { name: "crown", kind: "ellipsoid", at: [0.04, 0.64, -0.03], r: [0.22, 0.09, 0.2], turn: [0.15, 0, 0.1], color: ROCK, bone: "body", blend: 0.08 },
    { name: "brow", kind: "ellipsoid", at: [-0.02, 0.56, 0.17], r: [0.24, 0.1, 0.13], turn: [-0.6, 0, 0.12], color: ROCK, bone: "body", blend: 0.06 },
    { name: "sideLump", kind: "ellipsoid", at: [0.3, 0.5, -0.14], r: [0.13, 0.11, 0.1], turn: [0, 0.6, 0.3], color: ROCK, bone: "body", blend: 0.07, mirror: true },
    { name: "backLump", kind: "ellipsoid", at: [-0.08, 0.3, -0.31], r: [0.17, 0.13, 0.08], color: ROCK, bone: "body", blend: 0.07 },
    { name: "backTop", kind: "ellipsoid", at: [0.13, 0.52, -0.26], r: [0.15, 0.1, 0.1], turn: [0.5, 0, 0.2], color: ROCK, bone: "body", blend: 0.07 },
    { name: "lowLump", kind: "ellipsoid", at: [-0.24, 0.13, 0.14], r: [0.13, 0.08, 0.12], turn: [0, 0, -0.4], color: ROCK, bone: "body", blend: 0.07 },
    { name: "cheekLump", kind: "ellipsoid", at: [0.3, 0.2, 0.18], r: [0.11, 0.09, 0.09], turn: [0, 0.5, 0.3], color: ROCK, bone: "body", blend: 0.07 },
    // heavy brow ridges in a V (inner ends low), a nose bump where they meet, a pouty upper lip
    { name: "browRidge", kind: "ellipsoid", at: [0.12, 0.465, 0.325], r: [0.13, 0.045, 0.06], turn: [0, 0.35, 0.35], color: ROCK, bone: "body", blend: 0.03, mirror: true },
    { name: "noseBump", kind: "ellipsoid", at: [0, 0.425, 0.345], r: [0.05, 0.06, 0.04], color: ROCK, bone: "body", blend: 0.03 },
    { name: "lip", kind: "ellipsoid", at: [0, 0.27, 0.31], r: [0.14, 0.055, 0.06], color: ROCK, bone: "body", blend: 0.04 },
    // arms out of the sides below center: upper arm out and a little down, the thicker forearm up
    { name: "upperArm", kind: "cone", a: SHOULDER, b: ELBOW, ra: 0.082, rb: 0.088, color: ROCK, bone: "armL", blend: 0.05, mirror: true },
    { name: "forearm", kind: "cone", a: ELBOW, b: WRIST, ra: 0.095, rb: 0.118, color: ROCK, bone: "forearmL", blend: 0.03, mirror: true },
    { name: "bicep", kind: "ellipsoid", at: [0.48, 0.31, 0.08], r: [0.1, 0.07, 0.07], turn: [0, 0.3, -0.2], color: ROCK, bone: "armL", blend: 0.04, mirror: true },
    // fists: huge, each about half the rock's width, boxy
    { name: "fist", kind: "box", at: FIST, size: [0.4, 0.33, 0.28], round: 0.12, turn: FIST_TURN, color: ROCK, bone: "forearmL", blend: 0.04, mirror: true },
    ...fingers,
    { name: "thumb", kind: "ellipsoid", at: place(FIST, FIST_TURN, [-0.16, -0.05, 0.1]), r: [0.055, 0.1, 0.055], turn: [FIST_TURN[0], FIST_TURN[1], 0.9], color: ROCK, bone: "forearmL", blend: 0.015, mirror: true },
  ],
  paint: [],
  face: {
    eyes: [
      // small flat-topped white eyes pressed under the brows, a tiny tall pupil at the inner corner (a glare).
      // Viewer's left eye; +u points toward the nose.
      { at: [-0.165, 0.385, 0.34], w: 0.15, h: 0.085, sclera: WHITE, iris: PUPIL, irisAt: [0.55, -0.1], irisSize: [0.11, 0.62], cut: [0.5, -0.45], mirror: true },
      // a dark lid line along that cut, the scowl
      { at: [-0.165, 0.406, 0.336], w: 0.165, h: 0.085, closed: 0, thick: 0.2, sclera: CREASE, turn: -0.255, mirror: true },
    ],
    mouths: [
      // the frown crease under the lip
      { name: "frown", kind: "frown", at: [0, 0.22, 0.345], w: 0.22, h: 0.055, thick: 0.014, color: CREASE, lit: true },
      // brow creases: the grooves under the ridges, running down into the V
      { name: "browLine", kind: "line", at: [-0.13, 0.455, 0.33], w: 0.2, h: 0.01, thick: 0.01, turn: -0.42, color: CREASE, lit: true, mirror: true },
    ],
  },
};

export default recipe;
