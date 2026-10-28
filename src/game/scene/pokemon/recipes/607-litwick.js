// Litwick (#607). GO pose: standing, the flame straight up.
// Checked against art-607, home-607 and the Showdown 3D front/back (ani-litwick, ani-back-litwick) in
// .cache/research/models/ref.
// 1 tall (feet to flame tip), feet at y 0, facing +z, +x = Litwick's own left (the viewer's right).
// A white wax candle, wider at the top where the melted wax hangs over the face in drips, one long lock over its
// right eye; a lavender pool of wax on top and a blue-violet flame with a pale core.

const WAX = "#eef0fb";
const DRIP = "#e6e8f8";
const POOL = "#c4c2ee";
const SHADE = "#d3d8f3";
const FLAME = "#6f6bd2";
const FLAME_LOW = "#7fa6ea";
const CORE = "#cbd7fb";
const EYE = "#f3c632";
const EYE_RIM = "#a77a12";
const MOUTH = "#4a4664";

const TOP = 0.6;
// the drips round the brim, every so often, a little longer at the front
const DRIPS = 8;
const drip = (i) => {
  const a = (i / DRIPS) * Math.PI * 2 + 0.26;
  const front = Math.max(0, Math.cos(a));
  const r0 = 0.252, r1 = 0.238, len = 0.05 + front * 0.03;
  return { name: `drip${i}`, kind: "cone", a: [Math.sin(a) * r0, 0.43, Math.cos(a) * r0], b: [Math.sin(a) * r1, 0.43 - len, Math.cos(a) * r1], ra: 0.075, rb: 0.064, color: DRIP, bone: "head", blend: 0.035 };
};

const recipe = {
  name: "Litwick",
  dex: 607,
  height: 1,
  bones: {
    root: [0, 0, 0],
    body: { at: [0, 0.2, 0], parent: "root" },
    head: { at: [0, 0.42, 0], parent: "body" },
    flame: { at: [0, TOP + 0.04, 0], parent: "head" },
    armL: { at: [0.22, 0.22, 0.02], parent: "body" },
    armR: { at: [-0.22, 0.22, 0.02], parent: "body" },
  },
  pieces: [
    // the candle: narrow below, swelling into the brim of melted wax, the top flat with a soft edge
    { name: "candle", kind: "lathe", profile: [[0, 0.04], [0.12, 0.045], [0.18, 0.07], [0.22, 0.12], [0.25, 0.2], [0.28, 0.3], [0.3, 0.4], [0.302, 0.47], [0.285, 0.53], [0.245, 0.57], [0.17, TOP - 0.005], [0, TOP]], color: WAX, bone: "body" },
    // the drips hanging from the brim, all the way round
    ...Array.from({ length: DRIPS }, (_, i) => drip(i)),
    // the long lock over its right eye
    { name: "lock", kind: "chain", points: [[-0.1, 0.47, 0.25, 0.07], [-0.115, 0.37, 0.235, 0.064], [-0.105, 0.28, 0.215, 0.052]], smooth: 0.02, color: DRIP, bone: "head", blend: 0.03 },
    // stubby arms and feet, and the wax pooled round the bottom
    { name: "arm", kind: "ellipsoid", at: [0.225, 0.2, 0.03], r: [0.05, 0.042, 0.045], color: WAX, bone: "armL", blend: 0.03, mirror: true },
    { name: "foot", kind: "ellipsoid", at: [0.09, 0.035, 0.1], r: [0.075, 0.035, 0.075], color: WAX, bone: "body", blend: 0.03, mirror: true },
    { name: "puddle", kind: "ellipsoid", at: [0, 0.028, 0.02], r: [0.2, 0.028, 0.2], color: WAX, bone: "body", blend: 0.04 },
    // the flame: a round base sunk in the wax pool, drawn up to a point
    { name: "flame", kind: "chain", points: [[0, TOP + 0.03, 0, 0.05], [0, TOP + 0.12, 0, 0.13], [0, TOP + 0.21, -0.005, 0.105], [0.005, TOP + 0.32, -0.015, 0.045], [0.01, TOP + 0.4, -0.025, 0.006]], smooth: 0.06, color: FLAME, bone: "flame", squash: { axis: [0, 0, 1], k: 0.8 } },
    { name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true },
  ],
  paint: [
    // the wax under the brim a little lavender, like the art, with the drips and the lock white over it
    { name: "under", color: SHADE, soft: 0.02, shape: { kind: "box", size: [1, 0.44, 1], at: [0, 0.16, 0] }, bones: ["body"] },
    ...Array.from({ length: DRIPS }, (_, i) => { const d = drip(i); return { name: `dripWax${i}`, color: DRIP, shape: { kind: "cone", a: d.a, b: d.b, ra: d.ra + 0.012, rb: d.rb + 0.012 }, bones: ["head"] }; }),
    { name: "lockWax", color: DRIP, shape: { kind: "chain", points: [[-0.1, 0.47, 0.25, 0.082], [-0.115, 0.37, 0.235, 0.076], [-0.105, 0.28, 0.215, 0.064]] }, bones: ["head"] },
    // the lavender pool of wax on top
    { name: "pool", color: POOL, shape: { kind: "ellipsoid", at: [0, TOP + 0.01, 0], r: [0.34, 0.035, 0.34] }, bones: ["head"] },
    // the flame lighter at its base, and a pale inner flame on both faces
    { name: "flameLow", color: FLAME_LOW, soft: 0.025, shape: { kind: "ellipsoid", at: [0, TOP + 0.06, 0], r: [0.2, 0.135, 0.2] }, bones: ["flame"] },
    { name: "core", color: CORE, shape: { kind: "slab", outline: [[0, 0.0], [0.05, 0.035], [0.055, 0.09], [0.032, 0.16], [0, 0.21], [-0.032, 0.16], [-0.055, 0.09], [-0.05, 0.035]], smooth: true, depth: 0.6, at: [0, TOP + 0.07, 0], turn: [0, 0, 0] }, bones: ["flame"] },
  ],
  face: {
    eyes: [
      // its one showing eye, its left, yellow with a darker rim, just under the brim
      { name: "eye", at: [0.11, 0.32, 0.23], w: 0.07, h: 0.085, sclera: EYE, edge: { color: EYE_RIM, w: 0.2 }, glints: [[0.25, 0.3, 0.22]] },
    ],
    mouth: { kind: "smile", at: [0.01, 0.22, 0.25], w: 0.075, h: 0.018, thick: 0.009, color: MOUTH },
  },
};

export default recipe;
