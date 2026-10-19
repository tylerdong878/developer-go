// Cresselia (#488), the Lunar Pokémon. The floating raid boss pose: a swan body with no legs, the long neck up, the
// yellow crescent round the back of the head, the big three-shade wing loop (the veil) rising up and back off its back,
// the two solid dark pink ring wings out to the sides, the magenta paws folded on the chest.
// Shape checked against art-488, home-488, the GO icon (PokeMiners pm488, Serebii go-488-serebii) and the Showdown 3D
// front/back (ani-cresselia, ani-back-cresselia). Bulbapedia (Biology, via Wayback): blue swan body, yellow underside,
// pink eyes, a dark pink round tuft on the head, a pointed beak-like snout, yellow crescent ornaments on the sides of
// the head that merge at the back, a pointed tail, ring-like wings on the sides (solid dark pink) and on the back
// (larger, three shades of pink), paw-like parts resting on the chest. Colors sampled from HOME.
// A floater: y 0 = the ring wing tips (the body's bottom is at 0.035), y 1 = the crescent's top tip. Facing +z, +x =
// Cresselia's own left (the viewer's right).
// Two meshes in one frame:
//   default export: everything but the veil. The veil is in `transparent` (the game meshes it apart on the same bones
//                   and draws it see-through, opacity 0.75). Its three shades are three stacked slabs, each a hair
//                   thicker than the last, so the inner color wins on the faces; a carve cuts the hole out of all three.
//   cresselia({ veil: true }): the veil baked in, opaque, for previews.
// Bones: root, body, neck, head, wingL/wingR (the ring wings, pivot at the body side: rotation.z raises and lowers
// them), tail1 (the pointed tail), tail2 (the veil, pivot at its root on the back), chest (the paws; no idle of its own).

const BLUE = "#8fbdee";
const YELLOW = "#fce38f";
const MAGENTA = "#cb7aac";
const PAW_LINE = "#9c4a7e";
const RING = "#e286bf";
const VEIL_OUT = "#fff3fa";
const VEIL_MID = "#f9cde8";
const VEIL_IN = "#ee99cb";
const EYE = "#e690be";
const EYE_RIM = "#5b2242";
const EYE_IRIS = "#c0508e";

const { PI } = Math;
const CRES_ZC = 0.2; // the squash plane (z)
const nrm = (v) => {
  const l = Math.hypot(...v) || 1;
  return v.map((c) => c / l);
};
const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const add = (a, b, s = 1) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
/** Move each point of a closed outline out along its normal by d(point). */
const grow = (pts, d) => {
  const n = pts.length;
  let area = 0;
  for (let i = 0; i < n; i++) area += pts[i][0] * pts[(i + 1) % n][1] - pts[(i + 1) % n][0] * pts[i][1];
  const s = area > 0 ? 1 : -1;
  return pts.map((p, i) => {
    const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
    const t = nrm([b[0] - a[0], b[1] - a[1], 0]);
    const k = typeof d === "function" ? d(p) : d;
    return [p[0] + t[1] * s * k, p[1] - t[0] * s * k];
  });
};

// ---- body
const BODY = [0, 0.2, 0];
const BODY_R = [0.145, 0.165, 0.2];

