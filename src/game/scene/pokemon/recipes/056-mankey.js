// Mankey (#56). GO stance: a fuzzy cream ball (head and body in one) flexing both brown fists up, thin limbs, long
// splayed toes, and the thin tail rising behind its left side with a hook at the top.
// Verified against art-56, home-56, the GO icon pm56, Serebii's go-056 and the Showdown 3D front/back.
// Numbers: notes/research/species-3.md (Mankey), corrections in notes/research/model-facts-1.md.
// 1 tall (tail hook to soles), feet at y 0, facing +z, +x = Mankey's own left (the viewer's right).

const CREAM = "#f1dfcc";
const BROWN = "#ad7a4f";
const SNOUT = "#efc3cc";
const IRIS = "#d0521a";
const DARK = "#1c1620";

// ---- small vector helpers
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const nrm = (v) => {
  const l = Math.hypot(...v);
  return v.map((c) => c / l);
};

const C = [0, 0.47, 0];
const RB = [0.23, 0.225, 0.21];
const onBody = (d, out = 0) => {
  // point on the body ellipsoid in direction d, pushed out by `out`
  const n = nrm(d);
  const k = 1 / Math.hypot(n[0] / RB[0], n[1] / RB[1], n[2] / RB[2]);
  return add(C, mul(n, k + out));
};

// ---- fur: tufts all over except the face, combed back away from the face (so the front silhouette is shaggy and the
// sides don't bristle), longer on top (a crest)
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const FACE = nrm([0, 0.1, 1]);
const SPIKES = (() => {
  const out = [];
  const N = 80, ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (2 * (i + 0.5)) / N, r = Math.sqrt(1 - y * y), a = i * ga;
    const d = [Math.cos(a) * r, y, Math.sin(a) * r];
    if (dot(d, FACE) > 0.55) continue; // keep the face smooth
    if (y < -0.8) continue; // the hips
    if (d[2] < -0.62 && y < 0.5) continue; // a smooth back (Showdown back sprite), fur only round its edges
    if (Math.abs(d[0]) > 0.55 && d[1] > 0.45 && d[2] > -0.3) continue; // room for the ears
    const len = 0.035 + 0.03 * Math.max(0, y) ** 2;
    out.push({ d, len });
  }
  // the crest tuft
  for (const [x, z, l] of [[0, 0.1, 0.07], [-0.3, 0.0, 0.06], [0.3, 0.0, 0.06], [-0.13, 0.2, 0.055], [0.13, 0.2, 0.055], [0, -0.25, 0.055]])
    out.push({ d: [x, 1, z], len: l });
  return out.map(({ d, len }, i) => {
    const n = nrm(d);
    // tangent pointing away from the face, blended in so each tuft leans back
    const k = dot(FACE, n);
    const t = [n[0] * k - FACE[0], n[1] * k - FACE[1], n[2] * k - FACE[2]];
    const tl = Math.hypot(...t);
    const dir = tl > 1e-3 ? nrm(add(n, mul(t, 1.0 / tl))) : n;
    const a = onBody(n, -0.025);
    return { name: `fur${i}`, kind: "cone", a, b: add(onBody(n, 0), mul(dir, len)), ra: 0.036, rb: 0.007, color: CREAM, bone: "body", blend: 0.018 };
  });
})();

// ---- ears: little triangles on the upper sides, leaning out; brown inside (paint)
const EAR = [[-0.06, -0.03], [0.06, -0.03], [0.014, 0.1]];
const EAR_IN = [[-0.04, -0.005], [0.04, -0.005], [0.011, 0.075]];
const EAR_AT = [0.17, 0.645, 0.04];
const EAR_TURN = [-0.1, -0.3, -0.6];

