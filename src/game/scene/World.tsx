"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { type BufferGeometry, Color, DoubleSide, Fog, type HemisphereLight, MeshBasicMaterial, RingGeometry } from "three";
import { areas, roads, type AreaKind } from "../base";
import { circle } from "../geometry";
import type { Palette } from "../palette";
import { zebraCrossings } from "../streets";
import { outlineGeometry, polygonGeometry, quadsGeometry, ribbonGeometry } from "./ground";
import { Sky, skyLook } from "./Sky";
import { Sun } from "./Sun";
import { Flora } from "./Flora";
import { Landmarks } from "./Landmarks";
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
type Surface = "area" | "road" | "curb" | "sidewalk" | "path" | "planks" | "radial" | "squares";

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
#ifdef GROUND_PLANKS
  { float row = floor(vAlong / 0.3); float gap = smoothstep(0.82, 0.9, fract(vAlong / 0.3));
    float board = floor((vAcross + 1.0) * 1.4 + nHash(vec2(row, 3.0)) * 2.0);
    diffuseColor.rgb *= (0.93 + 0.12 * nHash(vec2(row, board))) * (1.0 - gap * 0.32); }
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
  { vec2 q = vGround / 2.0; vec2 f = fract(q); vec2 e = min(f, 1.0 - f) * 2.0;
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
function groundMaterial(mottle: number, surface: Surface) {
  const material = new MeshBasicMaterial({ side: DoubleSide, depthTest: false, depthWrite: false, alphaHash: surface === "path" });
  const ribbon = surface !== "area" && surface !== "radial" && surface !== "squares";
  material.defines = { [`GROUND_${surface.toUpperCase()}`]: "", ...(ribbon ? { GROUND_RIBBON: "" } : {}) };
  material.customProgramCacheKey = () => `ground-${surface}`;
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

const layer = (key: string, geometry: BufferGeometry, color: (p: Palette) => string, surface: Surface = "area"): Layer => ({
  key,
  geometry,
  color,
  material: groundMaterial(MOTTLE[key] ?? 0.3, surface),
});

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
  const water = areas.filter((a) => a.kind === "water").map((a) => a.points);
  return [
    layer("land", polygonGeometry([circle(0, 0, 700, 64)]), (p) => p.land),
    areaLayer("park"),
    areaLayer("grass"),
    areaLayer("lawn"),
    // radial pavers round the roundabout's island
    layer("apron", new RingGeometry(10.6, 13.4, 96, 1).rotateX(-Math.PI / 2), (p) => p.apron, "radial"),
    areaLayer("water"),
    layer("shore", outlineGeometry(water, 1.4), (p) => p.shore),
    layer("path", ribbonGeometry(roads.filter((r) => r.kind === "path"), 0.45), (p) => p.roads.path[0], "path"),
    ...streetLayers(),
    // the plaza and the pier deck sit on top of the road ends that run into them
    areaLayer("plaza", "squares"),
    layer("boardwalk-edge", ribbonGeometry(roads.filter((r) => r.kind === "boardwalk"), 0.3), (p) => p.roads.boardwalk[1], "curb"),
    layer("boardwalk", ribbonGeometry(roads.filter((r) => r.kind === "boardwalk")), (p) => p.roads.boardwalk[0], "planks"),
    areaLayer("deck"),
  ];
})();

const target = new Color();

/**
 * Eases every time-of-day color toward the palette each frame: the sky, the
 * fog, the ground, the shadow tint. Switching day and night glides.
 */
function Glide({ palette, night }: { palette: Palette; night: boolean }) {
  const first = useRef(true);
  useFrame(({ scene }, dt) => {
    const k = first.current ? 1 : 1 - Math.exp(-2.4 * dt);
    first.current = false;
    const ease = (c: Color, hex: string) => c.lerp(target.set(hex), k);
    ease(skyLook.uTop.value, palette.sky.top);
    ease(skyLook.uMid.value, palette.sky.mid);
    ease(skyLook.uHaze.value, palette.sky.haze);
    ease(skyLook.uFog.value, palette.sky.fog);
    ease(skyLook.uCloudLit.value, palette.clouds.lit);
    ease(skyLook.uCloudShade.value, palette.clouds.shade);
    skyLook.uNight.value += ((night ? 1 : 0) - skyLook.uNight.value) * k;
    if (scene.fog) scene.fog.color.copy(skyLook.uFog.value);
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

export function World({ palette, night, shadowMap, light }: { palette: Palette; night: boolean; shadowMap: number; light: boolean }) {
  const [fog] = useState(() => new Fog(palette.sky.fog, FOG.near, FOG.far));
  const [background] = useState(() => new Color(palette.sky.fog));
  const [start] = useState(palette);
  return (
    <>
      <primitive attach="background" object={background} />
      <primitive attach="fog" object={fog} />
      <Glide palette={palette} night={night} />
      <Sky />
      {/* not a light so much as the two colors the look patch reads: shadow tint and ground bounce */}
      <hemisphereLight name="shade" args={[start.shade.tint, start.shade.bounce, 1]} />
      <Sun color={palette.sun.color} intensity={palette.sun.intensity} shadow={palette.shadow} mapSize={shadowMap} />

      {LAYERS.map((l, i) => (
        <mesh key={l.key} geometry={l.geometry} material={l.material} renderOrder={-50 + i} />
      ))}
      {/* the ground layers write no depth, so this invisible floor does: nothing below ground shows through */}
      <mesh geometry={floor} renderOrder={-10}>
        <meshBasicMaterial colorWrite={false} side={DoubleSide} />
      </mesh>

      <Buildings night={night} />
      <Props night={night} shadows={!light} />
      <Signs />
      <Signposts />
      <TallGrass />
      <GymStatues />
      <Trees trunk={palette.trunk} leaves={palette.leaves} />
      <Flora grass={palette.leaves[1]} />
      <Landmarks />
    </>
  );
}
