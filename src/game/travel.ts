import { Vector3 } from "three";
import { places, slots, walkable } from "./base";
import type { Vec2 } from "./geometry";
import { bySlug, standOff } from "./objects";
import { game } from "./state";
import { findWild } from "./wild";

/** Where a goal stands: a map object's slug, or "wild:<id>" for a wild Pokémon. */
export function goalPosition(goal: string): Vec2 | null {
  if (goal.startsWith("wild:")) {
    const w = findWild(goal);
    return w ? [w.x, w.z] : null;
  }
  return slots[goal] ?? places[goal] ?? null;
}

/**
 * Send the trainer to a map object or a wild Pokémon: walk there (a tap on
 * the map) or dash there (from the Nearby list). He stops just in front of
 * it, on the side he's coming from, and game.onArrive fires when he gets there.
 */
export function goTo(goal: string, dash = false) {
  const at = goalPosition(goal);
  if (!at) return;
  const object = bySlug.get(goal);
  const gap = object ? standOff(object) : 3;
  const [x, z] = at;
  const { position } = game.player.trainer;
  let dx = position.x - x;
  let dz = position.z - z;
  if (Math.hypot(dx, dz) < 0.01) [dx, dz] = [0, 1];
  const away = gap / (Math.hypot(dx, dz) || 1);
  let spot = new Vector3(x + dx * away, 0, z + dz * away);
  // Coming from the water or a blocked side? Try the other sides.
  for (let turn = 1; !walkable([spot.x, spot.z]) && turn < 8; turn++) {
    const a = Math.atan2(dz, dx) + (turn * Math.PI) / 4;
    spot = new Vector3(x + Math.cos(a) * gap, 0, z + Math.sin(a) * gap);
  }
  game.input.target = spot;
  game.input.dash = dash;
  game.input.goal = goal;
}
