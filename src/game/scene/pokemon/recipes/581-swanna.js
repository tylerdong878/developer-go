// Swanna (#581). On the park pond: the folded-wing pose (HOME and the art), neck up in an S, legs under it. To swim,
// put the WATERLINE at y 0.14: the legs and the bottom of the body go under, most of the blue breast stays above it.
// Shape checked against art-581, home-581, the GO renders (Serebii go-581, PokeMiners pm581: GO shows it hovering with
// its wings spread and drooping) and the Showdown 3D front/back (ani-swanna, ani-back-swanna, wings raised).
// Research and colors: notes/research/model-facts-2.md (Swanna).
// 1 tall (crest tip to the soles), feet at y 0, facing +z, +x = Swanna's own left.
// Paint layers: 2 of 8 (the blue breast, the dark band at the beak's base).

const WHITE = "#f2f4f3";
const BLUE = "#8ec4ea";
const BEAK = "#fbdc4f";
const BAND = "#4a5056";
const LEGS = "#505660";
const EYE = "#7a7f86";
const DARK = "#1c1620";

const { sin, cos, PI } = Math;
// turn([axis, angle], ...): rotations about the model axes, applied in the order given, as an XYZ euler.
const turn = (...ops) => {
  let m = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  for (const [ax, t] of ops) {
    const c = cos(t), s = sin(t);
    const r = ax === "x" ? [1, 0, 0, 0, c, -s, 0, s, c] : ax === "y" ? [c, 0, s, 0, 1, 0, -s, 0, c] : [c, -s, 0, s, c, 0, 0, 0, 1];
    const o = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) o.push(r[i * 3] * m[j] + r[i * 3 + 1] * m[3 + j] + r[i * 3 + 2] * m[6 + j]);
    m = o;
  }
  const y = Math.asin(Math.max(-1, Math.min(1, m[2])));
  return Math.abs(m[2]) < 0.9999999 ? [Math.atan2(-m[5], m[8]), y, Math.atan2(-m[1], m[0])] : [Math.atan2(m[7], m[4]), y, 0];
};
// Fan frame: an outline (a, b) with a = across (+x), b = backward (-z), thickness along y.
const FAN = ["x", -PI / 2];
// Flat frame for the feet: (a, b) with a = across (+x), b = forward (+z), thickness along y.
const FOOT = ["x", PI / 2];

// a folded wing seen from the side, [z, y]: from the shoulder back along the top, three primaries at the back, the lower edge forward
const WING = [
  [0.16, 0.37], [0.1, 0.44], [0.0, 0.47], [-0.12, 0.48], [-0.24, 0.48],
  [-0.34, 0.52], [-0.31, 0.47], [-0.4, 0.5], [-0.36, 0.44], [-0.44, 0.46], [-0.38, 0.38],
  [-0.3, 0.31], [-0.15, 0.285], [0.0, 0.295], [0.1, 0.315],
];
const WING_EDGE = "#d9e6ee";

// tail feathers: long blades fanning back from under the folded wings
const FEATHER = [[-0.025, 0], [0.025, 0], [0.03, 0.17], [0.018, 0.255], [0, 0.27], [-0.018, 0.255], [-0.03, 0.17]];
const TAIL_AT = [0, 0.2, -0.27];
const TAIL = [-0.5, 0, 0.5].map((yaw, i) => turn(FAN, ["x", i === 1 ? 0.22 : 0.12], ["y", yaw]));
// webbed foot: three toes joined by the web, pointing forward
const WEB = [[0, -0.025], [0.052, 0.07], [0.02, 0.06], [0, 0.085], [-0.02, 0.06], [-0.052, 0.07]];

// the blue breast: two rounded lobes side by side, pointed at the outer top (like HOME's and GO's), painted on the
// front of the chest. Outline in the front plane (x, y).
const LOBES = [
  [-0.17, 0.34], [-0.172, 0.22], [-0.135, 0.13], [-0.075, 0.1], [-0.025, 0.118], [0, 0.135], [0.025, 0.118], [0.075, 0.1], [0.135, 0.13], [0.172, 0.22],
  [0.17, 0.34], [0.12, 0.305], [0.06, 0.27], [0.02, 0.255], [0, 0.27], [-0.02, 0.255], [-0.06, 0.27], [-0.12, 0.305],
];

