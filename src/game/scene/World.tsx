"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import { type BufferGeometry, Color, DoubleSide, Fog, type HemisphereLight, MeshBasicMaterial, RingGeometry, Vector3 } from "three";
import { areas, buildings, clearOfRoads, roads, type AreaKind } from "../base";
import { circle, type Vec2 } from "../geometry";
import { halloween } from "../events";
import { autumn, type Palette, palettes } from "../palette";
import { Halloween } from "./Halloween";
import { Contact } from "./Contact";
import { useWeather } from "../weather";
import { type Weathered, weatherize } from "../weatherLook";
import { WeatherFx } from "./WeatherFx";
import { sunDirection } from "../sun";
import { clockNow, followingClock, type Phase } from "../useTimeOfDay";
import { zebraCrossings } from "../streets";
import { polygonGeometry, quadsGeometry, ribbonGeometry } from "./ground";
import { Water } from "./Water";
import { Sky, skyLook } from "./Sky";
import { Sun } from "./Sun";
import { Flora } from "./Flora";
import { Landmarks } from "./Landmarks";
import { Harbor } from "./Harbor";
import { Lab } from "./Lab";
import { Sights } from "./Sights";
import { Trees } from "./Trees";
import { Buildings } from "./Buildings";
import { Props } from "./Props";
import { Signs } from "./Signs";
import { Signposts } from "./Signposts";
import { TallGrass } from "./TallGrass";
import { GymStatues } from "./GymStatues";

/** Fog starts past what's around you and swallows the edge of the base. */
export const FOG = { near: 60, far: 185 };

const floor = polygonGeometry([circle(0, 0, 700, 64)]);

/** Value noise for the ground: soft patches a few trainer-lengths across, plus a fine speck. */
const NOISE = /* glsl */ `
float nHash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(nHash(i), nHash(i + vec2(1, 0)), u.x), mix(nHash(i + vec2(0, 1)), nHash(i + vec2(1, 1)), u.x), u.y);
}
float fbm3(vec2 p) { float s = 0.0, a = 0.5; for (int k = 0; k < 3; k++) { s += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; } return s / 0.875; }`;

/** What a ground layer is, for its pattern (notes/research/gfx-nature-ground.md 2.4, 7.x). */
type Surface = "area" | "road" | "curb" | "sidewalk" | "path" | "planks" | "deck" | "radial" | "squares";

/** Patterns drawn in the shader, no textures: each one a brightness multiplier, so day and night colors still apply. */
const PATTERNS = /* glsl */ `
#ifdef GROUND_ROAD
  // the gutter: a darker band along both edges, like the curb's shadow
  diffuseColor.rgb *= mix(1.0, 0.88, smoothstep(0.84, 0.93, abs(vAcross)));
#endif
#ifdef GROUND_SIDEWALK
  { float j = abs(fract(vAlong / 1.6) - 0.5) * 2.0; float aa = fwidth(vAlong / 1.6) * 2.0;
    diffuseColor.rgb *= 1.0 - smoothstep(0.93 - aa, 0.95, j) * 0.13;
    diffuseColor.rgb *= 0.97 + 0.05 * nHash(vec2(floor(vAlong / 1.6), 7.0)); }
#endif
#ifdef GROUND_PATH
  // soft, ragged edges into the grass, a lighter rim and a worn center line, like LGPE's lanes
  { float e = abs(vAcross) + (vnoise(vGround * 1.6) - 0.5) * 0.30 + (vnoise(vGround * 5.0) - 0.5) * 0.08;
    diffuseColor.rgb *= mix(0.93, 1.0, smoothstep(0.0, 0.35, e)) * mix(1.0, 1.07, smoothstep(0.4, 0.75, e));
    diffuseColor.a *= 1.0 - smoothstep(0.72, 1.0, e); }
#endif
#if defined( GROUND_PLANKS ) || defined( GROUND_DECK )
  // planks across the walk (along the deck's x on the pier's end), the gaps fading out with distance so they never shimmer
  {
  #ifdef GROUND_PLANKS
    float u = vAlong / 0.45; float v = (vAcross + 1.0) * 1.4;
  #else
    float u = vGround.x / 0.45; float v = vGround.y / 2.4;
  #endif
    float row = floor(u); float aa = fwidth(u);
    float gap = smoothstep(0.86 - aa, 0.9 + aa, fract(u)) * (1.0 - smoothstep(0.25, 0.5, aa));
    float board = floor(v + nHash(vec2(row, 3.0)) * 2.0);
    diffuseColor.rgb *= (0.93 + 0.12 * nHash(vec2(row, board))) * (1.0 - gap * 0.3); }
#endif
#ifdef GROUND_RADIAL
  // radial pavers round the roundabout's island, odd rings offset half a tile
  { vec2 p = vGround; float r = length(p); float tile = 0.9;
    float ring = floor(r / tile); float n = max(8.0, floor(6.2832 * (ring + 0.5)));
    float t = (atan(p.y, p.x) / 6.2832 + 0.5) * n + mod(ring, 2.0) * 0.5;
    float fr = fract(r / tile), ft = fract(t);
    float d = min(min(fr, 1.0 - fr) * tile, min(ft, 1.0 - ft) * 6.2832 * r / n);
    float aa = fwidth(d);
    float joint = 1.0 - smoothstep(0.035 - aa, 0.035 + aa, d);
    diffuseColor.rgb *= (0.96 + 0.06 * nHash(vec2(ring, mod(floor(t), n)))) * (1.0 - joint * 0.16); }
#endif
#ifdef GROUND_SQUARES
  // big pavers with lighter borders, Pewter style
  { vec2 q = vGround / GROUND_TILE; vec2 f = fract(q); vec2 e = min(f, 1.0 - f) * 2.0;
    float d = min(e.x, e.y); float aa = fwidth(d);
    float joint = 1.0 - smoothstep(0.035 - aa, 0.035 + aa, d);
    float border = 1.0 - smoothstep(0.28, 0.3, d);
    diffuseColor.rgb *= (0.97 + 0.04 * nHash(floor(q))) * (1.0 + border * 0.035) * (1.0 - joint * 0.14); }
#endif`;

