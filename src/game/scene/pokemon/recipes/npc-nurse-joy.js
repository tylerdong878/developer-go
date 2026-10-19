// Nurse Joy, at the Pokémon Center door. Let's Go look (matches the anime): pink hair in two big loops at the sides,
// a fringe framing the face, a white nurse cap with a red cross, a pink dress with short puffed sleeves, a white apron
// over the front, bare legs, white flats. Colors are today's Npcs.tsx `joy` look.
// Refs: models/refs/people/sheet-joy.png, joy-game-xy.png, joy-lgpe-screen.png, world/npcs/img/Nurse_Joy_Lets_Go.png.
// 1 tall (top of the cap to the soles), soles at y 0, facing +z, +x = her own left (the viewer's right).
// height: 1.65 = her height in game units (meters), cap included. The game scales the 1-tall model by it.

// <person-kit>
// ---- person kit: one Let's Go body for every person (notes/research/model-people-items.md sections 1-2) --------------
// Built in meters (game units: the trainer is 1.75 tall), then scaled so the tallest point is 1, and `height` set to the
// real height so the game can scale back. Bones: root, hips, spine, head, armL/armR, legL/legR, footL/footR.
// This block is spliced into each people recipe by .cache/research/models/kit/splice.mjs (recipes can't import):
// edit the kit, not the copies, then run the splice.

const KIT_DARK = "#1c1620";

/** Body types, in head units H (chin to crown, no hair). y from the soles, x from the middle. */
const BODIES = {
  // Tyler, Ace Trainer, Fisherman, Joy, clerk: 5 heads, crotch at 0.46 of the height, hands to mid-thigh
  adult: {
    heads: 5, chin: 4.0, neckR: 0.165,
    shoulderY: 3.62, shoulderX: 0.56, barR: [0.53, 0.175, 0.28],
    chestY: 3.32, chestR: [0.485, 0.38, 0.31],
    waistY: 2.82, waistR: [0.41, 0.35, 0.28],
    pelvisY: 2.44, pelvisR: [0.455, 0.29, 0.29],
    hipY: 2.35, hipX: 0.26, kneeY: 1.235, ankleY: 0.25, thighR: 0.27, kneeR: 0.19, ankleR: 0.14,
    elbow: [0.68, 2.8, -0.03], wrist: [0.76, 2.15, 0.05], upperArmR: 0.16, elbowR: 0.135, wristR: 0.11,
    hand: [0.115, 0.17, 0.135], shoe: [0.37, 0.34, 0.84],
  },
  // Youngster, Bug Catcher: 3.5 heads, big head, short legs, hands reach the crotch
  kid: {
    heads: 3.5, chin: 2.5, neckR: 0.12,
    shoulderY: 2.24, shoulderX: 0.45, barR: [0.43, 0.15, 0.24],
    chestY: 2.05, chestR: [0.4, 0.31, 0.27],
    waistY: 1.72, waistR: [0.36, 0.29, 0.26],
    pelvisY: 1.45, pelvisR: [0.38, 0.24, 0.26],
    hipY: 1.38, hipX: 0.2, kneeY: 0.74, ankleY: 0.17, thighR: 0.19, kneeR: 0.14, ankleR: 0.11,
    elbow: [0.53, 1.74, -0.03], wrist: [0.6, 1.33, 0.05], upperArmR: 0.12, elbowR: 0.1, wristR: 0.085,
    hand: [0.1, 0.15, 0.12], shoe: [0.32, 0.3, 0.7],
  },
  // Black Belt (Hiker would fit too): 5 heads, deep chest, 2 head widths across the shoulders, hands to the upper thigh
  big: {
    heads: 5, chin: 4.0, neckR: 0.2,
    shoulderY: 3.48, shoulderX: 0.72, barR: [0.7, 0.21, 0.34],
    chestY: 3.25, chestR: [0.62, 0.44, 0.4],
    waistY: 2.75, waistR: [0.52, 0.38, 0.36],
    pelvisY: 2.36, pelvisR: [0.52, 0.31, 0.34],
    hipY: 2.22, hipX: 0.3, kneeY: 1.17, ankleY: 0.25, thighR: 0.3, kneeR: 0.21, ankleR: 0.15,
    elbow: [0.88, 2.72, -0.03], wrist: [0.96, 2.1, 0.05], upperArmR: 0.2, elbowR: 0.165, wristR: 0.13,
    hand: [0.14, 0.19, 0.16], shoe: [0.4, 0.32, 0.86],
  },
};

