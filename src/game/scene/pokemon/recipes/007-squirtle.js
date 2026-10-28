// Squirtle (#7). Checked against art-7, home-7, the GO icon (refs/go-7.png) and the Showdown 3D front/back
// (ani-squirtle, ani-back-squirtle).
// Numbers: notes/research/species-1.md (Squirtle) plus the corrections in notes/research/model-starters.md.
// 1 tall (head top to soles), feet at y 0, facing +z, +x = Squirtle's own left (the viewer's right).
// GO pose (icon, HOME and art agree): its right arm out to the side, its left arm bent down and forward.
// From GO's high camera the shell is the identity: a brown dome over the whole back, edged in white, the head on top.

const SKIN = "#74c6e8";
const PLASTRON = "#f3e0a8";
const CARAPACE = "#a0663a";
const RIM = "#e8eaee";
const SEAM = "#7a5a30";
const PLATE = "#7e4c28";
const CURL = "#3f93b8";
const IRIS = "#8e2f55";
const DARK = "#1c1620";

// ---- tail: a fat tube from under the shell, back along the bottom of the curl, up the back, over and in.
// The curl lies in the y-z plane (its spiral faces the sides). The turns merge into one fat snail-like disc, so the
// spiral line is drawn: quarter-circle arcs (frown strokes) chained like a golden spiral, on the +x side (mirrored).
const CURL_C = [0.235, -0.405]; // (y, z) of the curl's center
const tailPoints = () => {
  const pts = [
    [0, 0.21, -0.17, 0.075],
    [0, 0.165, -0.26, 0.07],
    [0, 0.148, -0.33, 0.066],
  ];
  const n = 15, a0 = -Math.PI / 2, turns = 1.22;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = a0 - t * turns * 2 * Math.PI; // bottom -> back -> top -> front -> in
    const R = 0.088 * (1 - 0.86 * t);
    const r = 0.064 - 0.03 * t;
    pts.push([0, CURL_C[0] + R * Math.sin(a), CURL_C[1] + R * Math.cos(a), r]);
  }
  return pts;
};
const TAIL = tailPoints();
// spiral line: arc k is a quarter circle of radius rho[k]; each next arc's center slides toward the last arc's end
// so the line stays smooth. Direction phi is in the (z, y) side plane: 0 = forward (+z), 90 deg = up.
const spiral = () => {
  const out = [];
  const rho = [0.082, 0.066, 0.052, 0.04, 0.029];
  let c = [CURL_C[1] + 0.006, CURL_C[0] + 0.004]; // (z, y)
  let phi = -60;
  rho.forEach((r, k) => {
    const mid = ((phi - 45) * Math.PI) / 180, end = ((phi - 90) * Math.PI) / 180;
    const m = 0.854 * r;
    // decal frame on the +x face (dir +x): u = -z, v = +y, so turn = 90 deg - mid puts a frown's apex along mid
    out.push({ kind: "frown", at: [0.09, c[1] + m * Math.sin(mid), c[0] + m * Math.cos(mid)], dir: [1, 0, 0], w: 1.414 * r, h: 0.293 * r, thick: 0.011, turn: Math.PI / 2 - mid, color: CURL, lit: true, mirror: true });
    const next = rho[k + 1];
    if (next) c = [c[0] + (r - next) * Math.cos(end), c[1] + (r - next) * Math.sin(end)];
    phi -= 90;
  });
  return out;
};

// ---- limbs
const ARM_R = { a: [-0.165, 0.585, 0.03], b: [-0.345, 0.56, 0.085] }; // its right arm, out to the side
const ARM_L = { a: [0.165, 0.585, 0.035], b: [0.255, 0.45, 0.16] }; // its left arm, down and forward
const LEG = { a: [0.13, 0.25, 0.0], b: [0.15, 0.07, 0.035] };
const FOOT = { at: [0.155, 0.035, 0.065], r: [0.08, 0.04, 0.1], yaw: 0.22 };
const toes = () =>
  [-0.042, 0, 0.042].map((dx, i) => {
    const c = Math.cos(FOOT.yaw), s = Math.sin(FOOT.yaw), lz = 0.088;
    return { name: `toe${i}`, kind: "ellipsoid", at: [FOOT.at[0] + dx * c + lz * s, 0.03, FOOT.at[2] - dx * s + lz * c], r: [0.03, 0.028, 0.032], color: SKIN, bone: "legL", blend: 0.015, mirror: true };
  });

