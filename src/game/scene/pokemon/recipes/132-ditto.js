// Ditto (#132). One soft lavender mass with a lumpy skirt, a raised "hand" lobe on the viewer's left, the dot-and-line face.
// Shape from GO's own icon (PokeMiners pm132, 256 px) and HOME; depth from the 3D back sprite (Showdown ani-back) [estimate].
// 1 tall (top hump to the floor), facing +z, +x = Ditto's own left (the viewer's right). About 1.14 wide, 0.8 deep.
// Preview: node .cache/tools/sdf/preview.mjs .cache/research/models/recipes/132-ditto.mjs .cache/research/models/previews/132-ditto.png --ref ...

const LAV = "#cdb0f0"; // GO icon lit #f0c7fe, mid #e2c4f8, shadow #a36fb8; HOME mid #d1b7ff
const DARK = "#1c1620";
const LINE = "#4a2f52"; // closed mouth line

// soft lumps around the skirt edge: [angle around y from +z (deg), radius out, height, size]
const LUMPS = [
  [-40, 0.36, 0.12, 0.1],
  [35, 0.38, 0.11, 0.1],
  [-140, 0.34, 0.12, 0.1],
  [145, 0.35, 0.11, 0.1],
];
const lump = ([a, r, y, s], i) => {
  const t = (a * Math.PI) / 180;
  return { name: `lump${i}`, kind: "ellipsoid", at: [Math.sin(t) * r * 1.15, y, Math.cos(t) * r * 0.85], r: [s, s * 0.8, s], color: LAV, bone: "root", blend: 0.1 };
};

const recipe = {
  name: "Ditto",
  dex: 132,
  height: 1,
  bones: {
    root: [0, 0, 0],
    body: { at: [0, 0.3, 0], parent: "root" }, // squash pivot is the floor; this bone only takes the upper wobble
    top: { at: [-0.02, 0.62, -0.02], parent: "body" },
    armR: { at: [-0.33, 0.64, 0], parent: "top" }, // the raised lobe, viewer's left (Ditto's own right)
    armL: { at: [0.36, 0.56, 0], parent: "top" }, // the low shoulder lobe, viewer's right
  },
  pieces: [
    // skirt: wide and low, it spreads past the waist and curls under to the floor
    { name: "foot", kind: "ellipsoid", at: [0.02, 0.1, 0], r: [0.42, 0.1, 0.33], color: LAV, bone: "root" },
    { name: "base", kind: "ellipsoid", at: [0.01, 0.26, 0], r: [0.555, 0.26, 0.39], color: LAV, bone: "root", blend: 0.12 },
    LUMPS.map(lump),
    // upper mass, a little narrower (the waist)
    { name: "upper", kind: "ellipsoid", at: [-0.03, 0.61, -0.02], r: [0.4, 0.26, 0.31], color: LAV, bone: "top", blend: 0.24 },
    // top humps: the center one is as high as the lobe, the right one lower
    { name: "humpC", kind: "ellipsoid", at: [-0.04, 0.85, -0.03], r: [0.16, 0.14, 0.16], color: LAV, bone: "top", blend: 0.1 },
    { name: "humpR", kind: "ellipsoid", at: [0.16, 0.8, -0.05], r: [0.15, 0.1, 0.14], color: LAV, bone: "top", blend: 0.09 },
    // the raised "hand" on the viewer's left, a fat finger leaning out a little
    { name: "lobeR", kind: "cone", a: [-0.34, 0.6, 0], b: [-0.42, 0.885, 0], ra: 0.12, rb: 0.088, color: LAV, bone: "armR", blend: 0.07 },
    // the low shoulder nub on the viewer's right, pointing up and out
    { name: "lobeL", kind: "cone", a: [0.33, 0.55, 0], b: [0.46, 0.67, 0], ra: 0.12, rb: 0.095, color: LAV, bone: "armL", blend: 0.09 },
    // flat where it sits
    { name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true, blend: 0.03 },
  ],
  paint: [],
  face: {
    eyes: [
      // tiny black dots, close together, the face a little to the viewer's left
      { at: [-0.19, 0.75, 0.31], w: 0.026, h: 0.03, sclera: DARK },
      { at: [0.05, 0.745, 0.31], w: 0.026, h: 0.03, sclera: DARK },
    ],
    // long thin line, much wider than the eye spacing, corners lifted a hair
    mouth: { kind: "smile", at: [-0.06, 0.675, 0.33], w: 0.44, h: 0.018, thick: 0.011, color: LINE },
  },
};

export default recipe;
