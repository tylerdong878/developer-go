// Lapras (#131). The GO pose (resting on its belly, four flippers spread flat, neck up, head forward), built so it can
// sink to swim: in the harbor put the WATERLINE at y 0.2 (just under the shell's rim, as in the anime's herd frames):
// the shell, the neck, the head and the top of the chest show; the flippers paddle just under the surface.
// Shape checked against art-131, home-131, the GO renders (Serebii go-131, PokeMiners pm131), the Showdown 3D
// front/back (ani-lapras, ani-back-lapras) and the anime (bp-131-herd, bp-131-ash-lapras). Research and colors:
// notes/research/model-facts-2.md (Lapras).
// 1 tall (top of the horn to the flat underside), the underside at y 0, facing +z, +x = Lapras's own left.
// Paint layers: 4 of 8 (chest and neck blue, cream front, cream undersides). Spots, eyes, ear curls, mouth: decals.

const BLUE = "#5ab3e0";
const CREAM = "#ecdfbd";
const SHELL = "#c0a9b6"; // GO's mauve (HOME is pinker #c3b1bd, the art gray #a9a9b3, the anime purple)
const SPOT = "#2f6fae";
const CURL = "#3d86b8";
const DARK = "#1c1620";

const { sin, cos, PI } = Math;
const D = PI / 180;
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
// Flat frame: an outline (a, b) with a = out along the flipper (+x), b = forward (+z), thickness along y.
const FLAT = ["x", PI / 2];

// ---- the shell: a dome with a flat bottom at the rim (y 0.21; a lathe, so its underside never shows below the rim),
// a wavy lip round the edge, blunt knobs
const DOME_AT = [0, 0.21, -0.17];
const DOME_R = [0.305, 0.285, 0.33];
const RIM_Y = 0.21;
const DOME_PROFILE = [[0, 0], [1, 0], ...Array.from({ length: 12 }, (_, i) => {
  const t = ((i + 1) / 13) * (PI / 2);
  return [cos(t), sin(t)];
}), [0, 1]];
const domePoint = (az, el, out = 0) => {
  // az from +z toward +x, el up from the rim; a point on the dome pushed out by `out` along the normal (approx.)
  const a = az * D, e = el * D;
  const p = [sin(a) * cos(e) * DOME_R[0], sin(e) * DOME_R[1], cos(a) * cos(e) * DOME_R[2]];
  const n = [p[0] / DOME_R[0] ** 2, p[1] / DOME_R[1] ** 2, p[2] / DOME_R[2] ** 2];
  const l = Math.hypot(...n);
  return [DOME_AT[0] + p[0] + (n[0] / l) * out, DOME_AT[1] + p[1] + (n[1] / l) * out, DOME_AT[2] + p[2] + (n[2] / l) * out];
};
// knobs (az, el, length): the tallest on top, a ring round the upper dome, two low on the sides, one at the back
const KNOBS = [[0, 90, 0.095], [25, 52, 0.075], [-25, 52, 0.075], [90, 50, 0.08], [-90, 50, 0.08], [150, 48, 0.075], [-150, 48, 0.075], [60, 22, 0.06], [-60, 22, 0.06], [120, 20, 0.06], [-120, 20, 0.06], [180, 30, 0.065]];
const RIM = (() => {
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * 2 * PI;
    const wave = 0.012 * cos(a * 6); // the lip rises and falls six times round
    pts.push([sin(a) * (DOME_R[0] + 0.012), RIM_Y + 0.004 + wave, DOME_AT[2] + cos(a) * (DOME_R[2] + 0.012), 0.03]);
  }
  return pts;
})();

// ---- flippers: flat paddles, wide near the root, tapering to a rounded point
const FRONT = [[-0.02, -0.085], [0.12, -0.105], [0.25, -0.09], [0.36, -0.05], [0.43, -0.01], [0.4, 0.028], [0.28, 0.07], [0.13, 0.095], [-0.02, 0.09]];
const HIND = FRONT.map(([u, v]) => [u * 0.7, v * 0.78]);
const FRONT_AT = [0.2, 0.05, 0.16];
const FRONT_TURN = turn(FLAT, ["z", -0.06], ["y", -32 * D]); // out and a little forward, tip down a touch
const HIND_AT = [0.17, 0.045, -0.33];
const HIND_TURN = turn(FLAT, ["z", -0.05], ["y", 48 * D]); // out and back