// ---- limbs (the +x side; mirror: true makes the other)
const SH = [0.19, 0.5, 0.0], EL = [0.315, 0.585, 0.02], WR = [0.34, 0.7, 0.03];
const HIP = [0.08, 0.31, 0.0], KNEE = [0.165, 0.165, 0.03], ANK = [0.19, 0.055, 0.03];
const toes = () => {
  // three long toes splayed forward and out, one back; brown
  const dirs = [[0.25, 1], [0.75, 0.6], [-0.2, 0.9], [0.25, -0.75]];
  return dirs.map(([x, z], i) => {
    const d = nrm([x, 0, z]);
    const len = i === 3 ? 0.075 : 0.11;
    return { name: `toe${i}`, kind: "cone", a: [ANK[0], 0.02, ANK[2]], b: [ANK[0] + d[0] * len, 0.016, ANK[2] + d[2] * len], ra: 0.018, rb: 0.015, color: BROWN, bone: "footL", blend: 0.012, mirror: true };
  });
};

// ---- tail: thin, from the low back up behind its left side, a hook at the top curling in; the hook is brown
const TAIL1 = [[0.03, 0.33, -0.17, 0.022], [0.09, 0.43, -0.25, 0.021], [0.14, 0.58, -0.26, 0.02]];
const TAIL2 = [[0.14, 0.58, -0.26, 0.02], [0.165, 0.73, -0.23, 0.02], [0.165, 0.86, -0.19, 0.02]];
const TAIL3 = [[0.165, 0.86, -0.19, 0.02], [0.155, 0.945, -0.16, 0.02], [0.115, 0.978, -0.14, 0.02], [0.075, 0.96, -0.125, 0.02], [0.062, 0.915, -0.12, 0.019]];

// ---- eyes (the viewer's-left one): an ellipse with its top cut by a line slanting down to the inner end
const EYE = { at: [-0.07, 0.482, 0.2], w: 0.1, h: 0.074, turn: -0.08, cut: [0.3, -0.62] };
// the brow line lies along that cut: where the cut line meets the ellipse, in the eye's turned frame
const BROW = (() => {
  const [c0, c1] = EYE.cut, hw = EYE.w / 2, hh = EYE.h / 2;
  // s^2 + (c0 + c1 s)^2 = 1
  const A = 1 + c1 * c1, B = 2 * c0 * c1, Cq = c0 * c0 - 1, q = Math.sqrt(B * B - 4 * A * Cq);
  const pts = [(-B + q) / (2 * A), (-B - q) / (2 * A)].map((s) => [s * hw, (c0 + c1 * s) * hh]);
  const mid = [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2];
  const ang = Math.atan2(pts[0][1] - pts[1][1], pts[0][0] - pts[1][0]);
  const r = EYE.turn, c = Math.cos(r), s = Math.sin(r);
  const off = [mid[0] * c - mid[1] * s, mid[0] * s + mid[1] * c]; // eye frame -> face (x right, y up)
  return { at: [EYE.at[0] + off[0], EYE.at[1] + off[1], EYE.at[2] + 0.005], turn: ang + r, w: Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]) + 0.012 };
})();

