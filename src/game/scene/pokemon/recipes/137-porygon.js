// Porygon (#137). All flat-faced prisms, no curves: a pink octagonal head lying sideways with an eye on each side
// octagon, a cyan square-frustum beak, a pink hexagonal body with a cyan chest, cyan triangular front feet, big cyan
// block hind feet and a tall cyan four-sided tail spike. It floats; y 0 = the lowest point (the hind feet).
// Verified against art-137, home-137, the GO icon pm137, Serebii's go-137, bp-137-sm and the Showdown 3D front/back.
// Numbers: notes/research/species-3.md (Porygon), corrections in notes/research/model-facts-1.md.
// 1 tall (tail tip to the hind feet), facing +z (the beak), +x = Porygon's own left (the viewer's right).
// Everything is a hard union (blend 0). Bevels and tapers are bounded box carves; a carve cuts everything listed
// before it, so the order is: tail (+ its tapers), head (+ bevels), beak (+ tapers, which stop short of the head),
// then the uncarved parts.

const PINK = "#f25d72";
const CYAN = "#5ecfd8";
const EYE = "#f3eeee";
const DARK = "#1c1620";

// ---- small vector helpers (three.js euler XYZ)
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const nrm = (v) => {
  const l = Math.hypot(...v);
  return v.map((c) => c / l);
};
/** Euler XYZ that turns local x, y, z onto X, Y, Z. */
const eulerOf = (X, Y, Z) => {
  const y = Math.asin(Math.max(-1, Math.min(1, Z[0])));
  return Math.abs(Z[0]) < 0.9999 ? [Math.atan2(-Z[1], Z[2]), y, Math.atan2(-Y[0], X[0])] : [Math.atan2(Y[2], Y[1]), y, 0];
};
/** A frame from a main axis Z and a hint for Y. */
const frame = (Z, yHint) => {
  Z = nrm(Z);
  const X = nrm(crs(yHint, Z));
  return { X, Y: crs(Z, X), Z };
};
const inFrame = (o, F, [x, y, z]) => add(o, add(add(mul(F.X, x), mul(F.Y, y)), mul(F.Z, z)));
const dirIn = (F, [x, y, z]) => nrm(add(add(mul(F.X, x), mul(F.Y, y)), mul(F.Z, z)));
/**
 * A box carve that slices off everything beyond a plane, but only within a w x h patch of that plane:
 * p = a point on the plane, n = its outward normal, along = the patch's long direction, t = how deep the box goes.
 */
const slice = (name, p, n, along, w, h, t = 0.12) => {
  const F = frame(n, along);
  return { name, kind: "box", size: [w, h, t], at: add(p, mul(F.Z, t / 2)), turn: eulerOf(F.X, F.Y, F.Z), carve: true };
};

// ---- tail: a tall four-sided spike rising from the back, leaning back 0.1 rad
const TB = [0, 0.52, -0.175];
const TF = frame([0, Math.sin(0.1), Math.cos(0.1)], [0, 1, 0]); // Z = forward-ish, Y = up the spike
const TAIL_L = 0.49, TZ = 0.105, TX = 0.05, TIP = 0.012;
const tailPieces = [
  { name: "tail", kind: "box", size: [2 * TX, TAIL_L, 2 * TZ], at: inFrame(TB, TF, [0, TAIL_L / 2, 0]), round: 0.01, turn: eulerOf(TF.X, TF.Y, TF.Z), color: CYAN, bone: "tail" },
  // taper the four sides to the tip
  ...[1, -1].flatMap((s) => [
    slice(`tailZ${s}`, inFrame(TB, TF, [0, TAIL_L / 2, (s * (TZ + TIP)) / 2]), dirIn(TF, [0, TZ - TIP, s * TAIL_L]), dirIn(TF, [0, TAIL_L, -s * (TZ - TIP)]), 0.4, 0.9),
    slice(`tailX${s}`, inFrame(TB, TF, [(s * (TX + TIP)) / 2, TAIL_L / 2, 0]), dirIn(TF, [s * TAIL_L, TX - TIP, 0]), dirIn(TF, [-s * (TX - TIP), TAIL_L, 0]), 0.4, 0.9),
  ]),
];

// ---- head: an octagonal prism lying along x, the side octagons inset by a bevel all round
const HC = [0, 0.69, 0.165];
const A = 0.25; // apothem of the rim octagon (flat top, bottom, front, back)
const W = 0.215; // half width, side face to side face
const BV = 0.05, BX = 0.04; // bevel: inset on the side face, inset on the rim
const OCT = (ap) => Array.from({ length: 8 }, (_, k) => {
  const a = ((22.5 + 45 * k) * Math.PI) / 180, r = ap / Math.cos(Math.PI / 8);
  return [r * Math.cos(a), r * Math.sin(a)];
});
const HEAD_TURN = [0, Math.PI / 2, 0]; // slab depth along +x; outline u = -z, v = y
const headPieces = [
  { name: "head", kind: "slab", outline: OCT(A), depth: 2 * W, round: 0.014, at: HC, turn: HEAD_TURN, color: CYAN, bone: "head" },
  ...[1, -1].flatMap((s) =>
    Array.from({ length: 8 }, (_, k) => {
      const phi = (45 * (k + 1) * Math.PI) / 180;
      const m = [0, Math.sin(phi), -Math.cos(phi)]; // rim face normal (u = -z)
      const tg = [0, Math.cos(phi), Math.sin(phi)]; // along that rim edge
      const n = nrm(add([s * BV, 0, 0], mul(m, BX)));
      const p = add(HC, add([s * (W - BX / 2), 0, 0], mul(m, A - BV / 2)));
      return slice(`bevel${s}${k}`, p, n, tg, 0.12, 0.24, 0.1);
    }),
  ),
];

