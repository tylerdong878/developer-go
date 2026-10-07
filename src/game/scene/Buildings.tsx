"use client";

import { useFrame, useLoader } from "@react-three/fiber";
import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import {
  BoxGeometry,
  type BufferGeometry,
  Color,
  Float32BufferAttribute,
  BufferGeometry as Geometry,
  InstancedBufferAttribute,
  type InstancedMesh,
  Matrix4,
  type Mesh,
  MeshLambertMaterial,
  NearestFilter,
  Quaternion,
  type Texture,
  Vector3,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { buildings } from "../base";
import type { Building, ModelId } from "../lots";
import { game } from "../state";

/** Shared by every building material: 1 after dark, so windows glow. */
const town = { uNight: { value: 0 } };

/**
 * A Lambert material with two extras for the town: buildings fade out (as a
 * dither, so nothing needs sorting) when they stand between the camera and
 * the trainer, and after dark, glass glows warm. On the Kenney models the
 * glass is found by its color in the texture; house windows are marked glass.
 */
function townMaterial({ map, glass = false }: { map?: Texture; glass?: boolean }) {
  const material = new MeshLambertMaterial({ color: "#ffffff", alphaHash: true });
  if (map) {
    // Kenney's models share one small palette texture: sample it crisp, or colors bleed into gray.
    map.minFilter = NearestFilter;
    map.magFilter = NearestFilter;
    map.generateMipmaps = false;
    map.needsUpdate = true;
    material.map = map;
  }
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uNight = town.uNight;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float aFade;\nvarying float vFade;\nvarying vec3 vTown;")
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvFade = aFade;\nvTown = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uNight;
varying float vFade;
varying vec3 vTown;
float townHash(vec3 p) { return fract(sin(dot(floor(p * 0.4), vec3(127.1, 311.7, 74.7))) * 43758.5453); }`,
      )
      .replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.a *= vFade;")
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
{
  ${glass ? "float isGlass = 1.0;" : map ? "vec3 c = diffuseColor.rgb; float isGlass = step(0.5, c.b) * step(0.1, c.b - c.r);" : "float isGlass = 0.0;"}
  float lit = step(0.35, townHash(vTown));
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.16, 0.2, 0.32), uNight * isGlass);
  totalEmissiveRadiance += uNight * isGlass * lit * vec3(1.0, 0.78, 0.45);
}`,
      );
  };
  return material;
}

/** A gable: a triangular prism one unit on each side, ridge along x, sitting on y = 0. */
function gableGeometry() {
  const g = new Geometry();
  const h = 0.5;
  // prettier-ignore
  const p = [
    -h, 0, -h,  h, 0, -h,  h, 1, 0,   -h, 0, -h,  h, 1, 0,  -h, 1, 0,
    -h, 0,  h, -h, 1, 0,   h, 1, 0,   -h, 0,  h,  h, 1, 0,   h, 0, h,
    -h, 0, -h, -h, 1, 0,  -h, 0, h,    h, 0, -h,  h, 0, h,   h, 1, 0,
  ];
  g.setAttribute("position", new Float32BufferAttribute(p, 3));
  g.computeVertexNormals();
  return g;
}

/** One instance of a part: which building it belongs to, where it sits, and its color. */
type Piece = { b: number; m: Matrix4; color: string };

const Y = new Vector3(0, 1, 0);
const X = new Vector3(1, 0, 0);
const placeOf = (b: Building) => new Matrix4().compose(new Vector3(b.x, 0, b.z), new Quaternion().setFromAxisAngle(Y, b.turn), new Vector3(1, 1, 1));
const local = (x: number, y: number, z: number, sx: number, sy: number, sz: number, tilt = 0) =>
  new Matrix4().compose(new Vector3(x, y, z), new Quaternion().setFromAxisAngle(X, tilt), new Vector3(sx, sy, sz));

/**
 * A Pokémon-town house, part by part, front facing +z: a stone base, cream
 * walls, a tall gable roof with deep eaves, a chimney, a door under a little
 * awning, and framed windows on the front and sides.
 */
function housePieces(): Record<string, Piece[]> {
  const out: Record<string, Piece[]> = { base: [], walls: [], gable: [], roof: [], chimney: [], door: [], frame: [], glass: [] };
  buildings.forEach((b, i) => {
    if (b.model !== "house") return;
    const sideways = Math.round(b.turn / (Math.PI / 2)) % 2 !== 0;
    const W = sideways ? b.d : b.w;
    const D = sideways ? b.w : b.d;
    const H = b.h;
    const rise = D * 0.5;
    const at = placeOf(b);
    const add = (part: string, m: Matrix4, color: string) => out[part].push({ b: i, m: at.clone().multiply(m), color });
    const roof = b.roof ?? "#d8483c";
    add("base", local(0, 0.18, 0, W + 0.35, 0.36, D + 0.35), "#9aa1ab");
    add("walls", local(0, H / 2, 0, W, H, D), b.color);
    add("gable", local(0, H, 0, W, rise, D), b.color);
    // two roof slabs from the ridge down past the walls
    const run = D / 2 + 0.7;
    const slope = Math.atan2(rise, D / 2);
    for (const side of [-1, 1]) {
      const y = H + rise - (run / 2) * Math.tan(slope) + 0.17 / Math.cos(slope);
      add("roof", local(0, y, (side * run) / 2, W + 1.1, 0.34, run / Math.cos(slope) + 0.2, side * slope), roof);
    }
    add("chimney", local(W * 0.28, H + rise * 0.7, -D * 0.18, 0.75, rise * 0.9 + 0.8, 0.75), "#b5654a");
    add("door", local(-W * 0.2, 1.35, D / 2 + 0.05, 1.15, 1.95, 0.14), "#7a4a2c");
    add("roof", local(-W * 0.2, 2.6, D / 2 + 0.4, 1.9, 0.16, 0.85), roof); // awning over the door
    const windows: [number, number, number, boolean][] = [
      [W * 0.22, 1.95, D / 2 + 0.05, false],
      [W / 2 + 0.05, 1.95, 0, true],
      [-W / 2 - 0.05, 1.95, 0, true],
    ];
    for (const [x, y, z, side] of windows) {
      add("frame", local(x, y, z, side ? 0.14 : 1.35, 1.15, side ? 1.35 : 0.14), "#ffffff");
      add("glass", local(x, y, z, side ? 0.2 : 1.0, 0.82, side ? 1.0 : 0.2), "#9fd3f2");
    }
  });
  return out;
}

