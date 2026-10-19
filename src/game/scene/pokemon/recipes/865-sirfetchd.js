// Sirfetch'd (#865). A stern white duck knight: the leek sword held upright in its right wing (the viewer's left),
// the leaf shield on its left (the viewer's right) with a leek spike rising from it.
// Verified against art-865, home-865, the GO icon pm865, Serebii's go-865 and the Showdown 3D front/back.
// Numbers: notes/research/species-3.md (Sirfetch'd), corrections in notes/research/model-facts-1.md.
// 1 tall = the leek tip (the bird alone reaches 0.49 at its crest), feet at y 0, facing +z, +x = its own left.
// The bird is centered on x 0; the leek and shield are rigid pieces on armR / armL, hard-unioned to the wings.

const WHITE = "#f3f2ef";
const LEEK = "#b2d672";
const LEEK_WHITE = "#eef3e0";
const BILL = "#f6cd3f";
const BILL_LOW = "#e3b733";
const FEET = "#f2c23a";
const BROW = "#2e2a28";
const IRIS = "#a97a60";
const SHIELD = "#104a36";
const VEIN = "#94c63c";
const ROOT = "#c7ae7e";
const DARK = "#1c1620";

// ---- small vector helpers (three.js euler XYZ)
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const nrm = (v) => {
  const l = Math.hypot(...v);
  return v.map((c) => c / l);
};
const rot = ([x = 0, y = 0, z = 0], [vx, vy, vz]) => {
  const a = Math.cos(x), b = Math.sin(x), c = Math.cos(y), d = Math.sin(y), e = Math.cos(z), f = Math.sin(z);
  const m = [c * e, -c * f, d, a * f + b * e * d, a * e - b * f * d, -b * c, b * f - a * e * d, b * e + a * f * d, a * c];
  return [m[0] * vx + m[1] * vy + m[2] * vz, m[3] * vx + m[4] * vy + m[5] * vz, m[6] * vx + m[7] * vy + m[8] * vz];
};
const place = (at, turn, v) => add(at, rot(turn, v));

// ---- the leek sword (in its right wing, -x)
const LX = -0.152, LZ = 0.045, LR = 0.026;
const CUT_AT = [LX, 0.975, LZ];
const CUT_N = nrm([-0.55, 0.6, 0.58]); // the slanted cut faces up, out to the viewer's left and forward

// ---- the leaf shield (on its left wing, +x): a serrated leaf, teeth pointing out and down
const HALF = [[0.0, 0.165], [0.03, 0.125], [0.058, 0.104], [0.098, 0.075], [0.075, 0.062], [0.122, 0.024], [0.098, 0.012], [0.135, -0.036], [0.104, -0.044], [0.13, -0.098], [0.09, -0.094], [0.098, -0.148], [0.052, -0.122], [0.03, -0.168], [0.0, -0.132]];
const LEAF = [...HALF, ...HALF.slice(1, -1).reverse().map(([u, v]) => [-u * 0.94, v + 0.004])];
// the light vein: a narrow feathered midrib from the spike base down the middle
const VHALF = [[0.0, 0.11], [0.018, 0.07], [0.042, 0.06], [0.022, 0.035], [0.05, 0.015], [0.024, -0.005], [0.04, -0.03], [0.014, -0.04], [0.0, -0.075]];
const VEIN_OUT = [...VHALF, ...VHALF.slice(1, -1).reverse().map(([u, v]) => [-u, v])];
const SH_AT = [0.165, 0.175, 0.105];
const SH_TURN = [0.05, -0.3, -0.04];

