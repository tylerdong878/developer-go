// Alcremie (#869), Vanilla Cream with the Strawberry Sweet (the default form). Shape checked against art-869,
// home-869, the GO render (Serebii go-869) and the Showdown 3D front/back (ani-alcremie, ani-back-alcremie).
// Numbers: notes/research/species-3.md (Alcremie), corrections in notes/research/model-facts-2.md.
// 1 tall (top of the soft-serve swirl to the puddle), the puddle at y 0, facing +z, +x = Alcremie's own left (the
// viewer's right). The soft serve is a chain coiled into a swirl; the strawberries are hard pieces (blend 0).
// Paint layers: 7 of 8 (syrup on the swirl, on the dress, on each side's puff and curl, each strawberry, the bow).

const CREAM = "#fbf6d6";
const PINK = "#f2adc3";
const STRAW = "#ea5a6a";
const SEED = "#6e2a2c";
const IRIS = "#e8566c";
const RIM = "#c23a44";
const PUPIL = "#8e2f36";
const DOT = "#c23a44";

const { sin, cos, PI } = Math;
const lerp = (a, b, t) => a + (b - a) * t;

// ---- the soft-serve swirl: a coil that winds up and in from the head's crown, two and a bit turns, then the tip
// curls over to Alcremie's right (-x, the viewer's left), as in HOME and the art.
const SWIRL = (() => {
  const pts = [];
  const turns = 2.25, n = 28;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = -PI / 2 + t * turns * 2 * PI; // start at the back so the seam hides
    const ring = lerp(0.165, 0.035, Math.pow(t, 0.9)); // coil center distance from the axis
    const y = lerp(0.64, 0.87, t);
    const r = lerp(0.105, 0.06, t); // tube radius
    pts.push([sin(a) * ring - 0.07 * t * t, y, cos(a) * ring * 0.92, r]); // the axis leans to -x as it rises
  }
  // the tip: up and over to -x, thinning to a point
  pts.push([-0.06, 0.9, 0.0, 0.058], [-0.1, 0.94, 0.004, 0.044], [-0.15, 0.962, 0.008, 0.029], [-0.215, 0.967, 0.01, 0.013]);
  return pts;
})();
// Syrup stripes are painted with a "comb": thin parallel walls (a slab whose outline is several thin bars joined by
// a spine off to the side, extruded deep through the model). Where a wall cuts the cream it leaves a stripe that wraps
// all the way round, front and back, whatever the exact surface is. bars: [y at x = 0, slope], w: half the stripe width.
function comb(bars, spineX, x1, w) {
  const at = (c, k, x, d) => [x, c + k * x + d];
  const pts = [];
  for (const [c, k] of bars) pts.push(at(c, k, spineX, w), at(c, k, x1, w), at(c, k, x1, -w), at(c, k, spineX, -w));
  const [cl, kl] = bars[bars.length - 1], [c0, k0] = bars[0];
  pts.push(at(cl, kl, spineX - 0.03, -w), at(c0, k0, spineX - 0.03, w));
  return pts;
}

