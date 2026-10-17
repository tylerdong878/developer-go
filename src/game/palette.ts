import type { AreaKind, RoadKind } from "./base";

export type TimeOfDay = "day" | "night";

/** [fill, edge] for each kind of road. */
type RoadColors = Record<RoadKind, readonly [string, string]>;

export type Palette = {
  sky: { top: string; horizon: string };
  land: string;
  areas: Record<AreaKind, string>;
  shore: string;
  roads: RoadColors;
  trunk: string;
  leaves: readonly [string, string];
  /** The sun (the moon at night): faces toward it show their own color. */
  sun: { color: string; intensity: number };
  /** What the shadow side multiplies by (never gray), and the ground color bounced onto low faces. */
  shade: { tint: string; bounce: string };
  /** Cast shadows on the ground: a multiply toward this color. */
  shadow: { color: string; opacity: number };
};

/** GO's look: green ground, white roads, bright water, a soft sky that fogs out the edges. */
export const palettes: Record<TimeOfDay, Palette> = {
  day: {
    sky: { top: "#4fb2ea", horizon: "#d4f1ff" },
    land: "#a6dd8f",
    areas: {
      park: "#80ca6e",
      grass: "#62b159",
      lawn: "#94d57f",
      water: "#58c6ec",
      plaza: "#ece6d4",
      deck: "#c9a36b",
    },
    shore: "#c4f1ff",
    roads: {
      avenue: ["#ffffff", "#a7c8bf"],
      street: ["#ffffff", "#a7c8bf"],
      path: ["#f3e7c6", "#d9c89c"],
      boardwalk: ["#c9a36b", "#8f6d3f"],
    },
    trunk: "#8a5a3b",
    leaves: ["#3f9a4b", "#52ad56"],
    sun: { color: "#fff2df", intensity: 1.1 },
    shade: { tint: "#a9b8e6", bounce: "#a3dc6e" },
    shadow: { color: "#5d6bd0", opacity: 0.55 },
  },
  night: {
    sky: { top: "#081231", horizon: "#27356a" },
    land: "#2e4166",
    areas: {
      park: "#2b5553",
      grass: "#224845",
      lawn: "#2f5a58",
      water: "#16295a",
      plaza: "#4a557a",
      deck: "#66553f",
    },
    shore: "#3e5f9a",
    roads: {
      avenue: ["#8292c9", "#56649c"],
      street: ["#8292c9", "#56649c"],
      path: ["#5d6890", "#48527a"],
      boardwalk: ["#66553f", "#473a2c"],
    },
    trunk: "#4a3a32",
    leaves: ["#22534b", "#2b6255"],
    sun: { color: "#9fb3ff", intensity: 0.62 },
    shade: { tint: "#5463b0", bounce: "#477a6c" },
    shadow: { color: "#2c3a8a", opacity: 0.5 },
  },
};
