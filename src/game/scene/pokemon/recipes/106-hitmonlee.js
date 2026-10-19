// Hitmonlee (#106). GO's neutral guard stance: a bald bulb that is head and body in one, eyes only (no mouth, no nose),
// long coiled-spring legs, big clawed feet. Its right fist (the viewer's left) is up by its side, its left forearm
// crosses in front of the belly. Verified against art-106, home-106, the GO icon pm106, Serebii's go-106 and the
// Showdown 3D front/back. Numbers: notes/research/species-3.md (Hitmonlee), corrections in notes/research/model-facts-1.md.
// 1 tall (top of the bulb to the soles), feet at y 0, facing +z, +x = Hitmonlee's own left (the viewer's right).

const BODY = "#b8998b"; // mauve taupe
const RING = "#d8cd96";
const GAP = "#6f5f43"; // the dark core that shows between the rings
const HEEL = "#dfbd3c";
const CLAW = "#ecebe8";
const DARK = "#1c1620";

// ---- small vector helpers (three.js euler XYZ, same as the tool)
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const nrm = (v) => {
  const l = Math.hypot(...v);
  return v.map((c) => c / l);
};
/** Euler XYZ that turns local x, y, z onto X, Y, Z. */
const eulerOf = (X, Y, Z) => {
  const y = Math.asin(Math.max(-1, Math.min(1, Z[0])));
  return Math.abs(Z[0]) < 0.9999 ? [Math.atan2(-Z[1], Z[2]), y, Math.atan2(-Y[0], X[0])] : [Math.atan2(Y[2], Y[1]), y, 0];
};
/** Euler XYZ whose local z points along d (a torus' axis). */
const axisTurn = (d) => {
  const Z = nrm(d);
  let X = crs([0, 0, 1], Z);
  if (Math.hypot(...X) < 0.3) X = crs([0, 1, 0], Z);
  X = nrm(X);
  return eulerOf(X, crs(Z, X), Z);
};
/** Quadratic bezier a -> c pulled toward b; returns n points evenly spaced by arc length over [s0, s1] with tangents. */
function along(a, b, c, n, s0 = 0, s1 = 1) {
  const P = (t) => add(add(mul(a, (1 - t) ** 2), mul(b, 2 * (1 - t) * t)), mul(c, t * t));
  const T = (t) => add(mul(sub(b, a), 2 * (1 - t)), mul(sub(c, b), 2 * t));
  const N = 200, ts = [0], ls = [0];
  for (let i = 1; i <= N; i++) {
    ts.push(i / N);
    ls.push(ls[i - 1] + Math.hypot(...sub(P(i / N), P((i - 1) / N))));
  }
  const L = ls[N], out = [];
  for (let k = 0; k < n; k++) {
    const s = (s0 + ((s1 - s0) * (k + 0.5)) / n) * L;
    let i = 1;
    while (i < N && ls[i] < s) i++;
    const t = ts[i - 1] + ((s - ls[i - 1]) / (ls[i] - ls[i - 1])) * (ts[i] - ts[i - 1]);
    out.push({ p: P(t), d: T(t) });
  }
  return { out, P, L };
}
/** A coiled section: a dark core tube along the curve and n tan rings stacked on it. The rings are flat discs
 * (rr = radius, th = half thickness along the curve), rounder than tori, which keeps the grooves clean at grid 64. */
function coil(name, a, b, c, n, { rr, th, tube, core, bone, s0 = 0, s1 = 1, k = 0.012 }) {
  const { out, P } = along(a, b, c, n, s0, s1);
  const pts = [];
  for (let i = 0; i <= 8; i++) {
    const t = s0 + ((s1 - s0) * i) / 8;
    pts.push([...P(t), core]);
  }
  return [
    { name: `${name}Core`, kind: "chain", points: pts, color: GAP, bone },
    ...out.map((q, i) => ({ name: `${name}Ring${i}`, ...(th ? { kind: "ellipsoid", r: [rr, rr, th] } : { kind: "torus", R: rr - tube, r: tube }), at: q.p, turn: axisTurn(q.d), color: RING, bone, blend: k })),
  ];
}