// ---- the dress: a gumdrop, wide at the bottom, narrowing up into the head (profile r, y), squashed 0.9 front to back
const DRESS = [[0, 0.03], [0.17, 0.04], [0.2, 0.09], [0.2, 0.15], [0.185, 0.21], [0.155, 0.27], [0.12, 0.32], [0.09, 0.37], [0, 0.4]];
const DD = 0.9;
const dressR = (y) => {
  for (let i = 1; i < DRESS.length; i++) {
    const [r0, y0] = DRESS[i - 1], [r1, y1] = DRESS[i];
    if (y <= y1) return lerp(r0, r1, (y - y0) / (y1 - y0));
  }
  return 0;
};
// ---- the upper side puffs (they hold the strawberries) and the big lower curls hanging like pigtails
const PUFF = { at: [0.215, 0.645, 0.025], r: [0.112, 0.092, 0.1] };
const CURL = [[0.19, 0.6, 0.0, 0.085], [0.255, 0.5, 0.0, 0.118], [0.265, 0.415, 0.005, 0.13], [0.255, 0.365, 0.01, 0.118]];
// ---- the strawberries: round hearts sitting on top of the puffs, point down and out (one per side, as in GO)
const BERRY_AT = [0.24, 0.72, 0.065];
const BERRY_TURN = [0.35, 0, 0.62]; // tip down and outward, face toward the front
const BERRY = [[0, -0.088], [0.034, -0.07], [0.065, -0.034], [0.079, 0.005], [0.074, 0.039], [0.05, 0.065], [0.017, 0.074], [0, 0.071]];
const rot = ([x = 0, y = 0, z = 0], [vx, vy, vz]) => {
  const a = cos(x), b = sin(x), c = cos(y), d = sin(y), e = cos(z), f = sin(z);
  const m = [c * e, -c * f, d, a * f + b * e * d, a * e - b * f * d, -b * c, b * f - a * e * d, b * e + a * f * d, a * c];
  return [m[0] * vx + m[1] * vy + m[2] * vz, m[3] * vx + m[4] * vy + m[5] * vz, m[6] * vx + m[7] * vy + m[8] * vz];
};
const place = (at, t, v) => rot(t, v).map((c, i) => c + at[i]);
// seeds: dark flecks on the berry's front (decals snapped onto it)
const berryR = (v) => {
  for (let i = 1; i < BERRY.length; i++) {
    const [r0, y0] = BERRY[i - 1], [r1, y1] = BERRY[i];
    if (v <= y1) return lerp(r0, r1, (v - y0) / (y1 - y0));
  }
  return 0;
};
const SEEDS = [[0.028, 0.022], [-0.026, 0.014], [0.004, -0.012], [0.034, -0.034], [-0.02, -0.042]].map(([u, v]) => place(BERRY_AT, BERRY_TURN, [u, v, Math.sqrt(Math.max(0, berryR(v) ** 2 - u * u))]));

// ---- the bow at the back of the waist (the Showdown back sprite shows it; the front views can't)
const BOW_AT = [0, 0.335, -0.115];

