// Swanna swan boat: our own pedal boat for the park pond, a nod to Boston Public Garden's Swan Boats (their sea-green
// hull and red trim, a brass pole with a ball) but not a copy of them: theirs are long pontoon barges with rows of
// benches and the swan at the stern; ours is a two-seat pedal boat with a Swanna figurehead at the bow (her head
// puffs, crest, yellow beak with its dark band, the blue bib on the breast) and folded-wing side panels.
// Not a Pokémon: no idle, the scene bobs and rolls it on the water.
// 1 tall (the figurehead's crest to the flat hull bottom), hull bottom at y 0, bow toward +z. WATERLINE at y 0.09.
// SIZE about 2.6 seats two trainers side by side (the bench is 0.42 wide, the cockpit 0.54 x 0.85).
// Paint layers: 3 of 8 (the red hull stripe, the blue bib, the beak band).

const GREEN = "#3f9a80"; // the Public Garden boats' sea green
const RED = "#c8352e"; // their red trim, and the bench
const WHITE = "#f2f4f3";
const BLUE = "#8ec4ea";
const BEAK = "#fbdc4f";
const BAND = "#4a5056";
const BRASS = "#c9a43a";
const STEEL = "#6b7378";
const DARK = "#1c1620";

const { sin, cos, PI } = Math;
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
// Side frame: an outline (a, b) with a = forward (+z), b = up (+y), thickness along x.
const SIDE = ["y", -PI / 2];
// Fan frame: an outline (a, b) with a = across (+x), b = backward (-z), thickness along y.
const FAN = ["x", -PI / 2];

// the folded wings: side panels (forward, up) that wrap the cockpit like a swan's body, low at the front, rising to
// the stern and ending in three feather points; a lens section (thick in the middle, thin at the edges), leaning out
const WING = [[0.25, 0.19], [0.12, 0.27], [-0.05, 0.35], [-0.22, 0.43], [-0.37, 0.49], [-0.47, 0.5], [-0.5, 0.46], [-0.56, 0.45], [-0.55, 0.39], [-0.61, 0.37], [-0.57, 0.31], [-0.6, 0.26], [-0.5, 0.21], [-0.3, 0.17], [0.0, 0.16]];
const WING_AT = [0.275, 0, 0];
const WING_TURN = turn(SIDE, ["z", -0.12]);
// the red stripe: a ring round the hull's outside only (a lathe ring scaled to the hull's oval, so the cockpit's
// inside, which crosses the same heights, stays green)
const STRIPE = [[0.8, 0.15], [1.4, 0.15], [1.4, 0.188], [0.8, 0.188], [0.8, 0.1502]];
// stern tail feathers
const FEATHER = [[-0.03, 0], [0.03, 0], [0.034, 0.13], [0.02, 0.19], [0, 0.2], [-0.02, 0.19], [-0.034, 0.13]];
const TAIL_AT = [0, 0.3, -0.5];
const TAIL = [-0.45, 0, 0.45].map((yaw, i) => turn(FAN, ["x", i === 1 ? 0.75 : 0.6], ["y", yaw]));
// the bib on the figurehead's breast (front plane), two lobes like Swanna's
const BIB = [[-0.15, 0.39], [-0.155, 0.29], [-0.12, 0.2], [-0.065, 0.17], [-0.02, 0.185], [0, 0.2], [0.02, 0.185], [0.065, 0.17], [0.12, 0.2], [0.155, 0.29], [0.15, 0.39], [0.1, 0.35], [0.05, 0.315], [0.015, 0.305], [0, 0.32], [-0.015, 0.305], [-0.05, 0.315], [-0.1, 0.35]];