// ---- the stance
const HIP = [0.065, 0.43, 0.0], KNEE = [0.125, 0.26, 0.045], ANKLE = [0.125, 0.105, -0.01];
const LEG = { rr: 0.06, tube: 0.02, core: 0.046, k: 0.008 };
// its right arm (viewer's left): upper arm down the side, forearm forward and up, fist raised in front of the shoulder
const SH_R = [-0.215, 0.745, -0.01], EL_R = [-0.275, 0.6, 0.0], WR_R = [-0.26, 0.62, 0.13];
// its left arm (viewer's right): upper arm down the side, forearm across the belly, open hand in front of the middle
const SH_L = [0.215, 0.745, -0.01], EL_L = [0.275, 0.56, 0.0], WR_L = [0.11, 0.515, 0.175];
const ARM = { rr: 0.04, th: 0.018, core: 0.028, k: 0.008 };

// a foot: a chunky brown hoof with three big white claws at the front and the yellow heel disc behind (for +x)
function foot(s) {
  const side = s > 0 ? "footL" : "footR";
  const x = s * 0.13;
  const yaw = s * 0.28; // toes out
  const fwd = [Math.sin(yaw), 0, Math.cos(yaw)];
  const out = [Math.cos(yaw), 0, -Math.sin(yaw)];
  const C = [x, 0.05, 0.06];
  const parts = [
    { name: `foot${s}`, kind: "ellipsoid", at: C, r: [0.078, 0.052, 0.128], turn: [0, yaw, 0], color: BODY, bone: side, blend: 0.02 },
    { name: `ankle${s}`, kind: "ellipsoid", at: [x * 0.95, 0.09, -0.005], r: [0.06, 0.048, 0.064], color: BODY, bone: side, blend: 0.008 },
  ];
  for (let k = -1; k <= 1; k++) {
    const base = add(add(C, mul(fwd, 0.1 - 0.012 * Math.abs(k))), add(mul(out, k * 0.048), [0, -0.01, 0]));
    const tip = add(add(base, add(mul(fwd, 0.065), mul(out, k * 0.012))), [0, -0.034, 0]);
    parts.push({ name: `claw${s}${k}`, kind: "cone", a: base, b: tip, ra: 0.027, rb: 0.006, color: CLAW, bone: side });
  }
  // heel disc on the back, a little to the outside
  const heel = add(add([x * 0.95, 0.08, -0.005], mul(fwd, -0.058)), mul(out, 0.018));
  parts.push({ name: `heel${s}`, kind: "ellipsoid", at: heel, r: [0.027, 0.027, 0.012], turn: axisTurn(sub(heel, [x * 0.95, 0.08, 0.02])), color: HEEL, bone: side });
  return parts;
}

