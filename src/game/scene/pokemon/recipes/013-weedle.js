// Weedle (#13). GO stance: a big round head with the white horn on top and the big pink nose low on the face, two
// segments standing under it, then the body bends back along the ground and curls out to its left (+x) so the
// silver stinger shows beside it from the front.
// Verified against art-13, home-13, the GO icon (go256-13) and the Showdown sprites ani-weedle / aniback-weedle.
// Numbers: notes/research/species-1.md (Weedle) plus the corrections in notes/research/model-wild-1.md.
// 1 tall (horn tip to the ground), lowest point at y 0, facing +z, +x = Weedle's own left (the viewer's right).

const TAN = "#c49560";
const NOSE = "#e86a9e";
const BUMP = "#e0609a";
const HORN = "#e8ecee";
const DARK = "#1c1620";

// Body segments after the head, [x, y, z, r]: two upright, then back along the ground, curling out to +x.
const SEGS = [
  [0, 0.315, -0.02, 0.145],
  [0, 0.13, -0.075, 0.125],
  [0.015, 0.105, -0.23, 0.105],
  [0.05, 0.095, -0.365, 0.095],
  [0.1, 0.087, -0.48, 0.087],
  [0.175, 0.079, -0.575, 0.079],
  [0.255, 0.072, -0.635, 0.072],
  [0.34, 0.066, -0.665, 0.066],
];
const BUMP_R = [0.044, 0.042, 0.038, 0.036, 0.034, 0.032, 0.03, 0.029];

const nrm = (v) => {
  const l = Math.hypot(...v) || 1;
  return v.map((c) => c / l);
};
// direction along the chain at segment i (toward the tail), and the side vector (to the segment's own left)
const along = (i) => {
  const a = SEGS[Math.max(0, i - 1)], b = SEGS[Math.min(SEGS.length - 1, i + 1)];
  return nrm([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
};
const side = (i) => {
  const t = along(i);
  return nrm([-t[2], 0, t[0]]); // up x t, flattened: for t = -z this is +x
};

// a pair of pink bumps low on each segment's sides, a little toward the head
const bumps = SEGS.flatMap(([x, y, z, r], i) => {
  const s = side(i), t = along(i), br = BUMP_R[i];
  return [1, -1].map((k) => ({
    name: `bump${i + 1}${k > 0 ? "L" : "R"}`,
    kind: "sphere",
    r: br,
    at: [x + s[0] * k * r * 0.82 - t[0] * r * 0.25, y - r * 0.42, z + s[2] * k * r * 0.82 - t[2] * r * 0.25],
    color: BUMP,
    bone: `seg${i + 1}`,
    blend: 0.012,
  }));
});

const LAST = SEGS[SEGS.length - 1];
const TAIL_DIR = along(SEGS.length - 1);

const recipe = {
  name: "Weedle",
  dex: 13,
  height: 1,
  bones: {
    root: [0, 0, 0],
    ...Object.fromEntries(SEGS.map(([x, y, z], i) => [`seg${i + 1}`, { at: [x, y, z], parent: i ? `seg${i}` : "root" }])),
    head: { at: [0, 0.42, 0], parent: "seg1" },
    tail: { at: [LAST[0], LAST[1] + 0.03, LAST[2]], parent: "seg8" },
  },
  pieces: [
    // big round head
    { name: "head", kind: "ellipsoid", at: [0, 0.585, 0.02], r: [0.24, 0.232, 0.228], color: TAN, bone: "head" },
    // the huge pink nose low on the face, sticking out
    { name: "nose", kind: "ellipsoid", at: [0, 0.525, 0.215], r: [0.112, 0.08, 0.075], turn: [-0.2, 0, 0], color: NOSE, bone: "head", blend: 0.02 },
    // the white horn on top, a touch back, nearly upright
    { name: "horn", kind: "cone", a: [0, 0.79, -0.02], b: [0, 0.988, -0.055], ra: 0.064, rb: 0.012, color: HORN, bone: "head", blend: 0.012 },
    // segments, each on its own bone
    ...SEGS.map(([x, y, z, r], i) => ({ name: `seg${i + 1}`, kind: "sphere", at: [x, y, z], r, color: TAN, bone: `seg${i + 1}`, blend: i === 0 ? 0.04 : 0.012 })),
    ...bumps,
    // the silver stinger: a curved hook off the last segment, rising along the tail's line
    {
      name: "sting",
      kind: "chain",
      points: [
        [LAST[0] + TAIL_DIR[0] * 0.02, LAST[1] + 0.02, LAST[2] + TAIL_DIR[2] * 0.02, 0.042],
        [LAST[0] + TAIL_DIR[0] * 0.07, LAST[1] + 0.07, LAST[2] + TAIL_DIR[2] * 0.07, 0.03],
        [LAST[0] + TAIL_DIR[0] * 0.11, LAST[1] + 0.13, LAST[2] + TAIL_DIR[2] * 0.11, 0.019],
        [LAST[0] + TAIL_DIR[0] * 0.15, LAST[1] + 0.165, LAST[2] + TAIL_DIR[2] * 0.15, 0.011],
      ],
      color: HORN,
      bone: "tail",
      blend: 0.012,
    },
    { name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true },
  ],
  face: {
    eyes: [
      // tiny black eyes set high beside the nose, one white glint
      { at: [-0.145, 0.65, 0.185], w: 0.05, h: 0.058, sclera: DARK, glints: [[0.15, 0.35, 0.36]], mirror: true },
    ],
  },
};

export default recipe;
