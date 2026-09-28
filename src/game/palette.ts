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
  hemi: { sky: string; ground: string; intensity: number };
  sun: { color: string; intensity: number };
  /** A soft light from the camera, so faces are never in shadow. */
  fill: { color: string; intensity: number };
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
    hemi: { sky: "#ffffff", ground: "#e6dfcc", intensity: 1.5 },
    sun: { color: "#fff4dc", intensity: 1.5 },
    fill: { color: "#ffffff", intensity: 1.2 },
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
    hemi: { sky: "#8ea3e6", ground: "#4a5a86", intensity: 1.1 },
    sun: { color: "#b9c8ff", intensity: 0.7 },
    fill: { color: "#c9d4ff", intensity: 0.8 },
  },
};
