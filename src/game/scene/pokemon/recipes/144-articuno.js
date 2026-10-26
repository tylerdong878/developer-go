// Articuno (#144). GO raid pose: hovering upright, the big wings raised in a wide V and spread like fans facing
// forward, the long ribbon tail rising behind the body and streaming out to its right (the viewer's left from the
// front, like the GO icon), the grey legs hanging with the toes curled.
// Checked against art-144, home-144, the GO renders (Serebii go-144, PokeMiners go/go-144) and the Showdown 3D
// front/back (ani-articuno, ani-back-articuno). Bulbapedia (Wayback 2025): sky blue plumage, a crest of three darker
// blue rhombus feathers on the forehead, red eyes, a short grey beak, long thin grey legs (3 toes forward, 1 back),
// white down on the chest, a streamer tail longer than its body in the crest's blue.
// A flier: 1 tall (wing tips to toe tips), the lowest point at y 0. Facing +z, +x = Articuno's own left.
// Grid notes: the span sets the cell (about 0.026 at grid 64), so the wings, ribbon and crest are kept 2+ cells thick
// and the feather notches stop where the gap is still a cell wide (else the mesher closes them in specks).
// Bones: wingL/wingR at the shoulders (flap = rotation about z), tail1 > tail2 > tail3 down the ribbon (they chain,
// so a wag adds up toward the tip), head carries the neck, beak and crest.

const BLUE = "#6cc4f0"; // body, head, back
const BELLY = "#e2f3f8"; // the white down on the chest
const WING = "#5cb2e2"; // wings (back side)
const WING_IN = "#86d0f2"; // wing undersides, facing forward in this pose
const DEEP = "#1590cc"; // crest and tail
const BEAK = "#a59c96";
const LEG = "#b3ada4";
const CLAW = "#6a6670";
const DARK = "#1c1620";
const IRIS = "#8a3426"; // red-brown (art and HOME read brown-red, the dex text says red)