/**
 * Landmarks for one person in meters: o.body ("adult" | "kid" | "big"), o.crown (skull top, m), o.legs (stretch the
 * legs, 1 = the body type's), o.width (scale the body's widths). Everything else builds on these.
 */
function frame(o) {
  const B = BODIES[o.body ?? "adult"];
  const legK = o.legs ?? 1, wK = o.width ?? 1;
  // longer legs keep the crown where it is: more of the height goes to the legs, the head gets a little smaller
  const H = o.crown / (B.heads + B.hipY * (legK - 1));
  const lift = B.hipY * H * (legK - 1);
  const top = (v) => v * H + lift; // a landmark above the hips (given in H from the soles of the body type)
  const legY = (v) => v * H * legK; // a landmark on the legs
  const L = { B, H };
  Object.assign(L, {
    chin: top(B.chin),
    crown: o.crown,
    shoulder: [B.shoulderX * H * wK, top(B.shoulderY), 0],
    bar: { at: [0, top(B.shoulderY) + 0.03 * H, -0.02 * H], r: B.barR.map((v, i) => v * H * (i === 1 ? 1 : wK)) },
    chest: { at: [0, top(B.chestY), 0], r: B.chestR.map((v, i) => v * H * (i === 1 ? 1 : wK)) },
    waist: { at: [0, top(B.waistY), 0], r: B.waistR.map((v, i) => v * H * (i === 1 ? 1 : wK)) },
    pelvis: { at: [0, top(B.pelvisY), 0], r: B.pelvisR.map((v, i) => v * H * (i === 1 ? 1 : wK)) },
    hip: [B.hipX * H * wK, top(B.hipY), 0],
    knee: [B.hipX * H * wK * 0.96, legY(B.kneeY), 0.01 * H],
    ankle: [B.hipX * H * wK * 0.96, legY(B.ankleY), -0.01 * H],
    elbow: [B.elbow[0] * H * wK, top(B.elbow[1]), B.elbow[2] * H],
    wrist: [B.wrist[0] * H * wK, top(B.wrist[1]), B.wrist[2] * H],
    neckR: B.neckR * H * wK,
    thighR: B.thighR * H * wK, kneeR: B.kneeR * H * wK, ankleR: B.ankleR * H * wK,
    upperArmR: B.upperArmR * H * wK, elbowR: B.elbowR * H * wK, wristR: B.wristR * H * wK,
    handR: B.hand.map((v) => v * H), shoe: B.shoe.map((v) => v * H),
  });
  // the head: a round cranium tapering to a smaller chin (Let's Go faces), as one round cone so it needs no blend.
  // cranium and jaw here are the two end spheres, used to place the face and hair.
  L.head = {
    cranium: { at: [0, L.chin + 0.57 * H, -0.02 * H], r: [0.43 * H, 0.43 * H, 0.43 * H] },
    jaw: { at: [0, L.chin + 0.31 * H, 0.06 * H], r: [0.31 * H, 0.31 * H, 0.31 * H] },
    ear: { at: [0.425 * H, L.chin + 0.42 * H, -0.02 * H], r: [0.065 * H, 0.12 * H, 0.09 * H] },
  };
  L.hand = [L.wrist[0] + 0.01 * H, L.wrist[1] - 0.15 * H, L.wrist[2] + 0.01 * H];
  return L;
}

/** z of the face surface at (x, y), from the cranium and jaw ellipsoids (face features snap the rest of the way). */
function faceZ(L, x, y) {
  let z = -1;
  for (const e of [L.head.cranium, L.head.jaw]) {
    const a = x / e.r[0], b = (y - e.at[1]) / e.r[1], q = 1 - a * a - b * b;
    if (q > 0) z = Math.max(z, e.at[2] + e.r[2] * Math.sqrt(q));
  }
  return z;
}
/** A point on the head's surface along a direction from the cranium center (for hair and hats). */
function onHead(L, d, out = 0) {
  const c = L.head.cranium, l = Math.hypot(...d);
  const u = d.map((v) => v / l);
  const k = 1 / Math.hypot(u[0] / c.r[0], u[1] / c.r[1], u[2] / c.r[2]);
  return [c.at[0] + u[0] * (k + out), c.at[1] + u[1] * (k + out), c.at[2] + u[2] * (k + out)];
}

/**
 * The hair mass: the skull pushed out and tilted (its own bottom makes the nape line, low at the back, high over the
 * ears), with the face window carved out of the front. These must be the FIRST pieces of the recipe (a carve cuts
 * everything before it), so person() puts them first.
 * Why only one carve: the tool skips a carve wherever the point is outside the solid so far, so just outside the
 * uncarved ellipsoid the field still sees it. In front the uncarved surface stays 0.1 H off the face, which is fine;
 * a nape carve would leave it crossing the neck, and the neck would show specks of hair color along that line.
 * h: { color, grow [x, y, z] (H), lift (H), back (H), tilt (rad, + drops the back), hairline (front hairline above the
 * chin, H), window (half width, H), windowZ (H), front (H) }.
 */
