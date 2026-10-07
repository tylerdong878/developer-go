"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { Color, ConeGeometry, type InstancedMesh, Object3D } from "three";
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

const FLOWER_COLORS = ["#ffffff", "#f9a8d4", "#f6c453", "#a78bfa", "#fb7185"];

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

/**
 * Little things that make the base feel alive: tufts of grass everywhere and
 * flowers in the park and on the quad, all drawn as two instanced meshes.
 */
export function Flora({ grass }: { grass: string }) {
  const tufts = useRef<InstancedMesh>(null);
  const flowers = useRef<InstancedMesh>(null);
  const spots = useMemo(
    () => ({ tufts: scatter(420, 11, ["land"]), flowers: scatter(260, 12, ["park", "lawn", "grass"]) }),
    [],
  );
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
    const colors = FLOWER_COLORS.map((c) => new Color(c));
    spots.flowers.forEach(([x, z], i) => {
      o.position.set(x, 0.18, z);
      o.rotation.set(0, 0, 0);
      o.scale.setScalar(0.7 + rand() * 0.6);
      o.updateMatrix();
      flowers.current?.setMatrixAt(i, o.matrix);
      flowers.current?.setColorAt(i, colors[Math.floor(rand() * colors.length)]);
    });
    if (tufts.current) tufts.current.instanceMatrix.needsUpdate = true;
    if (flowers.current) {
      flowers.current.instanceMatrix.needsUpdate = true;
      if (flowers.current.instanceColor) flowers.current.instanceColor.needsUpdate = true;
    }
  }, [spots]);

  return (
    <>
      <instancedMesh ref={tufts} args={[blades, undefined, spots.tufts.length]}>
        <meshLambertMaterial color={grass} flatShading />
      </instancedMesh>
      <instancedMesh ref={flowers} args={[undefined, undefined, spots.flowers.length]}>
        <icosahedronGeometry args={[0.2, 0]} />
        <meshLambertMaterial color="#ffffff" flatShading />
      </instancedMesh>
    </>
  );
}
