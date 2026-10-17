"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  type InstancedMesh,
  MeshLambertMaterial,
  Object3D,
  Vector2,
  Vector3,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { areas, walkable } from "../base";
import { pointInPolygon, random, type Vec2 } from "../geometry";
import { game } from "../state";

/**
 * Let's Go's tall grass (notes/research/gfx-nature-ground.md 3.2): patches of
 * dense clumps, much darker than the lawn so they read from far away. Each
 * blade is a broad leaf, widest a third of the way up and folded along its
 * midrib, so one half catches the light; a clump shades as one soft cushion,
 * dark at the base and bright at the tips. Gusts roll across the patches, and
 * the grass parts round the trainer as you walk through. One instanced mesh.
 */

const BASE = new Color("#1d5a40");
const MID = new Color("#149150");
const TIP = new Color("#4fd068");

/** An LGPE leaf: widest at 35%, pointed tip, folded along the midrib (its center pushed forward). */
function leafBlade(h: number, w: number) {
  const rows = [
    [0, 0.45],
    [0.35, 1],
    [0.7, 0.62],
  ] as const;
  const pos: number[] = [];
  for (const [t, k] of rows) pos.push(-(w / 2) * k, t * h, 0, 0, t * h, 0.35 * w * k, (w / 2) * k, t * h, 0);
  pos.push(0, h, 0.02);
  const idx: number[] = [];
  for (const a of [0, 3]) idx.push(a, a + 3, a + 1, a + 1, a + 3, a + 4, a + 1, a + 4, a + 2, a + 2, a + 4, a + 5);
  idx.push(6, 9, 7, 7, 9, 8);
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** One clump: about ten leaves fanned out and leaning, a few short ones filling the middle. */
function clumpGeometry() {
  const rand = random(7);
  const blades = Array.from({ length: 12 }, (_, i) => {
    const inner = i >= 9;
    const h = inner ? 0.5 + rand() * 0.15 : 0.75 + rand() * 0.45;
    const blade = leafBlade(h, 0.22 + rand() * 0.06);
    const a = (i / (inner ? 3 : 9)) * Math.PI * 2 + rand() * 0.5;
    const lean = inner ? 0.12 : 0.26 + rand() * 0.34;
    // fold faces outward, then lean out and turn round the clump
    blade.rotateX(lean);
    blade.rotateY(Math.PI / 2 - a);
    blade.translate(Math.cos(a) * (inner ? 0.04 : 0.12), 0, Math.sin(a) * (inner ? 0.04 : 0.12));
    return blade;
  });
  const g = mergeGeometries(blades);
  // a soft cushion: every normal bent toward "out and up from the clump's center", and dark-to-bright up the blade
  const pos = g.getAttribute("position");
  const nor = g.getAttribute("normal");
  const colors = new Float32Array(pos.count * 3);
  const n = new Vector3();
  const d = new Vector3();
  const c = new Color();
  for (let k = 0; k < pos.count; k++) {
    d.set(pos.getX(k), 1.4, pos.getZ(k)).normalize();
    n.fromBufferAttribute(nor, k).lerp(d, 0.65).normalize();
    nor.setXYZ(k, n.x, n.y, n.z);
    const y = pos.getY(k) / 1.1;
    c.copy(BASE).lerp(MID, Math.min(1, y * 2)).lerp(TIP, Math.max(0, y * 2 - 1));
    if (y > 0.8) c.multiplyScalar(1.1);
    colors.set([c.r, c.g, c.b], k * 3);
  }
  g.setAttribute("color", new BufferAttribute(colors, 3));
  return g;
}

/** Clumps on a jittered grid inside every "grass" patch, smaller near the edge so a patch is a cushion, not a cliff. */
function clumps(): { at: Vec2; edge: number }[] {
  const rand = random(41);
  const out: { at: Vec2; edge: number }[] = [];
  for (const a of areas.filter((x) => x.kind === "grass")) {
    const xs = a.points.map(([x]) => x);
    const zs = a.points.map(([, z]) => z);
    const inside = (p: Vec2) => pointInPolygon(p, a.points);
    for (let x = Math.min(...xs); x < Math.max(...xs); x += 0.95) {
      for (let z = Math.min(...zs); z < Math.max(...zs); z += 0.95) {
        const p: Vec2 = [x + (rand() - 0.5) * 0.5, z + (rand() - 0.5) * 0.5];
        if (!inside(p) || !walkable(p)) continue;
        // how close to the patch's edge: test a few points around it
        const near = [0, 1, 2, 3, 4, 5].some((k) => !inside([p[0] + Math.cos(k) * 1.2, p[1] + Math.sin(k) * 1.2]));
        out.push({ at: p, edge: near ? 0.6 : 1 });
      }
    }
  }
  return out;
}

/** Shared by the shader: the time, and where the trainer is (blades lean away from them). */
const sway = { uTime: { value: 0 }, uTrainer: { value: new Vector2() } };

const material = new MeshLambertMaterial({ vertexColors: true, side: DoubleSide });
material.customProgramCacheKey = () => "tall-grass";
material.onBeforeCompile = (shader) => {
  shader.uniforms.uTime = sway.uTime;
  shader.uniforms.uTrainer = sway.uTrainer;
  shader.vertexShader = shader.vertexShader
    .replace(
      "#include <common>",
      `#include <common>
uniform float uTime;
uniform vec2 uTrainer;
float gHash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float gNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(gHash(i), gHash(i + vec2(1, 0)), u.x), mix(gHash(i + vec2(0, 1)), gHash(i + vec2(1, 1)), u.x), u.y);
}`,
    )
    // bend in world space: gusts rolling across the patch, and parting round the trainer
    .replace(
      "#include <project_vertex>",
      `vec4 wp = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
{
  float h = clamp(transformed.y / 1.1, 0.0, 1.2);
  vec2 dir = vec2(0.81, 0.59);
  float gust = (gNoise(wp.xz * 0.10 + dir * uTime * 0.5) - 0.5) + (gNoise(wp.xz * 0.05 + dir * uTime * 0.1) - 0.5);
  wp.xz += dir * gust * 0.5 * h * h;
  wp.x += sin(uTime * 7.0 + instanceMatrix[3].x * 3.1) * 0.015 * h;
  vec2 away = wp.xz - uTrainer;
  float d = length(away);
  float push = smoothstep(1.6, 0.2, d) * 0.55 * h;
  wp.xz += away / max(d, 0.001) * push;
  wp.y -= push * 0.25;
}
vec4 mvPosition = viewMatrix * wp;
gl_Position = projectionMatrix * mvPosition;`,
    );
};

export function TallGrass() {
  const mesh = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => clumpGeometry(), []);
  const spots = useMemo(() => clumps(), []);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const rand = random(3);
    const o = new Object3D();
    const tint = new Color();
    spots.forEach(({ at: [x, z], edge }, i) => {
      o.position.set(x, 0, z);
      o.rotation.set(0, rand() * Math.PI * 2, 0);
      o.scale.setScalar((0.85 + rand() * 0.35) * edge);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      // neighbors differ a little in their green
      m.setColorAt(i, tint.setRGB(0.9 + rand() * 0.15, 0.95 + rand() * 0.1, 0.9 + rand() * 0.1));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [spots]);

  useFrame(({ clock }) => {
    sway.uTime.value = clock.elapsedTime;
    const { x, z } = game.player.trainer.position;
    sway.uTrainer.value.set(x, z);
  });

  return <instancedMesh ref={mesh} args={[geometry, material, spots.length]} frustumCulled={false} receiveShadow />;
}
