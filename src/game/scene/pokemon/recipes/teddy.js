// Teddy, Tyler's Shih-Poo buddy. One fluffy mass: a curly coat of small smooth bumps over the body, head and legs,
// drop ears with long wavy hair, a short wide muzzle with beard puffs, a black nose, and a silky tail plume carried
// up and curled over his back to his left. Colors are today's Teddy3D.tsx (three creams, apricot-cream ears).
// Shape checked by eye against Tyler's private photos of Teddy (looked at only, never copied).
// 1 tall (top of the head to the paws), paws at y 0, facing +z, +x = Teddy's own left (the viewer's right).
// height: his real height, in game units (meters; the trainer is 1.75). The game scales the 1-tall model by it.
// About 0.27 m at the withers and 0.37 m to the top of the head (Shih-Poo standard is 8-15 in at the withers).

const CREAMS = ["#f3e8d3", "#f6eddc", "#efe2c8"];
const COAT = CREAMS[0];
const EARS = "#e6cfa9";
const MUZZLE = "#fbf6ec";
const BLACK = "#1a1310";
const RIM = "#cdb38e"; // the darker fur round his eyes (the photos all show it)
const TONGUE = "#ef8a8f";

// ---- tiny helpers
const deg = (d) => (d * Math.PI) / 180;
function rng(seed) {
  // mulberry32: same bumps every time
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Low-frequency pick of one of the three creams, so the coat has soft patches instead of per-curl speckles. */
const creamAt = ([x, y, z]) => {
  const n = Math.sin(x * 9.1 + 1.3) * Math.sin(z * 7.3 + 0.4) + 0.6 * Math.sin(y * 11.7 - z * 4.1);
  return n > 0.35 ? CREAMS[1] : n < -0.45 ? CREAMS[2] : CREAMS[0];
};

/**
 * Curl bumps over an ellipsoid (center c, radii R): Fibonacci directions, kept where keep(dir) says, each bump a
 * sphere sunk so it stands `rise` of its radius proud of the surface. Smooth-unioned at k so they read as soft curls.
 */
function curls(name, c, R, n, { keep = () => true, r = [0.04, 0.055], rise = 0.5, k = 0.018, bone = "root", seed = 1 } = {}) {
  const rand = rng(seed);
  const out = [];
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n, s = Math.sqrt(1 - y * y), ph = i * ga + rand() * 0.25;
    const d = [s * Math.cos(ph), y, s * Math.sin(ph)];
    if (!keep(d)) continue;
    const p = [c[0] + R[0] * d[0], c[1] + R[1] * d[1], c[2] + R[2] * d[2]];
    const g = [d[0] / R[0], d[1] / R[1], d[2] / R[2]];
    const gl = Math.hypot(...g);
    const nn = g.map((v) => v / gl);
    const rb = r[0] + (r[1] - r[0]) * rand();
    const at = p.map((v, j) => v - nn[j] * rb * (1 - rise));
    out.push({ name: `${name}${i}`, kind: "sphere", at, r: rb, color: creamAt(at), bone, blend: k });
  }
  return out;
}

// ---- the main masses (all one coat)
const BODY = { at: [0, 0.43, -0.03], r: [0.22, 0.2, 0.35] };
const CHEST = { at: [0, 0.45, 0.19], r: [0.205, 0.225, 0.17] };
const HEAD = { at: [0, 0.755, 0.29], r: [0.215, 0.205, 0.195] };
const MUZ = { at: [0, 0.665, 0.455], r: [0.112, 0.085, 0.09] };
const NOSE = { at: [0, 0.695, 0.54], r: [0.04, 0.03, 0.028] };

// legs: front under the chest, back under the rump; fluffy paws a touch bigger than the legs
const FRONT = { x: 0.105, z: 0.2 };
const BACK = { x: 0.11, z: -0.25 };

// ears: a wide flat lock hanging from the side of the skull, flaring out at the bottom
const EAR = [
  [0.175, 0.86, 0.29, 0.055],
  [0.215, 0.79, 0.29, 0.07],
  [0.235, 0.7, 0.285, 0.078],
  [0.24, 0.615, 0.28, 0.07],
];

