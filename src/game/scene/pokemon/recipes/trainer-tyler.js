// Tyler v2 (.cache/research/models/recipes/trainer-tyler-v2.mjs, notes in trainer-v2-notes.md).
// Tyler, the player's trainer, v2. A GO trainer built on the Let's Go head (see ../trainer-v2-notes.md for why).
// Outfit from today's Trainer3D.tsx: the Team Mystic blue zip hoodie open over a black tee, the hood down and bunched
// round the neck with an ice-white lining and its drawstrings, ribbed navy cuffs and hem, dark pants (left leg a shade
// darker so the stride reads), white sneakers with a sole, laces and a dark outsole line, and a small backpack like
// GO's avatars wear (BAG below turns it off).
// Hair and face checked by eye against Tyler's private photo (looked at only, never copied): black hair parted in the
// middle with real volume lifting at the part, a curtain fringe sweeping out to the temples, short sides with the ears
// showing, straight thick brows, narrow dark eyes, a round face, a closed smile.
// 1 tall (top of the hair to the soles), soles at y 0, facing +z, +x = his own left (the viewer's right).
// height: 1.75 = his height in game units (meters). The game scales the 1-tall model by it.
// Bones (pivots in ../trainer-v2-notes.md): root > hips > spine > chest > head; chest > armL > forearmL > handL;
// hips > legL > shinL > footL; and the R side the same.
// Built in meters, then scaled by 1 / 1.75 at the end. Self-contained: the game imports this file as is.
// Crisp color edges are paint (piece colors blur over a cell, about 3 cm here); small marks are decals.

const HEIGHT = 1.75;
const HEADS = 5.2; // skull top / head height (chin to skull top, no hair). Let's Go adults are 5, GO's avatar about 7.5
const BAG = true; // a small backpack like GO's avatars wear (navy straps over the jacket); false drops it

const C = {
  skin: "#f2cfb0", neck: "#e8bf9c",
  hair: "#2c2830", hairTop: "#46434f", short: "#3a3943", hairHi: "#7d819b", part: "#18151a",
  jacket: "#0b84d6", sleeve: "#0a7cca", rib: "#0a4f8c", lining: "#e6f6ff", zip: "#c4e8fb", cord: "#f2fbff", pocket: "#0a5f9f",
  tee: "#1e2227", pantsL: "#2b323d", pantsR: "#343c48",
  shoe: "#f7f7f5", sole: "#e1e5ea", gum: "#4a505a", lace: "#aab5c2",
  bag: "#e9eef3", bagDark: "#283040", strap: "#0b4a82",
  brow: "#1e1a1d", lash: "#1a1618", iris: "#2e2019", mouth: "#b5705a", nose: "#e0ab89", blush: "#efbda4",
};

// ---------- small helpers (inlined, recipes can't import) ----------
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const unit = (a) => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const mx = (p) => [-p[0], ...p.slice(1)];

/** Scale a recipe built in meters to the 1-tall convention (every length, never the relative eye/glint numbers). */
function scaleRecipe(r, s) {
  const v = (a) => a.map((x) => x * s);
  const prim = (p) => {
    const q = { ...p };
    for (const key of ["at", "a", "b"]) if (q[key]) q[key] = v(q[key]);
    for (const key of ["ra", "rb", "depth", "round", "taper", "R", "offset", "blend"]) if (typeof q[key] === "number") q[key] *= s;
    if (q.r !== undefined) q.r = Array.isArray(q.r) ? v(q.r) : q.r * s;
    if (q.size !== undefined) q.size = Array.isArray(q.size) ? v(q.size) : q.size * s;
    if (q.points) q.points = q.points.map((pt) => v(pt));
    if (q.outline) q.outline = q.outline.map((pt) => v(pt));
    if (q.profile) q.profile = q.profile.map((pt) => v(pt));
    if (q.kind === "chain" && typeof q.smooth === "number") q.smooth *= s;
    if (q.squash) q.squash = { ...q.squash, at: q.squash.at && v(q.squash.at) };
    return q;
  };
  const bones = {};
  for (const [n, b] of Object.entries(r.bones)) bones[n] = Array.isArray(b) ? v(b) : { ...b, at: v(b.at) };
  const feat = (f) => {
    const q = { ...f, at: v(f.at) };
    for (const key of ["w", "h"]) if (typeof q[key] === "number") q[key] *= s;
    if (q.r !== undefined) q.r = Array.isArray(q.r) ? v(q.r) : q.r * s;
    if (q.kind !== undefined && typeof q.thick === "number") q.thick *= s; // strokes are lengths; eye thick is relative
    return q;
  };
  return {
    ...r,
    bones,
    pieces: r.pieces.map(prim),
    paint: r.paint.map((p) => ({ ...p, soft: (p.soft ?? 0) * s, shape: prim(p.shape) })),
    face: { eyes: r.face.eyes.map(feat), mouths: r.face.mouths.map(feat), spots: r.face.spots.map(feat) },
  };
}

