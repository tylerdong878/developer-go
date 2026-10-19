// Painted faces: every face feature (eye, mouth, cheek, nose) becomes a small grid that hugs the head,
// projected onto the field's surface and lifted a hair off it, with its own cell in one texture atlas.
// GO's rigs ship faces as textures too (notes/research/gfx-characters.md 1.2, 4).

const N = 10;
const LIFT = 0.0022;
export const ATLAS = { cols: 4, cellPx: 96 };

const norm = (a) => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

/** Strip what the atlas painter doesn't need (and what can't cross to the main thread). */
function plain(f) {
  const out = {};
  for (const [k, v] of Object.entries(f)) if (typeof v !== "function") out[k] = v;
  return out;
}

/**
 * Builds the decal grids for a mesh from buildMesh: one set for unlit features (eyes, mouths: they keep
 * their color in any light) and one for lit ones (cheeks, spots: they shade with the body).
 */
export function buildDecals(mesh) {
  const C = mesh.compiled;
  const feats = mesh.face ?? [];
  const rows = Math.max(1, Math.ceil(feats.length / ATLAS.cols));
  const sets = { lit: { pos: [], uv: [], bone: [], idx: [] }, unlit: { pos: [], uv: [], bone: [], idx: [] } };
  const cells = [];
  const g = new Float64Array(3);
  const rgb = new Float64Array(3);
  const w = new Float64Array(C.bones.length);
  const eps = mesh.cell * 0.35;
  feats.forEach((f, i) => {
    const R = f.reach * 1.3;
    const col = i % ATLAS.cols;
    const row = Math.floor(i / ATLAS.cols);
    cells.push({ feature: plain(f), col, row, R });
    // the bone that carries the feature: whichever owns its center
    C.full(f.C[0], f.C[1], f.C[2], rgb, w);
    let bone = 0;
    for (let b = 1; b < w.length; b++) if (w[b] > w[bone]) bone = b;
    const set = f.lit ? sets.lit : sets.unlit;
    const base = set.pos.length / 3;
    for (let j = 0; j <= N; j++)
      for (let k = 0; k <= N; k++) {
        const x = ((k / N) * 2 - 1) * R;
        const y = ((j / N) * 2 - 1) * R;
        let p = [0, 1, 2].map((a) => f.C[a] + f.u[a] * x + f.v[a] * y);
        let n = f.n;
        for (let it = 0; it < 6; it++) {
          const d = C.dist(p[0], p[1], p[2]);
          C.grad(p[0], p[1], p[2], eps, g);
          n = norm(g);
          p = [p[0] - n[0] * d, p[1] - n[1] * d, p[2] - n[2] * d];
        }
        set.pos.push(p[0] + n[0] * LIFT, p[1] + n[1] * LIFT, p[2] + n[2] * LIFT);
        set.uv.push((col + k / N) / ATLAS.cols, 1 - (row + 1 - j / N) / rows);
        set.bone.push(bone);
      }
    for (let j = 0; j < N; j++)
      for (let k = 0; k < N; k++) {
        const a = base + j * (N + 1) + k;
        set.idx.push(a, a + 1, a + N + 2, a, a + N + 2, a + N + 1);
      }
  });
  const pack = (s) =>
    s.idx.length
      ? { positions: new Float32Array(s.pos), uvs: new Float32Array(s.uv), bones: new Uint8Array(s.bone), indices: new Uint32Array(s.idx) }
      : null;
  return { lit: pack(sets.lit), unlit: pack(sets.unlit), cells, rows };
}
