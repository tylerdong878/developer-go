"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { CircleGeometry, Color, ConeGeometry, DoubleSide, type InstancedMesh, Object3D, Shape, ShapeGeometry } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { areas, clearOfRoads, landmarks, onLand, slots, walkable } from "../base";
import { pointInPolygon, random, type Vec2 } from "../geometry";

/** Half sizes of the courts and the rock, so nothing grows on them. */
const KEEP_CLEAR = { soccer: [24, 16], tennis: [8, 16], hoops: [8.5, 8], rock: [6, 5], pier: [0, 0] } as const;
const onALandmark = ([x, z]: Vec2) =>
  landmarks.some((l) => {
    if (!("at" in l)) return false;
    const [hx, hz] = KEEP_CLEAR[l.kind];
    return Math.abs(x - l.at[0]) < hx && Math.abs(z - l.at[1]) < hz;
  });

/**
 * Flower colors sampled from Let's Go's towns (notes/research/gfx-nature-ground.md
 * 5.1): Pallet's white daisies, Viridian's yellow and orange, Celadon's pinks,
 * Pewter's lilac, Cerulean's blue.
 */
const FLOWERS = ["#ffffff", "#ffd84a", "#f6924f", "#f4a6c8", "#ec8fae", "#de86cf", "#c6a6f0", "#7fa8f0"];

/** Scattered spots in green places, away from roads, water, and map objects. */
function scatter(count: number, seed: number, kinds: string[]) {
  const rand = random(seed);
  const green = areas.filter((a) => kinds.includes(a.kind));
  const out: Vec2[] = [];
  for (let i = 0; out.length < count && i < count * 40; i++) {
    const p: Vec2 = [-160 + rand() * 250, -130 + rand() * 250];
    const inGreen = kinds.includes("land") ? onLand(p) : green.some((a) => pointInPolygon(p, a.points));
    if (!inGreen || !walkable(p) || !clearOfRoads(p, 1) || onALandmark(p)) continue;
    if (Object.values(slots).some(([x, z]) => Math.hypot(p[0] - x, p[1] - z) < 3)) continue;
    out.push(p);
  }
  return out;
}

/** A flat five-petal head, LGPE style, a little cupped. */
const head = (() => {
  const s = new Shape();
  for (let i = 0; i <= 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    const r = 0.13 * (0.55 + 0.45 * Math.abs(Math.cos(2.5 * a)));
    if (i === 0) s.moveTo(r * Math.cos(a), r * Math.sin(a));
    else s.lineTo(r * Math.cos(a), r * Math.sin(a));
  }
  return new ShapeGeometry(s).rotateX(-Math.PI / 2);
})();
const center = new CircleGeometry(0.045, 6).rotateX(-Math.PI / 2).translate(0, 0.004, 0);

type Bloom = { at: Vec2; y: number; color: string; size: number; tilt: number };

/**
 * Where the flowers grow: a ring bed round the roundabout's island in runs of
 * color, and planted clusters of 3 to 7 on the lawns and in the park (LGPE
 * puts flowers in beds, never loose one by one).
 */
function blooms(): Bloom[] {
  const rand = random(12);
  const out: Bloom[] = [];
  // the ring bed, r 9.4 to 10.4, in runs of white, pink and yellow
  for (let i = 0; i < 260; i++) {
    const a = (i / 260) * Math.PI * 2 + rand() * 0.02;
    const r = 9.4 + rand() * 1.0;
    const run = Math.floor((a / (Math.PI * 2)) * 18) % 3;
    out.push({ at: [Math.cos(a) * r, Math.sin(a) * r], y: 0.18 + rand() * 0.12, color: ["#ffffff", "#f4a6c8", "#ffd84a"][run], size: 0.8 + rand() * 0.4, tilt: rand() });
  }
  // clusters on the lawns and in the park
  for (const c of scatter(90, 21, ["park", "lawn"])) {
    if (Math.hypot(c[0], c[1]) < 12) continue;
    const pair = [FLOWERS[Math.floor(rand() * FLOWERS.length)], FLOWERS[Math.floor(rand() * FLOWERS.length)]];
    const n = 3 + Math.floor(rand() * 5);
    for (let k = 0; k < n; k++) {
      const a = rand() * Math.PI * 2;
      const r = rand() * 0.6;
      out.push({ at: [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r], y: 0.16 + rand() * 0.14, color: pair[k % 2], size: 0.8 + rand() * 0.45, tilt: rand() });
    }
  }
  return out;
}

/**
 * Little things that make the base feel alive: tufts of grass everywhere and
 * flower beds, all instanced (three draw calls for the lot).
 */
export function Flora({ grass }: { grass: string }) {
  const tufts = useRef<InstancedMesh>(null);
  const heads = useRef<InstancedMesh>(null);
  const centers = useRef<InstancedMesh>(null);
  const spots = useMemo(() => ({ tufts: scatter(420, 11, ["land"]), blooms: blooms() }), []);
  const blades = useMemo(() => {
    const parts = [0, 1, 2].map((i) => {
      const blade = new ConeGeometry(0.09, 0.55 + i * 0.12, 3);
      blade.rotateZ((i - 1) * 0.4);
      blade.translate((i - 1) * 0.12, 0.28, 0);
      return blade;
    });
    return mergeGeometries(parts);
  }, []);

  useLayoutEffect(() => {
    const o = new Object3D();
    const rand = random(3);
    spots.tufts.forEach(([x, z], i) => {
      o.position.set(x, 0, z);
      o.rotation.set(0, rand() * Math.PI * 2, 0);
      o.scale.setScalar(0.8 + rand() * 0.7);
      o.updateMatrix();
      tufts.current?.setMatrixAt(i, o.matrix);
    });
    const tint = new Color();
    const yellow = new Color("#fddd58");
    spots.blooms.forEach((b, i) => {
      o.position.set(b.at[0], b.y, b.at[1]);
      // tipped up toward the camera a little, each its own way
      o.rotation.set(0.35 + b.tilt * 0.2, b.tilt * Math.PI * 2, 0, "YXZ");
      o.scale.setScalar(b.size);
      o.updateMatrix();
      heads.current?.setMatrixAt(i, o.matrix);
      centers.current?.setMatrixAt(i, o.matrix);
      heads.current?.setColorAt(i, tint.set(b.color));
      centers.current?.setColorAt(i, b.color === "#ffd84a" ? tint.set("#f6924f") : yellow);
    });
    for (const m of [tufts.current, heads.current, centers.current]) {
      if (!m) continue;
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      m.computeBoundingSphere();
    }
  }, [spots]);

  return (
    <>
      <instancedMesh ref={tufts} args={[blades, undefined, spots.tufts.length]}>
        <meshLambertMaterial color={grass} flatShading />
      </instancedMesh>
      <instancedMesh ref={heads} args={[head, undefined, spots.blooms.length]}>
        <meshLambertMaterial side={DoubleSide} emissive="#ffffff" emissiveIntensity={0.04} />
      </instancedMesh>
      <instancedMesh ref={centers} args={[center, undefined, spots.blooms.length]}>
        <meshLambertMaterial />
      </instancedMesh>
    </>
  );
}
