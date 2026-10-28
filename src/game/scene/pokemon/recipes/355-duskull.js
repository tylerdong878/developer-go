// Duskull (#355). GO pose: floating, the skull mask forward, the hood's tip curling up and back, the cloak trailing
// into a wisp behind and below.
// Checked against art-355, home-355 and the Showdown 3D front/back (ani-duskull, ani-back-duskull) in
// .cache/research/models/ref.
// 1 tall (wisp bottom to the tip of the curl), facing +z, +x = Duskull's own left (the viewer's right).
// The mask is a white shell hard-unioned onto the hood so its edge stays crisp; its two sockets are paint, and the
// one red eye sits in its own left socket (the Showdown front).

const GRAY = "#5e5d5b";
const DARK_GRAY = "#4b4a49";
const MASK = "#ece6cf";
const BONE = "#cdc6ae";
const SOCKET = "#1d1b1e";
const RED = "#e2445c";
const PINK = "#f7a3b5";

const HEAD = [0, 0.55, -0.03];

const recipe = {
  name: "Duskull",
  dex: 355,
  height: 1,
  bones: {
    root: [0, 0, 0],
    body: { at: [0, 0.4, -0.04], parent: "root" },
    head: { at: [0, 0.5, 0], parent: "body" },
    crown: { at: [0, 0.82, -0.06], parent: "head" },
    armL: { at: [0.27, 0.44, -0.02], parent: "body" },
    armR: { at: [-0.27, 0.44, -0.02], parent: "body" },
    tail: { at: [0, 0.22, -0.12], parent: "body" },
  },
  pieces: [
    // the hood: a big round cowl, a little deeper than wide
    { name: "hood", kind: "ellipsoid", at: HEAD, r: [0.33, 0.32, 0.33], color: GRAY, bone: "head" },
    // the tip on top, rising and curling back like a flame
    { name: "crown", kind: "chain", points: [[0, 0.78, -0.05, 0.13], [0, 0.89, -0.06, 0.075], [0.01, 0.96, -0.11, 0.045], [0.015, 0.985, -0.18, 0.024], [0.01, 0.955, -0.235, 0.012]], smooth: 0.03, color: GRAY, bone: "crown", blend: 0.07, squash: { axis: [1, 0, 0], k: 0.7 } },
    // the cloak under the hood, narrowing to a wisp that trails back and down
    { name: "cloak", kind: "ellipsoid", at: [0, 0.33, -0.1], r: [0.27, 0.22, 0.29], color: GRAY, bone: "body", blend: 0.1 },
    { name: "wisp", kind: "chain", points: [[0, 0.22, -0.12, 0.17], [0, 0.11, -0.2, 0.1], [0, 0.045, -0.3, 0.05], [0, 0.03, -0.39, 0.018]], smooth: 0.04, color: GRAY, bone: "tail", blend: 0.08, squash: { axis: [1, 0, 0], k: 0.65 } },
    // the hem's front point, under the mask
    { name: "hem", kind: "cone", a: [0, 0.24, 0.06], b: [0.03, 0.12, 0.08], ra: 0.1, rb: 0.025, color: GRAY, bone: "body", blend: 0.08 },
    // little cloak sleeves on each side, drooping back
    { name: "sleeve", kind: "cone", a: [0.27, 0.45, -0.04], b: [0.35, 0.3, -0.12], ra: 0.11, rb: 0.04, color: DARK_GRAY, bone: "armL", blend: 0.05, mirror: true },
    // the skull mask: a white shell bulging out of the front of the hood, hard-unioned for a crisp rim
    { name: "mask", kind: "ellipsoid", at: [0, 0.52, 0.12], r: [0.28, 0.3, 0.245], color: MASK, bone: "head" },
    // the jaw below the hood's rim, and its teeth
    { name: "jaw", kind: "box", size: [0.3, 0.12, 0.12], round: 0.04, at: [0, 0.3, 0.26], turn: [0.2, 0, 0], color: MASK, bone: "head" },
    ...[-0.105, -0.035, 0.035, 0.105].map((x, i) => ({ name: `tooth${i}`, kind: "box", size: [0.06, 0.09, 0.09], round: 0.025, at: [x, 0.235, 0.275 - Math.abs(x) * 0.25], turn: [0.25, 0, 0], color: MASK, bone: "head" })),
  ],
  paint: [
    // the two eye sockets, dark and oval, a little up from the middle of the mask
    { name: "socket", color: SOCKET, shape: { kind: "ellipsoid", at: [0.105, 0.55, 0.35], r: [0.09, 0.105, 0.2] }, bones: ["head"], mirror: true },
    // the gaps between the teeth
    ...[-0.07, 0, 0.07].map((x, i) => ({ name: `gap${i}`, color: SOCKET, shape: { kind: "box", size: [0.012, 0.11, 0.3], at: [x, 0.23, 0.27] }, bones: ["head"] })),
    // two pale bones across the back of the hood: a band with a knob at each end
    ...[[0.66, 0.0], [0.5, 0.1]].flatMap(([y, tilt], i) => [
      { name: `bone${i}`, color: BONE, shape: { kind: "box", size: [0.42, 0.05, 0.3], at: [0, y, -0.3], turn: [tilt, 0, 0] }, bones: ["head"] },
      { name: `boneKnob${i}`, color: BONE, shape: { kind: "sphere", at: [0.2, y + 0.005, -0.25], r: 0.055 }, bones: ["head"], mirror: true },
    ]),
  ],
  face: {
    eyes: [
      // the one eye, in its own left socket: red, a pink ring, red again and a white point in the middle
      { name: "eye", at: [0.105, 0.55, 0.36], w: 0.115, h: 0.115, sclera: RED, iris: PINK, irisAt: [0, 0], irisSize: [0.66, 0.66], pupil: RED, pupilSize: [0.4, 0.4], glints: [[0, 0, 0.26]], lit: true },
    ],
  },
};

export default recipe;
