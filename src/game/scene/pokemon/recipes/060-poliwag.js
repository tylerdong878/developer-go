// Poliwag (#60). GO stance: a blue ball upright on two stubby feet, no arms, big glossy eyes at the very top, puckered
// pink lips under them, the white belly disc with its black spiral, and the tail stem raised up, back and out to its
// left (+x). The see-through fin round the stem is NOT in the mesh: it is listed in `transparent` below for the game
// to add as its own see-through piece on the tail bone (poliwag({ fin: true }) bakes it in, opaque, for previews).
// Verified against art-60, home-60, the GO icon (go256-60, zoom-go256-60-belly) and the Showdown sprites
// ani-poliwag / ani-back-poliwag.
// Numbers: notes/research/species-2.md (Poliwag) plus the corrections in notes/research/model-wild-1.md.
// 1 tall (top of the ball to the soles), feet at y 0, facing +z, +x = Poliwag's own left (the viewer's right).

const BLUE = "#6198cf";
const FOOT = "#5b90c6";
const BELLY = "#eef1f6";
const SPIRAL = "#1e1c22";
const LIPS = "#f2b4cc";
const MOUTH = "#6a4448";
const STEM = "#4f83c1";
const FIN = "#cfe6f4";
const DARK = "#1c1620";

// tiny frame helpers (same math as the tool's place(): three.js XYZ euler)
function rot([x = 0, y = 0, z = 0], [vx, vy, vz]) {
  const a = Math.cos(x), b = Math.sin(x), c = Math.cos(y), d = Math.sin(y), e = Math.cos(z), f = Math.sin(z);
  const m = [c * e, -c * f, d, a * f + b * e * d, a * e - b * f * d, -b * c, b * f - a * e * d, b * e + a * f * d, a * c];
  return [m[0] * vx + m[1] * vy + m[2] * vz, m[3] * vx + m[4] * vy + m[5] * vz, m[6] * vx + m[7] * vy + m[8] * vz];
}
const place = (at, t, v) => {
  const r = rot(t, v);
  return [at[0] + r[0], at[1] + r[1], at[2] + r[2]];
};
const nrm = (v) => {
  const l = Math.hypot(...v) || 1;
  return v.map((c) => c / l);
};
const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
/** Euler XYZ turn whose local +z points along n and local +y as close to up as it gets. */
const face = (n) => {
  const Z = nrm(n);
  const X = nrm(crs([0, 1, 0], Z));
  const Y = crs(Z, X);
  const m13 = Z[0], m23 = Z[1], m33 = Z[2], m12 = Y[0], m11 = X[0], m32 = Y[2], m22 = Y[1];
  const y = Math.asin(Math.max(-1, Math.min(1, m13)));
  return Math.abs(m13) < 0.9999 ? [Math.atan2(-m23, m33), y, Math.atan2(-m12, m11)] : [Math.atan2(m32, m22), y, 0];
};

// ---- the ball
const C = [0, 0.555, 0];
const R = [0.43, 0.445, 0.42];
/** The point on the ball's surface hit by a ray from p along d (p inside the ball). */
const onBall = (p, d) => {
  const q = [(p[0] - C[0]) / R[0], (p[1] - C[1]) / R[1], (p[2] - C[2]) / R[2]];
  const e = [d[0] / R[0], d[1] / R[1], d[2] / R[2]];
  const A = e[0] ** 2 + e[1] ** 2 + e[2] ** 2, B = 2 * (q[0] * e[0] + q[1] * e[1] + q[2] * e[2]), K = q[0] ** 2 + q[1] ** 2 + q[2] ** 2 - 1;
  const t = (-B + Math.sqrt(B * B - 4 * A * K)) / (2 * A);
  return [p[0] + d[0] * t, p[1] + d[1] * t, p[2] + d[2] * t];
};

// ---- belly disc: a cap on the lower front, centered 17 degrees below the equator, 0.6 wide, a bit less tall,
// its top edge right under the lips
const DN = [0, -Math.sin((17 * Math.PI) / 180), Math.cos((17 * Math.PI) / 180)]; // disc axis
const DU = [1, 0, 0]; // disc right (the viewer's right)
const DV = crs(DN, DU); // disc up
const DISC_A = 0.3, DISC_B = 0.272; // half width, half height (measured across the cap)
// a point of the disc's plane frame (u right, v up), carried onto the ball along the disc axis
const onDisc = (u, v) => onBall([C[0] + DU[0] * u + DV[0] * v, C[1] + DU[1] * u + DV[1] * v, C[2] + DU[2] * u + DV[2] * v], DN);
const DISC_OUTLINE = Array.from({ length: 24 }, (_, i) => {
  const a = (i / 24) * Math.PI * 2;
  return [Math.cos(a) * DISC_A, Math.sin(a) * DISC_B];
});

// Spiral: 2.75 turns, the outer end at the lower left (7:30), winding clockwise inward as seen from the front.
// angle = -45deg + phi goes counterclockwise outward; r runs from 3% to 85% of the disc's radii.
const SPIRAL_PTS = (() => {
  const out = [];
  const N = 84;
  for (let i = 0; i <= N; i++) {
    const t = i / N, phi = t * 2.75 * 2 * Math.PI, ang = -Math.PI / 4 + phi, r = 0.04 + 0.81 * t;
    const p = onDisc(r * DISC_A * Math.cos(ang), r * DISC_B * Math.sin(ang));
    out.push([p[0], p[1], p[2], 0.016]);
  }
  return out;
})();

// ---- lips: a puckered pink ring just under the eyes, facing out along the ball's normal there
const LIP_C = onBall(C, nrm([0, 0.3, 1]));
const LIP_N = nrm([(LIP_C[0] - C[0]) / R[0] ** 2, (LIP_C[1] - C[1]) / R[1] ** 2, (LIP_C[2] - C[2]) / R[2] ** 2]);
const LIP_TURN = face(LIP_N);