// rim band in the side plane, (z, y): front edge tucked under the plastron's edge, back edge just past the widest point
const RIM_BAND = [[0.105, 0.505], [0.122, 0.42], [0.118, 0.34], [0.095, 0.285], [0.055, 0.268], [0.025, 0.3], [0.018, 0.4], [0.028, 0.485], [0.06, 0.522]];

// a seam stroke on the plastron or a plate line on the carapace (lit decals: they shade with the shell), thick enough
// to stay smooth up close (model-audit.md, smaller notes)
const stroke = (kind, at, w, h, turn = 0, color = SEAM, thick = 0.011) => ({ kind, at, w, h, thick, turn, color, lit: true });

const recipe = {
  name: "Squirtle",
  dex: 7,
  height: 1,
  bones: {
    root: [0, 0, 0],
    body: { at: [0, 0.2, 0], parent: "root" },
    head: { at: [0, 0.64, 0.02], parent: "body" },
    armL: { at: ARM_L.a, parent: "body" },
    armR: { at: ARM_R.a, parent: "body" },
    legL: { at: [LEG.a[0], LEG.a[1], LEG.a[2]], parent: "root" },
    legR: { at: [-LEG.a[0], LEG.a[1], LEG.a[2]], parent: "root" },
    tail: { at: [0, 0.2, -0.18], parent: "body" },
  },
  pieces: [
    // the shell: a core, the domed carapace bulging out behind, a flatter plastron in front. All skin-colored:
    // the paint (limited to the body bone) colors it, so its edges are crisp where the limbs and head join.
    { name: "shell", kind: "ellipsoid", at: [0, 0.42, -0.02], r: [0.21, 0.27, 0.2], color: SKIN, bone: "body" },
    { name: "carapace", kind: "ellipsoid", at: [0, 0.445, -0.07], r: [0.205, 0.275, 0.2], turn: [-0.12, 0, 0], color: SKIN, bone: "body", blend: 0.04 },
    { name: "plastron", kind: "ellipsoid", at: [0, 0.4, 0.03], r: [0.18, 0.245, 0.155], color: SKIN, bone: "body", blend: 0.04 },
    // big round head, a bit wider than tall, sat right on the shell; the snout and upper lip push forward
    { name: "head", kind: "ellipsoid", at: [0, 0.81, 0.02], r: [0.22, 0.19, 0.2], color: SKIN, bone: "head", blend: 0.04 },
    { name: "snout", kind: "ellipsoid", at: [0, 0.765, 0.12], r: [0.15, 0.062, 0.128], color: SKIN, bone: "head", blend: 0.04 },
    // thick arms from the shoulders, right under the head; rounded mitts
    { name: "armR", kind: "cone", a: ARM_R.a, b: ARM_R.b, ra: 0.058, rb: 0.05, color: SKIN, bone: "armR", blend: 0.03 },
    { name: "handR", kind: "ellipsoid", at: [-0.36, 0.556, 0.09], r: [0.058, 0.05, 0.054], turn: [0, 0, 0.1], color: SKIN, bone: "armR", blend: 0.02 },
    { name: "armL", kind: "cone", a: ARM_L.a, b: ARM_L.b, ra: 0.058, rb: 0.05, color: SKIN, bone: "armL", blend: 0.03 },
    { name: "handL", kind: "ellipsoid", at: [0.262, 0.432, 0.175], r: [0.05, 0.055, 0.05], color: SKIN, bone: "armL", blend: 0.02 },
    // thick short legs, flat feet with three round toes
    { name: "leg", kind: "cone", a: LEG.a, b: LEG.b, ra: 0.088, rb: 0.075, color: SKIN, bone: "legL", blend: 0.04, mirror: true },
    { name: "foot", kind: "ellipsoid", at: FOOT.at, r: FOOT.r, turn: [0, FOOT.yaw, 0], color: SKIN, bone: "legL", blend: 0.03, mirror: true },
    ...toes(),
    // the big curly tail
    { name: "tail", kind: "chain", points: TAIL, smooth: 0.015, color: SKIN, bone: "tail", blend: 0.04 },
    { name: "floor", kind: "half", at: [0, 0, 0], dir: [0, -1, 0], carve: true },
  ],
  paint: [
    // brown: the shell and carapace pieces inflated by 0.014, so the paint covers the shell's own surface and stops
    // crisply where the head, arms, legs and tail leave it (a bone-limited paint would stair-step there)
    { name: "carapace", color: CARAPACE, shape: { kind: "ellipsoid", at: [0, 0.42, -0.02], r: [0.224, 0.284, 0.214] } },
    { name: "carapaceDome", color: CARAPACE, shape: { kind: "ellipsoid", at: [0, 0.445, -0.07], r: [0.219, 0.289, 0.214], turn: [-0.12, 0, 0] } },
    // the white rim (the bridge): a band down each side at the shell's widest point, from under the arm to above the
    // leg, so it shows from the front 3/4 and from behind. A side-plane slab through both sides, clear of the limbs.
    { name: "rim", color: RIM, shape: { kind: "slab", outline: RIM_BAND, smooth: true, depth: 1, at: [0, 0, 0], turn: [0, -Math.PI / 2, 0] }, bones: ["body"] },
    // the cream plastron in front, its edge meeting the band
    { name: "plastron", color: PLASTRON, shape: { kind: "ellipsoid", at: [0, 0.4, 0.18], r: [0.225, 0.248, 0.19] } },
  ],
  face: {
    eyes: [
      // big ovals (w/h 0.7) about 32 degrees round the face, black above, a maroon band in the bottom 45%,
      // a big glint up and out, a small one low and in
      { at: [-0.115, 0.85, 0.19], w: 0.1, h: 0.148, sclera: DARK, iris: IRIS, band: -0.1, glints: [[-0.2, 0.42, 0.34], [0.35, -0.6, 0.13]], mirror: true },
    ],
    mouth: [
      // a wide smile along the bottom of the snout, turning up at the ends
      { kind: "smile", at: [0, 0.728, 0.23], w: 0.25, h: 0.035, thick: 0.011, color: DARK },
      // short brows over the eyes
      { kind: "frown", at: [-0.105, 0.94, 0.165], w: 0.045, h: 0.01, thick: 0.009, turn: -0.15, color: DARK, mirror: true },
      // plastron seams: the top band, the center column split in four, the bowed side seams
      stroke("smile", [0, 0.545, 0.18], 0.27, 0.025),
      stroke("line", [0, 0.375, 0.2], 0.33, 0.01, Math.PI / 2),
      stroke("line", [0, 0.385, 0.2], 0.25, 0.01, 0.0),
      stroke("smile", [0, 0.245, 0.19], 0.18, 0.02),
      stroke("smile", [-0.125, 0.385, 0.165], 0.33, 0.03, -Math.PI / 2),
      stroke("smile", [0.125, 0.385, 0.165], 0.33, 0.03, Math.PI / 2),
      // faint plate lines on the carapace (Showdown back): a center seam, an arc across the upper back, a V below
      stroke("line", [0, 0.47, -0.27], 0.26, 0.01, Math.PI / 2, PLATE, 0.009),
      stroke("frown", [0, 0.56, -0.25], 0.26, 0.03, 0, PLATE, 0.009),
      stroke("line", [-0.075, 0.33, -0.25], 0.17, 0.01, -0.75, PLATE, 0.009),
      stroke("line", [0.075, 0.33, -0.25], 0.17, 0.01, 0.75, PLATE, 0.009),
      // the spiral line on both faces of the tail curl
      ...spiral(),
    ],
    spots: [
      { name: "nostril", at: [-0.026, 0.775, 0.245], r: [0.008, 0.006], color: DARK, lit: false, mirror: true },
    ],
  },
};

export default recipe;