const box = new BoxGeometry(1, 1, 1);
const HOUSE_PARTS: Record<string, BufferGeometry> = {
  base: box,
  walls: box,
  gable: gableGeometry(),
  roof: box,
  chimney: box,
  door: box,
  frame: box,
  glass: box,
};

/** An instanced layer: one geometry and material, one instance per piece. */
function Layer({ geometry, material, pieces }: { geometry: BufferGeometry; material: MeshLambertMaterial; pieces: Piece[] }) {
  const mesh = useRef<InstancedMesh>(null);
  const geo = useMemo(() => geometry.clone(), [geometry]);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    pieces.forEach((p, k) => {
      m.setMatrixAt(k, p.m);
      m.setColorAt(k, new Color(p.color));
    });
    geo.setAttribute("aFade", new InstancedBufferAttribute(new Float32Array(pieces.length).fill(1), 1));
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [pieces, geo]);

  // Anything standing between the camera and the trainer fades to a ghost.
  useFrame(() => {
    const attr = mesh.current?.geometry.getAttribute("aFade") as InstancedBufferAttribute | undefined;
    if (!attr) return;
    let changed = false;
    pieces.forEach((p, k) => {
      const want = fade[p.b];
      if (Math.abs((attr.array[k] as number) - want) > 0.004) {
        attr.array[k] = want;
        changed = true;
      }
    });
    if (changed) attr.needsUpdate = true;
  });

  return <instancedMesh ref={mesh} args={[geo, material, pieces.length]} castShadow receiveShadow />;
}

/** How visible each building is right now (1 solid, low when it's in the way), shared by all its parts. */
const fade = new Float32Array(buildings.length).fill(1);

function FadeTracker() {
  useFrame(({ camera }, dt) => {
    const { position } = game.player.trainer;
    const cx = camera.position.x;
    const cz = camera.position.z;
    const sx = position.x - cx;
    const sz = position.z - cz;
    const k = 1 - Math.exp(-8 * dt);
    buildings.forEach((b, i) => {
      let blocking = false;
      for (let t = 0.1; t <= 0.96 && !blocking; t += 0.08) {
        blocking = Math.abs(cx + sx * t - b.x) < b.w / 2 + 0.8 && Math.abs(cz + sz * t - b.z) < b.d / 2 + 0.8;
      }
      fade[i] += ((blocking ? 0.22 : 1) - fade[i]) * k;
    });
  });
  return null;
}

const OFFICE_MODELS = [...new Set(buildings.filter((b) => b.model !== "house").map((b) => b.model as ModelId))];
const urls = OFFICE_MODELS.map((m) => `/models/${m}.glb`);

/** The offices and towers: Kenney's city kit models, one instanced mesh per model. */
function Offices() {
  const gltfs = useLoader(GLTFLoader, urls, (loader) => loader.setMeshoptDecoder(MeshoptDecoder));
  const layers = useMemo(
    () =>
      OFFICE_MODELS.map((model, j) => {
        let mesh: Mesh | null = null;
        gltfs[j].scene.traverse((o) => {
          if (!mesh && (o as Mesh).isMesh) mesh = o as Mesh;
        });
        const found = mesh as Mesh | null;
        const geometry = found ? found.geometry.clone().applyMatrix4(found.matrixWorld) : box;
        const map = found ? ((found.material as MeshLambertMaterial).map ?? undefined) : undefined;
        const pieces: Piece[] = [];
        buildings.forEach((b, i) => {
          if (b.model !== model) return;
          pieces.push({ b: i, m: placeOf(b).multiply(new Matrix4().makeScale(b.scale, b.scale, b.scale)), color: b.color });
        });
        return { model, geometry, material: townMaterial({ map }), pieces };
      }),
    [gltfs],
  );
  return (
    <>
      {layers.map((l) => (
        <Layer key={l.model} geometry={l.geometry} material={l.material} pieces={l.pieces} />
      ))}
    </>
  );
}

function Houses() {
  const parts = useMemo(() => {
    const pieces = housePieces();
    const plain = townMaterial({});
    const glass = townMaterial({ glass: true });
    return Object.entries(pieces).map(([part, list]) => ({ part, list, material: part === "glass" ? glass : plain }));
  }, []);
  return (
    <>
      {parts.map(({ part, list, material }) => (
        <Layer key={part} geometry={HOUSE_PARTS[part]} material={material} pieces={list} />
      ))}
    </>
  );
}

/**
 * The neighborhood: Pokémon-town houses built from parts, and offices and
 * towers from Kenney's city kit, all instanced. After dark, windows light up.
 */
export function Buildings({ night }: { night: boolean }) {
  useFrame(() => {
    town.uNight.value += ((night ? 1 : 0) - town.uNight.value) * 0.08;
  });
  return (
    <>
      <FadeTracker />
      <Houses />
      <Suspense fallback={null}>
        <Offices />
      </Suspense>
    </>
  );
}