function hairCap(L, h) {
  const H = L.H, c = L.head.cranium;
  // at least 0.1 H proud of the skull where it shows, so the window's edge is a real step at grid 64
  const g = h.grow ?? [0.11, 0.08, 0.12];
  const hl = h.hairline ?? 0.78;
  const wz = h.windowZ ?? 0.5;
  return [
    // front: push only the front of the ellipsoid out (the back stays put), to keep its uncarved front surface off the
    // face; if it passes within a cell of the face, that spot takes the hair color (check with a field trace)
    { name: "hair", kind: "ellipsoid", at: [0, c.at[1] + (h.lift ?? 0.1) * H, c.at[2] - (h.back ?? 0.05) * H + (h.front ?? 0) * H], r: [c.r[0] + g[0] * H, c.r[1] + g[1] * H, c.r[2] + g[2] * H + (h.front ?? 0) * H], turn: [h.tilt ?? 0.4, 0, 0], color: h.color, bone: "head" },
    // the face window: its top edge is the hairline (an arch, highest in the middle: curtain bangs part like this).
    // window: 0 skips it (hats: set the hair back instead so the forehead stays skin, and nothing is carved at all)
    h.window === 0 ? null : { name: "hairFace", kind: "ellipsoid", at: [0, L.chin + 0.25 * H, c.at[2] + wz * H], r: [(h.window ?? 0.43) * H, (hl - 0.25) * H, wz * H], carve: true },
  ].filter(Boolean);
}

const KIT_SKIN_SHADE = (hex, k) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (s) => Math.round(((n >> s) & 255) * (1 - k)).toString(16).padStart(2, "0");
  return `#${f(16)}${f(8)}${f(0)}`;
};

/**
 * One person. o: {
 *   name, height (real height in m = the tallest point, hat or hair included), crown (skull top, m), body, legs, width,
 *   c: { skin, ear, neck, hand, top, sleeve, cuff, bottom, legL, legR, shoe, sole, hair },
 *   sleeves: "long" | "short" | "none", legwear: "pants" | "shorts" | "bare", hem (y of the top's hem, H above the
 *   crotch; null = no hem paint), shoes: "sneaker" | "boot" | "bare" | "flat",
 *   hair: hairCap options (or null for none), extra: (L) => ({ pre, pieces, paint, spots, mouths, eyes, bones }),
 *   face: { iris, eyeH, eyeW, cut, lash, brow: { w, thick, turn, y, color }, mouth: {...}, nose, blush, lashWing }
 * }
 */
