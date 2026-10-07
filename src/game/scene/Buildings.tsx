"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import {
  BoxGeometry,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  type InstancedMesh,
  Matrix4,
  MeshLambertMaterial,
  Quaternion,
  Vector3,
} from "three";
import { buildings } from "../base";
import type { Building, BuildingKind } from "../lots";
import { random } from "../geometry";
import { game } from "../state";

/** Window patterns by kind, read by the wall shader: 0 house, 1 office, 2 glass tower, 3 brick, 4 shop. */
const STYLE: Record<BuildingKind, number> = { house: 0, office: 1, tower: 2, brick: 3, shop: 4 };

const ROOFS = ["#c0583f", "#6b7f99", "#8a5a3b", "#4f6d5a", "#a24d4d"];
const CAP = "#d4d9df";

/** Shared by every building material: 1 after dark, so lit windows glow. */
const town = { uNight: { value: 0 } };

/**
 * A Lambert material with two extras for the town: buildings fade out (as a
 * dither, so nothing needs sorting) when they stand between the camera and
 * the trainer, and walls get windows drawn by the shader, so one box per
 * building is all it takes.
 */
function townMaterial(windows: boolean) {
  const material = new MeshLambertMaterial({ color: "#ffffff", alphaHash: true });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uNight = town.uNight;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
attribute float aFade;
attribute float aStyle;
attribute float aHeight;
varying float vFade;
varying float vStyle;
varying float vHeight;
varying vec3 vTown;
varying vec3 vTownNormal;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vFade = aFade;
vStyle = aStyle;
vHeight = aHeight;
vTown = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
vTownNormal = normalize(mat3(modelMatrix * instanceMatrix) * objectNormal);`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uNight;
varying float vFade;
varying float vStyle;
varying float vHeight;
varying vec3 vTown;
varying vec3 vTownNormal;
float townHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }`,
      )
      .replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.a *= vFade;")
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
${
  windows
    ? `if (abs(vTownNormal.y) < 0.5) {
  float u = abs(vTownNormal.x) > 0.5 ? vTown.z : vTown.x;
  float v = vTown.y;
  int style = int(vStyle + 0.5);
  // cell size and how much of each cell is glass, per style
  vec2 cell = style == 2 ? vec2(1.7, 3.0) : style == 3 ? vec2(2.8, 3.4) : style == 0 ? vec2(2.4, 2.2) : vec2(2.6, 3.2);
  vec2 glass = style == 2 ? vec2(0.86, 0.72) : style == 3 ? vec2(0.42, 0.56) : style == 0 ? vec2(0.4, 0.42) : vec2(0.62, 0.5);
  vec2 id = floor(vec2(u, v - 0.9) / cell);
  vec2 f = fract(vec2(u, v - 0.9) / cell);
  bool inWindow = abs(f.x - 0.5) < glass.x * 0.5 && abs(f.y - 0.5) < glass.y * 0.5;
  bool inWall = v > 1.1 && v < vHeight - (style == 0 ? 0.4 : 1.0);
  if (style == 4) { inWindow = v > 0.5 && v < 3.0 && abs(fract(u / 4.0) - 0.5) < 0.45; inWall = true; }
  if (inWindow && inWall) {
    float lit = step(0.42, townHash(id + floor(vTown.xz * 0.05)));
    vec3 day = mix(vec3(0.55, 0.72, 0.88), vec3(0.78, 0.89, 0.97), f.y);
    vec3 dark = vec3(0.12, 0.17, 0.28);
    diffuseColor.rgb = mix(day, dark, uNight);
    totalEmissiveRadiance += uNight * lit * vec3(1.0, 0.78, 0.45) * 0.95;
  }
}`
    : ""
}`,
      );
  };
  return material;
}

/** A gable roof: a triangular prism one unit on each side, ridge along x, sitting on y = 0. */
function gableGeometry() {
  const g = new BufferGeometry();
  const h = 0.5;
  // prettier-ignore
  const p = [
    // two sloped faces
    -h, 0, -h,  h, 0, -h,  h, 1, 0,   -h, 0, -h,  h, 1, 0,  -h, 1, 0,
    -h, 0,  h, -h, 1, 0,   h, 1, 0,   -h, 0,  h,  h, 1, 0,   h, 0, h,
    // gable ends
    -h, 0, -h, -h, 1, 0,  -h, 0, h,    h, 0, -h,  h, 0, h,   h, 1, 0,
  ];
  g.setAttribute("position", new Float32BufferAttribute(p, 3));
  g.computeVertexNormals();
  return g;
}

/** One instanced layer of the town: bodies, roof caps, or gable roofs. */
type Part = { geometry: BufferGeometry; items: { b: Building; i: number }[]; place: (b: Building, m: Matrix4) => void; color: (b: Building, i: number) => string };

const UP = new Vector3(0, 1, 0);
const scratch = { q: new Quaternion().setFromAxisAngle(UP, 0), p: new Vector3(), s: new Vector3() };

function makeParts(): Record<"bodies" | "caps" | "roofs", Part> {
  const rand = random(31);
  const body = new BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const cap = new BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const all = buildings.map((b, i) => ({ b, i }));
  const roofColor = buildings.map(() => ROOFS[Math.floor(rand() * ROOFS.length)]);
  return {
    bodies: {
      geometry: body,
      items: all,
      place: (b, m) => m.compose(scratch.p.set(b.x, 0, b.z), scratch.q, scratch.s.set(b.w, b.h, b.d)),
      color: (b) => b.color,
    },
    caps: {
      geometry: cap,
      items: all.filter(({ b }) => b.kind !== "house"),
      place: (b, m) => m.compose(scratch.p.set(b.x, b.h, b.z), scratch.q, scratch.s.set(b.w + 0.3, 0.45, b.d + 0.3)),
      color: (b) => (b.kind === "brick" ? "#efe9df" : CAP),
    },
    roofs: {
      geometry: gableGeometry(),
      items: all.filter(({ b }) => b.kind === "house"),
      place: (b, m) => m.compose(scratch.p.set(b.x, b.h, b.z), scratch.q, scratch.s.set(b.w + 0.8, Math.min(b.w, b.d) * 0.42, b.d + 0.8)),
      color: (_, i) => roofColor[i],
    },
  };
}

function Layer({ part, windows }: { part: Part; windows: boolean }) {
  const mesh = useRef<InstancedMesh>(null);
  const material = useMemo(() => townMaterial(windows), [windows]);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const matrix = new Matrix4();
    const n = part.items.length;
    const fade = new Float32Array(n).fill(1);
    const style = new Float32Array(n);
    const height = new Float32Array(n);
    part.items.forEach(({ b, i }, k) => {
      part.place(b, matrix);
      m.setMatrixAt(k, matrix);
      m.setColorAt(k, new Color(part.color(b, i)));
      style[k] = STYLE[b.kind];
      height[k] = b.h;
    });
    part.geometry.setAttribute("aFade", new InstancedBufferAttribute(fade, 1));
    part.geometry.setAttribute("aStyle", new InstancedBufferAttribute(style, 1));
    part.geometry.setAttribute("aHeight", new InstancedBufferAttribute(height, 1));
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [part]);

  // Anything standing between the camera and the trainer fades to a ghost.
  useFrame(({ camera }, dt) => {
    const m = mesh.current;
    const attr = m?.geometry.getAttribute("aFade") as InstancedBufferAttribute | undefined;
    if (!attr) return;
    const { position } = game.player.trainer;
    const cx = camera.position.x;
    const cz = camera.position.z;
    const sx = position.x - cx;
    const sz = position.z - cz;
    const k = 1 - Math.exp(-8 * dt);
    let changed = false;
    part.items.forEach(({ b }, j) => {
      // Sample the camera-to-trainer line; if it crosses the footprint, the building's in the way.
      let blocking = false;
      for (let t = 0.1; t <= 0.96 && !blocking; t += 0.08) {
        const px = cx + sx * t;
        const pz = cz + sz * t;
        blocking = Math.abs(px - b.x) < b.w / 2 + 0.8 && Math.abs(pz - b.z) < b.d / 2 + 0.8;
      }
      const want = blocking ? 0.22 : 1;
      const now = attr.array[j] as number;
      if (Math.abs(want - now) > 0.004) {
        attr.array[j] = now + (want - now) * k;
        changed = true;
      }
    });
    if (changed) attr.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[part.geometry, material, part.items.length]} castShadow receiveShadow />
  );
}

/**
 * The neighborhood: every building is a box with shader-drawn windows, with
 * flat roofs on the bigger ones and gables on the houses. Three draw calls
 * for the whole town. After dark, a scatter of windows lights up warm.
 */
export function Buildings({ night }: { night: boolean }) {
  const parts = useMemo(() => makeParts(), []);
  useFrame(() => {
    town.uNight.value += ((night ? 1 : 0) - town.uNight.value) * 0.08;
  });
  return (
    <>
      <Layer part={parts.bodies} windows />
      <Layer part={parts.caps} windows={false} />
      <Layer part={parts.roofs} windows={false} />
    </>
  );
}
