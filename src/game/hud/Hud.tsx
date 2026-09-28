"use client";

import { Nearby } from "./Nearby";

/**
 * GO's on-screen controls, laid over the 3D base. It sits beside the scene,
 * not inside it, so taps and scrolls here never spin or zoom the camera.
 */
export function Hud() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="pointer-events-auto absolute right-4 bottom-4">
        <Nearby />
      </div>
    </div>
  );
}
