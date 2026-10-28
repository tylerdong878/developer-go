"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { saverOn } from "../device";
import { currentMode } from "../renderMode";
import { meshQueue } from "./pokemon/Smooth";

/*
 * \`?perf\` in the address (notes/research/perf.md 14): what the map costs, live.
 * Frame times over the last couple of seconds (median and the slow 5%), draw
 * calls and triangles from the renderer, the JS heap where Chrome tells, and
 * the mesh worker's queue. For whoever opens the hood.
 */

type Sample = { p50: number; p95: number; calls: number; tris: number; heap: number | null; queue: number; jobs: number; mode: string; saver: boolean; dpr: number };
let latest: Sample | null = null;
const SIZE = 120;

/** In the scene: keeps the last frame times and reads the renderer's counts. */
export function PerfProbe() {
  const gl = useThree((s) => s.gl);
  const times = useRef<number[]>([]);
  useFrame((_, dt) => {
    const t = times.current;
    t.push(dt * 1000);
    if (t.length > SIZE) t.shift();
    const sorted = [...t].sort((a, b) => a - b);
    const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? 0;
    const mem = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
    const q = meshQueue();
    latest = {
      p50: at(0.5),
      p95: at(0.95),
      calls: gl.info.render.calls,
      tris: gl.info.render.triangles,
      heap: mem ? mem.usedJSHeapSize / 2 ** 20 : null,
      queue: q.waiting,
      jobs: q.jobs,
      mode: currentMode(),
      saver: saverOn(),
      dpr: gl.getPixelRatio(),
    };
  });
  return null;
}

const fps = (ms: number) => (ms > 0 ? Math.round(1000 / ms) : 0);

/** On the page: the numbers, four times a second, in a corner out of the way. */
export function PerfOverlay() {
  const [s, setS] = useState<Sample | null>(null);
  useEffect(() => {
    const id = window.setInterval(() => setS(latest && { ...latest }), 250);
    return () => window.clearInterval(id);
  }, []);
  if (!s) return null;
  const rows: [string, string][] = [
    ["fps", `${fps(s.p50)} median, ${fps(s.p95)} slow 5%`],
    ["frame", `${s.p50.toFixed(1)} / ${s.p95.toFixed(1)} ms`],
    ["draws", s.calls.toLocaleString("en-US")],
    ["tris", s.tris.toLocaleString("en-US")],
    ["heap", s.heap === null ? "n/a" : `${s.heap.toFixed(0)} MB`],
    ["meshing", `${s.jobs} now, ${s.queue} waiting`],
    ["render", `${s.mode}${s.saver ? ", battery saver" : ""}, dpr ${s.dpr.toFixed(2)}`],
  ];
  return (
    <div role="status" aria-label="Performance" className="pointer-events-none fixed top-16 left-3 z-[70] rounded-xl bg-black/70 px-3 py-2 font-mono text-[11px] leading-relaxed text-white">
      {rows.map(([k, v]) => (
        <div key={k}>
          <span className="inline-block w-16 text-white/60">{k}</span>
          {v}
        </div>
      ))}
    </div>
  );
}
