"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { Color, type InstancedMesh, Matrix4, Quaternion, Vector3 } from "three";
import { trees } from "../base";
import { random } from "../geometry";
import { game } from "../state";

const UP = new Vector3(0, 1, 0);

/** A canopy is three overlapping puffs, so trees look soft and full instead of like one ball. */
const PUFFS = [
  { x: 0, y: 3.5, z: 0, r: 1 },
  { x: 1.05, y: 2.9, z: 0.35, r: 0.72 },
  { x: -0.85, y: 3.0, z: -0.45, r: 0.78 },
];
const puffAt = new Vector3();

/**
 * Low-poly trees, drawn as two instanced meshes: trunks and faceted canopies.
 * Any tree standing between the camera and the trainer shrinks out of the
 * way, so the view is never blocked.
 */
export function Trees({ trunk, leaves }: { trunk: string; leaves: readonly [string, string] }) {
  const trunks = useRef<InstancedMesh>(null);
  const canopies = useRef<InstancedMesh>(null);

  const shapes = useMemo(() => {
    const rand = random(5);
    return trees.map(([x, z]) => ({ x, z, size: 0.8 + rand() * 0.45, turn: rand() * Math.PI * 2, shown: 1 }));
  }, []);

  // Two leaf greens, mixed so neighbors differ.
  useLayoutEffect(() => {
    const mesh = canopies.current;
    if (!mesh) return;
    const colors = leaves.map((c) => new Color(c));
    trees.forEach((_, i) =>
      PUFFS.forEach((__, j) => mesh.setColorAt(i * PUFFS.length + j, colors[(i * 7 + j) % 3 === 0 ? 1 : 0])),
    );
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [leaves]);

  const scratch = useMemo(() => ({ m: new Matrix4(), q: new Quaternion(), p: new Vector3(), s: new Vector3() }), []);

  useFrame(({ camera }, dt) => {
    if (!trunks.current || !canopies.current) return;
    const { position } = game.player.trainer;
    const cx = camera.position.x;
    const cz = camera.position.z;
    const sx = position.x - cx;
    const sz = position.z - cz;
    const span = sx * sx + sz * sz || 1;
    const { m, q, p, s } = scratch;
    shapes.forEach((tree, i) => {
      // How close is this tree to the line from the camera to the trainer?
      const t = ((tree.x - cx) * sx + (tree.z - cz) * sz) / span;
      const along = Math.max(0, Math.min(1, t));
      const off = Math.hypot(tree.x - (cx + along * sx), tree.z - (cz + along * sz));
      const inTheWay = t > -0.1 && t < 1.05 && off < 3.6;
      tree.shown += ((inTheWay ? 0 : 1) - tree.shown) * (1 - Math.exp(-8 * dt));
      const k = tree.size * Math.max(0.001, tree.shown);
      q.setFromAxisAngle(UP, tree.turn);
      m.compose(p.set(tree.x, 1.1 * k, tree.z), q, s.set(k, k, k));
      trunks.current!.setMatrixAt(i, m);
      PUFFS.forEach((puff, j) => {
        puffAt.set(puff.x, puff.y, puff.z).applyQuaternion(q).multiplyScalar(k);
        const r = k * puff.r;
        m.compose(p.set(tree.x + puffAt.x, puffAt.y, tree.z + puffAt.z), q, s.set(r, r * 0.92, r));
        canopies.current!.setMatrixAt(i * PUFFS.length + j, m);
      });
    });
    trunks.current.instanceMatrix.needsUpdate = true;
    canopies.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={trunks} args={[undefined, undefined, trees.length]} frustumCulled={false} castShadow>
        <cylinderGeometry args={[0.26, 0.38, 2.2, 6]} />
        <meshLambertMaterial color={trunk} />
      </instancedMesh>
      <instancedMesh ref={canopies} args={[undefined, undefined, trees.length * PUFFS.length]} frustumCulled={false} castShadow>
        <icosahedronGeometry args={[1.75, 2]} />
        <meshLambertMaterial color="#ffffff" flatShading />
      </instancedMesh>
    </>
  );
}