const recipe = {
  name: "Swanna swan boat",
  dex: null,
  height: 1,
  bones: {
    root: [0, 0, 0],
    swan: { at: [0, 0.4, 0.5], parent: "root" }, // the figurehead (not animated; a name the game's idle ignores)
  },
  pieces: [
    // the hull: a round-ended tub, flat bottom, the cockpit hollowed out of its top (this carve cuts only the hull)
    { name: "hull", kind: "ellipsoid", at: [0, 0.12, -0.02], r: [0.34, 0.165, 0.6], color: GREEN, bone: "root" },
    { name: "cockpit", kind: "ellipsoid", at: [0, 0.33, -0.1], r: [0.27, 0.19, 0.43], carve: true, blend: 0.02 },
    // the swan's breast at the bow, and the S neck up to the figurehead
    { name: "breast", kind: "ellipsoid", at: [0, 0.27, 0.47], r: [0.22, 0.17, 0.17], color: WHITE, bone: "swan", blend: 0.03 },
    { name: "neck", kind: "chain", points: [[0, 0.38, 0.52, 0.08], [0, 0.5, 0.47, 0.064], [0, 0.62, 0.445, 0.058], [0, 0.73, 0.46, 0.058], [0, 0.8, 0.5, 0.06]], color: WHITE, bone: "swan", blend: 0.04 },
    // Swanna's head: two bun puffs at the back corners, a two-spike crest, the long yellow beak
    { name: "head", kind: "ellipsoid", at: [0, 0.845, 0.52], r: [0.072, 0.068, 0.088], color: WHITE, bone: "swan", blend: 0.03 },
    { name: "puff", kind: "ellipsoid", at: [0.056, 0.885, 0.46], r: [0.05, 0.078, 0.066], turn: [-0.45, 0, -0.18], color: WHITE, bone: "swan", blend: 0.025, mirror: true },
    { name: "crest", kind: "cone", a: [0, 0.895, 0.52], b: [0, 0.99, 0.505], ra: 0.026, rb: 0.012, color: WHITE, bone: "swan", blend: 0.015 },
    { name: "crest2", kind: "cone", a: [0, 0.88, 0.56], b: [0, 0.94, 0.59], ra: 0.022, rb: 0.011, color: WHITE, bone: "swan", blend: 0.015 },
    { name: "beak", kind: "cone", a: [0, 0.83, 0.585], b: [0, 0.765, 0.75], ra: 0.03, rb: 0.012, squash: { axis: [1, 0, 0], k: 0.82 }, color: BEAK, bone: "swan" },
    // folded-wing side panels along the hull, rising to the stern, and the tail fan over the paddle wheel
    { name: "wing", kind: "slab", outline: WING, smooth: 2, depth: 0.09, taper: 0.07, round: 0.02, at: WING_AT, turn: WING_TURN, color: WHITE, bone: "swan", blend: 0.03, mirror: true },
    ...TAIL.map((t, i) => ({ name: `tail${i}`, kind: "slab", outline: FEATHER, depth: 0.05, round: 0.02, at: TAIL_AT, turn: t, color: WHITE, bone: "swan", blend: 0.02 })),
    // inside: the red bench for two, the pedal housing in front of it
    { name: "seat", kind: "box", size: [0.42, 0.05, 0.18], round: 0.018, at: [0, 0.2, -0.13], color: RED, bone: "root" },
    { name: "back", kind: "box", size: [0.42, 0.17, 0.05], round: 0.02, at: [0, 0.31, -0.235], turn: [-0.22, 0, 0], color: RED, bone: "root" },
    { name: "pedals", kind: "box", size: [0.22, 0.09, 0.13], round: 0.03, at: [0, 0.18, 0.13], color: STEEL, bone: "root" },
    // the brass pole with a ball, behind the bench (the Swan Boats' poles)
    { name: "pole", kind: "cone", a: [0.21, 0.2, -0.32], b: [0.21, 0.64, -0.32], r: 0.024, color: BRASS, bone: "root" },
    { name: "finial", kind: "sphere", at: [0.21, 0.665, -0.32], r: 0.038, color: BRASS, bone: "root" },
    { name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true },
  ],
  paint: [
    // the red stripe round the hull just under the gunwale
    { name: "stripe", color: RED, shape: { kind: "lathe", profile: STRIPE, smooth: false, at: [0, 0, -0.02], scale: [0.34, 1, 0.6] }, bones: ["root"] },
    // Swanna's blue bib on the breast (front only) and the dark band at the beak's base
    { name: "bib", color: BLUE, shape: { kind: "slab", outline: BIB, smooth: 2, depth: 0.3, at: [0, 0, 0.64] }, bones: ["swan"] },
    { name: "beakBand", color: BAND, shape: { kind: "cone", a: [0, 0.83, 0.583], b: [0, 0.826, 0.602], ra: 0.034, rb: 0.033 } },
  ],
  face: {
    eyes: [
      // painted gray almond eyes with a black rim, like Swanna's but wide open and friendly (it's a boat)
      { at: [-0.066, 0.86, 0.545], w: 0.05, h: 0.032, sclera: "#7a7f86", edge: { color: DARK, w: 0.2 }, glints: [[-0.3, 0.3, 0.3]], turn: 0.2, mirror: true },
    ],
  },
};

export default recipe;
