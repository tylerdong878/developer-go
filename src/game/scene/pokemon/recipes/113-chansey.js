// Chansey (#113). Nurse Joy's Chansey at the Pokémon Center door: the egg in its pouch, the anime's white nurse cap.
// Shape checked against art-113, home-113, the GO renders (Serebii go-113, PokeMiners pm113) and the Showdown 3D
// front/back (ani-chansey, ani-back-chansey). Numbers: notes/research/species-4.md (Chansey), corrections in
// notes/research/model-facts-2.md.
// 1 tall (top of the cap to the soles; with CAP false, the top of the head), feet at y 0, facing +z,
// +x = Chansey's own left (the viewer's right).
// The cap is anime only (GO and the games never show it, wild Chansey don't wear one). CAP = false is the plain species.
// Paint layers: 6 of the game's 8 (tuft tips L/R, pouch, egg, cap, cross).

const CAP = true;

const PINK = "#f5b9cf";
const DEEP = "#f08ea4"; // tuft tips, pouch, feet
const EGG = "#fbf5ea";
const CAPW = "#f6fcfd";
const CROSS = "#e03c3c";
const DARK = "#1c1620";
const BAND = "#3f6f9f";
const MOUTH = "#6e3e56";

// ---- small vector helpers
const nrm = (v) => {
  const l = Math.hypot(...v);
  return v.map((c) => c / l);
};
const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const D = Math.PI / 180;

// The body: one egg, widest low (y 0.43), nearly flat bottom, no head. Profile (r, y) from HOME's silhouette.
const BODY = [[0, 0.075], [0.15, 0.085], [0.24, 0.11], [0.3, 0.16], [0.34, 0.195], [0.378, 0.24], [0.404, 0.3], [0.42, 0.37], [0.43, 0.43], [0.428, 0.495], [0.417, 0.56], [0.4, 0.62], [0.38, 0.68], [0.35, 0.75], [0.32, 0.8], [0.294, 0.84], [0.265, 0.871], [0.224, 0.903], [0.186, 0.934], [0.134, 0.966], [0, 1.0]];
const DEPTH = 0.9; // front to back, of the width
/** The body's radius at height y (linear in the profile). */
const rAt = (y) => {
  for (let i = 1; i < BODY.length; i++) {
    const [r0, y0] = BODY[i - 1], [r1, y1] = BODY[i];
    if (y <= y1) return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0);
  }
  return 0;
};
/** A point on the body surface at height y and azimuth a (deg from +z toward +x), pulled in by `inset`. */
const onBody = (y, a, inset = 0) => {
  const r = rAt(y) - inset;
  return [Math.sin(a * D) * r, y, Math.cos(a * D) * r * DEPTH];
};

// Tufts: three fat, flat, round-ended fingers per side, rooted close together ~80 deg round from the face, fanned
// (up 15, level, down 20) and swept back a little. Tips reach x ~0.6.
const TUFTS = [
  { y: 0.84, a: 74, up: 15, back: 8, len: 0.33, r: 0.042 },
  { y: 0.79, a: 79, up: -2, back: 11, len: 0.345, r: 0.044 },
  { y: 0.74, a: 83, up: -20, back: 14, len: 0.31, r: 0.041 },
];
const TUFT = TUFTS.map((t, i) => {
  const root = onBody(t.y, t.a, 0.05);
  const d = nrm([Math.cos(t.up * D) * Math.cos(t.back * D), Math.sin(t.up * D), -Math.cos(t.up * D) * Math.sin(t.back * D)]);
  const mid = add(root, d, t.len * 0.55);
  const tip = add(add(root, d, t.len), [0, -0.012 - 0.01 * i, 0]); // the ends droop a little
  const flat = nrm(crs(d, [0, 1, 0])); // horizontal, across the finger: flatten front to back
  // the dark tip: the outer ~42% of the part that shows (about 0.07 of each finger is buried in the body)
  const from = add(root, d, t.len - 0.42 * (t.len - 0.07));
  const past = add(tip, d, 0.06);
  return { root, mid, tip, d, flat, from, past, r: t.r };
});
// One paint chain per side covers all three tips: tip 0, out past the ends, tip 1, back out, tip 2.
const P = TUFT;
const TIP_CHAIN = [P[0].from, P[0].past, P[1].past, P[1].from, P[1].past, P[2].past, P[2].from].map((p) => [...p, 0.07]);

