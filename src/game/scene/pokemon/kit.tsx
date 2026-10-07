"use client";

import type { ReactNode } from "react";
import { BackSide, DataTexture, type BufferGeometry, MeshBasicMaterial, MeshToonMaterial, NearestFilter, RedFormat } from "three";

/**
 * The shared toolkit for Pokémon built in code: GO-style toon shading (three
 * soft steps of light), a dark outline drawn as an inverted hull, and glossy
 * cartoon eyes. Every model is made of these, so they all match.
 */

/** Three bands of light, crisp, like GO's soft cel shading. */
const steps = (() => {
  const t = new DataTexture(new Uint8Array([110, 190, 255]), 3, 1, RedFormat);
  t.minFilter = t.magFilter = NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
})();

const toons = new Map<string, MeshToonMaterial>();
/** One toon material per color, shared across every Pokémon. */
export function toon(color: string) {
  let m = toons.get(color);
  if (!m) {
    m = new MeshToonMaterial({ color, gradientMap: steps });
    toons.set(color, m);
  }
  return m;
}

const outlineMaterial = new MeshBasicMaterial({ color: "#2a2230", side: BackSide });
const flat = new Map<string, MeshBasicMaterial>();
/** Unlit color, for eyes, highlights, and glows. */
export function plain(color: string) {
  let m = flat.get(color);
  if (!m) {
    m = new MeshBasicMaterial({ color });
    flat.set(color, m);
  }
  return m;
}

type Xyz = readonly [number, number, number];

/**
 * One body part: a mesh in a toon color, placed and scaled, with an outline
 * shell just behind it (skip it for tiny details).
 */
export function Part({
  geometry,
  color,
  at = [0, 0, 0],
  scale = [1, 1, 1],
  turn = [0, 0, 0],
  outline = 0.035,
  unlit = false,
  name,
  children,
}: {
  geometry: BufferGeometry;
  color: string;
  at?: Xyz;
  scale?: Xyz;
  turn?: Xyz;
  outline?: number;
  unlit?: boolean;
  name?: string;
  children?: ReactNode;
}) {
  return (
    <group position={at as [number, number, number]} rotation={turn as [number, number, number]} name={name}>
      <mesh geometry={geometry} material={unlit ? plain(color) : toon(color)} scale={scale as [number, number, number]} castShadow />
      {outline > 0 ? (
        <mesh
          geometry={geometry}
          material={outlineMaterial}
          scale={[scale[0] * (1 + outline / scale[0]), scale[1] * (1 + outline / scale[1]), scale[2] * (1 + outline / scale[2])]}
        />
      ) : null}
      {children}
    </group>
  );
}

/** A cartoon eye: a black oval with a white glint up top, set into the face. */
export function Eye({ geometry, at, size, turn = [0, 0, 0], closed = false }: { geometry: BufferGeometry; at: Xyz; size: number; turn?: Xyz; closed?: boolean }) {
  if (closed) {
    return (
      <mesh geometry={geometry} material={plain("#1c1620")} position={at as [number, number, number]} rotation={turn as [number, number, number]} scale={[size * 1.2, size * 0.18, size * 0.4]} />
    );
  }
  return (
    <group position={at as [number, number, number]} rotation={turn as [number, number, number]}>
      <mesh geometry={geometry} material={plain("#1c1620")} scale={[size * 0.8, size, size * 0.45]} />
      <mesh geometry={geometry} material={plain("#ffffff")} position={[size * 0.22, size * 0.38, size * 0.32]} scale={size * 0.28} />
    </group>
  );
}