const recipe = {
  name: "Lapras",
  dex: 131,
  height: 1,
  bones: {
    root: [0, 0, 0],
    body: { at: [0, 0.17, -0.05], parent: "root" },
    shell: { at: [0, 0.3, -0.15], parent: "body" },
    neck: { at: [0, 0.34, 0.2], parent: "body" },
    head: { at: [0, 0.73, 0.23], parent: "neck" },
    earL: { at: [0.138, 0.885, 0.198], parent: "head" },
    earR: { at: [-0.138, 0.885, 0.198], parent: "head" },
    armL: { at: FRONT_AT, parent: "body" }, // front flippers
    armR: { at: [-FRONT_AT[0], FRONT_AT[1], FRONT_AT[2]], parent: "body" },
    legL: { at: HIND_AT, parent: "body" }, // hind flippers
    legR: { at: [-HIND_AT[0], HIND_AT[1], HIND_AT[2]], parent: "body" },
    tail: { at: [0, 0.1, -0.42], parent: "body" },
  },
  pieces: [
    // the body: a broad oval, flat underneath, rising at the front into the chest and the long neck
    { name: "body", kind: "ellipsoid", at: [0, 0.17, -0.06], r: [0.29, 0.17, 0.4], color: BLUE, bone: "body" },
    { name: "chest", kind: "ellipsoid", at: [0, 0.24, 0.15], r: [0.22, 0.2, 0.18], color: BLUE, bone: "body", blend: 0.08 },
    { name: "neck", kind: "chain", points: [[0, 0.33, 0.2, 0.13], [0, 0.47, 0.205, 0.102], [0, 0.6, 0.2, 0.09], [0, 0.7, 0.215, 0.09]], color: BLUE, bone: "neck", blend: 0.07 },
    // the head: round at the back, a short rounded snout, a horn on the forehead, a curled ear on each side
    { name: "head", kind: "ellipsoid", at: [0, 0.825, 0.27], r: [0.125, 0.112, 0.15], color: BLUE, bone: "head", blend: 0.05 },
    { name: "snout", kind: "ellipsoid", at: [0, 0.79, 0.385], r: [0.094, 0.075, 0.09], color: BLUE, bone: "head", blend: 0.045 },
    { name: "horn", kind: "cone", a: [0, 0.91, 0.31], b: [0, 0.985, 0.335], ra: 0.036, rb: 0.015, color: BLUE, bone: "head", blend: 0.025 },
    { name: "ear", kind: "ellipsoid", at: [0.138, 0.885, 0.198], r: [0.042, 0.108, 0.105], turn: [0, -0.25, 0.15], color: BLUE, bone: "earL", blend: 0.025, mirror: true },
    // flippers (flat, rounded edges) and a short pointed tail
    { name: "flipper", kind: "slab", outline: FRONT, smooth: true, depth: 0.064, round: 0.028, at: FRONT_AT, turn: FRONT_TURN, color: BLUE, bone: "armL", blend: 0.03, mirror: true },
    // a thick, flattened shoulder where each front flipper leaves the body (GO's flippers are chunky at the root)
    { name: "shoulder", kind: "cone", a: [0.16, 0.1, 0.15], b: [0.36, 0.045, 0.27], ra: 0.085, rb: 0.045, squash: { axis: [0, 1, 0], k: 0.62 }, color: BLUE, bone: "armL", blend: 0.04, mirror: true },
    { name: "hindFlipper", kind: "slab", outline: HIND, smooth: true, depth: 0.056, round: 0.025, at: HIND_AT, turn: HIND_TURN, color: BLUE, bone: "legL", blend: 0.03, mirror: true },
    { name: "tail", kind: "cone", a: [0, 0.11, -0.4], b: [0, 0.06, -0.6], ra: 0.075, rb: 0.012, squash: { axis: [0, 1, 0], k: 0.7 }, color: BLUE, bone: "tail", blend: 0.04 },
    // the shell last and hard (blend 0: a different material, and a blend would smear mauve onto the neck)
    { name: "dome", kind: "lathe", profile: DOME_PROFILE, smooth: false, at: [DOME_AT[0], RIM_Y, DOME_AT[2]], scale: [DOME_R[0], DOME_R[1] + DOME_AT[1] - RIM_Y, DOME_R[2]], color: SHELL, bone: "shell" },
    { name: "rim", kind: "chain", points: RIM, color: SHELL, bone: "shell" },
    ...KNOBS.map(([az, el, len], i) => ({
      name: `knob${i}`, kind: "cone", a: domePoint(az, el, -0.02), b: domePoint(az, el, len), ra: 0.042, rb: 0.024, color: SHELL, bone: "shell", blend: 0.015,
    })),
    { name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true },
  ],
  paint: [
    // the chest and neck repainted blue just past their own surfaces, so the shell's front edge against them is crisp
    { name: "chestBlue", color: BLUE, shape: { kind: "ellipsoid", at: [0, 0.24, 0.15], r: [0.226, 0.206, 0.186] } },
    { name: "neckBlue", color: BLUE, shape: { kind: "chain", points: [[0, 0.33, 0.2, 0.136], [0, 0.47, 0.205, 0.108], [0, 0.6, 0.2, 0.096], [0, 0.7, 0.215, 0.096]] } },
    // the cream front: under the jaw, down the front of the neck, over the chest and belly
    { name: "creamFront", color: CREAM, shape: { kind: "chain", points: [[0, 0.758, 0.39, 0.056], [0, 0.715, 0.31, 0.075], [0, 0.6, 0.29, 0.082], [0, 0.46, 0.31, 0.092], [0, 0.32, 0.35, 0.14], [0, 0.17, 0.34, 0.2]] }, bones: ["neck", "head", "body"] },
    // the cream undersides and lower edges of the flippers, the belly and the tail
    { name: "creamUnder", color: CREAM, shape: { kind: "half", at: [0, 0.042, 0], dir: [0, -1, 0] } },
  ],
  face: {
    eyes: [
      // white almond, dark iris toward the front, heavy upper lid slanting up toward the back (the gentle look)
      { at: [-0.09, 0.848, 0.345], w: 0.088, h: 0.056, sclera: "#ffffff", iris: "#2a1e1c", irisAt: [-0.22, -0.12], irisSize: [0.46, 0.86], cut: [0.3, -0.35], edge: { color: DARK, w: 0.14 }, lid: 0.2, glints: [[-0.35, 0.25, 0.22]], mirror: true },
    ],
    mouths: [
      // a gentle smile across the snout's front, and the curl line on each ear's outer face
      { kind: "smile", at: [0, 0.765, 0.47], w: 0.1, h: 0.02, thick: 0.008, color: DARK },
      { kind: "frown", at: [0.18, 0.89, 0.196], dir: [1, 0.05, 0.25], turn: 0.6, w: 0.094, h: 0.04, thick: 0.007, color: CURL, lit: true, mirror: true },
      { kind: "smile", at: [0.182, 0.873, 0.21], dir: [1, 0.05, 0.25], turn: 0.6, w: 0.048, h: 0.019, thick: 0.007, color: CURL, lit: true, mirror: true },
    ],
    spots: [
      { name: "nostril", at: [0.03, 0.82, 0.468], r: 0.006, color: DARK, lit: false, mirror: true },
      // dark blue spots: a dash high on the neck, one low on it, a row along each flank below the shell
      { name: "spotNeck", at: [0.095, 0.66, 0.24], r: [0.012, 0.028], turn: 0.3, color: SPOT, mirror: true },
      { name: "spotNeck2", at: [0.1, 0.42, 0.18], r: 0.018, color: SPOT, mirror: true },
      { name: "spotFlank1", at: [0.285, 0.15, 0.04], r: 0.024, color: SPOT, mirror: true },
      { name: "spotFlank2", at: [0.29, 0.12, -0.11], r: [0.02, 0.016], color: SPOT, mirror: true },
      { name: "spotFlank3", at: [0.26, 0.1, -0.26], r: 0.016, color: SPOT, mirror: true },
    ],
  },
};

export default recipe;
