"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useLayoutEffect } from "react";
import { palettes } from "./palette";
import { World } from "./scene/World";
import { useTimeOfDay } from "./useTimeOfDay";

/** Points the camera at home. Stands in until the follow camera exists. */
function LookAtHome() {
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => camera.lookAt(0, 0, -24), [camera]);
  return null;
}

export default function Game() {
  const time = useTimeOfDay();
  return (
    <div className="absolute inset-0" role="img" aria-label="Tyler's home base, a 3D map in the style of Pokémon GO">
      <Canvas flat dpr={[1, 2]} camera={{ fov: 50, near: 0.5, far: 2500, position: [0, 18, 36] }}>
        <World palette={palettes[time]} night={time === "night"} />
        <LookAtHome />
      </Canvas>
    </div>
  );
}