const recipe = {
  name: "Alcremie",
  dex: 869,
  height: 1,
  bones: {
    root: [0, 0, 0],
    body: { at: [0, 0.05, 0], parent: "root" },
    head: { at: [0, 0.38, 0], parent: "body" },
    earL: { at: [0.19, 0.6, 0], parent: "head" }, // the lower curls swing like pigtails
    earR: { at: [-0.19, 0.6, 0], parent: "head" },
    armL: { at: [0.115, 0.29, 0.05], parent: "body" },
    armR: { at: [-0.1, 0.32, 0.07], parent: "body" },
  },
  pieces: [
    // the melted puddle it stands in, and a few drips round its edge
    { name: "puddle", kind: "ellipsoid", at: [0, 0.012, 0.02], r: [0.31, 0.03, 0.26], color: CREAM, bone: "root" },
    { name: "drip", kind: "ellipsoid", at: [0.27, 0.008, 0.1], r: [0.065, 0.02, 0.055], color: CREAM, bone: "root", blend: 0.02, mirror: true },
    { name: "drip2", kind: "ellipsoid", at: [0.1, 0.006, 0.26], r: [0.06, 0.016, 0.05], color: CREAM, bone: "root", blend: 0.02 },
    // the dress, flowing into the puddle
    { name: "dress", kind: "lathe", profile: DRESS, scale: [1, 1, DD], color: CREAM, bone: "body", blend: 0.05 },
    // the head: a small round face under the swirl, with a three-bump fringe over the eyes
    { name: "head", kind: "ellipsoid", at: [0, 0.495, 0.0], r: [0.135, 0.12, 0.12], color: CREAM, bone: "head", blend: 0.05 },
    { name: "fringe", kind: "ellipsoid", at: [0.045, 0.548, 0.098], r: [0.034, 0.026, 0.024], color: CREAM, bone: "head", blend: 0.012, mirror: true },
    { name: "fringeMid", kind: "ellipsoid", at: [0, 0.543, 0.107], r: [0.034, 0.026, 0.024], color: CREAM, bone: "head", blend: 0.012 },
    // the soft-serve swirl on top
    { name: "swirl", kind: "chain", points: SWIRL, smooth: 0.035, color: CREAM, bone: "head", blend: 0.05 },
    // upper puffs and the lower curls
    { name: "puff", kind: "ellipsoid", ...PUFF, color: CREAM, bone: "head", blend: 0.04, mirror: true },
    { name: "curl", kind: "chain", points: CURL, color: CREAM, bone: "earL", blend: 0.04, mirror: true },
    // little cream arms: its right paw raised to the chest, the left one down at its side
    { name: "armR", kind: "cone", a: [-0.1, 0.32, 0.07], b: [-0.045, 0.335, 0.135], ra: 0.036, rb: 0.03, color: CREAM, bone: "armR", blend: 0.025 },
    { name: "armL", kind: "cone", a: [0.115, 0.29, 0.05], b: [0.17, 0.215, 0.07], ra: 0.034, rb: 0.026, color: CREAM, bone: "armL", blend: 0.025 },
    // the Strawberry Sweet: two hard berries (blend 0, they're a different material)
    { name: "berry", kind: "lathe", profile: BERRY, at: BERRY_AT, turn: BERRY_TURN, color: STRAW, bone: "head", mirror: true },
    // the bow at the back of the waist: two flat loops and a knot
    { name: "bowLoop", kind: "ellipsoid", at: [0.042, 0.335, -0.122], r: [0.04, 0.03, 0.018], turn: [0, -0.35, 0.25], color: STRAW, bone: "body", mirror: true },
    { name: "bowKnot", kind: "sphere", at: BOW_AT.map((c, i) => (i === 2 ? c - 0.012 : c)), r: 0.02, color: STRAW, bone: "body" },
    { name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true },
  ],
  paint: [
    // pink strawberry-syrup stripes (combs, see above): on the swirl and the puffs, on the dress, down each curl
    { name: "syrupSwirl", color: PINK, shape: { kind: "slab", outline: comb([[0.725, -0.5], [0.815, -0.42]], -0.6, 0.6, 0.012), depth: 0.8 }, bones: ["head"] },
    { name: "syrupDress", color: PINK, shape: { kind: "slab", outline: comb([[0.25, -0.6], [0.12, -0.45]], -0.7, 0.7, 0.012), depth: 0.8 }, bones: ["body"] },
    { name: "syrupCurl", color: PINK, shape: { kind: "slab", outline: comb([[0.69, -0.8], [0.58, -0.95]], -0.1, 0.7, 0.012), depth: 0.8 }, bones: ["earL"], mirror: true },
    // crisp edges for the hard red pieces
    { name: "berry", color: STRAW, shape: { kind: "lathe", profile: BERRY.map(([r, y]) => [r === 0 ? 0 : r + 0.005, y * 1.06]), at: BERRY_AT, turn: BERRY_TURN }, bones: ["head"], mirror: true },
    { name: "bow", color: STRAW, shape: { kind: "box", size: [0.15, 0.075, 0.07], round: 0.02, at: [0, 0.335, -0.125] }, bones: ["body"] },
  ],
  face: {
    eyes: [
      // tall pink-red ovals, a darker red rim, a dark red slit pupil, one white highlight at the top
      { at: [-0.055, 0.468, 0.115], w: 0.05, h: 0.08, sclera: RIM, iris: IRIS, irisAt: [0, -0.02], irisSize: [0.78, 0.84], pupil: PUPIL, pupilSize: [0.2, 0.52], glints: [[0.15, 0.55, 0.28]], mirror: true },
    ],
    spots: [
      // two tiny red dots on the forehead, peeking under the fringe, and the dot of a mouth
      { name: "brow", at: [-0.036, 0.522, 0.12], r: 0.0065, color: DOT, lit: false, mirror: true },
      { name: "mouth", at: [0, 0.418, 0.12], r: [0.008, 0.006], color: DOT, lit: false },
      // the strawberry seeds
      ...SEEDS.map((p, i) => ({ name: `seed${i}`, at: p, r: [0.0045, 0.0065], color: SEED, mirror: true })),
    ],
  },
};

export default recipe;
