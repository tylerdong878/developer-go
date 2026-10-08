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
const lampGlass = new MeshLambertMaterial({ color: "#a5c9da", emissive: "#fff0c0", emissiveIntensity: 0.05 });
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
 * Street furniture in the Let's Go style (notes/research/world-2.md):
 * black cast-iron lampposts along the streets and wooden-slat benches on
 * black frames by the paths. After dark the lamps come on, with a warm pool
 * of light under each one.
 */
export function Props({ night, shadows }: { night: boolean; shadows: boolean }) {
  const poles = useRef<InstancedMesh>(null);
  const heads = useRef<InstancedMesh>(null);
  const pools = useRef<InstancedMesh>(null);
  const wood = useRef<InstancedMesh>(null);
  const legs = useRef<InstancedMesh>(null);

  const geo = useMemo(() => {
    // Let's Go's street lamp: black cast iron on a stepped square base, a square post with a collar,
    // and a square lantern of pale blue glass under a pyramid cap and a little finial
    const pole = mergeGeometries([
      new BoxGeometry(0.56, 0.24, 0.56).translate(0, 0.12, 0),
      new BoxGeometry(0.38, 0.22, 0.38).translate(0, 0.35, 0),
      new BoxGeometry(0.14, POLE_H, 0.14).translate(0, POLE_H / 2, 0),
      new BoxGeometry(0.24, 0.16, 0.24).translate(0, POLE_H * 0.55, 0),
      new BoxGeometry(0.5, 0.07, 0.5).translate(0, POLE_H - 0.06, 0),
      new CylinderGeometry(0.05, 0.4, 0.34, 4).rotateY(Math.PI / 4).translate(0, POLE_H + 0.67, 0),
      new CylinderGeometry(0.04, 0.04, 0.16, 6).translate(0, POLE_H + 0.92, 0),
      ...[-1, 1].flatMap((x) => [-1, 1].map((z) => new BoxGeometry(0.05, 0.5, 0.05).translate(x * 0.2, POLE_H + 0.25, z * 0.2))),
    ]);
    const head = new BoxGeometry(0.38, 0.46, 0.38).translate(0, POLE_H + 0.25, 0);
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
    lampGlass.emissiveIntensity = 0.05 + glow.current * 1.6;
    lampPool.opacity = glow.current * 0.32;
    lampPool.visible = glow.current > 0.02;
  });

  return (
    <>
      <instancedMesh ref={poles} args={[geo.pole, undefined, lamps.length]} castShadow={shadows}>
        <meshLambertMaterial color="#1f2b28" />
      </instancedMesh>
      <instancedMesh ref={heads} args={[geo.head, lampGlass, lamps.length]} />
      <instancedMesh ref={pools} args={[geo.pool, lampPool, lamps.length]} renderOrder={-20} />
      <instancedMesh ref={wood} args={[geo.seat, undefined, benches.length]} castShadow={shadows}>
        <meshLambertMaterial color="#a98e5f" />
      </instancedMesh>
      <instancedMesh ref={legs} args={[geo.leg, undefined, benches.length]}>
        <meshLambertMaterial color="#293525" />
      </instancedMesh>
    </>
  );
}
