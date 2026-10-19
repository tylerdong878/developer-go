// Machop (#66). GO stance: standing square, elbows out, loose fists by the hips, mouth closed.
// Verified against art-66, home-66, GO icon pm66 (and go-66, goS-66), Showdown 3D ani-machop / ani-back-machop.
// Numbers: notes/research/species-2b.md (Machop) plus the corrections in notes/research/model-wild-3.md.
// 1 tall (crest tip to soles), feet at y 0, facing +z, +x = Machop's own left (the viewer's right from the front).

const SKIN = "#9fcadb";
const CREST = "#c8c0a6";
const LINE = "#46606c";
const DARK = "#2a2230";

// ---- tiny rotation helper (three.js Euler "XYZ"), so a fin can be stood in the y-z plane and then splayed
const mul = (A, B) => [0, 1, 2].map((i) => [0, 1, 2].map((j) => A[i][0] * B[0][j] + A[i][1] * B[1][j] + A[i][2] * B[2][j]));
const Ry = (a) => [[Math.cos(a), 0, Math.sin(a)], [0, 1, 0], [-Math.sin(a), 0, Math.cos(a)]];
const Rz = (a) => [[Math.cos(a), -Math.sin(a), 0], [Math.sin(a), Math.cos(a), 0], [0, 0, 1]];
const toEuler = (m) => {
  const y = Math.asin(Math.max(-1, Math.min(1, m[0][2])));
  return Math.abs(m[0][2]) < 0.9999999 ? [Math.atan2(-m[1][2], m[2][2]), y, Math.atan2(-m[0][1], m[0][0])] : [Math.atan2(m[2][1], m[1][1]), y, 0];
};

// ---- crest fin: a curved blade in the fin's own (u = forward z, v = up y) plane, origin at the crown.
// Front edge rises from the hairline, the top curls back, the back edge runs down the back of the head.
// The bottom edge sits inside the head.
const FIN = [[0.115, -0.08], [0.118, 0.0], [0.104, 0.06], [0.07, 0.104], [0.022, 0.13], [-0.025, 0.128], [-0.05, 0.1], [-0.088, 0.058], [-0.128, 0.008], [-0.15, -0.055], [-0.1, -0.1], [0.06, -0.1]];
const CROWN = [0, 0.855, 0];
// Ry(-90deg) stands the outline in the y-z plane (outline u -> +z, depth -> x); Rz(s) after it splays the fin outward
const finTurn = (splay) => toEuler(mul(Rz(splay), Ry(-Math.PI / 2)));
const FIN_SIDE_X = 0.07;

