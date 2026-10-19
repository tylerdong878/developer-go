// Snorlax (#143). Asleep, seated (the official art and HOME pose): it naps across the road home.
// The awake standing pose (GO's normal model) is the same builder with awake: true, see 143-snorlax-awake.mjs.
// 1 tall (ear tip to the ground), feet at y 0, facing +z, +x = Snorlax's own left (the viewer's right).
// Refs: species/home-143.png, art-143.png, models/refs/pm143.png, ani-snorlax.gif, aniback-snorlax.gif.
// Notes: notes/research/model-facts-1.md (Snorlax).

const TEAL = "#1f7896"; // between the art #2f7a97 and GO's #1187a0 lit / #076e8f mid
const CREAM = "#f1eadb";
const PAD = "#7d6b5b";
const CLAW = "#e8e6e1";
const DARK = "#1c1620";

// tiny frame helpers (same math as the tool's place(): three.js XYZ euler)
function rot([x = 0, y = 0, z = 0], [vx, vy, vz]) {
  const a = Math.cos(x), b = Math.sin(x), c = Math.cos(y), d = Math.sin(y), e = Math.cos(z), f = Math.sin(z);
  const m = [c * e, -c * f, d, a * f + b * e * d, a * e - b * f * d, -b * c, b * f - a * e * d, b * e + a * f * d, a * c];
  return [m[0] * vx + m[1] * vy + m[2] * vz, m[3] * vx + m[4] * vy + m[5] * vz, m[6] * vx + m[7] * vy + m[8] * vz];
}
const place = (at, turn, v) => {
  const r = rot(turn, v);
  return [at[0] + r[0], at[1] + r[1], at[2] + r[2]];
};
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/** Five little claws round the end of a paw (b = paw center, d = arm direction, r = paw radius), for the +x arm. */
function handClaws(b, d, r, len) {
  const out = [];
  for (let k = -2; k <= 2; k++) {
    const base = add(b, [d[0] * r * 0.55, d[1] * r * 0.55 - 0.035 + 0.012 * Math.abs(k), k * 0.032]);
    const tip = add(base, [d[0] * len * 0.55 + 0.012, d[1] * len * 0.55 - len * 0.55, k * 0.01]);
    out.push({ name: `handClaw${k + 2}`, kind: "cone", a: base, b: tip, ra: 0.019, rb: 0.006, color: CLAW, bone: "armL", mirror: true });
  }
  return out;
}

/** Three claws on a sole's upper-outer rim (angles in degrees CCW from the sole's local +x), for the +x foot. */
function footClaws(at, turn, rx, ry, angles) {
  return angles.map((deg, i) => {
    const a = (deg * Math.PI) / 180;
    const base = place(at, turn, [Math.cos(a) * rx * 0.86, Math.sin(a) * ry * 0.86, 0.02]);
    const tip = place(at, turn, [Math.cos(a) * (rx + 0.05), Math.sin(a) * (ry + 0.05), 0.02]);
    return { name: `footClaw${i}`, kind: "cone", a: base, b: tip, ra: 0.026, rb: 0.006, color: CLAW, bone: "legL", mirror: true };
  });
}