// ---- beak: a square frustum from the lower front of the head, pointing forward and down
const BB = [0, 0.58, 0.31];
const BF = frame([0, -0.56, 0.83], [0, 1, 0]);
const BL = 0.3, BW0 = 0.13, BH0 = 0.125, BW1 = 0.085, BH1 = 0.072, BZ0 = 0.12; // tapers start where it leaves the head
const beakPieces = [
  { name: "beak", kind: "box", size: [2 * BW0, 2 * BH0, BL], at: inFrame(BB, BF, [0, 0, BL / 2]), round: 0.014, turn: eulerOf(BF.X, BF.Y, BF.Z), color: CYAN, bone: "beak" },
  ...[1, -1].flatMap((s) => {
    const zc = (BZ0 + BL + 0.04) / 2, len = BL + 0.04 - BZ0;
    const xw = BW0 + ((BW1 - BW0) * zc) / BL, yh = BH0 + ((BH1 - BH0) * zc) / BL;
    return [
      slice(`beakX${s}`, inFrame(BB, BF, [s * xw, 0, zc]), dirIn(BF, [s * BL, 0, BW0 - BW1]), BF.Z, 0.3, len, 0.1),
      slice(`beakY${s}`, inFrame(BB, BF, [0, s * yh, zc]), dirIn(BF, [0, s * BL, BH0 - BH1]), BF.Z, 0.34, len, 0.1),
    ];
  }),
];

// ---- body: a pink hexagonal prism along z (flat sides, a ridge along the top), the cyan chest block on its front
const HEX = Array.from({ length: 6 }, (_, k) => {
  const a = ((90 + 60 * k) * Math.PI) / 180;
  return [0.236 * Math.cos(a), 0.19 * Math.sin(a)];
});
const BODY_AT = [0, 0.39, -0.08];
const CHEST = { at: [0, 0.322, 0.1], size: [0.35, 0.27, 0.29], turn: [-0.2, 0, 0] };
// front feet: cyan triangular prisms under the chest, pointing forward, out and down (for +x)
const FRONT = (s) => {
  const F = frame([s * 0.42, -0.3, 0.86], [0, 1, 0]);
  return { name: `front${s}`, kind: "slab", outline: [[-0.062, -0.036], [0.062, -0.036], [0, 0.072]], depth: 0.22, round: 0.014, at: [s * 0.16, 0.2, 0.235], turn: eulerOf(F.X, F.Y, F.Z), color: CYAN, bone: s > 0 ? "armL" : "armR" };
};

const recipe = {
  name: "Porygon",
  dex: 137,
  height: 1,
  bones: {
    root: [0, 0, 0],
    body: { at: [0, 0.39, -0.05], parent: "root" },
    head: { at: [0, 0.56, 0.08], parent: "body" },
    beak: { at: BB, parent: "head" }, // opens: rotate about x
    tail: { at: TB, parent: "body" },
    armL: { at: [0.13, 0.25, 0.17], parent: "body" },
    armR: { at: [-0.13, 0.25, 0.17], parent: "body" },
    legL: { at: [0.13, 0.27, -0.2], parent: "body" },
    legR: { at: [-0.13, 0.27, -0.2], parent: "body" },
  },
  pieces: [
    ...tailPieces,
    ...headPieces,
    ...beakPieces,
    { name: "body", kind: "slab", outline: HEX, depth: 0.42, round: 0.014, at: BODY_AT, color: CYAN, bone: "body" },
    { name: "chest", kind: "box", ...CHEST, round: 0.016, color: CYAN, bone: "body" },
    FRONT(1),
    FRONT(-1),
    // hind feet: big cyan blocks at the rear, the back end down at y 0, splayed out
    { name: "hind", kind: "box", size: [0.13, 0.12, 0.36], round: 0.018, at: [0.155, 0.162, -0.27], turn: [-0.75, 0.3, 0], color: CYAN, bone: "legL", mirror: true },
  ],
  paint: [
    // pink: the head prism and the body prism, each grown by 0.004 so their own faces are inside the paint and
    // everything else (beak, chest, feet, tail, all cyan) is outside it. No bone filter on these two: a filter
    // forces the distance on the other bone's vertices and drags the edge onto the triangle grid (a sawtooth)
    { name: "headPink", color: PINK, shape: { kind: "slab", outline: OCT(A + 0.004), depth: 2 * W + 0.008, at: HC, turn: HEAD_TURN } },
    { name: "bodyPink", color: PINK, shape: { kind: "slab", outline: HEX.map(([x, y]) => [x * 1.02, y * 1.023]), depth: 0.428, at: BODY_AT } },
    // eyes on the side octagons: a white octagon with a square pupil a hair forward of center
    { name: "eye", color: EYE, shape: { kind: "slab", outline: OCT(0.088), depth: 0.05, at: add(HC, [W, 0.008, 0.008]), turn: HEAD_TURN }, bones: ["head"], mirror: true },
    { name: "pupil", color: DARK, shape: { kind: "box", size: [0.05, 0.046, 0.04], at: add(HC, [W, 0.01, 0.016]) }, bones: ["head"], mirror: true },
  ],
};

export default recipe;
