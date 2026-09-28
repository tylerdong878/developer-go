import { Vector3 } from "three";
import { START } from "./base";

/**
 * Where the trainer and Teddy are, updated every frame (outside React, so
 * moving never re-renders). Heading is in radians around y: 0 faces +z
 * (south), and PI faces north.
 */
export type Mover = { position: Vector3; heading: number; speed: number };
export type Player = { trainer: Mover; buddy: Mover };

export function createPlayer(): Player {
  return {
    trainer: { position: new Vector3(START[0], 0, START[1]), heading: Math.PI, speed: 0 },
    buddy: { position: new Vector3(START[0] + 1.5, 0, START[1] + 0.9), heading: Math.PI * 0.85, speed: 0 },
  };
}
