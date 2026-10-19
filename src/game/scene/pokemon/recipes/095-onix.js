// Onix (#95). A chain of faceted gray boulders arching high, the angular head at the front end with one horn, the
// rocks shrinking to pebbles along the ground back under the head (GO's "C" pose).
// Verified against art-95, home-95, the GO icon pm95, Serebii's go-095 and the Showdown 3D front/back.
// Numbers: notes/research/species-3.md (Onix), corrections in notes/research/model-facts-1.md.
// 1 tall (horn tip to the ground), resting on y 0, facing +z, +x = Onix's own left (the viewer's right).
// Every rock is a sphere with ~9 flat facets carved off (bounded box carves, so they only cut their own rock),
// hard-unioned (blend 0) to its neighbors, one bone per rock (seg1 next to the head .. seg13 at the tail tip).

const FRONT = "#a3a3ae";
const REAR = "#8e8c9b";
const HORN = "#b0b0ba";
const EYE = "#eceef2";
const DARK = "#1c1620";

// ---- small vector helpers (three.js euler XYZ)
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const nrm = (v) => {
  const l = Math.hypot(...v);
  return v.map((c) => c / l);
};
const rot = ([x = 0, y = 0, z = 0], [vx, vy, vz]) => {
  const a = Math.cos(x), b = Math.sin(x), c = Math.cos(y), d = Math.sin(y), e = Math.cos(z), f = Math.sin(z);
  const m = [c * e, -c * f, d, a * f + b * e * d, a * e - b * f * d, -b * c, b * f - a * e * d, b * e + a * f * d, a * c];
  return [m[0] * vx + m[1] * vy + m[2] * vz, m[3] * vx + m[4] * vy + m[5] * vz, m[6] * vx + m[7] * vy + m[8] * vz];
};
const place = (at, turn, v) => add(at, rot(turn, v));
/** Euler XYZ that turns local x, y, z onto X, Y, Z. */
const eulerOf = (X, Y, Z) => {
  const y = Math.asin(Math.max(-1, Math.min(1, Z[0])));
  return Math.abs(Z[0]) < 0.9999 ? [Math.atan2(-Z[1], Z[2]), y, Math.atan2(-Y[0], X[0])] : [Math.atan2(Y[2], Y[1]), y, 0];
};
/** Euler XYZ whose local z points along n. */
const facing = (n) => {
  const Z = nrm(n);
  let X = crs([0, 1, 0], Z);
  if (Math.hypot(...X) < 0.2) X = crs([1, 0, 0], Z);
  X = nrm(X);
  return eulerOf(X, crs(Z, X), Z);
};
// seeded random, so the rocks come out the same every build
let seed = 9573;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// the 12 facet normals of a dodecahedron (the vertices of an icosahedron)
const PHI = (1 + Math.sqrt(5)) / 2;
const DODECA = [];
for (const a of [-1, 1]) for (const b of [-PHI, PHI]) DODECA.push(nrm([0, a, b]), nrm([a, b, 0]), nrm([b, 0, a]));

/** One boulder: a sphere with flat facets carved off; facets that face a chain neighbor are left (they're buried). */
function boulder(name, c, r, color, bone, neighbors, { cut = [0.7, 0.8], turn } = {}) {
  const t = turn ?? [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28];
  const out = [{ name, kind: "sphere", at: c, r, color, bone }];
  DODECA.forEach((n0, i) => {
    const n = rot(t, n0);
    if (neighbors.some((q) => dot(n, nrm(sub(q, c))) > 0.55)) return;
    const df = r * (cut[0] + (cut[1] - cut[0]) * rnd());
    out.push({ name: `${name}Cut${i}`, kind: "box", size: [1.5 * r, 1.5 * r, 0.6 * r], at: add(c, mul(n, df + 0.3 * r)), turn: facing(n), carve: true });
  });
  return out;
}

// ---- the chain, in the plane of the "C" (s sideways toward the arch, u up), turned 35 deg about y:
// x = 0.819 s, z = -0.574 s. Rock 1 is next to the head, rock 13 is the tail tip.
const CS = [
  [-0.111, 0.757, 0.117], [0.028, 0.757, 0.117], [0.167, 0.717, 0.108], [0.275, 0.592, 0.117], [0.333, 0.408, 0.1],
  [0.347, 0.242, 0.092], [0.275, 0.1, 0.075], [0.167, 0.092, 0.067], [0.056, 0.092, 0.067], [-0.058, 0.092, 0.058],
  [-0.153, 0.075, 0.05], [-0.267, 0.067, 0.042], [-0.361, 0.067, 0.036],
];
// the tail runs back a little so it passes behind the head's chin rather than under it
const ROCKS = CS.map(([s, u, r], i) => ({ c: [0.819 * s, u, -0.574 * s - (i >= 7 ? 0.03 * (i - 6) : 0)], r: r * (r > 0.07 ? 1.12 : 0.95) }));
// the ground pebbles rest on y 0: drop each low rock so its bottom touches the ground
ROCKS.forEach((q) => {
  if (q.c[1] - q.r < 0.03) q.c[1] = q.r * 0.92;
});
// and the chain must never gap: from rock 8 on, step along the ground path so each pebble just overlaps the last
{
  const dir = nrm(sub([ROCKS[12].c[0], 0, ROCKS[12].c[2]], [ROCKS[6].c[0], 0, ROCKS[6].c[2]]));
  for (let i = 7; i < ROCKS.length; i++) {
    const p = ROCKS[i - 1], q = ROCKS[i];
    const step = 0.9 * (p.r + q.r);
    q.c = [p.c[0] + dir[0] * step, q.r * 0.92, p.c[2] + dir[2] * step];
  }
}
const lerpHex = (a, b, t) => {
  const p = (h, k) => parseInt(h.slice(1 + 2 * k, 3 + 2 * k), 16);
  return "#" + [0, 1, 2].map((k) => Math.round(p(a, k) + (p(b, k) - p(a, k)) * t).toString(16).padStart(2, "0")).join("");
};

