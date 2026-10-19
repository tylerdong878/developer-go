// Gastly (#92). The solid part only: a dark ball with two flat white eye plates (top cut by a straight brow, the
// outer edges standing off the ball past its silhouette), thin black brow spikes, a fanged grin.
// The purple gas is NOT in the mesh: it's a separate transparent, camera-facing piece the game adds (see `aura` below
// and notes/research/model-wild-3.md).
// Checked against art-92, home-92, the GO icon (go-92, goS-92) and the Showdown 3D front/back (ani-gastly, ani-back-gastly).
// Numbers: notes/research/species-2c.md (Gastly), rescaled so the ball is 1 tall, plus the corrections in model-wild-3.md.
// A floater: y 0 = the bottom of the ball, y 1 = its top. Facing +z, +x = Gastly's own left (the viewer's right).

const BALL = "#3b3442";
const WHITE = "#f4f1f6";
const DARK = "#1c1620";
const MOUTH = "#8e3a44";
const LIP = "#4a2630";
const LID = "#6b3444";

const R = 0.5;
const C = [0, 0.5, 0];

// point on the ball at longitude lon (deg, from +z toward +x) and latitude lat, pushed out by `out`
const onBall = (lon, lat, out = 0) => {
  const a = (lon * Math.PI) / 180, b = (lat * Math.PI) / 180;
  return [C[0] + Math.sin(a) * Math.cos(b) * (R + out), C[1] + Math.sin(b) * (R + out), C[2] + Math.cos(a) * Math.cos(b) * (R + out)];
};
const normal = (lon, lat) => onBall(lon, lat, 1).map((v, k) => v - onBall(lon, lat, 0)[k]);
// euler XYZ that turns local +z onto the ball normal at (lon, lat): local +x then runs outward along the surface, +y up
const faceOut = (lon, lat) => {
  const n = normal(lon, lat);
  const y = Math.asin(n[0]), cy = Math.cos(y);
  return [Math.atan2(-n[1] / cy, n[2] / cy), y, 0];
};
// frame helper (three.js XYZ euler, same math as the tool's place())
const rot = ([x = 0, y = 0, z = 0], [vx, vy, vz]) => {
  const a = Math.cos(x), b = Math.sin(x), c = Math.cos(y), d = Math.sin(y), e = Math.cos(z), f = Math.sin(z);
  const m = [c * e, -c * f, d, a * f + b * e * d, a * e - b * f * d, -b * c, b * f - a * e * d, b * e + a * f * d, a * c];
  return [m[0] * vx + m[1] * vy + m[2] * vz, m[3] * vx + m[4] * vy + m[5] * vz, m[6] * vx + m[7] * vy + m[8] * vz];
};
const place = (at, turn, v) => rot(turn, v).map((c, i) => c + at[i]);
// euler XYZ of the frame `turn` followed by a roll `ang` about its own local z (R = R(turn) * Rz(ang))
const rotTurn = (turn, ang) => {
  const X = rot(turn, [Math.cos(ang), Math.sin(ang), 0]), Y = rot(turn, [-Math.sin(ang), Math.cos(ang), 0]), Z = rot(turn, [0, 0, 1]);
  const y = Math.asin(Math.max(-1, Math.min(1, Z[0])));
  return Math.abs(Z[0]) < 0.9999999 ? [Math.atan2(-Z[1], Z[2]), y, Math.atan2(-Y[0], X[0])] : [Math.atan2(Y[2], Y[1]), y, 0];
};

// ---- the +x eye plate: a flat disc r 0.25 tangent to the ball at azimuth 44, elevation -2, its top cut off by a
// straight brow chord at 45 degrees (rising outward) that passes 0.4 of the radius above-inside the center, so about
// two thirds of the disc shows: tall on the outer side, a thin wedge at the inner end (art, HOME)
const EYE_LON = 44, EYE_LAT = -2, PR = 0.25, BROW = Math.PI / 4, OFF = 0.4 * PR;
const HALF = Math.sqrt(PR * PR - OFF * OFF);
const MID = [-OFF * Math.sin(BROW), OFF * Math.cos(BROW)]; // chord midpoint (local +x = outward, +y = up)
const OUTER = [MID[0] + HALF * Math.cos(BROW), MID[1] + HALF * Math.sin(BROW)]; // outer top corner
const INNER = [MID[0] - HALF * Math.cos(BROW), MID[1] - HALF * Math.sin(BROW)]; // inner low end
const A0 = Math.atan2(OUTER[1], OUTER[0]), A1 = Math.atan2(INNER[1], INNER[0]) - 2 * Math.PI * (Math.atan2(INNER[1], INNER[0]) > A0 ? 1 : 0);
const PLATE = Array.from({ length: 25 }, (_, i) => {
  const t = A0 + ((A1 - A0) * i) / 24;
  return [PR * Math.cos(t), PR * Math.sin(t)];
});
const PLATE_AT = onBall(EYE_LON, EYE_LAT, -0.006);
const PLATE_TURN = faceOut(EYE_LON, EYE_LAT);
// brow spike: a thin black horn carrying the brow line on past the outer corner, out beyond the ball
const SPIKE_A = [OUTER[0] - 0.035 * Math.cos(BROW), OUTER[1] - 0.035 * Math.sin(BROW)];
const SPIKE_B = [OUTER[0] + 0.24 * Math.cos(BROW), OUTER[1] + 0.24 * Math.sin(BROW)];
// the mirrored (-x) plate's frame, for face features: there local +x points inward (toward the nose)
const L_AT = [-PLATE_AT[0], PLATE_AT[1], PLATE_AT[2]];
const L_TURN = [PLATE_TURN[0], -PLATE_TURN[1], 0];
const onLeftPlate = (u, v) => place(L_AT, L_TURN, [-u, v, 0.028]);

