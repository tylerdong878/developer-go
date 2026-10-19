// Rattata (#19). GO stance: crouched on all fours, head low and forward, mouth open on two big buck teeth,
// the thin tail standing straight up off the rump and curling forward at the top.
// Verified against art-19, home-19, the GO icon (go256-19, grid s1-go-19) and the Showdown sprites ani-rattata / aniback-rattata.
// Numbers: notes/research/species-1.md (Rattata) plus the corrections in notes/research/model-wild-1.md.
// 1 tall (top of the tail curl to the soles), feet at y 0, facing +z, +x = Rattata's own left (the viewer's right).

const FUR = "#a878c0";
const CREAM = "#efdcb4";
const EAR_IN = "#dcb898";
const WHISKER = "#f6e8cc";
const NOSE = "#b058b8";
const IRIS = "#d0203a";
const TOOTH = "#fbfaf6";
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

// Ear: a big round disc, a touch taller than wide, its lower part sunk in the head.
const EAR_R = 0.088;
const EAR = Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * Math.PI * 2;
  return [Math.cos(a) * EAR_R * 0.94, Math.sin(a) * EAR_R];
});
const EAR_AT = [0.142, 0.432, 0.03];
const EAR_TURN = [-0.1, 0.55, -0.32];

// Tail: one thin tube up from the rump, nearly straight, then a forward curl at the top (x, y, z, r).
// Split in four runs so each rides its own bone (tail1 at the base to tail4 in the curl).
const TAIL = [
  [[0, 0.255, -0.31, 0.032], [0, 0.33, -0.36, 0.028], [0, 0.46, -0.385, 0.026]],
  [[0, 0.46, -0.385, 0.026], [0, 0.6, -0.385, 0.025], [0, 0.73, -0.37, 0.025]],
  [[0, 0.73, -0.37, 0.025], [0, 0.83, -0.35, 0.024], [0, 0.91, -0.315, 0.024]],
  [[0, 0.91, -0.315, 0.024], [0, 0.962, -0.268, 0.023], [0, 0.976, -0.208, 0.022], [0, 0.953, -0.155, 0.021], [0, 0.9, -0.138, 0.02], [0, 0.862, -0.17, 0.019], [0, 0.866, -0.218, 0.018], [0, 0.9, -0.232, 0.017]],
];

