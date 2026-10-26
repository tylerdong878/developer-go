// Rotom (#479), the base (plasma) form. Shape checked against art-479, home-479, the GO renders (Serebii go-479,
// PokeMiners pm479) and the Showdown 3D front/back (ani-rotom, ani-back-rotom). Numbers: notes/research/species-3.md
// (Rotom), corrections in notes/research/model-facts-2.md.
// Two meshes in one frame:
//   default export: the orange body (ball, spike, nub) and the painted face. Lit like every other Pokémon.
//   export `glow`:  the electric parts: the cyan aura round the body (with its points above and below) and the two
//                   lightning bolts (cyan rims, white fill). Draw it unlit, BackSide, under the body (an inverted hull).
// Both share the same bones (same names, same order), so the glow mesh can bind to the body's skeleton.
// A floater: y 0 = the aura's bottom point, y 1 = the aura's top point (the spike's tip is at 0.9); the body mesh
// alone starts at the nub (y ~0.15). Facing +z, +x = Rotom's own left (the viewer's right).

const ORANGE = "#ee7a3e";
const AURA = "#9fdde6";
const FILL = "#eef6f7";
const IRIS = "#1f6fd8";
const DARK = "#1c1620";

// ---- the body (GO icon and the Showdown front: ball center 0.41, radius 0.175)
const C = [0, 0.41, 0];
const R = 0.175;
const SPIKE_A = [0, 0.56, -0.012], SPIKE_B = [0, 0.9, -0.035];
const NUB = [0, 0.2, 0.004];

// ---- the bolts: a sideways Z, flat, facing front, swept back a little (GO icon): a long wedge from the outer tip in
// to the body, a diagonal back out and down, and a lower bar in to the body. Outline for Rotom's left bolt (+x) in the
// frontal plane: tip, top edge in, the diagonal's inner edge, the lower bar's top edge in, down, its bottom edge out,
// the diagonal's outer edge, the top bar's bottom edge out to the tip. Bars 0.07-0.09 wide (3 cells of the glow mesh).
const BOLT_ROOT = [0.16, 0.5, -0.01];
const BOLT_ABS = [[0.92, 0.865], [0.24, 0.77], [0.4, 0.62], [0.18, 0.56], [0.18, 0.49], [0.6, 0.57], [0.42, 0.7]];
const BOLT = BOLT_ABS.map(([x, y]) => [x - BOLT_ROOT[0], y - BOLT_ROOT[1]]);
const BOLT_TURN = [0, 0.25, 0]; // tips swept back (mirrored for the right bolt)
const BOLT_DEPTH = 0.08; // over 2 grid cells of the glow mesh (it's 1.7 wide); thinner and the plate breaks up, and the fill needs room

/** The polygon moved in by d (mitered corners), for the bolt's white fill. */
function inset(pts, d) {
  const n = pts.length;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % n];
    area += x0 * y1 - x1 * y0;
  }
  const s = area > 0 ? 1 : -1; // CCW: the inside is to the left of each edge
  const lines = pts.map((p, i) => {
    const q = pts[(i + 1) % n];
    const ex = q[0] - p[0], ey = q[1] - p[1], l = Math.hypot(ex, ey);
    const nx = (-ey / l) * s, ny = (ex / l) * s;
    return { p: [p[0] + nx * d, p[1] + ny * d], e: [ex, ey] };
  });
  return lines.map((L, i) => {
    const P = lines[(i - 1 + n) % n];
    // intersect P (previous edge) and L (this edge)
    const den = P.e[0] * L.e[1] - P.e[1] * L.e[0];
    if (Math.abs(den) < 1e-9) return L.p;
    const t = ((L.p[0] - P.p[0]) * L.e[1] - (L.p[1] - P.p[1]) * L.e[0]) / den;
    return [P.p[0] + P.e[0] * t, P.p[1] + P.e[1] * t];
  });
}
const BOLT_FILL = inset(BOLT, 0.02);

const BONES = {
  root: [0, 0, 0],
  head: { at: C, parent: "root" }, // Rotom is all head: the look-around turns the whole ball
  wingL: { at: BOLT_ROOT, parent: "head" }, // the bolts swing from the body's sides (Showdown: from up to straight down)
  wingR: { at: [-BOLT_ROOT[0], BOLT_ROOT[1], BOLT_ROOT[2]], parent: "head" },
};

