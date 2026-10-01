/** GO's colors, shared by the 3D scene and the HUD so they always match. */
export const MYSTIC = "#0b84d6";
export const MYSTIC_LIGHT = "#1ab6e8";
export const TEAL = "#2fd3c6";
/** A lured stop's pink petals. */
export const LURE = "#f472b6";
/** Gold that reads on white, for 3-star raids and fact Pokémon. */
export const GOLD_INK = "#c48a12";

/** Raid eggs: pink for 1 star, yellow for 3, legendary purple for 5. */
export const RAID_EGG = { 1: "#f472b6", 3: "#f6c453", 5: "#5b45b0" } as const;

/** Egg spots by distance: green 2 km, orange 5 km, yellow 7 km, purple 10 km, red 12 km. */
export const EGG_SPOTS = { 2: "#5fc15a", 5: "#f5a142", 7: "#f2d04a", 10: "#a868e0", 12: "#d9344a" } as const;
