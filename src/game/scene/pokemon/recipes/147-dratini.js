// Dratini (#147). GO pose: an upright neck, the lower body coiled on the ground, the thin tail tip rising beside it.
// Checked against art-147, home-147, the GO icon (pm147-trim, go-147, goS-147) and the Showdown 3D front/back (ani-dratini, ani-back-dratini).
// Numbers: notes/research/species-2c.md (Dratini) plus the corrections in notes/research/model-wild-3.md.
// 1 tall (fin tips to the ground), resting on y 0, facing +z, +x = Dratini's own left (the viewer's right).
// The body is one long chain split into pieces so each stretch rides its own bone: neck, body (the bend), tail1..tail4.
// The ear fins ride earL/earR so the game's ear idle flutters them.

const BLUE = "#a4c2f4";
const BELLY = "#eef3f6";
const FIN = "#e8ecf2";
const NODULE = "#f8f9fa";
const EYE = "#241a30";
const IRIS = "#5e2f68";

// the spine, head to tail tip: down the neck, forward and out to its left (+x) on the ground, round behind the neck,
// out on the right side (-x), and up into the tail tip (species-2c P0..P16, the coil eased onto the ground)
const SPINE = [
  [0, 0.7, 0.0], [0, 0.585, -0.03], [0, 0.45, -0.035], [0.015, 0.32, -0.01], [0.06, 0.2, 0.04], [0.15, 0.115, 0.075],
  [0.27, 0.08, 0.04], [0.33, 0.068, -0.07], [0.27, 0.064, -0.2], [0.1, 0.058, -0.24], [-0.08, 0.052, -0.18],
  [-0.19, 0.046, -0.05], [-0.22, 0.08, 0.06], [-0.22, 0.2, 0.08], [-0.21, 0.32, 0.06], [-0.235, 0.43, 0.045], [-0.29, 0.505, 0.03],
];
// radius by the fraction along the body: 0.08 under the head, filling out to 0.095 at the bend, tapering to a thin tip
const radius = (u) => (u < 0.3 ? 0.08 + 0.015 * Math.sin((u / 0.3) * Math.PI * 0.5) : 0.095 - 0.081 * ((u - 0.3) / 0.7) ** 1.25);
const LEN = [0];
for (let i = 1; i < SPINE.length; i++) LEN.push(LEN[i - 1] + Math.hypot(...SPINE[i].map((c, k) => c - SPINE[i - 1][k])));
const PTS = SPINE.map((p, i) => [...p, radius(LEN[i] / LEN[LEN.length - 1])]);
// the coil rests on the ground: lift each low point so its radius clears y 0 by a hair (the floor carve flattens it)
for (const p of PTS) if (p[1] < p[3]) p[1] = p[3] - 0.008;

// [name, bone, first point, last point]
const SEGS = [["neck", "neck", 0, 4], ["coil", "body", 4, 6], ["tail1", "tail1", 6, 9], ["tail2", "tail2", 9, 12], ["tail3", "tail3", 12, 14], ["tail4", "tail4", 14, 16]];
const at = (i) => PTS[i].slice(0, 3);

// fin: three points swept back (local x = out and back, y = up, origin at the root, which sinks into the head)
const FIN_OUT = [[0.0, -0.035], [-0.012, 0.07], [0.012, 0.17], [0.06, 0.255], [0.08, 0.19], [0.118, 0.155], [0.098, 0.11], [0.132, 0.07], [0.08, 0.02], [0.055, -0.035]];
const FIN_AT = [0.11, 0.755, -0.005];
const FIN_TURN = [0, 1.05, 0];

const HEAD = [0, 0.79, 0.02];

const recipe = {
  name: "Dratini",
  dex: 147,
  height: 1,
  bones: {
    root: [0, 0, 0],
    body: { at: at(4), parent: "root" },
    neck: { at: at(3), parent: "body" },
    head: { at: at(1), parent: "neck" },
    earL: { at: FIN_AT, parent: "head" },
    earR: { at: [-FIN_AT[0], FIN_AT[1], FIN_AT[2]], parent: "head" },
    tail1: { at: at(6), parent: "body" },
    tail2: { at: at(9), parent: "tail1" },
    tail3: { at: at(12), parent: "tail2" },
    tail4: { at: at(14), parent: "tail3" },
  },
  pieces: [
    // the long body, one smooth tube from the head to the tail tip
    ...SEGS.map(([name, bone, a, b], i) => ({ name, kind: "chain", points: PTS.slice(a, b + 1), smooth: 0.02, color: BLUE, bone, blend: i ? 0.02 : 0 })),
    // round head on the neck, the big white snout bulb, the little white bump on the forehead
    { name: "head", kind: "ellipsoid", at: HEAD, r: [0.14, 0.118, 0.128], color: BLUE, bone: "head", blend: 0.05 },
    { name: "snout", kind: "ellipsoid", at: [0, 0.722, 0.108], r: [0.097, 0.074, 0.088], color: BELLY, bone: "head", blend: 0.014 },
    { name: "nodule", kind: "sphere", at: [0, 0.875, 0.085], r: 0.024, color: NODULE, bone: "head", blend: 0.008 },
    // white three-pointed fins on the sides of the head, facing out and forward at 60 degrees
    { name: "fin", kind: "slab", outline: FIN_OUT, depth: 0.045, round: 0.014, taper: 0.045, at: FIN_AT, turn: FIN_TURN, color: FIN, bone: "earL", blend: 0.012, mirror: true },
    { name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true },
  ],
  paint: [
    // white belly: a stripe down the front of the neck into the bend, along the top-front of the coil's near side,
    // and up the inner front of the rising tail (the tube's axis pushed toward the belly side)
    { name: "bellyNeck", color: BELLY, shape: { kind: "chain", points: PTS.slice(0, 6).map(([x, y, z, r]) => [x, y, z + 0.05, r * 0.86]) }, bones: ["neck", "body", "head"] },
    { name: "bellyCoil", color: BELLY, shape: { kind: "chain", points: PTS.slice(5, 8).map(([x, y, z, r]) => [x, y + 0.035, z + 0.035, r * 0.82]) }, bones: ["body", "tail1"] },
    { name: "bellyTail", color: BELLY, shape: { kind: "chain", points: PTS.slice(11, 17).map(([x, y, z, r]) => [x + r * 0.45, y, z + r * 0.5, r * 0.8]) }, bones: ["tail2", "tail3", "tail4"] },
  ],
  face: {
    eyes: [
      // big tall dark ovals with a purple lower iris, sitting right on the top edge of the snout; one big highlight
      // up and to the viewer's left on both eyes (same corner), a small one low
      { at: [-0.085, 0.806, 0.124], w: 0.068, h: 0.118, sclera: EYE, iris: IRIS, band: -0.15, glints: [[-0.25, 0.45, 0.32], [0.2, -0.55, 0.12]] },
      { at: [0.085, 0.806, 0.124], w: 0.068, h: 0.118, sclera: EYE, iris: IRIS, band: -0.15, glints: [[-0.25, 0.45, 0.32], [0.2, -0.55, 0.12]] },
    ],
  },
};

export default recipe;