// tail plume: up off the rump, curling forward over his back to his left, the silky ends falling down his side
const TAIL = [
  [0, 0.55, -0.355, 0.042],
  [0.01, 0.67, -0.4, 0.062],
  [0.05, 0.755, -0.32, 0.085],
  [0.11, 0.745, -0.21, 0.085],
  [0.165, 0.67, -0.14, 0.068],
];
const LOCKS = [
  // the long silky hair of the plume falling down his left side: flat curtains, not strings
  [[0.08, 0.78, -0.3, 0.07], [0.17, 0.68, -0.29, 0.065], [0.215, 0.58, -0.27, 0.045], [0.225, 0.52, -0.25, 0.02]],
  [[0.13, 0.75, -0.19, 0.065], [0.2, 0.65, -0.15, 0.058], [0.23, 0.55, -0.11, 0.04], [0.235, 0.5, -0.08, 0.018]],
  [[0.02, 0.76, -0.38, 0.06], [0.06, 0.68, -0.44, 0.05], [0.09, 0.6, -0.45, 0.025]],
];

const pieces = [
  // coat: body, a fuller chest, and a neck that rises into the head (no visible neck, it's all fur)
  { name: "body", kind: "ellipsoid", ...BODY, color: COAT, bone: "root" },
  { name: "chest", kind: "ellipsoid", ...CHEST, color: COAT, bone: "root", blend: 0.09 },
  { name: "neck", kind: "ellipsoid", at: [0, 0.6, 0.24], r: [0.16, 0.13, 0.14], color: COAT, bone: "head", blend: 0.09 },
  // round head, a short wide muzzle in a lighter cream, and beard puffs at its sides
  { name: "head", kind: "ellipsoid", ...HEAD, color: CREAMS[1], bone: "head", blend: 0.07 },
  { name: "muzzle", kind: "ellipsoid", ...MUZ, color: MUZZLE, bone: "head", blend: 0.05 },
  { name: "beard", kind: "ellipsoid", at: [0.058, 0.635, 0.465], r: [0.07, 0.065, 0.065], color: MUZZLE, bone: "head", blend: 0.035, mirror: true },
  { name: "chin", kind: "ellipsoid", at: [0, 0.6, 0.44], r: [0.075, 0.05, 0.06], color: MUZZLE, bone: "head", blend: 0.04 },
  // glossy black button nose
  { name: "nose", kind: "ellipsoid", ...NOSE, color: BLACK, bone: "head", blend: 0.008 },
  // drop ears with long hair
  { name: "ear", kind: "chain", points: EAR, smooth: 0.03, squash: { axis: [1, 0, 0.15], k: 0.55 }, color: EARS, bone: "earL", blend: 0.025, mirror: true },
  // legs and fluffy paws
  { name: "legF", kind: "cone", a: [FRONT.x, 0.34, FRONT.z], b: [FRONT.x + 0.005, 0.075, FRONT.z + 0.01], ra: 0.085, rb: 0.072, color: COAT, bone: "legFL", blend: 0.05, mirror: true },
  { name: "pawF", kind: "ellipsoid", at: [FRONT.x + 0.005, 0.05, FRONT.z + 0.03], r: [0.082, 0.055, 0.092], color: CREAMS[1], bone: "legFL", blend: 0.03, mirror: true },
  { name: "haunch", kind: "ellipsoid", at: [BACK.x + 0.01, 0.38, BACK.z + 0.01], r: [0.1, 0.13, 0.12], color: COAT, bone: "legBL", blend: 0.06, mirror: true },
  { name: "legB", kind: "cone", a: [BACK.x, 0.3, BACK.z], b: [BACK.x, 0.075, BACK.z + 0.005], ra: 0.085, rb: 0.072, color: COAT, bone: "legBL", blend: 0.045, mirror: true },
  { name: "pawB", kind: "ellipsoid", at: [BACK.x, 0.05, BACK.z + 0.025], r: [0.08, 0.055, 0.09], color: CREAMS[1], bone: "legBL", blend: 0.03, mirror: true },
  // the tail plume and its silky strands
  { name: "tail", kind: "chain", points: TAIL, smooth: 0.05, color: CREAMS[1], bone: "tail", blend: 0.05 },
  ...LOCKS.map((points, i) => ({ name: `lock${i}`, kind: "chain", points, smooth: 0.03, squash: { axis: i < 2 ? [1, 0, 0] : [0.4, 0, -1], k: 0.6 }, color: CREAMS[i % 2 ? 0 : 1], bone: "tail", blend: 0.035 })),
  // curls: the back and flanks, the top and back of the head (the face stays smooth), the chest ruff
  ...curls("curlBody", BODY.at, BODY.r, 120, { keep: (d) => d[1] > -0.25 && !(d[2] > 0.55 && d[1] > 0.2), seed: 3 }),
  ...curls("curlHead", HEAD.at, HEAD.r, 70, { keep: (d) => d[1] > -0.05 && !(d[2] > 0.45 && d[1] < 0.6) && Math.abs(d[0]) < 0.8, r: [0.038, 0.05], bone: "head", seed: 7 }),
  ...curls("curlChest", CHEST.at, CHEST.r, 40, { keep: (d) => d[2] > 0.3 && d[1] < 0.35 && d[1] > -0.7, r: [0.04, 0.052], seed: 11 }),
  // a few curls round the tops of the legs, so the coat runs down into the leg furnishings
  ...[FRONT, BACK].flatMap((L, j) =>
    [0, 1, 2, 3].map((i) => {
      const a = (i / 4) * Math.PI * 2 + j;
      const at = [L.x + Math.cos(a) * 0.06, 0.27 - (i % 2) * 0.05, L.z + Math.sin(a) * 0.06];
      return { name: `curlLeg${j}${i}`, kind: "sphere", at, r: 0.04, color: creamAt(at), bone: j ? "legBL" : "legFL", blend: 0.018, mirror: true };
    }),
  ),
  // flat soles
  { name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true },
];

