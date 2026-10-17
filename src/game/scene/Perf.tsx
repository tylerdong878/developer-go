"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { markReady } from "../ready";

/*
 * Keeping it smooth (notes/research/gfx-pipeline.md 6-7). WarmUp compiles
 * every shader behind the loading screen, so the first walk doesn't hitch
 * as new materials come into view; the start button shows once it's done
 * (or after a few seconds, whichever comes first). AdaptiveDpr renders fewer
 * pixels when frames run slow and steps back up when there's headroom.
 */

export function WarmUp() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      requestAnimationFrame(() => requestAnimationFrame(markReady));
    };
    // let the scene mount its first batch before compiling
    const id = window.setTimeout(() => {
      gl.compileAsync(scene, camera).then(finish, finish);
    }, 50);
    const fallback = window.setTimeout(finish, 6000);
    return () => {
      window.clearTimeout(id);
      window.clearTimeout(fallback);
    };
  }, [gl, scene, camera]);
  return null;
}

export function AdaptiveDpr({ range }: { range: readonly [number, number] }) {
  const setDpr = useThree((s) => s.setDpr);
  const watch = useRef({ dpr: 0, slow: 0, fast: 0, avg: 1 / 60 });
  useFrame((_, dt) => {
    const w = watch.current;
    if (!w.dpr) w.dpr = Math.min(window.devicePixelRatio || 1, range[1]);
    if (dt <= 0 || dt > 0.5) return;
    w.avg += (dt - w.avg) * 0.05;
    // slow for a second and a half: fewer pixels; quick for four seconds: more again
    if (w.avg > 1 / 45) {
      w.slow += dt;
      w.fast = 0;
    } else if (w.avg < 1 / 57) {
      w.fast += dt;
      w.slow = 0;
    } else {
      w.slow = 0;
      w.fast = 0;
    }
    const max = Math.min(window.devicePixelRatio || 1, range[1]);
    if (w.slow > 1.5 && w.dpr > range[0]) {
      w.dpr = Math.max(range[0], w.dpr - 0.25);
      w.slow = 0;
      setDpr(w.dpr);
    } else if (w.fast > 4 && w.dpr < max) {
      w.dpr = Math.min(max, w.dpr + 0.25);
      w.fast = 0;
      setDpr(w.dpr);
    }
  });
  return null;
}