const recipe = {
  name: "Hitmonlee",
  dex: 106,
  height: 1,
  bones: {
    root: [0, 0, 0],
    body: { at: [0, 0.42, 0], parent: "root" },
    armR: { at: SH_R, parent: "body" },
    armL: { at: SH_L, parent: "body" },
    forearmR: { at: EL_R, parent: "armR" },
    forearmL: { at: EL_L, parent: "armL" },
    legL: { at: HIP, parent: "root" },
    legR: { at: [-HIP[0], HIP[1], HIP[2]], parent: "root" },
    footL: { at: ANKLE, parent: "legL" },
    footR: { at: [-ANKLE[0], ANKLE[1], ANKLE[2]], parent: "legR" },
  },
  pieces: [
    // the bulb: head and body in one, widest high up, narrowing to the hips; a little shallower than wide
    {
      name: "body",
      kind: "lathe",
      profile: [[0, 1.0], [0.09, 0.986], [0.15, 0.952], [0.188, 0.885], [0.203, 0.8], [0.198, 0.715], [0.182, 0.635], [0.157, 0.555], [0.13, 0.48], [0.113, 0.425], [0.095, 0.392], [0, 0.378]],
      scale: [1, 1, 0.9],
      color: BODY,
      bone: "body",
    },
    // shoulder humps at the top corners of the bulb
    { name: "shoulder", kind: "ellipsoid", at: [0.205, 0.735, -0.01], r: [0.068, 0.085, 0.068], color: BODY, bone: "armL", blend: 0.05, mirror: true },
    // upper arms hang down the sides (body color), forearms are coiled like the legs
    { name: "upperArmR", kind: "cone", a: SH_R, b: EL_R, ra: 0.05, rb: 0.032, color: BODY, bone: "armR", blend: 0.03 },
    { name: "upperArmL", kind: "cone", a: SH_L, b: EL_L, ra: 0.05, rb: 0.032, color: BODY, bone: "armL", blend: 0.03 },
    { name: "elbowR", kind: "sphere", at: EL_R, r: 0.03, color: BODY, bone: "forearmR", blend: 0.015 },
    { name: "elbowL", kind: "sphere", at: EL_L, r: 0.03, color: BODY, bone: "forearmL", blend: 0.015 },
    ...coil("forearmR", EL_R, add(EL_R, [0.0, 0.0, 0.07]), WR_R, 4, { ...ARM, bone: "forearmR", s0: 0.12 }),
    ...coil("forearmL", EL_L, add(EL_L, [-0.01, -0.03, 0.12]), WR_L, 5, { ...ARM, bone: "forearmL", s0: 0.12 }),
    // its right hand: a fist raised in front, knuckles to the front
    { name: "fistR", kind: "box", at: add(WR_R, [0.0, 0.0, 0.045]), size: [0.098, 0.092, 0.088], round: 0.034, turn: [0.1, 0.15, 0], color: BODY, bone: "forearmR", blend: 0.015 },
    // knuckle ridge and a thumb wrapped over the front
    { name: "knucklesR", kind: "cone", a: add(WR_R, [-0.032, 0.03, 0.085]), b: add(WR_R, [0.03, 0.03, 0.09]), r: 0.017, color: BODY, bone: "forearmR", blend: 0.01 },
    { name: "thumbR", kind: "cone", a: add(WR_R, [0.04, -0.01, 0.06]), b: add(WR_R, [0.0, -0.02, 0.09]), ra: 0.016, rb: 0.013, color: BODY, bone: "forearmR", blend: 0.01 },
    // its left hand: open on the belly, three fingers curling down and in
    { name: "palmL", kind: "ellipsoid", at: add(WR_L, [-0.045, -0.01, 0.02]), r: [0.055, 0.045, 0.028], turn: [0, -0.5, 0], color: BODY, bone: "forearmL", blend: 0.015 },
    ...[-1, 0, 1].map((k) => {
      const a = add(WR_L, [-0.08, -0.012 + k * 0.026, 0.03]);
      return { name: `fingerL${k}`, kind: "cone", a, b: add(a, [-0.035, -0.045 + k * 0.012, 0.005]), ra: 0.016, rb: 0.011, color: BODY, bone: "forearmL", blend: 0.008 };
    }),
    // spring legs: hip, a slight knee bend forward, ankle; 9 rings each
    ...coil("legL", HIP, KNEE, ANKLE, 7, { ...LEG, bone: "legL", s0: 0.1 }),
    ...coil("legR", [-HIP[0], HIP[1], HIP[2]], [-KNEE[0], KNEE[1], KNEE[2]], [-ANKLE[0], ANKLE[1], ANKLE[2]], 7, { ...LEG, bone: "legR", s0: 0.1 }),
    ...foot(1),
    ...foot(-1),
    { name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true },
  ],
  face: {
    eyes: [
      // black almonds slanting down to the middle, a flat angry top edge, a white iris at the inner end with a slit pupil
      // (this is the viewer's-left eye; +u, the inner end, points toward the middle)
      {
        at: [-0.078, 0.735, 0.18],
        w: 0.132,
        h: 0.074,
        turn: -0.26,
        sclera: DARK,
        iris: "#f2efe9",
        irisAt: [0.4, -0.12],
        irisSize: [0.3, 0.58],
        pupil: DARK,
        pupilSize: [0.06, 0.42],
        cut: [0.42, -0.5],
        mirror: true,
      },
    ],
  },
};

export default recipe;