// ---- tail: a stem from the low back, rising up, back and out to +x
const TAIL_ROOT = [0.06, 0.4, -0.33];
const TAIL_TIP = [0.42, 0.86, -0.5];
const TAIL_MID = [0.2, 0.6, -0.47];
const TAIL_DIR = nrm([TAIL_TIP[0] - TAIL_ROOT[0], TAIL_TIP[1] - TAIL_ROOT[1], TAIL_TIP[2] - TAIL_ROOT[2]]);
// the fin: a leaf round the stem, 0.66 long x 0.33 wide, in a plane holding the stem and facing out sideways-back
const FIN_OUTLINE = [[0, -0.02], [0.08, 0.06], [0.14, 0.18], [0.165, 0.3], [0.15, 0.42], [0.1, 0.54], [0.04, 0.63], [0, 0.66], [-0.05, 0.6], [-0.1, 0.5], [-0.135, 0.36], [-0.13, 0.22], [-0.09, 0.1], [-0.04, 0.02]];
const FIN_TURN = (() => {
  // local +y along the stem, local +z (the fin's face) turned mostly to the front so the leaf shows broadside
  const Y = TAIL_DIR;
  const n0 = nrm([0.35, 0, 1]);
  const k = n0[0] * Y[0] + n0[1] * Y[1] + n0[2] * Y[2];
  const Z = nrm(n0.map((c, i) => c - k * Y[i]));
  const X = crs(Y, Z);
  const m13 = Z[0], m23 = Z[1], m33 = Z[2], m12 = Y[0], m11 = X[0], m32 = Y[2], m22 = Y[1];
  const y = Math.asin(Math.max(-1, Math.min(1, m13)));
  return Math.abs(m13) < 0.9999 ? [Math.atan2(-m23, m33), y, Math.atan2(-m12, m11)] : [Math.atan2(m32, m22), y, 0];
})();
const FIN_PIECE = { name: "tailFin", kind: "slab", outline: FIN_OUTLINE, smooth: true, depth: 0.04, round: 0.016, at: place(TAIL_ROOT, FIN_TURN, [0, 0.04, 0]), turn: FIN_TURN, color: FIN, bone: "tail" };

// eyes: the -x eye (mirrored for +x); +u points toward the nose on this eye
const EYE_AT = onBall(C, nrm([-0.36, 0.62, 0.7]));

export function poliwag({ fin = false } = {}) {
  return {
    name: "Poliwag",
    dex: 60,
    height: 1,
    bones: {
      root: [0, 0, 0],
      body: { at: [0, 0.4, 0], parent: "root" },
      footL: { at: [0.2, 0.1, 0.06], parent: "root" },
      footR: { at: [-0.2, 0.1, 0.06], parent: "root" },
      tail: { at: TAIL_ROOT, parent: "body" },
      lips: { at: LIP_C, parent: "body" },
    },
    pieces: [
      // the ball: head and body in one
      { name: "body", kind: "ellipsoid", at: C, r: R, color: BLUE, bone: "body" },
      // stubby round feet under the front, toes turned out
      { name: "leg", kind: "cone", a: [0.13, 0.22, 0.03], b: [0.185, 0.08, 0.08], ra: 0.075, rb: 0.068, color: BLUE, bone: "footL", blend: 0.06, mirror: true },
      { name: "foot", kind: "ellipsoid", at: [0.2, 0.056, 0.11], r: [0.082, 0.06, 0.122], turn: [0, 0.5, 0], color: FOOT, bone: "footL", blend: 0.04, mirror: true },
      // the lips: a thick pink ring standing off the ball
      { name: "lips", kind: "torus", R: 0.062, r: 0.03, scale: [1.25, 0.82, 1], at: place(LIP_C, LIP_TURN, [0, 0, 0.012]), turn: LIP_TURN, color: LIPS, bone: "lips", blend: 0.02 },
      // the tail stem
      { name: "stem", kind: "chain", points: [[...TAIL_ROOT, 0.03], [...TAIL_MID, 0.024], [...TAIL_TIP, 0.018]], color: STEM, bone: "tail", blend: 0.03 },
      fin && FIN_PIECE,
      { name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true },
    ],
    paint: [
      // the white belly disc, an elliptical cylinder along the disc axis cut by the ball
      { name: "belly", color: BELLY, shape: { kind: "slab", outline: DISC_OUTLINE, smooth: true, depth: 0.5, at: [C[0] + DN[0] * 0.35, C[1] + DN[1] * 0.35, C[2] + DN[2] * 0.35], turn: face(DN) }, bones: ["body"] },
      // the black spiral on it
      { name: "spiral", color: SPIRAL, shape: { kind: "chain", points: SPIRAL_PTS }, bones: ["body"] },
    ],
    face: {
      eyes: [
        // big glossy eyes: a black iris filling most of the eye, pushed up so a white crescent shows below,
        // a big white highlight up on the nose side; the iris ramp already lightens its bottom (the low reflection)
        { at: EYE_AT, w: 0.2, h: 0.22, sclera: "#f4f4f6", iris: DARK, irisAt: [0.02, 0.1], irisSize: [0.86, 0.86], glints: [[0.3, 0.42, 0.34]], mirror: true },
      ],
      spots: [
        // the dark opening inside the pucker
        { name: "mouth", at: LIP_C, r: [0.04, 0.024], color: MOUTH, lit: false },
      ],
    },
    transparent: [{ ...FIN_PIECE, opacity: 0.55 }],
  };
}

export default poliwag();
