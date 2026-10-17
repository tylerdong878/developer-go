"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { type BufferGeometry, Color, DoubleSide, Fog, type HemisphereLight, MeshBasicMaterial } from "three";
import { areas, roads, type AreaKind, type RoadKind } from "../base";
import { circle } from "../geometry";
import type { Palette } from "../palette";
import { outlineGeometry, polygonGeometry, ribbonGeometry } from "./ground";
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

/**
 * A ground layer's material: flat and unlit like GO's map, but mottled
 * (GO and Let's Go lawns are never one flat color) and crossed by slow cloud
 * shadows in the day. `mottle` is how much (lawns full, roads a little).
 */
function groundMaterial(mottle: number) {
  const material = new MeshBasicMaterial({ side: DoubleSide, depthTest: false, depthWrite: false });
  material.customProgramCacheKey = () => "ground";
  const uMottle = { value: mottle };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, { uMottle, uNight: skyLook.uNight, uCloudOffset: skyLook.uCloudOffset });
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec2 vGround;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvGround = (modelMatrix * vec4(transformed, 1.0)).xz;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec2 vGround;\nuniform float uMottle, uNight;\nuniform vec2 uCloudOffset;\n${NOISE}`)
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
{
  float big = fbm3(vGround * 0.08);
  float speck = vnoise(vGround * 1.1);
  diffuseColor.rgb *= mix(1.0, (0.92 + 0.16 * smoothstep(0.2, 0.8, big)) * (0.97 + 0.06 * speck), uMottle);
  float cloud = smoothstep(0.58, 0.8, fbm3(vGround * 0.012 + uCloudOffset * 4.5));
  diffuseColor.rgb *= 1.0 - cloud * 0.11 * (1.0 - uNight);
}`,
      );
  };
  return material;
}

type Layer = { key: string; geometry: BufferGeometry; color: (p: Palette) => string; material: MeshBasicMaterial };

const MOTTLE: Partial<Record<string, number>> = { land: 1, park: 1, grass: 0.8, lawn: 1, water: 0.25, plaza: 0.35, deck: 0.4 };

const layer = (key: string, geometry: BufferGeometry, color: (p: Palette) => string): Layer => ({
  key,
  geometry,
  color,
  material: groundMaterial(MOTTLE[key] ?? 0.3),
});

const areaLayer = (kind: AreaKind) =>
  layer(
    kind,
    polygonGeometry(areas.filter((a) => a.kind === kind).map((a) => a.points)),
    (p) => p.areas[kind],
  );

const roadLayers = (kinds: RoadKind[]) => {
  const lines = roads.filter((r) => kinds.includes(r.kind));
  return [
    layer(`${kinds[0]}-edge`, ribbonGeometry(lines, 0.55), (p) => p.roads[kinds[0]][1]),
    layer(`${kinds[0]}-fill`, ribbonGeometry(lines), (p) => p.roads[kinds[0]][0]),
  ];
};

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
    areaLayer("water"),
    layer("shore", outlineGeometry(water, 1.4), (p) => p.shore),
    ...roadLayers(["path"]),
    ...roadLayers(["avenue", "street"]),
    // the plaza and the pier deck sit on top of the road ends that run into them
    areaLayer("plaza"),
    ...roadLayers(["boardwalk"]),
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
