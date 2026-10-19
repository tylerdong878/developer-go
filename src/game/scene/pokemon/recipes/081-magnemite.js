// Magnemite (#81). A steel ball with one big eye, a screw on top, two Phillips screws low on the front, and two horseshoe
// magnets floating level beside it. Everything hard-unioned (blend 0): it's a machine, the joins should read as parts.
// Shapes from GO's icon (PokeMiners pm81: magnets level and mirrored, eye centered) with HOME and the art for the parts.
// A floater: y 0 = the bottom of the sphere, y 1 = the top of the screw head. Facing +z, +x = the viewer's right.
// Metallic look: GO uses brdf_Mask_Metal on ~190 rigs; see the material note at the bottom (the preview shader can't do it).

const STEEL = "#a9cbd6"; // art #a1c1cb, GO icon lit #abd6dd; Serebii's dark #4f545a is a render without reflections
const SCREW = "#7a808c"; // GO head #7a838d, shaft #6a6e7d
const THREAD = "#545864";
const MAGNET = "#c4cdd8"; // GO lit #d5e6ff
const RED = "#dd5a50"; // GO #dd6c5c lit, #a04f40 shade
const BLUE = "#3fb0e6"; // GO #75d5ff lit, #49b3da
const DARK = "#1c1620";

const C = [0, 0.32, 0]; // sphere center
const R = 0.32;

// a point on the sphere at longitude lon (from +z toward +x) and latitude lat, pushed out by `out`
const onBall = (lon, lat, out = 0) => {
  const a = (lon * Math.PI) / 180, b = (lat * Math.PI) / 180;
  return [C[0] + Math.sin(a) * Math.cos(b) * (R + out), C[1] + Math.sin(b) * (R + out), C[2] + Math.cos(a) * Math.cos(b) * (R + out)];
};
// euler XYZ that turns local +z onto the sphere normal at (lon, lat): R*(0,0,1) = (sy, -sx*cy, cx*cy)
const faceOut = (lon, lat) => {
  const a = (lon * Math.PI) / 180, b = (lat * Math.PI) / 180;
  const n = [Math.sin(a) * Math.cos(b), Math.sin(b), Math.cos(a) * Math.cos(b)];
  const y = Math.asin(n[0]), cy = Math.cos(y);
  return [Math.atan2(-n[1] / cy, n[2] / cy), y, 0];
};

// Horseshoe magnet outline in its own (u, v) plane: the bend at u > 0 (toward the body), the arms out to u = -ARM.
// Square bar: OUT - IN = 0.085 wide, and the slab is 0.085 deep.
const OUT = 0.135, IN = 0.05, ARM = 0.36;
const arc = (r, from, to, n = 10) => Array.from({ length: n + 1 }, (_, i) => {
  const t = from + ((to - from) * i) / n;
  return [r * Math.sin(t), r * Math.cos(t)];
});
const U = [[-ARM, OUT], ...arc(OUT, 0, Math.PI), [-ARM, -OUT], [-ARM, -IN], ...arc(IN, Math.PI, 0), [-ARM, IN]];
const MAG_AT = [-0.45, 0.375, 0]; // viewer's-left magnet (Magnemite's own right): bend center
const TIP = 0.12; // colored length at each arm's end

const SCREWS = [55, -55]; // lower screws, longitude; latitude -38
const LAT = -38;

const recipe = {
  name: "Magnemite",
  dex: 81,
  height: 1,
  bones: {
    root: [0, 0, 0],
    body: { at: C, parent: "root" },
    screw: { at: [0, 0.62, 0], parent: "body" }, // spins about y
    magnetR: { at: MAG_AT, parent: "body" }, // viewer's left; rocks about x
    magnetL: { at: [-MAG_AT[0], MAG_AT[1], MAG_AT[2]], parent: "body" },
  },
  pieces: [
    { name: "ball", kind: "sphere", at: C, r: R, color: STEEL, bone: "body" },
    // the eye bulges a little, like a lens
    { name: "lens", kind: "ellipsoid", at: [0, 0.345, 0.27], r: [0.14, 0.14, 0.07], color: "#ffffff", bone: "body", blend: 0.015 },
    // top screw: threaded shaft and a pan head with a low dome
    { name: "shaft", kind: "cone", a: [0, 0.6, 0], b: [0, 0.895, 0], r: 0.042, color: SCREW, bone: "screw" },
    { name: "head", kind: "lathe", profile: [[0, 0.885], [0.148, 0.885], [0.152, 0.915], [0.135, 0.955], [0.075, 0.985], [0, 0.995]], color: SCREW, bone: "screw" },
    // two Phillips screws low on the front, standing a little proud of the surface
    SCREWS.map((lon, i) => ({ name: `screw${i}`, kind: "ellipsoid", at: onBall(lon, LAT, 0.012), r: [0.056, 0.056, 0.024], turn: faceOut(lon, LAT), color: SCREW, bone: "body" })),
    // horseshoe magnets, level, bend toward the body, open end out
    { name: "magnet", kind: "slab", outline: U, depth: 0.085, round: 0.012, at: MAG_AT, color: MAGNET, bone: "magnetR", mirror: true },
  ],
  paint: [
    // tips: viewer's-left magnet red over blue, viewer's-right blue over red (point-symmetric, all refs agree)
    { name: "tipRU", color: RED, shape: { kind: "box", at: [MAG_AT[0] - ARM + TIP / 2 - 0.02, MAG_AT[1] + (OUT + IN) / 2, 0], size: [TIP + 0.04, 0.12, 0.14] }, bones: ["magnetR"] },
    { name: "tipRD", color: BLUE, shape: { kind: "box", at: [MAG_AT[0] - ARM + TIP / 2 - 0.02, MAG_AT[1] - (OUT + IN) / 2, 0], size: [TIP + 0.04, 0.12, 0.14] }, bones: ["magnetR"] },
    { name: "tipLU", color: BLUE, shape: { kind: "box", at: [-MAG_AT[0] + ARM - TIP / 2 + 0.02, MAG_AT[1] + (OUT + IN) / 2, 0], size: [TIP + 0.04, 0.12, 0.14] }, bones: ["magnetL"] },
    { name: "tipLD", color: RED, shape: { kind: "box", at: [-MAG_AT[0] + ARM - TIP / 2 + 0.02, MAG_AT[1] - (OUT + IN) / 2, 0], size: [TIP + 0.04, 0.12, 0.14] }, bones: ["magnetL"] },
    // thread bands on the shaft, slightly tilted so they read as a helix
    [0.67, 0.72, 0.77, 0.82].map((y, i) => ({ name: `thread${i}`, color: THREAD, shape: { kind: "box", at: [0, y, 0], size: [0.2, 0.022, 0.2], turn: [0, 0, 0.12] }, bones: ["screw"] })),
  ],
  face: {
    eyes: [
      // one big white eye, thick dark rim, a tiny dark pupil dead center (drawn as a dark "glint")
      { at: [0, 0.345, 0.34], w: 0.27, h: 0.27, sclera: "#ffffff", edge: { color: DARK, w: 0.13 }, glints: [[0, 0, 0.1]], glintColor: DARK },
    ],
    // Phillips crosses on the two lower screw heads (two short lines each), lit so they shade with the metal
    mouths: SCREWS.flatMap((lon) => [0.785, -0.785].map((t) => ({ kind: "line", at: onBall(lon, LAT, 0.036), dir: onBall(lon, LAT, 1).map((v, k) => v - C[k]), turn: t, w: 0.06, h: 0.01, thick: 0.012, color: "#3a3c44", lit: true }))),
  },
};

export default recipe;
