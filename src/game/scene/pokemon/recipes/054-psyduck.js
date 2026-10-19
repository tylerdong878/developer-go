// Psyduck (#54). Checked against art-54, home-54, the GO icon (refs/go256-54.png, species/go-54.png) and the
// Showdown 3D front/back (ani-psyduck, ani-back-psyduck).
// Numbers: notes/research/species-2.md (Psyduck) plus the corrections in notes/research/model-starters.md.
// 1 tall (tip of the middle hair to the soles), feet at y 0, facing +z, +x = Psyduck's own left (the viewer's right).
// GO pose: standing, arms hanging out to the sides like flippers (the headache pose is the art's, an idle action here).
// What matters most: the three black hairs fanned on top, and the huge flat cream bill.

const YELLOW = "#f7cd4c";
const BILL = "#fbf3d9";
const FEET = "#efe5bf";
const HAIR = "#26222a";
const SCLERA = "#fbfbf8";
const RIM = "#3a3428";
const DARK = "#1c1620";

// ---- small rotation helpers (three.js XYZ euler, same as the tool)
const rot = ([x = 0, y = 0, z = 0], [vx, vy, vz]) => {
  const a = Math.cos(x), b = Math.sin(x), c = Math.cos(y), d = Math.sin(y), e = Math.cos(z), f = Math.sin(z);
  const m = [c * e, -c * f, d, a * f + b * e * d, a * e - b * f * d, -b * c, b * f - a * e * d, b * e + a * f * d, a * c];
  return [m[0] * vx + m[1] * vy + m[2] * vz, m[3] * vx + m[4] * vy + m[5] * vz, m[6] * vx + m[7] * vy + m[8] * vz];
};
const place = (at, turn, v) => rot(turn, v).map((c, i) => c + at[i]);
const D = Math.PI / 180;

// ---- the three hairs: from one root on top, fanned side to side. deg = lean from vertical, + toward +x
const HAIR_ROOT = [0, 0.835, -0.02];
const HAIRS = [
  { name: "hairL", deg: -18, len: 0.14 },
  { name: "hairM", deg: 5, len: 0.168 },
  { name: "hairR", deg: 57, len: 0.135 },
];
const hairTip = (h) => [HAIR_ROOT[0] + Math.sin(h.deg * D) * h.len, HAIR_ROOT[1] + Math.cos(h.deg * D) * h.len, HAIR_ROOT[2] - 0.01];

// ---- the bill: a flat spoon, narrow at the face, a broad rounded front edge, tipped down ~33 degrees.
// Outline (u across = x, v forward from the base); the slab's depth is its thickness.
const BILL_SIDE = [[0.075, -0.05], [0.088, 0.03], [0.125, 0.09], [0.163, 0.145], [0.182, 0.19], [0.175, 0.222], [0.14, 0.245], [0.075, 0.256], [0, 0.258]];
const BILL_OUT = [...BILL_SIDE, ...BILL_SIDE.slice(0, -1).reverse().map(([u, v]) => [-u, v])];
const BILL_AT = [0, 0.67, 0.18];
const BILL_TURN = [(90 + 26) * D, 0, 0]; // local v -> forward and down, local depth -> about vertical

// ---- webbed feet: a flat oval and three toes at the front edge (+x foot)
const FOOT = { at: [0.14, 0.03, 0.09], r: [0.088, 0.032, 0.115], yaw: 0.2 };
const toes = () =>
  [-0.05, 0, 0.05].map((dx, i) => {
    const c = Math.cos(FOOT.yaw), s = Math.sin(FOOT.yaw), lz = 0.1;
    return { name: `toe${i}`, kind: "ellipsoid", at: [FOOT.at[0] + dx * c + lz * s, 0.026, FOOT.at[2] - dx * s + lz * c], r: [0.036, 0.026, 0.05], turn: [0, FOOT.yaw + dx * 4, 0], color: FEET, bone: "legL", blend: 0.012, mirror: true };
  });

