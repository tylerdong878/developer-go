// Growlithe (#58). GO pose: standing on all fours, head up, the cream plume up over the back.
// Checked against art-58, home-58, the GO icon (go-58, goS-58) and the Showdown 3D front/back (ani-growlithe, ani-back-growlithe).
// Numbers: notes/research/species-2b.md (Growlithe) plus the corrections in notes/research/model-wild-3.md.
// 1 tall (head tuft tip to soles), feet at y 0, facing +z (head forward), +x = Growlithe's own left (the viewer's right).
// The fluffy parts (head tuft, chest ruff, tail plume) are lumpy blends of cream pieces; the stripes are paint.

const ORANGE = "#f2994e";
const CREAM = "#fbe2b2";
const STRIPE = "#2f3a42";
const INNER = "#9c8470";
const NOSE = "#2a2c34";
const CLAW = "#f6efe6";
const MOUTH = "#a8764c";
const IRIS = "#24252d";
const DARK = "#2a2230";

// frame helper (three.js XYZ euler, same math as the tool's place())
const rot = ([x = 0, y = 0, z = 0], [vx, vy, vz]) => {
  const a = Math.cos(x), b = Math.sin(x), c = Math.cos(y), d = Math.sin(y), e = Math.cos(z), f = Math.sin(z);
  const m = [c * e, -c * f, d, a * f + b * e * d, a * e - b * f * d, -b * c, b * f - a * e * d, b * e + a * f * d, a * c];
  return [m[0] * vx + m[1] * vy + m[2] * vz, m[3] * vx + m[4] * vy + m[5] * vz, m[6] * vx + m[7] * vy + m[8] * vz];
};
const place = (at, turn, v) => rot(turn, v).map((c, i) => c + at[i]);

// legs: [x, z] of the front and back pairs (the +x side; mirror makes the other)
const FL = [0.12, 0.15];
const BL = [0.125, -0.21];

// round ear (u across, v up), cupped forward and out
const EAR = Array.from({ length: 12 }, (_, i) => {
  const t = (i / 12) * Math.PI * 2;
  return [0.068 * Math.cos(t), 0.082 * Math.sin(t) + 0.012 * Math.sin(t) ** 2];
});
const EAR_AT = [0.172, 0.725, 0.1];
const EAR_TURN = [-0.1, 0.55, -0.35];

// the tail plume: a big lumpy cream ball rising from the rump, leaning forward over the back, a few pointed tips
const PLUME = [0, 0.71, -0.37];

// spiky fur tuft: a cone from inside a mass out to a point
const spike = (name, a, b, ra, bone, color = CREAM, blend = 0.03) => ({ name, kind: "cone", a, b, ra, rb: 0.012, color, bone, blend });

