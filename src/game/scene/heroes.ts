/*
 * The job buildings, from our own kit (notes/research/gfx-buildings.md 7.1-7.5),
 * each recognizable but Pokémon-ified, with the Paldea gym grammar: the
 * employer's own building wears a big round emblem disc on the face that
 * looks at its gym, low enough (3 to 9 m) to sit in the camera's frame.
 * Glyphs are our own simple shapes, never company logos.
 */

/** One kit box, in the building's own frame (front toward +z, ground at y 0). Facade is [bay, floor, ground floor, style]. */
export type Box = {
  at: [number, number, number];
  size: [number, number, number];
  round: [number, number, number];
  facade: [number, number, number, number];
  color: string;
  glass?: string;
  trim?: string;
};

/** Facade styles the block shader knows. */
export const STYLE = { punched: 0, curtain: 1, blank: 2, tall: 3, brick: 4, glow: 5 } as const;

/** A disc emblem on a face: where (building frame), how big, its colors and glyph. */
export type Disc = { at: [number, number, number]; size: number; ring: string; arc: string; glyph: Glyph; ink: string };
export type Glyph = "cloud" | "book" | "pulse" | "letterT" | "spark" | "bars" | "house";

export type Hero = { boxes: Box[]; discs: Disc[] };

const blank = (size: Box["size"], at: Box["at"], color: string, round: Box["round"] = [0.12, 0.08, 0.12]): Box => ({
  at,
  size,
  round,
  facade: [1, 1, 0, STYLE.blank],
  color,
});
const glow = (size: Box["size"], at: Box["at"], color: string, round: Box["round"] = [0.12, 0.08, 0.12]): Box => ({
  ...blank(size, at, color, round),
  facade: [1, 1, 0, STYLE.glow],
});
const door = (x: number, z: number, glass: string, trim: string, w = 3, h = 2.9): Box => ({
  at: [x, h / 2, z],
  size: [w, h, 0.4],
  round: [0.12, 0.12, 0.08],
  facade: [w * 0.75, h - 1.1, 0.15, STYLE.curtain],
  color: trim,
  glass,
  trim,
});
const roofUnit = (x: number, y: number, z: number): Box => blank([2.4, 1.1, 1.8], [x, y + 0.55, z], "#dfe3ea", [0.3, 0.3, 0.3]);

function aws(W: number, D: number): Hero {
  const boxes: Box[] = [
    blank([W + 0.4, 0.5, D + 0.4], [0, 0.25, 0], "#2e3442", [1.1, 0.1, 1.1]),
    { at: [0, 4.2, 0], size: [W, 8.4, D], round: [1.2, 0.2, 1.2], facade: [1.5, 4, 4.4, STYLE.curtain], color: "#39465e", glass: "#8cc4ee", trim: "#2b3446" },
    blank([7.5, 0.35, 2.4], [0, 4.55, D / 2 + 1.1], "#f4f6f8", [0.3, 0.1, 0.3]),
    door(0, D / 2 + 0.12, "#bfe3f7", "#2b3446"),
    blank([2.4, 0.8, 1.1], [-4.4, 0.4, D / 2 + 0.9], "#c9c2b6"),
    blank([2.4, 0.8, 1.1], [4.4, 0.4, D / 2 + 0.9], "#c9c2b6"),
    blank([5.6, 4.2, 0.25], [0, 6.7, D / 2 + 0.12], "#f4f6f8", [0.6, 0.6, 0.1]),
  ];
  // four glass trays, shifting against each other, a warm wood soffit under each (111 Harbor Way)
  for (let k = 0; k < 4; k++) {
    const s = k % 2 ? -1 : 1;
    boxes.push({ at: [s * 0.8, 11.5 + 6.2 * k, s * 0.6], size: [W, 6.2, D], round: [1.4, 0.3, 1.4], facade: [1.5, 3.1, 0, STYLE.curtain], color: "#34425e", glass: "#7fb2e6", trim: "#34425e" });
    boxes.push(glow([W + 0.3, 0.35, D + 0.3], [s * 0.8, 8.4 + 6.2 * k, s * 0.6], "#e0874a", [1.4, 0.08, 1.4]));
  }
  boxes.push(blank([W + 0.6, 1, D + 0.6], [0, 33.7, 0], "#f4f6f8", [1.6, 0.3, 1.6]));
  boxes.push(glow([W + 0.7, 0.2, D + 0.7], [0, 33.1, 0], "#ffb347", [1.6, 0.08, 1.6]));
  boxes.push(roofUnit(-2.6, 34.2, -1.5), roofUnit(2.6, 34.2, -1.5));
  // the AWS orange in the middle is the one brand nod (include then prune)
  return { boxes, discs: [{ at: [0, 6.7, D / 2 + 0.27], size: 4.4, ring: "#e8ecf2", arc: "#0474f4", glyph: "cloud", ink: "#ff9900" }] };
}