// ---- small vector helpers (recipes are self-contained)
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => mul(a, 1 / Math.hypot(a[0], a[1], a[2]));
const deg = (d) => (d * Math.PI) / 180;
// the XYZ euler turn whose local x, y, z axes land on the model-space unit vectors a, b, c
const frameTurn = (a, b, c) => {
  const m = [a[0], b[0], c[0], a[1], b[1], c[1], a[2], b[2], c[2]];
  const y = Math.asin(Math.max(-1, Math.min(1, m[2])));
  return Math.abs(m[2]) < 0.9999999 ? [Math.atan2(-m[5], m[8]), y, Math.atan2(-m[1], m[0])] : [Math.atan2(m[7], m[4]), y, 0];
};
// Catmull-Rom through points (any length arrays), sub samples per span
const spline = (pts, sub) => {
  const out = [];
  const g = (i) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  for (let i = 0; i + 1 < pts.length; i++)
    for (let s = 0; s < sub; s++) {
      const t = s / sub, t2 = t * t, t3 = t2 * t, p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
      out.push(p1.map((_, k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  out.push(pts[pts.length - 1].slice());
  return out;
};

// ---- the left wing (+x): a frame at the shoulder. U runs out along the leading edge, T across to the trailing
// edge (in the wing's plane), F is the wing's front face (the underside, facing forward in this pose).
const SHOULDER = [0.115, 0.5, -0.035];
const ELEV = deg(47); // leading edge above horizontal
const SWEEP = deg(22); // the whole wing plane turned back about the vertical (tips behind the shoulders)
const U = [Math.cos(ELEV) * Math.cos(SWEEP), Math.sin(ELEV), -Math.cos(ELEV) * Math.sin(SWEEP)];
const T = (() => {
  const t0 = [Math.sin(ELEV) * Math.cos(SWEEP), -Math.cos(ELEV), -Math.sin(ELEV) * Math.sin(SWEEP)];
  return norm(sub(t0, mul(U, dot(t0, U))));
})();
const F = norm(cross(T, U));
const W = (u, v) => add(SHOULDER, add(mul(U, u), mul(T, v)));
const WING_TURN = frameTurn(U, T, cross(U, T)); // slab frame: outline (u, v) = (along U, along T)
// feathers, from the tip feather in to the short ones at the body: [root along U, angle from U toward T, length]
const WS = 0.875; // wing scale (sets the wing tips at y 1)
const FEATHERS = [
  [0.4, 2, 0.37],
  [0.345, 17, 0.37],
  [0.285, 32, 0.35],
  [0.225, 47, 0.32],
  [0.165, 61, 0.29],
  [0.105, 74, 0.25],
  [0.045, 86, 0.21],
].map(([s, a, l]) => [s * WS, a, l * WS]);
const HW = 0.029; // feather half width
const GAP = 0.026; // the narrowest gap kept between two feathers (about a grid cell)
// the wing outline in (u, v): along the leading edge, then round each feather tip with a notch between neighbors
const WING_OUT = (() => {
  const P = (s, a, l) => {
    const d = [Math.cos(deg(a)), Math.sin(deg(a))], p = [Math.sin(deg(a)), -Math.cos(deg(a))]; // p: toward the tip side
    const r = [s, 0.02];
    return { r, d, p, c: [r[0] + d[0] * l, r[1] + d[1] * l], l };
  };
  const F_ = FEATHERS.map(([s, a, l]) => P(s, a, l));
  const out = [[-0.03, -0.035], [0.12 * WS, -0.042], [0.28 * WS, -0.035]];
  F_.forEach((f, i) => {
    const { c, d, p } = f;
    out.push([c[0] + p[0] * HW - d[0] * HW * 0.4, c[1] + p[1] * HW - d[1] * HW * 0.4]);
    out.push([c[0] + p[0] * HW * 0.6 + d[0] * HW * 0.5, c[1] + p[1] * HW * 0.6 + d[1] * HW * 0.5]);
    out.push([c[0] - p[0] * HW * 0.6 + d[0] * HW * 0.5, c[1] - p[1] * HW * 0.6 + d[1] * HW * 0.5]);
    out.push([c[0] - p[0] * HW - d[0] * HW * 0.4, c[1] - p[1] * HW - d[1] * HW * 0.4]);
    const g = F_[i + 1];
    if (g) {
      // the notch bottom: the first point down this feather where the gap to the next one is a cell wide (so the
      // mesher keeps it open), then a small round U across to the next feather's edge
      let q = 0.25, A, B;
      for (; q < 0.95; q += 0.01) {
        A = [f.r[0] + f.d[0] * f.l * q, f.r[1] + f.d[1] * f.l * q];
        const t = Math.max(0, Math.min(g.l, (A[0] - g.r[0]) * g.d[0] + (A[1] - g.r[1]) * g.d[1]));
        B = [g.r[0] + g.d[0] * t, g.r[1] + g.d[1] * t];
        if (Math.hypot(A[0] - B[0], A[1] - B[1]) - 2 * HW >= GAP) break;
      }
      const a = [A[0] - p[0] * HW, A[1] - p[1] * HW], b = [B[0] + g.p[0] * HW, B[1] + g.p[1] * HW];
      const back = [(f.d[0] + g.d[0]) / 2, (f.d[1] + g.d[1]) / 2];
      out.push(a, [(a[0] + b[0]) / 2 - back[0] * 0.014, (a[1] + b[1]) / 2 - back[1] * 0.014], b);
    }
  });
  out.push([-0.03, 0.15]);
  return out;
})();

// ---- the tail: a wide flat ribbon. Spine points [x, y, z, half-width, bank]; bank turns the ribbon about its own
// length (0 = flat, face up; 90 = on edge, face toward the front/outside).
const TAIL_KEYS = [
  [0, 0.25, -0.1, 0.055, 0],
  [0, 0.2, -0.24, 0.062, 0],
  [-0.04, 0.23, -0.37, 0.066, 15],
  [-0.2, 0.18, -0.4, 0.075, 40],
  [-0.42, 0.08, -0.28, 0.08, 70],
  [-0.6, 0.05, -0.05, 0.078, 80],
  [-0.7, 0.1, 0.18, 0.07, 80],
  [-0.74, 0.22, 0.3, 0.06, 75],
  [-0.7, 0.32, 0.26, 0.045, 70],
];
const TAIL = spline(TAIL_KEYS, 3);
const RIBBON = 0.031; // half thickness
const tailFrame = (i) => {
  const p = TAIL[i], q = TAIL[Math.min(i + 1, TAIL.length - 1)], o = TAIL[Math.max(i - 1, 0)];
  const t = norm(sub(q.slice(0, 3), o.slice(0, 3)));
  const h = norm(cross([0, 1, 0], t));
  const u = cross(t, h);
  const b = deg(p[4]);
  const n = norm(add(mul(u, Math.cos(b)), mul(h, Math.sin(b))));
  return { t, n, w: norm(cross(n, t)) };
};
const tailBone = (i) => (i < 6 ? "tail1" : i < 15 ? "tail2" : "tail3");
const ribbon = () => {
  const out = [];
  for (let i = 0; i + 1 < TAIL.length; i++) {
    const a = TAIL[i], b = TAIL[i + 1];
    const n = norm(add(tailFrame(i).n, tailFrame(i + 1).n));
    const t = norm(sub(b.slice(0, 3), a.slice(0, 3)));
    const axis = norm(sub(n, mul(t, dot(n, t))));
    const mid = mul(add(a.slice(0, 3), b.slice(0, 3)), 0.5);
    out.push({ name: `ribbon${i}`, kind: "cone", a: a.slice(0, 3), b: b.slice(0, 3), ra: a[3], rb: b[3], squash: { axis, k: RIBBON / Math.max(a[3], b[3]), at: mid }, color: DEEP, bone: tailBone(i), blend: 0.015 });
  }
  // a forked tip: two short prongs splitting across the ribbon
  const L = TAIL.length - 1, last = TAIL[L].slice(0, 3), f = tailFrame(L);
  for (const s of [1, -1]) {
    const tip = add(add(last, mul(f.t, 0.12)), mul(f.w, s * 0.04));
    out.push({ name: "tailFork", kind: "cone", a: add(last, mul(f.w, s * 0.018)), b: tip, ra: 0.036, rb: 0.024, squash: { axis: f.n, k: 0.86, at: last }, color: DEEP, bone: "tail3", blend: 0.006 });
  }
  return out;
};

// ---- crest: three rhombus feathers from the forehead, the middle one up and back, the side ones out, up and back
const CREST_AT = [0, 0.7, 0.08];
const crest = (dir, len, wide, face, name, mirror) => {
  const d = norm(dir);
  const pts = [[...add(CREST_AT, mul(d, 0.02)), 0.022], [...add(CREST_AT, mul(d, len * 0.45)), wide], [...add(CREST_AT, mul(d, len)), 0.018]];
  const axis = norm(sub(face, mul(d, dot(face, d))));
  return { name, kind: "chain", points: pts, squash: { axis, k: 0.8, at: CREST_AT }, color: DEEP, bone: "head", blend: 0.012, mirror };
};

// ---- the white chest seen from the front (x, y): an oval with a downy, jagged top at the throat
const BELLY_HALF = [[0.1, 0.5], [0.118, 0.44], [0.118, 0.36], [0.1, 0.27], [0.068, 0.21], [0.03, 0.185]];
const BELLY_TOP = [[0.075, 0.475], [0.055, 0.52], [0.035, 0.49], [0.015, 0.535]];
const BELLY_OUT = [[0, 0.18], ...BELLY_HALF.slice().reverse(), ...BELLY_TOP, [0, 0.505], ...BELLY_TOP.slice().reverse().map(([x, y]) => [-x, y]), ...BELLY_HALF.map(([x, y]) => [-x, y])];

// ---- feet: three toes forward and one back, curled under (hovering); the floor carve trims the tips flat at y 0
const TOE = 0.012;
const foot = (s) => {
  const x = s * 0.07, ank = [x, 0.08, 0.05];
  const toes = [[x, 0.04, 0.11, x, TOE, 0.095], [x + s * 0.035, 0.04, 0.1, x + s * 0.042, TOE, 0.083], [x - s * 0.035, 0.04, 0.1, x - s * 0.042, TOE, 0.083], [x, 0.045, 0.005, x, TOE + 0.004, 0.02]];
  return toes.map(([kx, ky, kz, tx, ty, tz], i) => ({ name: `toe${i}`, kind: "chain", points: [[...ank, 0.022], [kx, ky, kz, 0.019], [tx, ty, tz, TOE]], color: LEG, bone: s > 0 ? "legL" : "legR", blend: 0.01 }));
};

const recipe = {
  name: "Articuno",
  dex: 144,
  height: 1,
  bones: {
    root: [0, 0, 0],
    body: { at: [0, 0.36, 0], parent: "root" },
    head: { at: [0, 0.57, 0.03], parent: "body" },
    wingL: { at: SHOULDER, parent: "body" },
    wingR: { at: [-SHOULDER[0], SHOULDER[1], SHOULDER[2]], parent: "body" },
    tail1: { at: TAIL_KEYS[0].slice(0, 3), parent: "body" },
    tail2: { at: TAIL[6].slice(0, 3), parent: "tail1" },
    tail3: { at: TAIL[15].slice(0, 3), parent: "tail2" },
    legL: { at: [0.065, 0.2, 0.02], parent: "body" },
    legR: { at: [-0.065, 0.2, 0.02], parent: "body" },
  },
  pieces: [
    // body: an upright egg, the chest pushed forward, a short neck into the round head
    { name: "body", kind: "ellipsoid", at: [0, 0.35, -0.015], r: [0.14, 0.19, 0.135], turn: [0.12, 0, 0], color: BLUE, bone: "body" },
    { name: "chest", kind: "ellipsoid", at: [0, 0.41, 0.04], r: [0.135, 0.16, 0.115], color: BLUE, bone: "body", blend: 0.06 },
    { name: "rump", kind: "ellipsoid", at: [0, 0.24, -0.07], r: [0.1, 0.09, 0.1], color: BLUE, bone: "body", blend: 0.05 },
    { name: "neck", kind: "ellipsoid", at: [0, 0.545, 0.02], r: [0.08, 0.09, 0.08], color: BLUE, bone: "head", blend: 0.06 },
    { name: "head", kind: "ellipsoid", at: [0, 0.635, 0.04], r: [0.104, 0.094, 0.108], color: BLUE, bone: "head", blend: 0.05 },
    // a short grey beak, the tip hooked down a little
    { name: "beak", kind: "cone", a: [0, 0.625, 0.12], b: [0, 0.595, 0.178], ra: 0.04, rb: 0.017, squash: { axis: [1, 0, 0], k: 0.85 }, color: BEAK, bone: "head", blend: 0.008 },
    { name: "beakLow", kind: "ellipsoid", at: [0, 0.6, 0.135], r: [0.024, 0.016, 0.032], turn: [0.3, 0, 0], color: BEAK, bone: "head", blend: 0.006 },
    // crest
    crest([0, 0.8, -0.6], 0.27, 0.056, [1, 0, 0.5], "crestMid", false),
    crest([0.6, 0.52, -0.6], 0.23, 0.05, [0, 0.5, 1], "crestSide", true),
    // wings: one feathered plate per side with a rounder leading edge along the arm
    { name: "wing", kind: "slab", outline: WING_OUT, smooth: 3, depth: 0.07, round: 0.028, at: SHOULDER, turn: WING_TURN, color: WING, bone: "wingL", blend: 0.03, mirror: true },
    { name: "arm", kind: "chain", points: [[...W(-0.02, 0.0), 0.05], [...W(0.25, -0.005), 0.04], [...W(0.5, 0.0), 0.034]], squash: { axis: F, k: 0.95, at: SHOULDER }, color: WING, bone: "wingL", blend: 0.03, mirror: true },
    // tail
    ...ribbon(),
    // legs: blue feathered tops, then thin grey shanks, toes curled
    { name: "thigh", kind: "ellipsoid", at: [0.065, 0.2, 0.01], r: [0.05, 0.05, 0.05], color: BLUE, bone: "legL", blend: 0.04, mirror: true },
    { name: "leg", kind: "cone", a: [0.066, 0.18, 0.02], b: [0.07, 0.08, 0.05], ra: 0.026, rb: 0.022, color: LEG, bone: "legL", blend: 0.01, mirror: true },
    ...foot(1),
    ...foot(-1),
    // the toe tips sit exactly on y 0
    { name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true },
  ],
  paint: [
    // white down on the chest, from the throat to the lower belly
    { name: "belly", color: BELLY, shape: { kind: "slab", outline: BELLY_OUT, depth: 0.3, at: [0, 0, 0.12] }, bones: ["body", "head"] },
    // the lighter wing undersides (the face toward the front)
    { name: "wingIn", color: WING_IN, shape: { kind: "half", at: SHOULDER, dir: F, offset: 0.004 }, bones: ["wingL"], mirror: true },
    // dark claws on the toe tips
    ...[[0.07, 0.095], [0.112, 0.083], [0.028, 0.083], [0.07, 0.02]].map(([x, z]) => ({ name: "claw", color: CLAW, shape: { kind: "sphere", r: 0.018, at: [x, TOE, z] }, bones: ["legL"], mirror: true })),
  ],
  face: {
    eyes: [
      // white with a red-brown iris toward the beak, a dark pupil, a glint; the top cut by a stern brow
      { at: [-0.062, 0.65, 0.115], w: 0.054, h: 0.045, sclera: "#ffffff", iris: IRIS, irisAt: [0.3, -0.1], irisSize: [0.5, 0.62], pupil: DARK, pupilSize: [0.22, 0.3], cut: [0.3, -0.55], edge: { color: DARK, w: 0.12 }, glints: [[0.42, 0.18, 0.2]], mirror: true },
    ],
  },
};

export default recipe;