function person(o) {
  const L = frame(o);
  const H = L.H, c = o.c;
  const skin = c.skin, ear = c.ear ?? KIT_SKIN_SHADE(skin, 0.03), neck = c.neck ?? KIT_SKIN_SHADE(skin, 0.06), hand = c.hand ?? skin;
  const X = o.extra ? o.extra(L) : {};
  const k = (v) => v * H; // blends in head units
  const pieces = [];
  // hair mass first (its carves must not cut anything else)
  if (o.hair) pieces.push(...hairCap(L, { color: c.hair, ...o.hair }));
  if (X.pre) pieces.push(...X.pre);
  // head
  pieces.push(
    // one piece, hard-unioned: a carve is skipped where the point is outside the solid so far, so just outside the
    // uncarved hair the field still sees it, and any smooth blend here would pull hair color and shape into the face
    { name: "head", kind: "chain", points: [[...L.head.cranium.at, L.head.cranium.r[0]], [...L.head.jaw.at, L.head.jaw.r[0]]], squash: o.headSquash, color: skin, bone: "head" },
    // ears and neck hard-unioned too, for the same reason (the uncarved hair reaches down past them)
    { name: "ear", kind: "ellipsoid", ...L.head.ear, color: ear, bone: "head", mirror: true },
    { name: "neck", kind: "cone", a: [0, L.shoulder[1] - k(0.1), -k(0.04)], b: [0, L.chin + k(0.18), -k(0.06)], ra: L.neckR * 1.1, rb: L.neckR, color: neck, bone: "spine" },
  );
  // torso: chest, a shoulder bar, waist and pelvis, one top color; the pelvis takes the top color too and the hem paint
  // below gives the bottom its crisp line
  const top = c.top, mid = c.mid ?? top;
  pieces.push(
    { name: "chest", kind: "ellipsoid", ...L.chest, color: top, bone: "spine", blend: k(0.05) },
    { name: "shoulders", kind: "ellipsoid", ...L.bar, color: top, bone: "spine", blend: k(0.12) },
    { name: "waist", kind: "ellipsoid", ...L.waist, color: mid, bone: "spine", blend: k(0.16) },
    { name: "pelvis", kind: "ellipsoid", ...L.pelvis, color: o.hem === null ? c.bottom : mid, bone: "hips", blend: k(0.14) },
  );
  // arms: hanging a little out from the body (so the blends never web them to the sides), elbows soft
  const sleeves = o.sleeves ?? "long";
  const sl = c.sleeve ?? top;
  const armCol = sleeves === "long" ? sl : skin;
  const elbow = L.elbow, wrist = L.wrist, sh = L.shoulder;
  pieces.push(
    { name: "upperArm", kind: "cone", a: sh, b: elbow, ra: L.upperArmR, rb: L.elbowR, color: armCol, bone: "armL", blend: k(0.05), mirror: true },
    { name: "forearm", kind: "cone", a: elbow, b: wrist, ra: L.elbowR, rb: L.wristR, color: armCol, bone: "armL", blend: k(0.03), mirror: true },
  );
  let sleeveEnd = null;
  if (sleeves === "short") {
    // a sleeve shell over the top of the arm, a hair thicker; its end is a round cap, so paint gives the hem its edge
    const t = o.sleeveLen ?? 0.5;
    const m = elbow.map((v, i) => sh[i] + (v - sh[i]) * t);
    const rb = L.elbowR + k(0.055), rl = L.upperArmR + (L.elbowR - L.upperArmR) * t;
    pieces.push({ name: "sleeve", kind: "cone", a: [sh[0] - k(0.02), sh[1] + k(0.02), sh[2]], b: m, ra: L.upperArmR + k(0.05), rb, color: sl, bone: "armL", blend: k(0.015), mirror: true });
    sleeveEnd = { m, cap: Math.sqrt(Math.max(0, rb * rb - rl * rl)) };
  }
  if (sleeves === "long" && c.cuff) {
    const m = elbow.map((v, i) => v + (wrist[i] - v) * 0.78);
    pieces.push({ name: "cuff", kind: "cone", a: m, b: wrist.map((v, i) => v + (wrist[i] - elbow[i]) * 0.04), ra: L.wristR + k(0.04), rb: L.wristR + k(0.035), color: c.cuff, bone: "armL", blend: k(0.015), mirror: true });
  }
  // mitten hands, palms in, with a thumb forward
  pieces.push(
    { name: "hand", kind: "ellipsoid", at: L.hand, r: L.handR, turn: [0.08, 0, 0.12], color: hand, bone: "armL", blend: k(0.04), mirror: true },
    { name: "thumb", kind: "cone", a: [L.hand[0] - k(0.03), L.hand[1] + k(0.05), L.hand[2] + k(0.06)], b: [L.hand[0] - k(0.055), L.hand[1] - k(0.02), L.hand[2] + k(0.12)], ra: k(0.045), rb: k(0.035), color: hand, bone: "armL", blend: k(0.025), mirror: true },
  );
  // legs: per side, so the two can differ in shade (Tyler's do, so the stride reads)
  const legwear = o.legwear ?? "pants";
  let shortsEnd = null;
  for (const s of [1, -1]) {
    const side = s > 0 ? "L" : "R";
    const P = (p) => [p[0] * s, p[1], p[2]];
    const legCol = legwear === "pants" ? (s > 0 ? c.legL : c.legR) ?? c.bottom : skin;
    pieces.push(
      { name: `thigh${side}`, kind: "cone", a: P(L.hip), b: P(L.knee), ra: L.thighR, rb: L.kneeR, color: legCol, bone: `leg${side}`, blend: k(0.06) },
      { name: `shin${side}`, kind: "cone", a: P(L.knee), b: P(L.ankle), ra: L.kneeR, rb: L.ankleR, color: legCol, bone: `leg${side}`, blend: k(0.04) },
    );
    if (legwear === "shorts") {
      const t = o.shortsLen ?? 0.5;
      const m = L.knee.map((v, i) => L.hip[i] + (v - L.hip[i]) * t);
      const rb = L.thighR * 0.86 + k(0.06), rl = L.thighR + (L.kneeR - L.thighR) * t;
      pieces.push({ name: `shorts${side}`, kind: "cone", a: P([L.hip[0] * 0.8, L.hip[1] + k(0.05), 0]), b: P(m), ra: L.thighR + k(0.06), rb, color: c.bottom, bone: `leg${side}`, blend: k(0.015) });
      shortsEnd = m[1] - Math.sqrt(Math.max(0, rb * rb - rl * rl)); // where the shell meets the leg
    }
    if (legwear === "pants" && c.pantsCuff !== false) {
      // straight pants: a little flare at the ankle so the hem sits on the shoe
      const m = L.knee.map((v, i) => v + (L.ankle[i] - v) * 0.7);
      pieces.push({ name: `pantsHem${side}`, kind: "cone", a: P(m), b: P([L.ankle[0], L.ankle[1] + k(0.02), L.ankle[2]]), ra: L.ankleR + k(0.015), rb: L.ankleR + k(0.03), color: legCol, bone: `leg${side}`, blend: k(0.03) });
    }
  }
  // feet
  const shoes = o.shoes ?? "sneaker";
  const [sw, shh, slen] = L.shoe.map((v, i) => v * (o.shoeSize?.[i] ?? 1)); // shoeSize: [w, h, length] multipliers
  for (const s of [1, -1]) {
    const side = s > 0 ? "L" : "R";
    const ax = L.ankle[0] * s;
    if (shoes === "bare") {
      pieces.push(
        { name: `foot${side}`, kind: "ellipsoid", at: [ax, k(0.1), k(0.13)], r: [sw * 0.42, k(0.1), slen * 0.5], color: skin, bone: `foot${side}`, blend: k(0.06) },
      );
    } else {
      const col = c.shoe;
      pieces.push(
        { name: `shoe${side}`, kind: "box", at: [ax, shh / 2, k(0.12)], size: [sw, shh, slen], round: Math.min(sw, shh) * 0.45, color: col, bone: `foot${side}`, blend: k(0.04) },
        { name: `toe${side}`, kind: "ellipsoid", at: [ax, shh * 0.42, k(0.12) + slen * 0.3], r: [sw * 0.5, shh * 0.5, slen * 0.26], color: col, bone: `foot${side}`, blend: k(0.03) },
      );
      if (shoes === "boot") {
        pieces.push({ name: `boot${side}`, kind: "cone", a: [ax, shh * 0.6, 0], b: [ax, L.ankle[1] + (L.knee[1] - L.ankle[1]) * (o.bootTop ?? 0.5), 0.005], ra: L.ankleR + k(0.07), rb: L.kneeR + k(0.05), color: col, bone: `foot${side}`, blend: k(0.03) });
      }
    }
  }
  if (X.pieces) pieces.push(...X.pieces);
  pieces.push({ name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true });

  // paint: the bottom's crisp hem line, shoe soles, then the class's own
  const paint = [];
  const crotch = L.hip[1] - L.thighR * 0.6;
  if (o.hem !== null) {
    const hemY = crotch + (o.hem ?? 0.32) * H;
    // both sides of the line are painted: the thigh tops (bottom color) reach above it at the back
    paint.push({ name: "topHem", color: mid, shape: { kind: "box", at: [0, hemY + 0.4 * H, 0], size: [4 * H, 0.8 * H, 4 * H] }, bones: ["spine", "hips", "legL", "legR"] });
    // pants: the box runs well down the legs; shorts and skirts: only to the crotch (the legs below are bare)
    const low = legwear === "pants" ? hemY - 1.5 * H : shortsEnd !== null ? shortsEnd - 0.015 * H : crotch - 0.08 * H;
    paint.push({ name: "bottom", color: c.bottom, shape: { kind: "box", at: [0, (hemY + low) / 2, 0], size: [4 * H, hemY - low, 4 * H] }, bones: ["spine", "hips", "legL", "legR"] });
  }
  if (c.sole && shoes !== "bare") paint.push({ name: "sole", color: c.sole, shape: { kind: "box", at: [0, 0, 0], size: [4 * H, k(0.1), 4 * H] }, bones: ["footL", "footR"] });
  if (sleeveEnd) {
    // the sleeve color down to where the shell meets the arm, in a box along the upper arm (crisp hem)
    const d = sleeveEnd.m.map((v, i) => v - sh[i]), dl = Math.hypot(...d), u = d.map((v) => v / dl);
    const len = dl + sleeveEnd.cap + 0.015 * H + 0.6 * H; // from 0.6 H above the shoulder joint to the hem
    const mid = sh.map((v, i) => v - u[i] * 0.6 * H + (u[i] * len) / 2);
    const turn = [Math.atan2(-u[2], -u[1]), 0, -Math.asin(-u[0])]; // local +y along -u (the box is symmetric)
    paint.push({ name: "sleeveHem", color: sl, shape: { kind: "box", at: mid, size: [1.2 * H, len, 1.2 * H], turn }, bones: ["armL"], mirror: true, optional: true });
  }
  if (sleeves === "none") {
    // bare arms: skin over everything the arm bone carries, so the armhole is a crisp line, not a blend
    // (a capsule hugging the arm, so a prop held on the arm bone keeps its own colors)
    paint.push({ name: "bareArm", color: skin, shape: { kind: "chain", points: [[sh[0], sh[1] + 0.15 * H, sh[2], L.upperArmR + 0.12 * H], [...elbow, L.elbowR + 0.08 * H], [...wrist, L.wristR + 0.08 * H], [L.hand[0], L.hand[1] - 0.12 * H, L.hand[2], L.handR[1] * 0.9]] }, bones: ["armL"], mirror: true, optional: true });
  }
  if (X.paint) paint.push(...X.paint);
  // the game's shader takes 8 paint layers, mirrored copies included: drop the optional ones first
  const count = (list) => list.reduce((n, p) => n + (p.mirror ? 2 : 1), 0);
  while (count(paint) > 8 && paint.some((p) => p.optional)) paint.splice(paint.findIndex((p) => p.optional), 1);
  for (const p of paint) delete p.optional;

  // face, Let's Go style: big eyes with an iris, two glints, a thick upper lash line, short thick brows, a small mouth
  const F = o.face ?? {};
  const eyeH = (F.eyeH ?? 0.165) * H, eyeW = (F.eyeW ?? 0.135) * H;
  const ex = (F.eyeX ?? 0.19) * H, ey = L.chin + (F.eyeY ?? 0.45) * H;
  const at = (x, y, dz = 0) => [x, y, faceZ(L, x, y) + dz];
  const lashC = F.lash ?? c.hair ?? KIT_DARK;
  const eyes = [
    {
      name: "eye", at: at(-ex, ey), w: eyeW, h: eyeH, turn: F.eyeTurn ?? 0,
      sclera: F.sclera ?? "#fbfbf8", iris: F.iris ?? "#4a3326", irisAt: F.irisAt ?? [0.05, -0.1], irisSize: F.irisSize ?? [0.66, 0.78],
      pupil: F.pupil ?? "#1a1210", pupilSize: [0.3, 0.38], glints: F.glints ?? [[0.28, 0.42, 0.26], [-0.3, -0.42, 0.12]],
      edge: { color: lashC, w: 0.07 }, cut: F.cut ?? null, lid: F.lid ?? 0.25, mirror: true,
    },
    // the upper lash line: an arch along the top of the eye, a touch wider than the eye
    { name: "lash", at: at(-ex, ey + eyeH * (F.lashUp ?? 0.36)), w: eyeW * 1.12, h: eyeH * 0.42, closed: F.lashCurve ?? 0.7, thick: F.lashThick ?? 0.32, sclera: lashC, turn: F.eyeTurn ?? 0, mirror: true },
  ];
  if (F.lashWing) eyes.push({ name: "lashWing", at: at(-ex - eyeW * 0.55, ey + eyeH * 0.42), w: eyeW * 0.42, h: eyeH * 0.3, closed: 0.3, thick: 0.35, sclera: lashC, turn: -0.7, mirror: true });
  if (X.eyes) eyes.push(...X.eyes);
  const B_ = F.brow ?? {};
  const mouths = [
    { name: "brow", kind: "line", at: at(-ex - (B_.dx ?? 0) * H, L.chin + (B_.y ?? 0.64) * H), w: (B_.w ?? 0.15) * H, h: 0.01, thick: (B_.thick ?? 0.035) * H, turn: B_.turn ?? -0.1, color: B_.color ?? c.hair ?? KIT_DARK, mirror: true },
  ];
  const M = F.mouth ?? {};
  mouths.push({ name: "mouth", kind: M.kind ?? "smile", at: at(0, L.chin + (M.y ?? 0.19) * H), w: (M.w ?? 0.14) * H, h: (M.h ?? 0.03) * H, thick: (M.thick ?? 0.018) * H, color: M.color ?? "#9c5a4a", inner: M.inner, tongue: M.tongue });
  if (X.mouths) mouths.push(...X.mouths);
  const spots = [];
  if (F.blush !== false) spots.push({ name: "blush", at: at(-0.27 * H, L.chin + 0.3 * H), r: [0.075 * H, 0.04 * H], color: F.blushColor ?? "#f2b39c", soft: 0.85, mirror: true });
  if (F.nose !== false) spots.push({ name: "nose", at: at(0, L.chin + 0.32 * H), r: [0.028 * H, 0.02 * H], color: F.noseColor ?? KIT_SKIN_SHADE(skin, 0.1), soft: 0.4 });
  if (X.spots) spots.push(...X.spots);

  const bones = {
    root: [0, 0, 0],
    hips: { at: [0, L.pelvis.at[1], 0], parent: "root" },
    spine: { at: [0, L.waist.at[1], 0], parent: "hips" },
    head: { at: [0, L.chin + k(0.02), -k(0.08)], parent: "spine" },
    armL: { at: sh, parent: "spine" },
    armR: { at: [-sh[0], sh[1], sh[2]], parent: "spine" },
    legL: { at: L.hip, parent: "hips" },
    legR: { at: [-L.hip[0], L.hip[1], L.hip[2]], parent: "hips" },
    footL: { at: L.ankle, parent: "legL" },
    footR: { at: [-L.ankle[0], L.ankle[1], L.ankle[2]], parent: "legR" },
    ...(X.bones ?? {}),
  };
  return scaleRecipe({ name: o.name, height: o.height, bones, pieces, paint, face: { eyes, mouths, spots } }, 1 / o.height);
}

