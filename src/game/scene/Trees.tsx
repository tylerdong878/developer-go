"use client";

import { useLayoutEffect, useRef } from "react";
import { Color, type InstancedMesh, Object3D } from "three";
import { trees } from "../base";
import { random } from "../geometry";

/** Low-poly trees, drawn as two instanced meshes: trunks and faceted canopies. */
export function Trees({ trunk, leaves }: { trunk: string; leaves: readonly [string, string] }) {
  const trunks = useRef<InstancedMesh>(null);
  const canopies = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const rand = random(5);
    const o = new Object3D();
    trees.forEach(([x, z], i) => {
      const s = 0.8 + rand() * 0.45;
      o.position.set(x, 1.1 * s, z);
      o.rotation.set(0, rand() * Math.PI * 2, 0);
      o.scale.set(s, s, s);
      o.updateMatrix();
      trunks.current?.setMatrixAt(i, o.matrix);
      o.position.set(x, 3.3 * s, z);
      o.scale.set(s, s * 1.12, s);
      o.updateMatrix();
      canopies.current?.setMatrixAt(i, o.matrix);
    });
    if (trunks.current) trunks.current.instanceMatrix.needsUpdate = true;
    if (canopies.current) canopies.current.instanceMatrix.needsUpdate = true;
  }, []);

  // Two leaf greens, mixed so neighbors differ.
  useLayoutEffect(() => {
    const mesh = canopies.current;
    if (!mesh) return;
    const colors = leaves.map((c) => new Color(c));
    trees.forEach((_, i) => mesh.setColorAt(i, colors[(i * 7) % 3 === 0 ? 1 : 0]));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [leaves]);

  return (
    <>
      <instancedMesh ref={trunks} args={[undefined, undefined, trees.length]}>
        <cylinderGeometry args={[0.26, 0.38, 2.2, 6]} />
        <meshLambertMaterial color={trunk} />
      </instancedMesh>
      <instancedMesh ref={canopies} args={[undefined, undefined, trees.length]}>
        <icosahedronGeometry args={[1.9, 1]} />
        <meshLambertMaterial color="#ffffff" flatShading />
      </instancedMesh>
    </>
  );
}