const recipe = {
  name: "Rattata",
  dex: 19,
  height: 1,
  bones: {
    root: [0, 0, 0],
    body: { at: [0, 0.2, -0.1], parent: "root" },
    head: { at: [0, 0.27, 0.05], parent: "body" },
    jaw: { at: [0, 0.22, 0.14], parent: "head" },
    earL: { at: EAR_AT, parent: "head" },
    earR: { at: [-EAR_AT[0], EAR_AT[1], EAR_AT[2]], parent: "head" },
    armL: { at: [0.08, 0.18, 0.05], parent: "body" },
    armR: { at: [-0.08, 0.18, 0.05], parent: "body" },
    legL: { at: [0.1, 0.2, -0.22], parent: "body" },
    legR: { at: [-0.1, 0.2, -0.22], parent: "body" },
    tail1: { at: [0, 0.255, -0.31], parent: "body" },
    tail2: { at: [0, 0.46, -0.385], parent: "tail1" },
    tail3: { at: [0, 0.73, -0.37], parent: "tail2" },
    tail4: { at: [0, 0.91, -0.315], parent: "tail3" },
  },
  pieces: [
    // a low, long body: chest, middle and round haunches, one skin
    { name: "chest", kind: "ellipsoid", at: [0, 0.2, 0.0], r: [0.11, 0.105, 0.12], color: FUR, bone: "body" },
    { name: "middle", kind: "ellipsoid", at: [0, 0.205, -0.12], r: [0.12, 0.11, 0.15], color: FUR, bone: "body", blend: 0.06 },
    { name: "haunch", kind: "ellipsoid", at: [0, 0.215, -0.235], r: [0.14, 0.125, 0.12], color: FUR, bone: "body", blend: 0.06 },
    // big head, low and forward, with a long snout
    { name: "head", kind: "ellipsoid", at: [0, 0.305, 0.095], r: [0.155, 0.135, 0.14], color: FUR, bone: "head", blend: 0.07 },
    { name: "snout", kind: "ellipsoid", at: [0, 0.282, 0.235], r: [0.08, 0.064, 0.105], turn: [0.18, 0, 0], color: FUR, bone: "head", blend: 0.05 },
    // cream upper lip under the snout, and the lower jaw dropped open
    { name: "lip", kind: "ellipsoid", at: [0, 0.245, 0.25], r: [0.074, 0.04, 0.085], turn: [0.15, 0, 0], color: CREAM, bone: "head", blend: 0.03 },
    { name: "jaw", kind: "ellipsoid", at: [0, 0.178, 0.205], r: [0.068, 0.048, 0.09], turn: [-0.18, 0, 0], color: CREAM, bone: "jaw", blend: 0.035 },
    { name: "nose", kind: "sphere", at: [0, 0.3, 0.334], r: 0.019, color: NOSE, bone: "head", blend: 0.01 },
    // the gaping mouth: a dark red pocket between lip and jaw, a pink tongue on its floor
    { name: "mouth", kind: "ellipsoid", at: [0, 0.2, 0.3], r: [0.056, 0.048, 0.064], color: "#8a2f3c", bone: "head", blend: -0.012 },
    { name: "tongue", kind: "ellipsoid", at: [0, 0.168, 0.262], r: [0.042, 0.02, 0.048], color: "#e57c88", bone: "jaw", blend: 0.008 },
    // cream cheek tufts, pointed, flaring out under the eyes
    { name: "cheek", kind: "cone", a: [0.08, 0.245, 0.15], b: [0.175, 0.225, 0.095], ra: 0.058, rb: 0.024, color: CREAM, bone: "head", blend: 0.04, mirror: true },
    // two big buck teeth hanging from the upper lip over the open mouth, a notch between them
    { name: "tooth", kind: "box", size: [0.04, 0.072, 0.03], round: 0.012, at: [0.0205, 0.215, 0.315], turn: [0.2, 0, 0], color: TOOTH, bone: "head", mirror: true },
    // a long whisker straight out to each side (kept on the grid axis so the thin tube meshes clean)
    { name: "whisker", kind: "cone", a: [0.06, 0.258, 0.27], b: [0.31, 0.258, 0.27], ra: 0.016, rb: 0.01, color: WHISKER, bone: "head", mirror: true },
    // big round ears
    { name: "ear", kind: "slab", outline: EAR, smooth: true, depth: 0.036, round: 0.016, at: EAR_AT, turn: EAR_TURN, color: FUR, bone: "earL", blend: 0.03, mirror: true },
    // front legs under the head, splayed a little, cream paws with three toes
    { name: "arm", kind: "cone", a: [0.075, 0.17, 0.05], b: [0.14, 0.04, 0.11], ra: 0.042, rb: 0.032, color: FUR, bone: "armL", blend: 0.03, mirror: true },
    { name: "paw", kind: "ellipsoid", at: [0.15, 0.022, 0.135], r: [0.042, 0.022, 0.052], turn: [0, 0.35, 0], color: CREAM, bone: "armL", blend: 0.02, mirror: true },
    // hind legs: round thighs, long cream feet
    { name: "thigh", kind: "ellipsoid", at: [0.105, 0.17, -0.22], r: [0.065, 0.1, 0.1], turn: [0.3, 0, 0], color: FUR, bone: "legL", blend: 0.04, mirror: true },
    { name: "shin", kind: "cone", a: [0.115, 0.12, -0.27], b: [0.125, 0.035, -0.22], ra: 0.04, rb: 0.03, color: FUR, bone: "legL", blend: 0.03, mirror: true },
    { name: "foot", kind: "ellipsoid", at: [0.13, 0.022, -0.17], r: [0.04, 0.022, 0.07], color: CREAM, bone: "legL", blend: 0.02, mirror: true },
    // the tail, four runs on four bones
    ...TAIL.map((points, i) => ({ name: `tail${i + 1}`, kind: "chain", points, color: FUR, bone: `tail${i + 1}`, blend: i ? 0.005 : 0.04 })),
    { name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true },
  ],
  paint: [
    // cream underside: throat, chest and belly back to the hind legs
    { name: "belly", color: CREAM, shape: { kind: "ellipsoid", at: [0, 0.1, -0.06], r: [0.13, 0.1, 0.25] }, bones: ["body"] },
    { name: "throat", color: CREAM, shape: { kind: "ellipsoid", at: [0, 0.18, 0.11], r: [0.12, 0.08, 0.09] }, bones: ["body", "head"] },
    // cream lower face sides, behind the mouth; purple left on the bridge of the snout and around the eyes
    { name: "muzzle", color: CREAM, shape: { kind: "ellipsoid", at: [0, 0.21, 0.16], r: [0.15, 0.065, 0.1] }, bones: ["head"] },
    { name: "cheekFur", color: CREAM, shape: { kind: "ellipsoid", at: [0.1, 0.238, 0.19], r: [0.075, 0.048, 0.09] }, bones: ["head"], mirror: true },
    // the cream runs onto the back of each hind thigh (back sprite)
    { name: "thighBack", color: CREAM, shape: { kind: "ellipsoid", at: [0.088, 0.11, -0.315], r: [0.042, 0.065, 0.05] }, bones: ["legL", "body"], mirror: true },
    // ear insides, on the front face of the disc only
    { name: "earIn", color: EAR_IN, shape: { kind: "ellipsoid", at: place(EAR_AT, EAR_TURN, [0, 0.004, 0.022]), r: [0.05, 0.055, 0.013], turn: EAR_TURN }, bones: ["earL"], mirror: true },
  ],
  face: {
    eyes: [
      // angry almonds: a dark lid layer first, then the white eye cut by the lid slanting down to the nose
      { name: "lid", at: [-0.085, 0.335, 0.192], w: 0.074, h: 0.058, sclera: DARK, cut: [0.62, -0.5], mirror: true },
      { name: "eye", at: [-0.085, 0.335, 0.192], w: 0.066, h: 0.05, sclera: "#ffffff", iris: IRIS, irisAt: [0.3, -0.1], irisSize: [0.48, 0.7], pupil: DARK, pupilSize: [0.18, 0.32], cut: [0.32, -0.5], glints: [[0.42, 0.05, 0.2]], mirror: true },
    ],
  },
};

export default recipe;