/** Scale a recipe built in meters to the 1-tall convention (every length, never the relative eye/glint numbers). */
function scaleRecipe(r, s) {
  const v = (a) => a.map((x) => x * s);
  const num = (x) => (typeof x === "number" ? x * s : x);
  const prim = (p) => {
    const q = { ...p };
    for (const key of ["at", "a", "b"]) if (q[key]) q[key] = v(q[key]);
    for (const key of ["ra", "rb", "depth", "round", "taper", "R", "offset", "blend"]) if (typeof q[key] === "number") q[key] *= s;
    if (q.r !== undefined) q.r = Array.isArray(q.r) ? v(q.r) : q.r * s;
    if (q.size !== undefined) q.size = Array.isArray(q.size) ? v(q.size) : q.size * s;
    if (q.points) q.points = q.points.map((pt) => v(pt));
    if (q.outline) q.outline = q.outline.map((pt) => v(pt));
    if (q.profile) q.profile = q.profile.map((pt) => v(pt));
    if (q.kind === "chain" && typeof q.smooth === "number") q.smooth *= s; // chain smooth is a blend distance
    if (q.squash) q.squash = { ...q.squash, at: q.squash.at && v(q.squash.at) };
    return q;
  };
  const bones = {};
  for (const [n, b] of Object.entries(r.bones)) bones[n] = Array.isArray(b) ? v(b) : { ...b, at: v(b.at) };
  const feat = (f) => {
    const q = { ...f, at: v(f.at) };
    for (const key of ["w", "h"]) if (typeof q[key] === "number") q[key] *= s;
    if (q.r !== undefined) q.r = Array.isArray(q.r) ? v(q.r) : q.r * s;
    if (q.kind !== undefined && typeof q.thick === "number") q.thick *= s; // mouth strokes are lengths; eye thick is relative
    return q;
  };
  return {
    ...r,
    bones,
    pieces: r.pieces.map(prim),
    paint: r.paint.map((p) => ({ ...p, soft: num(p.soft ?? 0), shape: prim(p.shape) })),
    face: { eyes: r.face.eyes.map(feat), mouths: r.face.mouths.map(feat), spots: r.face.spots.map(feat) },
  };
}
// ---- end person kit -------------------------------------------------------------------------------------------------
// </person-kit>

