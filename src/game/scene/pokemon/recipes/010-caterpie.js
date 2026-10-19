// Caterpie (#10). GO stance: the big head and two body segments stand up, the rest of the body bends back along the
// ground to the cream teardrop on its tail. Verified against art-10, home-10, the GO icon (go256-10) and the Showdown
// sprites ani-caterpie / aniback-caterpie.
// Numbers: notes/research/species-1.md (Caterpie) plus the corrections in notes/research/model-wild-1.md.
// 1 tall (antenna tips to the ground), lowest point at y 0, facing +z, +x = Caterpie's own left (the viewer's right).

const GREEN = "#7cc95e";
const CREAM = "#f4e48c";
const ANTENNA = "#e65f43";
const RING = "#ecea98";
const EYE = "#ffe060";
const DARK = "#1c1620";
const MOUTH = "#2c3a24";

// Body segments after the head: [x, y, z, rx, ry, rz]. Two stand up, then the chain bends back along the ground.
const SEGS = [
  [0, 0.44, -0.035, 0.19, 0.15, 0.17],
  [0, 0.27, -0.07, 0.175, 0.13, 0.155],
  [0, 0.13, -0.16, 0.13, 0.125, 0.13],
  [0, 0.105, -0.3, 0.108, 0.105, 0.108],
  [0, 0.09, -0.415, 0.09, 0.09, 0.09],
  [0, 0.078, -0.515, 0.076, 0.078, 0.076],
];
// Ring sizes on each segment's sides (big on the first, shrinking toward the tail).
const RINGS = [0.058, 0.052, 0.045, 0.038, 0.032, 0.026];

const HEAD = [0, 0.735, 0.02];
const FORK = [0, 0.91, 0.2];

const recipe = {
  name: "Caterpie",
  dex: 10,
  height: 1,
  bones: {
    root: [0, 0, 0],
    seg1: { at: [0, 0.36, -0.04], parent: "root" },
    seg2: { at: [0, 0.2, -0.09], parent: "seg1" },
    seg3: { at: [0, 0.12, -0.2], parent: "seg2" },
    seg4: { at: [0, 0.1, -0.33], parent: "seg3" },
    seg5: { at: [0, 0.09, -0.44], parent: "seg4" },
    seg6: { at: [0, 0.08, -0.53], parent: "seg5" },
    tail: { at: [0, 0.12, -0.56], parent: "seg6" },
    head: { at: [0, 0.58, 0], parent: "seg1" },
    antenna: { at: FORK, parent: "head" },
  },
  pieces: [
    // the head: the biggest part, with a round muzzle bulging from its lower front (a shallow crease above it)
    { name: "head", kind: "ellipsoid", at: HEAD, r: [0.25, 0.24, 0.24], color: GREEN, bone: "head" },
    { name: "muzzle", kind: "ellipsoid", at: [0, 0.64, 0.17], r: [0.165, 0.115, 0.115], turn: [0.25, 0, 0], color: GREEN, bone: "head", blend: 0.008 },
    // body segments, each its own bone so the game can send a wave down them
    ...SEGS.map(([x, y, z, rx, ry, rz], i) => ({ name: `seg${i + 1}`, kind: "ellipsoid", at: [x, y, z], r: [rx, ry, rz], color: GREEN, bone: `seg${i + 1}`, blend: i === 0 ? 0.05 : 0.028 })),
    // cream belly lobes on the upright segments, and the stubby cream feet beside them
    { name: "belly1", kind: "ellipsoid", at: [0, 0.445, 0.085], r: [0.12, 0.11, 0.075], color: CREAM, bone: "seg1", blend: 0.03 },
    { name: "belly2", kind: "ellipsoid", at: [0, 0.275, 0.055], r: [0.11, 0.1, 0.075], color: CREAM, bone: "seg2", blend: 0.03 },
    { name: "belly3", kind: "ellipsoid", at: [0, 0.12, -0.06], r: [0.09, 0.08, 0.06], color: CREAM, bone: "seg3", blend: 0.03 },
    { name: "foot1", kind: "sphere", at: [0.135, 0.455, 0.105], r: 0.046, color: CREAM, bone: "seg1", blend: 0.015, mirror: true },
    { name: "foot2", kind: "sphere", at: [0.13, 0.29, 0.075], r: 0.043, color: CREAM, bone: "seg2", blend: 0.015, mirror: true },
    { name: "foot3", kind: "sphere", at: [0.1, 0.12, -0.03], r: 0.038, color: CREAM, bone: "seg3", blend: 0.015, mirror: true },
    // the cream teardrop on a short stalk, pointing up and back
    { name: "stalk", kind: "cone", a: [0, 0.11, -0.55], b: [0, 0.2, -0.6], ra: 0.03, rb: 0.024, color: CREAM, bone: "tail", blend: 0.02 },
    { name: "drop", kind: "ellipsoid", at: [0, 0.3, -0.63], r: [0.042, 0.105, 0.042], turn: [-0.3, 0, 0], color: CREAM, bone: "tail", blend: 0.02 },
    // the red Y antenna: a stem down the forehead and two thick arms reaching out and a little up
    { name: "stem", kind: "cone", a: FORK, b: [0, 0.825, 0.238], ra: 0.03, rb: 0.026, color: ANTENNA, bone: "antenna", blend: 0.012 },
    { name: "arm", kind: "cone", a: FORK, b: [0.228, 0.962, 0.13], ra: 0.03, rb: 0.034, color: ANTENNA, bone: "antenna", blend: 0.012, mirror: true },
    { name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true },
  ],
  paint: [
    // the dark mouth gap under the muzzle
    { name: "mouth", color: MOUTH, shape: { kind: "ellipsoid", at: [0, 0.54, 0.17], r: [0.1, 0.045, 0.1] }, bones: ["head"] },
    // a darker crease round the top of the muzzle
    { name: "crease", color: "#5a9a44", soft: 0.004, shape: { kind: "ellipsoid", at: [0, 0.657, 0.168], r: [0.178, 0.128, 0.128], turn: [0.25, 0, 0] }, bones: ["head"] },
    { name: "muzzleFace", color: GREEN, soft: 0.004, shape: { kind: "ellipsoid", at: [0, 0.635, 0.185], r: [0.158, 0.11, 0.12], turn: [0.25, 0, 0] }, bones: ["head"] },
    // the cream underside runs on along the segments that lie on the ground
    { name: "under", color: CREAM, shape: { kind: "ellipsoid", at: [0, 0.015, -0.36], r: [0.12, 0.06, 0.24] }, bones: ["seg3", "seg4", "seg5", "seg6"] },
    // pale rings on each segment's sides
    ...SEGS.map(([x, y, z, rx], i) => ({
      name: `ring${i + 1}`,
      color: RING,
      soft: 0.003,
      shape: { kind: "torus", R: RINGS[i], r: 0.013, at: [rx - 0.006 - RINGS[i] * RINGS[i] / (2 * rx), y + 0.01, z], turn: [0, Math.PI / 2, 0] },
      bones: [`seg${i + 1}`],
      mirror: true,
    })),
  ],
  face: {
    eyes: [
      // huge eyes on the sides of the head: a thick yellow ring round a big black pupil, one white glint up front
      { at: [-0.222, 0.79, 0.125], w: 0.17, h: 0.215, sclera: EYE, iris: DARK, irisAt: [0.06, 0.02], irisSize: [0.7, 0.72], edge: { color: "#3d5a2c", w: 0.07 }, glints: [[0.3, 0.38, 0.2]], mirror: true },
    ],
  },
};

export default recipe;
