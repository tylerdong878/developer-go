"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import {
  type BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  InstancedBufferAttribute,
  type InstancedMesh,
  Matrix4,
  MeshLambertMaterial,
  Quaternion,
  SphereGeometry,
  Vector3,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { trees } from "../base";
import { random } from "../geometry";
import { game } from "../state";
import { skyLook } from "./Sky";

/*
 * Kanto's trees (notes/research/gfx-nature-ground.md 4.x): big round
 * broadleaf crowns, wider than tall, a few soft lumps shading as one mass
 * (normals pointed out from the crown's center, a lumpy edge), a bright
 * yellow-green top, on a short trunk; and dark teal conifers of stacked
 * cones, like Pewter's. Crowns sway in gusts. A tree between the camera and
 * the trainer dithers away like the buildings do, instead of shrinking.
 */

const UP = new Vector3(0, 1, 0);

/** Bends every normal toward "out from this point", so a lumpy mass shades like one soft ball. */
function soften(g: BufferGeometry, center: Vector3, amount: number, bump: number) {
  const pos = g.getAttribute("position");
  const nor = g.getAttribute("normal");
  const p = new Vector3();
  const n = new Vector3();
  const d = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    d.copy(p).sub(center).normalize();
    // a lumpy silhouette, so it isn't a perfect union of spheres
    const wobble = Math.sin(p.x * 2.3 + 0.4) * Math.sin(p.y * 1.9 + 1.3) * Math.sin(p.z * 2.1 + 2.2);
    p.addScaledVector(d, wobble * bump);
    pos.setXYZ(i, p.x, p.y, p.z);
    n.fromBufferAttribute(nor, i).lerp(d, amount).normalize();
    nor.setXYZ(i, n.x, n.y, n.z);
  }
  return g;
}

/** A broadleaf crown: five lumps merged, centered on the origin, about 3 wide. */
const broadleaf = (() => {
  const lumps = [
    [0, 0, 0, 1],
    [0.75, -0.25, 0.3, 0.7],
    [-0.7, -0.2, -0.35, 0.75],
    [0.15, 0.32, -0.6, 0.66],
    [-0.2, -0.32, 0.65, 0.62],
  ].map(([x, y, z, r]) => new SphereGeometry(r, 18, 12).translate(x, y, z));
  return soften(mergeGeometries(lumps), new Vector3(0, -0.25, 0), 0.8, 0.08);
})();

/** A conifer: four stacked cones, overlapping, normals out from the trunk and a little up. */
const conifer = (() => {
  const cones = [
    [1.6, 0],
    [1.25, 0.84],
    [0.9, 1.68],
    [0.5, 2.4],
  ].map(([r, y]) => new ConeGeometry(r, 1.4, 14).translate(0, y + 0.7, 0));
  const g = mergeGeometries(cones);
  const pos = g.getAttribute("position");
  const nor = g.getAttribute("normal");
  const n = new Vector3();
  const d = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    d.set(pos.getX(i), 0.6, pos.getZ(i)).normalize();
    n.fromBufferAttribute(nor, i).lerp(d, 0.6).normalize();
    nor.setXYZ(i, n.x, n.y, n.z);
  }
  return g;
})();

const trunkGeometry = new CylinderGeometry(0.22, 0.34, 2.6, 8).translate(0, 1.3, 0);

