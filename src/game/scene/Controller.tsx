"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Vector3 } from "three";
import { walkable } from "../base";
import { MOVE_KEYS } from "../controls";
import { game, WALK_SPEED, ZOOM } from "../state";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Frame-rate independent easing: how far to close a gap this frame. */
const ease = (rate: number, dt: number) => 1 - Math.exp(-rate * dt);
/** The short way around from one angle to another. */
function turn(from: number, to: number) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/**
 * Runs first every frame: walks the trainer (keys or a tap target), brings
 * Teddy along, and flies the camera behind them the way GO does: close in it
 * sits low and shows the horizon, zoomed out it looks down from above.
 */
export function Controller() {
  const focus = useRef<Vector3>(null);

  useFrame(({ camera }, frame) => {
    const dt = Math.min(frame, 0.05); // no leaps after a background tab wakes up
    const { trainer, buddy } = game.player;
    const { view, input } = game;

    view.yaw += (view.yawTo - view.yaw) * ease(10, dt);
    view.distance += (view.distanceTo - view.distance) * ease(10, dt);
    const fx = Math.sin(view.yaw); // camera forward on the ground
    const fz = -Math.cos(view.yaw);

    // Where the trainer wants to go: keys are relative to the camera, a tap is a spot.
    let mx = 0;
    let mz = 0;
    let want = 0;
    for (const code of input.keys) {
      const [forward, right] = MOVE_KEYS[code] ?? [0, 0];
      mx += fx * forward - fz * right;
      mz += fz * forward + fx * right;
    }
    if (mx || mz) {
      const len = Math.hypot(mx, mz);
      mx /= len;
      mz /= len;
      want = WALK_SPEED;
    } else if (input.target) {
      const dx = input.target.x - trainer.position.x;
      const dz = input.target.z - trainer.position.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.3) input.target = null;
      else {
        mx = dx / d;
        mz = dz / d;
        want = Math.min(WALK_SPEED, 1.5 + d * 4); // ease into the stop
      }
    }
    trainer.speed = lerp(trainer.speed, want, ease(12, dt));

    if (want > 0) {
      const step = trainer.speed * dt;
      const { x, z } = trainer.position;
      // Slide along the water's edge and the rim of the base instead of sticking.
      if (walkable([x + mx * step, z + mz * step])) trainer.position.set(x + mx * step, 0, z + mz * step);
      else if (walkable([x + mx * step, z])) trainer.position.x += mx * step;
      else if (walkable([x, z + mz * step])) trainer.position.z += mz * step;
      else input.target = null;
      trainer.heading += turn(trainer.heading, Math.atan2(mx, mz)) * ease(14, dt);
    }

    // Teddy trots to a spot just behind Tyler, off his right shoulder.
    const hx = Math.sin(trainer.heading);
    const hz = Math.cos(trainer.heading);
    const bx = trainer.position.x - hx * 1.5 - hz * 1.1 - buddy.position.x;
    const bz = trainer.position.z - hz * 1.5 + hx * 1.1 - buddy.position.z;
    const gap = Math.hypot(bx, bz);
    buddy.speed = lerp(buddy.speed, gap > 0.25 ? Math.min(WALK_SPEED * 1.3, gap * 3.2) : 0, ease(8, dt));
    if (gap > 0.05 && buddy.speed > 0.05) {
      const step = Math.min(buddy.speed * dt, gap);
      const nx = buddy.position.x + (bx / gap) * step;
      const nz = buddy.position.z + (bz / gap) * step;
      if (walkable([nx, nz])) buddy.position.set(nx, 0, nz);
      buddy.heading += turn(buddy.heading, Math.atan2(bx, bz)) * ease(10, dt);
    } else {
      buddy.heading += turn(buddy.heading, trainer.heading) * ease(3, dt);
    }

    // The camera: behind the trainer at the chosen yaw, looking a little ahead of him.
    focus.current ??= new Vector3(trainer.position.x, 1.4, trainer.position.z);
    const look = focus.current;
    const t = (view.distance - ZOOM.min) / (ZOOM.max - ZOOM.min);
    const pitch = lerp(0.2, 0.92, t);
    const lead = lerp(2.4, 1, t);
    const k = ease(12, dt);
    look.x += (trainer.position.x + fx * lead - look.x) * k;
    look.z += (trainer.position.z + fz * lead - look.z) * k;
    const flat = view.distance * Math.cos(pitch);
    camera.position.set(look.x - fx * flat, look.y + view.distance * Math.sin(pitch), look.z - fz * flat);
    camera.lookAt(look);
  });

  return null;
}
