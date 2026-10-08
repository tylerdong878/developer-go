"use client";

import type { ReactNode } from "react";
import {
  BackSide,
  type BufferGeometry,
  CatmullRomCurve3,
  DataTexture,
  LatheGeometry,
  MeshBasicMaterial,
  MeshToonMaterial,
  NearestFilter,
  RedFormat,
  Vector2,
  Vector3,
} from "three";

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
const outlines = new Map<string, MeshBasicMaterial>();
const outlineIn = (color: string) => {
  let m = outlines.get(color);
  if (!m) {
    m = new MeshBasicMaterial({ color, side: BackSide });
    outlines.set(color, m);
  }
  return m;
};
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
  outlineColor,
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
  /** A colored outline instead of the dark one (Rotom's electric aura). */
  outlineColor?: string;
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
          material={outlineColor ? outlineIn(outlineColor) : outlineMaterial}
          scale={[scale[0] * (1 + outline / scale[0]), scale[1] * (1 + outline / scale[1]), scale[2] * (1 + outline / scale[2])]}
        />
      ) : null}
      {children}
    </group>
  );
}

/**
 * A cartoon eye: a dark oval with a white glint, set into the face. Eyes come
 * in mirrored pairs, so `side` says which one this is (-1 the Pokémon's
 * right, on our left; 1 the other) and the glint mirrors with it.
 * - `aspect`: width over height (Charmander 0.5, Pikachu 0.85, Bulbasaur 1.1).
 * - `glint`: where the glint sits, as [inward, up] shares of the eye's size,
 *   and `glintSize` how big it is.
 * - `iris`: a colored iris. Centered with a black pupil by default; with
 *   `band`, it fills the bottom of the eye instead (Charmander, Squirtle).
 */
export function Eye({
  geometry,
  at,
  size,
  turn = [0, 0, 0],
  closed = false,
  iris,
  band = false,
  side = 1,
  aspect = 0.8,
  glint = [0.25, 0.38],
  glintSize = 0.28,
}: {
  geometry: BufferGeometry;
  at: Xyz;
  size: number;
  turn?: Xyz;
  closed?: boolean;
  iris?: string;
  band?: boolean;
  side?: -1 | 1;
  aspect?: number;
  glint?: readonly [number, number];
  glintSize?: number;
}) {
  if (closed) {
    return (
      <mesh geometry={geometry} material={plain("#1c1620")} position={at as [number, number, number]} rotation={turn as [number, number, number]} scale={[size * 1.2, size * 0.18, size * 0.4]} />
    );
  }
  const w = size * aspect;
  return (
    <group position={at as [number, number, number]} rotation={turn as [number, number, number]}>
      <mesh geometry={geometry} material={plain(iris && !band ? iris : "#1c1620")} scale={[w, size, size * 0.45]} />
      {iris && !band ? (
        <mesh geometry={geometry} material={plain("#1c1620")} position={[0, -size * 0.1, size * 0.12]} scale={[w * 0.52, size * 0.55, size * 0.4]} />
      ) : null}
      {iris && band ? (
        <mesh geometry={geometry} material={plain(iris)} position={[0, -size * 0.45, size * 0.08]} scale={[w * 0.82, size * 0.5, size * 0.4]} />
      ) : null}
      <mesh
        geometry={geometry}
        material={plain("#ffffff")}
        position={[-side * glint[0] * w, glint[1] * size, size * 0.32]}
        scale={size * glintSize}
      />
    </group>
  );
}

/**
 * A smooth body of revolution from a side profile: [radius, height] pairs
 * from bottom to top, run through a spline so the curve stays round. One
 * lathe makes a head flow into a body with no neck, the way GO's mascots do.
 */
export function lathe(profile: readonly (readonly [number, number])[], segments = 32, steps = 40) {
  const curve = new CatmullRomCurve3(profile.map(([r, y]) => new Vector3(Math.max(0.0005, r), y, 0)));
  const points = curve.getPoints(steps).map((p) => new Vector2(Math.max(0.0005, p.x), p.y));
  return new LatheGeometry(points, segments);
}

const ghosts = new Map<string, MeshBasicMaterial>();
/** See-through and unlit, for gas, auras and glows (Gastly, Rotom). */
export function ghost(color: string, opacity = 0.55) {
  const key = `${color}:${opacity}`;
  let m = ghosts.get(key);
  if (!m) {
    m = new MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
    ghosts.set(key, m);
  }
  return m;
}
