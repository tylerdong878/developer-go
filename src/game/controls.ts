"use client";

import { type RefObject, useEffect } from "react";
import { clampZoom, game } from "./state";

/** Keys that walk, by KeyboardEvent.code. */
export const MOVE_KEYS: Record<string, readonly [forward: number, right: number]> = {
  KeyW: [1, 0],
  ArrowUp: [1, 0],
  KeyS: [-1, 0],
  ArrowDown: [-1, 0],
  KeyA: [0, -1],
  ArrowLeft: [0, -1],
  KeyD: [0, 1],
  ArrowRight: [0, 1],
};

/**
 * Keyboard, mouse, and touch, like GO: drag sideways to spin the camera
 * around the trainer, drag up and down or scroll or pinch to zoom, twist two
 * fingers to turn. WASD or the arrows walk; Q/E turn; +/- zoom. Taps are
 * handled in the scene, where they can hit the ground or a map object.
 */
export function useControls(element: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = element.current;
    if (!el) return;
    const { view, input } = game;
    const zoomBy = (k: number) => (view.distanceTo = clampZoom(view.distanceTo * k));

    const typing = (e: Event) =>
      e.target instanceof HTMLElement && !!e.target.closest("input, textarea, select, [contenteditable]");
    const keydown = (e: KeyboardEvent) => {
      if (typing(e) || e.metaKey || e.ctrlKey || e.altKey || input.paused) return;
      if (e.code in MOVE_KEYS) {
        input.keys.add(e.code);
        input.target = null;
        input.goal = null;
        input.dash = false;
        e.preventDefault();
      } else if (e.code === "KeyQ") view.yawTo -= 0.4;
      else if (e.code === "KeyE") view.yawTo += 0.4;
      else if (e.code === "Equal" || e.code === "NumpadAdd") zoomBy(0.85);
      else if (e.code === "Minus" || e.code === "NumpadSubtract") zoomBy(1.18);
    };
    const keyup = (e: KeyboardEvent) => input.keys.delete(e.code);
    const blur = () => input.keys.clear();

    // One pointer drags; two pinch and twist.
    const pointers = new Map<number, { x: number; y: number }>();
    let drag: { x: number; y: number; yaw: number; distance: number; moved: boolean } | null = null;
    let pinch: { span: number; angle: number; yaw: number; distance: number } | null = null;
    const spanOf = () => {
      const [a, b] = [...pointers.values()];
      return { span: Math.hypot(b.x - a.x, b.y - a.y) || 1, angle: Math.atan2(b.y - a.y, b.x - a.x) };
    };

    const pointerdown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        drag = { x: e.clientX, y: e.clientY, yaw: view.yawTo, distance: view.distanceTo, moved: false };
      } else if (pointers.size === 2) {
        drag = null;
        pinch = { ...spanOf(), yaw: view.yawTo, distance: view.distanceTo };
      }
    };
    const pointermove = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && pointers.size >= 2) {
        const now = spanOf();
        view.distanceTo = clampZoom(pinch.distance * (pinch.span / now.span));
        view.yawTo = pinch.yaw - (now.angle - pinch.angle);
      } else if (drag) {
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        if (!drag.moved && Math.hypot(dx, dy) > 6) drag.moved = true;
        if (drag.moved) {
          view.yawTo = drag.yaw - dx * 0.006;
          view.distanceTo = clampZoom(drag.distance * Math.exp(dy * 0.004));
        }
      }
    };
    const pointerup = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
      if (pointers.size === 0) drag = null;
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomBy(Math.exp(Math.max(-60, Math.min(60, e.deltaY)) * 0.004));
    };

    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", blur);
    el.addEventListener("pointerdown", pointerdown);
    window.addEventListener("pointermove", pointermove);
    window.addEventListener("pointerup", pointerup);
    window.addEventListener("pointercancel", pointerup);
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", blur);
      el.removeEventListener("pointerdown", pointerdown);
      window.removeEventListener("pointermove", pointermove);
      window.removeEventListener("pointerup", pointerup);
      window.removeEventListener("pointercancel", pointerup);
      el.removeEventListener("wheel", wheel);
    };
  }, [element]);
}
