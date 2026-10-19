// Meowth (#52). GO pose: standing upright, long arms hanging down and out, mouth closed.
// Checked against art-52, home-52, the GO icon (go256-52, go-52, goS-52) and the Showdown 3D front/back (frames-meowth).
// Numbers: notes/research/species-2.md (Meowth) plus the corrections in notes/research/model-wild-3.md.
// 1 tall (top whisker tip to soles), feet at y 0, facing +z, +x = Meowth's own left (the viewer's right from the front).

const CREAM = "#f5e9c4";
const WHISKER = "#f8f0d4";
const EAR = "#2f2626";
const INNER = "#b07a45";
const COIN = "#f2c843";
const RIDGE = "#b8862c";
const PAW = "#c08a48";
const CURL = "#9c6a36"; // the darker middle of the tail curl
const WHITE = "#fbf9f0";
const DARK = "#1c1620";

// frame helper (three.js XYZ euler, same math as the tool's place())
const rot = ([x = 0, y = 0, z = 0], [vx, vy, vz]) => {
  const a = Math.cos(x), b = Math.sin(x), c = Math.cos(y), d = Math.sin(y), e = Math.cos(z), f = Math.sin(z);
  const m = [c * e, -c * f, d, a * f + b * e * d, a * e - b * f * d, -b * c, b * f - a * e * d, b * e + a * f * d, a * c];
  return [m[0] * vx + m[1] * vy + m[2] * vz, m[3] * vx + m[4] * vy + m[5] * vz, m[6] * vx + m[7] * vy + m[8] * vz];
};
const place = (at, turn, v) => rot(turn, v).map((c, i) => c + at[i]);

// Ear: a big right-ish triangle, tip over the outer edge, inner edge sloping down to the crown (u = outward, v = up).
const EAR_OUT = [[-0.13, -0.05], [0.1, -0.05], [0.105, 0.04], [0.085, 0.13], [0.06, 0.2], [0.04, 0.215], [0.015, 0.2], [-0.05, 0.13], [-0.11, 0.05]];
const EAR_IN = [[-0.08, -0.03], [0.07, -0.03], [0.073, 0.06], [0.058, 0.135], [0.04, 0.165], [-0.03, 0.095], [-0.07, 0.035]];
const EAR_AT = [0.17, 0.73, -0.02];
const EAR_TURN = [-0.12, 0.25, -0.1];

// Coin: a tall gold oval on the forehead, tilted back with the forehead, standing a little proud so its top pokes above the crown.
const COIN_AT = [0, 0.775, 0.17];
const COIN_TURN = [-0.72, 0, 0];
const COIN_OVAL = Array.from({ length: 16 }, (_, i) => {
  const t = (i / 16) * Math.PI * 2;
  return [0.047 * Math.cos(t), 0.09 * Math.sin(t)];
});

// Tail: thin, from the low back out to its left side and up, ending in a tight curl beside the shoulder (seen from behind).
const TAIL1 = [[0.03, 0.16, -0.1, 0.024], [0.12, 0.105, -0.16, 0.022], [0.22, 0.13, -0.2, 0.021], [0.275, 0.24, -0.21, 0.021]];
const TAIL2 = [[0.275, 0.24, -0.21, 0.021], [0.29, 0.34, -0.2, 0.023], [0.285, 0.43, -0.2, 0.026], [0.255, 0.5, -0.2, 0.027], [0.195, 0.53, -0.2, 0.027], [0.14, 0.5, -0.2, 0.026], [0.125, 0.44, -0.2, 0.025], [0.155, 0.395, -0.2, 0.023], [0.205, 0.4, -0.2, 0.021], [0.215, 0.445, -0.2, 0.019]];
const CURL_C = [0.2, 0.45, -0.2];