function khoury(W: number, D: number, H: number): Hero {
  const wing = W * 0.34;
  const boxes: Box[] = [];
  for (let i = 0; i < 3; i++) boxes.push(blank([7 - 0.6 * i, 0.18, 1.4], [0, 0.09 + 0.18 * i, D / 2 + 2.2 - 0.45 * i], "#e3ddd2"));
  boxes.push(blank([W + 0.3, 1.2, D + 0.3], [0, 0.6, 0], "#efe6d6", [0.4, 0.1, 0.4]));
  for (const s of [-1, 1])
    boxes.push({ at: [s * (W / 2 - wing / 2), (H - 0.2) / 2, 0], size: [wing, H - 0.2, D], round: [0.35, 0.12, 0.35], facade: [2.4, 3.2, 4.4, STYLE.brick], color: "#c0624a", glass: "#7fb0e0", trim: "#f4ecdf" });
  // the glass spine, a little proud (West Village H's glass wall)
  boxes.push({ at: [0, (H - 0.2) / 2, 0.4], size: [W * 0.32, H - 0.2, D], round: [0.1, 0.1, 0.1], facade: [1.25, 3.2, 4.4, STYLE.curtain], color: "#f4f6f8", glass: "#8cc4ee", trim: "#f4f6f8" });
  boxes.push(blank([W + 0.2, 0.25, D + 0.2], [0, 4.5, 0], "#efe6d6"), blank([W + 0.2, 0.25, D + 0.2], [0, 11.6, 0], "#efe6d6"));
  boxes.push(blank([W + 0.6, 0.6, D + 0.6], [0, H - 0.3, 0], "#efe6d6", [0.5, 0.2, 0.5]));
  boxes.push(blank([3.8, 4.2, 0.4], [0, 2.1, D / 2 + 0.6], "#efe6d6", [0.6, 0.6, 0.1]));
  boxes.push(door(0, D / 2 + 0.85, "#9fd0f0", "#1f2a3a", 2.8, 3));
  for (const s of [-1, 1]) boxes.push(blank([0.9, 3.2, 0.08], [s * 3.3, 9, D / 2 + 0.5], "#c8102e", [0.1, 0.1, 0.04]));
  // the clock tower over the spine, with a slate roof and a gold finial
  boxes.push({ at: [0, H + 2.6, 0.5], size: [5.6, 5.2, 5.6], round: [0.3, 0.1, 0.3], facade: [1.6, 2.4, 0.2, STYLE.brick], color: "#c0624a", glass: "#7fb0e0", trim: "#f4ecdf" });
  boxes.push(blank([6.2, 2.6, 6.2], [0, H + 6.4, 0.5], "#4d5a78", [2.2, 1.3, 2.2]));
  boxes.push(blank([0.4, 1.4, 0.4], [0, H + 8.2, 0.5], "#e2b04a", [0.2, 0.2, 0.2]));
  return {
    boxes,
    discs: [
      { at: [0, 7, D / 2 + 0.62], size: 3.6, ring: "#f4f4f4", arc: "#c8102e", glyph: "book", ink: "#1a1a1a" },
      { at: [0, H + 2.8, 0.5 + 2.86], size: 2.6, ring: "#f4f4f4", arc: "#c8102e", glyph: "book", ink: "#1a1a1a" },
    ],
  };
}

