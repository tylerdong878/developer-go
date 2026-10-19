// Meshes one species for the game: the body (with its paint and face decals) and, if the recipe lists any,
// its see-through parts (Poliwag's tail fin) as a second mesh on the same bones. Used by the worker, and on
// the main thread if a worker can't start.
import { buildDecals } from "./decals.js";
import { buildMesh } from "./mesh.js";

export function meshSpecies(recipe, grid) {
  const mesh = buildMesh(recipe, { grid });
  let glass = null;
  if (Array.isArray(recipe.transparent) && recipe.transparent.length) {
    // same bones in the same order, so the skin indices line up with the body's skeleton
    const g = buildMesh({ ...recipe, pieces: recipe.transparent, paint: [], face: null }, { grid: Math.round(grid * 0.75) });
    glass = {
      positions: g.positions,
      normals: g.normals,
      colors: g.colors,
      skinIndex: g.skinIndex,
      skinWeight: g.skinWeight,
      indices: g.indices,
      opacity: recipe.transparent[0].opacity ?? 0.55,
    };
  }
  return {
    positions: mesh.positions,
    normals: mesh.normals,
    colors: mesh.colors,
    skinIndex: mesh.skinIndex,
    skinWeight: mesh.skinWeight,
    indices: mesh.indices,
    paint: { layers: mesh.paint.layers.map((l) => ({ color: l.colorHex, soft: l.soft })), dist: mesh.paint.dist },
    bones: mesh.bones,
    decals: buildDecals(mesh),
    glass,
  };
}

/** The big arrays, handed to the main thread without copying. */
export function transferables(m) {
  const list = [m.positions, m.normals, m.colors, m.skinIndex, m.skinWeight, m.indices, m.paint.dist];
  if (m.glass) list.push(m.glass.positions, m.glass.normals, m.glass.colors, m.glass.skinIndex, m.glass.skinWeight, m.glass.indices);
  return list.map((a) => a.buffer);
}
