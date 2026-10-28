// Greavard (#971). GO pose: standing on all fours, mouth wide open, the candle on its head lit.
// Checked against art-971, home-971 and the Showdown 3D front/back (ani-greavard, ani-back-greavard) in
// .cache/research/models/ref.
// 1 tall (paws to the candle's flame tip), feet at y 0, facing +z, +x = Greavard's own left (the viewer's right).
// A shaggy blue-white dog: a mop of fur over its eyes, long locks down its cheeks and flanks, a huge open mouth
// (carved, red inside) with zigzag teeth, a black nose on top of the snout, a wispy tail, and a bone-shaped
// candle on its head with a lilac flame and a yellow core.

const FUR = "#9aabc6";
const FUR_LIGHT = "#d6deeb";
const FUR_DARK = "#8495b2";
const PAW = "#7f8aa0";
const NOSE = "#2a2a33";
const MOUTH = "#b8394a";
const TONGUE = "#e27c86";
const TOOTH = "#f6f4ee";
const CANDLE = "#f3efe4";
const WICK = "#3a3438";
const FLAME = "#b79be2";
const CORE = "#fde48a";

// legs: [x, z] of the front and back pairs (the +x side; mirror makes the other)
const FL = [0.13, 0.13];
const BL = [0.13, -0.25];
const CANDLE_AT = [0, 0.63, 0.13];

// the zigzag teeth: points hanging from the top lip and standing on the bottom one, round the mouth's curve
const lipZ = (x, z0) => z0 - 2.2 * x * x;
const topTeeth = [-0.15, -0.09, -0.03, 0.03, 0.09, 0.15].map((x, i) => ({ name: `toothTop${i}`, kind: "cone", a: [x, 0.415, lipZ(x, 0.465)], b: [x, 0.35, lipZ(x, 0.47)], ra: 0.031, rb: 0.004, color: TOOTH, bone: "head" }));
const lowTeeth = [-0.12, -0.06, 0, 0.06, 0.12].map((x, i) => ({ name: `toothLow${i}`, kind: "cone", a: [x, 0.215, lipZ(x, 0.44)], b: [x, 0.27, lipZ(x, 0.45)], ra: 0.028, rb: 0.004, color: TOOTH, bone: "head" }));

// long locks of fur hanging round the body to the ground, the +x side and the back (mirror makes the other side)
const LOCKS = [[0.2, 0.06], [0.235, -0.05], [0.24, -0.16], [0.225, -0.27], [0.17, -0.35]];
const lock = ([x, z], i) => ({ name: `lock${i}`, kind: "cone", a: [x, 0.28, z], b: [x * 1.08, 0.075, z * 1.01], ra: 0.075, rb: 0.03, color: i % 2 ? FUR_DARK : FUR, bone: "body", blend: 0.04, mirror: true });

