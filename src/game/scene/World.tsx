"use client";

import { useMemo } from "react";
import { DoubleSide, type BufferGeometry } from "three";
import { areas, roads, type AreaKind, type RoadKind } from "../base";
import { circle } from "../geometry";
import type { Palette } from "../palette";
import { outlineGeometry, polygonGeometry, ribbonGeometry } from "./ground";
import { Sky } from "./Sky";
import { Trees } from "./Trees";

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

export function World({ palette, night }: { palette: Palette; night: boolean }) {
  const layers = useMemo(() => groundLayers(), []);
  return (
    <>
      <color attach="background" args={[palette.sky.horizon]} />
      <fog attach="fog" args={[palette.sky.horizon, FOG.near, FOG.far]} />
      <Sky top={palette.sky.top} horizon={palette.sky.horizon} stars={night} />
      <hemisphereLight args={[palette.hemi.sky, palette.hemi.ground, palette.hemi.intensity]} />
      <directionalLight position={[60, 120, 40]} color={palette.sun.color} intensity={palette.sun.intensity} />

      {layers.map((layer, i) => (
        <mesh key={layer.key} geometry={layer.geometry} renderOrder={-50 + i}>
          <meshBasicMaterial color={layer.color(palette)} side={DoubleSide} depthTest={false} depthWrite={false} />
        </mesh>
      ))}

      <Trees trunk={palette.trunk} leaves={palette.leaves} />
    </>
  );
}
