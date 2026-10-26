// Bulbasaur (#1). Verified against art-1, home-1, GO icon pm1 and the Showdown 3D front/back (ani-bulbasaur, ani-back-bulbasaur).
// Numbers: notes/research/species-1.md (Bulbasaur) plus the corrections in notes/research/model-starters.md.
// 1 tall (bulb tip to soles), feet at y 0, facing +z, +x = its own left (the viewer's right from the front).

const SKIN = "#74c8a8";
const SPOT = "#4c9b7e";
const BULB = "#5ba35a";
const SEAM = "#3a6e3c";
const IRIS = "#d23a3a";
const CLAW = "#f4f4f6";
const DARK = "#1c1620";

const BULB_Z = -0.1;
// onion profile (r, y): base on the back at y 0.38, widest 0.335 at y 0.58-0.62, a garlic neck, point at 1.0
const BULB_PROFILE = [[0.15, 0.37], [0.25, 0.43], [0.31, 0.5], [0.335, 0.58], [0.33, 0.65], [0.3, 0.73], [0.24, 0.8], [0.16, 0.86], [0.09, 0.91], [0.055, 0.95], [0.03, 0.98], [0, 1.0]];

// ear: a small rounded triangle (u across, v up), flat face forward
const EAR = [[-0.064, -0.035], [0.064, -0.035], [0.046, 0.035], [0.014, 0.115], [-0.014, 0.115], [-0.046, 0.035]];
const EAR_AT = [0.235, 0.72, 0.2];
const EAR_TURN = [-0.1, 0.25, -0.5];

// legs: [x, z] of the front and back pairs (the +x side; mirror makes the other)
const FL = [0.21, 0.22];
const BL = [0.2, -0.26];
const leg = (name, [x, z], bone) => [
  { name: `${name}`, kind: "cone", a: [x - 0.01, 0.27, z], b: [x + 0.01, 0.07, z + 0.01], ra: 0.088, rb: 0.08, color: SKIN, bone, blend: 0.05, mirror: true },
  { name: `${name}Foot`, kind: "ellipsoid", at: [x + 0.01, 0.045, z + 0.025], r: [0.09, 0.05, 0.1], color: SKIN, bone, blend: 0.03, mirror: true },
];
const claws = (name, [x, z], bone) =>
  [-0.042, 0, 0.042].map((dx, i) => ({
    name: `${name}Claw${i}`, kind: "cone", a: [x + 0.01 + dx, 0.03, z + 0.08], b: [x + 0.01 + dx * 1.2, 0.014, z + 0.13], ra: 0.019, rb: 0.007, color: CLAW, bone, blend: 0, mirror: true,
  }));

// bulb seams: thin radial planes from the axis, every 72 degrees starting at the front
const seam = (deg) => {
  const a = (deg * Math.PI) / 180;
  return { name: `seam${deg}`, color: SEAM, shape: { kind: "box", size: [0.018, 0.66, 0.42], at: [0.21 * Math.sin(a), 0.7, BULB_Z + 0.21 * Math.cos(a)], turn: [0, a, 0] }, bones: ["bulb"] };
};