export function snorlax({ awake = false } = {}) {
  // ---- pose numbers: seated (HOME, h 351 px) vs standing (GO icon pm143, h 186 px)
  const P = awake
    ? {
        torso: { at: [0, 0.31, 0], r: [0.395, 0.31, 0.355] },
        chest: { at: [0, 0.54, -0.01], r: [0.3, 0.15, 0.27] },
        belly: { at: [0, 0.33, 0.06], r: [0.35, 0.28, 0.3] },
        head: { at: [0, 0.80, 0.03], size: [0.43, 0.29, 0.36], round: 0.13 },
        jowl: { at: [0, 0.715, 0.09], r: [0.2, 0.095, 0.145] },
        ear: { at: [0.155, 0.925, 0.025], turn: [0, 0, -0.3], s: 0.85 },
        arm: { a: [0.27, 0.55, 0.0], b: [0.45, 0.4, 0.04], ra: 0.1, rb: 0.07 },
        leg: null,
        foot: { at: [0.22, 0.04, 0.11], r: [0.12, 0.045, 0.15], turn: [0, 0.25, 0] },
        bellyPaint: { at: [0, 0.38, 0.17], r: [0.33, 0.31, 0.28] },
        mask: 0.84,
        maskY: 0.80,
      }
    : {
        torso: { at: [0, 0.34, -0.01], r: [0.42, 0.36, 0.37] },
        chest: { at: [0, 0.56, -0.01], r: [0.33, 0.17, 0.29] },
        belly: { at: [0, 0.3, 0.07], r: [0.37, 0.29, 0.32] },
        head: { at: [0, 0.79, 0.035], size: [0.5, 0.35, 0.42], round: 0.16 },
        jowl: { at: [0, 0.69, 0.13], r: [0.245, 0.11, 0.165] },
        ear: { at: [0.195, 0.915, 0.03], turn: [0, 0, -0.35], s: 1.15 },
        arm: { a: [0.28, 0.65, 0.0], b: [0.5, 0.47, 0.05], ra: 0.115, rb: 0.08 },
        leg: { a: [0.2, 0.17, 0.05], b: [0.38, 0.16, 0.2], ra: 0.14, rb: 0.115 },
        foot: { at: [0.42, 0.155, 0.27], r: [0.135, 0.145, 0.085], turn: [-0.25, 0.35, -0.35] },
        bellyPaint: { at: [0, 0.33, 0.17], r: [0.35, 0.31, 0.3] },
        mask: 1,
        maskY: 0.785,
      };

  const armDir = (() => {
    const { a, b } = P.arm;
    const v = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = Math.hypot(...v);
    return v.map((c) => c / l);
  })();

  // face mask outline in the front plane (x, y), relative to the head center, before the awake scale
  const k = P.mask, my = P.maskY;
  const MASK = [
    // a rounded chin that rests on the belly, sides meeting the head edge just above the eyes, peaks and the V (HOME)
    [0, -0.205], [-0.17, -0.185], [-0.245, -0.13], [-0.28, -0.065], [-0.19, -0.015], [-0.09, 0.03], [-0.045, -0.01], [0, -0.05],
    [0.045, -0.01], [0.09, 0.03], [0.19, -0.015], [0.28, -0.065], [0.245, -0.13], [0.17, -0.185],
  ].map(([x, y]) => [x * k, my + y * k]);

  const ear = P.ear;
  const EAR = [[-0.065, -0.05], [0.065, -0.05], [0.02, 0.085]].map(([x, y]) => [x * ear.s, y * ear.s]);

  const pieces = [
    // one pear: the bottom-heavy torso, a chest that slopes into the head, and a rounder belly in front
    { name: "torso", kind: "ellipsoid", ...P.torso, color: TEAL, bone: "body" },
    { name: "chest", kind: "ellipsoid", ...P.chest, color: TEAL, bone: "body", blend: 0.12 },
    { name: "belly", kind: "ellipsoid", ...P.belly, color: TEAL, bone: "body", blend: 0.08 },
    // a squarish head with a flat top and straight sides, sat right on the shoulders (no neck)
    { name: "head", kind: "box", ...P.head, color: TEAL, bone: "head", blend: 0.07 },
    // the lower face bulges a little and its chin rests right on the belly
    { name: "jowl", kind: "ellipsoid", ...P.jowl, color: TEAL, bone: "head", blend: 0.04 },
    // small triangle ears on the head's top corners
    { name: "ear", kind: "slab", outline: EAR, depth: 0.06 * ear.s, round: 0.025 * ear.s, at: ear.at, turn: ear.turn, color: TEAL, bone: "earL", blend: 0.03, mirror: true },
    // thick flipper arms slanting down and out, five small claws at each paw
    { name: "arm", kind: "cone", ...P.arm, color: TEAL, bone: "armL", blend: 0.05, mirror: true },
    ...handClaws(P.arm.b, armDir, P.arm.rb, awake ? 0.04 : 0.05),
  ];
  if (P.leg) {
    // seated: short thick legs forward, big cream soles facing out, brown pads, three claws round the top of each sole
    pieces.push(
      { name: "leg", kind: "cone", ...P.leg, color: TEAL, bone: "legL", blend: 0.05, mirror: true },
      { name: "foot", kind: "ellipsoid", ...P.foot, color: CREAM, bone: "legL", blend: 0.025, mirror: true },
      ...footClaws(P.foot.at, P.foot.turn, P.foot.r[0], P.foot.r[1], [88, 55, 28]),
    );
  } else {
    // standing: flat cream feet poking out under the body, claws along the toe edge
    pieces.push({ name: "foot", kind: "ellipsoid", ...P.foot, color: CREAM, bone: "legL", blend: 0.03, mirror: true });
    for (let i = 0; i < 3; i++) {
      const base = place(P.foot.at, P.foot.turn, [(i - 1) * 0.06, 0.0, P.foot.r[2] * 0.85]);
      const tip = place(P.foot.at, P.foot.turn, [(i - 1) * 0.07, 0.005, P.foot.r[2] + 0.035]);
      pieces.push({ name: `toeClaw${i}`, kind: "cone", a: base, b: tip, ra: 0.02, rb: 0.006, color: CLAW, bone: "legL", mirror: true });
    }
  }
  pieces.push({ name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true });

  const paint = [
    // the cream belly, almost the full front, a teal rim showing at the sides
    { name: "belly", color: CREAM, shape: { kind: "ellipsoid", ...P.bellyPaint }, bones: ["root", "body"] },
    // the cream mask over the lower head, two rounded peaks and the teal V notch between them
    { name: "mask", color: CREAM, shape: { kind: "slab", outline: MASK, smooth: true, depth: 0.42, at: [0, 0, P.head.at[2] + 0.16] }, },
  ];
  if (P.leg)
    paint.push({
      name: "pad",
      color: PAD,
      shape: { kind: "ellipsoid", at: place(P.foot.at, P.foot.turn, [0, -0.035, 0.07]), r: [0.068, 0.062, 0.05], turn: P.foot.turn },
      bones: ["legL"],
      mirror: true,
    });

  const f = P.mask; // the face scales with the head
  const fy = (y) => my + (y - 0.785) * f;
  const fz = P.head.at[2] + P.head.size[2] / 2;
  return {
    name: awake ? "Snorlax (awake)" : "Snorlax (asleep)",
    dex: 143,
    height: 1,
    bones: {
      root: [0, 0, 0],
      body: { at: [0, 0.3, 0], parent: "root" },
      head: { at: [0, P.head.at[1] - P.head.size[1] / 2 + 0.02, 0.02], parent: "body" },
      earL: { at: ear.at, parent: "head" },
      earR: { at: [-ear.at[0], ear.at[1], ear.at[2]], parent: "head" },
      armL: { at: P.arm.a, parent: "body" },
      armR: { at: [-P.arm.a[0], P.arm.a[1], P.arm.a[2]], parent: "body" },
      legL: { at: P.leg ? P.leg.a : [P.foot.at[0], 0.06, 0.02], parent: "root" },
      legR: { at: P.leg ? [-P.leg.a[0], P.leg.a[1], P.leg.a[2]] : [-P.foot.at[0], 0.06, 0.02], parent: "root" },
    },
    pieces,
    paint,
    face: {
      eyes: [
        // closed, sleepy cups on the cream, outer ends a touch higher (GO keeps these even awake)
        { at: [-0.1 * f, fy(0.705), fz], w: 0.1 * f, h: 0.03 * f, closed: -0.75, thick: 0.24, sclera: DARK, turn: -0.08, mirror: true },
        // fangs at the mouth corners, pointing UP: a dome (half an ellipse) with a gray rim
        { name: "fang", at: [-0.066 * f, fy(0.648), fz], w: 0.032 * f, h: 0.058 * f, turn: Math.PI, cut: [0, 0], sclera: "#f6f4ef", edge: { color: "#5d5b62", w: 0.24 }, mirror: true },
      ],
      mouth: { kind: "line", at: [0, fy(0.648), fz], w: 0.15 * f, h: 0.01, thick: 0.0065, color: DARK },
    },
  };
}

export default snorlax({ awake: false });
