"use client";

import { useFrame } from "@react-three/fiber";
import { buildings } from "../base";
import { game } from "../state";

/**
 * Shared by every building in town: how visible each one is right now (1
 * solid, low when it stands between the camera and the trainer), and how
 * dark it is (0 day, 1 night, eased), so windows and signs can glow.
 */
export const fade = new Float32Array(buildings.length).fill(1);
export const town = { uNight: { value: 0 } };

/** Updates both every frame. Mount it once, inside the scene. */
export function TownTracker({ night }: { night: boolean }) {
  useFrame(({ camera }, dt) => {
    town.uNight.value += ((night ? 1 : 0) - town.uNight.value) * 0.08;
    const { position } = game.player.trainer;
    const cx = camera.position.x;
    const cz = camera.position.z;
    const sx = position.x - cx;
    const sz = position.z - cz;
    const k = 1 - Math.exp(-8 * dt);
    const cy = camera.position.y;
    buildings.forEach((b, i) => {
      // The camera inside (or right up against) a building: hide it fully, never look through a wall of dots.
      const inside = cy < b.h + 2 && Math.abs(cx - b.x) < b.w / 2 + 1.5 && Math.abs(cz - b.z) < b.d / 2 + 1.5;
      // Sample the camera-to-trainer line: it's in the way only where the line passes the footprint
      // below the roof (a low building under a high camera doesn't count).
      let blocking = false;
      for (let t = 0; t <= 0.96 && !blocking && !inside; t += 0.08) {
        const y = cy + (1.2 - cy) * t;
        blocking = y < b.h + 0.5 && Math.abs(cx + sx * t - b.x) < b.w / 2 + 0.8 && Math.abs(cz + sz * t - b.z) < b.d / 2 + 0.8;
      }
      // a ghost you can still read, not a near-invisible speckle
      fade[i] += ((inside ? 0 : blocking ? 0.25 : 1) - fade[i]) * k;
      // Snap the last bit, or the dither keeps eating a few pixels of a building that's back in full.
      if (fade[i] > 0.99) fade[i] = 1;
    });
  });
  return null;
}