// Egg: widest a little below the middle, the top narrower (species-4: top half 8% narrower).
const EGG_AT = [0, 0.335, 0.335];
const EGG_PROF = [[0, -0.168], [0.08, -0.156], [0.132, -0.117], [0.154, -0.05], [0.152, 0.012], [0.138, 0.074], [0.106, 0.126], [0.058, 0.16], [0, 0.17]];
const EGG_D = 0.86;
const grow = (prof, g) => prof.map(([r, y]) => [r === 0 ? 0 : r + g, y + Math.sign(y) * g]);
// Pouch: a cup (an ellipsoid cut flat at y 0.31) on the lower belly, wider than the egg so its rim stands in front of it.
const POUCH_AT = [0, 0.25, 0.335];
const POUCH_R = [0.198, 0.15, 0.155];
const CUT = (0.297 - POUCH_AT[1]) / POUCH_R[1]; // the rim height in the unit cup
const POUCH = (() => {
  const pts = [];
  const top = Math.asin(CUT);
  for (let i = 0; i <= 10; i++) {
    const t = -Math.PI / 2 + ((top + Math.PI / 2) * i) / 10;
    pts.push([Math.cos(t), Math.sin(t)]);
  }
  const rr = Math.cos(top);
  pts.push([rr - 0.05, CUT + 0.04], [rr - 0.16, CUT + 0.05], [0, CUT + 0.05]);
  return pts;
})();

// Feet: dark pink pointed ovals, toes splayed 40 deg out.
const FOOT_DIR = [Math.sin(40 * D), 0, Math.cos(40 * D)];
const FOOT_C = [0.25, 0.035, 0.12];
const HEEL = add(FOOT_C, FOOT_DIR, -0.1);
const TOE = add(FOOT_C, FOOT_DIR, 0.1);

