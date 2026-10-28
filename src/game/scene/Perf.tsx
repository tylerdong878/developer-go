"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { markReady, startedStore } from "../ready";
import { coverStore, currentMode, modeFor, setMode, SLOW_FPS } from "../renderMode";
import { saverOn, saverStore, slowDevice } from "../device";
import { toast } from "../progress";

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

/**
 * Works the map only as hard as it needs to (../renderMode.ts): full speed on
 * the open map, 30 fps behind a side card, the menu, the intro or an
 * unfocused window, and not at all behind the catch screen, a full-screen
 * sheet or a hidden tab. Slowed frames are invalidated on a timer.
 */
export function Throttle() {
  const setFrameloop = useThree((s) => s.setFrameloop);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let timer = 0;
    let last: string | null = null;
    const apply = () => {
      const next = modeFor(coverStore.get(), !startedStore.get(), document.hasFocus(), document.hidden, saverOn());
      if (next === last) return;
      last = next;
      setMode(next);
      window.clearInterval(timer);
      if (next === "full") setFrameloop("always");
      else if (next === "off") setFrameloop("never");
      else {
        setFrameloop("demand");
        timer = window.setInterval(() => invalidate(), 1000 / SLOW_FPS);
      }
    };
    apply();
    const offCover = coverStore.subscribe(apply);
    const offStart = startedStore.subscribe(apply);
    const offSaver = saverStore.subscribe(apply);
    window.addEventListener("focus", apply);
    window.addEventListener("blur", apply);
    document.addEventListener("visibilitychange", apply);
    return () => {
      offCover();
      offStart();
      offSaver();
      window.removeEventListener("focus", apply);
      window.removeEventListener("blur", apply);
      document.removeEventListener("visibilitychange", apply);
      window.clearInterval(timer);
      setFrameloop("always");
    };
  }, [setFrameloop, invalidate]);
  return null;
}

export function AdaptiveDpr({ range }: { range: readonly [number, number] }) {
  const setDpr = useThree((s) => s.setDpr);
  const watch = useRef({ dpr: 0, slow: 0, fast: 0, avg: 1 / 60, stuck: 0, seen: 0 });
  useFrame((_, dt) => {
    const w = watch.current;
    // slowed on purpose (a card's open): those frame times say nothing about the device
    if (currentMode() !== "full") return;
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
    // still slow at the fewest pixels for three seconds, once the first few have settled: the battery saver's auto turns on
    w.seen += dt;
    w.stuck = w.seen > 5 && w.dpr <= range[0] && w.avg > 1 / 40 ? w.stuck + dt : 0;
    if (w.stuck > 3 && slowDevice()) toast("Battery saver on, to keep it smooth. It's in Settings", 4000);
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
