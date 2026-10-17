/** GO's colors, shared by the 3D scene and the HUD so they always match. */
/** Team colors, sampled from GO (notes/research/gfx-go-gyms-stops.md 3.2). */
export const MYSTIC = "#0474f4";
export const VALOR = "#f4140c";
export const INSTINCT = "#fcd404";
/** Mystic's glow, for lit rings and highlights. */
export const MYSTIC_GLOW = "#8cccfc";
export const MYSTIC_LIGHT = "#1ab6e8";
export const TEAL = "#2fd3c6";
/** A lured stop's pink petals. */
export const LURE = "#f472b6";
/** Gold that reads on white, for 3-star raids and fact Pokémon. */
export const GOLD_INK = "#c48a12";

/** Raid eggs: pink for 1 star, gold for 3, legendary navy (with silver swirls) for 5. */
export const RAID_EGG = { 1: "#ef6a9d", 3: "#e2b31d", 5: "#2e4a66" } as const;

/** Egg spots by distance: green 2 km, orange 5 km, yellow 7 km, purple 10 km, red 12 km. */
export const EGG_SPOTS = { 2: "#5fc15a", 5: "#f5a142", 7: "#f2d04a", 10: "#a868e0", 12: "#d9344a" } as const;
