"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { BufferAttribute, Color, ConeGeometry, type InstancedMesh, MeshLambertMaterial, Object3D, Vector2 } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { areas, walkable } from "../base";
import { pointInPolygon, random, type Vec2 } from "../geometry";
import { game } from "../state";

/**
 * Let's Go's tall grass (notes/research/world-2.md): patches of dense
 * clumps, much darker than the lawn so they read from far away, each clump a
 * fan of broad pointed blades, dark at the base and bright at the tips. They
 * sway in the wind and part around the trainer as you walk through, with GO's
 * rustle. One instanced mesh for every clump.
 */

const BASE = new Color("#205741");
const TIP = new Color("#4ccd63");

/** One clump: about ten blades fanned out, colored from the base up. */
function clumpGeometry() {
  const rand = random(7);
  const blades = Array.from({ length: 10 }, (_, i) => {
    const h = 0.7 + rand() * 0.45;
    const blade = new ConeGeometry(0.11, h, 3);
    blade.scale(1, 1, 0.35);
    blade.translate(0, h / 2, 0);
    const a = (i / 10) * Math.PI * 2 + rand() * 0.5;
    blade.rotateZ(Math.cos(a) * (0.25 + rand() * 0.25));
    blade.rotateX(-Math.sin(a) * (0.25 + rand() * 0.25));
    blade.rotateY(a);
    blade.translate(Math.cos(a) * 0.12, 0, Math.sin(a) * 0.12);
    const pos = blade.getAttribute("position");
    const colors = new Float32Array(pos.count * 3);
    const c = new Color();
    for (let k = 0; k < pos.count; k++) {
      c.copy(BASE).lerp(TIP, Math.min(1, pos.getY(k) / 1.05));
      colors.set([c.r, c.g, c.b], k * 3);
    }
    blade.setAttribute("color", new BufferAttribute(colors, 3));
    return blade;
  });
  return mergeGeometries(blades);
}

/** Clumps on a jittered grid inside every "grass" patch in the park. */
function clumps(): Vec2[] {
  const rand = random(41);
  const out: Vec2[] = [];
  for (const a of areas.filter((x) => x.kind === "grass")) {
    const xs = a.points.map(([x]) => x);
    const zs = a.points.map(([, z]) => z);
    for (let x = Math.min(...xs); x < Math.max(...xs); x += 0.95) {
      for (let z = Math.min(...zs); z < Math.max(...zs); z += 0.95) {
        const p: Vec2 = [x + (rand() - 0.5) * 0.5, z + (rand() - 0.5) * 0.5];
        if (pointInPolygon(p, a.points) && walkable(p)) out.push(p);
      }
    }
  }
  return out;
}

/** Shared by the shader: the time, and where the trainer is (blades lean away from them). */
const sway = { uTime: { value: 0 }, uTrainer: { value: new Vector2() } };

const material = new MeshLambertMaterial({ vertexColors: true });
material.onBeforeCompile = (shader) => {
  shader.uniforms.uTime = sway.uTime;
  shader.uniforms.uTrainer = sway.uTrainer;
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\nuniform float uTime;\nuniform vec2 uTrainer;")
    .replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
{
  vec4 world = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
  float bend = clamp(transformed.y, 0.0, 1.2);
  // the wind
  transformed.x += sin(uTime * 1.7 + world.x * 0.35 + world.z * 0.2) * 0.07 * bend;
  // parting around the trainer: lean away, stronger the closer they are
  vec2 away = world.xz - uTrainer;
  float d = length(away);
  float push = smoothstep(1.6, 0.2, d) * 0.55 * bend;
  vec3 local = (inverse(mat3(modelMatrix * instanceMatrix)) * vec3(away.x, 0.0, away.y)) / max(d, 0.001);
  transformed.xz += local.xz * push;
  transformed.y -= push * 0.25;
}`,
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
    spots.forEach(([x, z], i) => {
      o.position.set(x, 0, z);
      o.rotation.set(0, rand() * Math.PI * 2, 0);
      o.scale.setScalar(0.85 + rand() * 0.35);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [spots]);

  useFrame(({ clock }) => {
    sway.uTime.value = clock.elapsedTime;
    const { x, z } = game.player.trainer.position;
    sway.uTrainer.value.set(x, z);
  });

  return <instancedMesh ref={mesh} args={[geometry, material, spots.length]} frustumCulled={false} receiveShadow />;
}
