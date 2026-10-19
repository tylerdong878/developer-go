import { Color } from "three";
import type { Palette } from "./palette";
import type { Weather } from "./weather";

/*
 * How each weather changes the look (notes/research/gfx-art-direction.md 2.3):
 * the ground is multiplied and pulled toward a tint (rain turns it deep teal,
 * snow icy cyan, fog grey-white), the sky and fog take their own colors, the
 * sun dims and shadows soften under cloud, and the fog closes in.
 */

type Tint = readonly [mul: string, toward: string, t: number];
type Look = {
  ground: [day: Tint | null, night: Tint | null];
  /** Sky top, haze band, fog line: day and night, or none to keep the time of day's. */
  sky: [day: readonly [string, string, string] | null, night: readonly [string, string, string] | null];
  clouds: readonly [lit: string, shade: string] | null;
  cover: number;
  sun: number;
  shadow: number;
  /** How much the shadow side lifts toward white (overcast light has no direction). */
  lift: number;
  fog: readonly [near: number, far: number];
};

const LOOKS: Record<Weather, Look> = {
  clear: { ground: [null, null], sky: [null, null], clouds: null, cover: 0.18, sun: 1, shadow: 1, lift: 0, fog: [60, 185] },
  partly: { ground: [["#f4f8fb", "#cfe7f2", 0.04], null], sky: [null, null], clouds: ["#ffffff", "#b9c9e0"], cover: 0.45, sun: 0.9, shadow: 0.9, lift: 0, fog: [60, 185] },
  windy: { ground: [["#f4f8fb", "#cfe7f2", 0.04], null], sky: [null, null], clouds: ["#ffffff", "#b9c9e0"], cover: 0.45, sun: 0.9, shadow: 0.9, lift: 0, fog: [60, 185] },
  cloudy: {
    ground: [["#cfdde6", "#8fb0bf", 0.2], ["#d9dfeb", "#3a4f80", 0.15]],
    sky: [["#8fb3d6", "#d3dee6", "#c9d8e2"], ["#2b3a6a", "#4f6299", "#40558a"]],
    clouds: ["#e6edf2", "#9fb3c4"],
    cover: 0.85,
    sun: 0.55,
    shadow: 0.35,
    lift: 0.1,
    fog: [50, 160],
  },
  rain: {
    ground: [["#a8bdc8", "#3d8ca6", 0.38], ["#b0bccc", "#1f3d63", 0.3]],
    sky: [["#3b5866", "#6d8792", "#5c7884"], ["#1d2b45", "#3a4f74", "#2f4466"]],
    clouds: ["#7d93a0", "#3a4f5c"],
    cover: 0.95,
    sun: 0.5,
    shadow: 0.25,
    lift: 0.14,
    fog: [40, 140],
  },
  snow: {
    ground: [["#ffffff", "#d4f0fb", 0.5], ["#ffffff", "#8b8fb2", 0.4]],
    sky: [["#86aec4", "#dbe8ef", "#cfe0ea"], ["#5a5a7e", "#a3949a", "#8a87a3"]],
    clouds: ["#eef3f6", "#a9bccb"],
    cover: 0.9,
    sun: 0.7,
    shadow: 0.4,
    lift: 0.15,
    fog: [45, 150],
  },
  fog: {
    ground: [["#e9edf0", "#dfe5ea", 0.4], ["#e6e8ee", "#56627f", 0.4]],
    sky: [["#c3cfd8", "#e6ebef", "#dfe5ea"], ["#3d4766", "#5c6886", "#56627f"]],
    clouds: null,
    cover: 0,
    sun: 0.6,
    shadow: 0.2,
    lift: 0.18,
    fog: [14, 80],
  },
};

const a = new Color();
const b = new Color();
const tint = (hex: string, t: Tint | null) => (t ? `#${a.set(hex).multiply(b.set(t[0])).lerp(b.set(t[1]), t[2]).getHexString()}` : hex);

export type Weathered = Palette & { cover: number; fog: readonly [number, number] };

/** The time of day's palette under a weather. */
export function weatherize(p: Palette, w: Weather, night: boolean): Weathered {
  const L = LOOKS[w];
  const g = L.ground[night ? 1 : 0];
  const sky = L.sky[night ? 1 : 0];
  const t = (hex: string) => tint(hex, g);
  const mid = sky ? a.set(sky[0]).lerp(b.set(sky[1]), 0.45).getHexString() : null;
  return {
    ...p,
    sky: sky ? { top: sky[0], mid: `#${mid}`, haze: sky[1], fog: sky[2] } : p.sky,
    clouds: L.clouds ? { lit: L.clouds[0], shade: L.clouds[1] } : p.clouds,
    land: t(p.land),
    areas: Object.fromEntries(Object.entries(p.areas).map(([k, v]) => [k, t(v)])) as Palette["areas"],
    shore: t(p.shore),
    roads: Object.fromEntries(Object.entries(p.roads).map(([k, [f, e]]) => [k, [t(f), t(e)] as const])) as unknown as Palette["roads"],
    sidewalk: t(p.sidewalk),
    zebra: t(p.zebra),
    apron: t(p.apron),
    sun: { color: p.sun.color, intensity: p.sun.intensity * L.sun },
    shade: { tint: L.lift ? `#${a.set(p.shade.tint).lerp(b.set("#ffffff"), L.lift * 2.5).getHexString()}` : p.shade.tint, bounce: t(p.shade.bounce) },
    shadow: { color: p.shadow.color, opacity: p.shadow.opacity * L.shadow },
    cover: L.cover,
    fog: L.fog,
  };
}
