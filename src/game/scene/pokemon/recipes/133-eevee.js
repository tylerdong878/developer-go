// Eevee (#133). Checked against art-133, home-133, the GO icon (refs/go-133.png, species/go-133.png) and the Showdown
// 3D front/back (ani-eevee, ani-back-eevee).
// Numbers: notes/research/species-3.md (Eevee) plus the corrections in notes/research/model-starters.md.
// 1 tall (ear tips to soles), feet at y 0, facing +z, +x = Eevee's own left (the viewer's right).
// GO pose: standing on all fours, head up, the huge ears spread wide in a V, the bushy tail up behind.
// What matters most: the ears (bigger than the head, dark inside) and the cream neck ruff.

const BROWN = "#cf9150";
const CREAM = "#f3e2b3";
const INNER = "#73441c";
const IRIS = "#6b3418";
const NOSE = "#3a2414";
const DARK = "#1c1620";

// ---- small rotation helpers (three.js XYZ euler, same as the tool)
const rot = ([x = 0, y = 0, z = 0], [vx, vy, vz]) => {
  const a = Math.cos(x), b = Math.sin(x), c = Math.cos(y), d = Math.sin(y), e = Math.cos(z), f = Math.sin(z);
  const m = [c * e, -c * f, d, a * f + b * e * d, a * e - b * f * d, -b * c, b * f - a * e * d, b * e + a * f * d, a * c];
  return [m[0] * vx + m[1] * vy + m[2] * vz, m[3] * vx + m[4] * vy + m[5] * vz, m[6] * vx + m[7] * vy + m[8] * vz];
};
const place = (at, turn, v) => rot(turn, v).map((c, i) => c + at[i]);

// ---- ears: a long pointed blade, widest low, base sunk into the head. (u across, v base to tip)
const EAR_SIDE = [[0.072, 0], [0.1, 0.08], [0.108, 0.17], [0.1, 0.27], [0.078, 0.36], [0.045, 0.45], [0.015, 0.505], [0, 0.526]];
const EAR = [[0.05, -0.07], ...EAR_SIDE, ...EAR_SIDE.slice(0, -1).reverse().map(([u, v]) => [-u, v]), [-0.05, -0.07]];
// the dark inside: the same blade inset about 0.022 from the edge, from just above the head to near the tip
const INNER_SIDE = [[0.052, 0.04], [0.077, 0.11], [0.083, 0.19], [0.075, 0.28], [0.055, 0.36], [0.028, 0.44], [0, 0.487]];
const INNER_EAR = [[0.04, -0.02], ...INNER_SIDE, ...INNER_SIDE.slice(0, -1).reverse().map(([u, v]) => [-u, v]), [-0.04, -0.02]];
const EAR_AT = [0.118, 0.677, 0.05];
// tilt out 50 degrees from vertical, face a little outward, lean back a little
const EAR_TURN = [-0.22, 0.3, -0.87];
const EAR_DEPTH = 0.046;

// ---- ruff: a cream collar under the chin, spiky round its lower edge and sides
const RUFF = { at: [0, 0.305, 0.085], r: [0.215, 0.155, 0.172], turn: [0.25, 0, 0] };
const ruffSpikes = () => {
  const out = [];
  // lower edge, front half: short broad tufts pointing down and out
  [-112, -90, -68, -45, -22, 0].forEach((deg, i) => {
    const t = (deg * Math.PI) / 180;
    const lift = 0.085 * (1 - Math.cos(t)), base = [0.172 * Math.sin(t), 0.19 + lift, 0.1 + 0.16 * Math.cos(t)];
    const tip = [base[0] + 0.03 * Math.sin(t), base[1] - 0.045, base[2] + 0.025 * Math.cos(t)];
    out.push({ name: `spike${i}`, kind: "cone", a: base, b: tip, ra: 0.04, rb: 0.012, color: CREAM, bone: "body", blend: 0.015, mirror: deg !== 0 });
  });
  // sides, higher up: tufts sticking out sideways past the cheeks
  [[0.36, 0.0], [0.29, -0.06]].forEach(([y, z], i) => {
    const base = [0.18, y, z + 0.07];
    const tip = [0.25, y - 0.035, z + 0.04];
    out.push({ name: `sideTuft${i}`, kind: "cone", a: base, b: tip, ra: 0.04, rb: 0.012, color: CREAM, bone: "body", blend: 0.015, mirror: true });
  });
  return out;
};

// ---- tail: a big bushy plume from the rump, up and back, widest in the middle, cream tip
const TAIL = [
  [0, 0.28, -0.3, 0.045],
  [0, 0.34, -0.38, 0.085],
  [0, 0.42, -0.46, 0.122],
  [0, 0.51, -0.51, 0.132],
  [0, 0.6, -0.54, 0.11],
  [0, 0.67, -0.55, 0.065],
  [0, 0.715, -0.55, 0.022],
];
// the cream tip with a ragged edge, in the side plane (z, y), extruded across x
const TAIL_TIP = [[-0.8, 0.6], [-0.8, 0.9], [-0.3, 0.9], [-0.3, 0.585], [-0.44, 0.61], [-0.48, 0.575], [-0.53, 0.62], [-0.58, 0.585], [-0.64, 0.625]];