/** A Paldea glass gym, played straight (Philips, Outamation). */
function glassGym(W: number, D: number, H: number, glass: string, arc: string, glyph: Glyph, disc: number): Hero {
  const boxes: Box[] = [
    blank([W + 0.4, 0.5, D + 0.4], [0, 0.25, 0], "#5f6b85", [0.3, 0.1, 0.3]),
    { at: [0, (H - 0.5) / 2, 0], size: [W, H - 0.5, D], round: [0.1, 0.15, 0.1], facade: [1.6, 3.2, 4.6, STYLE.curtain], color: "#eef0f5", glass, trim: "#c9d3ea" },
    blank([W * 0.6, 0.35, 2.2], [0, 4.8, D / 2 + 1.1], "#f6f7fa", [0.3, 0.1, 0.3]),
    door(0, D / 2 + 0.12, "#bfe3f7", "#f6f7fa"),
    blank([W + 0.3, 0.5, D + 0.3], [0, H - 0.25, 0], "#e6e9f0", [0.3, 0.12, 0.3]),
    blank([disc * 1.15, disc * 1.15, 0.25], [0, 8, D / 2 + 0.12], "#f6f7fa", [0.6, 0.6, 0.1]),
    roofUnit(-W * 0.28, H, D * 0.15),
    roofUnit(W * 0.28, H, D * 0.15),
  ];
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) boxes.push(blank([0.8, H - 0.4, 0.8], [sx * (W / 2 - 0.25), (H - 0.4) / 2, sz * (D / 2 - 0.25)], "#f6f7fa", [0.25, 0.1, 0.25]));
  boxes.push(blank([W * 0.55, 2.4, D * 0.45], [0, H + 1.2, -D * 0.15], "#e6e9f0", [0.4, 0.2, 0.4]));
  return { boxes, discs: [{ at: [0, 8, D / 2 + 0.27], size: disc, ring: "#e8ecf2", arc, glyph, ink: arc }] };
}

function tetracorp(W: number, D: number, H: number): Hero {
  const boxes: Box[] = [
    blank([W + 0.2, 0.9, D + 0.2], [0, 0.45, 0], "#8b80a6", [0.5, 0.08, 0.5]),
    { at: [0, (H - 0.6) / 2, 0], size: [W, H - 0.6, D], round: [0.4, 0.12, 0.4], facade: [2.4, 3, 4.2, STYLE.punched], color: "#f0c49a", glass: "#8fc4ee", trim: "#f4ecd2" },
    blank([W + 0.5, 0.6, D + 0.5], [0, H - 0.3, 0], "#f4ecd2", [0.6, 0.15, 0.6]),
    blank([W - 2.5, 0.22, 1.1], [0, 3.35, D / 2 + 0.55], "#2fb5a8", [0.1, 0.1, 0.1]),
    door(-W * 0.28, D / 2 + 0.12, "#8fc4ee", "#f4f6f4", 2.2, 2.8),
    blank([3.7, 3.7, 0.25], [W * 0.12, 6.4, D / 2 + 0.12], "#f4f6f8", [0.6, 0.6, 0.1]),
    roofUnit(W * 0.2, H, -D * 0.15),
  ];
  return { boxes, discs: [{ at: [W * 0.12, 6.4, D / 2 + 0.27], size: 3.2, ring: "#e8ecf2", arc: "#2fb5a8", glyph: "letterT", ink: "#2fb5a8" }] };
}