const recipe = {
  name: "Mankey",
  dex: 56,
  height: 1,
  bones: {
    root: [0, 0, 0],
    body: { at: [0, 0.4, 0], parent: "root" },
    earL: { at: EAR_AT, parent: "body" },
    earR: { at: [-EAR_AT[0], EAR_AT[1], EAR_AT[2]], parent: "body" },
    armL: { at: SH, parent: "body" },
    armR: { at: [-SH[0], SH[1], SH[2]], parent: "body" },
    legL: { at: HIP, parent: "root" },
    legR: { at: [-HIP[0], HIP[1], HIP[2]], parent: "root" },
    footL: { at: ANK, parent: "legL" },
    footR: { at: [-ANK[0], ANK[1], ANK[2]], parent: "legR" },
    tail1: { at: TAIL1[0].slice(0, 3), parent: "body" },
    tail2: { at: TAIL2[0].slice(0, 3), parent: "tail1" },
    tail3: { at: TAIL3[0].slice(0, 3), parent: "tail2" },
  },
  pieces: [
    // the ball: head and body in one
    { name: "body", kind: "ellipsoid", at: C, r: RB, color: CREAM, bone: "body" },
    ...SPIKES,
    { name: "ear", kind: "slab", outline: EAR, depth: 0.04, round: 0.016, at: EAR_AT, turn: EAR_TURN, color: CREAM, bone: "earL", blend: 0.02, mirror: true },
    // the pig snout, low between the eyes
    { name: "snout", kind: "ellipsoid", at: [0, 0.418, 0.198], r: [0.052, 0.037, 0.032], color: SNOUT, bone: "body", blend: 0.01 },
    // arms: out and up to the elbow, then straight up to big brown fists (a flex)
    { name: "upperArm", kind: "cone", a: SH, b: EL, ra: 0.026, rb: 0.023, color: CREAM, bone: "armL", blend: 0.025, mirror: true },
    { name: "forearm", kind: "cone", a: EL, b: WR, ra: 0.023, rb: 0.024, color: CREAM, bone: "armL", blend: 0.012, mirror: true },
    { name: "fist", kind: "box", at: [0.35, 0.755, 0.035], size: [0.12, 0.1, 0.1], round: 0.04, turn: [0.15, 0, -0.12], color: BROWN, bone: "armL", blend: 0.012, mirror: true },
    { name: "knuckle", kind: "cone", a: [0.305, 0.795, 0.08], b: [0.39, 0.785, 0.075], r: 0.024, color: BROWN, bone: "armL", blend: 0.012, mirror: true },
    // thin legs bowed out, brown feet with long toes
    { name: "thigh", kind: "cone", a: HIP, b: KNEE, ra: 0.03, rb: 0.024, color: CREAM, bone: "legL", blend: 0.03, mirror: true },
    { name: "shin", kind: "cone", a: KNEE, b: [ANK[0], 0.075, ANK[2]], ra: 0.024, rb: 0.024, color: CREAM, bone: "legL", blend: 0.012, mirror: true },
    { name: "ankle", kind: "ellipsoid", at: [ANK[0], 0.045, ANK[2]], r: [0.03, 0.035, 0.032], color: BROWN, bone: "footL", blend: 0.012, mirror: true },
    ...toes(),
    // tail in three bones; the hook is brown
    { name: "tail1", kind: "chain", points: TAIL1, color: CREAM, bone: "tail1", blend: 0.02 },
    { name: "tail2", kind: "chain", points: TAIL2, color: CREAM, bone: "tail2", blend: 0.01 },
    { name: "tail3", kind: "chain", points: TAIL3, color: BROWN, bone: "tail3", blend: 0.01 },
    { name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true },
  ],
  paint: [
    // brown ear insides
    { name: "earIn", color: BROWN, shape: { kind: "slab", outline: EAR_IN, depth: 0.2, at: EAR_AT, turn: EAR_TURN }, bones: ["earL"], mirror: true },
  ],
  face: {
    eyes: [
      // white, the top cut flat and slanting down to the middle (the angry brow), an orange-red iris at the inner end
      // with a slit pupil; the viewer's-left eye, +u (its inner end) points to the middle
      {
        ...EYE,
        sclera: "#ffffff",
        iris: IRIS,
        irisAt: [0.28, -0.12],
        irisSize: [0.3, 0.62],
        pupil: DARK,
        pupilSize: [0.07, 0.5],
        cut: EYE.cut,
        edge: { color: DARK, w: 0.1 },
        mirror: true,
      },
    ],
    mouths: [
      // the heavy brow line along each eye's cut edge (half of it shows above the eye)
      { name: "brow", kind: "line", ...BROW, h: 0.01, thick: 0.012, color: DARK, mirror: true },
      // three frown creases between the eyes, above the snout
      { name: "crease", kind: "line", at: [0, 0.52, 0.215], turn: Math.PI / 2, w: 0.03, h: 0.01, thick: 0.004, color: DARK },
      { name: "crease2", kind: "line", at: [0.017, 0.517, 0.213], turn: Math.PI / 2 - 0.4, w: 0.028, h: 0.01, thick: 0.004, color: DARK, mirror: true },
    ],
    spots: [
      // vertical nostril slits on the snout
      { name: "nostril", at: [0.014, 0.418, 0.232], r: [0.005, 0.014], color: DARK, lit: false, mirror: true },
    ],
  },
};

export default recipe;