const C = {
  skin: "#f5d0c0", hair: "#f39cbf", top: "#fad7ec", sleeve: "#fad7ec", bottom: "#fad7ec", shoe: "#f6f6f6", sole: "#e8d6de",
};
const APRON = "#f2f6f8", CAP = "#f6fcfd", CROSS = "#e03c3c";

export default person({
  name: "Nurse Joy",
  height: 1.65,
  crown: 1.54,
  body: "adult",
  width: 0.92,
  c: C,
  sleeves: "short",
  sleeveLen: 0.42,
  legwear: "bare",
  hem: null,
  shoes: "sneaker",
  shoeSize: [0.85, 0.62, 0.92],
  hair: { hairline: 0.84, window: 0.44, windowZ: 0.5, grow: [0.1, 0.1, 0.12], lift: 0.12, tilt: 0.35 },
  face: {
    eyeH: 0.2, eyeW: 0.155, iris: "#3f7fd0", pupil: "#1d2a4a", lash: "#4a2436", lashThick: 0.38, lashWing: true,
    brow: { y: 0.66, w: 0.13, thick: 0.026, turn: 0.06, color: "#d0708f" },
    mouth: { kind: "smile", w: 0.12, h: 0.03, thick: 0.017, color: "#d0707a" },
    blushColor: "#f6b0b8",
  },
  extra: (L) => {
    const H = L.H;
    const crotch = L.hip[1] - L.thighR * 0.6;
    const skirtY = crotch - 0.55 * H; // hem at mid-thigh
    const capAt = onHead(L, [0, 1, 0.2], -0.02 * H);
    const capTurn = [-0.3, 0, 0];
    const capFront = [capAt[0], capAt[1] + 0.17 * H * Math.cos(0.3) + 0.0, capAt[2] + 0.245 * H - 0.17 * H * Math.sin(0.3)];
    return {
      pieces: [
        // the two big hair loops: hair gathered at the back of each side and looped down by the jaw
        ...[1, -1].flatMap((s) => [
          { name: `tie${s > 0 ? "L" : "R"}`, kind: "cone", a: onHead(L, [s * 0.75, -0.1, -0.6], 0.0), b: [s * 0.55 * H, L.chin + 0.38 * H, -0.12 * H], ra: 0.13 * H, rb: 0.1 * H, color: C.hair, bone: "head", blend: 0.04 * H },
          // the rings face forward (the XY and Let's Go models show them as circles from the front)
          { name: `loop${s > 0 ? "L" : "R"}`, kind: "torus", at: [s * 0.62 * H, L.chin + 0.2 * H, -0.1 * H], R: 0.19 * H, r: 0.095 * H, turn: [0, s * 0.35, 0], color: C.hair, bone: "head", blend: 0.03 * H },
          // a long strand framing each side of the face, in front of the ear
          { name: `strand${s > 0 ? "L" : "R"}`, kind: "ellipsoid", at: onHead(L, [s * 0.88, -0.05, 0.42], 0.0), r: [0.07 * H, 0.3 * H, 0.1 * H], turn: [0, 0, s * 0.12], color: C.hair, bone: "head", blend: 0.02 * H },
        ]),
        // side-swept fringe over the forehead
        { name: "fringe", kind: "ellipsoid", at: onHead(L, [0.2, 0.45, 1], 0.02 * H), r: [0.38 * H, 0.13 * H, 0.13 * H], turn: [-0.3, 0.2, -0.3], color: C.hair, bone: "head", blend: 0.02 * H },
        // the nurse cap: a short white band, wider than deep, tipped back on the crown
        { name: "cap", kind: "lathe", profile: [[0, 0.34 * H], [0.3 * H, 0.35 * H], [0.35 * H, 0.31 * H], [0.33 * H, 0.04 * H], [0.29 * H, 0], [0, 0]], at: capAt, turn: capTurn, scale: [1.08, 1, 0.72], color: CAP, bone: "head", blend: 0.02 * H },
        // puffed sleeves
        { name: "puff", kind: "ellipsoid", at: [L.shoulder[0] + 0.04 * H, L.shoulder[1] - 0.05 * H, 0], r: [0.2 * H, 0.2 * H, 0.2 * H], color: C.top, bone: "armL", blend: 0.05 * H, mirror: true },
        // the dress skirt, flared to mid-thigh
        { name: "skirt", kind: "lathe", profile: [[0, 0.95 * H], [0.38 * H, 0.95 * H], [0.5 * H, 0.6 * H], [0.68 * H, 0.08 * H], [0.66 * H, 0], [0, 0]], at: [0, skirtY, 0], scale: [1, 1, 0.82], color: C.top, bone: "hips", blend: 0.06 * H },
      ],
      paint: [
        // the white apron down the front, from the chest to the skirt's hem
        { name: "apron", color: APRON, shape: { kind: "box", at: [0, (L.shoulder[1] - 0.12 * H + skirtY) / 2, 0.75 * H], size: [0.66 * H, L.shoulder[1] - 0.12 * H - skirtY + 0.02 * H, 1.3 * H], round: 0.1 * H }, bones: ["spine", "hips"] },
      ],
      // the red cross on the cap: two crossed strokes as decals (too small for paint to stay crisp)
      mouths: [
        { name: "crossA", kind: "line", at: capFront, w: 0.15 * H, h: 0.01, thick: 0.07 * H, color: CROSS, lit: true },
        { name: "crossB", kind: "line", at: capFront, w: 0.15 * H, h: 0.01, thick: 0.07 * H, turn: Math.PI / 2, color: CROSS, lit: true },
      ],
    };
  },
});