const recipe = {
  name: "Teddy",
  dex: null,
  height: 0.37,
  bones: {
    root: [0, 0, 0],
    head: { at: [0, 0.6, 0.22], parent: "root" },
    earL: { at: [0.175, 0.86, 0.29], parent: "head" },
    earR: { at: [-0.175, 0.86, 0.29], parent: "head" },
    tail: { at: [0, 0.56, -0.35], parent: "root" },
    legFL: { at: [FRONT.x, 0.34, FRONT.z], parent: "root" },
    legFR: { at: [-FRONT.x, 0.34, FRONT.z], parent: "root" },
    legBL: { at: [BACK.x, 0.33, BACK.z], parent: "root" },
    legBR: { at: [-BACK.x, 0.33, BACK.z], parent: "root" },
  },
  pieces,
  paint: [
    // the nose again as paint, so its edge on the white muzzle is crisp (vertex colors blur it over a cell)
    { name: "nose", color: BLACK, shape: { kind: "ellipsoid", at: NOSE.at, r: NOSE.r.map((v) => v + 0.004) }, bones: ["head"] },
  ],
  face: {
    spots: [
      // the darker fur round each eye, soft, under the eye
      { name: "rim", at: [-0.085, 0.795, 0.465], r: [0.064, 0.06], color: RIM, soft: 0.45, mirror: true },
      // a little pink tongue under the nose
      { name: "tongue", at: [0, 0.61, 0.5], r: [0.022, 0.016], color: TONGUE, lit: false },
    ],
    mouth: { kind: "w", at: [0, 0.632, 0.51], w: 0.06, h: 0.016, thick: 0.007, color: BLACK },
    eyes: [
      // big round black-brown button eyes, a big glint up and toward the nose and a small one low and out
      { at: [-0.085, 0.795, 0.47], w: 0.07, h: 0.074, sclera: BLACK, glints: [[0.35, 0.4, 0.3], [-0.4, -0.45, 0.12]], mirror: true },
    ],
  },
};

export default recipe;