// the grin, seen straight on: top line level at y 0.265 (latitude -28), hanging to latitude -55 in the middle
const GRIN_Y = 0.177;

const recipe = {
  name: "Gastly",
  dex: 92,
  height: 1,
  bones: {
    root: [0, 0, 0],
    body: { at: C, parent: "root" },
  },
  pieces: [
    { name: "ball", kind: "sphere", at: C, r: R, color: BALL, bone: "body" },
    // the eye plates: flat, hard-unioned so the white edge stays crisp and stands off the ball
    { name: "eyePlate", kind: "slab", outline: PLATE, depth: 0.05, round: 0.013, taper: 0.06, at: PLATE_AT, turn: PLATE_TURN, color: WHITE, bone: "body", mirror: true },
    { name: "spike", kind: "cone", a: place(PLATE_AT, PLATE_TURN, [...SPIKE_A, 0.01]), b: place(PLATE_AT, PLATE_TURN, [...SPIKE_B, 0.0]), ra: 0.03, rb: 0.014, color: DARK, bone: "body", mirror: true },
  ],
  paint: [
    // the straight black brow: a band from just inside the cut edge of each plate over its rounded rim (a decal line
    // there catches white bits of the rim); it spills a hair onto the ball above, which reads as the brow line
    {
      name: "brow", color: DARK, mirror: true,
      shape: { kind: "box", size: [2 * HALF + 0.08, 0.036, 0.2], at: place(PLATE_AT, PLATE_TURN, [MID[0] - 0.009 * Math.sin(BROW), MID[1] + 0.009 * Math.cos(BROW), 0]), turn: PLATE_TURN.length && rotTurn(PLATE_TURN, BROW) },
    },
  ],
  face: {
    spots: [],
    mouths: [
      // the wide grin: a dark half-ellipse band low on the face, projected straight from the front so the top lip is level
      { name: "grin", kind: "open", at: [0, GRIN_Y, Math.sqrt(R * R - (C[1] - GRIN_Y) ** 2)], snap: false, dir: [0, 0, 1], w: 0.66, h: 0.175, thick: 0.012, color: LIP, inner: MOUTH, tongue: null },
      // thin dark-red lines under the inner ends of the eyes
      { name: "lid", kind: "line", at: onBall(-14, -14), w: 0.08, h: 0.01, thick: 0.007, turn: 1.1, color: LID, mirror: true },
    ],
    eyes: [
      // small upright pupil toward the inner end of each plate, right under the brow (u, v in the +x plate's terms)
      { name: "pupil", at: onLeftPlate(-0.07, -0.012), dir: normal(-EYE_LON, EYE_LAT), w: 0.036, h: 0.085, sclera: DARK, mirror: true },
      // two small white fangs hanging from the top lip
      { name: "fang", at: [-0.25, 0.265, Math.sqrt(R * R - 0.235 ** 2 - 0.25 ** 2)], snap: false, dir: [0, 0, 1], w: 0.055, h: 0.1, cut: [0, 0], sclera: WHITE, mirror: true },
    ],
  },
  // ---- the gas, for the game to add as its own transparent piece (not meshed). Units = this model (ball 1 tall).
  // A camera-facing group centered on the ball center, pushed `back` away from the camera so it never covers the face.
  // Each puff: [x, y, r] in the billboard plane (x right, y up as seen by the camera). Unlit, no depth write, drawn first.
  aura: {
    color: "#806a92",
    core: "#6c5880",
    opacity: 0.8,
    center: C,
    back: 0.47,
    puffs: [
      [0, 0.08, 0.56], [-0.44, 0.44, 0.35], [-0.3, 0.7, 0.16], [0.46, 0.4, 0.37], [0.62, 0.0, 0.31],
      [0.44, -0.38, 0.27], [-0.58, -0.04, 0.29], [-0.34, -0.4, 0.27], [0.06, -0.48, 0.24],
    ],
    wisps: [[-0.14, 0.96, 0.06], [0.97, 0.26, 0.07], [0.86, -0.44, 0.06], [-0.84, 0.66, 0.05]],
    churn: { scale: 0.08, speed: [0.7, 1.3], spin: 0.15 },
  },
};

export default recipe;