// Nurse cap (anime, the EP002 look): a white crown wider at the top with a cuff band at the bottom and a red cross on
// the front. Tipped back a little so the high GO camera still sees the cross. Sunk into the dome so no gap shows.
const CAP_AT = [0, 0.94, 0.015];
const CAP_TURN = [-0.12, 0, 0];
const CROWN = [[-0.175, 0], [0.175, 0], [0.205, 0.128], [0.17, 0.138], [0, 0.132], [-0.17, 0.138], [-0.205, 0.128]];
const CROSS_O = (() => {
  const a = 0.015, b = 0.046;
  return [[-a, -b], [a, -b], [a, -a], [b, -a], [b, a], [a, a], [a, b], [-a, b], [-a, a], [-b, a], [-b, -a], [-a, -a]];
})();
const place = (at, turn, v) => {
  const [x, y, z] = turn, a = Math.cos(x), b = Math.sin(x), c = Math.cos(y), d = Math.sin(y), e = Math.cos(z), f = Math.sin(z);
  const m = [c * e, -c * f, d, a * f + b * e * d, a * e - b * f * d, -b * c, b * f - a * e * d, b * e + a * f * d, a * c];
  return [at[0] + m[0] * v[0] + m[1] * v[1] + m[2] * v[2], at[1] + m[3] * v[0] + m[4] * v[1] + m[5] * v[2], at[2] + m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
};

function build() {
  const pieces = [
    { name: "body", kind: "lathe", profile: BODY, scale: [1, 1, DEPTH], color: PINK, bone: "root" },
    // tufts, flat front to back (about 0.08 tall x 0.05 deep)
    ...TUFT.map((t, i) => ({
      name: `tuft${i}`, kind: "chain", points: [[...t.root, t.r * 0.9], [...t.mid, t.r], [...t.tip, t.r * 0.95]],
      squash: { axis: t.flat, k: 0.6 }, color: PINK, bone: "earL", blend: 0.03, mirror: true,
    })),
    // stubby arms down and in, paws resting on the egg's upper sides
    { name: "arm", kind: "chain", points: [[0.3, 0.6, 0.2, 0.062], [0.235, 0.53, 0.33, 0.054], [0.158, 0.478, 0.395, 0.047]], color: PINK, bone: "armL", blend: 0.035, mirror: true },
    // short dark pink ankles out from under the body, then the pointed feet
    { name: "ankle", kind: "cone", a: [0.19, 0.17, 0.05], b: [0.215, 0.05, 0.08], ra: 0.06, rb: 0.045, color: DEEP, bone: "footL", blend: 0.03, mirror: true },
    { name: "foot", kind: "cone", a: HEEL, b: TOE, ra: 0.05, rb: 0.024, squash: { axis: [0, 1, 0], k: 0.74, at: [0, 0.035, 0] }, color: DEEP, bone: "footL", blend: 0.015, mirror: true },
    // short pointed tail low on the back, flattened, pointing back and a little up
    { name: "tail", kind: "cone", a: [0, 0.225, -0.3], b: [0, 0.285, -0.55], ra: 0.09, rb: 0.016, squash: { axis: [0, 1, 0.25], k: 0.66 }, color: PINK, bone: "tail", blend: 0.035 },
    // the pouch cup (small blend so the rim keeps its lip), then the egg sitting in it (tiny blend: no jagged crease)
    { name: "pouch", kind: "lathe", profile: POUCH, smooth: false, at: POUCH_AT, scale: POUCH_R, color: DEEP, bone: "root", blend: 0.015 },
    { name: "egg", kind: "lathe", profile: EGG_PROF, at: EGG_AT, scale: [1, 1, EGG_D], color: EGG, bone: "root", blend: 0.01 },
  ];
  if (CAP)
    pieces.push(
      { name: "cap", kind: "slab", outline: CROWN, smooth: 2, depth: 0.215, round: 0.02, at: CAP_AT, turn: CAP_TURN, color: CAPW, bone: "root" },
      { name: "cuff", kind: "box", size: [0.372, 0.05, 0.234], round: 0.018, at: place(CAP_AT, CAP_TURN, [0, 0.026, 0.003]), turn: CAP_TURN, color: CAPW, bone: "root" },
    );
  pieces.push({ name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true });

  const paint = [
    // dark pink outer ~40% of each tuft (all three tips of one side in one chain)
    { name: "tuftTips", color: DEEP, shape: { kind: "chain", points: TIP_CHAIN }, bones: ["earL"], mirror: true },
    // the pouch and the egg, painted so their edges stay crisp (vertex colors smear over a cell)
    { name: "pouch", color: DEEP, shape: { kind: "lathe", profile: grow(POUCH, 0.03), smooth: false, at: POUCH_AT, scale: POUCH_R }, bones: ["root"] },
    { name: "egg", color: EGG, shape: { kind: "lathe", profile: grow(EGG_PROF, 0.006), at: EGG_AT, scale: [1, 1, EGG_D] }, bones: ["root"] },
  ];
  if (CAP)
    paint.push(
      // the whole cap white (crown and cuff), then the red cross on its front
      { name: "cap", color: CAPW, shape: { kind: "box", size: [0.43, 0.165, 0.25], round: 0.02, at: place(CAP_AT, CAP_TURN, [0, 0.07, 0]), turn: CAP_TURN }, bones: ["root"] },
      { name: "cross", color: CROSS, shape: { kind: "slab", outline: CROSS_O, depth: 0.3, at: place(CAP_AT, CAP_TURN, [0, 0.078, 0.1]), turn: CAP_TURN }, bones: ["root"] },
    );

  return {
    name: CAP ? "Chansey (Nurse Joy's)" : "Chansey",
    dex: 113,
    height: 1,
    bones: {
      root: [0, 0, 0],
      earL: { at: onBody(0.79, 80, 0.05), parent: "root" }, // the three tufts of a side spring together
      earR: { at: onBody(0.79, -80, 0.05), parent: "root" },
      armL: { at: [0.29, 0.59, 0.2], parent: "root" },
      armR: { at: [-0.29, 0.59, 0.2], parent: "root" },
      footL: { at: [0.2, 0.12, 0.06], parent: "root" },
      footR: { at: [-0.2, 0.12, 0.06], parent: "root" },
      tail: { at: [0, 0.23, -0.3], parent: "root" },
    },
    pieces,
    paint,
    face: {
      eyes: [
        // tall narrow ovals close together, dark navy with a blue lower band, one glint top center
        { at: [-0.077, 0.835, 0.27], w: 0.034, h: 0.074, sclera: DARK, iris: BAND, band: -0.22, glint: [0, 0.52, 0.3], mirror: true },
      ],
      mouth: { kind: "smile", at: [0, 0.772, 0.31], w: 0.115, h: 0.022, thick: 0.0075, color: MOUTH },
    },
  };
}

// ---- scale the whole recipe (the cap version is built TOP tall, then brought to 1)
const sv = (v, k) => v.map((c) => c * k);
function scalePrim(p, k) {
  const q = { ...p };
  for (const f of ["at", "a", "b"]) if (q[f]) q[f] = sv(q[f], k);
  for (const f of ["ra", "rb", "depth", "round", "taper", "R", "offset", "blend"]) if (typeof q[f] === "number") q[f] *= k;
  if (q.r !== undefined) q.r = typeof q.r === "number" ? q.r * k : sv(q.r, k);
  if (q.size !== undefined) q.size = typeof q.size === "number" ? q.size * k : sv(q.size, k);
  if (q.points) q.points = q.points.map((pt) => sv(pt, k));
  if (q.outline) q.outline = q.outline.map((pt) => sv(pt, k));
  if (q.profile) q.profile = q.profile.map((pt) => sv(pt, k));
  if (q.squash?.at) q.squash = { ...q.squash, at: sv(q.squash.at, k) };
  return q;
}
function scaleRecipe(r, k) {
  if (k === 1) return r;
  const bones = Object.fromEntries(Object.entries(r.bones).map(([n, b]) => [n, Array.isArray(b) ? sv(b, k) : { ...b, at: sv(b.at, k) }]));
  const f = r.face;
  const eye = (e) => ({ ...e, at: sv(e.at, k), w: e.w * k, h: e.h * k });
  const mouth = (m) => ({ ...m, at: sv(m.at, k), w: m.w * k, h: m.h * k, thick: m.thick * k });
  return {
    ...r,
    bones,
    pieces: r.pieces.map((p) => scalePrim(p, k)),
    paint: r.paint.map((p) => ({ ...p, shape: scalePrim(p.shape, k) })),
    face: { eyes: f.eyes.map(eye), mouth: mouth(f.mouth) },
  };
}

const TOP = CAP ? 1.09 : 1; // the cap's top front corner, measured on the mesh
export default scaleRecipe(build(), 1 / TOP);
