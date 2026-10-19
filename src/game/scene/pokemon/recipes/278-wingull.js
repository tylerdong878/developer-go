// Wingull (#278). Gliding over the harbor: wings straight out as flat planks with a little dihedral, tail fanned,
// feet tucked. Shape checked against art-278, home-278, the GO renders (Serebii go-278, PokeMiners pm278) and the
// Showdown 3D front/back (ani-wingull, ani-back-wingull). Numbers: notes/research/species-4.md (Wingull), corrections
// in notes/research/model-facts-2.md.
// A flier: **wingspan = 1** (tip to tip along x), the lowest point (the beak's hook) at y 0, facing +z (beak forward),
// +x = Wingull's own left. So the game's SIZE for Wingull is its span (species-4: about 4.2 map units).
// Paint layers: 5 of 8 (wing bands L/R, beak tip, tail tips, feet).

const WHITE = "#f6f8fa";
const BLUE = "#8fd3f2";
const BEAK = "#eda25a";
const TIP = "#5d646c";
const FEET = "#e8a24e";
const DARK = "#1c1620";

const Y0 = 0.072; // the head's center height (puts the beak's hook at y 0)
const P = (x, y, z) => [x, y + Y0, z];

// turn([axis, angle], ...): rotations about the model axes, applied in the order given, as an XYZ euler.
const turn = (...ops) => {
  let m = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  for (const [ax, t] of ops) {
    const c = Math.cos(t), s = Math.sin(t);
    const r = ax === "x" ? [1, 0, 0, 0, c, -s, 0, s, c] : ax === "y" ? [c, 0, s, 0, 1, 0, -s, 0, c] : [c, -s, 0, s, c, 0, 0, 0, 1];
    const o = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) o.push(r[i * 3] * m[j] + r[i * 3 + 1] * m[3 + j] + r[i * 3 + 2] * m[6 + j]);
    m = o;
  }
  const y = Math.asin(Math.max(-1, Math.min(1, m[2])));
  return Math.abs(m[2]) < 0.9999999 ? [Math.atan2(-m[5], m[8]), y, Math.atan2(-m[1], m[0])] : [Math.atan2(m[7], m[4]), y, 0];
};
const rot = ([x = 0, y = 0, z = 0], [vx, vy, vz]) => {
  const a = Math.cos(x), b = Math.sin(x), c = Math.cos(y), d = Math.sin(y), e = Math.cos(z), f = Math.sin(z);
  const m = [c * e, -c * f, d, a * f + b * e * d, a * e - b * f * d, -b * c, b * f - a * e * d, b * e + a * f * d, a * c];
  return [m[0] * vx + m[1] * vy + m[2] * vz, m[3] * vx + m[4] * vy + m[5] * vz, m[6] * vx + m[7] * vy + m[8] * vz];
};
const place = (at, t, v) => rot(t, v).map((c, i) => c + at[i]);
// Flat frame: an outline (a, b) with a = outward (+x), b = forward (+z), thickness along y.
const WING_FRAME = ["x", Math.PI / 2];
// Fan frame: an outline (a, b) with a = across (+x), b = backward (-z), thickness along y.
const FAN_FRAME = ["x", -Math.PI / 2];

// Wing: a straight plank, constant chord 0.056, swept back 0.03 at the tip, ending in a swallowtail fork (two points of
// near equal length, the notch 0.03 deep). (outward, forward) from the root.
const WING = [[-0.01, 0.031], [0.2, 0.0175], [0.44, 0.004], [0.465, -0.001], [0.469, -0.01], [0.455, -0.021], [0.41, -0.033], [0.452, -0.05], [0.46, -0.06], [0.44, -0.064], [0.2, -0.0445], [-0.01, -0.031]];
const ROOT = P(0.045, 0.008, -0.035);
const DIHEDRAL = 0.105; // 6 deg, tips up
const WING_TURN = turn(WING_FRAME, ["z", DIHEDRAL]);
const THICK = 0.03; // the art's wing is ~0.01; under 2 grid cells (0.034) the plate breaks up, so it's a plank

// Tail feathers: three rounded strips in a fan, white with blue outer 35%. (across, backward) from the base.
const FEATHER = [[-0.02, 0], [0.02, 0], [0.025, 0.1], [0.017, 0.133], [0, 0.14], [-0.017, 0.133], [-0.025, 0.1]];
const TAIL_AT = P(0, 0.008, -0.095);
const FAN = [-0.5, 0, 0.5].map((yaw) => turn(FAN_FRAME, ["x", 0.24], ["y", yaw]));