const recipe = {
  name: "Eevee",
  dex: 133,
  height: 1,
  bones: {
    root: [0, 0, 0],
    body: { at: [0, 0.25, -0.05], parent: "root" },
    head: { at: [0, 0.4, 0.08], parent: "body" },
    earL: { at: EAR_AT, parent: "head" },
    earR: { at: [-EAR_AT[0], EAR_AT[1], EAR_AT[2]], parent: "head" },
    tail: { at: [0, 0.3, -0.3], parent: "body" },
    legFL: { at: [0.075, 0.2, 0.08], parent: "body" },
    legFR: { at: [-0.075, 0.2, 0.08], parent: "body" },
    legBL: { at: [0.09, 0.2, -0.24], parent: "body" },
    legBR: { at: [-0.09, 0.2, -0.24], parent: "body" },
  },
  pieces: [
    // a small body running back from behind the ruff
    { name: "body", kind: "ellipsoid", at: [0, 0.255, -0.1], r: [0.14, 0.13, 0.205], color: BROWN, bone: "body" },
    { name: "neck", kind: "ellipsoid", at: [0, 0.37, 0.03], r: [0.11, 0.1, 0.1], color: BROWN, bone: "head", blend: 0.06 },
    // big round head, a little wider than tall, a short muzzle
    { name: "head", kind: "ellipsoid", at: [0, 0.535, 0.1], r: [0.21, 0.182, 0.168], color: BROWN, bone: "head", blend: 0.05 },
    { name: "muzzle", kind: "ellipsoid", at: [0, 0.465, 0.19], r: [0.085, 0.055, 0.07], color: BROWN, bone: "head", blend: 0.05 },
    // spiky tuft on top of the head
    { name: "tuft0", kind: "cone", a: [0, 0.68, 0.13], b: [0.012, 0.76, 0.16], ra: 0.035, rb: 0.008, color: BROWN, bone: "head", blend: 0.02 },
    { name: "tuft1", kind: "cone", a: [0.045, 0.675, 0.12], b: [0.085, 0.74, 0.14], ra: 0.03, rb: 0.007, color: BROWN, bone: "head", blend: 0.02, mirror: true },
    // ears
    { name: "ear", kind: "slab", outline: EAR, smooth: true, depth: EAR_DEPTH, round: 0.015, taper: 0.05, at: EAR_AT, turn: EAR_TURN, color: BROWN, bone: "earL", blend: 0.035, mirror: true },
    // short slim legs: front ones under the ruff, hind ones with round thighs
    { name: "legF", kind: "cone", a: [0.075, 0.21, 0.07], b: [0.075, 0.04, 0.1], ra: 0.042, rb: 0.035, color: BROWN, bone: "legFL", blend: 0.03, mirror: true },
    { name: "pawF", kind: "ellipsoid", at: [0.077, 0.026, 0.12], r: [0.043, 0.028, 0.056], color: BROWN, bone: "legFL", blend: 0.02, mirror: true },
    { name: "thigh", kind: "ellipsoid", at: [0.09, 0.18, -0.235], r: [0.065, 0.09, 0.09], color: BROWN, bone: "legBL", blend: 0.04, mirror: true },
    { name: "legB", kind: "cone", a: [0.088, 0.15, -0.26], b: [0.086, 0.04, -0.235], ra: 0.038, rb: 0.033, color: BROWN, bone: "legBL", blend: 0.025, mirror: true },
    { name: "pawB", kind: "ellipsoid", at: [0.087, 0.026, -0.215], r: [0.041, 0.027, 0.054], color: BROWN, bone: "legBL", blend: 0.02, mirror: true },
    // the bushy tail
    { name: "tail", kind: "chain", points: TAIL, smooth: 0.03, color: BROWN, bone: "tail", blend: 0.05 },
    { name: "tailTip", kind: "cone", a: [0, 0.665, -0.55], b: [0.0, 0.75, -0.545], ra: 0.045, rb: 0.009, color: CREAM, bone: "tail", blend: 0.02 },
    // the cream ruff: a hard-ish join, so it sits on the chest like a collar and its edge stays crisp
    { name: "ruff", kind: "ellipsoid", ...RUFF, color: CREAM, bone: "body", blend: 0.012 },
    ...ruffSpikes(),
    { name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true },
  ],
  paint: [
    // dark insides of the ears, on the front face only (a slab just in front of the ear's mid plane)
    { name: "innerEar", color: INNER, shape: { kind: "slab", outline: INNER_EAR, smooth: true, depth: 0.05, at: place(EAR_AT, EAR_TURN, [0, 0, 0.026]), turn: EAR_TURN }, bones: ["earL"], mirror: true },
    // the cream tip of the tail, ragged edge
    { name: "tailTip", color: CREAM, shape: { kind: "slab", outline: TAIL_TIP, depth: 0.5, at: [0, 0, 0], turn: [0, -Math.PI / 2, 0] }, bones: ["tail"] },
  ],
  face: {
    eyes: [
      // big tall ovals: dark rim, red-brown iris, black pupil, a big glint up and out and a small one low and in
      { at: [-0.092, 0.53, 0.245], w: 0.082, h: 0.118, sclera: DARK, iris: IRIS, irisAt: [0, -0.1], irisSize: [0.8, 0.78], pupil: DARK, pupilSize: [0.42, 0.46], glints: [[-0.3, 0.42, 0.34], [0.32, -0.5, 0.14]], mirror: true },
    ],
    mouth: { kind: "w", at: [0, 0.448, 0.255], w: 0.046, h: 0.014, thick: 0.0055, color: DARK },
    spots: [
      { name: "nose", at: [0, 0.475, 0.26], r: [0.011, 0.007], color: NOSE, lit: false },
    ],
  },
};

export default recipe;
