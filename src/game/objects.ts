import { mapObjects, type MapObject } from "@/content";

/** Everything on the map by slug, for the HUD and the scene. */
export const bySlug = new Map<string, MapObject>(mapObjects.map((o) => [o.slug, o]));

/** A short name and a one-line subtitle for lists and cards. */
export function describe(o: MapObject): { name: string; subtitle: string } {
  switch (o.kind) {
    case "gym":
      return { name: o.org, subtitle: o.roles[0]?.title ?? "" };
    case "stop":
      return { name: o.name, subtitle: o.tagline };
    case "raid":
      return { name: o.event, subtitle: o.result ? `${o.project.name}: ${o.result}` : o.project.name };
    case "spawn":
      return { name: o.pokemon.name, subtitle: o.title };
    case "egg":
      return { name: o.title, subtitle: `${o.km} km egg, still hatching` };
  }
}

/** How far in front of each kind of thing the trainer stops. */
export function standOff(o: MapObject) {
  if (o.kind === "gym" || o.kind === "raid") return 5;
  if (o.kind === "spawn" && o.pokemon.dex === 143) return 5;
  return o.kind === "egg" ? 2.6 : 3.4;
}
