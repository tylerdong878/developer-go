import type { Object3D } from "three";

/**
 * Finds a character's named parts once, the first frame they're needed, so
 * the animation loop can move them without refs to every piece.
 */
export function parts<K extends string>(root: Object3D, names: readonly K[]) {
  const found = {} as Record<K, Object3D>;
  for (const name of names) {
    const part = root.getObjectByName(name);
    if (!part) return null;
    found[name] = part;
  }
  return found;
}