const recipe = {
  name: "Growlithe",
  dex: 58,
  height: 1,
  bones: {
    root: [0, 0, 0],
    body: { at: [0, 0.4, -0.05], parent: "root" },
    head: { at: [0, 0.56, 0.13], parent: "body" },
    earL: { at: EAR_AT, parent: "head" },
    earR: { at: [-EAR_AT[0], EAR_AT[1], EAR_AT[2]], parent: "head" },
    tail: { at: [0, 0.5, -0.29], parent: "body" },
    legFL: { at: [FL[0], 0.3, FL[1]], parent: "body" },
    legFR: { at: [-FL[0], 0.3, FL[1]], parent: "body" },
    legBL: { at: [BL[0], 0.3, BL[1]], parent: "body" },
    legBR: { at: [-BL[0], 0.3, BL[1]], parent: "body" },
  },
  pieces: [
    // orange barrel body, a deeper chest in front, rounded haunches at the back
    { name: "torso", kind: "ellipsoid", at: [0, 0.4, -0.06], r: [0.165, 0.165, 0.25], color: ORANGE, bone: "body" },
    { name: "chest", kind: "ellipsoid", at: [0, 0.43, 0.09], r: [0.17, 0.16, 0.15], color: ORANGE, bone: "body", blend: 0.08 },
    { name: "haunch", kind: "ellipsoid", at: [0.115, 0.3, -0.2], r: [0.085, 0.13, 0.13], color: ORANGE, bone: "legBL", blend: 0.06, mirror: true },
    // short legs and round paws
    { name: "foreleg", kind: "cone", a: [FL[0], 0.32, FL[1]], b: [FL[0] + 0.01, 0.06, FL[1] + 0.01], ra: 0.068, rb: 0.06, color: ORANGE, bone: "legFL", blend: 0.04, mirror: true },
    { name: "forepaw", kind: "ellipsoid", at: [FL[0] + 0.012, 0.038, FL[1] + 0.035], r: [0.07, 0.042, 0.082], color: ORANGE, bone: "legFL", blend: 0.03, mirror: true },
    { name: "hindleg", kind: "cone", a: [BL[0], 0.24, BL[1]], b: [BL[0] + 0.005, 0.06, BL[1] + 0.02], ra: 0.058, rb: 0.052, color: ORANGE, bone: "legBL", blend: 0.04, mirror: true },
    { name: "hindpaw", kind: "ellipsoid", at: [BL[0] + 0.008, 0.036, BL[1] + 0.05], r: [0.064, 0.038, 0.078], color: ORANGE, bone: "legBL", blend: 0.03, mirror: true },
    // head: orange cranium right over the chest, a short flat cream muzzle (painted), round ears on the sides
    { name: "neck", kind: "ellipsoid", at: [0, 0.56, 0.1], r: [0.12, 0.1, 0.11], color: ORANGE, bone: "head", blend: 0.06 },
    { name: "cranium", kind: "ellipsoid", at: [0, 0.675, 0.13], r: [0.185, 0.15, 0.15], color: ORANGE, bone: "head", blend: 0.05 },
    { name: "muzzle", kind: "ellipsoid", at: [0, 0.59, 0.205], r: [0.165, 0.085, 0.12], color: ORANGE, bone: "head", blend: 0.05 },
    { name: "cheekTuft", kind: "cone", a: [0.12, 0.585, 0.18], b: [0.2, 0.56, 0.15], ra: 0.05, rb: 0.014, color: ORANGE, bone: "head", blend: 0.035, mirror: true },
    { name: "nose", kind: "ellipsoid", at: [0, 0.628, 0.318], r: [0.03, 0.024, 0.022], color: NOSE, bone: "head" },
    { name: "ear", kind: "slab", outline: EAR, smooth: true, depth: 0.04, round: 0.016, at: EAR_AT, turn: EAR_TURN, color: ORANGE, bone: "earL", blend: 0.025, mirror: true },
    // head tuft: a cream flame, the main point a little back of upright, smaller flames at the sides and one swept back
    { name: "tuftBase", kind: "ellipsoid", at: [0, 0.8, 0.11], r: [0.095, 0.065, 0.085], color: CREAM, bone: "head", blend: 0.025 },
    { name: "tuftMid", kind: "ellipsoid", at: [0, 0.865, 0.1], r: [0.068, 0.075, 0.062], color: CREAM, bone: "head", blend: 0.04 },
    spike("tuftMain", [0, 0.88, 0.1], [-0.012, 1.0, 0.065], 0.052, "head", CREAM, 0.035),
    spike("tuftSide", [0.03, 0.83, 0.11], [0.085, 0.9, 0.1], 0.042, "head", CREAM, 0.03),
    spike("tuftSide", [-0.03, 0.83, 0.11], [-0.08, 0.88, 0.11], 0.042, "head", CREAM, 0.03),
    spike("tuftBack", [0, 0.83, 0.07], [0.0, 0.87, -0.01], 0.045, "head", CREAM, 0.03),
    // chest ruff: a shaggy cream bib from under the chin down between the forelegs, jagged points round its edge
    { name: "ruff", kind: "ellipsoid", at: [0, 0.4, 0.19], r: [0.17, 0.17, 0.09], color: CREAM, bone: "body", blend: 0.03 },
    { name: "ruffUp", kind: "ellipsoid", at: [0, 0.52, 0.2], r: [0.15, 0.06, 0.09], color: CREAM, bone: "head", blend: 0.03 },
    ...[
      [[0.12, 0.45, 0.2], [0.21, 0.4, 0.17]],
      [[0.12, 0.34, 0.21], [0.19, 0.27, 0.2]],
      [[0.06, 0.28, 0.22], [0.09, 0.17, 0.22]],
      [[0.13, 0.52, 0.18], [0.21, 0.5, 0.14]],
    ].map(([a, b], i) => ({ ...spike(`ruffSpike${i}`, a, b, 0.05, "body"), mirror: true })),
    spike("ruffSpikeMid", [0, 0.28, 0.22], [0, 0.15, 0.23], 0.05, "body"),
    // the plume: lumpy cream balls blended into one, rising off the rump
    { name: "tailRoot", kind: "cone", a: [0, 0.44, -0.24], b: [0, 0.55, -0.32], ra: 0.09, rb: 0.14, color: CREAM, bone: "tail", blend: 0.03 },
    { name: "plume", kind: "ellipsoid", at: PLUME, r: [0.17, 0.21, 0.185], turn: [0.2, 0, 0], color: CREAM, bone: "tail", blend: 0.04 },
    { name: "plumeLow", kind: "sphere", at: [0, 0.56, -0.4], r: 0.13, color: CREAM, bone: "tail", blend: 0.07 },
    { name: "plumeBack", kind: "sphere", at: [0, 0.7, -0.5], r: 0.1, color: CREAM, bone: "tail", blend: 0.07 },
    { name: "plumeSide", kind: "sphere", at: [0.09, 0.69, -0.38], r: 0.105, color: CREAM, bone: "tail", blend: 0.07, mirror: true },
    spike("plumeTip0", [0, 0.86, -0.34], [0.0, 0.955, -0.3], 0.07, "tail", CREAM, 0.05),
    spike("plumeTip1", [0, 0.72, -0.5], [0.0, 0.7, -0.6], 0.06, "tail", CREAM, 0.05),
    spike("plumeTip3", [0, 0.82, -0.46], [0.0, 0.88, -0.52], 0.06, "tail", CREAM, 0.05),
    { ...spike("plumeTip2", [0.1, 0.74, -0.38], [0.19, 0.77, -0.39], 0.055, "tail", CREAM, 0.05), mirror: true },
    { name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true },
  ],
  paint: [
    // cream lower face: muzzle and cheeks up to just under the eyes
    { name: "muzzle", color: CREAM, shape: { kind: "ellipsoid", at: [0, 0.555, 0.22], r: [0.25, 0.085, 0.2] }, bones: ["head"] },
    // gray-brown inside the ears
    { name: "innerEar", color: INNER, shape: { kind: "ellipsoid", at: place(EAR_AT, EAR_TURN, [0, -0.005, 0.03]), r: [0.05, 0.062, 0.025], turn: EAR_TURN }, bones: ["earL"], mirror: true },
    // three stripes across the back and down each flank, leaning back as they go down, tapering at the ends
    ...[0.0, -0.1, -0.2].map((z, i) => ({ name: `flank${i}`, color: STRIPE, shape: { kind: "ellipsoid", at: [0, 0.5, z], r: [0.32, 0.2, 0.024], turn: [0.45, 0, 0] }, bones: ["body"] })),
    // two short stripes on the outer side of each haunch
    { name: "haunch1", color: STRIPE, shape: { kind: "ellipsoid", at: [0.2, 0.33, -0.24], r: [0.08, 0.02, 0.09], turn: [0.25, 0, 0.3] }, bones: ["legBL", "body"], mirror: true },
    { name: "haunch2", color: STRIPE, shape: { kind: "ellipsoid", at: [0.2, 0.24, -0.25], r: [0.08, 0.02, 0.085], turn: [0.25, 0, 0.3] }, bones: ["legBL"], mirror: true },
    // a V chevron pointing down on the front of each foreleg
    { name: "chevronOut", color: STRIPE, shape: { kind: "box", size: [0.09, 0.026, 0.12], at: [FL[0] + 0.035, 0.18, FL[1] + 0.05], turn: [0, 0, 0.6] }, bones: ["legFL"], mirror: true },
    { name: "chevronIn", color: STRIPE, shape: { kind: "box", size: [0.09, 0.026, 0.12], at: [FL[0] - 0.035, 0.18, FL[1] + 0.05], turn: [0, 0, -0.6] }, bones: ["legFL"], mirror: true },
    // three white claws on the front of each paw
    ...[-0.032, 0, 0.032].flatMap((dx, i) => [
      { name: `clawF${i}`, color: CLAW, shape: { kind: "sphere", at: [FL[0] + 0.012 + dx, 0.022, FL[1] + 0.112], r: 0.02 }, bones: ["legFL"], mirror: true },
      { name: `clawB${i}`, color: CLAW, shape: { kind: "sphere", at: [BL[0] + 0.008 + dx, 0.022, BL[1] + 0.124], r: 0.02 }, bones: ["legBL"], mirror: true },
    ]),
  ],
  face: {
    eyes: [
      // white almond, big dark iris toward the nose, top cut flat and slanting down to the nose (viewer's left eye, +u = nose)
      { at: [-0.09, 0.68, 0.27], w: 0.09, h: 0.075, sclera: "#fbfbf8", iris: IRIS, irisAt: [0.3, -0.15], irisSize: [0.55, 0.8], cut: [0.45, -0.35], glints: [[0.42, 0.05, 0.22]], mirror: true },
      // dark upper lid along that cut
      { at: [-0.09, 0.697, 0.268], w: 0.1, h: 0.075, closed: 0, thick: 0.15, sclera: DARK, turn: -0.27, mirror: true },
    ],
    mouth: { kind: "w", at: [0, 0.578, 0.32], w: 0.11, h: 0.018, thick: 0.007, color: MOUTH },
  },
};

export default recipe;