const recipe = {
  name: "Sirfetch'd",
  dex: 865,
  height: 1,
  bones: {
    root: [0, 0, 0],
    body: { at: [0, 0.1, 0], parent: "root" },
    head: { at: [0, 0.27, 0.0], parent: "body" },
    armR: { at: [-0.075, 0.27, 0.02], parent: "body" }, // sword wing + leek
    armL: { at: [0.075, 0.25, 0.02], parent: "body" }, // shield wing + shield
    legL: { at: [0.045, 0.08, 0.01], parent: "root" },
    legR: { at: [-0.04, 0.08, 0.01], parent: "root" },
  },
  pieces: [
    // ---- the bird: one white egg, head and body together
    { name: "body", kind: "ellipsoid", at: [0, 0.19, 0], r: [0.104, 0.125, 0.098], color: WHITE, bone: "body" },
    { name: "head", kind: "ellipsoid", at: [0, 0.32, 0.008], r: [0.074, 0.075, 0.074], color: WHITE, bone: "head", blend: 0.07 },
    // crest: three flat white paddles fanned on top, the middle one tallest
    { name: "crestMid", kind: "ellipsoid", at: [0, 0.432, -0.012], r: [0.027, 0.057, 0.017], turn: [-0.15, 0, 0], color: WHITE, bone: "head", blend: 0.012 },
    { name: "crest", kind: "ellipsoid", at: [0.032, 0.415, -0.006], r: [0.023, 0.043, 0.016], turn: [-0.1, 0, -0.6], color: WHITE, bone: "head", blend: 0.012, mirror: true },
    // the big flat duck bill
    { name: "bill", kind: "ellipsoid", at: [0, 0.29, 0.098], r: [0.05, 0.018, 0.064], turn: [0.08, 0, 0], color: BILL, bone: "head", blend: 0.003 },
    { name: "billTip", kind: "ellipsoid", at: [0, 0.287, 0.14], r: [0.055, 0.016, 0.03], color: BILL, bone: "head", blend: 0.006 },
    { name: "jaw", kind: "ellipsoid", at: [0, 0.27, 0.09], r: [0.042, 0.012, 0.05], turn: [0.12, 0, 0], color: BILL_LOW, bone: "head", blend: 0.006 },
    // short yellow legs and three-toed feet
    { name: "leg", kind: "cone", a: [0.045, 0.09, 0.01], b: [0.045, 0.02, 0.02], r: 0.016, color: FEET, bone: "legL", blend: 0.01, mirror: true },
    ...[-0.5, 0, 0.5].map((a, i) => ({
      name: `toe${i}`, kind: "cone", a: [0.045, 0.014, 0.02], b: [0.045 + Math.sin(a) * 0.045, 0.011, 0.02 + Math.cos(a) * 0.05], ra: 0.016, rb: 0.012, color: FEET, bone: "legL", blend: 0.008, mirror: true,
    })),
    // ---- sword wing: from the right shoulder out to the leek, wrapped round it, ragged feather ends hanging down
    { name: "swordArm", kind: "cone", a: [-0.07, 0.26, 0.02], b: [LX + 0.02, 0.265, LZ], ra: 0.042, rb: 0.038, color: WHITE, bone: "armR", blend: 0.03 },
    { name: "grip", kind: "ellipsoid", at: [LX, 0.262, LZ + 0.005], r: [0.052, 0.07, 0.048], color: WHITE, bone: "armR", blend: 0.02 },
    // a cuff of layered feathers round the grip, the outer ones drooping out past the leek (to x -0.25)
    { name: "cuff", kind: "ellipsoid", at: [LX - 0.04, 0.275, LZ + 0.01], r: [0.045, 0.045, 0.04], turn: [0, 0, 0.5], color: WHITE, bone: "armR", blend: 0.02 },
    ...[[-0.095, 0.0, 0.2, 0.7], [-0.07, 0.02, 0.185, 0.45], [-0.04, 0.03, 0.172, 0.2], [-0.012, 0.035, 0.17, 0.05], [0.028, 0.025, 0.185, -0.15]].map(([dx, dz, y, tz], i) => ({
      name: `swordFeather${i}`, kind: "ellipsoid", at: [LX + dx, y + 0.035, LZ + dz], r: [0.021, 0.052, 0.018], turn: [0, 0, tz], color: WHITE, bone: "armR", blend: 0.012,
    })),
    // the leek itself: one stalk, white below and green above (paint), the root bulb and its curl at the foot
    { name: "leek", kind: "cone", a: [LX, 0.07, LZ], b: [LX, 1.02, LZ], ra: LR + 0.002, rb: LR, color: LEEK_WHITE, bone: "armR" },
    { name: "leekCut", kind: "half", at: CUT_AT, dir: CUT_N, carve: true },
    { name: "bulb", kind: "ellipsoid", at: [LX - 0.006, 0.062, LZ], r: [0.038, 0.034, 0.038], color: ROOT, bone: "armR" },
    { name: "rootCurl", kind: "chain", points: [[LX - 0.02, 0.04, LZ + 0.005, 0.014], [LX - 0.05, 0.02, LZ + 0.02, 0.012], [LX - 0.085, 0.018, LZ + 0.03, 0.011], [LX - 0.1, 0.04, LZ + 0.03, 0.01], [LX - 0.088, 0.058, LZ + 0.025, 0.009]], color: ROOT, bone: "armR", blend: 0.01 },
    // ---- shield wing (mostly behind the shield) and the shield
    { name: "shieldArm", kind: "ellipsoid", at: [0.1, 0.22, 0.04], r: [0.05, 0.075, 0.05], turn: [0, 0, -0.4], color: WHITE, bone: "armL", blend: 0.03 },
    { name: "shield", kind: "slab", outline: LEAF, depth: 0.04, round: 0.014, at: SH_AT, turn: SH_TURN, color: SHIELD, bone: "armL" },
    // the leek spike rising from the shield's top
    { name: "spike", kind: "cone", a: place(SH_AT, SH_TURN, [-0.035, 0.11, -0.03]), b: place(SH_AT, SH_TURN, [-0.05, 0.325, -0.035]), ra: 0.036, rb: 0.007, color: LEEK, bone: "armL", blend: 0.008 },
    { name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true },
  ],
  paint: [
    // the upper leek is green, fading to white below u 0.46
    { name: "leekGreen", color: LEEK, soft: 0.03, shape: { kind: "half", at: [0, 0.465, 0], dir: [0, 1, 0] }, bones: ["armR"] },
    // the thick dark V unibrow
    { name: "brow", color: BROW, shape: { kind: "slab", outline: [[-0.068, 0.372], [-0.062, 0.355], [0, 0.333], [0.062, 0.355], [0.068, 0.372], [0, 0.351]], depth: 0.1, at: [0, 0, 0.07] }, bones: ["head"] },
    // the light feathered vein on the shield's face
    { name: "vein", color: VEIN, shape: { kind: "slab", outline: VEIN_OUT, depth: 0.03, at: place(SH_AT, SH_TURN, [-0.015, 0.035, 0.02]), turn: SH_TURN }, bones: ["armL"] },
  ],
  face: {
    eyes: [
      // narrow, heavy-lidded: the top cut flat by a dark lid, a light brown iris
      { at: [-0.032, 0.322, 0.074], w: 0.036, h: 0.026, sclera: "#ffffff", iris: IRIS, irisAt: [0.1, -0.15], irisSize: [0.42, 0.8], pupil: DARK, pupilSize: [0.16, 0.36], cut: [0.3, 0.06], edge: { color: DARK, w: 0.14 }, mirror: true },
    ],
    mouths: [
      // the heavy upper lid line over each eye
      { name: "lid", kind: "line", at: [-0.032, 0.3265, 0.076], turn: 0.06, w: 0.04, h: 0.01, thick: 0.0065, color: DARK, mirror: true },
    ],
    spots: [
      // rings on the leek's cut face (lit, they shade with the leek)
      { name: "cutRing", at: CUT_AT, dir: CUT_N, r: [0.021, 0.031], color: "#e2f2b4" },
      { name: "cutMid", at: CUT_AT, dir: CUT_N, r: [0.014, 0.021], color: "#a2ca62" },
      { name: "cutCore", at: CUT_AT, dir: CUT_N, r: [0.006, 0.009], color: "#e2f2b4" },
    ],
  },
};

export default recipe;