const body = {
  name: "Rotom",
  dex: 479,
  height: 1,
  bones: BONES,
  pieces: [
    { name: "ball", kind: "ellipsoid", at: C, r: [R, R, 0.168], color: ORANGE, bone: "head" },
    // the spike: a tall cone straight up (GO; the art and HOME lean it), flaring smoothly out of the top like a dome
    { name: "spike", kind: "cone", a: SPIKE_A, b: SPIKE_B, ra: 0.072, rb: 0.009, color: ORANGE, bone: "head", blend: 0.07 },
    // the nub under the ball, a flattened bulb on a short neck
    { name: "neck", kind: "cone", a: [0, 0.27, 0], b: [0, 0.225, 0.003], ra: 0.05, rb: 0.045, color: ORANGE, bone: "head", blend: 0.035 },
    { name: "nub", kind: "ellipsoid", at: NUB, r: [0.078, 0.052, 0.072], color: ORANGE, bone: "head", blend: 0.03 },
  ],
  face: {
    eyes: [
      // big white ovals with a thin dark rim and a vivid blue iris, one glint up and in
      { at: [-0.08, 0.432, 0.15], w: 0.11, h: 0.126, sclera: "#ffffff", edge: { color: DARK, w: 0.1 }, iris: IRIS, irisAt: [0.06, -0.04], irisSize: [0.56, 0.62], glints: [[0.28, 0.3, 0.2]], mirror: true },
    ],
    mouth: { kind: "smile", at: [0, 0.37, 0.168], w: 0.072, h: 0.022, thick: 0.0075, color: DARK },
    spots: [
      // the camera-lens tick marks on each eye's white ring, at about 2 and 8 o'clock
      { name: "tick1", at: [-0.08 + 0.042, 0.432 + 0.034, 0.152], r: [0.009, 0.004], turn: -0.7, color: DARK, lit: false, mirror: true },
      { name: "tick2", at: [-0.08 - 0.042, 0.432 - 0.034, 0.145], r: [0.009, 0.004], turn: -0.7, color: DARK, lit: false, mirror: true },
    ],
  },
};

const G = 0.055; // the aura's reach past the orange
export const glow = {
  name: "Rotom (glow)",
  dex: 479,
  height: 1,
  // a finer mesh than other glows (0.75 of the body's grid), so the white bolt fills come out clean
  gridScale: 1.25,
  bones: BONES,
  pieces: [
    // the aura: the body grown by G, as one smooth silhouette, ending in thin points above the spike and under the nub
    { name: "auraBall", kind: "ellipsoid", at: C, r: [R + G, R + G, 0.168 + G], color: AURA, bone: "head" },
    { name: "auraSpike", kind: "cone", a: SPIKE_A, b: [0, 1, -0.04], ra: 0.072 + G * 0.8, rb: 0.006, color: AURA, bone: "head", blend: 0.07 },
    { name: "auraNub", kind: "ellipsoid", at: NUB, r: [0.078 + G * 0.9, 0.052 + G * 0.9, 0.072 + G * 0.9], color: AURA, bone: "head", blend: 0.05 },
    { name: "auraPoint", kind: "cone", a: [0, 0.18, 0.004], b: [0, 0.008, 0.004], ra: 0.07, rb: 0.007, color: AURA, bone: "head", blend: 0.04 },
    // the bolts: flat cyan panels (the white fill is paint)
    { name: "bolt", kind: "slab", outline: BOLT, depth: BOLT_DEPTH, round: 0.02, at: BOLT_ROOT, turn: BOLT_TURN, color: AURA, bone: "wingL", mirror: true },
  ],
  paint: [
    // the white fill inside each bolt's cyan rim, on both faces (the game draws the glow's paint unlit)
    { name: "boltFill", color: FILL, shape: { kind: "slab", outline: BOLT_FILL, depth: 0.2, at: BOLT_ROOT, turn: BOLT_TURN }, bones: ["wingL"], mirror: true },
  ],
};

// the aura and bolts go with the body: the game draws them unlit, inside out
body.glow = glow;

export default body;