function quartzy(W: number, D: number, H: number): Hero {
  const boxes: Box[] = [
    blank([W + 0.1, 0.5, D + 0.1], [0, 0.25, 0], "#9a8670", [1.2, 0.08, 1.2]),
    { at: [0, (H - 0.4) / 2, 0], size: [W, H - 0.4, D], round: [1.2, 0.1, 1.2], facade: [2.2, 3.2, 4.6, STYLE.tall], color: "#ecdcbc", glass: "#8fa6e3", trim: "#f6eedd" },
    blank([W + 0.25, 0.25, D + 0.25], [0, 4.6, 0], "#f6eedd", [1.3, 0.1, 1.3]),
    blank([W - 3, 0.9, 0.3], [0, 3.9, D / 2 + 0.1], "#2f6b4f"),
    blank([W + 0.4, 0.4, D + 0.4], [0, H - 0.2, 0], "#f6eedd", [1.4, 0.15, 1.4]),
    blank([W - 0.6, 2.6, D - 0.6], [0, H + 1.1, 0], "#4d5a78", [1.1, 0.9, 1.1]),
    door(W * 0.24, D / 2 + 0.12, "#8fa6e3", "#f6eedd", 2.4, 2.9),
    blank([3.7, 3.7, 0.25], [-W * 0.12, 6.6, D / 2 + 0.12], "#f6f7fa", [0.6, 0.6, 0.1]),
  ];
  return { boxes, discs: [{ at: [-W * 0.12, 6.6, D / 2 + 0.27], size: 3.2, ring: "#e8ecf2", arc: "#2f6b4f", glyph: "bars", ink: "#2f6b4f" }] };
}

/** HomeGoods as LGPE's Celadon Dept Store: a brick ground floor, a teal fascia, a rounded glass curtain wall above. */
function homegoods(W: number, D: number, H: number): Hero {
  const boxes: Box[] = [
    { at: [0, 2.2, 0], size: [W, 4.4, D], round: [2.5, 0.1, 2.5], facade: [2.6, 4.4, 4.4, STYLE.punched], color: "#c8683c", glass: "#9fd0f0", trim: "#5a3a2a" },
    glow([W + 0.3, 0.9, D + 0.3], [0, 4.85, 0], "#5fb8a8", [2.6, 0.12, 2.6]),
    { at: [0, 5.3 + (H - 6.1) / 2, 0], size: [W, H - 6.1, D], round: [2.5, 0.1, 2.5], facade: [1.6, 3.4, 0, STYLE.curtain], color: "#f4f6f8", glass: "#7fb3ea", trim: "#f4f6f8" },
    blank([W + 0.5, 0.8, D + 0.5], [0, H - 0.4, 0], "#f2e7c4", [2.7, 0.2, 2.7]),
    blank([W + 0.5, 0.2, D + 0.5], [0, H + 0.1, 0], "#d8743c", [2.7, 0.08, 2.7]),
    door(0, D / 2 + 0.12, "#bfe3f7", "#5a3a2a", 3.4, 3),
    blank([1.4, 6, 0.15], [-W * 0.32, 8.6, D / 2 + 0.1], "#c8463c", [0.2, 0.2, 0.06]),
    blank([1.4, 6, 0.15], [W * 0.32, 8.6, D / 2 + 0.1], "#c8463c", [0.2, 0.2, 0.06]),
    blank([3.5, 3.5, 0.25], [0, 7.4, D / 2 + 0.12], "#f6f7fa", [0.6, 0.6, 0.1]),
  ];
  return { boxes, discs: [{ at: [0, 7.4, D / 2 + 0.27], size: 3, ring: "#e8ecf2", arc: "#c8463c", glyph: "house", ink: "#c8463c" }] };
}

/** The job buildings, by slug. W and D are the building's own width and depth, H its height. */
export const HEROES: Record<string, (W: number, D: number, H: number) => Hero> = {
  aws: (W, D) => aws(W, D),
  khoury,
  philips: (W, D, H) => glassGym(W, D, H, "#6f8fc8", "#1e64c8", "pulse", 5.4),
  outamation: (W, D, H) => glassGym(W, D, H, "#7fc3d8", "#7a5cd6", "spark", 3.4),
  tetracorp,
  quartzy,
  homegoods,
};