const recipe = {
  name: "Wingull",
  dex: 278,
  height: 1,
  bones: {
    root: [0, 0, 0],
    body: { at: P(0, 0, -0.03), parent: "root" },
    head: { at: P(0, -0.01, -0.01), parent: "body" },
    beak: { at: P(0, -0.012, 0.05), parent: "head" },
    wingL: { at: ROOT, parent: "body" },
    wingR: { at: [-ROOT[0], ROOT[1], ROOT[2]], parent: "body" },
    tail: { at: TAIL_AT, parent: "body" },
    footL: { at: P(0.02, -0.035, -0.08), parent: "body" },
    footR: { at: P(-0.02, -0.035, -0.08), parent: "body" },
  },
  pieces: [
    // head and body: one blob, no neck; the head is most of it, the body tapers back into the tail
    { name: "head", kind: "sphere", at: P(0, 0, 0), r: 0.064, color: WHITE, bone: "head" },
    { name: "body", kind: "ellipsoid", at: P(0, -0.006, -0.06), r: [0.05, 0.046, 0.075], color: WHITE, bone: "body", blend: 0.03 },
    // two small triangle tufts on top of the head, up and back
    { name: "tuft", kind: "cone", a: P(0.026, 0.046, -0.006), b: P(0.036, 0.1, -0.03), ra: 0.019, rb: 0.005, color: WHITE, bone: "head", blend: 0.01, mirror: true },
    // the beak: long and straight, forward and 15 deg down, orange with a gray hooked tip
    { name: "beak", kind: "cone", a: P(0, -0.014, 0.04), b: P(0, -0.052, 0.19), ra: 0.034, rb: 0.017, squash: { axis: [1, 0, 0], k: 0.84 }, color: BEAK, bone: "beak", blend: 0.006 },
    { name: "hook", kind: "cone", a: P(0, -0.05, 0.188), b: P(0, -0.066, 0.2), ra: 0.014, rb: 0.007, color: TIP, bone: "beak", blend: 0.006 },
    // wings: flat planks with rounded edges, hard against the body (a flat wing meeting a round body reads right)
    { name: "wing", kind: "slab", outline: WING, depth: THICK, round: 0.008, at: ROOT, turn: WING_TURN, color: WHITE, bone: "wingL", blend: 0.012, mirror: true },
    // tail: three feathers in a fan behind the body, raised a little
    ...FAN.map((t, i) => ({ name: `feather${i}`, kind: "slab", outline: FEATHER, depth: 0.026, round: 0.008, at: TAIL_AT, turn: t, color: WHITE, bone: "tail", blend: 0.008 })),
    // tiny orange feet tucked back under the tail base
    { name: "foot", kind: "ellipsoid", at: P(0.02, -0.046, -0.095), r: [0.013, 0.008, 0.02], color: FEET, bone: "footL", blend: 0.004, mirror: true },
  ],
  paint: [
    // blue bands straight across each wing, 45% to 63% of its length
    { name: "band", color: BLUE, shape: { kind: "box", size: [0.083, 0.08, 0.2], at: place(ROOT, WING_TURN, [0.25, 0.007, 0]), turn: [0, 0, DIHEDRAL] }, bones: ["wingL"], mirror: true },
    // the gray outer 45% of the beak, hook included
    { name: "beakTip", color: TIP, shape: { kind: "half", at: P(0, -0.035, 0.123), dir: [0, -0.25, 0.97] }, bones: ["beak"] },
    // blue outer 35% of the three tail feathers (one chain out past the tips, hopping from one to the next)
    { name: "tailTips", color: BLUE, shape: { kind: "chain", points: FAN.map((t) => [...place(TAIL_AT, t, [0, 0.158, 0]), 0.053]) }, bones: ["tail"] },
    { name: "feet", color: FEET, shape: { kind: "box", size: [0.08, 0.03, 0.06], at: P(0, -0.046, -0.095) }, bones: ["footL", "footR"] },
  ],
  face: {
    eyes: [
      // short dark dashes on the sides of the head just above the beak's line, top leaning back, half-shut
      { at: P(-0.05, 0.014, 0.035), w: 0.011, h: 0.036, sclera: DARK, turn: -0.35, mirror: true },
    ],
  },
};

export default recipe;
