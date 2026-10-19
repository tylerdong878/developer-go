// Abra (#63). GO pose: sitting cross-legged in the air, hands resting in the lap, head bowed, eyes shut.
// Checked against art-63, home-63, the GO icon (go-63, goS-63) and the Showdown 3D front/back (ani-abra, ani-back-abra).
// Numbers: notes/research/species-2c.md (Abra) plus the corrections in notes/research/model-wild-3.md.
// 1 tall (ear tips to the lowest point, the feet), facing +z, +x = Abra's own left (the viewer's right).
// It levitates: the game lifts it (species-2c suggests HOVER 0.3); y 0 is the bottom of the feet.

const YELLOW = "#f9dc3c";
const BROWN = "#9a7260";
const BLACK = "#2a2026";
const MUZZLE = "#f2e4b4";
const INNER = "#e4d49c";
const CLAW = "#f6eccb";
const LINE = "#3a2a26";

// frame helper (three.js XYZ euler, same math as the tool's place())
const rot = ([x = 0, y = 0, z = 0], [vx, vy, vz]) => {
  const a = Math.cos(x), b = Math.sin(x), c = Math.cos(y), d = Math.sin(y), e = Math.cos(z), f = Math.sin(z);
  const m = [c * e, -c * f, d, a * f + b * e * d, a * e - b * f * d, -b * c, b * f - a * e * d, b * e + a * f * d, a * c];
  return [m[0] * vx + m[1] * vy + m[2] * vz, m[3] * vx + m[4] * vy + m[5] * vz, m[6] * vx + m[7] * vy + m[8] * vz];
};
const place = (at, turn, v) => rot(turn, v).map((c, i) => c + at[i]);

// tall fox ear (u across, v up), base sunk in the head
const EAR = [[-0.085, -0.05], [0.085, -0.05], [0.07, 0.035], [0.035, 0.125], [0.008, 0.18], [-0.008, 0.18], [-0.035, 0.125], [-0.07, 0.035]];
const EAR_IN = [[-0.052, -0.01], [0.052, -0.01], [0.04, 0.055], [0.018, 0.115], [0, 0.145], [-0.018, 0.115], [-0.04, 0.055]];
const EAR_AT = [0.14, 0.835, -0.02];
const EAR_TURN = [-0.05, 0.15, -0.3];

// flat-bottomed shoulder pad: a low dome (lathe profile r, y), sloping down and out
const PAD = [[0, 0.115], [0.07, 0.104], [0.118, 0.072], [0.145, 0.028], [0.145, 0]];
const PAD_AT = [0.21, 0.52, -0.01];
const PAD_TURN = [0, 0, -0.42];

// the thick tail: from behind the hips out to its left, up, tapering to a point; the brown band 55% along
const TAIL1 = [[0.05, 0.13, -0.11, 0.072], [0.19, 0.1, -0.2, 0.072], [0.34, 0.13, -0.23, 0.068], [0.45, 0.25, -0.2, 0.063], [0.49, 0.4, -0.15, 0.057]];
const TAIL2 = [[0.49, 0.4, -0.15, 0.057], [0.5, 0.53, -0.1, 0.049], [0.48, 0.65, -0.05, 0.038], [0.45, 0.74, -0.01, 0.025], [0.425, 0.8, 0.01, 0.012]];

// the +x leg: hip, knee out to the side, shin folding forward and in, a big three-toed foot pointing out and forward
const HIP = [0.09, 0.17, 0.0];
const KNEE = [0.34, 0.23, 0.08];
const ANKLE = [0.26, 0.075, 0.25];
const FOOT = [0.31, 0.05, 0.29];
const FOOT_TURN = [0, 0.85, 0];

// the +x arm: shoulder, elbow, hand in the lap
const SHOULDER = [0.22, 0.5, 0.0];
const ELBOW = [0.27, 0.34, 0.06];
const HAND = [0.1, 0.26, 0.22];