// ---- the head: a group turned to look front and a little to the viewer's left
const H = [-0.239, 0.567, 0.168];
const HT = [0, -0.2, 0];
const hp = (v) => place(H, HT, v);
/** A turn in the head's frame, composed with the head's own turn. */
const ht = (t) => eulerOf(...[[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((e) => rot(HT, rot(t, e))));
/** A flat facet cut off the head: plane normal n (head frame) at distance df from the head center. */
const facet = (name, n, df, w = 0.4) => {
  const N = rot(HT, nrm(n));
  return { name, kind: "box", size: [w, w, 0.12], at: add(H, mul(N, df + 0.06)), turn: facing(N), carve: true };
};

// Carves cut everything listed before them, so order matters: the head first (its facet cuts then only touch the
// skull), then the boulders (whose cuts are small boxes that skip the faces toward their neighbors).
const pieces = [];
pieces.push(
  // the head: a big boulder, longer than wide, cut into flat planes: a flat face, cheeks angling back, forehead,
  // chin, sides and top (no cuts at the back-top, where rock 1 joins)
  { name: "skull", kind: "ellipsoid", at: H, r: [0.175, 0.185, 0.215], turn: HT, color: FRONT, bone: "head" },
  facet("face", [0, 0, 1], 0.165, 0.3),
  facet("cheekL", [0.85, -0.1, 0.5], 0.16),
  facet("cheekR", [-0.85, -0.1, 0.5], 0.16),
  facet("forehead", [0, 0.72, 0.7], 0.142),
  facet("chin", [0, -0.78, 0.62], 0.125),
  facet("sideL", [1, 0.08, 0], 0.132),
  facet("sideR", [-1, 0.08, 0], 0.132),
  facet("crownL", [0.68, 0.72, 0.1], 0.135),
  facet("crownR", [-0.68, 0.72, 0.1], 0.135),
  facet("top", [0, 1, -0.2], 0.142),
  facet("under", [0, -1, -0.1], 0.13),
  facet("jowlL", [0.7, -0.7, 0.1], 0.122),
  facet("jowlR", [-0.7, -0.7, 0.1], 0.122),
  // the ridge from the horn down the middle of the face to the snout
  { name: "ridge", kind: "box", at: hp([0, 0.04, 0.158]), size: [0.034, 0.17, 0.034], round: 0.012, turn: ht([0.28, 0, 0]), color: FRONT, bone: "head" },
  // heavy brows meeting in a V over the eyes
  ...[-1, 1].map((k) => ({ name: `brow${k}`, kind: "box", at: hp([k * 0.064, 0.03, 0.158]), size: [0.095, 0.03, 0.04], round: 0.01, turn: ht([0.1, -k * 0.25, -k * 0.4]), color: FRONT, bone: "head" })),
);
// the boulders, front (lighter) to tail (darker)
ROCKS.forEach((q, i) => {
  const nb = [];
  nb.push(i === 0 ? H : ROCKS[i - 1].c);
  if (i + 1 < ROCKS.length) nb.push(ROCKS[i + 1].c);
  pieces.push(...boulder(`rock${i + 1}`, q.c, q.r, lerpHex(FRONT, REAR, Math.min(1, i / 7)), `seg${i + 1}`, nb));
});
pieces.push(
  // the single horn, leaning back a touch (listed after the boulders so none of their cuts can reach it)
  { name: "horn", kind: "cone", a: hp([0, 0.11, -0.03]), b: hp([0, 0.425, -0.075]), ra: 0.04, rb: 0.012, color: HORN, bone: "head" },
  { name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true },
);

const bones = { root: [0, 0, 0], head: { at: H, parent: "seg1" } };
ROCKS.forEach((q, i) => (bones[`seg${i + 1}`] = { at: q.c, parent: "root" }));

// face frame: the head's forward direction
const FWD = rot(HT, [0, 0, 1]);

const recipe = {
  name: "Onix",
  dex: 95,
  height: 1,
  bones,
  pieces,
  face: {
    eyes: [
      // narrow white slits slanting down to the middle under the brows, a tiny dark slit pupil (two dark glints)
      // (the viewer's-left eye; +u, its inner end, points to the middle)
      // (the head is turned, so both eyes are placed in its frame rather than mirrored in model x)
      { at: hp([-0.06, 0.004, 0.17]), dir: FWD, w: 0.086, h: 0.042, turn: -0.32, sclera: EYE, cut: [0.35, -0.5], glints: [[0.2, 0.15, 0.42], [0.2, -0.2, 0.42]], glintColor: DARK },
      { at: hp([0.06, 0.004, 0.17]), dir: FWD, w: 0.086, h: 0.042, turn: 0.32, sclera: EYE, cut: [0.35, 0.5], glints: [[-0.2, 0.15, 0.42], [-0.2, -0.2, 0.42]], glintColor: DARK },
    ],
    mouth: { kind: "open", at: hp([0, -0.1, 0.165]), dir: FWD, w: 0.165, h: 0.032, thick: 0.006, color: DARK, inner: DARK, tongue: null },
  },
};

export default recipe;
