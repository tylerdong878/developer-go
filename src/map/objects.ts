import { mapObjects, signposts } from "@/content";
import type { MapObject, SignpostId } from "@/content";
import { project } from "./projection";

/**
 * Where signposts stand, as a share of the world radius: out at the edge of
 * the world, past home base (they're drawn above the fog, so they stay readable).
 */
const SIGNPOST_AT = 0.92;

export type PlacedObject = { object: MapObject; x: number; y: number };

export type PlacedSignpost = {
  id: SignpostId;
  label: string;
  km: number;
  bearing: number;
  x: number;
  y: number;
  objects: MapObject[];
};

/**
 * Map positions for everything on the map. Off-map places become signposts at
 * the edge of the world, pointing the real direction. Southern markers come
 * last so they draw in front, like the game's tilted camera.
 */
export function placeObjects(worldRadius: number, objects: MapObject[] = mapObjects) {
  const onMap: PlacedObject[] = [];
  const grouped = new Map<SignpostId, MapObject[]>();
  for (const object of objects) {
    if ("signpost" in object.where) {
      const id = object.where.signpost;
      grouped.set(id, [...(grouped.get(id) ?? []), object]);
      continue;
    }
    const p = project(object.where);
    onMap.push({ object, x: p.x, y: p.y });
  }
  onMap.sort((a, b) => a.y - b.y);

  const r = worldRadius * SIGNPOST_AT;
  const posts: PlacedSignpost[] = [...grouped].map(([id, list]) => {
    const { label, km, bearing } = signposts[id];
    const rad = (bearing * Math.PI) / 180;
    return { id, label, km, bearing, x: r * Math.sin(rad), y: -r * Math.cos(rad), objects: list };
  });
  return { onMap, signposts: posts };
}