/** The tree material: soft dither fade per tree, gusts in the crown, and the bright top. */
function treeMaterial(color: string, top: string | null, sway: number) {
  const m = new MeshLambertMaterial({ color, alphaHash: true });
  const uTop = { value: new Color(top ?? color) };
  m.customProgramCacheKey = () => `tree-${top ? "crown" : "trunk"}`;
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, { uTime: skyLook.uTime, uTop, uSway: { value: sway } });
    s.vertexShader = s.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nattribute float aFade;\nvarying float vFade;\nvarying vec3 vTreeN;\nuniform float uTime, uSway;",
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vFade = aFade;
vTreeN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * objectNormal);
{
  vec2 ip = instanceMatrix[3].xz;
  float gust = sin(uTime * 1.3 + ip.x * 0.31 + ip.y * 0.17) * 0.6 + sin(uTime * 2.1 + ip.y * 0.4 + ip.x * 0.2) * 0.4;
  transformed.xz += vec2(gust, gust * 0.6) * uSway * max(0.0, transformed.y + 0.6);
}`,
      );
    s.fragmentShader = s.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vFade;\nvarying vec3 vTreeN;\nuniform vec3 uTop;")
      .replace(
        "#include <color_fragment>",
        "#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, uTop, smoothstep(0.55, 0.95, vTreeN.y) * 0.45);\ndiffuseColor.a *= vFade;",
      );
  };
  return m;
}

const MATERIALS = {
  trunk: treeMaterial("#8a5a3b", null, 0),
  broadleaf: treeMaterial("#47b04f", "#b9ec72", 0.035),
  conifer: treeMaterial("#2b6e4f", "#6fb36a", 0.02),
};

type Tree = { x: number; z: number; size: number; turn: number; kind: "broadleaf" | "conifer"; slot: number };

export function Trees({ trunk }: { trunk: string; leaves?: readonly [string, string] }) {
  const trunks = useRef<InstancedMesh>(null);
  const broad = useRef<InstancedMesh>(null);
  const cones = useRef<InstancedMesh>(null);

  const forest = useMemo(() => {
    const rand = random(5);
    let b = 0;
    let c = 0;
    const list: Tree[] = trees.map(([x, z]) => {
      // conifers out in the park and the edges, round broadleaf trees in town
      const kind = rand() < (Math.hypot(x, z) > 60 ? 0.35 : 0.1) ? "conifer" : "broadleaf";
      return { x, z, size: 1.0 + rand() * 0.45, turn: rand() * Math.PI * 2, kind, slot: kind === "conifer" ? c++ : b++ };
    });
    return { list, broad: b, cones: c };
  }, []);

  const attrs = useMemo(
    () => ({
      trunks: new InstancedBufferAttribute(new Float32Array(forest.list.length).fill(1), 1),
      broad: new InstancedBufferAttribute(new Float32Array(Math.max(1, forest.broad)).fill(1), 1),
      cones: new InstancedBufferAttribute(new Float32Array(Math.max(1, forest.cones)).fill(1), 1),
    }),
    [forest],
  );
  const geometries = useMemo(() => {
    const t = trunkGeometry.clone();
    t.setAttribute("aFade", attrs.trunks);
    const b = broadleaf.clone();
    b.setAttribute("aFade", attrs.broad);
    const c = conifer.clone();
    c.setAttribute("aFade", attrs.cones);
    return { trunk: t, broad: b, cone: c };
  }, [attrs]);

  useLayoutEffect(() => {
    MATERIALS.trunk.color.set(trunk);
    const m = new Matrix4();
    const q = new Quaternion();
    const s = new Vector3();
    const p = new Vector3();
    const tints = [new Color("#ffffff"), new Color("#e6f2d6")];
    forest.list.forEach((t, i) => {
      q.setFromAxisAngle(UP, t.turn);
      const k = t.size;
      trunks.current?.setMatrixAt(i, m.compose(p.set(t.x, 0, t.z), q, s.set(k, k * (t.kind === "conifer" ? 0.55 : 1), k)));
      if (t.kind === "broadleaf") {
        broad.current?.setMatrixAt(t.slot, m.compose(p.set(t.x, 3.55 * k, t.z), q, s.set(2.05 * k, 1.85 * k, 2.05 * k)));
        broad.current?.setColorAt(t.slot, tints[i % 2]);
      } else {
        cones.current?.setMatrixAt(t.slot, m.compose(p.set(t.x, 1.1 * k, t.z), q, s.set(k, k * 1.15, k)));
        cones.current?.setColorAt(t.slot, tints[i % 2]);
      }
    });
    for (const mesh of [trunks.current, broad.current, cones.current]) {
      if (!mesh) continue;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }, [forest, trunk]);

  const fade = useRef<Float32Array | null>(null);

  useFrame(({ camera }, dt) => {
    const tr = trunks.current?.geometry.getAttribute("aFade") as InstancedBufferAttribute | undefined;
    const br = broad.current?.geometry.getAttribute("aFade") as InstancedBufferAttribute | undefined;
    const co = cones.current?.geometry.getAttribute("aFade") as InstancedBufferAttribute | undefined;
    if (!tr || !br || !co) return;
    fade.current ??= new Float32Array(forest.list.length).fill(1);
    const shown = fade.current;
    const { position } = game.player.trainer;
    const cx = camera.position.x;
    const cz = camera.position.z;
    const sx = position.x - cx;
    const sz = position.z - cz;
    const span = sx * sx + sz * sz || 1;
    const k = 1 - Math.exp(-8 * dt);
    let changed = false;
    forest.list.forEach((tree, i) => {
      // close to the line from the camera to the trainer: fade out of the way
      const t = ((tree.x - cx) * sx + (tree.z - cz) * sz) / span;
      const along = Math.max(0, Math.min(1, t));
      const off = Math.hypot(tree.x - (cx + along * sx), tree.z - (cz + along * sz));
      const want = t > -0.1 && t < 1.05 && off < 3.8 * tree.size ? 0.1 : 1;
      let f = shown[i] + (want - shown[i]) * k;
      if (f > 0.99) f = 1;
      if (Math.abs(f - shown[i]) < 1e-4) return;
      shown[i] = f;
      tr.array[i] = f;
      (tree.kind === "conifer" ? co : br).array[tree.slot] = f;
      changed = true;
    });
    if (changed) {
      tr.needsUpdate = true;
      br.needsUpdate = true;
      co.needsUpdate = true;
    }
  });

  return (
    <>
      <instancedMesh ref={trunks} args={[geometries.trunk, MATERIALS.trunk, forest.list.length]} castShadow receiveShadow />
      <instancedMesh ref={broad} args={[geometries.broad, MATERIALS.broadleaf, Math.max(1, forest.broad)]} castShadow receiveShadow />
      <instancedMesh ref={cones} args={[geometries.cone, MATERIALS.conifer, Math.max(1, forest.cones)]} castShadow receiveShadow />
    </>
  );
}
