import { Vector3 } from "three";
import { slots, walkable } from "./base";
import { bySlug, standOff } from "./objects";
import { game } from "./state";

/**
 * Send the trainer to a map object: walk there (a tap on the map) or dash
 * there (from the Nearby list). He stops just in front of it, on the side
 * he's coming from, and game.onArrive fires when he gets there.
 */
export function goTo(slug: string, dash = false) {
  const object = bySlug.get(slug);
  const slot = slots[slug];
  if (!object || !slot) return;
  const [x, z] = slot;
  const { position } = game.player.trainer;
  let dx = position.x - x;
  let dz = position.z - z;
  const d = Math.hypot(dx, dz);
  if (d < 0.01) [dx, dz] = [0, 1];
  const away = standOff(object) / (Math.hypot(dx, dz) || 1);
  let spot = new Vector3(x + dx * away, 0, z + dz * away);
  // Coming from the water or a blocked side? Try the other sides.
  for (let turn = 1; !walkable([spot.x, spot.z]) && turn < 8; turn++) {
    const a = Math.atan2(dz, dx) + (turn * Math.PI) / 4;
    spot = new Vector3(x + Math.cos(a) * standOff(object), 0, z + Math.sin(a) * standOff(object));
  }
  game.input.target = spot;
  game.input.dash = dash;
  game.input.goal = slug;
}