/** Draws a disc emblem: a silver ring, an arc in the accent over the top, a band across, the glyph in the middle. */
export function drawDisc(g: CanvasRenderingContext2D, d: Disc) {
  const S = 512;
  const c = S / 2;
  g.clearRect(0, 0, S, S);
  g.fillStyle = d.ring;
  g.beginPath();
  g.arc(c, c, 250, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.arc(c, c, 226, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = d.arc;
  g.beginPath();
  g.arc(c, c, 206, Math.PI, 0);
  g.arc(c, c, 150, 0, Math.PI, true);
  g.fill();
  g.fillStyle = "#3a4250";
  g.fillRect(c - 236, c - 18, 472, 36);
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.arc(c, c, 118, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = d.arc;
  g.lineWidth = 14;
  g.beginPath();
  g.arc(c, c, 118, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = d.ink;
  g.strokeStyle = d.ink;
  g.lineWidth = 16;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.save();
  g.translate(c, c);
  const glyphs: Record<Glyph, () => void> = {
    cloud: () => {
      g.beginPath();
      g.arc(-30, 12, 34, Math.PI * 0.5, Math.PI * 1.5);
      g.arc(4, -18, 44, Math.PI, Math.PI * 1.95);
      g.arc(42, 6, 30, Math.PI * 1.4, Math.PI * 0.5);
      g.closePath();
      g.fill();
    },
    book: () => {
      g.beginPath();
      g.moveTo(-62, -40);
      g.quadraticCurveTo(-30, -52, 0, -36);
      g.quadraticCurveTo(30, -52, 62, -40);
      g.lineTo(62, 44);
      g.quadraticCurveTo(30, 32, 0, 48);
      g.quadraticCurveTo(-30, 32, -62, 44);
      g.closePath();
      g.stroke();
      g.beginPath();
      g.moveTo(0, -36);
      g.lineTo(0, 48);
      g.stroke();
    },
    pulse: () => {
      g.beginPath();
      g.moveTo(0, 56);
      g.bezierCurveTo(-80, 0, -60, -64, 0, -26);
      g.bezierCurveTo(60, -64, 80, 0, 0, 56);
      g.fill();
      g.strokeStyle = "#ffffff";
      g.lineWidth = 12;
      g.beginPath();
      g.moveTo(-50, 0);
      g.lineTo(-18, 0);
      g.lineTo(-6, -24);
      g.lineTo(8, 22);
      g.lineTo(20, 0);
      g.lineTo(50, 0);
      g.stroke();
    },
    letterT: () => {
      g.lineWidth = 26;
      g.beginPath();
      g.moveTo(-50, -44);
      g.lineTo(50, -44);
      g.moveTo(0, -44);
      g.lineTo(0, 54);
      g.stroke();
    },
    spark: () => {
      g.beginPath();
      g.moveTo(-40, -56);
      g.lineTo(20, -56);
      g.lineTo(40, -36);
      g.lineTo(40, 56);
      g.lineTo(-40, 56);
      g.closePath();
      g.stroke();
      g.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const r = i % 2 ? 9 : 26;
        g.lineTo(Math.cos(a) * r, 10 + Math.sin(a) * r);
      }
      g.closePath();
      g.fill();
    },
    bars: () => {
      [
        [-48, 20],
        [-14, -6],
        [20, -32],
      ].forEach(([x, y]) => g.fillRect(x, y, 26, 56 - y));
      g.beginPath();
      g.moveTo(-60, 4);
      g.lineTo(-10, -30);
      g.lineTo(52, -58);
      g.stroke();
    },
    house: () => {
      g.beginPath();
      g.moveTo(-58, -2);
      g.lineTo(0, -56);
      g.lineTo(58, -2);
      g.stroke();
      g.beginPath();
      g.moveTo(-40, -10);
      g.lineTo(-40, 52);
      g.lineTo(40, 52);
      g.lineTo(40, -10);
      g.stroke();
      g.fillRect(-12, 18, 24, 34);
    },
  };
  glyphs[d.glyph]();
  g.restore();
}