function tyler(o) {
  const crown = o.crown; // skull top (m); the hair adds its volume on top
  const H = crown / o.heads;
  const chin = crown - H;
  const sv = chin / 1.52; // vertical squash of the body against a real 1.75 m adult (chin at 1.52)
  const Y = (f) => f * chin; // body landmarks as fractions of the chin height (real and Let's Go adults agree on these)
  const k = (v) => v * H;

  // ---- head (Let's Go: round cranium tapering to a smaller chin, as one round cone so it needs no blend) ----
  const cran = { at: [0, chin + 0.57 * H, -0.02 * H], r: 0.43 * H };
  const jaw = { at: [0, chin + 0.3 * H, 0.055 * H], r: 0.33 * H };
  const faceZ = (x, y) => {
    let z = -1;
    for (const e of [cran, jaw]) {
      const a = x / e.r, b = (y - e.at[1]) / e.r, q = 1 - a * a - b * b;
      if (q > 0) z = Math.max(z, e.at[2] + e.r * Math.sqrt(q));
    }
    return z;
  };
  const onHead = (d, out = 0) => {
    const u = unit(d);
    return u.map((v, i) => cran.at[i] + v * (cran.r + out));
  };

  // ---- body landmarks (meters) ----
  const hem = Y(0.6); // jacket hem (bottom of the rib band)
  const S = [0.19, Y(0.905), -0.012]; // shoulder joint
  const E = [0.23, Y(0.69), -0.044]; // elbow, a little bent so the forearm hangs forward
  const Wr = [0.252, Y(0.535), 0.004]; // wrist
  const HP = [0.093, Y(0.585), 0.0]; // hip joint
  const K = [0.099, Y(0.31), 0.016]; // knee (the knees stay 7 cm apart, more than two shin blends, so they never web)
  const A = [0.095, 0.088, -0.012]; // ankle
  const slotW = 0.088; // the open front: how much tee shows
  const teeZ = 0.084; // the tee's front plane in the slot (the jacket stands about a cell proud of it)

  const pieces = [];
  const P = (p) => pieces.push(p);

  // 1. hair mass first: its face-window carve must come before everything it shouldn't cut
  P({ name: "hair", kind: "ellipsoid", at: [0, cran.at[1] + 0.15 * H, cran.at[2] - 0.05 * H], r: [0.51 * H, 0.51 * H, 0.55 * H], turn: [0.3, 0, 0], color: C.hair, bone: "head" });
  // the face window: two tilted carves whose union has a peak at the part, so the cap's own front edge is the curtain
  // fringe's inverted V (a thick edge, clean at grid 64, where thin locks came out jagged)
  P({ name: "hairFace", kind: "ellipsoid", at: [0.1 * H, chin + 0.3 * H, cran.at[2] + 0.5 * H], r: [0.37 * H, 0.57 * H, 0.5 * H], turn: [0, 0, 0.32], carve: true, mirror: true });
  // 2. head and ears, hard-unioned (a blend here would pull the uncarved hair's shape and color into the face)
  P({ name: "head", kind: "chain", points: [[...cran.at, cran.r], [...jaw.at, jaw.r]], color: C.skin, bone: "head" });
  // rounder and a touch lower, so the hair line doesn't leave a point on top (model-audit.md 3)
  P({ name: "ear", kind: "ellipsoid", at: [0.42 * H, chin + 0.4 * H, -0.03 * H], r: [0.06 * H, 0.085 * H, 0.08 * H], turn: [0, 0.1, 0], color: C.skin, bone: "head", mirror: true });

  // 3. the jacket body: lower half a lathe (an elliptic section, flat hem), chest and shoulders on top
  const lowR = [[0, hem], [0.158, hem], [0.168, hem + 0.012], [0.168, hem + 0.04], [0.164, Y(0.64)], [0.152, Y(0.69)], [0.146, Y(0.73)], [0.1, Y(0.75)], [0, Y(0.752)]];
  P({ name: "jacketLow", kind: "lathe", profile: lowR, at: [0, 0, 0.002], scale: [1, 1, 0.7], color: C.jacket, bone: "hips" });
  P({ name: "waist", kind: "ellipsoid", at: [0, Y(0.725), -0.002], r: [0.146, 0.1 * sv + 0.02, 0.102], color: C.jacket, bone: "spine", blend: 0.05 });
  P({ name: "chest", kind: "ellipsoid", at: [0, Y(0.84), 0.002], r: [0.163, 0.105 * sv + 0.012, 0.118], color: C.jacket, bone: "chest", blend: 0.06 });
  P({ name: "shoulders", kind: "ellipsoid", at: [0, S[1] + 0.004, -0.016], r: [0.198, 0.066, 0.1], color: C.jacket, bone: "chest", blend: 0.055 });
  // the ribbed hem band is paint on the lathe's flat-bottomed flare (a geometric band lip came out jagged at grid 64)
  const band = [[0, hem - 0.002], [0.158, hem - 0.002], [0.17, hem + 0.012], [0.17, hem + 0.034], [0.16, hem + 0.05], [0, hem + 0.05]];
  // 4. the open front: a slot carved down the jacket, then the tee behind it
  const slotTop = Y(0.95), slotBot = hem - 0.02;
  P({ name: "slot", kind: "box", at: [0, (slotTop + slotBot) / 2, teeZ + 0.15], size: [slotW, slotTop - slotBot, 0.3], round: 0.012, carve: true });
  // the neckline: clear the jacket out of the way in front of the neck, then a crew neck on the tee
  P({ name: "neckline", kind: "box", at: [0, Y(0.93) + 0.02, 0.2], size: [0.12, 0.1, 0.34], round: 0.03, carve: true });
  P({ name: "teeUp", kind: "ellipsoid", at: [0, Y(0.83), -0.004], r: [0.15, 0.12 * sv + 0.01, teeZ + 0.004], color: C.tee, bone: "chest" });
  P({ name: "crew", kind: "cone", a: [0, Y(0.9), -0.02], b: [0, Y(0.94), -0.024], ra: 0.08, rb: 0.074, color: C.tee, bone: "chest" });
  P({ name: "teeLow", kind: "ellipsoid", at: [0, Y(0.68), -0.002], r: [0.135, 0.11 * sv + 0.02, teeZ + 0.002], color: C.tee, bone: "spine", blend: 0.012 });
  // 5. the neck, after the jacket and hard-unioned so no blend tints it blue; the hood hides the join
  P({ name: "neck", kind: "cone", a: [0, Y(0.9), -0.026], b: [0, chin + k(0.16), -0.06 * H], ra: 0.062, rb: 0.057, color: C.neck, bone: "chest" });

  // 6. pants: pelvis under the hem band, thighs, shins, a little flare at the ankle so the hem sits on the shoe
  P({ name: "pelvis", kind: "ellipsoid", at: [0, Y(0.592), -0.004], r: [0.144, 0.07, 0.096], color: C.pantsL, bone: "hips" });
  for (const s of [1, -1]) {
    const side = s > 0 ? "L" : "R";
    const Q = (p) => [p[0] * s, p[1], p[2]];
    const col = s > 0 ? C.pantsL : C.pantsR;
    // the thigh starts a little under the hip joint so its top stays inside the jacket
    P({ name: `thigh${side}`, kind: "cone", a: Q([0.088, hem - 0.025, 0]), b: Q(K), ra: 0.09, rb: 0.062, color: col, bone: `leg${side}`, blend: 0.02 });
    P({ name: `shin${side}`, kind: "cone", a: Q(K), b: Q(A), ra: 0.062, rb: 0.05, color: col, bone: `shin${side}`, blend: 0.035 });
    P({ name: `pantsHem${side}`, kind: "cone", a: Q(lerp3(K, A, 0.62)), b: Q(add(A, [0, 0.016, 0.004])), ra: 0.053, rb: 0.061, color: col, bone: `shin${side}`, blend: 0.025 });
  }
  // 7. sneakers: a white upper on a wider sole (a real step), a round toe, a padded collar and a tongue
  for (const s of [1, -1]) {
    const side = s > 0 ? "L" : "R";
    const ax = A[0] * s;
    const b = `foot${side}`;
    P({ name: `sole${side}`, kind: "box", at: [ax, 0.022, 0.044], size: [0.12, 0.044, 0.294], round: 0.021, color: C.sole, bone: b });
    P({ name: `upper${side}`, kind: "box", at: [ax, 0.064, 0.03], size: [0.1, 0.07, 0.25], round: 0.04, color: C.shoe, bone: b, blend: 0.012 });
    P({ name: `toe${side}`, kind: "ellipsoid", at: [ax, 0.052, 0.128], r: [0.05, 0.034, 0.062], color: C.shoe, bone: b, blend: 0.02 });
    P({ name: `collar${side}`, kind: "cone", a: [ax, 0.066, -0.03], b: [ax, 0.104, -0.026], ra: 0.054, rb: 0.051, color: C.shoe, bone: b, blend: 0.018 });
    P({ name: `tongue${side}`, kind: "ellipsoid", at: [ax, 0.1, 0.045], r: [0.036, 0.022, 0.055], turn: [-0.45, 0, 0], color: C.shoe, bone: b, blend: 0.014 });
  }

  // 8. the hood, down: a roll round the neck from one side of the open front to the other, thick at the back,
  // and the folded hood lying on the upper back
  const hoodL = [
    [0.052, Y(0.868), 0.095, 0.03],
    [0.078, Y(0.905), 0.072, 0.036],
    [0.098, Y(0.94), 0.012, 0.04],
    [0.088, Y(0.952), -0.068, 0.046],
  ];
  const hoodBackPt = [0, Y(0.94), -0.098, 0.054];
  const hoodPts = [...hoodL, hoodBackPt, ...hoodL.slice().reverse().map(mx)];
  P({ name: "hoodRoll", kind: "chain", points: hoodPts, color: C.jacket, bone: "chest", blend: 0.016 });
  const hoodBack = { at: [0, Y(0.885), -0.124], r: [0.122, 0.08, 0.048], turn: [0.25, 0, 0] };
  P({ name: "hoodBack", kind: "ellipsoid", ...hoodBack, color: C.jacket, bone: "chest", blend: 0.03 });

  // 9. arms: sleeves to a ribbed cuff, then the hand (palm, curled fingers, a thumb in front)
  P({ name: "upperArm", kind: "cone", a: S, b: E, ra: 0.06, rb: 0.05, color: C.sleeve, bone: "armL", blend: 0.04, mirror: true });
  P({ name: "forearm", kind: "cone", a: E, b: Wr, ra: 0.05, rb: 0.045, color: C.sleeve, bone: "forearmL", blend: 0.02, mirror: true });
  const cuffA = lerp3(E, Wr, 0.78), cuffB = add(Wr, [0.001, 0.002, 0.0]);
  P({ name: "cuff", kind: "cone", a: cuffA, b: cuffB, ra: 0.054, rb: 0.052, color: C.sleeve, bone: "forearmL", blend: 0.006, mirror: true });
  P({ name: "wrist", kind: "cone", a: add(Wr, [0, 0.01, 0]), b: add(Wr, [-0.004, -0.03, 0.006]), ra: 0.032, rb: 0.031, color: C.skin, bone: "handL", blend: 0.01, mirror: true });
  P({ name: "palm", kind: "ellipsoid", at: add(Wr, [-0.006, -0.06, 0.004]), r: [0.029, 0.055, 0.047], turn: [0.06, 0, 0.06], color: C.skin, bone: "handL", blend: 0.012, mirror: true });
  P({ name: "fingers", kind: "ellipsoid", at: add(Wr, [-0.013, -0.118, -0.004]), r: [0.026, 0.045, 0.042], turn: [0.15, 0, 0.25], color: C.skin, bone: "handL", blend: 0.014, mirror: true });
  // the thumb hangs in front of the fingers with a gap a cell wide, so it reads as a thumb, not a bump
  P({ name: "thumb", kind: "cone", a: add(Wr, [-0.012, -0.048, 0.046]), b: add(Wr, [-0.02, -0.098, 0.07]), ra: 0.022, rb: 0.019, color: C.skin, bone: "handL", blend: 0.006, mirror: true });

  // 10. the hair's own volumes, after the body (small blends near the face, bigger on top)
  // the lift on top: two halves either side of the part, lighter on top so the hair reads as hair from above
  P({ name: "top", kind: "ellipsoid", at: onHead([0.3, 1, 0.55], 0.1 * H), r: [0.25 * H, 0.13 * H, 0.32 * H], turn: [0.4, 0.1, -0.35], color: C.hairTop, bone: "head", blend: 0.05 * H, mirror: true });
  // a soft sheen on the upper back and sides: light pieces just under the hair surface, blended wide so their color
  // shows through as a gradient (paint would be a hard-edged stripe); this is what keeps the head from reading as a
  // black ball from the map camera behind him
  P({ name: "sheen", kind: "ellipsoid", at: onHead([0, 0.72, -0.7], 0.055 * H), r: [0.27 * H, 0.15 * H, 0.04 * H], turn: [-0.8, 0, 0], color: C.hairHi, bone: "head", blend: 0.11 * H });
  P({ name: "sheenSide", kind: "ellipsoid", at: onHead([0.62, 0.72, -0.3], 0.055 * H), r: [0.035 * H, 0.13 * H, 0.22 * H], turn: [-0.5, 0.25, -0.75], color: C.hairHi, bone: "head", blend: 0.11 * H, mirror: true });
  // the curtains' volume at the temples, flaring out past the face like his
  P({ name: "flare", kind: "ellipsoid", at: onHead([0.85, 0.38, 0.55], 0.06 * H), r: [0.1 * H, 0.17 * H, 0.14 * H], turn: [-0.2, 0.35, -0.3], color: C.hair, bone: "head", blend: 0.06 * H, mirror: true });

  if (o.bag) {
    // a small backpack on the upper back, under the hood; straps are paint
    P({ name: "bag", kind: "box", at: [0, Y(0.765), -0.172], size: [0.25, 0.27, 0.12], round: 0.05, color: C.bag, bone: "chest" });
    P({ name: "bagPocket", kind: "box", at: [0, Y(0.722), -0.232], size: [0.19, 0.13, 0.05], round: 0.022, color: C.bagDark, bone: "chest", blend: 0.008 });
  }
  P({ name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true });

  // ---- paint: crisp color edges. The game groups layers by color (16 groups at most) and puts each group where its
  // color last appears, so the layers below are ordered with every color in one run: 15 groups, and the game draws
  // them in exactly this order ----
  const paint = [];
  const zBack = teeZ - 0.025;
  // tee: over the slot floor (narrower than the slot, so the walls stay jacket) and the crew neck
  paint.push({ name: "teeFloor", color: C.tee, shape: { kind: "box", at: [0, (slotTop + hem) / 2, (zBack + 0.5) / 2], size: [slotW - 0.012, slotTop - hem, 0.5 - zBack] }, bones: ["chest", "spine", "hips"] });
  paint.push({ name: "teeNeck", color: C.tee, shape: { kind: "cone", a: [0, Y(0.9), -0.02], b: [0, Y(0.94), -0.024], ra: 0.086, rb: 0.08 }, bones: ["chest"] });
  if (o.bag) {
    // straps: a vertical band where a slab cuts the torso, so it follows the surface from the chest over the
    // shoulder to the bag top (the hood paint below puts the hood back on top of them), and the bag's top band
    for (const s of [1, -1]) {
      const outline = [[-0.2, Y(0.75)], [0.128, Y(0.75)], [0.128, Y(1.0)], [-0.2, Y(1.0)]];
      paint.push({ name: `strap${s > 0 ? "L" : "R"}`, color: C.strap, shape: { kind: "slab", outline, depth: 0.03, at: [0.116 * s, 0, 0], turn: [0, Math.PI / 2 - 0.12 * s, 0] }, bones: ["chest", "spine"] });
    }
    paint.push({ name: "bagTrim", color: C.strap, shape: { kind: "box", at: [0, Y(0.765) + 0.128, -0.172], size: [0.3, 0.034, 0.2] }, bones: ["chest"] });
    // the bag and its pocket as paint too, so their edges stay crisp
    paint.push({ name: "bagBody", color: C.bag, shape: { kind: "box", at: [0, Y(0.765), -0.172], size: [0.256, 0.276, 0.126], round: 0.05 }, bones: ["chest"] });
    paint.push({ name: "bagPocketP", color: C.bagDark, shape: { kind: "box", at: [0, Y(0.722), -0.232], size: [0.196, 0.136, 0.056], round: 0.022 }, bones: ["chest"] });
  }
  // skin on the neck right down to where it meets the jacket, a crisp line under the hood
  paint.push({ name: "neckSkin", color: C.neck, shape: { kind: "cone", a: [0, Y(0.9), -0.026], b: [0, chin + k(0.3), -0.06 * H], ra: 0.066, rb: 0.061 }, bones: ["chest", "head"] });
  // the hood back in jacket blue over the straps, then its ice-white lining along the inside top of the roll
  paint.push({ name: "hood", color: C.jacket, shape: { kind: "chain", points: hoodPts.map((p, i) => [p[0], p[1], p[2], p[3] + (i === 0 || i === hoodPts.length - 1 ? 0.003 : 0.012)]) }, bones: ["chest"] });
  paint.push({ name: "hoodBack", color: C.jacket, shape: { kind: "ellipsoid", at: hoodBack.at, r: hoodBack.r.map((v) => v + 0.012), turn: hoodBack.turn }, bones: ["chest"] });
  const neckC = [0, Y(0.95), -0.03];
  // only round the back and sides (at the open front it broke into white flecks), and thick enough to read as one line
  const lining = hoodPts.slice(2, -2).map((p) => {
    const d = unit([neckC[0] - p[0], 0, neckC[2] - p[2]]);
    return [p[0] + d[0] * p[3] * 0.55, p[1] + p[3] * 0.62, p[2] + d[2] * p[3] * 0.55, p[3] * 0.62 + 0.004];
  });
  paint.push({ name: "lining", color: C.lining, shape: { kind: "chain", points: lining }, bones: ["chest"] });
  // clean hair edges on the sides and back: hair above the line of his short sides (in front of the ear, over it,
  // down to the nape), skin below it, both as slabs cut from the side profile; then the ears on top, the lower face
  // kept skin (the cap's edge crosses the skin at a shallow angle there and would speckle), and skin on everything
  // the hands carry so the wrist edge is crisp at the cuff
  {
    const L = [[0.14, 0.5], [0.06, 0.565], [-0.14, 0.565], [-0.3, 0.36], [-0.56, 0.14], [-1, 0.06]].map(([z, y]) => [z * H, chin + y * H]);
    const prof = (pts) => ({ kind: "slab", outline: pts.map(([z, y]) => [-z, y]), depth: 2 * H, at: [0, 0, 0], turn: [0, Math.PI / 2, 0] });
    const zf = L[0][0], lo = chin - 0.5 * H, hi = chin + 0.64 * H, back = -1.1 * H; // hi: leave the top to the pieces' soft sheen
    paint.push({ name: "sideHair", color: C.hair, shape: prof([[zf, hi], ...L, [back, L[L.length - 1][1]], [back, hi]]), bones: ["head"] });
    paint.push({ name: "faceSkin", color: C.skin, shape: { kind: "sphere", at: jaw.at, r: jaw.r + 0.012 * H }, bones: ["head"] });
    paint.push({ name: "sideSkin", color: C.skin, shape: prof([...L, [back, L[L.length - 1][1]], [back, lo], [zf, lo]]), bones: ["head"] });
    // his short sides are short hair, not skin: a band of a shade lighter than his hair under the hairline, from in
    // front of the ear round to the nape, so from the side and back his head reads as one dark shape (not shaved)
    paint.push({ name: "shortSides", color: C.short, shape: prof([...L, ...[...L].reverse().map(([z, y]) => [z, y - 0.13 * H])]), bones: ["head"] });
    paint.push({ name: "earSkin", color: C.skin, shape: { kind: "ellipsoid", at: [0.42 * H, chin + 0.4 * H, -0.03 * H], r: [0.08 * H, 0.125 * H, 0.1 * H], turn: [0, 0.1, 0] }, bones: ["head"], mirror: true });
    paint.push({ name: "handSkin", color: C.skin, shape: { kind: "box", at: [0, 0.5, 0], size: [2, 1, 1] }, bones: ["handL", "handR"] });
  }
  // navy ribbing: the hem band and the cuffs (a box along the forearm: a round cone's end caps would run the navy up
  // the sleeve)
  paint.push({ name: "hemRib", color: C.rib, shape: { kind: "lathe", profile: band.map(([r, y]) => [r > 0 ? 0.21 : 0, y]), smooth: false, at: [0, 0, 0.002], scale: [1, 1, 0.7] }, bones: ["hips", "spine"] });
  {
    const u = unit(sub(cuffB, cuffA)), len = Math.hypot(...sub(cuffB, cuffA));
    paint.push({ name: "cuffRib", color: C.rib, shape: { kind: "box", at: add(lerp3(cuffA, cuffB, 0.5), u.map((v) => v * 0.03)), size: [0.15, len + 0.066, 0.15], turn: [Math.atan2(-u[2], -u[1]), 0, -Math.asin(-u[0])] }, bones: ["forearmL"], mirror: true });
  }
  // sneakers white on everything the feet carry; then the pants on everything the legs carry below the hem, each leg
  // its own shade, with the hem's own round cone over the shoe so the pants/shoe edge follows the real junction; then
  // the sole's gray and the dark outsole line
  paint.push({ name: "shoeWhite", color: C.shoe, shape: { kind: "box", at: [0, 0.2, 0], size: [1, 0.4, 1] }, bones: ["footL", "footR"] });
  for (const s of [1, -1]) {
    const q = (p) => [p[0] * s, p[1], p[2]];
    const side = s > 0 ? "L" : "R", col = s > 0 ? C.pantsL : C.pantsR;
    paint.push({ name: `pants${side}`, color: col, shape: { kind: "box", at: [0.5 * s, hem / 2, 0], size: [1, hem, 1] }, bones: ["hips", `leg${side}`, `shin${side}`] });
    paint.push({ name: `hem${side}`, color: col, shape: { kind: "cone", a: q(lerp3(K, A, 0.62)), b: q(add(A, [0, 0.016, 0.004])), ra: 0.064, rb: 0.073 }, bones: [`shin${side}`, `foot${side}`] });
  }
  paint.push({ name: "sole", color: C.sole, shape: { kind: "box", at: [0, 0, 0], size: [1, 0.084, 1] }, bones: ["footL", "footR"] });
  paint.push({ name: "gum", color: C.gum, shape: { kind: "box", at: [0, 0, 0], size: [1, 0.022, 1] }, bones: ["footL", "footR"] });

  // ---- face, Let's Go style tuned to him: narrower eyes, straight thick brows, a closed smile ----
  const at = (x, y, dz = 0) => [x, y, faceZ(x, y) + dz];
  const eyeH = 0.14 * H, eyeW = 0.15 * H, ex = 0.19 * H, ey = chin + 0.44 * H;
  const eyes = [
    {
      name: "eye", at: at(-ex, ey), w: eyeW, h: eyeH, turn: 0,
      sclera: "#fbfbf8", iris: C.iris, irisAt: [0.06, -0.12], irisSize: [0.62, 0.82], pupil: "#141010", pupilSize: [0.3, 0.38],
      glints: [[0.26, 0.36, 0.24], [-0.28, -0.46, 0.1]], edge: { color: C.lash, w: 0.08 }, cut: [0.62, 0], lid: 0.28, mirror: true,
    },
    { name: "lash", at: at(-ex, ey + eyeH * 0.27), w: eyeW * 1.14, h: eyeH * 0.42, closed: 0.55, thick: 0.36, sclera: C.lash, turn: 0, mirror: true },
    // a round team patch high on his left sleeve, like the patch on GO's Mystic coat: an original roundel in the
    // Mystic colors (ice white, blue, a navy rim), not the team logo. An eye decal draws rings, so it's one decal
    {
      name: "patch", at: add(lerp3(S, E, 0.3), [0.058, 0, 0.004]), dir: [1, 0, 0.12], w: 0.052, h: 0.052,
      sclera: C.lining, iris: "#1aa0ec", irisAt: [0, 0], irisSize: [0.56, 0.56], pupil: C.lining, pupilSize: [0.2, 0.2],
      glints: [], edge: { color: C.rib, w: 0.16 }, lit: true,
    },
  ];
  const zipY = [hem + 0.05 + (Y(0.87) - hem - 0.05) * 0.25, hem + 0.05 + (Y(0.87) - hem - 0.05) * 0.75];
  const zipLen = (Y(0.87) - hem - 0.05) / 2 + 0.004;
  const mouths = [
    { name: "brow", kind: "line", at: at(-ex - 0.008 * H, chin + 0.62 * H), w: 0.165 * H, h: 0.01, thick: 0.044 * H, turn: -0.05, color: C.brow, mirror: true },
    { name: "mouth", kind: "smile", at: at(0, chin + 0.185 * H), w: 0.17 * H, h: 0.032 * H, thick: 0.019 * H, color: C.mouth },
    // the part, a short dark line back from the hairline
    { name: "part", kind: "line", at: onHead([0, 1, 0.66], 0.2 * H), w: 0.17 * H, h: 0.01, thick: 0.022 * H, turn: Math.PI / 2, color: C.part, lit: true, dir: [0, 0.82, 0.57] },
    // zipper tape down both front edges (two decals a side so each stays sharp)
    ...zipY.map((y, i) => ({ name: `zip${i}`, kind: "line", at: [slotW / 2 + 0.008, y, 0.16], w: zipLen, h: 0.01, thick: 0.012, turn: Math.PI / 2, color: C.zip, lit: true, dir: [0, 0, 1], mirror: true })),
    // drawstrings hanging from the hood ends
    { name: "cord", kind: "line", at: [0.068, Y(0.868) - 0.085, 0.16], w: 0.13, h: 0.01, thick: 0.011, turn: Math.PI / 2 + 0.05, color: C.cord, lit: true, dir: [0, 0, 1], mirror: true },
    // pocket slits low on each front panel
    { name: "pocket", kind: "line", at: [0.1, hem + 0.1, 0.16], w: 0.075, h: 0.01, thick: 0.008, turn: Math.PI / 2 - 0.35, color: C.pocket, lit: true, dir: [0.35, 0, 0.94], mirror: true },
    // laces: three bars across each tongue
    ...[0, 1, 2].map((i) => ({ name: `lace${i}`, kind: "line", at: [A[0], 0.098 - i * 0.01, 0.054 + i * 0.024], w: 0.032, h: 0.01, thick: 0.011, color: C.lace, lit: true, dir: [0, 0.8, 0.6], mirror: true })),
  ];
  const spots = [
    { name: "blush", at: at(-0.27 * H, chin + 0.29 * H), r: [0.075 * H, 0.04 * H], color: C.blush, soft: 0.85, mirror: true },
    { name: "nose", at: at(0, chin + 0.31 * H), r: [0.034 * H, 0.022 * H], color: C.nose, soft: 0.4 },
    // aglets at the cord ends
    { name: "aglet", at: [0.072, Y(0.868) - 0.152, 0.16], r: [0.009, 0.014], color: C.cord, lit: true, dir: [0, 0, 1], mirror: true },
  ];

  const bones = {
    root: [0, 0, 0],
    hips: { at: [0, Y(0.61), 0], parent: "root" },
    spine: { at: [0, Y(0.7), -0.01], parent: "hips" },
    chest: { at: [0, Y(0.82), -0.02], parent: "spine" },
    head: { at: [0, chin + k(0.02), -0.08 * H], parent: "chest" },
    armL: { at: S, parent: "chest" },
    armR: { at: mx(S), parent: "chest" },
    forearmL: { at: E, parent: "armL" },
    forearmR: { at: mx(E), parent: "armR" },
    handL: { at: Wr, parent: "forearmL" },
    handR: { at: mx(Wr), parent: "forearmR" },
    legL: { at: HP, parent: "hips" },
    legR: { at: mx(HP), parent: "hips" },
    shinL: { at: K, parent: "legL" },
    shinR: { at: mx(K), parent: "legR" },
    footL: { at: A, parent: "shinL" },
    footR: { at: mx(A), parent: "shinR" },
  };
  return scaleRecipe({ name: "Tyler", height: HEIGHT, bones, pieces, paint, face: { eyes, mouths, spots } }, 1 / HEIGHT);
}

const recipe = tyler({ crown: 1.676, heads: HEADS, bag: BAG });
export default recipe;