const recipe = {
  name: "Swanna",
  dex: 581,
  height: 1,
  bones: {
    root: [0, 0, 0],
    body: { at: [0, 0.27, -0.04], parent: "root" },
    neck: { at: [0, 0.4, 0.15], parent: "body" },
    head: { at: [0, 0.78, 0.12], parent: "neck" },
    wingL: { at: [0.12, 0.38, 0.1], parent: "body" },
    wingR: { at: [-0.12, 0.38, 0.1], parent: "body" },
    tail: { at: TAIL_AT, parent: "body" },
    legL: { at: [0.065, 0.14, 0.0], parent: "root" },
    legR: { at: [-0.065, 0.14, 0.0], parent: "root" },
  },
  pieces: [
    // a plump oval body, a full breast in front
    { name: "body", kind: "ellipsoid", at: [0, 0.27, -0.06], r: [0.2, 0.16, 0.27], color: WHITE, bone: "body" },
    { name: "breast", kind: "ellipsoid", at: [0, 0.26, 0.12], r: [0.165, 0.15, 0.13], color: WHITE, bone: "body", blend: 0.07 },
    // the long thin neck in an S: up from the breast, leaning back, then forward under the head
    { name: "neck", kind: "chain", points: [[0, 0.36, 0.16, 0.072], [0, 0.48, 0.12, 0.05], [0, 0.6, 0.085, 0.042], [0, 0.7, 0.09, 0.042], [0, 0.77, 0.115, 0.047]], color: WHITE, bone: "neck", blend: 0.05 },
    // the head, two round puffs at its back corners (like buns), a crest of two spikes on top
    { name: "head", kind: "ellipsoid", at: [0, 0.825, 0.13], r: [0.066, 0.064, 0.08], color: WHITE, bone: "head", blend: 0.035 },
    { name: "puff", kind: "ellipsoid", at: [0.052, 0.865, 0.075], r: [0.046, 0.075, 0.062], turn: [-0.45, 0, -0.18], color: WHITE, bone: "head", blend: 0.025, mirror: true },
    { name: "crest", kind: "cone", a: [0, 0.875, 0.13], b: [0, 0.975, 0.115], ra: 0.024, rb: 0.007, color: WHITE, bone: "head", blend: 0.015 },
    { name: "crest2", kind: "cone", a: [0, 0.86, 0.17], b: [0, 0.925, 0.2], ra: 0.02, rb: 0.006, color: WHITE, bone: "head", blend: 0.015 },
    // the beak: long, straight, yellow, pointing forward and down; hard against the face (the dark band hides the seam)
    { name: "beak", kind: "cone", a: [0, 0.808, 0.19], b: [0, 0.735, 0.39], ra: 0.026, rb: 0.005, squash: { axis: [1, 0, 0], k: 0.8 }, color: BEAK, bone: "head" },
    // folded wings: the round sides under them, then a feathered plate on each, its three long primaries lifting at the back
    { name: "wingBase", kind: "chain", points: [[0.1, 0.33, 0.12, 0.075], [0.13, 0.4, 0.0, 0.125], [0.135, 0.38, -0.15, 0.13], [0.1, 0.3, -0.26, 0.09]], squash: { axis: [1, 0, 0], k: 0.72 }, color: WHITE, bone: "wingL", blend: 0.03, mirror: true },
    { name: "wing", kind: "slab", outline: WING, smooth: 2, depth: 0.05, round: 0.02, at: [0.19, 0, 0], turn: [0, -Math.PI / 2 + 0.1, 0], color: WHITE, bone: "wingL", blend: 0.012, mirror: true },
    // tail feathers fanning back and a little up
    ...TAIL.map((t, i) => ({ name: `tail${i}`, kind: "slab", outline: FEATHER, depth: 0.03, round: 0.012, at: TAIL_AT, turn: t, color: WHITE, bone: "tail", blend: 0.015 })),
    // dark gray legs and webbed feet
    { name: "leg", kind: "cone", a: [0.065, 0.15, 0.0], b: [0.068, 0.025, 0.02], ra: 0.026, rb: 0.019, color: LEGS, bone: "legL", mirror: true },
    { name: "foot", kind: "slab", outline: WEB, smooth: 2, depth: 0.026, round: 0.011, at: [0.07, 0.013, 0.015], turn: turn(FOOT, ["y", -0.15]), color: LEGS, bone: "legL", blend: 0.012, mirror: true },
    { name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true },
  ],
  paint: [
    // a soft pale line along each wing's lower edge, so the wing reads apart from the body
    { name: "wingEdge", color: WING_EDGE, shape: { kind: "slab", outline: [[0.12, 0.3], [0.0, 0.285], [-0.15, 0.275], [-0.3, 0.3], [-0.3, 0.325], [-0.15, 0.305], [0.0, 0.312], [0.12, 0.33]], depth: 0.08, at: [0.2, 0, 0], turn: [0, -Math.PI / 2 + 0.1, 0] }, bones: ["wingL"], mirror: true },
    // the blue breast lobes, front half only
    { name: "breastBlue", color: BLUE, shape: { kind: "slab", outline: LOBES, smooth: 2, depth: 0.3, at: [0, 0, 0.27] }, bones: ["body"] },
    // the dark band round the beak's base (it also hides the beak's hard seam)
    { name: "beakBand", color: BAND, shape: { kind: "cone", a: [0, 0.809, 0.19], b: [0, 0.804, 0.206], ra: 0.03, rb: 0.029 } },
  ],
  face: {
    eyes: [
      // narrow gray almonds with a black rim, half shut, set just behind the beak
      { at: [-0.062, 0.84, 0.15], w: 0.054, h: 0.026, sclera: EYE, edge: { color: DARK, w: 0.22 }, iris: "#3a3e44", irisAt: [0.2, -0.1], irisSize: [0.4, 0.7], turn: 0.25, mirror: true },
    ],
  },
};

export default recipe;