const recipe = {
  name: "Meowth",
  dex: 52,
  height: 1,
  bones: {
    root: [0, 0, 0],
    body: { at: [0, 0.2, 0], parent: "root" },
    head: { at: [0, 0.46, 0], parent: "body" },
    earL: { at: EAR_AT, parent: "head" },
    earR: { at: [-EAR_AT[0], EAR_AT[1], EAR_AT[2]], parent: "head" },
    armL: { at: [0.1, 0.42, 0], parent: "body" },
    armR: { at: [-0.1, 0.42, 0], parent: "body" },
    legL: { at: [0.075, 0.17, 0], parent: "root" },
    legR: { at: [-0.075, 0.17, 0], parent: "root" },
    footL: { at: [0.1, 0.05, 0.02], parent: "legL" },
    footR: { at: [-0.1, 0.05, 0.02], parent: "legR" },
    tail1: { at: TAIL1[0].slice(0, 3), parent: "body" },
    tail2: { at: TAIL2[0].slice(0, 3), parent: "tail1" },
  },
  pieces: [
    // small pear body: round belly, narrow neck, the big head right on it
    { name: "belly", kind: "ellipsoid", at: [0, 0.26, 0], r: [0.135, 0.15, 0.12], color: CREAM, bone: "body" },
    { name: "neck", kind: "ellipsoid", at: [0, 0.42, -0.005], r: [0.09, 0.08, 0.08], color: CREAM, bone: "body", blend: 0.06 },
    // wide head, flat-ish top, widest low at the cheeks, a small muzzle bump under the eyes
    { name: "head", kind: "ellipsoid", at: [0, 0.67, 0], r: [0.28, 0.19, 0.205], color: CREAM, bone: "head", blend: 0.06 },
    { name: "cheek", kind: "ellipsoid", at: [0.15, 0.585, 0.02], r: [0.16, 0.1, 0.15], color: CREAM, bone: "head", blend: 0.05, mirror: true },
    { name: "muzzle", kind: "ellipsoid", at: [0, 0.56, 0.135], r: [0.12, 0.055, 0.07], color: CREAM, bone: "head", blend: 0.04 },
    // the coin's relief (painted gold below)
    { name: "coin", kind: "slab", outline: COIN_OVAL, smooth: true, depth: 0.028, round: 0.012, at: COIN_AT, turn: COIN_TURN, color: CREAM, bone: "head", blend: 0.012 },
    // big ears on the top corners (black, painted brown inside)
    { name: "ear", kind: "slab", outline: EAR_OUT, smooth: true, depth: 0.05, round: 0.02, at: EAR_AT, turn: EAR_TURN, color: CREAM, bone: "earL", blend: 0.02, mirror: true },
    // whiskers: two standing up beside the coin, two out from each cheek (upper angled up, lower level)
    { name: "whiskerTop", kind: "cone", a: [0.07, 0.82, 0.08], b: [0.085, 0.995, 0.03], ra: 0.019, rb: 0.012, color: WHISKER, bone: "head", blend: 0.01, mirror: true },
    { name: "whiskerUp", kind: "cone", a: [0.23, 0.61, 0.07], b: [0.46, 0.68, 0.09], ra: 0.019, rb: 0.012, color: WHISKER, bone: "head", blend: 0.01, mirror: true },
    { name: "whiskerLow", kind: "cone", a: [0.23, 0.565, 0.07], b: [0.47, 0.545, 0.09], ra: 0.019, rb: 0.012, color: WHISKER, bone: "head", blend: 0.01, mirror: true },
    // long thin arms hanging down and out, round paws
    { name: "arm", kind: "cone", a: [0.09, 0.425, 0], b: [0.3, 0.13, 0.03], ra: 0.04, rb: 0.032, color: CREAM, bone: "armL", blend: 0.035, mirror: true },
    { name: "hand", kind: "ellipsoid", at: [0.315, 0.105, 0.035], r: [0.058, 0.058, 0.054], color: CREAM, bone: "armL", blend: 0.025, mirror: true },
    // short legs, brown paws pointing forward
    { name: "leg", kind: "cone", a: [0.07, 0.17, 0], b: [0.1, 0.05, 0.015], ra: 0.042, rb: 0.034, color: CREAM, bone: "legL", blend: 0.04, mirror: true },
    { name: "foot", kind: "ellipsoid", at: [0.105, 0.032, 0.05], r: [0.055, 0.034, 0.088], turn: [0, 0.12, 0], color: CREAM, bone: "footL", blend: 0.03, mirror: true },
    // the tail
    { name: "tail1", kind: "chain", points: TAIL1, smooth: 0.02, color: CREAM, bone: "tail1", blend: 0.03 },
    { name: "tail2", kind: "chain", points: TAIL2, smooth: 0.02, color: CREAM, bone: "tail2", blend: 0.02 },
    { name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true },
  ],
  paint: [
    // black ears (paint, so the edge at the crown stays crisp), brown inside with a black rim left round the edge
    { name: "ear", color: EAR, shape: { kind: "slab", outline: EAR_OUT, depth: 0.3, at: EAR_AT, turn: EAR_TURN, scale: 1.3 }, bones: ["earL"], mirror: true },
    { name: "innerEar", color: INNER, shape: { kind: "slab", outline: EAR_IN, smooth: true, depth: 0.04, at: place(EAR_AT, EAR_TURN, [0, 0, 0.035]), turn: EAR_TURN }, bones: ["earL"], mirror: true },
    // the gold coin over its relief
    { name: "coin", color: COIN, shape: { kind: "ellipsoid", at: COIN_AT, r: [0.05, 0.093, 0.05], turn: COIN_TURN }, bones: ["head"] },
    // brown paws (and a little of the ankle)
    { name: "paw", color: PAW, shape: { kind: "ellipsoid", at: [0.105, 0.03, 0.05], r: [0.075, 0.065, 0.105], turn: [0, 0.12, 0] }, bones: ["footL", "legL"], mirror: true },
    // the brown curl (last third of the tail) and its darker middle
    { name: "tailTip", color: PAW, shape: { kind: "sphere", at: CURL_C, r: 0.13 }, bones: ["tail2"] },
    { name: "curlCore", color: CURL, shape: { kind: "sphere", at: [0.19, 0.43, -0.2], r: 0.045 }, bones: ["tail2"] },
  ],
  face: {
    eyes: [
      // big white ovals, a dark rim, a thin vertical slit pupil (defined on the viewer's left eye; +u is toward the nose)
      { at: [-0.12, 0.66, 0.185], w: 0.13, h: 0.145, sclera: WHITE, iris: DARK, irisAt: [0.02, 0], irisSize: [0.1, 0.66], edge: { color: DARK, w: 0.09 }, mirror: true },
      // the heavier upper lid line along the top of the eye
      { at: [-0.12, 0.695, 0.18], w: 0.138, h: 0.075, closed: 1, thick: 0.2, sclera: DARK, mirror: true },
      // two tiny fangs under the mouth line
      { name: "fang", at: [-0.06, 0.533, 0.2], w: 0.02, h: 0.034, cut: [0, 0], sclera: "#ffffff", edge: { color: DARK, w: 0.22 }, mirror: true },
    ],
    mouth: [
      // closed: a long, slightly smiling line on the muzzle
      { name: "mouth", kind: "smile", at: [0, 0.54, 0.202], w: 0.24, h: 0.01, thick: 0.0075, color: DARK },
      // the four ridges across the lower two thirds of the coin, lit so they shade with it
      ...[[-0.06, 0.056], [-0.03, 0.074], [0, 0.08], [0.03, 0.074]].map(([v, w], i) => ({
        name: `ridge${i}`, kind: "line", at: place(COIN_AT, COIN_TURN, [0, v, 0.03]), dir: rot(COIN_TURN, [0, 0, 1]), w, h: 0.01, thick: 0.009, color: RIDGE, lit: true,
      })),
    ],
  },
};

export default recipe;
