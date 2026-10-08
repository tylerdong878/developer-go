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
    buildings.forEach((b, i) => {
      // Sample the camera-to-trainer line; if it crosses the footprint, the building's in the way.
      let blocking = false;
      for (let t = 0.1; t <= 0.96 && !blocking; t += 0.08) {
        blocking = Math.abs(cx + sx * t - b.x) < b.w / 2 + 0.8 && Math.abs(cz + sz * t - b.z) < b.d / 2 + 0.8;
      }
      fade[i] += ((blocking ? 0.22 : 1) - fade[i]) * k;
    });
  });
  return null;
}
