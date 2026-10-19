import type { AreaKind, RoadKind } from "./base";
import type { Phase } from "./sun";

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
export const palettes: Record<Phase, Palette> = {
  // morning and dusk: the day's colors through warm low light (gfx-art-direction.md 2.1, 2.2)
  morning: {
    sky: { top: "#5ea8e4", mid: "#9fcdf0", haze: "#ffe6d2", fog: "#f2e4da" },
    clouds: { lit: "#fff4ea", shade: "#c9bfd9" },
    land: "#add476",
    areas: { park: "#96c470", grass: "#5f915e", lawn: "#a6d173", water: "#75c2d5", plaza: "#e9dfcd", deck: "#cea574" },
    shore: "#c9e6e5",
    roads: {
      avenue: ["#909892", "#eae3d0"],
      street: ["#909892", "#eae3d0"],
      path: ["#f1d9a7", "#dcc290"],
      boardwalk: ["#cea574", "#8f6d3f"],
    },
    sidewalk: "#e5d9c5",
    zebra: "#f4f0e6",
    apron: "#ddd2bf",
    trunk: "#8a5a3b",
    leaves: ["#3f9a4b", "#52ad56"],
    sun: { color: "#ffe2bd", intensity: 0.95 },
    shade: { tint: "#a7a8e6", bounce: "#add476" },
    shadow: { color: "#7c82d0", opacity: 0.5 },
  },
  dusk: {
    sky: { top: "#4b5fb0", mid: "#b58fbf", haze: "#ffc08e", fog: "#f0b49a" },
    clouds: { lit: "#ffd2b0", shade: "#a98bb5" },
    land: "#abb35c",
    areas: { park: "#96a558", grass: "#677a4a", lawn: "#a5b05a", water: "#79a3a6", plaza: "#e3bca0", deck: "#c98a5b" },
    shore: "#c5c2b2",
    roads: {
      avenue: ["#918072", "#e3bfa2"],
      street: ["#918072", "#e3bfa2"],
      path: ["#eab782", "#d29f6c"],
      boardwalk: ["#c98a5b", "#7e5a3a"],
    },
    sidewalk: "#deb69a",
    zebra: "#f0dccb",
    apron: "#d8b9a0",
    trunk: "#8a5a3b",
    leaves: ["#3f9a4b", "#52ad56"],
    sun: { color: "#ffb27a", intensity: 0.85 },
    shade: { tint: "#8f78c8", bounce: "#abb35c" },
    shadow: { color: "#6a4fb0", opacity: 0.6 },
  },
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
