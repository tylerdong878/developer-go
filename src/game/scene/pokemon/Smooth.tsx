"use client";

import { useFrame } from "@react-three/fiber";
import { type ComponentType, useEffect, useMemo, useRef, useState } from "react";
import {
  Bone,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  Group,
  type Material,
  MeshBasicMaterial,
  MeshToonMaterial,
  Quaternion,
  Skeleton,
  SkinnedMesh,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
} from "three";
import { renderBudget } from "../../device";
import { game } from "../../state";
import { goPatch } from "./kit";
import { RECIPES } from "./recipes";
import { SHINY, shinyRecipe } from "./sdf/shiny.js";
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

/** A species' dex number, or a named model (the swan boat). */
type Key = number | string;
type BoneDef = { name: string; at: [number, number, number]; parent: string | null };
type Cell = { feature: Record<string, unknown>; col: number; row: number; R: number };
type DecalSet = { positions: Float32Array; uvs: Float32Array; bones: Uint8Array; indices: Uint32Array; lid?: Float32Array; axis?: Float32Array } | null;
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
  /** See-through parts (Poliwag's tail fin), meshed apart on the same bones. */
  glass: {
    positions: Float32Array;
    normals: Float32Array;
    colors: Float32Array;
    skinIndex: Uint8Array;
    skinWeight: Float32Array;
    indices: Uint32Array;
    opacity: number;
  } | null;
  /** An unlit glow round it (Rotom's electric aura and bolts), drawn inside out like a halo, with its own paint. */
  halo: (Omit<NonNullable<Meshed["glass"]>, "opacity"> & { paint?: Meshed["paint"] }) | null;
};
type Built = {
  body: BufferGeometry;
  bodyMaterial: MeshToonMaterial;
  lit: BufferGeometry | null;
  unlit: BufferGeometry | null;
  litMaterial: MeshToonMaterial | null;
  unlitMaterial: MeshBasicMaterial | null;
  glass: BufferGeometry | null;
  glassMaterial: MeshToonMaterial | null;
  halo: BufferGeometry | null;
  haloMaterial: Material;
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

/** "shiny:25" is shiny Pikachu: the same recipe in its shiny colors. */
const shinyOf = (key: Key) => {
  const m = /^shiny:(\d+)$/.exec(String(key));
  return m ? Number(m[1]) : null;
};
const baseOf = (key: Key) => shinyOf(key) ?? key;

async function meshOnMain(dex: Key, grid: number): Promise<Meshed | null> {
  const { meshSpecies } = await import("./sdf/species.js");
  const { shinyRecipe } = await import("./sdf/shiny.js");
  const n = shinyOf(dex);
  const recipe = n === null ? RECIPES[dex] : (shinyRecipe(n, RECIPES[n]) ?? RECIPES[n]);
  return meshSpecies(recipe, grid) as unknown as Meshed;
}

function mesh(dex: Key, grid: number): Promise<Meshed | null> {
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
  g.setAttribute("blinkAt", new BufferAttribute(set.lid ?? new Float32Array(n * 4), 4));
  g.setAttribute("blinkAxis", new BufferAttribute(set.axis ?? new Float32Array(n * 3), 3));
  g.setIndex(new BufferAttribute(set.indices, 1));
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

/** Paint (markings) in up to 16 groups, each a crisp edge where its distance crosses zero. */
const LAYERS = 16;
const PAINT = /* glsl */ `
  for (int i = 0; i < ${LAYERS}; i++) {
    vec4 q = i < 4 ? vPaint0 : i < 8 ? vPaint1 : i < 12 ? vPaint2 : vPaint3;
    float d = q[i % 4];
    float aa = max(fwidth(d), 1e-4);
    float k = 1.0 - smoothstep(-aa, aa, d);
    diffuseColor.rgb = mix(diffuseColor.rgb, paintColor[i], k * step(float(i), float(paintCount) - 0.5));
  }`;
const PAINT_ATTRS = [0, 1, 2, 3].map((i) => `attribute vec4 paint${i};\nvarying vec4 vPaint${i};`).join("\n");
const PAINT_VARYINGS = [0, 1, 2, 3].map((i) => `varying vec4 vPaint${i};`).join("\n");
const PAINT_COPY = [0, 1, 2, 3].map((i) => `vPaint${i} = paint${i};`).join("\n");

/**
 * The recipe's paint layers, grouped by color: layers of one color are one
 * union (the nearer distance wins), placed where that color last appears, so
 * a dozen spots cost one slot.
 */
function paintGroups(d: Meshed) {
  const np = d.paint.layers.length;
  const groups: { color: string; layers: number[] }[] = [];
  d.paint.layers.forEach((l, i) => {
    const at = groups.findIndex((g) => g.color.toLowerCase() === l.color.toLowerCase());
    if (at >= 0) {
      const [g] = groups.splice(at, 1);
      g.layers.push(i);
      groups.push(g);
    } else groups.push({ color: l.color, layers: [i] });
  });
  const kept = groups.slice(-LAYERS);
  const nv = d.positions.length / 3;
  const attrs = [0, 1, 2, 3].map(() => new Float32Array(nv * 4).fill(0.1));
  for (let q = 0; q < nv; q++)
    kept.forEach((g, slot) => {
      let best = 0.1;
      for (const l of g.layers) best = Math.min(best, d.paint.dist[q * np + l]);
      attrs[slot >> 2][q * 4 + (slot & 3)] = best;
    });
  return { colors: kept.map((g) => g.color), attrs };
}

function bodyMaterial(layers: string[]) {
  const m = new MeshToonMaterial({ vertexColors: true });
  const colors = Array.from({ length: LAYERS }, (_, i) => new Color(layers[i] ?? "#000000"));
  m.onBeforeCompile = (s) => {
    goPatch(s);
    Object.assign(s.uniforms, { paintColor: { value: colors }, paintCount: { value: layers.length } });
    s.vertexShader = s.vertexShader
      .replace("#include <common>", `#include <common>\n${PAINT_ATTRS}`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>\n${PAINT_COPY}`);
    s.fragmentShader = s.fragmentShader
      .replace("#include <common>", `#include <common>\n${PAINT_VARYINGS}\nuniform vec3 paintColor[${LAYERS}];\nuniform int paintCount;`)
      .replace("#include <color_fragment>", `#include <color_fragment>\n${PAINT}`);
  };
  m.customProgramCacheKey = () => "go-smooth";
  return m;
}

/** A skinned geometry from meshed arrays, colors to linear. */
function skinned(m: NonNullable<Meshed["halo"]>) {
  const g = new BufferGeometry();
  const lin = new Float32Array(m.colors.length);
  for (let i = 0; i < lin.length; i++) lin[i] = linear(m.colors[i]);
  g.setAttribute("position", new BufferAttribute(m.positions, 3));
  g.setAttribute("normal", new BufferAttribute(m.normals, 3));
  g.setAttribute("color", new BufferAttribute(lin, 3));
  g.setAttribute("skinIndex", new BufferAttribute(m.skinIndex, 4));
  g.setAttribute("skinWeight", new BufferAttribute(m.skinWeight, 4));
  g.setIndex(new BufferAttribute(m.indices, 1));
  g.computeBoundingSphere();
  return g;
}

const haloMaterial = new MeshBasicMaterial({ vertexColors: true, side: BackSide });

/** The glow with its paint (Rotom's bolts: white inside a cyan rim), unlit and inside out like the plain one. */
function paintedHalo(layers: string[]) {
  const m = new MeshBasicMaterial({ vertexColors: true, side: BackSide });
  const colors = Array.from({ length: LAYERS }, (_, i) => new Color(layers[i] ?? "#000000").convertSRGBToLinear());
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, { paintColor: { value: colors }, paintCount: { value: layers.length } });
    s.vertexShader = s.vertexShader
      .replace("#include <common>", `#include <common>\n${PAINT_ATTRS}`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>\n${PAINT_COPY}`);
    s.fragmentShader = s.fragmentShader
      .replace("#include <common>", `#include <common>\n${PAINT_VARYINGS}\nuniform vec3 paintColor[${LAYERS}];\nuniform int paintCount;`)
      .replace("#include <color_fragment>", `#include <color_fragment>\n${PAINT}`);
  };
  m.customProgramCacheKey = () => "go-halo-paint";
  return m;
}

/** The glow's geometry and material: painted if its recipe has paint. */
function haloPart(d: Meshed) {
  if (!d.halo) return { halo: null, haloMaterial };
  const g = skinned(d.halo);
  const paint = d.halo.paint;
  if (!paint?.layers.length) return { halo: g, haloMaterial };
  const groups = paintGroups({ ...d, positions: d.halo.positions, paint });
  groups.attrs.forEach((a, i) => g.setAttribute(`paint${i}`, new BufferAttribute(a, 4)));
  return { halo: g, haloMaterial: paintedHalo(groups.colors) };
}

/** The see-through parts: their own mesh, GO-shaded, drawn after the body without writing depth. */
function glassPart(d: Meshed) {
  if (!d.glass) return { glass: null, glassMaterial: null };
  const g = skinned(d.glass);
  const m = new MeshToonMaterial({ vertexColors: true, transparent: true, opacity: d.glass.opacity, depthWrite: false, side: DoubleSide });
  m.onBeforeCompile = goPatch;
  m.customProgramCacheKey = () => "go-glass";
  return { glass: g, glassMaterial: m };
}

function build(d: Meshed): Built {
  const body = new BufferGeometry();
  const lin = new Float32Array(d.colors.length);
  for (let i = 0; i < lin.length; i++) lin[i] = linear(d.colors[i]);
  const paint = paintGroups(d);
  body.setAttribute("position", new BufferAttribute(d.positions, 3));
  body.setAttribute("normal", new BufferAttribute(d.normals, 3));
  body.setAttribute("color", new BufferAttribute(lin, 3));
  body.setAttribute("skinIndex", new BufferAttribute(d.skinIndex, 4));
  body.setAttribute("skinWeight", new BufferAttribute(d.skinWeight, 4));
  paint.attrs.forEach((a, i) => body.setAttribute(`paint${i}`, new BufferAttribute(a, 4)));
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
    bodyMaterial: bodyMaterial(paint.colors),
    lit,
    unlit,
    litMaterial,
    unlitMaterial: unlit && atlas ? new MeshBasicMaterial({ map: atlas, ...over }) : null,
    ...glassPart(d),
    ...haloPart(d),
    bones: d.bones,
  };
}

/**
 * One instance's face material: the species' own, plus a blink. Each open eye's
 * grid squashes toward its middle along its up, so it shuts to a line and opens
 * again (`blink` 1 open, 0 shut), all on the GPU.
 */
function blinking(base: Material, blink: { value: number }) {
  const m = base.clone();
  const before = base.onBeforeCompile;
  m.onBeforeCompile = (s, r) => {
    before.call(base, s, r);
    s.uniforms.blink = blink;
    s.vertexShader = s.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec4 blinkAt;\nattribute vec3 blinkAxis;\nuniform float blink;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\ntransformed -= blinkAxis * dot(transformed - blinkAt.xyz, blinkAxis) * (1.0 - blink) * blinkAt.w;");
  };
  const key = base.customProgramCacheKey();
  m.customProgramCacheKey = () => `${key}-blink`;
  return m;
}

/** How open the eyes are at a moment: a quick blink every few seconds, now and then two in a row. */
const BLINK = 0.14;
function lidAt(t: number) {
  const period = 4.3;
  const into = t % period;
  const shut = (q: number) => (q >= 0 && q < BLINK ? Math.sin((q / BLINK) * Math.PI) : 0);
  const c = shut(into) + (Math.floor(t / period) % 4 === 1 ? shut(into - 0.3) : 0);
  return 1 - 0.92 * Math.min(1, c);
}

const built = new Map<Key, Built | null>();
const building = new Map<Key, Promise<Built | null>>();

/** The species' smooth model, meshed on first use and shared by every instance. */
function load(dex: Key) {
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

function useBuilt(dex: Key) {
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
  if (b.halo) {
    const halo = new SkinnedMesh(b.halo, b.haloMaterial);
    halo.bind(skeleton, body.bindMatrix);
    group.add(halo);
  }
  if (b.glass && b.glassMaterial) {
    const glass = new SkinnedMesh(b.glass, b.glassMaterial);
    glass.bind(skeleton, body.bindMatrix);
    glass.renderOrder = 3;
    group.add(glass);
  }
  const blink = { value: 1 };
  for (const [geo, mat] of [
    [b.lit, b.litMaterial],
    [b.unlit, b.unlitMaterial],
  ] as const) {
    if (!geo || !mat) continue;
    const decal = new SkinnedMesh(geo, blinking(mat, blink));
    decal.bind(skeleton, body.bindMatrix);
    decal.renderOrder = 2;
    group.add(decal);
  }
  group.userData.bones = bones;
  group.userData.rest = bones.map((x) => x.position.clone());
  group.userData.blink = blink;
  group.userData.look = 0;
  return group;
}

/** Idle life by bone name: breathing, a head that looks about, ears that twitch, tails that wag, wings that flap. */
/** How each species' wings move at idle (bones named wing*): none unless listed. */
const WINGS: Partial<Record<Key, "flap" | "soar" | "glide" | "flutter" | "buzz">> = { 41: "flap", 16: "flutter", 278: "glide", 479: "buzz", 255: "flutter", 144: "soar", 488: "glide" };
/** Long tails (bones tail1, tail2...) add up down their length, so these wag smaller and slower: [size, speed]. */
const TAILS: Partial<Record<Key, [number, number]>> = { 144: [0.3, 0.5], 488: [0.25, 0.4] };

function wingAngle(kind: string | undefined, t: number) {
  if (kind === "flap") return Math.sin(t * 9) * 0.35;
  if (kind === "buzz") return Math.sin(t * 14) * 0.08;
  // big slow beats, for a big bird holding itself up
  if (kind === "soar") return Math.sin(t * 2.6) * 0.32;
  // a few quick beats every few seconds, still in between
  const burst = (p: number) => (t % p < 0.5 ? Math.sin((t % p) * Math.PI * 6) : 0);
  if (kind === "glide") return Math.sin(t * 0.8) * 0.06 + burst(4.7) * 0.4;
  if (kind === "flutter") return Math.abs(burst(6.5)) * 0.5;
  return 0;
}

function animate(group: Group, t: number, asleep: boolean, look: number) {
  const wings = WINGS[group.userData.key as Key];
  const [wag, pace] = TAILS[group.userData.key as Key] ?? [1, 1];
  const bones = group.userData.bones as Bone[];
  for (const bone of bones) {
    const n = bone.name;
    const side = /R$/.test(n) ? -1 : 1;
    if (n === "root") bone.scale.set(1, 1 + Math.sin(t * (asleep ? 1.3 : 2.4)) * (asleep ? 0.025 : 0.012), 1);
    else if (n === "head" && !asleep) bone.rotation.set(Math.sin(t * 0.7) * 0.04, Math.sin(t * 0.5) * 0.12 * (1 - Math.min(1, Math.abs(look) * 3)) + look, Math.sin(t * 0.9) * 0.03);
    else if (/^ear/.test(n)) bone.rotation.z = side * (Math.sin(t * 1.7 + side) * 0.06 + (t % 5.3 < 0.25 ? Math.sin((t % 5.3) * 25) * 0.25 : 0));
    else if (/^tail/.test(n)) bone.rotation.y = Math.sin(t * (asleep ? 1 : 3 * pace)) * (asleep ? 0.06 : 0.22) * wag;
    else if (/^wing/.test(n)) bone.rotation.z = side * wingAngle(wings, t);
    else if (/^(arm|hand)/.test(n) && !asleep) bone.rotation.x = Math.sin(t * 1.3 + side) * 0.08;
  }
}

type Aura = {
  color: string;
  core: string;
  opacity: number;
  center: [number, number, number];
  back: number;
  puffs: [number, number, number][];
  wisps: [number, number, number][];
  churn: { scale: number; speed: [number, number]; spin: number };
};

const puff = new SphereGeometry(1, 16, 12);
const parentTurn = new Quaternion();

/**
 * A see-through cloud round the body (Gastly's gas): soft puffs in a plane that
 * always faces the camera, a little behind the body, churning and turning.
 */
function AuraCloud({ aura, seed }: { aura: Aura; seed: number }) {
  const group = useRef<Group>(null);
  const materials = useMemo(
    () => ({
      outer: new MeshBasicMaterial({ color: aura.color, transparent: true, opacity: aura.opacity, depthWrite: false }),
      core: new MeshBasicMaterial({ color: aura.core, transparent: true, opacity: aura.opacity, depthWrite: false }),
    }),
    [aura],
  );
  const toCamera = useMemo(() => new Vector3(), []);
  useFrame(({ camera, clock }) => {
    const g = group.current;
    if (!g?.parent) return;
    const t = clock.elapsedTime + seed;
    // face the camera, and sit a little behind the body from where it's seen
    g.parent.worldToLocal(toCamera.copy(camera.position));
    toCamera.sub(g.position.set(...aura.center)).normalize();
    g.position.addScaledVector(toCamera, -aura.back);
    // world rotation = the camera's: undo the parent's turn
    g.quaternion.copy(g.parent.getWorldQuaternion(parentTurn).invert()).multiply(camera.quaternion);
    g.rotateZ(Math.sin(t * aura.churn.spin) * 0.3);
    g.children.forEach((c, i) => {
      const k = 1 + Math.sin(t * aura.churn.speed[i % 2] + i * 1.7) * aura.churn.scale;
      c.scale.setScalar((c.userData.r as number) * k);
    });
  });
  return (
    <group ref={group}>
      {[...aura.puffs.map((p) => [p, materials.outer] as const), ...aura.wisps.map((p) => [p, materials.core] as const)].map(([[x, y, r], m], i) => (
        <mesh key={i} geometry={puff} material={m} position={[x, y, 0]} scale={r} userData={{ r }} renderOrder={-1} />
      ))}
    </group>
  );
}

/** One smooth model, 1 tall (people and Teddy too, with `idle={false}` so their own code walks them), feet at y 0, facing +z. Until its mesh is ready, the fallback (the old model) stands in. */
/** How close the trainer comes before a Pokémon looks over (m), and scratch vectors for it. */
const LOOK = 6;
const here = new Vector3();
const there = new Vector3();

export function SmoothModel({
  dex: base,
  seed = 0,
  asleep = false,
  idle = true,
  shiny = false,
  fallback: Fallback,
}: ModelProps & { dex: Key; idle?: boolean; fallback?: ComponentType<ModelProps> }) {
  const dex: Key = shiny && SHINY[base as number] ? `shiny:${base}` : base;
  const b = useBuilt(dex);
  const object = useMemo(() => {
    if (!b) return null;
    const o = rig(b);
    // the idle (wings, tails) goes by the species
    o.userData.key = baseOf(dex);
    return o;
  }, [b, dex]);
  const holder = useRef<Group>(null);
  useFrame(({ clock }, dt) => {
    const h = holder.current;
    const g = h?.children[0] as Group | undefined;
    if (!h || !g?.userData.bones) return;
    const t = clock.elapsedTime + seed * 1.7;
    if (!asleep) g.userData.blink.value = lidAt(t + seed * 2.3);
    if (!idle) return;
    // within a few meters, the head turns (as far as a head turns) toward the trainer, and back when they go
    let want = 0;
    if (!asleep) {
      h.getWorldPosition(here);
      const d = here.distanceTo(game.player.trainer.position);
      if (d < LOOK && d > 0.4) {
        h.worldToLocal(there.copy(game.player.trainer.position));
        want = Math.max(-0.75, Math.min(0.75, Math.atan2(there.x, there.z)));
      }
    }
    g.userData.look += (want - g.userData.look) * Math.min(1, dt * 4);
    animate(g, t, asleep, g.userData.look);
  });
  if (!object) return Fallback ? <Fallback seed={seed} asleep={asleep} /> : null;
  const plain = (RECIPES[baseOf(dex)] as { aura?: Aura }).aura;
  const aura = plain && shinyOf(dex) !== null ? ((shinyRecipe(shinyOf(dex)!, { aura: plain }) as { aura: Aura } | null)?.aura ?? plain) : plain;
  return (
    <group ref={holder}>
      <primitive object={object} />
      {aura ? <AuraCloud aura={aura} seed={seed} /> : null}
    </group>
  );
}

/** Starts meshing species ahead of time, so they're ready when they first appear. */
export function preloadSmooth(dexes: Key[]) {
  dexes.forEach((d) => {
    if (RECIPES[d]) void load(d);
  });
}