const recipe = {
  name: "Psyduck",
  dex: 54,
  height: 1,
  bones: {
    root: [0, 0, 0],
    body: { at: [0, 0.2, 0], parent: "root" },
    head: { at: [0, 0.52, 0.0], parent: "body" },
    hair: { at: HAIR_ROOT, parent: "head" },
    armL: { at: [0.215, 0.455, 0.0], parent: "body" },
    armR: { at: [-0.215, 0.455, 0.0], parent: "body" },
    legL: { at: [0.14, 0.08, 0.05], parent: "root" },
    legR: { at: [-0.14, 0.08, 0.05], parent: "root" },
    tail: { at: [0, 0.2, -0.2], parent: "body" },
  },
  pieces: [
    // a pear: a wide lower body and a narrower chest, the head a wide ball sat right on it
    { name: "body", kind: "ellipsoid", at: [0, 0.235, 0.0], r: [0.29, 0.225, 0.26], color: YELLOW, bone: "body" },
    { name: "chest", kind: "ellipsoid", at: [0, 0.42, 0.0], r: [0.235, 0.15, 0.21], color: YELLOW, bone: "body", blend: 0.08 },
    { name: "head", kind: "ellipsoid", at: [0, 0.66, 0.0], r: [0.245, 0.2, 0.23], color: YELLOW, bone: "head", blend: 0.06 },
    // the eyes bulge a little off the head
    { name: "eyeBulge", kind: "ellipsoid", at: [0.122, 0.73, 0.145], r: [0.078, 0.052, 0.05], color: YELLOW, bone: "head", blend: 0.035, mirror: true },
    // the big flat bill, near-hard join so the cream edge is crisp; a bulge where it leaves the face
    { name: "billBase", kind: "ellipsoid", at: [0, 0.655, 0.2], r: [0.1, 0.065, 0.08], color: BILL, bone: "head", blend: 0.012 },
    { name: "bill", kind: "slab", outline: BILL_OUT, smooth: true, depth: 0.105, round: 0.05, at: BILL_AT, turn: BILL_TURN, color: BILL, bone: "head", blend: 0.012 },
    // three black hairs, hard joins
    ...HAIRS.map((h) => ({ name: h.name, kind: "cone", a: HAIR_ROOT, b: hairTip(h), ra: 0.019, rb: 0.018, color: HAIR, bone: "hair" })),
    // long tapered flipper arms hanging out to the sides
    { name: "arm", kind: "cone", a: [0.19, 0.465, 0.0], b: [0.455, 0.275, 0.035], ra: 0.075, rb: 0.026, squash: { axis: [0, 0, 1], k: 0.66 }, color: YELLOW, bone: "armL", blend: 0.04, mirror: true },
    // flat cream webbed feet
    { name: "foot", kind: "ellipsoid", at: FOOT.at, r: FOOT.r, turn: [0, FOOT.yaw, 0], color: FEET, bone: "legL", blend: 0.012, mirror: true },
    ...toes(),
    // a small pointed tail low on the back, up and back
    { name: "tail", kind: "cone", a: [0, 0.2, -0.2], b: [0, 0.26, -0.355], ra: 0.06, rb: 0.012, squash: { axis: [1, 0, 0], k: 0.7 }, color: YELLOW, bone: "tail", blend: 0.04 },
    { name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true },
  ],
  face: {
    eyes: [
      // a blank stare: wide white ovals, a dark rim, a pinpoint pupil a touch toward the nose, no glint
      { at: [-0.122, 0.73, 0.19], w: 0.145, h: 0.098, sclera: SCLERA, edge: { color: RIM, w: 0.14 }, iris: DARK, irisAt: [0.1, 0], irisSize: [0.1, 0.15], mirror: true },
    ],
    spots: [
      // two nostril dashes on top of the bill near its base, along the bill
      { name: "nostril", at: [-0.028, 0.67, 0.25], dir: place([0, 0, 0], BILL_TURN, [0, 0, 1]).map((c) => -c), r: [0.007, 0.014], color: DARK, lit: false, mirror: true },
    ],
  },
};

export default recipe;
