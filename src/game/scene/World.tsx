"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { type BufferGeometry, type DirectionalLight, DoubleSide, Object3D } from "three";
import { areas, roads, type AreaKind, type RoadKind } from "../base";
import { circle } from "../geometry";
import type { Palette } from "../palette";
import { outlineGeometry, polygonGeometry, ribbonGeometry } from "./ground";
import { Sky } from "./Sky";
import { Sun } from "./Sun";
import { Flora } from "./Flora";
import { Landmarks } from "./Landmarks";
import { Trees } from "./Trees";
import { Buildings } from "./Buildings";

/** Fog starts past what's around you and swallows the edge of the base. */
export const FOG = { near: 60, far: 185 };

type Layer = { key: string; geometry: BufferGeometry; color: (p: Palette) => string };

const areaLayer = (kind: AreaKind): Layer => ({
  key: kind,
  geometry: polygonGeometry(areas.filter((a) => a.kind === kind).map((a) => a.points)),
  color: (p) => p.areas[kind],
});

const roadLayers = (kinds: RoadKind[]): Layer[] => {
  const lines = roads.filter((r) => kinds.includes(r.kind));
  return [
    { key: `${kinds[0]}-edge`, geometry: ribbonGeometry(lines, 0.55), color: (p) => p.roads[kinds[0]][1] },
    { key: `${kinds[0]}-fill`, geometry: ribbonGeometry(lines), color: (p) => p.roads[kinds[0]][0] },
  ];
};

/**
 * The ground, bottom to top. Every layer is flat on y = 0 and drawn in this
 * order without depth, so nothing z-fights, and everything standing on the
 * ground draws over it.
 */
function groundLayers(): Layer[] {
  const water = areas.filter((a) => a.kind === "water").map((a) => a.points);
  return [
    { key: "land", geometry: polygonGeometry([circle(0, 0, 700, 64)]), color: (p) => p.land },
    areaLayer("park"),
    areaLayer("grass"),
    areaLayer("lawn"),
    areaLayer("plaza"),
    areaLayer("water"),
    { key: "shore", geometry: outlineGeometry(water, 1.4), color: (p) => p.shore },
    ...roadLayers(["path"]),
    ...roadLayers(["avenue", "street"]),
    areaLayer("deck"),
    ...roadLayers(["boardwalk"]),
  ];
}

/** A light that shines from wherever the camera is, a little above it. */
function CameraLight({ color, intensity }: { color: string; intensity: number }) {
  const light = useRef<DirectionalLight>(null);
  const target = useMemo(() => new Object3D(), []);
  useFrame(({ camera }) => {
    if (!light.current) return;
    light.current.position.copy(camera.position).add({ x: 0, y: 6, z: 0 });
    camera.getWorldDirection(target.position).multiplyScalar(20).add(camera.position);
    target.updateMatrixWorld();
  });
  return <directionalLight ref={light} color={color} intensity={intensity} target={target} />;
}

export function World({ palette, night, shadowMap }: { palette: Palette; night: boolean; shadowMap: number }) {
  const layers = useMemo(() => groundLayers(), []);
  return (
    <>
      <color attach="background" args={[palette.sky.horizon]} />
      <fog attach="fog" args={[palette.sky.horizon, FOG.near, FOG.far]} />
      <Sky top={palette.sky.top} horizon={palette.sky.horizon} stars={night} />
      <hemisphereLight args={[palette.hemi.sky, palette.hemi.ground, palette.hemi.intensity]} />
      <Sun color={palette.sun.color} intensity={palette.sun.intensity} night={night} mapSize={shadowMap} />
      <CameraLight color={palette.fill.color} intensity={palette.fill.intensity} />

      {layers.map((layer, i) => (
        <mesh key={layer.key} geometry={layer.geometry} renderOrder={-50 + i}>
          <meshBasicMaterial color={layer.color(palette)} side={DoubleSide} depthTest={false} depthWrite={false} />
        </mesh>
      ))}

      <Buildings night={night} />
      <Trees trunk={palette.trunk} leaves={palette.leaves} />
      <Flora grass={palette.leaves[1]} />
      <Landmarks />
    </>
  );
}
