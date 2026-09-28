import type { Vector3 } from "three";
import { createPlayer, type Player } from "./player";

/** A game jog: quick enough to cross the base in about half a minute. */
export const WALK_SPEED = 8;

/** Camera distance from the trainer. Close in, the camera drops low and you see the horizon. */
export const ZOOM = { min: 8, max: 30, start: 14 };

/** Where the camera looks from. `yaw` 0 looks north; the `to` values are where it's easing to. */
export type View = { yaw: number; distance: number; yawTo: number; distanceTo: number };

/** Movement keys held right now, and where a tap asked the trainer to walk. */
export type Input = { keys: Set<string>; target: Vector3 | null };

export type GameState = { player: Player; view: View; input: Input };

export function createGame(): GameState {
  return {
    player: createPlayer(),
    view: { yaw: 0, distance: ZOOM.start, yawTo: 0, distanceTo: ZOOM.start },
    input: { keys: new Set(), target: null },
  };
}

export const clampZoom = (d: number) => Math.min(ZOOM.max, Math.max(ZOOM.min, d));

/**
 * The one live game. It lives outside React on purpose: it changes every
 * frame, and the scene reads it in the render loop instead of re-rendering.
 * Coming back to the page keeps your spot.
 */
export const game: GameState = createGame();
