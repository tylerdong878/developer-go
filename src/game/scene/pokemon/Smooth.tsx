"use client";

import { useFrame } from "@react-three/fiber";
import { type ComponentType, useEffect, useMemo, useRef, useState } from "react";
import {
  Bone,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  Group,
  MeshBasicMaterial,
  MeshToonMaterial,
  Skeleton,
  SkinnedMesh,
  SRGBColorSpace,
} from "three";
import { renderBudget } from "../../device";
import { goPatch } from "./kit";
import { RECIPES } from "./recipes";
import { ATLAS } from "./sdf/decals.js";
import { featureAt, prepFeature } from "./sdf/face.js";
import type { ModelProps } from "./types";

/*
 * Pokémon as smooth models (notes/research/gfx-characters.md 3-4, 6): each
 * species' recipe is meshed once, off the main thread, into one smooth skinned
 * mesh with its colors blended at the joins, crisp painted markings, and a
 * painted face on decals that hug the head. Every instance gets its own bones
 * (ears, tails, heads move), and all of it shades with GO's soft ramp.
 */

type BoneDef = { name: string; at: [number, number, number]; parent: string | null };
type Cell = { feature: Record<string, unknown>; col: number; row: number; R: number };
type DecalSet = { positions: Float32Array; uvs: Float32Array; bones: Uint8Array; indices: Uint32Array } | null;
type Meshed = {
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  skinIndex: Uint8Array;
  skinWeight: Float32Array;
  indices: Uint32Array;
  paint: { layers: { color: string; soft: number }[]; dist: Float32Array };
  bones: BoneDef[];
  decals: { lit: DecalSet; unlit: DecalSet; cells: Cell[]; rows: number };
};
type Built = {
  body: BufferGeometry;
  bodyMaterial: MeshToonMaterial;
  lit: BufferGeometry | null;
  unlit: BufferGeometry | null;
  litMaterial: MeshToonMaterial | null;
  unlitMaterial: MeshBasicMaterial | null;
  bones: BoneDef[];
};

/* ---------------- meshing, in a worker ---------------- */

let worker: Worker | null | undefined;
const waiting = new Map<number, (m: Meshed | null) => void>();
let nextId = 1;