const recipe = {
  name: "Abra",
  dex: 63,
  height: 1,
  bones: {
    root: [0, 0, 0],
    body: { at: [0, 0.2, 0], parent: "root" },
    head: { at: [0, 0.58, 0.02], parent: "body" },
    earL: { at: EAR_AT, parent: "head" },
    earR: { at: [-EAR_AT[0], EAR_AT[1], EAR_AT[2]], parent: "head" },
    armL: { at: SHOULDER, parent: "body" },
    armR: { at: [-SHOULDER[0], SHOULDER[1], SHOULDER[2]], parent: "body" },
    legL: { at: HIP, parent: "body" },
    legR: { at: [-HIP[0], HIP[1], HIP[2]], parent: "body" },
    footL: { at: ANKLE, parent: "legL" },
    footR: { at: [-ANKLE[0], ANKLE[1], ANKLE[2]], parent: "legR" },
    tail1: { at: TAIL1[0].slice(0, 3), parent: "body" },
    tail2: { at: TAIL2[0].slice(0, 3), parent: "tail1" },
  },
  pieces: [
    // seated torso, mostly hidden by the arms and knees
    { name: "torso", kind: "ellipsoid", at: [0, 0.31, 0], r: [0.17, 0.2, 0.15], color: YELLOW, bone: "body" },
    { name: "hips", kind: "ellipsoid", at: [0, 0.17, 0.02], r: [0.17, 0.1, 0.15], color: YELLOW, bone: "body", blend: 0.06 },
    // black under the armor, the brown chest bib right under the muzzle, flat-bottomed brown shoulder pads
    { name: "underArmor", kind: "ellipsoid", at: [0, 0.505, -0.03], r: [0.18, 0.06, 0.13], color: BLACK, bone: "body" },
    { name: "bib", kind: "ellipsoid", at: [0, 0.5, 0.07], r: [0.14, 0.06, 0.09], color: BROWN, bone: "body" },
    { name: "pad", kind: "lathe", profile: PAD, at: PAD_AT, turn: PAD_TURN, scale: [1, 1, 0.92], color: BROWN, bone: "armL", mirror: true },
    // big round head bowed forward, a short snout pointing down and forward
    { name: "head", kind: "ellipsoid", at: [0, 0.745, 0.04], r: [0.215, 0.185, 0.19], turn: [0.35, 0, 0], color: YELLOW, bone: "head", blend: 0.03 },
    { name: "snout", kind: "cone", a: [0, 0.675, 0.11], b: [0, 0.6, 0.195], ra: 0.105, rb: 0.048, color: YELLOW, bone: "head", blend: 0.06 },
    { name: "cheek", kind: "ellipsoid", at: [0.1, 0.68, 0.1], r: [0.1, 0.08, 0.1], color: YELLOW, bone: "head", blend: 0.06, mirror: true },
    { name: "ear", kind: "slab", outline: EAR, smooth: true, depth: 0.05, round: 0.02, at: EAR_AT, turn: EAR_TURN, color: YELLOW, bone: "earL", blend: 0.03, mirror: true },
    // thin arms down to the hands resting in the lap, three long cream claws per hand
    { name: "upperArm", kind: "cone", a: SHOULDER, b: ELBOW, ra: 0.045, rb: 0.042, color: YELLOW, bone: "armL", blend: 0.03, mirror: true },
    { name: "forearm", kind: "cone", a: ELBOW, b: HAND, ra: 0.042, rb: 0.04, color: YELLOW, bone: "armL", blend: 0.025, mirror: true },
    { name: "hand", kind: "ellipsoid", at: HAND, r: [0.05, 0.04, 0.05], color: YELLOW, bone: "armL", blend: 0.02, mirror: true },
    ...[-0.03, 0, 0.03].map((dx, i) => ({
      name: `claw${i}`, kind: "cone", a: [HAND[0] + dx, HAND[1] - 0.01, HAND[2] + 0.025], b: [HAND[0] + dx * 1.3, HAND[1] - 0.08, HAND[2] + 0.05],
      ra: 0.019, rb: 0.009, color: CLAW, bone: "armL", mirror: true,
    })),
    // cross-legged: thighs out to the knees, shins folding forward, big feet out front
    { name: "thigh", kind: "cone", a: HIP, b: KNEE, ra: 0.075, rb: 0.06, color: YELLOW, bone: "legL", blend: 0.04, mirror: true },
    { name: "shin", kind: "cone", a: KNEE, b: ANKLE, ra: 0.058, rb: 0.045, color: YELLOW, bone: "legL", blend: 0.03, mirror: true },
    { name: "foot", kind: "ellipsoid", at: FOOT, r: [0.075, 0.05, 0.12], turn: FOOT_TURN, color: YELLOW, bone: "footL", blend: 0.03, mirror: true },
    ...[-0.04, 0, 0.04].map((u, i) => ({
      name: `toe${i}`, kind: "cone", a: place(FOOT, FOOT_TURN, [u, -0.005, 0.07]), b: place(FOOT, FOOT_TURN, [u * 1.5, -0.015, 0.2]),
      ra: 0.03, rb: 0.018, color: YELLOW, bone: "footL", blend: 0.015, mirror: true,
    })),
    // the tail
    { name: "tail1", kind: "chain", points: TAIL1, smooth: 0.03, color: YELLOW, bone: "tail1", blend: 0.04 },
    { name: "tail2", kind: "chain", points: TAIL2, smooth: 0.03, color: YELLOW, bone: "tail2", blend: 0.02 },
  ],
  paint: [
    // cream snout tip
    { name: "muzzle", color: MUZZLE, shape: { kind: "sphere", at: [0, 0.585, 0.215], r: 0.062 }, bones: ["head"] },
    // pale beige inside the ears
    { name: "innerEar", color: INNER, shape: { kind: "slab", outline: EAR_IN, smooth: true, depth: 0.04, at: place(EAR_AT, EAR_TURN, [0, 0, 0.035]), turn: EAR_TURN }, bones: ["earL"], mirror: true },
    // one brown band round the tail, about 55% along
    { name: "tailBand", color: BROWN, shape: { kind: "box", at: [0.495, 0.41, -0.15], size: [0.2, 0.1, 0.2], turn: [0.38, 0, -0.05] }, bones: ["tail1", "tail2"] },
  ],
  face: {
    eyes: [
      // closed: long arcs from high at the outer end down to low by the snout, a \ / pair, bowed up (HOME; viewer's left eye, +u = nose)
      { at: [-0.085, 0.69, 0.21], w: 0.11, h: 0.032, closed: 0.7, thick: 0.38, sclera: LINE, turn: -0.55, mirror: true },
    ],
  },
};

export default recipe;