const recipe = {
  name: "Greavard",
  dex: 971,
  height: 1,
  bones: {
    root: [0, 0, 0],
    body: { at: [0, 0.33, -0.08], parent: "root" },
    head: { at: [0, 0.4, 0.16], parent: "body" },
    candle: { at: CANDLE_AT, parent: "head" },
    earL: { at: [0.24, 0.52, 0.22], parent: "head" },
    earR: { at: [-0.24, 0.52, 0.22], parent: "head" },
    tail: { at: [0, 0.43, -0.35], parent: "body" },
    legFL: { at: [FL[0], 0.2, FL[1]], parent: "body" },
    legFR: { at: [-FL[0], 0.2, FL[1]], parent: "body" },
    legBL: { at: [BL[0], 0.2, BL[1]], parent: "body" },
    legBR: { at: [-BL[0], 0.2, BL[1]], parent: "body" },
  },
  pieces: [
    // the shaggy body, long and low
    { name: "torso", kind: "ellipsoid", at: [0, 0.31, -0.08], r: [0.25, 0.21, 0.31], color: FUR, bone: "body" },
    // the big round head and its snout
    { name: "head", kind: "ellipsoid", at: [0, 0.42, 0.19], r: [0.26, 0.24, 0.24], color: FUR, bone: "head", blend: 0.08 },
    { name: "snout", kind: "ellipsoid", at: [0, 0.38, 0.31], r: [0.2, 0.17, 0.16], color: FUR, bone: "head", blend: 0.06 },
    // short legs and dark paws under the fur
    { name: "foreleg", kind: "cone", a: [FL[0], 0.22, FL[1]], b: [FL[0], 0.05, FL[1] + 0.01], ra: 0.065, rb: 0.058, color: FUR, bone: "legFL", blend: 0.04, mirror: true },
    { name: "forepaw", kind: "ellipsoid", at: [FL[0], 0.032, FL[1] + 0.03], r: [0.068, 0.034, 0.08], color: PAW, bone: "legFL", blend: 0.02, mirror: true },
    { name: "hindleg", kind: "cone", a: [BL[0], 0.22, BL[1]], b: [BL[0], 0.05, BL[1] + 0.01], ra: 0.068, rb: 0.058, color: FUR, bone: "legBL", blend: 0.04, mirror: true },
    { name: "hindpaw", kind: "ellipsoid", at: [BL[0], 0.032, BL[1] + 0.03], r: [0.068, 0.034, 0.08], color: PAW, bone: "legBL", blend: 0.02, mirror: true },
    // the long fur round the flanks and the rump, down to the ground
    ...LOCKS.map(lock),
    { name: "rumpLock", kind: "cone", a: [0, 0.28, -0.37], b: [0, 0.085, -0.4], ra: 0.08, rb: 0.03, color: FUR, bone: "body", blend: 0.04 },
    // the mop over its eyes: a fringe from the crown to the top of the snout, in strands
    { name: "mop", kind: "ellipsoid", at: [0, 0.56, 0.3], r: [0.23, 0.08, 0.13], color: FUR_LIGHT, bone: "head", blend: 0.04 },
    ...[-0.15, -0.075, 0, 0.075, 0.15].map((x, i) => ({ name: `fringe${i}`, kind: "cone", a: [x, 0.56, 0.36 - Math.abs(x) * 0.3], b: [x * 1.1, 0.46, 0.43 - Math.abs(x) * 0.5], ra: 0.045, rb: 0.016, color: i % 2 ? FUR : FUR_LIGHT, bone: "head", blend: 0.025 })),
    // long locks down its cheeks, like hanging ears
    { name: "ear", kind: "chain", points: [[0.23, 0.55, 0.22, 0.07], [0.27, 0.38, 0.25, 0.065], [0.26, 0.2, 0.23, 0.035]], smooth: 0.03, color: FUR_LIGHT, bone: "earL", blend: 0.04, squash: { axis: [1, 0, 0], k: 0.6 }, mirror: true },
    // the open mouth, carved deep into the snout, red inside
    { name: "mouth", kind: "ellipsoid", at: [0, 0.31, 0.5], r: [0.2, 0.115, 0.16], color: MOUTH, bone: "head", carve: true },
    // the zigzag teeth on both lips
    ...topTeeth,
    ...lowTeeth,
    // the black nose, on top of the snout
    { name: "nose", kind: "ellipsoid", at: [0, 0.485, 0.45], r: [0.062, 0.04, 0.042], color: NOSE, bone: "head" },
    // the wispy tail, curling up
    { name: "tail", kind: "chain", points: [[0, 0.42, -0.34, 0.05], [0, 0.56, -0.42, 0.036], [0.02, 0.68, -0.38, 0.026], [0.0, 0.77, -0.42, 0.012]], smooth: 0.03, color: FUR_LIGHT, bone: "tail", blend: 0.04, squash: { axis: [1, 0, 0], k: 0.6 } },
    // the candle on its head: a bone standing on end, a dark wick, a lilac flame
    { name: "bone", kind: "cone", a: [0, 0.6, CANDLE_AT[2]], b: [0, 0.745, CANDLE_AT[2]], ra: 0.034, rb: 0.034, color: CANDLE, bone: "candle", blend: 0.01 },
    { name: "boneKnob", kind: "sphere", at: [0.034, 0.755, CANDLE_AT[2]], r: 0.04, color: CANDLE, bone: "candle", blend: 0.012, mirror: true },
    { name: "boneFoot", kind: "sphere", at: [0.032, 0.63, CANDLE_AT[2]], r: 0.032, color: CANDLE, bone: "candle", blend: 0.012, mirror: true },
    { name: "wick", kind: "cone", a: [0, 0.77, CANDLE_AT[2]], b: [0, 0.83, CANDLE_AT[2]], ra: 0.008, rb: 0.006, color: WICK, bone: "candle" },
    { name: "flame", kind: "chain", points: [[0, 0.845, CANDLE_AT[2], 0.03], [0, 0.89, CANDLE_AT[2], 0.055], [0, 0.95, CANDLE_AT[2], 0.034], [0, 0.998, CANDLE_AT[2], 0.004]], smooth: 0.03, color: FLAME, bone: "candle", squash: { axis: [0, 0, 1], k: 0.75 } },
    { name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true },
  ],
  paint: [
    // a paler band of fur round its middle (art, HOME)
    { name: "band", color: FUR_LIGHT, soft: 0.04, shape: { kind: "box", size: [1, 1, 0.16], at: [0, 0.4, -0.1] }, bones: ["body"] },
    // the tongue low in the mouth
    { name: "tongue", color: TONGUE, shape: { kind: "ellipsoid", at: [0, 0.24, 0.42], r: [0.12, 0.05, 0.1] }, bones: ["head"] },
    // the flame's yellow core
    { name: "core", color: CORE, soft: 0.012, shape: { kind: "ellipsoid", at: [0, 0.885, CANDLE_AT[2]], r: [0.038, 0.048, 0.1] }, bones: ["candle"] },
  ],
};

export default recipe;
