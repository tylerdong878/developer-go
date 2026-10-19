/// <reference lib="webworker" />
import { RECIPES } from "../recipes";
import { buildDecals } from "./decals.js";
import { buildMesh } from "./mesh.js";

/** Meshes one species off the main thread and hands the arrays back without copying. */
export type Request = { id: number; dex: number; grid: number };

self.onmessage = (e: MessageEvent<Request>) => {
  const { id, dex, grid } = e.data;
  try {
    const mesh = buildMesh(RECIPES[dex], { grid });
    const decals = buildDecals(mesh);
    const out = {
      id,
      dex,
      positions: mesh.positions,
      normals: mesh.normals,
      colors: mesh.colors,
      skinIndex: mesh.skinIndex,
      skinWeight: mesh.skinWeight,
      indices: mesh.indices,
      paint: { layers: mesh.paint.layers.map((l: { colorHex: string; soft: number }) => ({ color: l.colorHex, soft: l.soft })), dist: mesh.paint.dist },
      bones: mesh.bones,
      decals,
    };
    const transfer: Transferable[] = [out.positions.buffer, out.normals.buffer, out.colors.buffer, out.skinIndex.buffer, out.skinWeight.buffer, out.indices.buffer, out.paint.dist.buffer];
    (self as unknown as Worker).postMessage(out, transfer);
  } catch (err) {
    (self as unknown as Worker).postMessage({ id, dex, error: String(err) });
  }
};