// ---- the crescent: a banana-shaped horn round the back of the head, fat in the middle, sharp at both tips. A chain of
// round cones along an arc in the middle plane; squashed front to back so it is wider across (x) than it is thick in
// side view (the centerline is stretched to undo the squash).
const CRES_T = [0.3, 1.0], CRES_M = [0.15, 0.76], CRES_B = [0.255, 0.515]; // (z, y): top tip, back-most point, bottom tip
const CRES_K = 0.7;
const CRES_RMAX = 0.085;
const CRES_PTS = (() => {
  // the circle through the three points
  const [ax, ay] = CRES_T, [bx, by] = CRES_M, [cx, cy] = CRES_B;
  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
  const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
  const R = Math.hypot(ax - ux, ay - uy);
  const ang = (p) => Math.atan2(p[1] - uy, p[0] - ux);
  let a0 = ang(CRES_T), am = ang(CRES_M), a1 = ang(CRES_B);
  // go the way round that passes the back point
  while (am < a0) am += 2 * PI;
  while (a1 < am) a1 += 2 * PI;
  const tm = (am - a0) / (a1 - a0);
  const N = 16, out = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, a = a0 + (a1 - a0) * t;
    const z = ux + R * Math.cos(a), y = uy + R * Math.sin(a);
    // fattest at the back point, sharp at the tips
    const u = t < tm ? (t / tm) * 0.5 : 0.5 + ((t - tm) / (1 - tm)) * 0.5;
    const r = 0.004 + CRES_RMAX * Math.sin(PI * u) ** 1.1;
    out.push([0, y, CRES_ZC + (z - CRES_ZC) / CRES_K, r]);
  }
  return out;
})();
// ---- the back wing (the veil): a loop in the middle plane, rising up and back off the back. Wing frame (s, w):
// s from the root out to the far end, w across it (+w = the upper side). Drawn in the (z, y) plane.
const VR = [-0.1, 0.33]; // root (z, y)
const VD = nrm([-1, 1, 0]);
const VW = [VD[1], -VD[0]]; // (z, y) up and forward
const vz = ([s, w]) => [VR[0] + VD[0] * s + VW[0] * w, VR[1] + VD[1] * s + VW[1] * w];
const HOLE = [[0.09, 0], [0.15, 0.035], [0.25, 0.06], [0.35, 0.068], [0.43, 0.058], [0.48, 0.03], [0.495, 0], [0.48, -0.03], [0.42, -0.048], [0.33, -0.05], [0.23, -0.04], [0.14, -0.02]];
const OUTER = [[0, 0], [0.05, 0.07], [0.15, 0.135], [0.3, 0.175], [0.45, 0.185], [0.58, 0.155], [0.68, 0.09], [0.72, 0], [0.69, -0.075], [0.6, -0.12], [0.46, -0.138], [0.3, -0.13], [0.15, -0.1], [0.05, -0.06]];
const SIDE_TURN = [0, -PI / 2, 0]; // slab outline (u, v) = model (z, y), depth along x
const veilPieces = (bone) => [
  { name: "veilOut", kind: "slab", outline: OUTER.map(vz), smooth: 3, depth: 0.03, round: 0.012, turn: SIDE_TURN, color: VEIL_OUT, bone },
  { name: "veilMid", kind: "slab", outline: grow(HOLE, 0.07).map(vz), smooth: 3, depth: 0.034, round: 0.014, turn: SIDE_TURN, color: VEIL_MID, bone, blend: 0.012 },
  { name: "veilIn", kind: "slab", outline: grow(HOLE, 0.03).map(vz), smooth: 3, depth: 0.038, round: 0.016, turn: SIDE_TURN, color: VEIL_IN, bone, blend: 0.012 },
  { name: "veilHole", kind: "slab", outline: HOLE.map(vz), smooth: 3, depth: 0.1, turn: SIDE_TURN, carve: true },
];

// ---- side ring wings: long pointed loops out to each side, sloping down to the tips, the loop's open end buried in
// the body. Local frame: u out to the tip, v forward (rolled so the rear strand rides a little higher, like the art).
const RING_ROOT = [0.09, 0.17, -0.02];
const RING_TIP = [0.63, 0.016, -0.05];
const RU = nrm(add(RING_TIP, RING_ROOT, -1));
const RING_LEN = Math.hypot(...add(RING_TIP, RING_ROOT, -1));
const ROLL = 0.35;
const RV0 = nrm(add([0, 0, 1], RU, -RU[2]));
const RN0 = crs(RU, RV0);
const RV = add(RV0.map((c) => c * Math.cos(ROLL)), RN0, Math.sin(ROLL));
const L = RING_LEN;
// the loop's centerline (u, v): out along the front strand to the pointed tip, back along the rear strand. A round
// tube, not a flat plate: a 0.04 plate breaks up at grid 48, a tube of the same width holds.
const RING_LINE = [[0, 0.088], [0.12, 0.088], [0.24, 0.077], [0.34, 0.055], [0.43, 0.03], [0.5, 0.01], [L - 0.018, 0],
  [0.5, -0.011], [0.43, -0.032], [0.34, -0.058], [0.24, -0.08], [0.12, -0.091], [0, -0.09]];
const RING_PTS = RING_LINE.map(([u, v], i, a) => {
  const p = add(add(RING_ROOT, RU, u), RV, v);
  const k = Math.abs(i - (a.length - 1) / 2) / ((a.length - 1) / 2); // 0 at the tip, 1 at the roots
  return [...p, 0.019 + 0.006 * Math.min(1, k * 1.6)];
});

// ---- paws: two magenta leaves hanging from the base of the neck, down and out over the chest
const PAW = [[0.015, 0.312, 0.165, 0.028], [0.07, 0.235, 0.166, 0.046], [0.118, 0.155, 0.078, 0.027]];
const PAW_N = nrm([0.65, 0.23, 0.73]);