const recipe = {
  name: "Bulbasaur",
  dex: 1,
  height: 1,
  bones: {
    root: [0, 0, 0],
    head: { at: [0, 0.44, 0.12], parent: "root" },
    earL: { at: EAR_AT, parent: "head" },
    earR: { at: [-EAR_AT[0], EAR_AT[1], EAR_AT[2]], parent: "head" },
    bulb: { at: [0, 0.4, BULB_Z], parent: "root" },
    legFL: [FL[0], 0.27, FL[1]],
    legFR: [-FL[0], 0.27, FL[1]],
    legBL: [BL[0], 0.27, BL[1]],
    legBR: [-BL[0], 0.27, BL[1]],
  },
  pieces: [
    // squat body under the bulb
    { name: "body", kind: "ellipsoid", at: [0, 0.27, -0.06], r: [0.27, 0.19, 0.34], color: SKIN, bone: "root" },
    ...leg("legF", FL, "legFL"),
    ...leg("legB", BL, "legBL"),
    // big broad head in front: a round mass, a flat-topped brow box (where the ears sit) and wide cheeks/jaw
    { name: "head", kind: "ellipsoid", at: [0, 0.53, 0.22], r: [0.315, 0.235, 0.25], color: SKIN, bone: "head", blend: 0.08 },
    { name: "brow", kind: "box", size: [0.54, 0.16, 0.36], round: 0.075, at: [0, 0.67, 0.2], color: SKIN, bone: "head", blend: 0.07 },
    { name: "jaw", kind: "ellipsoid", at: [0, 0.42, 0.27], r: [0.3, 0.125, 0.21], color: SKIN, bone: "head", blend: 0.06 },
    { name: "ear", kind: "slab", outline: EAR, smooth: true, depth: 0.04, round: 0.018, at: EAR_AT, turn: EAR_TURN, color: SKIN, bone: "earL", blend: 0.03, mirror: true },
    // the onion bulb on the back, a small hard-ish join, and a split tip
    { name: "bulb", kind: "lathe", profile: BULB_PROFILE, at: [0, 0, BULB_Z], color: BULB, bone: "bulb", blend: 0.025 },
    { name: "tip", kind: "cone", a: [0, 0.95, BULB_Z], b: [0.028, 1.0, BULB_Z + 0.005], ra: 0.026, rb: 0.009, color: BULB, bone: "bulb", blend: 0.01, mirror: true },
    ...claws("front", FL, "legFL"),
    ...claws("back", BL, "legBL"),
    // flat soles
    { name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true },
  ],
  paint: [
    ...[0, 72, 144, 216, 288].map(seam),
    // big slanted forehead spot (most visible from above), a dot beside it, a small one between the eyes
    { name: "foreheadSpot", color: SPOT, shape: { kind: "box", size: [0.17, 0.07, 0.4], round: 0.03, at: [-0.02, 0.69, 0.3], turn: [-0.5, 0, 0.25] }, bones: ["head"] },
    { name: "foreheadDot", color: SPOT, shape: { kind: "ellipsoid", at: [-0.14, 0.645, 0.4], r: [0.025, 0.02, 0.1] }, bones: ["head"] },
    { name: "noseSpot", color: SPOT, shape: { kind: "ellipsoid", at: [0.01, 0.585, 0.45], r: [0.032, 0.026, 0.1] }, bones: ["head"] },
    // a spot on the outer side of each leg, one on each flank, one on the rump
    { name: "legSpotF", color: SPOT, shape: { kind: "ellipsoid", at: [FL[0] + 0.08, 0.15, FL[1] + 0.05], r: [0.06, 0.045, 0.05] }, bones: ["legFL"], mirror: true },
    { name: "legSpotB", color: SPOT, shape: { kind: "ellipsoid", at: [BL[0] + 0.08, 0.16, BL[1] - 0.02], r: [0.06, 0.05, 0.05] }, bones: ["legBL"], mirror: true },
    { name: "flankSpot", color: SPOT, shape: { kind: "ellipsoid", at: [0.26, 0.31, 0.04], r: [0.06, 0.04, 0.05] }, bones: ["root"], mirror: true },
    { name: "rumpSpot", color: SPOT, shape: { kind: "ellipsoid", at: [-0.12, 0.3, -0.38], r: [0.05, 0.045, 0.06] }, bones: ["root"] },
  ],
  face: {
    eyes: [
      // big wide eye: white crescent on the outer side, red iris toward the nose, top cut on a slant down toward the nose
      { at: [-0.2, 0.53, 0.42], w: 0.17, h: 0.15, sclera: "#ffffff", iris: IRIS, irisAt: [0.24, -0.06], irisSize: [0.74, 0.95], cut: [0.62, -0.28], edge: { color: DARK, w: 0.1 }, glints: [[0.05, 0.12, 0.2]], mirror: true },
      // the thick black upper lid along that cut (a closed "line" eye drawn on top)
      { at: [-0.2, 0.577, 0.42], w: 0.185, h: 0.15, closed: 0, thick: 0.13, sclera: DARK, turn: -0.24, mirror: true },
    ],
    mouth: [
      { kind: "smile", at: [0, 0.37, 0.44], w: 0.34, h: 0.035, thick: 0.012, color: DARK },
      // short brow strokes above the inner corners
    ],
    spots: [
      { name: "nostril", at: [-0.035, 0.425, 0.46], r: [0.009, 0.007], color: DARK, lit: false, mirror: true },
    ],
  },
};

export default recipe;
