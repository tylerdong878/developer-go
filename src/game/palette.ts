import type { AreaKind, RoadKind } from "./base";

export type TimeOfDay = "day" | "night";

/** [fill, edge] for each kind of road. */
type RoadColors = Record<RoadKind, readonly [string, string]>;

export type Palette = {
  /** Zenith, about 15 degrees up, the bright haze band on the horizon, and the fog line under it. */
  sky: { top: string; mid: string; haze: string; fog: string };
  clouds: { lit: string; shade: string };
  land: string;
  areas: Record<AreaKind, string>;
  shore: string;
  roads: RoadColors;
  /** Sidewalks beside the streets, the zebra stripes, the paving round the roundabout. */
  sidewalk: string;
  zebra: string;
  apron: string;
  trunk: string;
  leaves: readonly [string, string];
  /** The sun (the moon at night): faces toward it show their own color. */
  sun: { color: string; intensity: number };
  /** What the shadow side multiplies by (never gray), and the ground color bounced onto low faces. */
  shade: { tint: string; bounce: string };
  /** Cast shadows on the ground: a multiply toward this color. */
  shadow: { color: string; opacity: number };
};

/**
 * GO's map, sampled (notes/research/gfx-art-direction.md): yellow-green
 * ground, teal-gray roads with a pale curb line, bright water, a blue sky with
 * a glowing horizon. At night GO keeps the ground lighter than the roads:
 * teal-green land, navy roads with a cream edge, a medium-blue sky. Lit
 * things (buildings, trees, people) keep their colors; the sun, the shadow
 * tint and the fog carry the time of day.
 */
export const palettes: Record<TimeOfDay, Palette> = {
  day: {
    sky: { top: "#3fa4ee", mid: "#7cc0f2", haze: "#e4f6ff", fog: "#c6ecf6" },
    clouds: { lit: "#ffffff", shade: "#bccde6" },
    land: "#a3dc6e",
    areas: {
      park: "#86c965",
      grass: "#2f8a45",
      lawn: "#9ad86a",
      water: "#58c6ec",
      plaza: "#e8e9e2",
      deck: "#c9a36b",
    },
    shore: "#c4f1ff",
    roads: {
      avenue: ["#7f9396", "#e9ede6"],
      street: ["#7f9396", "#e9ede6"],
      path: ["#f1e2b2", "#ddc995"],
      boardwalk: ["#c9a36b", "#8f6d3f"],
    },
    sidewalk: "#e3e1d8",
    zebra: "#f4f7f4",
    apron: "#d9d2c3",
    trunk: "#8a5a3b",
    leaves: ["#3f9a4b", "#52ad56"],
    sun: { color: "#fff2df", intensity: 1.1 },
    shade: { tint: "#a9b8e6", bounce: "#a3dc6e" },
    shadow: { color: "#5d6bd0", opacity: 0.55 },
  },
  night: {
    sky: { top: "#24398a", mid: "#33509e", haze: "#5a77c8", fog: "#3d78b6" },
    clouds: { lit: "#3d4f8e", shade: "#24326a" },
    land: "#477a6c",
    areas: {
      park: "#3d7558",
      grass: "#24503f",
      lawn: "#4b8070",
      water: "#1c4f8f",
      plaza: "#5c6e8e",
      deck: "#5e5040",
    },
    shore: "#3a7fa8",
    roads: {
      avenue: ["#2b4f7c", "#b5ae84"],
      street: ["#2b4f7c", "#b5ae84"],
      path: ["#6c7a84", "#59656e"],
      boardwalk: ["#5e5040", "#41372c"],
    },
    sidewalk: "#566c8c",
    zebra: "#9aa6d6",
    apron: "#5f6f8e",
    trunk: "#8a5a3b",
    leaves: ["#3f9a4b", "#52ad56"],
    sun: { color: "#9fb3ff", intensity: 0.62 },
    shade: { tint: "#5463b0", bounce: "#477a6c" },
    shadow: { color: "#2c3a8a", opacity: 0.5 },
  },
};