const recipe = {
  name: "Machop",
  dex: 66,
  height: 1,
  bones: {
    root: [0, 0, 0],
    hips: { at: [0, 0.3, 0], parent: "root" },
    chest: { at: [0, 0.42, 0], parent: "hips" },
    head: { at: [0, 0.6, 0], parent: "chest" },
    armL: { at: [0.17, 0.53, 0], parent: "chest" },
    armR: { at: [-0.17, 0.53, 0], parent: "chest" },
    forearmL: { at: [0.25, 0.42, -0.02], parent: "armL" },
    forearmR: { at: [-0.25, 0.42, -0.02], parent: "armR" },
    legL: { at: [0.09, 0.27, 0], parent: "hips" },
    legR: { at: [-0.09, 0.27, 0], parent: "hips" },
    footL: { at: [0.12, 0.06, 0.02], parent: "legL" },
    footR: { at: [-0.12, 0.06, 0.02], parent: "legR" },
    tail: { at: [0, 0.29, -0.1], parent: "hips" },
  },
  pieces: [
    // torso: hips, chest, neck, all one skin
    { name: "hips", kind: "ellipsoid", at: [0, 0.31, 0], r: [0.145, 0.1, 0.112], color: SKIN, bone: "hips" },
    { name: "chest", kind: "ellipsoid", at: [0, 0.465, 0.005], r: [0.165, 0.125, 0.12], color: SKIN, bone: "chest", blend: 0.07 },
    { name: "neck", kind: "ellipsoid", at: [0, 0.6, -0.01], r: [0.11, 0.07, 0.09], color: SKIN, bone: "head", blend: 0.06 },
    // big kid head with a rounded jaw that juts forward
    { name: "head", kind: "ellipsoid", at: [0, 0.735, 0], r: [0.158, 0.148, 0.15], color: SKIN, bone: "head", blend: 0.07 },
    { name: "jaw", kind: "ellipsoid", at: [0, 0.655, 0.085], r: [0.134, 0.074, 0.108], color: SKIN, bone: "head", blend: 0.05 },
    // three crest fins, front to back over the top of the head; the side ones a touch shorter and splayed out
    { name: "finMid", kind: "slab", outline: FIN, smooth: true, depth: 0.05, round: 0.012, taper: 0.05, at: CROWN, turn: finTurn(0), color: CREST, bone: "head", blend: 0.012 },
    {
      name: "fin",
      kind: "slab",
      outline: FIN.map(([u, v]) => [u * 0.94, v * 0.9]),
      smooth: true,
      depth: 0.048,
      round: 0.012,
      taper: 0.05,
      at: [FIN_SIDE_X, CROWN[1] - 0.012, -0.005],
      turn: finTurn(-0.3),
      color: CREST,
      bone: "head",
      blend: 0.012,
      mirror: true,
    },
    // shoulders and arms: elbows out, fists down by the hips, a little forward
    { name: "shoulder", kind: "sphere", at: [0.165, 0.53, 0], r: 0.068, color: SKIN, bone: "armL", blend: 0.04, mirror: true },
    { name: "upperArm", kind: "cone", a: [0.175, 0.525, 0], b: [0.25, 0.42, -0.015], ra: 0.056, rb: 0.05, color: SKIN, bone: "armL", blend: 0.03, mirror: true },
    { name: "forearm", kind: "cone", a: [0.25, 0.42, -0.015], b: [0.255, 0.345, 0.03], ra: 0.054, rb: 0.06, color: SKIN, bone: "forearmL", blend: 0.03, mirror: true },
    { name: "fist", kind: "ellipsoid", at: [0.252, 0.31, 0.042], r: [0.066, 0.06, 0.07], color: SKIN, bone: "forearmL", blend: 0.025, mirror: true },
    // thick legs, slightly bowed, toes out
    { name: "thigh", kind: "cone", a: [0.09, 0.27, 0], b: [0.11, 0.15, 0.015], ra: 0.088, rb: 0.07, color: SKIN, bone: "legL", blend: 0.05, mirror: true },
    { name: "shin", kind: "cone", a: [0.11, 0.15, 0.015], b: [0.125, 0.06, 0.02], ra: 0.068, rb: 0.058, color: SKIN, bone: "legL", blend: 0.03, mirror: true },
    { name: "foot", kind: "ellipsoid", at: [0.125, 0.035, 0.055], r: [0.078, 0.045, 0.108], turn: [0, 0.3, 0], color: SKIN, bone: "footL", blend: 0.035, mirror: true },
    // small pointed tail low on the back
    { name: "tail", kind: "cone", a: [0, 0.29, -0.085], b: [0, 0.235, -0.215], ra: 0.042, rb: 0.008, color: SKIN, bone: "tail", blend: 0.03 },
    // flat soles
    { name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true },
  ],
  paint: [],
  face: {
    eyes: [
      // tall oval, dark rim, red iris pushed toward the nose so a white crescent shows on the outer side, vertical slit pupil.
      // Defined on the viewer's left eye (x < 0): +u points toward the nose.
      {
        at: [-0.1, 0.735, 0.13],
        w: 0.085,
        h: 0.122,
        turn: -0.18,
        sclera: "#fbfbf8",
        iris: "#d8605e",
        irisAt: [0.2, -0.02],
        irisSize: [0.74, 0.9],
        pupil: "#2a2026",
        pupilSize: [0.2, 0.52],
        edge: { color: DARK, w: 0.13 },
        glint: [0.05, 0.45, 0.12],
        mirror: true,
      },
    ],
    mouths: [
      // closed: a short line with turned-up ends, and the little "v" of the nose above its middle
      { name: "mouth", kind: "smile", at: [0, 0.627, 0.183], w: 0.1, h: 0.014, thick: 0.008, color: LINE },
      { name: "nose", kind: "smile", at: [0, 0.641, 0.188], w: 0.03, h: 0.016, thick: 0.007, color: LINE },
      // rib lines: three short curved dashes on each side of the lower chest
      { name: "rib1", kind: "frown", at: [-0.085, 0.395, 0.098], w: 0.07, h: 0.008, thick: 0.007, turn: 0.32, color: LINE, mirror: true },
      { name: "rib2", kind: "frown", at: [-0.085, 0.425, 0.108], w: 0.075, h: 0.008, thick: 0.007, turn: 0.32, color: LINE, mirror: true },
      { name: "rib3", kind: "frown", at: [-0.085, 0.455, 0.113], w: 0.07, h: 0.008, thick: 0.007, turn: 0.32, color: LINE, mirror: true },
      // two short vertical dashes on the outer front of each shin
      { name: "shinA", kind: "line", at: [-0.15, 0.13, 0.055], w: 0.035, h: 0.01, thick: 0.007, turn: 1.45, color: LINE, mirror: true },
      { name: "shinB", kind: "line", at: [-0.13, 0.12, 0.072], w: 0.03, h: 0.01, thick: 0.007, turn: 1.45, color: LINE, mirror: true },
    ],
  },
};

export default recipe;
