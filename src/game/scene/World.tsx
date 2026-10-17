"use client";

import { useMemo } from "react";
import { type BufferGeometry, DoubleSide } from "three";
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
import { Props } from "./Props";
import { Signs } from "./Signs";
import { Signposts } from "./Signposts";
import { TallGrass } from "./TallGrass";
import { GymStatues } from "./GymStatues";

/** Fog starts past what's around you and swallows the edge of the base. */
export const FOG = { near: 60, far: 185 };

const floor = polygonGeometry([circle(0, 0, 700, 64)]);

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
    areaLayer("water"),
    { key: "shore", geometry: outlineGeometry(water, 1.4), color: (p) => p.shore },
    ...roadLayers(["path"]),
    ...roadLayers(["avenue", "street"]),
    // the plaza and the pier deck sit on top of the road ends that run into them
    areaLayer("plaza"),
    ...roadLayers(["boardwalk"]),
    areaLayer("deck"),
  ];
}

export function World({ palette, night, shadowMap, light }: { palette: Palette; night: boolean; shadowMap: number; light: boolean }) {
  const layers = useMemo(() => groundLayers(), []);
  return (
    <>
      <color attach="background" args={[palette.sky.horizon]} />
      <fog attach="fog" args={[palette.sky.horizon, FOG.near, FOG.far]} />
      <Sky top={palette.sky.top} horizon={palette.sky.horizon} stars={night} />
      {/* not a light so much as the two colors the look patch reads: shadow tint and ground bounce */}
      <hemisphereLight args={[palette.shade.tint, palette.shade.bounce, 1]} />
      <Sun color={palette.sun.color} intensity={palette.sun.intensity} shadow={palette.shadow} mapSize={shadowMap} />

      {layers.map((layer, i) => (
        <mesh key={layer.key} geometry={layer.geometry} renderOrder={-50 + i}>
          <meshBasicMaterial color={layer.color(palette)} side={DoubleSide} depthTest={false} depthWrite={false} />
        </mesh>
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