/**
 * A ground layer's material: flat and unlit like GO's map, but mottled
 * (GO and Let's Go lawns are never one flat color), crossed by slow cloud
 * shadows in the day, and patterned by what it is (gutters, joints, planks,
 * pavers). `mottle` is how much (lawns full, roads a little). Soft path edges
 * dither out (alphaHash), so the ground stays one opaque stack in order.
 */
function groundMaterial(mottle: number, surface: Surface, tile = 2) {
  const material = new MeshBasicMaterial({ side: DoubleSide, depthTest: false, depthWrite: false, alphaHash: surface === "path" });
  const ribbon = surface !== "area" && surface !== "radial" && surface !== "squares" && surface !== "deck";
  material.defines = { [`GROUND_${surface.toUpperCase()}`]: "", GROUND_TILE: tile.toFixed(2), ...(ribbon ? { GROUND_RIBBON: "" } : {}) };
  material.customProgramCacheKey = () => `ground-${surface}-${tile}`;
  const uMottle = { value: mottle };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, { uMottle, uNight: skyLook.uNight, uCloudOffset: skyLook.uCloudOffset });
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec2 vGround;\n#ifdef GROUND_RIBBON\nattribute float along;\nattribute float across;\nvarying float vAlong;\nvarying float vAcross;\n#endif",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvGround = (modelMatrix * vec4(transformed, 1.0)).xz;\n#ifdef GROUND_RIBBON\nvAlong = along;\nvAcross = across;\n#endif",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>\nvarying vec2 vGround;\nuniform float uMottle, uNight;\nuniform vec2 uCloudOffset;\n#ifdef GROUND_RIBBON\nvarying float vAlong;\nvarying float vAcross;\n#endif\n${NOISE}`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
{
  float big = fbm3(vGround * 0.08);
  float speck = vnoise(vGround * 1.1);
  diffuseColor.rgb *= mix(1.0, (0.92 + 0.16 * smoothstep(0.2, 0.8, big)) * (0.97 + 0.06 * speck), uMottle);
${PATTERNS}
  float cloud = smoothstep(0.58, 0.8, fbm3(vGround * 0.012 + uCloudOffset * 4.5));
  diffuseColor.rgb *= 1.0 - cloud * 0.11 * (1.0 - uNight);
}`,
      );
  };
  return material;
}

type Layer = { key: string; geometry: BufferGeometry; color: (p: Palette) => string; material: MeshBasicMaterial };

const MOTTLE: Partial<Record<string, number>> = { land: 1, park: 1, grass: 0.8, lawn: 1, water: 0.25, plaza: 0.3, deck: 0.4, asphalt: 0.45, path: 0.5, zebra: 0.15, apron: 0.2 };

const layer = (key: string, geometry: BufferGeometry, color: (p: Palette) => string, surface: Surface = "area", tile?: number): Layer => ({
  key,
  geometry,
  color,
  material: groundMaterial(MOTTLE[key] ?? 0.3, surface, tile),
});

/**
 * Forecourts (notes/research/town-polish.md 6): paving round the foot of every
 * block, job building and civic building, and a paved walk out to the street
 * from each front door, so nothing stands on bare lawn. Houses get just a
 * narrow path from the door.
 */
const forecourts = (() => {
  const polys: Vec2[][] = [];
  const rounded = (cx: number, cz: number, hw: number, hd: number, r: number) => {
    const pts: Vec2[] = [];
    const corners: [number, number, number][] = [
      [1, 1, 0],
      [-1, 1, Math.PI / 2],
      [-1, -1, Math.PI],
      [1, -1, (3 * Math.PI) / 2],
    ];
    for (const [sx, sz, a0] of corners)
      for (let k = 0; k <= 6; k++) {
        const a = a0 + (k / 6) * (Math.PI / 2);
        pts.push([cx + sx * (hw - r) + Math.cos(a) * r, cz + sz * (hd - r) + Math.sin(a) * r]);
      }
    return pts;
  };
  /** A walk from a door straight out until it meets a road (up to 14 m), w wide. */
  const walk = ([x, z]: Vec2, dx: number, dz: number, w: number) => {
    let len = 0;
    for (let s = 0.5; s <= 14; s += 0.5)
      if (!clearOfRoads([x + dx * s, z + dz * s], 0)) {
        len = s;
        break;
      }
    if (!len) return;
    const [px, pz] = [-dz * (w / 2), dx * (w / 2)];
    polys.push([
      [x - dx * 0.3 + px, z - dz * 0.3 + pz],
      [x + dx * len + px, z + dz * len + pz],
      [x + dx * len - px, z + dz * len - pz],
      [x - dx * 0.3 - px, z - dz * 0.3 - pz],
    ]);
  };
  const DOOR = { pallet: -0.25, viridian: -0.22, vermilion: -0.24 } as const;
  for (const b of buildings) {
    const sideways = Math.round(b.turn / (Math.PI / 2)) % 2 !== 0;
    const D = sideways ? b.w : b.d;
    const W = sideways ? b.d : b.w;
    const [fx, fz] = [Math.sin(b.turn), Math.cos(b.turn)];
    if (b.model === "house") {
      const xd = DOOR[b.style ?? "pallet"] * (b.flip ? -1 : 1) * W;
      walk([b.x + Math.cos(b.turn) * xd + fx * (D / 2), b.z - Math.sin(b.turn) * xd + fz * (D / 2)], fx, fz, 1.4);
      continue;
    }
    polys.push(rounded(b.x, b.z, b.w / 2 + 1.5, b.d / 2 + 1.5, 1.9));
    walk([b.x + fx * (D / 2), b.z + fz * (D / 2)], fx, fz, 4);
  }
  return polys;
})();

const areaLayer = (kind: AreaKind, surface: Surface = "area") =>
  layer(
    kind,
    polygonGeometry(areas.filter((a) => a.kind === kind).map((a) => a.points)),
    (p) => p.areas[kind],
    surface,
  );

const cars = roads.filter((r) => r.kind === "avenue" || r.kind === "street");

/**
 * The car roads, LGPE style on GO's ribbons: a sidewalk on the straight
 * streets (not round the roundabout's island), a pale curb line (GO's road
 * outline), teal-gray asphalt with darker gutters, and zebra crossings at
 * every junction. No lane lines: neither game has them.
 */
const streetLayers = () => [
  layer("sidewalk", ribbonGeometry(cars.filter((r) => !r.loop), 2.02), (p) => p.sidewalk, "sidewalk"),
  layer("curb", ribbonGeometry(cars, 0.22), (p) => p.roads.avenue[1], "curb"),
  layer("asphalt", ribbonGeometry(cars), (p) => p.roads.avenue[0], "road"),
  layer("zebra", quadsGeometry(zebraCrossings(roads)), (p) => p.zebra),
];

/**
 * The ground, bottom to top. Every layer is flat on y = 0 and drawn in this
 * order without depth, so nothing z-fights, and everything standing on the
 * ground draws over it.
 */
const LAYERS: Layer[] = (() => {
  return [
    layer("land", polygonGeometry([circle(0, 0, 700, 64)]), (p) => p.land),
    areaLayer("park"),
    areaLayer("grass"),
    areaLayer("lawn"),
    layer("forecourt", polygonGeometry(forecourts), (p) => p.apron, "squares", 1),
    // radial pavers round the roundabout's island
    layer("apron", new RingGeometry(10.6, 13.4, 96, 1).rotateX(-Math.PI / 2), (p) => p.apron, "radial"),
    layer("path", ribbonGeometry(roads.filter((r) => r.kind === "path"), 0.45), (p) => p.roads.path[0], "path"),
    ...streetLayers(),
    // the plaza and the pier deck sit on top of the road ends that run into them
    areaLayer("plaza", "squares"),
    layer("boardwalk-edge", ribbonGeometry(roads.filter((r) => r.kind === "boardwalk"), 0.3), (p) => p.roads.boardwalk[1], "curb"),
    layer("boardwalk", ribbonGeometry(roads.filter((r) => r.kind === "boardwalk")), (p) => p.roads.boardwalk[0], "planks"),
    areaLayer("deck", "deck"),
  ];
})();

const target = new Color();

/**
 * Eases every time-of-day color toward the palette each frame: the sky, the
 * fog, the ground, the shadow tint. Switching day and night glides.
 */
function Glide({ palette, stars, night }: { palette: Weathered; stars: number; night: boolean }) {
  const first = useRef(true);
  useFrame(({ scene }, dt) => {
    const k = first.current ? 1 : 1 - Math.exp(-2.4 * dt);
    first.current = false;
    // the sun follows the visitor's clock (or sits high in the south-east when they picked day; the moon's light by night)
    const want = night ? NIGHT_LIGHT : !followingClock() ? DAY_LIGHT : sunDirection(clockNow());
    skyLook.uSunDir.value.lerp(sunTarget.set(...want), first.current ? 1 : 1 - Math.exp(-0.8 * dt)).normalize();
    const ease = (c: Color, hex: string) => c.lerp(target.set(hex), k);
    ease(skyLook.uTop.value, palette.sky.top);
    ease(skyLook.uMid.value, palette.sky.mid);
    ease(skyLook.uHaze.value, palette.sky.haze);
    ease(skyLook.uFog.value, palette.sky.fog);
    ease(skyLook.uCloudLit.value, palette.clouds.lit);
    ease(skyLook.uCloudShade.value, palette.clouds.shade);
    skyLook.uNight.value += (stars - skyLook.uNight.value) * k;
    skyLook.uCloudCover.value += (palette.cover - skyLook.uCloudCover.value) * k * 0.4;
    if (scene.fog instanceof Fog) {
      scene.fog.color.copy(skyLook.uFog.value);
      scene.fog.near += (palette.fog[0] - scene.fog.near) * k * 0.4;
      scene.fog.far += (palette.fog[1] - scene.fog.far) * k * 0.4;
    }
    if (scene.background instanceof Color) scene.background.copy(skyLook.uFog.value);
    for (const l of LAYERS) ease(l.material.color, l.color(palette));
    const light = scene.getObjectByName("shade") as HemisphereLight | undefined;
    if (light) {
      ease(light.color, palette.shade.tint);
      ease(light.groundColor, palette.shade.bounce);
    }
  });
  return null;
}

const DAY_LIGHT: [number, number, number] = [0.503, 0.704, 0.503];
const NIGHT_LIGHT: [number, number, number] = [-0.3, 0.8, 0.52];
const sunTarget = new Vector3();
/** How much night is in the sky (stars, the moon, water and ground at night), and whether lamps and windows are on. */
const STARS: Record<Phase, number> = { morning: 0, day: 0, dusk: 0.18, night: 1 };

export function World({ phase, shadowMap, light }: { phase: Phase; shadowMap: number; light: boolean }) {
  const weather = useWeather();
  const spooky = halloween();
  const palette = useMemo(() => {
    const p = weatherize(palettes[phase], weather, phase === "night");
    return spooky ? autumn(p, phase === "night") : p;
  }, [phase, weather, spooky]);
  const lit = phase === "night" || phase === "dusk";
  const [fog] = useState(() => new Fog(palette.sky.fog, FOG.near, FOG.far));
  const [background] = useState(() => new Color(palette.sky.fog));
  const [start] = useState(palette);
  return (
    <>
      <primitive attach="background" object={background} />
      <primitive attach="fog" object={fog} />
      <Glide palette={palette} stars={STARS[phase]} night={phase === "night"} />
      <Sky />
      {/* not a light so much as the two colors the look patch reads: shadow tint and ground bounce */}
      <hemisphereLight name="shade" args={[start.shade.tint, start.shade.bounce, 1]} />
      <Sun color={palette.sun.color} intensity={palette.sun.intensity} shadow={palette.shadow} mapSize={shadowMap} />

      {LAYERS.map((l, i) => (
        <mesh key={l.key} geometry={l.geometry} material={l.material} renderOrder={-50 + i} />
      ))}
      {/* the water goes in the stack just under the paths and roads, which run over its edges */}
      <Water renderOrder={-50 + LAYERS.findIndex((l) => l.key === "path") - 0.5} />
      {/* soft shade round every building's foot, over the ground and under everything standing on it */}
      <Contact renderOrder={-20} />
      {/* the ground layers write no depth, so this invisible floor does: nothing below ground shows through */}
      <mesh geometry={floor} renderOrder={-10}>
        <meshBasicMaterial colorWrite={false} side={DoubleSide} />
      </mesh>

      <Buildings night={lit} />
      <Props night={lit} shadows={!light} />
      <Signs />
      <Signposts />
      <TallGrass />
      <GymStatues />
      <Trees trunk={palette.trunk} fall={spooky} />
      <Flora grass={palette.leaves[1]} />
      <Landmarks />
      <WeatherFx weather={weather} light={light} />
      <Sights />
      <Lab />
      <Harbor />
      {spooky ? <Halloween /> : null}
    </>
  );
}
