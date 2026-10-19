"use client";

import type { ReactNode } from "react";
import {
  BackSide,
  type BufferGeometry,
  CatmullRomCurve3,
  Color,
  ConeGeometry,
  ExtrudeGeometry,
  Euler,
  LatheGeometry,
  MeshBasicMaterial,
  MeshToonMaterial,
  Object3D,
  Shape,
  SphereGeometry,
  Vector2,
  Vector3,
} from "three";

/**
 * The shared toolkit for Pokémon built in code: GO's own shading, and glossy
 * cartoon eyes. Every model is made of these, so they all match.
 *
 * GO's Pokémon (notes/research/gfx-characters.md, from its material files)
 * have no outlines and no hard cel bands: a soft ramp that never gets darker
 * than about half, a warm rim on the lit side, a faint sheen facing you, a
 * cool rim on the shadow side, shadows that get richer instead of grayer,
 * and a little darkening at the feet. It's MeshToonMaterial with its lighting
 * swapped, so fog and lights still work, and every species shares one program.
 */

/** Knobs shared by every Pokémon material, so time of day or the catch screen can retune them all at once. */
export const goLight = {
  goRimColor: { value: new Color("#fff4d8") },
  goRimStrength: { value: 0.35 },
  goBackColor: { value: new Color("#9fb6ff") },
  goBackStrength: { value: 0.22 },
  goSheen: { value: 0.1 },
  goFloor: { value: 0.62 },
  goShadowSat: { value: 0.35 },
  goGroundAO: { value: 0.22 },
  goExposure: { value: 0.86 },
};

const GO_LIGHTS = /* glsl */ `
varying vec3 vViewPosition;
varying float vGoY;
uniform vec3 goRimColor; uniform float goRimStrength;
uniform vec3 goBackColor; uniform float goBackStrength;
uniform float goSheen; uniform float goFloor;
uniform float goShadowSat; uniform float goGroundAO; uniform float goExposure;

struct ToonMaterial { vec3 diffuseColor; };

void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition,
    const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal,
    const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
  float t = dot( geometryNormal, directLight.direction ) * 0.5 + 0.5;
  float v = saturate( dot( geometryNormal, geometryViewDir ) );
  float g = mix( goFloor, 1.0, smoothstep( 0.0, 0.68, t ) );
  float rim = pow( 1.0 - v, 1.8 ) * pow( t, 1.8 );
  float sheen = goSheen * pow( smoothstep( 0.4, 1.0, v ), 1.2 ) * pow( smoothstep( 0.4, 1.0, t ), 1.5 );
  float back = pow( 1.0 - v, 2.0 ) * ( 1.0 - smoothstep( 0.0, 0.45, t ) );
  // the town's lights are in "1 = show the albedo" units (see look.ts), so no 1 / PI here
  vec3 light = directLight.color;
  vec3 albedo = material.diffuseColor;
  reflectedLight.directDiffuse += light * (
      albedo * pow( g, 2.2 )
    + goRimColor * ( rim * goRimStrength ) * ( 0.4 + 0.6 * albedo )
    + vec3( sheen )
    + goBackColor * ( back * goBackStrength ) * ( 0.3 + 0.7 * albedo ) );
}

void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition,
    const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal,
    const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
  reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct RE_Direct_Toon
#define RE_IndirectDiffuse RE_IndirectDiffuse_Toon`;

const GO_FINISH = /* glsl */ `
outgoingLight *= goExposure;
float goLum = dot( outgoingLight, vec3( 0.2126, 0.7152, 0.0722 ) );
float goBase = max( dot( diffuseColor.rgb, vec3( 0.2126, 0.7152, 0.0722 ) ), 1e-3 );
float goShade = saturate( goLum / goBase );
outgoingLight = max( mix( vec3( goLum ), outgoingLight, 1.0 + goShadowSat * ( 1.0 - goShade ) ), 0.0 );
outgoingLight *= mix( 1.0 - goGroundAO, 1.0, smoothstep( 0.0, 0.3, vGoY ) );`;

/** Turns a MeshToonMaterial's lighting into GO's. Every Pokémon material uses it, the smooth models too. */
export function goPatch(s: { uniforms: Record<string, unknown>; vertexShader: string; fragmentShader: string }) {
  Object.assign(s.uniforms, goLight);
  s.vertexShader = s.vertexShader
    .replace("#include <common>", "#include <common>\nvarying float vGoY;")
    .replace("#include <begin_vertex>", "#include <begin_vertex>\nvGoY = (modelMatrix * vec4(position, 1.0)).y;");
  s.fragmentShader = s.fragmentShader
    .replace("#include <lights_toon_pars_fragment>", GO_LIGHTS)
    .replace("#include <opaque_fragment>", `${GO_FINISH}\n#include <opaque_fragment>`);
}

const toons = new Map<string, MeshToonMaterial>();
/** GO's Pokémon material in one color, shared across every Pokémon. */
export function toon(color: string) {
  let m = toons.get(color);
  if (m) return m;
  m = new MeshToonMaterial({ color });
  m.onBeforeCompile = goPatch;
  m.customProgramCacheKey = () => "go-pokemon";
  toons.set(color, m);
  return m;
}

/**
 * The dark outline, for shells built by hand. GO draws no outlines, so it's
 * off: the shells stay in the scene graph but never draw.
 */
export const outlineMaterial = new MeshBasicMaterial({ color: "#2a2230", side: BackSide, visible: false });
/** Whether Part draws its inverted-hull outline at all (GO: no). */
const OUTLINES = false;
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
      {OUTLINES && outline > 0 ? (
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

/** Shared unit shapes every species is built from. */
export const ball = new SphereGeometry(1, 28, 20);
export const cone = new ConeGeometry(1, 1, 18);
/** The top half of a ball (Voltorb's halves, domes). */
export const half = new SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);

/** A flat shape from an outline, extruded to a thickness and centered on it (tails, fins, leaves). */
export function cutout(outline: readonly (readonly [number, number])[], depth: number) {
  const s = new Shape();
  outline.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  s.closePath();
  return new ExtrudeGeometry(s, { depth, bevelEnabled: false }).translate(0, 0, -depth / 2);
}

/**
 * A spot on a ball part (its center and radii) at a longitude (around from
 * the front, toward +x) and a latitude (up), turned so +z points straight out
 * of the surface and +x stays level, then rolled by `roll`. Where eyes, masks
 * and markings go, so they sit on a curved head instead of floating off it.
 */
export function onBody(center: Xyz, radii: Xyz, lon: number, lat: number, lift = 0, roll = 0) {
  const d = new Vector3(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon));
  const p = new Vector3(d.x * radii[0], d.y * radii[1], d.z * radii[2]);
  const n = new Vector3(p.x / radii[0] ** 2, p.y / radii[1] ** 2, p.z / radii[2] ** 2).normalize();
  p.addScaledVector(n, lift).add(new Vector3(...center));
  const o = new Object3D();
  o.lookAt(n);
  o.rotateZ(roll);
  const e = new Euler().setFromQuaternion(o.quaternion);
  return { at: [p.x, p.y, p.z] as Xyz, turn: [e.x, e.y, e.z] as Xyz };
}
