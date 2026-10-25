"use client";

import { useLayoutEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { CircleGeometry, Color, type InstancedMesh, MeshBasicMaterial, Object3D } from "three";
import { slots } from "../base";
import { routeById, routeStore } from "../routes";

/*
 * The route on the ground while you follow it, like GO's: a dotted line from
 * stop to stop that changes color as you cover it, mint behind you and white
 * ahead. One draw.
 */

const DOT = new CircleGeometry(0.22, 10).rotateX(-Math.PI / 2);
const dotMaterial = new MeshBasicMaterial({ depthWrite: false });
const GAP = 1.6;
const AHEAD = new Color("#ffffff");
const DONE = new Color("#2ccda9");

export function RouteLine() {
  const following = useSyncExternalStore(routeStore.subscribe, routeStore.get, routeStore.server);
  const mesh = useRef<InstancedMesh>(null);
  const dots = useMemo(() => {
    if (!following) return [];
    const stops = routeById(following.id).stops;
    const out: { x: number; z: number; leg: number }[] = [];
    for (let i = 1; i < stops.length; i++) {
      const [ax, az] = slots[stops[i - 1]];
      const [bx, bz] = slots[stops[i]];
      const len = Math.hypot(bx - ax, bz - az);
      for (let d = 1.5; d < len - 1.5; d += GAP) out.push({ x: ax + ((bx - ax) * d) / len, z: az + ((bz - az) * d) / len, leg: i });
    }
    return out;
  }, [following]);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m || !following) return;
    const o = new Object3D();
    dots.forEach((d, i) => {
      o.position.set(d.x, 0.06, d.z);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      // a leg is covered once you've reached the stop at its end
      m.setColorAt(i, d.leg < following.next ? DONE : AHEAD);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [dots, following]);

  return dots.length ? <instancedMesh key={following?.id} ref={mesh} args={[DOT, dotMaterial, dots.length]} renderOrder={-5} /> : null;
}