export function cresselia({ veil = false } = {}) {
  return {
    name: "Cresselia",
    dex: 488,
    height: 1,
    bones: {
      root: [0, 0, 0],
      body: { at: BODY, parent: "root" },
      neck: { at: [0, 0.34, 0.1], parent: "body" },
      head: { at: [0, 0.62, 0.17], parent: "neck" },
      wingL: { at: RING_ROOT, parent: "body" },
      wingR: { at: [-RING_ROOT[0], RING_ROOT[1], RING_ROOT[2]], parent: "body" },
      chest: { at: [0, 0.3, 0.16], parent: "body" }, // the paws (no idle of its own; keeps the yellow chest paint off them)
      tail1: { at: [0, 0.26, -0.14], parent: "body" },
      tail2: { at: [0, VR[1], VR[0]], parent: "body" },
    },
    pieces: [
      // the veil first (when baked in for previews), so its hole carve only cuts it
      veil && veilPieces("tail2"),
      { name: "crescent", kind: "chain", points: CRES_PTS, smooth: 0.01, squash: { axis: [0, 0, 1], k: CRES_K, at: [0, 0.76, CRES_ZC] }, color: YELLOW, bone: "head" },
      { name: "body", kind: "ellipsoid", at: BODY, r: BODY_R, color: BLUE, bone: "body" },
      { name: "tail", kind: "cone", a: [0, 0.265, -0.1], b: [0, 0.25, -0.61], ra: 0.08, rb: 0.008, squash: { axis: [0, 1, 0], k: 0.7 }, color: BLUE, bone: "tail1", blend: 0.06 },
      { name: "neck", kind: "chain", points: [[0, 0.29, 0.085, 0.06], [0, 0.42, 0.105, 0.045], [0, 0.54, 0.125, 0.04], [0, 0.63, 0.17, 0.038]], color: BLUE, bone: "neck", blend: 0.06 },
      // the swan curve: the back of the neck sweeps down into the back
      { name: "nape", kind: "cone", a: [0, 0.48, 0.085], b: [0, 0.31, -0.06], ra: 0.03, rb: 0.07, color: BLUE, bone: "body", blend: 0.07 },
      { name: "head", kind: "ellipsoid", at: [0, 0.695, 0.245], r: [0.055, 0.068, 0.07], color: YELLOW, bone: "head", blend: 0.03 },
      { name: "beak", kind: "cone", a: [0, 0.672, 0.29], b: [0, 0.6, 0.465], ra: 0.04, rb: 0.005, squash: { axis: [1, 0, 0], k: 0.8 }, color: YELLOW, bone: "head", blend: 0.02 },
      { name: "tuft", kind: "ellipsoid", at: [0.042, 0.745, 0.255], r: [0.03, 0.065, 0.055], turn: [-0.35, 0, 0], color: MAGENTA, bone: "head", blend: 0.01, mirror: true },
      { name: "paw", kind: "chain", points: PAW, squash: { axis: PAW_N, k: 0.55 }, color: MAGENTA, bone: "chest", blend: 0.01, mirror: true },
      { name: "ring", kind: "chain", points: RING_PTS, smooth: 0.012, color: RING, bone: "wingL", mirror: true },
    ],
    paint: [
      // yellow underside: the front and bottom of the body
      { name: "chest", color: YELLOW, shape: { kind: "ellipsoid", at: [0, 0.14, 0.13], r: [0.125, 0.2, 0.16] }, bones: ["body", "neck", "chest"] },
      // the front of the neck
      { name: "throat", color: YELLOW, shape: { kind: "chain", points: [[0, 0.3, 0.12, 0.065], [0, 0.42, 0.125, 0.048], [0, 0.54, 0.145, 0.043], [0, 0.63, 0.19, 0.045]] }, bones: ["neck", "body", "head"] },
      // the tail's underside
      { name: "tailUnder", color: YELLOW, shape: { kind: "cone", a: [0, 0.206, -0.21], b: [0, 0.241, -0.62], ra: 0.038, rb: 0.012 } },
      // the paws again, over the yellow (the chest paint runs under them)
      { name: "paws", color: MAGENTA, shape: { kind: "chain", points: PAW.map(([x, y, z, r]) => [x, y, z, r + 0.006]), squash: { axis: PAW_N, k: 0.55 } }, mirror: true },
      // the crease down the middle of each paw
      { name: "pawCrease", color: PAW_LINE, shape: { kind: "chain", points: PAW.map(([x, y, z, r], i) => [x + PAW_N[0] * (r * 0.55 - 0.002), y + PAW_N[1] * (r * 0.55 - 0.002), z + PAW_N[2] * (r * 0.55 - 0.002), i === 1 ? 0.0095 : 0.0065]) }, bones: ["chest"], mirror: true },
      // the blue patch on the side of the face, under the eye, against the crescent
      { name: "cheek", color: BLUE, shape: { kind: "slab", outline: [[0.212, 0.668], [0.204, 0.615], [0.247, 0.627]], depth: 0.05, at: [0.05, 0, 0], turn: SIDE_TURN }, mirror: true },
    ],
    face: {
      eyes: [
        { at: [-0.046, 0.674, 0.272], w: 0.05, h: 0.03, sclera: EYE, edge: { color: EYE_RIM, w: 0.2 }, iris: EYE_IRIS, irisAt: [0.1, 0], irisSize: [0.5, 0.6], glints: [[0.25, 0.25, 0.25]], turn: -0.3, mirror: true },
      ],
    },
    transparent: veil ? undefined : veilPieces("tail2").map((p, i) => (i === 0 ? { ...p, opacity: 0.75 } : p)),
  };
}

export default cresselia();