function getWorker() {
  if (worker !== undefined) return worker;
  try {
    worker = new Worker(new URL("./sdf/worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent<Meshed & { id: number; error?: string }>) => {
      const done = waiting.get(e.data.id);
      waiting.delete(e.data.id);
      done?.(e.data.error ? null : e.data);
    };
    worker.onerror = () => {
      // the worker couldn't start: mesh on the main thread from now on
      worker = null;
      for (const [, done] of waiting) done(null);
      waiting.clear();
    };
  } catch {
    worker = null;
  }
  return worker;
}

async function meshOnMain(dex: number, grid: number): Promise<Meshed | null> {
  const [{ buildMesh }, { buildDecals }] = await Promise.all([import("./sdf/mesh.js"), import("./sdf/decals.js")]);
  const mesh = buildMesh(RECIPES[dex], { grid });
  return {
    ...mesh,
    paint: { layers: mesh.paint.layers.map((l: { colorHex: string; soft: number }) => ({ color: l.colorHex, soft: l.soft })), dist: mesh.paint.dist },
    decals: buildDecals(mesh),
  } as unknown as Meshed;
}

function mesh(dex: number, grid: number): Promise<Meshed | null> {
  const w = getWorker();
  if (!w) return meshOnMain(dex, grid);
  return new Promise((resolve) => {
    const id = nextId++;
    waiting.set(id, (m) => resolve(m ?? meshOnMain(dex, grid)));
    w.postMessage({ id, dex, grid });
  });
}

/* ---------------- geometry, face atlas, materials ---------------- */

const linear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

/** Paints every face feature into its cell of one atlas, supersampled so the edges stay soft. */
function drawAtlas(cells: Cell[], rows: number) {
  const { cols, cellPx } = ATLAS;
  const canvas = document.createElement("canvas");
  canvas.width = cols * cellPx;
  canvas.height = rows * cellPx;
  const g = canvas.getContext("2d")!;
  const img = g.createImageData(canvas.width, canvas.height);
  const rgb = [0, 0, 0];
  const SS = 3;
  for (const cell of cells) {
    const f = prepFeature({ ...cell.feature });
    for (let py = 0; py < cellPx; py++)
      for (let px = 0; px < cellPx; px++) {
        let r = 0;
        let gg = 0;
        let b = 0;
        let a = 0;
        for (let sy = 0; sy < SS; sy++)
          for (let sx = 0; sx < SS; sx++) {
            const x = ((px + (sx + 0.5) / SS) / cellPx * 2 - 1) * cell.R;
            const y = (1 - ((py + (sy + 0.5) / SS) / cellPx) * 2) * cell.R;
            const al = featureAt(f, x, y, rgb);
            if (al <= 0) continue;
            r += rgb[0] * al;
            gg += rgb[1] * al;
            b += rgb[2] * al;
            a += al;
          }
        if (a <= 0) continue;
        const o = ((cell.row * cellPx + py) * canvas.width + cell.col * cellPx + px) * 4;
        img.data[o] = (r / a) * 255;
        img.data[o + 1] = (gg / a) * 255;
        img.data[o + 2] = (b / a) * 255;
        img.data[o + 3] = (a / (SS * SS)) * 255;
      }
  }
  g.putImageData(img, 0, 0);
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function decalGeometry(set: DecalSet) {
  if (!set) return null;
  const g = new BufferGeometry();
  const n = set.positions.length / 3;
  const idx = new Uint8Array(n * 4);
  const wt = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    idx[i * 4] = set.bones[i];
    wt[i * 4] = 1;
  }
  g.setAttribute("position", new BufferAttribute(set.positions, 3));
  g.setAttribute("uv", new BufferAttribute(set.uvs, 2));
  g.setAttribute("skinIndex", new BufferAttribute(idx, 4));
  g.setAttribute("skinWeight", new BufferAttribute(wt, 4));
  g.setIndex(new BufferAttribute(set.indices, 1));
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

/** Up to 8 paint layers (markings), each a crisp edge where its distance crosses zero. */
const PAINT = /* glsl */ `
  for (int i = 0; i < 8; i++) {
    float d = i < 4 ? vPaintA[i] : vPaintB[i - 4];
    float aa = max(fwidth(d), 1e-4);
    float k = 1.0 - smoothstep(-aa, aa, d);
    diffuseColor.rgb = mix(diffuseColor.rgb, paintColor[i], k * step(float(i), float(paintCount) - 0.5));
  }`;

function bodyMaterial(layers: { color: string }[]) {
  const m = new MeshToonMaterial({ vertexColors: true });
  const colors = Array.from({ length: 8 }, (_, i) => new Color(layers[i]?.color ?? "#000000"));
  m.onBeforeCompile = (s) => {
    goPatch(s);
    Object.assign(s.uniforms, { paintColor: { value: colors }, paintCount: { value: layers.length } });
    s.vertexShader = s.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec4 paintA;\nattribute vec4 paintB;\nvarying vec4 vPaintA;\nvarying vec4 vPaintB;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvPaintA = paintA;\nvPaintB = paintB;");
    s.fragmentShader = s.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec4 vPaintA;\nvarying vec4 vPaintB;\nuniform vec3 paintColor[8];\nuniform int paintCount;")
      .replace("#include <color_fragment>", `#include <color_fragment>\n${PAINT}`);
  };
  m.customProgramCacheKey = () => "go-smooth";
  return m;
}

function build(d: Meshed): Built {
  const body = new BufferGeometry();
  const nv = d.positions.length / 3;
  const lin = new Float32Array(d.colors.length);
  for (let i = 0; i < lin.length; i++) lin[i] = linear(d.colors[i]);
  const np = d.paint.layers.length;
  const pa = new Float32Array(nv * 4).fill(0.1);
  const pb = new Float32Array(nv * 4).fill(0.1);
  for (let q = 0; q < nv; q++)
    for (let l = 0; l < Math.min(np, 8); l++) (l < 4 ? pa : pb)[q * 4 + (l % 4)] = d.paint.dist[q * np + l];
  body.setAttribute("position", new BufferAttribute(d.positions, 3));
  body.setAttribute("normal", new BufferAttribute(d.normals, 3));
  body.setAttribute("color", new BufferAttribute(lin, 3));
  body.setAttribute("skinIndex", new BufferAttribute(d.skinIndex, 4));
  body.setAttribute("skinWeight", new BufferAttribute(d.skinWeight, 4));
  body.setAttribute("paintA", new BufferAttribute(pa, 4));
  body.setAttribute("paintB", new BufferAttribute(pb, 4));
  body.setIndex(new BufferAttribute(d.indices, 1));
  body.computeBoundingSphere();
  const atlas = d.decals.cells.length ? drawAtlas(d.decals.cells, d.decals.rows) : null;
  const lit = decalGeometry(d.decals.lit);
  const unlit = decalGeometry(d.decals.unlit);
  const over = { transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 };
  let litMaterial: MeshToonMaterial | null = null;
  if (lit && atlas) {
    litMaterial = new MeshToonMaterial({ map: atlas, ...over });
    litMaterial.onBeforeCompile = goPatch;
    litMaterial.customProgramCacheKey = () => "go-decal";
  }
  return {
    body,
    bodyMaterial: bodyMaterial(d.paint.layers),
    lit,
    unlit,
    litMaterial,
    unlitMaterial: unlit && atlas ? new MeshBasicMaterial({ map: atlas, ...over }) : null,
    bones: d.bones,
  };
}

const built = new Map<number, Built | null>();
const building = new Map<number, Promise<Built | null>>();

/** The species' smooth model, meshed on first use and shared by every instance. */
function load(dex: number) {
  let p = building.get(dex);
  if (!p) {
    const grid = renderBudget().light ? 48 : 64;
    p = mesh(dex, grid).then((m) => {
      const b = m ? build(m) : null;
      built.set(dex, b);
      return b;
    });
    building.set(dex, p);
  }
  return p;
}

function useBuilt(dex: number) {
  const [b, setB] = useState<Built | null | undefined>(() => built.get(dex));
  useEffect(() => {
    if (b !== undefined) return;
    let live = true;
    load(dex).then((x) => live && setB(x));
    return () => {
      live = false;
    };
  }, [dex, b]);
  return b;
}

/* ---------------- one instance: its own bones, and a little life ---------------- */

/** A fresh set of bones for one instance, with the meshes bound to it. */
function rig(b: Built) {
  const group = new Group();
  const bones = b.bones.map((d) => {
    const bone = new Bone();
    bone.name = d.name;
    return bone;
  });
  const byName = new Map(b.bones.map((d, i) => [d.name, i]));
  b.bones.forEach((d, i) => {
    const parent = d.parent !== null ? byName.get(d.parent) : undefined;
    const from = parent !== undefined ? b.bones[parent].at : [0, 0, 0];
    bones[i].position.set(d.at[0] - from[0], d.at[1] - from[1], d.at[2] - from[2]);
    if (parent !== undefined) bones[parent].add(bones[i]);
  });
  const roots = bones.filter((_, i) => b.bones[i].parent === null || !byName.has(b.bones[i].parent!));
  const skeleton = new Skeleton(bones);
  const body = new SkinnedMesh(b.body, b.bodyMaterial);
  roots.forEach((r) => body.add(r));
  body.bind(skeleton);
  group.add(body);
  for (const [geo, mat] of [
    [b.lit, b.litMaterial],
    [b.unlit, b.unlitMaterial],
  ] as const) {
    if (!geo || !mat) continue;
    const decal = new SkinnedMesh(geo, mat);
    decal.bind(skeleton, body.bindMatrix);
    decal.renderOrder = 2;
    group.add(decal);
  }
  group.userData.bones = bones;
  group.userData.rest = bones.map((x) => x.position.clone());
  return group;
}

/** Idle life by bone name: breathing, a head that looks about, ears that twitch, tails that wag, wings that flap. */
function animate(group: Group, t: number, asleep: boolean) {
  const bones = group.userData.bones as Bone[];
  for (const bone of bones) {
    const n = bone.name;
    const side = /R$/.test(n) ? -1 : 1;
    if (n === "root") bone.scale.set(1, 1 + Math.sin(t * (asleep ? 1.3 : 2.4)) * (asleep ? 0.025 : 0.012), 1);
    else if (n === "head" && !asleep) bone.rotation.set(Math.sin(t * 0.7) * 0.04, Math.sin(t * 0.5) * 0.12, Math.sin(t * 0.9) * 0.03);
    else if (/^ear/.test(n)) bone.rotation.z = side * (Math.sin(t * 1.7 + side) * 0.06 + (t % 5.3 < 0.25 ? Math.sin((t % 5.3) * 25) * 0.25 : 0));
    else if (/^tail/.test(n)) bone.rotation.y = Math.sin(t * (asleep ? 1 : 3)) * (asleep ? 0.06 : 0.22);
    else if (/^wing/.test(n)) bone.rotation.z = side * Math.sin(t * 9) * 0.35;
    else if (/^(arm|hand)/.test(n) && !asleep) bone.rotation.x = Math.sin(t * 1.3 + side) * 0.08;
  }
}

/** One smooth Pokémon, 1 tall, feet at y 0, facing +z. Until its mesh is ready, the fallback (the old model) stands in. */
export function SmoothModel({ dex, seed = 0, asleep = false, fallback: Fallback }: ModelProps & { dex: number; fallback?: ComponentType<ModelProps> }) {
  const b = useBuilt(dex);
  const object = useMemo(() => (b ? rig(b) : null), [b]);
  const holder = useRef<Group>(null);
  useFrame(({ clock }) => {
    const g = holder.current?.children[0] as Group | undefined;
    if (g?.userData.bones) animate(g, clock.elapsedTime + seed * 1.7, asleep);
  });
  if (!object) return Fallback ? <Fallback seed={seed} asleep={asleep} /> : null;
  return (
    <group ref={holder}>
      <primitive object={object} />
    </group>
  );
}

/** Starts meshing species ahead of time, so they're ready when they first appear. */
export function preloadSmooth(dexes: number[]) {
  dexes.forEach((d) => {
    if (RECIPES[d]) void load(d);
  });
}
