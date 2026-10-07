"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BoxGeometry,
  CircleGeometry,
  CylinderGeometry,
  type InstancedMesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { benches, lamps, type Prop } from "../props";

const POLE_H = 3.7;

/** The lamp glass and the light pools, shared, so the time of day can turn them all up at once. */
const lampGlass = new MeshLambertMaterial({ color: "#fff6dc", emissive: "#ffc46b", emissiveIntensity: 0.15 });
const lampPool = new MeshBasicMaterial({ color: "#ffbf66", transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending });

function place(m: InstancedMesh | null, props: Prop[]) {
  if (!m) return;
  const o = new Object3D();
  props.forEach((p, i) => {
    o.position.set(p.at[0], 0, p.at[1]);
    o.rotation.set(0, p.turn, 0);
    o.updateMatrix();
    m.setMatrixAt(i, o.matrix);
  });
  m.instanceMatrix.needsUpdate = true;
  m.computeBoundingSphere();
}

/**
 * Street furniture: lampposts along the streets and benches by the paths.
 * After dark the lamps come on, with a warm pool of light under each one.
 */
export function Props({ night }: { night: boolean }) {
  const poles = useRef<InstancedMesh>(null);
  const heads = useRef<InstancedMesh>(null);
  const pools = useRef<InstancedMesh>(null);
  const wood = useRef<InstancedMesh>(null);
  const legs = useRef<InstancedMesh>(null);

  const geo = useMemo(() => {
    const pole = mergeGeometries([
      new CylinderGeometry(0.22, 0.28, 0.3, 8).translate(0, 0.15, 0),
      new CylinderGeometry(0.08, 0.1, POLE_H, 6).translate(0, POLE_H / 2, 0),
      new CylinderGeometry(0.34, 0.12, 0.2, 8).translate(0, POLE_H + 0.55, 0),
    ]);
    const head = new CylinderGeometry(0.2, 0.26, 0.5, 8).translate(0, POLE_H + 0.2, 0);
    const pool = new CircleGeometry(2.8, 24).rotateX(-Math.PI / 2).translate(0, 0.03, 0);
    const seat = mergeGeometries([
      new BoxGeometry(1.7, 0.1, 0.5).translate(0, 0.48, 0),
      new BoxGeometry(1.7, 0.42, 0.08).translate(0, 0.82, -0.24),
    ]);
    const leg = mergeGeometries([
      new BoxGeometry(0.08, 0.5, 0.5).translate(-0.7, 0.24, 0),
      new BoxGeometry(0.08, 0.5, 0.5).translate(0.7, 0.24, 0),
    ]);
    return { pole, head, pool, seat, leg };
  }, []);

  useLayoutEffect(() => {
    for (const m of [poles.current, heads.current, pools.current]) place(m, lamps);
    for (const m of [wood.current, legs.current]) place(m, benches);
  }, []);

  // Lamps fade on and off with the time of day instead of snapping.
  const glow = useRef(night ? 1 : 0);
  useFrame(() => {
    glow.current += ((night ? 1 : 0) - glow.current) * 0.06;
    lampGlass.emissiveIntensity = 0.15 + glow.current * 1.6;
    lampPool.opacity = glow.current * 0.32;
    lampPool.visible = glow.current > 0.02;
  });

  return (
    <>
      <instancedMesh ref={poles} args={[geo.pole, undefined, lamps.length]} castShadow>
        <meshLambertMaterial color="#3d4a5c" />
      </instancedMesh>
      <instancedMesh ref={heads} args={[geo.head, lampGlass, lamps.length]} />
      <instancedMesh ref={pools} args={[geo.pool, lampPool, lamps.length]} renderOrder={-20} />
      <instancedMesh ref={wood} args={[geo.seat, undefined, benches.length]} castShadow>
        <meshLambertMaterial color="#b77b4a" />
      </instancedMesh>
      <instancedMesh ref={legs} args={[geo.leg, undefined, benches.length]}>
        <meshLambertMaterial color="#3d4a5c" />
      </instancedMesh>
    </>
  );
}
