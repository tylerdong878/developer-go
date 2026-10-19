// Pikachu (#25). Verified against art-25, home-25, GO icon pm25 and the Showdown 3D front/back (ani-pikachu, ani-back-pikachu).
// Numbers: notes/research/species-1.md (Pikachu) plus the corrections in notes/research/model-starters.md.
// 1 tall (ear tip to soles), feet at y 0, facing +z, +x = Pikachu's own left (the viewer's right from the front).

const YELLOW = "#f7d02c";
const BROWN = "#8c5a2b";
const DARK = "#1c1620";
const CHEEK = "#ee5a42";

// Ear: a flat lance, widest a third up. Base sinks into the head.
const EAR_SIDE = [[0.036, 0], [0.051, 0.07], [0.054, 0.118], [0.047, 0.198], [0.03, 0.268], [0.012, 0.326], [0, 0.364]];
const EAR = [[0.03, -0.06], ...EAR_SIDE, ...EAR_SIDE.slice(0, -1).reverse().map(([u, v]) => [-u, v]), [-0.03, -0.06]];
const EAR_AT = [0.115, 0.69, -0.02];
const EAR_TURN = [-0.18, 0.12, -0.5];

// Tail: the bolt outline traced from HOME (base at the origin, +u outward, +v up), and its brown base with a fur edge.
const TAIL = [[0.032, 0.008], [0.132, 0.038], [0.088, 0.089], [0.224, 0.17], [0.16, 0.272], [0.409, 0.35], [0.441, 0.546], [0.021, 0.315], [0.118, 0.19], [0.007, 0.109], [-0.025, 0.033]];
const TAIL_BASE = [[-0.04, 0.03], [-0.025, -0.01], [0.032, -0.01], [0.14, 0.03], [0.112, 0.075], [0.095, 0.058], [0.08, 0.09], [0.062, 0.066], [0.042, 0.094], [0.026, 0.068], [0.006, 0.088], [-0.03, 0.06]];
const TAIL_AT = [0.07, 0.15, -0.19];
const TAIL_TURN = [0.12, 0.42, -0.12];

const recipe = {
  name: "Pikachu",
  dex: 25,
  height: 1,
  bones: {
    root: [0, 0, 0],
    head: { at: [0, 0.42, 0], parent: "root" },
    earL: { at: EAR_AT, parent: "head" },
    earR: { at: [-EAR_AT[0], EAR_AT[1], EAR_AT[2]], parent: "head" },
    armL: [0.15, 0.42, 0.1],
    armR: [-0.15, 0.42, 0.1],
    footL: [0.12, 0.04, 0.04],
    footR: [-0.12, 0.04, 0.04],
    tail: TAIL_AT,
  },
  pieces: [
    // one pear: hips, a waist filler so there's no neck, and the head, all blended
    { name: "body", kind: "ellipsoid", at: [0, 0.21, 0], r: [0.25, 0.205, 0.22], color: YELLOW, bone: "root" },
    { name: "waist", kind: "ellipsoid", at: [0, 0.4, 0], r: [0.205, 0.12, 0.185], color: YELLOW, bone: "root", blend: 0.08 },
    { name: "head", kind: "ellipsoid", at: [0, 0.565, 0.01], r: [0.215, 0.2, 0.19], color: YELLOW, bone: "head", blend: 0.12 },
    // ears (mirror: true adds the right one, on bone earR)
    { name: "ear", kind: "slab", outline: EAR, smooth: true, depth: 0.045, round: 0.02, at: EAR_AT, turn: EAR_TURN, color: YELLOW, bone: "earL", blend: 0.04, mirror: true },
    // arms down the front of the belly, paws close together (GO pose)
    { name: "arm", kind: "cone", a: [0.15, 0.42, 0.1], b: [0.085, 0.31, 0.19], ra: 0.044, rb: 0.038, color: YELLOW, bone: "armL", blend: 0.03, mirror: true },
    { name: "foot", kind: "ellipsoid", at: [0.125, 0.03, 0.08], r: [0.06, 0.035, 0.085], turn: [0, 0.3, 0], color: YELLOW, bone: "footL", blend: 0.03, mirror: true },
    // the flat bolt tail out to its left, flag up and out
    { name: "tail", kind: "slab", outline: TAIL, depth: 0.045, round: 0.016, at: TAIL_AT, turn: TAIL_TURN, color: YELLOW, bone: "tail", blend: 0.02 },
    // flat soles
    { name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true },
  ],
  paint: [
    // black ear tips: the top 38% of the ear, on the ear only
    { name: "earTip", color: DARK, shape: { kind: "half", at: EAR_AT, turn: EAR_TURN, offset: 0.225 }, bones: ["earL"], mirror: true },
    // two brown stripes high on the back (back sprite: u 0.42 and 0.30, about 0.05 thick)
    { name: "stripe1", color: BROWN, shape: { kind: "box", size: [0.24, 0.05, 0.3], round: 0.022, at: [0, 0.425, -0.2] }, bones: ["root", "head"] },
    { name: "stripe2", color: BROWN, shape: { kind: "box", size: [0.22, 0.05, 0.3], round: 0.022, at: [0, 0.3, -0.21] }, bones: ["root"] },
    // brown base of the tail with a jagged fur edge
    { name: "tailBase", color: BROWN, shape: { kind: "slab", outline: TAIL_BASE, depth: 0.1, at: TAIL_AT, turn: TAIL_TURN }, bones: ["tail"] },
  ],
  face: {
    eyes: [
      // all-dark eyes, a hair taller than wide, one glint up and toward the nose (+u is toward the nose on this eye)
      { at: [-0.107, 0.655, 0.16], w: 0.068, h: 0.08, sclera: DARK, glint: [0.4, 0.4, 0.34], mirror: true },
    ],
    mouth: { kind: "w", at: [0, 0.59, 0.19], w: 0.07, h: 0.022, thick: 0.007, color: DARK },
    spots: [
      { name: "nose", at: [0, 0.62, 0.19], r: [0.012, 0.008], color: DARK, lit: false },
      { name: "cheek", at: [-0.178, 0.53, 0.112], r: 0.06, color: CHEEK, mirror: true },
    ],
  },
};

export default recipe;
